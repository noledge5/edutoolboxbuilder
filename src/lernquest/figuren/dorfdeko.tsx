// Small things of the class village, flat from the front like game pieces on the board (prinzipien.md): trees,
// bushes, flowers, stones, chickens, lanterns, smoke and pennants. Drawn at a screen point (the foot), `k` scales.
// Moving parts carry a class (lernquest.css: lq-rauch, lq-fahne, lq-huhn); „Bewegung reduzieren“ stops them.
import type { Pt } from "./iso";
import { P } from "./stil";

/** A round tree; with snow a white cap on the crown. */
export function baum(p: Pt, k = 1, schnee = false) {
  const r = 13 * k;
  const c: Pt = [p[0], p[1] - 17 * k - r * 0.8];
  return (
    <g>
      <rect x={p[0] - r * 0.8} y={p[1] - 3} width={r * 1.9} height={6} rx={3} fill={P.schatten} opacity={0.16} />
      <rect x={p[0] - 3 * k} y={p[1] - 18 * k} width={6 * k} height={18 * k} rx={3 * k} fill={P.holzTief} />
      <circle cx={c[0]} cy={c[1]} r={r} fill={P.blattTief} />
      <circle cx={c[0] - r * 0.12} cy={c[1] - r * 0.12} r={r * 0.86} fill={P.blatt} />
      {schnee ? (
        <path d={`M${c[0] - r * 0.86} ${c[1] - r * 0.1} a${r * 0.86} ${r * 0.86} 0 0 1 ${r * 1.5} ${-r * 0.42} q${-r * 0.7} ${r * 0.1} ${-r * 1.5} ${r * 0.42}Z`} fill={P.schnee} />
      ) : (
        <circle cx={c[0] - r * 0.38} cy={c[1] - r * 0.38} r={r * 0.3} fill={P.blattHell} />
      )}
    </g>
  );
}

export function busch(p: Pt, k = 1, schnee = false) {
  return (
    <g>
      <circle cx={p[0] + 4 * k} cy={p[1] - 4 * k} r={5.5 * k} fill={P.blattTief} />
      <circle cx={p[0] - 3 * k} cy={p[1] - 5 * k} r={6.5 * k} fill={P.blatt} />
      <circle cx={p[0] - 5 * k} cy={p[1] - 8 * k} r={2.5 * k} fill={schnee ? P.schnee : P.blattHell} />
      {schnee && <ellipse cx={p[0]} cy={p[1] - 10 * k} rx={6 * k} ry={2.5 * k} fill={P.schnee} />}
    </g>
  );
}

const BLUETEN = [P.rosa, P.wolkeHell, P.gelb, P.rot];
export function blume(p: Pt, n: number) {
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={2.8} fill={BLUETEN[n % 4]} />
      <circle cx={p[0]} cy={p[1]} r={1.1} fill={n % 4 === 2 ? P.orange : P.gelb} />
    </g>
  );
}

export function stein(p: Pt, k = 1) {
  return (
    <g>
      <ellipse cx={p[0]} cy={p[1] - 2 * k} rx={5 * k} ry={3.5 * k} fill={P.bruchTief} />
      <ellipse cx={p[0] - 1 * k} cy={p[1] - 3 * k} rx={3.8 * k} ry={2.6 * k} fill={P.bruch} />
    </g>
  );
}

/** A chicken pecking now and then. */
export function huhn(p: Pt, links = false) {
  const s = links ? -1 : 1;
  return (
    <g className="lq-huhn">
      <rect x={p[0] - 6} y={p[1] - 2} width={12} height={4} rx={2} fill={P.schatten} opacity={0.16} />
      <path d={`M${p[0] - 2} ${p[1] - 4} v4 M${p[0] + 2} ${p[1] - 4} v4`} stroke={P.orange} strokeWidth={1.6} strokeLinecap="round" />
      <ellipse cx={p[0]} cy={p[1] - 8} rx={6.5} ry={5} fill={P.wolke} />
      <circle cx={p[0] + s * 5} cy={p[1] - 13} r={3.6} fill={P.wolke} />
      <circle cx={p[0] + s * 5} cy={p[1] - 17} r={1.9} fill={P.rot} />
      <path d={`M${p[0] + s * 8} ${p[1] - 14} l${s * 3} 1 l${-s * 3} 1Z`} fill={P.orange} />
      <circle cx={p[0] + s * 6} cy={p[1] - 14} r={0.9} fill={P.auge} />
    </g>
  );
}

/** A lantern on a post; the glass is lit in the evening. */
export function laterne(p: Pt, nacht = false) {
  return (
    <g>
      <rect x={p[0] - 5} y={p[1] - 2} width={10} height={4} rx={2} fill={P.schatten} opacity={0.18} />
      <rect x={p[0] - 1.5} y={p[1] - 28} width={3} height={28} rx={1.5} fill={P.balken} />
      <rect x={p[0] - 5} y={p[1] - 37} width={10} height={11} rx={3} fill={P.balken} />
      <rect x={p[0] - 3} y={p[1] - 35} width={6} height={7} rx={2} fill={nacht ? P.licht : P.putzHell} data-licht={nacht ? "" : undefined} />
    </g>
  );
}

/** Three puffs of smoke over a chimney (screen point of its top). */
export function rauch(p: Pt) {
  return (
    <g className="lq-rauch">
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={p[0] + i * 2} cy={p[1] - 4 - i * 7} r={3 + i} fill={P.wolke} style={{ animationDelay: `${-i * 1.1}s` }} />
      ))}
    </g>
  );
}

/** A pennant on a short pole standing on the screen point `p`. */
export function wimpel(p: Pt, farbe: string, hoch = 14) {
  return (
    <g>
      <line x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - hoch} stroke={P.balken} strokeWidth={2.5} strokeLinecap="round" />
      <g className="lq-fahne">
        <path d={`M${p[0]} ${p[1] - hoch} l11 3.5 l-11 4Z`} fill={farbe} stroke={farbe} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** A glint on the water. */
export function glitzer(p: Pt, n: number, farbe: string = P.wasserHell) {
  return <rect className="lq-glitzer" x={p[0]} y={p[1]} width={9 + (n % 3) * 4} height={3} rx={1.5} fill={farbe} style={{ animationDelay: `${-(n % 7) * 0.6}s` }} />;
}
