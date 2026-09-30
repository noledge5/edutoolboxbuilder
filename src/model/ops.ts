// Pure document operations. Each returns a new Doc (structural sharing via immer),
// so every result can go straight onto the undo stack.
import { produce } from 'immer';
import { BLOCK_TYPES } from './blockTypes';
import type { Block, BlockProps, BlockType, Doc, DropTarget, Page, Selection } from './types';

export const uid = (): string => 'b' + Math.random().toString(36).slice(2, 9);

export function createBlock(type: BlockType, props?: BlockProps, span?: number): Block {
  const T = BLOCK_TYPES[type];
  return { id: uid(), type, span: span ?? T.span, props: { ...T.defaults, ...props } };
}

/** A new empty page. With a template page it takes over that page's header settings (not its title). */
export function createPage(like?: Page): Page {
  const base: Page = { title: 'Neues Arbeitsblatt', kicker: 'Klasse · Thema', type: 'uebung', form: 'allein', nameField: 'name', blocks: [] };
  // A back page has no name field of its own; the page after it starts a new sheet and needs one.
  return like ? { ...base, kicker: like.kicker, type: like.type, form: like.form, nameField: like.back && like.nameField === 'aus' ? 'name' : like.nameField } : base;
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

/** Blocks inserted one after the other at position `i` of page `p`. */
export function insertBlocks(doc: Doc, p: number, i: number, blocks: Block[]): Doc {
  return produce(doc, (d) => {
    const list = d.pages[p].blocks;
    list.splice(Math.max(0, Math.min(i, list.length)), 0, ...blocks);
  });
}

/** Index a dropped block ends up at on the target page, before removing it from its old place. */
const dropIndex = (t: DropTarget): number => (t.pos === 'after' ? t.i + 1 : t.i);

export function dropNewBlock(doc: Doc, type: BlockType, target: DropTarget): { doc: Doc; id: string } {
  const block = createBlock(type);
  return { doc: insertBlock(doc, target.p, dropIndex(target), block), id: block.id };
}

/** Blocks (from the Ablage) dropped at a place on a page. */
export const dropBlocks = (doc: Doc, blocks: Block[], target: DropTarget): Doc => insertBlocks(doc, target.p, dropIndex(target), blocks);

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

export function updateDocMeta(doc: Doc, patch: Partial<Pick<Doc, 'icon' | 'footer' | 'code' | 'lang' | 'help'>>): Doc {
  return produce(doc, (d) => {
    Object.assign(d, patch);
  });
}

/** Appends a page that takes over the header settings of page `like` (default: the last page). */
export function addPage(doc: Doc, like = doc.pages.length - 1): Doc {
  return produce(doc, (d) => {
    d.pages.push(createPage(doc.pages[like]));
  });
}

/** Moves blocks `i`… of page `p` onto a new page right after it, with the same header (a continuation). */
export function splitPage(doc: Doc, p: number, i: number): Doc {
  const page = doc.pages[p];
  if (!page || i <= 0 || i >= page.blocks.length) return doc;
  return produce(doc, (d) => {
    const moved = d.pages[p].blocks.splice(i);
    d.pages.splice(p + 1, 0, { ...createPage(page), title: page.title, blocks: moved });
  });
}

/** All blocks in reading order, for moving the selection with the arrow keys. */
export const allBlockIds = (doc: Doc): string[] => doc.pages.flatMap((pg) => pg.blocks.map((b) => b.id));

export function deletePage(doc: Doc, p: number): Doc {
  if (doc.pages.length <= 1 || !doc.pages[p]) return doc;
  return produce(doc, (d) => {
    d.pages.splice(p, 1);
  });
}

/** Where a click in the toolbox inserts: after the selected block, else at the end of the selected page, else page 1. */
export function insertionPoint(doc: Doc, sel: Selection): { p: number; i: number } {
  const last = sel?.kind === 'block' ? sel.id : sel?.kind === 'blocks' ? blocksOf(doc, sel.ids).at(-1)?.id : undefined;
  if (last) {
    const loc = findBlock(doc, last);
    if (loc) return { p: loc.p, i: loc.i + 1 };
  }
  const p = sel?.kind === 'page' && doc.pages[sel.p] ? sel.p : 0;
  return { p, i: doc.pages[p].blocks.length };
}

/** Printed page numbers: pages for the class count 1, 2, 3 …; teacher pages have none (null). */
export function sheetNumbers(doc: Doc): (number | null)[] {
  let n = 0;
  return doc.pages.map((pg) => (pg.type === 'lehrkraft' ? null : ++n));
}

/** For a back page, the index of its front: the nearest page before it that is not a back page itself. */
export function frontOf(pages: Page[], p: number): number | null {
  if (!pages[p]?.back) return null;
  for (let k = p - 1; k >= 0; k--) if (!pages[k].back) return k;
  return null;
}

/** "Seite 2", "Seite 2 · Rückseite", or "Für die Lehrkraft" for a teacher page (numbered if there are several). */
export function pageLabel(doc: Doc, p: number): string {
  const n = sheetNumbers(doc)[p];
  if (n !== null) return `Seite ${n}${frontOf(doc.pages, p) !== null ? ' · Rückseite' : ''}`;
  const teacher = doc.pages.filter((pg) => pg.type === 'lehrkraft').length;
  return teacher > 1 ? `Für die Lehrkraft ${doc.pages.slice(0, p + 1).filter((pg) => pg.type === 'lehrkraft').length}` : 'Für die Lehrkraft';
}

/** Image ids a block refers to: "image" holds one id, "pics" one id per line (picture grids). */
export function blockImages(b: Block): string[] {
  const out: string[] = [];
  if (b.props.image) out.push(String(b.props.image));
  if (b.props.pics) out.push(...String(b.props.pics).split('\n').map((x) => x.trim()).filter(Boolean));
  return out;
}

/** The block's image ids replaced one by one (ids that map to "" are removed). */
export function mapBlockImages(b: Block, map: (id: string) => string): void {
  if (b.props.image) b.props.image = map(String(b.props.image));
  if (b.props.pics) b.props.pics = String(b.props.pics).split('\n').map((x) => (x.trim() ? map(x.trim()) : '')).join('\n');
}

/** Image ids referenced anywhere in the document, for cleaning up unused stored images and for backups. */
export function referencedImages(doc: Doc): Set<string> {
  const ids = new Set<string>();
  for (const pg of doc.pages) for (const b of pg.blocks) for (const id of blockImages(b)) ids.add(id);
  return ids;
}

// — Several blocks at once (selection, Ablage) —

/** The blocks with these ids, in the order of the document. */
export function blocksOf(doc: Doc, ids: string[]): Block[] {
  const want = new Set(ids);
  return doc.pages.flatMap((pg) => pg.blocks.filter((b) => want.has(b.id)));
}

/** The ids of the selected blocks, in the order of the document. */
export const selectedIds = (doc: Doc, sel: Selection): string[] => (sel?.kind === 'block' ? [sel.id] : sel?.kind === 'blocks' ? blocksOf(doc, sel.ids).map((b) => b.id) : []);

/** A selection of these blocks: none, one or several. */
export function selectionOf(ids: string[]): Selection {
  if (ids.length === 0) return null;
  return ids.length === 1 ? { kind: 'block', id: ids[0] } : { kind: 'blocks', ids };
}

export function deleteBlocks(doc: Doc, ids: string[]): Doc {
  const gone = new Set(ids);
  return produce(doc, (d) => {
    for (const pg of d.pages) pg.blocks = pg.blocks.filter((b) => !gone.has(b.id));
  });
}

/**
 * Copies of blocks with new ids, for pasting and duplicating. With the competences of the module they go into,
 * links to competences of another module are dropped.
 */
export function copyBlocks(blocks: Block[], competences?: string[]): Block[] {
  return blocks.map((b) => {
    const props = { ...b.props };
    if (competences && props.competence && !competences.includes(String(props.competence))) props.competence = '';
    return { ...b, id: uid(), props };
  });
}

/** The blocks from `from` to `to` (both included) in the order of the document, for shift-click. */
export function blockRange(doc: Doc, from: string, to: string): string[] {
  const order = allBlockIds(doc);
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0) return b < 0 ? [] : [to];
  return order.slice(Math.min(a, b), Math.max(a, b) + 1);
}
