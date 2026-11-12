// The moves of all figures. A track names a part id (or `ganz`); a figure lists the moves that fit it, and a test
// checks that each listed move only names parts the figure has.
import type { Animation } from './typen';

const A = (a: Animation) => a;

/** Phase-shifted copy of a closed loop of values (first = last), for waves that run along several parts. */
export function versetzt(werte: number[], schritt: number): number[] {
  const ring = werte.slice(0, -1);
  const n = ring.length;
  const r = ring.map((_, i) => ring[(i + schritt) % n]);
  return [...r, r[0]];
}

const welle = [0, 9, 0, -9, 0];

export const ANIMATIONEN: Record<string, Animation> = Object.fromEntries(
  [
    A({ id: 'atmen', name: 'Atmen', dauer: 2.4, wiederholen: 'immer', spuren: { ganz: { schieben: [[0, 0], [0, -2.5], [0, 0]] } } }),
    A({ id: 'huepfen', name: 'Hüpfen', dauer: 0.7, wiederholen: 2, spuren: { ganz: { schieben: [[0, 0], [0, -16], [0, 0], [0, -6], [0, 0]] } } }),
    A({ id: 'winken', name: 'Winken', dauer: 1.2, wiederholen: 2, spuren: { 'unterarm-r': { drehen: [0, -28, 12, -28, 12, 0] } } }),
    A({
      id: 'jubeln',
      name: 'Jubeln',
      dauer: 0.8,
      wiederholen: 2,
      spuren: {
        ganz: { schieben: [[0, 0], [0, -14], [0, 0]] },
        'arm-l': { drehen: [0, 18, 0] },
        'arm-r': { drehen: [0, -18, 0] },
      },
    }),
    A({ id: 'kopfschuetteln', name: 'Kopfschütteln', dauer: 0.9, wiederholen: 1, spuren: { kopf: { drehen: [0, -9, 9, -9, 7, 0] } } }),
    A({ id: 'nicken', name: 'Nicken', dauer: 0.9, wiederholen: 1, spuren: { kopf: { schieben: [[0, 0], [0, 4], [0, 0], [0, 4], [0, 0]] } } }),
    A({ id: 'wedeln', name: 'Schwanz wedeln', dauer: 1.1, wiederholen: 'immer', spuren: { schwanz: { drehen: [0, 10, -5, 10, 0] } } }),
    A({ id: 'schweben', name: 'Schweben', dauer: 2.6, wiederholen: 'immer', spuren: { ganz: { schieben: [[0, 0], [0, -10], [0, 0]] } } }),
    A({
      id: 'tentakel',
      name: 'Tentakel',
      dauer: 2,
      wiederholen: 'immer',
      spuren: Object.fromEntries([1, 2, 3, 4, 5, 6].map((i) => [`tentakel-${i}`, { drehen: versetzt(welle, i % 4) }])),
    }),
    A({
      id: 'treffer',
      name: 'Treffer',
      dauer: 0.5,
      wiederholen: 1,
      spuren: { ganz: { schieben: [[0, 0], [-10, 0], [9, 0], [-6, 0], [3, 0], [0, 0]], drehen: [0, -4, 3, -2, 0, 0] } },
    }),
  ].map((a) => [a.id, a]),
);
