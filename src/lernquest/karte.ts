// The world map of one subject: regions (modules) with their stations (lessons) and the state of each station, as in
// the design prototype (docs/design/lernquest/Main.dc.html): done (gold, tick), current (the next one to play, with
// „Los geht’s!“), open (unlocked, started or not), locked (not yet in class). Stufe C: a done station with exercises
// due again fades until they are refreshed; a region whose stations are all done ends in a Meilenstein, a mixed test
// over all of them. Pure, so it is tested without a browser.
import { karteKey, sterneVon, wochenStart } from './rules';
import type { Paket, Stand } from './types';

export type StationsZustand = 'erledigt' | 'aktuell' | 'offen' | 'gesperrt';

export interface Station {
  nummer: number;
  titel: string;
  zustand: StationsZustand;
  /** Lesson id; absent for a locked station. */
  stunde?: string;
  sterne: number;
  /** Exercises of this station due again today (`karteKey`s): a done station fades until they are refreshed. */
  faellig: string[];
}

export interface Region {
  id: string;
  nummer: number;
  titel: string;
  icon: string;
  stationen: Station[];
  /** The mixed test at the end: open once every station of the region is unlocked and done (at least two). */
  meilenstein: boolean;
}

/** Exercises in the Meilenstein of a region (the server takes at most 20 per round). */
export const MEILENSTEIN_GROESSE = 10;

/** Subjects of the packages, sorted. */
export const faecherVon = (pakete: Paket[]) => [...new Set(pakete.map((p) => p.fach))].sort((a, b) => a.localeCompare(b, 'de'));

/**
 * Regions of a subject in module order. A station is done once it has stars (every round played); the first
 * unlocked station without stars is the current one (one per subject); locked stations come from the module's lesson
 * list in the package (older packages without it show only the unlocked ones). `dran`: the exercises due today.
 */
export function regionenVon(pakete: Paket[], fach: string, stand: Stand, dran: ReadonlySet<string> = new Set()): Region[] {
  const byModule = new Map<string, Paket[]>();
  for (const p of pakete.filter((x) => x.fach === fach)) byModule.set(p.modul.id, [...(byModule.get(p.modul.id) ?? []), p]);
  const regionen = [...byModule.values()]
    .map((ps): Region => {
      const m = ps.reduce((a, b) => ((b.modul.stunden?.length ?? 0) > (a.modul.stunden?.length ?? 0) ? b : a)).modul;
      const offen = new Map(ps.map((p) => [p.nummer, p]));
      const nummern = [...new Set([...(m.stunden ?? []).map((s) => s.nummer), ...offen.keys()])].sort((a, b) => a - b);
      const stationen = nummern.map((n): Station => {
        const p = offen.get(n);
        if (!p) return { nummer: n, titel: m.stunden?.find((s) => s.nummer === n)?.titel ?? '', zustand: 'gesperrt', sterne: 0, faellig: [] };
        const st = sterneVon(stand, p);
        const faellig = p.uebungen.map((u) => karteKey(p.stunde, u.id)).filter((k) => dran.has(k));
        return { nummer: n, titel: p.titel, zustand: st > 0 ? 'erledigt' : 'offen', stunde: p.stunde, sterne: st, faellig };
      });
      const meilenstein = stationen.length >= 2 && stationen.every((s) => s.zustand === 'erledigt');
      return { id: m.id, nummer: m.nummer, titel: m.titel, icon: m.icon, stationen, meilenstein };
    })
    .sort((a, b) => a.nummer - b.nummer);
  const next = regionen.flatMap((r) => r.stationen).find((s) => s.zustand === 'offen');
  if (next) next.zustand = 'aktuell';
  return regionen;
}

