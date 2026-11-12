// The fox who guides the children (Stufe E). Chibi build: big head, short body, two-part arms with paws.
// Anchors: `hut` on the head, `hand-links` / `hand-rechts` on the paws.
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Figur, Punkt, Stand, Teil } from './typen';

/** A limb segment with outline: dark wide stroke under a narrower coloured one. `gelenk` covers the seam to the
 *  segment before (elbow). */
function Glied({ von, bis, farbe, gelenk = false }: { von: Punkt; bis: Punkt; farbe: string; gelenk?: boolean }) {
  const d = `M${von[0]} ${von[1]} L${bis[0]} ${bis[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={P.linie} strokeWidth={19} strokeLinecap="round" />
      <path d={d} fill="none" stroke={farbe} strokeWidth={13} strokeLinecap="round" />
      {gelenk && <circle cx={von[0]} cy={von[1]} r={6.5} fill={farbe} />}
    </g>
  );
}

function Pfote({ p }: { p: Punkt }) {
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={9} fill={P.fell} {...UMRISS} />
      <path d={`M${p[0] - 4} ${p[1] + 3}q4 3 8 0`} fill="none" stroke={P.fellTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function arm(seite: 'l' | 'r'): Teil {
  const x = seite === 'l' ? 74 : 126;
  const schulter: Punkt = [x, 150];
  const ellbogen: Punkt = [x, 168];
  const hand: Punkt = [x, 188];
  return {
    id: `arm-${seite}`,
    drehpunkt: schulter,
    zeichnung: () => <Glied von={schulter} bis={ellbogen} farbe={P.oliv} />,
    kinder: [
      {
        id: `unterarm-${seite}`,
        drehpunkt: ellbogen,
        zeichnung: () => (
          <g>
            <Glied von={ellbogen} bis={[x, 182]} farbe={P.oliv} gelenk />
            <Pfote p={hand} />
          </g>
        ),
        anker: { [seite === 'l' ? 'hand-links' : 'hand-rechts']: hand },
      },
    ],
  };
}

function Augen({ gesicht }: Stand) {
  if (gesicht === 'jubel')
    return (
      <g fill="none" stroke={P.auge} strokeWidth={4.5} strokeLinecap="round">
        <path d="M71 95 Q80 84 89 95" />
        <path d="M111 95 Q120 84 129 95" />
      </g>
    );
  const dy = gesicht === 'denken' ? -3 : 0;
  const dx = gesicht === 'denken' ? 2 : 0;
  const ry = gesicht === 'sanft' ? 9 : 11;
  return (
    <g>
      {[80, 120].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={93} rx={9} ry={ry} fill={P.auge} />
          <circle cx={x + 3 + dx} cy={88 + dy} r={3.4} fill={P.weiss} />
          <circle cx={x - 3 + dx} cy={97 + dy} r={1.6} fill={P.weiss} />
        </g>
      ))}
    </g>
  );
}

function Brauen({ gesicht }: Stand) {
  const s = { fill: 'none', stroke: P.ohrInnen, strokeWidth: 3.5, strokeLinecap: 'round' as const };
  if (gesicht === 'denken')
    return (
      <g {...s}>
        <path d="M70 76 Q79 72 88 76" />
        <path d="M112 72 Q121 66 130 71" />
      </g>
    );
  if (gesicht === 'sanft')
    return (
      <g {...s}>
        <path d="M71 80 Q79 78 88 74" />
        <path d="M112 74 Q121 78 129 80" />
      </g>
    );
  return null;
}

function Mund({ gesicht }: Stand) {
  if (gesicht === 'lachen' || gesicht === 'jubel')
    return (
      <g>
        <path d="M89 116 Q100 134 111 116 Z" fill={P.mund} {...UMRISS_FEIN} />
        <path d="M94 125 Q100 120 106 125 Q100 131 94 125 Z" fill={P.zunge} />
      </g>
    );
  if (gesicht === 'denken') return <path d="M95 120 Q101 117 106 120" fill="none" {...UMRISS_FEIN} />;
  return <path d="M91 116 Q95.5 122 100 117 Q104.5 122 109 116" fill="none" {...UMRISS_FEIN} />;
}

const schwanz: Teil = {
  id: 'schwanz',
  drehpunkt: [124, 190],
  zeichnung: () => (
    <g>
      <path d="M120 200 C154 204 184 176 182 138 C181 116 170 102 160 98 C164 128 152 160 120 174 Z" fill={P.fell} {...UMRISS} />
      <path d="M182 138 C181 116 170 102 160 98 C161 114 162 128 170 140 Q176 144 182 138 Z" fill={P.creme} {...UMRISS} />
      <path d="M134 184 C150 178 162 166 168 152" fill="none" stroke={P.fellTief} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    </g>
  ),
};

const koerper: Teil = {
  id: 'koerper',
  drehpunkt: [100, 200],
  zeichnung: () => (
    <g>
      <path d="M64 142 Q100 132 136 142 L150 214 Q100 224 50 214 Z" fill={P.gruen} {...UMRISS} />
      <path d="M58 180 L52 212 Q66 216 78 217 Z" fill={P.gruenTief} opacity={0.7} />
      <rect x="74" y="196" width="22" height="30" rx="8" fill={P.leder} {...UMRISS} />
      <rect x="104" y="196" width="22" height="30" rx="8" fill={P.leder} {...UMRISS} />
      <path d="M77 214 h16 M107 214 h16" stroke={P.lederTief} strokeWidth={3} strokeLinecap="round" />
      <path d="M72 142 Q100 136 128 142 L133 202 Q100 209 67 202 Z" fill={P.oliv} {...UMRISS} />
      <path d="M100 150 V202" stroke={P.olivTief} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M69 178 Q100 184 131 178 L132 189 Q100 195 68 189 Z" fill={P.leder} {...UMRISS_FEIN} />
      <rect x="92" y="178" width="16" height="14" rx="3" fill={P.gold} stroke={P.goldTief} strokeWidth={2.5} />
      <rect x="97" y="182" width="6" height="6" rx="1" fill={P.leder} />
    </g>
  ),
};

const kragen: Teil = {
  id: 'kragen',
  drehpunkt: [100, 142],
  zeichnung: () => (
    <g>
      <path d="M62 140 Q80 156 100 150 Q120 156 138 140 Q120 130 100 134 Q80 130 62 140 Z" fill={P.gruenHell} {...UMRISS} />
      <circle cx="100" cy="150" r="6" fill={P.gold} stroke={P.goldTief} strokeWidth={2.5} />
    </g>
  ),
};

const kopf: Teil = {
  id: 'kopf',
  drehpunkt: [100, 134],
  anker: { hut: [100, 46] },
  zeichnung: (s) => (
    <g>
      <path d="M50 74 L44 24 C44 18 50 16 54 20 L86 48 Z" fill={P.fell} {...UMRISS} />
      <path d="M56 62 L53 32 L76 50 Z" fill={P.ohrInnen} />
      <path d="M150 74 L156 24 C156 18 150 16 146 20 L114 48 Z" fill={P.fell} {...UMRISS} />
      <path d="M144 62 L147 32 L124 50 Z" fill={P.ohrInnen} />
      <path
        d="M100 38 C136 38 160 58 163 86 L174 100 L159 104 C151 124 128 136 100 136 C72 136 49 124 41 104 L26 100 L37 86 C40 58 64 38 100 38 Z"
        fill={P.fell}
        {...UMRISS}
      />
      <path d="M70 50 Q100 40 130 50 Q118 46 100 46 Q82 46 70 50 Z" fill={P.fellHell} opacity={0.8} />
      <path d="M100 84 C114 84 132 92 152 101 C142 122 124 132 100 132 C76 132 58 122 48 101 C68 92 86 84 100 84 Z" fill={P.creme} />
      <path d="M100 58 L94 70 L100 66 L106 70 Z" fill={P.fellTief} opacity={0.55} />
      <ellipse cx="66" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.55} />
      <ellipse cx="134" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.55} />
      <Brauen {...s} />
      <Augen {...s} />
      <path d="M92 104 Q100 99 108 104 Q105 112 100 113 Q95 112 92 104 Z" fill={P.auge} />
      <ellipse cx="97.5" cy="104" rx="2.5" ry="1.4" fill={P.weiss} opacity={0.7} />
      <Mund {...s} />
    </g>
  ),
};

const ruhe = { 'arm-l': 12, 'unterarm-l': -6, 'arm-r': -12, 'unterarm-r': 6 };

export const FUCHS: Figur = {
  id: 'fuchs',
  name: 'Fuchs',
  art: 'begleiter',
  groesse: [200, 240],
  boden: [100, 228],
  teile: [schwanz, koerper, arm('l'), arm('r'), kragen, kopf],
  posen: {
    stehen: { name: 'Stehen', gesicht: 'froh', winkel: ruhe },
    winken: { name: 'Winken', gesicht: 'lachen', winkel: { ...ruhe, 'arm-r': -120, 'unterarm-r': -35 }, vorne: ['arm-r'] },
    jubeln: { name: 'Jubeln', gesicht: 'jubel', winkel: { 'arm-l': 95, 'unterarm-l': 40, 'arm-r': -95, 'unterarm-r': -40 }, extras: ['sterne'] },
    denken: { name: 'Denken', gesicht: 'denken', winkel: { ...ruhe, 'arm-r': -164, 'unterarm-r': -96 }, vorne: ['arm-r'], extras: ['gedanken'] },
    troesten: { name: 'Trösten', gesicht: 'sanft', winkel: { 'arm-l': -3, 'unterarm-l': -77, 'arm-r': 3, 'unterarm-r': 77 }, extras: ['herz'] },
  },
  animationen: ['atmen', 'winken', 'huepfen', 'jubeln', 'nicken', 'kopfschuetteln', 'wedeln'],
  extras: {
    herz: () => (
      <path d="M100 186 C88 176 86 166 93 162 C97 160 100 163 100 166 C100 163 103 160 107 162 C114 166 112 176 100 186 Z" fill={P.herz} {...UMRISS_FEIN} />
    ),
    gedanken: () => (
      <g fill={P.weiss} stroke={P.linie} strokeWidth={2.5}>
        <circle cx="160" cy="58" r="5" />
        <circle cx="172" cy="42" r="7.5" />
      </g>
    ),
    sterne: () => (
      <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round">
        <path d="M28 54 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" />
        <path d="M170 40 l2.4 5.6 5.6 .8 -4 4 .8 5.6 -4.8 -2.4 -4.8 2.4 .8 -5.6 -4 -4 5.6 -.8 Z" />
      </g>
    ),
  },
};
