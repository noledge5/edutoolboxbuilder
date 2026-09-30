// The Ablage: blocks put aside to paste them into another lesson (⌘C, "In die Ablage"). It is kept on this
// device until emptied, the last MAX_CLIPS entries; it does not travel with backups or the sync.
import { blockText } from '../library/search';
import { BLOCK_TYPES } from './blockTypes';
import { normalizeDoc } from './normalize';
import { blockImages, uid } from './ops';
import type { Block } from './types';

export interface Clip {
  id: string;
  /** When it was put into the Ablage. */
  at: number;
  /** One or several blocks, in the order of the worksheet they come from. */
  blocks: Block[];
  /** Where they come from, e.g. "Stunde 2: Treibhauseffekt". */
  from: string;
}

export const MAX_CLIPS = 20;

/** The Ablage with a new entry on top; the oldest go beyond MAX_CLIPS. */
export function addClip(clips: Clip[], blocks: Block[], from: string, at: number): Clip[] {
  if (!blocks.length) return clips;
  const clip: Clip = { id: uid(), at, blocks: blocks.map((b) => ({ ...b, props: { ...b.props } })), from };
  return [clip, ...clips].slice(0, MAX_CLIPS);
}

/** "Lückentext" or "3 Bausteine". */
export const clipLabel = (c: Clip) => (c.blocks.length === 1 ? BLOCK_TYPES[c.blocks[0].type].label : `${c.blocks.length} Bausteine`);

/** The first text of the entry, to recognise it. */
export function clipText(c: Clip): string {
  for (const b of c.blocks) {
    const [t] = blockText(b);
    if (t) return t.split('\n')[0];
  }
  return '';
}

/** Images the Ablage still needs (they must not be cleaned up). */
export const clipImages = (clips: Clip[]) => clips.flatMap((c) => c.blocks.flatMap(blockImages));

/** The Ablage as stored; entries that cannot be read are left out. */
export function readClips(raw: unknown): Clip[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((c): Clip[] => {
    if (!c || typeof c !== 'object' || !Array.isArray((c as Clip).blocks)) return [];
    const e = c as Partial<Clip>;
    let blocks: Block[];
    try {
      blocks = normalizeDoc({ pages: [{ blocks: e.blocks }] }).pages[0].blocks;
    } catch {
      return [];
    }
    if (!blocks.length) return [];
    return [{ id: typeof e.id === 'string' ? e.id : uid(), at: Number(e.at) || 0, blocks, from: typeof e.from === 'string' ? e.from : '' }];
  });
}
