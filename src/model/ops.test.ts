import { describe, expect, it } from 'vitest';
import * as ops from './ops';
import { seedDoc } from './seed';
import type { Doc } from './types';

const ids = (doc: Doc, p: number) => doc.pages[p].blocks.map((b) => b.id);

describe('moveBlockTo', () => {
  it('moves a block down within a page, accounting for its own removal', () => {
    const doc = seedDoc();
    const [a, b, c] = ids(doc, 0);
    const next = ops.moveBlockTo(doc, a, { p: 0, i: 2, pos: 'before' });
    expect(ids(next, 0).slice(0, 3)).toEqual([b, a, c]);
  });

  it('moves a block up within a page', () => {
    const doc = seedDoc();
    const [a, b, c] = ids(doc, 0);
    const next = ops.moveBlockTo(doc, c, { p: 0, i: 0, pos: 'before' });
    expect(ids(next, 0).slice(0, 3)).toEqual([c, a, b]);
  });

  it('moves a block to the end of another page', () => {
    const doc = seedDoc();
    const [a] = ids(doc, 0);
    const next = ops.moveBlockTo(doc, a, { p: 1, i: doc.pages[1].blocks.length, pos: 'end' });
    expect(ids(next, 0)).not.toContain(a);
    expect(ids(next, 1).at(-1)).toBe(a);
  });

  it('returns the same document when the block would stay in place', () => {
    const doc = seedDoc();
    const [a, b] = ids(doc, 0);
    expect(ops.moveBlockTo(doc, a, { p: 0, i: 0, pos: 'after' })).toBe(doc);
    expect(ops.moveBlockTo(doc, b, { p: 0, i: 0, pos: 'after' })).toBe(doc);
    expect(ops.moveBlockTo(doc, a, { p: 0, i: 1, pos: 'before' })).toBe(doc);
  });

  it('does not mutate the original document', () => {
    const doc = seedDoc();
    const before = JSON.stringify(doc);
    ops.moveBlockTo(doc, ids(doc, 0)[0], { p: 1, i: 0, pos: 'before' });
    expect(JSON.stringify(doc)).toBe(before);
  });
});

describe('other operations', () => {
  it('inserts a new block at a drop target', () => {
    const doc = seedDoc();
    const { doc: next, id } = ops.dropNewBlock(doc, 'merksatz', { p: 0, i: 1, pos: 'after' });
    expect(next.pages[0].blocks[2].id).toBe(id);
    expect(next.pages[0].blocks[2].type).toBe('merksatz');
    expect(next.pages[0].blocks[2].props.variant).toBe('accent-2');
  });

  it('duplicates a block right after the original with a new id', () => {
    const doc = seedDoc();
    const src = doc.pages[0].blocks[3];
    const { doc: next, id } = ops.duplicateBlock(doc, src.id);
    expect(next.pages[0].blocks[4]).toEqual({ ...src, id });
    expect(id).not.toBe(src.id);
  });

  it('swaps neighbours and stops at the page edges', () => {
    const doc = seedDoc();
    const [a, b] = ids(doc, 0);
    expect(ids(ops.moveBlockBy(doc, a, 1), 0).slice(0, 2)).toEqual([b, a]);
    expect(ops.moveBlockBy(doc, a, -1)).toBe(doc);
  });

  it('keeps at least one page', () => {
    const one = ops.deletePage(seedDoc(), 1);
    expect(one.pages).toHaveLength(1);
    expect(ops.deletePage(one, 0)).toBe(one);
  });

  it('inserts after the selected block, else at the end of the selected page, else on page 1', () => {
    const doc = seedDoc();
    expect(ops.insertionPoint(doc, { kind: 'block', id: doc.pages[1].blocks[2].id })).toEqual({ p: 1, i: 3 });
    expect(ops.insertionPoint(doc, { kind: 'page', p: 1 })).toEqual({ p: 1, i: doc.pages[1].blocks.length });
    expect(ops.insertionPoint(doc, null)).toEqual({ p: 0, i: doc.pages[0].blocks.length });
  });
});
