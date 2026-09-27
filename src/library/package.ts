// Stundenpaket: modules with their competence grids and lessons in one JSON file, optionally with the school year.
// Claude writes these files (see src/claude/); a module or a whole year plan can be saved as one to share it or
// to give it to Claude as a template. Version 1 held exactly one module ("module" + "lessons"); version 2 holds a
// list ("modules"), each with its own lessons, plus textbook references, planned weeks and the school year.
// Reading is lenient: what can be repaired is repaired and reported as a note; only a missing subject, grade,
// module or page is an error.
import { BLOCK_TYPES, isBlockType } from '../model/blockTypes';
import { DocFormatError, normalizeDoc } from '../model/normalize';
import { mapBlockImages, uid } from '../model/ops';
import { THEMES, WORK_FORMS } from '../model/themes';
import type { Block, Doc, Page } from '../model/types';
import { DEFAULT_TOPIC_ICON, isTopicIcon } from '../topicIcons';
import { defaultLang, footerFor, isWorkedOut, lessonCode, lessonsOf, modulesOf, plannedDoc } from './model';
import { readDay, readSchoolYear } from './read';
import { GRADES, type Competence, type Lesson, type Library, type Module, type SchoolYear } from './types';

export const PACKAGE_FORMAT = 'arbeitsblatt-baukasten-paket';
export const PACKAGE_VERSION = 2;

/** Blocks in a package need no id, and props equal to the defaults can be left out. */
type PackagePage = Omit<Page, 'blocks'> & { blocks: (Omit<Block, 'id' | 'props'> & { props: Partial<Block['props']> })[] };

export interface PackageModule {
  subject: string;
  grade: number;
  number: number;
  title: string;
  icon: string;
  description: string;
  lang: Module['lang'];
  help: boolean;
  textbook: string;
  weeks: number;
  start?: string;
  competences: (Omit<Competence, 'lessons' | 'domain'> & { lessons?: string; domain?: string })[];
  /** Lessons; a planned lesson (year plan) has a title and a planning note but no pages yet. */
  lessons: { number: number; title: string; textbook?: string; plan?: string; pages?: PackagePage[] }[];
}

export interface PackageFile {
  format: typeof PACKAGE_FORMAT;
  version: number;
  savedAt?: string;
  schoolYear?: SchoolYear;
  modules: PackageModule[];
  /** Image id → data URL. */
  images?: Record<string, string>;
}

export interface ParsedLesson {
  number: number;
  title: string;
  textbook: string;
  plan: string;
  doc: Doc;
}

export interface ParsedModule {
  module: Omit<Module, 'id' | 'updatedAt'>;
  lessons: ParsedLesson[];
}

/** A package read from a file: modules and lesson documents with fresh ids, plus notes about what was repaired. */
export interface ParsedPackage {
  modules: ParsedModule[];
  schoolYear: SchoolYear | null;
  /** New image id → data URL, to be stored before the lessons are used. */
  images: Record<string, string>;
  notes: string[];
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): string => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : '');
const text = (x: unknown): string => (typeof x === 'string' ? x : Array.isArray(x) ? x.map(str).join('\n') : str(x));
const posInt = (x: unknown): number => {
  const n = typeof x === 'number' ? x : parseInt(str(x), 10);
  return Number.isInteger(n) && n > 0 ? n : 0;
};

export const isPackageFile = (raw: unknown): boolean => isObj(raw) && raw.format === PACKAGE_FORMAT;

