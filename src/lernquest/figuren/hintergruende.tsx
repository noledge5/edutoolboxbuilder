// Backgrounds of the hero card (slot `hintergrund` in src/lernquest/teile.ts): a 240 × 240 scene, the hero stands at
// (120, 230), the pet at x ≈ 40. The middle (x 60…180, y 40…230) stays calm; objects sit at the sides and edges.
import type { ReactNode } from 'react';
import { P, UMRISS, UMRISS_FEIN } from './stil';
import { Baum, Tanne, Busch, Blume, Stein } from './gelaende';
import { Funkeln, stern } from './zeichnen';

export interface Hintergrund {
  id: string;
  name: string;
  /** 1 Gewöhnlich … 5 Legendär (part's seltenheit + 1). */
  seltenheit: 1 | 2 | 3 | 4 | 5;
  bewegt?: boolean;
  zeichnung: (zeit: number) => ReactNode;
}

/** Places a landscape piece (origin bottom centre) at x, y with scale s. */
function Am({ x, y, s = 1, kinder }: { x: number; y: number; s?: number; kinder: ReactNode }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{kinder}</g>;
}
const R = ({ y, h, f }: { y: number; h: number; f: string }) => <rect x={0} y={y} width={240} height={h} fill={f} />;

/** A flat cloud, origin bottom centre, about 56 wide. */
function Wolke({ x, y, s = 1, f = P.weiss, t = P.eisHell }: { x: number; y: number; s?: number; f?: string; t?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-26} y={-10} width={52} height={10} rx={5} fill={f} />
      <circle cx={-12} cy={-12} r={9} fill={f} />
      <circle cx={3} cy={-18} r={13} fill={f} />
      <circle cx={17} cy={-11} r={9} fill={f} />
      <path d="M-24 -3 Q0 3 24 -3 L22 -2 Q0 4 -22 -2 Z" fill={t} />
      <rect x={-20} y={-4} width={44} height={4} rx={2} fill={t} opacity={0.5} />
    </g>
  );
}

function Sonne({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 7} fill={P.gelbHell} opacity={0.5} />
      <circle cx={x} cy={y} r={r} fill={P.gelb} {...UMRISS_FEIN} />
      <path d={`M${x - r * 0.6} ${y - r * 0.1} A${r * 0.6} ${r * 0.6} 0 0 1 ${x - r * 0.1} ${y - r * 0.6}`} fill="none" stroke={P.gelbHell} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

/** A stick-and-colour limb (dark under colour), as in the figures. */
const Strich = ({ d, f, b = 11, u = 17 }: { d: string; f: string; b?: number; u?: number }) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={P.linie} strokeWidth={u} />
    <path d={d} stroke={f} strokeWidth={b} />
  </g>
);

function Kaktus({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={4} cy={0} rx={16} ry={4} fill={P.schatten} opacity={0.18} />
      <Strich d="M0 -2 V-44 M0 -16 H-13 V-30 M0 -24 H13 V-36" f={P.gruen} />
      <path d="M-3 -40 V-8" stroke={P.gruenHell} strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M3 -30 V-6" stroke={P.gruenTief} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.5} />
    </g>
  );
}

function Palme({ s = 1 }: { s?: number }) {
  const blatt = (w: number) => (
    <path key={w} transform={`rotate(${w})`} d="M0 0 Q18 -20 44 -2 Q22 -8 0 0 Z" fill={P.gruen} {...UMRISS_FEIN} />
  );
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={6} cy={0} rx={20} ry={4.5} fill={P.schatten} opacity={0.18} />
      <Strich d="M0 0 Q10 -30 -2 -64" f={P.holz} b={9} u={14} />
      <g transform="translate(-2 -64)">
        {[-20, 20, 60, 130, 175, 215].map(blatt)}
        <circle cx={-3} cy={4} r={5} fill={P.leder} {...UMRISS_FEIN} />
        <circle cx={5} cy={5} r={5} fill={P.lederTief} {...UMRISS_FEIN} />
      </g>
    </g>
  );
}

function Pilz({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M-4 0 L-3 -9 H3 L4 0 Z" fill={P.creme} {...UMRISS_FEIN} />
      <path d="M-11 -8 Q-10 -22 0 -22 Q10 -22 11 -8 Z" fill={P.rot} {...UMRISS_FEIN} />
      <path d="M3 -9 Q9 -10 10 -9 Q8 -16 6 -19 Z" fill={P.rotTief} opacity={0.6} />
      <circle cx={-4} cy={-15} r={2} fill={P.weiss} />
      <circle cx={3} cy={-17} r={1.6} fill={P.weiss} />
    </g>
  );
}

