// Slides that go along with the lesson's worksheets, in the order of the sheet: a title with the key question and
// the recall questions, then for each page for the class its pictures, flow charts, words, rules and hints, and
// every task on its own slide (number, level, points, instruction, help and entries) with its solution on a click.
// The Merksatz ends the lesson, its gaps filling on a click. The teacher then shortens and completes the slides.
import { BLOCK_TYPES } from '../model/blockTypes';
import { jumble, statements } from '../model/language';
import { sheetNumbers } from '../model/ops';
import { createElement, createSlide, type Slide } from '../model/slides';
import { cellRows, choices, flowSteps, lines, matchNumbers, num, rows, str } from '../model/text';
import { THEMES } from '../model/themes';
import type { Block, Doc, Page } from '../model/types';
import { SHEET_TEXT } from '../sheet/lang';

/** Worksheet markup as plain slide text: gaps become "…", answers and marks keep their words. */
export const slideText = (s: string) =>
  s
    .replace(/\[\[(.*?)\]\]/g, '…')
    .replace(/_{3,}/g, '…')
    .replace(/\{\{(.*?)\}\}/g, '$1')
    .replace(/\s+\n/g, '\n')
    .trim();

/** One line of an entry: no line breaks, and "|" only as the divider before the solution. */
const entry = (s: string) =>
  s
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\|/g, '/')
    .trim();
const pair = (head: string, solution: string) => (solution.trim() ? `${entry(head)} | ${entry(solution)}` : entry(head));

/** Entries per task slide; longer tasks go on to a second slide. */
const TASK_ITEMS = 6;
const WORD_ITEMS = 12;

const TEXT = {
  de: {
    task: 'Aufgabe',
    page: 'S.',
    words: 'Wortspeicher',
    remember: 'Merksatz',
    recall: 'Aus dem Gedächtnis',
    back: 'Zurück zur Leitfrage',
    note: 'Hinweis',
    listen: 'Hörverstehen',
    scan: 'Scanne den Code.',
  },
  en: { task: 'Task', page: 'p.', words: 'Word bank', remember: 'Remember', recall: 'Remember?', back: 'Back to the question', note: 'Note', listen: 'Listening', scan: 'Scan the code.' },
};

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

/** What a task shows on its slide: entries (with gaps or a solution after "|") and a solution text. */
interface TaskBody {
  items: string[];
  solution: string;
  /** For the teacher: checklists, the transcript … */
  notes?: string;
}

/** The entries and solutions of a task, from how the sheet stores them. */
function taskBody(b: Block, en: boolean): TaskBody {
  const p = b.props;
  const t = SHEET_TEXT[en ? 'en' : 'de'];
  switch (b.type) {
    case 'open':
      return { items: [], solution: str(p.solution).trim() };
    case 'mediation':
      return { items: [entry(str(p.source))].filter(Boolean), solution: str(p.solution).trim() };
    case 'mc':
      return { items: choices(p.options).map((o) => pair(o.text, o.correct ? '✓' : '')), solution: '' };
    case 'gap':
      return { items: lines(p.text).map(entry), solution: '' };
    case 'table': {
      const cols = lines(p.cols);
      const sol = cellRows(p.solution);
      const has = sol.some((r) => r.some(Boolean));
      if (!has) return { items: [], solution: '' };
      return {
        items: lines(p.rows).map((r, k) => {
          const cells = (sol[k] ?? []).map((c, j) => (c && cols.length > 2 ? `${cols[j + 1] ?? ''}: ${c}`.replace(/^: /, '') : c)).filter(Boolean);
          return pair(r, cells.join(' · '));
        }),
        solution: '',
      };
    }
    case 'match': {
      const left = lines(p.left);
      const right = lines(p.right);
      const sol = matchNumbers(p.solution);
      return {
        items: left.map((l, i) =>
          pair(
            l,
            right
              .filter((_, r) => sol[r] === i + 1)
              .map(entry)
              .join(' · '),
          ),
        ),
        solution: '',
      };
    }
    case 'foldtest':
      return { items: rows(p.rows).map(([given = '', answer = '']) => pair(given, answer)), solution: '' };
    case 'picvocab':
      return { items: rows(p.items).map(([pic = '', word = '']) => pair(pic || '…', word)), solution: '' };
    case 'wordweb': {
      const center = str(p.center).trim();
      return { items: rows(p.branches).map(([label = '', words = '']) => entry(`**${label}:** ${words}`)), solution: '', notes: center ? `Mitte: ${center}` : '' };
    }
    case 'syntax':
      return {
        items: rows(p.rows)
          .filter((r) => r.some(Boolean))
          .map((r) => entry(r.map((c) => c || '___').join(' '))),
        solution: '',
      };
    case 'jumble':
      return {
        items: lines(p.items).map((l) => {
          const j = jumble(l);
          return pair(j.parts.filter((w) => !/^[.?!]$/.test(w)).join(' / '), j.solution);
        }),
        solution: '',
      };
    case 'transform':
      return { items: rows(p.items).map(([from = '', to = '', answer = '']) => pair(to ? `${from} → ${to}` : from, answer)), solution: '' };
    case 'truefalse':
      return {
        items: statements(str(p.items)).map((s) => pair(s.text, s.answer ? t.tf[['T', 'F', 'NG'].indexOf(s.answer)] : '')),
        solution: '',
      };
    case 'bingo':
      return { items: lines(p.items).map(entry), solution: '' };
    case 'writing': {
      const check = lines(p.checklist);
      return { items: lines(p.starters).map(entry), solution: '', notes: check.length ? `${t.checklist}: ${check.join(' · ')}` : '' };
    }
    default:
      return { items: [], solution: str(p.solution).trim() };
  }
}

