// One region of the map as a landscape (Stufe E, Teil 2): a meadow with the region's castle at the top, a winding
// path down through the waypoints, trees beside it and, when the region has a Meilenstein, the dark boss castle at
// the end. The picture is one SVG (layout: src/lernquest/weg.ts); the waypoints are real buttons laid over it at
// the same spots, so they stay accessible and tappable.
import type { ReactNode } from 'react';
import { useId } from 'react';
import { BossBurg, Burg, Baum, Blume, Busch, Stein, Tanne } from '../figuren';
import { P } from '../figuren/stil';
import { wegPlan } from '../weg';
import type { DekoArt } from '../weg';

const DEKO: Record<DekoArt, () => ReactNode> = { baum: Baum, tanne: Tanne, busch: Busch, blume: Blume, stein: Stein };
const BURG_MASS = 0.8;

export interface Wegpunkt {
  key: string;
  inhalt: ReactNode;
  /** Extra class on the waypoint (e.g. its state). */
  klasse?: string;
}

/** `kopf`: the region's title card above the castle; `mitBoss`: the last waypoint is the Meilenstein. */
export function Landkarte({ id, kopf, punkte, mitBoss }: { id: string; kopf: ReactNode; punkte: Wegpunkt[]; mitBoss: boolean }) {
  const plan = wegPlan(punkte.length, mitBoss, id);
  const clip = useId();
  const { breite, hoehe } = plan;
  // Castle and boss castle join the trees in one list, so whatever stands lower covers what is behind it.
  const stehend = [
    ...plan.deko.map((d) => ({ y: d.y, key: `${d.art}${d.x},${d.y}`, el: <g transform={`translate(${d.x} ${d.y}) scale(${d.spiegeln ? -d.s : d.s} ${d.s})`}>{DEKO[d.art]()}</g> })),
    { y: plan.burg.y, key: 'burg', el: <g transform={`translate(${plan.burg.x} ${plan.burg.y}) scale(${BURG_MASS})`}>{Burg()}</g> },
    ...(plan.boss ? [{ y: plan.boss.y, key: 'boss', el: <g transform={`translate(${plan.boss.x} ${plan.boss.y}) scale(${BURG_MASS})`}>{BossBurg()}</g> }] : []),
  ].sort((a, b) => a.y - b.y);

  return (
    <div className="lq-landkarte">
      <div className="lq-landkarte-kopf">{kopf}</div>
      <div className="lq-landkarte-flaeche" style={{ aspectRatio: `${breite} / ${hoehe}` }}>
        <svg viewBox={`0 0 ${breite} ${hoehe}`} aria-hidden focusable="false">
          <defs>
            <clipPath id={clip}>
              <rect width={breite} height={hoehe} rx={24} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`}>
            <rect width={breite} height={hoehe} fill={P.wiese} />
            {/* A hill behind the castle, soft light patches in the meadow. */}
            <ellipse cx={breite / 2} cy={plan.burg.y + 10} rx={170} ry={70} fill={P.wieseHell} />
            {Array.from({ length: Math.floor(hoehe / 160) }, (_, i) => (
              <ellipse key={i} cx={i % 2 ? 70 : breite - 70} cy={260 + i * 160} rx={90} ry={34} fill={P.wieseHell} opacity={0.55} />
            ))}
            {plan.boss && <ellipse cx={plan.boss.x} cy={plan.boss.y - 10} rx={150} ry={60} fill={P.wieseTief} opacity={0.6} />}
            {/* The path: an edge, the sand, a dashed line down the middle. */}
            <path d={plan.pfad} fill="none" stroke={P.sandTief} strokeWidth={30} strokeLinecap="round" />
            <path d={plan.pfad} fill="none" stroke={P.sand} strokeWidth={22} strokeLinecap="round" />
            <path d={plan.pfad} fill="none" stroke={P.sandHell} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 12" />
            {stehend.map((s) => (
              <g key={s.key}>{s.el}</g>
            ))}
          </g>
        </svg>
        <ol className="lq-wegpunkte">
          {punkte.map((p, i) => {
            const q = plan.punkte[i];
            const seite = q.x > breite / 2 + 1 ? 'rechts' : q.x < breite / 2 - 1 ? 'links' : 'mitte';
            return (
              <li key={p.key} className={`lq-wegpunkt ${seite}${p.klasse ? ` ${p.klasse}` : ''}`} style={{ left: `${(q.x / breite) * 100}%`, top: `${(q.y / hoehe) * 100}%` }}>
                {p.inhalt}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
