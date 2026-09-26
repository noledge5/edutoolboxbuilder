import { describe, expect, it } from 'vitest';
import { typo } from '../sheet/lang';
import { docPoints, docTips, gradeRanges, jumble, seeded, statements, thresholds, vocabCsv, vocabOf, vocabTestRows } from './language';
import { createBlock, createPage } from './ops';
import type { Doc } from './types';

const doc = (...pages: Doc['pages']): Doc => ({ icon: 'school', lang: 'en', help: true, footer: '', code: '', pages });

describe('language helpers', () => {
  it('shuffles the words of a sentence, the same way every time and never into the solution', () => {
    const a = jumble('I go to school by bus.');
    expect(a).toEqual(jumble('I go to school by bus.'));
    expect(a.solution).toBe('I go to school by bus.');
    expect(a.parts.at(-1)).toBe('.');
    expect([...a.parts.slice(0, -1)].sort()).toEqual(['I', 'bus', 'by', 'go', 'school', 'to']);
    expect(a.parts.slice(0, -1).join(' ')).not.toBe('I go to school by bus');
    expect(jumble('school / I / to / go = I go to school.')).toEqual({ parts: ['school', 'I', 'to', 'go'], solution: 'I go to school.' });
  });

  it('adds up points on pages for the class', () => {
    const teacher = { ...createPage(), type: 'lehrkraft' as const, blocks: [createBlock('open', { points: 50 })] };
    const test = { ...createPage(), blocks: [createBlock('open', { points: 4, langPoints: 2 }), createBlock('text'), createBlock('truefalse', { points: 3 })] };
    expect(docPoints(doc(teacher, test))).toEqual({ content: 7, language: 2, total: 9 });
  });

  it('computes the grade scale', () => {
    expect(thresholds('90 | 80 | x')).toEqual([90, 80, 67, 50, 30]);
    expect(gradeRanges(20, [92, 81, 67, 50, 30], false)).toEqual([
      { grade: 1, from: 19, to: 20 },
      { grade: 2, from: 17, to: 18 },
      { grade: 3, from: 14, to: 16 },
      { grade: 4, from: 10, to: 13 },
      { grade: 5, from: 6, to: 9 },
      { grade: 6, from: 0, to: 5 },
    ]);
    expect(gradeRanges(16, [92, 81, 67, 50, 30], true).map((r) => [r.from, r.to])).toEqual([
      [15, 16],
      [13, 14.5],
      [11, 12.5],
      [8, 10.5],
      [5, 7.5],
      [0, 4.5],
    ]);
  });

  it('collects the tips of all tasks with page and number', () => {
    const p1 = { ...createPage(), blocks: [createBlock('open'), createBlock('mc', { tip: 'Look at page 12.', level: '2' })] };
    const p2 = { ...createPage(), blocks: [createBlock('gap', { tip: ' Use the word bank. ' })] };
    expect(docTips(doc(p1, p2))).toEqual([
      { page: 1, num: 2, level: '2', text: 'Look at page 12.' },
      { page: 2, num: 1, level: '', text: 'Use the word bank.' },
    ]);
  });

  it('gathers vocabulary without duplicates and writes it as CSV', () => {
    const v1 = createBlock('vocab', { rows: 'house | haʊs | Haus | My {{house}} is big.\nfriend | frend | Freund, Freundin' });
    const v2 = createBlock('vocab', { rows: 'House | | Haus\nto live | lɪv | wohnen' });
    const words = vocabOf([doc({ ...createPage(), blocks: [v1, v2] })]);
    expect(words.map((w) => w.en)).toEqual(['house', 'friend', 'to live']);
    expect(words[0].example).toBe('My house is big.');
    expect(vocabCsv(words)).toBe('house,Haus\nfriend,"Freund, Freundin"\nto live,wohnen\n');
  });

  it('makes vocabulary test rows in the asked direction', () => {
    const words = [
      { en: 'house', ipa: '', de: 'Haus', example: '' },
      { en: 'school', ipa: '', de: 'Schule', example: '' },
      { en: 'friend', ipa: '', de: 'Freund', example: '' },
    ];
    const toEnglish = vocabTestRows(words, 2, 'de-en', seeded(1)).split('\n');
    expect(toEnglish).toHaveLength(2);
    for (const row of toEnglish) expect(words.some((w) => row === `${w.de} | ${w.en}`)).toBe(true);
    const toGerman = vocabTestRows(words, 5, 'en-de', seeded(2)).split('\n');
    expect(toGerman).toHaveLength(3);
    for (const row of toGerman) expect(words.some((w) => row === `${w.en} | ${w.de}`)).toBe(true);
  });

  it('reads true/false statements', () => {
    expect(statements('Emma is eleven. | T\nShe has a dog. | falsch\nBen is 12. | NG\nNo answer')).toEqual([
      { text: 'Emma is eleven.', answer: 'T' },
      { text: 'She has a dog.', answer: 'F' },
      { text: 'Ben is 12.', answer: 'NG' },
      { text: 'No answer', answer: '' },
    ]);
  });

  it('sets quotation marks and apostrophes by language', () => {
    expect(typo('He said "hello" and it\'s fine.', 'en')).toBe('He said “hello” and it’s fine.');
    expect(typo('Er sagt "Hallo" und geht\'s.', 'de')).toBe('Er sagt „Hallo“ und geht’s.');
    expect(typo("('quoted')", 'en')).toBe('(‘quoted’)');
    expect(typo('ohne', 'de')).toBe('ohne');
  });
});
