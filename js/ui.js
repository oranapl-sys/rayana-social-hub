// Shared UI pieces: element builder, icons, sheets, toasts, and the hub's vocabulary.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

const P = {
  week: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13.5h3M7.5 17h3M13.5 13.5h3"/>',
  idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  refs: '<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5.5" rx="1.5"/><rect x="13.5" y="12" width="7" height="8.5" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/>',
  platforms: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>',
  video: '<rect x="3.5" y="6" width="12" height="12" rx="2"/><path d="M15.5 10.5l5-3v9l-5-3"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  drive: '<path d="M8.5 4h7l5.5 9.5-3.5 6h-11L3 13.5z"/><path d="M8.5 4l5.5 9.5H21M3 13.5h11l-3.5 6"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
};
export function icon(name, cls = '') {
  const span = document.createElement('span');
  span.innerHTML = `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
  return span.firstChild;
}

// ---- vocabulary ----
export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'youtube', name: 'YouTube' },
];
export const platformName = (id) => (PLATFORMS.find((p) => p.id === id) || { name: id === 'any' ? 'Any platform' : id || 'Any platform' }).name;

export const POST_STATUSES = [
  { id: 'planned', name: 'Planned', cls: '' },
  { id: 'scripted', name: 'Scripted', cls: '' },
  { id: 'filmed', name: 'Filmed', cls: '' },
  { id: 'rough-cut', name: 'Rough cut', cls: '' },
  { id: 'ready', name: 'Ready for you', cls: 'ready' },
  { id: 'approved-in-chat', name: 'Approved in chat', cls: 'ok' },
  { id: 'posted', name: 'Posted', cls: 'outline' },
];
export const IDEA_STATUSES = [
  { id: 'new', name: 'New' },
  { id: 'maybe', name: 'Maybe' },
  { id: 'planned', name: 'Planned' },
  { id: 'dropped', name: 'Dropped' },
];
export function statusPill(id, list = POST_STATUSES) {
  const s = list.find((x) => x.id === id) || list[0];
  return h('span', { class: `pill ${s.cls || ''}` }, s.name);
}

/** Works out the platform, a readable name and (for YouTube) a thumbnail from a pasted link. */
export function parseLink(raw) {
  const text = String(raw || '').trim();
  const found = text.match(/https?:\/\/[^\s<>"']+/i);
  if (!found) return null;
  let url;
  try { url = new URL(found[0].replace(/[),.]+$/, '')); } catch { return null; }
  const host = url.hostname.replace(/^www\.|^m\.|^vm\.|^vt\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  const info = { url: url.href, platform: 'any', name: host, thumb: null };
  if (/instagram\.com$/.test(host)) {
    info.platform = 'instagram';
    if (['reel', 'reels', 'p', 'tv'].includes(parts[0])) info.name = parts[0] === 'p' ? 'Instagram post' : 'Instagram reel';
    else if (parts[0]) info.name = '@' + parts[0];
  } else if (/tiktok\.com$/.test(host)) {
    info.platform = 'tiktok';
    const at = parts.find((p) => p.startsWith('@'));
    info.name = at || 'TikTok video';
  } else if (/facebook\.com$|fb\.watch$/.test(host)) {
    info.platform = 'facebook';
    info.name = parts.includes('reel') ? 'Facebook reel' : parts[0] && !['watch', 'share'].includes(parts[0]) ? parts[0] : 'Facebook video';
  } else if (/youtube\.com$|youtu\.be$/.test(host)) {
    info.platform = 'youtube';
    let id = null;
    if (host === 'youtu.be') id = parts[0];
    else if (parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'embed') id = parts[1];
    else id = url.searchParams.get('v');
    if (parts[0] && parts[0].startsWith('@')) info.name = parts[0];
    else info.name = parts[0] === 'shorts' ? 'YouTube Short' : 'YouTube video';
    if (id && /^[\w-]{6,20}$/.test(id)) info.thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  } else if (/drive\.google\.com$|docs\.google\.com$/.test(host)) {
    info.name = 'Google Drive';
  }
  return info;
}

// ---- toast ----
let toastTimer;
export function toast(message, { error = false, ms = 3200 } = {}) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = h('div', { class: `toast${error ? ' error' : ''}`, role: error ? 'alert' : 'status' }, message);
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), error ? ms * 2 : ms);
}

// ---- sheet (a native <dialog>: bottom sheet on phones, centred on wider screens) ----
export function openSheet({ title, body, foot, tall = false, onClose }) {
  const close = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close' }, icon('close'));
  const dlg = h('dialog', { class: `sheet${tall ? ' tall' : ''}`, 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('h2', {}, title), close),
    h('div', { class: 'sheet-body' }, body),
    foot ? h('div', { class: 'sheet-foot' }, foot) : null,
  );
  const done = () => {
    dlg.close();
    setTimeout(() => dlg.remove(), 320);
    if (onClose) onClose();
  };
  close.addEventListener('click', done);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) done(); });
  document.body.append(dlg);
  dlg.showModal();
  return { el: dlg, close: done };
}

export function confirmSheet({ title, text, confirm = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    let answered = false;
    const yes = h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, type: 'button' }, confirm);
    const no = h('button', { class: 'btn quiet', type: 'button' }, 'Cancel');
    const s = openSheet({ title, body: h('p', { style: 'margin:0' }, text), foot: [no, yes], onClose: () => { if (!answered) resolve(false); } });
    yes.addEventListener('click', () => { answered = true; s.close(); resolve(true); });
    no.addEventListener('click', () => { answered = true; s.close(); resolve(false); });
  });
}

export function field(label, control, hint) {
  const id = control.id || (control.id = 'f' + Math.random().toString(36).slice(2, 8));
  return h('div', { class: 'field' }, h('label', { for: id }, label), control, hint ? h('p', { class: 'hint' }, hint) : null);
}

/** A row of toggle chips. multi=false behaves like radio buttons. Returns { el, value() }. */
export function chipPicker(options, selected, { multi = false, label } = {}) {
  let value = multi ? new Set(selected || []) : selected;
  const el = h('div', { class: 'chips', role: 'group', 'aria-label': label || '' });
  const render = () => {
    el.replaceChildren(...options.map((o) => {
      const on = multi ? value.has(o.id) : value === o.id;
      return h('button', {
        type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false',
        onclick: () => {
          if (multi) { value.has(o.id) ? value.delete(o.id) : value.add(o.id); } else value = o.id;
          render();
          el.dispatchEvent(new Event('change'));
        },
      }, o.name);
    }));
  };
  render();
  return { el, value: () => (multi ? [...value] : value), set: (v) => { value = multi ? new Set(v) : v; render(); } };
}

export function select(options, value, attrs = {}) {
  const s = h('select', attrs, options.map((o) => h('option', { value: o.id, selected: o.id === value }, o.name)));
  s.value = value ?? '';
  return s;
}

// ---- dates (Gold Coast time is UTC+10 all year, no daylight saving) ----
export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
export function toISO(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
export function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
export function mondayOf(iso) { const d = parseISO(iso); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return toISO(d); }
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function shortDate(iso) { const d = parseISO(iso); return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
export function relDate(isoTime) {
  if (!isoTime) return '';
  const d = new Date(isoTime);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ---- links shared from the phone's share menu (Android, once the hub is installed) ----
export function captureShare() {
  const q = new URLSearchParams(location.search);
  const text = [q.get('share_url'), q.get('share_text'), q.get('share_title')].filter(Boolean).join(' ');
  if (text) {
    try { sessionStorage.setItem('rsh.share', text); } catch { /* ignore */ }
    history.replaceState(null, '', location.pathname + '#/references?share=1');
  }
}
export function peekShare() { try { return sessionStorage.getItem('rsh.share'); } catch { return null; } }
export function consumeShare() {
  const t = peekShare();
  try { sessionStorage.removeItem('rsh.share'); } catch { /* ignore */ }
  return t;
}
