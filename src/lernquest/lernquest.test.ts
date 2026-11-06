import { describe, expect, it } from 'vitest';
import { createBlock } from '../model/ops';
import type { Block, Page } from '../model/types';
import { exercisesOf, readPaket } from './paket';
import { faellig, heldenstufe, istRichtig, karteNach, rundeVon, rundenZahl, satz, sterne, tagNummer, titel, woche, wochenStart, xpFuerRunde, rundeAnwenden, XP_TAG } from './rules';
import { codeAus, namensFarbe, regionenVon, vorname, wochenTage } from './karte';
import { LEERER_STAND, type Paket, type Uebung } from './types';

const block = (type: Block['type'], props: Block['props']): Block => createBlock(type, props);
const page = (blocks: Block[], type: Page['type'] = 'uebung'): Page => ({
  title: 'S',
  kicker: '',
  type,
  form: 'allein',
  nameField: 'name',
  blocks,
});

describe('Lernpaket aus Bausteinen', () => {
  it('macht aus Ankreuzen eine Antippen-Übung, nur mit Lösung', () => {
    const [u] = exercisesOf([
      page([
        block('mc', {
          prompt: 'Was ist rot?',
          options: 'Gras\n*Tomate\nHimmel',
        }),
        block('mc', { options: 'A\nB' }),
      ]),
    ]);
    expect(u).toMatchObject({
      art: 'waehlen',
      frage: 'Was ist rot?',
      optionen: ['Gras', 'Tomate', 'Himmel'],
      richtig: [1],
    });
    expect(exercisesOf([page([block('mc', { options: 'A\nB' })])])).toEqual([]);
  });

  it('macht aus dem Lückentext je Zeile eine Lücke mit Kacheln und Ablenkern', () => {
    const ex = exercisesOf([
      page([
        block('gap', {
          text: 'Die Sonne ist ein [[Stern]].\nDer Mond kreist um die [[Erde / Welt]].\nOhne ___ Lösung.',
        }),
      ]),
    ]);
    expect(ex).toHaveLength(2);
    const u = ex[0] as Extract<Uebung, { art: 'luecke' }>;
    expect(u.teile).toEqual(['Die Sonne ist ein ', 'Stern', '.']);
    expect(u.kacheln).toContain('Stern');
    expect(u.kacheln).toContain('Erde');
    expect(istRichtig(u, { art: 'luecke', gelegt: ['stern'] })).toBe(true);
    expect(istRichtig(u, { art: 'luecke', gelegt: ['Erde'] })).toBe(false);
  });

  it('macht Paare, richtig/falsch, Satzbau und Vokabeln; Lehrkraft-Seiten bleiben draußen', () => {
    const ex = exercisesOf([
      page([
        block('match', {
          left: 'Hund\nKatze',
          right: 'miaut\nbellt',
          solution: '2, 1',
        }),
        block('truefalse', {
          items: 'Emma is 11. | T\nBen is sad. | F',
          mode: 'tf',
        }),
        block('jumble', {
          items: 'friend / is / my / Tom = Tom is my friend.',
        }),
        block('foldtest', {
          rows: 'Haus | house\nSchule | school\nFreund | friend',
        }),
      ]),
      page([block('mc', { options: '*A\nB' })], 'lehrkraft'),
    ]);
    expect(ex.map((u) => u.art)).toEqual(['paare', 'richtigfalsch', 'richtigfalsch', 'reihenfolge', 'waehlen', 'waehlen', 'waehlen']);
    expect(ex[0]).toMatchObject({
      paare: [
        ['Katze', 'miaut'],
        ['Hund', 'bellt'],
      ],
    });
    const order = ex[3] as Extract<Uebung, { art: 'reihenfolge' }>;
    expect(
      istRichtig(order, {
        art: 'reihenfolge',
        gelegt: ['Tom', 'is', 'my', 'friend'],
      }),
    ).toBe(true);
    const vocab = ex[4] as Extract<Uebung, { art: 'waehlen' }>;
    expect(vocab.optionen[vocab.richtig[0]]).toBe('house');
  });

  it('lässt richtig/falsch zu einem Lesetext weg', () => {
    expect(exercisesOf([page([block('reading', {}), block('truefalse', { items: 'A | T' })])])).toEqual([]);
  });

  it('erkennt nur echte Lernpakete', () => {
    expect(readPaket({ format: 'x' })).toBeNull();
    expect(
      readPaket({
        format: 'lernquest-paket',
        stunde: 's',
        uebungen: [],
        modul: { id: 'm' },
      }),
    ).not.toBeNull();
  });
});

