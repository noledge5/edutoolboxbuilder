import type { BlockType, Doc, DropTarget, Page, PropValue, Selection } from '../model/types';

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
  /** Starts editing a text right on the page (see sheet/inlineEdit.tsx), selecting its block or page. */
  startEdit(target: string, s: Selection): void;
  addBlock(type: BlockType): void;
  duplicateBlock(id: string): void;
  deleteBlock(id: string): void;
  moveBlock(id: string, dir: -1 | 1): void;
  setSpan(id: string, span: number): void;
  setProp(id: string, key: string, value: PropValue): void;
  setImage(id: string, file: File): void;
  setPage(p: number, patch: Partial<Omit<Page, 'blocks'>>): void;
  setMeta(patch: { icon?: string; footer?: string; code?: string }): void;
  addPage(): void;
  deletePage(p: number): void;
  /** Moves blocks `i`… of page `p` to a new page right after it. */
  splitPage(p: number, i: number): void;
}
