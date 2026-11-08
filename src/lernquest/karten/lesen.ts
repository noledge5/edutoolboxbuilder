// Reads answer cards in a camera picture (grey values, one byte per pixel). Pure, so it runs the same in tests:
// dark areas are found with a local threshold, each one large enough becomes a four-cornered candidate, and its
// 6 × 6 cells are read through the perspective of those corners. Only a black border with a known pattern inside
// counts (code.ts), so letters, faces and shadows are never taken for a card.
import { ANTWORTEN, erkennen, RASTER, type Antwort } from './code';

export type Punkt = [number, number];

export interface Treffer {
  nummer: number;
  antwort: Antwort;
  /** Corners of the card's square in the picture, as printed: top left, top right, bottom right, bottom left. */
  ecken: [Punkt, Punkt, Punkt, Punkt];
}

/** Smallest side of a card's square in pixels that is still tried (about 2 pixels per cell). */
const MIN_SEITE = 14;
/** A pixel is dark when it is this much darker than its surroundings. */
const DUNKLER = 0.18;
/** Lightest pattern cell against the mean of the border: less is not a printed card. */
const KONTRAST = 40;
/** Share of the contrast around the threshold in which a cell counts as unclear. */
const UNKLAR = 0.05;

/** Square of side 1 onto the four corners (Heckbert's projective mapping). */
function abbildung(p: Punkt[]): (u: number, v: number) => Punkt {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    [a, b, c, d, e, f, g, h] = [x1 - x0, x3 - x0, x0, y1 - y0, y3 - y0, y0, 0, 0];
  } else {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h * y3;
    f = y0;
  }
  return (u, v) => {
    const w = g * u + h * v + 1;
    return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
  };
}

const flaeche = (p: Punkt[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
};

/** The four of the extreme points that span the largest quadrilateral, clockwise on screen. */
function viereck(punkte: Punkt[]): Punkt[] | null {
  const pts = punkte.filter((p, i) => punkte.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === i);
  if (pts.length < 4) return null;
  let best: Punkt[] | null = null;
  let bestA = 0;
  for (let a = 0; a < pts.length; a++)
    for (let b = a + 1; b < pts.length; b++)
      for (let c = b + 1; c < pts.length; c++)
        for (let d = c + 1; d < pts.length; d++) {
          const q = [pts[a], pts[b], pts[c], pts[d]];
          const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
          const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
          q.sort((p1, p2) => Math.atan2(p1[1] - cy, p1[0] - cx) - Math.atan2(p2[1] - cy, p2[0] - cx));
          const A = flaeche(q);
          if (A > bestA) {
            bestA = A;
            best = q;
          }
        }
  return best;
}

/** Mean grey of a cell around (u, v) in card units (0 … 1), from 9 points. */
function zelle(grau: ArrayLike<number>, w: number, h: number, map: (u: number, v: number) => Punkt, u: number, v: number, r: number): number {
  let s = 0;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const [x, y] = map(u + i * r, v + j * r);
      const xi = Math.min(w - 1, Math.max(0, Math.round(x)));
      const yi = Math.min(h - 1, Math.max(0, Math.round(y)));
      s += grau[yi * w + xi];
    }
  return s / 9;
}

/** The card in a candidate quadrilateral (clockwise on screen), or null. */
function lesen(grau: ArrayLike<number>, w: number, h: number, q: Punkt[]): Treffer | null {
  const map = abbildung(q);
  const n = RASTER;
  const werte: number[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) werte.push(zelle(grau, w, h, map, (x + 0.5) / n, (y + 0.5) / n, 0.22 / n));
  const rand: number[] = [];
  const innen: number[] = [];
  werte.forEach((v, i) => {
    const x = i % n;
    const y = Math.floor(i / n);
    (x === 0 || y === 0 || x === n - 1 || y === n - 1 ? rand : innen).push(v);
  });
  const dunkel = rand.reduce((a, b) => a + b, 0) / rand.length;
  const hell = Math.max(...innen);
  if (hell - dunkel < KONTRAST) return null;
  const schwelle = (dunkel + hell) / 2;
  if (rand.some((v) => v >= schwelle)) return null;
  // A cell too close to the threshold (blur, a finger, glare) makes the card unread rather than misread.
  const band = (hell - dunkel) * UNKLAR;
  if (innen.some((v) => Math.abs(v - schwelle) < band)) return null;
  let code = 0;
  innen.forEach((v, i) => {
    if (v > schwelle) code |= 1 << i;
  });
  const karte = erkennen(code);
  if (!karte) return null;
  // The read grid is the upright card turned `drehung` quarters clockwise, so its top left corner sits there.
  const k = karte.drehung;
  const ecken = [q[k % 4], q[(k + 1) % 4], q[(k + 2) % 4], q[(k + 3) % 4]] as Treffer['ecken'];
  // The side highest up in the picture is the answer: A top, B right, C bottom, D left (as printed).
  const mitteY = [0, 1, 2, 3].map((s) => (ecken[s][1] + ecken[(s + 1) % 4][1]) / 2);
  const oben = mitteY.indexOf(Math.min(...mitteY));
  return { nummer: karte.nummer, antwort: ANTWORTEN[oben], ecken };
}

