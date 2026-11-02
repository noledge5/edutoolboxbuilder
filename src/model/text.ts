import type { PropValue } from './types';

export const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Whitespace folded to single spaces. */
export const flat = (s: string) => s.replace(/\s+/g, ' ').trim();
/** Shortened to `n` characters with an ellipsis. */
export const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

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

/**
 * One line or cell of a multi-line field changed, for editing right on the page. `line` counts the non-empty lines
 * (as `lines` and `rows` do), or with `raw` every line (as `cellRows`); `cell` is the part between `|`. An emptied
 * line goes away.
 */
export function setPart(text: string, line: number, value: string, cell?: number, raw = false): string {
  const all = text.split('\n');
  let i = raw ? line : -1;
  if (!raw) for (let n = -1, k = 0; k < all.length && n < line; k++) if (all[k].trim() && ++n === line) i = k;
  if (raw) while (all.length <= i) all.push('');
  if (i < 0) return text;
  const v = value.replace(/\n/g, ' ');
  if (cell === undefined) {
    if (v.trim()) all[i] = v;
    else all.splice(i, 1);
    return all.join('\n');
  }
  const cells = all[i].split('|').map((c) => c.trim());
  while (cells.length <= cell) cells.push('');
  cells[cell] = v.replace(/\|/g, '/').trim();
  while (cells.length > 1 && !cells[cells.length - 1]) cells.pop();
  all[i] = cells.join(' | ');
  return all.join('\n');
}

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

/** A piece of text with its look: **bold** and/or {{marked}}. */
export interface Run {
  text: string;
  bold: boolean;
  mark: boolean;
}

const BOLD = /\*\*([^*\n]+)\*\*/g;
const MARK = /\{\{(.*?)\}\}/g;

/**
 * Text split into runs: `**…**` is bold, `{{…}}` marked (both may nest). The same on sheets and slides; a lone `**`
 * or `{{` stays as written. Bold does not cross a line break.
 */
export function inlineRuns(text: string): Run[] {
  if (!text.includes('**') && !text.includes('{{')) return text ? [{ text, bold: false, mark: false }] : [];
  const n = text.length;
  const bold = new Uint8Array(n);
  const mark = new Uint8Array(n);
  const hide = new Uint8Array(n);
  const flag = (re: RegExp, on: Uint8Array) => {
    for (const m of text.matchAll(re)) {
      const a = m.index ?? 0;
      const b = a + m[0].length;
      hide[a] = hide[a + 1] = hide[b - 2] = hide[b - 1] = 1;
      on.fill(1, a + 2, b - 2);
    }
  };
  flag(BOLD, bold);
  flag(MARK, mark);
  const runs: Run[] = [];
  for (let i = 0; i < n; i++) {
    if (hide[i]) continue;
    const last = runs[runs.length - 1];
    if (last && last.bold === !!bold[i] && last.mark === !!mark[i]) last.text += text[i];
    else runs.push({ text: text[i], bold: !!bold[i], mark: !!mark[i] });
  }
  return runs;
}

/** The text without its `**` and `{{ }}` (for widths and comparing answers). */
export const plain = (text: string): string => inlineRuns(text).map((r) => r.text).join('');

/** A run of text, or a gap that sits in bold or marked text. */
export type GapRun = ({ gap?: undefined } & Run) | { gap: Segment; bold: boolean; mark: boolean };

const GAP_SLOT = '';

/**
 * Text with gaps (`___`, `[[…]]`) split into runs; bold or marked text may run across a gap
 * ("**Der [[Hund]] bellt.**"). Gaps keep their segment, so `[[**Hund**]]` still has the answer "**Hund**".
 * `split` finds the gaps (slides have their own, `slideSegments`).
 */
export function gapRuns(text: string, split: (text: string) => Segment[] = segments): GapRun[] {
  const segs = split(text);
  const gaps = segs.filter((s) => s.blank);
  if (!gaps.length) return inlineRuns(text);
  const runs = inlineRuns(segs.map((s) => (s.blank ? GAP_SLOT : s.text.replaceAll(GAP_SLOT, ''))).join(''));
  const out: GapRun[] = [];
  let g = 0;
  for (const r of runs) {
    r.text.split(GAP_SLOT).forEach((part, k) => {
      if (k > 0) out.push({ gap: gaps[g++], bold: r.bold, mark: r.mark });
      if (part) out.push({ ...r, text: part });
    });
  }
  return out;
}
