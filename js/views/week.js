// This Week: the four posting slots of the 2-week cycle, the trial window before
// each video, story days and market days, and the posts planned for the week.
import {
  h, icon, toast, openSheet, confirmSheet, field, chipPicker, select, statusPill,
  PLATFORMS, POST_STATUSES, todayISO, addDays, mondayOf, parseISO, shortDate, DOW, MONTHS,
} from '../ui.js';
import { makeId } from '../store.js';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function cycleWeek(rhythm, monday) {
  if (!rhythm || !rhythm.cycleAnchor) return null;
  const diff = Math.round((parseISO(monday) - parseISO(mondayOf(rhythm.cycleAnchor))) / (7 * 86400000));
  return ((diff % 2) + 2) % 2 === 0 ? 1 : 2;
}

function rangeLabel(monday) {
  const a = parseISO(monday), b = parseISO(addDays(monday, 6));
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} to ${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} to ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}

export async function render(root, ctx, route) {
  const today = todayISO();
  const monday = route.params.w ? mondayOf(route.params.w) : mondayOf(today);
  const sunday = addDays(monday, 6);
  const isThisWeek = monday === mondayOf(today);
  const rhythm = ctx.rhythm;
  const cw = cycleWeek(rhythm, monday);

  const posts = (await ctx.store.list('posts')).filter((p) => p.date >= monday && p.date <= sunday);
  const slots = rhythm?.slots || [];
  const markets = ctx.markets.filter((m) => m.to >= monday && m.from <= sunday);

  // The finding: how many slots have something, and what waits on Oran.
  const slotDates = slots.map((s) => addDays(monday, (s.day + 6) % 7));
  const filled = slotDates.filter((d) => posts.some((p) => p.date === d)).length;
  const ready = posts.filter((p) => p.status === 'ready');

  const nav = h('div', { class: 'week-nav' },
    h('a', { class: 'icon-btn', href: `#/week?w=${addDays(monday, -7)}`, 'aria-label': 'Previous week' }, icon('left')),
    isThisWeek ? null : h('a', { class: 'btn small quiet', href: '#/week' }, 'Today'),
    h('a', { class: 'icon-btn', href: `#/week?w=${addDays(monday, 7)}`, 'aria-label': 'Next week' }, icon('right')),
  );

  root.append(h('div', { class: 'page-head' },
    h('div', { class: 'grow' },
      h('h1', {}, isThisWeek ? 'This week' : `Week of ${shortDate(monday).slice(4)}`),
      h('p', { class: 'subline num' }, rangeLabel(monday), cw ? ` · cycle week ${cw}` : ''),
      h('p', { class: 'finding' },
        `${filled} of ${slots.length} slots have a post`,
        ready.length ? [' · ', h('strong', {}, `${ready.length} ready for you`)] : '',
        markets.length ? ` · market ${markets.map((m) => shortDate(m.from).slice(0, 3)).join(', ')}` : ''),
    ),
    nav,
  ));

  if (ctx.configError) root.append(h('div', { class: 'notice', style: 'margin-bottom:16px' }, icon('info'), h('span', {}, ctx.configError)));

  if (rhythm && !rhythm.cycleAnchor && ctx.store.canWrite) {
    const set = async (n) => {
      const anchor = n === 1 ? monday : addDays(monday, -7);
      const next = { ...rhythm, cycleAnchor: anchor };
      try {
        ctx.rhythmSha = await ctx.store.saveJSONFile('hub/rhythm.json', next, ctx.rhythmSha, `Set the 2-week cycle: week of ${monday} is week ${n}`);
        ctx.rhythm = next;
        ctx.refresh();
      } catch (err) { /* the sync bar explains */ }
    };
    root.append(h('div', { class: 'notice', style: 'margin-bottom:16px' }, icon('info'), h('div', {},
      h('p', { style: 'margin:0 0 10px' }, 'The posting days run on a 2-week cycle. Which cycle week is this one?'),
      h('div', { class: 'chips' },
        h('button', { class: 'btn small', type: 'button', onclick: () => set(1) }, 'Week 1'),
        h('button', { class: 'btn small', type: 'button', onclick: () => set(2) }, 'Week 2')))));
  }

  const days = h('div', { class: 'days' });
  for (const dow of DAY_ORDER) {
    const date = addDays(monday, (dow + 6) % 7);
    const daySlots = slots.filter((s) => s.day === dow);
    const dayPosts = posts.filter((p) => p.date === date);
    const stories = (rhythm?.stories || []).filter((s) => s.day === dow);
    const market = markets.find((m) => m.from <= date && m.to >= date);
    const quiet = !daySlots.length && !dayPosts.length && !market;

    const body = h('div', { class: 'day-body' });
    if (market) body.append(h('div', { class: 'market-line' }, h('b', {}, 'Market: '), market.name, dow === 6 ? '. Film First Sip and story moments.' : ''));
    for (const slot of daySlots) body.append(slotCard(ctx, slot, date, cw, dayPosts));
    if (!daySlots.length) for (const p of dayPosts) body.append(postLine(ctx, p));
    for (const s of stories) body.append(h('div', { class: 'side-line' }, h('b', {}, 'Story'), s.what));
    if (quiet && !stories.length) body.append(h('div', { class: 'side-line' }, 'No post'));

    days.append(h('section', { class: `day${date === today ? ' today' : ''}${quiet ? ' quiet' : ''}`, 'aria-label': shortDate(date) },
      h('div', { class: 'day-date' }, h('div', { class: 'dow' }, DOW[dow]), h('div', { class: 'dom num' }, parseISO(date).getDate())),
      body));
  }
  root.append(days);

  if (ctx.store.canWrite) {
    root.append(h('div', { style: 'margin-top:16px' },
      h('button', { class: 'btn', type: 'button', onclick: () => openPostEditor(ctx, null, { date: isThisWeek ? today : monday }) }, icon('plus'), 'Add a post on another day')));
  }
}

