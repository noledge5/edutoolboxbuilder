// The pieces of the map landscape (Stufe E, Teil 2): castle, boss castle, trees, bushes, flowers, stones. Since
// 19.11.2026 without outline (docs/design/prinzipien.md): the castles are built isometric from the village kit
// (iso.tsx), so they match the houses; the small pieces stay flat from the front like pieces on a board, with light
// top left and a hard shade bottom right. Each piece is drawn with its centre bottom at (0, 0) (for a castle: the
// foot of its gate, where the path starts), so it stands where it is placed; GELAENDE lists them for the workshop.
import type { ReactNode } from 'react';
import { isoStift, type DachTon, type Flaechen, type IsoStift } from './iso';
import { Baum as BaumForm, Tanne as TannenForm } from './pflanzen';
import { P, flaeche } from './stil';

/** A flat shadow on the ground under a standing piece, a little to the right (fixed opacity, hard edge). */
export const bodenSchatten = (rx: number, ry = rx / 4) => <ellipse cx={rx * 0.22} cy={0} rx={rx} ry={ry} fill={P.schatten} opacity={0.18} />;

/** A lumpy silhouette from circles without seams inside: the circles once in `tief`, moved down right (the hard shade
 *  at the edge), then in `farbe`; a light spot top left on the first circles. */
export function Klumpen({ kreise, farbe, hell, tief, licht = 2 }: { kreise: [number, number, number][]; farbe: string; hell: string; tief: string; licht?: number }) {
  return (
    <g>
      {kreise.map(([x, y, r]) => (
        <circle key={`t${x},${y}`} cx={x + r * 0.2} cy={y + r * 0.2} r={r + 1.5} fill={tief} />
      ))}
      {kreise.map(([x, y, r]) => (
        <circle key={`f${x},${y}`} cx={x} cy={y} r={r + 1.5} fill={farbe} />
      ))}
      {kreise.slice(0, licht).map(([x, y, r]) => (
        <circle key={`h${x},${y}`} cx={x - r * 0.38} cy={y - r * 0.38} r={r * 0.28} fill={hell} />
      ))}
    </g>
  );
}

export function Baum(): ReactNode {
  return (
    <g>
      {bodenSchatten(20, 5)}
      <BaumForm />
    </g>
  );
}

export function Tanne(): ReactNode {
  return (
    <g>
      {bodenSchatten(18, 4.5)}
      <TannenForm />
    </g>
  );
}

export function Busch(): ReactNode {
  return (
    <g>
      {bodenSchatten(18, 4)}
      <Klumpen
        kreise={[
          [-6, -11, 10],
          [7, -9, 9],
          [-13, -5, 7],
          [13, -5, 6],
        ]}
        farbe={P.wieseTief}
        hell={P.wieseHell}
        tief={P.blattTief}
      />
      <circle cx={-4} cy={-14} r={2.4} fill={P.backe} />
      <circle cx={8} cy={-10} r={2.4} fill={P.backe} />
    </g>
  );
}

export function Blume(): ReactNode {
  return (
    <g>
      <path d="M0 0 Q-1 -7 0 -13" fill="none" stroke={P.blattTief} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M0 -5 Q6 -9 8 -5 Q4 -2 0 -5 Z" {...flaeche(P.blatt, 1.8)} />
      {[0, 72, 144, 216, 288].map((w) => (
        <circle key={w} cx={Math.round(Math.sin((w * Math.PI) / 180) * 5 * 10) / 10} cy={Math.round((-15 - Math.cos((w * Math.PI) / 180) * 5) * 10) / 10} r={4.4} fill={P.wolke} />
      ))}
      <circle cx={0} cy={-15} r={3.4} fill={P.gold} />
    </g>
  );
}