/** A flat silhouette fir in one colour (for night). */
function TanneFlach({ s = 1, f, h }: { s?: number; f: string; h: string }) {
  return (
    <g transform={`scale(${s})`}>
      <rect x={-4} y={-12} width={8} height={12} fill={f} {...UMRISS_FEIN} />
      <path d="M0 -62 L16 -34 H8 L20 -14 H-20 L-8 -34 H-16 Z" fill={f} {...UMRISS} />
      <path d="M-2 -54 L-10 -34 M-6 -26 L-14 -16" stroke={h} strokeWidth={3} strokeLinecap="round" fill="none" />
    </g>
  );
}

function Fisch({ x, y, s = 1, f, t }: { x: number; y: number; s?: number; f: string; t: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-12 0 L-24 -9 L-24 9 Z" fill={t} {...UMRISS_FEIN} />
      <ellipse cx={0} cy={0} rx={14} ry={9} fill={f} {...UMRISS_FEIN} />
      <path d="M0 4 Q8 8 12 2 Q8 -2 2 0 Z" fill={t} opacity={0.5} />
      <circle cx={7} cy={-2} r={3} fill={P.weiss} />
      <circle cx={8} cy={-2} r={1.5} fill={P.auge} />
    </g>
  );
}

const Kreis = ({ x, y, r, f }: { x: number; y: number; r: number; f: string }) => <circle cx={x} cy={y} r={r} fill={f} {...UMRISS_FEIN} />;

function wiese(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Sonne x={36} y={40} />
      <Wolke x={170} y={52} s={0.9} />
      <Wolke x={92} y={36} s={0.6} />
      <path d="M0 152 Q50 122 110 146 Q170 126 240 148 V170 H0 Z" fill={P.wieseTief} />
      <path d="M0 160 Q70 144 140 158 Q200 148 240 158 V240 H0 Z" fill={P.wiese} />
      <path d="M0 160 Q70 144 140 158 Q200 148 240 158" fill="none" stroke={P.wieseHell} strokeWidth={4} strokeLinecap="round" />
      <path d="M20 200 q8 -6 16 0 M170 214 q8 -6 16 0 M196 188 q6 -4 12 0 M80 226 q6 -4 12 0" fill="none" stroke={P.wieseHell} strokeWidth={3} strokeLinecap="round" />
      <Am x={22} y={184} s={1.5} kinder={<Baum />} />
      <Am x={214} y={176} s={1.2} kinder={<Baum />} />
      <Am x={196} y={206} kinder={<Busch />} />
      <Am x={10} y={226} kinder={<Blume />} />
      <Am x={228} y={228} kinder={<Blume />} />
      <Am x={206} y={234} kinder={<Blume />} />
      <Am x={70} y={238} s={0.8} kinder={<Blume />} />
    </g>
  );
}

function strand(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Sonne x={204} y={38} />
      <Wolke x={50} y={46} s={0.8} />
      <Wolke x={130} y={74} s={0.5} />
      <R y={142} h={30} f={P.wasser} />
      <R y={142} h={6} f={P.wasserTief} />
      <path d="M10 156 q8 -5 16 0 t16 0 M100 162 q8 -5 16 0 t16 0 M176 154 q8 -5 16 0 t16 0" fill="none" stroke={P.wasserHell} strokeWidth={3} strokeLinecap="round" />
      <g transform="translate(150 142)">
        <path d="M-12 0 L-10 -8 H12 L14 0 Z" fill={P.holz} {...UMRISS_FEIN} />
        <path d="M0 -8 V-30 L14 -10 Z" fill={P.weiss} {...UMRISS_FEIN} />
      </g>
      <path d="M0 170 Q60 160 120 168 Q190 160 240 168 V240 H0 Z" fill={P.sand} />
      <path d="M0 170 Q60 160 120 168 Q190 160 240 168" fill="none" stroke={P.wasserHell} strokeWidth={5} strokeLinecap="round" />
      <path d="M30 206 q6 -4 12 0 M180 200 q6 -4 12 0 M120 234 q6 -4 12 0" fill="none" stroke={P.sandTief} strokeWidth={3} strokeLinecap="round" />
      <Am x={212} y={196} s={1.4} kinder={<Palme />} />
      <Am x={20} y={186} s={0.9} kinder={<Palme />} />
      <g transform="translate(16 222)">
        <path d="M-10 0 Q-12 -12 0 -13 Q12 -12 10 0 Z" fill={P.rosa} {...UMRISS_FEIN} />
        <path d="M0 -13 V0 M-5 -11 L-6 0 M5 -11 L6 0" stroke={P.rosaTief} strokeWidth={2} fill="none" />
      </g>
      <path transform="translate(206 230)" d={stern(0, 0, 11)} fill={P.orange} {...UMRISS_FEIN} />
      <Am x={190} y={236} kinder={<Stein />} />
    </g>
  );
}

