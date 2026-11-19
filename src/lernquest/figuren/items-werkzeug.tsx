// Tools of the hero (slot `werkzeug`), held in `hand-rechts` (grip on 0, 0).
// Few big flat shapes (docs/design/prinzipien.md): a stem is a thick tube with round ends, the head one big shape.
// Long things point up and a little outward (rotate around the grip); the hand (r ~9) covers the grip.
// Rarity: 1-2 wood and leather, 3 metal or glass, 4 colour + star or gem, 5 gold + gems.
import { flaeche, P } from './stil';
import type { Item } from './typen';
import { Funkeln, stern } from './zeichnen';

/** A tube with round ends along the path `d`, `b` wide. */
const rohr = (d: string, b: number, farbe: string, extra: { opacity?: number } = {}) => (
  <path d={d} fill="none" stroke={farbe} strokeWidth={b} strokeLinecap="round" strokeLinejoin="round" {...extra} />
);
/** A straight upright tube from y `von` to y `bis` on the line x = 0. */
const stiel = (von: number, bis: number, b: number, farbe: string) => rohr(`M0 ${von} V${bis}`, b, farbe);

/** A sword blade from the guard (y = -14) up to a rounded tip at `spitze`, `b` half wide. */
const klinge = (spitze: number, b = 7) => `M${-b} -14 V${spitze + 12} Q${-b} ${spitze + 4} 0 ${spitze} Q${b} ${spitze + 4} ${b} ${spitze + 12} V-14 Z`;
/** The right half of the same blade, for the shade. */
const klingeRechts = (spitze: number, b = 7) => `M0 -14 V${spitze} Q${b} ${spitze + 4} ${b} ${spitze + 12} V-14 Z`;

