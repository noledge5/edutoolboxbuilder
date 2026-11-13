// Companions of the hero (slot `begleiter`), standing on the anchor `begleiter` beside the hero's feet.
// Each pet is drawn around (0, 0) = the ground under its feet, fits x -32..32, y -64..0 and faces RIGHT.
import type { ReactNode } from 'react';
import type { Item } from './typen';
import { P, UMRISS, UMRISS_FEIN } from './stil';
import { Funkeln, stern } from './zeichnen';

const rad = Math.PI / 180;

/** Big dark eye with two white highlights (the chibi look of the fox). */
const Auge = ({ x, y, r = 4.6 }: { x: number; y: number; r?: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={P.auge} />
    <circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.42} fill={P.weiss} />
    <circle cx={x - r * 0.35} cy={y + r * 0.45} r={r * 0.2} fill={P.weiss} />
  </g>
);
const Backe = ({ x, y, rx = 4.2, ry = 2.7 }: { x: number; y: number; rx?: number; ry?: number }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={P.backe} opacity={0.6} />
);
/** Small smile; `w` shape = cat mouth. */
const Mund = ({ x, y, w = 4, katze = false }: { x: number; y: number; w?: number; katze?: boolean }) => (
  <path
    d={katze ? `M${x - w} ${y} Q${x - w / 2} ${y + w * 0.9} ${x} ${y} Q${x + w / 2} ${y + w * 0.9} ${x + w} ${y}` : `M${x - w} ${y} Q${x} ${y + w * 1.1} ${x + w} ${y}`}
    fill="none"
    stroke={P.linie}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);
