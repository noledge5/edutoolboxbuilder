// Labels on a picture (block "Abbildung"): one line per label, "Krater" or "Krater | 42 | 18" once placed, with the
// position in percent of the picture's box (left, top). Claude writes only the words; the teacher puts them on.
import { lines } from './text';
import type { PropValue } from './types';

export interface FigureLabel {
  text: string;
  /** Position in percent of the box, or null while not placed yet. */
  at: { x: number; y: number } | null;
}

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n * 10) / 10));

export function figureLabels(x: PropValue | undefined): FigureLabel[] {
  return lines(x).map((l) => {
    const [text = '', a, b] = l.split('|').map((c) => c.trim());
    const nx = Number(a);
    const ny = Number(b);
    return { text, at: a !== undefined && b !== undefined && a !== '' && b !== '' && Number.isFinite(nx) && Number.isFinite(ny) ? { x: clamp(nx), y: clamp(ny) } : null };
  });
}

/** One label's line with its position (rounded to a tenth of a percent). */
export const labelLine = (text: string, at: { x: number; y: number } | null) => (at ? `${text} | ${clamp(at.x)} | ${clamp(at.y)}` : text);

/** The labels without their words (for a test handed out), positions kept. */
export const labelsWithoutWords = (x: PropValue | undefined) =>
  figureLabels(x)
    .map((l) => labelLine('', l.at) || '–')
    .join('\n');
