// Slides for a lesson, suggested along its course (the Stundenverlauf on the teacher page) rather than mirroring the
// worksheet: a title; the recall of earlier lessons where the plan has a recall phase (spaced: the last lesson, an
// earlier one, an earlier module); the beginning after its kind (block "hook") and the key question; for each work
// phase a slide with the short instruction, the time, the work form and its steps (its timer starts by itself), the
// material to look at first and the tasks of that phase for the discussion, their solutions under cards; at the end
// the Merksatz. The teacher sees the suggestion as a list to tick (SuggestDialog) before the slides are made.
import { BLOCK_TYPES, HOOK_KINDS } from '../model/blockTypes';
import { jumble, statements } from '../model/language';
import { sheetNumbers } from '../model/ops';
import { createElement, createSlide, type Slide } from '../model/slides';
import { cellRows, choices, flowSteps, lines, matchNumbers, num, rows, str } from '../model/text';
import { THEMES } from '../model/themes';
import type { Block, Doc, Page, SheetType, WorkForm } from '../model/types';
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
/** Questions on the recall slide. */
const RECALL_ITEMS = 3;

const TEXT = {
  de: {
    task: 'Aufgabe',
    tasks: 'Aufgaben',
    page: 'S.',
    sheet: 'Arbeitsblatt',
    words: 'Wortspeicher',
    remember: 'Merksatz',
    recall: 'Aus dem Gedächtnis',
    journal: 'Schreibt die Antworten ins Lernjournal.',
    back: 'Zurück zur Leitfrage',
    question: 'Leitfrage',
    note: 'Hinweis',
    listen: 'Hörverstehen',
    scan: 'Scanne den Code.',
    discuss: 'Besprechung',
    exitCheck: 'Was weißt du jetzt?',
    tipcards: 'Tippkarten liegen am Pult.',
    look: 'Schaut genau hin.',
    guess: 'Was vermutet ihr?',
    know: 'Was wisst ihr schon?',
    agree: 'Stimme zu',
    disagree: 'Stimme nicht zu',
    who: { allein: 'Ich', 'zu zweit': 'Du', Gruppe: 'Gruppe', Plenum: 'Wir' } as Record<WorkForm, string>,
  },
  en: {
    task: 'Task',
    tasks: 'Tasks',
    page: 'p.',
    sheet: 'Worksheet',
    words: 'Word bank',
    remember: 'Remember',
    recall: 'Remember?',
    journal: 'Write the answers in your exercise book.',
    back: 'Back to the question',
    question: 'Key question',
    note: 'Note',
    listen: 'Listening',
    scan: 'Scan the code.',
    discuss: 'Feedback',
    exitCheck: 'What do you know now?',
    tipcards: 'Tip cards are on the teacher’s desk.',
    look: 'Look closely.',
    guess: 'What do you think?',
    know: 'What do you know already?',
    agree: 'I agree',
    disagree: 'I don’t agree',
    who: { allein: 'Think', 'zu zweit': 'Pair', Gruppe: 'Group', Plenum: 'Share' } as Record<WorkForm, string>,
  },
};
type Text = (typeof TEXT)['de'];

// — The lesson's course —

/** What a phase of the course is for. */
export type PhaseKind = 'abruf' | 'einstieg' | 'arbeit' | 'besprechung' | 'sicherung' | 'exit';

export interface PlanRow {
  minutes: number;
  phase: string;
  text: string;
  form: WorkForm | '';
  material: string;
  kind: PhaseKind;
}

const KINDS: [PhaseKind, RegExp][] = [
  ['abruf', /abruf|wiederhol|retrieval|recall|review|revision/i],
  ['exit', /exit|ausstieg|abschluss|reflexion|hausaufgabe|homework|check|ticket|ausblick/i],
  ['sicherung', /sicherung|zusammenfass|merksatz|tafelbild|summary|wrap/i],
  ['besprechung', /besprech|auswert|vergleich|kontroll|feedback|ergebnis/i],
  ['einstieg', /einstieg|hinführ|motivation|impuls|problematis|lead-?in|warm-?up|intro|begrüß|starter|hook/i],
];
export const phaseKind = (phase: string): PhaseKind => KINDS.find(([, re]) => re.test(phase))?.[0] ?? 'arbeit';

const FORMS: [RegExp, WorkForm][] = [
  [/einzel|allein|\bEA\b|alone|individual/i, 'allein'],
  [/partner|\bPA\b|zu zweit|pair|tandem/i, 'zu zweit'],
  [/grupp|\bGA\b|group|team/i, 'Gruppe'],
  [/plenum|klasse|\bUG\b|\bLV\b|whole|class|alle/i, 'Plenum'],
];
const formOf = (s: string): WorkForm | '' => FORMS.find(([re]) => re.test(s))?.[1] ?? '';

