// References: links, pictures and videos that show how our posts should look.
import {
  h, icon, toast, openSheet, confirmSheet, field, chipPicker, select, PLATFORMS, platformName,
  parseLink, relDate, consumeShare,
} from '../ui.js';
import { makeId } from '../store.js';
import { compressImage, formatBytes } from '../image.js';

const CLIP_LIMIT = 20 * 1024 * 1024;
const state = { platform: 'all', series: '', q: '' };

const PLATFORM_CHOICES = [...PLATFORMS, { id: 'any', name: 'Any' }];

export async function render(root, ctx, route) {
  if (route.params.platform) state.platform = route.params.platform;
  const all = await ctx.store.list('references');
  const shared = route.params.share ? consumeShare() : null;

  const head = h('div', { class: 'page-head' },
    h('div', { class: 'grow' },
      h('h1', {}, 'References'),
      h('p', { class: 'subline num', id: 'ref-count' })),
    ctx.store.canWrite ? h('button', { class: 'btn primary', type: 'button', onclick: () => openAdd(ctx) }, icon('plus'), 'Add') : null);

  const search = h('input', { type: 'search', placeholder: 'Search notes and tags', value: state.q, 'aria-label': 'Search references' });
  const seriesSel = select([{ id: '', name: 'All series' }, ...ctx.series.map((s) => ({ id: s.id, name: s.name })), { id: '-', name: 'No series' }], state.series, { 'aria-label': 'Series' });
  const chips = h('div', { class: 'chips scroll', role: 'group', 'aria-label': 'Platform' });
  const board = h('div', { class: 'board' });

  const draw = () => {
    const q = state.q.toLowerCase();
    const list = all.filter((r) =>
      (state.platform === 'all' || r.platform === state.platform) &&
      (!state.series || (state.series === '-' ? !r.series : r.series === state.series)) &&
      (!q || [r.like, r.url, ...(r.tags || []), ctx.seriesName(r.series), platformName(r.platform)].join(' ').toLowerCase().includes(q)));

    const byPlatform = (id) => all.filter((r) => r.platform === id).length;
    chips.replaceChildren(...[{ id: 'all', name: 'All', n: all.length }, ...PLATFORM_CHOICES.map((p) => ({ ...p, n: byPlatform(p.id) }))]
      .filter((p) => p.id === 'all' || p.id === state.platform || p.n > 0 || p.id !== 'any')
      .map((p) => h('button', { class: 'chip', type: 'button', 'aria-pressed': state.platform === p.id ? 'true' : 'false',
        onclick: () => { state.platform = p.id; draw(); } }, p.name, h('span', { class: 'count num' }, p.n))));

    const count = root.querySelector('#ref-count') || head.querySelector('#ref-count');
    count.textContent = list.length === all.length ? `${all.length} saved` : `${list.length} of ${all.length} shown`;

    if (!all.length) {
      board.replaceChildren(h('div', { class: 'empty', style: 'grid-column:1/-1' },
        h('strong', {}, 'Nothing saved yet. '), 'Add a reel or TikTok link, a picture, or a video you would like our posts to look like, and say what you like about it.'));
      return;
    }
    if (!list.length) {
      board.replaceChildren(h('div', { class: 'empty', style: 'grid-column:1/-1' }, 'No references match. ',
        h('button', { class: 'btn small quiet', type: 'button', onclick: () => { state.platform = 'all'; state.series = ''; state.q = ''; search.value = ''; seriesSel.value = ''; draw(); } }, 'Clear filters')));
      return;
    }
    board.replaceChildren(...list.map((r) => refCard(ctx, r)));
  };

  search.addEventListener('input', () => { state.q = search.value; draw(); });
  seriesSel.addEventListener('change', () => { state.series = seriesSel.value; draw(); });

  root.append(head,
    h('div', { class: 'board-tools' }, chips, h('div', { class: 'row2' }, seriesSel, search)),
    board);
  draw();

  if (shared && ctx.store.canWrite) setTimeout(() => openAdd(ctx, { text: shared }), 50);
}

// ---------- media ----------
function lazyImage(ctx, path, alt) {
  const img = h('img', { alt: alt || '', decoding: 'async' });
  const load = () => ctx.store.mediaURL(path).then((u) => { img.src = u; }).catch(() => { img.replaceWith(h('div', { class: 'tile' }, h('span', { class: 'tile-name' }, 'Picture not found'))); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '300px' });
    queueMicrotask(() => io.observe(img));
  } else load();
  return img;
}

