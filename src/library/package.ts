// Stundenpaket: one module with its competence grid and all its lessons in one JSON file.
// Claude writes these files (see src/claude/), and a module can be saved as one to share it or to give it to Claude as a template.
// Reading is lenient: what can be repaired is repaired and reported as a note, only a missing subject, grade or lesson is an error.
import { BLOCK_TYPES, isBlockType } from '../model/blockTypes';
import { DocFormatError, normalizeDoc } from '../model/normalize';
import { uid } from '../model/ops';
import { THEMES, WORK_FORMS } from '../model/themes';
import type { Block, Doc, Page } from '../model/types';
import { DEFAULT_TOPIC_ICON, isTopicIcon } from '../topicIcons';
import { footerFor, lessonCode, modulesOf } from './model';
import { GRADES, type Competence, type Lesson, type Library, type Module } from './types';

export const PACKAGE_FORMAT = 'arbeitsblatt-baukasten-paket';
export const PACKAGE_VERSION = 1;

/** Blocks in a package need no id, and props equal to the defaults can be left out. */
type PackagePage = Omit<Page, 'blocks'> & { blocks: (Omit<Block, 'id' | 'props'> & { props: Partial<Block['props']> })[] };

export interface PackageFile {
  format: typeof PACKAGE_FORMAT;
  version: number;
  savedAt?: string;
  module: {
    subject: string;
    grade: number;
    number: number;
    title: string;
    icon: string;
    description: string;
    competences: (Omit<Competence, 'lessons'> & { lessons?: string })[];
  };
  lessons: { number: number; title: string; pages: PackagePage[] }[];
  /** Image id → data URL. */
  images?: Record<string, string>;
}

/** A package read from a file: module data and lesson documents with fresh ids, plus notes about what was repaired. */
export interface ParsedPackage {
  module: Omit<Module, 'id' | 'updatedAt'>;
  lessons: { number: number; title: string; doc: Doc }[];
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
  const m = raw.module;
  if (!isObj(m)) throw new DocFormatError('Im Stundenpaket fehlt "module" mit Fach, Klasse und Thema.');
  const subject = str(m.subject);
  if (!subject) throw new DocFormatError('Im Stundenpaket fehlt das Fach ("module.subject").');
  const grade = posInt(m.grade);
  if (!(GRADES as readonly number[]).includes(grade)) throw new DocFormatError(`Die Klasse ("module.grade") muss eine Zahl von ${GRADES[0]} bis ${GRADES[GRADES.length - 1]} sein.`);
  let icon = str(m.icon);
  if (!isTopicIcon(icon)) {
    if (icon) notes.push(`Das Symbol „${icon}“ gibt es nicht, es wurde durch das Standardsymbol ersetzt.`);
    icon = DEFAULT_TOPIC_ICON;
  }

  // Competences get fresh ids; tasks refer to them by the id in the file.
  const compIds = new Map<string, string>();
  const competences: Competence[] = [];
  if (m.competences !== undefined && !Array.isArray(m.competences)) notes.push('"module.competences" ist keine Liste und wurde übersprungen.');
  for (const [i, c] of (Array.isArray(m.competences) ? m.competences : []).entries()) {
    if (!isObj(c)) {
      notes.push(`Kompetenz ${i + 1} ist kein Objekt und wurde übersprungen.`);
      continue;
    }
    const id = uid();
    const fileId = str(c.id);
    if (fileId) {
      if (compIds.has(fileId)) notes.push(`Die Kompetenz-ID „${fileId}“ kommt mehrfach vor; Aufgaben verweisen auf die erste.`);
      else compIds.set(fileId, id);
    }
    competences.push({ id, area: str(c.area), g: text(c.g), m: text(c.m), e: text(c.e), lessons: Array.isArray(c.lessons) ? c.lessons.map(str).join(', ') : str(c.lessons) });
  }

  // Images get fresh ids too, so two packages that both call their picture "abb1" do not overwrite each other.
  const imageIds = new Map<string, string>();
  const images: Record<string, string> = {};
  for (const [id, url] of Object.entries(isObj(raw.images) ? raw.images : {})) {
    if (typeof url === 'string' && /^data:image\/[\w.+-]+(;base64)?,/.test(url)) {
      const newId = uid();
      imageIds.set(id, newId);
      images[newId] = url;
    } else notes.push(`Das Bild „${id}“ ist kein gültiges Bild (data:image/…) und wurde übersprungen.`);
  }

