import { describe, expect, it } from 'vitest';
import { createBlock, createPage } from '../model/ops';
import { readLesson } from '../library/read';
import type { Lesson, Module } from '../library/types';
import { fragenAus } from './boss';
import { ablenkerVon, bilderDerStunde, freigegeben, punktAufgabe, lueckeAus, lueckeText, neueId, poolAusAntwort, poolPrompt, readPool, readUebung, reihenfolgeAus, stundenText } from './fragenpool';
import { buildPaket, exercisesOf, KARTE_SEITE, KARTEN_MAX, mitBildern, readPaket } from './paket';
import { istRichtig, loesungText, punktTrifft, richtigeAntwort } from './rules';
import type { PoolEintrag, Uebung } from './types';

const modul = { id: 'm1', number: 2, title: 'Family', icon: 'users', subject: 'Englisch', grade: 5, lang: 'en' } as unknown as Module;
const stunde = (pool?: PoolEintrag[]): Lesson => {
  const pg = { ...createPage(), title: 'My family', blocks: [createBlock('mc', { prompt: 'Wähle.', options: '* mother\nfather' }), createBlock('text', { text: 'Tom has got a sister.' })] };
  const lehrer = { ...createPage(), type: 'lehrkraft' as const, title: 'Geheim', blocks: [createBlock('text', { text: 'Nur für die Lehrkraft' })] };
  return { id: 'l1', moduleId: 'm1', number: 3, title: 'My family', doc: { pages: [pg, lehrer] }, ...(pool ? { pool } : {}), updatedAt: 1 } as unknown as Lesson;
};

const antwort = {
  format: 'lernquest-fragenpool',
  uebungen: [
    { art: 'waehlen', frage: 'Was passt?', optionen: ['sister', 'brother', 'mother'], richtig: [0] },
    { art: 'hoeren', text: 'Tom has got a sister.', optionen: ['Tom hat eine Schwester.', 'Tom hat einen Bruder.'], richtig: 0 },
    { art: 'richtigfalsch', aussage: 'Tom has got a sister.', richtig: true },
    { art: 'paare', paare: [['mother', 'Mutter'], ['father', 'Vater'], ['sister', 'Schwester']] },
    { art: 'luecke', satz: 'Tom has got a [sister].', ablenker: ['brother', 'sister', 'aunt'] },
    { art: 'reihenfolge', loesung: 'I have got a brother.' },
    { art: 'gruppen', frage: 'Sortiere.', gruppen: ['male', 'female'], karten: [['father', 0], ['mother', 1], ['brother', 0], ['aunt', 1]] },
    // Broken ones are left out:
    { art: 'waehlen', optionen: ['nur eine'], richtig: [0] },
    { art: 'gruppen', gruppen: ['a', 'b'], karten: [['x', 0], ['y', 0], ['z', 0]] },
    { art: 'luecke', satz: 'Keine Lücke.' },
    { art: 'unbekannt' },
    'Quatsch',
  ],
};

