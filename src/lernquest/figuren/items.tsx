// Items to wear or hold, drawn around their anchor (0, 0). Hats sit with the brim on the anchor, held things with
// the grip on it. The hero's parts (Stufe E, Teil 4) come here too, one entry per part of src/lernquest/teile.ts.
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Item } from './typen';

const stern = (x: number, y: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};

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
        <path d="M24 -26 L30 -44" stroke={P.rotTief} strokeWidth={2} strokeLinecap="round" />
        <path d="M-30 2 Q-22 -30 8 -34 Q26 -30 34 -2 Z" fill={P.gruen} {...UMRISS} />
        <path d="M-22 -10 Q-16 -26 2 -29" fill="none" stroke={P.gruenHell} strokeWidth={4} strokeLinecap="round" />
        <path d="M-29 -4 Q2 -13 33 -7 L34 0 Q2 -6 -30 2 Z" fill={P.leder} {...UMRISS_FEIN} />
        <path d="M-42 4 Q0 -7 44 2 Q40 11 0 9 Q-38 13 -42 4 Z" fill={P.gruenTief} {...UMRISS} />
      </g>
    ),
  },
  {
    id: 'zauberhut',
    name: 'Zauberhut',
    platz: 'hut',
    seltenheit: 4,
    rahmen: [-48, -70, 96, 82],
    zeichnung: () => (
      <g>
        <path d="M-32 2 L-2 -54 Q6 -66 16 -62 Q8 -58 6 -50 L34 2 Z" fill={P.lila} {...UMRISS} />
        <path d="M-22 -8 L-4 -44" stroke={P.lilaHell} strokeWidth={4} strokeLinecap="round" />
        <path d="M14 -18 L34 2 L-32 2 L-26 -10 Z" fill={P.lilaTief} opacity={0.35} />
        <path d={stern(4, -20, 9)} fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" />
        <ellipse cx="0" cy="4" rx="46" ry="9" fill={P.lilaTief} {...UMRISS} />
      </g>
    ),
  },
  {
    id: 'krone',
    name: 'Krone',
    platz: 'hut',
    seltenheit: 5,
    rahmen: [-36, -40, 72, 48],
    zeichnung: () => (
      <g>
        <path d="M-30 4 L-33 -26 L-15 -9 L0 -34 L15 -9 L33 -26 L30 4 Z" fill={P.gold} {...UMRISS} />
        <path d="M-26 -14 L-27 -2 M-6 -18 L0 -27" stroke={P.goldHell} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M-30 4 L30 4 L30 -4 L-30 -4 Z" fill={P.goldTief} {...UMRISS_FEIN} />
        <circle cx="-16" cy="0" r="3.5" fill={P.rot} />
        <circle cx="0" cy="0" r="4" fill={P.blau} />
        <circle cx="16" cy="0" r="3.5" fill={P.rot} />
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
        <path d="M-6 -14 L-6 -58 L0 -68 L6 -58 L6 -14 Z" fill={P.holz} {...UMRISS} />
        <path d="M-2 -18 L-2 -56" stroke={P.goldHell} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        <rect x="-14" y="-16" width="28" height="7" rx="3" fill={P.holzTief} {...UMRISS_FEIN} />
        <rect x="-3.5" y="-9" width="7" height="18" rx="3" fill={P.leder} {...UMRISS_FEIN} />
        <circle cx="0" cy="12" r="4.5" fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
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
        <path d="M-12 -10 Q-8 -14 -2 -15" fill="none" stroke={P.metallHell} strokeWidth={3} strokeLinecap="round" />
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
    rahmen: [-17, -32, 34, 46],
    zeichnung: () => (
      <g>
        <rect x="-5" y="-24" width="10" height="12" fill={P.blauHell} {...UMRISS_FEIN} />
        <rect x="-6" y="-31" width="12" height="7" rx="2" fill={P.holz} {...UMRISS_FEIN} />
        <circle cx="0" cy="0" r="14" fill={P.blauHell} {...UMRISS} />
        <path d="M-13 2 Q0 -4 13 2 A14 14 0 0 1 -13 2 Z" fill={P.blau} />
        <circle cx="-5" cy="-5" r="3" fill={P.weiss} opacity={0.8} />
        <circle cx="4" cy="6" r="1.8" fill={P.blauHell} />
      </g>
    ),
  },
];
