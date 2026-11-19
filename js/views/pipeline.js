// Pipeline: every idea and post on its way from a line in the inbox to the feed.
// Ideas live in ideas/, posts in posts/. Moving a card only records a status; nothing publishes.
import {
  h, icon, mark, toast, openSheet, confirmSheet, field, chipPicker, select, PLATFORMS, IDEA_STATUSES,
  POST_STATUSES, relDate, todayISO, postCode, addDays, parseISO, DOW, MONTHS,
} from '../ui.js';
import { makeId } from '../store.js';
import { openPostEditor, trialInfo } from './week.js';

const LANES = [
  { id: 'ideas', name: 'Ideas' },
  { id: 'planned', name: 'Planned' },
  { id: 'scripted', name: 'Scripted' },
  { id: 'filmed', name: 'Filmed' },
  { id: 'rough-cut', name: 'Edited' },
  { id: 'ready', name: 'Ready for you', need: true },
  { id: 'approved-in-chat', name: 'Approved in chat' },
  { id: 'posted', name: 'Posted' },
];
const NEXT = { planned: 'scripted', scripted: 'filmed', filmed: 'rough-cut', 'rough-cut': 'ready' };
const laneName = (id) => (LANES.find((l) => l.id === id) || { name: id }).name;
const when = (iso) => { const d = parseISO(iso); return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

let showDropped = false;

export async function render(root, ctx) {
  const today = todayISO();
  const [ideas, posts] = await Promise.all([ctx.store.list('ideas'), ctx.store.list('posts')]);
  const openIdeas = ideas.filter((i) => ['new', 'maybe'].includes(i.status || 'new'));
  const dropped = ideas.filter((i) => i.status === 'dropped');
  const live = posts.filter((p) => p.status !== 'posted' || p.date >= addDays(today, -14))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const inLane = (id) => (id === 'ideas' ? openIdeas : live.filter((p) => (p.status || 'planned') === id));
  const making = live.filter((p) => ['planned', 'scripted', 'filmed', 'rough-cut'].includes(p.status)).length;
  const ready = live.filter((p) => p.status === 'ready').length;

  const picker = h('div', { class: 'band-tabs', role: 'tablist', 'aria-label': 'Jump to a lane' });
  ctx.band(
    h('h1', { class: 'chalk-title' }, 'Pipeline'),
    h('p', { class: 'chalk-sub' }, `${openIdeas.length} ${openIdeas.length === 1 ? 'idea' : 'ideas'}, ${making} in the making, ${ready} ready for you`),
    picker,
  );

  const lanes = h('div', { class: 'lanes' });
  for (const lane of LANES) {
    const items = inLane(lane.id);
    const col = h('section', { class: `lane${lane.need && items.length ? ' need' : ''}`, id: `lane-${lane.id}`, 'aria-label': lane.name },
      h('div', { class: 'lane-head' }, h('h2', {}, lane.name), h('span', { class: 'n' }, items.length)));
    if (lane.id === 'ideas') {
      if (ctx.store.canWrite) col.append(ideaForm(ctx));
      col.append(...openIdeas.map((i) => ideaCard(ctx, i)));
      if (!openIdeas.length) col.append(h('p', { class: 'lane-empty' }, 'No open ideas. A question a customer asked, a drink to try, a moment at the market.'));
      if (dropped.length) {
        col.append(h('button', { class: 'btn link', type: 'button', onclick: () => { showDropped = !showDropped; ctx.refresh(); } },
          showDropped ? 'Hide dropped' : `Show ${dropped.length} dropped`));
        if (showDropped) col.append(...dropped.map((i) => ideaCard(ctx, i)));
      }
    } else {
      col.append(...items.map((p) => postCard(ctx, p, today)));
      if (!items.length) col.append(h('p', { class: 'lane-empty' }, lane.id === 'ready' ? 'Nothing waiting on you.' : 'Empty.'));
    }
    lanes.append(col);
    picker.append(h('button', { class: 'band-tab', type: 'button', role: 'tab', 'aria-selected': 'false',
      onclick: () => col.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', inline: 'start', block: 'nearest' }) },
      `${lane.name} ${items.length}`));
  }
  root.append(lanes);
}

function postCard(ctx, p, today) {
  const trial = trialInfo(p, today);
  const next = NEXT[p.status];
  const card = h('div', { class: 'pcard pin' },
    h('button', { class: 'lot-open', type: 'button', onclick: () => openPostEditor(ctx, p) },
      h('div', { class: 'lot' }, mark(p.status),
        h('div', { class: 'lot-body' },
          h('div', { class: 'lot-title' }, p.title || ctx.seriesName(p.series) || 'Untitled post'),
          h('div', { class: 'lot-meta lot-row' }, h('span', {}, [when(p.date), ctx.seriesName(p.series)].filter(Boolean).join(', ')), h('span', { class: 'lot-code' }, postCode(p, ctx.series))),
          trial ? h('div', { class: 'lot-meta' }, trial.need ? h('span', { class: 'need' }, trial.text) : trial.text) : null))));
  if (next && ctx.store.canWrite) {
    const btn = h('button', { class: 'btn small advance', type: 'button' }, `Move to ${laneName(next)}`, icon('next'));
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await ctx.store.saveItem('posts', { ...p, status: next, updatedAt: new Date().toISOString() }, `Post ${p.date}: ${laneName(p.status)} to ${laneName(next)}`);
        toast(`Moved to ${laneName(next)}.`);
        ctx.refresh();
      } catch { btn.disabled = false; }
    });
    card.append(btn);
  }
  return card;
}

