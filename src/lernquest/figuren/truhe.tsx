// The treasure chest (Stufe E, Teil 5) in the style of the figures: wood with gold bands, a lock plate, gems inside.
// Drawn in a 160 × 140 box; the lid is the group `.lq-truhe-deckel` so the app can lift it (lernquest.css).
import { P, UMRISS, UMRISS_FEIN } from './stil';

export function TruheZeichnung({ offen = false }: { offen?: boolean }) {
  return (
    <g>
      <ellipse cx={80} cy={131} rx={66} ry={7} fill={P.schatten} opacity={0.18} />
      {/* Gems and gold, seen when the lid is up */}
      {offen && (
        <g>
          <ellipse cx={80} cy={66} rx={58} ry={12} fill={P.goldHell} />
          <path d="M44 66 l10 -14 10 14 Z" fill={P.blau} stroke={P.blauTief} strokeWidth={2} strokeLinejoin="round" />
          <path d="M70 64 l8 -16 8 16 Z" fill={P.lila} stroke={P.lilaTief} strokeWidth={2} strokeLinejoin="round" />
          <path d="M96 66 l9 -12 9 12 Z" fill={P.tuerkis} stroke={P.tuerkisTief} strokeWidth={2} strokeLinejoin="round" />
          <circle cx={62} cy={62} r={6} fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
          <circle cx={112} cy={60} r={5} fill={P.gold} stroke={P.goldTief} strokeWidth={2} />
        </g>
      )}
      {/* Body: wood, shade on the right, gold bands, rivets */}
      <rect x={16} y={64} width={128} height={64} rx={10} fill={P.holz} />
      <path d="M118 64 H134 a10 10 0 0 1 10 10 V118 a10 10 0 0 1 -10 10 H112 Z" fill={P.holzTief} opacity={0.5} />
      <path d="M24 80 H64 M24 100 H64 M96 100 H136" stroke={P.holzTief} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
      <rect x={16} y={64} width={128} height={64} rx={10} fill="none" {...UMRISS} />
      {[30, 130].map((x) => (
        <rect key={x} x={x - 7} y={64} width={14} height={64} fill={P.gold} {...UMRISS_FEIN} />
      ))}
      <rect x={16} y={112} width={128} height={10} fill={P.goldTief} {...UMRISS_FEIN} />
      {/* Lid */}
      <g className="lq-truhe-deckel">
        <path d="M14 68 C14 32 40 18 80 18 C120 18 146 32 146 68 Z" fill={P.holz} />
        <path d="M110 22 C132 30 146 44 146 68 H120 C122 48 118 34 110 22 Z" fill={P.holzTief} opacity={0.5} />
        <path d="M30 50 Q40 32 64 26" fill="none" stroke={P.sand} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <path d="M14 68 C14 32 40 18 80 18 C120 18 146 32 146 68 Z" fill="none" {...UMRISS} />
        {[30, 130].map((x) => (
          <path key={x} d={`M${x - 7} 68 V${x < 80 ? 36 : 36} Q${x} ${x < 80 ? 30 : 30} ${x + 7} ${x < 80 ? 32 : 40} V68 Z`} fill={P.gold} {...UMRISS_FEIN} />
        ))}
        <rect x={12} y={60} width={136} height={10} rx={4} fill={P.gold} {...UMRISS_FEIN} />
        <path d="M18 63 H70" stroke={P.goldHell} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {/* Lock plate with a keyhole and a gem */}
      <rect x={66} y={58} width={28} height={34} rx={7} fill={P.gold} {...UMRISS_FEIN} />
      <path d="M70 62 H82" stroke={P.goldHell} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={80} cy={72} r={4.5} fill={P.rot} stroke={P.rotTief} strokeWidth={1.5} />
      <path d="M80 80 v6" stroke={P.linie} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}