/** Light spot top left. */
const Licht = ({ x, y, rx = 5, ry = 3, w = -35, farbe }: { x: number; y: number; rx?: number; ry?: number; w?: number; farbe: string }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${w} ${x} ${y})`} fill={farbe} opacity={0.85} />
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
      {/* eye stalks */}
      <path d="M17 -44 L13 -57 M26 -44 L29 -57" fill="none" {...UMRISS_FEIN} />
      <circle cx={13} cy={-58} r={3.6} fill={P.sand} {...UMRISS_FEIN} />
      <circle cx={29} cy={-58} r={3.6} fill={P.sand} {...UMRISS_FEIN} />
      {/* neck and foot */}
      <rect x={11} y={-32} width={20} height={32} rx={9} fill={P.sand} {...UMRISS} />
      <path d="M-31 0 Q-31 -11 -22 -11 L24 -11 Q32 -11 32 -5 Q32 0 25 0 Z" fill={P.sand} {...UMRISS} />
      <rect x={13} y={-14} width={16} height={6} fill={P.sand} />
      <path d="M-24 -2.5 L24 -2.5" stroke={P.sandTief} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      {/* shell */}
      <circle cx={-6} cy={-28} r={21} fill={P.rosa} {...UMRISS} />
      <Schatten cx={-6} cy={-28} rx={21} ry={21} farbe={P.rosaTief} />
      <path d="M-6 -28 q5 -1 5 -6 q0 -9 -10 -9 q-14 0 -14 14 q0 16 17 16" fill="none" stroke={P.rosaTief} strokeWidth={2.5} strokeLinecap="round" />
      <Licht x={-15} y={-40} rx={6} ry={3} farbe={P.rosaHell} />
      {/* head */}
      <circle cx={21} cy={-33} r={14} fill={P.sand} {...UMRISS} />
      <Licht x={15} y={-42} rx={4} ry={2.4} farbe={P.sandHell} />
      <Auge x={17} y={-35} r={3.8} />
      <Auge x={27} y={-35} r={3.8} />
      <Backe x={12} y={-28} rx={3.4} ry={2.2} />
      <Backe x={32} y={-28} rx={3.4} ry={2.2} />
      <Mund x={22} y={-29} w={3.2} />
    </g>
  );
}

function Hamster() {
  return (
    <g>
      <ellipse cx={-10} cy={-4} rx={8} ry={5} fill={P.sand} {...UMRISS} />
      <ellipse cx={15} cy={-4} rx={8} ry={5} fill={P.sand} {...UMRISS} />
      {/* ears */}
      <circle cx={-12} cy={-50} r={8} fill={P.holz} {...UMRISS} />
      <circle cx={-12} cy={-50} r={4} fill={P.rosaHell} />
      <circle cx={13} cy={-52} r={8} fill={P.holz} {...UMRISS} />
      <circle cx={13} cy={-52} r={4} fill={P.rosaHell} />
      {/* body and head in one */}
      <ellipse cx={0} cy={-27} rx={29} ry={25} fill={P.holz} {...UMRISS} />
      <Schatten cx={0} cy={-27} rx={29} ry={25} farbe={P.holzTief} />
      <path d="M-8 -50 Q0 -44 8 -50 Q0 -47 -8 -50 Z" fill={P.holzTief} opacity={0.7} />
      <ellipse cx={9} cy={-12} rx={15} ry={9} fill={P.creme} />
      <ellipse cx={11} cy={-25} rx={12} ry={9} fill={P.creme} />
      <Licht x={-15} y={-41} rx={7} ry={3.5} farbe={P.sandHell} />
      <Auge x={3} y={-35} r={4.6} />
      <Auge x={21} y={-35} r={4.6} />
      <ellipse cx={12} cy={-29} rx={3} ry={2.2} fill={P.auge} />
      <Mund x={12} y={-25} w={3.6} katze />
      <Backe x={-4} y={-26} rx={5} ry={3.2} />
      <Backe x={28} y={-26} rx={4} ry={3.2} />
    </g>
  );
}

function Igel() {
  const n = 13;
  const pts = Array.from({ length: n * 2 + 1 }, (_, i) => {
    const a = (95 + (i / (n * 2)) * 270) * rad; // from top right, round the back, to the bottom
    const r = i % 2 ? 22 : 31;
    return `${(-6 + Math.cos(a) * r).toFixed(1)} ${(-25 - Math.sin(a) * r * 0.95).toFixed(1)}`;
  });
  return (
    <g>
      <ellipse cx={-8} cy={-3} rx={7} ry={4} fill={P.lederTief} {...UMRISS} />
      <ellipse cx={14} cy={-3} rx={7} ry={4} fill={P.lederTief} {...UMRISS} />
      <path d={`M${pts.join(' L')} Z`} fill={P.leder} {...UMRISS} />
      <path d="M-26 -33 L-20 -44 L-15 -34 Z M-12 -45 L-4 -53 L1 -43 Z" fill={P.lederHell} opacity={0.8} />
      <Schatten cx={-6} cy={-25} rx={24} ry={22} farbe={P.lederTief} a1={-20} a2={100} />
      {/* face */}
      <path d="M2 -4 Q-2 -22 6 -36 Q16 -44 28 -34 L36 -24 Q34 -10 26 -4 Z" fill={P.sand} {...UMRISS} />
      <Licht x={9} y={-35} rx={5} ry={2.4} farbe={P.sandHell} />
      <circle cx={34} cy={-25} r={3.8} fill={P.auge} />
      <Auge x={14} y={-27} r={4.4} />
      <Auge x={25} y={-26} r={4.2} />
      <Backe x={10} y={-18} rx={3.4} ry={2.4} />
      <Backe x={28} y={-17} rx={3} ry={2.4} />
      <Mund x={22} y={-17} w={3.5} />
    </g>
  );
}

// ---------------------------------------------------------------- 2 Ungewoehnlich

function Katze() {
  return (
    <g>
      {/* tail behind */}
      <path d="M-14 -6 Q-36 -6 -31 -26 Q-30 -34 -24 -32" fill="none" stroke={P.linie} strokeWidth={13} strokeLinecap="round" />
      <path d="M-14 -6 Q-36 -6 -31 -26 Q-30 -34 -24 -32" fill="none" stroke={P.grau} strokeWidth={7.5} strokeLinecap="round" />
      <path d="M-33 -18 L-28 -18 M-32 -26 L-27 -26" stroke={P.grauTief} strokeWidth={2.2} strokeLinecap="round" />
      {/* body */}
      <path d="M-18 0 C-22 -16 -14 -30 -2 -30 C12 -30 20 -16 18 0 Z" fill={P.grau} {...UMRISS} />
      <path d="M8 -28 C16 -22 20 -10 18 0 L10 0 C12 -10 12 -20 8 -28 Z" fill={P.grauTief} opacity={0.5} />
      <ellipse cx={5} cy={-10} rx={8} ry={10} fill={P.schnee} />
      <ellipse cx={-8} cy={-1.5} rx={8} ry={4} fill={P.grauHell} {...UMRISS} />
      <ellipse cx={12} cy={-1.5} rx={8} ry={4} fill={P.schnee} {...UMRISS} />
      {/* ears */}
      <path d="M-14 -50 L-14 -64 L-2 -56 Z" fill={P.grau} {...UMRISS} />
      <path d="M-12 -53 L-12 -60 L-6 -56 Z" fill={P.rosaHell} />
      <path d="M12 -56 L22 -64 L24 -48 Z" fill={P.grau} {...UMRISS} />
      <path d="M15 -54 L21 -60 L21 -52 Z" fill={P.rosaHell} />
      {/* head */}
      <ellipse cx={5} cy={-41} rx={25} ry={19} fill={P.grau} {...UMRISS} />
      <Schatten cx={5} cy={-41} rx={25} ry={19} farbe={P.grauTief} />
      <path d="M-3 -58 L-3 -52 M5 -59 L5 -52 M13 -58 L13 -52" stroke={P.grauTief} strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={12} cy={-34} rx={11} ry={7.5} fill={P.schnee} />
      <Licht x={-9} y={-50} rx={6} ry={3} farbe={P.grauHell} />
      <Auge x={-2} y={-41} r={5.2} />
      <Auge x={17} y={-41} r={5.2} />
      <path d="M9 -37 L15 -37 L12 -33 Z" fill={P.rosa} stroke={P.linie} strokeWidth={1.6} strokeLinejoin="round" />
      <Mund x={12} y={-31} w={3.6} katze />
      <Backe x={-9} y={-33} rx={4.2} ry={2.7} />
      <Backe x={27} y={-33} rx={3.6} ry={2.7} />
    </g>
  );
}

function Pinguin() {
  return (
    <g>
      <ellipse cx={-9} cy={-2.5} rx={9} ry={4} fill={P.orange} {...UMRISS} />
      <ellipse cx={11} cy={-2.5} rx={9} ry={4} fill={P.orange} {...UMRISS} />
      {/* flipper behind */}
      <path d="M-20 -34 Q-32 -24 -26 -14 Q-22 -22 -17 -26 Z" fill={P.dunkel} {...UMRISS} />
      <path d="M-24 -52 C-30 -26 -26 -4 0 -4 C26 -4 28 -26 22 -52 C18 -64 -18 -64 -24 -52 Z" fill={P.dunkel} {...UMRISS} />
      <Schatten cx={0} cy={-32} rx={27} ry={30} farbe={P.dunkelTief} />
      {/* white face and belly */}
      <path d="M-14 -44 C-20 -52 -8 -54 0 -50 C8 -54 18 -52 14 -44 C26 -34 22 -8 4 -8 C-12 -8 -22 -32 -14 -44 Z" fill={P.schnee} transform="translate(4 0)" />
      <path d="M-1 -25 Q4 -20 12 -26" fill="none" stroke={P.eisTief} strokeWidth={2} strokeLinecap="round" opacity={0} />
      <Licht x={-12} y={-56} rx={7} ry={3} farbe={P.dunkelHell} />
      <path d="M-24 -52 C-30 -26 -26 -4 0 -4 C26 -4 28 -26 22 -52 C18 -64 -18 -64 -24 -52 Z" fill="none" {...UMRISS} />
      {/* beak */}
      <path d="M16 -38 Q28 -36 27 -31 Q22 -27 14 -30 Z" fill={P.orange} {...UMRISS_FEIN} />
      <Auge x={4} y={-40} r={4.6} />
      <Auge x={20} y={-41} r={4.2} />
      <Backe x={-2} y={-32} rx={4} ry={2.6} />
      <Backe x={22} y={-31} rx={3.4} ry={2.4} />
      {/* flipper in front */}
      <path d="M-20 -32 Q-34 -22 -26 -10 Q-18 -18 -14 -26 Z" fill={P.dunkelHell} {...UMRISS} transform="translate(0 0)" />
    </g>
  );
}

function Papagei() {
  return (
    <g>
      {/* tail */}
      <path d="M-8 -14 Q-26 -8 -29 -2 Q-18 0 -6 -4 Z" fill={P.blau} {...UMRISS} />
      <path d="M-4 -12 Q-18 -2 -22 1 Q-8 3 0 -4 Z" fill={P.gruen} {...UMRISS} />
      {/* feet */}
      <path d="M-2 -6 L-3 0 M7 -6 L8 0" stroke={P.orange} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={-3} cy={-1.5} rx={5} ry={2.4} fill={P.orange} {...UMRISS_FEIN} />
      <ellipse cx={9} cy={-1.5} rx={5} ry={2.4} fill={P.orange} {...UMRISS_FEIN} />
      {/* body */}
      <ellipse cx={1} cy={-24} rx={19} ry={23} fill={P.rot} {...UMRISS} />
      <Schatten cx={1} cy={-24} rx={19} ry={23} farbe={P.rotTief} />
      <ellipse cx={8} cy={-16} rx={9} ry={11} fill={P.orangeHell} opacity={0.9} />
      {/* wing */}
      <path d="M-14 -34 C-24 -22 -20 -8 -8 -8 C-2 -18 -2 -28 -6 -36 Z" fill={P.blau} {...UMRISS} />
      <path d="M-18 -18 Q-14 -12 -10 -11" fill="none" stroke={P.blauHell} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M-16 -26 Q-12 -22 -9 -22" fill="none" stroke={P.gelb} strokeWidth={2.2} strokeLinecap="round" />
      {/* head */}
      <circle cx={5} cy={-45} r={16} fill={P.rot} {...UMRISS} />
      <Schatten cx={5} cy={-45} rx={16} ry={16} farbe={P.rotTief} />
      <path d="M-4 -59 Q-2 -64 4 -62 Q0 -60 -1 -57 Z" fill={P.gelb} {...UMRISS_FEIN} />
      <circle cx={10} cy={-46} r={8.5} fill={P.weiss} />
      <Licht x={-4} y={-54} rx={5} ry={2.4} farbe={P.orangeHell} />
      <Auge x={11} y={-46} r={4.6} />
      <Backe x={3} y={-37} rx={3.4} ry={2.4} />
      {/* beak */}
      <path d="M17 -48 Q30 -50 29 -38 Q28 -34 24 -37 Q22 -42 16 -41 Z" fill={P.gold} {...UMRISS} />
      <path d="M18 -42 Q24 -42 26 -39" fill="none" stroke={P.goldTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------- 3 Selten

function Eule() {
  return (
    <g>
      <ellipse cx={-7} cy={-2.5} rx={7} ry={3.6} fill={P.gold} {...UMRISS} />
      <ellipse cx={11} cy={-2.5} rx={7} ry={3.6} fill={P.gold} {...UMRISS} />
      {/* ear tufts */}
      <path d="M-20 -50 L-22 -64 L-9 -56 Z" fill={P.leder} {...UMRISS} />
      <path d="M16 -56 L28 -64 L26 -50 Z" fill={P.leder} {...UMRISS} />
      {/* body and head */}
      <path d="M-24 -42 C-30 -22 -22 -2 2 -2 C26 -2 32 -22 26 -42 C24 -58 -22 -58 -24 -42 Z" fill={P.leder} {...UMRISS} />
      <Schatten cx={1} cy={-30} rx={27} ry={28} farbe={P.lederTief} />
      <Licht x={-15} y={-52} rx={7} ry={3} farbe={P.lederHell} />
      {/* belly with feather scallops */}
      <ellipse cx={5} cy={-16} rx={14} ry={13} fill={P.sand} />
      <path d="M-4 -22 q4 4 8 0 M6 -22 q4 4 8 0 M-1 -14 q4 4 8 0 M9 -14 q4 4 8 0 M3 -6 q4 4 8 0" fill="none" stroke={P.lederHell} strokeWidth={2} strokeLinecap="round" />
      {/* wings */}
      <path d="M-24 -34 C-34 -22 -28 -8 -14 -8 C-14 -18 -16 -28 -20 -36 Z" fill={P.lederTief} {...UMRISS} />
      <path d="M26 -34 C34 -22 30 -10 20 -10 C20 -20 20 -28 22 -36 Z" fill={P.lederTief} {...UMRISS} />
      {/* eyes in white discs */}
      <circle cx={-3} cy={-40} r={10.5} fill={P.sand} {...UMRISS_FEIN} />
      <circle cx={17} cy={-40} r={10.5} fill={P.sand} {...UMRISS_FEIN} />
      <Auge x={-1} y={-40} r={6} />
      <Auge x={19} y={-40} r={6} />
      <path d="M6 -37 L14 -37 L10 -29 Z" fill={P.gold} {...UMRISS_FEIN} />
      <Backe x={-13} y={-28} rx={4} ry={2.6} />
      <Backe x={29} y={-28} rx={3.4} ry={2.6} />
    </g>
  );
}

function FuchsHaustier() {
  return (
    <g>
      {/* big tail with cream tip */}
      <path d="M-12 -6 C-36 -4 -38 -34 -28 -40 C-22 -30 -16 -22 -8 -18 Z" fill={P.fell} {...UMRISS} />
      <path d="M-28 -40 C-38 -34 -36 -24 -33 -19 C-28 -22 -24 -30 -28 -40 Z" fill={P.creme} {...UMRISS_FEIN} />
      {/* body */}
      <path d="M-16 0 C-20 -16 -12 -30 0 -30 C14 -30 20 -16 18 0 Z" fill={P.fell} {...UMRISS} />
      <path d="M8 -28 C16 -22 20 -10 18 0 L10 0 C12 -10 12 -20 8 -28 Z" fill={P.fellTief} opacity={0.5} />
      <ellipse cx={6} cy={-10} rx={7} ry={10} fill={P.creme} />
      <ellipse cx={-7} cy={-1.5} rx={8} ry={4} fill={P.fellTief} {...UMRISS} />
      <ellipse cx={11} cy={-1.5} rx={8} ry={4} fill={P.fellTief} {...UMRISS} />
      {/* ears */}
      <path d="M-16 -46 L-17 -64 L-2 -54 Z" fill={P.fell} {...UMRISS} />
      <path d="M-14 -49 L-14.5 -58 L-7 -53 Z" fill={P.ohrInnen} />
      <path d="M12 -54 L26 -64 L26 -44 Z" fill={P.fell} {...UMRISS} />
      <path d="M16 -52 L24 -58 L24 -48 Z" fill={P.ohrInnen} />
      {/* head */}
      <path d="M-26 -38 C-26 -54 -12 -57 4 -57 C20 -57 30 -54 30 -42 L36 -34 L28 -30 C22 -22 8 -20 2 -20 C-14 -20 -26 -26 -26 -38 Z" fill={P.fell} {...UMRISS} />
      <path d="M4 -34 C14 -34 24 -34 30 -30 C24 -22 10 -20 2 -20 C-8 -22 -14 -28 -16 -32 C-10 -34 -2 -34 4 -34 Z" fill={P.creme} />
      <Licht x={-12} y={-51} rx={7} ry={3} farbe={P.fellHell} />
      <path d="M-26 -38 C-26 -54 -12 -57 4 -57 C20 -57 30 -54 30 -42 L36 -34 L28 -30 C22 -22 8 -20 2 -20 C-14 -20 -26 -26 -26 -38 Z" fill="none" {...UMRISS} />
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
  const wedel = (x: number, y: number, dx: number, dy: number, k: string) => (
    <g key={k}>
      <path d={`M${x} ${y} Q${x + dx * 0.5} ${y + dy * 0.4} ${x + dx} ${y + dy}`} fill="none" stroke={P.linie} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${x} ${y} Q${x + dx * 0.5} ${y + dy * 0.4} ${x + dx} ${y + dy}`} fill="none" stroke={P.rosaTief} strokeWidth={4.4} strokeLinecap="round" />
      <circle cx={x + dx} cy={y + dy} r={3} fill={P.herz} opacity={0.9} />
    </g>
  );
  return (
    <g>
      {/* gills behind the head */}
      {wedel(-10, -36, -14, -12, 'a')}
      {wedel(-6, -40, -8, -17, 'b')}
      {wedel(0, -43, 0, -17, 'c')}
      {wedel(25, -40, 10, -14, 'd')}
      {wedel(22, -43, 4, -17, 'e')}
      {/* tail and body */}
      <path d="M-14 -8 Q-34 -10 -30 -22 Q-26 -4 -8 -2 Z" fill={P.rosa} {...UMRISS} />
      <ellipse cx={-6} cy={-13} rx={25} ry={12} fill={P.rosa} {...UMRISS} />
      <Schatten cx={-6} cy={-13} rx={25} ry={12} farbe={P.rosaTief} />
      <ellipse cx={-18} cy={-2.5} rx={6} ry={3.4} fill={P.rosaHell} {...UMRISS} />
      <ellipse cx={14} cy={-2.5} rx={7} ry={3.4} fill={P.rosaHell} {...UMRISS} />
      {/* head */}
      <ellipse cx={8} cy={-29} rx={23} ry={18} fill={P.rosa} {...UMRISS} />
      <Schatten cx={8} cy={-29} rx={23} ry={18} farbe={P.rosaTief} />
      <Licht x={-6} y={-41} rx={7} ry={3} farbe={P.rosaHell} />
      <ellipse cx={16} cy={-20} rx={9} ry={5} fill={P.rosaHell} opacity={0.7} />
      <Auge x={1} y={-31} r={4.8} />
      <Auge x={19} y={-31} r={4.8} />
      <Backe x={-7} y={-23} rx={4.2} ry={2.7} />
      <Backe x={27} y={-23} rx={3.6} ry={2.7} />
      <Mund x={10} y={-25} w={5.5} />
    </g>
  );
}

