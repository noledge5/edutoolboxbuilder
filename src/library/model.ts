// Pure library helpers: codes, new modules and lessons, migration of the old single worksheet, sample data.
import { BLOCK_TYPES, LEVEL_NAMES } from '../model/blockTypes';
import { createBlock, createPage, sheetNumbers, uid } from '../model/ops';
import { seedDoc, seedSlides } from '../model/seed';
import type { BlockType, Doc, Lang } from '../model/types';
import { DEFAULT_TOPIC_ICON } from '../topicIcons';
import type { SlideContext } from '../slides/SlideView';
import type { Competence, Lesson, LessonVersion, Library, Module, Settings, TrashEntry } from './types';

/** Kürzel of a lesson: "K9 · M1 · S2". */
export const lessonCode = (m: Module, lessonNumber: number) => `K${m.grade} · M${m.number} · S${lessonNumber}`;

/** Kürzel of a module: "K9 · M1". */
export const moduleCode = (m: Module) => `K${m.grade} · M${m.number}`;

/** "Geographie · Klasse 9 · Modul 1: Das Klima kippt" */
export const modulePlace = (m: Module) => `${m.subject} · Klasse ${m.grade} · Modul ${m.number}: ${m.title}`;

export const footerFor = (settings: Settings, subject: string) => [settings.footerBase.trim(), subject].filter(Boolean).join(' · ');

/** The lesson's document with icon, code, language and help switch taken from its module, so they are always consistent. */
export const docForLesson = (m: Module, l: Lesson): Doc => ({ ...l.doc, icon: m.icon, lang: m.lang, help: m.help, code: lessonCode(m, l.number) });

/** What all slides of a lesson show: icon, language, header line, title line and footer. */
export function slideContext(m: Module, l: Lesson, settings: Settings): SlideContext {
  const en = m.lang === 'en';
  const lesson = `${en ? 'Lesson' : 'Stunde'} ${l.number}`;
  return {
    icon: m.icon,
    lang: m.lang,
    design: l.slideDesign,
    kicker: `${l.title} · ${gradeLabel(m)} · ${lesson}`,
    titleKicker: `${gradeLabel(m)} · ${en ? 'Unit' : 'Modul'} ${m.number}: ${m.title} · ${lesson}`,
    footer: footerFor(settings, m.subject),
  };
}

/** English modules get English worksheets by default. */
export const defaultLang = (subject: string): Lang => (/englisch|english/i.test(subject) ? 'en' : 'de');

/** "Klasse 9" on German sheets, "Class 9" on English ones. */
export const gradeLabel = (m: Pick<Module, 'grade' | 'lang'>) => `${m.lang === 'en' ? 'Class' : 'Klasse'} ${m.grade}`;

export const modulesOf = (lib: Library, subject: string, grade: number) =>
  lib.modules.filter((m) => m.subject === subject && m.grade === grade).sort((a, b) => a.number - b.number || a.title.localeCompare(b.title));

export const lessonsOf = (lib: Library, moduleId: string) => lib.lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.number - b.number);

/**
 * The block types most used in a subject: those in at least two of its lessons, the most widely used first.
 * They make up the toolbox group "Oft in <Fach>".
 */
export function favoriteBlocks(lib: Library, subject: string, max = 6): BlockType[] {
  const modules = new Set(lib.modules.filter((m) => m.subject === subject).map((m) => m.id));
  const lessons = new Map<BlockType, number>();
  const total = new Map<BlockType, number>();
  for (const l of lib.lessons) {
    if (!modules.has(l.moduleId)) continue;
    const used = new Set<BlockType>();
    for (const pg of l.doc.pages)
      for (const b of pg.blocks) {
        used.add(b.type);
        total.set(b.type, (total.get(b.type) ?? 0) + 1);
      }
    for (const t of used) lessons.set(t, (lessons.get(t) ?? 0) + 1);
  }
  return [...lessons]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || total.get(b[0])! - total.get(a[0])!)
    .slice(0, max)
    .map(([t]) => t);
}

/** A lesson is worked out once one of its pages has content; before that it is only planned (from the year plan). */
export const isWorkedOut = (l: Lesson) => l.doc.pages.some((p) => p.blocks.length > 0);

/** How many of a module's lessons are worked out. */
export const progressOf = (lessons: Lesson[]) => ({ done: lessons.filter(isWorkedOut).length, total: lessons.length });

