// Feed: how the Instagram grid will look, newest first, with the planned posts on top.
// Posts without a cover show as a small chalkboard with the series on it.
import { h, parseISO, DOW, MONTHS } from '../ui.js';
import { openPostEditor } from './week.js';

const isFeedPost = (p) => (p.platforms || []).includes('instagram') && p.format !== 'story';
const tag = (iso) => { const d = parseISO(iso); return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

export async function render(root, ctx) {
  const all = (await ctx.store.list('posts')).filter(isFeedPost)
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  const planned = all.filter((p) => p.status !== 'posted');
  const posted = all.filter((p) => p.status === 'posted');
  const withCover = all.filter((p) => p.cover).length;

  ctx.band(
    h('h1', { class: 'chalk-title' }, 'Feed'),
    h('p', { class: 'chalk-sub' }, planned.length ? `${planned.length} coming up, ${posted.length} posted` : 'How the Instagram grid will look'),
  );

  if (!planned.length && !posted.length) {
    root.append(h('div', { class: 'empty' }, h('strong', {}, 'Nothing on the grid yet.'),
      'Posts for Instagram show here once they are on a day. Add a cover in a post to see how the grid will look.'));
    return;
  }
  root.append(h('p', { class: 'feed-note' }, withCover < all.length
    ? `Instagram crops the grid to 3:4. ${all.length - withCover} of ${all.length} posts have no cover yet; add one in the post.`
    : 'Instagram crops the grid to 3:4. Tap a post to change its cover.'));

  const grid = h('div', { class: 'feed', role: 'list' });
  for (const p of planned) grid.append(cell(ctx, p, true));
  if (planned.length && posted.length) grid.append(h('div', { class: 'feed-divider', role: 'presentation' }, 'Already posted'));
  for (const p of posted) grid.append(cell(ctx, p, false));
  root.append(grid);
}

function cell(ctx, p, upcoming) {
  const label = `${p.title || ctx.seriesName(p.series) || 'Post'}, ${tag(p.date)}${upcoming ? ', planned' : ''}`;
  const el = h('button', { class: `cell${upcoming ? ' planned' : ''}${p.status === 'ready' ? ' ready' : ''}`, type: 'button', role: 'listitem', 'aria-label': label, onclick: () => openPostEditor(ctx, p) });
  const tile = h('div', { class: 'cell-tile' },
    h('span', { class: 'cell-code' }, ctx.seriesName(p.series) || 'Post'),
    h('span', { class: 'cell-series' }, p.title || ''));
  el.append(tile);
  if (p.cover) ctx.store.mediaURL(p.cover).then((u) => tile.replaceWith(h('img', { src: u, alt: '', loading: 'lazy' }))).catch(() => {});
  if (upcoming) el.append(h('span', { class: 'cell-when' }, p.status === 'ready' ? `${tag(p.date)}, for you` : tag(p.date)));
  return el;
}
