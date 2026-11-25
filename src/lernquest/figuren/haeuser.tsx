// The children's own houses in the class village (Klassendorf Teil B1, decided 25.11.2026): five stages from the tent
// to the tower house (HAUS_STUFEN in ../dorf.ts), each drawn into one staked plot of 56 × 56 at (x, y) with the parts of
// iso.tsx, so they match the village buildings. Stages grow in footprint, height and material: canvas, logs and
// thatch, planks and tiles, stone and timber framing, a stone tower with a slate roof.
import type { ReactNode } from "react";
import { HAUS_STUFEN } from "../dorf";
import type { GelaendeTeil } from "./gelaende";
import { BRUCH, HOLZ, isoStift, PUTZ, SCHIEFER, STROH, type IsoStift } from "./iso";
import { P } from "./stil";

export type HausBau = (s: IsoStift, x: number, y: number) => ReactNode;
/** Side of a plot (world units), as in DorfKarte. */
export const GRUND = 56;

const kreis = (p: [number, number], r: number, fill: string) => <circle cx={p[0]} cy={p[1]} r={r} fill={fill} />;

/** Stage 0: a canvas tent with a pennant and a small campfire. */
const zelt: HausBau = (s, x, y) => {
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
      {s.linie(s.P3(a, m, h), s.P3(a + w, m, h), P.sandHell, 3.5)}
      {s.linie(s.P3(a, m, h - 2), s.P3(a, m, h + 6), P.balken, 3)}
      {s.linie(s.P3(a + w, m, h - 2), s.P3(a + w, m, h + 8), P.balken, 3)}
      <path d={`M${spitze[0]} ${spitze[1]} l13 4 -13 5Z`} fill={P.rot} />
      {s.linie([f[0] - 7, f[1] + 1], [f[0] + 7, f[1] - 2], P.balkenTief, 3.5)}
      {s.linie([f[0] - 7, f[1] - 2], [f[0] + 7, f[1] + 1], P.balken, 3.5)}
      <path d={`M${f[0] - 5} ${f[1]} q0 -8 5 -15 q5 7 5 15 Z`} fill={P.orange} />
      <path d={`M${f[0] - 2.5} ${f[1]} q0 -4 2.5 -8 q2.5 4 2.5 8 Z`} fill={P.gelb} />
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
      {s.linie(s.P3(a, b + d, zz), s.P3(a + w, b + d, zz), P.balkenTief, 1.5)}
      {s.linie(s.P3(a + w, b, zz), s.P3(a + w, b + d, zz), P.balkenTief, 1.5, 0.7)}
    </g>
  ));

/** Stage 1: a small log hut with a thatched roof. */
const huette: HausBau = (s, x, y) => {
  const a = x + 13;
  const b = y + 15;
  const w = 28;
  const d = 24;
  const h = 16;
  return (
    <g>
      {s.schlag(a, b, w, d, 30)}
      {s.box(a, b, 0, w, d, h, HOLZ)}
      {balkenreihen(s, a, b, w, d, 0, h)}
      {s.tuer(a + 8, b + d, 0, 10, 13)}
      {s.fenster("R", b + 8, a + w, 6, 8, 7)}
      {s.tiefe(a, b, 0, w, d, h)}
      {s.band(a, b, h, w, d, 8)}
      {s.satteldach(a, b, h, w, d, 20, STROH, 5, false, HOLZ.rechts)}
    </g>
  );
};

/** Upright planks on both visible faces (wooden house). */
const bretter = (s: IsoStift, a: number, b: number, w: number, d: number, z0: number, z1: number) => (
  <g>
    {Array.from({ length: Math.floor(w / 6) - 1 }, (_, i) => a + 6 * (i + 1)).map((xx) => (
      <g key={`l${xx}`}>{s.linie(s.P3(xx, b + d, z0), s.P3(xx, b + d, z1), P.balkenTief, 1.5)}</g>
    ))}
    {Array.from({ length: Math.floor(d / 6) - 1 }, (_, i) => b + 6 * (i + 1)).map((yy) => (
      <g key={`r${yy}`}>{s.linie(s.P3(a + w, yy, z0), s.P3(a + w, yy, z1), P.balkenTief, 1.5, 0.7)}</g>
    ))}
  </g>
);

/** Stage 2: a wooden house of planks on a low stone plinth, tiled roof. */
const holzhaus: HausBau = (s, x, y) => {
  const a = x + 10;
  const b = y + 13;
  const w = 36;
  const d = 30;
  const h = 22;
  return (
    <g>
      {s.schlag(a, b, w, d, 40)}
      {s.box(a, b, 0, w, d, 5, BRUCH)}
      {s.box(a, b, 5, w, d, h, HOLZ)}
      {bretter(s, a, b, w, d, 5, 5 + h)}
      {s.tuer(a + 6, b + d, 5, 11, 16)}
      {s.fenster("L", a + 23, b + d, 13, 9, 9)}
      {s.fenster("R", b + 11, a + w, 13, 9, 9)}
      {s.tiefe(a, b, 0, w, d, 5 + h)}
      {s.band(a, b, 5 + h, w, d, 10)}
      {s.satteldach(a, b, 5 + h, w, d, 26, undefined, 6, false, HOLZ.rechts)}
    </g>
  );
};