function tileFor(r) {
  const info = r.url ? parseLink(r.url) : null;
  const name = info ? info.name : r.driveUrl ? 'Video in Google Drive' : 'Reference';
  return h('div', { class: `tile${r.kind === 'video' ? ' ox' : ''}` },
    h('span', { class: 'tile-platform' }, platformName(r.platform)),
    h('span', { class: 'tile-name' }, name));
}

function mediaFor(ctx, r, { large = false } = {}) {
  if (r.image) return lazyImage(ctx, r.image, r.like);
  const info = r.url ? parseLink(r.url) : null;
  if (info && info.thumb) return h('img', { src: info.thumb, alt: r.like || '', loading: 'lazy', referrerpolicy: 'no-referrer' });
  return tileFor(r);
}

const KIND = { link: ['link', 'Link'], image: ['image', 'Picture'], video: ['video', 'Video'] };

function refCard(ctx, r) {
  const [ic, label] = KIND[r.kind] || KIND.link;
  const meta = [ctx.seriesName(r.series), ...(r.tags || []).slice(0, 3).map((t) => '#' + t)].filter(Boolean);
  return h('button', { class: 'ref panel', type: 'button', onclick: () => openDetail(ctx, r) },
    h('div', { class: 'ref-media' }, mediaFor(ctx, r), h('span', { class: 'ref-kind' }, icon(ic), label)),
    h('div', { class: 'ref-body' },
      h('div', { class: `ref-like${r.like ? '' : ' none'}` }, r.like || 'No note yet'),
      h('div', { class: 'ref-meta' }, platformName(r.platform), meta.length ? ' · ' + meta.join(' · ') : '')));
}

// ---------- detail ----------
function openDetail(ctx, r) {
  const media = h('div', { class: 'ref-detail-media' }, mediaFor(ctx, r, { large: true }));
  const actions = h('div', { class: 'chips', style: 'margin-bottom:6px' });
  if (r.url) actions.append(h('a', { class: 'btn small', href: r.url, target: '_blank', rel: 'noopener noreferrer' }, icon('external'), `Open on ${platformName(parseLink(r.url)?.platform || r.platform)}`));
  if (r.driveUrl) actions.append(h('a', { class: 'btn small', href: r.driveUrl, target: '_blank', rel: 'noopener noreferrer' }, icon('drive'), 'Open in Google Drive'));
  if (r.clip) {
    const play = h('button', { class: 'btn small', type: 'button' }, icon('play'), 'Play clip');
    play.addEventListener('click', async () => {
      play.disabled = true; play.textContent = 'Loading clip…';
      try {
        const url = await ctx.store.mediaURL(r.clip);
        media.replaceChildren(h('video', { src: url, controls: true, playsinline: true, autoplay: true }));
        play.remove();
      } catch (err) { ctx.fail(err); play.disabled = false; play.textContent = 'Play clip'; }
    });
    actions.append(play);
  }

  const body = h('div', {},
    media, actions,
    h('p', { style: 'margin:12px 0 0;font-size:16px;white-space:pre-wrap' }, r.like || h('span', { style: 'color:var(--muted)' }, 'No note on what you like about it yet.')),
    h('dl', { class: 'kv' },
      h('dt', {}, 'Platform'), h('dd', {}, platformName(r.platform)),
      h('dt', {}, 'Series'), h('dd', {}, ctx.seriesName(r.series) || '—'),
      h('dt', {}, 'Tags'), h('dd', {}, (r.tags || []).length ? r.tags.join(', ') : '—'),
      h('dt', {}, 'Added'), h('dd', {}, relDate(r.createdAt)),
      r.url ? [h('dt', {}, 'Link'), h('dd', { style: 'font-size:13px;color:var(--muted)' }, r.url)] : null,
    ),
    r.agentNote ? h('div', { class: 'notice' }, icon('info'), h('div', {}, h('strong', {}, 'The agent\'s notes: '), r.agentNote)) : null,
  );

  const canWrite = ctx.store.canWrite;
  const edit = canWrite ? h('button', { class: 'btn primary', type: 'button' }, icon('edit'), 'Edit') : null;
  const del = canWrite ? h('button', { class: 'btn quiet danger left', type: 'button' }, 'Delete') : null;
  const sheet = openSheet({ title: r.like ? 'Reference' : `${platformName(r.platform)} reference`, body, foot: canWrite ? [del, edit] : null });

  if (edit) edit.addEventListener('click', () => { sheet.close(); openAdd(ctx, { existing: r }); });
  if (del) del.addEventListener('click', async () => {
    const ok = await confirmSheet({ title: 'Delete this reference?', text: 'The reference and its picture or clip are removed from the data repository.' });
    if (!ok) return;
    try {
      await ctx.store.deleteItem('references', r, `Delete reference: ${r.like ? r.like.slice(0, 50) : r.id}`);
      for (const f of [r.image, r.clip].filter(Boolean)) await ctx.store.deleteFile(f, `Delete media for reference ${r.id}`).catch(() => {});
      sheet.close(); toast('Reference deleted.'); ctx.refresh();
    } catch { /* sync bar */ }
  });
}

