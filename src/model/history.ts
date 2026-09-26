// Undo/redo over whole-document snapshots. Consecutive edits of the same field
// (same mergeKey within MERGE_MS) collapse into one step, so typing a word is one undo.
import type { Doc } from './types';

export const HISTORY_LIMIT = 100;
export const MERGE_MS = 1200;

export interface HistoryState {
  past: Doc[];
  present: Doc;
  future: Doc[];
  mergeKey: string | null;
  mergeAt: number;
}

export type HistoryAction =
  | { type: 'commit'; doc: Doc; mergeKey?: string; now?: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; doc: Doc };

export const initHistory = (doc: Doc): HistoryState => ({ past: [], present: doc, future: [], mergeKey: null, mergeAt: 0 });

export function historyReducer(s: HistoryState, a: HistoryAction): HistoryState {
  switch (a.type) {
    case 'commit': {
      if (a.doc === s.present) return s;
      const now = a.now ?? Date.now();
      const merge = a.mergeKey != null && a.mergeKey === s.mergeKey && now - s.mergeAt < MERGE_MS;
      return {
        past: merge ? s.past : [...s.past, s.present].slice(-HISTORY_LIMIT),
        present: a.doc,
        future: [],
        mergeKey: a.mergeKey ?? null,
        mergeAt: now,
      };
    }
    case 'undo': {
      if (!s.past.length) return s;
      return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future], mergeKey: null, mergeAt: 0 };
    }
    case 'redo': {
      if (!s.future.length) return s;
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1), mergeKey: null, mergeAt: 0 };
    }
    case 'reset':
      return initHistory(a.doc);
  }
}
