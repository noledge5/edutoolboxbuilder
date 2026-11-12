// What Lernquest keeps in the child's browser: the session, the Lernpakete and the last Spielstand (so it also opens
// without internet), and rounds played offline, sent later. All in localStorage; a private window simply starts empty.
import { readPaket } from '../paket';
import { readExtra, type ExtraWiederholen } from '../rules';
import { LEERER_STAND, type Paket, type Stand } from '../types';

export interface Sitzung {
  code: string;
  kind: string;
  name: string;
  token: string;
}

export interface Daten {
  name: string;
  klasse: string;
  stand: Stand;
  /** Unlocked lessons and their packages. */
  pakete: Record<string, Paket>;
  /** Server time of the last fetch. */
  seit: string | null;
  /** „Wiederholen sofort“ from the teacher, if set. */
  extra?: ExtraWiederholen | null;
}

/** A round played, waiting to be sent. */
export interface Meldung {
  stunde: string;
  runde: number;
  richtig: number;
  gesamt: number;
  leitner: Stand['leitner'];
}

const K_SITZUNG = 'lernquest:sitzung';
const K_DATEN = 'lernquest:daten';
const K_WARTE = 'lernquest:warteschlange';
const K_TON = 'lernquest:ton';
const K_MEILENSTEINE = 'lernquest:meilensteine';

function read<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game goes on, it only does not survive a reload.
  }
}

export function ladeSitzung(): Sitzung | null {
  const s = read<Sitzung>(K_SITZUNG);
  return s && typeof s.token === 'string' && /^[0-9a-f]{64}$/.test(s.token) ? s : null;
}
export const speichereSitzung = (s: Sitzung | null) => write(K_SITZUNG, s);

export function ladeDaten(): Daten | null {
  const d = read<Daten>(K_DATEN);
  if (!d || typeof d !== 'object') return null;
  const pakete: Record<string, Paket> = {};
  for (const [k, v] of Object.entries(d.pakete ?? {})) {
    const p = readPaket(v);
    if (p) pakete[k] = p;
  }
  return {
    name: String(d.name ?? ''),
    klasse: String(d.klasse ?? ''),
    stand: { ...LEERER_STAND, ...d.stand },
    pakete,
    seit: d.seit ?? null,
    extra: readExtra(d.extra),
  };
}
export const speichereDaten = (d: Daten | null) => write(K_DATEN, d);

export const ladeWarteschlange = (): Meldung[] => read<Meldung[]>(K_WARTE) ?? [];
export const speichereWarteschlange = (m: Meldung[]) => write(K_WARTE, m.length ? m : null);

export const tonAn = () => read<boolean>(K_TON) !== false;
export const setzeTon = (an: boolean) => write(K_TON, an);

/** „Bewegung reduzieren“ in the app (Stufe E, Teil 6), for devices where the system setting is not on: the class
 *  `lq-ruhig` on the page stops every animation like the system setting does (lernquest.css, figuren/Figur.tsx). */
/** Stations whose help cards („So geht's“) this device has shown before the first round (shown once by itself). */
const K_HILFE = 'lernquest:hilfe-gesehen';
export const hilfeGesehen = (stunde: string) => (read<string[]>(K_HILFE) ?? []).includes(stunde);
export const merkeHilfe = (stunde: string) => write(K_HILFE, [...new Set([...(read<string[]>(K_HILFE) ?? []), stunde])].slice(-200));

const K_RUHIG = 'lernquest:ruhig';
export const ruhigAn = () => read<boolean>(K_RUHIG) === true;
export function setzeRuhig(an: boolean) {
  write(K_RUHIG, an || null);
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('lq-ruhig', an);
}

/**
 * Best percent per Meilenstein (region id). ponytail: only on this device, the server does not know Meilensteine yet;
 * they move to the server with the rest of Stufe C (stars from levels), if children play on several devices.
 */
export const ladeMeilensteine = (): Record<string, number> => read<Record<string, number>>(K_MEILENSTEINE) ?? {};
export function speichereMeilenstein(id: string, prozent: number) {
  const alt = ladeMeilensteine();
  if (prozent > (alt[id] ?? -1)) write(K_MEILENSTEINE, { ...alt, [id]: prozent });
}

/** Everything of this child off the device (sign out). */
export function allesWeg() {
  for (const k of [K_SITZUNG, K_DATEN, K_WARTE, K_MEILENSTEINE]) write(k, null);
}
