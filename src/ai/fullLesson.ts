// "Stunde komplett mit Claude": the steps that otherwise take four dialogs, in one go. Claude works out the lesson
// (or keeps what is worked out), checks it, fixes what the check found, and the slides are suggested and reworked.
// The teacher sees the result once and takes it or not.
import type { Competence, Lesson, Module } from '../library/types';
import type { Slide } from '../model/slides';
import type { Doc } from '../model/types';
import { checkPrompt, checkSystem, findingsFromAnswer, type Finding } from './check';
import { jsonOf, type AiAnswer, type AiRequest } from './client';
import { hasBlocks, isTeacherPage, LESSON_TOKENS, lessonFromAnswer, lessonPrompt, lessonSystem, type LessonMode } from './lesson';
import { slidesFromAnswer, slidesPrompt, slidesSystem } from './slides';

export type StepKey = 'lesson' | 'check' | 'fix' | 'slides';

export const STEPS: { key: StepKey; label: string }[] = [
  { key: 'lesson', label: 'Stunde ausarbeiten' },
  { key: 'check', label: 'Stunde prüfen' },
  { key: 'fix', label: 'Gefundenes beheben' },
  { key: 'slides', label: 'Folien vorschlagen und abwechslungsreich machen' },
];

export type StepState = { state: 'wait' | 'run' | 'done' | 'skip' | 'fail'; note?: string };

export interface FullResult {
  doc: Doc;
  slides: Slide[];
  findings: Finding[];
  added: Competence[];
  images: Record<string, string>;
  notes: string[];
  usd: number;
}

export interface FullDeps {
  module: Module;
  lesson: Lesson;
  doc: Doc;
  /** The lesson in its year plan (`lessonContext`), with the teacher's wishes. */
  context(wishes: string): string;
  notes: string;
  /** The slides the Baukasten suggests for a worksheet (ticked ones). */
  suggest(doc: Doc): Slide[];
  ask(r: Omit<AiRequest, 'signal' | 'onText'>): Promise<AiAnswer | null>;
  step(key: StepKey, s: StepState): void;
}

/** What the first step does with the lesson as it is: work it out, build the sheets to the teacher page, or keep it. */
export function firstMode(doc: Doc): LessonMode | null {
  const filled = doc.pages.filter(hasBlocks);
  if (!filled.length) return 'full';
  return filled.some((p) => !isTeacherPage(p)) ? null : 'sheets';
}

const findingsText = (fs: Finding[]) => fs.map((f) => `- ${f.ref}: ${f.problem}${f.fix ? ` → ${f.fix}` : ''}`).join('\n');

/** Runs the steps; throws (German message) only when the lesson itself cannot be made. */
export async function runFullLesson(d: FullDeps, wishes: string): Promise<FullResult | null> {
  let usd = 0;
  const notes: string[] = [];
  const images: Record<string, string> = {};
  let added: Competence[] = [];
  let doc = d.doc;
  const ask = async (r: Omit<AiRequest, 'signal' | 'onText'>) => {
    const a = await d.ask(r);
    if (a) usd += a.usd;
    return a;
  };
  const mod = () => ({ ...d.module, competences: [...d.module.competences, ...added] });
  const lesson = (mode: LessonMode, w: string) => {
    const l = { ...d.lesson, doc };
    return { l, user: lessonPrompt(mod(), l, d.context(w), mode) };
  };

  // 1. The lesson.
  const mode = firstMode(doc);
  if (!mode) d.step('lesson', { state: 'skip', note: 'Die Stunde ist schon ausgearbeitet.' });
  else {
    d.step('lesson', { state: 'run' });
    const { l, user } = lesson(mode, wishes);
    const a = await ask({ job: 'big', what: 'Stunde komplett: ausarbeiten', system: lessonSystem(), user, maxTokens: LESSON_TOKENS[mode], effort: 'high' });
    if (!a) return null;
    const draft = lessonFromAnswer(jsonOf(a.text), mod(), l, doc, mode);
    doc = draft.doc;
    added = draft.added;
    Object.assign(images, draft.images);
    notes.push(...draft.notes);
    d.step('lesson', { state: 'done', note: `${draft.made.length} ${draft.made.length === 1 ? 'Seite' : 'Seiten'}` });
  }

  // 2. Check it.
  let findings: Finding[] = [];
  d.step('check', { state: 'run' });
  try {
    const a = await ask({ job: 'big', what: 'Stunde komplett: prüfen', system: checkSystem(), user: checkPrompt(doc, { subject: d.module.subject, grade: d.module.grade, topic: d.module.title, lang: doc.lang, competences: mod().competences, notes: d.notes }), maxTokens: 8000, effort: 'medium' });
    if (!a) return null;
    findings = findingsFromAnswer(jsonOf(a.text), doc);
    d.step('check', { state: 'done', note: findings.length ? `${findings.length} ${findings.length === 1 ? 'Befund' : 'Befunde'}` : 'nichts gefunden' });
  } catch (e) {
    d.step('check', { state: 'fail', note: e instanceof Error ? e.message : String(e) });
  }

  // 3. Fix what was found, in one revision of the whole lesson.
  if (!findings.length) d.step('fix', { state: 'skip', note: 'Nichts zu beheben.' });
  else {
    d.step('fix', { state: 'run' });
    try {
      const wish = `${wishes.trim() ? wishes.trim() + '\n\n' : ''}Behebe diese Befunde aus der Prüfung (Bausteine als S<Seite>.<Nummer>), sonst nichts ändern:\n${findingsText(findings)}`;
      const { l, user } = lesson('revise', wish);
      const a = await ask({ job: 'big', what: 'Stunde komplett: beheben', system: lessonSystem(), user, maxTokens: LESSON_TOKENS.revise, effort: 'high' });
      if (!a) return null;
      const draft = lessonFromAnswer(jsonOf(a.text), mod(), l, doc, 'revise');
      doc = draft.doc;
      added = [...added, ...draft.added];
      Object.assign(images, draft.images);
      notes.push(...draft.notes);
      d.step('fix', { state: 'done' });
    } catch (e) {
      d.step('fix', { state: 'fail', note: e instanceof Error ? e.message : String(e) });
    }
  }

  // 4. Slides: the Baukasten's suggestion, then Claude makes them varied.
  d.step('slides', { state: 'run' });
  let slides = d.suggest(doc);
  try {
    if (slides.length) {
      const a = await ask({ job: 'big', what: 'Stunde komplett: Folien', system: slidesSystem(), user: slidesPrompt(slides, doc, { subject: d.module.subject, grade: d.module.grade, topic: d.module.title, lessonTitle: d.lesson.title, notes: d.notes }, wishes), maxTokens: 24000, effort: 'medium' });
      if (!a) return null;
      slides = slidesFromAnswer(jsonOf(a.text), slides).slides;
    }
    d.step('slides', { state: 'done', note: `${slides.length} Folien` });
  } catch (e) {
    d.step('slides', { state: 'fail', note: `Claude-Folien fehlgeschlagen, es bleibt der Vorschlag: ${e instanceof Error ? e.message : String(e)}` });
  }

  return { doc, slides, findings, added, images, notes, usd };
}
