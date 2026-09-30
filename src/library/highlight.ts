// After a jump from the search: the found words are marked for a few seconds (CSS Custom Highlight API, so
// React's DOM stays untouched), and the block or slide pulses once.
import { findWords, queryWords } from './search';

/** A block or slide to show after a jump from the search, with the words to mark. */
export interface SearchFocus {
  id: string;
  query: string;
  /** Changes with every jump. */
  n: number;
}

const NAME = 'suche';
let timer = 0;

/** Marks the words of the query inside `root` for `ms` milliseconds; returns the first mark. */
export function markFound(root: Element, query: string, ms = 4000): Range | null {
  const words = queryWords(query);
  if (!words.length) return null;
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    for (const [a, b] of findWords(t.data, words)) {
      const r = document.createRange();
      r.setStart(t, a);
      r.setEnd(t, b);
      ranges.push(r);
    }
  }
  if (ranges.length && typeof Highlight !== 'undefined' && CSS.highlights) {
    CSS.highlights.set(NAME, new Highlight(...ranges));
    clearTimeout(timer);
    timer = window.setTimeout(() => CSS.highlights.delete(NAME), ms);
  }
  return ranges[0] ?? null;
}

/** A short pulse around an element. */
export function pulse(el: Element) {
  el.animate?.([{ boxShadow: '0 0 0 0 transparent' }, { boxShadow: '0 0 0 10px var(--color-accent-5-300)' }, { boxShadow: '0 0 0 0 transparent' }], {
    duration: 900,
    iterations: 2,
  });
}
