// Companions of the hero (slot `begleiter`), standing on the anchor `begleiter` beside the hero's feet.
// Each pet is drawn around (0, 0) = the ground under its feet and faces RIGHT. Few big flat shapes (8-14 per pet,
// face included), chibi build (big head, small body), no outline: `flaeche` fills and strokes in its own colour
// (docs/design/prinzipien.md). Light animals get a hard `tief` shadow shape down right so they read on cream.
import type { ReactNode } from 'react';
import type { Item } from './typen';
import { Flaeche, ovalPfad } from './flaeche';
import { flaeche, P, STRICH } from './stil';
import { Funkeln, stern } from './zeichnen';

const rad = Math.PI / 180;

/** Flat ellipse (circle if `ry` is left out). */
const Ov = ({ cx, cy, rx, ry = rx, f, o }: { cx: number; cy: number; rx: number; ry?: number; f: string; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...flaeche(f)} opacity={o} />
);
/** Flat path. */
const Pf = ({ d, f, b = 3, o }: { d: string; f: string; b?: number; o?: number }) => <path d={d} {...flaeche(f, b)} opacity={o} />;
/** Light shape (`wolke`, pale grey, so white animals read on white cards) with a hard shadow form behind it, down
 *  right (`tief`). */
const HellOv = ({ cx, cy, rx, ry = rx, f = P.wolke, t = P.wolkeTief, v = 2.5 }: { cx: number; cy: number; rx: number; ry?: number; f?: string; t?: string; v?: number }) => (
  <g>
    <ellipse cx={cx + v} cy={cy + v} rx={rx} ry={ry} {...flaeche(t)} opacity={0.6} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...flaeche(f)} />
  </g>
);
const HellPf = ({ d, f = P.wolke, t = P.wolkeTief, v = 2.5 }: { d: string; f?: string; t?: string; v?: number }) => (
  <g>
    <path d={d} transform={`translate(${v} ${v})`} {...flaeche(t)} opacity={0.6} />
    <path d={d} {...flaeche(f)} />
  </g>
);
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;

/** Eye (Held 4, 27.11.2026): white with a dark pupil looking the way the pet faces (right), no shine. `dunkel`: the
 *  older flat dark eye, for pets whose fur is as light as the white of the eye. */
const Auge = ({ x, y, r = 4.6, dunkel = false }: { x: number; y: number; r?: number; dunkel?: boolean }) =>
  dunkel ? (
    <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={P.auge} />
  ) : (
    <g>
      <ellipse cx={x} cy={y} rx={r * 1.4} ry={r * 1.55} fill={P.weiss} />
      <ellipse cx={x + r * 0.35} cy={y + r * 0.2} rx={r * 0.85} ry={r * 1.0} fill={P.auge} />
    </g>
  );
const Backe = ({ x, y, rx = 4.2, ry = 2.7 }: { x: number; y: number; rx?: number; ry?: number }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={P.backe} opacity={0.6} />
);
/** Small smile; `katze` = the "w" mouth. */
const Mund = ({ x, y, w = 4, katze = false }: { x: number; y: number; w?: number; katze?: boolean }) => (
  <path
    d={katze ? `M${x - w} ${y} Q${x - w / 2} ${y + w * 0.9} ${x} ${y} Q${x + w / 2} ${y + w * 0.9} ${x + w} ${y}` : `M${x - w} ${y} Q${x} ${y + w * 1.1} ${x + w} ${y}`}
    fill="none"
    {...STRICH}
  />
);
/** Shadow crescent bottom right, inside an ellipse. */
const Schatten = ({ cx, cy, rx, ry, farbe, a1 = -10, a2 = 115 }: { cx: number; cy: number; rx: number; ry: number; farbe: string; a1?: number; a2?: number }) => {
  rx -= 1.5;
  ry -= 1.5;
  const p = (a: number, k = 1) => `${(cx + Math.cos(a * rad) * rx * k).toFixed(1)} ${(cy + Math.sin(a * rad) * ry * k).toFixed(1)}`;
  const am = (a1 + a2) / 2;
  return <path d={`M${p(a1)} A${rx} ${ry} 0 0 1 ${p(a2)} Q${p(am, 0.45)} ${p(a1)} Z`} fill={farbe} opacity={0.5} />;
};

// ---------------------------------------------------------------- 1 Gewoehnlich

function Schnecke() {
  return (
    <g>
      {/* eye stalks with the eyes on top */}
      <path d="M17 -43 L13 -55 M26 -43 L29 -55" fill="none" stroke={P.orangeHell} strokeWidth={5} strokeLinecap="round" />
      <rect x={-31} y={-11} width={63} height={11} rx={5.5} {...flaeche(P.orangeHell)} />
      <rect x={12} y={-30} width={18} height={24} rx={9} {...flaeche(P.orangeHell)} />
      <path d="M-26 -3.5 L26 -3.5" stroke={P.orange} strokeWidth={4.5} strokeLinecap="round" opacity={0.7} />
      {/* shell: one disc, one spiral */}
      <Ov cx={-6} cy={-28} rx={21} f={P.rosa} />
      <Schatten cx={-6} cy={-28} rx={21} ry={21} farbe={P.rosaTief} />
      <path d="M-6 -28 q5 -1 5 -6 q0 -9 -10 -9 q-14 0 -14 14 q0 16 17 16" fill="none" stroke={P.rosaTief} strokeWidth={3} strokeLinecap="round" />
      <Ov cx={21} cy={-33} rx={14} f={P.orangeHell} />
      <Schatten cx={21} cy={-33} rx={14} ry={14} farbe={P.orange} />
      <circle cx={13} cy={-58} r={4.8} fill={P.auge} />
      <circle cx={29} cy={-58} r={4.8} fill={P.auge} />
      <Backe x={14} y={-29} rx={3.6} ry={2.4} />
      <Backe x={30} y={-29} rx={3.6} ry={2.4} />
      <Mund x={22} y={-31} w={3.4} />
    </g>
  );
}