/** "3 von 8 Stunden ausgearbeitet", "8 Stunden geplant", "8 Stunden", "noch keine Stunden" */
export function progressText(p: { done: number; total: number }): string {
  const lessons = (n: number) => `${n} ${n === 1 ? 'Stunde' : 'Stunden'}`;
  if (p.total === 0) return 'noch keine Stunden';
  if (p.done === p.total) return lessons(p.total);
  if (p.done === 0) return `${lessons(p.total)} geplant`;
  return `${p.done} von ${lessons(p.total)} ausgearbeitet`;
}

/** The empty worksheet of a planned lesson: one page with the lesson's title. */
export function plannedDoc(m: Pick<Module, 'grade' | 'lang' | 'title' | 'icon' | 'help'>, title: string): Doc {
  return { icon: m.icon, lang: m.lang, help: m.help, footer: '', code: '', pages: [{ ...createPage(), title, kicker: `${gradeLabel(m)} · ${m.title}` }] };
}

/** A task linked to a competence: lesson number, printed page number (null on a teacher page), task number on that page, level key. */
export interface CompetenceLink {
  lesson: number;
  page: number | null;
  task: number;
  level: string;
}

/** For each competence id, the tasks in the module's lessons that are linked to it. */
export function competenceLinks(lessons: Lesson[]): Map<string, CompetenceLink[]> {
  const links = new Map<string, CompetenceLink[]>();
  for (const l of [...lessons].sort((a, b) => a.number - b.number)) {
    const pageNums = sheetNumbers(l.doc);
    l.doc.pages.forEach((pg, p) => {
      let task = 0;
      for (const b of pg.blocks) {
        if (!BLOCK_TYPES[b.type]?.task) continue;
        task++;
        const id = String(b.props.competence ?? '');
        if (!id) continue;
        const list = links.get(id) ?? [];
        list.push({ lesson: l.number, page: pageNums[p], task, level: String(b.props.level ?? '') });
        links.set(id, list);
      }
    });
  }
  return links;
}

/** "Std. 2 · S. 1 · Nr. 3 (M)" */
export const linkLabel = (k: CompetenceLink) => `Std. ${k.lesson} · ${k.page === null ? 'Lehrkraft' : `S. ${k.page}`} · Nr. ${k.task}${LEVEL_NAMES[k.level] ? ` (${LEVEL_NAMES[k.level]})` : ''}`;

/** Lessons of a competence as shown in prints: typed by hand, or else taken from the linked tasks ("2, 3"). */
export function competenceLessons(c: Competence, links: CompetenceLink[] = []): string {
  if (c.lessons.trim()) return c.lessons.trim();
  return [...new Set(links.map((k) => k.lesson))].join(', ');
}

/** Subjects from the settings and from existing modules, in the order they were added. */
export function subjectsOf(lib: Library): string[] {
  const all = [...lib.settings.subjects];
  for (const m of lib.modules) if (!all.includes(m.subject)) all.push(m.subject);
  return all;
}

