// The children's own houses in the class village (Klassendorf Teil B1, decided 25.11.2026): five stages from the tent
// to the tower house (HAUS_STUFEN in ../dorf.ts), each drawn into one plot of GRUND × GRUND at (x, y) with the parts of
// iso.tsx, so they match the village buildings. Stages grow in footprint, height and material.
// Häuser gestalten (25.11.2026): every house has a look (AUSSEHEN in ../dorf.ts): colours of roof, walls, door and
// flag, and on the free strips of the plot a fence (front edges), a garden (right) and one decoration (front).
import type { ReactNode } from "react";
import { aussehenVon, HAUS_STUFEN, type Aussehen } from "../dorf";
import { GRUND } from "../dorfplan";
import { baum, laterne, rauch, wimpel } from "./dorfdeko";
import type { GelaendeTeil } from "./gelaende";
import { BRUCH, HOLZ, isoStift, PUTZ, SCHIEFER, STROH, ZIEGEL, type DachTon, type Flaechen, type IsoStift, type Pt, type TuerTon } from "./iso";
import { P } from "./stil";

export { GRUND };

/** A look turned into colours and parts, ready to draw. */
export interface HausLook {
  dach: DachTon;
  holz: Flaechen;
  putz: Flaechen;
  tuer: TuerTon;
  fahne: string;
  zaun: number;
  garten: number;
  deko: number;
}

/** Colours by choice, in the order of AUSSEHEN (../dorf.ts). */
export const DACH_TOENE: DachTon[] = [
  ZIEGEL,
  STROH,
  SCHIEFER,
  { vorn: P.blatt, seite: P.blattTief, kante: P.gruenTief, licht: P.blattHell },
  { vorn: P.lila, seite: P.lilaTief, kante: P.tinteTief, licht: P.lilaHell },
  { vorn: P.gold, seite: P.goldTief, kante: P.holzTief, licht: P.goldHell },
];
export const HOLZ_TOENE: Flaechen[] = [
  HOLZ,
  { top: P.rot, links: P.rotTief, rechts: P.ziegelKante },
  { top: P.schieferHell, links: P.schiefer, rechts: P.schieferTief },
  { top: P.gruenHell, links: P.gruen, rechts: P.gruenTief },
  { top: P.gold, links: P.goldTief, rechts: P.holzTief },
  { top: P.lilaHell, links: P.lila, rechts: P.lilaTief },
];
export const PUTZ_TOENE: Flaechen[] = [
  PUTZ,
  { top: P.putzRosaHell, links: P.putzRosa, rechts: P.putzRosaTief },
  { top: P.putzBlauHell, links: P.putzBlau, rechts: P.putzBlauTief },
  { top: P.putzMintHell, links: P.putzMint, rechts: P.putzMintTief },
  { top: P.putzGelbHell, links: P.putzGelb, rechts: P.putzGelbTief },
  { top: P.putzLilaHell, links: P.putzLila, rechts: P.putzLilaTief },
];
export const TUER_TOENE: TuerTon[] = [
  { brett: P.leder, leiste: P.lederHell },
  { brett: P.rotTief, leiste: P.rot },
  { brett: P.blauTief, leiste: P.blau },
  { brett: P.gruenTief, leiste: P.gruenHell },
  { brett: P.goldTief, leiste: P.gold },
  { brett: P.lilaTief, leiste: P.lila },
];
export const FAHNEN_TOENE = [P.rot, P.blau, P.gold, P.gruenHell, P.lila, P.rosa];
/** The swatch shown for each colour choice in „Haus gestalten“ (the colour a child sees first). */
export const FARBMUSTER: Record<"dach" | "wand" | "tuer" | "fahne", string[]> = {
  dach: DACH_TOENE.map((d) => d.vorn),
  wand: HOLZ_TOENE.map((h, i) => (i === 0 ? P.holz : h.links)),
  tuer: TUER_TOENE.map((t) => t.brett),
  fahne: FAHNEN_TOENE,
};

