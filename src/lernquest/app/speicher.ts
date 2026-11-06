// What Lernquest keeps in the child's browser: the session, the Lernpakete and the last Spielstand (so it also opens
// without internet), and rounds played offline, sent later. All in localStorage; a private window simply starts empty.
import { readPaket } from '../paket';
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
  };
}
export const speichereDaten = (d: Daten | null) => write(K_DATEN, d);

export const ladeWarteschlange = (): Meldung[] => read<Meldung[]>(K_WARTE) ?? [];
export const speichereWarteschlange = (m: Meldung[]) => write(K_WARTE, m.length ? m : null);

export const tonAn = () => read<boolean>(K_TON) !== false;
export const setzeTon = (an: boolean) => write(K_TON, an);

/** Everything of this child off the device (sign out). */
export function allesWeg() {
  for (const k of [K_SITZUNG, K_DATEN, K_WARTE]) write(k, null);
}
