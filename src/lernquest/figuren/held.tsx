// The children's hero (Stufe E, Teil 4): one chibi figure on the same rig as the fox, made from what the child chose
// (src/lernquest/teile.ts `Avatar`): skin tone, hair and its colour, mouth, eyes and clothes are drawn into the figure;
// hats, tools and the companion are items on its anchors (`hut`, `hand-rechts`, `hand-links`, `begleiter`); the
// background is a scene behind it (hintergruende.tsx). Faces of a pose (jubel, staunen …) win over the chosen
// mouth and eyes for a moment, glasses stay on.
import { useId } from 'react';
import type { ReactNode } from 'react';
import { FUCHS, Glied } from './fuchs';
import { HAAR_TOENE, HAUT_TOENE, P, UMRISS, UMRISS_FEIN } from './stil';
import type { Ton } from './stil';
import type { Figur, Pose, Punkt, Stand, Teil } from './typen';
import { Funkeln, stern } from './zeichnen';

/** What the hero looks like; ids as in src/lernquest/teile.ts. Missing = the start look. */
export interface Aussehen {
  haut?: number;
  frisur?: string;
  haarfarbe?: number;
  mund?: string;
  augen?: string;
  kleidung?: string;
}

const ton = (farbe: string, hell: string, tief: string): Ton => ({ farbe, hell, tief });
const T = {
  blau: ton(P.blau, P.blauHell, P.blauTief),
  jeans: ton(P.blauTief, P.blau, P.tinteTief),
  rot: ton(P.rot, P.backe, P.rotTief),
  gruen: ton(P.gruen, P.gruenHell, P.gruenTief),
  oliv: ton(P.oliv, P.gruenHell, P.olivTief),
  gelb: ton(P.gelb, P.gelbHell, P.gelbTief),
  orange: ton(P.orange, P.orangeHell, P.orangeTief),
  lila: ton(P.lila, P.lilaHell, P.lilaTief),
  nacht: ton(P.nacht, P.nachtHell, P.nachtTief),
  dunkel: ton(P.dunkel, P.dunkelHell, P.dunkelTief),
  metall: ton(P.metall, P.metallHell, P.metallTief),
  grau: ton(P.grau, P.grauHell, P.grauTief),
  gold: ton(P.gold, P.goldHell, P.goldTief),
  leder: ton(P.leder, P.lederHell, P.lederTief),
  creme: ton(P.creme, P.weiss, P.sandTief),
  weiss: ton(P.schnee, P.weiss, P.grauHell),
  eis: ton(P.eis, P.eisHell, P.eisTief),
  tuerkis: ton(P.tuerkis, P.tuerkisHell, P.tuerkisTief),
  sand: ton(P.sand, P.sandHell, P.sandTief),
};

// — Body: torso, legs and shoes; clothes paint the torso and the arms. —

const RUMPF = 'M92 140 Q120 132 148 140 L153 196 Q120 203 87 196 Z';
/** The torso in a colour: fill, shade on the right, light on the left, outline; `kinder` are the clothes' details. */
function Rumpf({ t, d = RUMPF, kinder }: { t: Ton; d?: string; kinder?: ReactNode }) {
  return (
    <g>
      <path d={d} fill={t.farbe} />
      <path d="M138 140 Q146 141 148 140 L153 196 Q142 199 132 200 Q140 170 138 140 Z" fill={t.tief} opacity={0.5} />
      <path d="M96 148 Q95 166 96 184" fill="none" stroke={t.hell} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      {kinder}
      <path d={d} fill="none" {...UMRISS} />
    </g>
  );
}
const Kragen = ({ t }: { t: Ton }) => <path d="M106 137 Q120 150 134 137" fill="none" stroke={t.tief} strokeWidth={3} strokeLinecap="round" />;
const Knoepfe = ({ x = 120, ys, t = T.gold }: { x?: number; ys: number[]; t?: Ton }) => (
  <g>
    {ys.map((y) => (
      <circle key={y} cx={x} cy={y} r={2.8} fill={t.farbe} stroke={P.linie} strokeWidth={1.5} />
    ))}
  </g>
);
interface Kleid {
  /** Upper arm and forearm (short sleeves: forearm = skin). */
  aermel: Ton | 'haut';
  unterarm: Ton | 'haut';
  hand?: Ton;
  hose: Ton;
  schuhe: Ton;
  rumpf: (s: Stand) => ReactNode;
  /** Behind the whole body (a cape). */
  hinten?: () => ReactNode;
  /** The robe covers the legs. */
  lang?: boolean;
}

const Umhang = ({ t }: { t: Ton }) => (
  <g>
    <path d="M92 140 Q120 130 148 140 L170 216 Q120 228 70 216 Z" fill={t.farbe} {...UMRISS} />
    <path d="M150 160 L168 214 Q156 218 146 219 Z" fill={t.tief} opacity={0.55} />
  </g>
);