export const hausLook = (a: Aussehen): HausLook => ({
  dach: DACH_TOENE[a.dach] ?? ZIEGEL,
  holz: HOLZ_TOENE[a.wand] ?? HOLZ,
  putz: PUTZ_TOENE[a.wand] ?? PUTZ,
  tuer: TUER_TOENE[a.tuer] ?? TUER_TOENE[0],
  fahne: FAHNEN_TOENE[a.fahne] ?? P.rot,
  zaun: a.zaun,
  garten: a.garten,
  deko: a.deko,
});

/** The plain look of each stage (its own materials, nothing around it), for the workshop. */
export const standardAussehen = (stufe: number): Aussehen => ({
  dach: [0, 1, 0, 0, 2][stufe] ?? 0,
  wand: 0,
  tuer: 0,
  fahne: 0,
  zaun: 0,
  garten: 0,
  deko: 0,
});

export type HausBau = (s: IsoStift, x: number, y: number, l: HausLook) => ReactNode;

const kreis = (p: Pt, r: number, fill: string, rest: Record<string, unknown> = {}) => <circle cx={p[0]} cy={p[1]} r={r} fill={fill} {...rest} />;

/** Stage 0: a canvas tent with a pennant and a small campfire. */
const zelt: HausBau = (s, x, y, l) => {
  const a = x + 12;
  const b = y + 14;
  const w = 26;
  const d = 22;
  const h = 22;
  const m = b + d / 2;
  const spitze = s.P3(a + w, m, h + 8);
  const f = s.P3(x + 47, y + 46, 0);
  return (
    <g>
      {s.schlag(a, b, w, d, 16)}
      {s.poly([s.P3(a + w, b, 0), s.P3(a + w, b + d, 0), s.P3(a + w, m, h)], P.sandTief)}
      {s.poly([s.P3(a + w, m - 5, 0), s.P3(a + w, m + 5, 0), s.P3(a + w, m, 13)], P.dunkel)}
      {s.poly([s.P3(a, b + d, 0), s.P3(a + w, b + d, 0), s.P3(a + w, m, h), s.P3(a, m, h)], P.sand)}
      {s.linie(s.P3(a + w / 2, b + d, 0), s.P3(a + w / 2, m, h), P.sandTief, 2)}
      {s.linie(s.P3(a, m, h), s.P3(a + w, m, h), s.wetter.schnee ? P.schnee : P.sandHell, 3.5)}
      {s.linie(s.P3(a, m, h - 2), s.P3(a, m, h + 6), P.balken, 3)}
      {s.linie(s.P3(a + w, m, h - 2), s.P3(a + w, m, h + 8), P.balken, 3)}
      <g className="lq-fahne">
        <path d={`M${spitze[0]} ${spitze[1]} l13 4 -13 5Z`} fill={l.fahne} />
      </g>
      {s.linie([f[0] - 7, f[1] + 1], [f[0] + 7, f[1] - 2], P.balkenTief, 3.5)}
      {s.linie([f[0] - 7, f[1] - 2], [f[0] + 7, f[1] + 1], P.balken, 3.5)}
      <path d={`M${f[0] - 5} ${f[1]} q0 -8 5 -15 q5 7 5 15 Z`} fill={P.orange} data-licht="" />
      <path d={`M${f[0] - 2.5} ${f[1]} q0 -4 2.5 -8 q2.5 4 2.5 8 Z`} fill={P.gelb} data-licht="" />
      {kreis([f[0] - 9, f[1] + 2], 2.5, P.bruch)}
      {kreis([f[0] + 9, f[1] + 1], 2.5, P.bruchTief)}
      {kreis([f[0], f[1] + 5], 2.5, P.bruch)}
    </g>
  );
};

/** Horizontal logs on both visible faces of a box (hut). */
const balkenreihen = (s: IsoStift, a: number, b: number, w: number, d: number, z0: number, z1: number) =>
  Array.from({ length: Math.floor((z1 - z0) / 4) - 1 }, (_, i) => z0 + 4 * (i + 1)).map((zz) => (
    <g key={zz}>
      {s.linie(s.P3(a, b + d, zz), s.P3(a + w, b + d, zz), P.balkenTief, 1.5, 0.6)}
      {s.linie(s.P3(a + w, b, zz), s.P3(a + w, b + d, zz), P.balkenTief, 1.5, 0.5)}
    </g>
  ));