function wueste(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <circle cx={196} cy={50} r={26} fill={P.orangeHell} opacity={0.6} />
      <circle cx={196} cy={50} r={17} fill={P.gelb} {...UMRISS_FEIN} />
      <Wolke x={48} y={52} s={0.7} />
      <path d="M0 160 Q60 138 120 152 Q180 138 240 156 V240 H0 Z" fill={P.sandTief} />
      <g transform="translate(176 150)">
        <path d="M-22 0 L0 -26 L22 0 Z" fill={P.sand} {...UMRISS_FEIN} />
        <path d="M0 -26 L22 0 H4 Z" fill={P.sandTief} opacity={0.7} />
      </g>
      <path d="M0 172 Q50 156 110 170 Q180 160 240 172 V240 H0 Z" fill={P.sand} />
      <path d="M0 172 Q50 156 110 170 Q180 160 240 172" fill="none" stroke={P.sandHell} strokeWidth={4} strokeLinecap="round" />
      <path d="M0 214 Q50 204 100 216 Q70 230 0 232 Z" fill={P.sandTief} opacity={0.5} />
      <path d="M150 236 Q200 214 240 220 V240 Z" fill={P.sandTief} opacity={0.5} />
      <Am x={24} y={190} s={1.5} kinder={<Kaktus />} />
      <Am x={212} y={218} s={1.2} kinder={<Kaktus />} />
      <Am x={196} y={234} s={0.9} kinder={<Stein />} />
      <g transform="translate(14 232)">
        <path d="M-9 0 L-7 -5 L-3 0 L0 -7 L3 0 L7 -5 L9 0 Z" fill={P.weiss} {...UMRISS_FEIN} />
      </g>
    </g>
  );
}

function wald(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <path d="M0 0 H240 V150 H0 Z" fill={P.blattHell} opacity={0.35} />
      <path d="M0 150 Q40 118 80 142 Q120 116 160 140 Q200 120 240 144 V170 H0 Z" fill={P.blattTief} />
      <path d="M0 160 Q60 142 120 158 Q190 142 240 158 V240 H0 Z" fill={P.wieseTief} />
      {[28, 70, 112, 150, 190].map((x, i) => (
        <Am key={x} x={x} y={166 + (i % 2) * 4} s={0.7} kinder={<Tanne />} />
      ))}
      <path d="M14 214 q8 -6 16 0 M180 226 q8 -6 16 0 M120 236 q8 -6 16 0" fill="none" stroke={P.wiese} strokeWidth={3} strokeLinecap="round" />
      <Am x={22} y={196} s={1.9} kinder={<Baum />} />
      <Am x={216} y={190} s={1.7} kinder={<Baum />} />
      <Am x={196} y={232} s={0.9} kinder={<Pilz />} />
      <Am x={178} y={238} s={0.6} kinder={<Pilz />} />
      <Am x={8} y={236} s={0.9} kinder={<Busch />} />
    </g>
  );
}

function berge(): ReactNode {
  const berg = (x: number, y: number, b: number, h: number, f: string, t: string) => (
    <g key={`${x}${h}`}>
      <path d={`M${x - b} ${y} L${x} ${y - h} L${x + b} ${y} Z`} fill={f} {...UMRISS} />
      <path d={`M${x} ${y - h} L${x + b} ${y} H${x + b * 0.2} Z`} fill={t} opacity={0.5} />
      <path d={`M${x} ${y - h} L${x + b * 0.34} ${y - h * 0.66} L${x + b * 0.1} ${y - h * 0.72} L${x - b * 0.1} ${y - h * 0.62} L${x - b * 0.34} ${y - h * 0.66} Z`} fill={P.schnee} {...UMRISS_FEIN} />
    </g>
  );
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Wolke x={160} y={44} s={0.8} />
      <Wolke x={46} y={64} s={0.6} />
      {berg(120, 156, 70, 64, P.grauHell, P.grau)}
      {berg(42, 160, 62, 92, P.grau, P.grauTief)}
      {berg(204, 160, 58, 80, P.grau, P.grauTief)}
      <path d="M0 164 Q60 152 120 164 Q190 152 240 164 V240 H0 Z" fill={P.wieseTief} />
      <path d="M0 176 Q70 166 130 178 Q190 168 240 178 V240 H0 Z" fill={P.wiese} />
      <Am x={22} y={206} s={1.4} kinder={<Tanne />} />
      <Am x={50} y={228} s={0.9} kinder={<Tanne />} />
      <Am x={214} y={204} s={1.5} kinder={<Tanne />} />
      <Am x={196} y={230} s={1} kinder={<Stein />} />
      <Am x={10} y={238} s={0.7} kinder={<Blume />} />
    </g>
  );
}

