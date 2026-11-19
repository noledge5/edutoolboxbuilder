// The treasure chest (Stufe E, Teil 5) in the style of the figures: a wooden box, a round lid, gold straps and a lock.
// Drawn in a 160 × 140 box; the lid is the group `.lq-truhe-deckel` so the app can lift it (lernquest.css).
// No outline (docs/design/prinzipien.md, Stilprobe 2): wood and gold separate by tone, one shade on the right.
import { flaeche, P, STRICH } from './stil';

export function TruheZeichnung({ offen = false }: { offen?: boolean }) {
  return (
    <g>
      <ellipse cx={80} cy={131} rx={66} ry={7} fill={P.schatten} opacity={0.18} />
      {/* Gems and gold, seen when the lid is up */}
      {offen && (
        <g>
          <ellipse cx={80} cy={66} rx={58} ry={12} {...flaeche(P.goldHell, 2.5)} />
          <path d="M44 66 l10 -14 10 14 Z" {...flaeche(P.blau, 2.5)} />
          <path d="M70 64 l8 -16 8 16 Z" {...flaeche(P.lila, 2.5)} />
          <path d="M96 66 l9 -12 9 12 Z" {...flaeche(P.tuerkis, 2.5)} />
          <circle cx={62} cy={62} r={6} {...flaeche(P.gold, 2)} />
          <circle cx={112} cy={60} r={5} {...flaeche(P.goldTief, 2)} />
        </g>
      )}
      {/* Body: wood with shade on the right, two gold straps */}
      <rect x={16} y={64} width={128} height={64} rx={10} {...flaeche(P.holz)} />
      <path d="M118 64 H134 a10 10 0 0 1 10 10 V118 a10 10 0 0 1 -10 10 H112 Z" fill={P.holzTief} opacity={0.5} />
      {[30, 130].map((x) => (
        <rect key={x} x={x - 7} y={64} width={14} height={64} {...flaeche(P.gold, 2.5)} />
      ))}
      {/* Lid: one round shape, a gold rim, one light */}
      <g className="lq-truhe-deckel">
        <path d="M14 68 C14 32 40 18 80 18 C120 18 146 32 146 68 Z" {...flaeche(P.holz)} />
        <path d="M110 22 C132 30 146 44 146 68 H120 C122 48 118 34 110 22 Z" fill={P.holzTief} opacity={0.5} />
        <path d="M30 50 Q40 32 64 26" fill="none" stroke={P.sand} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <rect x={12} y={60} width={136} height={10} rx={4} {...flaeche(P.gold, 2.5)} />
        <rect x={23} y={34} width={14} height={28} rx={5} {...flaeche(P.gold, 2.5)} />
        <rect x={123} y={34} width={14} height={28} rx={5} {...flaeche(P.gold, 2.5)} />
      </g>
      {/* Lock plate with a keyhole */}
      <rect x={64} y={58} width={32} height={36} rx={8} {...flaeche(P.goldTief, 2.5)} />
      <rect x={64} y={58} width={32} height={30} rx={8} {...flaeche(P.gold, 2.5)} />
      <circle cx={80} cy={72} r={5} fill={P.linie} />
      <path d="M80 74 v10" {...STRICH} strokeWidth={4} />
    </g>
  );
}
