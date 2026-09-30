// Search across the whole library: modules, lessons and the texts of their blocks and slides. Pure, so it is
// tested without a browser; the dialog (SearchDialog.tsx) shows the hits and jumps to them.
import { BLOCK_TYPES } from '../model/blockTypes';
import type { Slide } from '../model/slides';
import type { Block, BlockType } from '../model/types';
import type { Lesson, Library, Module } from './types';

/** Lower case, without accents and umlaut dots, ß as ss: "Überschwemmung" and "uberschwemmung" are the same. */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();

/** `fold` of a text together with, for each folded character, its position in the original (for marking hits). */
export function foldWithMap(s: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; ) {
    const c = String.fromCodePoint(s.codePointAt(i)!);
    const f = fold(c);
    for (let k = 0; k < f.length; k++) map.push(i);
    text += f;
    i += c.length;
  }
  map.push(s.length);
  return { text, map };
}

/** The words of a query, folded; empty words dropped. */
export const queryWords = (q: string) => fold(q).split(/\s+/).filter(Boolean);

/** Where the words of the query stand in a text: [start, end) in the original text, sorted, overlaps merged. */
export function findWords(text: string, words: string[]): [number, number][] {
  if (!words.length) return [];
  const { text: folded, map } = foldWithMap(text);
  const found: [number, number][] = [];
  for (const w of words) {
    for (let at = folded.indexOf(w); at >= 0; at = folded.indexOf(w, at + w.length)) found.push([map[at], map[at + w.length]]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of found) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

/** Text of a field without the markup of the Baukasten: gaps [[…]], endings {{…}}, the * of right answers. */
export const plainText = (s: string) =>
  s
    .replace(/\[\[([^\]\n]*)\]\]/g, '$1')
    .replace(/\{\{([^}\n]*)\}\}/g, '$1')
    .replace(/_{3,}/g, '…')
    .replace(/^\s*\*\s*/gm, '')
    .replace(/[ \t]*\|[ \t]*/g, ' · ');

const TEXT_FIELDS = new Set(['text', 'area', 'ipa']);

/** The texts of a block, one field after the other. */
export function blockText(b: Block): string[] {
  const T = BLOCK_TYPES[b.type];
  if (!T) return [];
  return T.fields
    .filter((f) => TEXT_FIELDS.has(f.kind))
    .map((f) => plainText(String(b.props[f.key] ?? '')).trim())
    .filter(Boolean);
}

/** The texts of a slide: headings, text, entries, texts placed on the slide, speaker notes. */
export function slideText(s: Slide): string[] {
  return [s.title, s.label, s.text, s.help, s.items, ...s.elements.map((e) => e.text), s.notes, s.source].map((t) => plainText(t ?? '').trim()).filter(Boolean);
}

export type HitKind = 'module' | 'lesson' | 'block' | 'slide';

export interface SearchEntry {
  kind: HitKind;
  module: Module;
  lesson?: Lesson;
  blockId?: string;
  blockType?: BlockType;
  slideId?: string;
  /** What it is: "Modul", "Stunde", "Lückentext", "Folie 3". */
  what: string;
  /** Headline: title of the module or lesson; for contents their first text. */
  title: string;
  /** The searched texts, one per field. */
  texts: string[];
  folded: string;
  /** Position in the library, for the order of the hits. */
  pos: number[];
}

const RANK: Record<HitKind, number> = { module: 0, lesson: 1, block: 2, slide: 3 };

const cut = (s: string, n: number) => {
  const line = s.split('\n')[0].trim();
  return line.length > n ? line.slice(0, n - 1).trimEnd() + '…' : line;
};