describe('KI-Fragenpool (Stufe 5)', () => {
  it('liest Claudes Antwort, gibt neue Ids und lässt Unbrauchbares weg', () => {
    const { neu, verworfen } = poolAusAntwort(antwort, ['pool-000000'], true);
    expect(neu.map((u) => u.art)).toEqual(['waehlen', 'waehlen', 'richtigfalsch', 'paare', 'luecke', 'reihenfolge', 'gruppen']);
    expect(verworfen).toBe(5);
    expect(new Set(neu.map((u) => u.id)).size).toBe(neu.length);
    expect(neu.every((u) => u.id.startsWith('pool-') && u.id !== 'pool-000000')).toBe(true);
    // Every exercise is solvable and reads back the same.
    for (const u of neu) {
      expect(istRichtig(u, richtigeAntwort(u)), u.art).toBe(true);
      expect(readUebung(u)).toEqual(u);
      expect(loesungText(u)).not.toBe('');
    }
    const hoeren = neu[1];
    expect(hoeren.art === 'waehlen' && hoeren.hoeren).toBe('Tom has got a sister.');
    const luecke = neu[4];
    if (luecke.art !== 'luecke') throw new Error();
    // The answer is no distractor twice.
    expect(ablenkerVon(luecke).sort()).toEqual(['aunt', 'brother']);
    expect(lueckeText(luecke)).toBe('Tom has got a [sister].');
  });

  it('lässt „hoeren“ in deutschen Stunden weg und meldet eine Antwort ohne Übungen', () => {
    expect(poolAusAntwort(antwort, [], false).neu.some((u) => u.art === 'waehlen' && u.hoeren)).toBe(false);
    expect(() => poolAusAntwort({ x: 1 }, [], true)).toThrow(/uebungen/);
    expect(() => poolAusAntwort({ uebungen: [{ art: 'x' }] }, [], true)).toThrow(/keine brauchbare/);
  });

  it('prüft streng: falsche Stellen, fehlende Lösung in den Kacheln, zu lange Texte', () => {
    const ok: Uebung = { art: 'waehlen', id: 'a', frage: 'F', optionen: ['x', 'y'], richtig: [1] };
    expect(readUebung(ok)).toEqual(ok);
    expect(readUebung({ ...ok, richtig: [2] })).toBeNull();
    expect(readUebung({ ...ok, richtig: [1, 1] })).toBeNull();
    expect(readUebung({ ...ok, frage: 'x'.repeat(300) })).toBeNull();
    expect(readUebung({ art: 'luecke', id: 'b', frage: 'F', teile: ['A ', 'b', '.'], kacheln: ['c', 'd'] })).toBeNull();
    expect(readUebung({ art: 'bild', id: 'c', frage: 'F', wort: 'dog', bilder: ['🐶', '🐱'], richtig: 0 })).not.toBeNull();
    expect(readUebung({ art: 'bild', id: 'c', frage: 'F', wort: 'dog', bilder: ['🐶'], richtig: 0 })).toBeNull();
  });

  it('baut Lücke und Reihenfolge aus dem, was die Lehrkraft tippt', () => {
    const l = lueckeAus('x', 'F', 'Paris is the [capital] of [France].', ['city', 'capital']);
    expect(l?.teile).toEqual(['Paris is the ', 'capital', ' of ', 'France', '.']);
    expect(l && ablenkerVon(l)).toEqual(['city']);
    expect(lueckeAus('x', 'F', 'Ohne Lücke', [])).toBeNull();
    const r = reihenfolgeAus('y', 'F', 'Where do you live?');
    expect(r?.kacheln.slice().sort()).toEqual(['?', 'Where', 'do', 'live', 'you'].sort());
    expect(r && istRichtig(r, richtigeAntwort(r))).toBe(true);
    expect(reihenfolgeAus('y', 'F', 'Eins')).toBeNull();
  });

  it('gibt nur freigegebene Übungen ins Lernpaket, nach denen der Stunde', () => {
    const [a, b] = poolAusAntwort(antwort, [], true).neu;
    const l = stunde([
      { u: a, frei: true },
      { u: b, frei: false },
    ]);
    const p = buildPaket(modul, l);
    expect(p.uebungen.map((u) => u.id)).toEqual([...exercisesOf(l.doc.pages).map((u) => u.id), a.id]);
    expect(freigegeben(l.pool)).toEqual([a]);
    expect(buildPaket(modul, stunde()).uebungen).toHaveLength(1);
  });

  it('hält den Pool beim Laden einer Stunde, ältere Stunden bleiben ohne', () => {
    const u: Uebung = { art: 'richtigfalsch', id: 'pool-1', frage: 'F', aussage: 'A', richtig: false };
    const raw = { ...stunde(), pool: [{ u, frei: true }, { u, frei: false }, { u: { art: 'x' } }, null] };
    expect(readLesson(raw)?.pool).toEqual([{ u, frei: true }]);
    expect(readLesson(stunde())).not.toHaveProperty('pool');
    expect(readPool('kaputt')).toEqual([]);
  });

  it('schickt Claude nur die Seiten der Kinder, keine Lehrkraft-Seite', () => {
    const t = stundenText(stunde());
    expect(t).toContain('Tom has got a sister.');
    expect(t).not.toContain('Nur für die Lehrkraft');
    const prompt = poolPrompt({ modul, stunde: stunde(), klasse: 'lebhaft, zwei Kinder mit LRS', vorhanden: exercisesOf(stunde().doc.pages), wuensche: '' });
    expect(prompt).toContain('Englisch-Stunde');
    expect(prompt).toContain('lebhaft');
    expect(prompt).toContain('mother');
    expect(prompt).not.toContain('Wünsche');
  });

  it('gibt neue Ids, die noch frei sind', () => {
    let n = 0;
    const rnd = () => [0, 0, 0.5][n++];
    expect(neueId(['pool-000000'], rnd)).not.toBe('pool-000000');
  });
});

