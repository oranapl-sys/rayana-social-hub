// Shrinks a phone photo in the browser before it goes to GitHub:
// a JPEG of at most 2048 px on the long edge, stepped down until it is under ~1.8 MB.

async function decode(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

const toBlob = (canvas, quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

export async function compressImage(file, { maxEdge = 2048, targetBytes = 1.8 * 1024 * 1024 } = {}) {
  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("This picture can't be opened here. Try a JPEG or PNG (on iPhone, a screenshot works).");
  }
  const w0 = source.width, h0 = source.height;
  let edge = Math.min(maxEdge, Math.max(w0, h0));
  let quality = 0.85;
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = Math.min(1, edge / Math.max(w0, h0));
    const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    const blob = await toBlob(canvas, quality);
    if (blob && (blob.size <= targetBytes || attempt === 7)) {
      if (source.close) source.close();
      return { blob, width: w, height: h };
    }
    if (quality > 0.66) quality -= 0.1; else edge = Math.round(edge * 0.8);
  }
  throw new Error('Could not shrink this picture.');
}

export const formatBytes = (n) => n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