function Hamster() {
  return (
    <g>
      <Ov cx={-10} cy={-4} rx={8} ry={5} f={P.sandTief} />
      <Ov cx={15} cy={-4} rx={8} ry={5} f={P.sandTief} />
      <Ov cx={-12} cy={-50} rx={8} f={P.holz} />
      <circle cx={-12} cy={-50} r={4} fill={P.rosaHell} />
      <Ov cx={13} cy={-52} rx={8} f={P.holz} />
      <circle cx={13} cy={-52} r={4} fill={P.rosaHell} />
      {/* body and head in one */}
      <Ov cx={0} cy={-27} rx={29} ry={25} f={P.holz} />
      <Schatten cx={0} cy={-27} rx={29} ry={25} farbe={P.holzTief} />
      <ellipse cx={11} cy={-19} rx={16} ry={11} fill={P.creme} />
      <Auge x={3} y={-35} r={4.6} />
      <Auge x={21} y={-35} r={4.6} />
      <ellipse cx={12} cy={-27} rx={3} ry={2.2} fill={P.auge} />
      <Mund x={12} y={-23} w={3.6} katze />
      <Backe x={-5} y={-26} rx={5} ry={3.2} />
      <Backe x={29} y={-26} rx={4} ry={3.2} />
    </g>
  );
}

function Igel() {
  const n = 9;
  const pts = Array.from({ length: n * 2 + 1 }, (_, i) => {
    const a = (95 + (i / (n * 2)) * 270) * rad; // from top right, round the back, to the bottom
    const r = i % 2 ? 24 : 32;
    return `${(-6 + Math.cos(a) * r).toFixed(1)} ${(-26 - Math.sin(a) * r * 0.95).toFixed(1)}`;
  });
  return (
    <g>
      <Ov cx={-8} cy={-3} rx={7} ry={4} f={P.sandTief} />
      <Ov cx={14} cy={-3} rx={7} ry={4} f={P.sandTief} />
      <path d={`M${pts.join(' L')} Z`} {...flaeche(P.leder)} />
      <Schatten cx={-6} cy={-26} rx={26} ry={24} farbe={P.lederTief} a1={-20} a2={100} />
      {/* face with a long snout */}
      <Pf d="M4 -4 C-2 -20 4 -38 18 -38 C28 -38 34 -30 38 -24 C40 -18 34 -4 26 -4 Z" f={P.orangeHell} />
      <Schatten cx={20} cy={-21} rx={19} ry={17} farbe={P.orange} a1={5} a2={110} />
      <circle cx={37} cy={-24} r={4} fill={P.auge} />
      <Auge x={13} y={-29} r={4.4} />
      <Auge x={24} y={-30} r={4.2} />
      <Backe x={10} y={-18} rx={3.6} ry={2.4} />
      <Mund x={24} y={-17} w={3.5} />
    </g>
  );
}

// ---------------------------------------------------------------- 2 Ungewoehnlich

function Katze() {
  return (
    <g>
      <path d="M-14 -6 Q-34 -6 -30 -28" fill="none" stroke={P.grau} strokeWidth={9} strokeLinecap="round" />
      <Pf d="M-18 0 C-22 -16 -14 -28 -2 -28 C12 -28 20 -16 18 0 Z" f={P.grau} />
      <ellipse cx={5} cy={-10} rx={8} ry={10} fill={P.schnee} />
      <Ov cx={-8} cy={-2} rx={8} ry={4} f={P.grauHell} />
      <Ov cx={12} cy={-2} rx={8} ry={4} f={P.grauHell} />
      {/* ears */}
      <Pf d="M-17 -46 L-15 -66 L0 -55 Z" f={P.grau} />
      <Pf d="M10 -55 L25 -66 L27 -46 Z" f={P.grau} />
      <path d="M-14 -50 L-13 -59 L-6 -54 Z M14 -54 L22 -59 L23 -50 Z" fill={P.rosaHell} />
      {/* head */}
      <Ov cx={5} cy={-38} rx={25} ry={19} f={P.grau} />
      <Schatten cx={5} cy={-38} rx={25} ry={19} farbe={P.grauTief} />
      <path d="M-3 -54 L-3 -48 M5 -55 L5 -48 M13 -54 L13 -48" stroke={P.grauTief} strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={12} cy={-31} rx={10} ry={7} fill={P.schnee} />
      <Auge x={-2} y={-38} r={5.2} />
      <Auge x={17} y={-38} r={5.2} />
      <Pf d="M9 -34 L15 -34 L12 -30 Z" f={P.rosa} b={2} />
      <Mund x={12} y={-28} w={3.6} katze />
      <Backe x={-9} y={-30} rx={4.2} ry={2.7} />
      <Backe x={27} y={-30} rx={3.6} ry={2.7} />
    </g>
  );
}

function Pinguin() {
  return (
    <g>
      <Ov cx={-9} cy={-2.5} rx={9} ry={4} f={P.orange} />
      <Ov cx={11} cy={-2.5} rx={9} ry={4} f={P.orange} />
      <Flaeche d="M-24 -50 C-30 -26 -26 -4 0 -4 C26 -4 28 -26 22 -50 C18 -62 -18 -62 -24 -50 Z" farbe={P.dunkel} hell={P.dunkelHell} />
      <Pf d="M-22 -34 Q-35 -22 -27 -10 Q-19 -18 -16 -28 Z" f={P.dunkelHell} />
      <Pf d="M22 -34 Q35 -22 29 -10 Q21 -18 17 -28 Z" f={P.dunkelHell} />
      {/* white face and belly with its shadow */}
      <Pf d="M-14 -46 C-14 -56 -2 -56 4 -52 C10 -56 22 -56 20 -46 C28 -36 24 -9 4 -9 C-16 -9 -22 -36 -14 -46 Z" f={P.schnee} />
      <path d="M21 -34 C22 -20 18 -9 4 -9 C-4 -9 -8 -12 -10 -16 C0 -10 16 -14 21 -34 Z" fill={P.eisTief} opacity={0.7} />
      <Pf d="M14 -40 Q27 -39 26 -33 Q21 -29 13 -32 Z" f={P.orange} />
      <Auge x={2} y={-42} r={4.4} />
      <Auge x={18} y={-42} r={4.4} />
      <Backe x={-4} y={-34} rx={4} ry={2.6} />
      <Backe x={23} y={-34} rx={3.4} ry={2.4} />
    </g>
  );
}

