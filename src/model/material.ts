// Materials (M1, M2 …): texts, pictures, diagrams, reading texts and videos that the tasks refer to ("Werte M2 aus").
// They are numbered per sheet, a front page together with its backs, in the order they appear; each block of these
// types has the switch `material` ("ja"/"nein").
import type { Block, BlockType, Page } from './types';

/** Block types that can be a material. */
export const MATERIAL_TYPES = new Set<BlockType>(['text', 'hint', 'image', 'chart', 'flow', 'qr', 'code', 'reading']);

export const isMaterial = (b: Block) => MATERIAL_TYPES.has(b.type) && b.props.material === 'ja';

/** First page of the sheet that page `p` belongs to (its front, if `p` is a back). */
function sheetStart(pages: Page[], p: number): number {
  let k = p;
  while (k > 0 && pages[k]?.back) k--;
  return k;
}

/** Material number of each material on page `p`, by block id. Teacher pages have none. */
export function materialNumbers(pages: Page[], p: number): Map<string, number> {
  const out = new Map<string, number>();
  if (!pages[p] || pages[p].type === 'lehrkraft') return out;
  let n = 0;
  for (let k = sheetStart(pages, p); k <= p; k++)
    for (const b of pages[k].blocks)
      if (isMaterial(b)) {
        n++;
        if (k === p) out.set(b.id, n);
      }
  return out;
}