/** Checks and repairs a Stundenpaket. Throws a DocFormatError with a German message if it cannot be used. */
export function readPackage(raw: unknown): ParsedPackage {
  if (!isObj(raw)) throw new DocFormatError('Die Datei ist kein Stundenpaket.');
  if (typeof raw.version === 'number' && raw.version > PACKAGE_VERSION) throw new DocFormatError('Das Stundenpaket stammt aus einer neueren Version des Baukastens.');
  const notes: string[] = [];

  // Images get fresh ids, so two packages that both call their picture "abb1" do not overwrite each other.
  const imageIds = new Map<string, string>();
  const images: Record<string, string> = {};
  for (const [id, url] of Object.entries(isObj(raw.images) ? raw.images : {})) {
    if (typeof url === 'string' && /^data:image\/[\w.+-]+(;base64)?,/.test(url)) {
      const newId = uid();
      imageIds.set(id, newId);
      images[newId] = url;
    } else notes.push(`Das Bild „${id}“ ist kein gültiges Bild (data:image/…) und wurde übersprungen.`);
  }

  let rawModules: unknown[];
  if (Array.isArray(raw.modules)) {
    if (raw.modules.length === 0) throw new DocFormatError('Das Stundenpaket enthält keine Module ("modules").');
    rawModules = raw.modules;
  } else {
    // Version 1: one module, lessons beside it.
    if (!isObj(raw.module)) throw new DocFormatError('Im Stundenpaket fehlt "modules" (oder "module") mit Fach, Klasse und Thema.');
    if (!Array.isArray(raw.lessons) || raw.lessons.length === 0) throw new DocFormatError('Das Stundenpaket enthält keine Stunden ("lessons").');
    rawModules = [{ ...raw.module, lessons: raw.lessons }];
  }
  const several = rawModules.length > 1;
  const modules = rawModules.map((m, i) => readModuleEntry(m, several ? `Modul ${i + 1}` : '', imageIds, notes));

  let schoolYear: SchoolYear | null = null;
  if (raw.schoolYear !== undefined) {
    schoolYear = readSchoolYear(raw.schoolYear);
    if (!schoolYear) notes.push('Das Schuljahr ("schoolYear") braucht Beginn und Ende als Datum („2026-09-14“); es wurde nicht übernommen.');
  }
  return { modules, schoolYear, images, notes };
}

