// The hub's data layer. Every item is one file in the private data repo.
// JSON files are cached in this browser by their git sha, so opening the app
// only downloads what changed. Pictures are cached in Cache Storage.

import { GitHub, textToBase64, blobToBase64 } from './github.js';

const CONFIG_KEY = 'rsh.connection';
const LOCAL_API = '/mock-api';

export const isLocalHost = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

export function loadConnection() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || null; } catch { return null; }
}
export function saveConnection(conn) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(conn)); } catch { /* private mode */ }
}
export function clearConnection() {
  try {
    localStorage.removeItem(CONFIG_KEY);
    for (const k of Object.keys(localStorage)) if (k.startsWith('rsh.c:')) localStorage.removeItem(k);
  } catch { /* ignore */ }
  if ('caches' in window) caches.delete('rsh-media').catch(() => {});
}
export const localTestConnection = () => ({ owner: 'local', repo: 'test-data', token: 'local-test', apiBase: LOCAL_API, mode: 'local' });

// ---- small helpers ----
export function makeId(text, date = new Date()) {
  const day = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); // local date, not UTC
  const slug = (text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 5).join('-').slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 6);
  return [day, slug, rand].filter(Boolean).join('-');
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---- sync status, shown in the top bar ----
const listeners = new Set();
let pending = 0;
export function onSync(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(state, detail) { for (const fn of listeners) fn(state, detail); }
async function tracked(promise) {
  pending++; emit('saving');
  try {
    const out = await promise;
    pending--; emit(pending ? 'saving' : 'saved');
    return out;
  } catch (err) {
    pending--; emit('error', err);
    throw err;
  }
}

export class Store {
  constructor(conn) {
    this.conn = conn;
    this.gh = new GitHub(conn);
    this.ns = `rsh.c:${conn.owner}/${conn.repo}:`;
    this.mem = new Map();     // dir -> items, for this session
    this.urls = new Map();    // media path -> object URL
    this.canWrite = true;
  }

  get label() { return this.conn.mode === 'local' ? 'Local test data' : `${this.conn.owner}/${this.conn.repo}`; }

  async check() {
    const info = await this.gh.repoInfo();
    this.canWrite = !info.permissions || info.permissions.push !== false;
    return info;
  }

  cacheGet(path) { try { return JSON.parse(localStorage.getItem(this.ns + path)); } catch { return null; } }
  cacheSet(path, sha, data) { try { localStorage.setItem(this.ns + path, JSON.stringify({ sha, data })); } catch { /* full or private */ } }
  cacheDel(path) { try { localStorage.removeItem(this.ns + path); } catch { /* ignore */ } }

  /** All JSON items in a folder, newest first by createdAt. */
  async list(dir, { fresh = false } = {}) {
    if (!fresh && this.mem.has(dir)) return this.mem.get(dir);
    const entries = (await this.gh.list(dir)).filter((e) => e.type === 'file' && e.name.endsWith('.json'));
    const items = await pool(entries, 6, async (e) => {
      const cached = this.cacheGet(e.path);
      if (cached && cached.sha === e.sha) return { ...cached.data, _path: e.path, _sha: e.sha };
      const file = await this.gh.readText(e.path);
      if (!file) return null;
      let data;
      try { data = JSON.parse(file.text); } catch { return null; }
      this.cacheSet(e.path, file.sha, data);
      return { ...data, _path: e.path, _sha: file.sha };
    });
    const clean = items.filter(Boolean).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    this.mem.set(dir, clean);
    return clean;
  }

  async readJSON(path) {
    const file = await this.gh.readText(path);
    if (!file) return null;
    return { data: JSON.parse(file.text), sha: file.sha };
  }

  async readText(path) { return this.gh.readText(path); }

  /** Saves one JSON item in a folder. Returns the saved item (with _path and _sha). */
  async saveItem(dir, item, message) {
    const { _path, _sha, ...data } = item;
    const path = _path || `${dir}/${data.id}.json`;
    const body = JSON.stringify(data, null, 2) + '\n';
    const sha = await tracked(this.gh.put(path, textToBase64(body), message, _sha));
    this.cacheSet(path, sha, data);
    const saved = { ...data, _path: path, _sha: sha };
    const list = this.mem.get(dir);
    if (list) {
      const i = list.findIndex((x) => x._path === path);
      if (i >= 0) list[i] = saved; else list.unshift(saved);
    }
    return saved;
  }

  async deleteItem(dir, item, message) {
    await tracked(this.gh.remove(item._path, item._sha, message));
    this.cacheDel(item._path);
    const list = this.mem.get(dir);
    if (list) this.mem.set(dir, list.filter((x) => x._path !== item._path));
  }

  async saveText(path, text, sha, message) {
    return tracked(this.gh.put(path, textToBase64(text), message, sha));
  }

  async saveJSONFile(path, data, sha, message) {
    return this.saveText(path, JSON.stringify(data, null, 2) + '\n', sha, message);
  }

  async uploadBlob(path, blob, message) {
    const b64 = await blobToBase64(blob);
    const sha = await tracked(this.gh.put(path, b64, message));
    if ('caches' in window) {
      try {
        const cache = await caches.open('rsh-media');
        await cache.put(this.mediaKey(path), new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream' } }));
      } catch { /* cache is a nicety */ }
    }
    return sha;
  }

  async deleteFile(path, message) {
    const parent = path.split('/').slice(0, -1).join('/');
    const entry = (await this.gh.list(parent)).find((e) => e.path === path);
    if (!entry) return;
    await tracked(this.gh.remove(path, entry.sha, message));
    if ('caches' in window) caches.open('rsh-media').then((c) => c.delete(this.mediaKey(path))).catch(() => {});
  }

  mediaKey(path) { return `https://media.rayana-hub.local/${this.conn.owner}/${this.conn.repo}/${path}`; }

  /** An object URL for a picture or clip in the repo, from cache when possible. */
  async mediaURL(path) {
    if (this.urls.has(path)) return this.urls.get(path);
    let blob;
    const key = this.mediaKey(path);
    let cache;
    if ('caches' in window) {
      try { cache = await caches.open('rsh-media'); const hit = await cache.match(key); if (hit) blob = await hit.blob(); } catch { /* ignore */ }
    }
    if (!blob) {
      blob = await this.gh.readBlob(path);
      if (cache) cache.put(key, new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream' } })).catch(() => {});
    }
    const ext = path.split('.').pop().toLowerCase();
    const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' }[ext];
    if (type && blob.type !== type) blob = new Blob([blob], { type });
    const url = URL.createObjectURL(blob);
    this.urls.set(path, url);
    return url;
  }

  forget() {
    this.mem.clear();
  }
}
