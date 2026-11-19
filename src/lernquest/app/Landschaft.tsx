// The landscape of Lernquest (Stufe E): sky, mountains, green hills, a castle and round trees, drawn as vector in code.
// Behind the start and sign-in screens. Since 19.11.2026 flat like the map (docs/design/prinzipien.md): the sky in
// flat bands instead of a gradient, the castle and the trees are the map's own pieces (figuren/gelaende.tsx,
// figuren/pflanzen.tsx), without outline.
import { Burg } from '../figuren';
import { Baum as BaumForm } from '../figuren/pflanzen';

/** A round tree of the map (origin at its foot), at (x, y) like the old one (its foot 10 below y). */
function Baum({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y + 10}) scale(${s * 0.62})`}>
      <BaumForm />
    </g>
  );
}

const C = {
  himmelOben: '#BFE6F2',
  himmelMitte: '#DCEFEA',
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
};

export function Landschaft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -90 400 410" preserveAspectRatio="xMidYMax slice" aria-hidden>
      {/* The sky in three flat bands, palest at the horizon. */}
      <rect y="-90" width="400" height="410" fill={C.himmelUnten} />
      <rect y="-90" width="400" height="200" fill={C.himmelMitte} />
      <rect y="-90" width="400" height="120" fill={C.himmelOben} />
      <circle cx="330" cy="40" r="26" fill={C.sonne} />
      <g fill={C.wolke} opacity="0.9">
        <ellipse cx="70" cy="58" rx="34" ry="11" />
        <ellipse cx="88" cy="50" rx="18" ry="12" />
        <ellipse cx="250" cy="34" rx="26" ry="8" />
      </g>
      <path d="M0 170 L60 110 L105 150 L160 92 L225 158 L290 104 L345 146 L400 112 V200 H0 Z" fill={C.bergFern} />
      <path d="M0 196 Q70 150 140 176 T290 168 T400 160 V230 H0 Z" fill={C.bergNah} />
      {/* The castle on the hill, its gate where the path ends. */}
      <g transform="translate(300 180) scale(0.42)">
        <Burg />
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
