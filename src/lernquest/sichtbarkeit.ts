// What a class sees of a lesson (decided with the teacher on 08.11.2026): unlocked (a station to play), locked (a
// station with a lock on the world map) or hidden (not on the map at all). Unlocked lives on the server (the class's
// packages); hidden lives per class in the teacher record (`versteckt`, src/lernquest/lehrkraft.ts), and works by
// leaving the lesson out of `modul.stunden` in the packages of the module. Pure, so it is tested without a browser.

export type Stufe = 'frei' | 'gesperrt' | 'aus';

export const STUFEN: { id: Stufe; label: string }[] = [
  { id: 'frei', label: 'Freigeschaltet' },
  { id: 'gesperrt', label: 'Gesperrt' },
  { id: 'aus', label: 'Ausgeblendet' },
];

/** The level of a lesson for a class; an unlocked lesson is always shown, whatever is stored as hidden. */
export function stufeVon(id: string, frei: readonly string[], versteckt: readonly string[]): Stufe {
  if (frei.includes(id)) return 'frei';
  return versteckt.includes(id) ? 'aus' : 'gesperrt';
}

export interface StufenPlan {
  /** The class's hidden lessons afterwards. */
  versteckt: string[];
  /** Send the lesson's package (unlock it). */
  senden: boolean;
  /** Take the lesson's package back (lock it). */
  sperren: boolean;
  /** Unlocked lessons of the same module whose packages must go again, with the new list of the module's lessons. */
  neuSenden: string[];
}

/**
 * What to do when lesson `id` gets level `stufe` in a class: `frei` are the class's unlocked lessons, `versteckt` its
 * hidden ones, `modul` the ids of all lessons in the lesson's module.
 */
export function stufenPlan(id: string, stufe: Stufe, frei: readonly string[], versteckt: readonly string[], modul: readonly string[]): StufenPlan {
  const war = frei.includes(id);
  const ohne = versteckt.filter((x) => x !== id);
  const neu = stufe === 'aus' ? [...ohne, id] : ohne;
  const warAus = !war && versteckt.includes(id);
  const listeAnders = warAus !== (stufe === 'aus');
  return {
    versteckt: neu,
    senden: stufe === 'frei' && !war,
    sperren: stufe !== 'frei' && war,
    neuSenden: listeAnders ? frei.filter((x) => x !== id && modul.includes(x)) : [],
  };
}

export interface ModulPlan {
  /** The class's hidden lessons afterwards. */
  versteckt: string[];
  /** Lessons to send (unlock); they go with the new lesson list. */
  senden: string[];
  /** Lessons whose package is taken back (lock them). */
  sperren: string[];
  /** Lessons that stay unlocked but whose packages must go again with the new lesson list. */
  neuSenden: string[];
}

/**
 * What to do when all lessons of a module get level `stufe` at once (decided with the teacher on 09.11.2026): `modul`
 * are the ids of the module's lessons, `sendbar` those that can be unlocked (they have exercises). With `frei`, a lesson
 * that cannot be unlocked becomes locked (an unlocked one stays). Every package goes at most once per click.
 */
export function modulPlan(stufe: Stufe, frei: readonly string[], versteckt: readonly string[], modul: readonly string[], sendbar: readonly string[]): ModulPlan {
  const ziel = stufe === 'frei' ? modul.filter((id) => sendbar.includes(id)) : [...modul];
  const ohne = versteckt.filter((x) => !modul.includes(x));
  const neu = stufe === 'aus' ? [...ohne, ...modul] : ohne;
  const freiNachher = stufe === 'frei' ? modul.filter((id) => frei.includes(id) || ziel.includes(id)) : [];
  // Only the module's hidden lessons that are not unlocked change the lesson list in the packages.
  const ausVorher = modul.filter((id) => versteckt.includes(id) && !frei.includes(id));
  const ausNachher = modul.filter((id) => neu.includes(id) && !freiNachher.includes(id));
  const senden = freiNachher.filter((id) => !frei.includes(id));
  return {
    versteckt: neu,
    senden,
    sperren: stufe === 'frei' ? [] : modul.filter((id) => frei.includes(id)),
    neuSenden: ausVorher.join() !== ausNachher.join() ? freiNachher.filter((id) => frei.includes(id)) : [],
  };
}
