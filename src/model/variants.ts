// Versions of a worksheet for printing: only the tasks of some levels (G, M, E), and test group B with its answers
// and entries in another order. The worksheet itself does not change; the print shows the derived document.
import { BLOCK_TYPES, LEVEL_NAMES } from './blockTypes';
import { seeded, shuffle } from './language';
import { lines, matchNumbers, num, str } from './text';
import type { Block, Doc } from './types';

export type TestGroup = '' | 'A' | 'B';

export interface SheetVariant {
  /** Levels whose tasks are printed ('1' G, '2' M, '3' E); tasks without a level are always printed. */
  levels: string[];
  group: TestGroup;
}

export const ALL_LEVELS = ['1', '2', '3'];
export const PLAIN_VARIANT: SheetVariant = { levels: ALL_LEVELS, group: '' };

const levelOf = (b: Block) => String(num(b.props.level, 0));

/** Whether the worksheet has tasks with a level. */
export const hasLevels = (doc: Doc) => doc.pages.some((p) => p.blocks.some((b) => BLOCK_TYPES[b.type]?.task && levelOf(b) !== '0'));

/** Task types whose answers or entries group B gets in another order. */
const SHUFFLED = new Set(['mc', 'truefalse', 'match', 'jumble', 'transform', 'foldtest', 'picvocab', 'bingo']);

/** Whether group B differs from group A. */
export const hasShuffle = (doc: Doc) => doc.pages.some((p) => p.blocks.some((b) => SHUFFLED.has(b.type)));

/** "G", "G/M", "M/E" … for the footer; '' when all levels are printed. */
export function levelCode(levels: string[]): string {
  const chosen = ALL_LEVELS.filter((l) => levels.includes(l));
  return chosen.length === ALL_LEVELS.length ? '' : chosen.map((l) => LEVEL_NAMES[l]).join('/');
}

/** An order of `n` things for group B: shuffled with a seed, never the same as the original (if it can differ). */
function order(n: number, seed: string): number[] {
  const start = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return start;
  for (let t = 0; t < 8; t++) {
    const o = shuffle(start, seeded(`${seed}:B:${t}`));
    if (o.some((x, i) => x !== i)) return o;
  }
  return [...start.slice(1), start[0]];
}

const pick = <T>(list: T[], o: number[]) => o.map((i) => list[i]);

/** A task with its answers and entries in the order of group B; its solution stays right. */
function shuffleBlock(b: Block): Block {
  const p = b.props;
  const lineList = (key: string) =>
    str(p[key])
      .split('\n')
      .filter((l) => l.trim());
  const withLines = (key: string) => {
    const l = lineList(key);
    return { ...b, props: { ...p, [key]: pick(l, order(l.length, b.id)).join('\n') } };
  };
  switch (b.type) {
    case 'mc':
      return withLines('options');
    case 'truefalse':
    case 'jumble':
    case 'transform':
    case 'bingo':
      return withLines('items');
    case 'foldtest':
      return withLines('rows');
    case 'picvocab': {
      // Pictures belong to their words: both lists move together.
      const items = lineList('items');
      const pics = str(p.pics).split('\n');
      const o = order(items.length, b.id);
      return { ...b, props: { ...p, items: pick(items, o).join('\n'), pics: o.map((i) => pics[i] ?? '').join('\n') } };
    }
    case 'match': {
      // Both columns in another order; the solution ("for each right item, the number of its left item") follows.
      const left = lines(p.left);
      const right = lines(p.right);
      const sol = matchNumbers(p.solution);
      const ol = order(left.length, `${b.id}:l`);
      const or = order(right.length, `${b.id}:r`);
      const newNumber = new Map(ol.map((old, k) => [old + 1, k + 1]));
      const solution = sol.length ? or.map((r) => newNumber.get(sol[r]) ?? '').join(', ') : str(p.solution);
      return { ...b, props: { ...p, left: pick(left, ol).join('\n'), right: pick(right, or).join('\n'), solution } };
    }
    default:
      return b;
  }
}

/** The worksheet as printed in a variant: tasks of other levels left out, group B shuffled, the level in the footer code. */
export function variantDoc(doc: Doc, v: SheetVariant): Doc {
  const all = ALL_LEVELS.every((l) => v.levels.includes(l));
  if (all && v.group !== 'B') return doc;
  const pages = doc.pages
    .map((page) => {
      const blocks = page.blocks
        .filter((b) => all || !BLOCK_TYPES[b.type]?.task || levelOf(b) === '0' || v.levels.includes(levelOf(b)))
        .map((b) => (v.group === 'B' && SHUFFLED.has(b.type) ? shuffleBlock(b) : b));
      return { page, blocks };
    })
    // A page that lost all its blocks to the level filter is left out.
    .filter(({ page, blocks }) => blocks.length > 0 || page.blocks.length === 0)
    .map(({ page, blocks }) => ({ ...page, blocks }));
  const code = levelCode(v.levels);
  return { ...doc, pages: pages.length ? pages : doc.pages, code: code ? [doc.code, code].filter(Boolean).join(' · ') : doc.code };
}
