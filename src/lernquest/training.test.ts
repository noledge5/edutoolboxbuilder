// Training without rewards (28.11.2026): the hardest cards, only the learning time counts.
import { describe, expect, it } from 'vitest';
import { trainingAnwenden, trainingKarten, TRAINING_GROESSE, zeitHeute } from './rules';
import { LEERER_STAND } from './types';

describe('training', () => {
  const leitner = { 'a/1': [1, 5], 'a/2': [2, 3], 'a/3': [3, 1], 'a/4': [5, 1], 'b/1': [1, 2], 'b/9': [1, 1] } as Record<string, [number, number]>;
  const gueltig = new Set(['a/1', 'a/2', 'a/3', 'a/4', 'b/1']);

  it('takes only cards in box 1 and 2 of exercises that still exist', () => {
    expect(trainingKarten(leitner, gueltig, 's').sort()).toEqual(['a/1', 'a/2', 'b/1']);
  });

  it('takes at most a round of the hardest, mixed', () => {
    const viele = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`c/${i}`, [i < 20 ? 1 : 2, i] as [number, number]]));
    const alle = new Set(Object.keys(viele));
    const runde = trainingKarten(viele, alle, 'x');
    expect(runde).toHaveLength(TRAINING_GROESSE);
    // only from the 16 hardest (box 1, most overdue first)
    for (const k of runde) expect(Number(k.slice(2))).toBeLessThan(2 * TRAINING_GROESSE);
    expect(trainingKarten(viele, alle, 'y')).not.toEqual(runde);
  });

  it('counts only the learning time, nothing else', () => {
    const s = { ...LEERER_STAND, xp: 50, muenzen: 7, truhen: 1, leitner, tage: ['2026-11-27'] };
    const t = trainingAnwenden(s, 300, '2026-11-28');
    expect(zeitHeute(t, '2026-11-28')).toBe(300);
    expect({ ...t, zeit: undefined }).toEqual({ ...s, zeit: undefined });
    expect(zeitHeute(trainingAnwenden(t, 5000, '2026-11-28'), '2026-11-28')).toBe(300 + 900);
  });
});
