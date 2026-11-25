// Klassendorf, Stufe 1 „Dorfkasse“ (decided 13.11.2026, docs/idee-klassendorf.md): the class builds buildings together
// from donated coins. The same rules are on the server (supabase/migrations/20261130_lernquest_dorf.sql); change both.

export type GebaeudeId = 'brunnen' | 'bruecke' | 'baeckerei' | 'bibliothek' | 'sternwarte' | 'festwiese';

/** The buildings in the order the teacher is offered them. */
export const DORF_GEBAEUDE: { id: GebaeudeId; name: string }[] = [
  { id: 'brunnen', name: 'Brunnen' },
  { id: 'bruecke', name: 'Brücke' },
  { id: 'baeckerei', name: 'Bäckerei' },
  { id: 'bibliothek', name: 'Bibliothek' },
  { id: 'sternwarte', name: 'Sternwarte' },
  { id: 'festwiese', name: 'Festwiese' },
];
export const gebaeudeName = (id: string) => DORF_GEBAEUDE.find((g) => g.id === id)?.name ?? 'Gebäude';

/** Most coins a child may donate in a week (Mo–So, Berlin). */
export const SPENDE_WOCHE = 200;
/** The teacher's suggestion for a project's goal: coins per child of the class. */
export const ZIEL_JE_KIND = 100;
export const ZIEL_MIN = 50;
export const ZIEL_MAX = 20000;

/** What donated coins count for the project: 1.5 times, rounded down. */
export const spendeWert = (muenzen: number) => muenzen + Math.floor(muenzen / 2);

/** The fewest coins that still finish a project missing `fehlt` (the server never takes more). */
export const spendeNoetig = (fehlt: number) => Math.max(0, Math.floor((2 * fehlt + 2) / 3));

/** How many of `wunsch` coins the server takes: no more than the week allows, the project needs and the child has. */
export function spendeMoeglich(wunsch: number, d: { muenzen: number; woche: number; ziel: number; stand: number }): number {
  return Math.max(0, Math.min(wunsch, SPENDE_WOCHE - d.woche, spendeNoetig(d.ziel - d.stand), d.muenzen));
}

/** The suggested goal for a class of `kinder` children, within the server's bounds. */
export const zielVorschlag = (kinder: number) => Math.min(ZIEL_MAX, Math.max(ZIEL_MIN, kinder * ZIEL_JE_KIND));

export interface DorfProjekt {
  id: string;
  gebaeude: GebaeudeId;
  ziel: number;
  /** Counted coins (with the bonus), at most `ziel`. */
  stand: number;
  belohnung: string | null;
  /** Children who donated (a number, no names or amounts while it runs). */
  helfer: number;
}

export interface DorfFertig {
  gebaeude: GebaeudeId;
  belohnung: string | null;
  /** Day it was finished (YYYY-MM-DD). */
  fertig: string;
  /** Names of all who helped, without amounts. */
  stifter: string[];
}

export interface Dorf {
  an: boolean;
  projekt: DorfProjekt | null;
  fertig: DorfFertig[];
  /** Own coins donated this week (children only). */
  woche: number | null;
  /** Stufe 2 Teil B1: own houses (20261203_lernquest_haeuser.sql); missing until that migration is applied. */
  haeuser?: Haeuser;
}

// — Teil B1 „Eigenes Haus“ (decided 25.11.2026, docs/plan-klassendorf-haeuser.md) —
// Each child has a plot; it sets up a tent with a short quiz (zelt.ts) and builds it up in four steps with coins.
// The same table is on the server (20261203_lernquest_haeuser.sql, lq_haus_bauen); change both.

export interface HausStufe {
  name: string;
  /** Coins for this step (the server takes them). */
  preis: number;
  /** Hero level needed (`heldenstufe` in rules.ts). */
  ab: number;
}

/** The five house stages, 0 = tent (free, after the quiz) up to 4 = tower house. */
export const HAUS_STUFEN: HausStufe[] = [
  { name: 'Zelt', preis: 0, ab: 1 },
  { name: 'Hütte', preis: 300, ab: 1 },
  { name: 'Holzhaus', preis: 800, ab: 3 },
  { name: 'Fachwerkhaus', preis: 1800, ab: 5 },
  { name: 'Turmhaus', preis: 4000, ab: 12 },
];
export const HAUS_MAX = HAUS_STUFEN.length - 1;
export const hausName = (stufe: number | null) => (stufe === null ? 'leeres Grundstück' : HAUS_STUFEN[stufe]?.name ?? 'Haus');