/** Stage 1: a small log hut. */
const huette: HausBau = (s, x, y, l) => {
  const a = x + 13;
  const b = y + 15;
  const w = 28;
  const d = 24;
  const h = 16;
  return (
    <g>
      {s.schlag(a, b, w, d, 30)}
      {s.box(a, b, 0, w, d, h, l.holz)}
      {balkenreihen(s, a, b, w, d, 0, h)}
      {s.tuer(a + 8, b + d, 0, 10, 13, l.tuer)}
      {s.fenster("R", b + 8, a + w, 6, 8, 7)}
      {s.tiefe(a, b, 0, w, d, h)}
      {s.band(a, b, h, w, d, 8)}
      {s.satteldach(a, b, h, w, d, 20, l.dach, 5, false, l.holz.rechts)}
      {wimpel(s.P3(a - 5, b + d / 2, h + 20), l.fahne)}
    </g>
  );
};

/** Upright planks on both visible faces (wooden house). */
const bretter = (s: IsoStift, a: number, b: number, w: number, d: number, z0: number, z1: number) => (
  <g>
    {Array.from({ length: Math.floor(w / 6) - 1 }, (_, i) => a + 6 * (i + 1)).map((xx) => (
      <g key={`l${xx}`}>{s.linie(s.P3(xx, b + d, z0), s.P3(xx, b + d, z1), P.balkenTief, 1.5, 0.6)}</g>
    ))}
    {Array.from({ length: Math.floor(d / 6) - 1 }, (_, i) => b + 6 * (i + 1)).map((yy) => (
      <g key={`r${yy}`}>{s.linie(s.P3(a + w, yy, z0), s.P3(a + w, yy, z1), P.balkenTief, 1.5, 0.5)}</g>
    ))}
  </g>
);

/** Stage 2: a wooden house of planks on a low stone plinth, with a chimney. */
const holzhaus: HausBau = (s, x, y, l) => {
  const a = x + 10;
  const b = y + 13;
  const w = 36;
  const d = 30;
  const h = 22;
  return (
    <g>
      {s.schlag(a, b, w, d, 40)}
      {s.box(a, b, 0, w, d, 5, BRUCH)}
      {s.box(a, b, 5, w, d, h, l.holz)}
      {bretter(s, a, b, w, d, 5, 5 + h)}
      {s.tuer(a + 6, b + d, 5, 11, 16, l.tuer)}
      {s.fenster("L", a + 23, b + d, 13, 9, 9)}
      {s.fenster("R", b + 11, a + w, 13, 9, 9)}
      {s.tiefe(a, b, 0, w, d, 5 + h)}
      {s.band(a, b, 5 + h, w, d, 10)}
      {s.satteldach(a, b, 5 + h, w, d, 26, l.dach, 6, false, l.holz.rechts)}
      {s.box(a + 24, b + 4, 44, 6, 6, 16, BRUCH)}
      {s.tiefe(a + 24, b + 4, 44, 6, 6, 16)}
      {rauch(s.P3(a + 27, b + 7, 62))}
      {wimpel(s.P3(a - 6, b + d / 2, 5 + h + 26), l.fahne)}
    </g>
  );
};

