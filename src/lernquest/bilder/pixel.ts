// Pixel work for `npm run lq:bilder` on plain RGBA buffers (4 bytes per pixel), so it is testable without sharp:
// cut a flat background away, find the drawn area, place it on the canvas, recolour the skin of the base figure.
import type { Platz } from './vorlagen.ts';

export type Rgb = [number, number, number];

export const hexRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

const abstand = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** True when some pixels are see-through, so the picture was already cut out (e.g. with a background-removal node). */
export function hatTransparenz(px: Uint8Array, anteil = 0.01): boolean {
  let n = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) n++;
  return n > (px.length / 4) * anteil;
}

/** The most common colour along the border (rounded), i.e. the flat background the part was generated on. */
export function randFarbe(px: Uint8Array, w: number, h: number): Rgb {
  const zaehler = new Map<string, number>();
  const nimm = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    const k = [px[i] >> 3, px[i + 1] >> 3, px[i + 2] >> 3].join();
    zaehler.set(k, (zaehler.get(k) ?? 0) + 1);
  };
  for (let x = 0; x < w; x++) (nimm(x, 0), nimm(x, h - 1));
  for (let y = 0; y < h; y++) (nimm(0, y), nimm(w - 1, y));
  const [k] = [...zaehler.entries()].sort((a, b) => b[1] - a[1])[0];
  return k.split(',').map((v) => Number(v) * 8 + 4) as Rgb;
}

/** Cuts the flat background away: everything connected to the border that is close to the border colour becomes
 *  transparent; the pixels next to it fade out, so the edge stays soft. Changes `px` in place. Only reachable
 *  background goes, so a grey spot inside the part stays. */
export function freistellen(px: Uint8Array, w: number, h: number, toleranz = 36, loecher = false): void {
  const grund = randFarbe(px, w, h);
  const farbe = (p: number): Rgb => [px[p * 4], px[p * 4 + 1], px[p * 4 + 2]];
  const weg = new Uint8Array(w * h);
  const stapel: number[] = [];
  const pruefe = (p: number) => {
    if (!weg[p] && abstand(farbe(p), grund) <= toleranz) {
      weg[p] = 1;
      stapel.push(p);
    }
  };
  const fluten = () => {
    while (stapel.length) {
      const p = stapel.pop()!;
      const x = p % w;
      if (x > 0) pruefe(p - 1);
      if (x < w - 1) pruefe(p + 1);
      if (p >= w) pruefe(p - w);
      if (p < w * (h - 1)) pruefe(p + w);
    }
  };
  for (let x = 0; x < w; x++) (pruefe(x), pruefe((h - 1) * w + x));
  for (let y = 0; y < h; y++) (pruefe(y * w), pruefe(y * w + w - 1));
  fluten();
  // Enclosed background (between the legs, inside a handle): larger patches of the background colour go too, small
  // ones (a grey highlight) stay. Only on request, since a grey part could lose a grey area.
  if (loecher) {
    const mindestens = w * h * 0.001;
    const gesehen = new Uint8Array(w * h);
    for (let start = 0; start < w * h; start++) {
      if (weg[start] || gesehen[start] || abstand(farbe(start), grund) > toleranz) continue;
      const flaeche: number[] = [start];
      gesehen[start] = 1;
      for (let i = 0; i < flaeche.length; i++) {
        const p = flaeche[i];
        const x = p % w;
        for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
          if (q >= 0 && q < w * h && !weg[q] && !gesehen[q] && abstand(farbe(q), grund) <= toleranz) {
            gesehen[q] = 1;
            flaeche.push(q);
          }
      }
      if (flaeche.length >= mindestens) for (const p of flaeche) weg[p] = 1;
    }
  }
  for (let p = 0; p < w * h; p++) {
    if (weg[p]) {
      px[p * 4 + 3] = 0;
      continue;
    }
    const x = p % w;
    const amRand =
      (x > 0 && weg[p - 1]) || (x < w - 1 && weg[p + 1]) || (p >= w && weg[p - w]) || (p < w * (h - 1) && weg[p + w]);
    if (amRand) {
      const t = Math.min(1, Math.max(0, (abstand(farbe(p), grund) - toleranz) / toleranz));
      px[p * 4 + 3] = Math.round(px[p * 4 + 3] * (0.35 + 0.65 * t));
    }
  }
}

/** The box around everything visible (alpha above a threshold); undefined when the picture is empty. */
export function sichtbar(
  px: Uint8Array,
  w: number,
  h: number,
  schwelle = 16,
): { x: number; y: number; w: number; h: number } | undefined {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > schwelle) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? undefined : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Fine-tuning per part, in canvas units: `s` scales (1 = as the place says), `dx`/`dy` move. */
export interface Anpassung {
  s?: number;
  dx?: number;
  dy?: number;
}

/** Where a cut-out part of size w × h goes on the layer (pixels of a layer `groesse` wide): scaled to the place's
 *  width, or smaller so it keeps within the height, then anchored. */
export function einpassen(
  w: number,
  h: number,
  platz: Platz,
  groesse: number,
  a: Anpassung = {},
): { left: number; top: number; width: number; height: number } {
  const k = groesse / 240;
  const massstab = Math.min(platz.breite / w, platz.hoehe / h) * (a.s ?? 1);
  const width = Math.max(1, Math.round(w * massstab * k));
  const height = Math.max(1, Math.round(h * massstab * k));
  const x = (platz.x + (a.dx ?? 0)) * k;
  const y = (platz.y + (a.dy ?? 0)) * k;
  return {
    left: Math.round(x - width / 2),
    top: Math.round(platz.anker === 'unten' ? y - height : y - height / 2),
    width,
    height,
  };
}

/** The skin colour of the base figure: the median of a few known bare-skin points (canvas units). */
export function hautMessen(px: Uint8Array, groesse: number, punkte: [number, number][]): Rgb {
  const k = groesse / 240;
  const proben: Rgb[] = [];
  for (const [cx, cy] of punkte)
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const i = (Math.round(cy * k + dy) * groesse + Math.round(cx * k + dx)) * 4;
        if (px[i + 3] > 200) proben.push([px[i], px[i + 1], px[i + 2]]);
      }
  if (!proben.length) throw new Error('Keine Haut an den Messpunkten gefunden: Sitzt die Grundfigur wie die Vorlage?');
  const median = (c: 0 | 1 | 2) => proben.map((p) => p[c]).sort((a, b) => a - b)[proben.length >> 1];
  return [median(0), median(1), median(2)];
}

/** Whether a pixel is skin of tone `haut`: the same hue mix (shading allowed: darker or a bit lighter). */
export function istHaut(r: number, g: number, b: number, haut: Rgb): boolean {
  const s = r + g + b;
  const sh = haut[0] + haut[1] + haut[2];
  if (s < sh * 0.45 || s > sh * 1.2) return false;
  return (
    Math.abs(r / s - haut[0] / sh) < 0.035 &&
    Math.abs(g / s - haut[1] / sh) < 0.03 &&
    Math.abs(b / s - haut[2] / sh) < 0.035
  );
}

/** A copy of the base figure in another skin tone: skin pixels are scaled from the measured tone to `ziel`, so the
 *  painted shading stays. */
export function hautUmfaerben(px: Uint8Array, haut: Rgb, ziel: Rgb): Uint8Array {
  const out = new Uint8Array(px);
  const f = [ziel[0] / haut[0], ziel[1] / haut[1], ziel[2] / haut[2]];
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0 || !istHaut(out[i], out[i + 1], out[i + 2], haut)) continue;
    for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.round(out[i + c] * f[c]));
  }
  return out;
}
