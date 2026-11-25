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
}

export interface Haeuser {
  /** The teacher's switch per class (default off). */
  an: boolean;
  /** All plots of the class, ordered by when the child joined. Children see no names. */
  plaetze: HausPlatz[];
  /** The own plot (children only). */
  ich: number | null;
}
