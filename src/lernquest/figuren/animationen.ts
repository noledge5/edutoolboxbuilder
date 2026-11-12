// The moves of all figures. A track names a part id (or `ganz` for the whole figure); tracks for parts a figure lacks
// are skipped, so one move can serve several figures. Each figure lists the moves that fit it; a test checks that
// each listed move moves at least one of its parts and that every move starts and ends at rest.
import type { Animation, Spur } from './typen';

const A = (a: Animation) => a;
const STILL = [0, 0] as const;

/** Phase-shifted copy of a closed loop of values (first = last), for waves that run along several parts. */
export function versetzt(werte: number[], schritt: number): number[] {
  const ring = werte.slice(0, -1);
  const n = ring.length;
  const r = ring.map((_, i) => ring[(i + schritt) % n]);
  return [...r, r[0]];
}

const tentakel = (f: (i: number) => Spur) => Object.fromEntries([1, 2, 3, 4, 5, 6].map((i) => [`tentakel-${i}`, f(i)]));
const welle = [0, 9, 0, -9, 0];

export const ANIMATIONEN: Record<string, Animation> = Object.fromEntries(
  [
    A({
      id: 'atmen',
      name: 'Atmen',
      dauer: 2.8,
      wiederholen: 'immer',
      spuren: {
        ganz: { strecken: [[1, 1], [0.985, 1.025], [1, 1]] },
        kopf: { drehen: [0, 1.5, 0] },
        schwanz: { drehen: [0, 5, 0] },
        ...tentakel((i) => ({ drehen: [0, i % 2 ? 4 : -4, 0] })),
      },
    }),
    A({
      id: 'winken',
      name: 'Winken',
      dauer: 1.1,
      wiederholen: 3,
      spuren: { 'arm-r': { drehen: [0, -8, 0, -8, 0] }, 'unterarm-r': { drehen: [0, -32, 12, -32, 12, 0] }, kopf: { drehen: [0, -3, 0] } },
      gesichter: [[0, 'lachen']],
    }),
    A({
      id: 'huepfen',
      name: 'Hüpfen',
      dauer: 0.9,
      wiederholen: 2,
      zeiten: [0, 0.18, 0.5, 0.82, 1],
      spuren: {
        ganz: { schieben: [STILL, [0, 3], [0, -28], [0, 0], STILL], strecken: [[1, 1], [1.12, 0.86], [0.92, 1.1], [1.1, 0.9], [1, 1]] },
        'arm-l': { drehen: [0, -10, 35, 0, 0] },
        'arm-r': { drehen: [0, 10, -35, 0, 0] },
        schwanz: { drehen: [0, -6, 12, -4, 0] },
        ...tentakel((i) => ({ drehen: [0, 0, i < 4 ? 18 : -18, 0, 0] })),
      },
    }),
    A({
      id: 'jubeln',
      name: 'Jubeln',
      dauer: 0.95,
      wiederholen: 2,
      spuren: {
        ganz: { schieben: [STILL, [0, -22], STILL], strecken: [[1, 1], [0.94, 1.08], [1, 1]] },
        'arm-l': { drehen: [0, 28, 0] },
        'arm-r': { drehen: [0, -28, 0] },
        schwanz: { drehen: [0, 14, 0] },
      },
      gesichter: [[0, 'jubel']],
    }),
    A({
      id: 'staunen',
      name: 'Staunen',
      dauer: 0.9,
      wiederholen: 1,
      kurve: 'feder',
      zeiten: [0, 0.3, 1],
      spuren: {
        ganz: { schieben: [STILL, [0, -12], STILL], strecken: [[1, 1], [0.9, 1.12], [1, 1]] },
        'arm-l': { drehen: [0, 45, 0] },
        'arm-r': { drehen: [0, -45, 0] },
        kopf: { schieben: [STILL, [0, -4], STILL] },
      },
      gesichter: [[0, 'staunen']],
    }),
    A({
      id: 'seufzen',
      name: 'Seufzen',
      dauer: 2.2,
      wiederholen: 1,
      zeiten: [0, 0.3, 0.75, 1],
      spuren: {
        ganz: { strecken: [[1, 1], [1.03, 0.95], [1.03, 0.95], [1, 1]] },
        kopf: { schieben: [STILL, [0, 6], [0, 6], STILL], drehen: [0, 5, 5, 0] },
        schwanz: { drehen: [0, -12, -12, 0] },
      },
      gesichter: [[0, 'traurig']],
    }),
    A({ id: 'nicken', name: 'Nicken', dauer: 1, wiederholen: 1, spuren: { kopf: { schieben: [STILL, [0, 5], STILL, [0, 5], STILL], drehen: [0, 3, 0, 3, 0] } }, gesichter: [[0, 'froh']] }),
    A({ id: 'kopfschuetteln', name: 'Kopfschütteln', dauer: 1, wiederholen: 1, spuren: { kopf: { drehen: [0, -10, 10, -10, 8, 0] } } }),
    A({ id: 'wedeln', name: 'Schwanz wedeln', dauer: 1.2, wiederholen: 'immer', spuren: { schwanz: { drehen: [0, 12, -6, 12, -6, 0] } } }),
    A({
      id: 'schweben',
      name: 'Schweben',
      dauer: 2.8,
      wiederholen: 'immer',
      spuren: { ganz: { schieben: [STILL, [0, -12], STILL], strecken: [[1, 1], [0.97, 1.03], [1, 1]] }, ...tentakel((i) => ({ drehen: versetzt([0, 6, 0, -6, 0], i % 4) })) },
    }),
    A({ id: 'tentakel', name: 'Tentakel', dauer: 2, wiederholen: 'immer', spuren: tentakel((i) => ({ drehen: versetzt(welle, i % 4) })) }),
    A({
      id: 'angriff',
      name: 'Angriff',
      dauer: 1.3,
      wiederholen: 1,
      zeiten: [0, 0.35, 0.55, 1],
      spuren: {
        ganz: { schieben: [STILL, [0, 6], [0, -24], STILL], strecken: [[1, 1], [1.1, 0.9], [0.9, 1.14], [1, 1]] },
        'tentakel-1': { drehen: [0, 30, 125, 0] },
        'tentakel-2': { drehen: [0, 15, 60, 0] },
        'tentakel-5': { drehen: [0, -15, -60, 0] },
        'tentakel-6': { drehen: [0, -30, -125, 0] },
      },
      gesichter: [[0, 'wut']],
    }),
    A({
      id: 'treffer',
      name: 'Treffer',
      dauer: 0.6,
      wiederholen: 1,
      kurve: 'linear',
      spuren: {
        ganz: { schieben: [STILL, [-10, 0], [9, 0], [-6, 0], [3, 0], STILL], drehen: [0, -5, 4, -2, 0, 0], strecken: [[1, 1], [1.08, 0.92], [0.96, 1.04], [1, 1], [1, 1], [1, 1]] },
      },
      gesichter: [[0, 'au']],
    }),
  ].map((a) => [a.id, a]),
);