// ---------- add / edit ----------
function openAdd(ctx, { text, existing } = {}) {
  const r = existing ? { ...existing } : null;
  let kind = r ? r.kind : 'link';
  let picture = null;      // { blob, width, height } after compression
  let clipFile = null;

  const seg = h('div', { class: 'segmented full', role: 'tablist', 'aria-label': 'What are you adding?' });
  const kinds = [['link', 'Link'], ['image', 'Picture'], ['video', 'Video']];

  const url = h('input', { type: 'url', inputmode: 'url', placeholder: 'Paste an Instagram, TikTok or YouTube link', value: r?.url || '' });
  const linkInfo = h('p', { class: 'hint' });
  const paste = 'clipboard' in navigator && navigator.clipboard.readText
    ? h('button', { class: 'btn small', type: 'button', onclick: async () => {
      try { const t = await navigator.clipboard.readText(); const info = parseLink(t); url.value = info ? info.url : t.trim(); onUrl(); }
      catch { toast('Couldn\'t read the clipboard. Long-press the box and paste.', { error: true }); }
    } }, 'Paste') : null;

  const drive = h('input', { type: 'url', inputmode: 'url', placeholder: 'https://drive.google.com/…', value: r?.driveUrl || '' });

  // Picture picker (also used for an optional screenshot of a link)
  const picInput = h('input', { type: 'file', accept: 'image/*' });
  const picPreview = h('div', {});
  const picLabel = h('label', { class: 'drop' }, picInput, picPreview);
  const picProgress = h('div', { class: 'progress', 'aria-live': 'polite' });
  const resetPic = () => picPreview.replaceChildren(icon('image'), h('strong', {}, kind === 'link' ? 'Add a screenshot (optional)' : 'Choose a picture'), h('span', {}, 'From your camera roll or the camera'));
  picInput.addEventListener('change', async () => {
    const file = picInput.files && picInput.files[0];
    if (!file) return;
    picProgress.textContent = `Shrinking ${formatBytes(file.size)}…`;
    try {
      picture = await compressImage(file);
      const u = URL.createObjectURL(picture.blob);
      picPreview.replaceChildren(h('img', { src: u, alt: 'Chosen picture' }));
      picProgress.textContent = `Ready: ${picture.width} x ${picture.height}, ${formatBytes(picture.blob.size)} (was ${formatBytes(file.size)}).`;
    } catch (err) {
      picture = null; resetPic();
      picProgress.textContent = err.message;
    }
  });

  // Small clip picker
  const clipInput = h('input', { type: 'file', accept: 'video/*' });
  const clipInfo = h('p', { class: 'hint' }, 'Under 20 MB only (a few seconds of phone video). Anything bigger: upload it to Google Drive and paste the link above.');
  clipInput.addEventListener('change', () => {
    const f = clipInput.files && clipInput.files[0];
    clipFile = null;
    if (!f) return;
    if (f.size > CLIP_LIMIT) {
      clipInfo.textContent = `This clip is ${formatBytes(f.size)}, too big for the hub. Upload it to Google Drive (Rayana Social folder) and paste the share link above.`;
      clipInput.value = '';
      return;
    }
    clipFile = f;
    clipInfo.textContent = `Ready: ${f.name}, ${formatBytes(f.size)}.`;
  });

  const platform = chipPicker(PLATFORM_CHOICES, r?.platform || 'instagram', { label: 'Platform' });
  const series = select([{ id: '', name: 'No series' }, ...ctx.series.map((s) => ({ id: s.id, name: s.name }))], r?.series || '');
  const like = h('textarea', { placeholder: 'The cover text, the first two seconds, the light, how they ask the question…' }, r?.like || '');
  const tags = h('input', { type: 'text', placeholder: 'cover, close-up, hook', value: (r?.tags || []).join(', '), autocapitalize: 'none' });
  const progress = h('div', { class: 'progress', 'aria-live': 'polite' });

  function onUrl() {
    const info = parseLink(url.value);
    linkInfo.textContent = info ? `${platformName(info.platform)}${info.platform === 'any' ? '' : ': ' + info.name}` : url.value ? 'That doesn\'t look like a link yet.' : '';
    if (info && info.platform !== 'any' && !existing) platform.set(info.platform);
  }
  url.addEventListener('input', onUrl);

  const linkFields = h('div', {}, h('div', { class: 'field' },
    h('div', { style: 'display:flex;align-items:center;justify-content:space-between' }, h('label', { for: url.id = 'u' + Math.random().toString(36).slice(2, 6) }, 'Link'), paste), url, linkInfo));
  const pictureFields = h('div', { class: 'field', style: 'position:relative' }, picLabel, picProgress);
  const videoFields = h('div', {},
    field('Google Drive link', drive, 'For big videos. In Drive: Share, then Copy link.'),
    h('div', { class: 'field' }, h('label', { for: clipInput.id = 'c' + Math.random().toString(36).slice(2, 6) }, 'Or upload a small clip'), clipInput, clipInfo));

  const layout = () => {
    seg.replaceChildren(...kinds.map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': kind === id ? 'true' : 'false',
      disabled: Boolean(existing) && kind !== id, onclick: () => { kind = id; layout(); } }, label)));
    linkFields.hidden = kind !== 'link' && !(existing && r.url);
    videoFields.hidden = kind !== 'video' || Boolean(existing && r.clip);
    pictureFields.hidden = Boolean(existing) || kind === 'video';
    if (!picture) resetPic();
  };

  const body = h('div', {},
    existing ? null : h('div', { style: 'margin-bottom:16px' }, seg),
    linkFields, pictureFields, videoFields,
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Platform'), platform.el),
    field('Series', series),
    field('What I like about it', like),
    field('Tags', tags, 'Separate with commas.'),
  );
  layout();

  if (text) { const info = parseLink(text); url.value = info ? info.url : ''; onUrl(); }
  else if (r?.url) onUrl();

  const save = h('button', { class: 'btn primary', type: 'button' }, existing ? 'Save' : 'Add reference');
  const sheet = openSheet({ title: existing ? 'Edit reference' : 'Add a reference', body, foot: [progress, save] });
  progress.style.marginRight = 'auto';

  save.addEventListener('click', async () => {
    const info = parseLink(url.value);
    const tagList = tags.value.split(',').map((t) => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean);
    if (kind === 'link' && !info) { toast('Paste a link first.', { error: true }); url.focus(); return; }
    if (kind === 'image' && !picture && !existing) { toast('Choose a picture first.', { error: true }); return; }
    if (kind === 'video' && !existing && !clipFile && !parseLink(drive.value)) { toast('Paste a Google Drive link or choose a small clip.', { error: true }); return; }

    const id = r?.id || makeId(like.value || (info && info.name) || kind);
    const item = {
      ...(r || {}),
      id, kind,
      url: info ? info.url : (r?.url || ''),
      driveUrl: drive.value.trim(),
      platform: platform.value(),
      series: series.value,
      like: like.value.trim(),
      tags: tagList,
      status: r?.status || 'new',
      agentNote: r?.agentNote || '',
      createdAt: r?.createdAt || new Date().toISOString(),
      createdBy: r?.createdBy || 'oran',
    };
    save.disabled = true;
    try {
      if (picture && !existing) {
        progress.textContent = 'Uploading picture…';
        item.image = `media/references/${id}.jpg`;
        await ctx.store.uploadBlob(item.image, picture.blob, `Add picture for reference ${id}`);
      }
      if (clipFile && !existing) {
        progress.textContent = `Uploading clip (${formatBytes(clipFile.size)})…`;
        const ext = (clipFile.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
        item.clip = `media/clips/${id}.${ext}`;
        await ctx.store.uploadBlob(item.clip, clipFile, `Add clip for reference ${id}`);
      }
      progress.textContent = 'Saving…';
      await ctx.store.saveItem('references', item, `${existing ? 'Update' : 'Add'} reference: ${item.like ? item.like.slice(0, 60) : (info ? info.name : kind)}`);
      sheet.close();
      toast(existing ? 'Reference saved.' : 'Reference added.');
      ctx.refresh();
    } catch {
      progress.textContent = '';
      save.disabled = false;
    }
  });
}
