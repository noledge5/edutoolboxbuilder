// The sounds stay short, soft and in the audible range; a wrong answer is lower and quieter than a right one.
import { describe, expect, it } from 'vitest';
import { noten, type TonArt } from './ton';

const ARTEN: TonArt[] = ['richtig', 'falsch', 'fertig', 'tipp', 'stern', 'truhe'];

describe('sounds', () => {
  it.each(ARTEN)('%s is short and soft', (art) => {
    const n = noten(art);
    expect(n.length).toBeGreaterThan(0);
    for (const [f, start, dur, vol] of n) {
      expect(f).toBeGreaterThan(100);
      expect(f).toBeLessThan(5000);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(start + dur).toBeLessThanOrEqual(1.5);
      expect(vol).toBeLessThanOrEqual(0.15);
    }
  });
  it('wrong is lower and quieter than right', () => {
    const hoch = (a: TonArt) => Math.max(...noten(a).map((x) => x[0]));
    const laut = (a: TonArt) => Math.max(...noten(a).map((x) => x[3]));
    expect(hoch('falsch')).toBeLessThan(hoch('richtig'));
    expect(laut('falsch')).toBeLessThanOrEqual(laut('richtig'));
  });
});