/** Rows of the teacher's lesson plan: "0–5 | Abrufphase | … | Einzel | Material". */
export function planRows(blocks: Block[]): PlanRow[] {
  const plan = blocks.find((b) => b.type === 'plan');
  return str(plan?.props.rows)
    .split('\n')
    .map((l) => l.split('|').map((x) => x.trim()))
    .filter((c) => c.length >= 3)
    .map(([time, phase, text, form = '', material = '']) => {
      const [a, b] = time.split(/[–-]/).map((n) => parseInt(n, 10));
      const single = /^(\d+)\s*(?:'|′|min)/i.exec(time);
      const minutes = Number.isFinite(a) && Number.isFinite(b) && b > a ? b - a : single ? Number(single[1]) : 0;
      return { minutes, phase, text, form: formOf(form), material, kind: phaseKind(phase) };
    });
}

/** "Ich", "Du", "Wir" … as a phase: a step of the work phase before. */
const STEP_PHASE = /^(ich|du|wir|think|pair|share)\b/i;
const phaseBase = (p: string) => p.split(/[·:(–-]/)[0].trim().toLowerCase();
/** A page named in a row: "AB S. 2", "Arbeitsblatt 2", "p. 3". */
const pageRef = (r: PlanRow) => {
  const m = /(?:\bAB\b|Arbeitsblatt|worksheet|\bS\.|Seite|\bp\.|page)\s*(\d+)/i.exec(`${r.text} ${r.material}`);
  return m ? Number(m[1]) : 0;
};
const TYPE_WORDS: Partial<Record<SheetType, RegExp>> = {
  versuch: /versuch|experiment/i,
  vocab: /vocab|wortschatz|wörter|words/i,
  grammar: /grammar|grammatik/i,
  listening: /listen|hören|hörverstehen/i,
  speaking: /speak|sprechen|dialog/i,
  sicherung: /sicherung|summary/i,
  test: /test|klassenarbeit/i,
  uebung: /übung|üben|practice|anwend|erarbeit/i,
};

/** A sheet for the class: a page with its back pages, numbered as on the sheet. */
interface Sheet {
  page: Page;
  number: number;
  blocks: Block[];
}

function sheetsOf(doc: Doc): Sheet[] {
  const numbers = sheetNumbers(doc);
  const out: Sheet[] = [];
  doc.pages.forEach((p, i) => {
    if (p.type === 'lehrkraft') return;
    const last = out[out.length - 1];
    if (p.back && last) last.blocks = [...last.blocks, ...p.blocks];
    else out.push({ page: p, number: numbers[i] ?? out.length + 1, blocks: p.blocks });
  });
  return out;
}

/** A phase of the course (rows that belong together, e.g. "Ich – Du – Wir") and the sheet worked on in it. */
interface Group {
  kind: PhaseKind;
  rows: PlanRow[];
  sheet?: Sheet;
}

/**
 * The course as phases with their sheets: rows of one work phase are taken together, each sheet goes to the row
 * that names it ("AB S. 2"), else to the row of its kind ("Versuch"), else to the next work phase. Sheets no row
 * took come after the last work phase. Without a plan each sheet is a work phase.
 */
function groupsOf(rows: PlanRow[], sheets: Sheet[]): Group[] {
  const groups: Group[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    const goesOn = last && last.kind === 'arbeit' && r.kind === 'arbeit' && (STEP_PHASE.test(r.phase) || phaseBase(r.phase) === phaseBase(last.rows[0].phase));
    if (goesOn) last.rows.push(r);
    else groups.push({ kind: r.kind, rows: [r] });
  }
  const free = new Set(sheets.map((_, k) => k));
  const take = (k: number | undefined) => {
    if (k === undefined || k < 0 || !free.has(k)) return undefined;
    free.delete(k);
    return sheets[k];
  };
  const working = (g: Group) => g.kind === 'arbeit' || g.kind === 'sicherung';
  // Named sheets first, then by kind, then in order.
  for (const g of groups.filter(working)) g.sheet = take(sheets.findIndex((s) => g.rows.some((r) => pageRef(r) === s.number)));
  for (const g of groups.filter((x) => working(x) && !x.sheet)) {
    const words = g.rows.map((r) => `${r.phase} ${r.text}`).join(' ');
    g.sheet = take([...free].find((k) => TYPE_WORDS[sheets[k].page.type]?.test(words)));
  }
  for (const g of groups.filter((x) => x.kind === 'arbeit' && !x.sheet)) g.sheet = take([...free].find((k) => sheets[k].page.type !== 'sicherung'));
  for (const g of groups.filter((x) => x.kind === 'sicherung' && !x.sheet)) g.sheet = take([...free].find((k) => sheets[k].page.type === 'sicherung'));
  const rest: Group[] = [...free].sort((a, b) => a - b).map((k) => ({ kind: 'arbeit', rows: [], sheet: sheets[k] }));
  if (rest.length) {
    let at = groups.map((g) => working(g)).lastIndexOf(true) + 1;
    if (!at) at = groups.findIndex((g) => g.kind === 'exit' || g.kind === 'sicherung' || g.kind === 'besprechung');
    groups.splice(at < 0 ? groups.length : at, 0, ...rest);
  }
  return groups;
}

// — Tasks on slides —

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

/** "1–3", "1 und 3", "2" */
function numberList(ns: number[], en: boolean): string {
  if (ns.length === 1) return String(ns[0]);
  const run = ns.every((n, k) => !k || n === ns[k - 1] + 1);
  if (run) return `${ns[0]}–${ns[ns.length - 1]}`;
  return `${ns.slice(0, -1).join(', ')} ${en ? 'and' : 'und'} ${ns[ns.length - 1]}`;
}

// — The suggestion —

/** A worked-out lesson before this one, for the recall: "Stunde 2" or "Modul 1 · Stunde 4". */
export interface EarlierLesson {
  where: string;
  /** Of the same module (else of an earlier module of the subject and grade). */
  sameModule: boolean;
  doc: Doc;
}

export interface SuggestOptions {
  /** Earlier lessons, the last one first. */
  earlier?: EarlierLesson[];
  /** Number of the lesson in its module (to vary the questions picked). */
  lessonNumber?: number;
}

export interface SuggestItem {
  id: string;
  /** For the list to tick, in German. */
  label: string;
  slide: Slide;
  on: boolean;
}

export interface SuggestSection {
  id: string;
  label: string;
  /** A hint under the section, e.g. why there is no recall slide. */
  note?: string;
  items: SuggestItem[];
}

/** Questions a lesson leaves for later: its recall questions, its Merksatz, tasks with a short answer. */
export function questionsOf(doc: Doc): [string, string][] {
  const all = doc.pages.flatMap((p) => p.blocks);
  const out: [string, string][] = [];
  for (const b of all.filter((x) => x.type === 'recall')) for (const [q = '', a = ''] of rows(b.props.items)) if (q.trim()) out.push([slideText(q), slideText(a)]);
  for (const b of all.filter((x) => x.type === 'merksatz')) {
    const text = str(b.props.text);
    const gaps = [...text.matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1]);
    if (gaps.length) out.push([`Ergänze: ${slideText(text)}`, gaps.join(' · ')]);
  }
  for (const b of all.filter((x) => BLOCK_TYPES[x.type]?.task)) {
    const prompt = slideText(str(b.props.prompt));
    if (!prompt) continue;
    if (b.type === 'mc') {
      const right = choices(b.props.options).filter((o) => o.correct);
      if (right.length === 1) out.push([prompt, entry(right[0].text)]);
    } else if (b.type === 'open') {
      const sol = str(b.props.solution).trim();
      if (sol && sol.length <= 80) out.push([prompt, entry(sol)]);
    }
  }
  return out;
}

/**
 * Up to three questions from earlier lessons, spaced: one from the last lesson, one from an earlier lesson of the
 * module, one from an earlier module; more from the last lessons if some are missing.
 */
export function recallQuestions(earlier: EarlierLesson[], seed = 0): { q: string; a: string; where: string }[] {
  const pools = earlier.map((e) => ({ e, qs: questionsOf(e.doc) })).filter((p) => p.qs.length);
  const used = new Set<string>();
  const out: { q: string; a: string; where: string }[] = [];
  const pickFrom = (p: (typeof pools)[number] | undefined) => {
    if (!p || out.length >= RECALL_ITEMS) return false;
    const free = p.qs.filter(([q]) => !used.has(q));
    if (!free.length) return false;
    const [q, a] = free[seed % free.length];
    used.add(q);
    out.push({ q, a, where: p.e.where });
    return true;
  };
  const [last, ...rest] = pools;
  pickFrom(last);
  pickFrom(rest.find((p) => p.e.sameModule));
  pickFrom(pools.find((p) => !p.e.sameModule));
  for (const p of pools) while (out.length < RECALL_ITEMS && pickFrom(p));
  return out;
}

export function suggestSlides(doc: Doc, lessonTitle: string, opts: SuggestOptions = {}): SuggestSection[] {
  const en = doc.lang === 'en';
  const tx: Text = TEXT[en ? 'en' : 'de'];
  const all = doc.pages.flatMap((p) => p.blocks);
  const rows = planRows(all);
  const sheets = sheetsOf(doc);
  const groups = groupsOf(rows, sheets);
  const withPage = sheets.filter((s) => s.blocks.some((b) => BLOCK_TYPES[b.type]?.task)).length > 1;
  const hook = all.find((b) => b.type === 'hook');
  const goal = all.find((b) => b.type === 'goal');
  const question = str(hook?.props.question).trim() || rows.map((r) => /leitfrage:\s*(.+)/i.exec(r.text)?.[1]).find(Boolean)?.trim() || '';
  const tipcards = all.some((b) => b.type === 'tipcards');
  const merksatz = all.filter((b) => b.type === 'merksatz' && str(b.props.text).trim());
  const sections: SuggestSection[] = [];
  let n = 0;
  const item = (label: string, slide: Slide, on = true): SuggestItem => ({ id: `s${++n}`, label, slide, on });
  /** The time and form of a phase from its rows, its course text in the notes. */
  const fromRows = (s: Slide, rs: PlanRow[]): Slide =>
    rs.length
      ? { ...s, minutes: rs.reduce((k, r) => k + r.minutes, 0) || s.minutes, form: rs[0].form || s.form, notes: [rs.map((r) => r.text).join('\n'), s.notes].filter(Boolean).join('\n') }
      : s;

  // Title: the lesson; the key question only when no beginning leads to it.
  sections.push({
    id: 'start',
    label: 'Start',
    items: [
      item('Titel', {
        ...createSlide('title'),
        title: lessonTitle,
        text: hook ? '' : question,
        notes: [str(goal?.props.goal), str(goal?.props.curriculum)].filter(Boolean).join('\n'),
      }),
    ],
  });

  let phaseNo = 0;
  let lastWork: SuggestSection | null = null;
  for (const g of groups) {
    const rs = g.rows;
    const minutes = rs.reduce((k, r) => k + r.minutes, 0);
    const time = minutes ? ` · ${minutes} min` : '';
    if (g.kind === 'abruf') {
      const qs = recallQuestions(opts.earlier ?? [], opts.lessonNumber ?? 0);
      const s: SuggestSection = { id: `abruf${sections.length}`, label: `Abrufphase${time}`, items: [] };
      if (!qs.length) s.note = (opts.earlier ?? []).length ? 'Die früheren Stunden haben keine Abruffragen, Merksätze oder kurzen Lösungen.' : 'Noch keine früheren Stunden zum Abrufen.';
      else
        s.items.push(
          item(
            `Aus dem Gedächtnis (${qs.length} ${qs.length === 1 ? 'Frage' : 'Fragen'}: ${[...new Set(qs.map((q) => q.where))].join(', ')})`,
            fromRows(
              {
                ...createSlide('list'),
                type: 'lehrkraft',
                phase: rs[0]?.phase || (en ? 'Warm-up' : 'Abrufphase'),
                form: 'allein',
                minutes: 5,
                title: tx.recall,
                text: rs[0]?.form === 'Plenum' ? '' : tx.journal,
                items: qs.map((q) => pair(q.q, q.a)).join('\n'),
                reveal: true,
                notes: qs.map((q, k) => `${k + 1}: aus ${q.where}`).join(' · '),
              },
              rs,
            ),
          ),
        );
      sections.push(s);
      continue;
    }
    if (g.kind === 'einstieg') {
      const s: SuggestSection = { id: `einstieg${sections.length}`, label: `Einstieg${hook ? ` · ${HOOK_KINDS.find((k) => k.v === str(hook.props.kind))?.l ?? 'Impuls'}` : ''}${time}`, items: [] };
      if (hook) s.items.push(...hookItems(hook, question, rs, en, tx, item, fromRows));
      else s.note = 'Im Baustein „Einstieg“ auf der Lehrkraft-Seite die Art des Einstiegs wählen (Bildimpuls, Schätzfrage, Zitat …), dann entsteht hier die passende Folie. Die Leitfrage steht so lange auf der Titelfolie.';
      sections.push(s);
      continue;
    }
    if (g.kind === 'besprechung' && !g.sheet) {
      // The discussion of the phase before: its time and course go to its first task.
      const first = lastWork?.items.find((x) => x.slide.layout === 'task');
      if (first) first.slide = { ...first.slide, notes: [first.slide.notes, ...rs.map((r) => `${r.phase}: ${r.text}`)].filter(Boolean).join('\n') };
      continue;
    }
    if (g.kind === 'exit') continue;
    if (!g.sheet && g.kind === 'sicherung') continue;
    // A work phase, with or without a sheet.
    phaseNo++;
    const sec = workSection(g, phaseNo, { en, tx, withPage, tipcards, merksatz: merksatz[0], item, fromRows });
    sections.push(sec);
    lastWork = sec;
  }
  // No plan and a beginning: it comes after the title.
  if (!rows.length && hook) sections.splice(1, 0, { id: 'einstieg', label: `Einstieg · ${HOOK_KINDS.find((k) => k.v === str(hook.props.kind))?.l ?? 'Impuls'}`, items: hookItems(hook, question, [], en, tx, item, fromRows) });

  // Exit: the Merksatz with its gaps on a click (or back to the key question), this lesson's recall questions as a check.
  const exitRows = groups.filter((g) => g.kind === 'exit').flatMap((g) => g.rows);
  const expect = all.find((b) => b.type === 'expect');
  const expected = rows_(expect)
    .map(([kind = '', said = '', why = '']) => [kind && `${kind}:`, said, why && `→ ${why}`].filter(Boolean).join(' '))
    .join('\n');
  const exit: SuggestSection = { id: 'exit', label: `Sicherung und Exit${exitRows.length ? ` · ${exitRows.reduce((k, r) => k + r.minutes, 0)} min` : ''}`, items: [] };
  if (merksatz.length)
    exit.items.push(
      item(
        'Merksatz (Lücken auf Klick)',
        fromRows(
          {
            ...createSlide('exit'),
            phase: 'Exit',
            label: tx.remember,
            title: str(merksatz[0].props.text),
            text: question ? `${tx.back}: ${question}` : '',
            reveal: true,
            notes: expected,
          },
          exitRows,
        ),
      ),
    );
  else if (question)
    exit.items.push(item('Zurück zur Leitfrage', fromRows({ ...createSlide('exit'), phase: 'Exit', label: tx.back, title: question, text: '', reveal: false, notes: expected }, exitRows)));
  const ownRecall = all.find((b) => b.type === 'recall');
  const own = rows_(ownRecall).filter(([q]) => q?.trim());
  if (own.length)
    exit.items.push(
      item(
        'Abruffragen dieser Stunde als Exit-Fragen',
        { ...createSlide('list'), type: 'sicherung', phase: 'Exit', form: 'allein', minutes: 3, title: tx.exitCheck, text: '', items: own.map(([q = '', a = '']) => pair(slideText(q), slideText(a))).join('\n'), reveal: true },
        false,
      ),
    );
  const selfcheck = all.find((b) => b.type === 'selfcheck' && lines(b.props.items).length);
  if (selfcheck)
    exit.items.push(item('Ich kann …', { ...createSlide('list'), type: 'sicherung', phase: 'Exit', title: str(selfcheck.props.title) || 'Ich kann …', text: '', items: lines(selfcheck.props.items).map(entry).slice(0, 8).join('\n'), reveal: false }, false));
  if (exit.items.length) sections.push(exit);
  return sections;
}

const rows_ = (b: Block | undefined) => rows(b?.props.items);

type ItemMaker = (label: string, slide: Slide, on?: boolean) => SuggestItem;
type FromRows = (s: Slide, rs: PlanRow[]) => Slide;

/** The beginning after its kind, then the key question (unless the slide shows it already). */
function hookItems(hook: Block, question: string, rs: PlanRow[], en: boolean, tx: Text, item: ItemMaker, fromRows: FromRows): SuggestItem[] {
  const p = hook.props;
  const kind = str(p.kind);
  const impulse = str(p.impulse).trim();
  const answer = str(p.answer).trim();
  const image = str(p.image);
  const source = str(p.source);
  const url = str(p.url).trim();
  const label = HOOK_KINDS.find((k) => k.v === kind)?.l ?? 'Impuls';
  const base = { type: 'lehrkraft' as SheetType, phase: rs[0]?.phase || (en ? 'Lead-in' : 'Einstieg'), form: 'Plenum' as const };
  let slide: Slide;
  let withQuestion = false;
  switch (kind) {
    case 'bild':
      slide = { ...createSlide('full'), ...base, label, title: impulse || tx.look, text: '', image, source, describe: str(p.describe) };
      break;
    case 'schaetzen':
    case 'raetsel':
      // A guess without a picture stands alone, huge; the answer comes on a click.
      if (kind === 'schaetzen' && !image) {
        slide = { ...createSlide('big'), ...base, label: en ? 'Guess' : 'Schätzfrage', title: impulse || '?', text: answer, anims: answer ? { text: { step: 1, anim: 'zoom' } } : {} };
        break;
      }
      slide = { ...createSlide('task'), ...base, label: kind === 'schaetzen' ? (en ? 'Guess' : 'Schätzfrage') : en ? 'Riddle' : 'Rätsel', title: impulse || '?', items: '', text: answer, image, source, reveal: true };
      break;
    case 'zitat':
    case 'fall':
      // The quote or case with the key question under it, on a click.
      slide = {
        ...createSlide('quote'),
        ...base,
        label: kind === 'fall' ? (en ? 'Imagine …' : 'Stell dir vor …') : source,
        text: impulse,
        title: question || tx.guess,
        anims: question ? { title: { step: 1, anim: 'rise' } } : {},
      };
      withQuestion = true;
      break;
    case 'video': {
      const video = /^https?:\/\/\S+/.test(url) ? [createElement('video', { x: 360, y: 290, w: 1200, h: 675, url, text: impulse })] : [];
      slide = { ...createSlide('blank'), ...base, title: impulse || tx.look, elements: video };
      break;
    }
    case 'versuch':
      slide = image
        ? { ...createSlide('image'), ...base, label: '', title: impulse || tx.look, text: `**${tx.guess}**`, image, source, anims: { text: { step: 1, anim: 'fade' } } }
        : { ...createSlide('statement'), ...base, label: en ? 'Watch closely' : 'Beobachtet genau', title: impulse || tx.look, text: `**${tx.guess}**`, anims: { text: { step: 1, anim: 'fade' } } };
      break;
    case 'abstimmung': {
      const options = (answer || `${tx.agree} / ${tx.disagree}`)
        .split('/')
        .map((o) => entry(o))
        .filter(Boolean)
        .slice(0, 3);
      slide = { ...createSlide('compare'), ...base, title: impulse || '?', items: options.join('\n'), text: '', vote: true };
      break;
    }
    case 'vorwissen':
    default:
      slide = { ...createSlide('statement'), ...base, label: tx.know, title: impulse || question || tx.know, text: '' };
      withQuestion = !impulse;
      break;
  }
  const out = [item(`${label}: ${clip(impulse || slide.title)}`, fromRows(slide, rs))];
  if (question && !withQuestion) out.push(item(`Leitfrage: ${clip(question)}`, { ...createSlide('statement'), type: 'versuch', phase: base.phase, form: '', minutes: 0, label: tx.question, title: question, text: '' }));
  return out;
}

const clip = (t: string) => {
  const s = slideText(t).replace(/\s+/g, ' ');
  return s.length > 60 ? s.slice(0, 58).trimEnd() + ' …' : s;
};

interface WorkCtx {
  en: boolean;
  tx: Text;
  withPage: boolean;
  tipcards: boolean;
  /** The Merksatz of the lesson: it ends the lesson, so it is not shown with its page. */
  merksatz?: Block;
  item: ItemMaker;
  fromRows: FromRows;
}

/** Blocks the class takes in before working: words, rules, texts to listen to, links. */
const INPUT = new Set(['vocab', 'phrases', 'reading', 'grammar', 'listening', 'qr']);

/**
 * A work phase: what to look at or learn first, the slide with the instruction (time, form, steps) and the tasks for
 * the discussion, followed by schemes and further Merksätze of its sheet.
 */
function workSection(g: Group, no: number, c: WorkCtx): SuggestSection {
  const { en, tx, item } = c;
  const sheet = g.sheet;
  const rs = g.rows;
  const blocks = sheet?.blocks ?? [];
  const type = sheet?.page.type ?? 'uebung';
  const themeLabel = en ? THEMES[type].labelEn : THEMES[type].label;
  const phase = rs[0]?.phase && !STEP_PHASE.test(rs[0].phase) ? rs[0].phase : themeLabel;
  const base = { type, phase, form: sheet?.page.form ?? ('' as const), minutes: 0 } as const;
  const before: SuggestItem[] = [];
  const after: SuggestItem[] = [];
  const tasks: { b: Block; n: number }[] = [];
  let heading = '';
  let taskNo = 0;
  let picture: { image: string; source: string } | null = null;

  blocks.forEach((b, k) => {
    const props = b.props;
    const next = blocks[k + 1];
    if (b.type === 'heading') heading = str(props.text);
    if (BLOCK_TYPES[b.type]?.task) {
      taskNo++;
      tasks.push({ b, n: taskNo });
      const body = taskBody(b, en);
      const help = str(props.help).trim();
      const tip = str(props.tip).trim();
      const notes = [body.notes, tip && `Tipp: ${tip}`].filter(Boolean).join('\n');
      const label = taskLabel(b, taskNo, sheet?.number ?? null, c.withPage, en);
      const parts = chunks(body.items, TASK_ITEMS);
      const has = body.items.length > 0 || !!body.solution;
      parts.forEach((items, ch) => {
        const last = ch === parts.length - 1;
        after.push(
          item(
            `${tx.task} ${taskNo}${parts.length > 1 ? ` (${ch + 1}/${parts.length})` : ''}: ${clip(str(props.prompt)) || BLOCK_TYPES[b.type].label}`,
            {
              ...createSlide('task'),
              ...base,
              phase: tx.discuss,
              form: 'Plenum',
              label: parts.length > 1 ? `${label} · ${ch + 1}/${parts.length}` : label,
              title: slideText(str(props.prompt)) || BLOCK_TYPES[b.type].label,
              help: ch === 0 ? help : '',
              items: items.join('\n'),
              text: last ? body.solution : '',
              image: ch === 0 && picture ? picture.image : '',
              source: ch === 0 && picture ? picture.source : '',
              reveal: true,
              notes,
            },
            has || !!picture,
          ),
        );
      });
      picture = null;
      return;
    }
    const into = INPUT.has(b.type) ? before : after;
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
        const beside = [blocks[k - 1], next].find((x) => x?.type === 'text' && str(x.props.text).length <= 320);
        // Pictures are looked at together before the work.
        before.push(item(`Bild: ${clip(caption || heading || sheet?.page.title || '')}`, { ...createSlide('image'), ...base, title: caption || heading || sheet?.page.title || '', text: beside ? str(beside.props.text) : '', image, source, search: str(props.search), describe: str(props.describe) }, !!image));
        break;
      }
      case 'flow': {
        const steps = flowSteps(props.steps);
        if (steps.length)
          after.push(
            item('Fließschema', {
              ...createSlide('flow'),
              ...base,
              title: heading || sheet?.page.title || '',
              text: '',
              items: steps
                .slice(0, 5)
                .map((s) => pair(s.title, s.sub))
                .join('\n'),
              build: true,
              reveal: false,
            }),
          );
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
          if (items.length) into.push(item(`Wörter: ${clip(str(props.title) || heading || BLOCK_TYPES[b.type].label)}`, { ...createSlide('words'), ...base, title: str(props.title) || heading || sheet?.page.title || '', text: '', items: items.join('\n'), reveal: true }));
        });
        break;
      }
      case 'wordbank': {
        const words = lines(props.words)
          .flatMap((l) => (l.includes(',') ? l.split(',') : [l]))
          .map(entry)
          .filter(Boolean);
        if (words.length) after.push(item(tx.words, { ...createSlide('words'), ...base, title: tx.words, text: '', items: words.slice(0, WORD_ITEMS).join('\n'), reveal: false }, false));
        break;
      }
      case 'grammar': {
        const rule = str(props.rule).trim();
        const signal = str(props.signal).trim();
        const examples = lines(props.examples);
        if (rule)
          into.push(
            item(`Regel: ${clip(str(props.title) || rule)}`, {
              ...createSlide('statement'),
              ...base,
              label: str(props.title),
              title: rule,
              text: [signal && `**${en ? 'Signal words' : 'Signalwörter'}:** ${signal}`, ...examples].filter(Boolean).join('\n'),
            }),
          );
        break;
      }
      case 'hint': {
        const text = str(props.text).trim();
        if (text) after.push(item(`Hinweis: ${clip(str(props.title) || text)}`, { ...createSlide('statement'), ...base, label: '', title: str(props.title) || tx.note, text }, false));
        break;
      }
      case 'merksatz': {
        const text = str(props.text).trim();
        // The lesson's Merksatz ends the lesson; further ones stay with their sheet.
        if (text && b !== c.merksatz) after.push(item(`Merksatz: ${clip(text)}`, { ...createSlide('statement'), ...base, label: tx.remember, title: text, text: '', reveal: true }));
        break;
      }
      case 'qr': {
        const url = str(props.url).trim();
        if (/^https?:\/\/\S+\.\S+/.test(url))
          into.push(
            item(`QR-Code: ${clip(str(props.caption) || url)}`, {
              ...createSlide('blank'),
              ...base,
              title: str(props.caption) || tx.scan,
              elements: [createElement('qr', { x: 96, y: 360, w: 540, h: 540, text: '', url })],
            }),
          );
        break;
      }
      case 'listening': {
        const url = str(props.url).trim();
        const note = str(props.note).trim();
        into.push(
          item(`${tx.listen}: ${clip(note || str(props.track) || tx.listen)}`, {
            ...createSlide('statement'),
            ...base,
            label: [tx.listen, str(props.track)].filter(Boolean).join(' · '),
            title: note || tx.listen,
            text: '',
            elements: /^https?:\/\/\S+\.\S+/.test(url) ? [createElement('qr', { x: 1400, y: 420, w: 400, h: 460, text: '', url })] : [],
            notes: str(props.transcript),
          }),
        );
        break;
      }
    }
  });

  // The instruction: tasks, time, form, steps.
  const form = rs[0]?.form || sheet?.page.form || '';
  const nums = tasks.map((t) => t.n);
  const verb = en ? 'Do' : form === 'allein' ? 'Bearbeite' : 'Bearbeitet';
  const where = sheet && c.withPage ? (en ? ` on page ${sheet.number}` : ` auf S. ${sheet.number}`) : '';
  const title = nums.length
    ? en
      ? `${verb} ${nums.length > 1 ? 'tasks' : 'task'} ${numberList(nums, en)}${where}.`
      : `${verb} ${nums.length > 1 ? 'Aufgabe' : 'Aufgabe'} ${numberList(nums, en)}${where}.`
    : rs.length === 1
      ? rs[0].text
      : sheet?.page.title || rs[0]?.text || '';
  const top = tasks.filter((t) => num(t.b.props.level, 0) === 3).map((t) => t.n);
  const hint = [
    top.length && top.length < tasks.length
      ? en
        ? `${top.length > 1 ? 'Tasks' : 'Task'} ${numberList(top, en)} (★★★) ${top.length > 1 ? 'are' : 'is'} the challenge.`
        : `${top.length > 1 ? 'Aufgaben' : 'Aufgabe'} ${numberList(top, en)} (★★★) ${top.length > 1 ? 'sind die Profi-Aufgaben' : 'ist die Profi-Aufgabe'}.`
      : '',
    c.tipcards && tasks.length ? tx.tipcards : '',
  ]
    .filter(Boolean)
    .join(' ');
  const steps =
    rs.length > 1
      ? rs
          .map((r) => {
            const who = r.form ? tx.who[r.form] : '';
            const text = entry(r.text);
            return `${who ? `${who}: ` : ''}${text}${r.minutes ? ` | ${r.minutes}` : ''}`;
          })
          .join('\n')
      : '';
  const minutes = rs.reduce((k, r) => k + r.minutes, 0);
  const label = [sheet && c.withPage ? `${tx.sheet} ${tx.page} ${sheet.number}` : '', rs.length ? '' : themeLabel].filter(Boolean).join(' · ');
  const work: Slide = {
    ...createSlide('work'),
    type,
    phase,
    form,
    minutes,
    label,
    title: entry(title),
    text: hint,
    items: steps,
    notes: [...rs.map((r) => [r.text, r.material && `Material: ${r.material}`].filter(Boolean).join(' · ')), ...(sheet ? [`${tx.sheet}: ${sheet.page.title}`] : [])].join('\n'),
  };
  // Teacher talk in the whole class needs no instruction slide.
  const workOn = nums.length > 0 || (!!title && form !== 'Plenum');
  const head = [phase !== themeLabel ? phase : '', sheet ? `${themeLabel}${c.withPage ? ` · S. ${sheet.number}` : ''}` : '', minutes ? `${minutes} min` : ''].filter(Boolean).join(' · ');
  return {
    id: `arbeit${no}`,
    label: `Arbeitsphase ${no}${head ? ` · ${head}` : ''}`,
    items: [...before, item(`Auftrag: ${clip(title) || 'Arbeitsauftrag'}${steps ? ` (${rs.length} Schritte)` : ''}`, work, workOn), ...after],
  };
}

/** The slides the suggestion ticks. */
export const pickedSlides = (sections: SuggestSection[]) => sections.flatMap((s) => s.items.filter((i) => i.on).map((i) => i.slide));

/** Slides for the lesson as suggested (what the list to tick shows ticked). */
export function slidesFromDoc(doc: Doc, lessonTitle: string, opts: SuggestOptions = {}): Slide[] {
  return pickedSlides(suggestSlides(doc, lessonTitle, opts));
}
