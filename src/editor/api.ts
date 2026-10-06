import type { BlockContext } from '../ai/helpers';
import type { TaskContext } from '../ai/task';
import type { Block, BlockProps, BlockType, Doc, DropTarget, Page, PropValue, Selection } from '../model/types';

/** State and actions the editor hands to its parts (canvas, panel, toolbox). */
export interface EditorApi {
  doc: Doc;
  sel: Selection;
  editing: boolean;
  drop: DropTarget | null;
  /** Icon and code come from the module in the library (not edited per worksheet). */
  codeLocked: boolean;
  /** The module's competences, for linking tasks. */
  competences: { id: string; area: string }[];
  select(s: Selection): void;
  /** Choosing several blocks by tapping them (started from a block's toolbar, for the iPad). */
  picking: boolean;
  /** A block joins the selection or leaves it; `range`: all blocks from the one clicked last up to it (⇧-click). */
  pickBlock(id: string, range: boolean): void;
  /** Starts choosing several blocks, with this one. */
  startPicking(id: string): void;
  /** Puts blocks into the Ablage, for pasting them here or in another lesson. */
  toAblage(ids: string[]): void;
  /** Hands out blocks digitally (in the library only). */
  share?(ids: string[]): void;
  /** Starts editing a text right on the page (see sheet/inlineEdit.tsx), selecting its block or page. */
  startEdit(target: string, s: Selection): void;
  addBlock(type: BlockType): void;
  duplicateBlock(id: string): void;
  deleteBlock(id: string): void;
  moveBlock(id: string, dir: -1 | 1): void;
  setSpan(id: string, span: number): void;
  setProp(id: string, key: string, value: PropValue): void;
  /** Stores the image file and sets it, together with `props` (e.g. the source line), in one step. */
  setImage(id: string, file: File, props?: Record<string, string>): void;
  /** Sets several props at once (one undo step). */
  setProps(id: string, props: BlockProps): void;
  /** Stores an image as picture `index` of a picture grid (prop "pics", one id per line). */
  setPic(id: string, index: number, file: File): void;
  setPage(p: number, patch: Partial<Omit<Page, 'blocks'>>): void;
  setMeta(patch: Partial<Pick<Doc, 'icon' | 'footer' | 'code' | 'lang' | 'help'>>): void;
  addPage(): void;
  deletePage(p: number): void;
  /** Moves blocks `i`… of page `p` to a new page right after it. */
  splitPage(p: number, i: number): void;
  /** Puts `blocks` right after block `id` (one undo step) and selects them. */
  insertAfter(id: string, blocks: Block[]): void;
  /** Puts `blocks` in place of block `id` (one undo step). */
  replaceBlock(id: string, blocks: Block[]): void;
  /** Where a block sits, for Claude's helpers (in the library only). */
  helperContext?(id: string): BlockContext | null;
  /** The task's surroundings for Claude (block `id`, or the insertion point when null); in the library only. */
  taskContext?(id: string | null): TaskContext | null;
}
