// The fox who guides the children (Stufe E). Chibi build: big head, short body, two-part arms with paws.
// Anchors: `hut` on the head, `hand-links` / `hand-rechts` on the paws.
// No outline (docs/design/prinzipien.md, Stilprobe 2, 19.11.2026): shapes separate by tone. Sleeves in front of the
// tunic are one tone darker, the head casts a hard shadow onto collar and body, dark lines only for details.
import { Schlagschatten } from './flaeche';
import { flaeche, P, STRICH } from './stil';
import type { Figur, Pose, Punkt, Stand, Teil } from './typen';

/** A limb segment: one stroke 19 units wide in its colour with round caps (no outline); `schatten` a thin shade on its
 *  right side (bare arms). */
export function Glied({ von, bis, farbe, schatten }: { von: Punkt; bis: Punkt; farbe: string; schatten?: string }) {
  const d = `M${von[0]} ${von[1]} L${bis[0]} ${bis[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={farbe} strokeWidth={19} strokeLinecap="round" />
      {schatten && <path d={`M${von[0] + 3} ${von[1]} L${bis[0] + 3} ${bis[1]}`} fill="none" stroke={schatten} strokeWidth={4} strokeLinecap="round" opacity={0.6} />}
    </g>
  );
}

function Pfote({ p }: { p: Punkt }) {
  return <circle cx={p[0]} cy={p[1]} r={10.5} fill={P.fell} />;
}

function arm(seite: 'l' | 'r'): Teil {
  const x = seite === 'l' ? 74 : 126;
  const schulter: Punkt = [x, 150];
  const ellbogen: Punkt = [x, 168];
  const hand: Punkt = [x, 188];
  return {
    id: `arm-${seite}`,
    drehpunkt: schulter,
    // Sleeves one tone darker than the tunic, so the arm reads in front of the body; no shadow of its own.
    zeichnung: () => <Glied von={schulter} bis={ellbogen} farbe={P.olivTief} />,
    kinder: [
      {
        id: `unterarm-${seite}`,
        drehpunkt: ellbogen,
        zeichnung: () => (
          <g>
            <Glied von={ellbogen} bis={[x, 181]} farbe={P.olivTief} />
            <Pfote p={hand} />
          </g>
        ),
        anker: { [seite === 'l' ? 'hand-links' : 'hand-rechts']: hand },
      },
    ],
  };
}

// Fox 4 (27.11.2026, with Held 4): white eyes with a dark pupil on the orange fur, lids in the fur colour for the
// expressions, thick brows; the cream mask sits below the eyes. No shine (rule of 12.11.).
const FAUGE_Y = 86;
const FAUGEN = [78, 122];
function Augen({ gesicht, augenZu }: Stand) {
  const Y = FAUGE_Y;
  const linie = { fill: 'none', stroke: P.auge, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (gesicht === 'jubel')
    return (
      <g {...linie}>
        {FAUGEN.map((x) => (
          <path key={x} d={`M${x - 11} ${Y + 4} Q${x} ${Y - 9} ${x + 11} ${Y + 4}`} />
        ))}
      </g>
    );
  if (gesicht === 'au')
    return (
      <g {...linie}>
        <path d={`M70 ${Y - 8} L86 ${Y} L70 ${Y + 8}`} />
        <path d={`M130 ${Y - 8} L114 ${Y} L130 ${Y + 8}`} />
      </g>
    );
  if (augenZu)
    return (
      <g {...linie} strokeWidth={5}>
        {FAUGEN.map((x) => (
          <path key={x} d={`M${x - 11} ${Y} Q${x} ${Y + 7} ${x + 11} ${Y}`} />
        ))}
      </g>
    );
  const [bx, by] = gesicht === 'denken' ? [3, -4] : gesicht === 'traurig' ? [0, 4] : gesicht === 'staunen' ? [0, 0] : [1.5, 2];
  const rx = gesicht === 'staunen' ? 13.5 : 12.5;
  const ry = gesicht === 'staunen' ? 16.5 : 15;
  return (
    <g>
      {FAUGEN.map((x, i) => {
        const lid =
          gesicht === 'froh' || gesicht === 'lachen'
            ? `M${x - 15} ${Y + 9} Q${x} ${Y + 4} ${x + 15} ${Y + 9} V${Y + 19} H${x - 15} Z`
            : gesicht === 'sanft'
              ? `M${x - 15} ${Y - 18} H${x + 15} V${Y - 2} Q${x} ${Y + 2} ${x - 15} ${Y - 2} Z`
              : gesicht === 'denken'
                ? `M${x - 15} ${Y - 18} H${x + 15} V${Y - 8} Q${x} ${Y - 5} ${x - 15} ${Y - 8} Z`
                : gesicht === 'traurig'
                  ? i === 0
                    ? `M${x - 15} ${Y - 18} H${x + 15} V${Y - 13} L${x - 15} ${Y - 2} Z`
                    : `M${x - 15} ${Y - 18} H${x + 15} V${Y - 2} L${x - 15} ${Y - 13} Z`
                  : '';
        return (
          <g key={x}>
            <ellipse cx={x} cy={Y} rx={rx} ry={ry} fill={P.weiss} />
            <ellipse cx={x + bx} cy={Y + by} rx={6} ry={7.6} fill={P.auge} />
            {lid && <path d={lid} fill={P.fell} />}
          </g>
        );
      })}
    </g>
  );
}

function Brauen({ gesicht }: Stand) {
  const s = { fill: 'none', stroke: P.ohrInnen, strokeWidth: 6.5, strokeLinecap: 'round' as const };
  const formen: Record<string, [string, string]> = {
    denken: ['M66 66 Q77 63 88 66', 'M112 62 Q123 56 134 61'],
    sanft: ['M66 69 Q77 67 88 64', 'M112 64 Q123 67 134 69'],
    traurig: ['M66 70 Q77 68 88 62', 'M112 62 Q123 68 134 70'],
    staunen: ['M66 60 Q77 54 88 59', 'M112 59 Q123 54 134 60'],
    au: ['M66 63 L88 68', 'M134 63 L112 68'],
  };
  const f = formen[gesicht] ?? ['M66 66 Q77 62 88 65', 'M112 65 Q123 62 134 66'];
  return (
    <g {...s}>
      <path d={f[0]} />
      <path d={f[1]} />
    </g>
  );
}

function Mund({ gesicht }: Stand) {
  if (gesicht === 'lachen' || gesicht === 'jubel')
    return (
      <g>
        <path d="M89 116 Q100 134 111 116 Z" {...flaeche(P.mund, 2.5)} />
        <path d="M94 125 Q100 120 106 125 Q100 131 94 125 Z" fill={P.zunge} />
      </g>
    );
  if (gesicht === 'staunen' || gesicht === 'au')
    return (
      <g>
        <ellipse cx="100" cy="122" rx="6" ry={gesicht === 'au' ? 4.5 : 7} {...flaeche(P.mund, 2.5)} />
        <ellipse cx="100" cy={gesicht === 'au' ? 124 : 126} rx="3.5" ry="2.2" fill={P.zunge} />
      </g>
    );
  if (gesicht === 'traurig') return <path d="M92 122 Q100 115 108 122" fill="none" {...STRICH} />;
  if (gesicht === 'denken') return <path d="M95 120 Q101 117 106 120" fill="none" {...STRICH} />;
  return <path d="M91 116 Q95.5 122 100 117 Q104.5 122 109 116" fill="none" {...STRICH} />;
}

/** An ear: fur and a dark tip (out to the edge). */
function Ohr({ d, spitze }: { d: string; spitze: string }) {
  return (
    <g>
      <path d={d} {...flaeche(P.fell)} />
      <path d={spitze} {...flaeche(P.ohrInnen)} />
    </g>
  );
}

const schwanz: Teil = {
  id: 'schwanz',
  drehpunkt: [124, 190],
  zeichnung: () => (
    <g>
      <path d="M120 200 C154 204 184 176 182 138 C181 116 170 102 160 98 C164 128 152 160 120 174 Z" {...flaeche(P.fell)} />
      <path d="M126 196 C152 196 172 178 176 156 C170 172 150 186 124 186 Z" fill={P.fellTief} opacity={0.5} />
      {/* Cream tip, one smooth shape */}
      <path d="M182 138 C181 116 170 102 160 98 C161 114 164 128 171 135 Q177 141 182 138 Z" {...flaeche(P.creme)} />
    </g>
  ),
};

const koerper: Teil = {
  id: 'koerper',
  drehpunkt: [100, 200],
  zeichnung: () => (
    <g>
      {/* Few big shapes (the Duolingo cat as model, docs/design/prinzipien.md): cape, two boots, tunic with one
          shade, belt with a gold buckle. */}
      <path d={UMHANG} {...flaeche(P.gruen)} />
      {[74, 104].map((x) => (
        <rect key={x} x={x} y={196} width={22} height={30} rx={9} {...flaeche(P.leder)} />
      ))}
      <path d={TUNIKA} {...flaeche(P.oliv)} />
      <path d="M118 144 Q126 146 128 142 L133 202 Q122 205 112 206 Z" {...flaeche(P.olivTief)} opacity={0.55} />
      <path d="M69 178 Q100 184 131 178 L132 189 Q100 195 68 189 Z" {...flaeche(P.leder, 2.5)} />
      <rect x="92" y="177" width="16" height="15" rx="4" {...flaeche(P.gold, 1)} />
    </g>
  ),
};

const kragen: Teil = {
  id: 'kragen',
  drehpunkt: [100, 142],
  zeichnung: () => (
    <g>
      <path d={KRAGEN} {...flaeche(P.gruenHell)} />
    </g>
  ),
};

const UMHANG = 'M64 142 Q100 132 136 142 L150 214 Q100 224 50 214 Z';
const TUNIKA = 'M72 142 Q100 136 128 142 L133 202 Q100 209 67 202 Z';
const KRAGEN = 'M62 140 Q80 156 100 150 Q120 156 138 140 Q120 130 100 134 Q80 130 62 140 Z';
const KOPF = 'M100 38 C136 38 160 58 163 86 L174 100 L159 104 C151 124 128 136 100 136 C72 136 49 124 41 104 L26 100 L37 86 C40 58 64 38 100 38 Z';

const kopf: Teil = {
  id: 'kopf',
  drehpunkt: [100, 134],
  anker: { hut: [100, 46] },
  zeichnung: (s) => (
    <g>
      {/* The head's hard shadow on collar and body */}
      <Schlagschatten form={KOPF} auf={[KRAGEN, UMHANG, TUNIKA]} />
      <Ohr d="M50 74 L44 24 C44 18 50 16 54 20 L86 48 Z" spitze="M44.6 34 L44 24 C44 18 50 16 54 20 L62 27 Q52 26 44.6 34 Z" />
      <Ohr d="M150 74 L156 24 C156 18 150 16 146 20 L114 48 Z" spitze="M155.4 34 L156 24 C156 18 150 16 146 20 L138 27 Q148 26 155.4 34 Z" />
      <path d={KOPF} {...flaeche(P.fell)} />
      {/* Light top left, shade right */}
      <path d="M48 70 Q56 54 72 46 Q58 58 54 72 Z" fill={P.fellHell} opacity={0.7} />
      <path d="M163 86 L174 100 L159 104 C151 124 128 136 100 136 C126 128 146 114 152 90 Q158 86 163 86 Z" {...flaeche(P.fellTief)} opacity={0.35} />
      {/* Cream muzzle below the eyes, so the white eyes sit on the fur */}
      <path d="M100 102 C116 102 134 105 151 108 C143 126 124 134 100 134 C76 134 57 126 49 108 C66 105 84 102 100 102 Z" fill={P.creme} />
      <Brauen {...s} />
      <Augen {...s} />
      <path d="M90 106 Q100 100 110 106 Q106 115 100 116 Q94 115 90 106 Z" fill={P.auge} />
      <g transform="translate(0 3)">
        <Mund {...s} />
      </g>
      {s.gesicht === 'traurig' && <path d="M134 100 q4 6 0 9 q-4 -3 0 -9 Z" fill={P.blauHell} stroke={P.blauTief} strokeWidth={1.5} />}
    </g>
  ),
};

const ruhe = { 'arm-l': 12, 'unterarm-l': -6, 'arm-r': -12, 'unterarm-r': 6 };
const posen: Record<string, Pose> = {
  stehen: { name: 'Stehen', gesicht: 'froh', winkel: ruhe },
  winken: { name: 'Winken', gesicht: 'lachen', winkel: { ...ruhe, 'arm-r': -120, 'unterarm-r': -35 }, vorne: ['arm-r'] },
  jubeln: { name: 'Jubeln', gesicht: 'jubel', winkel: { 'arm-l': 95, 'unterarm-l': 40, 'arm-r': -95, 'unterarm-r': -40 }, extras: ['sterne'] },
  denken: { name: 'Denken', gesicht: 'denken', winkel: { ...ruhe, 'arm-r': -164, 'unterarm-r': -96, kopf: -4 }, vorne: ['arm-r'], extras: ['gedanken'] },
  troesten: { name: 'Trösten', gesicht: 'sanft', winkel: { 'arm-l': -3, 'unterarm-l': -77, 'arm-r': 3, 'unterarm-r': 77, kopf: 5 }, extras: ['herz'] },
  staunen: { name: 'Staunen', gesicht: 'staunen', winkel: { 'arm-l': 40, 'unterarm-l': 30, 'arm-r': -40, 'unterarm-r': -30 }, extras: ['ausruf'] },
  traurig: { name: 'Traurig', gesicht: 'traurig', winkel: { 'arm-l': 4, 'unterarm-l': -4, 'arm-r': -4, 'unterarm-r': 4, kopf: 6, schwanz: -14 } },
};

export const FUCHS: Figur = {
  id: 'fuchs',
  name: 'Fuchs',
  art: 'begleiter',
  groesse: [200, 240],
  boden: [100, 228],
  teile: [schwanz, koerper, arm('l'), arm('r'), kragen, kopf],
  posen,
  gesichter: ['froh', 'lachen', 'jubel', 'denken', 'sanft', 'staunen', 'traurig', 'au'],
  animationen: ['atmen', 'winken', 'huepfen', 'jubeln', 'staunen', 'seufzen', 'nicken', 'kopfschuetteln', 'wedeln', 'treffer'],
  extras: {
    herz: ({ zeit }) => {
      const s = 1 + Math.max(0, Math.sin(zeit * 5)) * 0.08;
      return (
        <g transform={`translate(100 174) scale(${s.toFixed(3)}) translate(-100 -174)`}>
          <path d="M100 186 C88 176 86 166 93 162 C97 160 100 163 100 166 C100 163 103 160 107 162 C114 166 112 176 100 186 Z" {...flaeche(P.herz, 2.5)} />
          <path d="M93 166 q2 -2 4 0" fill="none" stroke={P.weiss} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        </g>
      );
    },
    gedanken: ({ zeit }) => (
      // Light blue instead of white with an outline: white alone vanishes on the cream of the app.
      <g transform={`translate(0 ${(Math.sin(zeit * 2) * 2).toFixed(2)})`}>
        {(
          [
            [160, 58, 6.25],
            [172, 42, 8.75],
            [188, 22, 12.25],
          ] as const
        ).map(([x, y, r]) => (
          <g key={r}>
            <circle cx={x} cy={y} r={r} fill={P.blauHell} />
            <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill={P.weiss} />
          </g>
        ))}
      </g>
    ),
    sterne: ({ zeit }) => (
      <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round">
        <path transform={`rotate(${((zeit * 60) % 360).toFixed(1)} 31 64)`} d="M28 54 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" />
        <path transform={`rotate(${((-zeit * 50) % 360).toFixed(1)} 172 48)`} d="M170 40 l2.4 5.6 5.6 .8 -4 4 .8 5.6 -4.8 -2.4 -4.8 2.4 .8 -5.6 -4 -4 5.6 -.8 Z" />
        <circle cx="46" cy="36" r="2.5" />
        <circle cx="160" cy="24" r="2" />
      </g>
    ),
    ausruf: () => (
      <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round">
        <path d="M168 20 L178 20 L175 48 L171 48 Z" />
        <circle cx="173" cy="56" r="4.5" />
      </g>
    ),
  },
};
