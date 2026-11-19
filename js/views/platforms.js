// Platforms: each platform's guidelines, from platforms/<id>.md in the data repo.
import { h, icon, toast, openSheet, PLATFORMS, platformName } from '../ui.js';
import { renderMarkdown } from '../md.js';


export async function render(root, ctx, route) {
  const id = PLATFORMS.some((p) => p.id === route.parts[0]) ? route.parts[0] : 'instagram';
  if (!route.parts[0]) history.replaceState(null, '', `#/platforms/${id}`);

  const tabs = h('div', { class: 'chips scroll platform-tabs', role: 'tablist', 'aria-label': 'Platform' },
    PLATFORMS.map((p) => h('a', { class: 'chip', role: 'tab', href: `#/platforms/${p.id}`, 'aria-selected': p.id === id ? 'true' : 'false' }, p.name)));

  let doc = ctx.store.mem.get('doc:' + id);
  if (!doc) {
    doc = await ctx.store.readText(`platforms/${id}.md`);
    if (doc) ctx.store.mem.set('doc:' + id, doc);
  }

  if (!doc) {
    root.append(tabs, h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', {}, platformName(id)))),
      h('div', { class: 'empty' }, `No guidelines yet. Add platforms/${id}.md to the data repository`,
        ctx.store.canWrite ? [', or ', h('button', { class: 'btn small quiet', type: 'button', onclick: () => openEditor(ctx, id, { text: `# ${platformName(id)}\n\n## At a glance\n\n- **Role:** \n` }) }, 'write them here'), '.'] : '.'));
    return;
  }

  const md = renderMarkdown(doc.text);
  const refs = (await ctx.store.list('references')).filter((r) => r.platform === id);

  root.append(tabs,
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' },
        h('h1', {}, md.title || platformName(id)),
        h('p', { class: 'subline' }, 'What this platform is for, what works, and the rules we post by.')),
      ctx.store.canWrite ? h('button', { class: 'btn', type: 'button', onclick: () => openEditor(ctx, id, doc) }, icon('edit'), 'Edit') : null),
    md.sections.length > 2 ? h('nav', { class: 'chips scroll toc', 'aria-label': 'On this page' },
      md.sections.map((s) => h('button', { class: 'chip', type: 'button', onclick: () => {
        const el = document.getElementById(s.id);
        if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      } }, s.text))) : null,
    h('article', { class: 'doc', html: md.html }),
    refStrip(ctx, id, refs),
  );
  const firstP = root.querySelector('.doc > p:first-child');
  if (firstP && /^From the agent/.test(firstP.textContent)) firstP.classList.add('intro');
}

function refStrip(ctx, id, refs) {
  const wrap = h('section', { class: 'doc-ref-strip' },
    h('div', { style: 'display:flex;align-items:baseline;gap:12px' },
      h('h2', { style: 'font:400 20px/1.3 var(--serif);margin:0;flex:1' }, `References for ${platformName(id)}`),
      h('a', { class: 'btn small quiet', href: `#/references?platform=${id}` }, refs.length ? `See all ${refs.length}` : 'Add one')));
  if (!refs.length) {
    wrap.append(h('p', { class: 'subline' }, `No ${platformName(id)} references yet.`));
    return wrap;
  }
  const thumbs = h('div', { class: 'thumbs' });
  for (const r of refs.slice(0, 4)) {
    const cell = h('a', { class: 'ref-media', href: `#/references?platform=${id}`, title: r.like || '' });
    if (r.image) ctx.store.mediaURL(r.image).then((u) => cell.append(h('img', { src: u, alt: r.like || '' }))).catch(() => {});
    else cell.append(h('div', { class: 'tile' }, h('span', { class: 'tile-name', style: 'font-size:13px' }, (r.like || 'Link').slice(0, 40))));
    thumbs.append(cell);
  }
  wrap.append(thumbs);
  return wrap;
}

function openEditor(ctx, id, doc) {
  const area = h('textarea', { class: 'editor', spellcheck: 'true', 'aria-label': `${platformName(id)} guidelines (markdown)` }, doc.text);
  const save = h('button', { class: 'btn primary', type: 'button' }, 'Save');
  const sheet = openSheet({
    title: `Edit ${platformName(id)} guidelines`, tall: true,
    body: h('div', {},
      h('p', { class: 'hint', style: 'margin:0 0 10px;font-size:13px;color:var(--muted)' },
        'Plain text with a few marks: ## for a section, - for a list, **bold**. The agent reads this file too.'),
      area),
    foot: [save],
  });
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      const sha = await ctx.store.saveText(`platforms/${id}.md`, area.value.replace(/\r\n/g, '\n'), doc.sha, `Update ${platformName(id)} guidelines`);
      ctx.store.mem.set('doc:' + id, { text: area.value, sha });
      sheet.close(); toast('Guidelines saved.'); ctx.refresh();
    } catch { save.disabled = false; }
  });
}

