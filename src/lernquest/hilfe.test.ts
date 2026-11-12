// Help for weaker children (Stufe E): help cards from the sheet and from Claude, a tip per exercise, repetition of
// earlier lessons in the KI request, and all of it surviving the package and the stored lesson.
import { describe, expect, it } from 'vitest';
import { createBlock, createPage } from '../model/ops';
import { readLesson } from '../library/read';
import type { Lesson, Module } from '../library/types';
import { frueherVon, poolAusAntwort, poolPrompt, poolSystem, readUebung } from './fragenpool';
import { istRichtig, richtigeAntwort } from './rules';
import { buildPaket, hilfeAusStunde, readLernkarte, readPaket } from './paket';

const modul = { id: 'm1', number: 1, title: 'Hello', icon: 'users', subject: 'Englisch', grade: 5, lang: 'en' } as unknown as Module;
const stunde = (number: number, blocks: ReturnType<typeof createBlock>[], extra: Partial<Lesson> = {}): Lesson =>
  ({ id: `l${number}`, moduleId: 'm1', number, title: `Stunde ${number}`, doc: { pages: [{ ...createPage(), blocks }] }, updatedAt: 1, ...extra }) as unknown as Lesson;

describe('help cards', () => {
  it('come from Grammatik-Box, Merksatz and Hinweis-Box, in order, with the Merksatz solution filled in', () => {
    const l = stunde(1, [
      createBlock('grammar', { title: 'to be', rule: 'I {{am}}, you {{are}}, he {{is}}.', examples: 'I {{am}} Tom.\nShe {{is}} my sister.' }),
      createBlock('merksatz', { text: 'Bei he, she, it nimmst du [[is]].' }),
      createBlock('hint', { title: 'Achtung', text: 'I am wird oft zu I’m.' }),
      createBlock('mc', { prompt: 'Wähle.', options: '* am\nis' }),
    ]);
    const h = hilfeAusStunde(l.doc.pages);
    expect(h.map((k) => k.titel)).toEqual(['to be', 'Merke', 'Achtung']);
    expect(h[0].beispiele).toEqual(['I {{am}} Tom.', 'She {{is}} my sister.']);
    expect(h[1].text).toBe('Bei he, she, it nimmst du is.');
  });

  it('go into the package with the ones Claude wrote, and a broken one is left out when read back', () => {
    const l = stunde(2, [createBlock('merksatz', { text: 'Plural: meist ein -s.' })], { poolHilfe: [{ titel: 'Plural', text: 'Mehr als eins: -s.', beispiele: ['one cat – two cat{{s}}'] }] });
    const p = buildPaket(modul, l);
    expect(p.hilfe?.map((k) => k.titel)).toEqual(['Merke', 'Plural']);
    const back = readPaket(JSON.parse(JSON.stringify({ ...p, hilfe: [...p.hilfe!, { titel: '', text: 'x' }, 'kaputt'] })));
    expect(back?.hilfe).toHaveLength(2);
    expect(readPaket({ ...p, hilfe: undefined })?.hilfe).toEqual([]);
  });

  it('are checked strictly', () => {
    expect(readLernkarte({ titel: 'A', text: 'B', beispiele: ['x', 5, ''] })).toEqual({ titel: 'A', text: 'B', beispiele: ['x'] });
    expect(readLernkarte({ titel: 'A'.repeat(61), text: 'B' })).toBeNull();
    expect(readLernkarte({ titel: 'A', text: 'B'.repeat(401) })).toBeNull();
  });

  it('stay with the stored lesson', () => {
    const l = stunde(2, [], { poolHilfe: [{ titel: 'Plural', text: 'Mehr als eins: -s.' }] });
    expect(readLesson(JSON.parse(JSON.stringify(l)))?.poolHilfe).toEqual([{ titel: 'Plural', text: 'Mehr als eins: -s.' }]);
  });
});

describe('tips and the KI request', () => {
  it('keep a short tip on an exercise and drop a too long one', () => {
    const u = { art: 'richtigfalsch', id: 'a', frage: 'Stimmt das?', aussage: 'I is Tom.', richtig: false };
    expect(readUebung({ ...u, tipp: 'Bei I immer am.' })?.tipp).toBe('Bei I immer am.');
    expect(readUebung({ ...u, tipp: 'x'.repeat(201) })?.tipp).toBeUndefined();
  });

  it('reads help cards and tips from Claude’s answer', () => {
    const raw = {
      hilfe: [{ titel: 'to be', text: 'I am, you are, he is.', beispiele: ['I {{am}} Tom.'] }, { titel: '' }],
      uebungen: [{ art: 'richtigfalsch', frage: 'Stimmt das?', aussage: 'She are nice.', richtig: false, niveau: 1, tipp: 'Bei she nimmst du is.', erklaerung: 'she → is.' }],
    };
    const r = poolAusAntwort(raw, [], true);
    expect(r.hilfe).toEqual([{ titel: 'to be', text: 'I am, you are, he is.', beispiele: ['I {{am}} Tom.'] }]);
    expect(r.neu[0].tipp).toBe('Bei she nimmst du is.');
  });

  it('asks for tips, help cards, a growing order and repetition of the earlier lessons', () => {
    const sys = poolSystem();
    for (const w of ['"tipp"', '"hilfe"', 'aufbauend', 'Wiederholung einstreuen']) expect(sys).toContain(w);
    const l1 = stunde(1, [createBlock('text', { text: 'I am Tom.' })]);
    const l3 = stunde(3, [createBlock('text', { text: 'two cats' })]);
    const andere = { ...stunde(2, []), moduleId: 'm2' } as Lesson;
    const frueher = frueherVon([l3, andere, l1], l3);
    expect(frueher.map((x) => x.id)).toEqual(['l1']);
    const p = poolPrompt({ modul, stunde: l3, klasse: '', vorhanden: [], wuensche: '', frueher });
    expect(p).toContain('## Frühere Stunden');
    expect(p).toContain('I am Tom.');
    expect(poolPrompt({ modul, stunde: l1, klasse: '', vorhanden: [], wuensche: '' })).toContain('keine Wiederholung');
  });
});

describe('test stations', () => {
  it('are whole packages: every exercise plays, has a tip and an explanation, easy to hard, help cards first', async () => {
    const { TESTPAKETE } = await import('./testpakete');
    for (const p of TESTPAKETE) {
      const back = readPaket(JSON.parse(JSON.stringify(p)))!;
      expect(back.uebungen).toHaveLength(p.uebungen.length);
      expect(back.hilfe?.length).toBeGreaterThanOrEqual(2);
      for (const u of back.uebungen) {
        expect(u.tipp, u.id).toBeTruthy();
        expect(u.erklaerung, u.id).toBeTruthy();
        expect(istRichtig(u, richtigeAntwort(u)), u.id).toBe(true);
      }
      const n = back.uebungen.map((u) => u.niveau ?? 2);
      expect(n).toEqual([...n].sort((a, b) => a - b));
      expect(new Set(back.uebungen.map((u) => u.id)).size).toBe(back.uebungen.length);
    }
  });
});