function readModuleEntry(m: unknown, prefix: string, imageIds: Map<string, string>, notes: string[]): ParsedModule {
  const within = (s: string) => (prefix ? `${prefix}, ${s}` : s);
  if (!isObj(m)) throw new DocFormatError(`${prefix || 'Das Modul'} ist kein Objekt.`);
  const subject = str(m.subject);
  if (!subject) throw new DocFormatError(`Im Stundenpaket fehlt das Fach ("subject")${prefix ? ` bei ${prefix}` : ''}.`);
  const grade = posInt(m.grade);
  if (!(GRADES as readonly number[]).includes(grade))
    throw new DocFormatError(`Die Klasse ("grade")${prefix ? ` bei ${prefix}` : ''} muss eine Zahl von ${GRADES[0]} bis ${GRADES[GRADES.length - 1]} sein.`);
  const title = str(m.title) || 'Neues Modul';
  const about = (s: string) => (prefix ? `${prefix} („${title}“): ${s}` : s);
  let icon = str(m.icon);
  if (!isTopicIcon(icon)) {
    if (icon) notes.push(about(`Das Symbol „${icon}“ gibt es nicht, es wurde durch das Standardsymbol ersetzt.`));
    icon = DEFAULT_TOPIC_ICON;
  }
  const lang = m.lang === 'en' || m.lang === 'de' ? m.lang : defaultLang(subject);
  if (m.lang !== undefined && m.lang !== 'en' && m.lang !== 'de') notes.push(about(`Die Sprache „${String(m.lang)}“ gibt es nicht; möglich sind "de" und "en".`));

  // Competences get fresh ids; tasks refer to them by the id in the file.
  const compIds = new Map<string, string>();
  const competences: Competence[] = [];
  if (m.competences !== undefined && !Array.isArray(m.competences)) notes.push(within('"competences" ist keine Liste und wurde übersprungen.'));
  for (const [i, c] of (Array.isArray(m.competences) ? m.competences : []).entries()) {
    if (!isObj(c)) {
      notes.push(within(`Kompetenz ${i + 1} ist kein Objekt und wurde übersprungen.`));
      continue;
    }
    const id = uid();
    const fileId = str(c.id);
    if (fileId) {
      if (compIds.has(fileId)) notes.push(within(`Die Kompetenz-ID „${fileId}“ kommt mehrfach vor; Aufgaben verweisen auf die erste.`));
      else compIds.set(fileId, id);
    }
    competences.push({
      id,
      area: str(c.area),
      g: text(c.g),
      m: text(c.m),
      e: text(c.e),
      lessons: Array.isArray(c.lessons) ? c.lessons.map(str).join(', ') : str(c.lessons),
      domain: str(c.domain),
    });
  }

  const help = m.help !== false;
  const rawLessons = m.lessons === undefined ? [] : m.lessons;
  if (!Array.isArray(rawLessons)) throw new DocFormatError(within('"lessons" ist keine Liste.'));
  const lessons = rawLessons.map((l, i): ParsedLesson => {
    const at = within(`Stunde ${i + 1}`);
    if (!isObj(l)) throw new DocFormatError(`${at} ist kein Objekt.`);
    const pages = Array.isArray(l.pages) ? l.pages : isObj(l.doc) ? l.doc.pages : undefined;
    const plan = text(l.plan).trim();
    // A planned lesson of the year plan: title and note, the worksheet comes later.
    if ((pages === undefined || (Array.isArray(pages) && pages.length === 0)) && (str(l.title) || plan)) {
      const lessonTitle = str(l.title) || `Stunde ${posInt(l.number) || i + 1}`;
      return { number: posInt(l.number), title: lessonTitle, textbook: str(l.textbook), plan, doc: plannedDoc({ grade, lang, title, icon, help }, lessonTitle) };
    }
    if (!Array.isArray(pages) || pages.length === 0) throw new DocFormatError(`${at} hat keine Seiten ("pages").`);
    checkPages(pages, at, notes);
    let doc: Doc;
    try {
      doc = normalizeDoc({ pages, icon, lang });
    } catch (e) {
      throw new DocFormatError(`${at}: ${e instanceof Error ? e.message : String(e)}`);
    }
    doc.pages.forEach((pg, p) =>
      pg.blocks.forEach((b, k) => {
        b.id = uid();
        const place = `${at}, Seite ${p + 1}, Baustein ${k + 1} (${BLOCK_TYPES[b.type].label})`;
        const comp = String(b.props.competence ?? '');
        if (comp) {
          if (compIds.has(comp)) b.props.competence = compIds.get(comp)!;
          else {
            notes.push(`${place}: Die Kompetenz „${comp}“ steht nicht in "competences" des Moduls; die Verknüpfung wurde entfernt.`);
            b.props.competence = '';
          }
        }
        mapBlockImages(b, (img) => {
          if (imageIds.has(img)) return imageIds.get(img)!;
          notes.push(`${place}: Das Bild „${img}“ fehlt in "images"; es bleibt ein Platzhalter.`);
          return '';
        });
      }),
    );
    return { number: posInt(l.number), title: str(l.title) || doc.pages[0].title, textbook: str(l.textbook), plan, doc };
  });

  // Keep the lesson numbers from the file if they are usable, else number them in order.
  const nums = lessons.map((l) => l.number);
  if (nums.some((n) => n === 0) || new Set(nums).size !== nums.length) {
    if (nums.some((n) => n !== 0)) notes.push(within('Die Stundennummern waren unvollständig oder doppelt; die Stunden wurden der Reihe nach nummeriert.'));
    lessons.forEach((l, i) => (l.number = i + 1));
  }

  const start = readDay(m.start);
  if (str(m.start) && !start) notes.push(about(`Der Beginn „${str(m.start)}“ ist kein Datum („2026-09-14“) und wurde weggelassen.`));
  return {
    module: {
      subject,
      grade,
      number: posInt(m.number),
      title,
      icon,
      description: text(m.description).trim(),
      competences,
      lang,
      help,
      textbook: str(m.textbook),
      weeks: posInt(m.weeks),
      start,
    },
    lessons,
  };
}

