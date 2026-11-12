// The pieces of the map landscape (Stufe E, Teil 2): castle, boss castle, trees, bushes, flowers, stones. Same style
// as the figures (stil.ts): outline, light from the top left, a shadow bottom right. Each piece is drawn with its
// centre bottom at (0, 0), so it stands where it is placed; GELAENDE lists them for the workshop.
import type { ReactNode } from 'react';
import { P, UMRISS, UMRISS_FEIN } from './stil';

/** A silhouette with an outline but no seams inside: the shapes once fat in the line colour, then in their fill. */
function Klumpen({ kreise, farbe, hell, tief }: { kreise: [number, number, number][]; farbe: string; hell: string; tief: string }) {
  return (
    <g>
      {kreise.map(([x, y, r]) => (
        <circle key={`u${x},${y}`} cx={x} cy={y} r={r + 3} fill={P.linie} />
      ))}
      {kreise.map(([x, y, r]) => (
        <circle key={`f${x},${y}`} cx={x} cy={y} r={r} fill={farbe} />
      ))}
      {kreise.map(([x, y, r]) => (
        <circle key={`t${x},${y}`} cx={x + r * 0.28} cy={y + r * 0.28} r={r * 0.7} fill={tief} opacity={0.55} />
      ))}
      {kreise.slice(0, 2).map(([x, y, r]) => (
        <path key={`h${x},${y}`} d={`M${x - r * 0.6} ${y - r * 0.05} A${r * 0.62} ${r * 0.62} 0 0 1 ${x - r * 0.05} ${y - r * 0.6}`} fill="none" stroke={hell} strokeWidth={Math.max(3, r * 0.22)} strokeLinecap="round" />
      ))}
    </g>
  );
}

export function Baum(): ReactNode {
  return (
    <g>
      <ellipse cx={4} cy={0} rx={20} ry={5} fill={P.schatten} opacity={0.18} />
      <path d="M-6 0 L-4 -26 L4 -26 L6 0 Z" fill={P.leder} {...UMRISS_FEIN} />
      <path d="M1 -24 L3 -2" stroke={P.lederTief} strokeWidth={2.5} strokeLinecap="round" />
      <Klumpen
        kreise={[
          [-6, -48, 17],
          [9, -44, 15],
          [-13, -30, 13],
          [12, -28, 13],
          [0, -30, 14],
        ]}
        farbe={P.blatt}
        hell={P.blattHell}
        tief={P.blattTief}
      />
    </g>
  );
}

