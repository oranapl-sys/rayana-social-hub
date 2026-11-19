// Ideas: a quick inbox for Oran and the agent. Tap one to sort it, or put it on the calendar.
import { h, icon, toast, openSheet, confirmSheet, field, chipPicker, select, statusPill, PLATFORMS, IDEA_STATUSES, relDate, platformName } from '../ui.js';
import { makeId } from '../store.js';
import { openPostEditor } from './week.js';

let filter = 'open';

export async function render(root, ctx) {
  const all = await ctx.store.list('ideas');
  const counts = Object.fromEntries(IDEA_STATUSES.map((s) => [s.id, all.filter((i) => (i.status || 'new') === s.id).length]));
  const open = all.filter((i) => ['new', 'maybe'].includes(i.status || 'new'));
  const shown = filter === 'open' ? open : filter === 'all' ? all : all.filter((i) => (i.status || 'new') === filter);

  root.append(h('div', { class: 'page-head' }, h('div', { class: 'grow' },
    h('h1', {}, 'Ideas'),
    h('p', { class: 'subline num' }, `${open.length} open`, counts.planned ? ` · ${counts.planned} planned` : '', counts.dropped ? ` · ${counts.dropped} dropped` : ''))));

  if (ctx.store.canWrite) {
    const input = h('input', { type: 'text', placeholder: 'A new idea…', 'aria-label': 'New idea', enterkeyhint: 'done' });
    const add = h('button', { class: 'btn primary', type: 'submit' }, icon('plus'), 'Add');
    root.append(h('form', { style: 'display:flex;gap:8px;margin-bottom:16px', onsubmit: async (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) { input.focus(); return; }
      add.disabled = true;
      const idea = { id: makeId(title), title, note: '', series: '', platforms: [], status: 'new', createdAt: new Date().toISOString(), createdBy: 'oran' };
      try {
        await ctx.store.saveItem('ideas', idea, `Add idea: ${title}`);
        input.value = '';
        filter = filter === 'open' || filter === 'new' || filter === 'all' ? filter : 'open';
        ctx.refresh();
      } catch { add.disabled = false; }
    } }, input, add));
  }

  const filters = [
    { id: 'open', name: 'Open', n: open.length },
    ...IDEA_STATUSES.filter((s) => s.id !== 'new' && s.id !== 'maybe').map((s) => ({ ...s, n: counts[s.id] })),
    { id: 'all', name: 'All', n: all.length },
  ];
  root.append(h('div', { class: 'chips scroll', style: 'margin-bottom:12px', role: 'group', 'aria-label': 'Show' },
    filters.map((f) => h('button', { class: 'chip', type: 'button', 'aria-pressed': filter === f.id ? 'true' : 'false',
      onclick: () => { filter = f.id; ctx.refresh(); } }, f.name, h('span', { class: 'count num' }, f.n)))));

  if (!shown.length) {
    root.append(h('div', { class: 'empty' }, filter === 'open'
      ? [h('strong', {}, 'No open ideas. '), 'Write one above: a question a customer asked, a drink to try, a moment at the market.']
      : 'Nothing here.'));
    return;
  }

  root.append(h('ul', { class: 'rows panel' }, shown.map((i) => h('li', {},
    h('button', { class: 'row', type: 'button', onclick: () => openIdea(ctx, i) },
      h('div', { class: 'main' },
        h('div', { class: 'title' }, i.title || 'Untitled'),
        h('div', { class: 'meta' }, [
          ctx.seriesName(i.series),
          (i.platforms || []).map(platformName).join(', '),
          i.createdBy === 'agent' ? 'from the agent' : '',
          relDate(i.createdAt),
        ].filter(Boolean).join(' · '))),
      filter === 'all' || filter === 'open' ? statusPill(i.status || 'new', IDEA_STATUSES) : null)))));
}

function openIdea(ctx, idea) {
  const ro = !ctx.store.canWrite;
  const title = h('input', { type: 'text', value: idea.title || '', disabled: ro });
  const note = h('textarea', { placeholder: 'More detail, a hook, a link', disabled: ro }, idea.note || '');
  const series = select([{ id: '', name: 'No series yet' }, ...ctx.series.map((s) => ({ id: s.id, name: s.name }))], idea.series || '', { disabled: ro });
  const plats = chipPicker(PLATFORMS, idea.platforms || [], { multi: true, label: 'Platforms' });
  const status = chipPicker(IDEA_STATUSES, idea.status || 'new', { label: 'Status' });

  const save = h('button', { class: 'btn primary', type: 'button', hidden: ro }, 'Save');
  const plan = h('button', { class: 'btn', type: 'button', hidden: ro }, 'Put on the calendar');
  const del = ro ? null : h('button', { class: 'btn quiet danger left', type: 'button' }, 'Delete');
  const sheet = openSheet({
    title: 'Idea',
    body: h('div', {},
      field('Idea', title), field('Notes', note), field('Series', series),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Platforms'), plats.el),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Status'), status.el),
      h('p', { class: 'hint', style: 'font-size:13px;color:var(--muted);margin:0' },
        `Added ${relDate(idea.createdAt).toLowerCase()}${idea.createdBy === 'agent' ? ' by the agent' : ''}.`)),
    foot: [del, plan, save],
  });

  const collect = () => ({ ...idea, title: title.value.trim(), note: note.value, series: series.value, platforms: plats.value(), status: status.value() });
  save.addEventListener('click', async () => {
    save.disabled = true;
    try { await ctx.store.saveItem('ideas', collect(), `Update idea: ${title.value.trim()}`); sheet.close(); ctx.refresh(); }
    catch { save.disabled = false; }
  });
  plan.addEventListener('click', () => {
    const current = collect();
    sheet.close();
    openPostEditor(ctx, null, { title: current.title, series: current.series, notes: current.note }, async () => {
      try { await ctx.store.saveItem('ideas', { ...current, status: 'planned' }, `Idea planned: ${current.title}`); } catch { /* sync bar */ }
      toast('On the calendar. The idea is marked planned.');
      ctx.refresh();
    });
  });
  if (del) del.addEventListener('click', async () => {
    const ok = await confirmSheet({ title: 'Delete this idea?', text: `"${idea.title}" is removed. To keep it out of the way instead, mark it Dropped.` });
    if (!ok) return;
    try { await ctx.store.deleteItem('ideas', idea, `Delete idea: ${idea.title}`); sheet.close(); ctx.refresh(); } catch { /* sync bar */ }
  });
}
