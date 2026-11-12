// The fox who guides the children through Lernquest (Stufe E, docs/kritik-und-plan.md). Drawn as vector in code, no
// image files: one body, five poses that only change arms and face. The colours live here (the art), not in the CSS
// tokens, like the other drawings of the app.
import type { ReactNode } from 'react';

export type FuchsPose = 'stehen' | 'winken' | 'jubeln' | 'denken' | 'troesten';

const F = {
  linie: '#4A2414',
  fell: '#F2792B',
  fellHell: '#F9A55A',
  fellTief: '#C9561A',
  creme: '#FFF3E0',
  ohrInnen: '#7A3A1E',
  auge: '#2A1810',
  backe: '#FF8F86',
  mund: '#8E2B26',
  zunge: '#FF7C78',
  umhang: '#2F8A2A',
  umhangTief: '#1F6420',
  kragen: '#45A93A',
  hemd: '#7E9A3E',
  hemdTief: '#647C2E',
  leder: '#7A4A24',
  lederTief: '#5A3418',
  gold: '#FFC531',
  goldTief: '#C98F00',
};

const L = { stroke: F.linie, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** A limb with an outline: a thick dark stroke under a thinner coloured one, and a round paw at the end. */
function Arm({ d, pfote, farbe = F.hemd, className }: { d: string; pfote: [number, number]; farbe?: string; className?: string }) {
  return (
    <g className={className}>
      <path d={d} fill="none" stroke={F.linie} strokeWidth={19} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={farbe} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pfote[0]} cy={pfote[1]} r={9} fill={F.fell} {...L} />
      <path d={`M${pfote[0] - 4} ${pfote[1] + 3}q4 3 8 0`} fill="none" stroke={F.fellTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

const ARME: Record<FuchsPose, { links: [string, [number, number]]; rechts: [string, [number, number]]; vorn?: boolean }> = {
  stehen: { links: ['M74 150 Q64 166 64 184', [64, 186]], rechts: ['M126 150 Q136 166 136 184', [136, 186]] },
  winken: { links: ['M74 150 Q64 166 64 184', [64, 186]], rechts: ['M126 150 Q164 146 172 86', [172, 80]] },
  jubeln: { links: ['M74 150 Q36 146 28 88', [28, 82]], rechts: ['M126 150 Q164 146 172 88', [172, 82]] },
  denken: { links: ['M74 150 Q64 166 64 184', [64, 186]], rechts: ['M126 150 Q146 154 126 136', [120, 131]], vorn: true },
  troesten: { links: ['M74 150 Q74 166 88 172', [90, 172]], rechts: ['M126 150 Q126 166 112 172', [110, 172]] },
};

function Augen({ pose }: { pose: FuchsPose }) {
  if (pose === 'jubeln')
    return (
      <g fill="none" stroke={F.auge} strokeWidth={4.5} strokeLinecap="round">
        <path d="M71 95 Q80 84 89 95" />
        <path d="M111 95 Q120 84 129 95" />
      </g>
    );
  // Looking up while thinking, a little softer while comforting.
  const dy = pose === 'denken' ? -3 : 0;
  const dx = pose === 'denken' ? 2 : 0;
  const ry = pose === 'troesten' ? 9 : 11;
  return (
    <g>
      {[80, 120].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={93} rx={9} ry={ry} fill={F.auge} />
          <circle cx={x + 3 + dx} cy={88 + dy} r={3.4} fill="#fff" />
          <circle cx={x - 3 + dx} cy={97 + dy} r={1.6} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Brauen({ pose }: { pose: FuchsPose }) {
  const s = { fill: 'none', stroke: F.ohrInnen, strokeWidth: 3.5, strokeLinecap: 'round' as const };
  if (pose === 'denken')
    return (
      <g {...s}>
        <path d="M70 76 Q79 72 88 76" />
        <path d="M112 72 Q121 66 130 71" />
      </g>
    );
  if (pose === 'troesten')
    return (
      <g {...s}>
        <path d="M71 80 Q79 78 88 74" />
        <path d="M112 74 Q121 78 129 80" />
      </g>
    );
  return null;
}

function Mund({ pose }: { pose: FuchsPose }) {
  if (pose === 'winken' || pose === 'jubeln')
    return (
      <g>
        <path d="M89 116 Q100 134 111 116 Z" fill={F.mund} {...L} strokeWidth={2.5} />
        <path d="M94 125 Q100 120 106 125 Q100 131 94 125 Z" fill={F.zunge} />
      </g>
    );
  if (pose === 'denken') return <path d="M95 120 Q101 117 106 120" fill="none" {...L} strokeWidth={2.5} />;
  return <path d="M91 116 Q95.5 122 100 117 Q104.5 122 109 116" fill="none" {...L} strokeWidth={2.5} />;
}

export function Fuchs({ pose = 'stehen', groesse = 160, className, titel }: { pose?: FuchsPose; groesse?: number; className?: string; titel?: string }) {
  const arme = ARME[pose];
  const armeSvg: ReactNode = (
    <>
      <Arm d={arme.links[0]} pfote={arme.links[1]} className="lq-fuchs-arm-links" />
      <Arm d={arme.rechts[0]} pfote={arme.rechts[1]} className="lq-fuchs-arm-rechts" />
    </>
  );
  return (
    <svg
      className={`lq-fuchs lq-fuchs-${pose}${className ? ` ${className}` : ''}`}
      width={groesse}
      height={(groesse * 240) / 200}
      viewBox="0 0 200 240"
      role={titel ? 'img' : undefined}
      aria-label={titel}
      aria-hidden={titel ? undefined : true}
    >
      {/* Shadow on the ground */}
      <ellipse cx="100" cy="228" rx="58" ry="8" fill={F.linie} opacity="0.18" />
      {/* Tail, behind everything */}
      <g className="lq-fuchs-schwanz">
        <path d="M120 200 C154 204 184 176 182 138 C181 116 170 102 160 98 C164 128 152 160 120 174 Z" fill={F.fell} {...L} />
        <path d="M182 138 C181 116 170 102 160 98 C161 114 162 128 170 140 Q176 144 182 138 Z" fill={F.creme} {...L} />
        <path d="M134 184 C150 178 162 166 168 152" fill="none" stroke={F.fellTief} strokeWidth={3} strokeLinecap="round" opacity="0.6" />
      </g>
      {/* Cape, back part */}
      <path d="M64 142 Q100 132 136 142 L150 214 Q100 224 50 214 Z" fill={F.umhang} {...L} />
      <path d="M58 180 L52 212 Q66 216 78 217 Z" fill={F.umhangTief} opacity="0.7" />
      {/* Legs and boots */}
      <rect x="74" y="196" width="22" height="30" rx="8" fill={F.leder} {...L} />
      <rect x="104" y="196" width="22" height="30" rx="8" fill={F.leder} {...L} />
      <path d="M77 214 h16 M107 214 h16" stroke={F.lederTief} strokeWidth={3} strokeLinecap="round" />
      {/* Tunic and belt */}
      <path d="M72 142 Q100 136 128 142 L133 202 Q100 209 67 202 Z" fill={F.hemd} {...L} />
      <path d="M100 150 V202" stroke={F.hemdTief} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M69 178 Q100 184 131 178 L132 189 Q100 195 68 189 Z" fill={F.leder} {...L} strokeWidth={2.5} />
      <rect x="92" y="178" width="16" height="14" rx="3" fill={F.gold} stroke={F.goldTief} strokeWidth={2.5} />
      <rect x="97" y="182" width="6" height="6" rx="1" fill={F.leder} />
      {!arme.vorn && armeSvg}
      {arme.vorn && <Arm d={arme.links[0]} pfote={arme.links[1]} className="lq-fuchs-arm-links" />}
      {/* Collar of the cape with a golden clasp */}
      <path d="M62 140 Q80 156 100 150 Q120 156 138 140 Q120 130 100 134 Q80 130 62 140 Z" fill={F.kragen} {...L} />
      <circle cx="100" cy="150" r="6" fill={F.gold} stroke={F.goldTief} strokeWidth={2.5} />
      {/* Head */}
      <g className="lq-fuchs-kopf">
        <path d="M50 74 L44 24 C44 18 50 16 54 20 L86 48 Z" fill={F.fell} {...L} />
        <path d="M56 62 L53 32 L76 50 Z" fill={F.ohrInnen} />
        <path d="M150 74 L156 24 C156 18 150 16 146 20 L114 48 Z" fill={F.fell} {...L} />
        <path d="M144 62 L147 32 L124 50 Z" fill={F.ohrInnen} />
        <path
          d="M100 38 C136 38 160 58 163 86 L174 100 L159 104 C151 124 128 136 100 136 C72 136 49 124 41 104 L26 100 L37 86 C40 58 64 38 100 38 Z"
          fill={F.fell}
          {...L}
        />
        <path d="M70 50 Q100 40 130 50 Q118 46 100 46 Q82 46 70 50 Z" fill={F.fellHell} opacity="0.8" />
        <path d="M100 84 C114 84 132 92 152 101 C142 122 124 132 100 132 C76 132 58 122 48 101 C68 92 86 84 100 84 Z" fill={F.creme} />
        <path d="M100 58 L94 70 L100 66 L106 70 Z" fill={F.fellTief} opacity="0.55" />
        <ellipse cx="66" cy="112" rx="8" ry="4.5" fill={F.backe} opacity="0.55" />
        <ellipse cx="134" cy="112" rx="8" ry="4.5" fill={F.backe} opacity="0.55" />
        <Brauen pose={pose} />
        <Augen pose={pose} />
        <path d="M92 104 Q100 99 108 104 Q105 112 100 113 Q95 112 92 104 Z" fill={F.auge} />
        <ellipse cx="97.5" cy="104" rx="2.5" ry="1.4" fill="#fff" opacity="0.7" />
        <Mund pose={pose} />
      </g>
      {arme.vorn && <Arm d={arme.rechts[0]} pfote={arme.rechts[1]} className="lq-fuchs-arm-rechts" />}
      {pose === 'troesten' && <path d="M100 186 C88 176 86 166 93 162 C97 160 100 163 100 166 C100 163 103 160 107 162 C114 166 112 176 100 186 Z" fill="#E8485A" {...L} strokeWidth={2.5} />}
      {pose === 'winken' && (
        <g className="lq-fuchs-schwung" fill="none" stroke={F.linie} strokeWidth={3} strokeLinecap="round" opacity="0.5">
          <path d="M186 66 q6 6 4 14" />
          <path d="M194 58 q7 9 4 22" />
        </g>
      )}
      {pose === 'denken' && (
        <g fill="#fff" stroke={F.linie} strokeWidth={2.5}>
          <circle cx="160" cy="58" r="5" />
          <circle cx="172" cy="42" r="7.5" />
        </g>
      )}
      {pose === 'jubeln' && (
        <g fill={F.gold} stroke={F.goldTief} strokeWidth={2} strokeLinejoin="round">
          <path d="M28 54 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" />
          <path d="M170 40 l2.4 5.6 5.6 .8 -4 4 .8 5.6 -4.8 -2.4 -4.8 2.4 .8 -5.6 -4 -4 5.6 -.8 Z" />
        </g>
      )}
    </svg>
  );
}

/** The fox says something: the fox on the left, a speech bubble with the text on the right. */
export function FuchsSagt({ pose = 'stehen', children }: { pose?: FuchsPose; children: ReactNode }) {
  return (
    <div className="lq-fuchs-sagt">
      <Fuchs pose={pose} groesse={92} />
      <div className="lq-sprech">{children}</div>
    </div>
  );
}