/** The line above a task: "Aufgabe 2 · S. 3 · ★★☆ · 4 P." */
function taskLabel(b: Block, n: number, page: number | null, withPage: boolean, en: boolean): string {
  const tx = TEXT[en ? 'en' : 'de'];
  const level = Math.min(3, Math.max(0, num(b.props.level, 0)));
  const points = num(b.props.points, 0) + num(b.props.langPoints, 0);
  return [`${tx.task} ${n}`, withPage && page ? `${tx.page} ${page}` : '', level ? '★'.repeat(level) + '☆'.repeat(3 - level) : '', points ? `${points} ${SHEET_TEXT[en ? 'en' : 'de'].points}` : '']
    .filter(Boolean)
    .join(' · ');
}

const chunks = <T>(list: T[], size: number): T[][] => (list.length ? Array.from({ length: Math.ceil(list.length / size) }, (_, k) => list.slice(k * size, (k + 1) * size)) : [[]]);

export function slidesFromDoc(doc: Doc, lessonTitle: string): Slide[] {
  const en = doc.lang === 'en';
  const tx = TEXT[en ? 'en' : 'de'];
  const all = doc.pages.flatMap((p) => p.blocks);
  const plan = planRows(all);
  const used = new Set<PlanRow>();
  /** The plan row of a phase, each row for one slide only. */
  const rowFor = (...words: string[]) => {
    const row = plan.find((r) => !used.has(r) && words.some((w) => w && r.phase.toLowerCase().includes(w)));
    if (row) used.add(row);
    return row;
  };
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
          title: tx.recall,
          text: '',
          items: slideText(str(recall.props.items)),
        },
        rowFor('abruf', 'warm'),
      ),
    );
  }

  // Each page for the class, block by block.
  const numbers = sheetNumbers(doc);
  const pages = doc.pages.map((p, i) => ({ p, page: numbers[i] })).filter(({ p }) => p.type !== 'lehrkraft');
  const withPage = pages.filter(({ p }) => p.blocks.some((b) => BLOCK_TYPES[b.type]?.task)).length > 1;
  const merksatz: string[] = [];

  pages.forEach(({ p, page }: { p: Page; page: number | null }) => {
    const phase = en ? THEMES[p.type].labelEn : THEMES[p.type].label;
    const base = { type: p.type, phase, form: p.form, minutes: 0 } as const;
    const first = out.length;
    let heading = '';
    let taskNo = 0;
    /** A picture waiting for the task right after it. */
    let picture: { image: string; source: string } | null = null;

    p.blocks.forEach((b, k) => {
      const props = b.props;
      const next = p.blocks[k + 1];
      if (b.type === 'heading') heading = str(props.text);

      if (BLOCK_TYPES[b.type]?.task) {
        taskNo++;
        const body = taskBody(b, en);
        const help = doc.help === false ? '' : str(props.help).trim();
        const tip = str(props.tip).trim();
        const notes = [body.notes, tip && `Tipp: ${tip}`].filter(Boolean).join('\n');
        const label = taskLabel(b, taskNo, page, withPage, en);
        const parts = chunks(body.items, TASK_ITEMS);
        parts.forEach((items, c) => {
          const last = c === parts.length - 1;
          out.push({
            ...createSlide('task'),
            ...base,
            label: parts.length > 1 ? `${label} · ${c + 1}/${parts.length}` : label,
            title: slideText(str(props.prompt)) || BLOCK_TYPES[b.type].label,
            help: c === 0 ? help : '',
            items: items.join('\n'),
            text: last ? body.solution : '',
            image: c === 0 && picture ? picture.image : '',
            source: c === 0 && picture ? picture.source : '',
            reveal: true,
            notes,
          });
        });
        picture = null;
        return;
      }

      switch (b.type) {
        case 'image': {
          const image = str(props.image);
          const source = str(props.source);
          // A picture right before a task goes on the task's slide.
          if (image && next && BLOCK_TYPES[next.type]?.task) {
            picture = { image, source };
            break;
          }
          if (!image && !str(props.search).trim()) break;
          const caption = str(props.caption).replace(/^\s*(Abb\.|Abbildung|Fig\.|Figure)\s*\d*\s*[:.]?\s*/i, '');
          const beside = [p.blocks[k - 1], next].find((x) => x?.type === 'text' && str(x.props.text).length <= 320);
          out.push({ ...createSlide('image'), ...base, title: caption || heading || p.title, text: beside ? str(beside.props.text) : '', image, source });
          break;
        }
        case 'flow': {
          const steps = flowSteps(props.steps);
          if (steps.length)
            out.push({
              ...createSlide('flow'),
              ...base,
              title: heading || p.title,
              text: '',
              items: steps
                .slice(0, 5)
                .map((s) => pair(s.title, s.sub))
                .join('\n'),
              reveal: false,
            });
          break;
        }
        case 'vocab':
        case 'phrases':
        case 'reading': {
          const list =
            b.type === 'vocab'
              ? rows(props.rows).map(([word = '', , meaning = '']) => pair(word, meaning))
              : b.type === 'phrases'
                ? rows(props.items).map(([a = '', de = '']) => pair(a, de))
                : rows(props.glossary).map(([word = '', meaning = '']) => pair(word, meaning));
          chunks(list.filter(Boolean), WORD_ITEMS).forEach((items) => {
            if (items.length) out.push({ ...createSlide('words'), ...base, title: str(props.title) || heading || p.title, text: '', items: items.join('\n'), reveal: true });
          });
          break;
        }
        case 'wordbank': {
          const words = lines(props.words)
            .flatMap((l) => (l.includes(',') ? l.split(',') : [l]))
            .map(entry)
            .filter(Boolean);
          if (words.length) out.push({ ...createSlide('words'), ...base, title: tx.words, text: '', items: words.slice(0, WORD_ITEMS).join('\n'), reveal: false });
          break;
        }
        case 'grammar': {
          const rule = str(props.rule).trim();
          const signal = str(props.signal).trim();
          const examples = lines(props.examples);
          if (rule)
            out.push({
              ...createSlide('statement'),
              ...base,
              label: str(props.title),
              title: rule,
              text: [signal && `**${en ? 'Signal words' : 'Signalwörter'}:** ${signal}`, ...examples].filter(Boolean).join('\n'),
            });
          break;
        }
        case 'hint': {
          const text = str(props.text).trim();
          if (text) out.push({ ...createSlide('statement'), ...base, label: '', title: str(props.title) || tx.note, text });
          break;
        }
        case 'merksatz': {
          const text = str(props.text).trim();
          // The first Merksatz ends the lesson; more of them stay where they are on the sheet.
          if (text && merksatz.length) out.push({ ...createSlide('statement'), ...base, label: tx.remember, title: text, text: '', reveal: true });
          if (text) merksatz.push(text);
          break;
        }
        case 'qr': {
          const url = str(props.url).trim();
          if (/^https?:\/\/\S+\.\S+/.test(url))
            out.push({
              ...createSlide('blank'),
              ...base,
              title: str(props.caption) || tx.scan,
              elements: [createElement('qr', { x: 96, y: 360, w: 540, h: 540, text: '', url })],
            });
          break;
        }
        case 'listening': {
          const url = str(props.url).trim();
          const note = str(props.note).trim();
          out.push({
            ...createSlide('statement'),
            ...base,
            label: [tx.listen, str(props.track)].filter(Boolean).join(' · '),
            title: note || tx.listen,
            text: '',
            elements: /^https?:\/\/\S+\.\S+/.test(url) ? [createElement('qr', { x: 1400, y: 420, w: 400, h: 460, text: '', url })] : [],
            notes: str(props.transcript),
          });
          break;
        }
        case 'selfcheck': {
          const items = lines(props.items).map(entry);
          if (items.length) out.push({ ...createSlide('list'), ...base, title: str(props.title) || heading || p.title, text: '', items: items.slice(0, 8).join('\n'), reveal: false });
          break;
        }
      }
    });

    // The first slide of the page gets the plan's time and what happens in that phase.
    if (out.length > first) out[first] = withPlan(out[first], rowFor(p.type === 'versuch' ? 'versuch' : 'erarbeitung', phase.toLowerCase(), p.type === 'sicherung' ? 'sicherung' : ''));
  });

  // Exit with the Merksatz, its gaps filling on a click; the expectations for the talk go into the notes.
  const expect = all.find((b) => b.type === 'expect');
  const expected = rows(expect?.props.items)
    .map(([kind = '', said = '', why = '']) => [kind && `${kind}:`, said, why && `→ ${why}`].filter(Boolean).join(' '))
    .join('\n');
  if (merksatz.length)
    out.push(
      withPlan(
        {
          ...createSlide('exit'),
          phase: 'Exit',
          label: tx.remember,
          title: merksatz[0],
          text: question ? `${tx.back}: ${question}` : '',
          reveal: true,
          notes: expected,
        },
        rowFor('sicherung', 'exit'),
      ),
    );
  else if (expected) out[0] = { ...out[0], notes: [out[0].notes, expected].filter(Boolean).join('\n') };
  return out;
}
