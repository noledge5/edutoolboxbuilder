// Plants shared by the hero backgrounds (hintergruende.tsx) and the map (gelaende.tsx, welten.tsx), so a tree looks
// the same everywhere (19.11.2026). Flat from the front like the figures (they stand in the iso world like pieces on
// a board), without outline, few big shapes; origin at the foot (centre bottom). All about 64-70 high.
import { P, flaeche } from './stil';

const Fl = ({ d, f, b = 3 }: { d: string; f: string; b?: number }) => <path d={d} {...flaeche(f, b)} />;
const Kr = ({ x, y, r, f, b = 3 }: { x: number; y: number; r: number; f: string; b?: number }) => <circle cx={x} cy={y} r={r} {...flaeche(f, b)} />;

/** A round deciduous tree: trunk, the crown in `blattTief` and once more in `blatt`, moved up left. */
export function Baum() {
  return (
    <g>
      <rect x={-5} y={-30} width={10} height={30} rx={3} {...flaeche(P.leder, 2.5)} />
      <Kr x={4} y={-44} r={21} f={P.blattTief} />
      <Kr x={-1} y={-48} r={21} f={P.blatt} />
    </g>
  );
}

/** A fir of two tiers (about 66 high); with `schnee` snow caps on both. */
export function Tanne({ stamm = true, schnee = false }: { stamm?: boolean; schnee?: boolean }) {
  return (
    <g>
      {stamm && <rect x={-4} y={-14} width={8} height={14} rx={2} {...flaeche(P.leder, 2.5)} />}
      <Fl d="M0 -40 L24 -8 H-24 Z" f={P.blattTief} />
      <Fl d="M0 -66 L17 -34 H-17 Z" f={P.blatt} />
      {schnee && <Fl d="M0 -40 L11 -25 H-11 Z" f={P.schnee} b={2.5} />}
      {schnee && <Fl d="M0 -66 L8 -50 H-8 Z" f={P.schnee} b={2.5} />}
    </g>
  );
}

/** A fir as one flat shape (silhouette, about 64 high, origin at the foot): forest edges and night trees. */
export const TANNE_FLACH = 'M-4 0 V-12 H-22 L-8 -34 H-16 L0 -64 L16 -34 H8 L22 -12 H4 V0 Z';

/** A cactus as one thick tube with two arms (about 52 high). */
export function Kaktus() {
  return <path d="M0 -2 V-46 M0 -16 H-13 V-30 M0 -24 H13 V-38" stroke={P.gruen} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
}

/** A palm: a bent trunk and five fronds (about 70 high). */
export function Palme() {
  return (
    <g>
      <path d="M0 0 Q10 -30 -2 -64" stroke={P.holz} strokeWidth={9} strokeLinecap="round" fill="none" />
      <g transform="translate(-2 -64)">
        {[-30, 15, 60, 140, 195].map((w) => (
          <g key={w} transform={`rotate(${w})`}>
            <Fl d="M0 0 Q20 -22 46 2 Q22 -6 0 0 Z" f={P.gruen} b={2.5} />
          </g>
        ))}
      </g>
    </g>
  );
}
