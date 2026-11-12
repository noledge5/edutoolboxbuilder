// Items to wear or hold, drawn around their anchor (0, 0). Hats sit with the brim on the anchor, held things with
// the grip on it. The hero's parts (Stufe E, Teil 4) come here too, one entry per part of src/lernquest/teile.ts.
// Rarity shows in the material: wood and leather, then metal and glass, then colour with a gem, then gold.
import type { ReactNode } from 'react';
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Item } from './typen';

export const stern = (x: number, y: number, r: number, zacken = 5) => {
  const pts = Array.from({ length: zacken * 2 }, (_, i) => {
    const a = (Math.PI / zacken) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};

/** A four-point sparkle that grows and fades in a loop (for rare items). */
export function Funkeln({ x, y, r, zeit, versatz = 0 }: { x: number; y: number; r: number; zeit: number; versatz?: number }): ReactNode {
  const k = (Math.sin(zeit * 3 + versatz) + 1) / 2;
  if (k < 0.15) return null;
  const s = r * k;
  return <path d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`} fill={P.weiss} opacity={0.4 + k * 0.6} />;
}

/** Wood grain: a few soft lines along a length. */
const maserung = (x: number, y1: number, y2: number) => (
  <path d={`M${x - 2} ${y1} q2 ${(y2 - y1) / 2} 0 ${y2 - y1} M${x + 2} ${y1 + 4} q-2 ${(y2 - y1) / 3} 0 ${y2 - y1 - 8}`} fill="none" stroke={P.holzTief} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
);

export const ITEMS: Item[] = [
  {
    id: 'waldhut',
    name: 'Waldhut',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-44, -56, 90, 68],
    zeichnung: () => (
      <g>
        <path d="M18 -10 Q42 -38 31 -54 Q23 -32 12 -14 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M24 -26 L30 -44 M22 -22 l6 -3 M25 -30 l6 -3 M27 -37 l5 -3" stroke={P.rotTief} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-30 2 Q-22 -30 8 -34 Q26 -30 34 -2 Z" fill={P.gruen} />
        <path d="M20 -30 Q30 -20 34 -2 L18 -2 Z" fill={P.gruenTief} opacity={0.5} />
        <path d="M-30 2 Q-22 -30 8 -34 Q26 -30 34 -2 Z" fill="none" {...UMRISS} />
        <path d="M-22 -10 Q-16 -26 2 -29" fill="none" stroke={P.gruenHell} strokeWidth={4} strokeLinecap="round" />
        <path d="M-29 -4 Q2 -13 33 -7 L34 0 Q2 -6 -30 2 Z" fill={P.leder} {...UMRISS_FEIN} />
        <path d="M-26 -3 Q2 -10 30 -5" fill="none" stroke={P.lederHell} strokeWidth={1.4} strokeDasharray="2.5 3" />
        <path d="M-42 4 Q0 -7 44 2 Q40 11 0 9 Q-38 13 -42 4 Z" fill={P.gruenTief} {...UMRISS} />
        <path d="M-34 5 Q0 -1 36 3" fill="none" stroke={P.gruen} strokeWidth={2} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'blumenkranz',
    name: 'Blumenkranz',
    platz: 'hut',
    seltenheit: 2,
    rahmen: [-44, -22, 88, 32],
    zeichnung: () => (
      <g>
        <path d="M-40 2 Q0 -18 40 2" fill="none" stroke={P.linie} strokeWidth={9} strokeLinecap="round" />
        <path d="M-40 2 Q0 -18 40 2" fill="none" stroke={P.gruen} strokeWidth={5} strokeLinecap="round" />
        {[
          [-30, -4, P.backe],
          [-12, -10, P.gold],
          [8, -10, P.lilaHell],
          [27, -5, P.backe],
        ].map(([x, y, f]) => (
          <g key={`${x}`}>
            <path d={`M${x as number - 8} ${y as number + 2} q-2 -8 6 -6`} fill={P.gruenHell} {...UMRISS_FEIN} />
            {[0, 72, 144, 216, 288].map((w) => (
              <ellipse key={w} cx={x as number} cy={(y as number) - 5} rx={3.6} ry={5.5} fill={f as string} stroke={P.linie} strokeWidth={1.4} transform={`rotate(${w} ${x} ${y})`} />
            ))}
            <circle cx={x as number} cy={y as number} r={3} fill={P.goldTief} stroke={P.linie} strokeWidth={1.2} />
          </g>
        ))}
      </g>
    ),
  },
  {
    id: 'eisenhelm',
    name: 'Eisenhelm',
    platz: 'hut',
    seltenheit: 3,
    rahmen: [-40, -50, 80, 62],
    zeichnung: () => (
      <g>
        <path d="M-34 6 Q-36 -42 0 -44 Q36 -42 34 6 Z" fill={P.metall} />
        <path d="M14 -40 Q34 -30 34 6 L18 6 Q22 -20 14 -40 Z" fill={P.metallTief} opacity={0.6} />
        <path d="M-24 -10 Q-22 -32 -6 -38" fill="none" stroke={P.metallHell} strokeWidth={5} strokeLinecap="round" />
        <path d="M-34 6 Q-36 -42 0 -44 Q36 -42 34 6 Z" fill="none" {...UMRISS} />
        <path d="M-4 -44 L4 -44 L4 4 L-4 4 Z" fill={P.metallTief} {...UMRISS_FEIN} />
        <path d="M-38 2 Q0 -6 38 2 L38 10 Q0 2 -38 10 Z" fill={P.metallTief} {...UMRISS} />
        {[-28, -14, 14, 28].map((x) => (
          <circle key={x} cx={x} cy={4} r={2} fill={P.metallHell} stroke={P.linie} strokeWidth={1} />
        ))}
        <path d="M-2 -44 Q8 -60 22 -54 Q10 -52 4 -42 Z" fill={P.rot} {...UMRISS_FEIN} />
      </g>
    ),
  },
  {
    id: 'zauberhut',
    name: 'Zauberhut',
    platz: 'hut',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-48, -70, 96, 82],
    zeichnung: (zeit) => (
      <g>
        <path d="M-32 2 L-2 -54 Q6 -66 16 -62 Q8 -58 6 -50 L34 2 Z" fill={P.lila} />
        <path d="M6 -50 L34 2 L14 2 Q10 -24 2 -44 Z" fill={P.lilaTief} opacity={0.55} />
        <path d="M-32 2 L-2 -54 Q6 -66 16 -62 Q8 -58 6 -50 L34 2 Z" fill="none" {...UMRISS} />
        <path d="M-22 -8 L-4 -44" stroke={P.lilaHell} strokeWidth={4} strokeLinecap="round" />
        <path d="M-24 -4 Q2 -12 28 -4 L30 2 Q2 -6 -26 2 Z" fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
        <path d={stern(4, -24, 9)} fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" />
        <circle cx="-8" cy="-36" r="2" fill={P.goldHell} />
        <circle cx="16" cy="-14" r="1.6" fill={P.goldHell} />
        <ellipse cx="0" cy="4" rx="46" ry="9" fill={P.lilaTief} {...UMRISS} />
        <path d="M-38 3 Q0 -3 38 3" fill="none" stroke={P.lila} strokeWidth={2.5} strokeLinecap="round" />
        <Funkeln x={10} y={-30} r={7} zeit={zeit} />
        <Funkeln x={-14} y={-20} r={5} zeit={zeit} versatz={2} />
      </g>
    ),
  },
  {
    id: 'krone',
    name: 'Krone',
    platz: 'hut',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-38, -42, 76, 50],
    zeichnung: (zeit) => (
      <g>
        <path d="M-30 4 L-33 -26 L-15 -9 L0 -34 L15 -9 L33 -26 L30 4 Z" fill={P.gold} />
        <path d="M15 -9 L33 -26 L30 4 L14 4 Z" fill={P.goldTief} opacity={0.45} />
        <path d="M-30 4 L-33 -26 L-15 -9 L0 -34 L15 -9 L33 -26 L30 4 Z" fill="none" {...UMRISS} />
        <path d="M-27 -16 L-27 -2 M-6 -18 L0 -27" stroke={P.goldHell} strokeWidth={3.5} strokeLinecap="round" />
        {[
          [-33, -26],
          [0, -34],
          [33, -26],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={3.5} fill={P.goldHell} stroke={P.goldTief} strokeWidth={1.5} />
        ))}
        <path d="M-31 4 L31 4 L31 -5 L-31 -5 Z" fill={P.goldTief} {...UMRISS_FEIN} />
        {[
          [-17, P.rot, P.rotTief],
          [0, P.blau, P.blauTief],
          [17, P.rot, P.rotTief],
        ].map(([x, f, t]) => (
          <g key={x as number}>
            <path d={`M${x} -5 l4.5 4.5 -4.5 4.5 -4.5 -4.5 Z`} fill={f as string} stroke={t as string} strokeWidth={1.2} />
            <path d={`M${(x as number) - 1.5} -2.5 l1.5 -1.5`} stroke={P.weiss} strokeWidth={1.2} strokeLinecap="round" />
          </g>
        ))}
        <Funkeln x={-20} y={-14} r={6} zeit={zeit} />
        <Funkeln x={22} y={-18} r={5} zeit={zeit} versatz={2.5} />
      </g>
    ),
  },
  {
    id: 'holzschwert',
    name: 'Holzschwert',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -66, 52, 82],
    zeichnung: () => (
      <g transform="rotate(30)">
        <path d="M-6 -14 L-6 -58 L0 -68 L6 -58 L6 -14 Z" fill={P.holz} />
        <path d="M2 -16 L2 -60 L0 -68 L6 -58 L6 -14 Z" fill={P.holzTief} opacity={0.4} />
        {maserung(-1, -54, -18)}
        <path d="M-6 -14 L-6 -58 L0 -68 L6 -58 L6 -14 Z" fill="none" {...UMRISS} />
        <rect x="-14" y="-16" width="28" height="7" rx="3" fill={P.holzTief} {...UMRISS_FEIN} />
        <rect x="-3.5" y="-9" width="7" height="18" rx="3" fill={P.leder} {...UMRISS_FEIN} />
        <path d="M-3 -5 l6 3 M-3 1 l6 3" stroke={P.lederHell} strokeWidth={1.5} />
        <circle cx="0" cy="12" r="4.5" fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
      </g>
    ),
  },
  {
    id: 'fackel',
    name: 'Fackel',
    platz: 'hand-rechts',
    seltenheit: 2,
    bewegt: true,
    rahmen: [-18, -66, 36, 80],
    zeichnung: (zeit) => {
      const f = (k: number) => Math.sin(zeit * 9 + k) * 0.08;
      return (
        <g>
          <path d="M-5 12 L-6 -26 L6 -26 L5 12 Z" fill={P.holz} {...UMRISS} />
          {maserung(0, -22, 8)}
          <path d="M-9 -34 L9 -34 L7 -24 L-7 -24 Z" fill={P.metallTief} {...UMRISS_FEIN} />
          <g transform={`translate(0 -36) scale(${(1 + f(0)).toFixed(3)} ${(1 + f(1) * 1.5).toFixed(3)})`}>
            <path d="M0 -30 Q14 -14 10 -2 Q6 4 0 4 Q-6 4 -10 -2 Q-14 -14 0 -30 Z" fill={P.rot} {...UMRISS_FEIN} />
            <path d="M0 -20 Q8 -10 6 -2 Q3 2 0 2 Q-3 2 -6 -2 Q-8 -10 0 -20 Z" fill={P.fell} />
            <path d="M0 -10 Q4 -5 3 -1 Q0 1 -3 -1 Q-4 -5 0 -10 Z" fill={P.goldHell} />
          </g>
        </g>
      );
    },
  },
  {
    id: 'zauberstab',
    name: 'Zauberstab',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-16, -62, 48, 76],
    zeichnung: (zeit) => (
      <g transform="rotate(24)">
        <path d="M-3 12 L-4 -40 L4 -40 L3 12 Z" fill={P.lilaTief} {...UMRISS} />
        <path d="M-4 -6 h8 M-4 0 h8" stroke={P.gold} strokeWidth={2.5} />
        <g transform={`rotate(${((zeit * 40) % 360).toFixed(1)} 0 -48)`}>
          <path d={stern(0, -48, 13)} fill={P.gold} {...UMRISS_FEIN} />
          <path d={stern(0, -48, 6)} fill={P.goldHell} />
        </g>
        <Funkeln x={14} y={-60} r={6} zeit={zeit} />
        <Funkeln x={-14} y={-38} r={5} zeit={zeit} versatz={2} />
      </g>
    ),
  },
  {
    id: 'kristallschwert',
    name: 'Kristallschwert',
    platz: 'hand-rechts',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-16, -78, 60, 96],
    zeichnung: (zeit) => (
      <g transform="rotate(30)">
        <path d="M-7 -14 L-7 -66 L0 -78 L7 -66 L7 -14 Z" fill={P.blauHell} />
        <path d="M0 -78 L7 -66 L7 -14 L0 -14 Z" fill={P.blau} opacity={0.55} />
        <path d="M-3 -18 L-3 -64" stroke={P.weiss} strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />
        <path d="M-7 -14 L-7 -66 L0 -78 L7 -66 L7 -14 Z" fill="none" {...UMRISS} />
        <path d="M-18 -18 Q0 -10 18 -18 L16 -10 Q0 -4 -16 -10 Z" fill={P.gold} {...UMRISS_FEIN} />
        <path d="M-4 -12 l4 -5 4 5 -4 5 Z" fill={P.lila} stroke={P.lilaTief} strokeWidth={1.2} />
        <rect x="-3.5" y="-8" width="7" height="18" rx="3" fill={P.lilaTief} {...UMRISS_FEIN} />
        <circle cx="0" cy="13" r="5" fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
        {/* A glint runs up the blade */}
        <rect x="-7" y={(-18 - ((zeit * 40) % 70)).toFixed(1)} width="14" height="4" fill={P.weiss} opacity={0.55} />
        <Funkeln x={10} y={-70} r={7} zeit={zeit} />
      </g>
    ),
  },
  {
    id: 'schild',
    name: 'Rundschild',
    platz: 'hand-links',
    seltenheit: 2,
    rahmen: [-28, -26, 52, 52],
    zeichnung: () => (
      <g>
        <circle cx="-2" cy="0" r="23" fill={P.metall} {...UMRISS} />
        <circle cx="-2" cy="0" r="17" fill={P.holz} stroke={P.holzTief} strokeWidth={2.5} />
        <path d="M-14 -8 h24 M-17 0 h30 M-14 8 h24" stroke={P.holzTief} strokeWidth={1.4} opacity={0.6} />
        <path d="M6 -14 A17 17 0 0 1 6 14 A22 22 0 0 0 6 -14 Z" fill={P.holzTief} opacity={0.4} />
        <path d="M-12 -10 Q-8 -14 -2 -15" fill="none" stroke={P.metallHell} strokeWidth={3} strokeLinecap="round" />
        {[0, 90, 180, 270].map((w) => (
          <circle key={w} cx={-2 + Math.cos((w * Math.PI) / 180) * 20} cy={Math.sin((w * Math.PI) / 180) * 20} r={1.8} fill={P.metallHell} stroke={P.linie} strokeWidth={1} />
        ))}
        <path d="M-2 -10 Q8 -2 -2 11 Q-12 -2 -2 -10 Z" fill={P.gruen} stroke={P.gruenTief} strokeWidth={2} />
        <path d="M-2 -6 V8" stroke={P.gruenTief} strokeWidth={1.5} />
      </g>
    ),
  },
  {
    id: 'zaubertrank',
    name: 'Zaubertrank',
    platz: 'hand-links',
    seltenheit: 3,
    bewegt: true,
    rahmen: [-17, -32, 34, 46],
    zeichnung: (zeit) => (
      <g>
        <rect x="-5" y="-24" width="10" height="12" fill={P.blauHell} {...UMRISS_FEIN} />
        <rect x="-6" y="-31" width="12" height="7" rx="2" fill={P.holz} {...UMRISS_FEIN} />
        <circle cx="0" cy="0" r="14" fill={P.blauHell} {...UMRISS} />
        <path d={`M-13 2 Q-6 ${(-3 + Math.sin(zeit * 3) * 2).toFixed(1)} 0 2 Q6 ${(7 + Math.sin(zeit * 3) * 2).toFixed(1)} 13 2 A14 14 0 0 1 -13 2 Z`} fill={P.blau} />
        <circle cx="-5" cy="-5" r="3" fill={P.weiss} opacity={0.85} />
        <circle cx="4" cy={(8 - ((zeit * 6) % 10)).toFixed(1)} r="1.8" fill={P.blauHell} />
        <circle cx="-3" cy={(9 - ((zeit * 5 + 4) % 11)).toFixed(1)} r="1.3" fill={P.blauHell} />
        <path d="M-6 -27 h12" stroke={P.holzTief} strokeWidth={1.5} />
      </g>
    ),
  },
  {
    id: 'laterne',
    name: 'Laterne',
    platz: 'hand-links',
    seltenheit: 3,
    bewegt: true,
    rahmen: [-17, -8, 34, 50],
    zeichnung: (zeit) => (
      <g transform={`rotate(${(Math.sin(zeit * 2) * 6).toFixed(2)})`}>
        <path d="M-6 0 Q0 -8 6 0" fill="none" {...UMRISS} />
        <path d="M-12 4 h24 l-3 6 h-18 Z" fill={P.metallTief} {...UMRISS_FEIN} />
        <rect x="-10" y="10" width="20" height="22" rx="3" fill={P.goldHell} {...UMRISS_FEIN} />
        <circle cx="0" cy="22" r={(5 + Math.sin(zeit * 7) * 0.8).toFixed(2)} fill={P.gold} />
        <path d="M-10 21 h20 M0 10 v22" stroke={P.metallTief} strokeWidth={2} />
        <path d="M-12 32 h24 l-3 6 h-18 Z" fill={P.metallTief} {...UMRISS_FEIN} />
      </g>
    ),
  },
];