// ---------------------------------------------------------------- 4 Episch

function Roboter() {
  return (
    <g>
      {/* feet */}
      <rect x={-17} y={-7} width={14} height={7} rx={3} fill={P.dunkel} {...UMRISS} />
      <rect x={3} y={-7} width={14} height={7} rx={3} fill={P.dunkel} {...UMRISS} />
      {/* antenna with gem */}
      <path d="M2 -48 L2 -55" stroke={P.linie} strokeWidth={5.5} strokeLinecap="round" />
      <path d="M2 -48 L2 -55" stroke={P.metallTief} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M2 -64 L8 -59 L5.5 -53 L-1.5 -53 L-4 -59 Z" fill={P.blau} {...UMRISS_FEIN} />
      <path d="M-1 -59 L2 -62 L4 -59 Z" fill={P.blauHell} />
      {/* body */}
      <rect x={-17} y={-26} width={34} height={21} rx={7} fill={P.metall} {...UMRISS} />
      <path d="M17 -20 L17 -12 Q17 -5 10 -5 L-10 -5 Q4 -6 8 -16 Z" fill={P.metallTief} opacity={0.5} />
      <path d={stern(0, -15.5, 6.5)} fill={P.blauHell} {...UMRISS_FEIN} />
      {/* arms */}
      <rect x={-27} y={-24} width={9} height={15} rx={4.5} fill={P.metallTief} {...UMRISS} />
      <rect x={18} y={-24} width={9} height={15} rx={4.5} fill={P.metallTief} {...UMRISS} />
      {/* head */}
      <rect x={-27} y={-52} width={58} height={30} rx={11} fill={P.metall} {...UMRISS} />
      <rect x={-27} y={-52} width={58} height={30} rx={11} fill="none" {...UMRISS} />
      <path d="M31 -40 L31 -34 Q31 -22 20 -22 L-6 -22 Q20 -24 24 -34 Z" fill={P.metallTief} opacity={0.5} />
      <Licht x={-17} y={-47} rx={6} ry={2.4} w={-20} farbe={P.metallHell} />
      <rect x={-33} y={-42} width={7} height={11} rx={3} fill={P.metallTief} {...UMRISS} />
      <rect x={30} y={-42} width={7} height={11} rx={3} fill={P.metallTief} {...UMRISS} />
      {/* visor with glowing eyes */}
      <rect x={-20} y={-47} width={46} height={20} rx={9} fill={P.dunkel} {...UMRISS_FEIN} />
      <ellipse cx={-4} cy={-38} rx={5.5} ry={6.3} fill={P.blauHell} />
      <ellipse cx={15} cy={-38} rx={5.5} ry={6.3} fill={P.blauHell} />
      <circle cx={-2.5} cy={-40.5} r={2.4} fill={P.weiss} />
      <circle cx={16.5} cy={-40.5} r={2.4} fill={P.weiss} />
      <circle cx={-5.5} cy={-36} r={1.1} fill={P.weiss} />
      <circle cx={13.5} cy={-36} r={1.1} fill={P.weiss} />
      <path d="M4 -31.5 Q5.5 -29.5 7 -31.5" fill="none" stroke={P.blauHell} strokeWidth={1.8} strokeLinecap="round" />
      <ellipse cx={-14} cy={-31} rx={3} ry={2} fill={P.backe} opacity={0.6} />
      <ellipse cx={21} cy={-31} rx={3} ry={2} fill={P.backe} opacity={0.6} />
    </g>
  );
}

