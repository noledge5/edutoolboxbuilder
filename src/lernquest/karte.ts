// The world map of one subject: regions (modules) with their stations (lessons) and the state of each station, as in
// the design prototype (docs/design/lernquest/Main.dc.html): done (gold, tick), current (the next one to play, with
// „Los geht’s!“), open (unlocked, started or not), locked (not yet in class). Pure, so it is tested without a browser.
import { rundenZahl, sterne, wochenStart } from './rules';
import type { Paket, Stand } from './types';

export type StationsZustand = 'erledigt' | 'aktuell' | 'offen' | 'gesperrt';

export interface Station {
  nummer: number;
  titel: string;
  zustand: StationsZustand;
  /** Lesson id; absent for a locked station. */
  stunde?: string;
  sterne: number;
}

export interface Region {
  id: string;
  nummer: number;
  titel: string;
  icon: string;
  stationen: Station[];
}

/** Subjects of the packages, sorted. */
export const faecherVon = (pakete: Paket[]) => [...new Set(pakete.map((p) => p.fach))].sort((a, b) => a.localeCompare(b, 'de'));

/**
 * Regions of a subject in module order. A station is done once it has stars (every round played); the first
 * unlocked station without stars is the current one (one per subject); locked stations come from the module's lesson
 * list in the package (older packages without it show only the unlocked ones).
 */
export function regionenVon(pakete: Paket[], fach: string, stand: Stand): Region[] {
  const byModule = new Map<string, Paket[]>();
  for (const p of pakete.filter((x) => x.fach === fach)) byModule.set(p.modul.id, [...(byModule.get(p.modul.id) ?? []), p]);
  const regionen = [...byModule.values()]
    .map((ps): Region => {
      const m = ps.reduce((a, b) => ((b.modul.stunden?.length ?? 0) > (a.modul.stunden?.length ?? 0) ? b : a)).modul;
      const offen = new Map(ps.map((p) => [p.nummer, p]));
      const nummern = [...new Set([...(m.stunden ?? []).map((s) => s.nummer), ...offen.keys()])].sort((a, b) => a - b);
      const stationen = nummern.map((n): Station => {
        const p = offen.get(n);
        if (!p) return { nummer: n, titel: m.stunden?.find((s) => s.nummer === n)?.titel ?? '', zustand: 'gesperrt', sterne: 0 };
        const st = sterne(stand.bestwerte[p.stunde], rundenZahl(p.uebungen.length));
        return { nummer: n, titel: p.titel, zustand: st > 0 ? 'erledigt' : 'offen', stunde: p.stunde, sterne: st };
      });
      return { id: m.id, nummer: m.nummer, titel: m.titel, icon: m.icon, stationen };
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