/** All cards in the picture; a card read twice with different answers counts as not read. */
export function kartenLesen(grau: ArrayLike<number>, w: number, h: number): Treffer[] {
  // Local mean over a window of about 1/16 of the width, from an integral image.
  const r = Math.max(8, Math.round(w / 32));
  const sum = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += grau[y * w + x];
      sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row;
    }
  }
  const dark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const s = sum[y1 * (w + 1) + x1] - sum[y0 * (w + 1) + x1] - sum[y1 * (w + 1) + x0] + sum[y0 * (w + 1) + x0];
      if (grau[y * w + x] * (x1 - x0) * (y1 - y0) < s * (1 - DUNKLER)) dark[y * w + x] = 1;
    }
  }

  // Connected dark areas (4-neighbours), two passes with union-find.
  const label = new Int32Array(w * h);
  const parent: number[] = [0];
  const find = (a: number) => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!dark[i]) continue;
      const up = y ? label[i - w] : 0;
      const left = x ? label[i - 1] : 0;
      if (!up && !left) {
        parent.push(parent.length);
        label[i] = parent.length - 1;
      } else if (up && left) {
        const a = find(up);
        const b = find(left);
        label[i] = Math.min(a, b);
        if (a !== b) parent[Math.max(a, b)] = Math.min(a, b);
      } else label[i] = up || left;
    }

  // Per area: bounding box and the extreme points in 8 directions (a square's corners are among them).
  const n = parent.length;
  const minX = new Int32Array(n).fill(w);
  const minY = new Int32Array(n).fill(h);
  const maxX = new Int32Array(n).fill(-1);
  const maxY = new Int32Array(n).fill(-1);
  const DIRS: Punkt[] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const best = new Float64Array(n * 8).fill(-Infinity);
  const bestAt = new Int32Array(n * 8);
  for (let i = 0; i < w * h; i++) {
    if (!label[i]) continue;
    const l = (label[i] = find(label[i]));
    const x = i % w;
    const y = (i - x) / w;
    if (x < minX[l]) minX[l] = x;
    if (x > maxX[l]) maxX[l] = x;
    if (y < minY[l]) minY[l] = y;
    if (y > maxY[l]) maxY[l] = y;
    for (let d = 0; d < 8; d++) {
      const v = DIRS[d][0] * x + DIRS[d][1] * y;
      if (v > best[l * 8 + d]) {
        best[l * 8 + d] = v;
        bestAt[l * 8 + d] = i;
      }
    }
  }

  const found = new Map<number, Treffer | null>();
  for (let l = 1; l < n; l++) {
    if (parent[l] !== l) continue;
    const bw = maxX[l] - minX[l] + 1;
    const bh = maxY[l] - minY[l] + 1;
    if (Math.min(bw, bh) < MIN_SEITE || Math.max(bw, bh) > 3 * Math.min(bw, bh)) continue;
    const ext: Punkt[] = [];
    for (let d = 0; d < 8; d++) {
      const i = bestAt[l * 8 + d];
      const x = i % w;
      ext.push([x + 0.5, (i - x) / w + 0.5]);
    }
    const q = viereck(ext);
    if (!q || flaeche(q) < 0.3 * bw * bh) continue;
    // The extreme points lie on the outer pixels; push the corners half a pixel outwards.
    const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
    const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    const qq = q.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      return [x + (dx / len) * 0.5, y + (dy / len) * 0.5] as Punkt;
    });
    const t = lesen(grau, w, h, qq);
    if (!t) continue;
    const had = found.get(t.nummer);
    if (had === undefined) found.set(t.nummer, t);
    else if (had && had.antwort !== t.antwort) found.set(t.nummer, null);
  }
  return [...found.values()].filter((t): t is Treffer => !!t).sort((a, b) => a.nummer - b.nummer);
}
