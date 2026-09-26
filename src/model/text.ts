import type { PropValue } from './types';

export const str = (x: PropValue | undefined): string => (x == null ? '' : String(x));

export const num = (x: PropValue | undefined, fallback: number): number => {
  const n = typeof x === 'number' ? x : parseInt(str(x), 10);
  return Number.isFinite(n) ? n : fallback;
};

/** Non-empty, trimmed lines of a multi-line field ("one per line"). */
export const lines = (x: PropValue | undefined): string[] =>
  str(x)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export interface Segment {
  text: string;
  blank: boolean;
  /** The answer for the gap, if given as [[answer]]. */
  solution?: string;
}

/** Splits text at blanks: `___` is a gap to write in, `[[answer]]` a gap with its answer for the solution sheet. */
export const segments = (x: PropValue | undefined): Segment[] =>
  str(x)
    .split(/(_{3,}|\[\[[^\]\n]*\]\])/)
    .filter((s) => s !== '')
    .map((s) => {
      if (/^_{3,}$/.test(s)) return { text: s, blank: true };
      const m = /^\[\[([^\]\n]*)\]\]$/.exec(s);
      return m ? { text: s, blank: true, solution: m[1].trim() } : { text: s, blank: false };
    });

export interface Choice {
  text: string;
  correct: boolean;
}

/** Answer options, one per line; a leading `*` marks a correct one. */
export const choices = (x: PropValue | undefined): Choice[] =>
  lines(x).map((l) => (l.startsWith('*') ? { text: l.slice(1).trim(), correct: true } : { text: l, correct: false }));

/** Table solutions: one line per table row, cells separated by `|` (the row label column is not repeated). */
export const cellRows = (x: PropValue | undefined): string[][] =>
  str(x)
    .split('\n')
    .map((row) => row.split('|').map((c) => c.trim()));

/** Matching solution: for each right-hand item, the number of the left-hand item it belongs to ("2, 3, 1"). */
export const matchNumbers = (x: PropValue | undefined): number[] =>
  str(x)
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n));

/** Lines split into `|` separated fields (for teacher blocks), empty lines skipped. */
export const rows = (x: PropValue | undefined): string[][] => lines(x).map((l) => l.split('|').map((c) => c.trim()));

export interface FlowStep {
  title: string;
  sub: string;
}

/** Flow-diagram steps: one per line, `Titel | Zusatz`. */
export const flowSteps = (x: PropValue | undefined): FlowStep[] =>
  lines(x).map((l) => {
    const [title = '', sub = ''] = l.split('|').map((s) => s.trim());
    return { title, sub };
  });
