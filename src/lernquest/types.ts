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
      /** Listening (English): this text is read aloud instead of shown; shown only when the device has no voice. */
      hoeren?: string;
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
    }
  /** Sort cards into 2–3 groups; each card is `[text, group index]`. */
  | { art: 'gruppen'; id: string; frage: string; gruppen: string[]; karten: [string, number][] }
  /** Pick the picture for a word: each picture is an emoji or a key into the package's `bilder` ("img:<id>"). */
  | { art: 'bild'; id: string; frage: string; wort: string; bilder: string[]; richtig: number }
  /**
   * Tap the named places on a picture or map from the worksheet, one after the other. `bild` is a key into the
   * package's `bilder` ("karte:<id>"); each point is [x, y, name] in percent of the picture.
   */
  | { art: 'punkt'; id: string; frage: string; bild: string; punkte: [number, number, string][] };

export type UebungsArt = Uebung['art'];

/** The kinds this version can show; a package from a newer Baukasten may hold others, which are left out. */
export const UEBUNGS_ARTEN: readonly UebungsArt[] = ['waehlen', 'richtigfalsch', 'paare', 'luecke', 'reihenfolge', 'gruppen', 'bild', 'punkt'];

/** One exercise of a lesson's KI-Fragenpool: shown to the class only once the teacher released it (`frei`). */
export interface PoolEintrag {
  u: Uebung;
  frei: boolean;
}

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
  /** Pictures as JPEG data URLs: small ones for „Bild wählen“ ("img:<id>"), larger ones for places ("karte:<id>"). */
  bilder?: Record<string, string>;
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
  /** Stufe 2: coins, coins earned today, chests waiting, chests in a row without a rare part. */
  muenzen: number;
  muenzenHeute: number;
  truhen: number;
  pech: number;
  /** Parts found or bought (ids from `TEILE`). */
  inventar: string[];
  /** What is worn: part id per place ('' = nothing), the skin tone, the hair, its colour and the mouth (`Avatar` in teile.ts). */
  avatar: Partial<Record<'kopf' | 'augen' | 'kleidung' | 'werkzeug' | 'begleiter' | 'hintergrund', string>> & {
    haut?: number;
    frisur?: string;
    haarfarbe?: number;
    mund?: string;
    figur?: number;
  };
  /** Stufe 4: points for real rewards in class (not the coins); points of open requests are set aside already. */
  klassenpunkte: number;
}

export const LEERER_STAND: Stand = { xp: 0, xpHeute: 0, bestwerte: {}, tage: [], leitner: {}, muenzen: 0, muenzenHeute: 0, truhen: 0, pech: 0, inventar: [], avatar: {}, klassenpunkte: 0 };