function Papagei() {
  return (
    <g>
      <Pf d="M-8 -14 Q-26 -8 -29 -2 Q-18 0 -6 -4 Z" f={P.blau} />
      <Pf d="M-4 -12 Q-18 -2 -22 1 Q-8 3 0 -4 Z" f={P.gruen} />
      <Ov cx={-3} cy={-2} rx={5} ry={2.6} f={P.orange} />
      <Ov cx={9} cy={-2} rx={5} ry={2.6} f={P.orange} />
      <Ov cx={1} cy={-24} rx={19} ry={23} f={P.rot} />
      <Schatten cx={1} cy={-24} rx={19} ry={23} farbe={P.rotTief} />
      <ellipse cx={8} cy={-15} rx={9} ry={10} fill={P.orangeHell} />
      <Pf d="M-14 -34 C-24 -22 -20 -8 -8 -8 C-2 -18 -2 -28 -6 -36 Z" f={P.blau} />
      <Ov cx={5} cy={-45} rx={17} f={P.rot} />
      <Schatten cx={5} cy={-45} rx={17} ry={17} farbe={P.rotTief} />
      <Pf d="M-4 -59 Q-2 -67 6 -64 Q0 -62 -1 -57 Z" f={P.gelb} />
      <circle cx={10} cy={-46} r={9} fill={P.weiss} />
      <Auge x={11} y={-46} r={4.4} />
      <Backe x={2} y={-37} rx={3.6} ry={2.4} />
      <Pf d="M17 -50 Q31 -52 30 -38 Q28 -33 24 -37 Q22 -43 16 -42 Z" f={P.gold} />
    </g>
  );
}

// ---------------------------------------------------------------- 3 Selten

function Eule() {
  return (
    <g>
      <Ov cx={-7} cy={-2.5} rx={7} ry={3.6} f={P.gold} />
      <Ov cx={11} cy={-2.5} rx={7} ry={3.6} f={P.gold} />
      <Pf d="M-22 -48 L-24 -64 L-10 -55 Z" f={P.leder} />
      <Pf d="M16 -55 L30 -64 L28 -48 Z" f={P.leder} />
      <Pf d="M-24 -42 C-30 -22 -22 -2 2 -2 C26 -2 32 -22 26 -42 C24 -58 -22 -58 -24 -42 Z" f={P.leder} />
      <Schatten cx={1} cy={-30} rx={27} ry={28} farbe={P.lederTief} />
      <ellipse cx={4} cy={-15} rx={13} ry={12} fill={P.sand} />
      <Flaeche d="M-24 -32 C-34 -20 -28 -6 -14 -8 C-14 -18 -16 -26 -20 -34 Z" farbe={P.lederTief} hell={P.lederHell} />
      <Flaeche d="M26 -32 C34 -20 30 -8 20 -10 C20 -18 20 -26 22 -34 Z" farbe={P.lederTief} hell={P.lederHell} />
      <Ov cx={-4} cy={-40} rx={11} f={P.sand} />
      <Ov cx={17} cy={-40} rx={11} f={P.sand} />
      <Auge x={-2} y={-40} r={5.6} />
      <Auge x={19} y={-40} r={5.6} />
      <Pf d="M6 -37 L15 -37 L10.5 -29 Z" f={P.gold} b={2.5} />
      <Backe x={-15} y={-27} rx={4} ry={2.6} />
      <Backe x={29} y={-27} rx={3.4} ry={2.6} />
    </g>
  );
}

function FuchsHaustier() {
  return (
    <g>
      <Pf d="M-12 -6 C-38 -4 -40 -34 -28 -42 C-22 -30 -16 -22 -8 -18 Z" f={P.fell} />
      <HellPf d="M-28 -42 C-40 -34 -37 -24 -34 -18 C-29 -22 -24 -32 -28 -42 Z" f={P.creme} t={P.sandTief} v={1.5} />
      <Ov cx={-7} cy={-2} rx={8} ry={4} f={P.fellTief} />
      <Ov cx={11} cy={-2} rx={8} ry={4} f={P.fellTief} />
      <Pf d="M-16 0 C-20 -16 -12 -28 0 -28 C14 -28 20 -16 18 0 Z" f={P.fell} />
      <ellipse cx={6} cy={-10} rx={7} ry={10} fill={P.creme} />
      <Pf d="M-18 -46 L-18 -66 L-2 -54 Z" f={P.fell} />
      <Pf d="M12 -54 L28 -66 L28 -44 Z" f={P.fell} />
      <path d="M-15 -50 L-15 -59 L-7 -53 Z M16 -52 L25 -58 L25 -49 Z" fill={P.ohrInnen} />
      {/* head with the pale cheeks running down to the snout */}
      <Pf d="M-26 -38 C-26 -54 -12 -57 4 -57 C20 -57 30 -54 30 -42 L36 -34 L28 -30 C22 -22 8 -20 2 -20 C-14 -20 -26 -26 -26 -38 Z" f={P.fell} />
      <path d="M4 -34 C14 -34 24 -34 30 -30 C24 -22 10 -20 2 -20 C-8 -22 -14 -28 -16 -32 C-10 -34 -2 -34 4 -34 Z" fill={P.creme} />
      <circle cx={34} cy={-35} r={3.4} fill={P.auge} />
      <Auge x={-2} y={-40} r={5} />
      <Auge x={16} y={-40} r={5} />
      <Backe x={-10} y={-31} rx={4} ry={2.6} />
      <Backe x={24} y={-31} rx={3.4} ry={2.4} />
      <Mund x={19} y={-27} w={3.4} />
    </g>
  );
}

function Axolotl() {
  const kieme = { fill: 'none', stroke: P.rosaTief, strokeWidth: 6, strokeLinecap: 'round' as const };
  return (
    <g>
      <path d="M-8 -34 L-24 -46 M-4 -38 L-14 -54 M2 -41 L1 -58" {...kieme} />
      <path d="M24 -37 L35 -50 M20 -41 L26 -57" {...kieme} />
      <Pf d="M-14 -8 Q-36 -10 -32 -24 Q-26 -4 -8 -2 Z" f={P.rosa} />
      <Ov cx={-6} cy={-13} rx={25} ry={12} f={P.rosa} />
      <Schatten cx={-6} cy={-13} rx={25} ry={12} farbe={P.rosaTief} />
      <Ov cx={-18} cy={-2.5} rx={6} ry={3.4} f={P.rosaTief} />
      <Ov cx={14} cy={-2.5} rx={7} ry={3.4} f={P.rosaTief} />
      <Ov cx={8} cy={-29} rx={23} ry={18} f={P.rosa} />
      <Schatten cx={8} cy={-29} rx={23} ry={18} farbe={P.rosaTief} />
      <Auge x={1} y={-31} r={4.8} />
      <Auge x={19} y={-31} r={4.8} />
      <Backe x={-7} y={-23} rx={4.2} ry={2.7} />
      <Backe x={27} y={-23} rx={3.6} ry={2.7} />
      <Mund x={10} y={-26} w={5.5} />
    </g>
  );
}

// ---------------------------------------------------------------- 4 Episch

