// Pure library helpers: codes, new modules and lessons, migration of the old single worksheet, sample data.
import { createPage, uid } from '../model/ops';
import { seedDoc } from '../model/seed';
import type { Doc } from '../model/types';
import { DEFAULT_TOPIC_ICON } from '../topicIcons';
import type { Competence, Lesson, Library, Module, Settings } from './types';

/** Kürzel of a lesson: "K9 · M1 · S2". */
export const lessonCode = (m: Module, lessonNumber: number) => `K${m.grade} · M${m.number} · S${lessonNumber}`;

/** Kürzel of a module: "K9 · M1". */
export const moduleCode = (m: Module) => `K${m.grade} · M${m.number}`;

/** "Geographie · Klasse 9 · Modul 1: Das Klima kippt" */
export const modulePlace = (m: Module) => `${m.subject} · Klasse ${m.grade} · Modul ${m.number}: ${m.title}`;

export const footerFor = (settings: Settings, subject: string) => [settings.footerBase.trim(), subject].filter(Boolean).join(' · ');

/** The lesson's document with icon and code taken from its module, so they are always consistent. */
export const docForLesson = (m: Module, l: Lesson): Doc => ({ ...l.doc, icon: m.icon, code: lessonCode(m, l.number) });

export const modulesOf = (lib: Library, subject: string, grade: number) =>
  lib.modules.filter((m) => m.subject === subject && m.grade === grade).sort((a, b) => a.number - b.number || a.title.localeCompare(b.title));

export const lessonsOf = (lib: Library, moduleId: string) => lib.lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.number - b.number);

/** Subjects from the settings and from existing modules, in the order they were added. */
export function subjectsOf(lib: Library): string[] {
  const all = [...lib.settings.subjects];
  for (const m of lib.modules) if (!all.includes(m.subject)) all.push(m.subject);
  return all;
}

export const newCompetence = (): Competence => ({ id: uid(), area: '', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …', lessons: '' });

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
    updatedAt: Date.now(),
  };
}

export function newLesson(lib: Library, m: Module): Lesson {
  const taken = lessonsOf(lib, m.id).map((l) => l.number);
  const number = taken.length ? Math.max(...taken) + 1 : 1;
  const page = { ...createPage(), kicker: `Klasse ${m.grade} · ${m.title}` };
  return {
    id: uid(),
    moduleId: m.id,
    number,
    title: 'Neue Stunde',
    doc: { icon: m.icon, footer: footerFor(lib.settings, m.subject), code: lessonCode(m, number), pages: [page] },
    updatedAt: Date.now(),
  };
}

/** A lesson made from an imported worksheet file. */
export function lessonFromDoc(lib: Library, m: Module, doc: Doc): Lesson {
  const l = newLesson(lib, m);
  return { ...l, title: doc.pages[0]?.title || l.title, doc: { ...doc, icon: m.icon, code: l.doc.code } };
}

/**
 * The first version kept a single worksheet. It moves into the library, placed by its code
 * ("K9 · M1 · S2") and footer ("… · Geographie").
 */
export function libraryFromOldDoc(doc: Doc): Library {
  const code = /K\s*(\d+)\s*·\s*M\s*(\d+)\s*·\s*S\s*(\d+)/.exec(doc.code);
  const parts = doc.footer.split('·').map((s) => s.trim()).filter(Boolean);
  const subject = parts.length > 1 ? parts[parts.length - 1] : 'Allgemein';
  const settings: Settings = { subjects: [subject], footerBase: parts.slice(0, -1).join(' · ') };
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
    updatedAt: Date.now(),
  };
  const lesson: Lesson = { id: uid(), moduleId: module.id, number: code ? Number(code[3]) : 1, title: doc.pages[0]?.title || 'Stunde', doc, updatedAt: Date.now() };
  return { settings, modules: [module], lessons: [lesson] };
}

/** Sample library on first start: Geographie, Klasse 9, "Das Klima kippt" with the Treibhauseffekt lesson. */
export function seedLibrary(): Library {
  const settings: Settings = { subjects: ['Geographie'], footerBase: 'Kuhl · Grafen-von-Zimmern-Realschule' };
  const module: Module = {
    id: uid(),
    subject: 'Geographie',
    grade: 9,
    number: 1,
    title: 'Das Klima kippt',
    icon: 'thermometer-sun',
    description: 'Vom Zusammenhang zwischen CO₂ und Temperatur zum Mechanismus des Treibhauseffekts.',
    competences: [
      {
        id: uid(),
        area: 'Klimadiagramme und Kurven auswerten',
        g: 'Ich kann Werte aus einer Kurve ablesen.',
        m: 'Ich kann beschreiben, wie sich CO₂ und Temperatur entwickeln.',
        e: 'Ich kann begründen, warum ein zeitlicher Zusammenhang noch keine Ursache beweist.',
        lessons: '1',
      },
      {
        id: uid(),
        area: 'Den Treibhauseffekt erklären',
        g: 'Ich kann die Stationen des Fließschemas nennen.',
        m: 'Ich kann den Treibhauseffekt mit dem Fließschema erklären.',
        e: 'Ich kann natürlichen und zusätzlichen Treibhauseffekt vergleichen.',
        lessons: '2',
      },
      {
        id: uid(),
        area: 'Mit Modellen arbeiten',
        g: 'Ich kann den Modellversuch durchführen und Werte notieren.',
        m: 'Ich kann das Ergebnis des Versuchs deuten.',
        e: 'Ich kann erklären, was das Modell zeigt und was nicht.',
        lessons: '2',
      },
    ],
    updatedAt: Date.now(),
  };
  const doc = seedDoc();
  const lesson: Lesson = { id: uid(), moduleId: module.id, number: 2, title: 'Der Treibhauseffekt', doc, updatedAt: Date.now() };
  return { settings, modules: [module], lessons: [lesson] };
}

/** Adds a library backup to the current library: entries with the same id are replaced, the rest is kept. */
export function mergeLibrary(current: Library, incoming: Library): Library {
  const modules = new Map(current.modules.map((m) => [m.id, m]));
  for (const m of incoming.modules) modules.set(m.id, m);
  const lessons = new Map(current.lessons.map((l) => [l.id, l]));
  for (const l of incoming.lessons) lessons.set(l.id, l);
  const subjects = [...current.settings.subjects];
  for (const s of incoming.settings.subjects) if (!subjects.includes(s)) subjects.push(s);
  return {
    settings: { subjects, footerBase: current.settings.footerBase || incoming.settings.footerBase },
    modules: [...modules.values()],
    lessons: [...lessons.values()],
  };
}

/** A copy of a lesson as the next lesson of its module. */
export function duplicateLesson(lib: Library, m: Module, l: Lesson): Lesson {
  const fresh = newLesson(lib, m);
  return { ...fresh, title: `${l.title} (Kopie)`, doc: { ...l.doc, code: fresh.doc.code } };
}
