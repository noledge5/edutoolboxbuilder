// Data model of a worksheet document. The same shape is the JSON import/export format
// (see docs/design/README.md, "State Management").

export type SheetType = 'uebung' | 'versuch' | 'sicherung' | 'lehrkraft' | 'vocab' | 'grammar' | 'listening' | 'speaking' | 'test';

/** Language of a worksheet: labels on the sheet, quotation marks, hyphenation and spell check. */
export type Lang = 'de' | 'en';

export type WorkForm = 'allein' | 'zu zweit' | 'Gruppe' | 'Plenum';

export type Variant = 'accent-2' | 'accent' | 'neutral' | 'accent-3' | 'accent-4' | 'accent-5' | 'accent-6' | 'accent-7';

/** Name line under the header band: Name + Datum, Namen (pairs/groups) + Datum, Name + Klasse + Datum, or none. */
export type NameField = 'name' | 'namen' | 'klasse' | 'aus';

export type BlockType =
  | 'heading'
  | 'text'
  | 'hint'
  | 'merksatz'
  | 'wordbank'
  | 'image'
  | 'flow'
  | 'qr'
  | 'open'
  | 'mc'
  | 'gap'
  | 'table'
  | 'match'
  | 'draw'
  | 'selfcheck'
  | 'plan'
  | 'goal'
  | 'hook'
  | 'expect'
  | 'recall'
  | 'vocab'
  | 'foldtest'
  | 'picvocab'
  | 'wordweb'
  | 'grammar'
  | 'forms'
  | 'jumble'
  | 'transform'
  | 'syntax'
  | 'listening'
  | 'reading'
  | 'truefalse'
  | 'phrases'
  | 'rolecards'
  | 'bingo'
  | 'writing'
  | 'mediation'
  | 'gradescale'
  | 'tipcards';

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
  nameField: NameField;
  /** Back of the page before it (double-sided sheet): a slim header with the front's title instead of the band. */
  back?: boolean;
  blocks: Block[];
}

export interface Doc {
  /** Topic icon in the header band, shared by all pages (a key from src/topicIcons.ts). */
  icon: string;
  /** Language of the sheets (from the module). */
  lang: Lang;
  /** Show the German help under task instructions (from the module). */
  help: boolean;
  /** Footer text, shared by all pages. */
  footer: string;
  /** Short code such as "K9 · M1 · S2", shared by all pages. */
  code: string;
  pages: Page[];
}

/** Nothing, a page (its header), one block, or several blocks (in document order). */
export type Selection = null | { kind: 'page'; p: number } | { kind: 'block'; id: string } | { kind: 'blocks'; ids: string[] };

export type DropPos = 'before' | 'after' | 'end';

/** Where a dragged block will land: before/after block `i` of page `p`, or at the end of page `p`. */
export interface DropTarget {
  p: number;
  i: number;
  pos: DropPos;
}

/** What is dragged: a new block from the toolbox, a block on the page, or an entry of the Ablage. */
export type DragItem = { kind: 'new'; type: BlockType } | { kind: 'move'; id: string } | { kind: 'clip'; id: string };
