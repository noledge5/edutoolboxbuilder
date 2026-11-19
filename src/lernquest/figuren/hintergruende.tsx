// Backgrounds of the hero card (slot `hintergrund` in src/lernquest/teile.ts): a 240 × 240 scene, the hero stands at
// (120, 230), the pet at x ≈ 40. The middle (x 60…180, y 40…230) stays calm; objects sit at the sides and edges.
// Since 19.11.2026 without outline and with few big shapes (sky, 2-3 strips of ground, 1-3 typical motifs): the hero
// stands in front, so the background keeps quiet (docs/design/prinzipien.md). Depth by tone: far = paler.
import type { ReactNode } from 'react';
import { P, STRICH, flaeche } from './stil';
import { Flaeche } from './flaeche';
import { Funkeln, stern } from './zeichnen';

export interface Hintergrund {
  id: string;
  name: string;
  /** 1 Gewöhnlich … 5 Legendär (part's seltenheit + 1). */
  seltenheit: 1 | 2 | 3 | 4 | 5;
  bewegt?: boolean;
  zeichnung: (zeit: number) => ReactNode;
}

/** Places a piece (origin bottom centre) at x, y with scale s. */
function Am({ x, y, s = 1, kinder }: { x: number; y: number; s?: number; kinder: ReactNode }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{kinder}</g>;
}
const R = ({ y, h, f }: { y: number; h: number; f: string }) => <rect x={0} y={y} width={240} height={h} fill={f} />;
/** Open ground (hills, floor): a plain filled area that runs off the edge. */
const Land = ({ d, f }: { d: string; f: string }) => <path d={d} fill={f} />;
/** A motif shape: fill and stroke in its own colour (no outline). */
const Fl = ({ d, f, b = 3 }: { d: string; f: string; b?: number }) => <path d={d} {...flaeche(f, b)} />;
const Kr = ({ x, y, r, f, b = 3 }: { x: number; y: number; r: number; f: string; b?: number }) => <circle cx={x} cy={y} r={r} {...flaeche(f, b)} />;
/** A ball with its shade down right: the same circle twice, moved a little. */
const Kugel = ({ x, y, r, f, t }: { x: number; y: number; r: number; f: string; t: string }) => (
  <g>
    <Kr x={x + r * 0.22} y={y + r * 0.2} r={r} f={t} />
    <Kr x={x} y={y} r={r} f={f} />
  </g>
);

/** A flat cloud, origin bottom centre, about 56 wide; the same cloud once more in `t`, 3 lower, as its shade. */
function Wolke({ x, y, s = 1, f = P.weiss, t = P.eis }: { x: number; y: number; s?: number; f?: string; t?: string }) {
  const form = (c: string, dy: number) => (
    <g transform={`translate(0 ${dy})`}>
      <rect x={-26} y={-10} width={52} height={10} rx={5} {...flaeche(c, 2)} />
      <circle cx={-12} cy={-12} r={9} {...flaeche(c, 2)} />
      <circle cx={3} cy={-18} r={13} {...flaeche(c, 2)} />
      <circle cx={17} cy={-11} r={9} {...flaeche(c, 2)} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {form(t, 3)}
      {form(f, 0)}
    </g>
  );
}

function Sonne({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 8} fill={P.gelbHell} opacity={0.5} />
      <Kr x={x} y={y} r={r} f={P.gelb} />
    </g>
  );
}

function Baum() {
  return (
    <g>
      <rect x={-5} y={-30} width={10} height={30} rx={3} {...flaeche(P.leder, 2.5)} />
      <Kr x={4} y={-44} r={21} f={P.blattTief} />
      <Kr x={-1} y={-48} r={21} f={P.blatt} />
    </g>
  );
}

/** A fir of two tiers (about 66 high); with `schnee` snow caps on both. */
function Tanne({ stamm = true, schnee = false }: { stamm?: boolean; schnee?: boolean }) {
  return (
    <g>
      {stamm && <rect x={-4} y={-14} width={8} height={14} rx={2} {...flaeche(P.leder, 2.5)} />}
      <Fl d="M0 -40 L24 -8 H-24 Z" f={P.blattTief} />
      <Fl d="M0 -66 L17 -34 H-17 Z" f={P.blatt} />
      {schnee && <Fl d="M0 -40 L11 -25 H-11 Z" f={P.schnee} b={2.5} />}
      {schnee && <Fl d="M0 -66 L8 -50 H-8 Z" f={P.schnee} b={2.5} />}
    </g>
  );
}

/** A fir as one flat shape (silhouette, about 64 high, origin at the foot): forest edges and night trees. */
const TANNE_FLACH = 'M-4 0 V-12 H-22 L-8 -34 H-16 L0 -64 L16 -34 H8 L22 -12 H4 V0 Z';

function Kaktus() {
  return <path d="M0 -2 V-46 M0 -16 H-13 V-30 M0 -24 H13 V-38" stroke={P.gruen} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
}

function Palme() {
  return (
    <g>
      <path d="M0 0 Q10 -30 -2 -64" stroke={P.holz} strokeWidth={9} strokeLinecap="round" fill="none" />
      <g transform="translate(-2 -64)">
        {[-30, 15, 60, 140, 195].map((w) => (
          <g key={w} transform={`rotate(${w})`}>
            <Fl d="M0 0 Q20 -22 46 2 Q22 -6 0 0 Z" f={P.gruen} b={2.5} />
          </g>
        ))}
      </g>
    </g>
  );
}