/** Notes about content the normalizer would silently drop or replace: unknown block types, fields and page settings. */
function checkPages(pages: unknown[], where: string, notes: string[]) {
  pages.forEach((pg, p) => {
    if (!isObj(pg)) return;
    const at = `${where}, Seite ${p + 1}`;
    if (pg.type !== undefined && !(String(pg.type) in THEMES)) notes.push(`${at}: Den Blatt-Typ „${String(pg.type)}“ gibt es nicht, die Seite ist jetzt eine Übung.`);
    if (pg.form !== undefined && !WORK_FORMS.includes(pg.form as never)) notes.push(`${at}: Die Sozialform „${String(pg.form)}“ gibt es nicht, jetzt „allein“.`);
    if (!Array.isArray(pg.blocks)) return;
    pg.blocks.forEach((b, k) => {
      if (!isObj(b)) return;
      if (!isBlockType(b.type)) {
        notes.push(`${at}: Den Baustein „${String(b.type)}“ gibt es nicht, er wurde weggelassen.`);
        return;
      }
      const T = BLOCK_TYPES[b.type];
      const known = new Set([...Object.keys(T.defaults), ...T.fields.map((f) => f.key)]);
      const unknown = Object.keys(isObj(b.props) ? b.props : {}).filter((key) => !known.has(key));
      if (unknown.length) notes.push(`${at}, Baustein ${k + 1} (${T.label}): unbekannte Felder ${unknown.map((u) => `„${u}“`).join(', ')} wurden ignoriert.`);
    });
  });
}

/** What importing a package did with one of its modules. */
export interface ImportResult {
  module: Module;
  /** New module, or an existing one with the same number that was filled in (a planned module, or a year plan for a module in progress). */
  action: 'neu' | 'ergänzt';
  /** Lessons added and lessons of the module that were replaced or completed. */
  added: number;
  changed: number;
  /** Of the added and changed lessons, how many are only planned. */
  planned: number;
}

const workedOut = (l: ParsedLesson) => l.doc.pages.some((p) => p.blocks.length > 0);

/**
 * Adds a read package to the library. A module whose number is already taken in its subject and grade
 * is merged into the existing module when nothing worked out gets lost: a year plan completes a module
 * (missing lessons are added as planned), and worked-out lessons fill a module that is only planned.
 * Otherwise the package becomes a new module with the next free number.
 * Returns the new and changed modules and lessons.
 */
export function addPackage(lib: Library, p: ParsedPackage): { modules: Module[]; lessons: Lesson[]; notes: string[]; results: ImportResult[] } {
  const now = Date.now();
  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  const results: ImportResult[] = [];
  const used = new Set<string>();
  for (const pm of p.modules) {
    const same = (m: Module) => m.subject === pm.module.subject && m.grade === pm.module.grade;
    const existing = modulesOf(lib, pm.module.subject, pm.module.grade);
    const incomingDone = pm.lessons.some(workedOut);
    const target = existing.find((m) => m.number === pm.module.number && !used.has(m.id));
    const targetLessons = target ? lessonsOf(lib, target.id) : [];
    const targetDone = targetLessons.some(isWorkedOut);

    if (target && pm.module.number && !(incomingDone && targetDone)) {
      used.add(target.id);
      const module = mergeModule(target, pm.module, targetDone, now);
      modules.push(module);
      const r: ImportResult = { module, action: 'ergänzt', added: 0, changed: 0, planned: 0 };
      const footer = footerFor(lib.settings, module.subject);
      for (const l of pm.lessons) {
        const doc = { ...l.doc, icon: module.icon, lang: module.lang, help: module.help, footer, code: lessonCode(module, l.number) };
        const old = targetLessons.find((x) => x.number === l.number);
        if (!old) {
          lessons.push({ id: uid(), moduleId: module.id, number: l.number, title: l.title, textbook: l.textbook, plan: l.plan, doc, updatedAt: now });
          r.added++;
          if (!workedOut(l)) r.planned++;
        } else if (!isWorkedOut(old)) {
          // Only planned so far: the package's version replaces it, keeping what the package leaves empty.
          lessons.push({ ...old, title: l.title || old.title, textbook: l.textbook || old.textbook, plan: l.plan || old.plan, doc, updatedAt: now });
          r.changed++;
          if (!workedOut(l)) r.planned++;
        } else if (l.plan && !old.plan) {
          lessons.push({ ...old, plan: l.plan, updatedAt: now });
          r.changed++;
        }
      }
      results.push(r);
      continue;
    }

    const taken = [...existing, ...modules.filter((m) => same(m) && !existing.includes(m))].map((m) => m.number);
    const wanted = pm.module.number;
    const number = wanted && !taken.includes(wanted) ? wanted : taken.length ? Math.max(...taken) + 1 : 1;
    const module: Module = { ...pm.module, id: uid(), number, updatedAt: now };
    modules.push(module);
    const footer = footerFor(lib.settings, module.subject);
    for (const l of pm.lessons) {
      lessons.push({
        id: uid(),
        moduleId: module.id,
        number: l.number,
        title: l.title,
        textbook: l.textbook,
        plan: l.plan,
        doc: { ...l.doc, icon: module.icon, lang: module.lang, help: module.help, footer, code: lessonCode(module, l.number) },
        updatedAt: now,
      });
    }
    results.push({ module, action: 'neu', added: pm.lessons.length, changed: 0, planned: pm.lessons.filter((l) => !workedOut(l)).length });
  }
  return { modules, lessons, notes: p.notes, results };
}

