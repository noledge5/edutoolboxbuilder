import { describe, expect, it } from 'vitest';
import { fehlgriffeFrei, istRichtig, nachAntwort, fehlgriffHinweis, serieMeilenstein, wissen, laengsteSerie, merksatz, rundenFazit, WIEDER_MAX } from './rules';
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

describe('streak moments', () => {
  it('come at 3 in a row and then every 5', () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10, 11, 15].filter(serieMeilenstein)).toEqual([3, 5, 10, 15]);
  });
});

describe('slips in pairs and places', () => {
  const paare = { art: 'paare' as const, id: 'p', frage: 'Finde die Paare.', paare: [['N', 'Norden'], ['S', 'Süden'], ['O', 'Osten']] as [string, string][] };
  it('say why the answer is wrong when the board ends all green', () => {
    expect(fehlgriffHinweis(paare, { art: 'paare', fehler: 2 })).toBe('Du hast 2-mal danebengetippt. Einmal ist erlaubt.');
  });
  it('stay quiet when the slips are allowed or for other formats', () => {
    expect(fehlgriffHinweis(paare, { art: 'paare', fehler: 1 })).toBeNull();
    expect(fehlgriffHinweis({ art: 'richtigfalsch', id: 'r', frage: 'Stimmt das?', aussage: 'x', richtig: true } as never, { art: 'richtigfalsch', wert: false })).toBeNull();
  });
});

describe('what sits', () => {
  it('counts box 4–5 as sitting, 2–3 as getting there, 1 as still to practise', () => {
    const leitner = { 'a/1': [5, 0], 'a/2': [4, 0], 'a/3': [3, 0], 'a/4': [2, 0], 'a/5': [1, 0], 'b/1': [5, 0] } as Record<string, [number, number]>;
    expect(wissen(leitner)).toEqual({ sitzt: 3, wird: 2, ueben: 1 });
    expect(wissen(leitner, new Set(['a/1', 'a/5']))).toEqual({ sitzt: 1, wird: 0, ueben: 1 });
  });
});

describe('longest streak', () => {
  it('is the longest run of right first answers', () => {
    expect(laengsteSerie([true, true, false, true, true, true, false])).toBe(3);
    expect(laengsteSerie([])).toBe(0);
    expect(laengsteSerie([false, false])).toBe(0);
  });
});

describe('take-away lines', () => {
  it('give the statement and the verdict for true or false', () => {
    expect(merksatz({ art: 'richtigfalsch', id: 'r', frage: 'Stimmt das?', aussage: '12 = twelve', richtig: true })).toEqual({ frage: '12 = twelve', antwort: 'stimmt' });
  });
  it('give the sentence with the gaps filled', () => {
    expect(merksatz({ art: 'luecke', id: 'l', frage: 'Fill in.', teile: ['There ', 'are', ' two pens.'], kacheln: ['are', 'is'] })).toEqual({ frage: 'Fill in.', antwort: 'There **are** two pens.' });
  });
  it('leave out what a line cannot show', () => {
    expect(merksatz({ art: 'punkt', id: 'p', frage: 'Finde', bild: 'karte:x', punkte: [] })).toBeNull();
    expect(merksatz({ art: 'bild', id: 'b', frage: 'Welches Bild?', wort: 'apple', bilder: ['img:x', '🐕'], richtig: 0 })).toBeNull();
  });
});
