// Reading library entries from storage, backup files and other devices: older data gets defaults for newer fields.
import { readModuleLook } from '../model/look';
import { normalizeBoards } from '../model/ink';
import { normalizeDoc } from '../model/normalize';
import { isSlideDesign, normalizeSlides } from '../model/slides';
import type { Lang } from '../model/types';
import type { AssignmentPage, Handout } from '../share/assignment';
import { readSubjectColors } from './subjectColor';
import type { Competence, Holiday, Lesson, LessonVersion, Module, SchoolYear, Settings, TrashEntry } from './types';

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : '');
const int = (x: unknown, fallback = 0): number => {
  const n = typeof x === 'number' ? x : parseInt(str(x), 10);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const readLang = (x: unknown): Lang => (x === 'en' ? 'en' : 'de');

/** "2026-10-26", or "26.10.2026" as teachers write it; anything else becomes "". */
export function readDay(x: unknown): string {
  const s = str(x).trim();
  if (DAY.test(s)) return s;
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

export function readCompetence(raw: unknown): Competence | null {
  if (!isObj(raw)) return null;
  return {
    id: str(raw.id),
    area: str(raw.area),
    g: str(raw.g),
    m: str(raw.m),
    e: str(raw.e),
    lessons: Array.isArray(raw.lessons) ? raw.lessons.map(str).join(', ') : str(raw.lessons),
    domain: str(raw.domain),
  };
}

export function readModule(raw: unknown): Module | null {
  if (!isObj(raw) || typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    subject: str(raw.subject),
    grade: int(raw.grade, 5),
    number: int(raw.number, 1),
    title: str(raw.title),
    icon: str(raw.icon),
    description: str(raw.description),
    competences: Array.isArray(raw.competences) ? raw.competences.map(readCompetence).filter((c): c is Competence => c !== null) : [],
    lang: readLang(raw.lang),
    help: raw.help !== false,
    textbook: str(raw.textbook),
    weeks: Math.max(0, int(raw.weeks)),
    start: readDay(raw.start),
    ...(readModuleLook(raw.look) ? { look: readModuleLook(raw.look) } : {}),
    updatedAt: Number(raw.updatedAt) || 0,
  };
}

export function readLesson(raw: unknown): Lesson | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.moduleId !== 'string') return null;
  try {
    return {
      id: raw.id,
      moduleId: raw.moduleId,
      number: int(raw.number, 1),
      title: str(raw.title),
      textbook: str(raw.textbook),
      plan: str(raw.plan),
      doc: normalizeDoc(raw.doc),
      slides: normalizeSlides(raw.slides),
      slideDesign: isSlideDesign(raw.slideDesign) ? raw.slideDesign : 'organisch',
      boards: normalizeBoards(raw.boards),
      updatedAt: Number(raw.updatedAt) || 0,
    };
  } catch {
    return null;
  }
}

/** A handed-out assignment as stored or synced; its pages are checked like a worksheet. */
export function readHandout(raw: unknown): Handout | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !isObj(raw.privateKey) || !Array.isArray(raw.pages)) return null;
  try {
    const doc = normalizeDoc({ pages: raw.pages });
    const pages: AssignmentPage[] = doc.pages.map((p) => ({ title: p.title, kicker: p.kicker, type: p.type, blocks: p.blocks }));
    return {
      id: raw.id,
      lessonId: str(raw.lessonId),
      title: str(raw.title),
      mode: raw.mode === 'test' ? 'test' : 'uebung',
      url: str(raw.url),
      pages,
      privateKey: raw.privateKey as JsonWebKey,
      createdAt: Number(raw.createdAt) || 0,
      updatedAt: Number(raw.updatedAt) || 0,
    };
  } catch {
    return null;
  }
}

export const readHandouts = (raw: unknown): Handout[] => (Array.isArray(raw) ? raw.map(readHandout).filter((h): h is Handout => h !== null) : []);

export function readHoliday(raw: unknown): Holiday | null {
  if (!isObj(raw)) return null;
  const from = readDay(raw.from);
  const to = readDay(raw.to) || from;
  return from ? { name: str(raw.name), from, to: to < from ? from : to } : null;
}

export function readSchoolYear(raw: unknown): SchoolYear | null {
  if (!isObj(raw)) return null;
  const start = readDay(raw.start);
  const end = readDay(raw.end);
  if (!start || !end || end < start) return null;
  const holidays = (Array.isArray(raw.holidays) ? raw.holidays.map(readHoliday) : []).filter((h): h is Holiday => h !== null).sort((a, b) => a.from.localeCompare(b.from));
  return { name: str(raw.name), start, end, holidays };
}

/** Settings of older versions or other devices, completed with defaults. */
export function readSettings(raw: unknown): Settings {
  const s = isObj(raw) ? raw : {};
  return {
    subjects: Array.isArray(s.subjects) ? s.subjects.filter((x): x is string => typeof x === 'string') : [],
    footerBase: typeof s.footerBase === 'string' ? s.footerBase : '',
    schoolYear: readSchoolYear(s.schoolYear),
    subjectColors: readSubjectColors(s.subjectColors),
    updatedAt: Number(s.updatedAt) || 0,
  };
}

/** The trash as stored; broken entries are left out. */
export function readTrash(raw: unknown): TrashEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((e): TrashEntry[] => {
    if (!isObj(e) || typeof e.id !== 'string' || !Array.isArray(e.lessons)) return [];
    const lessons = e.lessons.map(readLesson).filter((l): l is Lesson => l !== null);
    const module = e.module ? readModule(e.module) : null;
    if (!module && !lessons.length) return [];
    return [{ id: e.id, at: Number(e.at) || 0, module, lessons }];
  });
}

/** Earlier versions of a lesson as stored. */
export function readVersions(raw: unknown): LessonVersion[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((v): LessonVersion[] => {
    const lesson = isObj(v) ? readLesson(v.lesson) : null;
    return lesson && isObj(v) ? [{ at: Number(v.at) || 0, reason: typeof v.reason === 'string' ? v.reason : '', lesson }] : [];
  });
}

export function readDeleted(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObj(raw)) for (const [k, v] of Object.entries(raw)) if (typeof v === 'number') out[k] = v;
  return out;
}
