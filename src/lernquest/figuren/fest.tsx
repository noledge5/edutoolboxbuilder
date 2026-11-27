// Pennants for Lernquest events (src/lernquest/event.ts): a cord with pennants in the event's colours, over the banner
// and across the top of each region on the map while an event runs. Flat like the map (no outline, decided
// 19.11.2026): the light comes from the top left, so each pennant has its shade on the right half.
import type { EventArt } from '../event';
import { P } from './stil';

export interface WimpelFarbe {
  farbe: string;
  tief: string;
}

/** The colours of each kind: blue and gold for words, red and gold with silver for a test, all colours for a feast. */
export const EVENT_FARBEN: Record<EventArt, WimpelFarbe[]> = {
  vokabeltest: [
    { farbe: P.blau, tief: P.blauTief },
    { farbe: P.gold, tief: P.goldTief },
    { farbe: P.blauHell, tief: P.blau },
  ],
  klassenarbeit: [
    { farbe: P.rot, tief: P.rotTief },
    { farbe: P.gold, tief: P.goldTief },
    { farbe: P.metall, tief: P.metallTief },
  ],
  eigenes: [
    { farbe: P.lila, tief: P.lilaTief },
    { farbe: P.gold, tief: P.goldTief },
    { farbe: P.gruenHell, tief: P.gruen },
    { farbe: P.rot, tief: P.rotTief },
    { farbe: P.blau, tief: P.blauTief },
  ],
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A cord from (0, y) to (breite, y), sagging by `durchhang` in the middle, with pennants `tiefe` long. */
export function Wimpelkette({ breite, y = 0, durchhang = 24, tiefe = 26, farben }: { breite: number; y?: number; durchhang?: number; tiefe?: number; farben: readonly WimpelFarbe[] }) {
  const n = Math.max(4, Math.round(breite / 40));
  // The cord is a parabola; the quadratic curve below draws the same one.
  const auf = (t: number) => ({ x: r1(t * breite), y: r1(y + 4 * durchhang * t * (1 - t)) });
  return (
    <g>
      <path d={`M0 ${y} Q${breite / 2} ${y + 2 * durchhang} ${breite} ${y}`} fill="none" stroke={P.holzTief} strokeWidth={2.5} strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => {
        const a = auf((i + 0.12) / n);
        const m = auf((i + 0.5) / n);
        const b = auf((i + 0.88) / n);
        const spitze = `${m.x} ${r1(m.y + tiefe)}`;
        const f = farben[i % farben.length];
        return (
          <g key={i}>
            <path d={`M${a.x} ${a.y} L${b.x} ${b.y} L${spitze} Z`} fill={f.farbe} />
            <path d={`M${m.x} ${m.y} L${b.x} ${b.y} L${spitze} Z`} fill={f.tief} opacity={0.35} />
          </g>
        );
      })}
    </g>
  );
}