function Fisch({ x, y, s = 1, f, t }: { x: number; y: number; s?: number; f: string; t: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Fl d="M-12 0 L-24 -9 V9 Z" f={t} b={2.5} />
      <ellipse rx={14} ry={9} {...flaeche(f, 2.5)} />
      <circle cx={7} cy={-2} r={2.4} fill={P.auge} />
    </g>
  );
}

function wiese(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Sonne x={38} y={44} />
      <Wolke x={170} y={56} s={0.9} />
      <Land d="M0 150 Q60 126 120 148 Q180 130 240 146 V240 H0 Z" f={P.wieseTief} />
      <Land d="M0 172 Q80 154 150 170 Q200 160 240 168 V240 H0 Z" f={P.wiese} />
      <Am x={24} y={190} s={1.5} kinder={<Baum />} />
      <Am x={216} y={182} s={1.2} kinder={<Baum />} />
      {[[16, 228], [222, 230]].map(([x, y]) => (
        <g key={x}>
          <Kr x={x} y={y} r={7} f={P.rosa} />
          <Kr x={x} y={y} r={3} f={P.gelb} b={2} />
        </g>
      ))}
    </g>
  );
}

function strand(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Sonne x={204} y={38} />
      <Wolke x={92} y={56} s={0.8} />
      <R y={140} h={34} f={P.wasser} />
      <R y={140} h={8} f={P.wasserTief} />
      <g transform="translate(44 140)">
        <Fl d="M-14 0 L-11 -9 H13 L16 0 Z" f={P.holz} b={2.5} />
        <Fl d="M0 -12 V-38 L17 -14 Z" f={P.weiss} b={2.5} />
      </g>
      <Land d="M0 172 Q60 162 120 170 Q190 162 240 170 V240 H0 Z" f={P.sand} />
      <path d="M0 170 Q60 160 120 168 Q190 160 240 168" fill="none" stroke={P.wasserHell} strokeWidth={5} strokeLinecap="round" />
      <Am x={210} y={204} s={1.5} kinder={<Palme />} />
      <Fl d={stern(24, 224, 12)} f={P.orange} b={2.5} />
    </g>
  );
}

function wueste(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <circle cx={196} cy={50} r={27} fill={P.orangeHell} opacity={0.6} />
      <Kr x={196} y={50} r={17} f={P.gelb} />
      <Wolke x={52} y={54} s={0.7} />
      <Land d="M0 160 Q60 140 120 154 Q180 140 240 156 V240 H0 Z" f={P.sandTief} />
      <g transform="translate(172 152)">
        <Fl d="M-24 0 L0 -30 L24 0 Z" f={P.sand} b={2.5} />
        <Fl d="M0 -30 L24 0 H5 Z" f={P.sandTief} b={2.5} />
      </g>
      <Land d="M0 178 Q50 162 110 174 Q180 164 240 176 V240 H0 Z" f={P.sand} />
      <Land d="M150 240 Q200 216 240 222 V240 Z" f={P.sandTief} />
      <Am x={26} y={200} s={1.5} kinder={<Kaktus />} />
      <Am x={214} y={226} s={1.1} kinder={<Kaktus />} />
    </g>
  );
}

/** Wald (review 19.11.2026: was weak): blue sky, a dense edge of firs on the horizon, a path leading in, big trees in
 *  front at the sides, a toadstool. */
function wald(): ReactNode {
  const rand: [number, number][] = [[6, 0.8], [32, 1], [58, 0.72], [84, 0.92], [110, 0.78], [136, 1], [162, 0.74], [188, 0.95], [214, 0.8], [238, 0.98]];
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Wolke x={74} y={46} s={0.7} />
      {rand.map(([x, s]) => (
        <Am key={x} x={x} y={158} s={s} kinder={<Fl d={TANNE_FLACH} f={P.blattTief} b={2} />} />
      ))}
      <Land d="M0 152 Q60 146 120 152 Q180 146 240 152 V240 H0 Z" f={P.wieseTief} />
      <Land d="M0 178 Q60 168 120 176 Q190 166 240 178 V240 H0 Z" f={P.wiese} />
      <Land d="M100 240 Q112 196 116 152 H124 Q128 196 140 240 Z" f={P.sand} />
      <Am x={22} y={206} s={1.9} kinder={<Baum />} />
      <Am x={218} y={204} s={1.6} kinder={<Tanne />} />
      <g transform="translate(184 234)">
        <Fl d="M-4 0 L-3 -10 H3 L4 0 Z" f={P.creme} b={2.5} />
        <Fl d="M-12 -9 Q-11 -24 0 -24 Q11 -24 12 -9 Z" f={P.rot} b={2.5} />
        <Kr x={-3} y={-16} r={2.8} f={P.weiss} b={1} />
      </g>
    </g>
  );
}

