// Lernquest events (wish of the teacher, 27.11.2026): for a few days a class gets an event, e.g. „Vokabeltest diese
// Woche“. While it runs the map shows only its stations (the others are hidden, locked ones too), a banner over the
// map and pennants in the event's colours on it; „Wiederholen“ takes only cards of these stations. The server takes
// only rounds of these stations then (supabase/migrations/20261207_lernquest_event.sql). Pure, so it is tested
// without a browser (event.test.ts).
import { sterneVon, tagNummer, tagPlus, wochenStart } from './rules';
import type { Paket, Stand } from './types';

export type EventArt = 'vokabeltest' | 'klassenarbeit' | 'eigenes';

export interface KlassenEvent {
  art: EventArt;
  titel: string;
  /** First and last day (dates as `heute()`, Berlin time), both included. */
  ab: string;
  bis: string;
  /** The event's stations: lesson ids or `extra-<id>` (Extra-Pakete). */
  stunden: string[];
}

/** The kinds the teacher picks from: the name on the button, the title it suggests, a line on what it preselects. */
export const EVENT_ARTEN: Record<EventArt, { name: string; titel: string; hinweis: string }> = {
  vokabeltest: { name: 'Vokabeltest', titel: 'Vokabeltest', hinweis: 'Die Stationen aus dem Wortschatz-Wald sind vorgewählt.' },
  klassenarbeit: { name: 'Klassenarbeit', titel: 'Klassenarbeit', hinweis: 'Wähle die Stunden, die in der Arbeit drankommen.' },
  eigenes: { name: 'Eigenes Event', titel: '', hinweis: 'Eigener Titel, eigene Stationen.' },
};
export const EVENT_REIHE: EventArt[] = ['vokabeltest', 'klassenarbeit', 'eigenes'];

/** Limits, the same as on the server (lq_event_setzen). */
export const TITEL_MAX = 60;
/** At most three weeks: the last day at most 20 days after the first. */
export const EVENT_TAGE_MAX = 20;
/** Planned at most this many days ahead. */
export const EVENT_VORLAUF_MAX = 60;
export const STATIONEN_MAX = 200;

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const ARTEN = new Set<string>(EVENT_REIHE);

/** The event of the class from the server, or null when there is none or it is malformed. */
export function readEvent(x: unknown): KlassenEvent | null {
  const r = x as Partial<KlassenEvent> | null;
  if (!r || typeof r !== 'object' || typeof r.art !== 'string' || !ARTEN.has(r.art)) return null;
  if (typeof r.titel !== 'string' || !r.titel.trim()) return null;
  if (typeof r.ab !== 'string' || !TAG.test(r.ab) || typeof r.bis !== 'string' || !TAG.test(r.bis) || r.bis < r.ab) return null;
  if (!Array.isArray(r.stunden) || !r.stunden.length || !r.stunden.every((s) => typeof s === 'string')) return null;
  return { art: r.art as EventArt, titel: r.titel.trim(), ab: r.ab, bis: r.bis, stunden: r.stunden };
}

/** The event runs on `tag` (from its first to its last day). */
export const eventLaeuft = (ev: KlassenEvent | null | undefined, tag: string): ev is KlassenEvent => !!ev && tag >= ev.ab && tag <= ev.bis;
/** The event is set but starts later. */
export const eventGeplant = (ev: KlassenEvent | null | undefined, tag: string): ev is KlassenEvent => !!ev && tag < ev.ab;

/**
 * The packages the child sees on `tag`: all, or while an event runs only its stations. The module's lesson list keeps
 * only those too, so the map shows no locked station for the hidden ones.
 */
export function eventPakete(pakete: Paket[], ev: KlassenEvent | null | undefined, tag: string): Paket[] {
  if (!eventLaeuft(ev, tag)) return pakete;
  const drin = new Set(ev.stunden);
  const im = pakete.filter((p) => drin.has(p.stunde));
  const nummern = new Map<string, Set<number>>();
  for (const p of im) nummern.set(p.modul.id, (nummern.get(p.modul.id) ?? new Set()).add(p.nummer));
  return im.map((p) => (p.modul.stunden ? { ...p, modul: { ...p.modul, stunden: p.modul.stunden.filter((s) => nummern.get(p.modul.id)?.has(s.nummer)) } } : p));
}

