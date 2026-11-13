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
}
