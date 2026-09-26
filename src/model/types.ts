// Data model of a worksheet document. The same shape is the JSON import/export format
// (see docs/design/README.md, "State Management").

export type SheetType = 'uebung' | 'versuch' | 'sicherung' | 'lehrkraft';

export type WorkForm = 'allein' | 'zu zweit' | 'Gruppe' | 'Plenum';

export type Variant = 'accent-2' | 'accent' | 'neutral';

export type BlockType =
  | 'heading'
  | 'text'
  | 'hint'
  | 'merksatz'
  | 'wordbank'
  | 'image'
  | 'flow'
  | 'open'
  | 'mc'
  | 'gap'
  | 'table'
  | 'match'
  | 'draw';

export type PropValue = string | number;

export type BlockProps = Record<string, PropValue>;

export interface Block {
  id: string;
  type: BlockType;
  /** Columns of the 12-column page grid (1–12). The editor offers 12, 8, 6 and 4. */
  span: number;
  props: BlockProps;
}

export interface Page {
  title: string;
  kicker: string;
  type: SheetType;
  form: WorkForm;
  nameField: boolean;
  blocks: Block[];
}

export interface Doc {
  /** Footer text, shared by all pages. */
  footer: string;
  /** Short code such as "K9 · M1 · S2", shared by all pages. */
  code: string;
  pages: Page[];
}

export type Selection = null | { kind: 'page'; p: number } | { kind: 'block'; id: string };

export type DropPos = 'before' | 'after' | 'end';

/** Where a dragged block will land: before/after block `i` of page `p`, or at the end of page `p`. */
export interface DropTarget {
  p: number;
  i: number;
  pos: DropPos;
}

export type DragItem = { kind: 'new'; type: BlockType } | { kind: 'move'; id: string };
