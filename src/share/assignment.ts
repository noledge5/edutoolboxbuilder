// Handing out tasks digitally: an assignment is a few pages of a worksheet that students open by link or QR code
// and do on a device. What goes out (`Assignment`, published on GitHub) has the solutions only for practice; what the
// teacher keeps (`Handout`, in the library) has them always, with the private key to read the results.
import { BLOCK_TYPES } from '../model/blockTypes';
import { blockImages } from '../model/ops';
import type { Block, Doc, Lang, SheetType } from '../model/types';
import { stripSolutions, type Answers } from './grade';

export const ASSIGNMENT_FORMAT = 'baukasten-auftrag';

/** Practice: students check each task and try again. Test: they hand in, without solutions. */
export type HandoutMode = 'uebung' | 'test';

export interface AssignmentPage {
  title: string;
  kicker: string;
  type: SheetType;
  blocks: Block[];
}

/** What the class gets (published as JSON). */
export interface Assignment {
  format: typeof ASSIGNMENT_FORMAT;
  v: 1;
  id: string;
  title: string;
  mode: HandoutMode;
  lang: Lang;
  help: boolean;
  icon: string;
  code: string;
  /** Public key of the handout: results are encrypted with it. */
  key: JsonWebKey;
  pages: AssignmentPage[];
  /** Pictures of the blocks as data URLs, by image id. */
  images: Record<string, string>;
  createdAt: number;
}

/** What the teacher keeps: the pages with solutions and the private key. Synced like modules and lessons. */
export interface Handout {
  id: string;
  lessonId: string;
  title: string;
  mode: HandoutMode;
  /** The link for the students. */
  url: string;
  pages: AssignmentPage[];
  privateKey: JsonWebKey;
  createdAt: number;
  updatedAt: number;
}

/** What a student sends (encrypted), again and again while working; the last one counts. */
export interface Submission {
  name: string;
  /** Handed in. */
  done: boolean;
  /** Block id → slot key → answer. */
  answers: Record<string, Answers>;
  /** Practice: the answers at the first check of each block. */
  first: Record<string, Answers>;
  /** Practice: how often each block was checked. */
  checks: Record<string, number>;
  started: number;
  at: number;
}

/** Blocks that stay with the teacher (planning, grading). */
const TEACHER_ONLY = new Set(['plan', 'goal', 'expect', 'recall', 'gradescale', 'tipcards']);

const pageOf = (doc: Doc, p: number, blocks: Block[]): AssignmentPage => ({ title: doc.pages[p].title, kicker: doc.pages[p].kicker, type: doc.pages[p].type, blocks });

/**
 * The pages to hand out: the whole worksheet (`ids` null: all pages for the class), or the chosen blocks, each kept
 * on its page. Blocks for the teacher are left out.
 */
export function handoutPages(doc: Doc, ids: string[] | null): AssignmentPage[] {
  const want = ids ? new Set(ids) : null;
  return doc.pages.map((pg, p) => pageOf(doc, p, pg.type === 'lehrkraft' ? [] : pg.blocks.filter((b) => !TEACHER_ONLY.has(b.type) && (!want || want.has(b.id))))).filter((pg) => pg.blocks.length > 0);
}

/** A title for the handout: one task by its instruction, else the page or lesson title. */
export function handoutTitle(pages: AssignmentPage[], lessonTitle: string): string {
  const blocks = pages.flatMap((p) => p.blocks);
  if (blocks.length === 1) {
    const b = blocks[0];
    const prompt = String(b.props.prompt ?? '').trim();
    return prompt ? (prompt.length > 70 ? prompt.slice(0, 69).trimEnd() + '…' : prompt) : BLOCK_TYPES[b.type].label;
  }
  return pages.length === 1 && pages[0].title ? pages[0].title : lessonTitle;
}

export const handoutImages = (pages: AssignmentPage[]) => [...new Set(pages.flatMap((p) => p.blocks.flatMap(blockImages)))];

/** The copy for the class: in a test without solutions. */
export function studentPages(pages: AssignmentPage[], mode: HandoutMode): AssignmentPage[] {
  if (mode === 'uebung') return pages;
  return pages.map((pg) => ({ ...pg, blocks: pg.blocks.map(stripSolutions) }));
}

/** Tasks of the handout in order, numbered per page as on the sheet. */
export function handoutTasks(pages: AssignmentPage[]): { block: Block; page: number; num: number }[] {
  const out: { block: Block; page: number; num: number }[] = [];
  pages.forEach((pg, p) => {
    let n = 0;
    for (const b of pg.blocks) if (BLOCK_TYPES[b.type]?.task) out.push({ block: b, page: p, num: ++n });
  });
  return out;
}

/** Checks a published assignment as read from the net. */
export function readAssignment(raw: unknown): Assignment | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Partial<Assignment>;
  if (a.format !== ASSIGNMENT_FORMAT || !a.id || !Array.isArray(a.pages) || !a.key) return null;
  return {
    format: ASSIGNMENT_FORMAT,
    v: 1,
    id: String(a.id),
    title: String(a.title ?? ''),
    mode: a.mode === 'test' ? 'test' : 'uebung',
    lang: a.lang === 'en' ? 'en' : 'de',
    help: a.help !== false,
    icon: String(a.icon ?? ''),
    code: String(a.code ?? ''),
    key: a.key,
    pages: a.pages,
    images: a.images && typeof a.images === 'object' ? a.images : {},
    createdAt: Number(a.createdAt) || 0,
  };
}