/** A rounded stone in three tones: base, a hard shade down right, a light edge top left. */
export const farbStein = (f: string, h: string, t: string) =>
  function FarbStein(): ReactNode {
    return (
      <g>
        <path d="M-14 0 Q-16 -10 -7 -14 Q2 -18 10 -12 Q16 -6 14 0 Z" {...flaeche(f, 2.5)} />
        <path d="M3 -13 Q15 -7 14 0 L1 0 Z" {...flaeche(t, 2.5)} />
        <path d="M-10 -6 Q-9 -11 -4 -12" fill="none" stroke={h} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  };
export const Stein = farbStein(P.metall, P.metallHell, P.metallTief);

// — Castles (isometric) —

export interface BurgFarben {
  /** Walls: top face, left (lit) face, right (shaded) face. */
  mauer: Flaechen;
  /** The courtyard inside the walls. */
  hof: string;
  dach: DachTon;
  fahne: string;
  tor: string;
}

const BURG: BurgFarben = {
  mauer: { top: P.steinHell, links: P.stein, rechts: P.steinTief },
  hof: P.wieseTief,
  dach: { vorn: P.blau, seite: P.blauTief, kante: P.blauTief, licht: P.blauHell },
  fahne: P.gold,
  tor: P.holzTief,
};
const BOSS: BurgFarben = {
  mauer: { top: P.lilaHell, links: P.nachtHell, rechts: P.nacht },
  hof: P.nachtTief,
  dach: { vorn: P.nacht, seite: P.nachtTief, kante: P.nachtTief, licht: P.nachtHell },
  fahne: P.rot,
  tor: P.nachtTief,
};

/** Wall square side, wall height, wall thickness, tower side. */
const W = 96;
const H = 38;
const DICKE = 8;
const T = 30;

/** A square tower with its corner (x, y) as centre: body, shade, a window slit, a pyramid roof and a flag. */
function turm(s: IsoStift, x: number, y: number, h: number, f: BurgFarben, fahne = true, b = T) {
  const a = x - b / 2;
  const c = y - b / 2;
  const sp = s.P3(x, y, h + b * 1.15);
  return (
    <g>
      {s.box(a, c, 0, b, b, h, f.mauer)}
      {s.tiefe(a, c, 0, b, b, h)}
      {s.bogenTor('L', x - 4, c + b, h - 26, 8, 13, P.auge)}
      {s.bogenTor('R', y - 4, a + b, h - 26, 8, 13, P.auge)}
      {s.band(a, c, h, b, b, 8)}
      {s.zeltdach(a, c, h, b, b, b * 1.15, f.dach, 4, false)}
      {fahne && s.linie(sp, [sp[0], sp[1] - 20], P.dunkel, 3)}
      {fahne && <path d={`M${sp[0]} ${sp[1] - 20} l15 5 -15 6 Z`} fill={f.fahne} />}
    </g>
  );
}

/** A castle on the 2:1 grid: a square curtain wall with a courtyard and battlements, the keep inside, towers on the
 *  left and right corner and the gatehouse on the front corner. The gate's foot is at (0, 0). */
export function BurgBild({ f, boss }: { f: BurgFarben; boss: boolean }) {
  const s = isoStift(10, -W - 6);
  const i = DICKE;
  const k = 30; // keep: corner and side
  const kh = 74;
  const ksp = s.P3(k + 18, k + 18, kh + 36);
  const zinnen = [20, 34, 48, 62];
  // Banner or the boss's emblem on the gatehouse, above the gate.
  const schild = s.P3(W - 2, W + T / 2, 42);
  return (
    <g>
      {s.schlag(0, 0, W, W, H)}
      {s.schlag(k, k, 36, 36, kh)}
      {s.schlag(-T / 2, W - T / 2, T, T, 60)}
      {s.schlag(W - T / 2, -T / 2, T, T, 60)}
      {s.schlag(W - T / 2, W - T / 2, T, T, 54)}
      {/* The courtyard seen through the top of the walls, with the inner faces of the back walls. */}
      {s.poly([s.P3(i, i, H), s.P3(W - i, i, H), s.P3(W - i, W - i, H), s.P3(i, W - i, H)], f.hof)}
      {s.poly([s.P3(i, i, H), s.P3(W - i, i, H), s.P3(W - i, i, H - 14), s.P3(i, i, H - 14)], f.mauer.links)}
      {s.poly([s.P3(i, i, H), s.P3(i, W - i, H), s.P3(i, W - i, H - 14), s.P3(i, i, H - 14)], f.mauer.rechts)}
      {/* The keep. */}
      {s.box(k, k, 0, 36, 36, kh, f.mauer)}
      {s.tiefe(k, k, 0, 36, 36, kh)}
      {s.bogenTor('L', k + 13, k + 36, kh - 30, 10, 16, P.auge)}
      {s.bogenTor('R', k + 13, k + 36, kh - 30, 10, 16, P.auge)}
      {s.band(k, k, kh, 36, 36, 8)}
      {s.zeltdach(k, k, kh, 36, 36, 36, f.dach, 5, false)}
      {s.linie(ksp, [ksp[0], ksp[1] - 22], P.dunkel, 3)}
      <path d={`M${ksp[0]} ${ksp[1] - 22} l16 5 -16 6 Z`} fill={f.fahne} />
      {/* The walls: outer faces, the wall walk with a hole for the courtyard, battlements along the front. */}
      {s.poly([s.P3(0, W, 0), s.P3(W, W, 0), s.P3(W, W, H), s.P3(0, W, H)], f.mauer.links)}
      {s.poly([s.P3(W, 0, 0), s.P3(W, W, 0), s.P3(W, W, H), s.P3(W, 0, H)], f.mauer.rechts)}
      {s.tiefe(0, 0, 0, W, W, H)}
      <path
        d={`M${[s.P3(0, 0, H), s.P3(W, 0, H), s.P3(W, W, H), s.P3(0, W, H)].map((p) => p.join(' ')).join(' L')} Z M${[s.P3(i, i, H), s.P3(i, W - i, H), s.P3(W - i, W - i, H), s.P3(W - i, i, H)].map((p) => p.join(' ')).join(' L')} Z`}
        fill={f.mauer.top}
        fillRule="evenodd"
      />
      {zinnen.map((x) => (
        <g key={`l${x}`}>{s.box(x, W - 5, H, 8, 5, 7, f.mauer)}</g>
      ))}
      {zinnen.map((y) => (
        <g key={`r${y}`}>
          {s.box(W - 5, y, H, 5, 8, 7, f.mauer)}
          {s.tiefe(W - 5, y, H, 5, 8, 7)}
        </g>
      ))}
      {turm(s, 0, W, 60, f)}
      {turm(s, W, 0, 60, f)}
      {/* The gatehouse with the gate, where the path begins. */}
      {s.box(W - T / 2, W - T / 2, 0, T, T, 54, f.mauer)}
      {s.tiefe(W - T / 2, W - T / 2, 0, T, T, 54)}
      {s.bogenTor('L', W - 13, W + T / 2, 0, 24, 30, f.mauer.rechts)}
      {s.bogenTor('L', W - 10, W + T / 2, 0, 18, 26, f.tor)}
      {[W - 4, W + 2].map((x) => (
        <g key={x}>{s.linie(s.P3(x, W + T / 2, 1), s.P3(x, W + T / 2, 20), P.auge, 2, 0.35)}</g>
      ))}
      {boss ? (
        // The boss's emblem: a skull on a dark disc.
        <g transform={`translate(${schild[0]} ${schild[1]})`}>
          <circle r={10} fill={P.lila} />
          <path d="M-5.5 1 A6 6 0 1 1 5.5 1 V4 H3 V6 H-3 V4 H-5.5 Z" fill={P.wolke} />
          <circle cx={-2.4} cy={-0.5} r={1.8} fill={P.nachtTief} />
          <circle cx={2.4} cy={-0.5} r={1.8} fill={P.nachtTief} />
        </g>
      ) : (
        s.poly([s.P3(W - 9, W + T / 2, 47), s.P3(W + 5, W + T / 2, 47), s.P3(W + 5, W + T / 2, 38), s.P3(W - 2, W + T / 2, 33), s.P3(W - 9, W + T / 2, 38)], P.rot)
      )}
      {s.band(W - T / 2, W - T / 2, 54, T, T, 8)}
      {s.zeltdach(W - T / 2, W - T / 2, 54, T, T, 30, f.dach, 4, false)}
    </g>
  );
}

/** The castle at the start of every region (one per module). */
export function Burg(): ReactNode {
  return <BurgBild f={BURG} boss={false} />;
}

/** The dark castle at the end of a region: the Meilenstein waits at its gate. */
export function BossBurg(): ReactNode {
  return <BurgBild f={BOSS} boss />;
}

export interface GelaendeTeil {
  id: string;
  name: string;
  /** x, y, w, h around the drawing, for the workshop. */
  rahmen: [number, number, number, number];
  zeichnung: () => ReactNode;
}

export const GELAENDE: GelaendeTeil[] = [
  { id: 'burg', name: 'Burg', rahmen: [-110, -190, 250, 217], zeichnung: Burg },
  { id: 'bossburg', name: 'Boss-Burg', rahmen: [-110, -190, 250, 217], zeichnung: BossBurg },
  { id: 'baum', name: 'Laubbaum', rahmen: [-26, -73, 55, 82], zeichnung: Baum },
  { id: 'tanne', name: 'Tanne', rahmen: [-28, -70, 56, 79], zeichnung: Tanne },
  { id: 'busch', name: 'Busch', rahmen: [-25, -26, 51, 35], zeichnung: Busch },
  { id: 'blume', name: 'Blume', rahmen: [-13, -28, 26, 32], zeichnung: Blume },
  { id: 'stein', name: 'Stein', rahmen: [-18, -20, 37, 24], zeichnung: Stein },
];
