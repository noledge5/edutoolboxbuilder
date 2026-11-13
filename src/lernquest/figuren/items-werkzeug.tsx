// Tools of the hero (slot `werkzeug`), held in `hand-rechts` (grip on 0, 0).
// Long things point up and a little outward (rotate around the grip) like the wooden sword; the hand (r ~9) covers
// the grip, so that part stays plain. Rarity: 1-2 wood and leather, 3 metal or glass, 4 colour + gem, 5 gold + gems.
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Item } from './typen';
import { Funkeln, maserung, stern } from './zeichnen';

export const WERKZEUG_ITEMS: Item[] = [
  {
    id: 'lupe',
    name: 'Lupe',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-34, -66, 66, 82],
    zeichnung: () => (
      <g transform="rotate(25)">
        <rect x="-4" y="-22" width="8" height="34" rx="3.5" fill={P.holz} {...UMRISS} />
        <path d="M2 -18 V8" stroke={P.holzTief} strokeWidth={2} opacity={0.5} />
        <circle cx="0" cy="-40" r="19" fill={P.metall} {...UMRISS} />
        <circle cx="0" cy="-40" r="13.5" fill={P.wasserHell} {...UMRISS_FEIN} />
        <path d="M9 -32 A12 12 0 0 1 -6 -29 A14 14 0 0 0 9 -32 Z M10 -38 A12 12 0 0 1 4 -28 Z" fill={P.blauHell} opacity={0.6} />
        <path d="M-10 -42 Q-8 -49 -2 -51" fill="none" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" />
        <circle cx="-11" cy="-34" r="1.8" fill={P.weiss} />
        <path d="M-16 -50 Q-12 -56 -6 -57" fill="none" stroke={P.metallHell} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M17 -34 Q16 -24 6 -22" fill="none" stroke={P.metallTief} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      </g>
    ),
  },
  {
    id: 'buch',
    name: 'Buch',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -40, 56, 72],
    zeichnung: () => (
      <g transform="rotate(10)">
        <rect x="-6" y="-24" width="32" height="46" rx="3" fill={P.creme} {...UMRISS} />
        <path d="M24 -20 V20 M21 -20 V20" stroke={P.steinTief} strokeWidth={1.5} />
        <rect x="-8" y="-27" width="31" height="46" rx="3" fill={P.rot} {...UMRISS} />
        <path d="M18 -26 L23 -24 L23 16 L12 18 Z" fill={P.rotTief} opacity={0.5} />
        <rect x="-8" y="-27" width="8" height="46" rx="3" fill={P.rotTief} {...UMRISS_FEIN} />
        <path d="M-4 -22 V14" stroke={P.rot} strokeWidth={1.5} opacity={0.5} />
        <path d={stern(11, -4, 7)} fill={P.gold} {...UMRISS_FEIN} />
        <path d="M4 -21 H18" stroke={P.goldHell} strokeWidth={2} strokeLinecap="round" />
        <path d="M4 10 H18" stroke={P.goldHell} strokeWidth={2} strokeLinecap="round" />
        <path d="M5 -24 Q8 -25 11 -25" fill="none" stroke={P.weiss} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      </g>
    ),
  },
  {
    id: 'pinsel',
    name: 'Pinsel',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -86, 60, 100],
    zeichnung: () => (
      <g transform="rotate(30)">
        <path d="M-3.5 14 Q-6 -10 -4 -36 L4 -36 Q6 -10 3.5 14 Z" fill={P.holz} {...UMRISS} />
        <path d="M2 -32 Q3 -10 2 10" stroke={P.holzTief} strokeWidth={2} opacity={0.5} fill="none" />
        <path d="M-2 -30 Q-3 -14 -2 -4" stroke={P.holz} strokeWidth={1.5} fill="none" />
        <rect x="-5.5" y="-47" width="11" height="12" rx="2" fill={P.metall} {...UMRISS_FEIN} />
        <path d="M-3 -45 V-37" stroke={P.metallHell} strokeWidth={2} strokeLinecap="round" />
        <path d="M-5.5 -47 Q-8 -58 0 -68 Q8 -58 5.5 -47 Z" fill={P.creme} {...UMRISS_FEIN} />
        <path d="M-6 -56 Q-8 -66 0 -72 Q8 -66 6 -56 Q0 -52 -6 -56 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M-3 -60 Q-4 -65 -1 -68" stroke={P.rosaHell} strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M3 -56 Q6 -62 3 -68" stroke={P.rotTief} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.5} />
      </g>
    ),
  },
  {
    id: 'angel',
    name: 'Angel',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -86, 62, 98],
    zeichnung: () => (
      <g>
        <g transform="rotate(20)">
          <path d="M-3.5 14 L-1.6 -72 L1.6 -72 L3.5 14 Z" fill={P.holz} {...UMRISS} />
          <path d="M-1 -66 L-2 8" stroke={P.holz} strokeWidth={1.5} />
          {maserung(0, -50, -14)}
          <path d="M-7 -20 h14" stroke={P.leder} strokeWidth={4} strokeLinecap="round" />
          <circle cx="9" cy="-22" r="5.5" fill={P.metall} {...UMRISS_FEIN} />
          <circle cx="9" cy="-22" r="1.8" fill={P.metallTief} />
        </g>
        <path d="M24.5 -68 Q40 -58 36 -34" fill="none" stroke={P.linie} strokeWidth={1.6} strokeLinecap="round" />
        <circle cx="36" cy="-28" r="6.5" fill={P.weiss} {...UMRISS_FEIN} />
        <path d="M29.5 -28 A6.5 6.5 0 0 0 42.5 -28 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M31.5 -33 Q33 -35.5 35.5 -35.5" fill="none" stroke={P.weiss} strokeWidth={1.5} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'fernrohr',
    name: 'Fernrohr',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-20, -86, 80, 100],
    zeichnung: () => (
      <g transform="rotate(40)">
        <rect x="-7" y="-20" width="14" height="32" rx="3" fill={P.leder} {...UMRISS} />
        <rect x="-5.5" y="-44" width="11" height="26" rx="2" fill={P.lederHell} {...UMRISS} />
        <path d="M-9 -66 L9 -66 L7 -44 L-7 -44 Z" fill={P.leder} {...UMRISS} />
        <path d="M3 -62 L7 -62 L5 -46 L3 -46 Z" fill={P.lederTief} opacity={0.5} />
        <path d="M3 -18 V8" stroke={P.lederTief} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
        <path d="M-3.5 -16 V8" stroke={P.lederHell} strokeWidth={2} strokeLinecap="round" />
        <rect x="-8.5" y="-22" width="17" height="4.5" rx="1.5" fill={P.gold} stroke={P.goldTief} strokeWidth={1.6} />
        <rect x="-7.5" y="-47" width="15" height="4.5" rx="1.5" fill={P.gold} stroke={P.goldTief} strokeWidth={1.6} />
        <rect x="-10.5" y="-69" width="21" height="5" rx="2" fill={P.gold} stroke={P.goldTief} strokeWidth={1.6} />
        <ellipse cx="0" cy="-71" rx="8" ry="3" fill={P.wasserHell} {...UMRISS_FEIN} />
        <path d="M-4 -71.5 H0" stroke={P.weiss} strokeWidth={1.8} strokeLinecap="round" />
        <rect x="-4.5" y="10" width="9" height="4" rx="2" fill={P.gold} stroke={P.goldTief} strokeWidth={1.6} />
      </g>
    ),
  },
  {
    id: 'bumerang',
    name: 'Bumerang',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -64, 66, 82],
    zeichnung: () => {
      const d = 'M0 10 Q-6 -28 34 -48';
      return (
        <g>
          <path d={d} fill="none" stroke={P.linie} strokeWidth={17} strokeLinecap="round" />
          <path d={d} fill="none" stroke={P.holz} strokeWidth={11} strokeLinecap="round" />
          <path d={d} fill="none" stroke={P.rot} strokeWidth={11} strokeDasharray="5 11" strokeDashoffset={-14} />
          <path d={d} fill="none" stroke={P.blau} strokeWidth={11} strokeDasharray="5 11" strokeDashoffset={-3} />
          <path d="M3 -2 Q1 -18 10 -30" fill="none" stroke={P.holzTief} strokeWidth={3} strokeLinecap="round" opacity={0.0} />
          <path d="M-5 -14 Q-2 -30 16 -42" fill="none" stroke={P.sandHell} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
          <path d="M4 -6 Q6 -26 28 -40" fill="none" stroke={P.holzTief} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
        </g>
      );
    },
  },
  {
    id: 'kompass',
    name: 'Kompass',
    platz: 'hand-rechts',
    seltenheit: 2,
    rahmen: [-24, -50, 48, 66],
    zeichnung: () => (
      <g>
        <rect x="-4" y="-10" width="8" height="20" rx="3" fill={P.goldTief} {...UMRISS_FEIN} />
        <circle cx="0" cy="-26" r="20" fill={P.gold} {...UMRISS} />
        <path d="M-3.5 -48 h7 v-4 h-7 Z" fill={P.goldTief} {...UMRISS_FEIN} />
        <circle cx="0" cy="-26" r="14.5" fill={P.eisHell} {...UMRISS_FEIN} />
        <path d="M0 -38 V-35 M0 -17 V-14 M-12 -26 H-9 M9 -26 H12" stroke={P.grauTief} strokeWidth={1.6} strokeLinecap="round" />
        <g transform="rotate(35 0 -26)">
          <path d="M0 -38 L4.5 -26 L-4.5 -26 Z" fill={P.rot} {...UMRISS_FEIN} />
          <path d="M0 -14 L4.5 -26 L-4.5 -26 Z" fill={P.metall} {...UMRISS_FEIN} />
        </g>
        <circle cx="0" cy="-26" r="1.8" fill={P.gold} />
        <path d="M-12 -34 Q-9 -40 -3 -41" fill="none" stroke={P.weiss} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M-18 -33 Q-14 -42 -6 -45" fill="none" stroke={P.goldHell} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M18 -22 Q15 -10 4 -8" fill="none" stroke={P.goldTief} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      </g>
    ),
  },
  {
    id: 'hammer',
    name: 'Zwergenhammer',
    platz: 'hand-rechts',
    seltenheit: 2,
    rahmen: [-24, -76, 80, 96],
    zeichnung: () => (
      <g transform="rotate(25)">
        <rect x="-4.5" y="-40" width="9" height="54" rx="3" fill={P.holz} {...UMRISS} />
        <rect x="-4.5" y="-8" width="9" height="20" rx="3" fill={P.leder} {...UMRISS_FEIN} />
        <path d="M-4 -4 l8 4 M-4 2 l8 4 M-4 8 l8 4" stroke={P.lederHell} strokeWidth={1.6} strokeLinecap="round" />
        <circle cx="0" cy="15" r="4.5" fill={P.metallTief} {...UMRISS_FEIN} />
        <rect x="-20" y="-66" width="40" height="28" rx="5" fill={P.metall} {...UMRISS} />
        <path d="M12 -66 H15 Q20 -66 20 -61 V-43 Q20 -38 15 -38 H12 Z" fill={P.metallTief} opacity={0.55} />
        <rect x="-20" y="-46" width="5" height="8" rx="2" fill={P.metallTief} opacity={0.35} />
        <path d="M-15 -60 Q-15 -63 -11 -63 H-3" fill="none" stroke={P.metallHell} strokeWidth={3} strokeLinecap="round" />
        <path d="M-3 -61 L-3 -43 M-3 -52 L5 -57 M-3 -52 L5 -46" fill="none" stroke={P.blauTief} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-13" cy="-42" r="1.6" fill={P.metallHell} stroke={P.linie} strokeWidth={1} />
        <circle cx="13" cy="-62" r="1.6" fill={P.metallHell} stroke={P.linie} strokeWidth={1} />
      </g>
    ),
  },
  {
    id: 'dreizack',
    name: 'Dreizack',
    platz: 'hand-rechts',
    seltenheit: 3,
    rahmen: [-24, -92, 76, 108],
    zeichnung: () => {
      const gabel = 'M-14 -70 V-60 Q-14 -50 0 -50 Q14 -50 14 -60 V-70 M0 -50 V-72';
      return (
        <g transform="rotate(20)">
          <path d="M-3.5 14 L-3 -48 L3 -48 L3.5 14 Z" fill={P.tuerkis} {...UMRISS} />
          <path d="M-1 -44 L-1.5 10" stroke={P.tuerkisHell} strokeWidth={2} strokeLinecap="round" />
          <path d="M2 -44 L2.5 10" stroke={P.tuerkisTief} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          <path d={gabel} fill="none" stroke={P.linie} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d={gabel} fill="none" stroke={P.blau} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-14 -72 V-60 M0 -72 V-56" fill="none" stroke={P.blauHell} strokeWidth={1.6} strokeLinecap="round" transform="translate(-1 0)" />
          <path d="M-19 -69 L-14 -83 L-9 -69 Z" fill={P.blauHell} {...UMRISS_FEIN} />
          <path d="M-5 -71 L0 -88 L5 -71 Z" fill={P.blauHell} {...UMRISS_FEIN} />
          <path d="M9 -69 L14 -83 L19 -69 Z" fill={P.blauHell} {...UMRISS_FEIN} />
          <rect x="-6" y="-53" width="12" height="5" rx="2" fill={P.gold} stroke={P.goldTief} strokeWidth={1.6} />
          <path d="M0 -62 L6 -55 L0 -48 L-6 -55 Z" fill={P.rosa} {...UMRISS_FEIN} />
          <path d="M-3 -56 L0 -59" stroke={P.weiss} strokeWidth={1.8} strokeLinecap="round" />
          <rect x="-5.5" y="-30" width="11" height="3.5" rx="1.5" fill={P.gold} stroke={P.goldTief} strokeWidth={1.4} />
        </g>
      );
    },
  },
  {
    id: 'sternenschwert',
    name: 'Sternenschwert',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-24, -92, 76, 120],
    zeichnung: (zeit) => (
      <g transform="rotate(30)">
        <path d="M-8 -16 L-8 -66 L0 -82 L8 -66 L8 -16 Z" fill={P.gelbHell} />
        <path d="M0 -82 L8 -66 L8 -16 L0 -16 Z" fill={P.goldHell} />
        <path d="M0 -82 L8 -66 L8 -16 L3 -16 Z" fill={P.gelb} opacity={0.5} />
        <path d="M-4 -20 L-4 -66" stroke={P.weiss} strokeWidth={2.6} strokeLinecap="round" opacity={0.9} />
        <path d="M-8 -16 L-8 -66 L0 -82 L8 -66 L8 -16 Z" fill="none" {...UMRISS} />
        <path d="M-20 -20 Q0 -12 20 -20 L19 -10 Q0 -3 -19 -10 Z" fill={P.gold} {...UMRISS_FEIN} />
        <circle cx="-17" cy="-15" r="3.2" fill={P.rot} stroke={P.rotTief} strokeWidth={1.4} />
        <circle cx="17" cy="-15" r="3.2" fill={P.rot} stroke={P.rotTief} strokeWidth={1.4} />
        <path d="M0 -20 l5 6 -5 6 -5 -6 Z" fill={P.blau} stroke={P.blauTief} strokeWidth={1.4} />
        <rect x="-4" y="-8" width="8" height="18" rx="3" fill={P.lilaTief} {...UMRISS_FEIN} />
        <path d="M-3 -4 l6 3 M-3 2 l6 3" stroke={P.lilaHell} strokeWidth={1.5} />
        <path d={stern(0, 19, 10)} fill={P.gold} {...UMRISS_FEIN} />
        <path d={stern(-1, 18, 4.5)} fill={P.goldHell} />
        <Funkeln x={14} y={-62} r={8} zeit={zeit} />
        <Funkeln x={-15} y={-38} r={6} zeit={zeit} versatz={2} />
      </g>
    ),
  },
  {
    id: 'blitzstab',
    name: 'Blitzstab',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-24, -112, 78, 128],
    zeichnung: (zeit) => {
      const w = Math.sin(zeit * 13);
      const an = w > -0.3;
      const jx = Math.sin(zeit * 31) * 1.2;
      return (
        <g transform="rotate(20)">
          <path d="M-3.5 14 L-3 -48 L3 -48 L3.5 14 Z" fill={P.gold} {...UMRISS} />
          <path d="M-1 -44 L-1.5 8" stroke={P.goldHell} strokeWidth={2} strokeLinecap="round" />
          <path d="M2 -44 L2.5 8" stroke={P.goldTief} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          <rect x="-5.5" y="-28" width="11" height="4" rx="1.5" fill={P.goldTief} {...UMRISS_FEIN} />
          <rect x="-5.5" y="12" width="11" height="4" rx="1.5" fill={P.goldTief} {...UMRISS_FEIN} />
          <path d="M-9 -58 L-6 -46 H6 L9 -58 Q0 -52 -9 -58 Z" fill={P.gold} {...UMRISS_FEIN} />
          <circle cx="0" cy="-58" r="7" fill={P.blau} {...UMRISS_FEIN} />
          <circle cx="-2.5" cy="-60.5" r="2" fill={P.weiss} />
          <circle cx={jx * 0.5} cy="-78" r={(14 + w * 2).toFixed(1)} fill={P.gelbHell} opacity={(0.28 + 0.14 * w).toFixed(2)} />
          <g transform={`translate(${jx.toFixed(2)} 0)`}>
            <path d="M5 -96 L-9 -76 L-1 -76 L-6 -62 L10 -82 L2 -82 Z" fill={an ? P.gelb : P.gelbHell} {...UMRISS_FEIN} />
            <path d="M3 -92 L-4 -80" stroke={P.weiss} strokeWidth={1.8} strokeLinecap="round" />
          </g>
          <Funkeln x={16} y={-92} r={7} zeit={zeit} />
          <Funkeln x={-15} y={-70} r={6} zeit={zeit} versatz={2.5} />
        </g>
      );
    },
  },
];