export const KLEIDUNG: Record<string, Kleid> = {
  tshirt: {
    aermel: T.blau,
    unterarm: 'haut',
    hose: T.jeans,
    schuhe: T.rot,
    rumpf: () => <Rumpf t={T.blau} kinder={<><Kragen t={T.blau} /><path d={stern(120, 166, 10)} fill={P.weiss} stroke={P.blauTief} strokeWidth={2} strokeLinejoin="round" /></>} />,
  },
  pulli: {
    aermel: T.rot,
    unterarm: T.rot,
    hose: T.jeans,
    schuhe: T.leder,
    rumpf: () => (
      <Rumpf
        t={T.rot}
        kinder={
          <>
            <path d="M106 136 Q120 146 134 136" fill="none" stroke={P.rotTief} strokeWidth={5} strokeLinecap="round" />
            <path d="M90 158 Q120 164 150 158 M89 168 Q120 174 151 168" fill="none" stroke={P.weiss} strokeWidth={3.5} strokeLinecap="round" />
            <path d="M88 190 Q120 196 152 190" fill="none" stroke={P.rotTief} strokeWidth={5} />
          </>
        }
      />
    ),
  },
  latzhose: {
    aermel: T.gelb,
    unterarm: 'haut',
    hose: T.jeans,
    schuhe: T.rot,
    rumpf: () => (
      <g>
        <Rumpf t={T.gelb} kinder={<Kragen t={T.gelb} />} />
        <path d="M100 162 L140 162 L141 198 Q120 202 99 198 Z" fill={P.blau} {...UMRISS_FEIN} />
        <path d="M98 140 L102 164 M142 140 L138 164" stroke={P.linie} strokeWidth={8} strokeLinecap="round" />
        <path d="M98 140 L102 164 M142 140 L138 164" stroke={P.blau} strokeWidth={4.5} strokeLinecap="round" />
        <rect x={110} y={170} width={20} height={14} rx={3} fill={P.blauTief} {...UMRISS_FEIN} />
        <Knoepfe x={103} ys={[162]} />
        <Knoepfe x={137} ys={[162]} />
      </g>
    ),
  },
  weste: {
    aermel: T.creme,
    unterarm: 'haut',
    hose: T.leder,
    schuhe: T.leder,
    rumpf: () => (
      <Rumpf
        t={T.creme}
        kinder={
          <>
            <path d="M92 140 Q104 136 112 140 L114 198 Q100 199 88 196 Z M148 140 Q136 136 128 140 L126 198 Q140 199 152 196 Z" fill={P.oliv} {...UMRISS_FEIN} />
            <rect x={93} y={162} width={15} height={13} rx={2} fill={P.olivTief} {...UMRISS_FEIN} />
            <rect x={132} y={162} width={15} height={13} rx={2} fill={P.olivTief} {...UMRISS_FEIN} />
            <Knoepfe x={110} ys={[152, 172]} t={T.leder} />
          </>
        }
      />
    ),
  },
  ruestung: {
    aermel: T.metall,
    unterarm: T.metall,
    hand: T.grau,
    hose: T.grau,
    schuhe: T.metall,
    rumpf: () => (
      <Rumpf
        t={T.metall}
        kinder={
          <>
            <path d="M120 140 V196" stroke={P.metallTief} strokeWidth={2.5} />
            <path d="M92 168 Q120 176 148 168" fill="none" stroke={P.metallTief} strokeWidth={2.5} />
            <path d="M84 142 Q92 132 104 138 L102 152 Q92 150 84 152 Z M156 142 Q148 132 136 138 L138 152 Q148 150 156 152 Z" fill={P.metallHell} {...UMRISS_FEIN} />
            {[104, 136].map((x) => (
              <circle key={x} cx={x} cy={184} r={2.2} fill={P.metallHell} stroke={P.linie} strokeWidth={1.2} />
            ))}
          </>
        }
      />
    ),
  },
  sternenmantel: {
    aermel: T.nacht,
    unterarm: T.nacht,
    hose: T.dunkel,
    schuhe: T.leder,
    hinten: () => <Umhang t={T.nacht} />,
    rumpf: () => (
      <Rumpf
        t={T.nacht}
        kinder={
          <>
            {[
              [104, 158, 6],
              [134, 176, 5],
              [112, 186, 3.5],
              [140, 152, 3.5],
            ].map(([x, y, r]) => (
              <path key={x} d={stern(x, y, r)} fill={P.gold} stroke={P.goldTief} strokeWidth={1.4} strokeLinejoin="round" />
            ))}
            <path d="M104 138 Q120 150 136 138" fill="none" stroke={P.gold} strokeWidth={3} strokeLinecap="round" />
          </>
        }
      />
    ),
  },
  zauberrobe: {
    aermel: T.lila,
    unterarm: T.lila,
    hose: T.lila,
    schuhe: T.lila,
    lang: true,
    rumpf: () => (
      <Rumpf
        t={T.lila}
        d="M92 140 Q120 132 148 140 L160 220 Q120 228 80 220 Z"
        kinder={
          <>
            <path d="M120 140 V224" stroke={P.gold} strokeWidth={4} />
            <path d="M82 214 Q120 222 158 214" fill="none" stroke={P.gold} strokeWidth={4} />
            <path d={stern(104, 172, 7)} fill={P.gold} stroke={P.goldTief} strokeWidth={1.5} strokeLinejoin="round" />
            <path d={stern(138, 196, 5)} fill={P.goldHell} stroke={P.goldTief} strokeWidth={1.4} strokeLinejoin="round" />
            <path d="M106 137 Q120 150 134 137" fill="none" stroke={P.gold} strokeWidth={3.5} strokeLinecap="round" />
          </>
        }
      />
    ),
  },
  goldruestung: {
    aermel: T.gold,
    unterarm: T.gold,
    hand: T.gold,
    hose: T.rot,
    schuhe: T.gold,
    hinten: () => <Umhang t={T.rot} />,
    rumpf: ({ zeit }) => (
      <Rumpf
        t={T.gold}
        kinder={
          <>
            <path d="M92 168 Q120 176 148 168" fill="none" stroke={P.goldTief} strokeWidth={2.5} />
            <path d="M84 142 Q92 130 106 138 L104 154 Q92 150 84 154 Z M156 142 Q148 130 134 138 L136 154 Q148 150 156 154 Z" fill={P.goldHell} {...UMRISS_FEIN} />
            <path d="M120 146 l9 9 -9 9 -9 -9 Z" fill={P.rot} stroke={P.rotTief} strokeWidth={2} />
            <path d="M117 151 l3 -3" stroke={P.weiss} strokeWidth={2} strokeLinecap="round" />
            <Funkeln x={102} y={180} r={6} zeit={zeit} />
          </>
        }
      />
    ),
  },
  kapuzenpulli: {
    aermel: T.gruen,
    unterarm: T.gruen,
    hose: T.jeans,
    schuhe: T.weiss,
    rumpf: () => (
      <g>
        <path d="M94 142 Q88 124 104 128 Q120 140 136 128 Q152 124 146 142 Z" fill={P.gruenTief} {...UMRISS_FEIN} />
        <Rumpf
          t={T.gruen}
          kinder={
            <>
              <path d="M112 142 L110 162 M128 142 L130 162" stroke={P.weiss} strokeWidth={2.5} strokeLinecap="round" />
              <path d="M100 174 L140 174 L144 192 Q120 196 96 192 Z" fill={P.gruenTief} opacity={0.7} />
              <path d="M100 174 L140 174" stroke={P.linie} strokeWidth={2} strokeLinecap="round" />
            </>
          }
        />
      </g>
    ),
  },
  trikot: {
    aermel: T.orange,
    unterarm: 'haut',
    hose: T.weiss,
    schuhe: T.blau,
    rumpf: () => (
      <Rumpf
        t={T.orange}
        kinder={
          <>
            <path d="M106 137 L120 150 L134 137" fill="none" stroke={P.weiss} strokeWidth={4} strokeLinejoin="round" />
            <path d="M92 150 L94 196 M148 150 L146 196" stroke={P.weiss} strokeWidth={5} />
            <path d="M114 160 L122 156 L122 186 M114 186 L130 186" fill="none" stroke={P.weiss} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        }
      />
    ),
  },
  drachenruestung: {
    aermel: T.gruen,
    unterarm: T.gold,
    hand: T.gruen,
    hose: T.dunkel,
    schuhe: T.gruen,
    rumpf: () => (
      <Rumpf
        t={T.gruen}
        kinder={
          <>
            {[150, 162, 174, 186].flatMap((y, r) =>
              [0, 1, 2, 3].map((i) => <path key={`${y}-${i}`} d={`M${96 + i * 13 + (r % 2) * 6} ${y} q6 6 12 0`} fill="none" stroke={P.gruenTief} strokeWidth={2.2} strokeLinecap="round" />),
            )}
            <path d="M84 146 L88 128 L98 140 Z M156 146 L152 128 L142 140 Z" fill={P.gold} {...UMRISS_FEIN} />
            <circle cx={120} cy={150} r={6.5} fill={P.rot} stroke={P.goldTief} strokeWidth={2.5} />
            <path d="M117 148 l2 -2" stroke={P.weiss} strokeWidth={1.8} strokeLinecap="round" />
          </>
        }
      />
    ),
  },
  regenjacke: {
    aermel: T.gelb,
    unterarm: T.gelb,
    hose: T.jeans,
    schuhe: T.gruen,
    rumpf: () => (
      <g>
        <path d="M94 142 Q88 124 104 128 Q120 140 136 128 Q152 124 146 142 Z" fill={P.gelbTief} {...UMRISS_FEIN} />
        <Rumpf
          t={T.gelb}
          kinder={
            <>
              <path d="M120 140 V198" stroke={P.gelbTief} strokeWidth={2.5} />
              <Knoepfe x={126} ys={[152, 166, 180]} t={T.blau} />
              <path d="M96 176 h14 M130 176 h14" stroke={P.gelbTief} strokeWidth={2.5} strokeLinecap="round" />
            </>
          }
        />
      </g>
    ),
  },
  ninjaanzug: {
    aermel: T.dunkel,
    unterarm: T.dunkel,
    hose: T.dunkel,
    schuhe: T.dunkel,
    rumpf: () => (
      <Rumpf
        t={T.dunkel}
        kinder={
          <>
            <path d="M104 138 L132 176 M136 138 L108 176" stroke={P.dunkelHell} strokeWidth={3} />
            <path d="M88 180 Q120 186 152 180 L153 190 Q120 196 87 190 Z" fill={P.rot} {...UMRISS_FEIN} />
            <path d="M142 186 l10 12 M146 186 l2 14" stroke={P.rot} strokeWidth={4} strokeLinecap="round" />
          </>
        }
      />
    ),
  },
  raumanzug: {
    aermel: T.weiss,
    unterarm: T.weiss,
    hand: T.grau,
    hose: T.weiss,
    schuhe: T.grau,
    rumpf: () => (
      <Rumpf
        t={T.weiss}
        kinder={
          <>
            <rect x={106} y={152} width={28} height={22} rx={4} fill={P.blau} {...UMRISS_FEIN} />
            <circle cx={113} cy={160} r={3} fill={P.rot} />
            <circle cx={123} cy={160} r={3} fill={P.gelb} />
            <path d="M110 168 h20" stroke={P.blauHell} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M88 186 Q120 192 152 186" fill="none" stroke={P.grau} strokeWidth={5} />
            <path d="M104 136 Q120 146 136 136" fill="none" stroke={P.grau} strokeWidth={5} strokeLinecap="round" />
          </>
        }
      />
    ),
  },
  kristallruestung: {
    aermel: T.eis,
    unterarm: T.eis,
    hand: T.eis,
    hose: T.tuerkis,
    schuhe: T.eis,
    hinten: () => <Umhang t={T.lila} />,
    rumpf: ({ zeit }) => (
      <Rumpf
        t={T.eis}
        kinder={
          <>
            <path d="M120 142 L136 162 L120 186 L104 162 Z" fill={P.eisHell} stroke={P.eisTief} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M120 142 V186 M104 162 H136" stroke={P.eisTief} strokeWidth={1.5} />
            <path d="M84 142 L90 126 L100 140 Z M156 142 L150 126 L140 140 Z" fill={P.eisHell} {...UMRISS_FEIN} />
            <path d="M88 190 Q120 196 152 190" fill="none" stroke={P.gold} strokeWidth={4} />
            <circle cx={120} cy={164} r={4.5} fill={P.lila} stroke={P.lilaTief} strokeWidth={1.8} />
            <Funkeln x={108} y={150} r={6} zeit={zeit} />
            <Funkeln x={140} y={180} r={5} zeit={zeit} versatz={2} />
          </>
        }
      />
    ),
  },
  // Own parts of the teacher (lq_teil, eigen), by their id.
  e0a70ed2238: {
    aermel: T.oliv,
    unterarm: T.oliv,
    hand: T.leder,
    hose: T.oliv,
    schuhe: T.leder,
    rumpf: ({ zeit }) => (
      <Rumpf
        t={T.oliv}
        kinder={
          <>
            {/* Camouflage patches and leafy tufts */}
            <path d="M94 150 q8 -6 16 0 q-4 8 -16 0 Z M124 164 q10 -6 18 2 q-8 8 -18 -2 Z M100 182 q8 -4 14 2 q-6 6 -14 -2 Z" fill={P.olivTief} />
            <path d="M118 146 q6 -4 12 0 q-4 6 -12 0 Z M134 186 q6 -4 12 0 q-4 6 -12 0 Z" fill={P.leder} opacity={0.8} />
            {[
              [90, 142],
              [150, 142],
              [96, 196],
              [146, 196],
              [120, 138],
            ].map(([x, y]) => (
              <path key={`${x},${y}`} d={`M${x} ${y} l-6 -8 M${x} ${y} l0 -10 M${x} ${y} l6 -8`} stroke={P.gruenTief} strokeWidth={3.5} strokeLinecap="round" />
            ))}
            <path d="M118 158 q4 -8 10 -6 q-2 8 -10 6 Z" fill={P.gold} stroke={P.goldTief} strokeWidth={1.5} />
            <Funkeln x={140} y={154} r={6} zeit={zeit} />
          </>
        }
      />
    ),
  },
  // — 13.11.2026: ten more (supabase/migrations/20261129_lernquest_neue_teile.sql), two per rarity. —
  karohemd: {
    aermel: T.rot,
    unterarm: T.rot,
    hose: T.jeans,
    schuhe: T.leder,
    rumpf: () => (
      <Rumpf
        t={T.rot}
        kinder={
          <>
            {/* Checks: dark stripes both ways, a light one between */}
            <path d="M104 140 V198 M120 136 V200 M136 140 V198" stroke={P.rotTief} strokeWidth={5} opacity={0.55} />
            <path d="M89 156 H151 M88 174 H152 M88 190 H152" stroke={P.rotTief} strokeWidth={5} opacity={0.55} />
            <path d="M112 140 V198 M128 138 V198 M89 165 H151 M88 182 H152" stroke={P.backe} strokeWidth={1.8} opacity={0.7} />
            <path d="M106 136 L114 150 L120 140 L126 150 L134 136" fill={P.rot} stroke={P.linie} strokeWidth={2.5} strokeLinejoin="round" />
            <Knoepfe ys={[154, 168, 182]} t={T.weiss} />
            <rect x={124} y={152} width={14} height={10} rx={2} fill={P.rot} stroke={P.rotTief} strokeWidth={2} />
          </>
        }
      />
    ),
  },
  trainingsanzug: {
    aermel: T.tuerkis,
    unterarm: T.tuerkis,
    hose: T.tuerkis,
    schuhe: T.weiss,
    rumpf: () => (
      <Rumpf
        t={T.tuerkis}
        kinder={
          <>
            <path d="M120 138 V198" stroke={P.grauTief} strokeWidth={2.5} />
            <path d="M117 142 h6 M117 150 h6 M117 158 h6 M117 166 h6 M117 174 h6 M117 182 h6 M117 190 h6" stroke={P.grauHell} strokeWidth={1.6} />
            <rect x={116} y={150} width={8} height={10} rx={2} fill={P.metall} stroke={P.linie} strokeWidth={1.5} />
            <path d="M92 146 L89 194 M148 146 L151 194" stroke={P.weiss} strokeWidth={4} strokeLinecap="round" />
            <path d="M98 146 L96 194 M142 146 L144 194" stroke={P.weiss} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
            <path d="M106 137 Q120 146 134 137" fill="none" stroke={P.tuerkisTief} strokeWidth={5} strokeLinecap="round" />
            <path d="M88 192 Q120 198 152 192" stroke={P.tuerkisTief} strokeWidth={5} fill="none" />
          </>
        }
      />
    ),
  },
  matrosenanzug: {
    aermel: T.weiss,
    unterarm: T.weiss,
    hose: T.jeans,
    schuhe: T.dunkel,
    rumpf: () => (
      <g>
        <Rumpf
          t={T.weiss}
          kinder={
            <>
              <path d="M89 186 H151 M88 192 H152" stroke={P.blauTief} strokeWidth={3} />
              <path d="M92 140 L120 172 L148 140 L148 152 L120 182 L92 152 Z" fill={P.blauTief} stroke={P.linie} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M96 146 L120 174 L144 146" fill="none" stroke={P.weiss} strokeWidth={2} />
            </>
          }
        />
        {/* Red neckerchief with a knot */}
        <path d="M112 170 L120 178 L128 170 L134 192 L124 186 L120 194 L116 186 L106 192 Z" fill={P.rot} {...UMRISS_FEIN} />
        <circle cx={120} cy={175} r={5} fill={P.rotTief} {...UMRISS_FEIN} />
      </g>
    ),
  },
  feuerwehranzug: {
    aermel: T.dunkel,
    unterarm: T.dunkel,
    hand: T.gelb,
    hose: T.dunkel,
    schuhe: T.dunkel,
    rumpf: () => (
      <Rumpf
        t={T.dunkel}
        kinder={
          <>
            {/* Reflective bands: yellow with a silver line */}
            <path d="M89 166 H151 M88 186 H152" stroke={P.gelb} strokeWidth={8} />
            <path d="M89 166 H151 M88 186 H152" stroke={P.metallHell} strokeWidth={2.5} />
            <path d="M120 138 V198" stroke={P.dunkelTief} strokeWidth={3} />
            <path d="M104 144 L104 160 M136 144 L136 160" stroke={P.gelb} strokeWidth={6} strokeLinecap="round" />
            <path d="M104 144 L104 160 M136 144 L136 160" stroke={P.metallHell} strokeWidth={2} strokeLinecap="round" />
            <rect x={124} y={146} width={16} height={12} rx={3} fill={P.rot} stroke={P.linie} strokeWidth={1.5} />
            <path d="M128 152 h8 M132 148 v8" stroke={P.weiss} strokeWidth={2} />
          </>
        }
      />
    ),
  },
  detektivmantel: {
    aermel: T.sand,
    unterarm: T.sand,
    hose: T.leder,
    schuhe: T.dunkel,
    rumpf: () => (
      <g>
        <Rumpf
          t={T.sand}
          d="M90 140 Q120 132 150 140 L157 204 Q120 212 83 204 Z"
          kinder={
            <>
              {/* Lapels, double buttons, belt with buckle */}
              <path d="M106 137 L114 160 L120 146 L126 160 L134 137" fill={P.sandHell} stroke={P.linie} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M120 146 V204" stroke={P.sandTief} strokeWidth={2.5} />
              <Knoepfe x={110} ys={[168, 182]} t={T.leder} />
              <Knoepfe x={130} ys={[168, 182]} t={T.leder} />
              <path d="M86 174 Q120 180 154 174 L155 182 Q120 188 85 182 Z" fill={P.sandTief} stroke={P.linie} strokeWidth={2} />
              <rect x={114} y={174} width={12} height={10} rx={2} fill="none" stroke={P.metallTief} strokeWidth={2.5} />
              <path d="M94 150 L104 154 M146 150 L136 154" stroke={P.sandTief} strokeWidth={2} strokeLinecap="round" />
            </>
          }
        />
      </g>
    ),
  },
  piratenjacke: {
    aermel: T.rot,
    unterarm: T.weiss,
    hose: T.dunkel,
    schuhe: T.leder,
    rumpf: () => (
      <g>
        <Rumpf
          t={T.rot}
          kinder={
            <>
              {/* White shirt in the opening, gold trim, wide belt */}
              <path d="M110 138 L120 176 L130 138 Z" fill={P.schnee} stroke={P.linie} strokeWidth={2} />
              <path d="M114 146 q6 4 12 0 M115 154 q5 4 10 0" fill="none" stroke={P.grauHell} strokeWidth={1.8} />
              <path d="M110 138 L118 200 M130 138 L122 200" stroke={P.gold} strokeWidth={3.5} />
              <path d="M88 178 Q120 186 152 178 L153 190 Q120 198 87 190 Z" fill={P.leder} stroke={P.linie} strokeWidth={2} />
              <rect x={112} y={178} width={16} height={14} rx={3} fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
              <rect x={117} y={182} width={6} height={6} fill={P.leder} />
              <Knoepfe x={102} ys={[150, 162]} />
              <Knoepfe x={138} ys={[150, 162]} />
            </>
          }
        />
      </g>
    ),
  },
  samurairuestung: {
    aermel: T.rot,
    unterarm: T.dunkel,
    hose: T.dunkel,
    schuhe: T.leder,
    rumpf: () => (
      <g>
        <Rumpf
          t={T.rot}
          kinder={
            <>
              {/* Lacquered plates laced together, a gold cord across */}
              {[150, 162, 174, 186].map((y) => (
                <g key={y}>
                  <path d={`M89 ${y} Q120 ${y + 5} 151 ${y}`} fill="none" stroke={P.rotTief} strokeWidth={3} />
                  <path d={`M96 ${y + 2} v6 M108 ${y + 3} v6 M120 ${y + 3} v6 M132 ${y + 3} v6 M144 ${y + 2} v6`} stroke={P.gold} strokeWidth={1.8} />
                </g>
              ))}
              <path d="M96 140 L144 196" stroke={P.gold} strokeWidth={4} strokeLinecap="round" />
              <path d="M106 137 Q120 148 134 137" fill="none" stroke={P.dunkel} strokeWidth={6} strokeLinecap="round" />
            </>
          }
        />
        {/* Shoulder plates */}
        {[
          [80, -1],
          [160, 1],
        ].map(([x, k]) => (
          <path key={x} d={`M${x - 14 * k} 140 Q${x} 132 ${x + 14 * k} 140 L${x + 12 * k} 158 Q${x} 164 ${x - 12 * k} 158 Z`} fill={P.rot} {...UMRISS_FEIN} />
        ))}
        <path d="M70 148 h20 M70 154 h20 M150 148 h20 M150 154 h20" stroke={P.rotTief} strokeWidth={2.5} />
      </g>
    ),
  },
  magiermantel: {
    aermel: T.nacht,
    unterarm: T.nacht,
    hose: T.nacht,
    schuhe: T.lila,
    lang: true,
    hinten: () => <Umhang t={T.lila} />,
    rumpf: ({ zeit }) => (
      <Rumpf
        t={T.nacht}
        d="M90 140 Q120 132 150 140 L160 224 Q120 232 80 224 Z"
        kinder={
          <>
            <path d="M120 140 V226" stroke={P.gold} strokeWidth={3} />
            <path d="M84 216 Q120 226 156 216" fill="none" stroke={P.gold} strokeWidth={3.5} />
            {[
              [102, 160, 5],
              [138, 172, 6],
              [104, 196, 4],
              [142, 206, 4.5],
              [126, 152, 3.5],
            ].map(([x, y, r]) => (
              <path key={`${x},${y}`} d={stern(x, y, r)} fill={P.gold} />
            ))}
            <path d="M106 137 L120 152 L134 137" fill="none" stroke={P.gold} strokeWidth={3} strokeLinejoin="round" />
            <circle cx={120} cy={152} r={4.5} fill={P.tuerkis} stroke={P.goldTief} strokeWidth={2} />
            <Funkeln x={98} y={182} r={5} zeit={zeit} />
          </>
        }
      />
    ),
  },
  sonnenruestung: {
    aermel: T.gold,
    unterarm: T.gold,
    hose: T.orange,
    schuhe: T.gold,
    hinten: () => <Umhang t={T.rot} />,
    rumpf: ({ zeit }) => {
      const dreh = (zeit * 20) % 360;
      return (
        <Rumpf
          t={T.gold}
          kinder={
            <>
              {/* A sun on the chest; its rays turn slowly */}
              <g transform={`rotate(${dreh.toFixed(1)} 120 166)`}>
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={i} d="M120 146 L124 156 L116 156 Z" fill={P.orange} transform={`rotate(${i * 30} 120 166)`} />
                ))}
              </g>
              <circle cx={120} cy={166} r={11} fill={P.gelb} stroke={P.goldTief} strokeWidth={2.5} />
              <circle cx={120} cy={166} r={5} fill={P.rot} stroke={P.rotTief} strokeWidth={1.5} />
              <path d="M88 188 Q120 196 152 188" fill="none" stroke={P.goldTief} strokeWidth={4} />
              <path d="M96 144 Q100 140 106 141" stroke={P.goldHell} strokeWidth={3} strokeLinecap="round" fill="none" />
              <Funkeln x={140} y={150} r={6} zeit={zeit} />
              <Funkeln x={100} y={182} r={5} zeit={zeit} versatz={2} />
            </>
          }
        />
      );
    },
  },
  schattenmantel: {
    aermel: T.dunkel,
    unterarm: T.dunkel,
    hose: T.dunkel,
    schuhe: T.dunkel,
    hinten: () => <Umhang t={T.lila} />,
    rumpf: ({ zeit }) => {
      const glut = 0.55 + Math.sin(zeit * 2.5) * 0.35;
      return (
        <Rumpf
          t={T.dunkel}
          kinder={
            <>
              {/* Glowing runes and a silver clasp; a hood lies on the shoulders */}
              <path d="M98 152 l6 8 l-6 8 M140 152 l-6 8 l6 8 M112 184 h16 M120 176 v16" fill="none" stroke={P.lilaHell} strokeWidth={2.5} strokeLinecap="round" opacity={glut} />
              <path d="M94 140 Q120 156 146 140 Q120 146 94 140 Z" fill={P.dunkelTief} {...UMRISS_FEIN} />
              <path d="M112 150 L120 158 L128 150 L120 142 Z" fill={P.metallHell} stroke={P.metallTief} strokeWidth={2} />
              <circle cx={120} cy={150} r={2.5} fill={P.lila} opacity={glut} />
              <Funkeln x={142} y={180} r={5} zeit={zeit} />
            </>
          }
        />
      );
    },
  },
};