function Einhorn() {
  return (
    <g>
      {/* tail */}
      <path d="M-18 -26 C-34 -26 -34 -8 -28 -4 C-26 -12 -20 -16 -14 -16 Z" fill={P.rosa} {...UMRISS} />
      <path d="M-30 -10 C-30 -18 -26 -22 -20 -22" fill="none" stroke={P.tuerkisHell} strokeWidth={2.4} strokeLinecap="round" />
      {/* far legs */}
      <rect x={-14} y={-14} width={9} height={14} rx={4} fill={P.schnee} {...UMRISS} />
      <rect x={6} y={-14} width={9} height={14} rx={4} fill={P.schnee} {...UMRISS} />
      {/* body */}
      <ellipse cx={-4} cy={-21} rx={23} ry={13} fill={P.schnee} {...UMRISS} />
      <Schatten cx={-4} cy={-21} rx={23} ry={13} farbe={P.eisTief} />
      <path d={stern(-12, -21, 6.5)} fill={P.gold} {...UMRISS_FEIN} />
      <rect x={-22} y={-12} width={10} height={12} rx={4.5} fill={P.schnee} {...UMRISS} />
      <rect x={10} y={-12} width={10} height={12} rx={4.5} fill={P.schnee} {...UMRISS} />
      <rect x={-22} y={-4} width={10} height={4} rx={2} fill={P.lilaHell} />
      <rect x={10} y={-4} width={10} height={4} rx={2} fill={P.lilaHell} />
      {/* mane down the back of the neck */}
      <path d="M12 -64 C-8 -66 -14 -46 -8 -28 C-4 -34 0 -37 6 -39 C2 -46 4 -54 12 -56 Z" fill={P.rosa} {...UMRISS} />
      <path d="M2 -58 C-6 -52 -6 -42 -4 -36" fill="none" stroke={P.tuerkisHell} strokeWidth={3} strokeLinecap="round" />
      {/* neck */}
      <path d="M0 -28 C2 -40 6 -48 10 -52 L26 -46 C22 -40 20 -32 19 -22 Z" fill={P.schnee} {...UMRISS} />
      {/* no line where the neck meets the body */}
      <ellipse cx={10} cy={-25} rx={8.5} ry={5} fill={P.schnee} />
      {/* ear */}
      <path d="M8 -60 L7 -72 L17 -63 Z" fill={P.schnee} {...UMRISS} />
      {/* head: a horse's head from the side, long muzzle to the right */}
      <path d="M4 -53 C4 -63 14 -66 22 -62 C29 -58 37 -49 39 -42 C41 -35 35 -31 29 -33 C23 -35 19 -40 13 -42 C7 -44 4 -47 4 -53 Z" fill={P.schnee} {...UMRISS} />
      <path d="M31 -50 C36 -46 40 -40 38 -36 C36 -32 31 -32 28 -34 C32 -38 33 -44 31 -50 Z" fill={P.lilaHell} opacity={0.7} />
      <Licht x={12} y={-58} rx={4} ry={2.4} farbe={P.weiss} />
      <Auge x={17} y={-51} r={4.4} />
      <Backe x={22} y={-43} rx={3.4} ry={2.4} />
      <ellipse cx={35} cy={-40} rx={1.3} ry={1.7} fill={P.eisTief} />
      <path d="M29 -35.5 q3 1.5 6 0" fill="none" stroke={P.linie} strokeWidth={2} strokeLinecap="round" />
      {/* forelock, then the horn on the forehead */}
      <path d="M9 -63 C14 -69 24 -66 23 -57 C19 -60 14 -60 9 -63 Z" fill={P.rosa} {...UMRISS_FEIN} />
      <path d="M17 -62 L35 -85 L30 -57 Z" fill={P.gold} {...UMRISS} />
      <path d="M23 -65 L30 -62.5 M27 -71 L32 -69" stroke={P.goldTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------- 5 Legendaer

/** Bigger than the other pets and fierce (teacher, 12.11.2026): bat wings, spikes, fangs, slit eyes, smoke. */
function Drache({ zeit }: { zeit: number }) {
  const schlag = Math.sin(zeit * 4) * 12;
  const rauch = (zeit * 0.8) % 1;
  const fluegel = (spiegel: number, haut: string, tief: string) => (
    <g transform={`rotate(${schlag * spiegel} -10 -50)`}>
      <path
        d="M-10 -50 L-30 -88 L-36 -74 L-50 -82 L-50 -64 L-62 -66 L-54 -46 Q-40 -54 -32 -44 Q-24 -52 -16 -42 Z"
        fill={haut}
        {...UMRISS}
      />
      <path d="M-10 -50 L-36 -74 M-10 -50 L-50 -64 M-12 -48 L-54 -46" stroke={tief} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
  return (
    <g transform="translate(-10 0)">
      {/* wing behind (flaps) */}
      {fluegel(1, P.lilaTief, P.tinteTief)}
      {/* tail with a spade tip */}
      <path d="M-16 -10 Q-40 -4 -44 -22 Q-42 -14 -30 -16 Q-22 -18 -18 -22 Z" fill={P.gruen} {...UMRISS} />
      <path d="M-44 -22 L-54 -30 L-46 -34 L-40 -26 Z" fill={P.rot} {...UMRISS_FEIN} />
      {/* back spikes */}
      <path d="M-22 -48 L-24 -60 L-14 -52 Z M-24 -36 L-32 -44 L-22 -42 Z M-24 -24 L-34 -28 L-24 -30 Z" fill={P.rot} {...UMRISS_FEIN} />
      {/* back leg */}
      <path d="M-14 -8 Q-16 -2 -10 0 L-2 0 Q0 -6 -4 -10 Z" fill={P.gruenTief} {...UMRISS} />
      {/* body */}
      <ellipse cx={0} cy={-28} rx={24} ry={25} fill={P.gruen} {...UMRISS} />
      <Schatten cx={0} cy={-28} rx={24} ry={25} farbe={P.gruenTief} />
      <Licht x={-12} y={-42} rx={6} ry={3} farbe={P.gruenHell} />
      {/* belly plates */}
      <path d="M6 -48 Q22 -40 20 -22 Q18 -8 6 -6 Q-2 -24 6 -48 Z" fill={P.goldHell} {...UMRISS_FEIN} />
      <path d="M8 -40 L19 -38 M6 -31 L20 -29 M6 -22 L19 -21 M7 -13 L16 -13" stroke={P.goldTief} strokeWidth={2} strokeLinecap="round" />
      {/* front leg with claws */}
      <path d="M6 -14 Q4 -2 10 0 L22 0 Q22 -8 16 -14 Z" fill={P.gruen} {...UMRISS} />
      <path d="M14 0 L16 4 L18 0 M19 0 L21 4 L23 0" fill={P.creme} {...UMRISS_FEIN} />
      {/* arm with claws */}
      <path d="M14 -40 Q28 -36 30 -26" fill="none" stroke={P.linie} strokeWidth={11} strokeLinecap="round" />
      <path d="M14 -40 Q28 -36 30 -26" fill="none" stroke={P.gruen} strokeWidth={7} strokeLinecap="round" />
      <path d="M28 -24 L30 -18 L32 -24 M32 -25 L36 -20 L36 -27" fill={P.creme} {...UMRISS_FEIN} />
      {/* wing in front */}
      {fluegel(-1, P.lila, P.lilaTief)}
      {/* horns, swept back */}
      <path d="M-4 -82 Q-16 -94 -26 -92 Q-16 -86 -10 -76 Z" fill={P.metallHell} {...UMRISS} />
      <path d="M10 -84 Q4 -98 -6 -100 Q2 -90 2 -80 Z" fill={P.metallHell} {...UMRISS} />
      {/* head with a long snout */}
      <path
        d="M-14 -68 C-14 -84 -2 -88 10 -86 C20 -85 28 -80 32 -74 L44 -70 C48 -68 48 -60 44 -58 C36 -54 22 -52 10 -52 C-6 -52 -14 -58 -14 -68 Z"
        fill={P.gruen}
        {...UMRISS}
      />
      <Schatten cx={12} cy={-68} rx={28} ry={16} farbe={P.gruenTief} />
      <Licht x={-4} y={-80} rx={6} ry={2.6} farbe={P.gruenHell} />
      {/* fangs */}
      <path d="M30 -56 L32 -49 L35 -56 Z M38 -57 L40 -51 L42 -58 Z" fill={P.weiss} {...UMRISS_FEIN} />
      <path d="M22 -58 Q34 -56 44 -60" fill="none" stroke={P.linie} strokeWidth={2.2} strokeLinecap="round" />
      {/* nostril and smoke */}
      <circle cx={42} cy={-66} r={1.6} fill={P.gruenTief} />
      <circle cx={48 + rauch * 8} cy={-72 - rauch * 14} r={2.5 + rauch * 3} fill={P.metallHell} opacity={0.75 * (1 - rauch)} />
      {/* fierce slit eye under a heavy brow */}
      <path d="M8 -74 Q16 -78 24 -72 Q18 -66 10 -68 Z" fill={P.gold} {...UMRISS_FEIN} />
      <path d="M17 -76 L16 -67" stroke={P.auge} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M4 -80 L26 -74" stroke={P.linie} strokeWidth={3.5} strokeLinecap="round" />
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
        fill={farbe}
        {...UMRISS_FEIN}
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
      {/* body */}
      <ellipse cx={0} cy={-26} rx={18} ry={16} fill={P.lava} {...UMRISS} />
      <Schatten cx={0} cy={-26} rx={18} ry={16} farbe={P.lavaTief} />
      <ellipse cx={7} cy={-22} rx={9} ry={9} fill={P.gelb} opacity={0.9} />
      {/* feet (hovering) */}
      <path d="M-3 -12 L-3 -6 M7 -12 L7 -6" stroke={P.gold} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={-3} cy={-5} rx={4.5} ry={2.4} fill={P.gold} {...UMRISS_FEIN} />
      <ellipse cx={8} cy={-5} rx={4.5} ry={2.4} fill={P.gold} {...UMRISS_FEIN} />
      {/* wing with flame feathers */}
      <g transform="translate(-8 -30) rotate(-75)">
        {flamme(-7, 0, 22, 4.5, 1, P.orange, -30)}
        {flamme(-1, 0, 25, 4.5, 3, P.lava, -8)}
        {flamme(5, 0, 21, 4.2, 5, P.gelb, 14)}
      </g>
      <ellipse cx={-6} cy={-26} rx={11} ry={9} fill={P.orange} {...UMRISS} transform="rotate(20 -6 -26)" />
      <Licht x={-9} y={-30} rx={5} ry={2.4} farbe={P.orangeHell} />
      {/* crest */}
      <g transform="translate(6 -50)">
        {flamme(-6, 0, 13, 3.4, 7, P.lava, -30)}
        {flamme(0, 0, 18, 4, 9, P.orange, 0)}
        {flamme(6, 0, 12, 3.2, 11, P.gelb, 30)}
      </g>
      {/* head */}
      <circle cx={8} cy={-44} r={14} fill={P.lava} {...UMRISS} />
      <Schatten cx={8} cy={-44} rx={14} ry={14} farbe={P.lavaTief} />
      <Licht x={0} y={-52} rx={5} ry={2.4} farbe={P.lavaHell} />
      <path d="M20 -46 Q31 -46 30 -40 Q26 -37 20 -39 Z" fill={P.gold} {...UMRISS_FEIN} />
      <Auge x={6} y={-45} r={4.6} />
      <Auge x={18} y={-45} r={3.4} />
      <Backe x={1} y={-38} rx={3.4} ry={2.3} />
      <Funkeln x={-24} y={-52} r={7} zeit={zeit} />
      <Funkeln x={26} y={-16} r={5} zeit={zeit} versatz={2} />
    </g>
  );
}

// ---------------------------------------------------------------- 13.11.2026 (20261129_lernquest_neue_teile.sql)

function Hase() {
  return (
    <g>
      {/* ears: the back one darker */}
      <path d="M6 -44 Q-4 -70 4 -76 Q14 -70 12 -44 Z" fill={P.grauHell} {...UMRISS} />
      <path d="M16 -44 Q16 -74 26 -76 Q32 -66 22 -42 Z" fill={P.schnee} {...UMRISS} />
      <path d="M20 -46 Q22 -66 26 -70" fill="none" stroke={P.rosaHell} strokeWidth={4} strokeLinecap="round" />
      {/* body, tail, feet */}
      <circle cx={-24} cy={-20} r={8} fill={P.schnee} {...UMRISS} />
      <ellipse cx={-4} cy={-18} rx={24} ry={18} fill={P.schnee} {...UMRISS} />
      <Schatten cx={-4} cy={-18} rx={24} ry={18} farbe={P.grauHell} />
      <ellipse cx={14} cy={-3} rx={10} ry={4.5} fill={P.schnee} {...UMRISS} />
      {/* head */}
      <circle cx={16} cy={-38} r={15} fill={P.schnee} {...UMRISS} />
      <Licht x={9} y={-47} rx={4.5} ry={2.4} farbe={P.weiss} />
      <Auge x={14} y={-40} r={3.8} />
      <Auge x={25} y={-40} r={3.4} />
      <ellipse cx={28} cy={-33} rx={2.4} ry={1.8} fill={P.rosa} />
      <Mund x={26} y={-30} w={2.6} katze />
      <Backe x={10} y={-32} rx={3.4} ry={2.2} />
    </g>
  );
}

function Frosch() {
  return (
    <g>
      {/* back legs and body */}
      <ellipse cx={-18} cy={-8} rx={14} ry={8} fill={P.gruen} {...UMRISS} />
      <ellipse cx={0} cy={-20} rx={26} ry={20} fill={P.gruenHell} {...UMRISS} />
      <Schatten cx={0} cy={-20} rx={26} ry={20} farbe={P.gruen} />
      <ellipse cx={4} cy={-14} rx={15} ry={10} fill={P.gelbHell} />
      <circle cx={-12} cy={-26} r={3} fill={P.gruen} />
      <circle cx={-6} cy={-34} r={2.2} fill={P.gruen} />
      <path d="M8 -2 q4 -6 10 -2 M14 -2 l3 2 M10 -2 l-2 2" fill={P.gruenHell} {...UMRISS_FEIN} />
      {/* eyes on top of the head */}
      {[2, 22].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-42} r={9} fill={P.gruenHell} {...UMRISS} />
          <Auge x={x + 1} y={-42} r={4.4} />
        </g>
      ))}
      <Licht x={-12} y={-34} rx={6} ry={3} farbe={P.gelbHell} />
      <path d="M2 -28 Q14 -20 26 -28" fill="none" stroke={P.linie} strokeWidth={2.2} strokeLinecap="round" />
      <Backe x={-2} y={-28} rx={3.6} ry={2.2} />
      <Backe x={28} y={-28} rx={3} ry={2} />
    </g>
  );
}

function Panda() {
  return (
    <g>
      {/* bamboo behind */}
      <path d="M-28 0 V-60" stroke={P.linie} strokeWidth={9} strokeLinecap="round" />
      <path d="M-28 0 V-60" stroke={P.gruenHell} strokeWidth={5} strokeLinecap="round" />
      <path d="M-31 -22 h6 M-31 -42 h6" stroke={P.gruen} strokeWidth={2} />
      <path d="M-28 -50 q-10 -6 -12 -14 q8 2 12 10 Z" fill={P.gruen} {...UMRISS_FEIN} />
      {/* body */}
      <ellipse cx={0} cy={-20} rx={24} ry={20} fill={P.schnee} {...UMRISS} />
      <path d="M-20 -32 Q-26 -14 -18 -2 L-6 -2 Q-12 -18 -8 -32 Z" fill={P.dunkel} {...UMRISS_FEIN} />
      <ellipse cx={14} cy={-3} rx={9} ry={5} fill={P.dunkel} {...UMRISS} />
      <ellipse cx={-10} cy={-3} rx={9} ry={5} fill={P.dunkel} {...UMRISS} />
      <path d="M14 -30 Q24 -24 22 -12" fill="none" stroke={P.linie} strokeWidth={10} strokeLinecap="round" />
      <path d="M14 -30 Q24 -24 22 -12" fill="none" stroke={P.dunkel} strokeWidth={6} strokeLinecap="round" />
      {/* head with dark ears and eye patches */}
      <circle cx={-2} cy={-54} r={6.5} fill={P.dunkel} {...UMRISS} />
      <circle cx={22} cy={-54} r={6.5} fill={P.dunkel} {...UMRISS} />
      <circle cx={10} cy={-40} r={16} fill={P.schnee} {...UMRISS} />
      <Licht x={3} y={-50} rx={5} ry={2.4} farbe={P.weiss} />
      <ellipse cx={4} cy={-41} rx={5} ry={6.5} fill={P.dunkel} transform="rotate(20 4 -41)" />
      <ellipse cx={17} cy={-41} rx={5} ry={6.5} fill={P.dunkel} transform="rotate(-20 17 -41)" />
      <circle cx={4} cy={-42} r={2.2} fill={P.weiss} />
      <circle cx={17} cy={-42} r={2.2} fill={P.weiss} />
      <ellipse cx={11} cy={-33} rx={2.8} ry={2} fill={P.auge} />
      <Mund x={11} y={-30} w={2.6} katze />
      <Backe x={-1} y={-33} rx={3} ry={2} />
    </g>
  );
}

function Mondwolf({ zeit }: { zeit: number }) {
  const glanz = 0.6 + Math.sin(zeit * 2) * 0.3;
  return (
    <g>
      {/* bushy tail */}
      <path d="M-18 -14 Q-40 -24 -36 -46 Q-28 -34 -16 -30 Z" fill={P.grau} {...UMRISS} />
      <path d="M-36 -46 Q-34 -38 -28 -36" fill="none" stroke={P.schnee} strokeWidth={4} strokeLinecap="round" />
      {/* sitting body */}
      <path d="M-20 0 Q-26 -34 0 -40 Q20 -40 18 -18 Q18 -4 10 0 Z" fill={P.grau} {...UMRISS} />
      <path d="M0 -36 Q12 -30 10 -2 L2 -2 Q4 -20 -4 -30 Z" fill={P.schnee} opacity={0.9} />
      <path d="M8 0 V-20 M14 0 V-18" stroke={P.linie} strokeWidth={8} strokeLinecap="round" />
      <path d="M8 0 V-20 M14 0 V-18" stroke={P.grauHell} strokeWidth={4.5} strokeLinecap="round" />
      {/* head with pointed ears and snout to the right */}
      <path d="M2 -54 L4 -72 L14 -58 Z M16 -56 L24 -72 L28 -54 Z" fill={P.grau} {...UMRISS} />
      <path d="M6 -58 L6 -66 L11 -59 Z M20 -58 L24 -66 L25 -57 Z" fill={P.rosaHell} />
      <path d="M-2 -46 Q0 -62 16 -62 Q32 -60 30 -48 L40 -42 Q40 -34 30 -34 Q20 -28 6 -32 Q-4 -36 -2 -46 Z" fill={P.grau} {...UMRISS} />
      <path d="M20 -40 L40 -42 Q40 -34 30 -34 Q22 -32 18 -36 Z" fill={P.schnee} />
      <ellipse cx={40} cy={-41} rx={3} ry={2.2} fill={P.auge} />
      <Auge x={18} y={-48} r={3.6} />
      <Licht x={4} y={-54} rx={4} ry={2} farbe={P.grauHell} />
      {/* the moon on the forehead glows */}
      <path d="M10 -58 A5 5 0 1 0 15 -52 A4 4 0 1 1 10 -58 Z" fill={P.gelbHell} opacity={glanz} stroke={P.goldTief} strokeWidth={1} />
      <Funkeln x={-30} y={-58} r={5} zeit={zeit} />
    </g>
  );
}

function Sternenhirsch({ zeit }: { zeit: number }) {
  const glanz = 0.65 + Math.sin(zeit * 2.5) * 0.3;
  return (
    <g>
      {/* legs */}
      {[-16, -8, 10, 18].map((x) => (
        <g key={x}>
          <path d={`M${x} -18 V-2`} stroke={P.linie} strokeWidth={7} strokeLinecap="round" />
          <path d={`M${x} -18 V-2`} stroke={x < 0 ? P.holzTief : P.holz} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      {/* body with light spots */}
      <ellipse cx={0} cy={-24} rx={26} ry={13} fill={P.holz} {...UMRISS} />
      <Schatten cx={0} cy={-24} rx={26} ry={13} farbe={P.holzTief} />
      {[
        [-12, -28],
        [-4, -31],
        [-16, -22],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={2} fill={P.sandHell} />
      ))}
      <path d="M-26 -28 q-6 -2 -6 -8 q6 0 8 4 Z" fill={P.schnee} {...UMRISS_FEIN} />
      {/* neck and head */}
      <path d="M14 -30 L22 -50 L32 -48 L26 -28 Z" fill={P.holz} {...UMRISS} />
      <ellipse cx={30} cy={-52} rx={11} ry={9} fill={P.holz} {...UMRISS} />
      <ellipse cx={39} cy={-50} rx={2.4} ry={2} fill={P.auge} />
      <Auge x={29} y={-54} r={3.2} />
      <path d="M22 -58 q-6 -2 -8 -6 q6 0 9 3 Z" fill={P.holz} {...UMRISS_FEIN} />
      {/* antlers of light with stars */}
      <g opacity={glanz}>
        <path d="M26 -60 Q20 -76 26 -86 M22 -72 L14 -78 M32 -60 Q38 -74 34 -88 M36 -72 L44 -78" fill="none" stroke={P.gelb} strokeWidth={3.5} strokeLinecap="round" />
        <path d={stern(26, -88, 4.5)} fill={P.weiss} />
        <path d={stern(34, -90, 4)} fill={P.weiss} />
        <path d={stern(14, -79, 3.5)} fill={P.weiss} />
        <path d={stern(44, -79, 3.5)} fill={P.weiss} />
      </g>
      <Funkeln x={-24} y={-48} r={6} zeit={zeit} />
      <Funkeln x={8} y={-62} r={4} zeit={zeit} versatz={2} />
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
  tier('schnecke', 'Schnecke', 1, rahmen(-36, -67, 76, 71), () => <Schnecke />),
  tier('hamster', 'Hamster', 1, rahmen(-34, -64, 68, 68), () => <Hamster />),
  tier('igel', 'Igel', 1, rahmen(-42, -59, 84, 63), () => <Igel />),
  tier('katze', 'Katze', 1, rahmen(-42, -69, 74, 73), () => <Katze />),
  tier('pinguin', 'Pinguin', 1, rahmen(-39, -67, 72, 71), () => <Pinguin />),
  tier('papagei', 'Papagei', 1, rahmen(-34, -69, 70, 73), () => <Papagei />),
  tier('eule', 'Eule', 2, rahmen(-36, -69, 72, 73), () => <Eule />),
  tier('fuchs', 'Fuchs', 2, rahmen(-44, -69, 86, 73), () => <FuchsHaustier />),
  tier('axolotl', 'Axolotl', 2, rahmen(-41, -67, 82, 71), () => <Axolotl />),
  tier('roboter', 'Roboter', 3, rahmen(-38, -69, 80, 73), () => <Roboter />),
  tier('einhorn', 'Einhorn', 3, rahmen(-41, -90, 84, 94), () => <Einhorn />),
  tier('drache', 'Drache', 4, rahmen(-74, -102, 120, 108), (zeit) => <Drache zeit={zeit} />, true),
  tier('phoenix', 'Phönix', 4, rahmen(-43, -69, 80, 75), (zeit) => <Phoenix zeit={zeit} />, true),
  // 13.11.2026 (20261129_lernquest_neue_teile.sql)
  tier('hase', 'Hase', 1, rahmen(-34, -80, 68, 84), () => <Hase />),
  tier('frosch', 'Frosch', 2, rahmen(-34, -54, 68, 58), () => <Frosch />),
  tier('panda', 'Panda', 3, rahmen(-42, -68, 74, 72), () => <Panda />),
  tier('mondwolf', 'Mondwolf', 4, rahmen(-42, -76, 86, 80), (zeit) => <Mondwolf zeit={zeit} />, true),
  tier('sternenhirsch', 'Sternenhirsch', 5, rahmen(-34, -96, 82, 100), (zeit) => <Sternenhirsch zeit={zeit} />, true),
];
