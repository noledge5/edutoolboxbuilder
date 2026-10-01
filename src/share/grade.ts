// Digital tasks: each task block is cut into parts the student answers (slots), with the answers stored on the
// worksheet as the expected ones. The student view draws the slots, the teacher's evaluation grades them; a test
// copy for the students has the solutions taken out (`stripSolutions`). Pure, so it is tested without a browser.
import { BLOCK_TYPES } from '../model/blockTypes';
import { jumble, statements } from '../model/language';
import { cellRows, choices, lines, matchNumbers, rows, segments, str } from '../model/text';
import type { Block } from '../model/types';

export type SlotKind =
  /** A word or phrase to type. */
  | 'text'
  /** One of `options` (radio buttons). */
  | 'choice'
  /** Several of `options` (check boxes); the answer is the chosen values joined by "|". */
  | 'multi'
  /** Parts put in order; the answer is the sentence. */
  | 'order'
  /** Free writing, not graded. */
  | 'free';

export interface Slot {
  key: string;
  kind: SlotKind;
  /** The expected answer ('' when there is none: then the slot is not graded). */
  expected: string;
  /** For choice and multi: the values with their labels. For order: the parts. */
  options?: { v: string; l: string }[];
  /** What the slot is about, for the list of frequent mistakes ("Glas A …", "2. Lücke"). */
  label: string;
}

/** Task blocks that can be answered on a device; others show as on the sheet (or "auf Papier"). */
export const DIGITAL_TASKS = new Set(['mc', 'gap', 'truefalse', 'match', 'table', 'open', 'jumble', 'transform', 'foldtest', 'picvocab', 'wordweb', 'syntax', 'mediation', 'writing']);

/** Gaps in a line: `[[answer]]`, or `___` without an answer. */
const gapsOf = (text: string) => segments(text).filter((s) => s.blank);

/** All slots of a task block, in reading order. */
export function taskSlots(b: Block): Slot[] {
  const p = b.props;
  switch (b.type) {
    case 'gap': {
      return gapsOf(str(p.text)).map((g, i) => ({ key: `g${i}`, kind: 'text', expected: g.solution ?? '', label: `${i + 1}. Lücke` }));
    }
    case 'mc': {
      const cs = choices(p.options);
      const right = cs.flatMap((c, i) => (c.correct ? [String(i)] : []));
      const options = cs.map((c, i) => ({ v: String(i), l: c.text }));
      return [{ key: 'a', kind: right.length > 1 ? 'multi' : 'choice', expected: right.join('|'), options, label: str(p.prompt) || 'Ankreuzen' }];
    }
    case 'truefalse': {
      const keys = str(p.mode) !== 'tf' ? ['T', 'F', 'NG'] : ['T', 'F'];
      const labels: Record<string, string> = { T: 'richtig', F: 'falsch', NG: 'steht nicht im Text' };
      return statements(str(p.items)).map((s, i) => ({ key: `s${i}`, kind: 'choice', expected: s.answer, options: keys.map((k) => ({ v: k, l: labels[k] })), label: s.text }));
    }
    case 'match': {
      const left = lines(p.left);
      const sol = matchNumbers(p.solution);
      return lines(p.right).map((r, j) => ({
        key: `m${j}`,
        kind: 'choice',
        expected: sol[j] ? String(sol[j]) : '',
        options: left.map((l, i) => ({ v: String(i + 1), l })),
        label: r,
      }));
    }
    case 'table': {
      const cols = lines(p.cols);
      const sol = cellRows(p.solution);
      return lines(p.rows).flatMap((r, k) => cols.slice(1).map((c, j) => ({ key: `t${k}-${j}`, kind: 'text' as const, expected: sol[k]?.[j] ?? '', label: `${r} · ${c}` })));
    }
    case 'open':
    case 'mediation':
      return [{ key: 'a', kind: 'free', expected: '', label: str(p.prompt) || BLOCK_TYPES[b.type].label }];
    case 'writing':
      return [{ key: 'a', kind: 'free', expected: '', label: str(p.prompt) || 'Schreibrahmen' }];
    case 'jumble':
      return lines(p.items).map((line, i) => {
        const j = jumble(line);
        return { key: `j${i}`, kind: 'order', expected: j.solution, options: j.parts.map((part, k) => ({ v: String(k), l: part })), label: j.solution || j.parts.join(' / ') };
      });
    case 'transform':
      return rows(p.items).map(([source = '', target = '', solution = ''], i) => ({ key: `x${i}`, kind: 'text', expected: solution, label: target ? `${source} → ${target}` : source }));
    case 'foldtest':
      return rows(p.rows).map(([given = '', wanted = ''], i) => ({ key: `f${i}`, kind: 'text', expected: wanted, label: given }));
    case 'picvocab':
      return rows(p.items).map(([, word = ''], i) => ({ key: `p${i}`, kind: 'text', expected: word, label: `${i + 1}. Bild` }));
    case 'wordweb':
      return rows(p.branches).flatMap(([head = '', words = ''], i) =>
        words
          .split(',')
          .map((w) => w.trim())
          .flatMap((w, k) => (gapsOf(w).length ? [{ key: `w${i}-${k}`, kind: 'text' as const, expected: gapsOf(w)[0].solution ?? '', label: head }] : [])),
      );
    case 'syntax': {
      const cols = lines(p.cols);
      return rows(p.rows).flatMap((cells, i) =>
        cells.flatMap((c, k) =>
          c === '' || gapsOf(c).length ? [{ key: `y${i}-${k}`, kind: 'text' as const, expected: gapsOf(c)[0]?.solution ?? '', label: `${i + 1}. Satz · ${cols[k] ?? ''}` }] : [],
        ),
      );
    }
    default:
      return [];
  }
}