describe('Runden', () => {
  const ex = (n: number) =>
    Array.from(
      { length: n },
      (_, i) =>
        ({
          art: 'richtigfalsch',
          id: `u${i}`,
          frage: '',
          aussage: '',
          richtig: true,
        }) as Uebung,
    );

  it('hat 1 Runde bis 5 Übungen, sonst 3–5', () => {
    expect([0, 3, 5, 6, 15, 16, 40].map(rundenZahl)).toEqual([0, 1, 1, 3, 3, 4, 5]);
  });

  it('bringt jede Übung mindestens einmal', () => {
    for (const n of [3, 6, 11, 23, 40]) {
      const seen = new Set<string>();
      for (let r = 0; r < rundenZahl(n); r++) for (const u of rundeVon(ex(n), r)) seen.add(u.id);
      expect(seen.size).toBe(n);
    }
    expect(rundeVon(ex(6), 0)).toHaveLength(5);
  });
});

describe('Belohnungen', () => {
  it('gibt 10 + 2 je richtige, +5 ohne Fehler, höchstens 300 am Tag', () => {
    expect(xpFuerRunde(3, 5)).toBe(16);
    expect(xpFuerRunde(5, 5)).toBe(25);
    expect(xpFuerRunde(5, 5, XP_TAG - 4)).toBe(4);
    expect(xpFuerRunde(5, 5, XP_TAG)).toBe(0);
  });

  it('rechnet Heldenstufe und Titel', () => {
    expect(heldenstufe(0)).toEqual({ stufe: 1, drin: 0, noetig: 100 });
    expect(heldenstufe(250)).toEqual({ stufe: 3, drin: 0, noetig: 200 });
    expect(titel(1)).toBe('Neuling');
    expect(titel(9)).toBe('Abenteurer');
  });

  it('gibt Sterne erst, wenn alle Runden gespielt sind', () => {
    expect(sterne([100, 100], 3)).toBe(0);
    expect(sterne([60, 70, 80], 3)).toBe(1);
    expect(sterne([80, 100, 80], 3)).toBe(2);
    expect(sterne([100, 100, 100], 3)).toBe(3);
  });

  it('zählt das Wochenziel ohne Serie, die reißen kann', () => {
    expect(wochenStart('2026-11-08')).toBe('2026-11-02');
    expect(wochenStart('2026-11-02')).toBe('2026-11-02');
    const tage = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-11-03', '2026-11-06'];
    expect(woche(tage, '2026-11-07')).toEqual({ diese: 2, geschafft: 1 });
  });
});

describe('Wiederholen', () => {
  const t = tagNummer('2026-11-06');

  it('schiebt richtige Karten weiter, falsche zurück in Kasten 1', () => {
    expect(karteNach(undefined, true, t)).toEqual([2, t + 3]);
    expect(karteNach(undefined, false, t)).toEqual([1, t + 1]);
    expect(karteNach([2, t], true, t)).toEqual([3, t + 7]);
    expect(karteNach([5, t], true, t)).toEqual([5, t + 30]);
    expect(karteNach([4, t], false, t)).toEqual([1, t + 1]);
  });

  it('nimmt fällige Karten, die ältesten zuerst, nur aus freigeschalteten Stunden', () => {
    const l = {
      'a/1': [2, t - 3],
      'a/2': [1, t + 1],
      'b/1': [1, t],
      'c/1': [1, t - 9],
    } as Record<string, [number, number]>;
    expect(faellig(l, t)).toEqual(['c/1', 'a/1', 'b/1']);
    expect(faellig(l, t, new Set(['a/1', 'b/1']))).toEqual(['a/1', 'b/1']);
  });

  it('setzt Sätze aus Kacheln ohne Leerzeichen vor Satzzeichen', () => {
    expect(satz(['Tom', 'is', 'here', '.'])).toBe('Tom is here.');
  });
});

