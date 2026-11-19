// Connect (first run) and Settings.
import { h, icon, field, toast, confirmSheet } from '../ui.js';
import { saveConnection, clearConnection, isLocalHost, localTestConnection } from '../store.js';
import { explainError } from '../github.js';

let connectError = null;
let lastConn = null;
export function setConnectError(msg, conn) { connectError = msg; lastConn = conn; }

export async function render(root, ctx, route) {
  if (route.name === 'connect' || !ctx.store) return renderConnect(root, ctx);
  return renderSettings(root, ctx);
}

function renderConnect(root, ctx) {
  const prev = lastConn && lastConn.mode !== 'local' ? lastConn : (ctx.store && ctx.store.conn.mode !== 'local' ? ctx.store.conn : null);
  const owner = h('input', { type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', placeholder: 'your GitHub username', value: prev?.owner || '' });
  const repo = h('input', { type: 'text', autocapitalize: 'none', spellcheck: 'false', value: prev?.repo || 'rayana-social-data' });
  const token = h('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'github_pat_…' });
  const show = h('button', { type: 'button', class: 'btn small quiet', onclick: () => {
    token.type = token.type === 'password' ? 'text' : 'password';
    show.textContent = token.type === 'password' ? 'Show' : 'Hide';
  } }, 'Show');
  const status = h('div', { role: 'alert' });
  const showError = (msg) => status.replaceChildren(msg ? h('div', { class: 'notice error', style: 'margin-bottom:16px' }, icon('info'), h('span', {}, msg)) : '');
  showError(connectError);

  const go = h('button', { class: 'btn primary', type: 'submit', style: 'width:100%' }, 'Connect');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const conn = { owner: owner.value.trim(), repo: repo.value.trim(), token: token.value.trim(), apiBase: 'https://api.github.com', mode: 'github' };
    if (!conn.owner || !conn.repo || !conn.token) { showError('Fill in all three: your username, the repository and the key.'); return; }
    go.disabled = true; go.textContent = 'Checking…';
    try {
      await ctx.connect(conn);
      saveConnection(conn);
      connectError = null;
      toast('Connected. The key is saved on this device only.');
    } catch (err) {
      showError(explainError(err, conn.owner, conn.repo));
      go.disabled = false; go.textContent = 'Connect';
    }
  } },
    field('GitHub username', owner),
    field('Data repository', repo, 'The private repository that holds the hub\'s data.'),
    h('div', { class: 'field' },
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between' }, h('label', { for: token.id = 'tok' }, 'Key (personal access token)'), show),
      token,
      h('p', { class: 'hint' }, 'Stored only in this browser on this device. It is sent only to GitHub.')),
    go,
  );

  const help = h('details', { class: 'help' },
    h('summary', {}, 'How do I make the key?'),
    h('ol', { class: 'steps' },
      h('li', {}, 'On GitHub, open your picture (top right), then Settings, then Developer settings, then Personal access tokens, then Fine-grained tokens.'),
      h('li', {}, 'Generate new token. Name it after this device, for example "Oran phone hub".'),
      h('li', {}, 'Expiration: 1 year. Repository access: Only select repositories, and pick the data repository.'),
      h('li', {}, 'Permissions: Repository permissions, Contents, Read and write. (For Naomi\'s view-only key: Read-only.)'),
      h('li', {}, 'Generate, copy the key, and paste it above. GitHub shows it only once.'),
    ),
  );

  const local = isLocalHost() ? [
    h('div', { class: 'or' }, 'or, on this computer'),
    h('button', { class: 'btn', type: 'button', style: 'width:100%', onclick: async () => {
      const conn = localTestConnection();
      try { await ctx.connect(conn); saveConnection(conn); connectError = null; toast('Using local test data.'); }
      catch (err) { showError(explainError(err, conn.owner, conn.repo) + ' Is the dev server running?'); }
    } }, 'Use local test data'),
    h('p', { class: 'hint', style: 'margin-top:8px' }, 'A copy of the data starter, served by the dev server. Nothing real changes.'),
  ] : [];

  ctx.band(h('h1', { class: 'chalk-title' }, 'Connect your data'),
    h('p', { class: 'band-line' }, 'The plan, ideas, references and guides live in your private GitHub repository. This app only shows and edits them.'));
  root.append(h('div', { class: 'narrow' },
    status, form, help, ...local,
  ));
}

function renderSettings(root, ctx) {
  const s = ctx.store;
  const writable = s.canWrite;
  ctx.band(h('h1', { class: 'chalk-title' }, 'Settings'), h('p', { class: 'chalk-sub' }, s.label));
  root.append(h('div', { class: 'narrow' },
    h('h2', { class: 'section-title', style: 'margin-top:0' }, 'Data'),
    h('div', { class: 'panel' },
      h('dl', { class: 'kv', style: 'margin:0;padding:14px 16px' },
        h('dt', {}, 'Repository'), h('dd', {}, s.label),
        h('dt', {}, 'This device'), h('dd', {}, writable ? 'Can view and save' : 'View only (the key can\'t save)'),
      ),
    ),
    h('div', { class: 'chips', style: 'margin-top:12px' },
      h('button', { class: 'btn small', type: 'button', onclick: () => {
        s.forget();
        try { for (const k of Object.keys(localStorage)) if (k.startsWith(s.ns)) localStorage.removeItem(k); } catch { /* ignore */ }
        toast('Reloading everything from GitHub.');
        ctx.go('#/week');
      } }, icon('refresh'), 'Reload all data'),
      h('button', { class: 'btn small', type: 'button', onclick: () => { lastConn = s.conn; ctx.go('#/connect'); } }, 'Change key or repository'),
      h('button', { class: 'btn small danger', type: 'button', onclick: async () => {
        const ok = await confirmSheet({ title: 'Disconnect this device?', text: 'The key and the saved copy of the data are removed from this browser. Nothing on GitHub changes. You can connect again with a key.', confirm: 'Disconnect' });
        if (!ok) return;
        clearConnection();
        location.hash = '#/connect';
        location.reload();
      } }, 'Disconnect this device'),
    ),
    h('h2', { class: 'section-title' }, 'Publishing'),
    h('div', { class: 'notice' }, icon('info'), h('div', {},
      h('p', { style: 'margin:0 0 6px' }, h('strong', {}, 'The hub never publishes or schedules anything.')),
      h('p', { style: 'margin:0' }, 'Statuses here are records. The go-ahead to publish is always your message to the agent in chat, for example "approve week 48".'))),
    h('h2', { class: 'section-title' }, 'On your phone'),
    h('p', { style: 'margin:0;font-size:14px' }, 'Add the hub to your home screen (in Chrome: menu, then "Add to home screen"). On Android you can then share a reel straight to the hub from Instagram or TikTok\'s share menu.'),
  ));
}