export type Ausbau =
  | { geht: true; stufe: number; preis: number }
  | { geht: false; grund: 'fertig' | 'muenzen' | 'stufe'; stufe: number; preis: number; ab: number };

/** The next step from `stufe` (null = no house yet) and whether the child can build it now. Same checks as the
 *  server: stages one by one, enough coins, hero level. */
export function hausAusbau(stufe: number | null, d: { muenzen: number; heldenstufe: number }): Ausbau {
  const neu = stufe === null ? 0 : stufe + 1;
  const z = HAUS_STUFEN[neu];
  if (!z) return { geht: false, grund: 'fertig', stufe: HAUS_MAX, preis: 0, ab: 0 };
  if (d.heldenstufe < z.ab) return { geht: false, grund: 'stufe', stufe: neu, preis: z.preis, ab: z.ab };
  if (d.muenzen < z.preis) return { geht: false, grund: 'muenzen', stufe: neu, preis: z.preis, ab: z.ab };
  return { geht: true, stufe: neu, preis: z.preis };
}

/** One plot of the class in plot order: the house stage (null = empty) and, for the teacher, the child's name. */
export interface HausPlatz {
  stufe: number | null;
  name?: string;
  /** The chosen look (20261204_lernquest_haus_aussehen.sql); null or missing = not chosen yet. */
  aussehen?: Aussehen | null;
}

export interface Haeuser {
  /** The teacher's switch per class (default off). */
  an: boolean;
  /** All plots of the class, ordered by when the child joined. Children see no names. */
  plaetze: HausPlatz[];
  /** The own plot (children only). */
  ich: number | null;
}

// — Richtung A „Schlängelweg“ (decided 25.11.2026, docs/plan-klassendorf-haeuser.md) —
// The village grows with the community buildings the class finishes together: Weiler → Dorf → Marktflecken → Stadt.
// Only drawn, never checked by the server, so the rule lives here alone.

export interface DorfStufe {
  name: string;
  /** Finished community buildings needed. */
  ab: number;
}
export const DORF_STUFEN: DorfStufe[] = [
  { name: 'Weiler', ab: 0 },
  { name: 'Dorf', ab: 2 },
  { name: 'Marktflecken', ab: 4 },
  { name: 'Stadt', ab: 6 },
];

/** The stage of a village with `fertig` finished community buildings (0 = Weiler … 3 = Stadt). */
export function dorfStufe(fertig: number): number {
  let s = 0;
  DORF_STUFEN.forEach((d, i) => {
    if (fertig >= d.ab) s = i;
  });
  return s;
}

/** What is missing for the next stage, for the line under the map; null in the city. */
export function naechsteDorfStufe(fertig: number): { name: string; fehlt: number } | null {
  const n = DORF_STUFEN[dorfStufe(fertig) + 1];
  return n ? { name: n.name, fehlt: n.ab - Math.max(0, fertig) } : null;
}

/** Evening from 17 to 7 o'clock (device time): windows and lanterns light up (decided 25.11.2026). */
export const istAbend = (d: Date) => d.getHours() >= 17 || d.getHours() < 7;
/** Winter from December to February: snow on roofs, trees and meadows (decided 25.11.2026). */
export const istWinter = (d: Date) => d.getMonth() === 11 || d.getMonth() <= 1;

// — Häuser gestalten (decided 25.11.2026) —
// Every child picks the look of the own house: colours of roof, walls, door and flag, a fence, a garden and one
// decoration. A choice is free and can be changed at any time; more choices unlock with a higher house stage (`ab`).
// Stored by index; the same lists are on the server (20261204_lernquest_haus_aussehen.sql, lq_aussehen_ok); change both.

