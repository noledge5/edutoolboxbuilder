// Drop-target detection from the pointer position. Uses the DOM directly (elementFromPoint),
// so it stays correct while the canvas scrolls or is zoomed.
import { findBlock, moveBlockTo } from '../model/ops';
import type { Doc, DragItem, DropTarget } from '../model/types';

export function dropTargetAt(x: number, y: number, doc: Doc, item: DragItem): DropTarget | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const blockEl = el.closest<HTMLElement>('[data-block-id]');
  if (blockEl) {
    const id = blockEl.dataset.blockId!;
    const loc = findBlock(doc, id);
    if (!loc) return null;
    const r = blockEl.getBoundingClientRect();
    // Partial-width blocks sit side by side: the x position decides. Full-width blocks stack: y decides.
    const partial = doc.pages[loc.p].blocks[loc.i].span < 12;
    const before = partial ? x < r.left + r.width / 2 : y < r.top + r.height / 2;
    const target: DropTarget = { p: loc.p, i: loc.i, pos: before ? 'before' : 'after' };
    return item.kind === 'move' && isNoop(doc, item.id, target) ? null : target;
  }

  const body = el.closest<HTMLElement>('[data-page-body]');
  if (body) {
    const p = Number(body.dataset.pageBody);
    if (!doc.pages[p]) return null;
    const target: DropTarget = { p, i: doc.pages[p].blocks.length, pos: 'end' };
    return item.kind === 'move' && isNoop(doc, item.id, target) ? null : target;
  }
  return null;
}

/** True when moving the block there would leave it where it is. */
const isNoop = (doc: Doc, id: string, t: DropTarget) => moveBlockTo(doc, id, t) === doc;

export const sameDrop = (a: DropTarget | null, b: DropTarget | null) =>
  a === b || (!!a && !!b && a.p === b.p && a.i === b.i && a.pos === b.pos);