function slotSeries(slot, cw) {
  const ids = cw === 2 ? slot.week2 : cw === 1 ? slot.week1 : [...new Set([...(slot.week1 || []), ...(slot.week2 || [])])];
  return ids || [];
}

function slotCard(ctx, slot, date, cw, dayPosts) {
  const ids = slotSeries(slot, cw);
  const names = ids.map((id) => ctx.seriesName(id) || id);
  const extra = cw === 2 && slot.week2Note ? ` (${slot.week2Note})` : '';
  const card = h('div', { class: 'slot panel' },
    h('div', { class: 'slot-head' },
      h('span', { class: 'slot-series' }, names.join(' or ') + extra),
      h('span', { class: 'slot-format' }, slot.format === 'carousel' ? 'Carousel' : 'Video')),
  );
  if (slot.note) card.append(h('div', { class: 'slot-trial' }, slot.note));
  if (slot.format === 'video') {
    card.append(h('div', { class: 'slot-trial' },
      h('span', { class: 'variants', 'aria-hidden': 'true' }, h('i', {}, 'A'), h('i', {}, 'B'), h('i', {}, 'C')),
      `Trial reels out ${shortDate(addDays(date, -3)).slice(0, 3)} to ${shortDate(addDays(date, -2)).slice(0, 3)}`));
  } else {
    card.append(h('div', { class: 'slot-trial' }, 'Not trial-tested. Cover goes through Facebook\'s thumbnail test.'));
  }
  if (dayPosts.length) card.append(h('div', { class: 'slot-posts' }, dayPosts.map((p) => postLine(ctx, p))));
  if (ctx.store.canWrite) {
    card.append(h('div', { class: 'slot-add' }, h('button', { class: 'btn small quiet', type: 'button', style: 'padding-left:0',
      onclick: () => openPostEditor(ctx, null, { date, series: ids[0] || '', format: slot.format }) }, icon('plus'), dayPosts.length ? 'Add another' : 'Add post')));
  }
  return card;
}

function postLine(ctx, p) {
  return h('button', { class: 'post-line', type: 'button', onclick: () => openPostEditor(ctx, p) },
    h('span', { class: 't' }, p.title || ctx.seriesName(p.series) || 'Untitled post'),
    statusPill(p.status));
}

