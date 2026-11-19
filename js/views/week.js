// This Week: the week chalked on the board, then the posts pinned under it, day by day.
// Also home to the post editor (cover picture and the A/B/C trial sheet).
import {
  h, icon, mark, toast, openSheet, confirmSheet, field, chipPicker, select, statusName, postCode, copyText,
  PLATFORMS, POST_STATUSES, todayISO, addDays, mondayOf, parseISO, shortDate, DOW, MONTHS,
} from '../ui.js';
import { makeId } from '../store.js';
import { compressImage, formatBytes } from '../image.js';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const FULL_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function cycleWeek(rhythm, monday) {
  if (!rhythm || !rhythm.cycleAnchor) return null;
  const diff = Math.round((parseISO(monday) - parseISO(mondayOf(rhythm.cycleAnchor))) / (7 * 86400000));
  return ((diff % 2) + 2) % 2 === 0 ? 1 : 2;
}

function rangeLabel(monday) {
  const a = parseISO(monday), b = parseISO(addDays(monday, 6));
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}-${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} - ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}
const dow3 = (iso) => DOW[parseISO(iso).getDay()];
const dayMonth = (iso) => { const d = parseISO(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };

/** Trial reels go out 3 to 2 days before the slot and are judged at 48 hours, the day before. */
export function trialInfo(p, today = todayISO()) {
  if (!p || p.format !== 'video' || !p.date) return null;
  const out = addDays(p.date, -3), judge = addDays(p.date, -1);
  const t = p.trial || {};
  if (t.winner) return { text: `Trial: ${t.winner} won`, winner: t.winner, state: 'done' };
  if (p.status === 'posted') return null;
  if (today < out) return { text: `Trial reels out ${dow3(out)} ${dayMonth(out)}`, state: 'later', out, judge };
  if (today < judge) return { text: `Trial live, judge on ${dow3(judge)}`, state: 'live', out, judge };
  return { text: 'Trial results due', state: 'due', out, judge, need: true };
}

function slotSeries(slot, cw) {
  const ids = cw === 2 ? slot.week2 : cw === 1 ? slot.week1 : [...new Set([...(slot.week1 || []), ...(slot.week2 || [])])];
  return ids || [];
}

export async function render(root, ctx, route) {
  const today = todayISO();
  const monday = route.params.w ? mondayOf(route.params.w) : mondayOf(today);
  const sunday = addDays(monday, 6);
  const isThisWeek = monday === mondayOf(today);
  const rhythm = ctx.rhythm;
  const cw = cycleWeek(rhythm, monday);

  const posts = (await ctx.store.list('posts')).filter((p) => p.date >= monday && p.date <= sunday)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const slots = rhythm?.slots || [];
  const markets = ctx.markets.filter((m) => m.to >= monday && m.from <= sunday);
  const ready = posts.filter((p) => p.status === 'ready');
  const trialsDue = posts.filter((p) => trialInfo(p, today)?.need);

  // ---------- the board ----------
  const nav = h('div', { class: 'wk-nav' },
    h('a', { class: 'band-btn', href: `#/week?w=${addDays(monday, -7)}`, 'aria-label': 'Previous week' }, icon('left')),
    isThisWeek ? null : h('a', { class: 'band-btn today', href: '#/week' }, 'Today'),
    h('a', { class: 'band-btn', href: `#/week?w=${addDays(monday, 7)}`, 'aria-label': 'Next week' }, icon('right')));

  const chalk = h('ul', { class: 'chalk-list', 'aria-label': 'The week at a glance' });
  for (const dow of DAY_ORDER) {
    const date = addDays(monday, (dow + 6) % 7);
    const daySlots = slots.filter((s) => s.day === dow);
    const dayPosts = posts.filter((p) => p.date === date);
    const market = markets.find((m) => m.from <= date && m.to >= date);
    if (!daySlots.length && !dayPosts.length && !market) continue;
    const cls = date === today ? 'today' : '';
    if (dayPosts.length) {
      for (const p of dayPosts) {
        const need = p.status === 'ready' || trialInfo(p, today)?.need;
        chalk.append(h('li', { class: cls },
          h('b', {}, DOW[dow]),
          h('span', { class: 'what' }, p.title || ctx.seriesName(p.series) || 'A post'),
          h('span', { class: `state${need ? ' need' : ''}` }, p.status === 'posted' ? 'posted' :p.status === 'ready' ? 'for you' : trialInfo(p, today)?.need ? 'trial due' : statusName(p.status).toLowerCase())));
      }
    } else if (daySlots.length) {
      const names = daySlots.flatMap((s) => slotSeries(s, cw)).map((id) => ctx.seriesName(id) || id);
      chalk.append(h('li', { class: cls }, h('b', {}, DOW[dow]), h('span', { class: 'what open' }, names.join(' or ')), h('span', { class: 'state' }, 'open')));
    }
    if (market) chalk.append(h('li', { class: cls }, h('b', {}, DOW[dow]), h('span', { class: 'what' }, market.name), h('span', { class: 'state' }, 'market')));
  }

  const firstNeed = ready[0] || trialsDue[0];
  const needCount = ready.length + trialsDue.length;
  const special = needCount
    ? h('p', { class: 'special' }, 'Today\'s special: ', h('button', { type: 'button', onclick: () => openPostEditor(ctx, firstNeed) },
      [ready.length ? `${ready.length} ready for you` : '', ready.length && trialsDue.length ? ', ' : '', trialsDue.length ? `${trialsDue.length} ${trialsDue.length === 1 ? 'trial' : 'trials'} to judge` : ''].join('')))
    : h('p', { class: 'special-calm' }, isThisWeek ? 'Nothing needs you right now.' : 'Nothing waiting on you this week.');

  ctx.band(
    h('div', { class: 'band-row' },
      h('div', { class: 'grow' },
        h('h1', { class: 'chalk-title' }, isThisWeek ? 'This week' : `Week of ${dayMonth(monday)}`),
        h('p', { class: 'chalk-sub' }, rangeLabel(monday), cw ? `, cycle week ${cw}` : '')),
      nav),
    chalk.childNodes.length ? chalk : h('p', { class: 'chalk-sub', style: 'margin-top:12px' }, 'No posting days set up yet.'),
    special,
  );

  // ---------- under the board ----------
  if (ctx.configError) root.append(h('div', { class: 'notice' }, icon('info'), h('p', {}, ctx.configError)));

  if (rhythm && !rhythm.cycleAnchor && ctx.store.canWrite) {
    const set = async (n) => {
      const anchor = n === 1 ? monday : addDays(monday, -7);
      const next = { ...rhythm, cycleAnchor: anchor };
      try {
        ctx.rhythmSha = await ctx.store.saveJSONFile('hub/rhythm.json', next, ctx.rhythmSha, `Set the 2-week cycle: week of ${monday} is week ${n}`);
        ctx.rhythm = next;
        ctx.refresh();
      } catch { /* the sync line explains */ }
    };
    root.append(h('div', { class: 'notice' }, icon('info'), h('div', { class: 'cycle-ask' },
      h('p', {}, 'The posting days run on a 2-week cycle. Which cycle week is this one?'),
      h('div', { class: 'chips' },
        h('button', { class: 'btn small', type: 'button', onclick: () => set(1) }, 'Week 1'),
        h('button', { class: 'btn small', type: 'button', onclick: () => set(2) }, 'Week 2')))));
  }

  const needs = [...ready, ...trialsDue.filter((p) => !ready.includes(p))];
  if (needs.length) {
    root.append(h('h2', { class: 'week-head', style: 'margin-top:4px' }, 'Waiting on you'),
      h('div', { class: 'notes' }, needs.map((p) => noteFor(ctx, p, today, { showDay: true }))));
  }

  root.append(h('h2', { class: 'week-head' }, 'Day by day'));
  const list = h('ol', { class: 'manifest' });
  for (const dow of DAY_ORDER) {
    const date = addDays(monday, (dow + 6) % 7);
    const daySlots = slots.filter((s) => s.day === dow);
    const dayPosts = posts.filter((p) => p.date === date);
    const stories = (rhythm?.stories || []).filter((s) => s.day === dow);
    const market = markets.find((m) => m.from <= date && m.to >= date);
    const quiet = !daySlots.length && !dayPosts.length && !market;

    const body = h('div', { class: 'mbody' });
    if (market) body.append(h('div', { class: 'market' }, icon('market'), market.name, h('span', {}, dow === 6 ? 'Film First Sip and story moments' : market.where || '')));
    const placed = new Set();
    for (const slot of daySlots) {
      const ids = slotSeries(slot, cw);
      const slotPosts = dayPosts.filter((p) => !placed.has(p.id) && (p.format === slot.format || ids.includes(p.series)));
      slotPosts.forEach((p) => placed.add(p.id));
      body.append(slotBlock(ctx, slot, ids, date, cw, slotPosts, today));
    }
    const loose = dayPosts.filter((p) => !placed.has(p.id));
    if (loose.length) body.append(h('div', { class: 'notes' }, loose.map((p) => noteFor(ctx, p, today))));
    for (const s of stories) body.append(h('div', { class: 'side' }, icon('story'), h('span', {}, h('b', {}, 'Story. '), s.what)));
    if (quiet && !stories.length) body.append(h('div', { class: 'quiet-text' }, 'No post'));

    list.append(h('li', { class: `mrow${date === today ? ' today' : ''}${quiet ? ' quiet' : ''}`, 'aria-label': `${FULL_DAY[dow]} ${dayMonth(date)}` },
      h('div', {}, h('span', { class: 'dmark' }, DOW[dow]), h('span', { class: 'dsub' }, date === today ? 'Today' : dayMonth(date))),
      body));
  }
  root.append(list);

  if (ctx.store.canWrite) {
    root.append(h('div', { style: 'margin-top:18px' },
      h('button', { class: 'btn', type: 'button', onclick: () => openPostEditor(ctx, null, { date: isThisWeek ? today : monday }) }, icon('plus'), 'Add a post on another day')));
  }
}

function slotBlock(ctx, slot, ids, date, cw, slotPosts, today) {
  const names = ids.map((id) => ctx.seriesName(id) || id);
  const extra = cw === 2 && slot.week2Note ? ` (${slot.week2Note})` : '';
  const wrap = h('div', { class: 'slot' },
    h('div', { class: 'slot-head' }, h('b', {}, slot.format === 'carousel' ? 'Carousel' : 'Video'), names.join(' or ') + extra));
  if (slotPosts.length) wrap.append(h('div', { class: 'notes' }, slotPosts.map((p) => noteFor(ctx, p, today))));
  else {
    const open = h('div', { class: 'open-slot' },
      h('span', {}, 'Open. ', slot.note || (slot.format === 'video' ? 'Three trial versions go out before it.' : 'Not trial-tested; the cover goes through Facebook\'s thumbnail test.')));
    if (slot.format === 'video') {
      const out = addDays(date, -3), judge = addDays(date, -1);
      open.append(h('div', { class: 'trial' }, h('span', { class: 'abc', 'aria-hidden': 'true' }, h('i', {}, 'A'), h('i', {}, 'B'), h('i', {}, 'C')),
        `Out ${dow3(out)} ${dayMonth(out)}, judged ${dow3(judge)}`));
    }
    if (ctx.store.canWrite) open.append(h('button', { class: 'btn small slot-add', type: 'button',
      onclick: () => openPostEditor(ctx, null, { date, series: ids[0] || '', format: slot.format }) }, icon('plus'), 'Add post'));
    wrap.append(open);
  }
  return wrap;
}

/** A post pinned to the board. */
export function noteFor(ctx, p, today = todayISO(), { showDay = false } = {}) {
  const trial = trialInfo(p, today);
  const need = p.status === 'ready';
  const meta = [
    showDay ? `${FULL_DAY[parseISO(p.date).getDay()]} ${dayMonth(p.date)}` : null,
    p.format === 'carousel' ? 'Carousel' : p.format === 'story' ? 'Story' : 'Video',
    ctx.seriesName(p.series),
  ].filter(Boolean).join(', ');
  return h('button', { class: `note pin${need ? ' need' : ''}`, type: 'button', onclick: () => openPostEditor(ctx, p) },
    h('div', { class: 'lot' }, mark(p.status),
      h('div', { class: 'lot-body' },
        h('div', { class: 'lot-title' }, p.title || ctx.seriesName(p.series) || 'Untitled post'),
        h('div', { class: 'lot-meta lot-row' }, h('span', {}, meta), h('span', { class: 'lot-code' }, postCode(p, ctx.series))),
        h('div', { class: 'lot-meta' },
          need ? h('span', { class: 'need' }, 'Ready for you. ') : `${statusName(p.status)}. `,
          trial ? (trial.need ? h('span', { class: 'need' }, trial.text) : trial.text) : ''),
      )));
}

// ---------- the post editor ----------
const NUM_ROWS = [['hold', '3-second hold %'], ['watch', 'Watch time (s)'], ['shares', 'Shares'], ['saves', 'Saves']];

function leader(variants) {
  const keys = ['A', 'B', 'C'].filter((k) => variants[k] && variants[k].hold !== '' && variants[k].hold != null);
  if (keys.length < 2) return null;
  const score = (k) => [Number(variants[k].hold) || 0, Number(variants[k].watch) || 0, Number(variants[k].shares) || 0, Number(variants[k].saves) || 0];
  return keys.sort((a, b) => { const x = score(a), y = score(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; })[0];
}

/** The post editor, also used from the pipeline, the feed and the + button. */
export function openPostEditor(ctx, post, defaults = {}, onSaved) {
  const editing = Boolean(post);
  const p = post ? { ...post } : {
    id: '', date: defaults.date || todayISO(), time: ctx.rhythm?.time || '18:30', series: defaults.series || '',
    format: defaults.format || 'video', title: defaults.title || '', status: defaults.status || 'planned',
    platforms: defaults.format === 'carousel' || defaults.format === 'story' ? ['instagram', 'facebook'] : PLATFORMS.map((x) => x.id),
    driveUrl: '', caption: '', notes: defaults.notes || '', approvalNote: '',
  };
  const ro = !ctx.store.canWrite;
  let coverPick = null;   // { blob, width, height }

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
  const drive = h('input', { type: 'url', inputmode: 'url', value: p.driveUrl || '', placeholder: 'https://drive.google.com/...', disabled: ro });
  const caption = h('textarea', { placeholder: 'Caption draft', disabled: ro }, p.caption || '');
  const notes = h('textarea', { placeholder: 'Shot ideas, the hook, anything', disabled: ro }, p.notes || '');

  // Cover (for the feed preview)
  const coverCell = h('div', { class: 'cell' }, h('div', { class: 'cell-tile' }, h('span', { class: 'cell-series' }, 'No cover yet')));
  if (p.cover) ctx.store.mediaURL(p.cover).then((u) => coverCell.replaceChildren(h('img', { src: u, alt: 'Cover' }))).catch(() => {});
  const coverInput = h('input', { type: 'file', accept: 'image/*', disabled: ro });
  const coverInfo = h('p', { class: 'hint' }, 'The first frame or carousel cover. It shows in the Feed preview.');
  coverInput.addEventListener('change', async () => {
    const f = coverInput.files && coverInput.files[0];
    if (!f) return;
    coverInfo.textContent = `Shrinking ${formatBytes(f.size)}...`;
    try {
      coverPick = await compressImage(f, { maxEdge: 1440, targetBytes: 900 * 1024 });
      coverCell.replaceChildren(h('img', { src: URL.createObjectURL(coverPick.blob), alt: 'New cover' }));
      coverInfo.textContent = `Ready: ${formatBytes(coverPick.blob.size)}. Saved with the post.`;
    } catch (err) { coverPick = null; coverInfo.textContent = err.message; }
  });

  // Trial sheet (videos)
  const t = p.trial ? JSON.parse(JSON.stringify(p.trial)) : { variants: { A: {}, B: {}, C: {} }, winner: '' };
  for (const k of ['A', 'B', 'C']) t.variants[k] = t.variants[k] || {};
  const heads = {};
  const leadHint = h('span', { class: 'grow' });
  const winner = chipPicker([{ id: '', name: 'Not yet' }, { id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }], t.winner || '', { label: 'Winner' });
  const drawLead = () => {
    const l = leader(t.variants);
    leadHint.textContent = l ? `On the numbers, ${l} leads.` : 'Fill in the 48-hour numbers.';
    for (const k of ['A', 'B', 'C']) heads[k].classList.toggle('win', winner.value() === k);
  };
  const cellInput = (k, key, type = 'number') => {
    const inp = h('input', { type, inputmode: type === 'number' ? 'decimal' : 'text', value: t.variants[k][key] ?? '', disabled: ro, 'aria-label': `${k} ${key}` });
    inp.addEventListener('input', () => { t.variants[k][key] = inp.value; drawLead(); });
    return inp;
  };
  const hooks = h('div', { style: 'display:grid;gap:8px;margin-bottom:10px' }, ['A', 'B', 'C'].map((k) => {
    const inp = cellInput(k, 'hook', 'text');
    inp.style.textAlign = 'left';
    inp.placeholder = 'What is different in this version';
    return h('div', { style: 'display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:center' },
      h('label', { for: inp.id = `hk${k}${Math.random().toString(36).slice(2, 5)}`, style: 'font-weight:800' }, k), inp);
  }));
  const trialTable = h('table', {},
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'At 48 hours'), ['A', 'B', 'C'].map((k) => (heads[k] = h('th', { scope: 'col' }, k))))),
    h('tbody', {},
      NUM_ROWS.map(([key, label]) => h('tr', {}, h('th', { scope: 'row' }, label), ['A', 'B', 'C'].map((k) => h('td', {}, cellInput(k, key)))))));
  const trialBlock = h('div', { class: 'field' }, h('span', { class: 'label' }, 'Trial reels'),
    hooks,
    h('div', { class: 'trial-sheet' }, trialTable, h('div', { class: 'trial-foot' }, leadHint, h('span', {}, 'Winner'), winner.el)),
    h('p', { class: 'hint' }, 'Judge on the 3-second hold first, then watch time, shares and saves. Only the winner goes to the feed, after your yes in chat.'));
  winner.el.addEventListener('change', drawLead);
  drawLead();
  const showTrial = () => { trialBlock.hidden = format.value() !== 'video'; };
  format.el.addEventListener('change', showTrial); showTrial();

  const body = h('div', {},
    field('Title', title),
    h('div', { style: 'display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:10px' }, field('Day', date), field('Time', time)),
    field('Series', series),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Format'), format.el),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Platforms'), plats.el),
    h('div', { class: 'field' }, h('label', { for: status.id = 'st' + Math.random().toString(36).slice(2, 6) }, 'Status'), status, statusHint),
    h('div', { class: 'field' }, h('label', { for: coverInput.id = 'cv' + Math.random().toString(36).slice(2, 6) }, 'Cover'),
      h('div', { class: 'cover-pick' }, coverCell, h('div', { style: 'display:grid;gap:6px;min-width:0' }, coverInput, coverInfo))),
    trialBlock,
    field('Video or files in Google Drive', drive),
    field('Caption', caption),
    field('Notes', notes),
    p.approvalNote ? h('div', { class: 'notice' }, icon('info'), h('p', {}, 'Approval recorded by the agent: ', p.approvalNote)) : null,
  );

  const save = h('button', { class: 'btn primary', type: 'button', hidden: ro }, editing ? 'Save' : 'Add post');
  const del = editing && !ro ? h('button', { class: 'btn quiet danger left', type: 'button' }, 'Delete') : null;
  const sheet = openSheet({ title: editing ? (p.title || 'Post') : 'New post', body, foot: [del, save] });
  if (editing) {
    const code = postCode(p, ctx.series);
    sheet.el.querySelector('.sheet-head h2').after(h('button', { class: 'lot-code', type: 'button', title: 'Copy the code to use in chat', onclick: () => copyText(code) }, code));
  }

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
    if (next.format === 'video') {
      const filled = ['A', 'B', 'C'].some((k) => Object.values(t.variants[k]).some((v) => v !== '' && v != null));
      if (filled || winner.value()) next.trial = { ...t, winner: winner.value(), judged: winner.value() ? (t.judged || todayISO()) : '' };
    }
    save.disabled = true;
    try {
      if (coverPick) {
        save.textContent = 'Uploading cover...';
        next.cover = `media/covers/${next.id}.jpg`;
        await ctx.store.uploadBlob(next.cover, coverPick.blob, `Cover for post ${next.date}: ${next.title || 'untitled'}`);
      }
      const saved = await ctx.store.saveItem('posts', next, `${editing ? 'Update' : 'Plan'} post ${next.date}: ${next.title || ctx.seriesName(next.series) || 'untitled'}`);
      sheet.close();
      toast(editing ? 'Post saved.' : 'Post added.');
      if (onSaved) onSaved(saved);
      ctx.refresh();
    } catch { save.disabled = false; save.textContent = editing ? 'Save' : 'Add post'; }
  });
  if (del) del.addEventListener('click', async () => {
    const ok = await confirmSheet({ title: 'Delete this post?', text: 'It is removed from the plan. Its history stays in the data repository.' });
    if (!ok) return;
    try {
      await ctx.store.deleteItem('posts', post, `Delete post ${post.date}: ${post.title || 'untitled'}`);
      if (post.cover) await ctx.store.deleteFile(post.cover, `Delete cover for post ${post.id}`).catch(() => {});
      sheet.close(); toast('Post deleted.'); ctx.refresh();
    } catch { /* the sync line explains */ }
  });
}
