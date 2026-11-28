// Claude names the competence of each pool question (28.11.2026): it is read, matched to the grid, kept when the
// library is read again, and the teacher's evaluation counts the question for that competence only.
import { describe, expect, it } from 'vitest';
import type { Lesson, Module } from '../library/types';
import { kartenJeKompetenz } from './auswertung';
import { kompetenzId, neueEintraege, poolAusAntwort, readPool } from './fragenpool';

const m = {
  competences: [
    { id: 'k1', area: 'Zahlen bis 20 lesen', g: '', m: '', e: '', lessons: '1', domain: '' },
    { id: 'k2', area: 'Zahlen schreiben', g: '', m: '', e: '', lessons: '1', domain: '' },
  ],
} as unknown as Module;
const rf = (aussage: string, kompetenz?: string) => ({ art: 'richtigfalsch', frage: 'Stimmt das?', aussage, richtig: true, ...(kompetenz ? { kompetenz } : {}) });

describe('competence of pool questions', () => {
  it('reads the named competence in the order of the exercises', () => {
    const r = poolAusAntwort({ uebungen: [rf('12 = twelve', 'Zahlen bis 20 lesen'), { art: 'unbekannt' }, rf('13 = thirteen')] }, [], true);
    expect(r.neu).toHaveLength(2);
    expect(r.kompetenzen).toEqual(['Zahlen bis 20 lesen', undefined]);
  });

  it('matches the name of a grid row, forgiving case, spaces and what Claude copies along', () => {
    expect(kompetenzId(m, 'Zahlen bis 20 lesen')).toBe('k1');
    expect(kompetenzId(m, '  zahlen  BIS 20 lesen ')).toBe('k1');
    expect(kompetenzId(m, '(diese Stunde) Zahlen schreiben (G: Ich kann … · M: Ich kann …)')).toBe('k2');
    expect(kompetenzId(m, 'Etwas anderes')).toBeUndefined();
    expect(kompetenzId(m, undefined)).toBeUndefined();
  });

  it('makes unreleased entries with the competence id, and keeps it when read again', () => {
    const r = poolAusAntwort({ uebungen: [rf('12 = twelve', 'Zahlen bis 20 lesen'), rf('13 = thirteen', 'gibt es nicht')] }, [], true);
    const eintraege = neueEintraege(r.neu, r.kompetenzen, m);
    expect(eintraege.map((e) => [e.frei, e.kompetenz])).toEqual([
      [false, 'k1'],
      [false, undefined],
    ]);
    expect(readPool(JSON.parse(JSON.stringify(eintraege))).map((e) => e.kompetenz)).toEqual(['k1', undefined]);
  });

  it('counts a tagged question for its competence only, an untagged one for every competence of its lesson', () => {
    const r = poolAusAntwort({ uebungen: [rf('12 = twelve', 'Zahlen bis 20 lesen'), rf('13 = thirteen')] }, [], true);
    const pool = neueEintraege(r.neu, r.kompetenzen, m).map((e) => ({ ...e, frei: true }));
    const l = { id: 'l1', moduleId: 'm1', number: 1, doc: { pages: [] }, pool } as unknown as Lesson;
    const { je } = kartenJeKompetenz([l], m);
    expect(je.get('k1')).toEqual([`l1/${r.neu[0].id}`, `l1/${r.neu[1].id}`]);
    expect(je.get('k2')).toEqual([`l1/${r.neu[1].id}`]);
  });
});
