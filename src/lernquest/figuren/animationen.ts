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
        kopf: { drehen: [0, 1.5, 0], versatz: 0.08 },
        schwanz: { drehen: [0, 5, 0], versatz: 0.15 },
        ...tentakel((i) => ({ drehen: [0, i % 2 ? 4 : -4, 0] })),
      },
    }),
    A({
      id: 'winken',
      name: 'Winken',
      dauer: 1.1,
      wiederholen: 3,
      spuren: { 'arm-r': { drehen: [0, -8, 0, -8, 0] }, 'unterarm-r': { drehen: [0, -32, 12, -32, 12, 0], versatz: 0.06 }, kopf: { drehen: [0, -3, 0], versatz: 0.05 } },
      gesichter: [[0, 'lachen']],
    }),
    A({
      id: 'huepfen',
      name: 'Hüpfen',
      dauer: 0.9,
      wiederholen: 2,
      // crouch · take-off (stretched, fast) · top (soft) · falling (stretched) · landing (squashed) · rest
      zeiten: [0, 0.16, 0.3, 0.5, 0.68, 0.78, 1],
      // From the top down it falls: faster and faster (rein), then keeps that speed into the ground (linear).
      kurven: [null, null, null, 'rein', 'linear', null],
      spuren: {
        ganz: {
          schieben: [STILL, [0, 4], [0, -14], [0, -28], [0, -17.5], [0, 0], STILL],
          strecken: [[1, 1], [1.12, 0.88], [0.9, 1.12], [0.98, 1.02], [0.93, 1.08], [1.14, 0.86], [1, 1]],
        },
        kopf: { schieben: [STILL, [0, 1], [0, -1], STILL, [0, -1.5], [0, 3], STILL], versatz: 0.03 },
        'arm-l': { drehen: [0, -10, 30, 35, 20, -5, 0], versatz: 0.04 },
        'arm-r': { drehen: [0, 10, -30, -35, -20, 5, 0], versatz: 0.04 },
        schwanz: { drehen: [0, -6, 8, 12, 4, -4, 0], versatz: 0.08 },
        ...tentakel((i) => ({ drehen: i < 4 ? [0, 0, 14, 18, 10, 0, 0] : [0, 0, -14, -18, -10, 0, 0], versatz: 0.05 })),
      },
    }),
    A({
      id: 'jubeln',
      name: 'Jubeln',
      dauer: 0.95,
      wiederholen: 2,
      // dip · up with arms high · back down (gravity) · small squash · rest
      zeiten: [0, 0.15, 0.45, 0.8, 1],
      kurven: [null, null, 'rein', null],
      spuren: {
        ganz: { schieben: [STILL, [0, 3], [0, -22], [0, 0], STILL], strecken: [[1, 1], [1.08, 0.92], [0.94, 1.08], [1.06, 0.95], [1, 1]] },
        'arm-l': { drehen: [0, -6, 28, 10, 0], versatz: 0.05 },
        'arm-r': { drehen: [0, 6, -28, -10, 0], versatz: 0.05 },
        schwanz: { drehen: [0, -4, 14, 4, 0], versatz: 0.1 },
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
        kopf: { schieben: [STILL, [0, 6], [0, 6], STILL], drehen: [0, 5, 5, 0], versatz: 0.05 },
        schwanz: { drehen: [0, -12, -12, 0], versatz: 0.1 },
      },
      gesichter: [[0, 'traurig']],
    }),
    A({
      id: 'hallo',
      name: 'Hallo',
      dauer: 2.4,
      wiederholen: 1,
      // From rest: arm up (in front of the head), three waves from the elbow, arm down again. For a hero standing with
      // arms down; `winken` only wiggles an arm that a pose has already raised (the fox's „winken“).
      zeiten: [0, 0.16, 0.3, 0.42, 0.54, 0.66, 0.82, 1],
      kurven: [null, null, null, null, null, null, 'raus'],
      vorne: ['arm-r'],
      spuren: {
        // The hand waves beside the head, never over the face: the forearm swings outwards only.
        'arm-r': { drehen: [0, -112, -106, -112, -106, -112, -110, 0] },
        'unterarm-r': { drehen: [0, 30, 12, 45, 12, 45, 30, 0], versatz: 0.04 },
        kopf: { drehen: [0, -3, -2, -4, -2, -4, -3, 0], versatz: 0.05 },
        ganz: { strecken: [[1, 1], [0.98, 1.02], [1, 1], [0.99, 1.01], [1, 1], [0.99, 1.01], [1, 1], [1, 1]] },
      },
      gesichter: [[0, 'lachen']],
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
    A({
      id: 'stampfen',
      name: 'Stampfen',
      dauer: 2.4,
      wiederholen: 'immer',
      zeiten: [0, 0.25, 0.5, 0.75, 1],
      spuren: {
        ganz: { drehen: [0, -3, 0, 3, 0], strecken: [[1, 1], [1.03, 0.97], [1, 1], [1.03, 0.97], [1, 1]] },
        'arm-l': { drehen: [0, 8, 0, -4, 0] },
        'arm-r': { drehen: [0, 4, 0, -8, 0] },
        kopf: { drehen: [0, 2, 0, -2, 0], versatz: 0.06 },
      },
    }),
    A({
      id: 'flattern',
      name: 'Flattern',
      dauer: 1.6,
      wiederholen: 'immer',
      spuren: {
        ganz: { schieben: [STILL, [0, -10], STILL] },
        'fluegel-l': { drehen: [0, 22, 0] },
        'fluegel-r': { drehen: [0, -22, 0] },
        schwanz: { drehen: [0, 6, 0], versatz: 0.12 },
      },
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
        'arm-l': { drehen: [0, 40, 150, 0] },
        'arm-r': { drehen: [0, -40, -150, 0] },
        'fluegel-l': { drehen: [0, -10, 30, 0] },
        'fluegel-r': { drehen: [0, 10, -30, 0] },
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
