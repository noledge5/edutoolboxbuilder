// Badges (27.11.2026): counted from the Spielstand, three tiers each, a new tier noticed after a round.
import { describe, expect, it } from 'vitest';
import { ABZEICHEN, abzeichenStufe, abzeichenWerte, neueAbzeichen } from './rules';
import { LEERER_STAND, type Stand, type Uebung } from './types';

const u = (id: string): Uebung => ({ art: 'richtigfalsch', id, frage: 'Stimmt das?', aussage: 'x', richtig: true });
const station = (stunde: string) => ({ stunde, uebungen: [u('a'), u('b'), u('c'), u('d'), u('e')] });

describe('badges', () => {
  it('count days, cards that sit, perfect rounds, parts and level from the Spielstand', () => {
    const s: Stand = {
      ...LEERER_STAND,
      tage: ['2026-11-24', '2026-11-25', '2026-11-25', '2026-11-27'],
      leitner: { 'x/a': [5, 0], 'x/b': [4, 0], 'x/c': [2, 0] },
      bestwerte: { x: [100, 80], y: [100] },
      inventar: ['kappe', 'katze'],
      xp: 260,
    };
    const w = abzeichenWerte(s, [station('x'), station('y')]);
    expect(w.fleiss).toBe(3);
    expect(w.gedaechtnis).toBe(2);
    expect(w.perfekt).toBe(2);
    expect(w.sammler).toBe(2);
    expect(w.aufsteiger).toBe(3);
  });

  it('count a region only when every lesson of its module has a star', () => {
    const p = (stunde: string, modul: string, lessons: number) => ({ ...station(stunde), modul: { id: modul, stunden: Array.from({ length: lessons }, (_, i) => i) } });
    const s: Stand = { ...LEERER_STAND, sterneStationen: { a1: 1, a2: 2, b1: 1, b2: 1 } };
    // region A: both lessons starred; region B: 2 of 3 lessons (the third not even open yet)
    expect(abzeichenWerte(s, [p('a1', 'A', 2), p('a2', 'A', 2), p('b1', 'B', 3), p('b2', 'B', 3)]).regionen).toBe(1);
  });

  it('have three growing tiers each', () => {
    for (const a of ABZEICHEN) expect(a.stufen[0] < a.stufen[1] && a.stufen[1] < a.stufen[2]).toBe(true);
    const fleiss = ABZEICHEN.find((a) => a.id === 'fleiss')!;
    expect([0, 3, 9, 10, 30, 70].map((n) => abzeichenStufe(fleiss, n))).toEqual([0, 1, 1, 2, 3, 3]);
  });

  it('notice a badge that reached a higher tier', () => {
    const vorher = abzeichenWerte(LEERER_STAND, []);
    const nachher = { ...vorher, fleiss: 3, perfekt: 1, sammler: 4 };
    expect(neueAbzeichen(vorher, nachher)).toEqual([
      { id: 'fleiss', stufe: 1 },
      { id: 'perfekt', stufe: 1 },
    ]);
    expect(neueAbzeichen(nachher, nachher)).toEqual([]);
  });
});