// — Face: eyes (the `augen` part), brows, mouth (the chosen one), cheeks. Drawn in the fox's face coordinates and
// moved over, so the expressions match the fox. —

const AUGE_L = 80;
const AUGE_R = 120;
const AUGE_Y = 93;
const linie = { fill: 'none', stroke: P.auge, strokeWidth: 4.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

// Flat eyes (teacher's review 12.11.2026): one dark shape, no white shine; only the special eyes carry a colour or a star.
function Punktauge({ x, rx = 7.5, ry = 9.5, iris, funkeln = false }: { x: number; rx?: number; ry?: number; iris?: string; funkeln?: boolean }) {
  return (
    <g>
      <ellipse cx={x} cy={AUGE_Y} rx={rx} ry={ry} fill={P.auge} />
      {iris && <path d={`M${x - rx + 2} 96 Q${x} ${AUGE_Y + ry + 1} ${x + rx - 2} 96`} fill="none" stroke={iris} strokeWidth={2.8} opacity={0.9} />}
      {funkeln && <path d={stern(x - 2, 89, 3.4, 4)} fill={P.weiss} />}
    </g>
  );
}
const zu = (x: number) => <path key={x} d={`M${x - 9} 93 Q${x} 99 ${x + 9} 93`} {...linie} strokeWidth={4} />;
const froh = (x: number) => <path key={x} d={`M${x - 9} 95 Q${x} 84 ${x + 9} 95`} {...linie} />;

/** The eye styles of the `augen` place (src/lernquest/teile.ts). Glasses are drawn over plain eyes. */
const AUGEN_FORM: Record<string, (x: number, s: Stand) => ReactNode> = {
  punktaugen: (x, s) => <Punktauge x={x} ry={s.gesicht === 'staunen' ? 11 : s.gesicht === 'sanft' ? 8 : 9.5} rx={s.gesicht === 'staunen' ? 8.5 : 7.5} />,
  froehlich: (x) => froh(x),
  sternaugen: (x) => (
    <g>
      <path d={stern(x, AUGE_Y, 11)} fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={x - 2} cy={AUGE_Y - 3} r={2} fill={P.weiss} />
    </g>
  ),
  funkelaugen: (x) => <Punktauge x={x} rx={8.5} ry={10.5} iris={P.lilaHell} funkeln />,
  herzaugen: (x) => (
    <g>
      <path d={`M${x} ${AUGE_Y + 10} C${x - 14} ${AUGE_Y} ${x - 12} ${AUGE_Y - 11} ${x - 5} ${AUGE_Y - 9} C${x - 2} ${AUGE_Y - 8} ${x} ${AUGE_Y - 5} ${x} ${AUGE_Y - 4} C${x} ${AUGE_Y - 5} ${x + 2} ${AUGE_Y - 8} ${x + 5} ${AUGE_Y - 9} C${x + 12} ${AUGE_Y - 11} ${x + 14} ${AUGE_Y} ${x} ${AUGE_Y + 10} Z`} fill={P.herz} stroke={P.rotTief} strokeWidth={2} />
      <circle cx={x - 5} cy={AUGE_Y - 4} r={2} fill={P.weiss} />
    </g>
  ),
  feueraugen: (x) => (
    <g>
      <Punktauge x={x} iris={P.lava} />
      <path d={`M${x - 5} ${AUGE_Y + 8} Q${x} ${AUGE_Y + 1} ${x + 5} ${AUGE_Y + 8} Q${x} ${AUGE_Y + 5} ${x - 5} ${AUGE_Y + 8} Z`} fill={P.lavaHell} />
    </g>
  ),
  schlaefrig: (x) => (
    <g>
      <path d={`M${x - 9} 93 Q${x} 104 ${x + 9} 93 Z`} fill={P.auge} />
      <path d={`M${x - 10} 93 H${x + 10}`} {...linie} strokeWidth={4} />
      <circle cx={x + 2} cy={97} r={1.8} fill={P.weiss} />
    </g>
  ),
  zwinkern: (x, s) => (x === AUGE_R ? froh(x) : AUGEN_FORM.punktaugen(x, s)),
  // — 13.11.2026 (20261129_lernquest_neue_teile.sql) —
  kulleraugen: (x, s) => <Punktauge x={x} rx={s.gesicht === 'staunen' ? 11 : 10} ry={s.gesicht === 'staunen' ? 13.5 : 12} iris={P.holz} />,
  katzenaugen: (x) => (
    <g>
      <path d={`M${x - 11} ${AUGE_Y} Q${x} ${AUGE_Y - 13} ${x + 11} ${AUGE_Y} Q${x} ${AUGE_Y + 13} ${x - 11} ${AUGE_Y} Z`} fill={P.gruenHell} stroke={P.auge} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={x} cy={AUGE_Y} rx={2.6} ry={7.5} fill={P.auge} />
    </g>
  ),
  galaxieaugen: (x, s) => {
    const k = (Math.sin(s.zeit * 2 + x) + 1) / 2;
    return (
      <g>
        <ellipse cx={x} cy={AUGE_Y} rx={8.5} ry={10.5} fill={P.nachtTief} />
        <path d={`M${x - 6} ${AUGE_Y + 3} Q${x} ${AUGE_Y - 8} ${x + 6} ${AUGE_Y + 1}`} fill="none" stroke={P.lilaHell} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
        <path d={`M${x - 4} ${AUGE_Y + 6} Q${x + 2} ${AUGE_Y + 3} ${x + 5} ${AUGE_Y + 6}`} fill="none" stroke={P.tuerkisHell} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
        <circle cx={x - 3} cy={AUGE_Y - 4} r={1.3 + k} fill={P.weiss} />
        <circle cx={x + 4} cy={AUGE_Y - 1} r={1} fill={P.weiss} opacity={0.8} />
        <circle cx={x + 1} cy={AUGE_Y + 5} r={0.9} fill={P.gelbHell} />
      </g>
    );
  },
  regenbogenaugen: (x, s) => {
    const farben = [P.rot, P.orange, P.gelb, P.gruenHell, P.blau, P.lila];
    const d = (s.zeit * 1.5) % farben.length;
    return (
      <g>
        <ellipse cx={x} cy={AUGE_Y} rx={9} ry={11} fill={P.auge} />
        {farben.map((_, i) => (
          <path key={i} d={`M${x - 7 + i * 0.4} ${AUGE_Y + 1 + i * 1.3} Q${x} ${AUGE_Y + 9 + i * 0.5} ${x + 7 - i * 0.4} ${AUGE_Y + 1 + i * 1.3}`} fill="none" stroke={farben[Math.floor(i + d) % farben.length]} strokeWidth={1.6} />
        ))}
        <path d={stern(x - 2, AUGE_Y - 4, 3.6, 4)} fill={P.weiss} />
      </g>
    );
  },
};
/** Glasses and the like: drawn over plain eyes, in face coordinates. */
const BRILLE: Record<string, () => ReactNode> = {
  brille: () => (
    <g fill="none" stroke={P.linie} strokeWidth={3}>
      <circle cx={AUGE_L} cy={AUGE_Y} r={14} fill={P.weiss} fillOpacity={0.25} />
      <circle cx={AUGE_R} cy={AUGE_Y} r={14} fill={P.weiss} fillOpacity={0.25} />
      <path d="M94 92 Q100 88 106 92 M66 90 L52 86 M134 90 L148 86" />
      <path d={`M${AUGE_L - 9} 86 q4 -5 9 -5 M${AUGE_R - 9} 86 q4 -5 9 -5`} stroke={P.weiss} strokeWidth={2} />
    </g>
  ),
  sonnenbrille: () => (
    <g>
      <path d="M62 84 H98 Q98 104 82 104 Q64 104 62 84 Z M102 84 H138 Q136 104 118 104 Q102 104 102 84 Z" fill={P.dunkel} {...UMRISS_FEIN} />
      <path d="M98 87 H102 M62 85 L50 82 M138 85 L150 82" stroke={P.linie} strokeWidth={3} strokeLinecap="round" />
      <path d="M68 89 l8 -2 M108 89 l8 -2" stroke={P.dunkelHell} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  taucherbrille: () => (
    <g>
      <path d="M44 88 Q100 78 156 88 L156 96 Q100 86 44 96 Z" fill={P.tuerkis} {...UMRISS_FEIN} />
      <rect x={62} y={78} width={76} height={30} rx={13} fill={P.wasserHell} fillOpacity={0.45} stroke={P.blau} strokeWidth={5} />
      <rect x={62} y={78} width={76} height={30} rx={13} fill="none" {...UMRISS} />
      <path d="M98 80 V106" stroke={P.blau} strokeWidth={4} />
      <path d="M70 86 l8 -4 M108 86 l8 -4" stroke={P.weiss} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  // Visor of a robot (13.11.2026): a dark band with two light strips.
  roboteraugen: () => (
    <g>
      <path d="M50 84 L150 84 L148 106 L52 106 Z" fill={P.dunkel} {...UMRISS_FEIN} />
      <rect x={66} y={89} width={28} height={10} rx={4} fill={P.tuerkis} stroke={P.tuerkisTief} strokeWidth={1.5} />
      <rect x={106} y={89} width={28} height={10} rx={4} fill={P.tuerkis} stroke={P.tuerkisTief} strokeWidth={1.5} />
      <path d="M70 92 h10 M110 92 h10" stroke={P.tuerkisHell} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={56} cy={95} r={3} fill={P.metall} stroke={P.linie} strokeWidth={1.2} />
      <circle cx={144} cy={95} r={3} fill={P.metall} stroke={P.linie} strokeWidth={1.2} />
    </g>
  ),
  monokel: () => (
    <g>
      <circle cx={AUGE_R} cy={AUGE_Y} r={14} fill={P.weiss} fillOpacity={0.25} stroke={P.gold} strokeWidth={4} />
      <circle cx={AUGE_R} cy={AUGE_Y} r={16} fill="none" stroke={P.linie} strokeWidth={1.5} />
      <path d="M133 100 Q140 120 132 134" fill="none" stroke={P.goldTief} strokeWidth={2} strokeDasharray="3 2" />
      <path d={`M${AUGE_R - 8} 86 q4 -5 9 -5`} stroke={P.weiss} strokeWidth={2} fill="none" />
    </g>
  ),
};
export const AUGEN_ARTEN = [...Object.keys(AUGEN_FORM), ...Object.keys(BRILLE)];

function Augen({ augen, s }: { augen: string; s: Stand }) {
  const brille = augen in BRILLE ? BRILLE[augen] : undefined;
  const form = brille ? AUGEN_FORM.punktaugen : (AUGEN_FORM[augen] ?? AUGEN_FORM.punktaugen);
  let paar: ReactNode;
  if (s.gesicht === 'jubel') paar = [froh(AUGE_L), froh(AUGE_R)];
  else if (s.gesicht === 'au')
    paar = (
      <g {...linie}>
        <path d="M72 86 L87 94 L72 101" />
        <path d="M128 86 L113 94 L128 101" />
      </g>
    );
  else if (s.augenZu && augen !== 'froehlich') paar = [zu(AUGE_L), zu(AUGE_R)];
  else paar = [AUGE_L, AUGE_R].map((x) => <g key={x}>{form(x, s)}</g>);
  return (
    <g>
      {paar}
      {brille?.()}
    </g>
  );
}

function Brauen({ s, t }: { s: Stand; t: Ton }) {
  const st = { fill: 'none', stroke: t.tief, strokeWidth: 3.5, strokeLinecap: 'round' as const };
  const formen: Record<string, [string, string]> = {
    denken: ['M70 76 Q79 72 88 76', 'M112 72 Q121 66 130 71'],
    sanft: ['M71 80 Q79 78 88 74', 'M112 74 Q121 78 129 80'],
    traurig: ['M70 80 Q79 79 88 73', 'M112 73 Q121 79 130 80'],
    staunen: ['M70 72 Q79 66 88 71', 'M112 71 Q121 66 130 72'],
    au: ['M70 78 L88 82', 'M130 78 L112 82'],
  };
  const f = formen[s.gesicht] ?? ['M72 77 Q79 74 86 76', 'M114 76 Q121 74 128 77'];
  return (
    <g {...st} opacity={formen[s.gesicht] ? 1 : 0.7}>
      <path d={f[0]} />
      <path d={f[1]} />
    </g>
  );
}

/** The chosen mouths (MUENDER in src/lernquest/teile.ts). */
const MUND_FORM: Record<string, () => ReactNode> = {
  laecheln: () => <path d="M90 117 Q100 127 110 117" fill="none" {...UMRISS_FEIN} strokeWidth={3} />,
  grinsen: () => (
    <g>
      <path d="M86 115 Q100 132 114 115 Z" fill={P.weiss} {...UMRISS_FEIN} />
      <path d="M88 118 Q100 122 112 118" fill="none" stroke={P.linie} strokeWidth={1.5} />
    </g>
  ),
  lachen: () => (
    <g>
      <path d="M89 116 Q100 134 111 116 Z" fill={P.mund} {...UMRISS_FEIN} />
      <path d="M94 125 Q100 120 106 125 Q100 131 94 125 Z" fill={P.zunge} />
      <path d="M91 117 H109 L107 120 H93 Z" fill={P.weiss} />
    </g>
  ),
  staunen: () => (
    <g>
      <ellipse cx="100" cy="122" rx="6" ry="7" fill={P.mund} {...UMRISS_FEIN} />
      <ellipse cx="100" cy="126" rx="3.5" ry="2.2" fill={P.zunge} />
    </g>
  ),
  frech: () => (
    <g>
      <path d="M98 120 Q100 132 106 130 Q110 128 108 120 Z" fill={P.zunge} {...UMRISS_FEIN} />
      <path d="M103 122 V127" stroke={P.mund} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M90 118 Q100 124 112 117" fill="none" {...UMRISS_FEIN} strokeWidth={3} />
    </g>
  ),
  ernst: () => <path d="M92 120 H108" fill="none" {...UMRISS_FEIN} strokeWidth={3} />,
};
export const MUND_ARTEN = Object.keys(MUND_FORM);

function Mund({ mund, s }: { mund: string; s: Stand }) {
  if (s.gesicht === 'lachen' || s.gesicht === 'jubel') return <>{MUND_FORM.lachen()}</>;
  if (s.gesicht === 'staunen' || s.gesicht === 'au') return <>{MUND_FORM.staunen()}</>;
  if (s.gesicht === 'traurig') return <path d="M92 122 Q100 115 108 122" fill="none" {...UMRISS_FEIN} strokeWidth={3} />;
  if (s.gesicht === 'denken') return <path d="M95 120 Q101 117 106 120" fill="none" {...UMRISS_FEIN} strokeWidth={3} />;
  return <>{(MUND_FORM[mund] ?? MUND_FORM.laecheln)()}</>;
}

// — Hair: a part behind the head and one in front, in the chosen colour. —

const KOPF = 'M120 50 C154 50 172 72 172 100 C172 128 150 146 120 146 C90 146 68 128 68 100 C68 72 86 50 120 50 Z';
const PONY = 'M66 104 C60 66 86 44 120 44 C154 44 180 66 174 104 C170 92 166 84 160 80 C150 86 136 80 128 72 C118 82 98 86 84 82 C78 88 70 94 66 104 Z';
const GLATT = 'M66 100 C62 62 88 44 120 44 C152 44 178 62 174 100 C168 82 150 70 120 70 C90 70 72 82 66 100 Z';
const STACHELN = 'M66 100 C62 74 72 58 84 52 L78 30 L100 44 L106 20 L120 40 L134 20 L140 44 L162 30 L156 52 C168 58 178 74 174 100 C166 86 156 80 148 78 C136 84 104 84 92 78 C84 80 74 86 66 100 Z';
const BOB_VORN = 'M66 102 C62 62 88 44 120 44 C152 44 178 62 174 102 L168 102 L166 80 Q120 72 74 80 L72 102 Z';

function Haarform({ d, t, licht = 'M84 62 Q100 50 116 50' }: { d: string; t: Ton; licht?: string }) {
  return (
    <g>
      <path d={d} fill={t.farbe} />
      <path d={licht} fill="none" stroke={t.hell} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      <path d={d} fill="none" {...UMRISS} />
    </g>
  );
}
const Locken = ({ t, punkte, r }: { t: Ton; punkte: Punkt[]; r: number }) => (
  <g>
    {punkte.map(([x, y]) => (
      <circle key={`u${x},${y}`} cx={x} cy={y} r={r + 3} fill={P.linie} />
    ))}
    {punkte.map(([x, y]) => (
      <circle key={`f${x},${y}`} cx={x} cy={y} r={r} fill={t.farbe} />
    ))}
    {punkte.slice(0, 3).map(([x, y]) => (
      <path key={`l${x},${y}`} d={`M${x - r / 2} ${y - r / 3} q${r / 3} ${-r / 3} ${r * 0.7} ${-r / 4}`} fill="none" stroke={t.hell} strokeWidth={3} strokeLinecap="round" />
    ))}
  </g>
);
const Zopfband = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={5} fill={P.rot} {...UMRISS_FEIN} />;
const Flechte = ({ x, t }: { x: number; t: Ton }) => (
  <g>
    {[112, 126, 140, 154].map((y) => (
      <ellipse key={y} cx={x} cy={y} rx={9} ry={8} fill={t.farbe} {...UMRISS_FEIN} />
    ))}
    <Zopfband x={x} y={164} />
    <path d={`M${x - 5} 168 L${x} 180 L${x + 5} 168 Z`} fill={t.farbe} {...UMRISS_FEIN} />
  </g>
);

/** Rainbow hair (13.11.2026): long hair in six coloured bands, its own colours whatever the hair colour. */
function RegenbogenHaar({ teil }: { teil: 'hinten' | 'vorn' }) {
  const id = `regenbogen-${useId().replace(/:/g, '')}`;
  const d = teil === 'hinten' ? 'M64 96 C60 58 88 42 120 42 C152 42 180 58 176 96 L182 170 Q170 178 156 170 L152 140 L88 140 L84 170 Q70 178 58 170 Z' : PONY;
  const farben = [P.rot, P.orange, P.gelb, P.gruenHell, P.blau, P.lila];
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {farben.map((f, i) => (
          <rect key={f} x={50} y={36 + i * (teil === 'hinten' ? 24 : 12)} width={140} height={teil === 'hinten' ? 25 : 13} fill={f} />
        ))}
        <path d="M84 62 Q100 50 116 50" fill="none" stroke={P.weiss} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      </g>
      <path d={d} fill="none" {...UMRISS} />
    </g>
  );
}

const FRISUR_FORM: Record<string, { hinten?: (t: Ton) => ReactNode; vorn?: (t: Ton) => ReactNode }> = {
  kurz: { vorn: (t) => <Haarform d={PONY} t={t} /> },
  zopf: {
    hinten: (t) => (
      <g>
        <path d="M152 58 C192 58 198 104 186 144 C182 154 172 152 174 140 C180 110 174 84 150 74 Z" fill={t.farbe} {...UMRISS} />
        <path d="M180 92 Q186 110 182 126" fill="none" stroke={t.hell} strokeWidth={3.5} strokeLinecap="round" />
        <Zopfband x={160} y={66} />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  locken: {
    hinten: (t) => <Locken t={t} r={14} punkte={[[66, 108], [174, 108], [70, 128], [170, 128], [62, 88], [178, 88]]} />,
    vorn: (t) => <Locken t={t} r={14} punkte={[[92, 54], [120, 46], [148, 54], [72, 70], [168, 70], [106, 66], [134, 66], [84, 82], [156, 82]]} />,
  },
  lang: {
    hinten: (t) => (
      <g>
        <path d="M64 96 C60 58 88 42 120 42 C152 42 180 58 176 96 L182 170 Q170 178 156 170 L152 140 L88 140 L84 170 Q70 178 58 170 Z" fill={t.farbe} {...UMRISS} />
        <path d="M64 110 L62 160 M176 110 L178 160" stroke={t.tief} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      </g>
    ),
    vorn: (t) => <Haarform d={PONY} t={t} />,
  },
  zoepfe: {
    hinten: (t) => (
      <g>
        <Flechte x={62} t={t} />
        <Flechte x={178} t={t} />
      </g>
    ),
    vorn: (t) => (
      <g>
        <Haarform d={GLATT} t={t} />
        <path d="M120 46 V70" stroke={t.tief} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    ),
  },
  dutt: {
    hinten: (t) => (
      <g>
        <circle cx={120} cy={40} r={18} fill={t.farbe} {...UMRISS} />
        <path d="M108 34 Q114 26 122 26" fill="none" stroke={t.hell} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M104 52 Q120 58 136 52" fill="none" stroke={P.rot} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  stacheln: { vorn: (t) => <Haarform d={STACHELN} t={t} licht="M86 60 L84 44 M104 50 L108 34" /> },
  bob: {
    hinten: (t) => <path d="M62 100 C58 60 88 42 120 42 C152 42 182 60 178 100 L180 140 Q170 146 160 142 L80 142 Q70 146 60 140 Z" fill={t.farbe} {...UMRISS} />,
    vorn: (t) => <Haarform d={BOB_VORN} t={t} />,
  },
  glatze: {},
  // Own hair of the teacher (lq_frisur): short curls close to the head.
  f25e0e76346: {
    hinten: (t) => <Locken t={t} r={11} punkte={[[66, 98], [174, 98], [64, 116], [176, 116]]} />,
    vorn: (t) => <Locken t={t} r={11} punkte={[[96, 52], [120, 46], [144, 52], [78, 64], [162, 64], [108, 62], [132, 62], [70, 82], [170, 82], [90, 74], [150, 74]]} />,
  },
  // — 13.11.2026: ten more (20261129_lernquest_neue_teile.sql), two per rarity. —
  pferdeschwanz: {
    hinten: (t) => (
      <g>
        <path d="M118 40 C152 18 190 40 186 86 C184 112 178 128 168 136 C170 116 170 96 160 80 C150 66 134 56 118 52 Z" fill={t.farbe} {...UMRISS} />
        <path d="M168 58 Q182 76 178 102" fill="none" stroke={t.hell} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M176 92 Q174 112 168 124" fill="none" stroke={t.tief} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
        <ellipse cx={126} cy={44} rx={7} ry={6} fill={P.tuerkis} {...UMRISS_FEIN} />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  buerste: {
    vorn: (t) => (
      <g>
        <Haarform d="M68 98 C64 72 74 56 88 50 L90 38 L150 38 L152 50 C166 56 176 72 172 98 C168 84 156 76 120 74 C84 76 72 84 68 98 Z" t={t} licht="M96 44 L96 58" />
        <path d="M104 42 V56 M112 41 V55 M128 41 V55 M136 42 V56 M144 43 V57" stroke={t.tief} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </g>
    ),
  },
  afro: {
    hinten: (t) => (
      <g>
        <circle cx={120} cy={82} r={66} fill={P.linie} />
        <circle cx={120} cy={82} r={63} fill={t.farbe} />
        <Locken t={t} r={13} punkte={[[62, 60], [178, 60], [56, 92], [184, 92], [62, 122], [178, 122], [84, 30], [156, 30], [120, 20]]} />
        <path d="M74 44 Q90 26 112 22" fill="none" stroke={t.hell} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
    vorn: (t) => <Locken t={t} r={11} punkte={[[86, 58], [104, 50], [122, 48], [140, 50], [156, 58], [72, 72], [168, 72]]} />,
  },
  seitenzopf: {
    hinten: (t) => (
      <g>
        <path d="M70 70 C54 92 52 120 58 144 C62 154 72 152 70 140 C66 118 70 96 82 80 Z" fill={t.farbe} {...UMRISS} />
        {[150, 164, 178].map((y) => (
          <ellipse key={y} cx={64} cy={y} rx={9} ry={8} fill={t.farbe} {...UMRISS_FEIN} />
        ))}
        <Zopfband x={64} y={188} />
        <path d="M59 192 L64 204 L69 192 Z" fill={t.farbe} {...UMRISS_FEIN} />
      </g>
    ),
    vorn: (t) => (
      <g>
        <Haarform d={GLATT} t={t} />
        <path d="M104 46 Q100 58 96 72" fill="none" stroke={t.tief} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    ),
  },
  haarschnecken: {
    hinten: (t) => (
      <g>
        {[82, 158].map((x) => (
          <g key={x}>
            <circle cx={x} cy={46} r={19} fill={t.farbe} {...UMRISS} />
            <path d={`M${x} 46 q6 0 6 -6 q0 -8 -9 -8 q-11 0 -11 11 q0 13 14 13`} fill="none" stroke={t.tief} strokeWidth={2.5} strokeLinecap="round" />
            <path d={`M${x - 10} 36 q4 -5 10 -6`} fill="none" stroke={t.hell} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
        <circle cx={96} cy={60} r={4} fill={P.rosa} {...UMRISS_FEIN} />
        <circle cx={144} cy={60} r={4} fill={P.rosa} {...UMRISS_FEIN} />
      </g>
    ),
    vorn: (t) => (
      <g>
        <Haarform d={GLATT} t={t} />
        <path d="M120 46 V70" stroke={t.tief} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    ),
  },
  wuschelkopf: {
    vorn: (t) => (
      <g>
        <Haarform
          d="M66 102 C56 82 62 60 78 52 C74 38 92 32 100 40 C104 28 122 26 126 36 C136 26 154 30 154 44 C168 44 180 62 174 80 C180 88 178 96 174 102 C168 88 160 82 150 82 C146 88 136 88 130 82 C122 90 110 90 104 82 C96 88 86 88 82 82 C74 86 70 94 66 102 Z"
          t={t}
          licht="M84 56 Q96 44 110 44"
        />
        {/* Two loose strands sticking up */}
        <path d="M120 40 q4 -14 14 -16 M98 44 q-6 -10 -2 -18" fill="none" stroke={P.linie} strokeWidth={8} strokeLinecap="round" />
        <path d="M120 40 q4 -14 14 -16 M98 44 q-6 -10 -2 -18" fill="none" stroke={t.farbe} strokeWidth={4} strokeLinecap="round" />
        <path d="M90 66 q8 4 14 0 M132 66 q8 4 14 0" fill="none" stroke={t.tief} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    ),
  },
  blitzfrisur: {
    vorn: (t) => (
      <g>
        <Haarform
          d="M66 100 C60 76 68 60 82 52 L70 28 L98 42 L104 16 L120 38 L140 12 L142 42 L170 30 L158 54 C170 62 178 78 174 100 C166 86 156 80 148 78 C136 84 104 84 92 78 C84 80 74 86 66 100 Z"
          t={t}
          licht="M84 56 L76 38 M106 44 L106 26"
        />
        {/* A golden lightning streak */}
        <path d="M126 34 L116 56 L126 56 L114 80 L136 50 L126 50 L136 34 Z" fill={P.gelb} stroke={P.linie} strokeWidth={2} strokeLinejoin="round" />
      </g>
    ),
  },
  sternenzopf: {
    hinten: (t) => (
      <g>
        <path d="M150 56 C186 60 192 100 184 140 C182 168 176 190 170 202 C162 190 166 170 168 148 C172 112 168 86 148 72 Z" fill={t.farbe} {...UMRISS} />
        <path d="M178 90 Q184 116 178 150" fill="none" stroke={t.hell} strokeWidth={3.5} strokeLinecap="round" />
        {[
          [176, 104],
          [174, 140],
          [170, 176],
        ].map(([x, y]) => (
          <path key={y} d={stern(x, y, 8)} fill={P.gold} stroke={P.goldTief} strokeWidth={1.8} strokeLinejoin="round" />
        ))}
      </g>
    ),
    vorn: (t) => (
      <g>
        <Haarform d={GLATT} t={t} />
        <path d={stern(90, 58, 8)} fill={P.gold} stroke={P.goldTief} strokeWidth={1.8} strokeLinejoin="round" />
      </g>
    ),
  },
  regenbogenhaar: { hinten: () => <RegenbogenHaar teil="hinten" />, vorn: () => <RegenbogenHaar teil="vorn" /> },
  feuerhaar: {
    hinten: () => (
      <g>
        <path d="M62 100 C50 70 60 40 80 30 C78 46 86 50 92 40 C96 22 112 12 122 8 C118 26 128 32 136 22 C150 26 158 40 152 54 C164 46 176 56 178 70 C186 84 182 96 178 100 Z" fill={P.lava} {...UMRISS} />
        <path d="M80 60 C78 46 88 40 96 50 C100 34 114 26 120 22 C118 38 128 42 134 36 C144 40 150 50 148 62 Z" fill={P.lavaHell} />
        <path d="M100 52 C104 42 112 38 116 34 C116 44 122 48 128 46 C134 50 136 56 134 62 Z" fill={P.gelb} />
      </g>
    ),
    vorn: () => (
      <g>
        <path d={PONY} fill={P.lava} />
        <path d="M84 62 Q100 50 116 50" fill="none" stroke={P.lavaHell} strokeWidth={5} strokeLinecap="round" />
        <path d="M128 72 C134 62 146 58 156 66 C150 70 152 76 160 80 C150 86 136 80 128 72 Z" fill={P.lavaHell} />
        <path d={PONY} fill="none" {...UMRISS} />
      </g>
    ),
  },
};
export const FRISUR_ARTEN = Object.keys(FRISUR_FORM);

// — The figure —

function arm(seite: 'l' | 'r', k: Kleid, haut: Ton): Teil {
  const x = seite === 'l' ? 94 : 146;
  const schulter: Punkt = [x, 148];
  const ellbogen: Punkt = [x, 166];
  const hand: Punkt = [x, 186];
  const oben = k.aermel === 'haut' ? haut : k.aermel;
  const unten = k.unterarm === 'haut' ? haut : k.unterarm;
  const h = k.hand ?? haut;
  return {
    id: `arm-${seite}`,
    drehpunkt: schulter,
    zeichnung: () => <Glied von={schulter} bis={ellbogen} farbe={oben.farbe} schatten={oben.tief} />,
    kinder: [
      {
        id: `unterarm-${seite}`,
        drehpunkt: ellbogen,
        zeichnung: () => (
          <g>
            {/* Straight end at the elbow (no round cap): the cap's outline lay over the upper arm as a ring, which
                read as a stripe at the elbow (teacher's review 12.11.2026). The upper arm's own cap rounds the bend,
                the hand covers the lower end. */}
            <path d={`M${x} 166 V184`} fill="none" stroke={P.linie} strokeWidth={19} />
            <path d={`M${x} 166 V184`} fill="none" stroke={unten.farbe} strokeWidth={13} />
            {/* The joint dot takes the sleeve's colour, so a short sleeve ends round; the shadow runs on across it. */}
            <circle cx={x} cy={166} r={6.5} fill={oben.farbe} />
            <path d={`M${x + 3} 160.5 V171.5`} fill="none" stroke={oben.tief} strokeWidth={4} opacity={0.6} />
            <path d={`M${x + 3} 171.5 V184`} fill="none" stroke={unten.tief} strokeWidth={4} opacity={0.6} />
            <circle cx={hand[0]} cy={hand[1]} r={9} fill={h.farbe} {...UMRISS} />
            <path d={`M${x - 5} ${hand[1] - 4} q3 -3 6 -2`} fill="none" stroke={h.hell} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        ),
        anker: { [seite === 'l' ? 'hand-links' : 'hand-rechts']: hand },
      },
    ],
  };
}

function koerper(k: Kleid): Teil {
  return {
    id: 'koerper',
    drehpunkt: [120, 200],
    anker: { begleiter: [34, 230] },
    zeichnung: (s) => (
      <g>
        {k.hinten?.()}
        {/* Legs and shoes */}
        {[100, 122].map((x) => (
          <g key={x}>
            <rect x={x} y={186} width={18} height={30} rx={5} fill={k.hose.farbe} {...UMRISS} />
            <path d={`M${x + 12} 190 V212`} stroke={k.hose.tief} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
            <path d={`M${x - 3} 226 Q${x - 3} 210 ${x + 9} 210 Q${x + 23} 210 ${x + 23} 226 Z`} fill={k.schuhe.farbe} {...UMRISS} />
            <path d={`M${x + 2} 218 q3 -4 8 -4`} fill="none" stroke={k.schuhe.hell} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        ))}
        {k.rumpf(s)}
      </g>
    ),
  };
}

function kopf(haut: Ton, haar: Ton, frisur: string, augen: string, mund: string): Teil {
  const f = FRISUR_FORM[frisur] ?? FRISUR_FORM.kurz;
  return {
    id: 'kopf',
    drehpunkt: [120, 140],
    anker: { hut: [120, 58] },
    zeichnung: (s) => (
      <g>
        {f.hinten?.(haar)}
        {/* Ears, head with light and shade */}
        {[68, 172].map((x) => (
          <g key={x}>
            <circle cx={x} cy={104} r={10} fill={haut.farbe} {...UMRISS} />
            <circle cx={x} cy={104} r={4} fill={haut.tief} opacity={0.7} />
          </g>
        ))}
        <path d={KOPF} fill={haut.farbe} />
        <path d="M168 104 C166 130 146 146 120 146 C146 138 160 122 162 104 Z" fill={haut.tief} opacity={0.55} />
        <path d="M78 84 Q82 66 98 58" fill="none" stroke={haut.hell} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
        <path d={KOPF} fill="none" {...UMRISS} />
        {f.vorn?.(haar)}
        <g transform="translate(20 11)">
          <ellipse cx="66" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.55} />
          <ellipse cx="134" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.55} />
          <Brauen s={s} t={haar} />
          <Augen augen={augen} s={s} />
          <path d="M97 105 Q100 108 103 105" fill="none" stroke={haut.tief} strokeWidth={2.5} strokeLinecap="round" />
          <Mund mund={mund} s={s} />
          {s.gesicht === 'traurig' && <path d="M131 101 q4 6 0 9 q-4 -3 0 -9 Z" fill={P.blauHell} stroke={P.blauTief} strokeWidth={1.5} />}
        </g>
      </g>
    ),
  };
}

const ruhe = { 'arm-l': 12, 'unterarm-l': -6, 'arm-r': -12, 'unterarm-r': 6 };
const posen: Record<string, Pose> = {
  stehen: { name: 'Stehen', gesicht: 'froh', winkel: ruhe },
  winken: { name: 'Winken', gesicht: 'lachen', winkel: { ...ruhe, 'arm-r': -120, 'unterarm-r': -35 }, vorne: ['arm-r'] },
  jubeln: { name: 'Jubeln', gesicht: 'jubel', winkel: { 'arm-l': 95, 'unterarm-l': 40, 'arm-r': -95, 'unterarm-r': -40 }, extras: ['sterne'] },
  denken: { name: 'Denken', gesicht: 'denken', winkel: { ...ruhe, 'arm-r': -164, 'unterarm-r': -96, kopf: -4 }, vorne: ['arm-r'], extras: ['gedanken'] },
  staunen: { name: 'Staunen', gesicht: 'staunen', winkel: { 'arm-l': 40, 'unterarm-l': 30, 'arm-r': -40, 'unterarm-r': -30 }, extras: ['ausruf'] },
  traurig: { name: 'Traurig', gesicht: 'traurig', winkel: { 'arm-l': 4, 'unterarm-l': -4, 'arm-r': -4, 'unterarm-r': 4, kopf: 6 } },
};
/** The fox's extras (stars, thought bubbles, „!“), moved over to the hero's head. */
const extras = Object.fromEntries(
  (['sterne', 'gedanken', 'ausruf'] as const).map((e) => [e, (s: Stand) => <g transform="translate(20 0)">{FUCHS.extras![e](s)}</g>]),
);

const SPEICHER = new Map<string, Figur>();
const nimm = <W,>(liste: Record<string, W>, id: string | undefined, sonst: string) => (id && id in liste ? id : sonst);

/** The hero as the child made it. Same look, same object (cached), so React and the clock are not disturbed. */
export function held(a: Aussehen = {}): Figur {
  const haut = HAUT_TOENE[a.haut ?? 0] ?? HAUT_TOENE[0];
  const haar = HAAR_TOENE[a.haarfarbe ?? 0] ?? HAAR_TOENE[0];
  const frisur = nimm(FRISUR_FORM, a.frisur, 'kurz');
  const augen = a.augen && AUGEN_ARTEN.includes(a.augen) ? a.augen : 'punktaugen';
  const mund = nimm(MUND_FORM, a.mund, 'laecheln');
  const kleid = nimm(KLEIDUNG, a.kleidung, 'tshirt');
  const schluessel = [HAUT_TOENE.indexOf(haut), HAAR_TOENE.indexOf(haar), frisur, augen, mund, kleid].join('|');
  const alt = SPEICHER.get(schluessel);
  if (alt) return alt;
  const k = KLEIDUNG[kleid];
  const f: Figur = {
    id: 'held',
    name: 'Held',
    art: 'held',
    groesse: [240, 240],
    boden: [120, 230],
    teile: [koerper(k), arm('l', k, haut), arm('r', k, haut), kopf(haut, haar, frisur, augen, mund)],
    posen,
    gesichter: ['froh', 'lachen', 'jubel', 'denken', 'sanft', 'staunen', 'traurig', 'au'],
    animationen: ['atmen', 'winken', 'huepfen', 'jubeln', 'staunen', 'seufzen', 'nicken', 'kopfschuetteln', 'treffer'],
    extras,
  };
  SPEICHER.set(schluessel, f);
  return f;
}

export const HELD = held();

/** The teacher's own parts and hair (lq_teil / lq_frisur on the server, made on the teacher page) that are drawn here
 *  by their id; the workshop lists them to review. `seltenheit` 0–4 as in src/lernquest/teile.ts. */
export const EIGENE_ZEICHNUNGEN: { id: string; slot: 'kopf' | 'kleidung' | 'hintergrund' | 'frisur'; name: string; seltenheit: number }[] = [
  { id: 'e97c799d057', slot: 'kopf', name: 'Crowns Guard Helmet', seltenheit: 2 },
  { id: 'e0a70ed2238', slot: 'kleidung', name: 'Guilie Suit', seltenheit: 3 },
  { id: 'e57ef47f771', slot: 'hintergrund', name: 'Höllenfeuer', seltenheit: 3 },
  { id: 'e48100506fe', slot: 'kopf', name: 'Militärhelm', seltenheit: 1 },
  { id: 'f25e0e76346', slot: 'frisur', name: 'Curlyshort', seltenheit: 0 },
];