function Roboter() {
  return (
    <g>
      <rect x={-17} y={-7} width={14} height={7} rx={3} {...flaeche(P.metallTief)} />
      <rect x={3} y={-7} width={14} height={7} rx={3} {...flaeche(P.metallTief)} />
      {/* antenna with a gem */}
      <path d="M2 -50 L2 -58" stroke={P.metallTief} strokeWidth={4} strokeLinecap="round" />
      <Ov cx={2} cy={-62} rx={5} f={P.blau} />
      {/* body with the star */}
      <rect x={-17} y={-26} width={34} height={21} rx={7} {...flaeche(P.metall)} />
      <path d="M-12 -8 L12 -8" stroke={P.metallTief} strokeWidth={4} strokeLinecap="round" />
      <path d={stern(0, -16.5, 6.5)} fill={P.blau} stroke={P.blau} strokeWidth={1.5} strokeLinejoin="round" />
      <rect x={-27} y={-24} width={9} height={15} rx={4.5} {...flaeche(P.metallTief)} />
      <rect x={18} y={-24} width={9} height={15} rx={4.5} {...flaeche(P.metallTief)} />
      {/* head with its shadow, ear bolts and visor */}
      <rect x={-33} y={-42} width={7} height={11} rx={3} {...flaeche(P.metallTief)} />
      <rect x={30} y={-42} width={7} height={11} rx={3} {...flaeche(P.metallTief)} />
      <rect x={-27} y={-52} width={58} height={30} rx={11} {...flaeche(P.metall)} />
      <path d="M31 -40 L31 -34 Q31 -22 20 -22 L-6 -22 Q20 -24 24 -34 Z" fill={P.metallTief} opacity={0.5} />
      <Flaeche d={rr(-20, -47, 46, 20, 9)} farbe={P.dunkel} hell={P.dunkelHell} />
      <ellipse cx={-4} cy={-38} rx={5.5} ry={6.3} fill={P.blauHell} />
      <ellipse cx={15} cy={-38} rx={5.5} ry={6.3} fill={P.blauHell} />
      <path d="M4 -31 Q5.5 -29 7 -31" fill="none" stroke={P.blauHell} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

function Einhorn() {
  return (
    <g>
      <Pf d="M-20 -26 C-38 -28 -38 -6 -30 -2 C-28 -12 -22 -16 -16 -16 Z" f={P.rosa} />
      <HellPf d={rr(-21, -14, 10, 14, 5)} t={P.eisTief} />
      <HellPf d={rr(5, -14, 10, 14, 5)} t={P.eisTief} />
      <rect x={-21} y={-4} width={10} height={4} rx={2} fill={P.gold} />
      <rect x={5} y={-4} width={10} height={4} rx={2} fill={P.gold} />
      <HellOv cx={-5} cy={-21} rx={23} ry={13} t={P.eisTief} />
      {/* mane behind the head, the forelock in a second colour */}
      <Pf d="M12 -66 C-10 -68 -16 -44 -10 -26 C-4 -34 2 -38 8 -40 Z" f={P.rosa} />
      <HellOv cx={16} cy={-42} rx={19} t={P.eisTief} />
      <HellOv cx={31} cy={-34} rx={9} ry={7} t={P.eisTief} />
      <HellPf d="M6 -56 L5 -72 L17 -62 Z" t={P.eisTief} />
      <Pf d="M17 -58 L32 -90 L30 -53 Z" f={P.gold} />
      <path d="M22 -68 L30 -64 M24 -77 L31 -73" stroke={P.goldTief} strokeWidth={2.5} strokeLinecap="round" />
      <Pf d="M8 -58 C12 -67 25 -65 25 -52 C20 -56 14 -57 8 -58 Z" f={P.tuerkisHell} />
      <Auge x={22} y={-42} r={4.6} />
      <Backe x={26} y={-35} rx={3.6} ry={2.4} />
      <Mund x={31} y={-29} w={3} />
    </g>
  );
}

// ---------------------------------------------------------------- 5 Legendaer

/** Bigger than the other pets, with a big head and flapping bat wings, smoke from the nose. */
function Drache({ zeit }: { zeit: number }) {
  const schlag = Math.sin(zeit * 4) * 12;
  const rauch = (zeit * 0.8) % 1;
  const fluegel = 'M-8 -44 C-18 -70 -34 -84 -46 -80 C-42 -70 -44 -64 -52 -62 C-46 -58 -48 -50 -54 -46 C-40 -48 -28 -40 -16 -36 Z';
  return (
    <g transform="translate(-10 0)">
      <g transform={`rotate(${schlag} -8 -44)`}>
        <Pf d={fluegel} f={P.lilaTief} />
      </g>
      <Pf d="M-16 -10 Q-42 -4 -46 -24 Q-40 -12 -26 -16 Q-20 -18 -18 -24 Z" f={P.gruen} />
      <Pf d="M-24 -46 L-28 -58 L-16 -50 Z M-26 -34 L-36 -40 L-24 -40 Z" f={P.rot} />
      <Ov cx={-6} cy={-3} rx={9} ry={5} f={P.gruenTief} />
      <Ov cx={14} cy={-3} rx={9} ry={5} f={P.gruenTief} />
      <Ov cx={0} cy={-26} rx={22} f={P.gruen} />
      <Schatten cx={0} cy={-26} rx={22} ry={22} farbe={P.gruenTief} />
      <Ov cx={8} cy={-22} rx={11} ry={15} f={P.goldHell} />
      <g transform={`rotate(${-schlag} -4 -40)`}>
        <Pf d={fluegel} f={P.lila} />
      </g>
      <Pf d="M-4 -80 Q-16 -92 -26 -90 Q-16 -84 -10 -74 Z" f={P.gold} />
      <Pf d="M10 -83 Q5 -97 -5 -99 Q3 -89 3 -78 Z" f={P.gold} />
      <Pf d="M-14 -66 C-14 -84 -2 -88 10 -86 C20 -85 28 -80 32 -74 L44 -70 C48 -68 48 -60 44 -58 C36 -54 22 -52 10 -52 C-6 -52 -14 -58 -14 -66 Z" f={P.gruen} />
      <Schatten cx={12} cy={-68} rx={28} ry={16} farbe={P.gruenTief} />
      <Pf d="M31 -57 L33 -50 L36 -57 Z" f={P.weiss} b={2} />
      <path d="M22 -58 Q34 -56 44 -60" fill="none" {...STRICH} />
      <Auge x={14} y={-72} r={4.6} />
      <Backe x={8} y={-62} rx={4} ry={2.6} />
      <circle cx={48 + rauch * 8} cy={-72 - rauch * 14} r={2.5 + rauch * 3} fill={P.grauHell} opacity={0.8 * (1 - rauch)} />
    </g>
  );
}

function Phoenix({ zeit }: { zeit: number }) {
  const f = (k: number) => Math.sin(zeit * 6 + k);
  const flamme = (x: number, y: number, l: number, b: number, k: number, farbe: string, rot = 0) => {
    const len = l * (1 + 0.14 * f(k));
    const sw = b * f(k + 1.7) * 0.25;
    return (
      <path
        key={k}
        d={`M${x - b} ${y} Q${x - b * 0.9 + sw} ${y - len * 0.55} ${x + sw * 1.5} ${y - len} Q${x + b * 0.9 + sw} ${y - len * 0.5} ${x + b} ${y} Z`}
        {...flaeche(farbe, 2.5)}
        transform={`rotate(${rot} ${x} ${y})`}
      />
    );
  };
  return (
    <g>
      {/* tail flames, hanging down-left */}
      <g transform="translate(-12 -22) rotate(-112)">
        {flamme(0, 0, 30, 5.5, 0, P.lava, -16)}
        {flamme(0, 0, 34, 5.5, 2, P.orange, 0)}
        {flamme(0, 0, 28, 5, 4, P.gelb, 16)}
      </g>
      <path d="M-3 -12 L-3 -4 M7 -12 L7 -4" stroke={P.gold} strokeWidth={4.5} strokeLinecap="round" />
      <Ov cx={0} cy={-25} rx={17} ry={15} f={P.lava} />
      <Schatten cx={0} cy={-25} rx={17} ry={15} farbe={P.lavaTief} />
      <ellipse cx={7} cy={-21} rx={9} ry={9} fill={P.gelb} />
      <Ov cx={-6} cy={-25} rx={11} ry={9} f={P.orange} />
      {/* crest */}
      <g transform="translate(6 -52)">
        {flamme(-4, 0, 14, 3.6, 7, P.orange, -26)}
        {flamme(3, 0, 18, 4, 9, P.gelb, 8)}
      </g>
      <Ov cx={8} cy={-44} rx={15} f={P.lava} />
      <Schatten cx={8} cy={-44} rx={15} ry={15} farbe={P.lavaTief} />
      <Pf d="M21 -46 Q32 -46 31 -40 Q27 -37 21 -39 Z" f={P.gold} />
      <Auge x={7} y={-45} r={4.8} />
      <Backe x={1} y={-37} rx={3.6} ry={2.4} />
      <Funkeln x={-26} y={-52} r={7} zeit={zeit} />
      <Funkeln x={28} y={-14} r={5} zeit={zeit} versatz={2} />
    </g>
  );
}

// ---------------------------------------------------------------- 13.11.2026 (20261129_lernquest_neue_teile.sql)

function Hase() {
  return (
    <g>
      {/* Not pale (review 19.11.2026): three tones of white (back ear dark, body middle, head and tail light), a shade
          under the belly, pink inside both ears. */}
      <Pf d="M6 -44 Q-4 -70 4 -78 Q14 -72 12 -44 Z" f={P.wolkeTief} />
      <path d="M6 -50 Q2 -64 5 -71" fill="none" stroke={P.rosa} strokeWidth={3.5} strokeLinecap="round" />
      <HellPf d="M16 -44 Q16 -76 26 -78 Q32 -66 22 -42 Z" />
      <path d="M21 -48 Q22 -64 26 -69" fill="none" stroke={P.rosaHell} strokeWidth={4.5} strokeLinecap="round" />
      <HellOv cx={-4} cy={-18} rx={24} ry={18} />
      <Schatten cx={-4} cy={-18} rx={24} ry={18} farbe={P.wolkeTief} a1={0} a2={150} />
      <HellOv cx={-26} cy={-20} rx={8} f={P.wolkeHell} />
      <HellOv cx={14} cy={-3} rx={10} ry={4.5} />
      <HellOv cx={16} cy={-38} rx={17} f={P.wolkeHell} />
      <Auge x={12} y={-40} r={3.9} />
      <Auge x={24} y={-40} r={3.6} />
      <ellipse cx={30} cy={-34} rx={2.6} ry={2} fill={P.rosa} />
      <Mund x={28} y={-30} w={2.6} katze />
      <Backe x={8} y={-32} rx={3.6} ry={2.4} />
    </g>
  );
}

function Frosch() {
  return (
    <g>
      <Ov cx={-18} cy={-8} rx={14} ry={8} f={P.gruen} />
      <Ov cx={0} cy={-20} rx={26} ry={20} f={P.gruenHell} />
      <Schatten cx={0} cy={-20} rx={26} ry={20} farbe={P.gruen} />
      <ellipse cx={6} cy={-12} rx={15} ry={9} fill={P.gelbHell} />
      <Ov cx={12} cy={-2} rx={9} ry={4} f={P.gruen} />
      {[2, 22].map((x) => (
        <g key={x}>
          <Ov cx={x} cy={-42} rx={9.5} f={P.gruenHell} />
          <Auge x={x + 1} y={-42} r={4.6} />
        </g>
      ))}
      <path d="M2 -27 Q14 -19 28 -27" fill="none" {...STRICH} />
      <Backe x={-3} y={-27} rx={3.8} ry={2.4} />
      <Backe x={30} y={-27} rx={3.2} ry={2.2} />
    </g>
  );
}

function Panda() {
  return (
    <g>
      {/* bamboo */}
      <path d="M-30 0 V-58" stroke={P.gruenHell} strokeWidth={5} strokeLinecap="round" />
      <Pf d="M-30 -48 q-10 -4 -12 -12 q9 1 12 8 Z" f={P.gruen} b={2.5} />
      <Flaeche d={ovalPfad(-10, -3, 9, 5)} farbe={P.dunkel} hell={P.dunkelHell} />
      <Flaeche d={ovalPfad(12, -3, 9, 5)} farbe={P.dunkel} hell={P.dunkelHell} />
      <HellOv cx={0} cy={-18} rx={22} ry={18} />
      <path d="M-17 -28 Q-26 -14 -14 -4 M17 -28 Q26 -18 20 -6" fill="none" stroke={P.dunkel} strokeWidth={9} strokeLinecap="round" />
      <Flaeche d={ovalPfad(-4, -56, 7, 7)} farbe={P.dunkel} hell={P.dunkelHell} />
      <Flaeche d={ovalPfad(20, -56, 7, 7)} farbe={P.dunkel} hell={P.dunkelHell} />
      <HellOv cx={8} cy={-42} rx={18} />
      <ellipse cx={2} cy={-42} rx={5.5} ry={7} fill={P.dunkel} transform="rotate(20 2 -42)" />
      <ellipse cx={15} cy={-42} rx={5.5} ry={7} fill={P.dunkel} transform="rotate(-20 15 -42)" />
      {/* Eyes stay dark and flat (no white dots): a lighter socket in the patch carries them */}
      <circle cx={2.5} cy={-43} r={4.4} fill={P.dunkelHell} />
      <circle cx={14.5} cy={-43} r={4.4} fill={P.dunkelHell} />
      <circle cx={2.5} cy={-43} r={3} fill={P.auge} />
      <circle cx={14.5} cy={-43} r={3} fill={P.auge} />
      <ellipse cx={9} cy={-34} rx={3} ry={2.2} fill={P.auge} />
      <Mund x={9} y={-31} w={2.8} katze />
    </g>
  );
}

function Mondwolf({ zeit }: { zeit: number }) {
  const glanz = 0.6 + Math.sin(zeit * 2) * 0.3;
  return (
    <g>
      <Pf d="M-18 -14 Q-42 -22 -38 -46 Q-30 -34 -16 -30 Z" f={P.grau} />
      <Pf d="M-20 0 Q-26 -32 0 -38 Q20 -38 18 -18 Q18 -4 10 0 Z" f={P.grau} />
      <path d="M0 -34 Q12 -28 10 -3 L2 -3 Q4 -20 -4 -28 Z" fill={P.grauHell} />
      <Ov cx={-6} cy={-2} rx={8} ry={4} f={P.grauHell} />
      <Ov cx={12} cy={-2} rx={8} ry={4} f={P.grauHell} />
      {/* head with pointed ears and a snout to the right */}
      <Pf d="M-2 -52 L2 -72 L14 -58 Z" f={P.grau} />
      <Pf d="M16 -58 L26 -72 L30 -52 Z" f={P.grau} />
      <path d="M3 -58 L4 -66 L10 -59 Z M20 -59 L25 -66 L26 -57 Z" fill={P.rosaHell} />
      <Pf d="M-6 -44 Q-4 -64 14 -64 Q34 -62 32 -48 L42 -40 Q42 -32 32 -32 Q20 -26 6 -30 Q-8 -34 -6 -44 Z" f={P.grau} />
      <Pf d="M20 -38 L42 -40 Q42 -32 32 -32 Q24 -30 18 -34 Z" f={P.grauHell} />
      <circle cx={42} cy={-40} r={3.4} fill={P.auge} />
      <Auge x={12} y={-47} r={4} />
      <Auge x={26} y={-47} r={3.8} />
      <Backe x={6} y={-38} rx={3.6} ry={2.4} />
      {/* the moon on the forehead glows */}
      <path d="M13 -61 A6 6 0 1 0 19 -54 A4.6 4.6 0 1 1 13 -61 Z" fill={P.gelb} opacity={glanz} />
      <Funkeln x={-30} y={-58} r={5} zeit={zeit} />
    </g>
  );
}

function Sternenhirsch({ zeit }: { zeit: number }) {
  const glanz = 0.7 + Math.sin(zeit * 2.5) * 0.3;
  return (
    <g>
      <path d="M-16 -16 V-3 M-6 -16 V-3" stroke={P.holzTief} strokeWidth={6.5} strokeLinecap="round" />
      <path d="M10 -16 V-3 M20 -16 V-3" stroke={P.holz} strokeWidth={6.5} strokeLinecap="round" />
      <Ov cx={2} cy={-22} rx={26} ry={12} f={P.holz} />
      <Schatten cx={2} cy={-22} rx={26} ry={12} farbe={P.holzTief} />
      <Pf d="M8 -30 L16 -48 L32 -44 L28 -26 Z" f={P.holz} />
      <Pf d="M12 -52 Q4 -52 2 -59 Q10 -61 16 -55 Z" f={P.holz} />
      <Pf d="M30 -56 Q34 -62 42 -61 Q40 -54 33 -52 Z" f={P.holzTief} />
      <Ov cx={24} cy={-43} rx={17} f={P.holz} />
      <Schatten cx={24} cy={-43} rx={17} ry={17} farbe={P.holzTief} />
      <Ov cx={34} cy={-37} rx={8} ry={6} f={P.sand} />
      <ellipse cx={38} cy={-39} rx={2.6} ry={2.2} fill={P.auge} />
      <Auge x={18} y={-46} r={4} />
      <Auge x={29} y={-47} r={3.8} />
      <Backe x={14} y={-38} rx={3.6} ry={2.4} />
      {/* antlers of light with stars */}
      <g opacity={glanz}>
        <path d="M19 -58 Q12 -72 18 -85 M15 -70 L7 -76 M30 -59 Q36 -72 31 -86 M34 -71 L42 -77" fill="none" stroke={P.gold} strokeWidth={4} strokeLinecap="round" />
        <path d={stern(18, -88, 5.5)} fill={P.gelb} stroke={P.gold} strokeWidth={2} strokeLinejoin="round" />
        <path d={stern(31, -90, 5)} fill={P.gelb} stroke={P.gold} strokeWidth={2} strokeLinejoin="round" />
      </g>
      <Funkeln x={-24} y={-48} r={6} zeit={zeit} />
      <Funkeln x={-4} y={-66} r={4} zeit={zeit} versatz={2} />
    </g>
  );
}

// ---------------------------------------------------------------- 26.11.2026 (20261205_lernquest_welten_teile.sql)

function Erdmaennchen() {
  return (
    <g>
      {/* Standing up on watch: a tall body, paws held at the chest, dark patches round the eyes */}
      <path d="M-8 -6 Q-24 -4 -26 -20" fill="none" stroke={P.holz} strokeWidth={6} strokeLinecap="round" />
      <path d="M-26 -20 L-25 -25" fill="none" stroke={P.holzTief} strokeWidth={6} strokeLinecap="round" />
      <Ov cx={-5} cy={-3} rx={8} ry={4} f={P.holz} />
      <Ov cx={10} cy={-3} rx={8} ry={4} f={P.holz} />
      <Ov cx={2} cy={-26} rx={14} ry={24} f={P.holzHell} />
      <Schatten cx={2} cy={-26} rx={14} ry={24} farbe={P.holz} />
      <ellipse cx={6} cy={-22} rx={7} ry={15} fill={P.sand} />
      <path d="M8 -38 Q16 -36 15 -30 M4 -37 Q12 -33 11 -27" fill="none" stroke={P.holz} strokeWidth={5} strokeLinecap="round" />
      <Ov cx={-4} cy={-66} rx={4} f={P.holz} />
      <Pf d="M-8 -58 Q-8 -72 6 -72 Q18 -72 20 -62 L28 -58 Q28 -52 20 -51 Q12 -46 2 -48 Q-8 -50 -8 -58 Z" f={P.holzHell} />
      <circle cx={28} cy={-57} r={2.8} fill={P.auge} />
      <ellipse cx={5} cy={-60} rx={5.5} ry={5} fill={P.holz} />
      <ellipse cx={16} cy={-61} rx={5} ry={4.6} fill={P.holz} />
      <Auge x={6} y={-60} r={3.4} />
      <Auge x={16} y={-61} r={3.2} />
      <Mund x={22} y={-53} w={2.6} />
      <Backe x={2} y={-52} rx={3.4} ry={2.2} />
    </g>
  );
}

function Feuersalamander() {
  return (
    <g>
      {/* Black with yellow spots (lighter sockets carry the dark eyes), a little flame at the tip of the tail */}
      <path d="M-40 -20 Q-46 -26 -42 -34 Q-40 -28 -36 -30 Q-36 -24 -40 -20 Z" {...flaeche(P.lava, 2.5)} />
      <Flaeche d="M-14 -10 Q-30 -8 -40 -20 Q-28 -14 -16 -18 Z" farbe={P.dunkel} hell={P.dunkelHell} />
      <Flaeche d={ovalPfad(-14, -3, 6, 4)} farbe={P.dunkel} hell={P.dunkelHell} />
      <Flaeche d={ovalPfad(10, -3, 6, 4)} farbe={P.dunkel} hell={P.dunkelHell} />
      <Flaeche d={ovalPfad(-4, -13, 20, 10)} farbe={P.dunkel} hell={P.dunkelHell} />
      <Flaeche d={ovalPfad(20, -24, 16, 13)} farbe={P.dunkel} hell={P.dunkelHell} />
      <ellipse cx={-14} cy={-17} rx={5} ry={3} fill={P.gelb} />
      <ellipse cx={0} cy={-19} rx={4.5} ry={3} fill={P.gelb} />
      <ellipse cx={-28} cy={-15} rx={3.5} ry={2.4} fill={P.gelb} />
      <path d="M10 -33 Q18 -39 28 -34" fill="none" stroke={P.gelb} strokeWidth={5} strokeLinecap="round" />
      <circle cx={16} cy={-26} r={5} fill={P.dunkelHell} />
      <circle cx={28} cy={-26} r={4.6} fill={P.dunkelHell} />
      <circle cx={16} cy={-26} r={3.2} fill={P.auge} />
      <circle cx={28} cy={-26} r={3} fill={P.auge} />
      <path d="M22 -17 Q28 -13 34 -18" fill="none" stroke={P.dunkelHell} strokeWidth={2.5} strokeLinecap="round" />
      <Backe x={12} y={-18} rx={3.4} ry={2.2} />
    </g>
  );
}

function Alien() {
  return (
    <g>
      {/* A small green alien in a glass helmet: big head, big dark eyes, two antennae */}
      <Ov cx={-6} cy={-3} rx={7} ry={4} f={P.gruen} />
      <Ov cx={10} cy={-3} rx={7} ry={4} f={P.gruen} />
      <Pf d="M-12 -4 Q-16 -22 2 -26 Q20 -22 16 -4 Z" f={P.lila} />
      <path d="M8 -22 Q18 -18 15 -6" fill="none" stroke={P.lilaTief} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      <path d="M14 -16 Q22 -14 22 -8" fill="none" stroke={P.gruenHell} strokeWidth={5} strokeLinecap="round" />
      <path d="M-2 -60 L-6 -70 M10 -60 L15 -70" fill="none" stroke={P.gruen} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={-6} cy={-72} r={3.6} fill={P.gelb} />
      <circle cx={15} cy={-72} r={3.6} fill={P.gelb} />
      <Ov cx={4} cy={-44} rx={19} ry={17} f={P.gruenHell} />
      <Schatten cx={4} cy={-44} rx={19} ry={17} farbe={P.gruen} />
      <ellipse cx={3} cy={-46} rx={4.6} ry={7} fill={P.auge} transform="rotate(-18 3 -46)" />
      <ellipse cx={16} cy={-46} rx={4.2} ry={6.6} fill={P.auge} transform="rotate(18 16 -46)" />
      <Mund x={11} y={-36} w={2.8} />
      <Backe x={-4} y={-38} rx={3.4} ry={2.2} />
      {/* the helmet: a pale glass bubble with a light stroke top left and a metal ring at the neck */}
      <circle cx={4} cy={-46} r={27} fill={P.blauHell} fillOpacity={0.28} stroke={P.blauHell} strokeWidth={3} />
      <path d="M-15 -58 Q-10 -68 0 -71" fill="none" stroke={P.weiss} strokeWidth={3.5} strokeLinecap="round" opacity={0.9} />
      <rect x={-12} y={-25} width={32} height={7} rx={3.5} {...flaeche(P.metall, 2)} />
    </g>
  );
}

function Eisbaer() {
  return (
    <g>
      {/* A polar bear cub on four legs, head to the right, a blue scarf with a gold star */}
      <HellOv cx={-20} cy={-5} rx={6} ry={6} />
      <HellOv cx={6} cy={-5} rx={6} ry={6} />
      <HellOv cx={-4} cy={-21} rx={25} ry={16} />
      <Schatten cx={-4} cy={-21} rx={25} ry={16} farbe={P.wolkeTief} a1={0} a2={150} />
      <HellOv cx={-12} cy={-4} rx={6} ry={5} f={P.wolkeHell} />
      <HellOv cx={14} cy={-4} rx={6} ry={5} f={P.wolkeHell} />
      <HellOv cx={9} cy={-50} rx={5.5} />
      <HellOv cx={27} cy={-51} rx={5.5} />
      <circle cx={9} cy={-50} r={2.6} fill={P.rosaHell} />
      <circle cx={27} cy={-51} r={2.6} fill={P.rosaHell} />
      <HellOv cx={19} cy={-38} rx={16} ry={15} f={P.wolkeHell} />
      <HellOv cx={31} cy={-33} rx={8} ry={6} f={P.wolkeHell} />
      <ellipse cx={37} cy={-35} rx={3.2} ry={2.5} fill={P.auge} />
      <Auge x={16} y={-41} r={3.6} />
      <Auge x={27} y={-42} r={3.4} />
      <Mund x={33} y={-29} w={2.6} />
      <Backe x={12} y={-33} rx={3.4} ry={2.2} />
      <path d="M6 -27 Q19 -20 32 -26 L32 -20 Q19 -14 6 -21 Z" {...flaeche(P.blau, 2.5)} />
      <path d="M10 -22 L6 -6 L15 -8 Z" {...flaeche(P.blauTief, 2.5)} />
      <path d={stern(22, -21, 4.5)} {...flaeche(P.gold, 2)} />
    </g>
  );
}

function Leuchtqualle({ zeit }: { zeit: number }) {
  // Floats and glows: the whole jellyfish bobs, its four tentacles wave, the light inside pulses.
  const auf = Math.sin(zeit * 1.6) * 4;
  const glanz = 0.5 + Math.sin(zeit * 2.2) * 0.25;
  return (
    <g>
      <ellipse cx={0} cy={-2} rx={14 - auf * 0.8} ry={3} fill={P.schatten} opacity={0.15} />
      <g transform={`translate(0 ${auf.toFixed(2)})`}>
        <circle cx={0} cy={-60} r={30} fill={P.lilaHell} opacity={(glanz * 0.5).toFixed(2)} />
        {[0, 1, 2, 3].map((i) => {
          const x = -12 + i * 8;
          const w = Math.sin(zeit * 3 + i * 1.3) * 5;
          return <path key={i} d={`M${x} -44 Q${(x + w).toFixed(1)} -34 ${x} -26 T${x} -10`} fill="none" stroke={i % 2 ? P.rosa : P.lila} strokeWidth={4} strokeLinecap="round" />;
        })}
        <Pf d="M-23 -44 Q-25 -78 0 -80 Q25 -78 23 -44 Q17 -40 11.5 -44 Q6 -40 0 -44 Q-6 -40 -11.5 -44 Q-17 -40 -23 -44 Z" f={P.lilaHell} />
        <path d="M10 -76 Q24 -70 23 -46 Q17 -42 12 -45 Q18 -60 10 -76 Z" fill={P.lila} opacity={0.5} />
        <ellipse cx={-8} cy={-64} rx={7} ry={6} fill={P.rosaHell} opacity={(glanz + 0.3).toFixed(2)} />
        <path d="M-15 -68 Q-12 -74 -6 -76" fill="none" stroke={P.wolkeHell} strokeWidth={3} strokeLinecap="round" />
        {[-14, 0, 14].map((x) => (
          <circle key={x} cx={x} cy={-46} r={2.6} {...flaeche(P.goldHell, 2)} />
        ))}
        <Auge x={2} y={-58} r={3.6} />
        <Auge x={13} y={-58} r={3.4} />
        <Mund x={8} y={-52} w={2.6} />
        <Backe x={-3} y={-52} rx={3.4} ry={2.2} />
        <Backe x={18} y={-52} rx={2.8} ry={2} />
      </g>
      <Funkeln x={-26} y={-82} r={6} zeit={zeit} />
      <Funkeln x={26} y={-40} r={5} zeit={zeit} versatz={2.2} />
    </g>
  );
}

const rahmen = (x: number, y: number, w: number, h: number) => [x, y, w, h] as const;
const tier = (id: string, name: string, seltenheit: Item['seltenheit'], r: readonly [number, number, number, number], zeichnung: (zeit: number) => ReactNode, bewegt = false): Item => ({
  id,
  name,
  platz: 'begleiter',
  seltenheit,
  rahmen: r,
  ...(bewegt ? { bewegt: true } : {}),
  zeichnung,
});

export const BEGLEITER_ITEMS: Item[] = [
  tier('schnecke', 'Schnecke', 1, rahmen(-33, -65, 70, 67), () => <Schnecke />),
  tier('hamster', 'Hamster', 1, rahmen(-31, -62, 66, 65), () => <Hamster />),
  tier('igel', 'Igel', 1, rahmen(-40, -59, 83, 65), () => <Igel />),
  tier('katze', 'Katze', 1, rahmen(-33, -68, 66, 72), () => <Katze />),
  tier('pinguin', 'Pinguin', 1, rahmen(-33, -61, 65, 65), () => <Pinguin />),
  tier('papagei', 'Papagei', 1, rahmen(-31, -67, 64, 71), () => <Papagei />),
  tier('eule', 'Eule', 2, rahmen(-31, -66, 66, 70), () => <Eule />),
  tier('fuchs', 'Fuchs', 2, rahmen(-39, -68, 79, 72), () => <FuchsHaustier />),
  tier('axolotl', 'Axolotl', 2, rahmen(-35, -60, 72, 63), () => <Axolotl />),
  tier('roboter', 'Roboter', 3, rahmen(-35, -69, 74, 71), () => <Roboter />),
  tier('einhorn', 'Einhorn', 3, rahmen(-38, -92, 82, 97), () => <Einhorn />),
  tier('drache', 'Drache', 4, rahmen(-66, -103, 124, 108), (zeit) => <Drache zeit={zeit} />, true),
  tier('phoenix', 'Phönix', 4, rahmen(-52, -73, 86, 79), (zeit) => <Phoenix zeit={zeit} />, true),
  // 13.11.2026 (20261129_lernquest_neue_teile.sql)
  tier('hase', 'Hase', 1, rahmen(-36, -80, 74, 86), () => <Hase />),
  tier('frosch', 'Frosch', 2, rahmen(-34, -54, 70, 58), () => <Frosch />),
  tier('panda', 'Panda', 3, rahmen(-44, -65, 75, 70), () => <Panda />),
  tier('mondwolf', 'Mondwolf', 4, rahmen(-43, -76, 92, 82), (zeit) => <Mondwolf zeit={zeit} />, true),
  tier('sternenhirsch', 'Sternenhirsch', 5, rahmen(-32, -99, 80, 100), (zeit) => <Sternenhirsch zeit={zeit} />, true),
  // 26.11.2026 (20261205_lernquest_welten_teile.sql): the worlds of the map
  tier('erdmaennchen', 'Erdmännchen', 1, rahmen(-30, -74, 62, 77), () => <Erdmaennchen />),
  tier('salamander', 'Feuersalamander', 2, rahmen(-48, -42, 86, 46), () => <Feuersalamander />),
  tier('alien', 'Alien', 3, rahmen(-26, -76, 60, 79), () => <Alien />),
  tier('eisbaer', 'Eisbär', 4, rahmen(-32, -58, 74, 61), () => <Eisbaer />),
  tier('leuchtqualle', 'Leuchtqualle', 5, rahmen(-34, -96, 68, 98), (zeit) => <Leuchtqualle zeit={zeit} />, true),
];