function berge(): ReactNode {
  const berg = (x: number, y: number, b: number, h: number, f: string, t: string) => (
    <g key={`${x}${h}`}>
      <Fl d={`M${x - b} ${y} L${x} ${y - h} L${x + b} ${y} Z`} f={f} />
      <Fl d={`M${x} ${y - h} L${x + b} ${y} H${x + b * 0.25} Z`} f={t} />
      <Fl d={`M${x} ${y - h} L${x + b * 0.3} ${y - h * 0.68} Q${x} ${y - h * 0.58} ${x - b * 0.3} ${y - h * 0.68} Z`} f={P.schnee} b={2.5} />
    </g>
  );
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Wolke x={170} y={46} s={0.8} />
      {berg(120, 158, 66, 62, P.grauHell, P.grau)}
      {berg(44, 162, 62, 92, P.grau, P.grauTief)}
      {berg(204, 162, 56, 80, P.grau, P.grauTief)}
      <Land d="M0 166 Q60 154 120 166 Q190 154 240 166 V240 H0 Z" f={P.wieseTief} />
      <Land d="M0 184 Q70 172 130 184 Q190 174 240 184 V240 H0 Z" f={P.wiese} />
      <Am x={22} y={210} s={1.4} kinder={<Tanne />} />
      <Am x={216} y={206} s={1.5} kinder={<Tanne />} />
    </g>
  );
}

function winterwald(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.eis} />
      <R y={0} h={90} f={P.eisHell} />
      <Land d="M0 150 Q50 128 100 146 Q160 126 240 148 V240 H0 Z" f={P.eisTief} />
      {[62, 176].map((x) => (
        <Am key={x} x={x} y={162} s={0.55} kinder={<Tanne stamm={false} schnee />} />
      ))}
      <Land d="M0 166 Q60 152 120 164 Q190 152 240 164 V240 H0 Z" f={P.schnee} />
      <Land d="M130 240 Q190 218 240 222 V240 Z" f={P.eis} />
      <Am x={22} y={206} s={1.5} kinder={<Tanne schnee />} />
      <Am x={218} y={198} s={1.3} kinder={<Tanne schnee />} />
      <g transform="translate(184 236) scale(0.8)">
        <Kugel x={0} y={-14} r={15} f={P.weiss} t={P.eisTief} />
        <Kugel x={0} y={-40} r={11} f={P.weiss} t={P.eisTief} />
        <Fl d="M-9 -48 H9 L7 -60 H-7 Z" f={P.dunkel} b={2.5} />
        <Fl d="M0 -40 L13 -37 L0 -34 Z" f={P.orange} b={2} />
        <path d="M-10 -30 Q0 -25 10 -30" fill="none" stroke={P.rot} strokeWidth={5} strokeLinecap="round" />
      </g>
      {[[30, 40], [196, 30], [214, 100], [14, 112]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={3.5} fill={P.eis} />
      ))}
    </g>
  );
}

/** Sternennacht (review 19.11.2026: was weak): the sky gets lighter towards the horizon in three flat bands, so the dark
 *  hills, firs and the house stand out; a big crescent moon, twinkling stars, fireflies. */
function nacht(zeit: number): ReactNode {
  const sterne: [number, number, number][] = [[24, 30, 8], [84, 22, 6], [136, 48, 6], [56, 76, 5], [150, 92, 4], [222, 104, 5]];
  return (
    <g>
      <R y={0} h={240} f={P.nachtTief} />
      <R y={66} h={94} f={P.nacht} />
      <R y={116} h={44} f={P.nachtHell} />
      {sterne.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.7} />
      ))}
      <Kr x={190} y={42} r={24} f={P.gelbHell} />
      <circle cx={202} cy={35} r={20} fill={P.nachtTief} />
      {[[36, 0.55], [62, 0.7], [88, 0.5]].map(([x, s]) => (
        <Am key={x} x={x} y={150} s={s} kinder={<Fl d={TANNE_FLACH} f={P.dunkel} b={2} />} />
      ))}
      <Land d="M0 160 Q50 136 110 154 Q180 134 240 152 V240 H0 Z" f={P.dunkel} />
      <g transform="translate(170 158)">
        <Fl d="M-11 -16 H11 V0 H-11 Z" f={P.dunkelHell} b={2.5} />
        <Flaeche d="M-15 -16 L0 -32 L15 -16 Z" farbe={P.dunkelTief} hell={P.dunkelHell} breite={2.5} />
        <rect x={-3.5} y={-12} width={7} height={8} rx={1} fill={P.gelb} />
      </g>
      <Land d="M0 178 Q70 166 130 178 Q190 168 240 178 V240 H0 Z" f={P.dunkelTief} />
      <Am x={24} y={206} s={1.5} kinder={<Flaeche d={TANNE_FLACH} farbe={P.dunkelTief} hell={P.dunkelHell} />} />
      <Am x={216} y={204} s={1.6} kinder={<Flaeche d={TANNE_FLACH} farbe={P.dunkelTief} hell={P.dunkelHell} />} />
      {[[52, 222], [196, 232], [226, 150]].map(([x, y], i) => {
        const k = (Math.sin(zeit * 2 + i * 2) + 1) / 2;
        return <circle key={i} cx={x} cy={y} r={3.5} fill={P.gelb} opacity={0.35 + 0.65 * k} />;
      })}
    </g>
  );
}

