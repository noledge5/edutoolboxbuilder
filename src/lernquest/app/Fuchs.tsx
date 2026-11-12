// The fox who guides the children through Lernquest (Stufe E). Drawn by the figure system (src/lernquest/figuren/);
// this file only keeps the app's short names for it.
import type { ReactNode } from 'react';
import { FigurBild, FUCHS } from '../figuren';

export type FuchsPose = 'stehen' | 'winken' | 'jubeln' | 'denken' | 'troesten';

/** What the fox does first in each pose, and then for ever (moves: src/lernquest/figuren/animationen.ts). */
const BEWEGUNG: Record<FuchsPose, { zuerst?: string; danach: string }> = {
  stehen: { danach: 'atmen' },
  winken: { zuerst: 'winken', danach: 'wedeln' },
  jubeln: { zuerst: 'jubeln', danach: 'wedeln' },
  denken: { danach: 'atmen' },
  troesten: { zuerst: 'seufzen', danach: 'atmen' },
};

/** The fox in a pose, moving by itself; a new pose starts its move again. */
export function Fuchs({
  pose = 'stehen',
  groesse = 160,
  animation,
  className,
  titel,
}: {
  pose?: FuchsPose;
  groesse?: number;
  animation?: string;
  className?: string;
  titel?: string;
}) {
  return (
    <FigurBild
      figur={FUCHS}
      pose={pose}
      key={pose}
      animation={animation ?? BEWEGUNG[pose].zuerst ?? BEWEGUNG[pose].danach}
      danach={BEWEGUNG[pose].danach}
      breite={groesse}
      className={`lq-fuchs${className ? ` ${className}` : ''}`}
      titel={titel}
    />
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