function winterwald(): ReactNode {
  const schneeTanne = (x: number, y: number, s: number) => (
    <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
      <Tanne />
      <path d="M0 -66 Q6 -60 10 -52 Q4 -50 0 -54 Q-4 -50 -9 -52 Q-5 -60 0 -66 Z" fill={P.schnee} />
      <path d="M-18 -33 Q-8 -37 0 -36 Q8 -37 18 -33 Q10 -30 0 -32 Q-10 -30 -18 -33 Z" fill={P.schnee} opacity={0.9} />
      <path d="M-22 -16 Q-8 -20 0 -19 Q8 -20 22 -16 Q10 -13 0 -15 Q-10 -13 -22 -16 Z" fill={P.schnee} opacity={0.9} />
    </g>
  );
  return (
    <g>
      <R y={0} h={240} f={P.eis} />
      <R y={0} h={90} f={P.eisHell} />
      <path d="M0 150 Q50 128 100 146 Q160 126 240 148 V170 H0 Z" fill={P.eisTief} />
      {[40, 90, 150, 200].map((x, i) => schneeTanne(x, 160 + (i % 2) * 3, 0.55))}
      <path d="M0 162 Q60 150 120 162 Q190 150 240 162 V240 H0 Z" fill={P.schnee} />
      <path d="M0 162 Q60 150 120 162 Q190 150 240 162" fill="none" stroke={P.weiss} strokeWidth={4} strokeLinecap="round" />
      <path d="M20 218 q8 -5 16 0 M170 232 q8 -5 16 0 M196 190 q8 -5 16 0" fill="none" stroke={P.eisTief} strokeWidth={3} strokeLinecap="round" />
      {schneeTanne(22, 202, 1.5)}
      {schneeTanne(218, 196, 1.3)}
      <g transform="translate(196 236) scale(0.8)">
        <Kreis x={0} y={-12} r={14} f={P.weiss} />
        <Kreis x={0} y={-36} r={10} f={P.weiss} />
        <path d="M-9 -44 H9 L7 -52 H-7 Z" fill={P.dunkel} {...UMRISS_FEIN} />
        <path d="M0 -37 L9 -35 L0 -34 Z" fill={P.orange} />
        <circle cx={-3} cy={-39} r={1.5} fill={P.auge} />
        <circle cx={3} cy={-39} r={1.5} fill={P.auge} />
        <path d="M-9 -28 Q0 -24 9 -28" fill="none" stroke={P.rot} strokeWidth={4} strokeLinecap="round" />
      </g>
      {[[30, 40], [80, 70], [150, 30], [200, 80], [120, 110], [60, 130], [220, 120], [14, 100]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={2.5} fill={P.weiss} />
      ))}
    </g>
  );
}

function nacht(zeit: number): ReactNode {
  const sterne: [number, number, number][] = [[24, 30, 7], [70, 20, 5], [100, 56, 5], [150, 28, 6], [188, 70, 5], [46, 90, 5], [214, 28, 5], [130, 92, 4], [20, 130, 4]];
  return (
    <g>
      <R y={0} h={240} f={P.nacht} />
      <R y={0} h={70} f={P.nachtTief} />
      <R y={70} h={40} f={P.nachtTief} />
      <rect x={0} y={70} width={240} height={40} fill={P.nacht} opacity={0.5} />
      {sterne.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.7} />
      ))}
      <circle cx={196} cy={46} r={20} fill={P.gelbHell} {...UMRISS_FEIN} />
      <circle cx={204} cy={40} r={17} fill={P.nachtTief} />
      <path d="M0 160 Q50 136 110 154 Q180 134 240 152 V240 H0 Z" fill={P.dunkelTief} />
      <path d="M0 172 Q70 160 130 172 Q190 162 240 172 V240 H0 Z" fill={P.dunkel} />
      <path d="M0 172 Q70 160 130 172 Q190 162 240 172" fill="none" stroke={P.dunkelHell} strokeWidth={3} strokeLinecap="round" />
      <g transform="translate(160 160)">
        <rect x={-10} y={-18} width={20} height={18} fill={P.dunkelHell} {...UMRISS_FEIN} />
        <path d="M-13 -18 L0 -32 L13 -18 Z" fill={P.dunkelTief} {...UMRISS_FEIN} />
        <rect x={-3} y={-13} width={6} height={7} fill={P.gelb} />
      </g>
      <Am x={22} y={200} s={1.5} kinder={<TanneFlach f={P.dunkelTief} h={P.dunkelHell} />} />
      <Am x={54} y={232} s={0.9} kinder={<TanneFlach f={P.dunkelTief} h={P.dunkelHell} />} />
      <Am x={216} y={198} s={1.6} kinder={<TanneFlach f={P.dunkelTief} h={P.dunkelHell} />} />
      {[[40, 190], [196, 222], [14, 226], [226, 160], [80, 210]].map(([x, y], i) => {
        const k = (Math.sin(zeit * 2 + i * 2) + 1) / 2;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={2 + k * 4} fill={P.gelbHell} opacity={0.25 * k} />
            <circle cx={x} cy={y} r={2.2} fill={P.gelb} opacity={0.4 + 0.6 * k} />
          </g>
        );
      })}
    </g>
  );
}