function unterwasser(zeit: number): ReactNode {
  const alge = (x: number, y: number, h: number, ph: number) => {
    const w = Math.sin(zeit * 1.6 + ph) * 5;
    return <path key={x} d={`M${x} ${y} Q${x + w + 7} ${y - h * 0.35} ${x + w} ${y - h * 0.65} T${x + w * 1.4} ${y - h}`} fill="none" stroke={P.gruen} strokeWidth={8} strokeLinecap="round" />;
  };
  const blase = (x: number, v: number, r: number, ph: number) => {
    const k = (zeit * v + ph) % 1;
    return <circle key={x} cx={x + Math.sin(zeit * 2 + ph * 9) * 3} cy={236 - k * 220} r={r} fill={P.wasserHell} opacity={0.8} />;
  };
  return (
    <g>
      <R y={0} h={240} f={P.wasser} />
      <R y={110} h={130} f={P.wasserTief} />
      <path d="M30 0 H74 L52 150 H12 Z M150 0 H194 L204 150 H164 Z" fill={P.wasserHell} opacity={0.3} />
      <Land d="M0 176 Q60 160 120 174 Q190 160 240 176 V240 H0 Z" f={P.sandTief} />
      <Land d="M0 196 Q70 184 130 196 Q190 186 240 196 V240 H0 Z" f={P.sand} />
      <Fisch x={170 + Math.sin(zeit * 0.9) * 8} y={92} s={1} f={P.orange} t={P.orangeTief} />
      <Fisch x={64 + Math.sin(zeit * 0.7 + 2) * 8} y={58} s={0.7} f={P.gelb} t={P.gelbTief} />
      <path d="M24 212 V186 M24 198 L12 184 M24 202 L36 190" stroke={P.rosa} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {alge(208, 234, 56, 0)}
      {alge(10, 234, 40, 4)}
      <Fl d={stern(178, 228, 11)} f={P.orange} b={2.5} />
      {blase(60, 0.08, 5, 0.1)}
      {blase(110, 0.06, 4, 0.5)}
      {blase(150, 0.09, 6, 0.8)}
    </g>
  );
}

function weltall(zeit: number): ReactNode {
  const sterne: [number, number, number][] = [[20, 24, 6], [104, 20, 5], [186, 26, 6], [220, 100, 5], [30, 120, 4]];
  return (
    <g>
      <R y={0} h={240} f={P.dunkelTief} />
      {sterne.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.3} />
      ))}
      <g transform="translate(46 68) rotate(-18)">
        <ellipse rx={34} ry={9} fill="none" stroke={P.gold} strokeWidth={5} />
        <Kugel x={0} y={0} r={19} f={P.lila} t={P.lilaTief} />
        <path d="M-34 0 A34 9 0 0 0 34 0" fill="none" stroke={P.gold} strokeWidth={5} strokeLinecap="round" />
      </g>
      <Kugel x={204} y={56} r={12} f={P.rot} t={P.rotTief} />
      <Kugel x={168} y={134} r={9} f={P.blau} t={P.blauTief} />
      <Land d="M0 178 Q60 162 120 174 Q190 160 240 176 V240 H0 Z" f={P.grau} />
      <Land d="M140 240 Q200 208 240 214 V240 Z" f={P.grauTief} />
      <ellipse cx={30} cy={208} rx={17} ry={7} {...flaeche(P.grauTief)} />
      <ellipse cx={92} cy={230} rx={11} ry={5} {...flaeche(P.grauTief)} />
      <g transform="translate(212 200) rotate(12)">
        <Fl d="M-8 -6 L-17 4 V-8 L-8 -16 M8 -6 L17 4 V-8 L8 -16 Z" f={P.rot} b={2.5} />
        <Fl d="M0 -44 Q11 -30 9 -6 H-9 Q-11 -30 0 -44 Z" f={P.weiss} b={2.5} />
        <Fl d="M3 -38 Q11 -30 9 -6 H3 Q6 -26 3 -38 Z" f={P.metall} b={2.5} />
        <Kr x={0} y={-24} r={4.5} f={P.blau} b={2} />
        <Fl d="M-5 -4 H5 L0 8 Z" f={P.lavaHell} b={2.5} />
      </g>
    </g>
  );
}