/** Stage 3: a timber-framed house: stone ground floor, plastered upper floor with dark beams, chimney. */
const fachwerk: HausBau = (s, x, y, l) => {
  const a = x + 9;
  const b = y + 12;
  const w = 38;
  const d = 30;
  return (
    <g>
      {s.schlag(a, b, w, d, 50)}
      {s.box(a, b, 0, w, d, 18, BRUCH)}
      {s.tuer(a + 6, b + d, 1, 11, 15, l.tuer)}
      {s.fenster("L", a + 24, b + d, 6, 9, 9)}
      {s.fenster("R", b + 11, a + w, 6, 9, 9)}
      {s.tiefe(a, b, 0, w, d, 18)}
      {s.band(a, b, 18, w, d, 8)}
      {s.box(a - 2, b - 2, 19, w + 4, d + 4, 18, l.putz)}
      {s.fachL(a - 2, a + w + 2, b + d + 2, 19, 37, 14)}
      {s.fachR(a + w + 2, b - 2, b + d + 2, 19, 37, 14)}
      {s.fenster("L", a + 5, b + d + 2, 23, 8, 10)}
      {s.fenster("L", a + 25, b + d + 2, 23, 8, 10)}
      {s.fenster("R", b + 12, a + w + 2, 23, 8, 10)}
      {s.tiefe(a - 2, b - 2, 19, w + 4, d + 4, 18)}
      {s.band(a - 2, b - 2, 37, w + 4, d + 4, 8)}
      {s.satteldach(a - 2, b - 2, 37, w + 4, d + 4, 28, l.dach, 7, true, l.putz.rechts)}
      {s.box(a + 26, b + 5, 56, 7, 7, 18, BRUCH)}
      {s.tiefe(a + 26, b + 5, 56, 7, 7, 18)}
      {rauch(s.P3(a + 29.5, b + 8.5, 76))}
      {wimpel(s.P3(a - 9, b - 2 + (d + 4) / 2, 65), l.fahne)}
    </g>
  );
};

/** Stage 4: a timber-framed house with a stone tower behind it and a flag on the tower. */
const turmhaus: HausBau = (s, x, y, l) => {
  const tx = x + 38;
  const ty = y + 2;
  const t = 14;
  const th = 58;
  const a = x + 5;
  const b = y + 24;
  const w = 28;
  const d = 24;
  return (
    <g>
      {s.schlag(tx, ty, t, t, 50)}
      {s.schlag(a, b, w, d, 40)}
      {s.box(tx, ty, 0, t, t, th, BRUCH)}
      {s.fenster("L", tx + 4, ty + t, 38, 6, 9)}
      {s.fenster("R", ty + 4, tx + t, 22, 6, 9)}
      {s.tiefe(tx, ty, 0, t, t, th)}
      {s.band(tx, ty, th, t, t, 8)}
      {s.zeltdach(tx, ty, th, t, t, 28, l.dach, 4, l.fahne)}
      {s.box(a, b, 0, w, d, 16, BRUCH)}
      {s.tuer(a + 5, b + d, 1, 10, 13, l.tuer)}
      {s.fenster("L", a + 19, b + d, 5, 7, 8)}
      {s.fenster("R", b + 8, a + w, 5, 8, 8)}
      {s.tiefe(a, b, 0, w, d, 16)}
      {s.band(a, b, 16, w, d, 8)}
      {s.box(a - 2, b - 2, 17, w + 4, d + 4, 15, l.putz)}
      {s.fachL(a - 2, a + w + 2, b + d + 2, 17, 32, 14)}
      {s.fachR(a + w + 2, b - 2, b + d + 2, 17, 32, 14)}
      {s.fenster("L", a + 4, b + d + 2, 20, 7, 9)}
      {s.fenster("L", a + 20, b + d + 2, 20, 7, 9)}
      {s.fenster("R", b + 10, a + w + 2, 20, 8, 9)}
      {s.tiefe(a - 2, b - 2, 17, w + 4, d + 4, 15)}
      {s.band(a - 2, b - 2, 32, w + 4, d + 4, 8)}
      {s.satteldach(a - 2, b - 2, 32, w + 4, d + 4, 24, l.dach, 4, true, l.putz.rechts)}
    </g>
  );
};

/** Drawings by stage (index = HAUS_STUFEN). */
export const HAUS_BILD: HausBau[] = [zelt, huette, holzhaus, fachwerk, turmhaus];
/** Where the door leads out (world x on the plot) and where the house front ends (world y), per stage. */
const TUER_WEG: [number, number][] = [
  [0, 0],
  [26, 39],
  [21.5, 43],
  [20.5, 44],
  [15, 50],
];
/** Screen height of the tallest point above the plot centre, per stage (for signs above the roof). */
export const HAUS_HOEHE = [52, 54, 72, 92, 118];