function ideaCard(ctx, i) {
  return h('button', { class: 'pcard pin', type: 'button', style: 'text-align:left;cursor:pointer;color:inherit', onclick: () => openIdea(ctx, i) },
    h('div', { class: 'lot' }, mark(i.status === 'dropped' ? 'dropped' : 'open', { label: i.status === 'dropped' ? 'Dropped idea' : 'Idea' }),
      h('div', { class: 'lot-body' },
        h('div', { class: 'lot-title' }, i.title || 'Untitled'),
        h('div', { class: 'lot-meta' }, [
          ctx.seriesName(i.series),
          i.status === 'maybe' ? 'maybe' : '',
          i.createdBy === 'agent' ? 'from the agent' : '',
          relDate(i.createdAt),
        ].filter(Boolean).join(', ')))));
}

function ideaForm(ctx) {
  const input = h('input', { type: 'text', placeholder: 'A new idea', 'aria-label': 'New idea', enterkeyhint: 'done' });
  const add = h('button', { class: 'btn primary small', type: 'submit', 'aria-label': 'Add idea' }, icon('plus'));
  return h('form', { class: 'idea-add', onsubmit: async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) { input.focus(); return; }
    add.disabled = true;
    try { await saveNewIdea(ctx, title); input.value = ''; ctx.refresh(); } catch { add.disabled = false; }
  } }, input, add);
}

async function saveNewIdea(ctx, title, note = '') {
  const idea = { id: makeId(title), title, note, series: '', platforms: [], status: 'new', createdAt: new Date().toISOString(), createdBy: 'oran' };
  await ctx.store.saveItem('ideas', idea, `Add idea: ${title}`);
  return idea;
}

/** From the + button: one line now, sort it later. */
export function openNewIdea(ctx) {
  const title = h('input', { type: 'text', placeholder: 'What is the idea?', enterkeyhint: 'done' });
  const note = h('textarea', { placeholder: 'Anything else (optional)' });
  const save = h('button', { class: 'btn primary', type: 'button' }, 'Add idea');
  const sheet = openSheet({ title: 'New idea', body: h('div', {}, field('Idea', title), field('Notes', note)), foot: [save] });
  setTimeout(() => title.focus(), 320);
  save.addEventListener('click', async () => {
    if (!title.value.trim()) { title.focus(); return; }
    save.disabled = true;
    try { await saveNewIdea(ctx, title.value.trim(), note.value); sheet.close(); toast('Idea added to the pipeline.'); ctx.refresh(); }
    catch { save.disabled = false; }
  });
}

function openIdea(ctx, idea) {
  const ro = !ctx.store.canWrite;
  const title = h('input', { type: 'text', value: idea.title || '', disabled: ro });
  const note = h('textarea', { placeholder: 'More detail, a hook, a link', disabled: ro }, idea.note || '');
  const series = select([{ id: '', name: 'No series yet' }, ...ctx.series.map((s) => ({ id: s.id, name: s.name }))], idea.series || '', { disabled: ro });
  const plats = chipPicker(PLATFORMS, idea.platforms || [], { multi: true, label: 'Platforms' });
  const status = chipPicker(IDEA_STATUSES, idea.status || 'new', { label: 'Status' });

  const save = h('button', { class: 'btn primary', type: 'button', hidden: ro }, 'Save');
  const plan = h('button', { class: 'btn', type: 'button', hidden: ro }, 'Put on a day');
  const del = ro ? null : h('button', { class: 'btn quiet danger left', type: 'button' }, 'Delete');
  const sheet = openSheet({
    title: 'Idea',
    body: h('div', {},
      field('Idea', title), field('Notes', note), field('Series', series),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Platforms'), plats.el),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Status'), status.el),
      h('p', { class: 'hint' }, `Added ${relDate(idea.createdAt).toLowerCase()}${idea.createdBy === 'agent' ? ' by the agent' : ''}.`)),
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
      try { await ctx.store.saveItem('ideas', { ...current, status: 'planned' }, `Idea planned: ${current.title}`); } catch { /* sync line */ }
      toast('On the calendar. The idea is marked planned.');
      ctx.refresh();
    });
  });
  if (del) del.addEventListener('click', async () => {
    const ok = await confirmSheet({ title: 'Delete this idea?', text: `"${idea.title}" is removed. To keep it out of the way instead, mark it Dropped.` });
    if (!ok) return;
    try { await ctx.store.deleteItem('ideas', idea, `Delete idea: ${idea.title}`); sheet.close(); ctx.refresh(); } catch { /* sync line */ }
  });
}

export { POST_STATUSES };
