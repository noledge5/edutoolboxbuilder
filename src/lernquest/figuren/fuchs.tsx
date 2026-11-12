// The fox who guides the children (Stufe E). Chibi build: big head, short body, two-part arms with paws.
// Anchors: `hut` on the head, `hand-links` / `hand-rechts` on the paws.
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Figur, Pose, Punkt, Stand, Teil } from './typen';

/** A limb segment with outline: dark wide stroke under a narrower coloured one. `gelenk` covers the seam to the
 *  segment before (elbow). */
export function Glied({ von, bis, farbe, schatten, gelenk = false }: { von: Punkt; bis: Punkt; farbe: string; schatten?: string; gelenk?: boolean }) {
  const d = `M${von[0]} ${von[1]} L${bis[0]} ${bis[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={P.linie} strokeWidth={19} strokeLinecap="round" />
      <path d={d} fill="none" stroke={farbe} strokeWidth={13} strokeLinecap="round" />
      {schatten && <path d={`M${von[0] + 3} ${von[1]} L${bis[0] + 3} ${bis[1]}`} fill="none" stroke={schatten} strokeWidth={4} strokeLinecap="round" opacity={0.6} />}
      {gelenk && <circle cx={von[0]} cy={von[1]} r={6.5} fill={farbe} />}
    </g>
  );
}

function Pfote({ p }: { p: Punkt }) {
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={9} fill={P.fell} {...UMRISS} />
      <path d={`M${p[0] - 5} ${p[1] - 4} q3 -3 6 -2`} fill="none" stroke={P.fellHell} strokeWidth={2.5} strokeLinecap="round" />
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
    zeichnung: () => <Glied von={schulter} bis={ellbogen} farbe={P.oliv} schatten={P.olivTief} />,
    kinder: [
      {
        id: `unterarm-${seite}`,
        drehpunkt: ellbogen,
        zeichnung: () => (
          <g>
            <Glied von={ellbogen} bis={[x, 181]} farbe={P.oliv} schatten={P.olivTief} gelenk />
            {/* Leather cuff at the wrist */}
            <rect x={x - 8} y={176} width={16} height={7} rx={3} fill={P.leder} {...UMRISS_FEIN} />
            <Pfote p={hand} />
          </g>
        ),
        anker: { [seite === 'l' ? 'hand-links' : 'hand-rechts']: hand },
      },
    ],
  };
}

function Augen({ gesicht, augenZu }: Stand) {
  const linie = { fill: 'none', stroke: P.auge, strokeWidth: 4.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (gesicht === 'jubel')
    return (
      <g {...linie}>
        <path d="M71 95 Q80 84 89 95" />
        <path d="M111 95 Q120 84 129 95" />
      </g>
    );
  if (gesicht === 'au')
    return (
      <g {...linie}>
        <path d="M72 86 L87 94 L72 101" />
        <path d="M128 86 L113 94 L128 101" />
      </g>
    );
  if (augenZu)
    return (
      <g {...linie} strokeWidth={4}>
        <path d="M71 93 Q80 99 89 93" />
        <path d="M111 93 Q120 99 129 93" />
      </g>
    );
  const dy = gesicht === 'denken' ? -3 : gesicht === 'traurig' ? 2 : 0;
  const dx = gesicht === 'denken' ? 2 : 0;
  const ry = gesicht === 'sanft' ? 9 : gesicht === 'staunen' ? 12.5 : 11;
  const rx = gesicht === 'staunen' ? 10 : 9;
  return (
    <g>
      {[80, 120].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={93} rx={rx} ry={ry} fill={P.auge} />
          {/* A warm brown ring low in the eye, then two highlights */}
          <path d={`M${x - rx + 2} ${96} Q${x} ${93 + ry + 1} ${x + rx - 2} ${96}`} fill="none" stroke={P.ohrInnen} strokeWidth={2.5} opacity={0.8} />
          <circle cx={x + 3 + dx} cy={88 + dy} r={3.6} fill={P.weiss} />
          <circle cx={x - 3 + dx} cy={97 + dy} r={1.7} fill={P.weiss} />
          {gesicht === 'traurig' && <path d={`M${x - 10} 84 Q${x} 80 ${x + 10} 84 L${x + 10} 82 L${x - 10} 82 Z`} fill={P.fell} />}
        </g>
      ))}
    </g>
  );
}

function Brauen({ gesicht }: Stand) {
  const s = { fill: 'none', stroke: P.ohrInnen, strokeWidth: 3.5, strokeLinecap: 'round' as const };
  const formen: Record<string, [string, string]> = {
    denken: ['M70 76 Q79 72 88 76', 'M112 72 Q121 66 130 71'],
    sanft: ['M71 80 Q79 78 88 74', 'M112 74 Q121 78 129 80'],
    traurig: ['M70 80 Q79 79 88 73', 'M112 73 Q121 79 130 80'],
    staunen: ['M70 72 Q79 66 88 71', 'M112 71 Q121 66 130 72'],
    au: ['M70 78 L88 82', 'M130 78 L112 82'],
  };
  const f = formen[gesicht];
  if (!f)
    return (
      <g {...s} opacity={0.55}>
        <path d="M72 77 Q79 74 86 76" />
        <path d="M114 76 Q121 74 128 77" />
      </g>
    );
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
        <path d="M89 116 Q100 134 111 116 Z" fill={P.mund} {...UMRISS_FEIN} />
        <path d="M94 125 Q100 120 106 125 Q100 131 94 125 Z" fill={P.zunge} />
        <path d="M92 117 L95 120 L98 117 Z M102 117 L105 120 L108 117 Z" fill={P.weiss} />
      </g>
    );
  if (gesicht === 'staunen' || gesicht === 'au')
    return (
      <g>
        <ellipse cx="100" cy="122" rx="6" ry={gesicht === 'au' ? 4.5 : 7} fill={P.mund} {...UMRISS_FEIN} />
        <ellipse cx="100" cy={gesicht === 'au' ? 124 : 126} rx="3.5" ry="2.2" fill={P.zunge} />
      </g>
    );
  if (gesicht === 'traurig') return <path d="M92 122 Q100 115 108 122" fill="none" {...UMRISS_FEIN} />;
  if (gesicht === 'denken') return <path d="M95 120 Q101 117 106 120" fill="none" {...UMRISS_FEIN} />;
  return <path d="M91 116 Q95.5 122 100 117 Q104.5 122 109 116" fill="none" {...UMRISS_FEIN} />;
}

/** An ear in three passes: fur, dark tip and inner ear, then the outline on top. */
function Ohr({ d, innen, spitze, buschel }: { d: string; innen: string; spitze: string; buschel: string }) {
  return (
    <g>
      <path d={d} fill={P.fell} />
      <path d={spitze} fill={P.ohrInnen} />
      <path d={innen} fill={P.ohrInnen} opacity={0.85} />
      <path d={buschel} fill="none" stroke={P.creme} strokeWidth={2.5} strokeLinecap="round" />
      <path d={d} fill="none" {...UMRISS} />
    </g>
  );
}

const schwanz: Teil = {
  id: 'schwanz',
  drehpunkt: [124, 190],
  zeichnung: () => (
    <g>
      <path d="M120 200 C154 204 184 176 182 138 C181 116 170 102 160 98 C164 128 152 160 120 174 Z" fill={P.fell} />
      <path d="M126 196 C152 196 172 178 176 156 C170 172 150 186 124 186 Z" fill={P.fellTief} opacity={0.5} />
      <path d="M160 98 C164 116 160 132 152 146 C162 136 168 120 166 104 Z" fill={P.fellHell} opacity={0.8} />
      {/* Cream tip with a few tufts */}
      <path d="M182 138 C181 116 170 102 160 98 C161 112 162 124 166 132 L170 128 L171 137 L176 134 L176 141 Q180 142 182 138 Z" fill={P.creme} />
      <path d="M120 200 C154 204 184 176 182 138 C181 116 170 102 160 98 C164 128 152 160 120 174 Z" fill="none" {...UMRISS} />
      <path d="M166 132 L170 128 L171 137 L176 134 L176 141" fill="none" {...UMRISS_FEIN} />
    </g>
  ),
};

const koerper: Teil = {
  id: 'koerper',
  drehpunkt: [100, 200],
  zeichnung: () => (
    <g>
      {/* Cape, back part, with its darker lining and a stitched hem */}
      <path d="M64 142 Q100 132 136 142 L150 214 Q100 224 50 214 Z" fill={P.gruen} {...UMRISS} />
      <path d="M58 180 L52 212 Q66 216 78 217 Z" fill={P.gruenTief} opacity={0.75} />
      <path d="M142 176 L148 212 Q138 215 128 216 Z" fill={P.gruenTief} opacity={0.45} />
      <path d="M56 210 Q100 220 144 210" fill="none" stroke={P.gruenHell} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />
      {/* Boots: cuff, shaft, sole */}
      {[74, 104].map((x) => (
        <g key={x}>
          <rect x={x} y={196} width={22} height={30} rx={8} fill={P.leder} {...UMRISS} />
          <path d={`M${x + 1.5} 220 h19 v1 a5 5 0 0 1 -5 5 h-9 a5 5 0 0 1 -5 -5 Z`} fill={P.lederTief} />
          <rect x={x - 1} y={196} width={24} height={8} rx={4} fill={P.lederHell} {...UMRISS_FEIN} />
          <path d={`M${x + 5} 211 q4 -3 8 0`} fill="none" stroke={P.lederHell} strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}
      {/* Tunic with shade, middle seam and stitched hem */}
      <path d="M72 142 Q100 136 128 142 L133 202 Q100 209 67 202 Z" fill={P.oliv} />
      <path d="M118 144 Q126 146 128 142 L133 202 Q122 205 112 206 Z" fill={P.olivTief} opacity={0.55} />
      <path d="M72 142 Q100 136 128 142 L133 202 Q100 209 67 202 Z" fill="none" {...UMRISS} />
      <path d="M100 150 V202" stroke={P.olivTief} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M71 198 Q100 204 129 198" fill="none" stroke={P.olivTief} strokeWidth={1.8} strokeDasharray="3 4" strokeLinecap="round" />
      {/* Belt, buckle and a little pouch */}
      <path d="M69 178 Q100 184 131 178 L132 189 Q100 195 68 189 Z" fill={P.leder} {...UMRISS_FEIN} />
      <path d="M72 181 Q100 186 128 181" fill="none" stroke={P.lederHell} strokeWidth={1.5} strokeDasharray="3 3" />
      <rect x="92" y="178" width="16" height="14" rx="3" fill={P.gold} stroke={P.goldTief} strokeWidth={2.5} />
      <rect x="97" y="182" width="6" height="6" rx="1" fill={P.leder} />
      <path d="M94 180 h5" stroke={P.goldHell} strokeWidth={2} strokeLinecap="round" />
      <rect x="112" y="186" width="15" height="14" rx="4" fill={P.lederHell} {...UMRISS_FEIN} />
      <path d="M112 191 Q119.5 196 127 191" fill="none" {...UMRISS_FEIN} />
      <circle cx="119.5" cy="193" r="1.8" fill={P.gold} />
    </g>
  ),
};

const kragen: Teil = {
  id: 'kragen',
  drehpunkt: [100, 142],
  zeichnung: () => (
    <g>
      <path d="M62 140 Q80 156 100 150 Q120 156 138 140 Q120 130 100 134 Q80 130 62 140 Z" fill={P.gruenHell} {...UMRISS} />
      <path d="M70 140 Q84 148 96 146" fill="none" stroke={P.gruen} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M130 140 Q116 148 104 146" fill="none" stroke={P.gruen} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx="100" cy="150" r="6.5" fill={P.gold} stroke={P.goldTief} strokeWidth={2.5} />
      <path d="M97 147 l3 3 M100 147 v6" stroke={P.goldTief} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="98" cy="148" r="1.6" fill={P.goldHell} />
    </g>
  ),
};

const KOPF = 'M100 38 C136 38 160 58 163 86 L174 100 L159 104 C151 124 128 136 100 136 C72 136 49 124 41 104 L26 100 L37 86 C40 58 64 38 100 38 Z';

const kopf: Teil = {
  id: 'kopf',
  drehpunkt: [100, 134],
  anker: { hut: [100, 46] },
  zeichnung: (s) => (
    <g>
      <Ohr d="M50 74 L44 24 C44 18 50 16 54 20 L86 48 Z" spitze="M44.6 34 L44 24 C44 18 50 16 54 20 L62 27 Q52 26 44.6 34 Z" innen="M56 62 L53 32 L76 50 Z" buschel="M58 58 l-1.5 -9 M63 55 l1 -9" />
      <Ohr d="M150 74 L156 24 C156 18 150 16 146 20 L114 48 Z" spitze="M155.4 34 L156 24 C156 18 150 16 146 20 L138 27 Q148 26 155.4 34 Z" innen="M144 62 L147 32 L124 50 Z" buschel="M142 58 l1.5 -9 M137 55 l-1 -9" />
      {/* Fur tuft on top, behind the head */}
      <path d="M88 44 L94 30 L99 40 L105 29 L112 44 Z" fill={P.fell} {...UMRISS} />
      <path d={KOPF} fill={P.fell} />
      {/* Light top left, shade right */}
      <path d="M70 50 Q100 40 130 50 Q118 46 100 46 Q82 46 70 50 Z" fill={P.fellHell} opacity={0.85} />
      <path d="M48 70 Q56 54 72 46 Q58 58 54 72 Z" fill={P.fellHell} opacity={0.7} />
      <path d="M163 86 L174 100 L159 104 C151 124 128 136 100 136 C126 128 146 114 152 90 Q158 86 163 86 Z" fill={P.fellTief} opacity={0.35} />
      <path d={KOPF} fill="none" {...UMRISS} />
      {/* Cream mask and cheek fluff */}
      <path d="M100 84 C114 84 132 92 152 101 C142 122 124 132 100 132 C76 132 58 122 48 101 C68 92 86 84 100 84 Z" fill={P.creme} />
      <path d="M38 98 l8 1 M162 98 l-8 1 M42 104 l7 -1 M158 104 l-7 -1" stroke={P.fellTief} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <path d="M100 58 L94 70 L100 66 L106 70 Z" fill={P.fellTief} opacity={0.55} />
      <ellipse cx="66" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.6} />
      <ellipse cx="134" cy="112" rx="8" ry="4.5" fill={P.backe} opacity={0.6} />
      {[
        [80, 111],
        [76, 116],
        [82, 117],
        [120, 111],
        [124, 116],
        [118, 117],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} fill={P.fellTief} opacity={0.6} />
      ))}
      <Brauen {...s} />
      <Augen {...s} />
      <path d="M92 104 Q100 99 108 104 Q105 112 100 113 Q95 112 92 104 Z" fill={P.auge} />
      <ellipse cx="97.5" cy="104" rx="2.5" ry="1.4" fill={P.weiss} opacity={0.75} />
      <Mund {...s} />
      {s.gesicht === 'traurig' && <path d="M131 101 q4 6 0 9 q-4 -3 0 -9 Z" fill={P.blauHell} stroke={P.blauTief} strokeWidth={1.5} />}
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
          <path d="M100 186 C88 176 86 166 93 162 C97 160 100 163 100 166 C100 163 103 160 107 162 C114 166 112 176 100 186 Z" fill={P.herz} {...UMRISS_FEIN} />
          <path d="M93 166 q2 -2 4 0" fill="none" stroke={P.weiss} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        </g>
      );
    },
    gedanken: ({ zeit }) => (
      <g fill={P.weiss} stroke={P.linie} strokeWidth={2.5} transform={`translate(0 ${(Math.sin(zeit * 2) * 2).toFixed(2)})`}>
        <circle cx="160" cy="58" r="5" />
        <circle cx="172" cy="42" r="7.5" />
        <circle cx="188" cy="22" r="11" />
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
