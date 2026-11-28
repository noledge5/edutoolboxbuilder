// The exercises the class finds hard (28.11.2026), for the teacher's evaluation.
import { describe, expect, it } from 'vitest';
import { aufgabeKurz, schwersteAufgaben } from './auswertung';
import type { Uebung } from './types';

const rf = (id: string, aussage: string): Uebung => ({ art: 'richtigfalsch', id, frage: 'Stimmt das?', aussage, richtig: true });
const pakete = [{ stunde: 's1', uebungen: [rf('a', '12 = twelve'), rf('b', '13 = thirteen'), rf('c', '20 = twenty')] }];
const kind = (name: string, boxen: Record<string, number>) => ({ id: name, name, leitner: Object.fromEntries(Object.entries(boxen).map(([k, b]) => [`s1/${k}`, [b, 1] as [number, number]])) });

describe('hard exercises for the class', () => {
  const kinder = [kind('Ali', { a: 1, b: 1, c: 3 }), kind('Bea', { a: 1, b: 2, c: 1 }), kind('Can', { a: 1, b: 1 }), kind('Dana', { a: 2, b: 3 })];

  it('lists exercises most children got wrong last time, the highest share first', () => {
    const s = schwersteAufgaben(pakete, kinder);
    expect(s.map((x) => [x.u.id, x.falsch, x.geuebt])).toEqual([
      ['a', 3, 4],
      ['b', 2, 4],
    ]);
    expect(s[0].namen).toEqual(['Ali', 'Bea', 'Can']);
  });

  it('needs at least three who practised it and two who got it wrong', () => {
    // c: practised by Ali and Bea only
    expect(schwersteAufgaben(pakete, kinder).some((x) => x.u.id === 'c')).toBe(false);
    expect(schwersteAufgaben(pakete, [kind('Ali', { a: 1 }), kind('Bea', { a: 2 }), kind('Can', { a: 3 })])).toEqual([]);
  });

  it('shows the exercise in one line with its answer', () => {
    expect(aufgabeKurz(rf('a', '12 = twelve'))).toBe('12 = twelve → stimmt');
    expect(aufgabeKurz({ art: 'luecke', id: 'l', frage: 'Fill in.', teile: ['There ', 'are', ' two pens.'], kacheln: ['are', 'is'] })).toBe('Fill in. → There are two pens.');
  });
});