/** How many of the event's stations the child has done (a station is done once it has stars, as on the map). */
export function eventFortschritt(pakete: Paket[], stand: Stand): { geschafft: number; gesamt: number } {
  return { geschafft: pakete.filter((p) => sterneVon(stand, p) > 0).length, gesamt: pakete.length };
}

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
/** 0 for Monday … 6 for Sunday. */
const wochentag = (tag: string) => tagNummer(tag) - tagNummer(wochenStart(tag));
const kurzDatum = (tag: string) => `${Number(tag.slice(8, 10))}.${Number(tag.slice(5, 7))}.`;

/** How long the event still runs, for the banner: „Heute ist der letzte Tag.“, „Noch 4 Tage, bis Freitag.“ */
export function eventNoch(ev: Pick<KlassenEvent, 'bis'>, tag: string): string {
  const n = tagNummer(ev.bis) - tagNummer(tag) + 1;
  if (n <= 1) return 'Heute ist der letzte Tag.';
  if (n === 2) return 'Noch heute und morgen.';
  return n <= 7 ? `Noch ${n} Tage, bis ${WOCHENTAGE[wochentag(ev.bis)]}.` : `Noch ${n} Tage, bis zum ${kurzDatum(ev.bis)}`;
}

/** The suggested last day: Friday of this week; from Friday on, Friday of the next. */
export function standardBis(tag: string): string {
  const w = wochentag(tag);
  return tagPlus(tag, w < 4 ? 4 - w : 11 - w);
}

/** The last day once the first one changed: kept while it fits, else moved to the first day or three weeks after it. */
export function bisAnpassen(ab: string, bis: string): string {
  if (!TAG.test(ab)) return bis;
  if (!TAG.test(bis) || bis < ab) return ab;
  return bis > tagPlus(ab, EVENT_TAGE_MAX) ? tagPlus(ab, EVENT_TAGE_MAX) : bis;
}

/** The latest possible last day for a first day; '' while the first day is no date (a cleared date field). */
export const bisSpaetestens = (ab: string) => (TAG.test(ab) ? tagPlus(ab, EVENT_TAGE_MAX) : '');

/** What a kind preselects from the unlocked stations by module: a Vokabeltest the Wortschatz-Wald, the others nothing. */
export function eventVorschlag(art: EventArt, module: { id: string; stunden: string[] }[]): string[] {
  return art === 'vokabeltest' ? module.filter((m) => m.id.startsWith('extra-wortschatz-')).flatMap((m) => m.stunden) : [];
}

/** What is wrong with an event before it is sent (the server checks the same), or '' when it can go. */
export function eventFehler(ev: KlassenEvent, tag: string): string {
  const titel = ev.titel.trim();
  if (!titel) return 'Gib dem Event einen Titel.';
  if (titel.length > TITEL_MAX) return `Der Titel darf höchstens ${TITEL_MAX} Zeichen haben.`;
  if (!TAG.test(ev.ab) || !TAG.test(ev.bis)) return 'Wähle den ersten und den letzten Tag.';
  if (ev.ab < tagPlus(tag, -1)) return 'Der erste Tag liegt zu weit zurück.';
  if (ev.ab > tagPlus(tag, EVENT_VORLAUF_MAX)) return `Ein Event beginnt höchstens ${EVENT_VORLAUF_MAX} Tage im Voraus.`;
  if (ev.bis < ev.ab) return 'Der letzte Tag liegt vor dem ersten.';
  if (ev.bis > tagPlus(ev.ab, EVENT_TAGE_MAX)) return 'Ein Event dauert höchstens drei Wochen.';
  if (!ev.stunden.length) return 'Wähle mindestens eine Station.';
  if (ev.stunden.length > STATIONEN_MAX) return `Höchstens ${STATIONEN_MAX} Stationen.`;
  return '';
}