// — Around the house: fence, garden, decoration —

const HECKE: Flaechen = { top: P.blatt, links: P.blattTief, rechts: P.gruenTief };
const ERDE: Flaechen = { top: P.holzTief, links: P.leder, rechts: P.lederTief };

/** One straight fence piece from (x0, y0) to (x1, y1) on the ground, along x or along y. */
function zaunStueck(s: IsoStift, art: number, x0: number, y0: number, x1: number, y1: number, k: string) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const entlangX = y0 === y1;
  const at = (t: number, z: number) => s.P3(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z);
  const schnee = s.wetter.schnee;
  if (art === 2 || art === 4) {
    const c = art === 2 ? (schnee ? { ...HECKE, top: P.schnee } : HECKE) : schnee ? { ...BRUCH, top: P.schnee } : BRUCH;
    const hh = art === 2 ? 8 : 7;
    return <g key={k}>{entlangX ? s.box(x0, y0 - 3, 0, x1 - x0, 6, hh, c) : s.box(x0 - 3, y0, 0, 6, y1 - y0, hh, c)}</g>;
  }
  const schritt = art === 3 ? 5 : 10;
  const n = Math.max(1, Math.round(len / schritt));
  const pfosten = art === 3 ? P.wolke : P.balken;
  const latte = art === 3 ? P.wolkeTief : P.holzTief;
  return (
    <g key={k}>
      {s.linie(at(0, art === 3 ? 7 : 5), at(1, art === 3 ? 7 : 5), latte, 3)}
      {Array.from({ length: n + 1 }, (_, i) => (
        <g key={i}>{s.linie(at(i / n, 0), at(i / n, art === 3 ? 13 : 14), pfosten, art === 3 ? 2.6 : 3.5)}</g>
      ))}
      {art === 1 && s.linie(at(0, 10), at(1, 10), latte, 3)}
    </g>
  );
}

/** The fence along both front edges of the plot, open where the path leaves the door. */
function zaun(s: IsoStift, art: number, x: number, y: number) {
  if (!art) return null;
  const R = GRUND - 2;
  return (
    <g>
      {zaunStueck(s, art, x + R, y + 2, x + R, y + R, "r")}
      {zaunStueck(s, art, x + 2, y + R, x + 8, y + R, "a")}
      {zaunStueck(s, art, x + 32, y + R, x + R, y + R, "b")}
    </g>
  );
}

/** A circle on the ground of world radius r around (cx, cy). */
const rund = (s: IsoStift, cx: number, cy: number, r: number, z = 0) =>
  Array.from({ length: 16 }, (_, i) => s.P3(cx + Math.cos((i / 16) * Math.PI * 2) * r, cy + Math.sin((i / 16) * Math.PI * 2) * r, z));

