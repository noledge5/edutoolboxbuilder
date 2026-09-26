import type { BlockType, Doc, DropTarget, Page, PropValue, Selection } from '../model/types';

/** State and actions the editor hands to its parts (canvas, panel, toolbox). */
export interface EditorApi {
  doc: Doc;
  sel: Selection;
  editing: boolean;
  drop: DropTarget | null;
  select(s: Selection): void;
  addBlock(type: BlockType): void;
  duplicateBlock(id: string): void;
  deleteBlock(id: string): void;
  moveBlock(id: string, dir: -1 | 1): void;
  setSpan(id: string, span: number): void;
  setProp(id: string, key: string, value: PropValue): void;
  setImage(id: string, file: File): void;
  setPage(p: number, patch: Partial<Omit<Page, 'blocks'>>): void;
  setMeta(patch: { footer?: string; code?: string }): void;
  addPage(): void;
  deletePage(p: number): void;
}