function unterwasser(zeit: number): ReactNode {
  const alge = (x: number, y: number, h: number, ph: number) => {
    const w = Math.sin(zeit * 1.6 + ph) * 5;
    const d = `M${x} ${y} Q${x + w + 7} ${y - h * 0.35} ${x + w} ${y - h * 0.65} T${x + w * 1.4} ${y - h}`;
    return <Strich key={x} d={d} f={P.gruen} b={7} u={11} />;
  };
  const blase = (x: number, v: number, r: number, ph: number) => {
    const k = (zeit * v + ph) % 1;
    return <circle key={x} cx={x + Math.sin(zeit * 2 + ph * 9) * 3} cy={236 - k * 220} r={r} fill={P.wasserHell} opacity={0.75} stroke={P.weiss} strokeWidth={1.5} />;
  };
  return (
    <g>
      <R y={0} h={240} f={P.wasser} />
      <R y={110} h={130} f={P.wasserTief} />
      <rect x={0} y={110} width={240} height={130} fill={P.wasser} opacity={0.4} />
      <path d="M30 0 L70 0 L50 150 L10 150 Z M150 0 L190 0 L200 150 L160 150 Z" fill={P.wasserHell} opacity={0.3} />
      <path d="M0 176 Q60 160 120 174 Q190 160 240 176 V240 H0 Z" fill={P.sandTief} />
      <path d="M0 192 Q70 180 130 192 Q190 182 240 192 V240 H0 Z" fill={P.sand} />
      <path d="M0 192 Q70 180 130 192 Q190 182 240 192" fill="none" stroke={P.sandHell} strokeWidth={3} strokeLinecap="round" />
      <Fisch x={170 + Math.sin(zeit * 0.9) * 8} y={92} s={0.9} f={P.orange} t={P.orangeTief} />
      <Fisch x={64 + Math.sin(zeit * 0.7 + 2) * 8} y={60} s={0.6} f={P.gelb} t={P.gelbTief} />
      <g transform="translate(24 210)">
        <Strich d="M0 0 V-24 M0 -12 L-12 -26 M0 -16 L12 -32" f={P.rosa} />
        <Strich d="M30 8 V-6 M30 0 L24 -10" f={P.orange} b={8} u={13} />
      </g>
      {alge(206, 232, 54, 0)}
      {alge(220, 236, 40, 2)}
      {alge(10, 232, 40, 4)}
      <Am x={196} y={238} s={1.1} kinder={<Stein />} />
      <path transform="translate(176 232)" d={stern(0, 0, 10)} fill={P.orange} {...UMRISS_FEIN} />
      {blase(60, 0.08, 4, 0.1)}
      {blase(110, 0.06, 3, 0.5)}
      {blase(150, 0.09, 5, 0.8)}
      {blase(30, 0.07, 3, 0.3)}
    </g>
  );
}