describe('Runde auf dem Gerät', () => {
  it('rechnet wie der Server: Erfahrung, Bestwert, Lerntag, Karten', () => {
    const s0 = {
      xp: 40,
      xpHeute: 290,
      bestwerte: { s1: [60] },
      tage: ['2026-11-06'],
      leitner: { 'a/1': [1, 5] as [number, number] },
    };
    const r = rundeAnwenden(
      s0,
      {
        stunde: 's1',
        runde: 1,
        richtig: 5,
        gesamt: 5,
        leitner: { 'a/2': [2, 9] },
      },
      '2026-11-06',
    );
    expect(r.plus).toBe(10);
    expect(r.stand).toEqual({
      xp: 50,
      xpHeute: 300,
      bestwerte: { s1: [60, 100] },
      tage: ['2026-11-06'],
      leitner: { 'a/1': [1, 5], 'a/2': [2, 9] },
    });
    const next = rundeAnwenden(r.stand, { stunde: 's1', runde: 0, richtig: 1, gesamt: 5, leitner: {} }, '2026-11-07');
    expect(next).toMatchObject({
      plus: 12,
      stand: {
        xpHeute: 12,
        bestwerte: { s1: [60, 100] },
        tage: ['2026-11-06', '2026-11-07'],
      },
    });
  });
});

describe('Weltkarte', () => {
  const pk = (stunde: string, nummer: number, modul: { id: string; nummer: number; stunden?: { nummer: number; titel: string }[] }, n = 3): Paket => ({
    format: 'lernquest-paket',
    v: 1,
    stunde,
    nummer,
    titel: `Stunde ${nummer}`,
    modul: { titel: 'M', icon: 'book-open', ...modul },
    fach: 'Erdkunde',
    lang: 'de',
    uebungen: Array.from({ length: n }, (_, i) => ({ art: 'richtigfalsch', id: `u${i}`, frage: '', aussage: '', richtig: true }) as Uebung),
  });
  const m1 = { id: 'm1', nummer: 1, stunden: [1, 2, 3, 4].map((n) => ({ nummer: n, titel: `Titel ${n}` })) };

  it('zeigt erledigte, aktuelle, offene und gesperrte Stationen', () => {
    const stand = { ...LEERER_STAND, bestwerte: { a: [100] } };
    const [r] = regionenVon([pk('a', 1, m1), pk('b', 2, m1), pk('c', 3, m1)], 'Erdkunde', stand);
    expect(r.stationen.map((s) => [s.nummer, s.zustand, s.sterne])).toEqual([
      [1, 'erledigt', 3],
      [2, 'aktuell', 0],
      [3, 'offen', 0],
      [4, 'gesperrt', 0],
    ]);
    expect(r.stationen[3].titel).toBe('Titel 4');
  });

  it('kommt mit älteren Paketen ohne Stundenliste aus und ordnet Regionen nach Modul', () => {
    const rs = regionenVon([pk('x', 2, { id: 'm2', nummer: 2 }), pk('a', 1, m1)], 'Erdkunde', LEERER_STAND);
    expect(rs.map((r) => r.nummer)).toEqual([1, 2]);
    expect(rs[1].stationen.map((s) => s.zustand)).toEqual(['offen']);
  });

  it('zeigt die Woche von Montag bis Sonntag', () => {
    const w = wochenTage(['2026-11-03', '2026-11-04', '2026-10-30'], '2026-11-06');
    expect(w.map((d) => d.label + (d.gelernt ? '+' : '') + (d.heute ? '!' : ''))).toEqual(['Mo', 'Di+', 'Mi+', 'Do', 'Fr!', 'Sa', 'So']);
  });

  it('liest den Klassencode aus dem QR-Link oder dem getippten Text', () => {
    expect(codeAus('https://noledge5.github.io/edutoolboxbuilder/lernquest/#7A2E2GJ9')).toBe('7A2E2GJ9');
    expect(codeAus(' 7a2e-2gj9 ')).toBe('7A2E2GJ9');
    expect(codeAus('https://example.com')).toBe('');
    expect(vorname('Mia K.')).toBe('Mia');
    expect(namensFarbe('Mia K.')).toBe(namensFarbe('Mia K.'));
  });
});