const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** The seven days of this week for the weekly goal card: learned or not, and which one is today. */
export function wochenTage(tage: string[], heute: string): { label: string; tag: string; gelernt: boolean; heute: boolean }[] {
  const start = new Date(`${wochenStart(heute)}T12:00:00Z`);
  const gelernt = new Set(tage);
  return TAGE.map((label, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const tag = d.toISOString().slice(0, 10);
    return { label, tag, gelernt: gelernt.has(tag), heute: tag === heute };
  });
}

/** A colour for a child's initial, the same for the same name (white text on it stays readable). */
const FARBEN = ['#5B3FD9', '#C2410C', '#13804A', '#B4235A', '#1D5FA8', '#7A3CC2', '#0F766E', '#8A5A00'];
export function namensFarbe(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FARBEN[h % FARBEN.length];
}

/** First name for „Hallo …!“: the first word ("Mia K." → "Mia"). */
export const vorname = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** The class code from a scanned QR code (the Lernquest link) or typed text; '' when there is none. */
export function codeAus(text: string): string {
  const fromLink = /lernquest\/?#\/?([0-9A-Za-z]{8})\b/.exec(text)?.[1];
  const raw = (fromLink ?? text).toUpperCase().replace(/[^0-9A-Z]/g, '');
  return raw.length === 8 ? raw : '';
}

/** The projector view of a boss fight: `#beamer=<id>`, plus `&klasse=<code>` when the teacher's device knows the class
 *  (then the projector shows a QR code to sign in); null when the address is something else. */
export function beamerAusHash(hash: string): { id: string; klasse: string } | null {
  const m = /^#beamer=([0-9a-f-]{36})(?:&klasse=([0-9A-Za-z]{8}))?$/.exec(hash);
  return m ? { id: m[1], klasse: m[2]?.toUpperCase() ?? '' } : null;
}

/** The link in the QR code at the projector: Lernquest of this page with the class code, where the children sign in
 *  (the same link as on their cards). `seite` is this page's address; query and hash are dropped. */
export const beitrittsLink = (seite: string, code: string): string => `${seite.replace(/[?#].*$/, '').replace(/[^/]*$/, '')}#${code}`;

/** What the fox on the map says is next (Stufe E: the fox guides). `dran`: exercises due in this subject;
 *  `bestanden`: ids of regions whose Meilenstein is passed. */
export function fuchsHinweis(regionen: Region[], dran: number, bestanden: ReadonlySet<string> = new Set()): { text: string; pose: 'winken' | 'jubeln' | 'denken' | 'stehen' } {
  const stationen = regionen.flatMap((r) => r.stationen);
  const aktuell = stationen.find((s) => s.zustand === 'aktuell');
  const auffrischen = dran > 0 ? ` Vorher ${dran === 1 ? 'wartet 1 Aufgabe' : `warten ${dran} Aufgaben`} aufs Wiederholen.` : '';
  if (!stationen.length) return { text: 'Hier entsteht deine Karte. Bald geht’s los!', pose: 'winken' };
  if (aktuell) return { text: `Weiter geht’s mit „${aktuell.titel}“!${auffrischen}`, pose: 'winken' };
  if (dran > 0) return { text: `${dran === 1 ? '1 Aufgabe wartet' : `${dran} Aufgaben warten`} aufs Wiederholen. So bleibt es im Kopf!`, pose: 'denken' };
  const offen = stationen.find((s) => s.zustand === 'offen');
  if (offen) return { text: `„${offen.titel}“ hat noch Sterne für dich.`, pose: 'stehen' };
  if (regionen.some((r) => r.meilenstein && !bestanden.has(r.id))) return { text: 'Alle Stationen geschafft! Am dunklen Schloss wartet der Meilenstein.', pose: 'jubeln' };
  if (stationen.some((s) => s.zustand === 'gesperrt')) return { text: 'Super, alles geschafft! Neue Stationen öffnen sich, sobald ihr sie im Unterricht hattet.', pose: 'jubeln' };
  return { text: 'Alles geschafft! Hol dir in den Stationen die fehlenden Sterne.', pose: 'jubeln' };
}