export function Tanne(): ReactNode {
  const stufe = (y: number, b: number, h: number) => `M0 ${y - h} Q${b * 0.4} ${y - h * 0.45} ${b} ${y} Q0 ${y + 5} ${-b} ${y} Q${-b * 0.4} ${y - h * 0.45} 0 ${y - h} Z`;
  return (
    <g>
      <ellipse cx={4} cy={0} rx={17} ry={4.5} fill={P.schatten} opacity={0.18} />
      <rect x={-4} y={-14} width={8} height={14} rx={2} fill={P.leder} {...UMRISS_FEIN} />
      {[
        [-12, 22, 26],
        [-28, 18, 24],
        [-44, 13, 22],
      ].map(([y, b, h]) => (
        <g key={y}>
          <path d={stufe(y, b, h)} fill={P.blattTief} {...UMRISS} />
          <path d={`M2 ${y - h + 4} Q${b * 0.5} ${y - h * 0.3} ${b - 3} ${y - 1} Q4 ${y + 2} 2 ${y - h + 4} Z`} fill={P.linie} opacity={0.18} />
          <path d={`M-3 ${y - h + 7} Q${-b * 0.35} ${y - h * 0.45} ${-b * 0.6} ${y - 5}`} fill="none" stroke={P.blatt} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

export function Busch(): ReactNode {
  return (
    <g>
      <ellipse cx={3} cy={0} rx={18} ry={4} fill={P.schatten} opacity={0.16} />
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
      <circle cx={-4} cy={-14} r={2.2} fill={P.backe} />
      <circle cx={8} cy={-10} r={2.2} fill={P.backe} />
    </g>
  );
}

export function Blume(): ReactNode {
  return (
    <g>
      <path d="M0 0 Q-1 -7 0 -13" fill="none" stroke={P.blattTief} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M0 -5 Q6 -9 8 -5 Q4 -2 0 -5 Z" fill={P.wieseHell} {...UMRISS_FEIN} strokeWidth={1.8} />
      {[0, 72, 144, 216, 288].map((w) => (
        <circle key={w} cx={Math.round(Math.sin((w * Math.PI) / 180) * 5 * 10) / 10} cy={Math.round((-15 - Math.cos((w * Math.PI) / 180) * 5) * 10) / 10} r={3.6} fill={P.weiss} stroke={P.linie} strokeWidth={1.8} />
      ))}
      <circle cx={0} cy={-15} r={2.8} fill={P.gold} stroke={P.linie} strokeWidth={1.8} />
    </g>
  );
}

export function Stein(): ReactNode {
  return (
    <g>
      <path d="M-14 0 Q-16 -10 -7 -14 Q2 -18 10 -12 Q16 -6 14 0 Z" fill={P.metall} {...UMRISS_FEIN} />
      <path d="M3 -13 Q14 -7 13 -1 L1 -1 Z" fill={P.metallTief} opacity={0.6} />
      <path d="M-10 -6 Q-9 -11 -4 -12" fill="none" stroke={P.metallHell} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/** Battlements along the top of a wall from x1 to x2 at height y (merlons 8 wide, 6 high). */
const zinnen = (x1: number, x2: number, y: number) => {
  let d = `M${x1} ${y}`;
  for (let x = x1; x + 8 <= x2 + 0.1; x += 16) d += ` v-7 h8 v7 h8`;
  return d;
};

interface BurgFarben {
  mauer: string;
  mauerHell: string;
  mauerTief: string;
  dach: string;
  dachTief: string;
  fahne: string;
  tor: string;
}

const BURG: BurgFarben = { mauer: P.stein, mauerHell: P.steinHell, mauerTief: P.steinTief, dach: P.blau, dachTief: P.blauTief, fahne: P.gold, tor: P.holzTief };
const BOSS: BurgFarben = { mauer: P.nachtHell, mauerHell: P.lilaHell, mauerTief: P.nacht, dach: P.nachtTief, dachTief: P.linie, fahne: P.rot, tor: P.nachtTief };

function Turm({ x, unten, oben, b, f, fenster = true }: { x: number; unten: number; oben: number; b: number; f: BurgFarben; fenster?: boolean }) {
  const dachH = b * 1.35;
  return (
    <g>
      <rect x={x - b / 2} y={oben} width={b} height={unten - oben} fill={f.mauer} {...UMRISS} />
      <rect x={x + b / 2 - b * 0.32} y={oben + 2} width={b * 0.3} height={unten - oben - 4} fill={f.mauerTief} opacity={0.55} />
      <path d={`M${x - b / 2 + 4} ${oben + 6} V${unten - 6}`} stroke={f.mauerHell} strokeWidth={3} strokeLinecap="round" />
      {fenster && <path d={`M${x - 4} ${oben + 26} v-6 a4 4 0 0 1 8 0 v6 Z`} fill={P.auge} />}
      {/* Cone roof with a flag. */}
      <path d={`M${x} ${oben - dachH} V${oben - dachH - 16}`} stroke={P.linie} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M${x} ${oben - dachH - 16} l13 4 -13 5 Z`} fill={f.fahne} {...UMRISS_FEIN} strokeWidth={2} />
      <path d={`M${x - b / 2 - 6} ${oben + 2} Q${x - b * 0.2} ${oben - dachH * 0.5} ${x} ${oben - dachH} Q${x + b * 0.2} ${oben - dachH * 0.5} ${x + b / 2 + 6} ${oben + 2} Z`} fill={f.dach} {...UMRISS} />
      <path d={`M${x + 1} ${oben - dachH + 6} Q${x + b * 0.2} ${oben - dachH * 0.45} ${x + b / 2 + 2} ${oben - 1} L${x + 2} ${oben - 1} Z`} fill={f.dachTief} opacity={0.6} />
      <path d={`M${x - b / 2 - 1} ${oben - 3} Q${x - b * 0.22} ${oben - dachH * 0.45} ${x - 3} ${oben - dachH + 8}`} fill="none" stroke={P.weiss} strokeWidth={2.5} strokeLinecap="round" opacity={0.45} />
    </g>
  );
}

function BurgBild({ f, boss }: { f: BurgFarben; boss: boolean }) {
  return (
    <g>
      <ellipse cx={6} cy={2} rx={104} ry={10} fill={P.schatten} opacity={0.18} />
      <Turm x={0} unten={-50} oben={-118} b={40} f={f} />
      {/* Curtain wall with battlements and the gate, where the path starts or ends. */}
      <path d={`${zinnen(-62, 62, -58)} V0 H-62 Z`} fill={f.mauer} {...UMRISS} />
      <path d="M30 -56 V-2 H60 V-56 Z" fill={f.mauerTief} opacity={0.5} />
      <path d="M-54 -50 H44" stroke={f.mauerHell} strokeWidth={3} strokeLinecap="round" />
      {[-40, -24, 24, 40].map((x) => (
        <path key={x} d={`M${x - 5} -22 h10 M${x} -36 h10 M${x - 10} -10 h8`} stroke={f.mauerTief} strokeWidth={2} strokeLinecap="round" />
      ))}
      <path d="M-18 0 V-24 A18 18 0 0 1 18 -24 V0 Z" fill={f.tor} {...UMRISS} />
      <path d="M-9 -2 V-28 M0 -2 V-40 M9 -2 V-28" stroke={P.linie} strokeWidth={2} opacity={0.45} />
      <Turm x={-66} unten={0} oben={-84} b={36} f={f} />
      <Turm x={66} unten={0} oben={-84} b={36} f={f} />
      {boss ? (
        // The boss's emblem over the gate: a skull on a dark disc.
        <g transform="translate(0 -78)">
          <circle r={19} fill={P.lila} {...UMRISS} />
          <circle r={14} fill={P.nachtTief} />
          <path d="M-8 1 A9 9 0 1 1 8 1 V5 H4 V8 H-4 V5 H-8 Z" fill={P.weiss} stroke={P.linie} strokeWidth={1.5} strokeLinejoin="round" />
          <circle cx={-3.5} cy={-1} r={2.5} fill={P.nachtTief} />
          <circle cx={3.5} cy={-1} r={2.5} fill={P.nachtTief} />
        </g>
      ) : (
        <path d="M-12 -70 h24 v10 l-12 6 -12 -6 Z" fill={P.rot} {...UMRISS_FEIN} />
      )}
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
  { id: 'burg', name: 'Burg', rahmen: [-112, -200, 224, 210], zeichnung: Burg },
  { id: 'bossburg', name: 'Boss-Burg', rahmen: [-112, -200, 224, 210], zeichnung: BossBurg },
  { id: 'baum', name: 'Laubbaum', rahmen: [-34, -70, 68, 76], zeichnung: Baum },
  { id: 'tanne', name: 'Tanne', rahmen: [-28, -72, 56, 78], zeichnung: Tanne },
  { id: 'busch', name: 'Busch', rahmen: [-24, -26, 48, 30], zeichnung: Busch },
  { id: 'blume', name: 'Blume', rahmen: [-12, -24, 24, 26], zeichnung: Blume },
  { id: 'stein', name: 'Stein', rahmen: [-18, -20, 36, 22], zeichnung: Stein },
];
