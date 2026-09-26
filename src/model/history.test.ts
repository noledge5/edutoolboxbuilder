import { describe, expect, it } from 'vitest';
import { MERGE_MS, historyReducer, initHistory } from './history';
import { updateDocMeta } from './ops';
import { seedDoc } from './seed';

describe('history', () => {
  it('undoes and redoes', () => {
    const d0 = seedDoc();
    const d1 = updateDocMeta(d0, { code: 'A' });
    let s = historyReducer(initHistory(d0), { type: 'commit', doc: d1 });
    s = historyReducer(s, { type: 'undo' });
    expect(s.present).toBe(d0);
    s = historyReducer(s, { type: 'redo' });
    expect(s.present).toBe(d1);
  });

  it('merges quick edits of the same field into one step', () => {
    const d0 = seedDoc();
    let s = initHistory(d0);
    s = historyReducer(s, { type: 'commit', doc: updateDocMeta(d0, { code: 'A' }), mergeKey: 'code', now: 1000 });
    s = historyReducer(s, { type: 'commit', doc: updateDocMeta(d0, { code: 'AB' }), mergeKey: 'code', now: 1000 + MERGE_MS / 2 });
    expect(s.past).toHaveLength(1);
    expect(historyReducer(s, { type: 'undo' }).present).toBe(d0);
  });

  it('starts a new step after a pause or for another field', () => {
    const d0 = seedDoc();
    let s = initHistory(d0);
    s = historyReducer(s, { type: 'commit', doc: updateDocMeta(d0, { code: 'A' }), mergeKey: 'code', now: 1000 });
    s = historyReducer(s, { type: 'commit', doc: updateDocMeta(d0, { code: 'AB' }), mergeKey: 'code', now: 1000 + MERGE_MS * 2 });
    s = historyReducer(s, { type: 'commit', doc: updateDocMeta(d0, { footer: 'F' }), mergeKey: 'footer', now: 1000 + MERGE_MS * 2 + 10 });
    expect(s.past).toHaveLength(3);
  });

  it('clears the redo stack on a new edit', () => {
    const d0 = seedDoc();
    let s = historyReducer(initHistory(d0), { type: 'commit', doc: updateDocMeta(d0, { code: 'A' }) });
    s = historyReducer(s, { type: 'undo' });
    s = historyReducer(s, { type: 'commit', doc: updateDocMeta(d0, { code: 'B' }) });
    expect(s.future).toHaveLength(0);
  });
});