export const WERKZEUG_ITEMS: Item[] = [
  {
    id: 'lupe',
    name: 'Lupe',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-24, -62, 58, 80],
    zeichnung: () => (
      <g transform="rotate(25)">
        {stiel(14, -18, 9, P.holz)}
        <circle cx="0" cy="-40" r="20" {...flaeche(P.metall)} />
        <path d="M17 -32 A19 19 0 0 1 -6 -21 A22 22 0 0 0 17 -32 Z" {...flaeche(P.metallTief, 1)} />
        <circle cx="0" cy="-40" r="13.5" {...flaeche(P.wasserHell, 2.5)} />
        <path d="M-9 -42 Q-8 -49 -2 -51" fill="none" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'buch',
    name: 'Buch',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -34, 48, 62],
    zeichnung: () => (
      <g transform="rotate(10)">
        <rect x="-4" y="-24" width="31" height="46" rx="5" {...flaeche(P.sand)} />
        <rect x="-8" y="-28" width="31" height="46" rx="5" {...flaeche(P.rot)} />
        <rect x="-8" y="-28" width="9" height="46" rx="4" {...flaeche(P.rotTief)} />
        <path d={stern(12, -5, 8)} {...flaeche(P.gold, 2)} />
      </g>
    ),
  },
  {
    id: 'pinsel',
    name: 'Pinsel',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -86, 58, 100],
    zeichnung: () => (
      <g transform="rotate(30)">
        {stiel(14, -38, 7, P.holz)}
        <rect x="-6" y="-48" width="12" height="14" rx="3" {...flaeche(P.metall, 2.5)} />
        <path d="M-7 -46 Q-10 -64 0 -76 Q10 -64 7 -46 Z" {...flaeche(P.rot, 2.5)} />
        <path d="M-3 -52 Q-4 -62 -1 -68" fill="none" stroke={P.rosaHell} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'angel',
    name: 'Angel',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-14, -80, 58, 94],
    zeichnung: () => (
      <g>
        <g transform="rotate(20)">
          {rohr('M0 14 L0 -70', 6, P.holz)}
          <circle cx="10" cy="-18" r="6.5" {...flaeche(P.metall, 2.5)} />
        </g>
        <path d="M24.5 -66 Q42 -56 36 -34" fill="none" stroke={P.grauTief} strokeWidth={2} strokeLinecap="round" />
        <circle cx="36" cy="-28" r="7" {...flaeche(P.rot)} />
        <path d="M30 -28 A6 6 0 0 1 42 -28 Z" fill={P.weiss} />
      </g>
    ),
  },
  {
    id: 'fernrohr',
    name: 'Fernrohr',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-22, -90, 76, 102],
    zeichnung: () => (
      <g transform="rotate(40)">
        <rect x="-6.5" y="-24" width="13" height="38" rx="5" {...flaeche(P.leder, 2.5)} />
        <rect x="-9" y="-48" width="18" height="30" rx="5" {...flaeche(P.lederHell, 2.5)} />
        <rect x="-12" y="-72" width="24" height="28" rx="6" {...flaeche(P.leder)} />
        <rect x="-13" y="-76" width="26" height="9" rx="4" {...flaeche(P.metall, 2.5)} />
        <ellipse cx="0" cy="-74" rx="7" ry="3" fill={P.wasserHell} />
      </g>
    ),
  },
  {
    id: 'bumerang',
    name: 'Bumerang',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-12, -62, 62, 80],
    zeichnung: () => {
      const d = 'M0 10 Q-6 -28 34 -48';
      return (
        <g>
          {rohr(d, 15, P.holz)}
          <path d={d} fill="none" stroke={P.rot} strokeWidth={15} strokeDasharray="6 14" strokeDashoffset={-14} />
          {rohr('M-5 -14 Q-2 -30 16 -42', 3, P.sandHell, { opacity: 0.8 })}
        </g>
      );
    },
  },
  {
    id: 'kompass',
    name: 'Kompass',
    platz: 'hand-rechts',
    seltenheit: 2,
    rahmen: [-24, -50, 48, 64],
    zeichnung: () => (
      <g>
        {stiel(8, -12, 8, P.metallTief)}
        <circle cx="0" cy="-27" r="21" {...flaeche(P.metall)} />
        <path d="M18 -34 A21 21 0 0 1 -6 -7 A25 25 0 0 0 18 -34 Z" {...flaeche(P.metallTief, 1)} />
        <circle cx="0" cy="-27" r="14.5" {...flaeche(P.creme, 2)} />
        <g transform="rotate(35 0 -27)">
          <path d="M0 -40 L5.5 -27 L-5.5 -27 Z" {...flaeche(P.rot, 2)} />
          <path d="M0 -14 L5.5 -27 L-5.5 -27 Z" {...flaeche(P.grauTief, 2)} />
        </g>
      </g>
    ),
  },
  {
    id: 'hammer',
    name: 'Zwergenhammer',
    platz: 'hand-rechts',
    seltenheit: 2,
    rahmen: [-26, -78, 84, 96],
    zeichnung: () => (
      <g transform="rotate(25)">
        {stiel(14, -44, 9, P.holz)}
        <rect x="-22" y="-70" width="44" height="30" rx="8" {...flaeche(P.metall)} />
        <path d="M10 -70 H14 Q22 -70 22 -62 V-48 Q22 -40 14 -40 H10 Z" {...flaeche(P.metallTief, 1.5)} />
        <path d="M-16 -62 Q-16 -65 -12 -65 H-4" fill="none" stroke={P.metallHell} strokeWidth={3.5} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'dreizack',
    name: 'Dreizack',
    platz: 'hand-rechts',
    seltenheit: 3,
    rahmen: [-24, -92, 80, 108],
    zeichnung: () => (
      <g transform="rotate(20)">
        {stiel(14, -50, 7, P.tuerkis)}
        {rohr('M-15 -76 V-62 Q-15 -50 0 -50 Q15 -50 15 -62 V-76 M0 -50 V-82', 7, P.blau)}
        {rohr('M-15 -74 V-62', 2.5, P.blauHell)}
        <path d="M0 -62 L6 -55 L0 -48 L-6 -55 Z" {...flaeche(P.rosa, 2)} />
      </g>
    ),
  },
  {
    id: 'sternenschwert',
    name: 'Sternenschwert',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-26, -92, 76, 124],
    zeichnung: (zeit) => (
      <g transform="rotate(30)">
        <path d={klinge(-84, 9)} {...flaeche(P.gelbHell)} />
        <path d={klingeRechts(-84, 9)} {...flaeche(P.gelb, 1)} />
        {rohr('M-20 -15 H20', 8, P.gold)}
        {stiel(-8, 8, 8, P.lilaTief)}
        <path d={stern(0, 20, 11)} {...flaeche(P.gold, 2.5)} />
        <Funkeln x={16} y={-62} r={9} zeit={zeit} />
      </g>
    ),
  },
  {
    id: 'blitzstab',
    name: 'Blitzstab',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-26, -110, 78, 126],
    zeichnung: (zeit) => {
      const w = Math.sin(zeit * 13);
      const jx = Math.sin(zeit * 31) * 1.2;
      return (
        <g transform="rotate(20)">
          {stiel(14, -50, 7, P.gold)}
          <circle cx="0" cy="-60" r="9" {...flaeche(P.blau)} />
          <circle cx={jx * 0.5} cy="-80" r={(15 + w * 2).toFixed(1)} fill={P.gelbHell} opacity={(0.3 + 0.15 * w).toFixed(2)} />
          <path transform={`translate(${jx.toFixed(2)} 0)`} d="M7 -100 L-10 -78 L-1 -78 L-7 -64 L11 -86 L2 -86 Z" {...flaeche(w > -0.3 ? P.gelb : P.gelbHell, 2.5)} />
        </g>
      );
    },
  },
  // — 13.11.2026 (supabase/migrations/20261129_lernquest_neue_teile.sql): two per rarity. —
  {
    id: 'bleistift',
    name: 'Riesenbleistift',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-18, -80, 58, 100],
    zeichnung: () => (
      <g transform="rotate(25)">
        <rect x="-9" y="4" width="18" height="15" rx="6" {...flaeche(P.rosa, 2.5)} />
        <rect x="-10" y="-2" width="20" height="8" rx="2" {...flaeche(P.metallTief, 2)} />
        <rect x="-9" y="-54" width="18" height="54" rx="3" {...flaeche(P.gelb)} />
        <path d="M2 -54 H9 V0 H2 Z" {...flaeche(P.gelbTief, 1.5)} />
        <path d="M-9 -54 L0 -76 L9 -54 Z" {...flaeche(P.holz)} />
        <path d="M-3.5 -67 L0 -76 L3.5 -67 Z" {...flaeche(P.dunkel, 1.5)} />
      </g>
    ),
  },
  {
    id: 'regenschirm',
    name: 'Regenschirm',
    platz: 'hand-rechts',
    seltenheit: 1,
    rahmen: [-52, -98, 100, 112],
    zeichnung: () => (
      <g transform="rotate(12)">
        {rohr('M0 6 Q0 14 -7 14 Q-12 14 -12 8', 5, P.leder)}
        {stiel(6, -60, 4, P.metallTief)}
        <path d="M-46 -54 Q-44 -90 0 -92 Q44 -90 46 -54 Q31 -44 15 -54 Q0 -44 -15 -54 Q-31 -44 -46 -54 Z" {...flaeche(P.rot)} />
        <path d="M0 -92 Q44 -90 46 -54 Q31 -44 15 -54 Q18 -75 0 -92 Z" {...flaeche(P.rotTief, 1.5)} />
        <path d="M-34 -66 Q-28 -82 -14 -86" fill="none" stroke={P.rosaHell} strokeWidth={4} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'gitarre',
    name: 'Gitarre',
    platz: 'hand-rechts',
    seltenheit: 2,
    rahmen: [-30, -72, 64, 122],
    zeichnung: () => (
      <g transform="rotate(18)">
        {/* Held by the neck, the body hangs below the hand */}
        {stiel(16, -62, 7, P.holzTief)}
        <rect x="-7" y="-76" width="14" height="16" rx="5" {...flaeche(P.leder, 2.5)} />
        <path d="M0 12 C-24 12 -26 28 -17 34 C-28 40 -28 60 0 62 C28 60 28 40 17 34 C26 28 24 12 0 12 Z" {...flaeche(P.orange)} />
        <path d="M14 18 C24 24 22 30 17 34 C26 40 26 56 8 60 C18 50 16 36 9 30 C13 26 12 20 14 18 Z" {...flaeche(P.orangeTief, 1.5)} />
        <circle cx="0" cy="34" r="7" {...flaeche(P.dunkel, 2)} />
      </g>
    ),
  },
  {
    id: 'kescher',
    name: 'Kescher',
    platz: 'hand-rechts',
    seltenheit: 2,
    rahmen: [-22, -96, 64, 112],
    zeichnung: () => (
      <g transform="rotate(20)">
        {/* A pale net bag with a shade and two strings, the stick in front, a wooden hoop on top */}
        <path d="M-20 -74 Q-22 -42 -2 -34 Q18 -42 20 -74 Z" {...flaeche(P.wolke, 2.5)} />
        <path d="M8 -72 Q14 -50 0 -36 Q16 -42 20 -74 Z" fill={P.wolkeTief} />
        <path d="M-10 -71 Q-10 -50 -4 -38 M-2 -72 Q2 -52 -1 -36" fill="none" stroke={P.wolkeTief} strokeWidth={2.5} strokeLinecap="round" />
        {stiel(14, -66, 7, P.holz)}
        <ellipse cx="0" cy="-74" rx="20" ry="9" fill="none" stroke={P.holzTief} strokeWidth={5} />
      </g>
    ),
  },
  {
    id: 'bogen',
    name: 'Bogen',
    platz: 'hand-rechts',
    seltenheit: 3,
    rahmen: [-20, -62, 40, 124],
    zeichnung: () => (
      <g>
        <path d="M14 -54 V54" stroke={P.grauTief} strokeWidth={2} strokeLinecap="round" />
        {rohr('M14 -54 Q-26 0 14 54', 8, P.holz)}
        <circle cx="14" cy="-54" r="5" {...flaeche(P.metall, 2.5)} />
        <circle cx="14" cy="54" r="5" {...flaeche(P.metall, 2.5)} />
        <rect x="-10" y="-9" width="9" height="18" rx="4" {...flaeche(P.leder, 2.5)} />
      </g>
    ),
  },
  {
    id: 'zauberbuch',
    name: 'Zauberbuch',
    platz: 'hand-rechts',
    seltenheit: 3,
    bewegt: true,
    rahmen: [-30, -72, 66, 84],
    zeichnung: (zeit) => {
      const auf = Math.sin(zeit * 2) * 3;
      return (
        <g transform={`translate(4 ${(-10 + auf).toFixed(2)})`}>
          {/* Open book floating above the hand, a rune glowing over it */}
          <path d="M0 2 Q-14 -4 -29 0 L-29 -31 Q-14 -35 0 -29 Q14 -35 29 -31 L29 0 Q14 -4 0 2 Z" {...flaeche(P.lilaTief)} />
          <path d="M0 -3 Q-12 -9 -24 -6 L-24 -29 Q-12 -31 0 -27 Z" {...flaeche(P.creme, 2)} />
          <path d="M0 -3 Q12 -9 24 -6 L24 -29 Q12 -31 0 -27 Z" {...flaeche(P.sand, 2)} />
          <g opacity={0.65 + Math.sin(zeit * 3) * 0.3}>
            <circle cx={0} cy={-46} r={10} {...flaeche(P.lilaHell, 2)} />
            <path d={stern(0, -46, 7)} fill={P.gold} />
          </g>
          <Funkeln x={-20} y={-44} r={5} zeit={zeit} />
        </g>
      );
    },
  },
  {
    id: 'flammenschwert',
    name: 'Flammenschwert',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-26, -100, 70, 118],
    zeichnung: (zeit) => {
      const f = (y: number, k: number) => `translate(0 ${y}) scale(${(1 + Math.sin(zeit * 10 + k) * 0.1).toFixed(3)}) translate(0 ${-y})`;
      return (
        <g transform="rotate(28)">
          <path d="M0 -14 Q-20 -30 -14 -58 Q-10 -48 -6 -52 Q-8 -78 4 -92 Q6 -80 12 -76 Q22 -50 16 -34 Q12 -20 0 -14 Z" transform={f(-14, 0)} {...flaeche(P.lava, 2.5)} />
          <path d="M0 -20 Q-9 -32 -6 -50 Q0 -60 4 -66 Q12 -48 8 -36 Q6 -24 0 -20 Z" transform={f(-20, 2)} {...flaeche(P.orange, 2)} />
          <path d={klinge(-78, 6.5)} {...flaeche(P.metall)} />
          <path d={klingeRechts(-78, 6.5)} {...flaeche(P.metallTief, 1)} />
          {rohr('M-18 -14 H18', 7, P.grauTief)}
          {stiel(-8, 8, 7, P.leder)}
        </g>
      );
    },
  },
  {
    id: 'frostbogen',
    name: 'Frostbogen',
    platz: 'hand-rechts',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-24, -74, 44, 148],
    zeichnung: (zeit) => (
      <g>
        <path d="M14 -58 V58" stroke={P.eisTief} strokeWidth={2} strokeLinecap="round" />
        {rohr('M14 -58 Q-28 0 14 58', 9, P.eis)}
        {rohr('M14 -58 Q-28 0 14 58', 3, P.eisTief, { opacity: 0.7 })}
        {/* Ice crystals at both tips and a gem at the grip */}
        <path d="M14 -56 l-8 -10 l8 -8 l8 8 Z" {...flaeche(P.eisHell, 2.5)} />
        <path d="M14 56 l-8 10 l8 8 l8 -8 Z" {...flaeche(P.eisHell, 2.5)} />
        <path d="M10 -62 l4 -2 l4 6 Z M10 62 l4 2 l4 -6 Z" fill={P.eisTief} />
        <path d="M-10 -9 L-4 0 L-10 9 L-16 0 Z" {...flaeche(P.tuerkis, 3)} />
        <Funkeln x={-12} y={-32} r={6} zeit={zeit} />
      </g>
    ),
  },
  {
    id: 'sonnenzepter',
    name: 'Sonnenzepter',
    platz: 'hand-rechts',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-30, -102, 70, 118],
    zeichnung: (zeit) => (
      <g transform="rotate(18)">
        {stiel(14, -56, 8, P.gold)}
        <path d={stern(0, -76, 26, 8)} transform={`rotate(${((zeit * 30) % 360).toFixed(1)} 0 -76)`} {...flaeche(P.orange, 2.5)} />
        <circle cx={0} cy={-76} r={14} {...flaeche(P.gelb)} />
        <circle cx={0} cy={-76} r={6} {...flaeche(P.rot, 2)} />
        <Funkeln x={-20} y={-60} r={6} zeit={zeit} versatz={2} />
      </g>
    ),
  },
  {
    id: 'mondsichel',
    name: 'Mondsichelstab',
    platz: 'hand-rechts',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-36, -106, 82, 120],
    zeichnung: (zeit) => {
      const mond = 'M6 -98 A22 22 0 1 0 22 -62 A17 17 0 1 1 6 -98 Z';
      return (
        <g transform="rotate(16)">
          {stiel(14, -62, 8, P.lila)}
          <path d={mond} transform="translate(3 3)" fill={P.goldTief} stroke={P.goldTief} strokeWidth={3} strokeLinejoin="round" />
          <path d={mond} {...flaeche(P.goldHell)} />
          <circle cx="0" cy="-60" r="7" {...flaeche(P.rot, 2.5)} />
          {[0, 1].map((i) => {
            const a = zeit * 1.6 + i * Math.PI;
            return <path key={i} d={stern(Math.cos(a) * 28, -80 + Math.sin(a) * 12, 6)} {...flaeche(P.gelb, 2)} />;
          })}
          <Funkeln x={-20} y={-100} r={6} zeit={zeit} />
        </g>
      );
    },
  },
];