export type AussehenTeil = 'dach' | 'wand' | 'tuer' | 'fahne' | 'zaun' | 'garten' | 'deko';
export interface AussehenWahl {
  name: string;
  /** House stage needed (HAUS_STUFEN index). */
  ab: number;
}
export const AUSSEHEN: Record<AussehenTeil, { name: string; wahl: AussehenWahl[] }> = {
  dach: {
    name: 'Dach',
    wahl: [
      { name: 'Ziegel', ab: 0 },
      { name: 'Stroh', ab: 1 },
      { name: 'Schiefer', ab: 2 },
      { name: 'Moos', ab: 2 },
      { name: 'Pflaume', ab: 3 },
      { name: 'Gold', ab: 4 },
    ],
  },
  wand: {
    name: 'Wände',
    wahl: [
      { name: 'Natur', ab: 0 },
      { name: 'Rot', ab: 1 },
      { name: 'Blau', ab: 1 },
      { name: 'Grün', ab: 2 },
      { name: 'Gelb', ab: 2 },
      { name: 'Lila', ab: 3 },
    ],
  },
  tuer: {
    name: 'Tür',
    wahl: [
      { name: 'Holz', ab: 0 },
      { name: 'Rot', ab: 1 },
      { name: 'Blau', ab: 1 },
      { name: 'Grün', ab: 2 },
      { name: 'Gelb', ab: 2 },
      { name: 'Lila', ab: 3 },
    ],
  },
  fahne: {
    name: 'Fahne',
    wahl: [
      { name: 'Rot', ab: 0 },
      { name: 'Blau', ab: 0 },
      { name: 'Gelb', ab: 0 },
      { name: 'Grün', ab: 0 },
      { name: 'Lila', ab: 2 },
      { name: 'Rosa', ab: 2 },
    ],
  },
  zaun: {
    name: 'Zaun',
    wahl: [
      { name: 'Kein Zaun', ab: 0 },
      { name: 'Holzzaun', ab: 1 },
      { name: 'Hecke', ab: 2 },
      { name: 'Lattenzaun', ab: 2 },
      { name: 'Steinmauer', ab: 3 },
    ],
  },
  garten: {
    name: 'Garten',
    wahl: [
      { name: 'Kein Garten', ab: 0 },
      { name: 'Blumenbeet', ab: 1 },
      { name: 'Gemüsebeet', ab: 1 },
      { name: 'Apfelbaum', ab: 2 },
      { name: 'Teich', ab: 3 },
    ],
  },
  deko: {
    name: 'Schmuck',
    wahl: [
      { name: 'Nichts', ab: 0 },
      { name: 'Laterne', ab: 1 },
      { name: 'Bank', ab: 2 },
      { name: 'Fässer', ab: 2 },
      { name: 'Katze', ab: 3 },
      { name: 'Brunnen', ab: 4 },
    ],
  },
};
export const AUSSEHEN_TEILE = Object.keys(AUSSEHEN) as AussehenTeil[];
export type Aussehen = Record<AussehenTeil, number>;

/** Whether `wahl` of part `teil` may be used on a house of stage `stufe`. */
export const aussehenErlaubt = (teil: AussehenTeil, wahl: number, stufe: number) =>
  Number.isInteger(wahl) && wahl >= 0 && wahl < AUSSEHEN[teil].wahl.length && AUSSEHEN[teil].wahl[wahl].ab <= stufe;

/** The server's check: an object with exactly the seven parts, each an allowed choice for `stufe`. Null otherwise. */
export function aussehenGueltig(a: unknown, stufe: number): Aussehen | null {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  const o = a as Record<string, unknown>;
  if (Object.keys(o).length !== AUSSEHEN_TEILE.length) return null;
  const out = {} as Aussehen;
  for (const t of AUSSEHEN_TEILE) {
    const v = o[t];
    if (typeof v !== 'number' || !aussehenErlaubt(t, v, stufe)) return null;
    out[t] = v;
  }
  return out;
}

const mischen = (a: number, b: number) => {
  const v = Math.sin(a * 91.7 + b * 47.3 + 3.1) * 43758.5453;
  return v - Math.floor(v);
};

/** The look of a house whose child has not chosen yet: picked from the plot number, so every house looks different
 *  and stays the same. Only choices allowed for `stufe`. */
export function aussehenAuto(platz: number, stufe: number): Aussehen {
  const out = {} as Aussehen;
  AUSSEHEN_TEILE.forEach((t, i) => {
    const frei = AUSSEHEN[t].wahl.map((w, k) => (w.ab <= stufe ? k : -1)).filter((k) => k >= 0);
    out[t] = frei.length ? frei[Math.floor(mischen(platz, i) * frei.length)] : 0;
  });
  return out;
}

/** What to draw: each chosen part that is still allowed, the automatic look for the rest. */
export function aussehenVon(a: Partial<Record<string, unknown>> | null | undefined, platz: number, stufe: number): Aussehen {
  const auto = aussehenAuto(platz, stufe);
  if (!a || typeof a !== 'object') return auto;
  const out = { ...auto };
  for (const t of AUSSEHEN_TEILE) {
    const v = a[t];
    if (typeof v === 'number' && aussehenErlaubt(t, v, stufe)) out[t] = v;
  }
  return out;
}
