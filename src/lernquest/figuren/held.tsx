// The children's hero (Stufe E, Teil 4): one chibi figure on the same rig as the fox, made from what the child chose
// (src/lernquest/teile.ts `Avatar`): skin tone, hair and its colour, mouth, eyes and clothes are drawn into the figure;
// hats, tools and the companion are items on its anchors (`hut`, `hand-rechts`, `hand-links`, `begleiter`); the
// background is a scene behind it (hintergruende.tsx). Faces of a pose (jubel, staunen …) win over the chosen
// mouth and eyes for a moment, glasses stay on.
import { useId } from 'react';
import type { ReactNode } from 'react';
import { Flaeche, ovalPfad, Schlagschatten } from './flaeche';
import { FUCHS, Glied } from './fuchs';
import { flaeche, HAAR_TOENE, HAUT_TOENE, P, STRICH } from './stil';
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
      <Flaeche d={d} farbe={t.farbe} hell={t.hell} />
      <path d="M138 140 Q146 141 148 140 L153 196 Q142 199 132 200 Q140 170 138 140 Z" fill={t.tief} opacity={0.5} />
      <path d="M96 148 Q95 166 96 184" fill="none" stroke={t.hell} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      {kinder}
    </g>
  );
}
const Kragen = ({ t }: { t: Ton }) => <path d="M106 137 Q120 150 134 137" fill="none" stroke={t.tief} strokeWidth={3} strokeLinecap="round" />;
const Knoepfe = ({ x = 120, ys, t = T.gold }: { x?: number; ys: number[]; t?: Ton }) => (
  <g>
    {ys.map((y) => (
      <circle key={y} cx={x} cy={y} r={2.8} fill={t.farbe} stroke={t.farbe} strokeWidth={1.5} />
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
    <Flaeche d="M92 140 Q120 130 148 140 L170 216 Q120 228 70 216 Z" farbe={t.farbe} hell={t.hell} />
    <path d="M150 160 L168 214 Q156 218 146 219 Z" fill={t.tief} opacity={0.55} />
  </g>
);

/** A wide band across the torso (belt, stripe, hem), ends inside the body. */
const Band = ({ y, h = 9, farbe, x = 90, b = 60 }: { y: number; h?: number; farbe: string; x?: number; b?: number }) => (
  <rect x={x} y={y} width={b} height={h} rx={Math.min(4, h / 2)} {...flaeche(farbe, 2)} />
);
/** A hood or collar lying behind the neck. */
const Kapuze = ({ t }: { t: Ton }) => <Flaeche d="M94 144 Q86 122 106 126 Q120 138 134 126 Q154 122 146 144 Z" farbe={t.farbe} hell={t.hell} />;
/** A shoulder plate with a shade at the bottom, in the light tone of its set (metal, gold) or in `farbe`. */
const Schulter = ({ x, k, t, farbe = t.hell }: { x: number; k: 1 | -1; t: Ton; farbe?: string }) => (
  <g>
    <Flaeche d={`M${x - 14 * k} 142 Q${x} 130 ${x + 14 * k} 142 L${x + 12 * k} 156 Q${x} 162 ${x - 12 * k} 156 Z`} farbe={farbe} hell={t.hell} breite={2.5} />
    <path d={`M${x - 11 * k} 153 Q${x} 159 ${x + 11 * k} 153 L${x + 12 * k} 156 Q${x} 162 ${x - 12 * k} 156 Z`} fill={t.tief} opacity={0.6} />
  </g>
);
const Stern = ({ x, y, r, farbe = P.gold }: { x: number; y: number; r: number; farbe?: string }) => <path d={stern(x, y, r)} {...flaeche(farbe, 2)} />;

export const KLEIDUNG: Record<string, Kleid> = {
  tshirt: {
    aermel: T.blau,
    unterarm: 'haut',
    hose: T.jeans,
    schuhe: T.rot,
    rumpf: () => (
      <Rumpf
        t={T.blau}
        kinder={
          <>
            <Kragen t={T.blau} />
            <path d={stern(122, 170, 13)} fill={P.blauTief} opacity={0.5} strokeWidth={2} stroke={P.blauTief} strokeLinejoin="round" />
            <path d={stern(120, 168, 13)} {...flaeche(P.weiss, 2)} />
          </>
        }
      />
    ),
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
            <path d="M106 136 Q120 146 134 136" fill="none" stroke={P.rotTief} strokeWidth={6} strokeLinecap="round" />
            <Band y={162} h={10} farbe={P.weiss} />
            <Band y={188} h={9} farbe={P.rotTief} x={88} b={64} />
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
        <path d="M98 140 L102 164 M142 140 L138 164" stroke={P.blau} strokeWidth={8} strokeLinecap="round" />
        <path d="M99 162 L141 162 L142 197 Q120 202 98 197 Z" {...flaeche(P.blau, 2.5)} />
        <rect x={108} y={172} width={24} height={15} rx={4} {...flaeche(P.blauTief, 2)} />
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
            <path d="M92 140 Q104 136 112 140 L114 198 Q100 199 88 196 Z M148 140 Q136 136 128 140 L126 198 Q140 199 152 196 Z" {...flaeche(P.oliv, 2.5)} />
            <Knoepfe x={120} ys={[164, 180]} t={T.leder} />
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
            <path d="M120 140 V198" stroke={P.metallTief} strokeWidth={3} />
            <Band y={176} h={9} farbe={P.metallTief} />
            <Schulter x={84} k={-1} t={T.metall} />
            <Schulter x={156} k={1} t={T.metall} />
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
            <Stern x={106} y={170} r={11} />
            <Stern x={134} y={188} r={7} />
            <Stern x={136} y={158} r={5} />
            <path d="M104 138 Q120 150 136 138" fill="none" stroke={P.gold} strokeWidth={4} strokeLinecap="round" />
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
            <path d="M120 140 V224" stroke={P.gold} strokeWidth={5} />
            <path d="M82 212 Q120 220 158 212" fill="none" stroke={P.gold} strokeWidth={6} />
            <Stern x={104} y={178} r={11} />
            <path d="M106 137 Q120 150 134 137" fill="none" stroke={P.gold} strokeWidth={4} strokeLinecap="round" />
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
            <Band y={182} h={9} farbe={P.goldTief} />
            <Schulter x={84} k={-1} t={T.gold} />
            <Schulter x={156} k={1} t={T.gold} />
            <path d="M120 150 l13 13 -13 13 -13 -13 Z" {...flaeche(P.rot, 2.5)} />
            <Funkeln x={102} y={184} r={6} zeit={zeit} />
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
        <Kapuze t={T.gruen} />
        <Rumpf
          t={T.gruen}
          kinder={
            <>
              <path d="M112 142 L110 164 M128 142 L130 164" stroke={P.weiss} strokeWidth={3} strokeLinecap="round" />
              <path d="M98 176 L142 176 L146 194 Q120 198 94 194 Z" {...flaeche(P.gruenTief, 2.5)} />
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
            <path d="M106 137 L120 150 L134 137" fill="none" stroke={P.weiss} strokeWidth={5} strokeLinejoin="round" />
            <path d="M92 150 L90 196 M148 150 L150 196" stroke={P.weiss} strokeWidth={6} />
            <path d="M112 170 L122 162 V194" fill="none" stroke={P.weiss} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
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
            {[
              [106, 168],
              [134, 168],
              [120, 184],
            ].map(([x, y]) => (
              <path key={`${x},${y}`} d={`M${x - 12} ${y} q12 14 24 0`} fill="none" stroke={P.gruenTief} strokeWidth={4} strokeLinecap="round" />
            ))}
            <path d="M84 148 L88 130 Q94 134 98 142 Z M156 148 L152 130 Q146 134 142 142 Z" {...flaeche(P.gold, 2.5)} />
            <circle cx={120} cy={152} r={7} {...flaeche(P.rot, 2.5)} />
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
        <Kapuze t={T.gelb} />
        <Rumpf
          t={T.gelb}
          kinder={
            <>
              <path d="M120 140 V198" stroke={P.gelbTief} strokeWidth={3} />
              <path d="M94 174 h18 v14 h-18 Z M128 174 h18 v14 h-18 Z" {...flaeche(P.gelbTief, 2.5)} />
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
            <path d="M102 140 L136 176" stroke={P.dunkelHell} strokeWidth={5} strokeLinecap="round" />
            <Band y={180} h={11} farbe={P.rot} x={88} b={64} />
            <path d="M138 188 l10 14" stroke={P.rot} strokeWidth={6} strokeLinecap="round" />
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
            <path d="M104 136 Q120 148 136 136" fill="none" stroke={P.grau} strokeWidth={6} strokeLinecap="round" />
            <rect x={105} y={156} width={30} height={22} rx={6} {...flaeche(P.blau, 2.5)} />
            <circle cx={114} cy={167} r={4} fill={P.rot} />
            <circle cx={126} cy={167} r={4} fill={P.gelb} />
            <Band y={186} h={8} farbe={P.grau} x={88} b={64} />
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
            <path d="M120 144 L138 164 L120 190 L102 164 Z" {...flaeche(P.eisHell, 2.5)} />
            <path d="M120 164 L138 164 L120 190 Z" fill={P.eisTief} opacity={0.6} />
            <path d="M84 144 L90 126 Q96 132 100 140 Z M156 144 L150 126 Q144 132 140 140 Z" {...flaeche(P.eisHell, 2.5)} />
            <Band y={192} h={7} farbe={P.gold} x={90} b={60} />
            <Funkeln x={106} y={152} r={6} zeit={zeit} />
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
            {/* Camouflage: three big patches, one gold badge */}
            <path d="M92 152 q12 -10 24 0 q-6 14 -24 0 Z M122 166 q14 -8 24 4 q-10 12 -24 -4 Z M98 182 q12 -6 20 4 q-8 10 -20 -4 Z" fill={P.olivTief} />
            <path d="M128 150 q6 -8 12 -4 q-2 10 -12 4 Z" {...flaeche(P.gold, 2)} />
            <Funkeln x={140} y={186} r={6} zeit={zeit} />
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
            {/* Checks as a few big fields: two dark stripes down, two across */}
            <path d="M107 140 V198 M133 140 V198" stroke={P.rotTief} strokeWidth={9} opacity={0.5} />
            <path d="M89 166 H151 M88 188 H152" stroke={P.rotTief} strokeWidth={9} opacity={0.5} />
            <path d="M106 136 L114 150 L120 140 L126 150 L134 136" {...flaeche(P.weiss, 2.5)} />
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
            <path d="M120 140 V198" stroke={P.tuerkisTief} strokeWidth={3} />
            <path d="M93 148 L90 196 M147 148 L150 196" stroke={P.weiss} strokeWidth={6} strokeLinecap="round" />
            <path d="M106 137 Q120 148 134 137" fill="none" stroke={P.tuerkisTief} strokeWidth={6} strokeLinecap="round" />
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
      <Rumpf
        t={T.weiss}
        kinder={
          <>
            <path d="M92 140 L120 174 L148 140 L148 154 L120 188 L92 154 Z" {...flaeche(P.blauTief, 2.5)} />
            <path d="M110 170 L120 178 L130 170 L136 194 L120 186 L104 194 Z" {...flaeche(P.rot, 2.5)} />
          </>
        }
      />
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
            <Band y={162} h={10} farbe={P.gelb} x={88} b={64} />
            <Band y={184} h={10} farbe={P.gelb} x={88} b={64} />
            <circle cx={138} cy={150} r={8} {...flaeche(P.rot, 2)} />
            <path d="M134 150 h8 M138 146 v8" stroke={P.weiss} strokeWidth={3} />
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
      <Rumpf
        t={T.sand}
        d="M90 140 Q120 132 150 140 L157 204 Q120 212 83 204 Z"
        kinder={
          <>
            <path d="M106 137 L114 164 L120 148 L126 164 L134 137" {...flaeche(P.sandHell, 2.5)} />
            <path d="M120 148 V206" stroke={P.sandTief} strokeWidth={3} />
            <path d="M86 176 Q120 182 154 176 L155 186 Q120 192 85 186 Z" {...flaeche(P.sandTief, 2)} />
            <rect x={113} y={176} width={14} height={11} rx={3} {...flaeche(P.metallTief, 2)} />
          </>
        }
      />
    ),
  },
  piratenjacke: {
    aermel: T.rot,
    unterarm: T.weiss,
    hose: T.dunkel,
    schuhe: T.leder,
    rumpf: () => (
      <Rumpf
        t={T.rot}
        kinder={
          <>
            <path d="M108 138 L120 180 L132 138 Z" {...flaeche(P.schnee, 2.5)} />
            <path d="M108 138 L116 198 M132 138 L124 198" stroke={P.gold} strokeWidth={4} />
            <Band y={178} h={13} farbe={P.leder} x={88} b={64} />
            <rect x={112} y={178} width={16} height={13} rx={4} {...flaeche(P.gold, 2)} />
          </>
        }
      />
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
              {[160, 176, 192].map((y) => (
                <path key={y} d={`M89 ${y} Q120 ${y + 6} 151 ${y}`} fill="none" stroke={P.rotTief} strokeWidth={4} />
              ))}
              <path d="M96 142 L144 196" stroke={P.gold} strokeWidth={5} strokeLinecap="round" />
              <path d="M106 137 Q120 148 134 137" fill="none" stroke={P.dunkel} strokeWidth={6} strokeLinecap="round" />
            </>
          }
        />
        {/* Red lacquered shoulder plates, laced (the light red of T.rot is the cheek colour and read as pink) */}
        <Schulter x={80} k={-1} t={T.rot} farbe={P.rot} />
        <Schulter x={160} k={1} t={T.rot} farbe={P.rot} />
        <path d="M68 146 Q80 150 92 146 M148 146 Q160 150 172 146" fill="none" stroke={P.rotTief} strokeWidth={3} strokeLinecap="round" />
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
            <path d="M120 140 V226" stroke={P.gold} strokeWidth={4} />
            <path d="M84 214 Q120 224 156 214" fill="none" stroke={P.gold} strokeWidth={5} />
            <Stern x={102} y={170} r={9} />
            <Stern x={140} y={190} r={7} />
            <circle cx={120} cy={152} r={6} {...flaeche(P.tuerkis, 2.5)} />
            <Funkeln x={100} y={198} r={5} zeit={zeit} />
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
              {/* A sun on the chest; its eight rays turn slowly */}
              <g transform={`rotate(${dreh.toFixed(1)} 120 168)`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <path key={i} d="M120 146 L126 158 L114 158 Z" {...flaeche(P.orange, 2)} transform={`rotate(${i * 45} 120 168)`} />
                ))}
              </g>
              <circle cx={120} cy={168} r={12} {...flaeche(P.gelb, 2.5)} />
              <circle cx={120} cy={168} r={5} fill={P.rot} />
              <Band y={188} h={8} farbe={P.goldTief} />
              <Funkeln x={142} y={152} r={6} zeit={zeit} />
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
      const glut = 0.65 + Math.sin(zeit * 2.5) * 0.3;
      return (
        <Rumpf
          t={T.dunkel}
          kinder={
            <>
              {/* Two glowing runes, a silver clasp */}
              <path d="M100 158 l8 10 l-8 10 M140 158 l-8 10 l8 10" fill="none" stroke={P.lilaHell} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={glut} />
              <path d="M120 142 L130 152 L120 162 L110 152 Z" {...flaeche(P.metallHell, 2.5)} />
              <Funkeln x={140} y={188} r={5} zeit={zeit} />
            </>
          }
        />
      );
    },
  },
  // — 26.11.2026 (20261205_lernquest_welten_teile.sql): the worlds of the map. —
  daunenjacke: {
    aermel: T.orange,
    unterarm: T.orange,
    hand: T.blau,
    hose: T.jeans,
    schuhe: T.leder,
    rumpf: () => (
      <g>
        <Rumpf
          t={T.orange}
          kinder={
            <>
              {/* Puffy down jacket: three soft seams across, a zip, a white fur collar, blue mittens */}
              {[158, 174, 190].map((y) => (
                <path key={y} d={`M89 ${y} Q120 ${y + 6} 151 ${y}`} fill="none" stroke={P.orangeTief} strokeWidth={4} strokeLinecap="round" />
              ))}
              <path d="M120 148 V200" stroke={P.orangeTief} strokeWidth={3} />
            </>
          }
        />
        <path d="M100 136 Q120 152 140 136 Q147 144 141 151 Q120 163 99 151 Q93 144 100 136 Z" {...flaeche(P.wolke, 2.5)} />
        <path d="M128 152 Q136 150 140 146" fill="none" stroke={P.wolkeTief} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
  },
  hawaiihemd: {
    aermel: T.tuerkis,
    unterarm: 'haut',
    hose: T.sand,
    schuhe: T.leder,
    rumpf: () => {
      // Three big flowers on a turquoise shirt, each with a leaf; an open collar.
      const blume = (x: number, y: number, f: string, mitte: string) => (
        <g key={`${x}-${y}`}>
          <path d={`M${x - 3} ${y + 2} Q${x + 6} ${y + 16} ${x + 16} ${y + 8} Q${x + 6} ${y + 4} ${x - 3} ${y + 2} Z`} {...flaeche(P.gruen, 2)} />
          {[0, 1, 2, 3, 4].map((k) => {
            const a = (k * 72 - 90) * (Math.PI / 180);
            return <circle key={k} cx={(x + Math.cos(a) * 5.5).toFixed(1)} cy={(y + Math.sin(a) * 5.5).toFixed(1)} r={4.6} {...flaeche(f, 2)} />;
          })}
          <circle cx={x} cy={y} r={2.8} fill={mitte} />
        </g>
      );
      return (
        <Rumpf
          t={T.tuerkis}
          kinder={
            <>
              <path d="M106 137 L114 152 L120 142 L126 152 L134 137" {...flaeche(P.tuerkisHell, 2.5)} />
              {blume(101, 166, P.rosa, P.gelb)}
              {blume(137, 160, P.gelb, P.orange)}
              {blume(124, 188, P.rosa, P.gelb)}
            </>
          }
        />
      );
    },
  },
  blaettermantel: {
    aermel: T.oliv,
    unterarm: T.oliv,
    hose: T.leder,
    schuhe: T.leder,
    hinten: () => <Umhang t={T.gruen} />,
    rumpf: () => {
      // A cloak of leaves: big leaves in two rows over an olive tunic, a wooden toggle at the neck.
      const blatt = (x: number, y: number) => `M${x} ${y - 11} Q${x + 12} ${y} ${x} ${y + 13} Q${x - 12} ${y} ${x} ${y - 11} Z`;
      return (
        <Rumpf
          t={T.oliv}
          kinder={
            <>
              {[[100, 160], [120, 156], [140, 160], [110, 183], [131, 183]].map(([x, y], i) => (
                <g key={i}>
                  <path d={blatt(x, y)} {...flaeche(i % 2 ? P.gruenHell : P.gruen, 2)} />
                  <path d={`M${x} ${y - 6} V${y + 8}`} stroke={P.gruenTief} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
                </g>
              ))}
              <rect x={113} y={139} width={14} height={7} rx={3} {...flaeche(P.holz, 2)} />
            </>
          }
        />
      );
    },
  },
  lavaruestung: {
    aermel: T.dunkel,
    unterarm: T.dunkel,
    hand: T.grau,
    hose: T.dunkel,
    schuhe: T.dunkel,
    rumpf: ({ zeit }) => {
      const glut = (0.7 + Math.sin(zeit * 2.2) * 0.3).toFixed(2);
      return (
        <g>
          <Rumpf
            t={T.dunkel}
            kinder={
              <>
                {/* Plates of black volcanic stone with glowing cracks and a lava stone in the middle */}
                <path d="M96 150 L106 162 L100 176 M144 152 L134 166 L140 184 M110 188 L120 196 L130 188" fill="none" stroke={P.lava} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={glut} />
                <circle cx={120} cy={166} r={9} {...flaeche(P.lava, 2.5)} />
                <circle cx={118} cy={164} r={4} fill={P.lavaHell} opacity={glut} />
              </>
            }
          />
          <Schulter x={80} k={-1} t={T.dunkel} farbe={P.dunkel} />
          <Schulter x={160} k={1} t={T.dunkel} farbe={P.dunkel} />
          <path d="M70 152 Q80 157 90 152 M150 152 Q160 157 170 152" fill="none" stroke={P.lava} strokeWidth={3} strokeLinecap="round" opacity={glut} />
        </g>
      );
    },
  },
  pharaonengewand: {
    aermel: 'haut',
    unterarm: 'haut',
    hose: T.creme,
    schuhe: T.gold,
    lang: true,
    rumpf: ({ zeit }) => (
      <Rumpf
        t={T.creme}
        d="M90 140 Q120 132 150 140 L160 224 Q120 232 80 224 Z"
        kinder={
          <>
            {/* A linen robe with a broad gold collar (turquoise and lapis rings), a gold belt with a red stone */}
            <path d="M86 140 Q120 218 154 140 Q120 129 86 140 Z" {...flaeche(P.gold, 2.5)} />
            <path d="M94 144 Q120 202 146 144" fill="none" stroke={P.tuerkis} strokeWidth={6} strokeLinecap="round" />
            <path d="M100 143 Q120 186 140 143" fill="none" stroke={P.blauTief} strokeWidth={6} strokeLinecap="round" />
            <path d="M84 194 Q120 202 156 194 L157 206 Q120 214 83 206 Z" {...flaeche(P.gold, 2)} />
            <path d="M113 208 L120 226 L127 208 Z" {...flaeche(P.goldTief, 2)} />
            <path d="M120 195 l6 6 -6 6 -6 -6 Z" fill={P.rot} stroke={P.rot} strokeWidth={1.5} strokeLinejoin="round" />
            <Funkeln x={140} y={154} r={6} zeit={zeit} />
            <Funkeln x={98} y={212} r={5} zeit={zeit} versatz={2} />
          </>
        }
      />
    ),
  },
};

// — Face: eyes (the `augen` part), brows, mouth (the chosen one), cheeks. Drawn in the fox's face coordinates and
// moved over, so the expressions match the fox. Flat and plain (19.11.2026): dark eyes without shine, glasses as a few
// clear shapes; the mood comes from lids, brows and mouth. —

const AUGE_L = 80;
const AUGE_R = 120;
const AUGE_Y = 93;
const linie = { fill: 'none', stroke: P.auge, strokeWidth: 4.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

// Flat eyes (teacher's review 12.11.2026): one dark shape, no white shine; only the special eyes carry a colour or a star.
function Punktauge({ x, rx = 7.5, ry = 9.5, iris, funkeln = false }: { x: number; rx?: number; ry?: number; iris?: string; funkeln?: boolean }) {
  return (
    <g>
      <ellipse cx={x} cy={AUGE_Y} rx={rx} ry={ry} fill={P.auge} />
      {iris && <path d={`M${x - rx + 2} 96 Q${x} ${AUGE_Y + ry + 1} ${x + rx - 2} 96`} fill="none" stroke={iris} strokeWidth={3} strokeLinecap="round" />}
      {funkeln && <path d={stern(x - 2, 89, 3.6, 4)} fill={P.weiss} />}
    </g>
  );
}
const zu = (x: number) => <path key={x} d={`M${x - 9} 93 Q${x} 99 ${x + 9} 93`} {...linie} strokeWidth={4} />;
const froh = (x: number) => <path key={x} d={`M${x - 9} 95 Q${x} 84 ${x + 9} 95`} {...linie} />;

/** The eye styles of the `augen` place (src/lernquest/teile.ts). Glasses are drawn over plain eyes. */
const AUGEN_FORM: Record<string, (x: number, s: Stand) => ReactNode> = {
  punktaugen: (x, s) => <Punktauge x={x} ry={s.gesicht === 'staunen' ? 11 : s.gesicht === 'sanft' ? 8 : 9.5} rx={s.gesicht === 'staunen' ? 8.5 : 7.5} />,
  froehlich: (x) => froh(x),
  sternaugen: (x) => <path d={stern(x, AUGE_Y, 11)} {...flaeche(P.gold, 2)} stroke={P.goldTief} />,
  funkelaugen: (x) => <Punktauge x={x} rx={8.5} ry={10.5} iris={P.lilaHell} funkeln />,
  herzaugen: (x) => (
    <path
      d={`M${x} ${AUGE_Y + 10} C${x - 14} ${AUGE_Y} ${x - 12} ${AUGE_Y - 11} ${x - 5} ${AUGE_Y - 9} C${x - 2} ${AUGE_Y - 8} ${x} ${AUGE_Y - 5} ${x} ${AUGE_Y - 4} C${x} ${AUGE_Y - 5} ${x + 2} ${AUGE_Y - 8} ${x + 5} ${AUGE_Y - 9} C${x + 12} ${AUGE_Y - 11} ${x + 14} ${AUGE_Y} ${x} ${AUGE_Y + 10} Z`}
      {...flaeche(P.herz, 2)}
    />
  ),
  feueraugen: (x) => <Punktauge x={x} iris={P.lava} />,
  schlaefrig: (x) => (
    <g>
      <path d={`M${x - 9} 93 Q${x} 104 ${x + 9} 93 Z`} fill={P.auge} />
      <path d={`M${x - 10} 93 H${x + 10}`} {...linie} strokeWidth={4} />
    </g>
  ),
  zwinkern: (x, s) => (x === AUGE_R ? froh(x) : AUGEN_FORM.punktaugen(x, s)),
  // — 13.11.2026 (20261129_lernquest_neue_teile.sql) —
  kulleraugen: (x, s) => <Punktauge x={x} rx={s.gesicht === 'staunen' ? 11 : 10} ry={s.gesicht === 'staunen' ? 13.5 : 12} iris={P.holz} />,
  katzenaugen: (x) => (
    <g>
      <path d={`M${x - 11} ${AUGE_Y} Q${x} ${AUGE_Y - 13} ${x + 11} ${AUGE_Y} Q${x} ${AUGE_Y + 13} ${x - 11} ${AUGE_Y} Z`} {...flaeche(P.gruenHell, 2.5)} stroke={P.auge} />
      <ellipse cx={x} cy={AUGE_Y} rx={2.6} ry={7.5} fill={P.auge} />
    </g>
  ),
  galaxieaugen: (x, s) => {
    const k = (Math.sin(s.zeit * 2 + x) + 1) / 2;
    return (
      <g>
        <ellipse cx={x} cy={AUGE_Y} rx={8.5} ry={10.5} fill={P.nachtTief} />
        <path d={`M${x - 6} ${AUGE_Y + 4} Q${x} ${AUGE_Y - 6} ${x + 6} ${AUGE_Y + 2}`} fill="none" stroke={P.lilaHell} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x - 2} cy={AUGE_Y - 4} r={1.6 + k * 1.2} fill={P.weiss} />
      </g>
    );
  },
  regenbogenaugen: (x, s) => {
    const farben = [P.rot, P.gelb, P.gruenHell, P.blau];
    const d = Math.floor(s.zeit * 1.5) % farben.length;
    return (
      <g>
        <ellipse cx={x} cy={AUGE_Y} rx={9} ry={11} fill={P.auge} />
        {farben.map((_, i) => (
          <path key={i} d={`M${x - 6 + i} ${AUGE_Y + 1 + i * 2.6} Q${x} ${AUGE_Y + 7 + i * 1.6} ${x + 6 - i} ${AUGE_Y + 1 + i * 2.6}`} fill="none" stroke={farben[(i + d) % farben.length]} strokeWidth={2.4} strokeLinecap="round" />
        ))}
      </g>
    );
  },
  // — 26.11.2026 (20261205_lernquest_welten_teile.sql) —
  smaragdaugen: (x) => (
    <g>
      {/* An emerald cut as an eye: an octagon, a light facet top left, a dark centre, a small glint */}
      <path d={`M${x - 5} ${AUGE_Y - 11} H${x + 5} L${x + 9.5} ${AUGE_Y - 4} V${AUGE_Y + 4} L${x + 5} ${AUGE_Y + 11} H${x - 5} L${x - 9.5} ${AUGE_Y + 4} V${AUGE_Y - 4} Z`} {...flaeche(P.gruen, 2)} />
      <path d={`M${x - 5} ${AUGE_Y - 11} H${x + 5} L${x + 2} ${AUGE_Y - 4} H${x - 2} Z M${x - 9.5} ${AUGE_Y - 4} H${x - 2} V${AUGE_Y + 4} H${x - 9.5} Z`} fill={P.gruenHell} />
      <ellipse cx={x + 1} cy={AUGE_Y + 2} rx={3.4} ry={4.6} fill={P.gruenTief} />
      <path d={stern(x - 4, AUGE_Y - 6, 3.4, 4)} fill={P.weiss} />
    </g>
  ),
  kometenaugen: (x, s) => {
    // Night-sky eyes with a gold rim below; a little comet crosses each eye again and again.
    const t = (s.zeit * 0.5 + (x === AUGE_L ? 0 : 0.5)) % 1;
    const kx = x - 5 + t * 10;
    const ky = AUGE_Y - 6 + t * 11;
    const da = Math.sin(t * Math.PI);
    return (
      <g>
        <ellipse cx={x} cy={AUGE_Y} rx={9} ry={11} fill={P.nachtTief} />
        <path d={`M${x - 6} 97 Q${x} ${AUGE_Y + 12} ${x + 6} 97`} fill="none" stroke={P.gold} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={x + 4} cy={AUGE_Y - 5} r={1.4} fill={P.weiss} />
        <circle cx={x - 4} cy={AUGE_Y + 4} r={1.1} fill={P.weiss} />
        <path d={`M${(kx - 6).toFixed(1)} ${(ky - 6.6).toFixed(1)} L${kx.toFixed(1)} ${ky.toFixed(1)}`} stroke={P.gelb} strokeWidth={2.6} strokeLinecap="round" opacity={(0.85 * da).toFixed(2)} />
        <circle cx={kx.toFixed(1)} cy={ky.toFixed(1)} r={2.6} fill={P.gelbHell} opacity={da.toFixed(2)} />
      </g>
    );
  },
};
/** Glasses and the like: drawn over plain eyes, in face coordinates. A few clear shapes each. */
const BRILLE: Record<string, () => ReactNode> = {
  brille: () => (
    <g fill="none" stroke={P.linie} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={AUGE_L} cy={AUGE_Y} r={14} fill={P.weiss} fillOpacity={0.3} />
      <circle cx={AUGE_R} cy={AUGE_Y} r={14} fill={P.weiss} fillOpacity={0.3} />
      <path d="M94 92 Q100 88 106 92 M66 90 L52 86 M134 90 L148 86" />
    </g>
  ),
  sonnenbrille: () => (
    <g>
      <path d="M98 87 H102 M62 85 L50 82 M138 85 L150 82" stroke={P.dunkel} strokeWidth={3.5} strokeLinecap="round" />
      <Flaeche d="M62 84 H98 Q98 104 82 104 Q64 104 62 84 Z M102 84 H138 Q136 104 118 104 Q102 104 102 84 Z" farbe={P.dunkel} hell={P.dunkelHell} breite={2.5} />
    </g>
  ),
  taucherbrille: () => (
    <g>
      <path d="M44 88 Q100 78 156 88 L156 96 Q100 86 44 96 Z" {...flaeche(P.tuerkis, 2.5)} />
      <rect x={62} y={78} width={76} height={30} rx={13} fill={P.wasserHell} fillOpacity={0.5} stroke={P.blau} strokeWidth={5} />
      <path d="M98 80 V106" stroke={P.blau} strokeWidth={4} />
    </g>
  ),
  // Visor of a robot (13.11.2026): a dark band with two light strips.
  roboteraugen: () => (
    <g>
      <Flaeche d="M50 84 L150 84 L148 106 L52 106 Z" farbe={P.dunkel} hell={P.dunkelHell} breite={2.5} />
      <rect x={66} y={89} width={28} height={10} rx={5} fill={P.tuerkis} />
      <rect x={106} y={89} width={28} height={10} rx={5} fill={P.tuerkis} />
    </g>
  ),
  monokel: () => (
    <g>
      <path d="M133 100 Q140 120 132 134" fill="none" stroke={P.goldTief} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={AUGE_R} cy={AUGE_Y} r={14} fill={P.weiss} fillOpacity={0.3} stroke={P.gold} strokeWidth={4.5} />
    </g>
  ),
  // — 26.11.2026 (20261205_lernquest_welten_teile.sql) —
  // Party glasses: two orange starfish with dark lenses.
  seesternbrille: () => (
    <g>
      <path d="M97 89 Q100 86 103 89 M64 88 L50 84 M136 88 L150 84" fill="none" stroke={P.orangeTief} strokeWidth={3.5} strokeLinecap="round" />
      {[AUGE_L, AUGE_R].map((x) => (
        <g key={x}>
          <path d={stern(x, AUGE_Y, 19)} {...flaeche(P.orange, 3)} />
          <path d={stern(x, AUGE_Y + 1, 10.5)} fill={P.dunkel} stroke={P.dunkel} strokeWidth={2} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  ),
  // Ski goggles: a strap, a white frame, one wide orange mirror lens with two light streaks.
  schneebrille: () => (
    <g>
      <path d="M44 90 Q100 80 156 90 L156 98 Q100 88 44 98 Z" {...flaeche(P.blauTief, 2.5)} />
      <path d="M58 84 Q58 76 68 76 H132 Q142 76 142 84 V98 Q142 108 132 108 H112 Q106 100 100 100 Q94 100 88 108 H68 Q58 108 58 98 Z" {...flaeche(P.wolke, 2.5)} />
      <path d="M64 86 Q64 82 70 82 H130 Q136 82 136 86 V96 Q136 102 130 102 H113 Q107 95 100 95 Q93 95 87 102 H70 Q64 102 64 96 Z" fill={P.orange} />
      <path d="M72 98 L84 85 M82 99 L95 85" stroke={P.orangeHell} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  // Goggles of a volcano researcher: two thick metal rims with orange heat glass, a leather strap.
  forscherbrille: () => (
    <g>
      <path d="M44 92 Q100 84 156 92" fill="none" stroke={P.leder} strokeWidth={7} strokeLinecap="round" />
      <path d="M94 92 H106" stroke={P.metallTief} strokeWidth={5} strokeLinecap="round" />
      {[AUGE_L, AUGE_R].map((x) => (
        <g key={x}>
          <circle cx={x + 1.5} cy={AUGE_Y + 1.5} r={15} {...flaeche(P.metallTief, 3)} />
          <circle cx={x} cy={AUGE_Y} r={15} {...flaeche(P.metall, 3)} />
          <circle cx={x} cy={AUGE_Y} r={9.5} fill={P.orangeHell} fillOpacity={0.55} stroke={P.metallTief} strokeWidth={2} />
          <path d={`M${x - 5} ${AUGE_Y - 2} Q${x - 4} ${AUGE_Y - 6} ${x} ${AUGE_Y - 7}`} fill="none" stroke={P.weiss} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
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
  laecheln: () => <path d="M90 117 Q100 127 110 117" fill="none" {...STRICH} strokeWidth={3.5} />,
  grinsen: () => <path d="M86 115 Q100 132 114 115 Z" {...flaeche(P.weiss, 2.5)} stroke={P.linie} />,
  lachen: () => (
    <g>
      <path d="M89 116 Q100 134 111 116 Z" {...flaeche(P.mund, 2.5)} />
      <path d="M94 125 Q100 120 106 125 Q100 131 94 125 Z" fill={P.zunge} />
    </g>
  ),
  staunen: () => <ellipse cx="100" cy="122" rx="6" ry="7" {...flaeche(P.mund, 2.5)} />,
  frech: () => (
    <g>
      <path d="M98 120 Q100 132 106 130 Q110 128 108 120 Z" {...flaeche(P.zunge, 2.5)} />
      <path d="M90 118 Q100 124 112 117" fill="none" {...STRICH} strokeWidth={3.5} />
    </g>
  ),
  ernst: () => <path d="M92 120 H108" fill="none" {...STRICH} strokeWidth={3.5} />,
};
export const MUND_ARTEN = Object.keys(MUND_FORM);

function Mund({ mund, s }: { mund: string; s: Stand }) {
  if (s.gesicht === 'lachen' || s.gesicht === 'jubel') return <>{MUND_FORM.lachen()}</>;
  if (s.gesicht === 'staunen' || s.gesicht === 'au') return <>{MUND_FORM.staunen()}</>;
  if (s.gesicht === 'traurig') return <path d="M92 122 Q100 115 108 122" fill="none" {...STRICH} strokeWidth={3.5} />;
  if (s.gesicht === 'denken') return <path d="M95 120 Q101 117 106 120" fill="none" {...STRICH} strokeWidth={3.5} />;
  return <>{(MUND_FORM[mund] ?? MUND_FORM.laecheln)()}</>;
}

// — Hair: a part behind the head and one in front, in the chosen colour. One to three big shapes each, with a strong
// silhouette (a plait is one capsule, curls are one wavy outline), at most one light stroke. —

const KOPF = 'M120 50 C154 50 172 72 172 100 C172 128 150 146 120 146 C90 146 68 128 68 100 C68 72 86 50 120 50 Z';
const PONY = 'M66 104 C60 66 86 44 120 44 C154 44 180 66 174 104 C170 92 166 84 160 80 C150 86 136 80 128 72 C118 82 98 86 84 82 C78 88 70 94 66 104 Z';
const GLATT = 'M66 100 C62 62 88 44 120 44 C152 44 178 62 174 100 C168 82 150 70 120 70 C90 70 72 82 66 100 Z';
const STACHELN = 'M66 100 C60 76 70 60 84 54 L76 30 L104 46 L120 20 L136 46 L164 30 L156 54 C170 60 180 76 174 100 C166 86 156 80 148 78 C136 84 104 84 92 78 C84 80 74 86 66 100 Z';
const BOB_VORN = 'M66 102 C62 62 88 44 120 44 C152 44 178 62 174 102 L168 102 L166 80 Q120 72 74 80 L72 102 Z';
const LANG_HINTEN = 'M64 96 C60 58 88 42 120 42 C152 42 180 58 176 96 L182 170 Q170 178 156 170 L152 140 L88 140 L84 170 Q70 178 58 170 Z';
const HAARLICHT = 'M84 62 Q100 50 116 50';

/** One closed outline of round bumps around an ellipse: the curly silhouette (n bumps). */
function wellenPfad(cx: number, cy: number, rx: number, ry: number, n: number): string {
  const punkt = (i: number): Punkt => {
    const w = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + rx * Math.cos(w), cy + ry * Math.sin(w)];
  };
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x0, y0] = punkt(i);
    const [x1, y1] = punkt(i + 1);
    const r = Math.hypot(x1 - x0, y1 - y0) * 0.62;
    d += `${i === 0 ? `M${x0.toFixed(1)} ${y0.toFixed(1)}` : ''}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return `${d}Z`;
}
const LOCKEN = wellenPfad(120, 86, 66, 54, 12);
const LOCKEN_KURZ = wellenPfad(120, 93, 61, 50, 16);
const AFRO = wellenPfad(120, 80, 77, 62, 14);

function Haarform({ d, t, licht = HAARLICHT }: { d: string; t: Ton; licht?: string }) {
  return (
    <g>
      <Flaeche d={d} farbe={t.farbe} hell={t.hell} />
      {licht && <path d={licht} fill="none" stroke={t.hell} strokeWidth={5} strokeLinecap="round" opacity={0.9} />}
    </g>
  );
}
/** A hair shape without a light stroke. */
const Haar = ({ d, t }: { d: string; t: Ton }) => <Flaeche d={d} farbe={t.farbe} hell={t.hell} />;
const Zopfband = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={5.5} {...flaeche(P.rot, 2.5)} />;
/** A plait hanging beside the head: one capsule with a band. */
const Zopf = ({ x, t }: { x: number; t: Ton }) => (
  <g>
    <Haar d={`M${x - 10} 108 H${x + 10} V166 A10 10 0 0 1 ${x - 10} 166 Z`} t={t} />
    <Zopfband x={x} y={160} />
  </g>
);

/** Rainbow hair (13.11.2026): long hair in six coloured bands, its own colours whatever the hair colour. */
function RegenbogenHaar({ teil }: { teil: 'hinten' | 'vorn' }) {
  const id = `regenbogen-${useId().replace(/:/g, '')}`;
  const d = teil === 'hinten' ? LANG_HINTEN : PONY;
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
      </g>
    </g>
  );
}

const FRISUR_FORM: Record<string, { hinten?: (t: Ton) => ReactNode; vorn?: (t: Ton) => ReactNode }> = {
  kurz: { vorn: (t) => <Haarform d={PONY} t={t} /> },
  zopf: {
    hinten: (t) => (
      <g>
        <Haar d="M150 60 C190 58 200 104 188 144 C184 158 168 156 172 138 C178 110 172 86 148 76 Z" t={t} />
        <Zopfband x={160} y={67} />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  locken: {
    hinten: (t) => <Haar d={LOCKEN} t={t} />,
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  lang: {
    hinten: (t) => <Haar d={LANG_HINTEN} t={t} />,
    vorn: (t) => <Haarform d={PONY} t={t} />,
  },
  zoepfe: {
    hinten: (t) => (
      <g>
        <Zopf x={60} t={t} />
        <Zopf x={180} t={t} />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  dutt: {
    hinten: (t) => (
      <g>
        <Haar d={ovalPfad(120, 36, 20)} t={t} />
        <path d="M104 54 Q120 60 136 54" fill="none" stroke={P.rot} strokeWidth={6} strokeLinecap="round" />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  stacheln: { vorn: (t) => <Haarform d={STACHELN} t={t} licht="" /> },
  bob: {
    hinten: (t) => <Haar d="M62 100 C58 60 88 42 120 42 C152 42 182 60 178 100 L180 142 Q170 150 160 144 L80 144 Q70 150 60 142 Z" t={t} />,
    vorn: (t) => <Haarform d={BOB_VORN} t={t} />,
  },
  glatze: {},
  // Own hair of the teacher (lq_frisur): short curls close to the head.
  f25e0e76346: {
    hinten: (t) => <Haar d={LOCKEN_KURZ} t={t} />,
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  // — 13.11.2026: ten more (20261129_lernquest_neue_teile.sql), two per rarity. —
  pferdeschwanz: {
    hinten: (t) => (
      <g>
        <Haar d="M118 40 C152 18 192 40 188 86 C186 114 180 130 168 138 C170 116 170 96 160 80 C150 66 134 56 118 52 Z" t={t} />
        <ellipse cx={128} cy={46} rx={8} ry={7} {...flaeche(P.tuerkis, 2.5)} />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  buerste: {
    vorn: (t) => <Haarform d="M68 98 C64 72 74 56 88 50 L90 36 L150 36 L152 50 C166 56 176 72 172 98 C168 84 156 76 120 74 C84 76 72 84 68 98 Z" t={t} licht="M96 44 L96 58" />,
  },
  afro: {
    hinten: (t) => <Haar d={AFRO} t={t} />,
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  seitenzopf: {
    hinten: (t) => (
      <g>
        <Haar d="M80 64 C56 80 48 130 56 176 A11 11 0 0 0 78 172 C76 130 80 104 94 84 Z" t={t} />
        <Zopfband x={67} y={168} />
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  haarschnecken: {
    hinten: (t) => (
      <g>
        {[82, 158].map((x) => (
          <g key={x}>
            <Haar d={ovalPfad(x, 46, 21)} t={t} />
            <path d={`M${x} 46 q6 0 6 -6 q0 -8 -9 -8 q-11 0 -11 11 q0 13 14 13`} fill="none" stroke={t.tief} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
      </g>
    ),
    vorn: (t) => <Haarform d={GLATT} t={t} />,
  },
  wuschelkopf: {
    vorn: (t) => (
      <Haarform
        d="M66 102 C54 82 60 60 78 52 C72 36 92 28 102 38 C106 24 124 22 128 34 C138 22 158 28 156 44 C170 44 182 62 174 80 C182 88 180 96 174 102 C168 88 160 82 150 82 C146 88 136 88 130 82 C122 90 110 90 104 82 C96 88 86 88 82 82 C74 86 70 94 66 102 Z"
        t={t}
      />
    ),
  },
  blitzfrisur: {
    vorn: (t) => (
      <g>
        <Haarform d={STACHELN} t={t} licht="" />
        <path d="M128 34 L116 58 L128 58 L114 84 L138 52 L127 52 L138 34 Z" {...flaeche(P.gelb, 2)} stroke={P.goldTief} />
      </g>
    ),
  },
  sternenzopf: {
    hinten: (t) => (
      <g>
        <Haar d="M150 56 C190 60 196 100 188 142 C186 172 180 194 172 206 C162 192 166 170 168 148 C172 112 168 86 148 72 Z" t={t} />
        {[116, 160].map((y) => (
          <path key={y} d={stern(178, y, 9)} {...flaeche(P.gold, 2)} stroke={P.goldTief} />
        ))}
      </g>
    ),
    vorn: (t) => (
      <g>
        <Haarform d={GLATT} t={t} />
        <path d={stern(92, 58, 9)} {...flaeche(P.gold, 2)} stroke={P.goldTief} />
      </g>
    ),
  },
  regenbogenhaar: { hinten: () => <RegenbogenHaar teil="hinten" />, vorn: () => <RegenbogenHaar teil="vorn" /> },
  feuerhaar: {
    hinten: () => (
      <g>
        <path d="M62 100 C50 70 60 40 80 30 C78 46 86 50 92 40 C96 22 112 12 122 8 C118 26 128 32 136 22 C150 26 158 40 152 54 C164 46 176 56 178 70 C186 84 182 96 178 100 Z" {...flaeche(P.lava)} />
        <path d="M82 66 C80 48 90 42 98 52 C102 36 114 28 122 22 C120 40 130 44 136 38 C146 42 152 52 150 66 Z" fill={P.lavaHell} />
      </g>
    ),
    vorn: () => (
      <g>
        <path d={PONY} {...flaeche(P.lava)} />
        <path d="M128 72 C134 62 146 58 156 66 C150 70 152 76 160 80 C150 86 136 80 128 72 Z" fill={P.lavaHell} />
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
  // Sleeves one tone darker than the body (base → tief, hell → base), so arms read in front of it without an outline;
  // bare skin keeps its colour and its shadow line.
  const ton = (t: Ton | 'haut'): Ton => (t === 'haut' ? haut : { farbe: t.tief, hell: t.farbe, tief: t.tief });
  const oben = ton(k.aermel);
  const unten = ton(k.unterarm);
  const h = k.hand ?? haut;
  return {
    id: `arm-${seite}`,
    drehpunkt: schulter,
    zeichnung: () => <Glied von={schulter} bis={ellbogen} farbe={oben.farbe} schatten={k.aermel === 'haut' ? oben.tief : undefined} />,
    kinder: [
      {
        id: `unterarm-${seite}`,
        drehpunkt: ellbogen,
        zeichnung: () => (
          <g>
            {/* Straight end at the elbow (no round cap): the cap's outline lay over the upper arm as a ring, which
                read as a stripe at the elbow (teacher's review 12.11.2026). The upper arm's own cap rounds the bend,
                the hand covers the lower end. */}
            <path d={`M${x} 166 V184`} fill="none" stroke={unten.farbe} strokeWidth={19} />
            {/* The joint dot takes the sleeve's colour, so a short sleeve ends round; bare skin keeps its shadow line. */}
            <circle cx={x} cy={166} r={9.5} fill={oben.farbe} />
            {k.aermel === 'haut' && <path d={`M${x + 3} 160.5 V171.5`} fill="none" stroke={oben.tief} strokeWidth={4} opacity={0.6} />}
            {k.unterarm === 'haut' && <path d={`M${x + 3} 171.5 V184`} fill="none" stroke={unten.tief} strokeWidth={4} opacity={0.6} />}
            <circle cx={hand[0]} cy={hand[1]} r={9} {...flaeche(h.farbe)} />
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
            <rect x={x} y={186} width={18} height={30} rx={5} {...flaeche(k.hose.farbe)} />
            <path d={`M${x - 3} 226 Q${x - 3} 210 ${x + 9} 210 Q${x + 23} 210 ${x + 23} 226 Z`} {...flaeche(k.schuhe.farbe)} />
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
        {/* The head's hard shadow on the body (and hair behind it), instead of an outline at the chin */}
        <Schlagschatten form={KOPF} auf={[RUMPF]} />
        {/* Ears, head with one light and one shade */}
        {[68, 172].map((x) => (
          <circle key={x} cx={x} cy={104} r={10} {...flaeche(haut.farbe)} />
        ))}
        <path d={KOPF} {...flaeche(haut.farbe)} />
        <path d="M168 104 C166 130 146 146 120 146 C146 138 160 122 162 104 Z" fill={haut.tief} opacity={0.55} />
        <path d="M78 84 Q82 66 98 58" fill="none" stroke={haut.hell} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
        {f.vorn?.(haar)}
        <g transform="translate(20 11)">
          <ellipse cx="66" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.55} />
          <ellipse cx="134" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.55} />
          <Brauen s={s} t={haar} />
          <Augen augen={augen} s={s} />
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
