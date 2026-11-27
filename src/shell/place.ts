// Where the library screens are: subject, class and module, for the sidebar and the class board.
import { modulesOf, subjectsOf } from '../library/model';
import type { Route } from '../library/router';
import { GRADES, type Library } from '../library/types';

export interface Place {
  subject: string;
  grade: number;
  moduleId?: string;
}

/** The subject and class the overview shows: the asked ones when they exist, else the first subject and its first class with modules. */
export function boardPlace(lib: Library, subject?: string, grade?: number): Place | null {
  const subjects = subjectsOf(lib);
  const s = subject && subjects.includes(subject) ? subject : subjects[0];
  if (!s) return null;
  const withModules = GRADES.filter((g) => modulesOf(lib, s, g).length > 0);
  const g = grade && (GRADES as readonly number[]).includes(grade) ? grade : (withModules[0] ?? GRADES[0]);
  return { subject: s, grade: g };
}

/** The place of any route; null where the sidebar has nothing to mark (Lernquest, an unknown module). */
export function placeOf(lib: Library, route: Route): Place | null {
  if (route.view === 'overview') return boardPlace(lib, route.subject, route.grade);
  if (route.view === 'plan') return { subject: route.subject, grade: route.grade };
  if (route.view === 'module') {
    const m = lib.modules.find((x) => x.id === route.id);
    return m ? { subject: m.subject, grade: m.grade, moduleId: m.id } : null;
  }
  if (route.view === 'lesson' || route.view === 'slides') {
    const l = lib.lessons.find((x) => x.id === route.id);
    const m = l && lib.modules.find((x) => x.id === l.moduleId);
    return m ? { subject: m.subject, grade: m.grade, moduleId: m.id } : null;
  }
  return null;
}