/** A typed answer as compared: no case, no outer spaces or end punctuation, one kind of apostrophe and quote. */
export const normalize = (s: string) =>
  s
    .normalize('NFC')
    .replace(/[’‘´`]/g, "'")
    .replace(/[„“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?;:,]+$/, '')
    .trim()
    .toLowerCase();

/** Whether an answer is right; null when the slot is not graded (free writing, no expected answer). */
export function isRight(slot: Slot, given: string | undefined): boolean | null {
  if (slot.kind === 'free' || !slot.expected) return null;
  const g = given ?? '';
  if (slot.kind === 'multi') {
    const want = slot.expected.split('|').sort().join('|');
    return g.split('|').filter(Boolean).sort().join('|') === want;
  }
  if (slot.kind === 'choice') return g === slot.expected;
  // Typed or ordered: alternatives in the solution as "a / b" count each.
  const alts = slot.kind === 'text' ? slot.expected.split(/\s+\/\s+/) : [slot.expected];
  return alts.some((a) => normalize(a) === normalize(g));
}

export type Answers = Record<string, string>;

export interface TaskGrade {
  /** Graded slots answered right, and all graded slots. */
  right: number;
  total: number;
  slots: { key: string; ok: boolean | null; given: string }[];
}

export function gradeTask(b: Block, answers: Answers = {}): TaskGrade {
  const slots = taskSlots(b).map((s) => ({ key: s.key, ok: isRight(s, answers[s.key]), given: answers[s.key] ?? '' }));
  const graded = slots.filter((s) => s.ok !== null);
  return { right: graded.filter((s) => s.ok).length, total: graded.length, slots };
}

/** How an answer reads for the teacher: the labels of chosen options, else the text. */
export function answerText(slot: Slot, given: string): string {
  if (!given) return '';
  if (slot.kind === 'choice' || slot.kind === 'multi') {
    return given
      .split('|')
      .map((v) => slot.options?.find((o) => o.v === v)?.l ?? v)
      .join(', ');
  }
  return given;
}

/** The expected answer as the teacher reads it. */
export const expectedText = (slot: Slot) => answerText(slot, slot.expected);

// — The copy for a test: the structure stays, the solutions go —

const noGapAnswers = (s: string) => s.replace(/\[\[[^\]\n]*\]\]/g, '[[]]');

/** A block without its solutions (for a test the students cannot look them up in the page source). */
export function stripSolutions(b: Block): Block {
  const p = { ...b.props };
  const set = (key: string, v: string) => (p[key] = v);
  switch (b.type) {
    case 'gap':
      set('text', noGapAnswers(str(p.text)));
      break;
    case 'mc':
      set(
        'options',
        choices(p.options)
          .map((c) => c.text)
          .join('\n'),
      );
      break;
    case 'truefalse':
      set(
        'items',
        statements(str(p.items))
          .map((s) => s.text)
          .join('\n'),
      );
      break;
    case 'match':
    case 'table':
    case 'open':
    case 'mediation':
      set('solution', '');
      break;
    case 'jumble':
      // The parts in their printed order, without the sentence.
      set(
        'items',
        lines(p.items)
          .map((l) => jumble(l).parts.join(' / '))
          .join('\n'),
      );
      break;
    case 'transform':
      set(
        'items',
        rows(p.items)
          .map(([a = '', b2 = '']) => `${a} | ${b2}`)
          .join('\n'),
      );
      break;
    case 'foldtest':
      set(
        'rows',
        rows(p.rows)
          .map(([a = '']) => a)
          .join('\n'),
      );
      break;
    case 'picvocab':
      set(
        'items',
        rows(p.items)
          .map(([e = '']) => `${e} |`)
          .join('\n'),
      );
      break;
    case 'wordweb':
      set('branches', noGapAnswers(str(p.branches)));
      break;
    case 'listening':
      set('transcript', '');
      break;
  }
  // Gaps with answers anywhere else too (Merksatz, Formentabelle, Wortnetz, Satzbaustellen, Rollenkarten …).
  for (const [k, v] of Object.entries(p)) if (typeof v === 'string' && v.includes('[[')) p[k] = noGapAnswers(v);
  return { ...b, props: p };
}
