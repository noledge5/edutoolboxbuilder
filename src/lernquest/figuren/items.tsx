// Items to wear or hold, drawn around their anchor (0, 0). Hats sit with the brim on the anchor, held things with
// the grip on it. The hero's parts (Stufe E, Teil 4) come here too, one entry per part of src/lernquest/teile.ts.
// Rarity shows in the material: wood and leather, then metal and glass, then colour with a gem, then gold.
import { flaeche, P } from './stil';
import type { Item } from './typen';
import { Funkeln, stern } from './zeichnen';
import { KOPF_ITEMS } from './items-kopf';
import { WERKZEUG_ITEMS } from './items-werkzeug';
import { BEGLEITER_ITEMS } from './begleiter';

export { Funkeln, stern };

/** A tube with round ends along the path `d`, `b` wide. */
// Shafts from 5 units up 2.5 thicker, as in items-werkzeug.tsx (Stufe 3, 27.11.2026).
const rohr = (d: string, b: number, farbe: string) => <path d={d} fill="none" stroke={farbe} strokeWidth={b >= 5 ? b + 2.5 : b} strokeLinecap="round" strokeLinejoin="round" />;
const stiel = (von: number, bis: number, b: number, farbe: string) => rohr(`M0 ${von} V${bis}`, b, farbe);
const klinge = (spitze: number, b: number) => `M${-b} -14 V${spitze + 12} Q${-b} ${spitze + 4} 0 ${spitze} Q${b} ${spitze + 4} ${b} ${spitze + 12} V-14 Z`;
const klingeRechts = (spitze: number, b: number) => `M0 -14 V${spitze} Q${b} ${spitze + 4} ${b} ${spitze + 12} V-14 Z`;