function weltall(zeit: number): ReactNode {
  const sterne: [number, number, number][] = [[20, 24, 6], [64, 44, 4], [104, 20, 5], [150, 50, 4], [186, 24, 6], [220, 70, 5], [34, 96, 4], [210, 120, 4], [80, 84, 3], [140, 100, 3]];
  return (
    <g>
      <R y={0} h={240} f={P.dunkelTief} />
      <rect x={0} y={80} width={240} height={90} fill={P.dunkel} opacity={0.5} />
      {sterne.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.3} />
      ))}
      <g transform="translate(42 66)">
        <ellipse rx={32} ry={9} fill="none" stroke={P.linie} strokeWidth={9} transform="rotate(-18)" />
        <circle r={18} fill={P.lila} {...UMRISS} />
        <path d="M6 -14 A18 18 0 0 1 8 14 A12 18 0 0 0 6 -14 Z" fill={P.lilaTief} opacity={0.6} />
        <path d="M-12 -4 A14 14 0 0 1 -4 -13" fill="none" stroke={P.lilaHell} strokeWidth={3.5} strokeLinecap="round" />
        <ellipse rx={32} ry={9} fill="none" stroke={P.gold} strokeWidth={5} transform="rotate(-18)" strokeDasharray="60 200" strokeDashoffset={-48} />
      </g>
      <Kreis x={204} y={52} r={11} f={P.rot} />
      <circle cx={208} cy={56} r={7} fill={P.rotTief} opacity={0.5} />
      <Kreis x={170} y={140} r={9} f={P.blau} />
      <path d="M165 138 q4 -4 8 0 M170 144 q3 -2 5 0" stroke={P.gruen} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d="M0 176 Q60 160 120 172 Q190 158 240 174 V240 H0 Z" fill={P.grau} />
      <path d="M0 176 Q60 160 120 172 Q190 158 240 174" fill="none" stroke={P.grauHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M150 240 Q200 205 240 214 V240 Z" fill={P.grauTief} opacity={0.5} />
      {[[24, 204, 15], [208, 214, 18], [190, 188, 8], [60, 234, 10], [100, 196, 7]].map(([x, y, r]) => (
        <g key={`${x}${y}`}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.45} fill={P.grauTief} {...UMRISS_FEIN} />
          <path d={`M${x - r * 0.7} ${y - 1} Q${x} ${y - r * 0.4} ${x + r * 0.5} ${y - 2}`} fill="none" stroke={P.grauHell} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
      <g transform="translate(216 196) rotate(12)">
        <path d="M0 -40 Q10 -28 8 -6 H-8 Q-10 -28 0 -40 Z" fill={P.weiss} {...UMRISS_FEIN} />
        <path d="M4 -34 Q10 -26 8 -6 H3 Q6 -24 4 -34 Z" fill={P.metallTief} opacity={0.6} />
        <circle cx={0} cy={-22} r={4} fill={P.wasserHell} {...UMRISS_FEIN} />
        <path d="M-8 -6 L-15 2 V-6 L-8 -14 Z M8 -6 L15 2 V-6 L8 -14 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M-5 -6 H5 L0 4 Z" fill={P.lavaHell} {...UMRISS_FEIN} />
      </g>
    </g>
  );
}

function burg(): ReactNode {
  const turm = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <rect x={-26} y={60} width={52} height={112} fill={P.stein} {...UMRISS} />
      <rect x={4} y={62} width={20} height={108} fill={P.steinTief} opacity={0.5} />
      <path d="M-26 60 h0 v-8 h10 v8 M-5 60 v-8 h10 v8 M16 60 v-8 h10 v8" fill={P.stein} {...UMRISS_FEIN} />
      <rect x={-5} y={80} width={10} height={20} rx={5} fill={P.dunkelHell} {...UMRISS_FEIN} />
      <path d="M-30 52 L0 12 L30 52 Z" fill={P.rot} {...UMRISS} />
      <path d="M0 12 L30 52 H6 Z" fill={P.rotTief} opacity={0.6} />
      <path d="M0 12 V-6" stroke={P.linie} strokeWidth={3} strokeLinecap="round" />
      <path d="M0 -6 H16 L11 0 L16 6 H0 Z" fill={P.gold} {...UMRISS_FEIN} />
    </g>
  );
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Wolke x={120} y={40} s={0.7} />
      <rect x={0} y={96} width={240} height={76} fill={P.stein} {...UMRISS} />
      <path d="M0 96 v-8 h12 v8 M28 96 v-8 h12 v8 M56 96 v-8 h12 v8 M84 96 v-8 h12 v8 M112 96 v-8 h12 v8 M140 96 v-8 h12 v8 M168 96 v-8 h12 v8 M196 96 v-8 h12 v8 M224 96 v-8 h12 v8" fill={P.stein} stroke={P.linie} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M0 128 H240 M0 150 H240 M40 128 V150 M110 128 V150 M180 128 V150 M70 106 V128 M150 106 V128 M70 150 V172 M150 150 V172" stroke={P.steinTief} strokeWidth={2.5} fill="none" />
      <path d="M92 172 V134 Q120 108 148 134 V172 Z" fill={P.steinTief} {...UMRISS_FEIN} />
      {turm(26)}
      {turm(214)}
      <R y={172} h={68} f={P.steinTief} />
      <path d="M0 172 H240" stroke={P.linie} strokeWidth={3} />
      <path d="M0 196 H240 M0 220 H240 M30 172 L10 196 L-6 220 M90 172 L80 196 L72 220 M150 172 L160 196 L168 220 M210 172 L230 196 L246 220" stroke={P.stein} strokeWidth={2.5} fill="none" opacity={0.8} />
      <g transform="translate(18 224)">
        <path d="M-12 0 Q-15 -14 -12 -28 H12 Q15 -14 12 0 Z" fill={P.holz} {...UMRISS_FEIN} />
        <path d="M-14 -20 H14 M-14 -8 H14" stroke={P.metallTief} strokeWidth={4} />
        <path d="M5 -26 Q8 -14 5 -2" stroke={P.holzTief} strokeWidth={4} fill="none" opacity={0.6} />
      </g>
      <g transform="translate(214 230)">
        <rect x={-14} y={-24} width={28} height={24} fill={P.holz} {...UMRISS_FEIN} />
        <path d="M-14 -24 L14 0 M14 -24 L-14 0" stroke={P.holzTief} strokeWidth={3} />
        <path d="M-10 -14 q3 -8 6 0" fill="none" />
      </g>
    </g>
  );
}