/**
 * The existing module with the package's data. A module in progress keeps its data and only gets
 * what is still empty; a module that is only planned takes the package's data where it has any.
 */
function mergeModule(old: Module, pm: ParsedModule['module'], inProgress: boolean, now: number): Module {
  const fill = {
    description: old.description || pm.description,
    textbook: old.textbook || pm.textbook,
    weeks: old.weeks || pm.weeks,
    start: old.start || pm.start,
    competences: old.competences.length ? old.competences : pm.competences,
  };
  if (inProgress) return { ...old, ...fill, updatedAt: now };
  return {
    ...old,
    title: pm.title || old.title,
    icon: pm.icon === DEFAULT_TOPIC_ICON ? old.icon : pm.icon,
    description: pm.description || old.description,
    textbook: pm.textbook || old.textbook,
    weeks: pm.weeks || old.weeks,
    start: pm.start || old.start,
    competences: pm.competences.length ? pm.competences : old.competences,
    lang: pm.lang,
    help: pm.help,
    updatedAt: now,
  };
}

function packageModule(m: Module, lessons: Lesson[]): PackageModule {
  return {
    subject: m.subject,
    grade: m.grade,
    number: m.number,
    title: m.title,
    icon: m.icon,
    description: m.description,
    lang: m.lang,
    help: m.help,
    textbook: m.textbook,
    weeks: m.weeks,
    ...(m.start ? { start: m.start } : {}),
    competences: m.competences.map(({ id, area, g, m: mid, e, lessons: ls, domain }) => ({ id, ...(domain ? { domain } : {}), area, g, m: mid, e, ...(ls.trim() ? { lessons: ls } : {}) })),
    lessons: [...lessons]
      .sort((a, b) => a.number - b.number)
      .map((l) => ({
        number: l.number,
        title: l.title,
        ...(l.textbook ? { textbook: l.textbook } : {}),
        ...(l.plan ? { plan: l.plan } : {}),
        // A planned lesson goes without its empty page, so Claude sees it as planned.
        ...(isWorkedOut(l) ? { pages: l.doc.pages.map((pg) => ({ ...pg, blocks: pg.blocks.map(leanBlock) })) } : {}),
      })),
  };
}

/** Modules with their lessons as a Stundenpaket (images are added by the caller). */
export function packageFromModules(entries: { module: Module; lessons: Lesson[] }[], schoolYear?: SchoolYear | null): PackageFile {
  return {
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    savedAt: new Date().toISOString(),
    ...(schoolYear ? { schoolYear } : {}),
    modules: entries.map((e) => packageModule(e.module, e.lessons)),
  };
}

export const packageFromModule = (m: Module, lessons: Lesson[]) => packageFromModules([{ module: m, lessons }]);

function leanBlock(b: Block): PackagePage['blocks'][number] {
  const defaults = BLOCK_TYPES[b.type].defaults;
  return { type: b.type, span: b.span, props: Object.fromEntries(Object.entries(b.props).filter(([k, v]) => v !== defaults[k])) };
}
