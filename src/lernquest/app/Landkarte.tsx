// One region of the map as a landscape (Stufe E, Teil 2): a meadow with the region's castle at the top, a winding
// path down through the waypoints, trees beside it and, when the region has a Meilenstein, the dark boss castle at
// the end. The picture is one SVG (layout: src/lernquest/weg.ts); the waypoints are real buttons laid over it at
// the same spots, so they stay accessible and tappable.
import type { ReactNode } from 'react';
import { useId } from 'react';
import { BossBurg } from '../figuren';
import { weltVon } from '../figuren/welten';
import { wegPlan } from '../weg';

const BURG_MASS = 0.8;

export interface Wegpunkt {
  key: string;
  inhalt: ReactNode;
  /** Extra class on the waypoint (e.g. its state). */
  klasse?: string;
}

/** `kopf`: the region's title card above the castle; `mitBoss`: the last waypoint is the Meilenstein; `nummer`: the
 *  region's number, which picks its world (figuren/welten.tsx; the Extra-Pakete regions have fixed ones). */
export function Landkarte({ id, nummer = 1, kopf, punkte, mitBoss }: { id: string; nummer?: number; kopf: ReactNode; punkte: Wegpunkt[]; mitBoss: boolean }) {
  const plan = wegPlan(punkte.length, mitBoss, id);
  const welt = weltVon(id, nummer);
  const clip = useId();
  const { breite, hoehe } = plan;
  // Castle and boss castle join the trees in one list, so whatever stands lower covers what is behind it.
  const stehend = [
    ...plan.deko.map((d) => ({ y: d.y, key: `${d.art}${d.x},${d.y}`, el: <g transform={`translate(${d.x} ${d.y}) scale(${d.spiegeln ? -d.s : d.s} ${d.s})`}>{welt.deko[d.art]()}</g> })),
    { y: plan.burg.y, key: 'burg', el: <g transform={`translate(${plan.burg.x} ${plan.burg.y}) scale(${BURG_MASS})`}>{welt.wahrzeichen()}</g> },
    ...(plan.boss ? [{ y: plan.boss.y, key: 'boss', el: <g transform={`translate(${plan.boss.x} ${plan.boss.y}) scale(${BURG_MASS})`}>{BossBurg()}</g> }] : []),
  ].sort((a, b) => a.y - b.y);

  return (
    <div className={`lq-landkarte welt-${welt.id}`}>
      <div className="lq-landkarte-kopf">{kopf}</div>
      <div className="lq-landkarte-flaeche" style={{ aspectRatio: `${breite} / ${hoehe}` }}>
        <svg viewBox={`0 0 ${breite} ${hoehe}`} aria-hidden focusable="false">
          <defs>
            <clipPath id={clip}>
              <rect width={breite} height={hoehe} rx={24} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`}>
            <rect width={breite} height={hoehe} fill={welt.boden} />
            {/* A hill behind the landmark, soft patches in the ground (water at the beach). */}
            <ellipse cx={breite / 2} cy={plan.burg.y + 10} rx={170} ry={70} fill={welt.flecken} />
            {Array.from({ length: Math.floor(hoehe / 160) }, (_, i) => (
              <ellipse key={i} cx={i % 2 ? 70 : breite - 70} cy={260 + i * 160} rx={90} ry={34} fill={welt.flecken} opacity={0.55} />
            ))}
            {welt.punkte &&
              Array.from({ length: Math.floor(hoehe / 40) }, (_, i) => (
                <circle key={`p${i}`} cx={(i * 97 + 31) % breite} cy={(i * 53 + 17) % hoehe} r={i % 3 ? 1.6 : 2.6} fill={welt.punkte} opacity={0.8} />
              ))}
            {plan.boss && <ellipse cx={plan.boss.x} cy={plan.boss.y - 10} rx={150} ry={60} fill={welt.bodenTief} opacity={0.6} />}
            {/* The path: an edge, the path, a dashed line down the middle. */}
            <path d={plan.pfad} fill="none" stroke={welt.wegRand} strokeWidth={30} strokeLinecap="round" />
            <path d={plan.pfad} fill="none" stroke={welt.weg} strokeWidth={22} strokeLinecap="round" />
            <path d={plan.pfad} fill="none" stroke={welt.wegLinie} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 12" />
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
