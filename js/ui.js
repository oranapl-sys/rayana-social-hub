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

// Icons come from Phosphor (regular weight), loaded in index.html.
const ICONS = {
  week: 'calendar-blank', pipeline: 'kanban', feed: 'grid-nine', refs: 'bookmark-simple', guides: 'book-open-text',
  settings: 'gear-six', plus: 'plus', close: 'x', link: 'link-simple', image: 'image', video: 'video-camera',
  left: 'caret-left', right: 'caret-right', external: 'arrow-square-out', edit: 'pencil-simple', info: 'info',
  search: 'magnifying-glass', drive: 'google-drive-logo', refresh: 'arrows-clockwise', play: 'play', copy: 'copy',
  next: 'arrow-right', idea: 'lightbulb', market: 'storefront', story: 'camera', post: 'clipboard-text',
};
export function icon(name, cls = '') {
  const i = document.createElement('i');
  i.className = `ph ph-${ICONS[name] || name}${cls ? ' ' + cls : ''}`;
  i.setAttribute('aria-hidden', 'true');
  return i;
}

/** A status printed as a mark in a fixed cell: the circle fills as the post moves along. */
const FILL = { planned: 0, scripted: 0.25, filmed: 0.5, 'rough-cut': 0.75, ready: 1, 'approved-in-chat': 1, posted: 1 };
export function mark(status, { label } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', `mk ${status === 'ready' ? 'ready' : status === 'open' ? 'open' : status === 'dropped' ? 'dropped' : ''}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label || statusName(status));
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('cx', '8'); ring.setAttribute('cy', '8'); ring.setAttribute('r', '6.6'); ring.setAttribute('class', 'ring');
  svg.append(ring);
  const f = FILL[status] ?? 0;
  if (f >= 1) {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', '8'); c.setAttribute('cy', '8'); c.setAttribute('r', '4.4'); c.setAttribute('class', 'fill');
    svg.append(c);
  } else if (f > 0) {
    const a = f * 2 * Math.PI, r = 4.4;
    const x = 8 + r * Math.sin(a), y = 8 - r * Math.cos(a);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M8 8 L8 ${8 - r} A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`);
    path.setAttribute('class', 'fill');
    svg.append(path);
  }
  if (status === 'dropped') {
    const l = document.createElementNS(ns, 'path');
    l.setAttribute('d', 'M2.5 13.5 L13.5 2.5'); l.setAttribute('class', 'ring');
    svg.append(l);
  }
  return svg;
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
export function statusName(id, list = POST_STATUSES) {
  return (list.find((x) => x.id === id) || { name: id === 'open' ? 'Open slot' : id === 'dropped' ? 'Dropped' : list[0].name }).name;
}

// ---- series codes and post codes (quotable in chat: "approve 48-MON-IE") ----
const CODE_FALLBACK = { 'first-sip': 'FS', 'indonesia-explained': 'IE', 'from-kamojang': 'FK', 'brew-it-better': 'BB', rankings: 'RK', 'meet-the-guardian': 'MG', 'coffee-recipes': 'CR' };
export function seriesCode(series, id) {
  if (!id) return 'XX';
  const s = series.find((x) => x.id === id);
  if (s && s.code) return s.code;
  if (CODE_FALLBACK[id]) return CODE_FALLBACK[id];
  return (s ? s.name : id).split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'XX';
}
export function isoWeek(iso) {
  const d = parseISO(iso);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
}
export function postCode(post, series) {
  if (!post || !post.date) return '';
  return `${isoWeek(post.date)}-${DOW[parseISO(post.date).getDay()].toUpperCase()}-${seriesCode(series, post.series)}`;
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(`Copied ${text}. Paste it in chat to talk about this post.`); }
  catch { toast(`The code is ${text}.`); }
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
