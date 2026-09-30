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

  it('swaps neighbours and crosses to the neighbouring page at the edges', () => {
    const doc = seedDoc();
    const [a, b] = ids(doc, 0);
    expect(ids(ops.moveBlockBy(doc, a, 1), 0).slice(0, 2)).toEqual([b, a]);
    const lastOn1 = ids(doc, 0).at(-1)!;
    const firstOn2 = ids(doc, 1)[0];
    expect(ids(ops.moveBlockBy(doc, lastOn1, 1), 1)[0]).toBe(lastOn1);
    expect(ids(ops.moveBlockBy(doc, firstOn2, -1), 0).at(-1)).toBe(firstOn2);
  });

  it('does not move the first block up or the last block down', () => {
    const doc = seedDoc();
    const first = ids(doc, 0)[0];
    const last = ids(doc, 1).at(-1)!;
    expect(ops.canMoveBy(doc, first, -1)).toBe(false);
    expect(ops.moveBlockBy(doc, first, -1)).toBe(doc);
    expect(ops.canMoveBy(doc, last, 1)).toBe(false);
    expect(ops.moveBlockBy(doc, last, 1)).toBe(doc);
  });

  it('adds a page with the header settings of a template page', () => {
    const doc = seedDoc();
    const next = ops.addPage(doc, 0);
    expect(next.pages[2]).toMatchObject({ title: 'Neues Arbeitsblatt', kicker: doc.pages[0].kicker, type: 'versuch', form: 'zu zweit', nameField: 'namen', blocks: [] });
  });

  it('splits a page into a continuation page', () => {
    const doc = seedDoc();
    const moved = ids(doc, 0).slice(5);
    const next = ops.splitPage(doc, 0, 5);
    expect(next.pages).toHaveLength(3);
    expect(ids(next, 0)).toHaveLength(5);
    expect(ids(next, 1)).toEqual(moved);
    expect(next.pages[1]).toMatchObject({ title: doc.pages[0].title, type: doc.pages[0].type });
    expect(ops.splitPage(doc, 0, 0)).toBe(doc);
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

describe('page numbers', () => {
  it('counts only the pages for the class', () => {
    const doc = seedDoc();
    const teacher = { ...ops.createPage(), type: 'lehrkraft' as const };
    const d: Doc = { ...doc, pages: [teacher, ...doc.pages, teacher] };
    expect(ops.sheetNumbers(d)).toEqual([null, 1, 2, null]);
    expect([0, 1, 2, 3].map((p) => ops.pageLabel(d, p))).toEqual(['Für die Lehrkraft 1', 'Seite 1', 'Seite 2', 'Für die Lehrkraft 2']);
    expect(ops.pageLabel({ ...doc, pages: [teacher, doc.pages[0]] }, 0)).toBe('Für die Lehrkraft');
  });
});

describe('back pages', () => {
  it('belong to the nearest page before them that is not a back page', () => {
    const doc = seedDoc();
    const [a, b] = doc.pages;
    const d: Doc = { ...doc, pages: [a, { ...b, back: true }, { ...b, back: true }, b] };
    expect([0, 1, 2, 3].map((p) => ops.frontOf(d.pages, p))).toEqual([null, 0, 0, null]);
    expect(ops.pageLabel(d, 1)).toBe('Seite 2 · Rückseite');
    // The page after a back page starts a new sheet with a name field again.
    expect(ops.createPage({ ...b, back: true, nameField: 'aus' })).toMatchObject({ nameField: 'name' });
    expect(ops.createPage({ ...b, back: true, nameField: 'aus' }).back).toBeUndefined();
  });
});

describe('several blocks', () => {
  it('selects ranges across pages in document order, and makes selections of one or more', () => {
    const doc = seedDoc();
    const [a, b, c] = ids(doc, 0);
    expect(ops.blockRange(doc, c, a)).toEqual([a, b, c]);
    const last0 = ids(doc, 0).at(-1)!;
    const first1 = ids(doc, 1)[0];
    expect(ops.blockRange(doc, last0, first1)).toEqual([last0, first1]);
    expect(ops.blockRange(doc, 'weg', b)).toEqual([b]);
    expect(ops.selectionOf([])).toBeNull();
    expect(ops.selectionOf([a])).toEqual({ kind: 'block', id: a });
    expect(ops.selectedIds(doc, { kind: 'blocks', ids: [c, a] })).toEqual([a, c]);
  });

  it('inserts after the last selected block, deletes and copies several at once', () => {
    const doc = seedDoc();
    const [a, b, c] = ids(doc, 0);
    expect(ops.insertionPoint(doc, { kind: 'blocks', ids: [b, a] })).toEqual({ p: 0, i: 2 });
    const gone = ops.deleteBlocks(doc, [a, c]);
    expect(ids(gone, 0).slice(0, 1)).toEqual([b]);
    expect(ids(gone, 0)).not.toContain(a);
    const copies = ops.copyBlocks(ops.blocksOf(doc, [a, b]));
    expect(copies.map((x) => x.type)).toEqual(ops.blocksOf(doc, [a, b]).map((x) => x.type));
    expect(copies.some((x) => x.id === a || x.id === b)).toBe(false);
    const pasted = ops.insertBlocks(doc, 0, 1, copies);
    expect(ids(pasted, 0).slice(0, 4)).toEqual([a, copies[0].id, copies[1].id, b]);
    const dropped = ops.dropBlocks(doc, copies, { p: 1, i: 0, pos: 'after' });
    expect(ids(dropped, 1).slice(1, 3)).toEqual(copies.map((x) => x.id));
  });

  it('drops links to competences of another module when pasting', () => {
    const block = ops.createBlock('open', { competence: 'k1' });
    expect(ops.copyBlocks([block], ['k1'])[0].props.competence).toBe('k1');
    expect(ops.copyBlocks([block], ['k2'])[0].props.competence).toBe('');
    expect(ops.copyBlocks([block])[0].props.competence).toBe('k1');
  });
});