const GRUND: Item[] = [
  {
    id: 'waldhut',
    name: 'Waldhut',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-44, -56, 90, 68],
    zeichnung: () => (
      <g>
        <path d="M18 -10 Q42 -38 31 -54 Q23 -32 12 -14 Z" {...flaeche(P.rot, 2.5)} />
        <path d="M-30 2 Q-22 -30 8 -34 Q26 -30 34 -2 Z" {...flaeche(P.gruen)} />
        <path d="M20 -30 Q30 -20 34 -2 L18 -2 Z" {...flaeche(P.gruenTief, 1.5)} />
        <path d="M-22 -10 Q-16 -26 2 -29" fill="none" stroke={P.gruenHell} strokeWidth={4} strokeLinecap="round" />
        <path d="M-29 -4 Q2 -13 33 -7 L34 0 Q2 -6 -30 2 Z" {...flaeche(P.leder, 2.5)} />
        <path d="M-42 4 Q0 -7 44 2 Q40 11 0 9 Q-38 13 -42 4 Z" {...flaeche(P.gruenTief)} />
      </g>
    ),
  },
  {
    id: 'blumenkranz',
    name: 'Blumenkranz',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-50, -30, 100, 42],
    zeichnung: () => (
      <g>
        {rohr('M-44 4 Q0 -18 44 4', 10, P.gruen)}
        {[
          [-30, -4, P.backe],
          [0, -11, P.gold],
          [30, -4, P.lilaHell],
        ].map(([x, y, f]) => (
          <g key={`${x}`}>
            <path d={stern(x as number, y as number, 14)} {...flaeche(f as string, 2.5)} />
            <circle cx={x as number} cy={y as number} r={4.5} fill={P.goldTief} />
          </g>
        ))}
      </g>
    ),
  },
  {
    id: 'eisenhelm',
    name: 'Eisenhelm',
    platz: 'hut',
    haube: true,
    seltenheit: 3,
    rahmen: [-40, -62, 80, 74],
    zeichnung: () => (
      <g>
        <path d="M-2 -44 Q8 -62 24 -56 Q12 -52 6 -42 Z" {...flaeche(P.rot, 2.5)} />
        <path d="M-34 6 Q-36 -42 0 -44 Q36 -42 34 6 Z" {...flaeche(P.metall)} />
        <path d="M14 -40 Q34 -30 34 6 L18 6 Q22 -20 14 -40 Z" {...flaeche(P.metallTief, 1.5)} />
        <path d="M-24 -10 Q-22 -32 -6 -38" fill="none" stroke={P.metallHell} strokeWidth={5} strokeLinecap="round" />
        <rect x="-4" y="-40" width="8" height="42" rx="3" {...flaeche(P.metallTief, 2)} />
        <path d="M-38 2 Q0 -6 38 2 L38 10 Q0 2 -38 10 Z" {...flaeche(P.metallTief)} />
      </g>
    ),
  },
  {
    id: 'zauberhut',
    name: 'Zauberhut',
    platz: 'hut',
    haube: true,
    seltenheit: 3,
    bewegt: true,
    rahmen: [-48, -70, 96, 82],
    zeichnung: (zeit) => (
      <g>
        <path d="M-32 2 L-2 -54 Q6 -66 16 -62 Q8 -58 6 -50 L34 2 Z" {...flaeche(P.lila)} />
        <path d="M6 -50 L34 2 L14 2 Q10 -24 2 -44 Z" {...flaeche(P.lilaTief, 1.5)} />
        <path d="M-24 -4 Q2 -12 28 -4 L30 2 Q2 -6 -26 2 Z" {...flaeche(P.gold, 2)} />
        <path d={stern(2, -26, 11)} {...flaeche(P.gold, 2)} />
        <ellipse cx="0" cy="4" rx="46" ry="9" {...flaeche(P.lilaTief)} />
        <Funkeln x={14} y={-34} r={7} zeit={zeit} />
      </g>
    ),
  },
  {
    id: 'krone',
    name: 'Krone',
    platz: 'hut',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-38, -42, 76, 50],
    zeichnung: (zeit) => (
      <g>
        <path d="M-30 4 L-33 -26 L-15 -9 L0 -34 L15 -9 L33 -26 L30 4 Z" {...flaeche(P.gold)} />
        <path d="M15 -9 L33 -26 L30 4 L14 4 Z" {...flaeche(P.goldTief, 1.5)} />
        <rect x="-31" y="-5" width="62" height="10" rx="3" {...flaeche(P.goldTief, 2.5)} />
        {[
          [-17, P.rot],
          [0, P.blau],
          [17, P.rot],
        ].map(([x, f]) => (
          <circle key={x as number} cx={x as number} cy={0} r={4.5} {...flaeche(f as string, 1.5)} />
        ))}
        <Funkeln x={-20} y={-14} r={6} zeit={zeit} />
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
        <path d={klinge(-68, 6)} {...flaeche(P.holz)} />
        <path d={klingeRechts(-68, 6)} {...flaeche(P.holzTief, 1.5)} />
        {rohr('M-13 -14 H13', 7, P.holzTief)}
        {stiel(-8, 8, 7, P.leder)}
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
          {stiel(12, -24, 10, P.holz)}
          <path d="M-10 -36 L10 -36 L7 -22 L-7 -22 Z" {...flaeche(P.metallTief)} />
          <g transform={`translate(0 -36) scale(${(1 + f(0)).toFixed(3)} ${(1 + f(1) * 1.5).toFixed(3)})`}>
            <path d="M0 -30 Q14 -14 10 -2 Q6 4 0 4 Q-6 4 -10 -2 Q-14 -14 0 -30 Z" {...flaeche(P.rot, 2.5)} />
            <path d="M0 -16 Q7 -8 5 -1 Q3 2 0 2 Q-3 2 -5 -1 Q-7 -8 0 -16 Z" fill={P.gelb} />
          </g>
        </g>
      );
    },
  },
  {
    id: 'zauberstab',
    name: 'Zauberstab',
    platz: 'hand-rechts',
    seltenheit: 3,
    bewegt: true,
    rahmen: [-16, -62, 48, 76],
    zeichnung: (zeit) => (
      <g transform="rotate(24)">
        {stiel(12, -40, 7, P.lilaTief)}
        {rohr('M0 -8 V-2', 7.5, P.gold)}
        <path d={stern(0, -48, 14)} transform={`rotate(${((zeit * 40) % 360).toFixed(1)} 0 -48)`} {...flaeche(P.gold, 2.5)} />
        <Funkeln x={14} y={-62} r={6} zeit={zeit} />
      </g>
    ),
  },
  {
    id: 'kristallschwert',
    name: 'Kristallschwert',
    platz: 'hand-rechts',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-20, -78, 64, 98],
    zeichnung: (zeit) => (
      <g transform="rotate(30)">
        <path d={klinge(-80, 8)} {...flaeche(P.blauHell)} />
        <path d={klingeRechts(-80, 8)} {...flaeche(P.blau, 1)} />
        {rohr('M-18 -15 H18', 8, P.gold)}
        <circle cx="0" cy="-15" r="4.5" {...flaeche(P.lila, 1.5)} />
        {stiel(-8, 8, 7, P.lilaTief)}
        <circle cx="0" cy="13" r="5.5" {...flaeche(P.gold, 2)} />
        <Funkeln x={12} y={-62} r={8} zeit={zeit} />
        <Funkeln x={-14} y={-40} r={6} zeit={zeit} versatz={2} />
      </g>
    ),
  },
  {
    id: 'schild',
    name: 'Rundschild',
    platz: 'hand-links',
    seltenheit: 2,
    rahmen: [-27, -26, 50, 52],
    zeichnung: () => (
      <g>
        <circle cx="-2" cy="0" r="23" {...flaeche(P.metall)} />
        <circle cx="-2" cy="0" r="17" {...flaeche(P.holz)} />
        <path d="M6 -14 A17 17 0 0 1 6 14 A22 22 0 0 0 6 -14 Z" {...flaeche(P.holzTief, 1.5)} />
        <path d="M-2 -11 Q9 -2 -2 12 Q-13 -2 -2 -11 Z" {...flaeche(P.gruen, 2)} />
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
        <rect x="-5.5" y="-25" width="11" height="14" rx="2" {...flaeche(P.blauHell, 2.5)} />
        <rect x="-7" y="-32" width="14" height="8" rx="3" {...flaeche(P.holz, 2.5)} />
        <circle cx="0" cy="1" r="15" {...flaeche(P.blauHell)} />
        <path d={`M-14 3 Q-7 ${(-2 + Math.sin(zeit * 3) * 2).toFixed(1)} 0 3 Q7 ${(8 + Math.sin(zeit * 3) * 2).toFixed(1)} 14 3 A14 14 0 0 1 -14 3 Z`} fill={P.blau} />
        <circle cx="3" cy={(9 - ((zeit * 6) % 14)).toFixed(1)} r="2.4" fill={P.blauHell} />
      </g>
    ),
  },
  {
    id: 'laterne',
    name: 'Laterne',
    platz: 'hand-links',
    seltenheit: 1,
    bewegt: true,
    rahmen: [-17, -8, 34, 50],
    zeichnung: (zeit) => (
      <g transform={`rotate(${(Math.sin(zeit * 2) * 6).toFixed(2)})`}>
        {rohr('M-7 6 Q0 -10 7 6', 3, P.metallTief)}
        <path d="M-12 4 h24 l-3 6 h-18 Z" {...flaeche(P.metallTief)} />
        <rect x="-10" y="10" width="20" height="22" rx="4" {...flaeche(P.goldHell, 2.5)} />
        <circle cx="0" cy="22" r={(6 + Math.sin(zeit * 7) * 0.8).toFixed(2)} fill={P.gold} />
        <path d="M-12 32 h24 l-3 6 h-18 Z" {...flaeche(P.metallTief)} />
      </g>
    ),
  },
];

/** Every item: the first ones drawn for the fox, then the hero's parts (one per part of src/lernquest/teile.ts). */
export const ITEMS: Item[] = [...GRUND, ...KOPF_ITEMS, ...WERKZEUG_ITEMS, ...BEGLEITER_ITEMS];