function burg(): ReactNode {
  const turm = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <Fl d="M-26 62 H26 V172 H-26 Z" f={P.stein} />
      <Fl d="M8 64 H24 V170 H8 Z" f={P.steinTief} b={2} />
      <rect x={-6} y={84} width={12} height={22} rx={6} fill={P.dunkelHell} />
      <Fl d="M-32 60 L0 26 L32 60 Z" f={P.rot} />
      <path d="M0 26 V8" stroke={P.leder} strokeWidth={3} strokeLinecap="round" />
      <Fl d="M0 8 H17 L12 14 L17 20 H0 Z" f={P.gold} b={2.5} />
    </g>
  );
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Wolke x={120} y={42} s={0.7} />
      <Land d="M0 172 V96 H56 V82 H84 V96 H106 V82 H134 V96 H156 V82 H184 V96 H240 V172 Z" f={P.stein} />
      <R y={96} h={8} f={P.steinTief} />
      <Land d="M92 172 V138 Q120 108 148 138 V172 Z" f={P.steinTief} />
      {turm(26)}
      {turm(214)}
      <R y={172} h={68} f={P.pflaster} />
      <Land d="M0 214 Q60 204 120 216 Q70 234 0 236 Z" f={P.pflasterTief} />
      <g transform="translate(20 228)">
        <Fl d="M-13 0 Q-16 -14 -13 -30 H13 Q16 -14 13 0 Z" f={P.holz} b={2.5} />
        <path d="M-15 -21 H15 M-15 -9 H15" stroke={P.metallTief} strokeWidth={4} />
      </g>
      <g transform="translate(212 232)">
        <Fl d="M-13 -24 H13 V0 H-13 Z" f={P.holz} b={2.5} />
        <path d="M-9 -20 L9 -4 M9 -20 L-9 -4" stroke={P.holzTief} strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Höllenfeuer, an own part of the teacher (lq_teil e57ef47f771): dark red sky, a lava floor, flames at the sides. */
function hoellenfeuer(zeit: number): ReactNode {
  const flamme = (x: number, s: number, v: number, innen: boolean) => {
    const w = Math.sin(zeit * 6 + v) * 3;
    return (
      <g key={x} transform={`translate(${x} 206) scale(${s})`}>
        <Fl d={`M-16 0 Q-22 -26 -6 -44 Q${-2 + w} -58 ${2 + w} -70 Q14 -50 16 -34 Q22 -18 16 0 Z`} f={P.lava} b={2.5} />
        {innen && <path d={`M-8 0 Q-12 -18 -2 -30 Q${2 + w} -40 ${4 + w} -46 Q10 -30 10 -18 Q12 -8 8 0 Z`} fill={P.lavaHell} />}
      </g>
    );
  };
  return (
    <g>
      <R y={0} h={240} f={P.rotTief} />
      <R y={90} h={80} f={P.rot} />
      <Kr x={190} y={52} r={22} f={P.lavaHell} />
      <Flaeche d="M0 152 L30 112 L56 140 L88 100 L116 152 Z M128 152 L160 108 L186 132 L214 96 L240 128 V152 Z" farbe={P.dunkel} hell={P.dunkelHell} />
      <R y={150} h={90} f={P.dunkelTief} />
      <Land d="M0 178 Q60 162 120 176 Q180 190 240 172 V240 H0 Z" f={P.lavaTief} />
      <path d="M0 192 Q60 178 120 190 Q180 202 240 186" fill="none" stroke={P.lava} strokeWidth={6} strokeLinecap="round" opacity={0.6 + ((Math.sin(zeit * 2) + 1) / 2) * 0.4} />
      {flamme(24, 1, 0, true)}
      {flamme(218, 1.1, 2, true)}
      {flamme(56, 0.6, 4, false)}
      {flamme(190, 0.6, 1, false)}
      {[30, 210].map((x, i) => {
        const k = (zeit * 0.3 + i / 2) % 1;
        return <circle key={x} cx={x + Math.sin(k * 8) * 6} cy={150 - k * 110} r={3} fill={P.lavaHell} opacity={1 - k} />;
      })}
      <Fl d={stern(120, 30, 8)} f={P.gold} b={2} />
      <Funkeln x={60} y={50} r={7} zeit={zeit} />
    </g>
  );
}

function vulkan(zeit: number): ReactNode {
  const gl = (Math.sin(zeit * 2.5) + 1) / 2;
  return (
    <g>
      <R y={0} h={240} f={P.orangeHell} />
      <R y={80} h={70} f={P.gelbHell} />
      <Kr x={46} y={60} r={16} f={P.gelb} />
      {[0, 1].map((i) => {
        const k = (zeit * 0.12 + i / 2) % 1;
        return <circle key={i} cx={196 + k * 34 + Math.sin(k * 6 + i) * 4} cy={90 - k * 70} r={10 + k * 12} fill={P.grau} opacity={0.75 * (1 - k)} />;
      })}
      <R y={150} h={90} f={P.wasser} />
      <Fl d="M130 174 L176 92 H214 L260 174 Z" f={P.dunkelHell} />
      <Fl d="M214 92 L260 174 H206 Z" f={P.dunkelTief} b={2.5} />
      <ellipse cx={195} cy={92} rx={19} ry={6} {...flaeche(P.lava, 2.5)} />
      <path d="M192 96 Q184 122 192 142 Q186 158 190 174 H204 Q202 152 206 140 Q200 118 202 96 Z" fill={P.lava} opacity={0.8 + gl * 0.2} />
      <ellipse cx={120} cy={236} rx={170} ry={60} {...flaeche(P.sandTief)} />
      <ellipse cx={120} cy={240} rx={152} ry={46} {...flaeche(P.dunkelHell)} />
      <Am x={24} y={206} s={1.3} kinder={<Palme />} />
    </g>
  );
}

