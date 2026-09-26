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
}

/** Splits text at blanks: three or more underscores (`___`) mark a gap to write in. */
export const segments = (x: PropValue | undefined): Segment[] =>
  str(x)
    .split(/(_{3,})/)
    .filter((s) => s !== '')
    .map((s) => ({ text: s, blank: /^_{3,}$/.test(s) }));

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
