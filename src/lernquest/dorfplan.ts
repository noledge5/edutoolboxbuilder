// Layout of the class village map, Richtung A „Schlängelweg im Hochformat“ (decided 25.11.2026,
// docs/plan-klassendorf-haeuser.md): the square with the six community buildings at the bottom, a road that winds
// upwards, the children's plots alternately left and right of it and a small square after every six plots. The map
// only grows upwards, so it fits a phone at any class size. Pure geometry in screen units of the iso kit
// (figuren/iso.tsx with origin 0, 0: x to the right, y down, on the ground), no drawing.
import type { GebaeudeId } from './dorf';

export type Pt = [number, number];
const K = 0.866;
/** Screen point of the world point (x, y) on the ground (the projection of iso.tsx). */
export const schirm = (x: number, y: number): Pt => [(x - y) * K, (x + y) * 0.5];
/** World point on the ground under the screen point (sx, sy). */
export const welt = (sx: number, sy: number): Pt => [sy + sx / (2 * K), sy - sx / (2 * K)];

/** Side of a plot (world units). */
export const GRUND = 64;
/** Half width and half height of a plot on screen. */
export const GRUND_HALB: Pt = [GRUND * K, GRUND / 2];
/** Width of the map on screen (viewBox); on a phone about one unit per pixel. */
export const KARTE_BREITE = 330;
/** Plots between two small squares. */
export const JE_VIERTEL = 6;
/** Half width of the road on screen. */
export const WEG_HALB = 20;
/** Where the road leaves the square (screen y); everything below belongs to the square. */
export const WEG_START = -40;
const ABSTAND = 46;
const VERSATZ = 80;
const SCHWUNG = 24;
const WELLE = 150;
const VIERTEL_LUECKE = 64;
const ERSTES = -150;
const ZELLE = 100;
const SPALT = 12;

/** A number of plots the map can show: 0 … 200. */
export const anzahl = (n: number) => (Number.isFinite(n) ? Math.min(200, Math.max(0, Math.floor(n))) : 0);

/** Centre of the road at height sy: straight on the square, then a gentle wave. */
export const wegX = (sy: number) => (sy >= WEG_START ? 0 : SCHWUNG * Math.sin((WEG_START - sy) / WELLE));

export interface Grundstueck {
  /** World corner of the plot (GRUND × GRUND). */
  x: number;
  y: number;
  /** Screen centre. */
  sx: number;
  sy: number;
  seite: -1 | 1;
  viertel: number;
}

/** The plots in order: alternately left and right of the road, going up; a gap for a small square every six. */
export function grundstuecke(n: number): Grundstueck[] {
  return Array.from({ length: anzahl(n) }, (_, i) => {
    const viertel = Math.floor(i / JE_VIERTEL);
    const sy = ERSTES - i * ABSTAND - viertel * VIERTEL_LUECKE;
    const seite: -1 | 1 = i % 2 ? 1 : -1;
    const sx = wegX(sy) + seite * VERSATZ;
    const [cx, cy] = welt(sx, sy);
    return { x: cx - GRUND / 2, y: cy - GRUND / 2, sx, sy, seite, viertel };
  });
}

/** Whether the screen point lies on the plot (its diamond), grown by `rand`. */
export const aufGrund = (g: Grundstueck, p: Pt, rand = 0) =>
  Math.abs(p[0] - g.sx) / (GRUND_HALB[0] + rand) + Math.abs(p[1] - g.sy) / (GRUND_HALB[1] + rand * 0.6) <= 1;

/** The community buildings' cells (100 × 100 world): two columns, back row first, the low ones in front. */
const ZELLEN: Record<GebaeudeId, Pt> = {
  bibliothek: [-1, 0],
  sternwarte: [1, 0],
  festwiese: [-1, 1],
  baeckerei: [1, 1],
  brunnen: [-1, 2],
  bruecke: [1, 2],
};
const ZELLE_X = ZELLE * K + SPALT;
/** Screen centre and world corner of each cell. */
export const GEBAEUDE_ORT = Object.fromEntries(
  Object.entries(ZELLEN).map(([id, [s, r]]) => {
    const sx = s * ZELLE_X;
    const sy = r * ZELLE;
    const [cx, cy] = welt(sx, sy);
    return [id, { sx, sy, x: cx - ZELLE / 2, y: cy - ZELLE / 2 }];
  }),
) as Record<GebaeudeId, { sx: number; sy: number; x: number; y: number }>;
/** Market stalls between the rows (from Marktflecken on), chickens at the front edge. */
export const STAENDE: Pt[] = [
  [0, 50],
  [0, 150],
];
export const HUEHNER: Pt[] = [
  [-16, 258],
  [18, 266],
  [-4, 92],
];
/** Lowest point of the square (screen y). */
const PLATZ_UNTEN = 2 * ZELLE + ZELLE / 2;

/** The city wall (Stadt): two gate towers left and right of the road with a gate between, walls along the world axes
 *  to a corner tower each and on to the edge of the map. Screen points. */
export const MAUER = (() => {
  const torL: Pt = [-36, -22];
  const torR: Pt = [36, -22];
  const eckeL: Pt = [torL[0] - 100 * K, torL[1] - 50];
  const eckeR: Pt = [torR[0] + 100 * K, torR[1] - 50];
  const weit = (KARTE_BREITE / 2 + 30 - (-eckeL[0])) / K;
  const endeL: Pt = [eckeL[0] - weit * K, eckeL[1] + weit * 0.5];
  const endeR: Pt = [eckeR[0] + weit * K, eckeR[1] + weit * 0.5];
  return { torL, torR, eckeL, eckeR, endeL, endeR };
})();

