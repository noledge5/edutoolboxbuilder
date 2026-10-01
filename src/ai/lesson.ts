// Working out a lesson with Claude: the request (with the lesson's place in the year plan) and reading the answer,
// a Stundenpaket with this one lesson, back into the module (its competences keep their ids).
import { claudeInstructions } from '../claude/instructions';
import { PACKAGE_FORMAT, PACKAGE_VERSION, readPackage } from '../library/package';
import type { Competence, Lesson, Module } from '../library/types';
import { DocFormatError } from '../model/normalize';
import type { Doc, Page } from '../model/types';

/**
 * full: teacher page and sheets in one go. scaffold: only the teacher page (goal, hook, course, expectations,
 * recall), to look over first. sheets: the sheets to the teacher page that is there. revise: the lesson as it is,
 * changed after the teacher's wishes.
 */
export type LessonMode = 'full' | 'scaffold' | 'sheets' | 'revise';

export const isTeacherPage = (p: Page) => p.type === 'lehrkraft';
const hasBlocks = (p: Page) => p.blocks.length > 0;

/** Pages as in a Stundenpaket: blocks without ids. */
const packagePages = (pages: Page[]) => pages.map((p) => ({ ...p, blocks: p.blocks.map(({ type, span, props }) => ({ type, span, props })) }));

const TASK: Record<LessonMode, string> = {
  full:
    'Arbeite die Stunde vollständig aus: zuerst die Seite „Für die Lehrkraft“ (Ziel & Bildungsplan, ein Einstieg, der zu dieser Stunde passt, Stundenverlauf für 45 Minuten mit „AB S. 1“ usw., Erwartungshorizont, Abruffragen für spätere Stunden), dann ein bis drei Schülerseiten.',
  scaffold:
    'Erstelle nur das Gerüst der Stunde: die Seite „Für die Lehrkraft“ (Ziel & Bildungsplan, ein Einstieg, der zu dieser Stunde passt, Stundenverlauf für 45 Minuten, in dem die geplanten Schülerseiten als „AB S. 1“, „AB S. 2“ … mit ihrem Inhalt stehen, Erwartungshorizont, Abruffragen für spätere Stunden). Noch keine Schülerseiten; die baut die Lehrkraft danach.',
  sheets:
    'Die Seite „Für die Lehrkraft“ steht schon (unten). Baue dazu die Schülerseiten, genau so, wie der Stundenverlauf sie vorsieht („AB S. 1“, „AB S. 2“ …), passend zu Ziel und Erwartungshorizont. Gib im Paket nur die Schülerseiten aus, ohne die Lehrkraft-Seite.',
  revise:
    'Die Stunde ist schon ausgearbeitet (unten). Überarbeite sie nach den Wünschen der Lehrkraft; behalte, was nicht betroffen ist, möglichst wörtlich. Gib die ganze Stunde mit allen Seiten zurück.',
};

/** The request for one lesson. `context` is `lessonContext()`; `chat`: for pasting into a Claude project. */
export function lessonPrompt(m: Module, l: Lesson, context: string, mode: LessonMode, chat = false): string {
  const out: string[] = [];
  if (chat) out.push(`Bitte nach der Anleitung „Arbeitsblatt-Baukasten“ im Projektwissen: ${TASK[mode]}`);
  else
    out.push(
      'Du arbeitest diesmal direkt im Baukasten, nicht im Chat: Es gibt keine Rückfragen und keine Dateien. Entscheide selbst, was fehlt, im Sinne der Anleitung.',
      '',
      `**Auftrag:** ${TASK[mode]}`,
    );
  out.push(
    '',
    `**Form der Antwort:** genau ein JSON-Codeblock mit einem Stundenpaket („${PACKAGE_FORMAT}“, Version ${PACKAGE_VERSION}) und darin genau einem Modul (subject „${m.subject}“, grade ${m.grade}, number ${m.number}, title „${m.title}“) mit genau dieser einen Stunde (\`"number": ${l.number}\`, title „${l.title}“). ` +
      (m.competences.length
        ? 'Das Kompetenzraster gibt es schon: verknüpfe Aufgaben über `competence` mit den IDs unten und schreib in `competences` nur neue Kompetenzen, falls wirklich eine fehlt (mit eigener ID). '
        : 'Das Modul hat noch kein Kompetenzraster: lege in `competences` die Kompetenzen an, an denen diese Stunde arbeitet, und verknüpfe die Aufgaben damit. ') +
      'Keine Folien (`slides`): Der Baukasten schlägt sie aus der Lehrkraft-Seite vor. ' +
      (chat ? 'Gib das Paket als Codeblock im Chat aus, keine Datei.' : 'Kein Text vor oder nach dem Codeblock.'),
    '',
    context,
  );
  const pages = l.doc.pages.filter(hasBlocks);
  if (mode === 'sheets') out.push('', '## Die Lehrkraft-Seite (steht schon)', '```json', JSON.stringify(packagePages(pages.filter(isTeacherPage))), '```');
  if (mode === 'revise') out.push('', '## Die Stunde, wie sie jetzt ist', '```json', JSON.stringify(packagePages(pages)), '```');
  return out.join('\n');
}

