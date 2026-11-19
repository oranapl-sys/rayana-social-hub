// Rayana Social Hub: shell, router and shared context.
import { Store, loadConnection, onSync } from './store.js';
import { explainError } from './github.js';
import { h, icon, toast, captureShare, peekShare } from './ui.js';
import * as week from './views/week.js';
import * as ideas from './views/ideas.js';
import * as references from './views/references.js';
import * as platforms from './views/platforms.js';
import * as settings from './views/settings.js';

const main = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
const syncEl = document.getElementById('sync');

/** Shared state every view receives. */
export const ctx = {
  store: null,
  series: [],
  rhythm: null, rhythmSha: null,
  markets: [],
  configError: null,
  go: (hash) => { if (location.hash === hash) render(); else location.hash = hash; },
  refresh: () => render(),
  seriesName(id) { const s = ctx.series.find((x) => x.id === id); return s ? s.name : ''; },
  fail(err) { toast(explainError(err, ctx.store?.conn.owner, ctx.store?.conn.repo), { error: true }); },
  connect: (conn) => start(conn),
};

const VIEWS = { week, ideas, references, platforms, settings, connect: settings };

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'week', parts: parts.slice(1), params: Object.fromEntries(new URLSearchParams(query)) };
}

let renderToken = 0;
async function render() {
  const route = parseHash();
  if (!ctx.store && route.name !== 'connect') { location.replace('#/connect'); return; }
  const view = VIEWS[route.name] || week;
  tabbar.hidden = !ctx.store;
  for (const a of tabbar.querySelectorAll('.tab')) {
    if (a.dataset.route === route.name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  const token = ++renderToken;
  const frame = document.createElement('div');
  try {
    await view.render(frame, ctx, route);
  } catch (err) {
    console.error(err);
    frame.replaceChildren(h('div', { class: 'notice error', role: 'alert' }, icon('info'),
      h('div', {}, h('p', { style: 'margin:0 0 8px' }, explainError(err, ctx.store?.conn.owner, ctx.store?.conn.repo)),
        h('button', { class: 'btn small', type: 'button', onclick: () => render() }, 'Try again'))));
  }
  if (token !== renderToken) return; // a newer navigation won
  main.replaceChildren(...frame.childNodes);
  if (route.name !== (render.last || '')) window.scrollTo(0, 0);
  render.last = route.name;
}

async function loadConfig() {
  const s = ctx.store;
  const [series, rhythm, markets] = await Promise.all([
    s.readJSON('hub/series.json').catch(() => null),
    s.readJSON('hub/rhythm.json').catch(() => null),
    s.readJSON('hub/markets.json').catch(() => null),
  ]);
  ctx.series = series?.data?.series || [];
  ctx.rhythm = rhythm?.data || null;
  ctx.rhythmSha = rhythm?.sha || null;
  ctx.markets = markets?.data?.markets || [];
  ctx.configError = !series || !rhythm ? 'The data repo has no hub/series.json or hub/rhythm.json yet. Copy them in from the data starter.' : null;
}

async function start(conn) {
  const store = new Store(conn);
  await store.check();          // throws a GitHubError the caller explains
  ctx.store = store;
  await loadConfig();
  document.body.dataset.readonly = store.canWrite ? 'false' : 'true';
  const share = peekShare();
  location.hash = share ? '#/references?share=1' : (location.hash && !location.hash.startsWith('#/connect') ? location.hash : '#/week');
  render();
}

let syncTimer;
onSync((state, err) => {
  clearTimeout(syncTimer);
  syncEl.hidden = false;
  syncEl.dataset.state = state;
  syncEl.querySelector('.txt').textContent = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Not saved';
  if (state === 'saved') syncTimer = setTimeout(() => { syncEl.hidden = true; }, 2200);
  if (state === 'error') ctx.fail(err);
});

window.addEventListener('hashchange', render);

async function boot() {
  captureShare();
  const conn = loadConnection();
  if (!conn) { location.replace('#/connect'); render(); return; }
  try {
    await start(conn);
  } catch (err) {
    settings.setConnectError(explainError(err, conn.owner, conn.repo), conn);
    location.replace('#/connect');
    render();
  }
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

boot();
