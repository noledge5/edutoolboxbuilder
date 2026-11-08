import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { angelegt, bonusText, bonusVon, SCHADEN_MAX, CHANCEN, MUENZ_CHANCEN, MUENZ_TRUHE, PREISE, TEILE, type Avatar } from './teile';
import { createBlock } from '../model/ops';
import type { Block, Page } from '../model/types';
import { exercisesOf, readPaket } from './paket';
import { faellig, heldenstufe, istRichtig, karteNach, rundeVon, rundenZahl, satz, sterne, tagNummer, titel, woche, wochenStart, xpFuerRunde, rundeAnwenden, muenzenFuerRunde, XP_TAG, PUNKTE_WOCHENZIEL, gutscheinFrei, punkteHandRest } from './rules';
import { auswerten, kartenJeKompetenz } from './auswertung';
import type { Lesson, Module } from '../library/types';
import { beamerAusHash, beitrittsLink, codeAus, namensFarbe, regionenVon, vorname, wochenTage } from './karte';
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
    const s0 = { ...LEERER_STAND, xp: 40, xpHeute: 290, bestwerte: { s1: [60] }, tage: ['2026-11-06'], leitner: { 'a/1': [1, 5] as [number, number] } };
    const r = rundeAnwenden(s0, { stunde: 's1', runde: 1, richtig: 5, gesamt: 5, leitner: { 'a/2': [2, 9] } }, '2026-11-06');
    expect(r.plus).toBe(10);
    expect(r.stand).toMatchObject({ xp: 50, xpHeute: 300, bestwerte: { s1: [60, 100] }, tage: ['2026-11-06'], leitner: { 'a/1': [1, 5], 'a/2': [2, 9] } });
    const next = rundeAnwenden(r.stand, { stunde: 's1', runde: 0, richtig: 1, gesamt: 5, leitner: {} }, '2026-11-07');
    expect(next).toMatchObject({ plus: 12, stand: { xpHeute: 12, bestwerte: { s1: [60, 100] }, tage: ['2026-11-06', '2026-11-07'] } });
  });

  it('gibt Münzen mit Herzen und Bonus, gedeckelt am Tag', () => {
    expect(muenzenFuerRunde(5, 5, 3, 0)).toBe(16);
    expect(muenzenFuerRunde(3, 5, 3, 0)).toBe(10);
    expect(muenzenFuerRunde(0, 5, 3, 0)).toBe(5);
    expect(muenzenFuerRunde(5, 5, 5, 20)).toBe(24);
    expect(muenzenFuerRunde(5, 5, 3, 0, 195)).toBe(5);
  });

  it('gibt eine Truhe für die erste ganz gespielte Station und fürs Wochenziel', () => {
    const k = { herzen: 3, bonusProzent: 0, runden: 2, stationSchonBelohnt: false };
    const s0 = { ...LEERER_STAND, bestwerte: { s1: [80] }, tage: ['2026-11-02', '2026-11-03'] };
    const r = rundeAnwenden(s0, { stunde: 's1', runde: 1, richtig: 3, gesamt: 5, leitner: {} }, '2026-11-04', k);
    expect(r.truhenPlus).toBe(2);
    expect(r.stand.truhen).toBe(2);
    expect(r.muenzenPlus).toBe(10);
    expect(rundeAnwenden(r.stand, { stunde: 's1', runde: 0, richtig: 5, gesamt: 5, leitner: {} }, '2026-11-04', { ...k, stationSchonBelohnt: true }).truhenPlus).toBe(0);
  });
});

describe('Held und Beute', () => {
  it('hat denselben Katalog wie der Server', () => {
    const sql = ['20261106b_lernquest_held.sql', '20261109_lernquest_beute.sql']
      .map((f) => readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), 'utf8'))
      .join('\n');
    const rows = [...sql.matchAll(/\('([a-z]+)', '([a-z]+)', (\d), (true|false), (\d+), (\d+)\)/g)].map((m) => [m[1], m[2], +m[3], m[4] === 'true', +m[5], +m[6]]);
    expect(rows).toEqual(TEILE.map((t) => [t.id, t.slot, t.seltenheit, !!t.start, t.muenzen ?? 0, t.herz ?? 0]));
    expect(TEILE).toHaveLength(56);
    // Damage bonus in the boss fight (20261111_lernquest_schaden.sql).
    const schaden = readFileSync(new URL('../../supabase/migrations/20261111_lernquest_schaden.sql', import.meta.url), 'utf8');
    const mitSchaden = [...schaden.matchAll(/\('([a-z]+)', (\d+)\)/g)].map((m) => [m[1], +m[2]]);
    expect(mitSchaden).toEqual(TEILE.filter((t) => t.schaden).map((t) => [t.id, t.schaden]));
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