export const newCompetence = (domain = ''): Competence => ({ id: uid(), area: '', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …', lessons: '', domain });

export function newModule(lib: Library, subject: string, grade: number): Module {
  const taken = modulesOf(lib, subject, grade).map((m) => m.number);
  return {
    id: uid(),
    subject,
    grade,
    number: taken.length ? Math.max(...taken) + 1 : 1,
    title: 'Neues Modul',
    icon: DEFAULT_TOPIC_ICON,
    description: '',
    competences: [],
    lang: defaultLang(subject),
    help: true,
    textbook: '',
    weeks: 0,
    start: '',
    updatedAt: Date.now(),
  };
}

export function newLesson(lib: Library, m: Module): Lesson {
  const taken = lessonsOf(lib, m.id).map((l) => l.number);
  const number = taken.length ? Math.max(...taken) + 1 : 1;
  const page = { ...createPage(), kicker: `${gradeLabel(m)} · ${m.title}` };
  return {
    id: uid(),
    moduleId: m.id,
    number,
    title: 'Neue Stunde',
    textbook: '',
    plan: '',
    slides: [],
    slideDesign: 'organisch',
    doc: { icon: m.icon, lang: m.lang, help: m.help, footer: footerFor(lib.settings, m.subject), code: lessonCode(m, number), pages: [page] },
    updatedAt: Date.now(),
  };
}

/**
 * A new lesson with a vocabulary test: `rows` are "given | answer" lines (see vocabTestRows), one point each.
 * `fold` makes it a fold test for practice; `gradeScale` adds the grade scale below.
 */
export function vocabTestLesson(lib: Library, m: Module, rows: string, fold: boolean, gradeScale: boolean, toEnglish: boolean | null): Lesson {
  const l = newLesson(lib, m);
  const en = m.lang === 'en';
  const count = rows.split('\n').filter(Boolean).length;
  const prompt = toEnglish === null ? (en ? 'Translate the words.' : 'Übersetze die Wörter.') : toEnglish ? (en ? 'Translate into English.' : 'Übersetze ins Englische.') : en ? 'Translate into German.' : 'Übersetze ins Deutsche.';
  const title = en ? 'Vocabulary test' : 'Vokabeltest';
  const page = {
    ...l.doc.pages[0],
    title: `${title}: ${m.title}`,
    type: 'test' as const,
    form: 'allein' as const,
    nameField: 'klasse' as const,
    blocks: [createBlock('foldtest', { prompt, rows, mode: fold ? 'knick' : 'test', points: fold ? 0 : count }), ...(gradeScale && !fold ? [createBlock('gradescale')] : [])],
  };
  return { ...l, title, doc: { ...l.doc, pages: [page] } };
}

/** A lesson made from an imported worksheet file. */
export function lessonFromDoc(lib: Library, m: Module, doc: Doc): Lesson {
  const l = newLesson(lib, m);
  return { ...l, title: doc.pages[0]?.title || l.title, doc: { ...doc, icon: m.icon, lang: m.lang, help: m.help, code: l.doc.code } };
}

/**
 * The first version kept a single worksheet. It moves into the library, placed by its code
 * ("K9 · M1 · S2") and footer ("… · Geographie").
 */
export function libraryFromOldDoc(doc: Doc): Library {
  const code = /K\s*(\d+)\s*·\s*M\s*(\d+)\s*·\s*S\s*(\d+)/.exec(doc.code);
  const parts = doc.footer.split('·').map((s) => s.trim()).filter(Boolean);
  const subject = parts.length > 1 ? parts[parts.length - 1] : 'Allgemein';
  const settings: Settings = { subjects: [subject], footerBase: parts.slice(0, -1).join(' · '), schoolYear: null, subjectColors: {}, updatedAt: Date.now() };
  const grade = code ? Math.min(10, Math.max(5, Number(code[1]))) : 9;
  const module: Module = {
    id: uid(),
    subject,
    grade,
    number: code ? Number(code[2]) : 1,
    title: 'Übernommenes Modul',
    icon: doc.icon,
    description: '',
    competences: [],
    lang: doc.lang,
    help: doc.help,
    textbook: '',
    weeks: 0,
    start: '',
    updatedAt: Date.now(),
  };
  const lesson: Lesson = {
    id: uid(),
    moduleId: module.id,
    number: code ? Number(code[3]) : 1,
    title: doc.pages[0]?.title || 'Stunde',
    textbook: '',
    plan: '',
    doc,
    slides: [],
    slideDesign: 'organisch',
    updatedAt: Date.now(),
  };
  return { settings, modules: [module], lessons: [lesson], deleted: {} };
}

/**
 * Sample library on first start: Geographie, Klasse 9, "Das Klima kippt" with the Treibhauseffekt lesson.
 * Fixed ids and time 0: the sample is the same on every device, so syncing two fresh devices does not
 * duplicate it, and any real edit is newer.
 */
export function seedLibrary(): Library {
  const settings: Settings = { subjects: ['Geographie'], footerBase: 'Kuhl · Grafen-von-Zimmern-Realschule', schoolYear: null, subjectColors: {}, updatedAt: 0 };
  const module: Module = {
    id: 'beispiel-modul',
    subject: 'Geographie',
    grade: 9,
    number: 1,
    title: 'Das Klima kippt',
    icon: 'thermometer-sun',
    description: 'Vom Zusammenhang zwischen CO₂ und Temperatur zum Mechanismus des Treibhauseffekts.',
    competences: [
      {
        id: 'beispiel-k1',
        area: 'Klimadiagramme und Kurven auswerten',
        g: 'Ich kann Werte aus einer Kurve ablesen.',
        m: 'Ich kann beschreiben, wie sich CO₂ und Temperatur entwickeln.',
        e: 'Ich kann begründen, warum ein zeitlicher Zusammenhang noch keine Ursache beweist.',
        lessons: '1',
        domain: '',
      },
      {
        id: 'beispiel-k2',
        area: 'Den Treibhauseffekt erklären',
        g: 'Ich kann die Stationen des Fließschemas nennen.',
        m: 'Ich kann den Treibhauseffekt mit dem Fließschema erklären.',
        e: 'Ich kann natürlichen und zusätzlichen Treibhauseffekt vergleichen.',
        lessons: '2',
        domain: '',
      },
      {
        id: 'beispiel-k3',
        area: 'Mit Modellen arbeiten',
        g: 'Ich kann den Modellversuch durchführen und Werte notieren.',
        m: 'Ich kann das Ergebnis des Versuchs deuten.',
        e: 'Ich kann erklären, was das Modell zeigt und was nicht.',
        lessons: '2',
        domain: '',
      },
    ],
    lang: 'de',
    help: true,
    textbook: '',
    weeks: 0,
    start: '',
    updatedAt: 0,
  };
  const doc = seedDoc();
  const lesson: Lesson = {
    id: 'beispiel-stunde',
    moduleId: module.id,
    number: 2,
    title: 'Der Treibhauseffekt',
    textbook: '',
    plan: '',
    doc,
    slides: seedSlides(),
    slideDesign: 'organisch',
    updatedAt: 0,
  };
  return { settings, modules: [module], lessons: [lesson], deleted: {} };
}

export interface SyncResult {
  library: Library;
  /** Entries taken from the file (new or newer there). */
  fromFile: number;
  /** Entries kept from this device because they are newer here or only here. */
  keptHere: number;
  /** Entries removed because they were deleted on the other device. */
  removed: number;
}

/**
 * Syncs this device's library with a backup from the other device (Mac ↔ iPad via iCloud Drive):
 * for each module and lesson the newer version wins, deletions win over older versions, and the
 * untouched sample (time 0) gives way to a file that does not contain it.
 */
export function syncLibrary(here: Library, file: Library): SyncResult {
  const deleted: Record<string, number> = { ...here.deleted };
  for (const [id, t] of Object.entries(file.deleted)) deleted[id] = Math.max(deleted[id] ?? 0, t);
  let fromFile = 0;
  let keptHere = 0;
  let removed = 0;

  function pick<T extends { id: string; updatedAt: number }>(mine: T[], theirs: T[]): T[] {
    const out = new Map<string, T>();
    const newerHere = new Set<string>();
    const theirById = new Map(theirs.map((x) => [x.id, x]));
    for (const x of mine) {
      const other = theirById.get(x.id);
      if (!other && x.updatedAt === 0 && theirs.length > 0) continue; // untouched sample, not on the other device
      if (other && other.updatedAt > x.updatedAt) {
        out.set(x.id, other);
        fromFile++;
      } else {
        out.set(x.id, x);
        if (!other || x.updatedAt > other.updatedAt) newerHere.add(x.id);
      }
    }
    for (const x of theirs) {
      if (!out.has(x.id) && !mine.some((m) => m.id === x.id)) {
        out.set(x.id, x);
        fromFile++;
      }
    }
    return [...out.values()].filter((x) => {
      const gone = (deleted[x.id] ?? -1) >= x.updatedAt;
      if (gone && mine.some((m) => m.id === x.id)) removed++;
      // Changed here but deleted later on the other device: counts as removed, not as newer here.
      if (!gone && newerHere.has(x.id)) keptHere++;
      return !gone;
    });
  }

  const modules = pick(here.modules, file.modules);
  const moduleIds = new Set(modules.map((m) => m.id));
  const lessons = pick(here.lessons, file.lessons).filter((l) => moduleIds.has(l.moduleId));
  const newer = file.settings.updatedAt > here.settings.updatedAt ? file.settings : here.settings;
  const subjects = [...here.settings.subjects];
  for (const s of file.settings.subjects) if (!subjects.includes(s)) subjects.push(s);
  return {
    library: { settings: { ...newer, subjects }, modules, lessons, deleted },
    fromFile,
    keptHere,
    removed,
  };
}

/** Latest change of anything in the library (for "changed since the last backup"). */
export function lastChange(lib: Library): number {
  return Math.max(lib.settings.updatedAt, ...lib.modules.map((m) => m.updatedAt), ...lib.lessons.map((l) => l.updatedAt), ...Object.values(lib.deleted), 0);
}

/** Number of modules and lessons changed (or deleted) after time `t`. */
export const changedSince = (lib: Library, t: number) =>
  lib.modules.filter((m) => m.updatedAt > t).length + lib.lessons.filter((l) => l.updatedAt > t).length + Object.values(lib.deleted).filter((d) => d > t).length;

/** A copy of a lesson as the next lesson of its module. */
export function duplicateLesson(lib: Library, m: Module, l: Lesson): Lesson {
  const fresh = newLesson(lib, m);
  return { ...fresh, title: `${l.title} (Kopie)`, plan: l.plan, doc: { ...l.doc, code: fresh.doc.code }, slides: l.slides.map((s) => ({ ...s, id: uid() })), slideDesign: l.slideDesign };
}

// — Trash and earlier versions (kept on this device only) —

/** Days a deleted module or lesson stays in the trash. */
export const TRASH_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

/** What goes into the trash when modules (with their lessons) and single lessons are deleted. */
export function toTrash(lib: Library, moduleIds: string[], lessonIds: string[], now: number): TrashEntry[] {
  const out: TrashEntry[] = [];
  const taken = new Set<string>();
  for (const id of moduleIds) {
    const module = lib.modules.find((m) => m.id === id);
    if (!module) continue;
    const lessons = lib.lessons.filter((l) => l.moduleId === id);
    lessons.forEach((l) => taken.add(l.id));
    out.push({ id: uid(), at: now, module, lessons });
  }
  for (const id of lessonIds) {
    const lesson = lib.lessons.find((l) => l.id === id);
    if (lesson && !taken.has(id)) out.push({ id: uid(), at: now, module: null, lessons: [lesson] });
  }
  return out;
}

/** The trash without what has been in it longer than `TRASH_DAYS`. */
export const purgeTrash = (trash: TrashEntry[], now: number) => trash.filter((e) => now - e.at < TRASH_DAYS * DAY);

/** Days left before an entry leaves the trash for good. */
export const trashDaysLeft = (e: TrashEntry, now: number) => Math.max(0, Math.ceil((e.at + TRASH_DAYS * DAY - now) / DAY));

export interface Restored {
  modules: Module[];
  lessons: Lesson[];
  trash: TrashEntry[];
}

/**
 * Brings a trash entry back. A lesson whose module is gone comes back with that module if it is in the trash too.
 * Everything restored counts as changed now, so a sync keeps it (deletions are older).
 */
export function restoreFromTrash(lib: Library, trash: TrashEntry[], entryId: string, now: number): Restored | { error: string } {
  const entry = trash.find((e) => e.id === entryId);
  if (!entry) return { error: 'Der Eintrag ist nicht mehr im Papierkorb.' };
  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  let rest = trash.filter((e) => e !== entry);
  if (entry.module) modules.push({ ...entry.module, updatedAt: now });
  else {
    const moduleId = entry.lessons[0]?.moduleId;
    if (!lib.modules.some((m) => m.id === moduleId)) {
      const home = rest.find((e) => e.module?.id === moduleId);
      if (!home?.module) return { error: 'Das Modul dieser Stunde gibt es nicht mehr. Stelle zuerst das Modul wieder her.' };
      modules.push({ ...home.module, updatedAt: now });
      lessons.push(...home.lessons);
      rest = rest.filter((e) => e !== home);
    }
  }
  lessons.push(...entry.lessons);
  // A lesson number that is taken in the meantime becomes the next free one.
  const taken = new Set(lib.lessons.map((l) => `${l.moduleId}:${l.number}`));
  const back = lessons.map((l) => {
    let number = l.number;
    while (taken.has(`${l.moduleId}:${number}`)) number++;
    taken.add(`${l.moduleId}:${number}`);
    return { ...l, number, updatedAt: now };
  });
  return { modules, lessons: back, trash: rest };
}

/** Earlier versions kept per lesson, and for how long. */
export const MAX_VERSIONS = 20;
export const VERSION_DAYS = 30;

/** Keeps `lesson` as an earlier version (unless the newest one is the same state); old ones drop out. */
export function addVersion(versions: LessonVersion[], lesson: Lesson, now: number, reason = ''): LessonVersion[] {
  const recent = versions.filter((v) => now - v.at < VERSION_DAYS * DAY);
  if (recent.some((v) => v.lesson.updatedAt === lesson.updatedAt)) return recent;
  return [{ at: now, reason, lesson }, ...recent].sort((a, b) => b.at - a.at).slice(0, MAX_VERSIONS);
}

/** "3 Seiten · 24 Bausteine · 9 Folien" */
export function lessonSize(l: Lesson): string {
  const pages = l.doc.pages.length;
  const blocks = l.doc.pages.reduce((n, p) => n + p.blocks.length, 0);
  return [
    `${pages} ${pages === 1 ? 'Seite' : 'Seiten'}`,
    `${blocks} ${blocks === 1 ? 'Baustein' : 'Bausteine'}`,
    l.slides.length ? `${l.slides.length} ${l.slides.length === 1 ? 'Folie' : 'Folien'}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
