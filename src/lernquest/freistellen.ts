// Cutting out a part's picture in the browser (no further service): the image model paints the part on a flat bright
// green (or a file comes with a white background); the background connected to the edge becomes transparent, a soft
// edge keeps the outline smooth, and green spill on the edge is taken out. Inner areas of the same colour stay.

export type Grund = 'gruen' | 'weiss' | 'keiner';

/** How much a pixel looks like the background: 0 (not at all) … 255. */
function aehnlich(grund: Grund, r: number, g: number, b: number): number {
  if (grund === 'gruen') return Math.max(0, g - Math.max(r, b));
  // Only near-white: light grey (hair in grey shades) must stay.
  if (grund === 'weiss') return Math.max(0, 255 - 8 * (255 - Math.min(r, g, b)));
  return 0;
}

/** The background from the four corners: transparent, green or white. */
export function grundVon(px: Uint8ClampedArray, w: number, h: number): Grund {
  const at = (x: number, y: number) => px.subarray((y * w + x) * 4, (y * w + x) * 4 + 4);
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  if (corners.every((c) => c[3] < 20)) return 'keiner';
  if (corners.filter((c) => c[1] - Math.max(c[0], c[2]) > 60).length >= 3) return 'gruen';
  if (corners.filter((c) => Math.min(c[0], c[1], c[2]) > 225).length >= 3) return 'weiss';
  return 'keiner';
}

/**
 * Makes the background transparent in place. `rand` 0…1: how much of the edge is taken (0 keeps more, 1 cuts harder).
 * Only background connected to the picture's edge goes, so a green leaf or a white eye inside the part stays; with
 * `innen` also enclosed areas (the face opening of a hairstyle).
 */
export function freistellen(px: Uint8ClampedArray, w: number, h: number, grund: Grund, rand = 0.5, innen = false): void {
  if (grund === 'keiner') return;
  const lo = 90 - 70 * rand;
  const hi = lo + 60;
  const n = w * h;
  const d = new Uint8Array(n);
  for (let i = 0; i < n; i++) d[i] = aehnlich(grund, px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
  // Flood from the edge through background-like pixels.
  const seen = new Uint8Array(n);
  if (innen) for (let i = 0; i < n; i++) seen[i] = d[i] >= lo ? 1 : 0;
  const stack: number[] = [];
  const push = (i: number) => {
    if (!seen[i] && d[i] >= lo) {
      seen[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) push(x), push((h - 1) * w + x);
  for (let y = 0; y < h; y++) push(y * w), push(y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < n - w) push(i + w);
  }
  for (let i = 0; i < n; i++) {
    if (!seen[i]) continue;
    const keep = d[i] >= hi ? 0 : (hi - d[i]) / (hi - lo);
    px[i * 4 + 3] = Math.round(px[i * 4 + 3] * keep);
    if (grund === 'gruen') px[i * 4 + 1] = Math.min(px[i * 4 + 1], Math.max(px[i * 4], px[i * 4 + 2]));
  }
  // Green spill right next to the cut: pixels touching a removed one lose their green cast.
  if (grund === 'gruen')
    for (let i = 0; i < n; i++) {
      if (seen[i]) continue;
      const x = i % w;
      const near = (x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (i >= w && seen[i - w]) || (i < n - w && seen[i + w]);
      if (near) px[i * 4 + 1] = Math.min(px[i * 4 + 1], Math.max(px[i * 4], px[i * 4 + 2]) + 20);
    }
}

/** The box of everything not transparent, or null when nothing is left. */
export function inhalt(px: Uint8ClampedArray, w: number, h: number): { x: number; y: number; w: number; h: number } | null {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Side of the stored picture: a square, the part centred in it. */
export const BILD_SEITE = 512;

/**
 * A picture (file or data URL) cut out and stored as a transparent WebP data URL of 512 × 512, the part centred and
 * filling the square. Re-drawing it also drops anything but pixels (no metadata, no scripts).
 */
export async function bildFreistellen(quelle: Blob, grund: Grund | 'auto' = 'auto', rand = 0.5, innen = false): Promise<{ url: string; grund: Grund }> {
  const bitmap = await createImageBitmap(quelle);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const data = ctx.getImageData(0, 0, w, h);
  const g = grund === 'auto' ? grundVon(data.data, w, h) : grund;
  freistellen(data.data, w, h, g, rand, innen);
  ctx.putImageData(data, 0, 0);
  const box = inhalt(data.data, w, h) ?? { x: 0, y: 0, w, h };
  const out = document.createElement('canvas');
  out.width = out.height = BILD_SEITE;
  const pad = 8;
  const f = Math.min((BILD_SEITE - 2 * pad) / box.w, (BILD_SEITE - 2 * pad) / box.h);
  const dw = box.w * f;
  const dh = box.h * f;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(c, box.x, box.y, box.w, box.h, (BILD_SEITE - dw) / 2, (BILD_SEITE - dh) / 2, dw, dh);
  // WebP at falling quality until it fits the server's limit.
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const url = out.toDataURL('image/webp', q);
    if (!url.startsWith('data:image/webp')) throw new Error('Dieser Browser kann keine WebP-Bilder speichern.');
    if (url.length <= 190_000) return { url, grund: g };
  }
  throw new Error('Das Bild ist zu groß, auch stark verkleinert.');
}
