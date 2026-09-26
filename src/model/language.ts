// Pure helpers for the language blocks and for whole-sheet features: jumbled sentences, points and grade
// scale, tip cards, and the vocabulary of a unit (CSV export, vocabulary test).
import { BLOCK_TYPES } from './blockTypes';
import { sheetNumbers } from './ops';
import { num, rows, str } from './text';
import type { Block, Doc } from './types';

/** A number from a string, the same on every render and device: shuffled words stay put. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small seeded random generator (mulberry32). */
export function seeded(seed: string | number): () => number {
  let a = typeof seed === 'number' ? seed >>> 0 : hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface Jumble {
  /** The parts in the order printed. */
  parts: string[];
  /** The sentence to write, shown on the solution sheet. */
  solution: string;
}

/**
 * One line of a "Wörter ordnen" task. Either the correct sentence (its words are shuffled the same way every time,
 * the final full stop or question mark stays at the end), or ready-made parts: "school / I / to / go = I go to school."
 */
export function jumble(line: string): Jumble {
  const [given, answer] = line.split(/\s=\s/).map((s) => s.trim());
  if (answer !== undefined || given.includes(' / ')) {
    return {
      parts: given
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean),
      solution: answer ?? '',
    };
  }
  const end = /[.?!]$/.exec(given)?.[0] ?? '';
  const words = (end ? given.slice(0, -1) : given).split(/\s+/).filter(Boolean);
  let parts = words;
  // A few tries, so the printed order is never the solution itself.
  for (let t = 0; t < 8 && words.length > 1; t++) {
    parts = shuffle(words, seeded(given + t));
    if (parts.join(' ') !== words.join(' ')) break;
  }
  return { parts: end ? [...parts, end] : parts, solution: given };
}

export interface TaskRef {
  block: Block;
  /** Printed page number (null on a teacher page) and task number on the page. */
  page: number | null;
  num: number;
}

/** All tasks of the document with their page and number, in order. */
export function docTasks(doc: Doc): TaskRef[] {
  const pages = sheetNumbers(doc);
  const out: TaskRef[] = [];
  doc.pages.forEach((pg, p) => {
    let n = 0;
    for (const b of pg.blocks) if (BLOCK_TYPES[b.type]?.task) out.push({ block: b, page: pages[p], num: ++n });
  });
  return out;
}

/** Points of all tasks (on pages for the class): content ("points") and language ("langPoints"). */
export function docPoints(doc: Doc): { content: number; language: number; total: number } {
  let content = 0;
  let language = 0;
  for (const t of docTasks(doc)) {
    if (t.page === null) continue;
    content += Math.max(0, num(t.block.props.points, 0));
    language += Math.max(0, num(t.block.props.langPoints, 0));
  }
  return { content, language, total: content + language };
}

export interface GradeRange {
  grade: number;
  /** Lowest and highest points for the grade (from ≤ to), in steps of 1 or 0.5. */
  from: number;
  to: number;
}

/** Minimum percentages for the grades 1 to 5 from "92 | 81 | 67 | 50 | 30"; missing or broken values use these defaults. */
export function thresholds(x: string): number[] {
  const fallback = [92, 81, 67, 50, 30];
  const given = x.split(/[|;,\s]+/).map((s) => parseFloat(s.replace(',', '.')));
  return fallback.map((d, i) => (Number.isFinite(given[i]) && given[i] > 0 && given[i] <= 100 ? given[i] : d));
}

/** Point ranges for the grades 1 to 6. A grade needs at least its percentage of the total, rounded up to the step. */
export function gradeRanges(total: number, percents: number[], half: boolean): GradeRange[] {
  const step = half ? 0.5 : 1;
  const up = (x: number) => Math.ceil(x / step - 1e-9) * step;
  const mins = percents.map((p) => Math.min(total, up((total * p) / 100)));
  const out: GradeRange[] = [];
  let top = total;
  mins.forEach((min, i) => {
    out.push({ grade: i + 1, from: Math.min(min, top), to: top });
    top = Math.max(0, Math.min(min, top) - step);
  });
  out.push({ grade: 6, from: 0, to: top });
  return out;
}

/** "32,5" – German decimal comma, no trailing ",0". */
export const pointText = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace('.', ','));

export interface TipCard {
  page: number | null;
  num: number;
  level: string;
  text: string;
}

/** The tips of all tasks, for the tip cards. */
export const docTips = (doc: Doc): TipCard[] =>
  docTasks(doc)
    .filter((t) => str(t.block.props.tip).trim())
    .map((t) => ({ page: t.page, num: t.num, level: str(t.block.props.level), text: str(t.block.props.tip).trim() }));

export interface VocabEntry {
  en: string;
  ipa: string;
  de: string;
  example: string;
}

/** Vocabulary of "Vokabelliste" blocks, in order and without duplicates (by the English word). */
export function vocabOf(docs: Doc[]): VocabEntry[] {
  const seen = new Set<string>();
  const out: VocabEntry[] = [];
  for (const d of docs)
    for (const pg of d.pages)
      for (const b of pg.blocks) {
        if (b.type !== 'vocab') continue;
        for (const [en = '', ipa = '', de = '', example = ''] of rows(b.props.rows)) {
          const key = en.toLowerCase();
          if (!en || !de || seen.has(key)) continue;
          seen.add(key);
          out.push({ en, ipa, de, example: example.replace(/\{\{|\}\}/g, '') });
        }
      }
  return out;
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** Two columns, English and German, no header row: Anki, Quizlet and LearningApps read this directly. */
export const vocabCsv = (entries: VocabEntry[]) => entries.map((e) => [e.en, e.de].map(csvCell).join(',')).join('\n') + '\n';

export type TestDirection = 'de-en' | 'en-de' | 'mixed';

/** Rows "given | answer" for a vocabulary test: a random choice of `count` words. */
export function vocabTestRows(entries: VocabEntry[], count: number, direction: TestDirection, rand: () => number): string {
  return shuffle(entries, rand)
    .slice(0, count)
    .map((e) => {
      const toEnglish = direction === 'de-en' || (direction === 'mixed' && rand() < 0.5);
      return toEnglish ? `${e.de} | ${e.en}` : `${e.en} | ${e.de}`;
    })
    .join('\n');
}

/** Glossary lines "word | explanation" of a reading text. */
export const glossary = (x: string) => rows(x).filter(([w]) => w);

/** Statement lines "text | T" for true/false tasks; the answer is T, F or NG (also R/F, richtig/falsch). */
export function statements(x: string): { text: string; answer: 'T' | 'F' | 'NG' | '' }[] {
  return rows(x).map(([text = '', a = '']) => {
    const k = a.toLowerCase();
    const answer = /^(t|true|r|richtig|w|wahr)$/.test(k) ? 'T' : /^(f|false|falsch)$/.test(k) ? 'F' : /^(ng|n|not|not in the text|nicht im text)$/.test(k) ? 'NG' : '';
    return { text, answer };
  });
}
