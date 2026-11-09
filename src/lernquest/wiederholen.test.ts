// „Wiederholen sofort“ (the teacher's button before a test) and the hint „Morgen sind … dran“ (rules.ts).
import { describe, expect, it } from 'vitest';
import { extraFaellig, heuteDran, karteNach, morgenDran, readExtra, tagNummer, tagPlus } from './rules';

const HEUTE = '2026-11-09';
const n = tagNummer(HEUTE);
const karten = ['s1/a', 's1/b', 's1/c', 's2/a'];

describe('Wiederholen sofort', () => {
  it('takes every card of the chosen lessons not answered since the start, also unplayed ones', () => {
    const leitner = {
      's1/a': karteNach(undefined, true, n - 2), // answered two days ago, due later
      's1/b': karteNach(undefined, true, n), // answered today, after the start
      's2/a': karteNach(undefined, false, n - 5),
    };
    const extra = { ab: HEUTE, bis: '2026-11-10', stunden: ['s1'] };
    expect(extraFaellig(leitner, karten, extra, HEUTE)).toEqual(['s1/a', 's1/c']);
    // Answered in the round: gone, also tomorrow.
    const danach = { ...leitner, 's1/a': karteNach(leitner['s1/a'], true, n), 's1/c': karteNach(undefined, false, n) };
    expect(extraFaellig(danach, karten, extra, HEUTE)).toEqual([]);
    expect(extraFaellig(danach, karten, extra, '2026-11-10')).toEqual([]);
  });

  it('only from ab to bis', () => {
    const extra = { ab: HEUTE, bis: HEUTE, stunden: ['s1'] };
    expect(extraFaellig({}, karten, extra, '2026-11-08')).toEqual([]);
    expect(extraFaellig({}, karten, extra, '2026-11-10')).toEqual([]);
    expect(extraFaellig({}, karten, null, HEUTE)).toEqual([]);
  });

  it('comes after the cards due by their box, without twice the same', () => {
    const leitner = { 's2/a': karteNach(undefined, false, n - 1), 's1/a': karteNach(undefined, false, n - 1) };
    const extra = { ab: HEUTE, bis: HEUTE, stunden: ['s1'] };
    expect(heuteDran(leitner, karten, extra, HEUTE)).toEqual(['s2/a', 's1/a', 's1/b', 's1/c']);
  });

  it('reads only well-formed settings', () => {
    expect(readExtra({ ab: HEUTE, bis: HEUTE, stunden: ['s1'] })).toEqual({ ab: HEUTE, bis: HEUTE, stunden: ['s1'] });
    expect(readExtra(null)).toBeNull();
    expect(readExtra({ ab: '9.11.', bis: HEUTE, stunden: [] })).toBeNull();
    expect(readExtra({ ab: HEUTE, bis: HEUTE, stunden: [1] })).toBeNull();
  });
});

describe('Morgen dran', () => {
  it('counts cards due tomorrow that are not due today', () => {
    const leitner = {
      's1/a': karteNach(undefined, false, n), // due tomorrow
      's1/b': karteNach(undefined, false, n - 1), // due today
      's1/c': karteNach(undefined, true, n), // in 3 days
    };
    expect(morgenDran(leitner, karten, HEUTE)).toBe(1);
  });
});

describe('Tage zählen', () => {
  it('adds days across month and year ends', () => {
    expect(tagPlus('2026-11-09', 1)).toBe('2026-11-10');
    expect(tagPlus('2026-11-30', 1)).toBe('2026-12-01');
    expect(tagPlus('2026-12-31', 7)).toBe('2027-01-07');
    expect(tagPlus('2026-11-09', 0)).toBe('2026-11-09');
  });
});