describe('Neue Formate (Stufe 5)', () => {
  const gruppen: Uebung = { art: 'gruppen', id: 'g', frage: 'Sortiere.', gruppen: ['Laubbaum', 'Nadelbaum'], karten: [['Eiche', 0], ['Tanne', 1], ['Buche', 0]] };

  it('prüft das Sortieren in Gruppen und nennt die Lösung', () => {
    expect(istRichtig(gruppen, { art: 'gruppen', zuordnung: [0, 1, 0] })).toBe(true);
    expect(istRichtig(gruppen, { art: 'gruppen', zuordnung: [0, 1, 1] })).toBe(false);
    expect(istRichtig(gruppen, { art: 'gruppen', zuordnung: [0, 1] })).toBe(false);
    expect(loesungText(gruppen)).toBe('Laubbaum: Eiche, Buche; Nadelbaum: Tanne');
  });

  it('macht aus jeder Karte eine Bossfrage, aus Bildern keine', () => {
    expect(fragenAus(gruppen).map((f) => [f.aussage, f.richtig])).toEqual([
      ['Eiche', 0],
      ['Tanne', 1],
      ['Buche', 0],
    ]);
    expect(fragenAus({ art: 'bild', id: 'b', frage: 'F', wort: 'dog', bilder: ['🐶', '🐱'], richtig: 0 })).toEqual([]);
    const hoeren: Uebung = { art: 'waehlen', id: 'h', frage: 'Hör zu.', hoeren: 'a dog', optionen: ['Hund', 'Katze'], richtig: [0] };
    expect(fragenAus(hoeren)[0].aussage).toBe('a dog');
  });

  it('macht aus Bild-Vokabeln „Bild wählen“ mit Emojis und eigenen Bildern', async () => {
    const b = createBlock('picvocab', { items: '🐶 | dog\n🐱 | cat\n | bird\n🐟 | fish / fishes', pics: '\n\nimg123\n' });
    const us = exercisesOf([{ ...createPage(), blocks: [b] }]);
    expect(us.map((u) => u.art === 'bild' && u.wort)).toEqual(['dog', 'cat', 'bird', 'fish']);
    for (const u of us) {
      if (u.art !== 'bild') throw new Error();
      expect(u.bilder.length).toBe(4);
      expect(new Set(u.bilder).size).toBe(4);
      expect(istRichtig(u, { art: 'bild', gewaehlt: u.richtig })).toBe(true);
    }
    const bird = us[2];
    expect(bird.art === 'bild' && bird.bilder[bird.richtig]).toBe('img:img123');

    // In the package the own picture travels as a small JPEG; without it the exercises that need it are left out.
    const l = { ...stunde(), doc: { pages: [{ ...createPage(), blocks: [b] }] } } as Lesson;
    const mit = await mitBildern(buildPaket(modul, l), async (id) => (id === 'img123' ? 'data:image/jpeg;base64,AAA' : null));
    expect(mit.bilder).toEqual({ 'img:img123': 'data:image/jpeg;base64,AAA' });
    expect(mit.uebungen).toHaveLength(4);
    const ohne = await mitBildern(buildPaket(modul, l), async () => null);
    expect(ohne.uebungen.every((u) => u.art === 'bild' && !u.bilder.includes('img:img123'))).toBe(true);
    expect(ohne).not.toHaveProperty('bilder');
    // Reading it back keeps what can be shown.
    expect(readPaket(mit)?.uebungen).toHaveLength(4);
    expect(readPaket({ ...mit, bilder: { 'img:img123': 'javascript:alert(1)' } })?.uebungen).toHaveLength(ohne.uebungen.length);
  });

  it('lässt Übungsarten einer neueren Version im Paket weg', () => {
    const p = buildPaket(modul, stunde());
    const neu = readPaket({ ...p, uebungen: [...p.uebungen, { art: 'punkt', id: 'z' }, { art: 'bild', id: 'kaputt' }, null] });
    expect(neu?.uebungen.map((u) => u.art)).toEqual(['waehlen']);
  });
});

