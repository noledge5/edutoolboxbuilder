// Hats of the hero (slot `kopf` in src/lernquest/teile.ts), on the anchor `hut`.
// Rarity shows in the material: wool, cloth, leather; then metal; then colour with a star; then gold and gems.
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Item } from './typen';
import { Funkeln, stern } from './zeichnen';

const GEIST = { fill: 'none', strokeLinecap: 'round' } as const;

export const KOPF_ITEMS: Item[] = [
  {
    id: 'wollmuetze',
    name: 'Wollmütze',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-46, -64, 92, 76],
    zeichnung: () => (
      <g>
        <path d="M-38 -2 Q-42 -44 0 -46 Q42 -44 38 -2 Z" fill={P.rot} />
        <path d="M16 -42 Q40 -34 38 -2 L20 -2 Q24 -24 16 -42 Z" fill={P.rotTief} opacity={0.5} />
        <path d="M-38 -2 Q-42 -44 0 -46 Q42 -44 38 -2 Z" fill="none" {...UMRISS} />
        <path d="M-26 -12 Q-24 -32 -10 -40" {...GEIST} stroke={P.backe} strokeWidth={4} />
        <path d="M-18 -42 L-18 -8 M-6 -46 L-6 -8 M6 -46 L6 -8 M18 -42 L18 -8" {...GEIST} stroke={P.rotTief} strokeWidth={1.8} opacity={0.6} />
        <path d="M-43 -6 Q0 -14 43 -6 L44 8 Q0 0 -44 8 Z" fill={P.rotTief} {...UMRISS} />
        <path d="M-36 -2 Q0 -9 36 -2" {...GEIST} stroke={P.rot} strokeWidth={2.5} />
        <circle cx={0} cy={-54} r={11} fill={P.weiss} {...UMRISS} />
        <path d="M-5 -58 Q-2 -62 3 -61" {...GEIST} stroke={P.creme} strokeWidth={3} />
        <path d="M3 -50 Q9 -52 10 -57" {...GEIST} stroke={P.grauHell} strokeWidth={2} />
      </g>
    ),
  },
  {
    id: 'stirnband',
    name: 'Stirnband',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-54, 0, 128, 40],
    zeichnung: () => (
      <g>
        <path d="M48 16 Q62 4 76 12 Q68 16 66 22 Q60 18 50 20 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M48 20 Q60 28 72 38 Q64 38 60 34 Q56 36 48 26 Z" fill={P.rotTief} {...UMRISS_FEIN} />
        <path d="M-52 10 Q0 3 52 10 L52 24 Q0 17 -52 24 Z" fill={P.rot} />
        <path d="M24 13 Q40 12 52 10 L52 24 Q36 20 20 19 Z" fill={P.rotTief} opacity={0.5} />
        <path d="M-52 10 Q0 3 52 10 L52 24 Q0 17 -52 24 Z" fill="none" {...UMRISS} />
        <path d="M-40 11 Q-20 7 -2 8" {...GEIST} stroke={P.backe} strokeWidth={3} />
        <path d="M-38 19 Q-10 15 18 17" {...GEIST} stroke={P.rotTief} strokeWidth={1.6} strokeDasharray="3 3.5" />
        <ellipse cx={50} cy={17} rx={6} ry={7.5} fill={P.rotTief} {...UMRISS_FEIN} />
      </g>
    ),
  },
  {
    id: 'ritterhelm',
    name: 'Ritterhelm',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-60, -62, 120, 106],
    zeichnung: () => (
      <g>
        <path d="M-6 -44 Q10 -66 28 -56 Q14 -54 8 -42 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M-44 6 L-54 8 L-58 34 L-50 42 L-44 30 Z" fill={P.metall} {...UMRISS_FEIN} />
        <path d="M44 6 L54 8 L58 34 L50 42 L44 30 Z" fill={P.metall} {...UMRISS_FEIN} />
        <path d="M50 14 L56 14 L56 34 L51 38 Z" fill={P.metallTief} opacity={0.5} />
        <path d="M-38 12 Q-42 -40 0 -44 Q42 -40 38 12 Z" fill={P.metall} />
        <path d="M14 -40 Q40 -30 38 12 L20 12 Q24 -18 14 -40 Z" fill={P.metallTief} opacity={0.55} />
        <path d="M-38 12 Q-42 -40 0 -44 Q42 -40 38 12 Z" fill="none" {...UMRISS} />
        <path d="M-27 -6 Q-26 -28 -8 -37" {...GEIST} stroke={P.metallHell} strokeWidth={5} />
        <path d="M-5 -44 L5 -44 L5 4 L-5 4 Z" fill={P.metallTief} {...UMRISS_FEIN} />
        <path d="M-42 0 Q0 -8 42 0 L42 12 Q0 4 -42 12 Z" fill={P.metallTief} {...UMRISS} />
        {[-30, -16, 16, 30].map((x) => (
          <circle key={x} cx={x} cy={5} r={2.2} fill={P.metallHell} stroke={P.linie} strokeWidth={1.2} />
        ))}
      </g>
    ),
  },
  {
    id: 'entdeckerhut',
    name: 'Entdeckerhut',
    platz: 'hut',
    seltenheit: 2,
    rahmen: [-58, -50, 116, 64],
    zeichnung: () => (
      <g>
        <ellipse cx={0} cy={4} rx={56} ry={11} fill={P.sandTief} {...UMRISS} />
        <path d="M-46 4 Q0 -4 46 4" {...GEIST} stroke={P.sand} strokeWidth={2.5} />
        <path d="M-30 2 Q-34 -30 -22 -40 Q-10 -46 0 -40 Q12 -46 22 -40 Q34 -30 30 2 Q0 8 -30 2 Z" fill={P.sand} />
        <path d="M18 -38 Q34 -28 30 2 Q20 5 12 5 Q20 -14 18 -38 Z" fill={P.sandTief} opacity={0.55} />
        <path d="M-30 2 Q-34 -30 -22 -40 Q-10 -46 0 -40 Q12 -46 22 -40 Q34 -30 30 2 Q0 8 -30 2 Z" fill="none" {...UMRISS} />
        <path d="M-24 -10 Q-26 -28 -18 -35" {...GEIST} stroke={P.sandHell} strokeWidth={4} />
        <path d="M-31 -9 Q0 -3 31 -9 L30 1 Q0 7 -30 1 Z" fill={P.leder} {...UMRISS_FEIN} />
        <path d="M-26 -6 Q-10 -3 4 -4" {...GEIST} stroke={P.lederHell} strokeWidth={1.8} />
        <rect x={10} y={-9} width={10} height={11} rx={2} fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
        <rect x={13.5} y={-5.5} width={3} height={4} fill={P.lederTief} />
      </g>
    ),
  },
  {
    id: 'piratenhut',
    name: 'Piratenhut',
    platz: 'hut',
    seltenheit: 2,
    rahmen: [-60, -50, 120, 60],
    zeichnung: () => (
      <g>
        <path d="M-56 8 L-46 -26 Q-22 -38 0 -34 Q22 -38 46 -26 L56 8 Q30 -4 0 -3 Q-30 -4 -56 8 Z" fill={P.dunkel} />
        <path d="M24 -32 Q40 -30 46 -26 L56 8 Q40 0 24 -2 Z" fill={P.dunkelTief} opacity={0.6} />
        <path d="M-56 8 L-46 -26 Q-22 -38 0 -34 Q22 -38 46 -26 L56 8 Q30 -4 0 -3 Q-30 -4 -56 8 Z" fill="none" {...UMRISS} />
        <path d="M-40 -24 Q-24 -32 -8 -30" {...GEIST} stroke={P.dunkelHell} strokeWidth={4} />
        <path d="M-53 4 Q-30 -7 0 -7 Q30 -7 53 4" {...GEIST} stroke={P.gold} strokeWidth={3.5} />
        <path d="M-44 -22 Q-30 -28 -14 -28" {...GEIST} stroke={P.goldTief} strokeWidth={0} />
        <path d="M-9 -22 Q-9 -32 0 -32 Q9 -32 9 -22 Q9 -17 5 -16 L5 -12 L-5 -12 L-5 -16 Q-9 -17 -9 -22 Z" fill={P.weiss} {...UMRISS_FEIN} />
        <circle cx={-3.4} cy={-23} r={2.2} fill={P.auge} />
        <circle cx={3.4} cy={-23} r={2.2} fill={P.auge} />
        <path d="M-2 -17 L0 -19 L2 -17" {...GEIST} stroke={P.auge} strokeWidth={1.4} />
        <path d="M-1.5 -16 L-1.5 -12.5 M1.5 -16 L1.5 -12.5" {...GEIST} stroke={P.grauHell} strokeWidth={1.4} />
      </g>
    ),
  },
  {
    id: 'kappe',
    name: 'Schirmmütze',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-44, -50, 106, 64],
    zeichnung: () => (
      <g>
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" fill={P.blau} />
        <path d="M16 -38 Q42 -30 40 6 L22 6 Q26 -18 16 -38 Z" fill={P.blauTief} opacity={0.5} />
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" fill="none" {...UMRISS} />
        <path d="M-28 -6 Q-28 -28 -10 -37" {...GEIST} stroke={P.blauHell} strokeWidth={5} />
        <path d="M0 -42 Q-8 -20 -6 4" {...GEIST} stroke={P.blauTief} strokeWidth={2} />
        <circle cx={0} cy={-42} r={4} fill={P.blauTief} {...UMRISS_FEIN} />
        <path d="M-42 0 Q0 -6 42 0 L42 8 Q0 2 -42 8 Z" fill={P.blauTief} {...UMRISS_FEIN} />
        <path d="M6 -2 Q40 -8 60 6 Q56 14 36 14 Q18 12 6 8 Z" fill={P.rot} {...UMRISS} />
        <path d="M20 8 Q40 6 56 10 Q50 14 36 14 Q26 12 20 8 Z" fill={P.rotTief} opacity={0.5} />
        <path d="M14 1 Q34 -3 50 4" {...GEIST} stroke={P.backe} strokeWidth={2.5} />
        <path d={stern(-12, -18, 6)} fill={P.weiss} stroke={P.linie} strokeWidth={1.4} strokeLinejoin="round" />
      </g>
    ),
  },
  {
    id: 'wikingerhelm',
    name: 'Wikingerhelm',
    platz: 'hut',
    seltenheit: 2,
    rahmen: [-66, -60, 132, 76],
    zeichnung: () => (
      <g>
        <path d="M-32 -12 Q-62 -10 -60 -54 Q-54 -30 -42 -26 Q-30 -22 -24 -24 Z" fill={P.creme} {...UMRISS} />
        <path d="M-56 -36 Q-52 -30 -44 -27 L-48 -20 Q-58 -24 -58 -44 Z" fill={P.sandTief} opacity={0.5} />
        <path d="M32 -12 Q62 -10 60 -54 Q54 -30 42 -26 Q30 -22 24 -24 Z" fill={P.creme} {...UMRISS} />
        <path d="M56 -36 Q52 -30 44 -27 L48 -20 Q58 -24 58 -44 Z" fill={P.sandTief} opacity={0.5} />
        <path d="M-60 -54 Q-58 -48 -56 -42 M60 -54 Q58 -48 56 -42" {...GEIST} stroke={P.sandTief} strokeWidth={4} />
        <path d="M-38 8 Q-42 -36 0 -40 Q42 -36 38 8 Z" fill={P.metall} />
        <path d="M14 -36 Q40 -28 38 8 L20 8 Q24 -16 14 -36 Z" fill={P.metallTief} opacity={0.55} />
        <path d="M-38 8 Q-42 -36 0 -40 Q42 -36 38 8 Z" fill="none" {...UMRISS} />
        <path d="M-27 -6 Q-26 -26 -8 -34" {...GEIST} stroke={P.metallHell} strokeWidth={5} />
        <path d="M-42 -2 Q0 -10 42 -2 L42 10 Q0 2 -42 10 Z" fill={P.metallTief} {...UMRISS} />
        {[-28, -14, 0, 14, 28].map((x) => (
          <circle key={x} cx={x} cy={3} r={2.2} fill={P.metallHell} stroke={P.linie} strokeWidth={1.2} />
        ))}
      </g>
    ),
  },
  {
    id: 'kochmuetze',
    name: 'Kochmütze',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-52, -66, 104, 76],
    zeichnung: () => (
      <g>
        <path d="M-30 6 L-32 -10 Q-54 -14 -46 -36 Q-42 -52 -22 -48 Q-10 -64 6 -54 Q28 -60 38 -42 Q56 -30 36 -10 L32 6 Z" fill={P.weiss} />
        <path d="M34 -38 Q54 -28 36 -10 L32 6 L16 6 Q30 -8 24 -26 Q30 -30 34 -38 Z" fill={P.grauHell} opacity={0.5} />
        <path d="M-30 6 L-32 -10 Q-54 -14 -46 -36 Q-42 -52 -22 -48 Q-10 -64 6 -54 Q28 -60 38 -42 Q56 -30 36 -10 L32 6 Z" fill="none" {...UMRISS} />
        <path d="M-20 -14 Q-20 -30 -16 -42 M2 -14 Q4 -30 0 -46" {...GEIST} stroke={P.grauHell} strokeWidth={2} />
        <path d="M-40 -28 Q-36 -42 -26 -42" {...GEIST} stroke={P.schnee} strokeWidth={4} />
        <path d="M-34 -8 Q0 -2 34 -8 L36 6 Q0 12 -36 6 Z" fill={P.schnee} {...UMRISS} />
        <path d="M-28 -2 Q-12 1 4 0" {...GEIST} stroke={P.grauHell} strokeWidth={2} />
      </g>
    ),
  },
  {
    id: 'cowboyhut',
    name: 'Cowboyhut',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-62, -48, 124, 62],
    zeichnung: () => (
      <g>
        <path d="M-60 -6 Q-54 -18 -36 -8 Q0 2 36 -8 Q54 -18 60 -6 Q52 12 0 11 Q-52 12 -60 -6 Z" fill={P.leder} />
        <path d="M20 4 Q50 -2 60 -6 Q52 12 0 11 Q10 8 20 4 Z" fill={P.lederTief} opacity={0.55} />
        <path d="M-60 -6 Q-54 -18 -36 -8 Q0 2 36 -8 Q54 -18 60 -6 Q52 12 0 11 Q-52 12 -60 -6 Z" fill="none" {...UMRISS} />
        <path d="M-52 -8 Q-46 -12 -40 -8" {...GEIST} stroke={P.lederHell} strokeWidth={2.5} />
        <path d="M-30 0 Q-36 -28 -24 -42 Q-12 -34 0 -37 Q12 -34 24 -42 Q36 -28 30 0 Q0 6 -30 0 Z" fill={P.lederHell} />
        <path d="M20 -38 Q36 -26 30 0 Q22 3 14 4 Q22 -14 20 -38 Z" fill={P.lederTief} opacity={0.55} />
        <path d="M-30 0 Q-36 -28 -24 -42 Q-12 -34 0 -37 Q12 -34 24 -42 Q36 -28 30 0 Q0 6 -30 0 Z" fill="none" {...UMRISS} />
        <path d="M-25 -12 Q-27 -28 -21 -36" {...GEIST} stroke={P.holz} strokeWidth={4} />
        <path d="M-31 -9 Q0 -3 31 -9 L30 1 Q0 7 -30 1 Z" fill={P.lederTief} {...UMRISS_FEIN} />
        <path d={stern(0, -3, 5)} fill={P.gold} stroke={P.goldTief} strokeWidth={1.4} strokeLinejoin="round" />
      </g>
    ),
  },
  {
    id: 'raumhelm',
    name: 'Raumhelm',
    platz: 'hut',
    seltenheit: 3,
    rahmen: [-46, -74, 98, 88],
    zeichnung: () => (
      <g>
        <path d="M26 -34 Q28 -48 32 -58" {...GEIST} stroke={P.linie} strokeWidth={7} />
        <path d="M26 -34 Q28 -48 32 -58" {...GEIST} stroke={P.metallTief} strokeWidth={3} />
        <circle cx={32} cy={-62} r={6} fill={P.rot} {...UMRISS_FEIN} />
        <circle cx={30} cy={-64} r={1.8} fill={P.weiss} />
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" fill={P.weiss} />
        <path d="M16 -38 Q44 -30 40 6 L22 6 Q26 -18 16 -38 Z" fill={P.grauHell} opacity={0.55} />
        <path d="M-40 6 Q-44 -38 0 -42 Q44 -38 40 6 Z" fill="none" {...UMRISS} />
        <path d="M-30 -6 Q-30 -26 -14 -36" {...GEIST} stroke={P.schnee} strokeWidth={0} />
        <path d="M-25 -26 Q-12 -26 0 -26 Q12 -26 25 -26 Q28 -14 24 -6 Q0 -2 -24 -6 Q-28 -14 -25 -26 Z" fill={P.blau} {...UMRISS_FEIN} />
        <path d="M-20 -22 Q-10 -23 -4 -22" {...GEIST} stroke={P.blauHell} strokeWidth={3.5} />
        <path d="M-42 -2 Q0 -10 42 -2 L42 10 Q0 2 -42 10 Z" fill={P.metall} {...UMRISS} />
        <path d="M-34 1 Q-20 -3 -8 -3" {...GEIST} stroke={P.metallHell} strokeWidth={2.5} />
        <path d={stern(0, 4, 6)} fill={P.gold} stroke={P.goldTief} strokeWidth={1.4} strokeLinejoin="round" />
        <path d="M-27 -2 l5 4.5 -5 4.5 -5 -4.5 Z" fill={P.blauHell} stroke={P.blauTief} strokeWidth={1.4} />
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
    zeichnung: (zeit) => (
      <g>
        <path d="M-32 -4 L-30 -32 L-18 -12 L-12 -42 L-4 -14 L0 -58 L4 -14 L12 -42 L18 -12 L30 -32 L32 -4 Z" fill={P.eis} />
        <path d="M0 -58 L4 -14 L12 -42 L18 -12 L30 -32 L32 -4 L10 -4 Z" fill={P.eisTief} opacity={0.5} />
        <path d="M-32 -4 L-30 -32 L-18 -12 L-12 -42 L-4 -14 L0 -58 L4 -14 L12 -42 L18 -12 L30 -32 L32 -4 Z" fill="none" {...UMRISS} />
        <path d="M-27 -10 L-27 -24 M-13 -16 L-11 -32 M-3 -22 L-1 -44" {...GEIST} stroke={P.eisHell} strokeWidth={3.5} />
        <path d="M-35 6 L35 6 L35 -6 L-35 -6 Z" fill={P.gold} {...UMRISS} />
        <path d="M-31 -2 L10 -2" {...GEIST} stroke={P.goldHell} strokeWidth={2.5} />
        <path d="M16 6 L35 6 L35 -6 L22 -6 Z" fill={P.goldTief} opacity={0.5} />
        {[
          [-20, P.blau, P.blauTief],
          [0, P.rot, P.rotTief],
          [20, P.blau, P.blauTief],
        ].map(([x, f, t]) => (
          <g key={x as number}>
            <path d={`M${x} -6 l5 5 -5 5 -5 -5 Z`} fill={f as string} stroke={t as string} strokeWidth={1.5} />
            <path d={`M${(x as number) - 1.8} -2.5 l1.8 -1.8`} stroke={P.weiss} strokeWidth={1.4} strokeLinecap="round" />
          </g>
        ))}
        <Funkeln x={-24} y={-38} r={7} zeit={zeit} />
        <Funkeln x={22} y={-40} r={6} zeit={zeit} versatz={2.5} />
      </g>
    ),
  },
  // Own parts the teacher made on the teacher page (lq_teil, eigen): drawn here by their id, so they show as vectors.
  {
    id: 'e97c799d057',
    name: 'Crowns Guard Helmet',
    platz: 'hut',
    seltenheit: 3,
    rahmen: [-50, -76, 100, 92],
    zeichnung: () => (
      <g>
        {/* Red plume behind */}
        <path d="M-2 -46 Q-8 -70 10 -74 Q30 -74 38 -58 Q24 -64 16 -58 Q30 -54 34 -40 Q20 -50 8 -44 Z" fill={P.rot} {...UMRISS_FEIN} />
        <path d="M6 -66 Q18 -70 28 -62" fill="none" stroke={P.backe} strokeWidth={2.5} strokeLinecap="round" />
        {/* Steel dome with cheek guards */}
        <path d="M-44 14 L-44 -10 Q-44 -50 0 -52 Q44 -50 44 -10 L44 14 Q36 18 32 10 L32 -2 L-32 -2 L-32 10 Q-36 18 -44 14 Z" fill={P.metall} />
        <path d="M18 -48 Q44 -40 44 -10 L44 14 Q38 16 34 12 Q36 -24 18 -48 Z" fill={P.metallTief} opacity={0.6} />
        <path d="M-32 -18 Q-28 -38 -10 -44" fill="none" stroke={P.metallHell} strokeWidth={5} strokeLinecap="round" />
        <path d="M-44 14 L-44 -10 Q-44 -50 0 -52 Q44 -50 44 -10 L44 14 Q36 18 32 10 L32 -2 L-32 -2 L-32 10 Q-36 18 -44 14 Z" fill="none" {...UMRISS} />
        {/* Gold crown band with three points and a sapphire */}
        <path d="M-40 -2 L-40 -18 L-30 -12 L-20 -26 L-8 -14 L0 -30 L8 -14 L20 -26 L30 -12 L40 -18 L40 -2 Z" fill={P.gold} {...UMRISS_FEIN} />
        <path d="M-36 -6 H36" stroke={P.goldTief} strokeWidth={2} />
        <path d={stern(0, -12, 7)} fill={P.blau} stroke={P.blauTief} strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={-22} cy={-9} r={2.5} fill={P.rot} stroke={P.rotTief} strokeWidth={1} />
        <circle cx={22} cy={-9} r={2.5} fill={P.rot} stroke={P.rotTief} strokeWidth={1} />
        {[-38, 38].map((x) => (
          <circle key={x} cx={x} cy={8} r={2} fill={P.metallHell} stroke={P.linie} strokeWidth={1} />
        ))}
      </g>
    ),
  },
  {
    id: 'e48100506fe',
    name: 'Militärhelm',
    platz: 'hut',
    seltenheit: 2,
    rahmen: [-62, -56, 124, 126],
    zeichnung: () => (
      <g>
        {/* Headset band and ear cups, behind the helmet rim */}
        <path d="M-52 40 Q-60 0 -46 -20 M52 40 Q60 0 46 -20" fill="none" stroke={P.linie} strokeWidth={7} strokeLinecap="round" />
        <path d="M-52 40 Q-60 0 -46 -20 M52 40 Q60 0 46 -20" fill="none" stroke={P.grau} strokeWidth={3} strokeLinecap="round" />
        {/* Olive steel dome with a flared rim */}
        <path d="M-50 10 Q-46 -50 0 -52 Q46 -50 50 10 Q0 0 -50 10 Z" fill={P.oliv} />
        <path d="M20 -48 Q48 -36 50 10 Q40 7 32 6 Q36 -22 20 -48 Z" fill={P.olivTief} opacity={0.6} />
        <path d="M-34 -14 Q-30 -36 -12 -44" fill="none" stroke={P.gruenHell} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <path d="M-50 10 Q-46 -50 0 -52 Q46 -50 50 10 Q0 0 -50 10 Z" fill="none" {...UMRISS} />
        {/* Steel rim and side rails */}
        <path d="M-52 10 Q0 -2 52 10" fill="none" stroke={P.metallTief} strokeWidth={5} strokeLinecap="round" />
        <path d="M-40 -8 L-30 -10 M30 -10 L40 -8" stroke={P.metallTief} strokeWidth={4} strokeLinecap="round" />
        {/* Night vision mount on the front */}
        <rect x={-8} y={-30} width={16} height={12} rx={3} fill={P.metall} {...UMRISS_FEIN} />
        <circle cx={0} cy={-24} r={2.5} fill={P.metallTief} />
        {/* Ear cups */}
        {[-54, 54].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={44} rx={11} ry={14} fill={P.grau} {...UMRISS} />
            <ellipse cx={x} cy={44} rx={5} ry={7} fill={P.grauTief} />
          </g>
        ))}
        {/* Boom microphone from the left cup to the mouth */}
        <path d="M-50 56 Q-44 70 -24 70" fill="none" stroke={P.linie} strokeWidth={6} strokeLinecap="round" />
        <path d="M-50 56 Q-44 70 -24 70" fill="none" stroke={P.grau} strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx={-20} cy={70} rx={6} ry={5} fill={P.grauTief} {...UMRISS_FEIN} />
      </g>
    ),
  },
  // — 13.11.2026 (supabase/migrations/20261129_lernquest_neue_teile.sql): one per rarity. —
  {
    id: 'baskenmuetze',
    name: 'Baskenmütze',
    platz: 'hut',
    seltenheit: 1,
    rahmen: [-48, -46, 96, 56],
    zeichnung: () => (
      <g transform="rotate(-8)">
        <path d="M-44 -4 Q-48 -34 -4 -38 Q42 -40 46 -12 Q44 2 2 4 Q-40 6 -44 -4 Z" fill={P.blauTief} />
        <path d="M20 -36 Q44 -30 46 -12 Q44 0 24 2 Q34 -16 20 -36 Z" fill={P.tinteTief} opacity={0.5} />
        <path d="M-44 -4 Q-48 -34 -4 -38 Q42 -40 46 -12 Q44 2 2 4 Q-40 6 -44 -4 Z" fill="none" {...UMRISS} />
        <path d="M-32 -20 Q-24 -32 -8 -34" fill="none" stroke={P.blau} strokeWidth={4} strokeLinecap="round" />
        <path d="M-38 0 Q0 8 40 -4" fill="none" stroke={P.tinteTief} strokeWidth={5} strokeLinecap="round" />
        <path d="M2 -38 L4 -46" stroke={P.linie} strokeWidth={5} strokeLinecap="round" />
        <path d="M2 -38 L4 -46" stroke={P.blauTief} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'propellermuetze',
    name: 'Propellermütze',
    platz: 'hut',
    seltenheit: 2,
    bewegt: true,
    rahmen: [-46, -70, 92, 80],
    zeichnung: (zeit) => {
      // The propeller turns: its blades get short and long (seen from the side).
      const k = Math.cos(zeit * 14);
      return (
        <g>
          <path d="M-38 -2 Q-40 -44 0 -46 Q40 -44 38 -2 Z" fill={P.rot} />
          <path d="M0 -46 Q20 -44 30 -30 L38 -2 L0 -2 Z" fill={P.gelb} />
          <path d="M0 -46 L0 -2 L-38 -2 Q-40 -24 -30 -34 Z" fill={P.blau} />
          <path d="M-30 -34 Q-20 -44 0 -46 L0 -24 Z" fill={P.gruen} />
          <path d="M-38 -2 Q-40 -44 0 -46 Q40 -44 38 -2 Z" fill="none" {...UMRISS} />
          <path d="M0 -46 V-2 M-38 -20 Q0 -26 38 -20" fill="none" stroke={P.linie} strokeWidth={1.8} opacity={0.6} />
          <path d="M-26 -30 Q-18 -40 -6 -42" fill="none" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          <path d="M-6 -2 Q30 -6 48 4 Q30 10 -6 6 Z" fill={P.rot} {...UMRISS_FEIN} />
          <rect x={-2} y={-58} width={4} height={13} fill={P.metall} {...UMRISS_FEIN} />
          <ellipse cx={0} cy={-60} rx={26 * Math.abs(k) + 3} ry={4.5} fill={P.gelb} {...UMRISS_FEIN} />
          <ellipse cx={(k > 0 ? 12 : -12) * Math.abs(k)} cy={-60} rx={6 * Math.abs(k) + 1} ry={3} fill={P.rot} />
          <circle cx={0} cy={-60} r={4} fill={P.blau} {...UMRISS_FEIN} />
        </g>
      );
    },
  },
  {
    id: 'detektivhut',
    name: 'Detektivhut',
    platz: 'hut',
    seltenheit: 3,
    rahmen: [-56, -50, 112, 64],
    zeichnung: () => (
      <g>
        {/* Deerstalker: a check cap with a peak front and back, flaps tied on top */}
        <path d="M-52 2 Q-40 -6 -30 -4 L-30 4 Q-42 8 -52 2 Z M52 2 Q40 -6 30 -4 L30 4 Q42 8 52 2 Z" fill={P.sandTief} {...UMRISS_FEIN} />
        <path d="M-36 0 Q-38 -42 0 -44 Q38 -42 36 0 Z" fill={P.sand} />
        <path d="M-24 -38 V0 M-8 -44 V0 M8 -44 V0 M24 -38 V0 M-36 -12 H36 M-30 -28 H30" stroke={P.leder} strokeWidth={2.5} opacity={0.6} />
        <path d="M18 -40 Q36 -32 36 0 L20 0 Q24 -22 18 -40 Z" fill={P.sandTief} opacity={0.5} />
        <path d="M-36 0 Q-38 -42 0 -44 Q38 -42 36 0 Z" fill="none" {...UMRISS} />
        <path d="M-26 -16 Q-24 -32 -10 -38" fill="none" stroke={P.sandHell} strokeWidth={4} strokeLinecap="round" />
        <path d="M-30 -10 Q-40 2 -34 14 Q-28 8 -26 -6 Z M30 -10 Q40 2 34 14 Q28 8 26 -6 Z" fill={P.sand} {...UMRISS_FEIN} />
        <path d="M-8 -46 Q0 -54 8 -46 Q0 -42 -8 -46 Z" fill={P.leder} {...UMRISS_FEIN} />
        <circle cx={0} cy={-46} r={3} fill={P.lederTief} />
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
    zeichnung: (zeit) => {
      const federn: [number, string, string][] = [
        [-48, P.rot, P.rotTief],
        [-26, P.orange, P.orangeTief],
        [-8, P.gelb, P.gelbTief],
        [8, P.gruen, P.gruenTief],
        [26, P.blau, P.blauTief],
        [48, P.lila, P.lilaTief],
      ];
      return (
        <g>
          {federn.map(([w, f, t], i) => (
            <g key={w} transform={`rotate(${(w + Math.sin(zeit * 2 + i) * 3).toFixed(1)} 0 -6)`}>
              <path d="M0 -6 Q-12 -40 0 -78 Q12 -40 0 -6 Z" fill={f} {...UMRISS_FEIN} />
              <path d="M0 -10 V-72" stroke={t} strokeWidth={2} />
              <path d="M0 -30 l-6 -6 M0 -44 l-6 -6 M0 -30 l6 -6 M0 -44 l6 -6 M0 -58 l5 -5 M0 -58 l-5 -5" stroke={t} strokeWidth={1.5} opacity={0.7} />
            </g>
          ))}
          <path d="M-40 6 Q0 -6 40 6 L40 -8 Q0 -20 -40 -8 Z" fill={P.gold} {...UMRISS} />
          <path d="M-34 -4 Q0 -14 34 -4" fill="none" stroke={P.goldHell} strokeWidth={2.5} />
          <path d="M-6 -6 L0 -14 L6 -6 L0 2 Z" fill={P.tuerkis} stroke={P.tuerkisTief} strokeWidth={1.5} />
          <circle cx={-24} cy={-2} r={3} fill={P.rot} stroke={P.rotTief} strokeWidth={1.2} />
          <circle cx={24} cy={-2} r={3} fill={P.rot} stroke={P.rotTief} strokeWidth={1.2} />
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
    zeichnung: (zeit) => {
      const f = (k: number) => 1 + Math.sin(zeit * 8 + k) * 0.08;
      return (
        <g>
          {/* Flame wings on both sides, flickering */}
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 30} -10) scale(${s * f(s)} ${f(s + 1)})`}>
              <path d="M0 0 Q18 -10 26 -40 Q14 -32 12 -44 Q4 -28 0 -36 Q-4 -18 0 0 Z" fill={P.lava} {...UMRISS_FEIN} />
              <path d="M2 -4 Q14 -14 18 -30 Q10 -24 8 -32 Q4 -20 2 -4 Z" fill={P.lavaHell} />
            </g>
          ))}
          <path d="M-32 6 L-34 -24 L-18 -10 L-8 -36 L0 -16 L8 -36 L18 -10 L34 -24 L32 6 Z" fill={P.gold} />
          <path d="M18 -10 L34 -24 L32 6 L16 6 Z" fill={P.goldTief} opacity={0.45} />
          <path d="M-32 6 L-34 -24 L-18 -10 L-8 -36 L0 -16 L8 -36 L18 -10 L34 -24 L32 6 Z" fill="none" {...UMRISS} />
          <path d="M-28 -14 L-28 0 M-10 -26 L-6 -18" stroke={P.goldHell} strokeWidth={3} strokeLinecap="round" />
          <g transform={`translate(0 -52) scale(${f(3).toFixed(3)})`}>
            <path d="M0 10 Q-12 -2 -4 -16 Q-2 -8 2 -12 Q4 -22 0 -28 Q16 -16 10 2 Q8 8 0 10 Z" fill={P.lava} {...UMRISS_FEIN} />
            <path d="M0 6 Q-6 -2 -1 -10 Q2 -4 5 -6 Q8 2 0 6 Z" fill={P.gelb} />
          </g>
          <path d="M-32 6 L32 6 L32 -4 L-32 -4 Z" fill={P.goldTief} {...UMRISS_FEIN} />
          <path d="M0 -6 l5 5 -5 5 -5 -5 Z" fill={P.rot} stroke={P.rotTief} strokeWidth={1.2} />
          <circle cx={-18} cy={1} r={2.6} fill={P.tuerkis} />
          <circle cx={18} cy={1} r={2.6} fill={P.tuerkis} />
          <Funkeln x={-22} y={-20} r={6} zeit={zeit} />
          <Funkeln x={24} y={-26} r={5} zeit={zeit} versatz={2.4} />
        </g>
      );
    },
  },
];