function regenbogen(zeit: number): ReactNode {
  const farben = [P.rot, P.gelb, P.gruenHell, P.blau, P.lila];
  const glitzer: [number, number, number][] = [[28, 40, 8], [214, 36, 8], [190, 112, 6]];
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <R y={0} h={60} f={P.blauHell} />
      {farben.map((f, i) => {
        const r = 104 - i * 12;
        return <path key={i} d={`M${120 - r} 174 A${r} ${r} 0 0 1 ${120 + r} 174`} fill="none" stroke={f} strokeWidth={13} />;
      })}
      <Wolke x={34} y={180} s={1.2} />
      <Wolke x={206} y={180} s={1.2} />
      <Land d="M0 172 Q60 162 120 172 Q190 162 240 172 V240 H0 Z" f={P.wieseHell} />
      <Land d="M0 190 Q70 180 130 190 Q190 180 240 190 V240 H0 Z" f={P.wiese} />
      <g transform="translate(212 224) scale(1.1)">
        <Fl d="M-18 -22 Q-22 0 -10 0 H10 Q22 0 18 -22 Z" f={P.dunkel} b={2.5} />
        <Kr x={-8} y={-26} r={7} f={P.gold} b={2.5} />
        <Kr x={6} y={-28} r={8} f={P.gold} b={2.5} />
      </g>
      <Fl d={stern(26, 216, 12)} f={P.gold} b={2.5} />
      {glitzer.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.9} />
      ))}
    </g>
  );
}

function wolkenschloss(zeit: number): ReactNode {
  const turm = (x: number, y: number, b: number, h: number, dach: string) => (
    <g key={x}>
      <Fl d={`M${x - b / 2} ${y - h} H${x + b / 2} V${y} H${x - b / 2} Z`} f={P.lilaHell} b={2.5} />
      <Fl d={`M${x + b * 0.12} ${y - h + 2} H${x + b / 2 - 1} V${y - 2} H${x + b * 0.12} Z`} f={P.lila} b={2} />
      <Fl d={`M${x - b / 2 - 3} ${y - h} L${x} ${y - h - b * 0.9} L${x + b / 2 + 3} ${y - h} Z`} f={dach} b={2.5} />
    </g>
  );
  const dx = (v: number, ph: number) => ((zeit * v + ph) % 320) - 40;
  const glitzer: [number, number, number][] = [[30, 30, 8], [206, 24, 8], [100, 60, 5]];
  return (
    <g>
      <R y={0} h={240} f={P.blauHell} />
      <R y={80} h={160} f={P.himmel} />
      <Wolke x={dx(6, 60)} y={60} s={0.8} />
      <Wolke x={dx(4, 200)} y={104} s={0.6} />
      {turm(176, 158, 18, 46, P.gold)}
      {turm(216, 158, 16, 34, P.rosa)}
      <Fl d="M184 158 V138 H208 V158 Z" f={P.lilaHell} b={2.5} />
      <Land d="M0 166 Q40 150 90 164 Q150 148 240 166 V240 H0 Z" f={P.weiss} />
      <Land d="M0 176 Q60 170 120 178 Q190 170 240 178 V240 H0 Z" f={P.eisHell} />
      <Land d="M150 240 Q200 218 240 224 V240 Z" f={P.eis} />
      <Fl d={stern(26, 200, 13)} f={P.gold} b={2.5} />
      <Fl d={stern(216, 226, 10)} f={P.gold} b={2.5} />
      {glitzer.map(([x, y, r], i) => (
        <Funkeln key={i} x={x} y={y} r={r} zeit={zeit} versatz={i * 1.6} />
      ))}
    </g>
  );
}

// — 13.11.2026 (20261129_lernquest_neue_teile.sql): one per rarity. —

/** Klassenzimmer: a green board at the top, a window on the right, a clock, wooden floor, a desk with books. */
function klassenzimmer(): ReactNode {
  return (
    <g>
      <R y={0} h={240} f={P.sandHell} />
      <R y={150} h={90} f={P.holz} />
      <R y={150} h={8} f={P.holzTief} />
      <R y={216} h={24} f={P.holzTief} />
      <rect x={70} y={14} width={100} height={52} rx={6} fill={P.gruenTief} stroke={P.holz} strokeWidth={7} />
      <path d="M84 32 q8 -6 16 0 q8 6 16 0 M132 28 l12 14 M144 28 l-12 14" fill="none" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" />
      <rect x={188} y={28} width={44} height={64} rx={4} fill={P.himmel} stroke={P.holz} strokeWidth={6} />
      <path d="M210 28 V92 M188 60 H232" stroke={P.holz} strokeWidth={4} />
      <circle cx={30} cy={38} r={17} fill={P.weiss} stroke={P.rot} strokeWidth={5} />
      <path d="M30 38 V27 M30 38 L38 43" fill="none" {...STRICH} />
      <g transform="translate(204 214)">
        <Fl d="M-28 -32 H28 V-24 H-28 Z" f={P.lederTief} b={2.5} />
        <path d="M-20 -24 V20 M20 -24 V20" stroke={P.metallTief} strokeWidth={5} strokeLinecap="round" />
        <Fl d="M-19 -44 H3 V-34 H-19 Z" f={P.rot} b={2.5} />
        <Fl d="M-16 -54 H4 V-44 H-16 Z" f={P.blau} b={2.5} />
      </g>
    </g>
  );
}

/** Bibliothek (review 19.11.2026: was clumsy): shelves at both sides with three boards of slim books in varied heights
 *  (not two big blocks), a round window, a red rug, a lamp. */
