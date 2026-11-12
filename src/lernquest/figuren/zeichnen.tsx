// Small drawing helpers shared by the items, companions and backgrounds.
import type { ReactNode } from 'react';
import { P } from './stil';

export const stern = (x: number, y: number, r: number, zacken = 5) => {
  const pts = Array.from({ length: zacken * 2 }, (_, i) => {
    const a = (Math.PI / zacken) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};

/** A four-point sparkle that grows and fades in a loop (for rare items). */
export function Funkeln({ x, y, r, zeit, versatz = 0 }: { x: number; y: number; r: number; zeit: number; versatz?: number }): ReactNode {
  const k = (Math.sin(zeit * 3 + versatz) + 1) / 2;
  if (k < 0.15) return null;
  const s = r * k;
  return <path d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`} fill={P.weiss} opacity={0.4 + k * 0.6} />;
}

/** Wood grain: a few soft lines along a length. */
export const maserung = (x: number, y1: number, y2: number) => (
  <path d={`M${x - 2} ${y1} q2 ${(y2 - y1) / 2} 0 ${y2 - y1} M${x + 2} ${y1 + 4} q-2 ${(y2 - y1) / 3} 0 ${y2 - y1 - 8}`} fill="none" stroke={P.holzTief} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
);