  if (!Array.isArray(raw.lessons) || raw.lessons.length === 0) throw new DocFormatError('Das Stundenpaket enthält keine Stunden ("lessons").');
  const lessons = raw.lessons.map((l, i) => {
    const where = `Stunde ${i + 1}`;
    if (!isObj(l)) throw new DocFormatError(`${where} ist kein Objekt.`);
    const pages = Array.isArray(l.pages) ? l.pages : isObj(l.doc) ? l.doc.pages : undefined;
    if (!Array.isArray(pages) || pages.length === 0) throw new DocFormatError(`${where} hat keine Seiten ("pages").`);
    checkPages(pages, where, notes);
    let doc: Doc;
    try {
      doc = normalizeDoc({ pages, icon });
    } catch (e) {
      throw new DocFormatError(`${where}: ${e instanceof Error ? e.message : String(e)}`);
    }
    doc.pages.forEach((pg, p) =>
      pg.blocks.forEach((b, k) => {
        b.id = uid();
        const at = `${where}, Seite ${p + 1}, Baustein ${k + 1} (${BLOCK_TYPES[b.type].label})`;
        const comp = String(b.props.competence ?? '');
        if (comp) {
          if (compIds.has(comp)) b.props.competence = compIds.get(comp)!;
          else {
            notes.push(`${at}: Die Kompetenz „${comp}“ steht nicht in "module.competences"; die Verknüpfung wurde entfernt.`);
            b.props.competence = '';
          }
        }
        const img = String(b.props.image ?? '');
        if (b.type === 'image' && img) {
          if (imageIds.has(img)) b.props.image = imageIds.get(img)!;
          else {
            notes.push(`${at}: Das Bild „${img}“ fehlt in "images"; es bleibt ein Platzhalter.`);
            b.props.image = '';
          }
        }
      }),
    );
    return { number: posInt(l.number), title: str(l.title) || doc.pages[0].title, doc };
  });

  // Keep the lesson numbers from the file if they are usable, else number them in order.
  const nums = lessons.map((l) => l.number);
  if (nums.some((n) => n === 0) || new Set(nums).size !== nums.length) {
    if (nums.some((n) => n !== 0)) notes.push('Die Stundennummern waren unvollständig oder doppelt; die Stunden wurden der Reihe nach nummeriert.');
    lessons.forEach((l, i) => (l.number = i + 1));
  }

  return {
    module: { subject, grade, number: posInt(m.number), title: str(m.title) || 'Neues Modul', icon, description: text(m.description).trim(), competences },
    lessons,
    images,
    notes,
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

/** Adds a read package to the library as a new module. Keeps its module number if that is still free, else takes the next one. */
export function addPackage(lib: Library, p: ParsedPackage): { module: Module; lessons: Lesson[]; notes: string[] } {
  const taken = modulesOf(lib, p.module.subject, p.module.grade).map((m) => m.number);
  const number = p.module.number && !taken.includes(p.module.number) ? p.module.number : taken.length ? Math.max(...taken) + 1 : 1;
  const now = Date.now();
  const module: Module = { ...p.module, id: uid(), number, updatedAt: now };
  const footer = footerFor(lib.settings, module.subject);
  const lessons = p.lessons.map(
    (l): Lesson => ({
      id: uid(),
      moduleId: module.id,
      number: l.number,
      title: l.title,
      doc: { ...l.doc, icon: module.icon, footer, code: lessonCode(module, l.number) },
      updatedAt: now,
    }),
  );
  return { module, lessons, notes: p.notes };
}

/** A module and its lessons as a Stundenpaket (images are added by the caller). */
export function packageFromModule(m: Module, lessons: Lesson[]): PackageFile {
  return {
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    savedAt: new Date().toISOString(),
    module: {
      subject: m.subject,
      grade: m.grade,
      number: m.number,
      title: m.title,
      icon: m.icon,
      description: m.description,
      competences: m.competences.map(({ id, area, g, m: mid, e, lessons: ls }) => ({ id, area, g, m: mid, e, ...(ls.trim() ? { lessons: ls } : {}) })),
    },
    lessons: [...lessons]
      .sort((a, b) => a.number - b.number)
      .map((l) => ({ number: l.number, title: l.title, pages: l.doc.pages.map((pg) => ({ ...pg, blocks: pg.blocks.map(leanBlock) })) })),
  };
}

function leanBlock(b: Block): PackagePage['blocks'][number] {
  const defaults = BLOCK_TYPES[b.type].defaults;
  return { type: b.type, span: b.span, props: Object.fromEntries(Object.entries(b.props).filter(([k, v]) => v !== defaults[k])) };
}
