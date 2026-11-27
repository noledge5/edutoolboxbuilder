// Hats of the hero (slot `kopf` in src/lernquest/teile.ts), on the anchor `hut`.
// Rarity shows in the material: wool, cloth, leather; then metal; then colour with a star; then gold and gems.
// Few shapes each (3-7, docs/design/prinzipien.md): one clear silhouette and one feature (pompom, skull, propeller …).
import { Flaeche } from './flaeche';
import { flaeche, P } from './stil';
import type { Item } from './typen';
import { Funkeln, stern } from './zeichnen';

const GEIST = { fill: 'none', strokeLinecap: 'round' } as const;

/** The shade of a shape: a darker copy of its lower right part, drawn over it. */
const Tief = ({ d, farbe, deckkraft = 0.55 }: { d: string; farbe: string; deckkraft?: number }) => <path d={d} fill={farbe} opacity={deckkraft} />;
/** The light of a shape: one short stroke top left. */
const Hell = ({ d, farbe, breite = 5 }: { d: string; farbe: string; breite?: number }) => <path d={d} {...GEIST} stroke={farbe} strokeWidth={breite} />;

export const KOPF_ITEMS: Item[] = [
  {
    id: 'wollmuetze',
    name: 'Wollmütze',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-46, -66, 92, 76],
    weite: 87,
    zeichnung: () => (
      <g>
        <path d="M-36 -4 Q-40 -42 0 -44 Q40 -42 36 -4 Z" {...flaeche(P.rot)} />
        <Tief d="M14 -41 Q38 -34 36 -4 L18 -4 Q22 -24 14 -41 Z" farbe={P.rotTief} />
        <Hell d="M-24 -12 Q-22 -30 -8 -38" farbe={P.backe} />
        <rect x={-42} y={-12} width={84} height={20} rx={10} {...flaeche(P.rotTief)} />
        {/* the pompom: white, with a grey shade lower right so it stands out on cream */}
        <circle cx={3} cy={-49} r={11} {...flaeche(P.grauHell)} />
        <circle cx={0} cy={-52} r={11} {...flaeche(P.weiss)} />
      </g>
    ),
  },
  {
    id: 'stirnband',
    name: 'Stirnband',
    platz: 'hut',
    stirn: true,
    seltenheit: 1,
    rahmen: [-54, 0, 128, 40],
    zeichnung: () => (
      <g>
        <path d="M48 16 Q62 4 76 12 Q68 16 66 22 Q60 18 50 20 Z" {...flaeche(P.rot, 2.5)} />
        <path d="M48 20 Q60 28 72 38 Q64 38 60 34 Q56 36 48 26 Z" {...flaeche(P.rotTief, 2.5)} />
        <path d="M-54 7 Q0 0 54 7 L54 29 Q0 22 -54 29 Z" {...flaeche(P.rot)} />
        <Tief d="M24 10 Q40 9 54 7 L54 29 Q36 25 20 24 Z" farbe={P.rotTief} />
        <ellipse cx={52} cy={18} rx={8} ry={10} {...flaeche(P.rotTief, 2.5)} />
      </g>
    ),
  },
  {
    id: 'ritterhelm',
    name: 'Ritterhelm',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-60, -62, 120, 106],
    weite: 79,
    zeichnung: () => (
      <g>
        <path d="M-6 -44 Q10 -66 28 -56 Q14 -54 8 -42 Z" {...flaeche(P.rot, 2.5)} />
        {/* dome with the two cheek guards as one shape */}
        <path d="M-40 14 L-40 -10 Q-40 -46 0 -48 Q40 -46 40 -10 L40 14 Q34 18 30 10 L30 4 L-30 4 L-30 10 Q-34 18 -40 14 Z" {...flaeche(P.metall)} />
        <Tief d="M16 -44 Q40 -36 40 -10 L40 14 Q34 18 30 10 L30 4 L18 4 Q24 -20 16 -44 Z" farbe={P.metallTief} deckkraft={0.6} />
        <Hell d="M-27 -8 Q-26 -30 -8 -39" farbe={P.metallHell} />
        {/* the visor slit */}
        <rect x={-28} y={-16} width={56} height={12} rx={6} {...flaeche(P.grauTief, 2.5)} />
      </g>
    ),
  },
  {
    id: 'entdeckerhut',
    name: 'Entdeckerhut',
    platz: 'hut',
    haube: true,
    seltenheit: 2,
    rahmen: [-58, -50, 116, 64],
    weite: 70,
    zeichnung: () => (
      <g>
        <ellipse cx={0} cy={4} rx={56} ry={11} {...flaeche(P.sandTief)} />
        <path d="M-30 2 Q-34 -30 -22 -40 Q-10 -46 0 -40 Q12 -46 22 -40 Q34 -30 30 2 Q0 8 -30 2 Z" {...flaeche(P.sand)} />
        <Tief d="M18 -38 Q34 -28 30 2 Q20 5 12 5 Q20 -14 18 -38 Z" farbe={P.sandTief} deckkraft={0.7} />
        <path d="M-31 -9 Q0 -3 31 -9 L30 1 Q0 7 -30 1 Z" {...flaeche(P.leder, 2.5)} />
        <rect x={9} y={-10} width={12} height={13} rx={3} {...flaeche(P.gold, 2)} />
      </g>
    ),
  },
  {
    id: 'piratenhut',
    name: 'Piratenhut',
    platz: 'hut',
    haube: true,
    seltenheit: 2,
    rahmen: [-60, -50, 120, 60],
    weite: 100,
    zeichnung: () => (
      <g>
        <Flaeche d="M-56 8 L-46 -26 Q-22 -38 0 -34 Q22 -38 46 -26 L56 8 Q30 -4 0 -3 Q-30 -4 -56 8 Z" farbe={P.dunkel} hell={P.dunkelHell} />
        <path d="M-53 4 Q-30 -7 0 -7 Q30 -7 53 4" {...GEIST} stroke={P.gold} strokeWidth={4} />
        {/* the skull: big, so it reads at 48 px; shade lower right */}
        <path d="M-10 -19 Q-10 -33 0 -33 Q10 -33 10 -19 Q10 -14 6 -13 L6 -8 L-6 -8 L-6 -13 Q-10 -14 -10 -19 Z" {...flaeche(P.grauHell, 2)} transform="translate(2 2)" />
        <path d="M-10 -19 Q-10 -33 0 -33 Q10 -33 10 -19 Q10 -14 6 -13 L6 -8 L-6 -8 L-6 -13 Q-10 -14 -10 -19 Z" {...flaeche(P.weiss, 2)} />
        <circle cx={-4.2} cy={-21} r={3} fill={P.auge} />
        <circle cx={4.2} cy={-21} r={3} fill={P.auge} />
      </g>
    ),
  },
  {
    id: 'kappe',
    name: 'Schirmmütze',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-44, -50, 106, 64],
    weite: 82,
    zeichnung: () => (
      <g>
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" {...flaeche(P.blau)} />
        <Tief d="M16 -38 Q42 -30 40 6 L22 6 Q26 -18 16 -38 Z" farbe={P.blauTief} />
        <Hell d="M-28 -6 Q-28 -28 -10 -37" farbe={P.blauHell} />
        <circle cx={0} cy={-42} r={4} {...flaeche(P.blauTief, 2.5)} />
        <path d="M6 -2 Q40 -8 60 6 Q56 14 36 14 Q18 12 6 8 Z" {...flaeche(P.rot)} />
        <Tief d="M20 8 Q40 6 56 10 Q50 14 36 14 Q26 12 20 8 Z" farbe={P.rotTief} />
        <path d={stern(-12, -18, 7)} fill={P.weiss} stroke={P.weiss} strokeWidth={1.4} strokeLinejoin="round" />
      </g>
    ),
  },
  {
    id: 'wikingerhelm',
    name: 'Wikingerhelm',
    platz: 'hut',
    haube: true,
    seltenheit: 2,
    rahmen: [-66, -60, 132, 76],
    weite: 81,
    zeichnung: () => (
      <g>
        {/* two horns, the left one mirrored: cream with a darker edge lower right */}
        {[1, -1].map((s) => (
          <g key={s} transform={`scale(${s} 1)`}>
            <path d="M30 -12 Q62 -8 58 -52 Q50 -28 38 -26 Z" {...flaeche(P.creme)} />
            <path d="M58 -52 Q56 -34 48 -26 L38 -26 Q52 -28 58 -52 Z" fill={P.sandTief} opacity={0.7} />
          </g>
        ))}
        <path d="M-38 8 Q-42 -36 0 -40 Q42 -36 38 8 Z" {...flaeche(P.metall)} />
        <Tief d="M14 -36 Q40 -28 38 8 L20 8 Q24 -16 14 -36 Z" farbe={P.metallTief} deckkraft={0.6} />
        <Hell d="M-27 -6 Q-26 -26 -8 -34" farbe={P.metallHell} />
        <path d="M-42 -2 Q0 -10 42 -2 L42 10 Q0 2 -42 10 Z" {...flaeche(P.metallTief)} />
      </g>
    ),
  },
  {
    id: 'kochmuetze',
    name: 'Kochmütze',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-52, -66, 104, 76],
    weite: 66,
    zeichnung: () => (
      <g>
        {/* Toque: a tall column with three puffs on top, a band below. White things are drawn in `wolke` (pale grey)
            with a white light and a grey shade, so they read on white cards and on cream. */}
        <rect x={-22} y={-44} width={44} height={40} rx={6} {...flaeche(P.wolke)} />
        <circle cx={-20} cy={-46} r={15} {...flaeche(P.wolke)} />
        <circle cx={20} cy={-46} r={15} {...flaeche(P.wolke)} />
        <circle cx={0} cy={-56} r={17} {...flaeche(P.wolke)} />
        <Tief d="M8 -36 Q20 -34 22 -24 L22 -4 L8 -4 Z M35 -46 Q34 -32 21 -31 Q30 -38 35 -46 Z M16 -54 Q14 -42 2 -39 Q12 -46 16 -54 Z" farbe={P.wolkeTief} deckkraft={1} />
        <Hell d="M-28 -52 Q-24 -58 -16 -59 M-8 -66 Q-2 -70 6 -69" farbe={P.wolkeHell} />
        <rect x={-30} y={-8} width={60} height={16} rx={7} {...flaeche(P.wolke)} />
        <Tief d="M-30 2 Q0 6 30 2 L30 4 Q30 10 23 10 L-23 10 Q-30 10 -30 4 Z" farbe={P.wolkeTief} deckkraft={1} />
      </g>
    ),
  },
  {
    id: 'cowboyhut',
    name: 'Cowboyhut',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-62, -48, 124, 62],
    weite: 75,
    zeichnung: () => (
      <g>
        <path d="M-60 -6 Q-54 -18 -36 -8 Q0 2 36 -8 Q54 -18 60 -6 Q52 12 0 11 Q-52 12 -60 -6 Z" {...flaeche(P.leder)} />
        <Tief d="M20 4 Q50 -2 60 -6 Q52 12 0 11 Q10 8 20 4 Z" farbe={P.lederTief} />
        <path d="M-30 0 Q-36 -28 -24 -42 Q-12 -34 0 -37 Q12 -34 24 -42 Q36 -28 30 0 Q0 6 -30 0 Z" {...flaeche(P.lederHell)} />
        <Tief d="M20 -38 Q36 -26 30 0 Q22 3 14 4 Q22 -14 20 -38 Z" farbe={P.lederTief} />
        <path d="M-31 -9 Q0 -3 31 -9 L30 1 Q0 7 -30 1 Z" {...flaeche(P.lederTief, 2.5)} />
        <path d={stern(0, -3, 6)} fill={P.gelb} stroke={P.gelb} strokeWidth={1.4} strokeLinejoin="round" />
      </g>
    ),
  },
  {
    id: 'raumhelm',
    name: 'Raumhelm',
    platz: 'hut',
    haube: true,
    seltenheit: 3,
    rahmen: [-46, -74, 98, 88],
    weite: 80,
    zeichnung: () => (
      <g>
        <path d="M26 -34 Q28 -48 32 -58" {...GEIST} stroke={P.metallTief} strokeWidth={6} />
        <circle cx={32} cy={-62} r={6.5} {...flaeche(P.rot, 2.5)} />
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" {...flaeche(P.grau)} transform="translate(3 3)" />
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" {...flaeche(P.weiss)} />
        {/* the visor: one big blue window */}
        <path d="M-26 -28 Q0 -34 26 -28 Q30 -14 24 -6 Q0 -2 -24 -6 Q-30 -14 -26 -28 Z" {...flaeche(P.blau, 2.5)} />
        <Hell d="M-19 -22 Q-10 -25 -4 -24" farbe={P.blauHell} breite={3.5} />
        <path d="M-42 -2 Q0 -10 42 -2 L42 10 Q0 2 -42 10 Z" {...flaeche(P.metall)} />
      </g>
    ),
  },
  {
    id: 'eiskrone',
    name: 'Eiskrone',
    platz: 'hut',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-42, -66, 84, 80],
    weite: 73,
    zeichnung: (zeit) => (
      <g>
        <path d="M-32 -4 L-28 -32 L-14 -14 L0 -60 L14 -14 L28 -32 L32 -4 Z" {...flaeche(P.eis)} />
        <Tief d="M0 -60 L14 -14 L28 -32 L32 -4 L8 -4 Z" farbe={P.eisTief} deckkraft={0.7} />
        <rect x={-36} y={-6} width={72} height={14} rx={6} {...flaeche(P.gold)} />
        <path d="M-32 6 L36 6 L36 2 Q0 0 -32 2 Z" fill={P.goldTief} opacity={0.5} />
        <path d="M0 -4 l6 6 -6 6 -6 -6 Z" fill={P.rot} stroke={P.rot} strokeWidth={1.5} strokeLinejoin="round" />
        <Funkeln x={-26} y={-40} r={7} zeit={zeit} />
        <Funkeln x={24} y={-42} r={6} zeit={zeit} versatz={2.5} />
      </g>
    ),
  },
  // Own parts the teacher made on the teacher page (lq_teil, eigen): drawn here by their id, so they show as vectors.
  {
    id: 'e97c799d057',
    name: 'Crowns Guard Helmet',
    platz: 'hut',
    haube: true,
    seltenheit: 3,
    rahmen: [-50, -76, 100, 92],
    weite: 85,
    zeichnung: () => (
      <g>
        {/* red plume behind */}
        <path d="M-2 -46 Q-8 -70 10 -74 Q30 -74 38 -58 Q24 -64 16 -58 Q30 -54 34 -40 Q20 -50 8 -44 Z" {...flaeche(P.rot, 2.5)} />
        {/* steel dome with cheek guards */}
        <path d="M-44 14 L-44 -10 Q-44 -50 0 -52 Q44 -50 44 -10 L44 14 Q36 18 32 10 L32 -2 L-32 -2 L-32 10 Q-36 18 -44 14 Z" {...flaeche(P.metall)} />
        <Tief d="M18 -48 Q44 -40 44 -10 L44 14 Q38 16 34 12 Q36 -24 18 -48 Z" farbe={P.metallTief} deckkraft={0.6} />
        <Hell d="M-32 -18 Q-28 -38 -10 -44" farbe={P.metallHell} />
        {/* gold crown band with a blue star */}
        <path d="M-40 -2 L-40 -18 L-30 -12 L-20 -26 L-8 -14 L0 -30 L8 -14 L20 -26 L30 -12 L40 -18 L40 -2 Z" {...flaeche(P.gold, 2.5)} />
        <path d={stern(0, -12, 7)} fill={P.blau} stroke={P.blau} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
    ),
  },
  {
    id: 'e48100506fe',
    name: 'Militärhelm',
    platz: 'hut',
    haube: true,
    seltenheit: 2,
    rahmen: [-66, -56, 132, 108],
    weite: 106,
    zeichnung: () => (
      <g>
        {/* headset: band behind the helmet, two ear cups */}
        <path d="M-52 36 Q-60 0 -46 -20 M52 36 Q60 0 46 -20" {...GEIST} stroke={P.grau} strokeWidth={7} />
        <path d="M-50 10 Q-46 -50 0 -52 Q46 -50 50 10 Q0 0 -50 10 Z" {...flaeche(P.oliv)} />
        <Tief d="M20 -48 Q48 -36 50 10 Q40 7 32 6 Q36 -22 20 -48 Z" farbe={P.olivTief} deckkraft={0.7} />
        <Hell d="M-34 -14 Q-30 -36 -12 -44" farbe={P.gruenHell} />
        <path d="M-52 10 Q0 -2 52 10" {...GEIST} stroke={P.metallTief} strokeWidth={5} />
        {[-54, 54].map((x) => (
          <ellipse key={x} cx={x} cy={38} rx={11} ry={14} {...flaeche(P.grau)} />
        ))}
      </g>
    ),
  },
  // — 13.11.2026 (supabase/migrations/20261129_lernquest_neue_teile.sql): one per rarity. —
  {
    id: 'baskenmuetze',
    name: 'Baskenmütze',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-48, -46, 96, 56],
    weite: 78,
    zeichnung: () => (
      <g transform="rotate(-8)">
        <path d="M2 -38 L4 -47" {...GEIST} stroke={P.blauTief} strokeWidth={6} />
        <path d="M-44 -4 Q-48 -34 -4 -38 Q42 -40 46 -12 Q44 2 2 4 Q-40 6 -44 -4 Z" {...flaeche(P.blauTief)} />
        <Tief d="M20 -36 Q44 -30 46 -12 Q44 0 24 2 Q34 -16 20 -36 Z" farbe={P.tinteTief} />
        <Hell d="M-32 -20 Q-24 -32 -8 -34" farbe={P.blau} breite={4} />
      </g>
    ),
  },
  {
    id: 'propellermuetze',
    name: 'Propellermütze',
    platz: 'hut',
    haube: true,
    seltenheit: 2,
    bewegt: true,
    rahmen: [-46, -70, 92, 80],
    weite: 79,
    zeichnung: (zeit) => {
      // The propeller turns: its blade gets short and long (seen from the side).
      const k = Math.cos(zeit * 14);
      return (
        <g>
          <path d="M-38 -2 Q-40 -44 0 -46 Q40 -44 38 -2 Z" {...flaeche(P.rot)} />
          <path d="M-38 -2 Q-39.6 -36.4 -13 -44 L-13 -2 Z" {...flaeche(P.blau)} />
          <path d="M13 -44 Q39.6 -36.4 38 -2 L13 -2 Z" {...flaeche(P.gelb)} />
          <path d="M-6 -2 Q30 -6 48 4 Q30 10 -6 6 Z" {...flaeche(P.gruen, 2.5)} />
          <rect x={-2.5} y={-58} width={5} height={13} {...flaeche(P.metall, 2.5)} />
          <ellipse cx={0} cy={-60} rx={26 * Math.abs(k) + 3} ry={5} {...flaeche(P.gelb, 2.5)} />
          <circle cx={0} cy={-60} r={4.5} {...flaeche(P.blau, 2.5)} />
        </g>
      );
    },
  },
  {
    id: 'detektivhut',
    name: 'Detektivhut',
    platz: 'hut',
    haube: true,
    seltenheit: 3,
    rahmen: [-56, -54, 112, 68],
    weite: 72,
    zeichnung: () => (
      <g>
        {/* Deerstalker: a low dome with a big peak front and back, a few broad check stripes, a bow on top */}
        <path d="M-58 4 Q-46 -10 -28 -6 L-28 8 Q-44 12 -58 4 Z M58 4 Q46 -10 28 -6 L28 8 Q44 12 58 4 Z" {...flaeche(P.holzTief)} />
        <path d="M-34 6 Q-36 -36 0 -38 Q36 -36 34 6 Z" {...flaeche(P.sandTief)} />
        <path d="M-14 -37 V6 M14 -37 V6 M-34 -12 Q0 -18 34 -12" {...GEIST} stroke={P.holz} strokeWidth={6} opacity={0.75} />
        <Tief d="M20 -32 Q34 -24 34 6 L22 6 Q26 -14 20 -32 Z" farbe={P.holzTief} deckkraft={0.5} />
        <path d="M-10 -44 Q0 -52 10 -44 Q0 -38 -10 -44 Z" {...flaeche(P.leder)} />
        {/* Selten: a metal buckle on the front (rarity standard, 27.11.2026) */}
        <rect x={-8} y={-10} width={16} height={11} rx={2.5} {...flaeche(P.metall, 2)} />
        <rect x={-3.5} y={-6.5} width={7} height={4} rx={1.5} fill={P.metallTief} />
      </g>
    ),
  },
  {
    id: 'federkrone',
    name: 'Federkrone',
    platz: 'hut',
    seltenheit: 4,
    bewegt: true,
    rahmen: [-50, -92, 100, 100],
    weite: 83,
    zeichnung: (zeit) => {
      const federn: [number, string][] = [
        [-44, P.rot],
        [-22, P.orange],
        [0, P.gelb],
        [22, P.blau],
        [44, P.lila],
      ];
      return (
        <g>
          {federn.map(([w, f], i) => (
            <g key={w} transform={`rotate(${(w + Math.sin(zeit * 2 + i) * 3).toFixed(1)} 0 -6)`}>
              <path d="M0 -6 Q-14 -40 0 -80 Q14 -40 0 -6 Z" {...flaeche(f, 2.5)} />
            </g>
          ))}
          <rect x={-40} y={-10} width={80} height={16} rx={8} {...flaeche(P.gold)} />
          <path d="M0 -12 l7 7 -7 7 -7 -7 Z" fill={P.tuerkis} stroke={P.tuerkis} strokeWidth={1.5} strokeLinejoin="round" />
          <Funkeln x={-14} y={-60} r={6} zeit={zeit} />
        </g>
      );
    },
  },
  {
    id: 'phoenixkrone',
    name: 'Phönixkrone',
    platz: 'hut',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-56, -76, 112, 86],
    weite: 68,
    zeichnung: (zeit) => {
      const f = (k: number) => 1 + Math.sin(zeit * 8 + k) * 0.08;
      return (
        <g>
          {/* flame wings on both sides, flickering */}
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 30} -10) scale(${s * f(s)} ${f(s + 1)})`}>
              <path d="M0 0 Q18 -10 26 -40 Q14 -32 12 -44 Q4 -28 0 -36 Q-4 -18 0 0 Z" {...flaeche(P.lava, 2.5)} />
            </g>
          ))}
          <path d="M-32 6 L-34 -24 L-18 -10 L0 -36 L18 -10 L34 -24 L32 6 Z" {...flaeche(P.gold)} />
          <Tief d="M18 -10 L34 -24 L32 6 L16 6 Z" farbe={P.goldTief} deckkraft={0.5} />
          <g transform={`translate(0 -54) scale(${f(3).toFixed(3)})`}>
            <path d="M0 12 Q-14 -2 -5 -18 Q-2 -9 2 -13 Q4 -24 0 -30 Q18 -16 11 3 Q8 10 0 12 Z" {...flaeche(P.lava, 2.5)} />
            <path d="M0 7 Q-6 -1 -1 -9 Q2 -3 5 -5 Q8 2 0 7 Z" fill={P.gelb} />
          </g>
          <path d="M0 -8 l6 6 -6 6 -6 -6 Z" fill={P.rot} stroke={P.rot} strokeWidth={1.5} strokeLinejoin="round" />
          <Funkeln x={-24} y={-22} r={6} zeit={zeit} />
          <Funkeln x={26} y={-28} r={5} zeit={zeit} versatz={2.4} />
        </g>
      );
    },
  },
  // — 26.11.2026 (supabase/migrations/20261205_lernquest_welten_teile.sql): the worlds of the map. —
  {
    id: 'pilzhut',
    name: 'Pilzhut',
    platz: 'hut',
    haube: true,
    seltenheit: 1,
    rahmen: [-56, -58, 112, 70],
    weite: 90,
    zeichnung: () => (
      <g>
        {/* Toadstool: a wide red cap over a pale rim, three big white dots */}
        <path d="M-48 0 Q0 -10 48 0 Q42 10 0 10 Q-42 10 -48 0 Z" {...flaeche(P.sand)} />
        <path d="M-52 2 Q-54 -50 0 -54 Q54 -50 52 2 Q0 -10 -52 2 Z" {...flaeche(P.rot)} />
        <Tief d="M18 -50 Q52 -40 52 2 Q42 -1 32 -3 Q36 -28 18 -50 Z" farbe={P.rotTief} />
        <Hell d="M-38 -16 Q-34 -36 -16 -45" farbe={P.backe} />
        <circle cx={-20} cy={-27} r={8} {...flaeche(P.schnee)} />
        <circle cx={9} cy={-40} r={7} {...flaeche(P.schnee)} />
        <circle cx={30} cy={-17} r={6} {...flaeche(P.schnee)} />
      </g>
    ),
  },
  {
    id: 'antennenreif',
    name: 'Antennenreif',
    platz: 'hut',
    seltenheit: 2,
    bewegt: true,
    rahmen: [-54, -84, 108, 110],
    weite: 83,
    zeichnung: (zeit) => {
      // An alien headband: a band over the hair, two antennae that wobble a little, green bobbles on top.
      const w = Math.sin(zeit * 3) * 5;
      return (
        <g>
          <path d="M-50 22 Q-52 -18 0 -20 Q52 -18 50 22" {...GEIST} stroke={P.lila} strokeWidth={10} />
          {[-1, 1].map((s) => (
            <g key={s} transform={`rotate(${(s * 6 + w).toFixed(1)} ${s * 14} -19)`}>
              <path d={`M${s * 14} -19 Q${s * 16} -40 ${s * 22} -56`} {...GEIST} stroke={P.lila} strokeWidth={7} />
              <circle cx={s * 22} cy={-63} r={11} {...flaeche(P.gruenHell)} />
              <path d={`M${s * 22 + 2} -56 A8 8 0 0 0 ${s * 22 + 8} -61`} {...GEIST} stroke={P.gruen} strokeWidth={3} />
              <circle cx={s * 22 - 3} cy={-66} r={2.6} fill={P.wieseHell} />
            </g>
          ))}
        </g>
      );
    },
  },
  {
    id: 'kapitaensmuetze',
    name: 'Kapitänsmütze',
    platz: 'hut',
    haube: true,
    seltenheit: 3,
    rahmen: [-50, -52, 100, 68],
    weite: 76,
    zeichnung: () => (
      <g>
        {/* White crown, wider at the top, a navy band, a black peak and a gold badge with an anchor */}
        <path d="M-36 -2 Q-50 -26 -42 -40 Q0 -52 42 -40 Q50 -26 36 -2 Z" {...flaeche(P.wolke)} />
        <Tief d="M18 -47 Q44 -42 46 -32 Q46 -16 36 -2 L22 -2 Q32 -24 18 -47 Z" farbe={P.wolkeTief} deckkraft={1} />
        <Hell d="M-36 -33 Q-18 -42 4 -44" farbe={P.wolkeHell} />
        <rect x={-38} y={-13} width={76} height={14} rx={6} {...flaeche(P.blauTief)} />
        <Flaeche d="M-36 0 Q0 -4 36 0 Q30 14 0 14 Q-30 14 -36 0 Z" farbe={P.dunkel} hell={P.dunkelHell} />
        <ellipse cx={0} cy={-27} rx={11} ry={10} {...flaeche(P.gold, 2.5)} />
        <path d="M0 -33 V-20 M-6 -25 Q0 -18 6 -25 M-4 -31 H4" {...GEIST} stroke={P.blauTief} strokeWidth={2.5} />
      </g>
    ),
  },
  {
    id: 'pharaonenhaube',
    name: 'Pharaonenhaube',
    platz: 'hut',
    haube: true,
    seltenheit: 4,
    bewegt: true,
    rahmen: [-64, -54, 128, 126],
    weite: 96,
    zeichnung: (zeit) => (
      <g>
        {/* Nemes: gold cloth with blue stripes over the head, a flap down beside each cheek, a cobra on the brow */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`scale(${s} 1)`}>
            <path d="M40 -6 L60 62 Q50 70 40 64 L33 8 Z" {...flaeche(P.gold)} />
            <path d="M37 19 L45 17 M39 35 L49 32 M41 51 L54 48" {...GEIST} stroke={P.blauTief} strokeWidth={5} />
          </g>
        ))}
        <path d="M-46 10 Q-52 -44 0 -48 Q52 -44 46 10 Q0 2 -46 10 Z" {...flaeche(P.gold)} />
        <path d="M-30 -36 Q-20 -12 -21 4 M-11 -45 Q-7 -16 -7 2 M11 -45 Q7 -16 7 2 M30 -36 Q20 -12 21 4" {...GEIST} stroke={P.blauTief} strokeWidth={6} />
        <Tief d="M22 -43 Q48 -34 46 10 Q38 6 31 5 Q34 -20 22 -43 Z" farbe={P.goldTief} deckkraft={0.5} />
        <rect x={-46} y={0} width={92} height={12} rx={5} {...flaeche(P.goldTief)} />
        <path d="M-6 6 Q-9 -10 0 -17 Q9 -10 6 6 Z" {...flaeche(P.gold, 2.5)} />
        <path d="M0 -10 l4 4 -4 4 -4 -4 Z" fill={P.rot} stroke={P.rot} strokeWidth={1.5} strokeLinejoin="round" />
        {/* Episch: a sparkle on the gold (rarity standard, 27.11.2026) */}
        <Funkeln x={-26} y={-40} r={7} zeit={zeit} />
      </g>
    ),
  },
  {
    id: 'flammenkrone',
    name: 'Flammenkrone',
    platz: 'hut',
    seltenheit: 5,
    bewegt: true,
    rahmen: [-50, -94, 100, 106],
    weite: 77,
    zeichnung: (zeit) => {
      // A crown of black volcanic stone on a gold band: the cracks glow, a flame burns on each point.
      const f = (k: number) => (1 + Math.sin(zeit * 9 + k) * 0.12).toFixed(3);
      const glut = (0.65 + Math.sin(zeit * 2.4) * 0.3).toFixed(2);
      const flamme = (x: number, y: number, s: number, k: number) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s}) scale(1 ${f(k)})`}>
          <path d="M0 0 Q-14 -8 -9 -24 Q-6 -16 -2 -18 Q-4 -32 3 -40 Q5 -30 10 -28 Q16 -14 9 -4 Q6 0 0 0 Z" {...flaeche(P.lava, 2.5)} />
          <path d="M0 -3 Q-7 -8 -4 -17 Q0 -12 3 -15 Q8 -8 4 -4 Z" fill={P.gelb} />
        </g>
      );
      return (
        <g>
          {flamme(-35, -27, 0.75, 0)}
          {flamme(35, -27, 0.75, 2)}
          {flamme(0, -41, 1.05, 4)}
          <Flaeche d="M-36 4 L-38 -30 L-20 -16 L0 -44 L20 -16 L38 -30 L36 4 Z" farbe={P.dunkel} hell={P.dunkelHell} />
          <path d="M-27 -16 L-20 -8 L-25 -1 M12 -26 L6 -14 L13 -6" {...GEIST} stroke={P.lava} strokeWidth={3.5} strokeLinejoin="round" opacity={glut} />
          <rect x={-40} y={-4} width={80} height={14} rx={6} {...flaeche(P.gold)} />
          <path d="M-36 8 Q0 11 36 8 L36 4 Q0 6 -36 4 Z" fill={P.goldTief} opacity={0.6} />
          <path d="M0 -4 l7 7 -7 7 -7 -7 Z" fill={P.rot} stroke={P.rot} strokeWidth={1.5} strokeLinejoin="round" />
          <Funkeln x={-28} y={-50} r={6} zeit={zeit} />
          <Funkeln x={30} y={-54} r={5} zeit={zeit} versatz={2.4} />
        </g>
      );
    },
  },
];
