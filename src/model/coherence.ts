// The check without AI ("Stunde prüfen" and after taking over a lesson): material numbers (M1, M2 …) on material
// blocks, tasks that name them in their instruction, the learning path ("Lernweg") on the teacher page. It finds
// references to material that is missing or comes only after the task, unused material and repeated task types.
import { BLOCK_TYPES } from './blockTypes';
import { rows, str } from './text';
import type { Block, Doc } from './types';

export interface CoherenceFinding {
  blockId: string | null;
  /** "S2.4": page 2, block 4; empty for the lesson as a whole. */
  ref: string;
  kind: 'material' | 'reihenfolge' | 'unbenutzt' | 'doppelt' | 'abwechslung' | 'ohne-material' | 'lernweg';
  problem: string;
}

export const COHERENCE_KINDS: Record<CoherenceFinding['kind'], string> = {
  material: 'Material fehlt',
  reihenfolge: 'Reihenfolge',
  unbenutzt: 'Material unbenutzt',
  doppelt: 'Nummer doppelt',
  abwechslung: 'Abwechslung',
  'ohne-material': 'Ohne Material',
  lernweg: 'Lernweg',
};

/** "m 1" → "M1"; anything else → "". */
export const matNumber = (s: string) => {
  const m = /^\s*M\s?(\d{1,2})\s*$/i.exec(s);
  return m ? `M${Number(m[1])}` : '';
};

/** The material numbers a text names: "M1", "M 3", ranges "M2–M4" or "M1-3". */
export function materialRefs(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\bM\s?(\d{1,2})(?:\s?[–-]\s?M?\s?(\d{1,2}))?\b/gi)) {
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    for (let n = from; n <= Math.min(to, from + 20); n++) if (!out.includes(`M${n}`)) out.push(`M${n}`);
  }
  return out;
}

const taskLabel = (b: Block) => BLOCK_TYPES[b.type].label;

export function coherence(doc: Doc): CoherenceFinding[] {
  const out: CoherenceFinding[] = [];
  const placed = doc.pages.flatMap((p, pi) => p.blocks.map((block, bi) => ({ block, ref: `S${pi + 1}.${bi + 1}`, teacher: p.type === 'lehrkraft', pi })));
  const student = placed.filter((x) => !x.teacher);
  // Material numbers in reading order; the first block with a number wins.
  const where = new Map<string, number>();
  student.forEach((x, i) => {
    const n = matNumber(str(x.block.props.mat));
    if (!n) return;
    if (where.has(n)) out.push({ blockId: x.block.id, ref: x.ref, kind: 'doppelt', problem: `${n} gibt es schon weiter vorn. Gib diesem Material eine eigene Nummer.` });
    else where.set(n, i);
  });
  const used = new Set<string>();
  let tasks = 0;
  student.forEach((x, i) => {
    if (!BLOCK_TYPES[x.block.type].task) return;
    tasks++;
    const refs = materialRefs(`${str(x.block.props.prompt)} ${str(x.block.props.help)}`);
    refs.forEach((n) => used.add(n));
    const missing = refs.filter((n) => !where.has(n));
    const later = refs.filter((n) => (where.get(n) ?? -1) > i);
    if (missing.length) out.push({ blockId: x.block.id, ref: x.ref, kind: 'material', problem: `Die Aufgabe nennt ${missing.join(', ')}, aber kein Baustein hat diese Material-Nummer.` });
    if (later.length) out.push({ blockId: x.block.id, ref: x.ref, kind: 'reihenfolge', problem: `${later.join(', ')} steht erst nach dieser Aufgabe. Das Material gehört davor.` });
  });
  for (const [n, i] of where) {
    if (!used.has(n)) out.push({ blockId: student[i].block.id, ref: student[i].ref, kind: 'unbenutzt', problem: `Keine Aufgabe nennt ${n}. Lass eine Aufgabe damit arbeiten oder nimm es heraus.` });
  }
  // The same kind of task directly after one of its kind (open questions from the third on); two halves side by side
  // (6 + 6, e.g. two terms compared) count as one.
  let last: Block | undefined;
  let lastPage = -1;
  let run = 0;
  student.forEach((x, i) => {
    if (!BLOCK_TYPES[x.block.type].task) return;
    const prev = student[i - 1]?.block;
    const beside = prev === last && prev !== undefined && prev.span + x.block.span <= 12;
    if (beside && last?.type === x.block.type) return;
    run = x.pi === lastPage && last?.type === x.block.type ? run + 1 : 1;
    if (run === (x.block.type === 'open' ? 3 : 2)) out.push({ blockId: x.block.id, ref: x.ref, kind: 'abwechslung', problem: `${taskLabel(x.block)} kommt mehrmals hintereinander. Wähle eine Aufgabenart, die zum Lernschritt passt.` });
    last = x.block;
    lastPage = x.pi;
  });
  out.sort((a, b) => order(a.ref) - order(b.ref));
  if (tasks >= 2 && where.size === 0) out.push({ blockId: null, ref: '', kind: 'ohne-material', problem: 'Kein Baustein hat eine Material-Nummer (M1, M2 …). Woran arbeiten die Aufgaben? Nummeriere Texte und Abbildungen und nenne sie in den Aufträgen.' });
  // The learning path on the teacher page.
  const teacher = placed.filter((x) => x.teacher);
  const paths = teacher.filter((x) => x.block.type === 'path');
  if (teacher.length && !paths.length && tasks) out.push({ blockId: null, ref: '', kind: 'lernweg', problem: 'Die Lehrkraft-Seite hat keinen Lernweg.' });
  for (const x of paths) {
    const unknown = materialRefs(rows(x.block.props.steps).map((r) => r[0] ?? '').join(' ')).filter((n) => !where.has(n));
    if (unknown.length) out.push({ blockId: x.block.id, ref: x.ref, kind: 'lernweg', problem: `Der Lernweg nennt ${unknown.join(', ')}, aber auf den Blättern gibt es dieses Material nicht.` });
  }
  return out;
}

const order = (ref: string) => {
  const m = /^S(\d+)\.(\d+)$/.exec(ref);
  return m ? Number(m[1]) * 1000 + Number(m[2]) : 0;
};
