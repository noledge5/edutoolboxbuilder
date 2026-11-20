// „Wiederholen sofort“ (the teacher's button before a test), the daily limit and the hint „Morgen sind … dran“ (rules.ts).
import { describe, expect, it } from 'vitest';
import { extraFaellig, heuteDran, karteNach, morgenDran, readExtra, tagNummer, tagPlus, WDH_TAG } from './rules';

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

  it('comes before the cards due by their box, without twice the same', () => {
    const leitner = { 's2/a': karteNach(undefined, false, n - 1), 's1/a': karteNach(undefined, false, n - 1) };
    const extra = { ab: HEUTE, bis: HEUTE, stunden: ['s1'] };
    expect(heuteDran(leitner, karten, extra, HEUTE)).toEqual(['s1/a', 's1/b', 's1/c', 's2/a']);
  });

  it('reads only well-formed settings', () => {
    expect(readExtra({ ab: HEUTE, bis: HEUTE, stunden: ['s1'] })).toEqual({ ab: HEUTE, bis: HEUTE, stunden: ['s1'] });
    expect(readExtra(null)).toBeNull();
    expect(readExtra({ ab: '9.11.', bis: HEUTE, stunden: [] })).toBeNull();
    expect(readExtra({ ab: HEUTE, bis: HEUTE, stunden: [1] })).toBeNull();
  });
});

describe('Wiederholung mit Maß (höchstens WDH_TAG am Tag)', () => {
  // Many cards of one lesson, all answered on `tag` (right: box 2, due in 3 days; wrong: box 1, due the next day).
  const viele = (zahl: number, tag: number, richtig = true) =>
    Object.fromEntries(Array.from({ length: zahl }, (_, i) => [`s9/${i}`, karteNach(undefined, richtig, tag)]));
  const alle = (l: Record<string, unknown>) => Object.keys(l);

  it('gives at most WDH_TAG cards, also after three weeks without practice', () => {
    const leitner = viele(200, n - 21);
    expect(WDH_TAG).toBe(16);
    expect(heuteDran(leitner, alle(leitner), null, HEUTE)).toHaveLength(WDH_TAG);
  });

  it('counts down with what was repeated today and then stops for the day, the rest waits', () => {
    const leitner = viele(58, n - 3);
    const k = alle(leitner);
    expect(heuteDran(leitner, k, null, HEUTE, 8)).toHaveLength(8);
    expect(heuteDran(leitner, k, null, HEUTE, WDH_TAG)).toEqual([]);
    expect(heuteDran(leitner, k, null, HEUTE, 30)).toEqual([]);
    // Tomorrow is a new day: again at most WDH_TAG.
    expect(heuteDran(leitner, k, null, tagPlus(HEUTE, 1))).toHaveLength(WDH_TAG);
  });

  it('takes the most important first: what is still hard (low box), then the most overdue', () => {
    const leitner = {
      ...viele(30, n - 20), // box 2, long overdue
      'hart/alt': karteNach(undefined, false, n - 5), // box 1, overdue 4 days
      'hart/neu': karteNach(undefined, false, n - 1), // box 1, due today
      'gut/alt': [5, n - 40] as [number, number], // box 5, very overdue, but well known
    };
    const dran = heuteDran(leitner, alle(leitner), null, HEUTE);
    expect(dran.slice(0, 2)).toEqual(['hart/alt', 'hart/neu']);
    expect(dran).not.toContain('gut/alt');
  });

  it('the teacher’s „Wiederholen sofort“ comes first, within the limit', () => {
    const leitner = viele(40, n - 10, false);
    const k = [...alle(leitner), 's1/a', 's1/b', 's1/c'];
    const extra = { ab: HEUTE, bis: HEUTE, stunden: ['s1'] };
    const dran = heuteDran(leitner, k, extra, HEUTE);
    expect(dran).toHaveLength(WDH_TAG);
    expect(dran.slice(0, 3)).toEqual(['s1/a', 's1/b', 's1/c']);
    expect(heuteDran(leitner, k, extra, HEUTE, WDH_TAG)).toEqual([]);
  });
});

describe('Morgen dran', () => {
  it('counts what tomorrow brings, at most WDH_TAG', () => {
    const leitner = {
      's1/a': karteNach(undefined, false, n), // due tomorrow
      's1/b': karteNach(undefined, false, n - 1), // due today, still there tomorrow
      's1/c': karteNach(undefined, true, n), // in 3 days
    };
    expect(morgenDran(leitner, karten, null, HEUTE)).toBe(2);
    const voll = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`s9/${i}`, karteNach(undefined, false, n)]));
    expect(morgenDran(voll, Object.keys(voll), null, HEUTE)).toBe(WDH_TAG);
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
