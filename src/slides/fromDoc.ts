// A first set of slides made from the lesson's worksheets: title with the key question, recall questions,
// the tasks of each page, vocabulary cards and the Merksatz as exit slide. The teacher then shortens and
// completes them.
import { BLOCK_TYPES } from '../model/blockTypes';
import { createSlide, type Slide } from '../model/slides';
import { THEMES } from '../model/themes';
import type { Block, Doc, Page } from '../model/types';

const str = (x: unknown) => (typeof x === 'string' ? x : '');

/** Worksheet markup as plain slide text: gaps become "…", answers and marks keep their words. */
export const slideText = (s: string) =>
  s
    .replace(/\[\[(.*?)\]\]/g, '…')
    .replace(/_{3,}/g, '…')
    .replace(/\{\{(.*?)\}\}/g, '$1')
    .replace(/\s+\n/g, '\n')
    .trim();

interface PlanRow {
  minutes: number;
  phase: string;
  text: string;
  form: string;
}

/** Rows of the teacher's lesson plan: "0–5 | Abrufphase | … | Einzel | Material". */
function planRows(blocks: Block[]): PlanRow[] {
  const plan = blocks.find((b) => b.type === 'plan');
  return str(plan?.props.rows)
    .split('\n')
    .map((l) => l.split('|').map((x) => x.trim()))
    .filter((c) => c.length >= 3)
    .map(([time, phase, text, form = '']) => {
      const [a, b] = time.split(/[–-]/).map((n) => parseInt(n, 10));
      return { minutes: Number.isFinite(a) && Number.isFinite(b) && b > a ? b - a : 0, phase, text, form };
    });
}

export function slidesFromDoc(doc: Doc, lessonTitle: string): Slide[] {
  const en = doc.lang === 'en';
  const all = doc.pages.flatMap((p) => p.blocks);
  const rows = planRows(all);
  const rowFor = (...words: string[]) => rows.find((r) => words.some((w) => r.phase.toLowerCase().includes(w)));
  const withPlan = (s: Slide, row: PlanRow | undefined): Slide => (row ? { ...s, minutes: row.minutes || s.minutes, notes: [row.text, s.notes].filter(Boolean).join('\n') } : s);
  const out: Slide[] = [];

  // Title: the lesson and its key question (from the plan) or goal.
  const goal = all.find((b) => b.type === 'goal');
  const start = rowFor('einstieg', 'warm', 'intro');
  const question = /leitfrage:\s*(.+)/i.exec(start?.text ?? '')?.[1];
  out.push({
    ...createSlide('title'),
    title: lessonTitle,
    text: question ?? '',
    notes: [str(goal?.props.goal), str(goal?.props.curriculum)].filter(Boolean).join('\n'),
  });

  // Recall questions of the teacher page, answers on a click.
  const recall = all.find((b) => b.type === 'recall');
  if (recall && str(recall.props.items).trim()) {
    out.push(
      withPlan(
        {
          ...createSlide('list'),
          phase: en ? 'Warm-up' : 'Abrufphase',
          title: en ? 'Remember?' : 'Aus dem Gedächtnis',
          text: '',
          items: slideText(str(recall.props.items)),
        },
        rowFor('abruf', 'warm'),
      ),
    );
  }

  // Each worksheet for the class: its vocabulary as word cards and its tasks as numbered list.
  const merksatz: string[] = [];
  doc.pages
    .filter((p: Page) => p.type !== 'lehrkraft')
    .forEach((p) => {
      const phase = en ? THEMES[p.type].labelEn : THEMES[p.type].label;
      for (const b of p.blocks) {
        if (b.type === 'vocab') {
          const items = str(b.props.rows)
            .split('\n')
            .map((l) => l.split('|').map((x) => x.trim()))
            .filter(([w]) => w)
            .map(([word, , meaning = '']) => `${word} | ${meaning}`)
            .slice(0, 12)
            .join('\n');
          out.push({ ...createSlide('words'), type: p.type, phase, form: p.form, title: str(b.props.title) || p.title, text: '', items, reveal: true });
        }
        if (b.type === 'merksatz') merksatz.push(slideText(str(b.props.text)));
        if (b.type === 'grammar' && str(b.props.rule)) merksatz.push(slideText(str(b.props.rule)));
      }
      const tasks = p.blocks.filter((b) => BLOCK_TYPES[b.type]?.task && str(b.props.prompt).trim()).map((b) => slideText(str(b.props.prompt)));
      if (tasks.length)
        out.push(
          withPlan(
            { ...createSlide('list'), type: p.type, phase, form: p.form, minutes: 0, title: p.title, text: '', items: tasks.slice(0, 6).join('\n'), reveal: false },
            rowFor(p.type === 'versuch' ? 'versuch' : 'erarbeitung', phase.toLowerCase()),
          ),
        );
    });

  // Exit with the Merksatz.
  if (merksatz.length)
    out.push(
      withPlan(
        {
          ...createSlide('exit'),
          phase: 'Exit',
          label: en ? 'Remember' : 'Merksatz',
          title: merksatz[0],
          text: question ? (en ? `Back to the question: ${question}` : `Zurück zur Leitfrage: ${question}`) : '',
        },
        rowFor('sicherung', 'exit'),
      ),
    );
  return out;
}
