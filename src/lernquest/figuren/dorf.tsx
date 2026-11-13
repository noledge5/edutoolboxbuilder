// The class village (Klassendorf, Stufe 1): the six buildings the class can build together, a building site for the
// running project and the village picture. Same style as the landscape (gelaende.tsx): outline, light from the top
// left, shadow bottom right; each building stands with its centre bottom at (0, 0). DORF_TEILE lists them for the
// workshop.
import type { ReactNode } from 'react';
import type { GelaendeTeil } from './gelaende';
import { P, UMRISS, UMRISS_FEIN } from './stil';

const Schatten = ({ rx }: { rx: number }) => <ellipse cx={6} cy={2} rx={rx} ry={7} fill={P.schatten} opacity={0.18} />;

/** A gable roof from x1 to x2 over the wall top `y`, `h` high, with shadow and light edge. */
function Dach({ x1, x2, y, h, farbe, tief }: { x1: number; x2: number; y: number; h: number; farbe: string; tief: string }) {
  const m = (x1 + x2) / 2;
  return (
    <g>
      <path d={`M${x1 - 8} ${y + 2} L${m} ${y - h} L${x2 + 8} ${y + 2} Z`} fill={farbe} {...UMRISS} />
      <path d={`M${m + 2} ${y - h + 6} L${x2 + 2} ${y - 1} L${m + 2} ${y - 1} Z`} fill={tief} opacity={0.55} />
      <path d={`M${x1 - 2} ${y - 3} L${m - 4} ${y - h + 7}`} stroke={P.weiss} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
    </g>
  );
}

/** A wall from x1 to x2 between y (top) and 0, with a shadow strip on the right and a light edge on the left. */
function Wand({ x1, x2, y, farbe, hell, tief }: { x1: number; x2: number; y: number; farbe: string; hell: string; tief: string }) {
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={-y} fill={farbe} {...UMRISS} />
      <rect x={x2 - (x2 - x1) * 0.28} y={y + 2} width={(x2 - x1) * 0.26} height={-y - 4} fill={tief} opacity={0.5} />
      <path d={`M${x1 + 5} ${y + 6} V-6`} stroke={hell} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

const Fenster = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 7} y={y - 8} width={14} height={16} rx={2} fill={P.himmel} {...UMRISS_FEIN} />
    <path d={`M${x} ${y - 7} V${y + 7} M${x - 6} ${y} H${x + 6}`} stroke={P.linie} strokeWidth={2} />
  </g>
);

