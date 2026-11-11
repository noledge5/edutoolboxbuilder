import { describe, expect, it } from 'vitest';
import { fehlgriffeFrei, istRichtig, nachAntwort, rundenFazit, WIEDER_MAX } from './rules';
import { readUebung } from './fragenpool';
import type { Uebung } from './types';

describe('Runde: Fehler kommen wieder', () => {
  it('hängt eine falsch beantwortete Aufgabe hinten an, eine richtige nicht', () => {
    expect(nachAntwort([0, 1, 2], 1, false)).toEqual([0, 1, 2, 1]);
    expect(nachAntwort([0, 1, 2], 1, true)).toEqual([0, 1, 2]);
  });

  it('fragt dieselbe Aufgabe höchstens WIEDER_MAX-mal, damit eine kaputte Frage niemanden festhält', () => {
    let reihe = [0];
    for (let pos = 0; pos < 10; pos++) reihe = nachAntwort(reihe, Math.min(pos, reihe.length - 1), false);
    expect(reihe).toHaveLength(WIEDER_MAX);
  });
});

describe('Faire Wertung', () => {
  const paare = (n: number): Uebung => ({ art: 'paare', id: 'p', frage: 'f', paare: Array.from({ length: n }, (_, i): [string, string] => [`l${i}`, `r${i}`]) });

  it('lässt bei Paaren ab drei Paaren einen Fehlgriff durchgehen', () => {
    expect(fehlgriffeFrei(2)).toBe(0);
    expect(fehlgriffeFrei(3)).toBe(1);
    expect(istRichtig(paare(5), { art: 'paare', fehler: 1 })).toBe(true);
    expect(istRichtig(paare(5), { art: 'paare', fehler: 2 })).toBe(false);
    expect(istRichtig(paare(2), { art: 'paare', fehler: 1 })).toBe(false);
  });

  it('lässt bei Punkten im Bild ab drei Punkten einen Fehltipp durchgehen', () => {
    const u: Uebung = { art: 'punkt', id: 'k', frage: 'f', bild: 'karte:x', punkte: [[10, 10, 'A'], [50, 50, 'B'], [90, 90, 'C']] };
    const tipp = (ziel: number, daneben = false) => ({ ziel, x: u.punkte[ziel][0] + (daneben ? 30 : 0), y: u.punkte[ziel][1] });
    expect(istRichtig(u, { art: 'punkt', getippt: [tipp(0), tipp(1, true), tipp(2)] })).toBe(true);
    expect(istRichtig(u, { art: 'punkt', getippt: [tipp(0, true), tipp(1, true), tipp(2)] })).toBe(false);
    const zwei: Uebung = { ...u, punkte: u.punkte.slice(0, 2) };
    expect(istRichtig(zwei, { art: 'punkt', getippt: [tipp(0), tipp(1, true)] })).toBe(false);
  });
});

describe('Ehrliches Ergebnis', () => {
  it('nennt eine Runde unter 60 % nicht geschafft', () => {
    expect(rundenFazit(1, 5)).toBe('schwach');
    expect(rundenFazit(3, 5)).toBe('gut');
    expect(rundenFazit(5, 5)).toBe('perfekt');
    expect(rundenFazit(0, 0)).toBe('schwach');
  });
});

describe('Erklärung', () => {
  it('bleibt beim Prüfen einer Pool-Frage erhalten, zu lange oder leere fallen weg', () => {
    const u = { art: 'richtigfalsch', id: 'x', frage: 'Stimmt das?', aussage: 'A', richtig: true };
    expect(readUebung({ ...u, erklaerung: ' Weil B. ' })).toMatchObject({ erklaerung: 'Weil B.' });
    expect(readUebung({ ...u, erklaerung: '' })).not.toHaveProperty('erklaerung');
    expect(readUebung({ ...u, erklaerung: 'x'.repeat(2000) })).not.toHaveProperty('erklaerung');
    expect(readUebung({ ...u, erklaerung: 7 })).not.toHaveProperty('erklaerung');
  });
});
