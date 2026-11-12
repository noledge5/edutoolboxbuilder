import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { angelegt, bonusText, bonusVon, ladenWare, SCHADEN_MAX, CHANCEN, MUENZ_CHANCEN, MUENZ_TRUHE, PREISE, TEILE, type Avatar } from './teile';
import { createBlock } from '../model/ops';
import type { Block, Page } from '../model/types';
import { exercisesOf, readPaket } from './paket';
import { klassenNach, klassenZiel, KLASSEN_ZIEL_JE_KIND, aufgabenNach, aufgabenVon, AUFGABE_MUENZEN, AUFGABEN_BONUS, ladenAb, TAGESAUFGABEN, tagPlus, niveauVon, rundenStufen, sterneVon, faellig, gleich, heldenstufe, istRichtig, loesungText, naechsteRunde, karteNach, rundeVon, rundenZahl, satz, sterne, tagNummer, titel, woche, wochenStart, xpFuerRunde, rundeAnwenden, neueSterne, muenzenFuerRunde, istWiederholung, WIEDERHOLUNG_TEILER, GESCHAFFT_AB, XP_TAG, PUNKTE_WOCHENZIEL, gutscheinFrei, punkteHandRest } from './rules';
import { auswerten, kartenJeKompetenz } from './auswertung';
import type { Lesson, Module } from '../library/types';
import { beamerAusHash, beitrittsLink, codeAus, fuchsHinweis, MEILENSTEIN_GROESSE, namensFarbe, regionenVon, vorname, wochenTage } from './karte';
import { gemischterTest } from './probe';
import { LEERER_STAND, type Paket, type TagesStand, type Uebung } from './types';

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

  it('gibt Sterne aus drei Stufen; eine Runde zählt ab 60 %', () => {
    // Kennenlernen, Anwenden, Meistern: one round each.
    expect(sterne([60, 59, 100], [1, 2, 3])).toBe(1);
    expect(sterne([60, 60, 0], [1, 2, 3])).toBe(2);
    expect(sterne([60, 60, 60], [1, 2, 3])).toBe(3);
    expect(sterne([0, 100, 100], [1, 2, 3])).toBe(0);
    // Only easy rounds: all done, then 80 % on average, then every round without mistakes.
    expect(sterne([100, 100], [1, 1, 1])).toBe(0);
    expect(sterne([50, 100, 100], [1, 1, 1])).toBe(0);
    expect(sterne([60, 70, 80], [1, 1, 1])).toBe(1);
    expect(sterne([80, 100, 80], [1, 1, 1])).toBe(2);
    expect(sterne([100, 100, 100], [1, 1, 1])).toBe(3);
    // Two levels: the third star is 80 % on average.
    expect(sterne([60, 60], [1, 2])).toBe(2);
    expect(sterne([80, 90], [1, 2])).toBe(3);
    expect(sterne([60, 0], [2, 3])).toBe(1);
    expect(sterne([60, 60], [2, 3])).toBe(2);
    expect(sterne([80, 80], [2, 3])).toBe(3);
    // One level only, but not easy: the same as only easy rounds.
    expect(sterne([60, 60], [2, 2])).toBe(1);
    expect(sterne(undefined, [1])).toBe(0);
    expect(sterne([100], [])).toBe(0);
  });

  it('nimmt die Stufe einer Runde von ihrer schwersten Übung, ohne niveau nach dem Format', () => {
    const w = (id: string, niveau?: 1 | 2 | 3) => ({ art: 'waehlen' as const, id, frage: '', optionen: ['a', 'b'], richtig: [0], niveau });
    const l = { art: 'luecke' as const, id: 'l', satz: '', luecken: [] } as unknown as Parameters<typeof niveauVon>[0];
    const s = { art: 'schreiben' as const, id: 's', frage: '', loesungen: ['x'] };
    expect([niveauVon(w('a')), niveauVon(l), niveauVon(s), niveauVon(w('b', 3)), niveauVon({ ...s, niveau: 1 })]).toEqual([1, 2, 3, 3, 1]);
    // 6 exercises, 3 rounds of 5 walking through the list: [0-4], [2-6], [4-8] (mod 6).
    expect(rundenStufen([w('1'), w('2'), w('3'), w('4'), w('5'), w('6', 3)])).toEqual([1, 3, 3]);
    expect(rundenStufen([w('1', 2)])).toEqual([2]);
    expect(rundenStufen([])).toEqual([]);
  });

  it('nimmt verdiente Sterne nicht weg', () => {
    const p = { stunde: 's1', uebungen: [{ art: 'waehlen' as const, id: 'a', frage: '', optionen: ['a', 'b'], richtig: [0] }] };
    expect(sterneVon({ ...LEERER_STAND, bestwerte: { s1: [40] } }, p)).toBe(0);
    expect(sterneVon({ ...LEERER_STAND, bestwerte: { s1: [40] }, sterneStationen: { s1: 2 } }, p)).toBe(2);
    expect(sterneVon({ ...LEERER_STAND, bestwerte: { s1: [100] }, sterneStationen: { s1: 2 } }, p)).toBe(3);
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
    const s0 = { ...LEERER_STAND, xp: 40, xpHeute: 290, bestwerte: { s1: [60] }, tage: ['2026-11-06'], leitner: { 'a/1': [1, 5] as [number, number] } };
    const r = rundeAnwenden(s0, { stunde: 's1', runde: 1, richtig: 5, gesamt: 5, leitner: { 'a/2': [2, 9] } }, '2026-11-06');
    expect(r.plus).toBe(10);
    expect(r.stand).toMatchObject({ xp: 50, xpHeute: 300, bestwerte: { s1: [60, 100] }, tage: ['2026-11-06'], leitner: { 'a/1': [1, 5], 'a/2': [2, 9] } });
    const next = rundeAnwenden(r.stand, { stunde: 's1', runde: 0, richtig: 1, gesamt: 5, leitner: {} }, '2026-11-07');
    // Round 0 was done before (60 %): a repetition, a third of 12.
    expect(next).toMatchObject({ plus: 4, wiederholung: true, stand: { xpHeute: 4, bestwerte: { s1: [60, 100] }, tage: ['2026-11-06', '2026-11-07'] } });
  });

  it('gibt Münzen mit Herzen und Bonus, gedeckelt am Tag', () => {
    expect(muenzenFuerRunde(5, 5, 3, 0)).toBe(16);
    expect(muenzenFuerRunde(3, 5, 3, 0)).toBe(10);
    expect(muenzenFuerRunde(0, 5, 3, 0)).toBe(5);
    expect(muenzenFuerRunde(5, 5, 5, 20)).toBe(24);
    expect(muenzenFuerRunde(5, 5, 3, 0, 195)).toBe(5);
  });

  it('gibt für Wiederholungen ein Drittel Erfahrung und Münzen (abgerundet), vor der Tagesgrenze', () => {
    expect(WIEDERHOLUNG_TEILER).toBe(3);
    expect(xpFuerRunde(3, 5, 0, true)).toBe(5); // 16 / 3
    expect(xpFuerRunde(5, 5, 0, true)).toBe(8); // 25 / 3
    expect(xpFuerRunde(0, 5, 0, true)).toBe(3); // 10 / 3
    expect(xpFuerRunde(5, 5, XP_TAG - 4, true)).toBe(4);
    expect(muenzenFuerRunde(5, 5, 3, 0, 0, true)).toBe(5); // 16 / 3
    expect(muenzenFuerRunde(5, 5, 5, 20, 0, true)).toBe(8); // 24 / 3, bonus first
    expect(muenzenFuerRunde(5, 5, 3, 0, 198, true)).toBe(2);
    // What counts: „Wiederholen“, or a station round done (from 60 %) before this round.
    expect(istWiederholung({}, '', 0)).toBe(true);
    expect(istWiederholung({ s1: [59] }, 's1', 0)).toBe(false);
    expect(istWiederholung({ s1: [60, 0] }, 's1', 0)).toBe(true);
    expect(istWiederholung({ s1: [60, 0] }, 's1', 1)).toBe(false);
    expect(istWiederholung({ s1: [60] }, 's1', 2)).toBe(false);
    expect(istWiederholung({}, 's1', 0)).toBe(false);
    const k = { herzen: 3, bonusProzent: 0, stufen: [1, 1] };
    const s0 = { ...LEERER_STAND, tage: ['2026-11-09'] };
    const erst = rundeAnwenden(s0, { stunde: 's1', runde: 0, richtig: 4, gesamt: 5, leitner: {} }, '2026-11-09', k);
    expect(erst).toMatchObject({ plus: 18, muenzenPlus: 13, wiederholung: false });
    // Played again: a third, but a better best still counts and brings its star.
    const noch = rundeAnwenden(erst.stand, { stunde: 's1', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-09', k);
    expect(noch).toMatchObject({ plus: 8, muenzenPlus: 5, wiederholung: true, stand: { bestwerte: { s1: [100] } } });
    const wdh = rundeAnwenden(noch.stand, { stunde: '', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-09', k);
    expect(wdh).toMatchObject({ plus: 8, muenzenPlus: 5, wiederholung: true });
  });

  it('rechnet Wiederholungen wie der Server (lq_runde_melden)', () => {
    const sql = readFileSync(new URL('../../supabase/migrations/20261123_lernquest_stufen.sql', import.meta.url), 'utf8');
    expect(sql).toContain(`wdh := p_stunde = '' or coalesce((k.daten -> 'bestwerte' -> p_stunde ->> p_runde)::int, 0) >= ${GESCHAFFT_AB};`);
    expect(sql).toContain(`if wdh then plus := plus / ${WIEDERHOLUNG_TEILER}; end if;`);
    expect(sql).toContain(`if wdh then m_roh := m_roh / ${WIEDERHOLUNG_TEILER}; end if;`);
    // Order as in rules.ts: experience third before the daily cap; coins bonus, then third, then the daily cap.
    expect(sql.indexOf('plus := plus / 3')).toBeLessThan(sql.indexOf('plus := least(plus, greatest(0, 300 - schon))'));
    expect(sql.indexOf('(m_roh * b.muenzen) / 100')).toBeLessThan(sql.indexOf('m_roh := m_roh / 3'));
    expect(sql.indexOf('m_roh := m_roh / 3')).toBeLessThan(sql.indexOf('m_plus := least(m_roh'));
    // Asked before this round changes the best.
    expect(sql.indexOf('wdh :=')).toBeLessThan(sql.indexOf("jsonb_set(d, '{bestwerte}'"));
  });

  it('gibt eine Truhe je 3 neue Sterne und eine fürs Wochenziel', () => {
    const k = { herzen: 3, bonusProzent: 0, stufen: [1, 1] };
    const s0 = { ...LEERER_STAND, bestwerte: { s1: [80] }, tage: ['2026-11-02', '2026-11-03'] };
    // Station done with 2 stars (average 80 %): no chest yet, but the weekly goal brings one.
    const r = rundeAnwenden(s0, { stunde: 's1', runde: 1, richtig: 4, gesamt: 5, leitner: {} }, '2026-11-04', k);
    expect(r).toMatchObject({ sternePlus: 2, truhenPlus: 1, punktePlus: 3, muenzenPlus: 13 });
    expect(r.stand).toMatchObject({ truhen: 1, sterneRest: 2, sterneStationen: { s1: 2 } });
    // Replaying without a better star gives nothing.
    const r2 = rundeAnwenden(r.stand, { stunde: 's1', runde: 1, richtig: 4, gesamt: 5, leitner: {} }, '2026-11-04', k);
    expect(r2).toMatchObject({ sternePlus: 0, truhenPlus: 0 });
    // Both rounds once without mistakes: the third star fills the chest.
    const r3 = rundeAnwenden(r2.stand, { stunde: 's1', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-04', k);
    expect(r3.truhenPlus).toBe(0);
    const r4 = rundeAnwenden(r3.stand, { stunde: 's1', runde: 1, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-04', k);
    expect(r4).toMatchObject({ sternePlus: 1, truhenPlus: 1, stand: { truhen: 2, sterneRest: 0, sterneStationen: { s1: 3 } } });
    expect(rundeAnwenden(r4.stand, { stunde: 's1', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-04', k).truhenPlus).toBe(0);
  });

  it('zählt Sterne über Stationen hinweg: drei Stationen mit einem Stern sind eine Truhe', () => {
    const k = { herzen: 3, bonusProzent: 0, stufen: [1] };
    let s = { ...LEERER_STAND, tage: ['2026-11-04'] };
    const truhen: number[] = [];
    for (const st of ['a', 'b', 'c']) {
      const r = rundeAnwenden(s, { stunde: st, runde: 0, richtig: 3, gesamt: 5, leitner: {} }, '2026-11-04', k);
      truhen.push(r.truhenPlus);
      s = r.stand;
    }
    expect(truhen).toEqual([0, 0, 1]);
    expect(s).toMatchObject({ truhen: 1, sterneRest: 0 });
  });

  it('zählt bei alten Stationen ohne Eintrag nur neue Sterne (ihre Truhe gab es schon)', () => {
    expect(neueSterne(undefined, 1, 3)).toBe(2);
    expect(neueSterne(undefined, 0, 2)).toBe(2);
    expect(neueSterne(3, 1, 2)).toBe(0);
    const s0 = { ...LEERER_STAND, bestwerte: { s1: [60] }, tage: ['2026-11-04'] };
    const r = rundeAnwenden(s0, { stunde: 's1', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-04', { herzen: 3, bonusProzent: 0, stufen: [1] });
    expect(r).toMatchObject({ sternePlus: 2, truhenPlus: 0, stand: { sterneRest: 2, sterneStationen: { s1: 3 } } });
  });
});

describe('Held und Beute', () => {
  it('hat denselben Katalog wie der Server', () => {
    const sql = ['20261106b_lernquest_held.sql', '20261109_lernquest_beute.sql']
      .map((f) => readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), 'utf8'))
      .join('\n');
    const rows = [...sql.matchAll(/\('([a-z]+)', '([a-z]+)', (\d), (true|false), (\d+), (\d+)\)/g)].map((m) => [m[1], m[2], +m[3], m[4] === 'true', +m[5], +m[6]]);
    // Chest treasures (20261116_lernquest_truhenschaetze.sql) carry damage and nur_truhe in the row.
    const schaetze = readFileSync(new URL('../../supabase/migrations/20261116_lernquest_truhenschaetze.sql', import.meta.url), 'utf8');
    const neu = [...schaetze.matchAll(/\('([a-z]+)', '([a-z]+)', (\d), (true|false), (\d+), (\d+), (\d+), (true|false)\)/g)];
    rows.push(...neu.map((m) => [m[1], m[2], +m[3], m[4] === 'true', +m[5], +m[6]]));
    expect(rows).toEqual(TEILE.map((t) => [t.id, t.slot, t.seltenheit, !!t.start, t.muenzen ?? 0, t.herz ?? 0]));
    expect(neu.map((m) => [m[1], +m[7], m[8] === 'true'])).toEqual(TEILE.slice(56).map((t) => [t.id, t.schaden ?? 0, !!t.nurTruhe]));
    expect(TEILE.slice(0, 56).filter((t) => t.nurTruhe)).toEqual([]);
    expect(TEILE).toHaveLength(80);
    expect(schaetze).toContain('and not x.nur_truhe');
    expect(schaetze).toContain(`(array[${PREISE.join(', ')}])`);
    // Damage bonus in the boss fight (20261111_lernquest_schaden.sql).
    const schaden = readFileSync(new URL('../../supabase/migrations/20261111_lernquest_schaden.sql', import.meta.url), 'utf8');
    const mitSchaden = [...schaden.matchAll(/\('([a-z]+)', (\d+)\)/g)].map((m) => [m[1], +m[2]]);
    expect(mitSchaden).toEqual(TEILE.slice(0, 56).filter((t) => t.schaden).map((t) => [t.id, t.schaden]));
    expect(schaden).toContain(`least(${SCHADEN_MAX},`);
    expect([...MUENZ_CHANCEN, ...CHANCEN].reduce((a, b) => a + b, 0)).toBe(100);
    // Chests and shop as in lq_truhe_oeffnen and lq_kaufen (20261109_lernquest_beute.sql).
    const beute = readFileSync(new URL('../../supabase/migrations/20261109_lernquest_beute.sql', import.meta.url), 'utf8');
    expect(beute).toContain(`(array[${MUENZ_TRUHE.join(', ')}])`);
    expect(beute).toContain(`(array[${PREISE.join(', ')}])`);
    expect(beute).toContain(`r < ${MUENZ_CHANCEN[0] + MUENZ_CHANCEN[1]}`);
    expect(beute).toContain(`when r < ${MUENZ_CHANCEN[0]} then 0`);
    const g = MUENZ_CHANCEN[0] + MUENZ_CHANCEN[1];
    expect(beute).toContain(`when r < ${g + CHANCEN[0]} then 0 when r < ${g + CHANCEN[0] + CHANCEN[1]} then 1`);
  });

  it('verkauft im Laden keine Truhen-Schätze und nichts, was das Kind schon hat', () => {
    const kopf = ladenWare(['kappe'], 'kopf').map((t) => t.id);
    expect(kopf).toContain('kochmuetze');
    expect(kopf).not.toContain('kappe');
    expect(kopf).not.toContain('eiskrone');
    expect(kopf).not.toContain('raumhelm');
    expect(ladenWare([], 'kopf').map((t) => t.seltenheit)).toEqual([...ladenWare([], 'kopf').map((t) => t.seltenheit)].sort());
    // Every place keeps something to buy and at least one treasure to find.
    for (const slot of ['kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund'] as const) {
      expect(ladenWare([], slot).length).toBeGreaterThan(0);
      expect(TEILE.some((t) => t.slot === slot && t.nurTruhe)).toBe(true);
    }
  });

  it('deckelt die Boni und kennt Startteile', () => {
    expect(bonusVon({ kopf: 'krone', kleidung: 'goldruestung', werkzeug: 'sternenschwert', begleiter: 'drache' })).toEqual({ muenzen: 20, herz: 2, schaden: 3 });
    expect(bonusVon({})).toEqual({ muenzen: 0, herz: 0, schaden: 0 });
    // Damage: Ritterhelm +1 and Dreizack +2; capped at +3.
    expect(bonusVon({ kopf: 'ritterhelm', werkzeug: 'dreizack' }).schaden).toBe(3);
    expect(bonusVon({ kopf: 'ritterhelm', werkzeug: 'fernrohr' }).schaden).toBe(2);
    expect(bonusVon({ frisur: 'ritterhelm' } satisfies Avatar).schaden).toBe(0);
    expect(angelegt({}, 'kleidung')?.id).toBe('tshirt');
    expect(angelegt({ kleidung: 'pulli' }, 'kleidung')?.id).toBe('pulli');
    expect(angelegt({}, 'kopf')).toBeUndefined();
    expect(bonusText({ muenzen: 5, herz: 1 })).toBe('+5 % Münzen, +1 Herz');
    expect(bonusText({ muenzen: 5, herz: 1, schaden: 3 })).toBe('+5 % Münzen, +1 Herz, +3 Schaden');
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

  it('lässt den Fuchs sagen, was dran ist (Stufe E)', () => {
    const m = { id: 'm1', nummer: 1, stunden: [1, 2].map((n) => ({ nummer: n, titel: `Titel ${n}` })) };
    const halb = regionenVon([pk('a', 1, m), pk('b', 2, m)], 'Erdkunde', { ...LEERER_STAND, bestwerte: { a: [100] } });
    expect(fuchsHinweis(halb, 0)).toEqual({ text: 'Weiter geht’s mit „Stunde 2“!', pose: 'winken' });
    expect(fuchsHinweis(halb, 3).text).toBe('Weiter geht’s mit „Stunde 2“! Vorher warten 3 Aufgaben aufs Wiederholen.');
    const fertig = regionenVon([pk('a', 1, m), pk('b', 2, m)], 'Erdkunde', { ...LEERER_STAND, bestwerte: { a: [100], b: [100] } });
    expect(fuchsHinweis(fertig, 1)).toEqual({ text: '1 Aufgabe wartet aufs Wiederholen. So bleibt es im Kopf!', pose: 'denken' });
    expect(fuchsHinweis(fertig, 0).text).toContain('Meilenstein');
    expect(fuchsHinweis(fertig, 0, new Set(['m1'])).text).toContain('fehlenden Sterne');
    const gesperrt = regionenVon([pk('a', 1, m1)], 'Erdkunde', { ...LEERER_STAND, bestwerte: { a: [100] } });
    expect(fuchsHinweis(gesperrt, 0).text).toContain('Unterricht');
    expect(fuchsHinweis([], 0).pose).toBe('winken');
  });

  it('kommt mit älteren Paketen ohne Stundenliste aus und ordnet Regionen nach Modul', () => {
    const rs = regionenVon([pk('x', 2, { id: 'm2', nummer: 2 }), pk('a', 1, m1)], 'Erdkunde', LEERER_STAND);
    expect(rs.map((r) => r.nummer)).toEqual([1, 2]);
    expect(rs[1].stationen.map((s) => s.zustand)).toEqual(['offen']);
  });

  it('lässt fertige Stationen mit Fälligem verblassen und öffnet den Meilenstein erst, wenn die Region fertig ist (Stufe C)', () => {
    const stand = { ...LEERER_STAND, bestwerte: { a: [100], b: [60] } };
    const m = { id: 'm1', nummer: 1, stunden: [1, 2].map((n) => ({ nummer: n, titel: `Titel ${n}` })) };
    const [r] = regionenVon([pk('a', 1, m), pk('b', 2, m)], 'Erdkunde', stand, new Set(['a/u0', 'a/u2', 'x/u0']));
    expect(r.stationen.map((s) => s.faellig)).toEqual([['a/u0', 'a/u2'], []]);
    expect(r.meilenstein).toBe(true);
    // A locked station, an unfinished one or a region of one station: no Meilenstein yet.
    expect(regionenVon([pk('a', 1, m1), pk('b', 2, m1)], 'Erdkunde', stand)[0].meilenstein).toBe(false);
    expect(regionenVon([pk('a', 1, m), pk('b', 2, m)], 'Erdkunde', { ...stand, bestwerte: { a: [100] } })[0].meilenstein).toBe(false);
    expect(regionenVon([pk('a', 1, { id: 'm3', nummer: 3 })], 'Erdkunde', stand)[0].meilenstein).toBe(false);
  });

  it('mischt den Meilenstein aus allen Stationen der Region, jede Übung behält ihre Station', () => {
    const a = pk('a', 1, m1);
    const b = pk('b', 2, m1, 9);
    // 3 + 9 exercises, 10 taken: all 3 of the small station, 7 of the large one.
    const t = gemischterTest([a, b], 'seed', MEILENSTEIN_GROESSE);
    expect(t).toHaveLength(10);
    expect(t.filter((x) => x.stunde === 'a')).toHaveLength(3);
    expect(gemischterTest([a, b], 'seed', 4).map((x) => x.stunde).sort()).toEqual(['a', 'a', 'b', 'b']);
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

  it('liest den Beamer-Link, mit und ohne Klassencode', () => {
    const id = '3f2a9c1e-7b4d-4e0a-9c55-0d1e2f3a4b5c';
    expect(beamerAusHash(`#beamer=${id}`)).toEqual({ id, klasse: '' });
    expect(beamerAusHash(`#beamer=${id}&klasse=7a2e2gj9`)).toEqual({ id, klasse: '7A2E2GJ9' });
    expect(beamerAusHash(`#beamer=${id}&klasse=zu-kurz`)).toBeNull();
    expect(beamerAusHash('#7A2E2GJ9')).toBeNull();
  });

  it('macht aus der Beamer-Seite den Beitrittslink, den der Scanner wieder liest', () => {
    const link = beitrittsLink('https://noledge5.github.io/edutoolboxbuilder/lernquest/index.html?x=1#beamer=abc', '7A2E2GJ9');
    expect(link).toBe('https://noledge5.github.io/edutoolboxbuilder/lernquest/#7A2E2GJ9');
    expect(codeAus(link)).toBe('7A2E2GJ9');
    expect(beitrittsLink('http://localhost:5173/lernquest/', 'ABCD2345')).toBe('http://localhost:5173/lernquest/#ABCD2345');
  });
});

describe('Echte Belohnungen (Stufe 4)', () => {
  it('gibt fürs Wochenziel 3 Klassenpunkte, einmal je Woche', () => {
    const s0 = { ...LEERER_STAND, tage: ['2026-11-02', '2026-11-03'] };
    const r = rundeAnwenden(s0, { stunde: '', runde: 0, richtig: 3, gesamt: 5, leitner: {} }, '2026-11-04');
    expect(r.punktePlus).toBe(PUNKTE_WOCHENZIEL);
    expect(r.stand.klassenpunkte).toBe(3);
    expect(rundeAnwenden(r.stand, { stunde: '', runde: 0, richtig: 3, gesamt: 5, leitner: {} }, '2026-11-05').punktePlus).toBe(0);
    expect(rundeAnwenden(r.stand, { stunde: '', runde: 0, richtig: 3, gesamt: 5, leitner: {} }, '2026-11-04').punktePlus).toBe(0);
    // An older Stand without class points counts from 0.
    const alt = { ...s0 } as Partial<typeof s0>;
    delete alt.klassenpunkte;
    expect(rundeAnwenden(alt as typeof s0, { stunde: '', runde: 0, richtig: 3, gesamt: 5, leitner: {} }, '2026-11-04').stand.klassenpunkte).toBe(3);
  });

  it('prüft Gutscheine wie der Server: Punkte, Grenze je Kind, Grenze der Klasse, offene Anfragen', () => {
    const g = { preis: 5, jeKind: 1, jeKlasse: 3, ich: 0, klasse: 0 };
    expect(gutscheinFrei(g, 4, 0)).toBe('punkte');
    expect(gutscheinFrei(g, 5, 0)).toBe('ok');
    expect(gutscheinFrei({ ...g, ich: 1 }, 5, 0)).toBe('grenze');
    expect(gutscheinFrei({ ...g, klasse: 3 }, 5, 0)).toBe('grenze');
    expect(gutscheinFrei({ ...g, jeKind: null, jeKlasse: null, ich: 9, klasse: 99 }, 5, 0)).toBe('ok');
    expect(gutscheinFrei(g, 5, 10)).toBe('voll');
    expect(punkteHandRest(3)).toBe(2);
    expect(punkteHandRest(7)).toBe(0);
  });
});

describe('Auswertung je Kind und Kompetenz', () => {
  const m = {
    id: 'm1',
    competences: [
      { id: 'k1', area: 'Karten lesen', g: '', m: '', e: '', lessons: '', domain: '' },
      { id: 'k2', area: 'Klima erklären', g: '', m: '', e: '', lessons: '', domain: '' },
      { id: 'k3', area: 'Ohne Aufgaben', g: '', m: '', e: '', lessons: '', domain: '' },
    ],
  } as unknown as Module;
  const a = block('mc', { options: 'A\n*B', competence: 'k1' });
  const b = block('truefalse', { items: 'Erde ist rund | R\nMond ist Käse | F', competence: 'k1' });
  const c = block('mc', { options: '*A\nB', competence: 'k2' });
  const d = block('mc', { options: '*A\nB' });
  const l = { id: 'l1', moduleId: 'm1', doc: { pages: [page([a, b, c, d])] } } as unknown as Lesson;
  const keys = (blockId: string) => exercisesOf(l.doc.pages).filter((u) => u.id === blockId || u.id.startsWith(`${blockId}:`)).map((u) => `l1/${u.id}`);

  it('ordnet Übungen über die Aufgabe einer Kompetenz zu', () => {
    const { je, ohne } = kartenJeKompetenz([l]);
    expect(je.get('k1')).toEqual([...keys(a.id), ...keys(b.id)]);
    expect(je.get('k2')).toEqual(keys(c.id));
    expect(ohne).toBe(keys(d.id).length);
  });

  it('zeigt je Kind, was sitzt, was wackelt und wer Hilfe braucht', () => {
    const k1 = [...keys(a.id), ...keys(b.id)];
    const leitner = Object.fromEntries(k1.map((k, i) => [k, [i === 0 ? 1 : 3, 0] as [number, number]]));
    const r = auswerten(m, [l], [
      { id: 'anna', leitner },
      { id: 'ben', leitner: { [k1[0]]: [1, 0] } },
      { id: 'cem', leitner: {} },
    ]);
    expect(r.zeilen.map((z) => z.id)).toEqual(['k1', 'k2']);
    const z = r.zeilen[0];
    expect(z.kinder.anna).toMatchObject({ aufgaben: k1.length, geuebt: k1.length, sitzt: k1.length - 1, wackelt: 1, hilfe: false });
    expect(z.kinder.ben).toMatchObject({ geuebt: 1, sitzt: 0, anteil: 0, hilfe: true });
    expect(z.kinder.cem).toMatchObject({ geuebt: 0, anteil: null, hilfe: false });
    expect(z.anteil).toBeCloseTo((k1.length - 1) / k1.length / 2);
    expect(r.zeilen[1].anteil).toBeNull();
    expect(r.ohneKompetenz).toBe(keys(d.id).length);
  });

  it('zählt Links auf gelöschte Kompetenzen und andere Module nicht mit', () => {
    const fremd = { ...m, competences: m.competences.filter((x) => x.id !== 'k2') } as Module;
    expect(auswerten(fremd, [l], []).ohneKompetenz).toBe(keys(d.id).length + keys(c.id).length);
    expect(auswerten(m, [{ ...l, moduleId: 'm2' } as Lesson], []).zeilen).toEqual([]);
  });
});

describe('Station: nächste Runde und Lösungstext', () => {
  it('nimmt die erste ungespielte Runde, sonst die schwächste', () => {
    expect(naechsteRunde([], 3)).toBe(0);
    expect(naechsteRunde([100, 0], 3)).toBe(1);
    expect(naechsteRunde([100, 80, 60], 3)).toBe(2);
    expect(naechsteRunde([100, 80, 100], 3)).toBe(1);
    expect(naechsteRunde([100, 100, 100], 3)).toBe(0);
    // More values than rounds (the lesson got shorter): only the rounds that exist count.
    expect(naechsteRunde([100, 100, 40], 2)).toBe(0);
  });
  it('zeigt Lücken fett statt in Klammern und vergleicht wie die Prüfung', () => {
    const u: Uebung = { art: 'luecke', id: 'l', frage: 'Ergänze.', teile: ['The sky is ', 'blue', '.'], kacheln: ['blue', 'red'] };
    expect(loesungText(u)).toBe('The sky is **blue**.');
    expect(gleich(' Blue', 'blue')).toBe(true);
    expect(gleich('red', 'blue')).toBe(false);
  });
});

describe('Tagesaufgaben und Laden nach Heldenstufe (Stufe D)', () => {
  const tag = '2026-11-12';
  const ids = aufgabenVon(tag).map((t) => t.id);

  it('gibt jeden Tag drei verschiedene Aufgaben, über acht Tage jede einmal an jeder Stelle', () => {
    const erste = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const a = aufgabenVon(tagPlus(tag, i)).map((t) => t.id);
      expect(new Set(a).size).toBe(3);
      erste.add(a[0]);
    }
    expect(erste.size).toBe(TAGESAUFGABEN.length);
  });

  it('zählt eine Aufgabe einmal, die dritte bringt den Bonus, ein neuer Tag beginnt leer', () => {
    let a: TagesStand | undefined;
    let muenzen = 0;
    const erledigt: string[] = [];
    // Viele perfekte neue und wiederholte Runden mit Stern erfüllen jede Aufgabe der Liste.
    for (let i = 0; i < 6; i++) {
      const r = aufgabenNach(a, tag, { richtig: 5, gesamt: 5, wiederholung: i % 2 === 1, sterne: 1 });
      a = r.aufgaben;
      muenzen += r.muenzen;
      erledigt.push(...r.neu);
    }
    expect(erledigt.sort()).toEqual([...ids].sort());
    expect(muenzen).toBe(3 * AUFGABE_MUENZEN + AUFGABEN_BONUS);
    expect(aufgabenNach(a, tagPlus(tag, 1), { richtig: 0, gesamt: 5, wiederholung: true, sterne: 0 }).aufgaben.zaehler).toEqual({ runden: 1, geschafft: 0, fehlerfrei: 0, wdh: 1, richtig: 0, sterne: 0 });
  });

  it('eine schwache Runde schafft nichts außer Zählern', () => {
    const r = aufgabenNach(undefined, tag, { richtig: 2, gesamt: 5, wiederholung: false, sterne: 0 });
    expect(r.aufgaben.zaehler).toMatchObject({ runden: 1, geschafft: 0, fehlerfrei: 0, neu: 1, richtig: 2 });
  });

  it('rundeAnwenden zahlt die Aufgaben zusätzlich zur Tagesgrenze', () => {
    const s = { ...LEERER_STAND, muenzenHeute: 200, tage: [tag] };
    let st = s;
    let plus = 0;
    for (let i = 0; i < 4; i++) {
      const r = rundeAnwenden(st, { stunde: '', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, tag);
      expect(r.muenzenPlus).toBe(0);
      plus += r.aufgabenPlus;
      st = r.stand;
    }
    expect(st.muenzen).toBe(plus);
  });

  it('Laden öffnet Seltenheiten mit den Titeln', () => {
    expect([0, 1, 2, 3, 4].map(ladenAb)).toEqual([1, 3, 5, 12, 16]);
    expect([3, 5, 12, 16].map(titel)).toEqual(['Lehrling', 'Entdecker', 'Held', 'Meister']);
  });
});

describe('Klassen-Aufgabe der Woche (Stufe D, Teil 2)', () => {
  const tag = '2026-11-12';
  const woche = wochenStart(tag);
  const mit = (sterne: number, ziel: number, extra: Partial<typeof LEERER_STAND> = {}) => ({ ...LEERER_STAND, klassenAufgabe: { woche, sterne, ziel, geschafft: false }, ...extra });

  it('Ziel: 3 Sterne je Kind, von der Lehrkraft änderbar, mindestens 1', () => {
    expect(KLASSEN_ZIEL_JE_KIND).toBe(3);
    expect(klassenZiel(24)).toBe(72);
    expect(klassenZiel(24, 2)).toBe(48);
    expect(klassenZiel(0)).toBe(1);
  });

  it('neue Sterne zählen für die Klasse, die Truhe kommt beim Erreichen einmal', () => {
    const r = klassenNach(mit(4, 6, { sterneWoche: 1 }), tag, 2);
    expect(r).toEqual({ sterneWoche: 3, aufgabe: { woche, sterne: 6, ziel: 6, geschafft: true }, truhe: true });
    expect(klassenNach(mit(6, 6, { sterneWoche: 3, klassenTruhe: true }), tag, 1).truhe).toBe(false);
    expect(klassenNach(mit(2, 6), tag, 1).truhe).toBe(false);
  });

  it('wer erst nach dem Erreichen einen Stern holt, bekommt die Truhe auch; ohne Stern nicht', () => {
    const geschafft = { ...mit(9, 6), klassenAufgabe: { woche, sterne: 9, ziel: 6, geschafft: true } };
    expect(klassenNach(geschafft, tag, 1).truhe).toBe(true);
    expect(klassenNach(geschafft, tag, 0).truhe).toBe(false);
  });

  it('eine neue Woche fängt bei null an; ohne Angabe vom Server gibt es nichts', () => {
    const alt = { ...LEERER_STAND, sterneWoche: 5, klassenTruhe: true, klassenAufgabe: { woche: '2026-11-02', sterne: 50, ziel: 6, geschafft: true } };
    expect(klassenNach(alt, tag, 2)).toEqual({ sterneWoche: 2, truhe: false });
    expect(klassenNach(LEERER_STAND, tag, 2)).toEqual({ sterneWoche: 2, truhe: false });
  });

  it('rundeAnwenden zählt die Klassen-Truhe mit', () => {
    const u = Array.from({ length: 6 }, (_, i) => ({ id: `u${i}` }) as Uebung);
    const stufen = rundenStufen(u);
    let st: typeof LEERER_STAND = mit(5, 6);
    let truhen = 0;
    let geschafft = false;
    for (let r = 0; r < stufen.length; r++) {
      const x = rundeAnwenden(st, { stunde: 's1', runde: r, richtig: 5, gesamt: 5, leitner: {} }, tag, { herzen: 3, bonusProzent: 0, stufen });
      truhen += x.truhenPlus;
      geschafft ||= x.klassenGeschafft;
      st = x.stand;
    }
    expect(geschafft).toBe(true);
    expect(st.klassenTruhe).toBe(true);
    expect(st.klassenAufgabe?.geschafft).toBe(true);
    expect(st.truhen).toBe(truhen);
  });
});
