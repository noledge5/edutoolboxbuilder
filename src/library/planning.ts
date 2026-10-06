// Words for planning a unit: what each lesson does in it (its role), and where the notes about a class are kept.
import type { LessonRole } from './types';

/** The roles of a lesson in a unit, in the order a unit usually runs. `short` is the chip on the lesson. */
export const LESSON_ROLES: { v: LessonRole; l: string; short: string }[] = [
  { v: 'einstieg', l: 'Einstieg ins Modul', short: 'Einstieg' },
  { v: 'erarbeitung', l: 'Erarbeitung', short: 'Erarbeitung' },
  { v: 'uebung', l: 'Übung', short: 'Übung' },
  { v: 'anwendung', l: 'Anwendung, Transfer, Lernaufgabe', short: 'Anwendung' },
  { v: 'wiederholung', l: 'Wiederholung', short: 'Wiederholung' },
  { v: 'leistung', l: 'Leistungsnachweis (Klassenarbeit, Test, Präsentation)', short: 'Leistungsnachweis' },
  { v: 'rueckgabe', l: 'Rückgabe und Berichtigung', short: 'Rückgabe' },
  { v: 'projekt', l: 'Projekt, Exkursion', short: 'Projekt' },
];

export const isLessonRole = (x: unknown): x is LessonRole => LESSON_ROLES.some((r) => r.v === x);

export const roleLabel = (r: LessonRole | '') => LESSON_ROLES.find((x) => x.v === r)?.short ?? '';

/** Key of a class profile in the settings: one per subject and grade. */
export const classKey = (subject: string, grade: number) => `${subject.trim()} · ${grade}`;
