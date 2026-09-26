// Pure document operations. Each returns a new Doc (structural sharing via immer),
// so every result can go straight onto the undo stack.
import { produce } from 'immer';
import { BLOCK_TYPES } from './blockTypes';
import type { Block, BlockProps, BlockType, Doc, DropTarget, Page } from './types';

export const uid = (): string => 'b' + Math.random().toString(36).slice(2, 9);

export function createBlock(type: BlockType, props?: BlockProps, span?: number): Block {
  const T = BLOCK_TYPES[type];
  return { id: uid(), type, span: span ?? T.span, props: { ...T.defaults, ...props } };
}

export function createPage(): Page {
  return { title: 'Neues Arbeitsblatt', kicker: 'Klasse · Thema', type: 'uebung', form: 'allein', nameField: true, blocks: [] };
}

export function findBlock(doc: Doc, id: string): { p: number; i: number } | null {
  for (let p = 0; p < doc.pages.length; p++) {
    const i = doc.pages[p].blocks.findIndex((b) => b.id === id);
    if (i >= 0) return { p, i };
  }
  return null;
}

export function getBlock(doc: Doc, id: string): Block | null {
  const loc = findBlock(doc, id);
  return loc ? doc.pages[loc.p].blocks[loc.i] : null;
}

export function insertBlock(doc: Doc, p: number, i: number, block: Block): Doc {
  return produce(doc, (d) => {
    const blocks = d.pages[p].blocks;
    blocks.splice(Math.max(0, Math.min(i, blocks.length)), 0, block);
  });
}

/** Index a dropped block ends up at on the target page, before removing it from its old place. */
const dropIndex = (t: DropTarget): number => (t.pos === 'after' ? t.i + 1 : t.i);

export function dropNewBlock(doc: Doc, type: BlockType, target: DropTarget): { doc: Doc; id: string } {
  const block = createBlock(type);
  return { doc: insertBlock(doc, target.p, dropIndex(target), block), id: block.id };
}

export function moveBlockTo(doc: Doc, id: string, target: DropTarget): Doc {
  const from = findBlock(doc, id);
  if (!from || !doc.pages[target.p]) return doc;
  let to = dropIndex(target);
  if (from.p === target.p && from.i < to) to--;
  if (from.p === target.p && from.i === to) return doc;
  return produce(doc, (d) => {
    const [block] = d.pages[from.p].blocks.splice(from.i, 1);
    d.pages[target.p].blocks.splice(to, 0, block);
  });
}

/** Whether moveBlockBy can move the block: not the very first block up, not the very last one down. */
export function canMoveBy(doc: Doc, id: string, dir: -1 | 1): boolean {
  const loc = findBlock(doc, id);
  if (!loc) return false;
  const j = loc.i + dir;
  return (j >= 0 && j < doc.pages[loc.p].blocks.length) || !!doc.pages[loc.p + dir];
}

/**
 * Moves a block one step up (−1) or down (+1): swaps it with its neighbour, or at the edge of a page
 * moves it to the end of the previous page or the start of the next one.
 */
export function moveBlockBy(doc: Doc, id: string, dir: -1 | 1): Doc {
  if (!canMoveBy(doc, id, dir)) return doc;
  const loc = findBlock(doc, id)!;
  const j = loc.i + dir;
  return produce(doc, (d) => {
    const a = d.pages[loc.p].blocks;
    if (j >= 0 && j < a.length) {
      [a[loc.i], a[j]] = [a[j], a[loc.i]];
      return;
    }
    const [block] = a.splice(loc.i, 1);
    const next = d.pages[loc.p + dir].blocks;
    if (dir < 0) next.push(block);
    else next.unshift(block);
  });
}

export function duplicateBlock(doc: Doc, id: string): { doc: Doc; id: string } {
  const loc = findBlock(doc, id);
  if (!loc) return { doc, id };
  const src = doc.pages[loc.p].blocks[loc.i];
  const copy: Block = { ...src, id: uid(), props: { ...src.props } };
  return { doc: insertBlock(doc, loc.p, loc.i + 1, copy), id: copy.id };
}

export function deleteBlock(doc: Doc, id: string): Doc {
  const loc = findBlock(doc, id);
  if (!loc) return doc;
  return produce(doc, (d) => {
    d.pages[loc.p].blocks.splice(loc.i, 1);
  });
}

export function updateBlock(doc: Doc, id: string, patch: { span?: number; props?: BlockProps }): Doc {
  const loc = findBlock(doc, id);
  if (!loc) return doc;
  return produce(doc, (d) => {
    const b = d.pages[loc.p].blocks[loc.i];
    if (patch.span != null) b.span = patch.span;
    if (patch.props) Object.assign(b.props, patch.props);
  });
}

export function updatePage(doc: Doc, p: number, patch: Partial<Omit<Page, 'blocks'>>): Doc {
  if (!doc.pages[p]) return doc;
  return produce(doc, (d) => {
    Object.assign(d.pages[p], patch);
  });
}

export function updateDocMeta(doc: Doc, patch: Partial<Pick<Doc, 'icon' | 'footer' | 'code'>>): Doc {
  return produce(doc, (d) => {
    Object.assign(d, patch);
  });
}

export function addPage(doc: Doc): Doc {
  return produce(doc, (d) => {
    d.pages.push(createPage());
  });
}

export function deletePage(doc: Doc, p: number): Doc {
  if (doc.pages.length <= 1 || !doc.pages[p]) return doc;
  return produce(doc, (d) => {
    d.pages.splice(p, 1);
  });
}

/** Where a click in the toolbox inserts: after the selected block, else at the end of the selected page, else page 1. */
export function insertionPoint(doc: Doc, sel: { kind: 'page'; p: number } | { kind: 'block'; id: string } | null): { p: number; i: number } {
  if (sel?.kind === 'block') {
    const loc = findBlock(doc, sel.id);
    if (loc) return { p: loc.p, i: loc.i + 1 };
  }
  const p = sel?.kind === 'page' && doc.pages[sel.p] ? sel.p : 0;
  return { p, i: doc.pages[p].blocks.length };
}

/** Image ids referenced by image blocks, for cleaning up unused stored images. */
export function referencedImages(doc: Doc): Set<string> {
  const ids = new Set<string>();
  for (const pg of doc.pages) for (const b of pg.blocks) if (b.type === 'image' && b.props.image) ids.add(String(b.props.image));
  return ids;
}
