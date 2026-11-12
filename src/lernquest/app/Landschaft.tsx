// The landscape of Lernquest (Stufe E): sky, mountains, green hills, a castle and round trees, drawn as vector in code.
// Behind the start and sign-in screens; the map (Stufe E, Teil 2) builds on the same pieces.

const C = {
  himmelOben: '#BFE6F2',
  himmelUnten: '#F4F6DC',
  sonne: '#FFF1B8',
  wolke: '#FFFFFF',
  bergFern: '#A9CFB4',
  bergNah: '#86BC7A',
  huegel: '#7CC04F',
  huegelHell: '#A3D86A',
  wiese: '#5DA83A',
  weg: '#F3E3B5',
  wegRand: '#D9C28A',
  stamm: '#7A4A24',
  baum: '#3F9A35',
  baumHell: '#6CC24A',
  baumTief: '#2B7A2A',
  mauer: '#E9DFC8',
  mauerTief: '#C9BC9E',
  dach: '#4F6FD1',
  dachTief: '#3A54A8',
  fahne: '#F2792B',
  fenster: '#5A4636',
  linie: '#4A3A2A',
};

function Baum({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3.5" y="-6" width="7" height="16" rx="2" fill={C.stamm} />
      <circle cx="0" cy="-18" r="16" fill={C.baum} />
      <circle cx="-9" cy="-10" r="11" fill={C.baum} />
      <circle cx="9" cy="-10" r="11" fill={C.baumTief} />
      <circle cx="-5" cy="-24" r="7" fill={C.baumHell} opacity="0.8" />
    </g>
  );
}

function Turm({ x, y, h, b = 22 }: { x: number; y: number; h: number; b?: number }) {
  return (
    <g>
      <rect x={x - b / 2} y={y - h} width={b} height={h} fill={C.mauer} stroke={C.mauerTief} strokeWidth="1.5" />
      <path d={`M${x - b / 2 - 4} ${y - h} L${x} ${y - h - b * 1.3} L${x + b / 2 + 4} ${y - h} Z`} fill={C.dach} />
      <path d={`M${x} ${y - h - b * 1.3} L${x + b / 2 + 4} ${y - h} L${x} ${y - h} Z`} fill={C.dachTief} />
      <path d={`M${x} ${y - h - b * 1.3} v-12`} stroke={C.linie} strokeWidth="1.5" />
      <path d={`M${x} ${y - h - b * 1.3 - 12} l10 3 -10 3 Z`} fill={C.fahne} />
      <rect x={x - 3} y={y - h + 10} width="6" height="9" rx="3" fill={C.fenster} />
    </g>
  );
}

export function Landschaft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -90 400 410" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="lq-himmel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.himmelOben} />
          <stop offset="1" stopColor={C.himmelUnten} />
        </linearGradient>
      </defs>
      <rect y="-90" width="400" height="410" fill="url(#lq-himmel)" />
      <circle cx="330" cy="40" r="26" fill={C.sonne} />
      <g fill={C.wolke} opacity="0.9">
        <ellipse cx="70" cy="58" rx="34" ry="11" />
        <ellipse cx="88" cy="50" rx="18" ry="12" />
        <ellipse cx="250" cy="34" rx="26" ry="8" />
      </g>
      <path d="M0 170 L60 110 L105 150 L160 92 L225 158 L290 104 L345 146 L400 112 V200 H0 Z" fill={C.bergFern} />
      <path d="M0 196 Q70 150 140 176 T290 168 T400 160 V230 H0 Z" fill={C.bergNah} />
      {/* Castle on the hill */}
      <g>
        <rect x="262" y="132" width="80" height="44" fill={C.mauer} stroke={C.mauerTief} strokeWidth="1.5" />
        <path d="M262 132 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6" fill="none" stroke={C.mauerTief} strokeWidth="1.5" />
        <path d="M292 176 v-18 a10 10 0 0 1 20 0 v18 Z" fill={C.fenster} />
        <Turm x={262} y={176} h={62} />
        <Turm x={342} y={176} h={62} />
        <Turm x={302} y={132} h={36} b={18} />
      </g>
      <path d="M0 236 Q90 186 200 214 T400 200 V320 H0 Z" fill={C.huegel} />
      <path d="M0 236 Q90 186 200 214 Q110 204 0 252 Z" fill={C.huegelHell} opacity="0.7" />
      <path d="M0 276 Q120 238 230 262 T400 250 V320 H0 Z" fill={C.wiese} />
      {/* Path to the castle */}
      <path d="M150 320 C170 280 230 270 228 238 C226 214 270 200 302 178" fill="none" stroke={C.wegRand} strokeWidth="20" strokeLinecap="round" />
      <path d="M150 320 C170 280 230 270 228 238 C226 214 270 200 302 178" fill="none" stroke={C.weg} strokeWidth="14" strokeLinecap="round" />
      <Baum x={30} y={232} s={1.1} />
      <Baum x={62} y={222} s={0.8} />
      <Baum x={198} y={206} s={0.7} />
      <Baum x={376} y={210} s={0.9} />
      <Baum x={352} y={262} s={1.2} />
      <Baum x={18} y={292} s={1.3} />
    </svg>
  );
}