function vulkan(zeit: number): ReactNode {
  const gl = (Math.sin(zeit * 2.5) + 1) / 2;
  return (
    <g>
      <R y={0} h={240} f={P.orangeHell} />
      <R y={80} h={70} f={P.gelbHell} />
      <rect x={0} y={80} width={240} height={70} fill={P.orangeHell} opacity={0.45} />
      <circle cx={46} cy={60} r={16} fill={P.gelb} {...UMRISS_FEIN} />
      {[0, 1, 2].map((i) => {
        const k = (zeit * 0.12 + i / 3) % 1;
        return <circle key={i} cx={196 + k * 34 + Math.sin(k * 6 + i) * 4} cy={90 - k * 70} r={9 + k * 12} fill={P.grau} opacity={0.75 * (1 - k)} />;
      })}
      <R y={150} h={90} f={P.wasser} />
      <path d="M14 166 q8 -5 16 0 t16 0 M150 160 q8 -5 16 0 t16 0" fill="none" stroke={P.wasserHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M130 172 L176 90 H214 L260 172 Z" fill={P.dunkelHell} {...UMRISS} />
      <path d="M214 90 L260 172 H206 Z" fill={P.dunkelTief} opacity={0.6} />
      <ellipse cx={195} cy={90} rx={19} ry={6} fill={P.lava} {...UMRISS_FEIN} />
      <ellipse cx={195} cy={89} rx={11} ry={3} fill={P.lavaHell} opacity={0.5 + gl * 0.5} />
      <path d="M190 94 Q184 120 192 140 Q186 156 190 172 H202 Q200 150 204 138 Q198 116 200 94 Z" fill={P.lava} opacity={0.8 + gl * 0.2} />
      <path d="M194 96 Q190 120 196 140" stroke={P.lavaHell} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6 + gl * 0.4} />
      <ellipse cx={120} cy={236} rx={170} ry={60} fill={P.sandTief} {...UMRISS} />
      <ellipse cx={120} cy={238} rx={160} ry={52} fill={P.dunkelHell} />
      <ellipse cx={120} cy={242} rx={150} ry={44} fill={P.dunkel} opacity={0.6} />
      <path d="M0 214 q30 -8 50 6 M200 206 q24 -4 40 10" stroke={P.lavaTief} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M8 214 q26 -6 42 6 M206 206 q20 -3 32 8" stroke={P.lava} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.6 + gl * 0.4} />
      <Am x={22} y={206} s={1.3} kinder={<Palme />} />
      <g transform="translate(214 232)">
        <path d="M-14 0 Q-16 -12 -6 -16 Q4 -20 12 -12 Q16 -4 14 0 Z" fill={P.dunkelTief} {...UMRISS_FEIN} />
        <path d="M-8 -8 Q-7 -13 -2 -14" stroke={P.lavaHell} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.5 + gl * 0.5} />
      </g>
      <Am x={190} y={236} s={0.8} kinder={<Stein />} />
    </g>
  );
}

function regenbogen(zeit: number): ReactNode {
  const farben = [P.rot, P.orange, P.gelb, P.gruenHell, P.blau, P.lila];
  const glitzer: [number, number, number][] = [[28, 40, 7], [212, 36, 8], [56, 120, 5], [190, 112, 6], [14, 170, 5], [228, 160, 5], [100, 30, 4]];
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <R y={0} h={60} f={P.blauHell} />
      <rect x={0} y={0} width={240} height={60} fill={P.himmel} opacity={0.4} />
      {farben.map((f, i) => {
        const r = 104 - i * 8;
        return <path key={i} d={`M${120 - r} 172 A${r} ${r} 0 0 1 ${120 + r} 172`} fill="none" stroke={f} strokeWidth={8.5} opacity={0.9} />;
      })}
      <path d="M12 172 A108 108 0 0 1 228 172" fill="none" stroke={P.goldHell} strokeWidth={3} opacity={0.8} />
      <Wolke x={30} y={178} s={1.1} />
      <Wolke x={210} y={178} s={1.1} />
      <path d="M0 170 Q60 160 120 170 Q190 160 240 170 V240 H0 Z" fill={P.wieseHell} />
      <path d="M0 184 Q70 176 130 186 Q190 176 240 186 V240 H0 Z" fill={P.wiese} />
      <path d="M0 170 Q60 160 120 170 Q190 160 240 170" fill="none" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <g transform="translate(212 218) scale(1.1)">
        <path d="M-18 -22 Q-22 0 -10 0 H10 Q22 0 18 -22 Z" fill={P.dunkel} {...UMRISS} />
        <path d="M8 -20 Q14 -4 8 -2" stroke={P.dunkelTief} strokeWidth={4} fill="none" opacity={0.7} />
        <ellipse cx={0} cy={-22} rx={18} ry={5} fill={P.goldTief} {...UMRISS_FEIN} />
        <circle cx={-8} cy={-27} r={6} fill={P.gold} {...UMRISS_FEIN} />
        <circle cx={5} cy={-29} r={6.5} fill={P.gold} {...UMRISS_FEIN} />
        <circle cx={12} cy={-24} r={5} fill={P.goldHell} {...UMRISS_FEIN} />
      </g>
      <path transform="translate(24 214)" d={stern(0, 0, 11)} fill={P.gold} {...UMRISS_FEIN} />
      <path transform="translate(14 236)" d={stern(0, 0, 7)} fill={P.goldHell} {...UMRISS_FEIN} />
      <Am x={74} y={238} s={0.8} kinder={<Blume />} />
      <Am x={160} y={236} s={0.8} kinder={<Blume />} />
      <Am x={228} y={238} kinder={<Blume />} />
      {glitzer.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.9} />
      ))}
    </g>
  );
}