/** Everything that can be found, built once when the search opens. */
export function searchIndex(lib: Library): SearchEntry[] {
  const out: SearchEntry[] = [];
  // A block is also found by its kind: "Merksatz Treibhaus".
  const add = (e: Omit<SearchEntry, 'folded'>) => out.push({ ...e, folded: fold([e.kind === 'block' ? e.what : '', ...e.texts].join('\n')) });
  const subjects = [...new Set(lib.modules.map((m) => m.subject))].sort((a, b) => a.localeCompare(b, 'de'));
  for (const m of lib.modules) {
    const at = [subjects.indexOf(m.subject), m.grade, m.number];
    add({ kind: 'module', module: m, what: 'Modul', title: m.title, texts: [m.title, m.description, m.textbook].filter(Boolean), pos: at });
    const lessons = lib.lessons.filter((l) => l.moduleId === m.id);
    for (const l of lessons) {
      add({ kind: 'lesson', module: m, lesson: l, what: 'Stunde', title: l.title, texts: [l.title, l.textbook, l.plan].filter(Boolean), pos: [...at, l.number] });
      let k = 0;
      for (const page of l.doc.pages) {
        for (const b of page.blocks) {
          const texts = blockText(b);
          if (texts.length) add({ kind: 'block', module: m, lesson: l, blockId: b.id, blockType: b.type, what: BLOCK_TYPES[b.type].label, title: cut(texts[0], 90), texts, pos: [...at, l.number, k] });
          k++;
        }
      }
      l.slides.forEach((s, i) => {
        const texts = slideText(s);
        if (texts.length) add({ kind: 'slide', module: m, lesson: l, slideId: s.id, what: `Folie ${i + 1}`, title: cut(texts[0], 90), texts, pos: [...at, l.number, i] });
      });
    }
  }
  return out;
}

export interface Snippet {
  text: string;
  marks: [number, number][];
}

/** A short piece of the text around the first hit, with all hits marked. */
export function snippet(texts: string[], words: string[], width = 110): Snippet {
  const line = texts.flatMap((t) => t.split('\n')).find((t) => findWords(t, words).length) ?? texts[0] ?? '';
  const all = findWords(line, words);
  let start = 0;
  if (line.length > width && all.length) {
    start = Math.max(0, Math.min(all[0][0] - Math.round(width / 3), line.length - width));
    // Start at a word.
    const space = line.lastIndexOf(' ', start);
    if (start > 0 && space >= 0 && start - space < 16) start = space + 1;
  }
  const end = Math.min(line.length, start + width);
  const pre = start > 0 ? '…' : '';
  const text = pre + line.slice(start, end) + (end < line.length ? '…' : '');
  const marks = all.filter(([a, b]) => a >= start && b <= end).map(([a, b]) => [a - start + pre.length, b - start + pre.length] as [number, number]);
  return { text, marks };
}

export interface SearchHit {
  entry: SearchEntry;
  /** In the subject and grade in view. */
  here: boolean;
  snippet: Snippet;
}

export interface Here {
  subject?: string;
  grade?: number;
}

const isHere = (m: Module, here: Here) => !!here.subject && m.subject === here.subject && (!here.grade || m.grade === here.grade);

function comparePos(a: number[], b: number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1);
    if (d) return d;
  }
  return 0;
}

/**
 * The entries with all words of the query, those of the subject and grade in view first; then modules, lessons,
 * blocks and slides, each in the order of the library. `more`: hits left out beyond `limit`.
 */
export function searchLibrary(index: SearchEntry[], query: string, here: Here = {}, limit = 60): { hits: SearchHit[]; more: number } {
  const words = queryWords(query);
  if (!words.length) return { hits: [], more: 0 };
  const found = index
    .filter((e) => words.every((w) => e.folded.includes(w)))
    .map((entry) => ({ entry, here: isHere(entry.module, here) }))
    .sort((a, b) => Number(b.here) - Number(a.here) || RANK[a.entry.kind] - RANK[b.entry.kind] || comparePos(a.entry.pos, b.entry.pos));
  return {
    hits: found.slice(0, limit).map((h) => ({ ...h, snippet: snippet(h.entry.texts, words) })),
    more: Math.max(0, found.length - limit),
  };
}

/** "Geographie · Kl. 9 · M1 Klima · S2 Treibhauseffekt": where a hit is. */
export function hitPlace(e: SearchEntry): string {
  const m = e.module;
  const parts = [`${m.subject} · Kl. ${m.grade}`, `M${m.number}${e.kind === 'module' ? '' : ` ${m.title}`}`];
  if (e.lesson && e.kind !== 'lesson') parts.push(`S${e.lesson.number} ${e.lesson.title}`);
  if (e.kind === 'lesson' && e.lesson) parts.push(`S${e.lesson.number}`);
  return parts.join(' · ');
}