function bibliothek(): ReactNode {
  const breiten = [12, 10, 13, 11];
  const regal = (x0: number, farben: string[]) => (
    <g key={x0}>
      <Fl d={`M${x0} 4 H${x0 + 58} V178 H${x0} Z`} f={P.holzTief} b={2} />
      {[64, 120, 176].map((boden, r) => {
        let x = x0 + 5;
        return breiten.map((b, i) => {
          const hoch = 40 - ((i * 7 + r * 5) % 13);
          const buch = <Fl key={`${r}${i}`} d={`M${x} ${boden - hoch} h${b - 2} V${boden} h${-(b - 2)} Z`} f={farben[(i + r) % farben.length]} b={2} />;
          x += b + 1.5;
          return buch;
        });
      })}
      {[64, 120, 176].map((boden) => (
        <Fl key={boden} d={`M${x0} ${boden + 1} H${x0 + 58}`} f={P.holz} b={5} />
      ))}
    </g>
  );
  return (
    <g>
      <R y={0} h={240} f={P.lederHell} />
      <circle cx={120} cy={42} r={27} fill={P.himmel} stroke={P.holz} strokeWidth={7} />
      <path d="M120 15 V69 M93 42 H147" stroke={P.holz} strokeWidth={4} />
      {regal(0, [P.rot, P.blau, P.gelb, P.gruen, P.lila])}
      {regal(182, [P.gruen, P.lila, P.rot, P.blau, P.gelb])}
      <R y={178} h={62} f={P.holzTief} />
      <ellipse cx={120} cy={222} rx={96} ry={16} {...flaeche(P.rot, 2.5)} />
      <ellipse cx={120} cy={222} rx={78} ry={10} fill="none" stroke={P.gold} strokeWidth={3} />
      <g transform="translate(40 232)">
        <path d="M0 0 V-34" stroke={P.goldTief} strokeWidth={5} strokeLinecap="round" />
        <Fl d="M-13 -34 L-9 -52 H9 L13 -34 Z" f={P.gelb} b={2.5} />
      </g>
    </g>
  );
}

