// Local preview server for the Rayana Social Hub.
//
//   node tools/dev-server.mjs            -> http://localhost:5173
//
// It does two things:
// 1. Serves the app folder (index.html, css/, js/ ...) as GitHub Pages would.
// 2. Fakes the small part of the GitHub REST API the app uses, under /mock-api,
//    backed by a local folder (.mock-data/, ignored by git). That folder is
//    seeded once from the data-repo starter (../rayana-social-data by default),
//    so testing never touches the real data.
//
// Options: --port 5173  --seed <folder>  --reset (wipe .mock-data and re-seed)

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const port = Number(opt('port', process.env.PORT || 5173));
const seedDir = path.resolve(opt('seed', path.resolve(appDir, '..', 'rayana-social-data')));
const dataDir = path.join(appDir, '.mock-data');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
};

async function copyDir(from, to) {
  await fsp.mkdir(to, { recursive: true });
  for (const entry of await fsp.readdir(from, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const a = path.join(from, entry.name), b = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(a, b); else await fsp.copyFile(a, b);
  }
}

async function seed() {
  if (args.includes('--reset')) await fsp.rm(dataDir, { recursive: true, force: true });
  if (fs.existsSync(dataDir)) return;
  if (fs.existsSync(seedDir)) {
    await copyDir(seedDir, dataDir);
    console.log(`Seeded test data from ${seedDir}`);
  } else {
    await fsp.mkdir(dataDir, { recursive: true });
    console.log(`No seed folder at ${seedDir}; starting with empty test data.`);
  }
}

// Git's blob sha, so the mock hands out the same kind of sha GitHub does.
const blobSha = (buf) => crypto.createHash('sha1')
  .update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest('hex');

function safeJoin(rel) {
  const clean = decodeURIComponent(rel || '').replace(/^\/+|\/+$/g, '');
  const full = path.resolve(dataDir, clean);
  if (full !== dataDir && !full.startsWith(dataDir + path.sep)) throw Object.assign(new Error('bad path'), { status: 400 });
  return { clean, full };
}

function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(status, {
    'Content-Type': isBuf ? 'application/octet-stream' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isBuf ? body : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

function entryFor(clean, full, stat) {
  const name = path.basename(full);
  if (stat.isDirectory()) return { type: 'dir', name, path: clean, sha: null, size: 0 };
  const buf = fs.readFileSync(full);
  return { type: 'file', name, path: clean, sha: blobSha(buf), size: buf.length };
}

async function mockApi(req, res, url) {
  // Simulate a little network latency so loading states are visible.
  await new Promise((r) => setTimeout(r, 120));
  const auth = req.headers.authorization || '';
  if (!/^(Bearer|token) \S+/.test(auth)) return send(res, 401, { message: 'Bad credentials' });

  const repoMatch = url.pathname.match(/^\/mock-api\/repos\/([^/]+)\/([^/]+)\/?$/);
  if (repoMatch && req.method === 'GET') {
    return send(res, 200, {
      name: repoMatch[2], full_name: `${repoMatch[1]}/${repoMatch[2]}`, private: true,
      default_branch: 'main', permissions: { admin: true, push: true, pull: true },
    });
  }
  if (url.pathname === '/mock-api/user') return send(res, 200, { login: 'local-test' });

  const m = url.pathname.match(/^\/mock-api\/repos\/[^/]+\/[^/]+\/contents\/?(.*)$/);
  if (!m) return send(res, 404, { message: 'Not Found' });
  const { clean, full } = safeJoin(m[1]);

  if (req.method === 'GET') {
    if (!fs.existsSync(full)) return send(res, 404, { message: 'Not Found' });
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const list = fs.readdirSync(full).filter((n) => !n.startsWith('.git'))
        .map((n) => entryFor(path.posix.join(clean, n), path.join(full, n), fs.statSync(path.join(full, n))));
      return send(res, 200, list);
    }
    const buf = fs.readFileSync(full);
    if ((req.headers.accept || '').includes('raw')) {
      return send(res, 200, buf, { 'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    }
    return send(res, 200, { ...entryFor(clean, full, stat), encoding: 'base64', content: buf.toString('base64') });
  }

  if (req.method === 'PUT') {
    const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
    if (typeof body.content !== 'string' || !body.message) return send(res, 422, { message: 'Invalid request' });
    const exists = fs.existsSync(full);
    if (exists) {
      const current = blobSha(fs.readFileSync(full));
      if (!body.sha) return send(res, 422, { message: '"sha" wasn\'t supplied.' });
      if (body.sha !== current) return send(res, 409, { message: `${clean} does not match ${body.sha}` });
    }
    const buf = Buffer.from(body.content, 'base64');
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, buf);
    console.log(`  ${exists ? 'updated' : 'created'} ${clean}  (${body.message})`);
    return send(res, exists ? 200 : 201, { content: { name: path.basename(full), path: clean, sha: blobSha(buf), size: buf.length } });
  }

  if (req.method === 'DELETE') {
    const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
    if (!fs.existsSync(full)) return send(res, 404, { message: 'Not Found' });
    if (body.sha !== blobSha(fs.readFileSync(full))) return send(res, 409, { message: 'sha does not match' });
    await fsp.unlink(full);
    console.log(`  deleted ${clean}  (${body.message})`);
    return send(res, 200, { content: null });
  }

  return send(res, 405, { message: 'Method not allowed' });
}

async function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const full = path.resolve(appDir, '.' + rel);
  const blocked = ['.mock-data', 'tools', '.git'].some((d) => full.startsWith(path.join(appDir, d)));
  if (!full.startsWith(appDir) || blocked || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(full).pipe(res);
}

await seed();
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/mock-api/')) return await mockApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (err) {
    send(res, err.status || 500, { message: err.message });
  }
}).listen(port, () => {
  console.log(`Rayana Social Hub: http://localhost:${port}`);
  console.log(`Test data (fake GitHub repo): ${dataDir}`);
});
