// Lernquest: what the class gets per lesson (the Lernpaket) and what the server keeps per child (the Spielstand).
// Plan and decisions: docs/lernquest.md.

export const PAKET_FORMAT = 'lernquest-paket';

/** One exercise in the style of Anton/Duolingo, made from a task block of a lesson. */
export type Uebung =
  /** Tap the right answer (or all right ones, when `richtig` has more than one). */
  | {
      art: 'waehlen';
      id: string;
      frage: string;
      aussage?: string;
      optionen: string[];
      richtig: number[];
    }
  /** True or false, two big buttons. */
  | {
      art: 'richtigfalsch';
      id: string;
      frage: string;
      aussage: string;
      richtig: boolean;
    }
  /** Find the pairs: each left with its right. */
  | { art: 'paare'; id: string; frage: string; paare: [string, string][] }
  /** A sentence with gaps, filled by tapping tiles; `teile` alternate text and gap (odd indexes are gaps). */
  | {
      art: 'luecke';
      id: string;
      frage: string;
      teile: string[];
      kacheln: string[];
    }
  /** Word tiles put in order to make `loesung`. */
  | {
      art: 'reihenfolge';
      id: string;
      frage: string;
      hinweis: string;
      kacheln: string[];
      loesung: string;
    };

export type UebungsArt = Uebung['art'];

export interface Paket {
  format: typeof PAKET_FORMAT;
  v: 1;
  /** Lesson id. */
  stunde: string;
  nummer: number;
  titel: string;
  modul: {
    id: string;
    nummer: number;
    titel: string;
    icon: string;
    /** All lessons of the module (number and title only), so the map shows the locked ones too; absent in older packages. */
    stunden?: { nummer: number; titel: string }[];
  };
  fach: string;
  /** English module: read aloud in English, English labels where the sheet has them. */
  lang: 'de' | 'en';
  uebungen: Uebung[];
}

/** What the server keeps of a child's play (`lq_stand_json`). */
export interface Stand {
  xp: number;
  /** Experience earned today (capped at `XP_TAG`). */
  xpHeute: number;
  /** Lesson id → best percent per round. */
  bestwerte: Record<string, number[]>;
  /** Days with at least one round ("2026-11-06"), the last 70. */
  tage: string[];
  /** Exercise key (`karteKey`) → [box 1–5, due as day number since 1970]. */
  leitner: Record<string, [number, number]>;
}

export const LEERER_STAND: Stand = {
  xp: 0,
  xpHeute: 0,
  bestwerte: {},
  tage: [],
  leitner: {},
};