export function Brunnen(): ReactNode {
  return (
    <g>
      <Schatten rx={44} />
      {/* Posts and roof. */}
      <rect x={-34} y={-78} width={8} height={56} fill={P.holz} {...UMRISS_FEIN} />
      <rect x={26} y={-78} width={8} height={56} fill={P.holz} {...UMRISS_FEIN} />
      <path d="M-44 -72 L0 -100 L44 -72 Z" fill={P.rot} {...UMRISS} />
      <path d="M2 -94 L38 -74 L2 -74 Z" fill={P.rotTief} opacity={0.55} />
      <path d="M-36 -75 L-6 -94" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
      {/* Winch with rope and bucket. */}
      <path d="M-26 -62 H26" stroke={P.holzTief} strokeWidth={6} strokeLinecap="round" />
      <path d="M2 -62 V-42" stroke={P.linie} strokeWidth={2} />
      <path d="M-6 -42 H10 L8 -32 H-4 Z" fill={P.metall} {...UMRISS_FEIN} />
      {/* Stone ring. */}
      <path d="M-40 -26 Q0 -36 40 -26 V-2 Q0 6 -40 -2 Z" fill={P.stein} {...UMRISS} />
      <path d="M-40 -26 Q0 -16 40 -26" fill="none" stroke={P.linie} strokeWidth={3} />
      <path d="M-32 -24 Q0 -30 32 -24 Q0 -20 -32 -24 Z" fill={P.wasser} />
      <path d="M18 -20 Q30 -20 38 -24 V-4 Q30 0 18 2 Z" fill={P.steinTief} opacity={0.5} />
      <path d="M-34 -16 V-6" stroke={P.steinHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M-20 -14 h10 M2 -10 h10 M-12 -4 h8" stroke={P.steinTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Bruecke(): ReactNode {
  return (
    <g>
      <Schatten rx={56} />
      {/* Water under the arch. */}
      <path d="M-30 0 Q0 -6 30 0 Z" fill={P.wasser} />
      <path d="M-56 0 V-34 Q0 -50 56 -34 V0 H30 A30 30 0 0 0 -30 0 Z" fill={P.stein} {...UMRISS} />
      <path d="M30 0 A30 30 0 0 0 20 -22 L40 -34 Q50 -36 56 -34 V0 Z" fill={P.steinTief} opacity={0.5} />
      <path d="M-50 -32 Q-20 -42 10 -42" stroke={P.steinHell} strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M-44 -20 h10 M-48 -8 h8 M36 -18 h10 M40 -6 h8 M-6 -36 h12" stroke={P.steinTief} strokeWidth={2} strokeLinecap="round" />
      {/* Railing. */}
      <path d="M-56 -34 Q0 -50 56 -34" fill="none" stroke={P.holzTief} strokeWidth={4} strokeLinecap="round" transform="translate(0 -12)" />
      {[-44, -22, 0, 22, 44].map((x) => (
        <path key={x} d={`M${x} ${-36 - (1 - (x / 56) ** 2) * 12} v-12`} stroke={P.holzTief} strokeWidth={4} strokeLinecap="round" />
      ))}
    </g>
  );
}

export function Baeckerei(): ReactNode {
  return (
    <g>
      <Schatten rx={50} />
      <rect x={20} y={-96} width={12} height={22} fill={P.stein} {...UMRISS_FEIN} />
      <Wand x1={-42} x2={42} y={-58} farbe={P.sand} hell={P.sandHell} tief={P.sandTief} />
      <Dach x1={-42} x2={42} y={-58} h={38} farbe={P.rot} tief={P.rotTief} />
      <path d="M-10 0 V-28 A10 10 0 0 1 10 -28 V0 Z" fill={P.holz} {...UMRISS_FEIN} />
      <circle cx={5} cy={-14} r={2} fill={P.linie} />
      <Fenster x={-26} y={-30} />
      <Fenster x={26} y={-30} />
      {/* Hanging sign with a loaf of bread. */}
      <path d="M-40 -48 h-14" stroke={P.linie} strokeWidth={3} strokeLinecap="round" />
      <path d="M-52 -48 v4" stroke={P.linie} strokeWidth={2} />
      <circle cx={-52} cy={-34} r={11} fill={P.holz} {...UMRISS_FEIN} />
      <ellipse cx={-52} cy={-34} rx={7} ry={4.5} fill={P.orange} stroke={P.linie} strokeWidth={2} />
      <path d="M-55 -36 l2 3 M-51 -37 l2 3" stroke={P.orangeTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Bibliothek(): ReactNode {
  return (
    <g>
      <Schatten rx={54} />
      <Wand x1={-46} x2={46} y={-60} farbe={P.steinHell} hell={P.weiss} tief={P.stein} />
      {/* Pediment with a book. */}
      <path d="M-54 -58 L0 -92 L54 -58 Z" fill={P.blau} {...UMRISS} />
      <path d="M2 -86 L46 -60 L2 -60 Z" fill={P.blauTief} opacity={0.55} />
      <path d="M-8 -70 Q-4 -74 0 -70 Q4 -74 8 -70 V-62 Q4 -66 0 -62 Q-4 -66 -8 -62 Z" fill={P.weiss} {...UMRISS_FEIN} strokeWidth={2} />
      {/* Columns and door. */}
      {[-34, -18, 18, 34].map((x) => (
        <g key={x}>
          <rect x={x - 4} y={-56} width={8} height={52} fill={P.weiss} {...UMRISS_FEIN} />
          <path d={`M${x + 1} -52 V-8`} stroke={P.stein} strokeWidth={2} />
        </g>
      ))}
      <path d="M-9 0 V-30 A9 9 0 0 1 9 -30 V0 Z" fill={P.holzTief} {...UMRISS_FEIN} />
      <rect x={-50} y={-6} width={100} height={6} fill={P.stein} {...UMRISS_FEIN} />
    </g>
  );
}

export function Sternwarte(): ReactNode {
  return (
    <g>
      <Schatten rx={40} />
      <Wand x1={-28} x2={28} y={-74} farbe={P.stein} hell={P.steinHell} tief={P.steinTief} />
      {/* Dome with a telescope. */}
      <path d="M14 -98 L40 -118" stroke={P.linie} strokeWidth={12} strokeLinecap="round" />
      <path d="M14 -98 L40 -118" stroke={P.metall} strokeWidth={7} strokeLinecap="round" />
      <path d="M-34 -72 A34 34 0 0 1 34 -72 Z" fill={P.lila} {...UMRISS} />
      <path d="M6 -104 A34 34 0 0 1 30 -74 H6 Z" fill={P.lilaTief} opacity={0.55} />
      <path d="M-26 -78 A28 28 0 0 1 -8 -100" fill="none" stroke={P.lilaHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M-2 -105 L0 -112 L2 -105 L9 -104 L3 -100 L5 -93 L0 -97 L-5 -93 L-3 -100 L-9 -104 Z" fill={P.gold} stroke={P.linie} strokeWidth={2} strokeLinejoin="round" />
      <path d="M-8 0 V-22 A8 8 0 0 1 8 -22 V0 Z" fill={P.holzTief} {...UMRISS_FEIN} />
      <circle cx={0} cy={-50} r={8} fill={P.nacht} {...UMRISS_FEIN} />
      <circle cx={-2} cy={-52} r={2} fill={P.gelb} />
    </g>
  );
}

export function Festwiese(): ReactNode {
  const flaggen = [P.rot, P.gelb, P.blau, P.gruen, P.orange, P.lila];
  return (
    <g>
      <Schatten rx={56} />
      {/* Bunting between two poles. */}
      <path d="M-50 0 V-78 M50 0 V-78" stroke={P.linie} strokeWidth={8} strokeLinecap="round" />
      <path d="M-50 0 V-78 M50 0 V-78" stroke={P.holz} strokeWidth={4} strokeLinecap="round" />
      <path d="M-50 -76 Q0 -56 50 -76" fill="none" stroke={P.linie} strokeWidth={2} />
      {flaggen.map((f, i) => {
        const x = -40 + i * 16;
        const y = -76 + 20 * (1 - (x / 50) ** 2) * 0.95;
        return <path key={i} d={`M${x - 6} ${y - 1} L${x + 6} ${y + 1} L${x} ${y + 12} Z`} fill={f} stroke={P.linie} strokeWidth={2} strokeLinejoin="round" />;
      })}
      {/* Striped tent. */}
      <path d="M-30 0 V-30 L0 -52 L30 -30 V0 Z" fill={P.weiss} {...UMRISS} />
      <path d="M-30 -30 L0 -52 L-14 -30 Z M0 -52 L14 -30 L30 -30 Z" fill={P.rot} />
      <path d="M-30 -30 L0 -52 L30 -30" fill="none" {...UMRISS} />
      <path d="M-22 -30 V0 M-6 -30 V0" stroke={P.rot} strokeWidth={6} />
      <path d="M10 -30 V0 M26 -30 V0" stroke={P.rotTief} strokeWidth={6} opacity={0.8} />
      <path d="M-30 -30 H30" stroke={P.linie} strokeWidth={3} />
      <path d="M-30 0 V-30 H30 V0 Z" fill="none" {...UMRISS} />
      <path d="M0 -52 V-62" stroke={P.linie} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M0 -62 l10 3 -10 4 Z" fill={P.gelb} stroke={P.linie} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

/** The running project: a scaffold with planks and a sign. */
export function Baustelle(): ReactNode {
  return (
    <g>
      <Schatten rx={46} />
      <path d="M-34 0 V-66 M34 0 V-66 M-34 -66 H34 M-34 -34 H34 M-34 -34 L34 -66 M-34 0 L34 -34" stroke={P.linie} strokeWidth={8} strokeLinecap="round" />
      <path d="M-34 0 V-66 M34 0 V-66 M-34 -66 H34 M-34 -34 H34 M-34 -34 L34 -66 M-34 0 L34 -34" stroke={P.holz} strokeWidth={4} strokeLinecap="round" />
      <rect x={-30} y={-14} width={26} height={14} fill={P.stein} {...UMRISS_FEIN} />
      <rect x={-22} y={-26} width={18} height={12} fill={P.steinHell} {...UMRISS_FEIN} />
      <rect x={6} y={-12} width={30} height={12} rx={2} fill={P.holzTief} {...UMRISS_FEIN} />
      <g transform="translate(-46 0)">
        <path d="M0 0 V-22" stroke={P.linie} strokeWidth={6} strokeLinecap="round" />
        <path d="M0 0 V-22" stroke={P.holz} strokeWidth={3} strokeLinecap="round" />
        <path d="M-10 -36 L10 -36 L0 -20 Z" fill={P.gelb} {...UMRISS_FEIN} />
        <path d="M0 -32 V-27" stroke={P.linie} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

export const GEBAEUDE_BILD: Record<string, () => ReactNode> = {
  brunnen: Brunnen,
  bruecke: Bruecke,
  baeckerei: Baeckerei,
  bibliothek: Bibliothek,
  sternwarte: Sternwarte,
  festwiese: Festwiese,
};

const R: [number, number, number, number] = [-68, -130, 136, 140];
export const DORF_TEILE: GelaendeTeil[] = [
  { id: 'dorf-brunnen', name: 'Brunnen', rahmen: R, zeichnung: Brunnen },
  { id: 'dorf-bruecke', name: 'Brücke', rahmen: R, zeichnung: Bruecke },
  { id: 'dorf-baeckerei', name: 'Bäckerei', rahmen: R, zeichnung: Baeckerei },
  { id: 'dorf-bibliothek', name: 'Bibliothek', rahmen: R, zeichnung: Bibliothek },
  { id: 'dorf-sternwarte', name: 'Sternwarte', rahmen: R, zeichnung: Sternwarte },
  { id: 'dorf-festwiese', name: 'Festwiese', rahmen: R, zeichnung: Festwiese },
  { id: 'dorf-baustelle', name: 'Baustelle', rahmen: R, zeichnung: Baustelle },
];

/** Where the buildings stand in the village picture (viewBox 0 0 360 230), back row first. */
const PLAETZE: Record<string, [number, number]> = {
  bibliothek: [70, 100],
  sternwarte: [180, 92],
  festwiese: [290, 100],
  baeckerei: [70, 205],
  brunnen: [180, 200],
  bruecke: [290, 205],
};

/** The village: built buildings, the building site of the running project, empty plots for the rest. */
export function DorfBild({ fertig, baustelle, titel }: { fertig: string[]; baustelle?: string | null; titel: string }) {
  return (
    <svg viewBox="0 0 360 230" role="img" aria-label={titel} className="lq-dorf-bild">
      <rect width={360} height={230} fill={P.himmel} />
      <path d="M0 60 Q90 40 180 52 Q270 64 360 46 V230 H0 Z" fill={P.wiese} />
      <path d="M0 150 Q180 130 360 150 V160 Q180 140 0 160 Z" fill={P.sandHell} />
      <path d="M170 230 Q176 190 180 150 Q184 190 190 230 Z" fill={P.sandHell} />
      {Object.entries(PLAETZE).map(([id, [x, y]]) => {
        const Bild = fertig.includes(id) ? GEBAEUDE_BILD[id] : baustelle === id ? Baustelle : null;
        return (
          <g key={id} transform={`translate(${x} ${y}) scale(0.62)`}>
            {Bild ? <Bild /> : <ellipse cx={0} cy={-4} rx={40} ry={10} fill={P.wieseTief} opacity={0.45} />}
          </g>
        );
      })}
    </svg>
  );
}