describe('Punkt auf Karte/Bild (Stufe 5)', () => {
  const punkte: [number, number, string][] = [
    [20, 30, 'Rhein'],
    [70, 40, 'Donau'],
    [50, 80, 'Bodensee'],
  ];
  const u = punktAufgabe('pool-k', 'abc', punkte);

  it('trifft, wenn der nächste Punkt der gesuchte ist und nicht zu weit weg', () => {
    expect(punktTrifft(punkte, 0, 22, 33)).toBe(true);
    expect(punktTrifft(punkte, 0, 31, 30)).toBe(true);
    expect(punktTrifft(punkte, 0, 40, 30)).toBe(false); // too far
    expect(punktTrifft(punkte, 1, 22, 33)).toBe(false); // nearer to Rhein
    expect(punktTrifft([[10, 10, 'a'], [14, 10, 'b']], 0, 12.5, 10)).toBe(false); // nearer to b
    expect(istRichtig(u, richtigeAntwort(u))).toBe(true);
    expect(istRichtig(u, { art: 'punkt', getippt: [{ ziel: 0, x: 20, y: 30 }, { ziel: 0, x: 20, y: 30 }, { ziel: 2, x: 50, y: 80 }] })).toBe(false);
    expect(istRichtig(u, { art: 'punkt', getippt: [{ ziel: 0, x: 20, y: 30 }, { ziel: 1, x: 90, y: 90 }, { ziel: 2, x: 50, y: 80 }] })).toBe(true); // one slip of three is allowed
    expect(istRichtig(u, { art: 'punkt', getippt: [{ ziel: 0, x: 20, y: 30 }, { ziel: 1, x: 90, y: 90 }, { ziel: 2, x: 5, y: 5 }] })).toBe(false);
    expect(loesungText(u)).toContain('grünen Punkte');
    expect(fragenAus(u)).toEqual([]);
  });

  it('prüft streng: Bild, Prozent, Namen', () => {
    expect(readUebung(u)).toEqual(u);
    expect(readUebung({ ...u, bild: 'img:abc' })).toBeNull();
    expect(readUebung({ ...u, bild: 'karte:../x' })).toBeNull();
    expect(readUebung({ ...u, punkte: [] })).toBeNull();
    expect(readUebung({ ...u, punkte: [[120, 3, 'x']] })).toBeNull();
    expect(readUebung({ ...u, punkte: [[1, 2, 'x'], [3, 4, 'X']] })).toBeNull();
    expect(readUebung({ ...u, punkte: [[1, 2, '']] })).toBeNull();
    expect(readUebung({ ...u, punkte: Array.from({ length: 7 }, (_, i) => [i, i, `p${i}`]) })).toBeNull();
  });

  it('findet die Bilder der Kinderseiten, nicht die der Lehrkraft', () => {
    const bild = createBlock('image', { image: 'abc', caption: 'Abb. 1: Flüsse' });
    const leer = createBlock('image', { image: '' });
    const geheim = createBlock('image', { image: 'zzz' });
    const fremd = createBlock('image', { image: 'pdf:3/seite 1' });
    const l = { ...stunde(), doc: { pages: [{ ...createPage(), blocks: [bild, leer, fremd] }, { ...createPage(), type: 'lehrkraft', blocks: [geheim] }] } } as Lesson;
    expect(bilderDerStunde(l)).toEqual([{ id: 'abc', titel: 'Abb. 1: Flüsse' }]);
  });

  it('schickt das Bild groß mit, höchstens drei; ohne Bild fällt die Aufgabe weg', async () => {
    const pool = ['a', 'b', 'c', 'd'].map((id, i) => ({ u: punktAufgabe(`pool-${i}`, id, punkte), frei: true }));
    const l = stunde(pool);
    const seiten: number[] = [];
    const p = await mitBildern(buildPaket(modul, l), async (id, seite) => {
      seiten.push(seite);
      return `data:image/jpeg;base64,${id}`;
    });
    expect(seiten).toEqual(Array(KARTEN_MAX).fill(KARTE_SEITE));
    expect(p.uebungen.filter((x) => x.art === 'punkt')).toHaveLength(KARTEN_MAX);
    expect(readPaket(p)?.uebungen.filter((x) => x.art === 'punkt')).toHaveLength(KARTEN_MAX);
    expect(readPaket({ ...p, bilder: {} })?.uebungen.filter((x) => x.art === 'punkt')).toHaveLength(0);
    const ohne = await mitBildern(buildPaket(modul, l), async () => null);
    expect(ohne.uebungen.some((x) => x.art === 'punkt')).toBe(false);
  });
});