/** The post editor, also used from Ideas ("Put on the calendar"). */
export function openPostEditor(ctx, post, defaults = {}, onSaved) {
  const editing = Boolean(post);
  const p = post ? { ...post } : {
    id: '', date: defaults.date || todayISO(), time: ctx.rhythm?.time || '18:30', series: defaults.series || '',
    format: defaults.format || 'video', title: defaults.title || '', status: 'planned',
    platforms: defaults.format === 'carousel' || defaults.format === 'story' ? ['instagram', 'facebook'] : PLATFORMS.map((x) => x.id),
    driveUrl: '', caption: '', notes: defaults.notes || '', approvalNote: '',
  };
  const ro = !ctx.store.canWrite;

  const title = h('input', { type: 'text', value: p.title, placeholder: 'What is it about?', disabled: ro });
  const date = h('input', { type: 'date', value: p.date, disabled: ro });
  const time = h('input', { type: 'time', value: p.time || '', disabled: ro });
  const series = select([{ id: '', name: 'No series' }, ...ctx.series.map((s) => ({ id: s.id, name: s.name }))], p.series, { disabled: ro });
  const format = chipPicker([{ id: 'video', name: 'Video' }, { id: 'carousel', name: 'Carousel' }, { id: 'story', name: 'Story' }], p.format, { label: 'Format' });
  const plats = chipPicker(PLATFORMS, p.platforms, { multi: true, label: 'Platforms' });
  const status = select(POST_STATUSES, p.status, { disabled: ro });
  const statusHint = h('p', { class: 'hint' });
  const syncHint = () => {
    statusHint.textContent = status.value === 'approved-in-chat'
      ? 'This only records it. The go-ahead to publish is your message to the agent in chat.'
      : status.value === 'ready' ? 'Ready for you to check. Approve it in chat when you are happy.' : '';
  };
  status.addEventListener('change', syncHint); syncHint();
  const drive = h('input', { type: 'url', value: p.driveUrl || '', placeholder: 'https://drive.google.com/…', disabled: ro });
  const caption = h('textarea', { placeholder: 'Caption draft', disabled: ro }, p.caption || '');
  const notes = h('textarea', { placeholder: 'Shot ideas, the hook, anything', disabled: ro }, p.notes || '');

  const body = h('div', {},
    field('Title', title),
    h('div', { style: 'display:grid;grid-template-columns:1.4fr 1fr;gap:10px' }, field('Day', date), field('Time', time)),
    field('Series', series),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Format'), format.el),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Platforms'), plats.el),
    h('div', { class: 'field' }, h('label', { for: status.id = 'st' + Math.random().toString(36).slice(2, 6) }, 'Status'), status, statusHint),
    field('Video or files in Google Drive', drive),
    field('Caption', caption),
    field('Notes', notes),
    p.approvalNote ? h('div', { class: 'notice' }, icon('info'), h('span', {}, 'Approval recorded by the agent: ', p.approvalNote)) : null,
  );

  const save = h('button', { class: 'btn primary', type: 'button', hidden: ro }, editing ? 'Save' : 'Add post');
  const del = editing && !ro ? h('button', { class: 'btn quiet danger left', type: 'button' }, 'Delete') : null;
  const sheet = openSheet({ title: editing ? 'Post' : 'New post', body, foot: [del, save] });

  save.addEventListener('click', async () => {
    if (!date.value) { toast('Pick a day.', { error: true }); return; }
    const now = new Date().toISOString();
    const next = {
      ...p,
      id: p.id || makeId(title.value || ctx.seriesName(series.value) || 'post', parseISO(date.value)),
      title: title.value.trim(), date: date.value, time: time.value, series: series.value,
      format: format.value(), platforms: plats.value(), status: status.value,
      driveUrl: drive.value.trim(), caption: caption.value, notes: notes.value,
      createdAt: p.createdAt || now, updatedAt: now,
    };
    save.disabled = true;
    try {
      const saved = await ctx.store.saveItem('posts', next, `${editing ? 'Update' : 'Plan'} post ${next.date}: ${next.title || ctx.seriesName(next.series) || 'untitled'}`);
      sheet.close();
      toast(editing ? 'Post saved.' : 'Post added.');
      if (onSaved) onSaved(saved);
      ctx.refresh();
    } catch { save.disabled = false; }
  });
  if (del) del.addEventListener('click', async () => {
    const ok = await confirmSheet({ title: 'Delete this post?', text: 'It is removed from the plan. Its history stays in the data repository.' });
    if (!ok) return;
    try {
      await ctx.store.deleteItem('posts', post, `Delete post ${post.date}: ${post.title || 'untitled'}`);
      sheet.close(); toast('Post deleted.'); ctx.refresh();
    } catch { /* the sync bar explains */ }
  });
}