/** The garden on the right strip of the plot. */
function garten(s: IsoStift, art: number, x: number, y: number) {
  const schnee = s.wetter.schnee;
  if (art === 1 || art === 2) {
    const beet = schnee ? { ...ERDE, top: P.schnee } : ERDE;
    const punkte: [number, number][] = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) punkte.push([x + 51.5 + i * 3.5, y + 26.5 + j * 4.2]);
    return (
      <g>
        {s.box(x + 49, y + 24, 0, 12, 19, 3, beet)}
        {!schnee &&
          punkte.map(([a, b], i) => (
            <g key={i}>
              {art === 1
                ? kreis(s.P3(a, b, 5), 2.2, [P.rosa, P.gelb, P.rot, P.wolkeHell][i % 4])
                : kreis(s.P3(a, b, 5), 2.4, i % 3 === 0 ? P.orange : i % 2 ? P.blatt : P.blattHell)}
            </g>
          ))}
      </g>
    );
  }
  if (art === 3) {
    const p = s.P3(x + 56, y + 24, 0);
    return (
      <g>
        {baum(p, 0.95, schnee)}
        {!schnee && [[-6, -32], [5, -36], [-1, -27], [7, -27]].map(([dx, dy], i) => <g key={i}>{kreis([p[0] + dx, p[1] + dy], 2.2, P.rot)}</g>)}
      </g>
    );
  }
  if (art === 4) {
    const c = s.P3(x + 55, y + 34, 0);
    return (
      <g>
        {s.poly(rund(s, x + 55, y + 34, 8.5), schnee ? P.eisTief : P.wasserTief)}
        {s.poly(rund(s, x + 55.5, y + 34.5, 7), schnee ? P.eis : P.wasser)}
        {schnee ? (
          s.linie([c[0] - 5, c[1] + 1], [c[0] + 2, c[1] - 2], P.eisHell, 2.5)
        ) : (
          <g>
            <ellipse cx={c[0] + 3} cy={c[1] + 1} rx={3.5} ry={2} fill={P.blatt} />
            {s.linie([c[0] - 6, c[1] - 1], [c[0] - 1, c[1] - 3], P.wasserHell, 2)}
          </g>
        )}
      </g>
    );
  }
  return null;
}

/** One decoration on the front strip, right of the path. */
function schmuck(s: IsoStift, art: number, x: number, y: number) {
  const p = s.P3(x + 44, y + 56, 0);
  if (art === 1) return laterne(p, s.wetter.nacht);
  if (art === 2)
    return (
      <g>
        {s.linie(s.P3(x + 36, y + 57, 0), s.P3(x + 36, y + 57, 5), P.balken, 2.5)}
        {s.linie(s.P3(x + 48, y + 57, 0), s.P3(x + 48, y + 57, 5), P.balken, 2.5)}
        {s.box(x + 35, y + 53, 5, 14, 5, 2, HOLZ)}
        {s.box(x + 35, y + 52, 7, 14, 1.5, 7, HOLZ)}
      </g>
    );
  if (art === 3)
    return (
      <g>
        {[[-7, 0], [5, -2]].map(([dx, dy], i) => (
          <g key={i}>
            <rect x={p[0] + dx - 5} y={p[1] + dy - 12} width={10} height={12} rx={3} fill={i ? P.holzTief : P.holz} />
            <rect x={p[0] + dx - 5} y={p[1] + dy - 9} width={10} height={2} fill={P.balken} />
            <rect x={p[0] + dx - 5} y={p[1] + dy - 4} width={10} height={2} fill={P.balken} />
            <ellipse cx={p[0] + dx} cy={p[1] + dy - 12} rx={5} ry={1.8} fill={P.holzHell} />
          </g>
        ))}
      </g>
    );
  if (art === 4)
    return (
      <g>
        <rect x={p[0] - 7} y={p[1] - 2} width={14} height={4} rx={2} fill={P.schatten} opacity={0.18} />
        <path d={`M${p[0] + 5} ${p[1] - 3} q8 -2 6 -12`} fill="none" stroke={P.fellTief} strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx={p[0]} cy={p[1] - 6} rx={5.5} ry={6} fill={P.fell} />
        <circle cx={p[0] - 1} cy={p[1] - 14} r={4.5} fill={P.fell} />
        <path d={`M${p[0] - 5} ${p[1] - 16} l1 -5 l3 3Z M${p[0] + 3} ${p[1] - 16} l-1 -5 l-3 3Z`} fill={P.fellTief} />
        <ellipse cx={p[0] - 1} cy={p[1] - 5} rx={3} ry={3.5} fill={P.fellHell} />
        <circle cx={p[0] - 2.6} cy={p[1] - 14.5} r={0.9} fill={P.auge} />
        <circle cx={p[0] + 0.8} cy={p[1] - 14.5} r={0.9} fill={P.auge} />
      </g>
    );
  if (art === 5)
    return (
      <g>
        {s.box(x + 37, y + 51, 0, 11, 11, 8, BRUCH)}
        {s.poly([s.P3(x + 39, y + 53, 8), s.P3(x + 46, y + 53, 8), s.P3(x + 46, y + 60, 8), s.P3(x + 39, y + 60, 8)], s.wetter.schnee ? P.eis : P.wasserTief)}
        {s.linie(s.P3(x + 38, y + 56.5, 8), s.P3(x + 38, y + 56.5, 24), P.balken, 2.5)}
        {s.linie(s.P3(x + 47, y + 56.5, 8), s.P3(x + 47, y + 56.5, 24), P.balkenTief, 2.5)}
        {s.satteldach(x + 38, y + 52, 24, 9, 9, 8, ZIEGEL, 2, false)}
      </g>
    );
  return null;
}