function wolkenschloss(zeit: number): ReactNode {
  const turm = (x: number, y: number, b: number, h: number, dach: string, dachTief: string) => (
    <g key={x}>
      <rect x={x - b / 2} y={y - h} width={b} height={h} fill={P.weiss} {...UMRISS_FEIN} />
      <rect x={x + b * 0.1} y={y - h + 2} width={b * 0.4} height={h - 4} fill={P.lilaHell} opacity={0.5} />
      <path d={`M${x - b / 2 - 3} ${y - h} L${x} ${y - h - b * 0.9} L${x + b / 2 + 3} ${y - h} Z`} fill={dach} {...UMRISS_FEIN} />
      <path d={`M${x} ${y - h - b * 0.9} L${x + b / 2 + 3} ${y - h} H${x + 2} Z`} fill={dachTief} opacity={0.6} />
      <rect x={x - 2.5} y={y - h + 6} width={5} height={8} rx={2.5} fill={P.lila} />
    </g>
  );
  const dx = (v: number, ph: number) => ((zeit * v + ph) % 320) - 40;
  const glitzer: [number, number, number][] = [[30, 30, 7], [206, 24, 7], [150, 60, 5], [20, 120, 5], [224, 110, 5], [96, 20, 4]];
  return (
    <g>
      <R y={0} h={240} f={P.blauHell} />
      <R y={80} h={160} f={P.himmel} />
      <rect x={0} y={0} width={240} height={80} fill={P.lilaHell} opacity={0.3} />
      <Wolke x={dx(6, 60)} y={60} s={0.8} />
      <Wolke x={dx(4, 200)} y={100} s={0.6} />
      <g>
        {turm(166, 156, 16, 40, P.gold, P.goldTief)}
        {turm(206, 156, 14, 30, P.lila, P.lilaTief)}
        <rect x={172} y={128} width={30} height={28} fill={P.weiss} {...UMRISS_FEIN} />
        {turm(188, 128, 12, 20, P.gold, P.goldTief)}
        <path d="M178 156 V146 Q187 136 196 146 V156 Z" fill={P.lilaHell} {...UMRISS_FEIN} />
      </g>
      <path d="M0 164 Q40 150 90 162 Q150 148 240 164 V240 H0 Z" fill={P.weiss} />
      <path d="M0 170 Q60 164 120 172 Q190 164 240 172 V240 H0 Z" fill={P.eisHell} />
      <path d="M0 164 Q40 150 90 162 Q150 148 240 164" fill="none" stroke={P.eis} strokeWidth={4} strokeLinecap="round" />
      <path d="M0 214 Q60 204 110 216 Q70 232 0 234 Z" fill={P.eis} opacity={0.6} />
      <path d="M150 238 Q200 216 240 222 V240 Z" fill={P.eis} opacity={0.6} />
      <Wolke x={26} y={206} s={1.3} f={P.weiss} t={P.eis} />
      <Wolke x={214} y={222} s={1.3} f={P.weiss} t={P.eis} />
      <path transform="translate(26 180)" d={stern(0, 0, 11)} fill={P.gold} {...UMRISS_FEIN} />
      <path transform="translate(214 200)" d={stern(0, 0, 9)} fill={P.gold} {...UMRISS_FEIN} />
      <path transform="translate(60 236)" d={stern(0, 0, 6)} fill={P.goldHell} {...UMRISS_FEIN} />
      {glitzer.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.6} />
      ))}
    </g>
  );
}

export const HINTERGRUENDE: Hintergrund[] = [
  { id: 'wiese', name: 'Wiese', seltenheit: 1, zeichnung: wiese },
  { id: 'strand', name: 'Strand', seltenheit: 1, zeichnung: strand },
  { id: 'wueste', name: 'Wüste', seltenheit: 1, zeichnung: wueste },
  { id: 'wald', name: 'Wald', seltenheit: 2, zeichnung: wald },
  { id: 'berge', name: 'Berge', seltenheit: 2, zeichnung: berge },
  { id: 'winterwald', name: 'Winterwald', seltenheit: 2, zeichnung: winterwald },
  { id: 'nacht', name: 'Sternennacht', seltenheit: 3, bewegt: true, zeichnung: nacht },
  { id: 'unterwasser', name: 'Unterwasser', seltenheit: 3, bewegt: true, zeichnung: unterwasser },
  { id: 'weltall', name: 'Weltall', seltenheit: 4, bewegt: true, zeichnung: weltall },
  { id: 'burg', name: 'Burghof', seltenheit: 4, zeichnung: burg },
  { id: 'vulkan', name: 'Vulkaninsel', seltenheit: 4, bewegt: true, zeichnung: vulkan },
  { id: 'regenbogen', name: 'Regenbogen', seltenheit: 5, bewegt: true, zeichnung: regenbogen },
  { id: 'wolkenschloss', name: 'Wolkenschloss', seltenheit: 5, bewegt: true, zeichnung: wolkenschloss },
];