/** Centres of the small squares between two quarters (only where plots follow). */
export function plaetzchen(n: number): Pt[] {
  const g = grundstuecke(n);
  const out: Pt[] = [];
  for (let v = 1; v * JE_VIERTEL < g.length; v++) {
    const sy = (g[v * JE_VIERTEL - 1].sy + g[v * JE_VIERTEL].sy) / 2;
    out.push([wegX(sy), sy]);
  }
  return out;
}

/** Where the road ends (screen y): a little above the last plot. */
export const wegEnde = (n: number) => {
  const g = grundstuecke(n);
  return (g.length ? g[g.length - 1].sy : ERSTES + 40) - 70;
};

/** The road's centre line from the square up to its end. */
export function wegPunkte(n: number): Pt[] {
  const ende = wegEnde(n);
  const pts: Pt[] = [];
  for (let sy = 10; sy > ende; sy -= 8) pts.push([wegX(sy), sy]);
  pts.push([wegX(ende), ende]);
  return pts;
}

/** Lanterns along the road (from Dorf on): at every second plot, on the other side of the road. */
export function laternen(n: number): Pt[] {
  return grundstuecke(n)
    .filter((_, i) => i % 2 === 0)
    .map((g) => [wegX(g.sy) - g.seite * (WEG_HALB + 12), g.sy] as Pt);
}

const hash = (a: number, b: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** The island: top and bottom (screen y), its centre and half width at a height (rounded ends). */
export function insel(n: number) {
  const oben = wegEnde(n) - 90;
  const unten = PLATZ_UNTEN + 40;
  const R = 70;
  const halb = (sy: number) => {
    const d = Math.min(sy - oben, unten - sy);
    if (d < 0) return 0;
    const breit = sy > WEG_START - 30 ? 212 : 172 + 12 * Math.sin(sy / 85 + 1);
    return d < R ? breit * Math.sqrt(1 - (1 - d / R) ** 2) : breit;
  };
  const mitte = (sy: number) => (sy > WEG_START - 30 ? 0 : wegX(sy) * 0.6);
  const auf = (p: Pt, rand = 0) => Math.abs(p[0] - mitte(p[1])) <= halb(p[1]) - rand;
  const umriss: Pt[] = [];
  for (let sy = oben; sy <= unten; sy += 6) umriss.push([mitte(sy) + halb(sy), sy]);
  for (let sy = unten; sy >= oben; sy -= 6) umriss.push([mitte(sy) - halb(sy), sy]);
  return { oben, unten, halb, mitte, auf, umriss };
}

/** The visible part of the map (viewBox): the full width, from above the island to below it. */
export function rahmen(n: number): [number, number, number, number] {
  const i = insel(n);
  const y = Math.floor(i.oben - 40);
  return [-KARTE_BREITE / 2, y, KARTE_BREITE, Math.ceil(i.unten + 34 - y)];
}

export type DekoArt = 'baum' | 'busch' | 'blume' | 'stein';
/** Trees, bushes, flowers and stones on free ground, always the same for the same number of plots. Trees never stand
 *  right in front of a house, so they hide none. */
export function deko(n: number): { art: DekoArt; p: Pt; k: number }[] {
  const g = grundstuecke(n);
  const i = insel(n);
  const ende = wegEnde(n);
  const klein = plaetzchen(n);
  const lat = laternen(n);
  const out: { art: DekoArt; p: Pt; k: number }[] = [];
  const S = 22;
  for (let gy = Math.ceil(i.oben / S); gy * S < WEG_START - 60; gy++)
    for (let gx = -9; gx <= 9; gx++) {
      const r = hash(gx, gy);
      if (r < 0.35) continue;
      const p: Pt = [gx * S + (hash(gy, gx) - 0.5) * 14, gy * S + (hash(gx + 7, gy) - 0.5) * 12];
      if (Math.abs(p[0]) > KARTE_BREITE / 2 + 10 || !i.auf(p, 12)) continue;
      if (p[1] > ende - 50 && Math.abs(p[0] - wegX(p[1])) < WEG_HALB + 14) continue;
      if (Math.hypot(p[0] - wegX(ende), (p[1] - ende) * 1.6) < 46) continue;
      if (g.some((x) => aufGrund(x, p, 8))) continue;
      if (klein.some((q) => Math.hypot(p[0] - q[0], (p[1] - q[1]) * 1.6) < 70)) continue;
      if (lat.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 14)) continue;
      const art: DekoArt = r > 0.86 ? 'baum' : r > 0.76 ? 'busch' : r > 0.45 ? 'blume' : 'stein';
      if (art === 'baum' || art === 'busch') {
        const verdeckt = g.some((x) => Math.abs(p[0] - x.sx) < GRUND_HALB[0] + 8 && p[1] > x.sy && p[1] - x.sy < 72);
        if (verdeckt) continue;
      }
      out.push({ art, p, k: 0.75 + hash(gx * 3, gy) * 0.4 });
    }
  return out;
}

/** Glints on the water around the island. */
export function wasser(n: number): Pt[] {
  const [x0, y0, w, h] = rahmen(n);
  const i = insel(n);
  const out: Pt[] = [];
  for (let k = 0; k < (w * h) / 2600; k++) {
    const p: Pt = [x0 + hash(k, 3) * w, y0 + hash(k, 11) * h];
    if (!i.auf(p, -14)) out.push(p);
  }
  return out;
}
