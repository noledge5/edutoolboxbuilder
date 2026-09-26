// The library: subjects and grades hold modules (topics); a module holds lessons (Stunden)
// and a competence grid (Kompetenzraster). Each lesson is one worksheet document.
import type { Doc } from '../model/types';

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
  updatedAt: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  /** Lesson number within the module: "Stunde 2". */
  number: number;
  title: string;
  doc: Doc;
  updatedAt: number;
}

export interface Settings {
  /** Subjects shown on the overview, also those without modules yet. */
  subjects: string[];
  /** Start of the footer of new worksheets, e.g. "Kuhl · Grafen-von-Zimmern-Realschule"; the subject is added. */
  footerBase: string;
}

export interface Library {
  settings: Settings;
  modules: Module[];
  lessons: Lesson[];
}