/** Dschungel: big leaves at the sides, hanging vines, a waterfall far back, flowers. */
function dschungel(zeit: number): ReactNode {
  const blatt = (x: number, y: number, w: number, s: number, f: string) => (
    <g key={`${x},${y}`} transform={`translate(${x} ${y}) rotate(${w}) scale(${s})`}>
      <Fl d="M0 0 Q20 -30 0 -70 Q-20 -30 0 0 Z" f={f} b={2.5} />
    </g>
  );
  const fall = (zeit * 30) % 40;
  return (
    <g>
      <R y={0} h={240} f={P.blattHell} />
      <Fl d="M108 22 H132 V150 H108 Z" f={P.wasserHell} b={2.5} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M120 ${22 + ((i * 44 + fall) % 120)} v14`} stroke={P.wasser} strokeWidth={4} strokeLinecap="round" />
      ))}
      <ellipse cx={120} cy={152} rx={36} ry={7} {...flaeche(P.wasser, 2.5)} />
      <Land d="M0 164 Q60 154 120 164 T240 164 V240 H0 Z" f={P.wiese} />
      {blatt(10, 240, 20, 1.6, P.blatt)}
      {blatt(-6, 204, 50, 1.4, P.blattTief)}
      {blatt(230, 240, -20, 1.6, P.blatt)}
      {blatt(246, 204, -50, 1.4, P.blattTief)}
      {[34, 206].map((x, i) => (
        <path key={x} d={`M${x} 0 Q${x + (i ? 8 : -8)} 40 ${x} ${80 + i * 10}`} fill="none" stroke={P.blattTief} strokeWidth={6} strokeLinecap="round" />
      ))}
      {[[58, 214, P.rosa], [188, 208, P.orange]].map(([x, y, f]) => (
        <g key={x as number}>
          <Kr x={x as number} y={y as number} r={8} f={f as string} />
          <Kr x={x as number} y={y as number} r={3.5} f={P.gelbHell} b={2} />
        </g>
      ))}
    </g>
  );
}

/** Piratenschiff: on deck, the sea and sky behind the rail, a mast with sail and flag, a barrel and the wheel. */
function piratenschiff(zeit: number): ReactNode {
  const welle = Math.sin(zeit * 1.5) * 3;
  return (
    <g>
      <R y={0} h={240} f={P.himmel} />
      <Sonne x={202} y={38} r={14} />
      <Land d={`M0 ${120 + welle} Q30 ${112 + welle} 60 ${120 + welle} T120 ${120 + welle} T180 ${120 + welle} T240 ${120 + welle} V150 H0 Z`} f={P.wasser} />
      <rect x={30} y={12} width={10} height={140} rx={3} {...flaeche(P.holz, 2.5)} />
      <Fl d="M43 25 Q80 48 43 100 Z" f={P.wolkeTief} b={2.5} />
      <Fl d="M40 22 Q77 46 40 97 Z" f={P.schnee} b={2.5} />
      <Fl d="M35 10 L60 17 L35 26 Z" f={P.dunkel} b={2.5} />
      {[8, 70, 130, 190].map((x) => (
        <rect key={x} x={x} y={118} width={10} height={24} rx={2} {...flaeche(P.holzTief, 2)} />
      ))}
      <rect x={0} y={110} width={240} height={10} rx={3} fill={P.holz} />
      <rect x={0} y={140} width={240} height={14} fill={P.holzTief} />
      <R y={154} h={86} f={P.holz} />
      <R y={212} h={28} f={P.holzTief} />
      <g transform="translate(24 232)">
        <Fl d="M-14 0 Q-17 -16 -14 -32 H14 Q17 -16 14 0 Z" f={P.leder} b={2.5} />
        <path d="M-16 -20 H16" stroke={P.metallTief} strokeWidth={5} />
      </g>
      <g transform={`translate(212 196) rotate(${(Math.sin(zeit) * 10).toFixed(1)})`}>
        <circle r={20} fill="none" stroke={P.holzTief} strokeWidth={7} />
        <path d="M0 -28 V28 M-28 0 H28 M-20 -20 L20 20 M20 -20 L-20 20" stroke={P.holzTief} strokeWidth={4} strokeLinecap="round" />
        <Kr x={0} y={0} r={6} f={P.gold} b={2.5} />
      </g>
    </g>
  );
}

/** Nordlicht: night sky with moving green and violet light bands, stars, snowy hills and firs. */
function nordlicht(zeit: number): ReactNode {
  const band = (y: number, f: string, k: number, dicke: number) => {
    const w = (x: number) => (y + Math.sin(x / 34 + zeit * 0.9 + k) * 12).toFixed(1);
    return <path d={`M-10 ${w(-10)} Q40 ${w(40)} 70 ${w(70)} T130 ${w(130)} T190 ${w(190)} T250 ${w(250)}`} fill="none" stroke={f} strokeWidth={dicke} strokeLinecap="round" opacity={0.6} />;
  };
  return (
    <g>
      <R y={0} h={240} f={P.nachtTief} />
      {[[20, 20], [100, 28], [196, 22], [30, 96]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={2.8} fill={P.weiss} />
      ))}
      {band(56, P.gruenHell, 0, 26)}
      {band(76, P.tuerkis, 1.5, 18)}
      {band(44, P.lilaHell, 3, 12)}
      <Land d="M0 160 Q60 130 120 150 T240 140 V240 H0 Z" f={P.eis} />
      <Land d="M0 192 Q80 172 160 188 T240 182 V240 H0 Z" f={P.schnee} />
      <Am x={24} y={192} s={1.4} kinder={<Tanne schnee />} />
      <Am x={216} y={188} s={1.5} kinder={<Tanne schnee />} />
      <Funkeln x={150} y={26} r={7} zeit={zeit} />
      <Funkeln x={40} y={46} r={6} zeit={zeit} versatz={2} />
    </g>
  );
}

export const HINTERGRUENDE: Hintergrund[] = [
  { id: 'wiese', name: 'Wiese', seltenheit: 1, zeichnung: wiese },
  { id: 'strand', name: 'Strand', seltenheit: 1, zeichnung: strand },
  { id: 'wueste', name: 'Wüste', seltenheit: 1, zeichnung: wueste },
  { id: 'wald', name: 'Wald', seltenheit: 1, zeichnung: wald },
  { id: 'berge', name: 'Berge', seltenheit: 1, zeichnung: berge },
  { id: 'winterwald', name: 'Winterwald', seltenheit: 1, zeichnung: winterwald },
  { id: 'nacht', name: 'Sternennacht', seltenheit: 2, bewegt: true, zeichnung: nacht },
  { id: 'unterwasser', name: 'Unterwasser', seltenheit: 2, bewegt: true, zeichnung: unterwasser },
  { id: 'weltall', name: 'Weltall', seltenheit: 3, bewegt: true, zeichnung: weltall },
  { id: 'burg', name: 'Burghof', seltenheit: 3, zeichnung: burg },
  { id: 'vulkan', name: 'Vulkaninsel', seltenheit: 3, bewegt: true, zeichnung: vulkan },
  { id: 'regenbogen', name: 'Regenbogen', seltenheit: 4, bewegt: true, zeichnung: regenbogen },
  { id: 'wolkenschloss', name: 'Wolkenschloss', seltenheit: 4, bewegt: true, zeichnung: wolkenschloss },
  // 13.11.2026 (20261129_lernquest_neue_teile.sql)
  { id: 'klassenzimmer', name: 'Klassenzimmer', seltenheit: 1, zeichnung: klassenzimmer },
  { id: 'bibliothek', name: 'Bibliothek', seltenheit: 2, zeichnung: bibliothek },
  { id: 'dschungel', name: 'Dschungel', seltenheit: 3, bewegt: true, zeichnung: dschungel },
  { id: 'piratenschiff', name: 'Piratenschiff', seltenheit: 4, bewegt: true, zeichnung: piratenschiff },
  { id: 'nordlicht', name: 'Nordlicht', seltenheit: 5, bewegt: true, zeichnung: nordlicht },
  // Own parts of the teacher (lq_teil, eigen), by their id.
  { id: 'e57ef47f771', name: 'Höllenfeuer', seltenheit: 4, bewegt: true, zeichnung: hoellenfeuer },
];
