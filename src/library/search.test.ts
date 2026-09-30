import { describe, expect, it } from 'vitest';
import { createBlock } from '../model/ops';
import { createSlide } from '../model/slides';
import { newLesson, newModule, seedLibrary } from './model';
import { blockText, findWords, fold, foldWithMap, hitPlace, plainText, searchIndex, searchLibrary, snippet } from './search';
import type { Library } from './types';

/** The sample library with an English module whose lesson has a gap text and a slide. */
function library(): Library {
  const lib = seedLibrary();
  const en = { ...newModule(lib, 'Englisch', 6), title: 'My family', lang: 'en' as const };
  const withEn = { ...lib, modules: [...lib.modules, en] };
  const l = newLesson(withEn, en);
  const gap = createBlock('gap', { prompt: 'Fill in the gaps.', text: 'My [[mother]] is a teacher. Die Straße ist lang.' });
  const slide = { ...createSlide('statement'), title: 'Who is in your family?', notes: 'Klimazonen nicht vergessen' };
  const lesson = { ...l, title: 'Family words', doc: { ...l.doc, pages: [{ ...l.doc.pages[0], blocks: [gap] }] }, slides: [slide] };
  return { ...withEn, lessons: [...withEn.lessons, lesson] };
}

describe('search', () => {
  it('folds case, accents, umlauts and ß', () => {
    expect(fold('Überschwemmung Straße Café')).toBe('uberschwemmung strasse cafe');
    const { text, map } = foldWithMap('Maß über');
    expect(text).toBe('mass uber');
    // "ss" comes from the one "ß" at position 2.
    expect(map.slice(0, 5)).toEqual([0, 1, 2, 2, 3]);
    expect(map[map.length - 1]).toBe('Maß über'.length);
  });

  it('finds words in the original text, also through ß and umlauts', () => {
    const t = 'Die Straße über den Fluss';
    expect(findWords(t, ['strasse'])).toEqual([[4, 10]]);
    expect(findWords(t, ['uber', 'fluss'])).toEqual([
      [11, 15],
      [20, 25],
    ]);
    // Overlapping hits become one.
    expect(findWords('Klimazonen', ['klima', 'mazo'])).toEqual([[0, 7]]);
  });

  it('reads the texts of a block without the markup of the Baukasten', () => {
    expect(plainText('Die [[Sonne]] ha{{s}} ___ Licht.\n*richtig\nA | B')).toBe('Die Sonne has … Licht.\nrichtig\nA · B');
    const b = createBlock('mc', { prompt: 'Was stimmt?', options: '*Die Erde\nDer Mond' });
    expect(blockText(b)).toEqual(['Was stimmt?', 'Die Erde\nDer Mond']);
  });

  it('finds modules, lessons, blocks and slides, those in view first', () => {
    const lib = library();
    const index = searchIndex(lib);
    const all = searchLibrary(index, 'family', { subject: 'Englisch', grade: 6 });
    expect(all.hits.map((h) => h.entry.kind)).toEqual(['module', 'lesson', 'slide']);
    expect(all.hits.every((h) => h.here)).toBe(true);

    // A gap answer and a word with ß are found; the snippet marks them.
    const gap = searchLibrary(index, 'strasse mother').hits;
    expect(gap).toHaveLength(1);
    expect(gap[0].entry).toMatchObject({ kind: 'block', what: 'Lückentext', title: 'Fill in the gaps.' });
    const { text, marks } = gap[0].snippet;
    expect(marks.map(([a, b]) => text.slice(a, b))).toEqual(['mother', 'Straße']);

    // Speaker notes count; hits elsewhere come after those in view.
    const klima = searchLibrary(index, 'klima', { subject: 'Englisch', grade: 6 }).hits;
    expect(klima[0].entry.kind).toBe('slide');
    expect(klima[0].here).toBe(true);
    expect(klima.slice(1).every((h) => !h.here && h.entry.module.subject === 'Geographie')).toBe(true);
    expect(searchLibrary(index, 'klima', { subject: 'Geographie' }).hits[0].entry.kind).toBe('module');
  });

  it('finds a block also by its kind', () => {
    const index = searchIndex(library());
    const hits = searchLibrary(index, 'lückentext mother').hits;
    expect(hits.map((h) => h.entry.what)).toEqual(['Lückentext']);
    expect(searchLibrary(index, 'merksatz treibhaus').hits.every((h) => h.entry.what === 'Merksatz')).toBe(true);
  });

  it('needs every word, and cuts long lists', () => {
    const index = searchIndex(library());
    expect(searchLibrary(index, 'family klimazonen').hits).toHaveLength(1);
    expect(searchLibrary(index, 'family xyz').hits).toHaveLength(0);
    expect(searchLibrary(index, '   ').hits).toHaveLength(0);
    const many = searchLibrary(index, 'e', {}, 3);
    expect(many.hits).toHaveLength(3);
    expect(many.more).toBeGreaterThan(0);
  });

  it('shows a piece of a long text around the hit', () => {
    const long = 'Anfang ' + 'viel Text dazwischen '.repeat(20) + 'Treibhauseffekt am Ende ' + 'und noch mehr '.repeat(10);
    const s = snippet([long], ['treibhauseffekt'], 80);
    expect(s.text.startsWith('…')).toBe(true);
    expect(s.text.endsWith('…')).toBe(true);
    expect(s.marks).toHaveLength(1);
    expect(s.text.slice(...s.marks[0])).toBe('Treibhauseffekt');
  });

  it('names the place of a hit', () => {
    const lib = library();
    const index = searchIndex(lib);
    const slide = index.find((e) => e.kind === 'slide' && e.module.subject === 'Englisch')!;
    expect(hitPlace(slide)).toBe('Englisch · Kl. 6 · M1 My family · S1 Family words');
    expect(hitPlace(index.find((e) => e.kind === 'module')!)).toBe('Geographie · Kl. 9 · M1');
  });
});