/** Dust puffs at the foot of a house that was just built (lernquest.css: lq-staub). */
const staub = (s: IsoStift, x: number, y: number) => (
  <g className="lq-staub">
    {[
      [8, 56],
      [30, 62],
      [56, 40],
      [56, 14],
    ].map(([a, b], i) => (
      <g key={i}>{kreis(s.P3(x + a, y + b, 4), 6, P.wolke, { style: { animationDelay: `${i * 0.06}s` } })}</g>
    ))}
  </g>
);

/** A house of `stufe` with its look on the plot at (x, y): lawn, path to the door, the house, garden, decoration and
 *  fence. `neu`: just built, with puffs of dust (the map lets the whole plot pop up). */
export function hausMitGarten(s: IsoStift, x: number, y: number, stufe: number, a: Aussehen, neu = false) {
  const bau = HAUS_BILD[stufe];
  if (!bau) return null;
  const l = hausLook(a);
  const [tx, ty] = TUER_WEG[stufe];
  return (
    <g>
      {s.flaeche(x, y, GRUND, GRUND, s.wetter.schnee ? P.wolkeHell : P.wieseHell)}
      {stufe > 0 && s.flaeche(x + tx - 4, y + ty, 8, GRUND - ty, s.wetter.schnee ? P.wolke : P.pflaster)}
      {bau(s, x, y, l)}
      {garten(s, l.garten, x, y)}
      {schmuck(s, l.deko, x, y)}
      {zaun(s, l.zaun, x, y)}
      {neu && staub(s, x, y)}
    </g>
  );
}

/** One house alone on its plot, the plot centre at (0, 0), for the workshop and the own-house box. Without a look the
 *  plain materials of the stage; `platz` picks the automatic look when `aussehen` is missing. */
export function HausEinzeln({ stufe, aussehen, platz }: { stufe: number; aussehen?: Aussehen | null; platz?: number }) {
  if (!HAUS_BILD[stufe]) return null;
  const a = platz === undefined && !aussehen ? standardAussehen(stufe) : aussehenVon(aussehen, platz ?? 0, stufe);
  return hausMitGarten(isoStift(0, -GRUND / 2), 0, 0, stufe, a);
}

const RAHMEN: [number, number, number, number] = [-62, -126, 124, 164];

/** The five stages in the workshop (Dorf), next to the village buildings. */
export const HAUS_TEILE: GelaendeTeil[] = HAUS_BILD.map((_, i) => ({
  id: `haus-${i}`,
  name: `Haus: ${HAUS_STUFEN[i].name}`,
  rahmen: RAHMEN,
  zeichnung: () => <HausEinzeln stufe={i} />,
}));

/** Every choice once: the tower house with choice k of every part (where there is one). */
export const HAUS_GESTALTET: GelaendeTeil[] = Array.from({ length: 6 }, (_, k) => ({
  id: `haus-gestaltet-${k}`,
  name: `Haus gestaltet: Wahl ${k + 1}`,
  rahmen: RAHMEN,
  zeichnung: () => (
    <HausEinzeln stufe={k < 3 ? 3 : 4} aussehen={{ dach: k, wand: k, tuer: k, fahne: k, zaun: Math.min(k, 4), garten: Math.min(k, 4), deko: k }} />
  ),
}));