/** Stage 3: a timber-framed house: stone ground floor, plastered upper floor with dark beams, chimney. */
const fachwerk: HausBau = (s, x, y) => {
  const a = x + 9;
  const b = y + 12;
  const w = 38;
  const d = 30;
  return (
    <g>
      {s.schlag(a, b, w, d, 50)}
      {s.box(a, b, 0, w, d, 18, BRUCH)}
      {s.steine(a, b, 0, w, d, 18)}
      {s.tuer(a + 6, b + d, 1, 11, 15)}
      {s.fenster("L", a + 24, b + d, 6, 9, 9)}
      {s.fenster("R", b + 11, a + w, 6, 9, 9)}
      {s.tiefe(a, b, 0, w, d, 18)}
      {s.band(a, b, 18, w, d, 8)}
      {s.box(a - 2, b - 2, 19, w + 4, d + 4, 18, PUTZ)}
      {s.fachL(a - 2, a + w + 2, b + d + 2, 19, 37, 14)}
      {s.fachR(a + w + 2, b - 2, b + d + 2, 19, 37, 14)}
      {s.fenster("L", a + 5, b + d + 2, 23, 8, 10)}
      {s.fenster("L", a + 25, b + d + 2, 23, 8, 10)}
      {s.fenster("R", b + 12, a + w + 2, 23, 8, 10)}
      {s.tiefe(a - 2, b - 2, 19, w + 4, d + 4, 18)}
      {s.band(a - 2, b - 2, 37, w + 4, d + 4, 8)}
      {s.satteldach(a - 2, b - 2, 37, w + 4, d + 4, 28)}
      {s.box(a + 26, b + 5, 56, 7, 7, 18, BRUCH)}
      {s.tiefe(a + 26, b + 5, 56, 7, 7, 18)}
    </g>
  );
};

/** Stage 4: a timber-framed house with a stone tower behind it, slate roof and a gold flag. */
const turmhaus: HausBau = (s, x, y) => {
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
      {s.steine(tx, ty, 0, t, t, th)}
      {s.fenster("L", tx + 4, ty + t, 38, 6, 9)}
      {s.fenster("R", ty + 4, tx + t, 22, 6, 9)}
      {s.tiefe(tx, ty, 0, t, t, th)}
      {s.band(tx, ty, th, t, t, 8)}
      {s.zeltdach(tx, ty, th, t, t, 28, SCHIEFER, 4)}
      {s.box(a, b, 0, w, d, 16, BRUCH)}
      {s.steine(a, b, 0, w, d, 16)}
      {s.tuer(a + 5, b + d, 1, 10, 13)}
      {s.fenster("L", a + 19, b + d, 5, 7, 8)}
      {s.fenster("R", b + 8, a + w, 5, 8, 8)}
      {s.tiefe(a, b, 0, w, d, 16)}
      {s.band(a, b, 16, w, d, 8)}
      {s.box(a - 2, b - 2, 17, w + 4, d + 4, 15, PUTZ)}
      {s.fachL(a - 2, a + w + 2, b + d + 2, 17, 32, 14)}
      {s.fachR(a + w + 2, b - 2, b + d + 2, 17, 32, 14)}
      {s.fenster("L", a + 4, b + d + 2, 20, 7, 9)}
      {s.fenster("L", a + 20, b + d + 2, 20, 7, 9)}
      {s.fenster("R", b + 10, a + w + 2, 20, 8, 9)}
      {s.tiefe(a - 2, b - 2, 17, w + 4, d + 4, 15)}
      {s.band(a - 2, b - 2, 32, w + 4, d + 4, 8)}
      {s.satteldach(a - 2, b - 2, 32, w + 4, d + 4, 24, undefined, 4)}
    </g>
  );
};

/** Drawings by stage (index = HAUS_STUFEN). */
export const HAUS_BILD: HausBau[] = [zelt, huette, holzhaus, fachwerk, turmhaus];

/** One house stage alone on its plot, the plot centre at (0, 0), for the workshop and the own-house box. */
export function HausEinzeln({ stufe }: { stufe: number }) {
  const bau = HAUS_BILD[stufe];
  if (!bau) return null;
  const s = isoStift(0, -GRUND / 2);
  return (
    <g>
      {s.flaeche(0, 0, GRUND, GRUND, P.wieseHell)}
      {bau(s, 0, 0)}
    </g>
  );
}

/** The five stages in the workshop (Dorf), next to the village buildings. */
export const HAUS_TEILE: GelaendeTeil[] = HAUS_BILD.map((_, i) => ({
  id: `haus-${i}`,
  name: `Haus: ${HAUS_STUFEN[i].name}`,
  rahmen: [-60, -125, 120, 160],
  zeichnung: () => <HausEinzeln stufe={i} />,
}));
