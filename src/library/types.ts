// The library: subjects and grades hold modules (topics); a module holds lessons (Stunden)
// and a competence grid (Kompetenzraster). Each lesson is one worksheet document.
import type { Doc, Lang } from '../model/types';

export const GRADES = [5, 6, 7, 8, 9, 10] as const;

/** One row of the competence grid: a competence with "Ich kann …" descriptions for the three levels. */
export interface Competence {
  id: string;
  /** The competence or area, e.g. "Den Treibhauseffekt erklären". */
  area: string;
  /** Niveau G (grundlegend), M (mittel), E (erweitert). */
  g: string;
  m: string;
  e: string;
  /** Lessons where it is worked on, e.g. "2, 3". */
  lessons: string;
  /** Area of the Bildungsplan, e.g. "Leseverstehen"; groups the rows of the printed grid. */
  domain: string;
}

export interface Module {
  id: string;
  subject: string;
  grade: number;
  /** Module number within subject and grade: "Modul 1". */
  number: number;
  title: string;
  /** Topic icon, shown in every header band of the module's worksheets. */
  icon: string;
  /** Short description for the content overview. */
  description: string;
  competences: Competence[];
  /** Language of the worksheets: labels on the sheet, quotation marks, spell check. */
  lang: Lang;
  /** Show the German help under task instructions (English modules). */
  help: boolean;
  /** Textbook reference, e.g. "Green Line 1, Unit 2, S. 34–51". */
  textbook: string;
  /** Planned length in school weeks, for the year plan (0 = not planned). */
  weeks: number;
  /** Monday of the first week ("2026-09-14"); empty = right after the previous module. */
  start: string;
  updatedAt: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  /** Lesson number within the module: "Stunde 2". */
  number: number;
  title: string;
  /** Pages in the textbook and workbook, e.g. "SB S. 36–37, WB S. 20". */
  textbook: string;
  /** Planning note from the year plan: what the lesson is about while it is not worked out yet. */
  plan: string;
  doc: Doc;
  updatedAt: number;
}

export interface Settings {
  /** Subjects shown on the overview, also those without modules yet. */
  subjects: string[];
  /** Start of the footer of new worksheets, e.g. "Kuhl · Grafen-von-Zimmern-Realschule"; the subject is added. */
  footerBase: string;
  /** School year with holidays, for the year plan. */
  schoolYear: SchoolYear | null;
  /** Colour of each subject in the app, a token ramp ("accent-3"); subjects without one get a default. */
  subjectColors: Record<string, string>;
  /** When the settings last changed (for the Mac ↔ iPad sync); 0 = never. */
  updatedAt: number;
}

export interface Holiday {
  name: string;
  /** First and last day, "2026-10-26". */
  from: string;
  to: string;
}

export interface SchoolYear {
  /** "2026/27" */
  name: string;
  /** First and last day of school. */
  start: string;
  end: string;
  holidays: Holiday[];
}

export interface Library {
  settings: Settings;
  modules: Module[];
  lessons: Lesson[];
  /** Deleted modules and lessons (id → time of deletion), so a sync does not bring them back. */
  deleted: Record<string, number>;
}
