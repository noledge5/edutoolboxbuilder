// The layer steps shared by `npm run lq:bilder` and the upload on the teacher page (ebene.ts): only the scaling
// differs (sharp there, canvas here). This compares the script's way (sharp) with a plain area-average scaling like
// the browser's, so both give the same layer up to the scaling itself.
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { editEbene, einzelEbene, kleidungEditMaske, rechteckMaske, type Roh, type Skalieren } from './ebene';
import { EBENE_GROESSE as G, HINTERGRUND_FARBE, PLAETZE } from './vorlagen';
import { hexRgb, sichtbar } from './pixel';

const GRAU = hexRgb(HINTERGRUND_FARBE);

/** A square picture on grey with a filled ellipse (a "hat"), like a raw picture from ComfyUI. */
function hut(n = 512): Roh {
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4;
      const drin = ((x - n * 0.5) / (n * 0.3)) ** 2 + ((y - n * 0.55) / (n * 0.18)) ** 2 <= 1;
      data.set(drin ? [180, 40 + (x % 40), 30, 255] : [...GRAU, 255], i);
    }
  return { data, w: n, h: n };
}

const mitSharp: Skalieren = async (r, box, w, h) =>
  new Uint8Array(
    await sharp(Buffer.from(r.data), { raw: { width: r.w, height: r.h, channels: 4 } })
      .extract({ left: box.x, top: box.y, width: box.w, height: box.h })
      .resize(w, h)
      .raw()
      .toBuffer(),
  );

/** Area average with premultiplied alpha, as a canvas scales down. */
const wieCanvas: Skalieren = (r, box, w, h) => {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const x0 = box.x + Math.floor((x * box.w) / w);
      const x1 = Math.max(x0 + 1, box.x + Math.floor(((x + 1) * box.w) / w));
      const y0 = box.y + Math.floor((y * box.h) / h);
      const y1 = Math.max(y0 + 1, box.y + Math.floor(((y + 1) * box.h) / h));
      const s = [0, 0, 0, 0];
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * r.w + xx) * 4;
          const a = r.data[i + 3];
          for (let c = 0; c < 3; c++) s[c] += r.data[i + c] * a;
          s[3] += a;
        }
      const n = (x1 - x0) * (y1 - y0);
      const o = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = s[3] ? Math.round(s[c] / s[3]) : 0;
      out[o + 3] = Math.round(s[3] / n);
    }
  return out;
};

const kopie = (r: Roh): Roh => ({ ...r, data: new Uint8Array(r.data) });

describe('Ebene aus einem Bild (Skript und Lehrerseite)', () => {
  it('places a part made on its own the same way with sharp and with canvas-like scaling', async () => {
    const a = await einzelEbene(kopie(hut()), 'kopf', { s: 1.1, dy: 6 }, mitSharp);
    const b = await einzelEbene(kopie(hut()), 'kopf', { s: 1.1, dy: 6 }, wieCanvas);
    const ba = sichtbar(a.data, G, G)!;
    const bb = sichtbar(b.data, G, G)!;
    for (const k of ['x', 'y', 'w', 'h'] as const) expect(Math.abs(ba[k] - bb[k]), k).toBeLessThanOrEqual(2);
    // Same coverage: pixels solid in one and empty in the other only along the edge.
    let anders = 0;
    let voll = 0;
    for (let p = 0; p < G * G; p++) {
      if (a.data[p * 4 + 3] > 128) voll++;
      if (a.data[p * 4 + 3] > 128 !== b.data[p * 4 + 3] > 128) anders++;
    }
    expect(anders / voll).toBeLessThan(0.03);
    // The hat sits where the place says: bottom middle at (120, 84 + 6) canvas units.
    expect(Math.abs(ba.x + ba.w / 2 - 240)).toBeLessThanOrEqual(2);
    expect(Math.abs(ba.y + ba.h - (PLAETZE.kopf.y + 6) * 2)).toBeLessThanOrEqual(2);
  });

  it('keeps a part that reaches over the edge, clipped to the layer', async () => {
    const e = await einzelEbene(kopie(hut()), 'werkzeug', { dx: 80 }, wieCanvas);
    const b = sichtbar(e.data, G, G)!;
    expect(b.x + b.w).toBe(G);
  });

  it('refuses a part moved off the layer', async () => {
    await expect(einzelEbene(kopie(hut()), 'kopf', { dx: 400 }, wieCanvas)).rejects.toThrow(/außerhalb/);
  });

  it('takes from an edit only what changed, clothes off the hands', () => {
    const basis = new Uint8Array(G * G * 4);
    for (let p = 0; p < G * G; p++) basis.set([...GRAU, 255], p * 4);
    // A figure: a skin-coloured block in the middle.
    for (let y = 120; y < 440; y++) for (let x = 150; x < 330; x++) basis.set([230, 180, 150, 255], (y * G + x) * 4);
    const bild = new Uint8Array(basis);
    // A blue shirt on the torso, a blue spot on a hand (y 370, x 156) and a change outside the area (top left).
    for (let y = 260; y < 400; y++) for (let x = 170; x < 310; x++) bild.set([40, 80, 200, 255], (y * G + x) * 4);
    for (let y = 360; y < 380; y++) for (let x = 140; x < 160; x++) bild.set([40, 80, 200, 255], (y * G + x) * 4);
    for (let y = 10; y < 40; y++) for (let x = 10; x < 40; x++) bild.set([0, 0, 0, 255], (y * G + x) * 4);
    const { ebene, dx, dy } = editEbene(basis, bild, 'kleidung');
    expect([dx, dy]).toEqual([0, 0]);
    const a = (x: number, y: number) => ebene.data[(y * G + x) * 4 + 3];
    expect(a(240, 300)).toBe(255);
    expect(a(20, 20)).toBe(0);
    expect(a(250, 200)).toBe(0); // unchanged face
    expect(kleidungEditMaske()[370 * G + 145]).toBeLessThan(255);
  });

  it('draws rounded masks with a soft edge', () => {
    const m = rechteckMaske([{ x: 40, y: 40, width: 160, height: 160, rx: 20 }]);
    expect(m[240 * G + 240]).toBe(255);
    expect(m[10 * G + 10]).toBe(0);
    // The corner is rounded: the very corner point is outside.
    expect(m[81 * G + 81]).toBeLessThan(64);
    // The edge fades over a few pixels.
    expect(m[240 * G + 80]).toBeGreaterThan(0);
    expect(m[240 * G + 80]).toBeLessThan(255);
  });
});
