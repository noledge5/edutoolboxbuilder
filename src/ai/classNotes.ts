// What Claude is told about the class and the teacher with every request: the class profile of the subject and grade
// and the teacher's own principles. Both are in the library settings (synced, in backups) and must not hold names.
import { createContext } from 'react';
import { classKey } from '../library/planning';
import type { Settings } from '../library/types';
import { flat } from '../model/text';


export const classProfileOf = (s: Settings, subject: string, grade: number) => s.classProfiles[classKey(subject, grade)] ?? '';

/** The notes as Markdown for a request; '' when there are none. */
export function classNotes(s: Settings, subject: string, grade: number): string {
  const profile = flat(classProfileOf(s, subject, grade));
  const principles = flat(s.principles);
  if (!profile && !principles) return '';
  return [
    '## Die Klasse und die Lehrkraft',
    profile && `- Die Klasse (${subject}, Klasse ${grade}): ${profile}`,
    principles && `- Grundsätze der Lehrkraft: ${principles}`,
    '- Richte Material, Sprache, Hilfen, Methoden und Tempo danach aus; die Grundsätze gelten, solange der Auftrag nichts anderes sagt.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** The settings with a new class profile and principles. */
export function withClassNotes(s: Settings, subject: string, grade: number, profile: string, principles: string): Settings {
  const classProfiles = { ...s.classProfiles };
  if (profile.trim()) classProfiles[classKey(subject, grade)] = profile.trim();
  else delete classProfiles[classKey(subject, grade)];
  return { ...s, classProfiles, principles: principles.trim() };
}

/** The library settings and how to save them, for the class line in the AI dialogs (set by the app). */
export const ClassNotesContext = createContext<{ settings: Settings; save(s: Settings): void } | null>(null);
