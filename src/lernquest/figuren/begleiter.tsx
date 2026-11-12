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
      <path d={stern(-6, -21, 6.5)} fill={P.gold} {...UMRISS_FEIN} />
      <rect x={-22} y={-12} width={10} height={12} rx={4.5} fill={P.schnee} {...UMRISS} />
      <rect x={10} y={-12} width={10} height={12} rx={4.5} fill={P.schnee} {...UMRISS} />
      <rect x={-22} y={-4} width={10} height={4} rx={2} fill={P.lilaHell} />
      <rect x={10} y={-4} width={10} height={4} rx={2} fill={P.lilaHell} />
      {/* mane behind head */}
      <path d="M-6 -50 C-24 -50 -26 -28 -20 -22 C-14 -30 -8 -34 -2 -34 Z" fill={P.rosa} {...UMRISS} />
      <path d="M-12 -44 C-22 -40 -22 -30 -19 -26" fill="none" stroke={P.tuerkisHell} strokeWidth={3} strokeLinecap="round" />
      {/* ear */}
      <path d="M4 -52 L2 -60 L12 -54 Z" fill={P.schnee} {...UMRISS} />
      {/* horn */}
      <path d="M12 -52 L18 -64 L21 -51 Z" fill={P.gold} {...UMRISS} />
      <path d="M13.5 -56 L19.5 -57.5 M13 -52.5 L20.5 -53.5" stroke={P.goldTief} strokeWidth={1.8} strokeLinecap="round" />
      {/* head */}
      <path d="M-9 -38 C-9 -52 4 -54 14 -53 C26 -52 30 -44 30 -38 C30 -28 20 -24 10 -24 C-2 -24 -9 -28 -9 -38 Z" fill={P.schnee} {...UMRISS} />
      <Schatten cx={10} cy={-39} rx={20} ry={15} farbe={P.eisTief} />
      <path d="M-4 -50 C-6 -44 -4 -40 0 -38 C2 -44 4 -48 8 -51 Z" fill={P.lilaHell} {...UMRISS_FEIN} />
      <Licht x={-1} y={-45} rx={4} ry={2.4} farbe={P.weiss} />
      <Auge x={6} y={-37} r={4.8} />
      <Auge x={22} y={-37} r={4.2} />
      <Backe x={0} y={-30} rx={4} ry={2.6} />
      <Backe x={26} y={-30} rx={3} ry={2.4} />
      <ellipse cx={26} cy={-33} rx={1.2} ry={1.6} fill={P.eisTief} />
      <Mund x={15} y={-29} w={3.4} />
    </g>
  );
}

// ---------------------------------------------------------------- 5 Legendaer

function Drache({ zeit }: { zeit: number }) {
  const schlag = Math.sin(zeit * 5) * 14;
  const fluegel = (spiegel: number, tint: string) => (
    <g transform={`translate(-6 -30) rotate(${schlag * spiegel}) scale(1.3) translate(6 30)`}>
      <path d="M-6 -30 C-18 -50 -34 -52 -36 -40 Q-30 -40 -28 -34 Q-24 -36 -22 -30 Q-18 -32 -14 -28 Z" fill={tint} {...UMRISS} />
      <path d="M-28 -34 L-12 -30 M-22 -30 L-12 -29" stroke={P.lilaTief} strokeWidth={0} />
    </g>
  );
  return (
    <g>
      {/* wing behind (flaps) */}
      {fluegel(1, P.lila)}
      {/* tail */}
      <path d="M-14 -6 Q-34 -6 -30 -22 Q-26 -14 -16 -14 Z" fill={P.gruen} {...UMRISS} />
      <path d="M-30 -22 L-35 -27 L-27 -26 Z" fill={P.gold} {...UMRISS_FEIN} />
      {/* back spikes */}
      <path d="M-16 -32 L-12 -40 L-8 -33 Z M-9 -26 L-3 -32 L0 -25 Z" fill={P.gold} {...UMRISS_FEIN} />
      {/* body */}
      <ellipse cx={0} cy={-17} rx={19} ry={17} fill={P.gruen} {...UMRISS} />
      <Schatten cx={0} cy={-17} rx={19} ry={17} farbe={P.gruenTief} />
      <ellipse cx={7} cy={-14} rx={10} ry={12} fill={P.goldHell} {...UMRISS_FEIN} />
      <path d="M2 -20 L12 -20 M2 -14 L12 -14 M3 -8 L11 -8" stroke={P.gold} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={-8} cy={-2.5} rx={8} ry={4} fill={P.gruenHell} {...UMRISS} />
      <ellipse cx={12} cy={-2.5} rx={8} ry={4} fill={P.gruenHell} {...UMRISS} />
      {/* wing in front */}
      {fluegel(-1, P.lilaHell)}
      {/* horns */}
      <path d="M-8 -50 L-14 -62 L-1 -53 Z" fill={P.gold} {...UMRISS} />
      <path d="M10 -53 L18 -63 L19 -49 Z" fill={P.gold} {...UMRISS} />
      {/* head */}
      <path d="M-22 -37 C-22 -53 -8 -55 4 -55 C18 -55 28 -52 30 -42 C34 -40 36 -36 33 -32 C28 -26 16 -24 4 -24 C-12 -24 -22 -28 -22 -37 Z" fill={P.gruen} {...UMRISS} />
      <Schatten cx={4} cy={-39} rx={26} ry={15} farbe={P.gruenTief} />
      <Licht x={-10} y={-49} rx={7} ry={3} farbe={P.gruenHell} />
      <circle cx={27} cy={-38} r={1.4} fill={P.gruenTief} />
      <circle cx={32} cy={-36} r={1.2} fill={P.gruenTief} />
      <Auge x={-2} y={-39} r={5.2} />
      <Auge x={15} y={-39} r={5.2} />
      <Backe x={-10} y={-31} rx={4.2} ry={2.7} />
      <Backe x={24} y={-30} rx={3.4} ry={2.6} />
      <Mund x={13} y={-29} w={4} />
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
  tier('katze', 'Katze', 2, rahmen(-42, -69, 74, 73), () => <Katze />),
  tier('pinguin', 'Pinguin', 2, rahmen(-39, -67, 72, 71), () => <Pinguin />),
  tier('papagei', 'Papagei', 2, rahmen(-34, -69, 70, 73), () => <Papagei />),
  tier('eule', 'Eule', 3, rahmen(-36, -69, 72, 73), () => <Eule />),
  tier('fuchs', 'Fuchs', 3, rahmen(-44, -69, 86, 73), () => <FuchsHaustier />),
  tier('axolotl', 'Axolotl', 3, rahmen(-41, -67, 82, 71), () => <Axolotl />),
  tier('roboter', 'Roboter', 4, rahmen(-38, -69, 80, 73), () => <Roboter />),
  tier('einhorn', 'Einhorn', 4, rahmen(-41, -69, 78, 73), () => <Einhorn />),
  tier('drache', 'Drache', 5, rahmen(-43, -69, 84, 73), (zeit) => <Drache zeit={zeit} />, true),
  tier('phoenix', 'Phönix', 5, rahmen(-43, -69, 80, 75), (zeit) => <Phoenix zeit={zeit} />, true),
];