/** The long instructions (cached between requests): the same as the Anleitung for Claude projects. */
export const lessonSystem = () => claudeInstructions();

export interface LessonDraft {
  /** The worksheet to apply: the pages Claude made, merged with what stays (by mode). */
  doc: Doc;
  /** The pages Claude made (for the preview). */
  made: Page[];
  /** New competences Claude added to the module's grid. */
  added: Competence[];
  /** Image id → data URL (pictures Claude drew, e.g. SVG); store before applying. */
  images: Record<string, string>;
  notes: string[];
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** The lesson object in Claude's answer: a package, a module with lessons, a lesson, or bare pages. */
function lessonIn(raw: unknown, number: number): { lesson: Record<string, unknown>; competences: unknown[]; images: unknown } {
  if (!isObj(raw)) throw new DocFormatError('Die Antwort ist kein Stundenpaket.');
  const mod = Array.isArray(raw.modules) ? raw.modules.find(isObj) : isObj(raw.module) ? { ...raw.module, lessons: raw.lessons } : Array.isArray(raw.lessons) ? raw : null;
  const competences = isObj(mod) && Array.isArray(mod.competences) ? mod.competences : [];
  if (Array.isArray(raw.pages)) return { lesson: raw, competences, images: raw.images };
  const lessons = (isObj(mod) && Array.isArray(mod.lessons) ? mod.lessons : []).filter(isObj);
  const withPages = lessons.filter((x) => Array.isArray(x.pages) && x.pages.length > 0);
  const lesson = withPages.find((x) => Number(x.number) === number) ?? withPages[0];
  if (!lesson) throw new DocFormatError('In der Antwort fehlt die ausgearbeitete Stunde (eine Stunde mit "pages").');
  return { lesson, competences, images: raw.images };
}

/**
 * Reads Claude's answer for lesson `l` of module `m` (whose worksheet is `current`). The module's competences keep
 * their ids; new ones come back in `added`. Throws a DocFormatError with a German message.
 */
export function lessonFromAnswer(raw: unknown, m: Module, l: Lesson, current: Doc, mode: LessonMode): LessonDraft {
  const found = lessonIn(raw, l.number);
  const known = new Set(m.competences.map((c) => c.id));
  const extra = found.competences.filter((c) => isObj(c) && !known.has(String(c.id ?? '')) && !m.competences.some((k) => k.area && k.area === String(c.area ?? '')));
  const parsed = readPackage({
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    images: found.images,
    modules: [
      {
        subject: m.subject,
        grade: m.grade,
        number: m.number,
        title: m.title,
        icon: m.icon,
        lang: m.lang,
        help: m.help,
        competences: [...m.competences, ...extra],
        lessons: [{ ...found.lesson, number: l.number, title: l.title, slides: undefined }],
      },
    ],
  });
  const pm = parsed.modules[0];
  const pl = pm.lessons[0];
  // readPackage gave the competences fresh ids, in order: the module's own first, then the new ones.
  const ids = new Map(pm.module.competences.map((c, i) => [c.id, i < m.competences.length ? m.competences[i].id : c.id]));
  for (const p of pl.doc.pages) for (const b of p.blocks) if (b.props.competence) b.props.competence = ids.get(String(b.props.competence)) ?? '';
  const added = pm.module.competences.slice(m.competences.length);

  const notes = [...parsed.notes];
  let made = pl.doc.pages.filter(hasBlocks);
  const teacher = current.pages.filter((p) => hasBlocks(p) && isTeacherPage(p));
  const sheets = current.pages.filter((p) => hasBlocks(p) && !isTeacherPage(p));
  let pages: Page[];
  if (mode === 'scaffold') {
    if (made.some(isTeacherPage)) made = made.filter(isTeacherPage);
    else notes.push('Claude hat keine Seite „Für die Lehrkraft“ geschrieben; die Seiten werden so übernommen.');
    pages = [...made, ...sheets];
  } else if (mode === 'sheets') {
    if (made.some((p) => !isTeacherPage(p))) made = made.filter((p) => !isTeacherPage(p));
    pages = [...teacher, ...made];
  } else pages = made;
  if (!made.length) throw new DocFormatError('Die Stunde in der Antwort hat keine Seiten mit Inhalt.');
  return { doc: { ...current, pages }, made, added, images: parsed.images, notes };
}

/** Upper bounds for the answer (with Claude's thinking) per mode, in tokens. */
export const LESSON_TOKENS: Record<LessonMode, number> = { full: 48000, scaffold: 20000, sheets: 40000, revise: 48000 };
