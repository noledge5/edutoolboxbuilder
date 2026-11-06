// Lernquest on the server (Supabase, Frankfurt): only database functions (RPC), no direct table access, like the
// handouts. Children prove themselves with a session token, the teacher with the teacher keys of the device.
// The SQL is in supabase/migrations/20261106_lernquest.sql.
import { SERVER } from '../share/server';
import { LEERER_STAND, type Stand } from './types';

/** A refusal of the server: 'code' (class or child unknown), 'pin', 'gesperrt', 'sitzung', 'zugang', 'voll', 'ungueltig'. */
export class LqError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Network trouble throws TypeError('offline'), a refusal an LqError. */
export async function lq<T>(name: string, args: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SERVER.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SERVER.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
  } catch {
    throw new TypeError('offline');
  }
  const text = await res.text();
  if (!res.ok) {
    let code = String(res.status);
    try {
      code = (JSON.parse(text) as { message?: string }).message ?? code;
    } catch {
      // not JSON
    }
    throw new LqError(code);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** What a refusal means for a person (German UI text). */
export function lqText(e: unknown): string {
  if (e instanceof TypeError) return 'Keine Verbindung zum Server. Prüfe das Internet.';
  const code = e instanceof LqError ? e.code : '';
  const texts: Record<string, string> = {
    code: 'Diesen Klassencode gibt es nicht.',
    gesperrt: 'Das Konto ist gesperrt. Deine Lehrkraft kann es wieder freigeben.',
    sitzung: 'Bitte melde dich neu an.',
    zugang: 'Der Server kennt diese Klasse auf diesem Gerät nicht.',
    voll: 'Es ist kein Platz mehr frei.',
    ungueltig: 'Das hat der Server nicht angenommen.',
  };
  return texts[code] ?? `Der Server antwortet nicht wie erwartet (${code || String(e)}).`;
}

// — Children —

export interface KlasseOffen {
  name: string;
  kinder: { id: string; name: string }[];
}

export const klasseOeffnen = (code: string) => lq<KlasseOffen>('lq_klasse_oeffnen', { p_code: code });

export type Anmeldung = { ok: true; token: string } | { ok: false; gesperrt: boolean; rest: number };

export async function anmelden(code: string, kind: string, pin: string): Promise<Anmeldung> {
  const r = await lq<string>('lq_anmelden', { p_code: code, p_kind: kind, p_pin: pin });
  if (r.startsWith('ok:')) return { ok: true, token: r.slice(3) };
  if (r === 'gesperrt') return { ok: false, gesperrt: true, rest: 0 };
  return { ok: false, gesperrt: false, rest: Number(r.slice(4)) || 0 };
}

export const abmelden = (token: string) => lq<null>('lq_abmelden', { p_token: token });

export interface MeinStand {
  name: string;
  klasse: string;
  stand: Stand;
  /** Lessons unlocked for the class. */
  stunden: string[];
  /** Lernpakete newer than asked for. */
  pakete: { stunde: string; stand: string; daten: unknown }[];
  /** Server time, for the next `seit`. */
  jetzt: string;
}

export async function meinStand(token: string, seit: string | null): Promise<MeinStand> {
  const r = await lq<MeinStand>('lq_mein_stand', { p_token: token, p_seit: seit });
  return { ...r, stand: { ...LEERER_STAND, ...r.stand } };
}

export const rundeMelden = (token: string, stunde: string, runde: number, richtig: number, gesamt: number, leitner: Stand['leitner']) =>
  lq<{ plus: number; stand: Stand }>('lq_runde_melden', { p_token: token, p_stunde: stunde, p_runde: runde, p_richtig: richtig, p_gesamt: gesamt, p_leitner: leitner });

// — Teacher —

export interface KindInfo {
  id: string;
  name: string;
  gesperrt: boolean;
  zuletzt: string | null;
  geloescht: string | null;
  xp: number;
  bestwerte: Record<string, number[]>;
  tage: string[];
}

export interface KlasseInfo {
  id: string;
  name: string;
  code: string;
  geloescht: string | null;
  /** Unlocked lessons. */
  stunden: string[];
  kinder: KindInfo[];
}

export const klassen = (keys: string[]) => lq<KlasseInfo[]>('lq_klassen', { p_schluessel: keys });
export const klasseAnlegen = (keys: string[], name: string) => lq<{ id: string; code: string }>('lq_klasse_anlegen', { p_schluessel: keys, p_name: name });
export const klasseUmbenennen = (keys: string[], klasse: string, name: string) => lq<null>('lq_klasse_umbenennen', { p_schluessel: keys, p_klasse: klasse, p_name: name });
export const klasseLoeschen = (keys: string[], klasse: string, weg: boolean) => lq<null>('lq_klasse_loeschen', { p_schluessel: keys, p_klasse: klasse, p_weg: weg });
export const klasseEndgueltig = (keys: string[], klasse: string) => lq<null>('lq_klasse_endgueltig', { p_schluessel: keys, p_klasse: klasse });
export const kindAnlegen = (keys: string[], klasse: string, name: string, pin: string) => lq<string>('lq_kind_anlegen', { p_schluessel: keys, p_klasse: klasse, p_name: name, p_pin: pin });
export const kindUmbenennen = (keys: string[], kind: string, name: string) => lq<null>('lq_kind_umbenennen', { p_schluessel: keys, p_kind: kind, p_name: name });
export const kindLoeschen = (keys: string[], kind: string, weg: boolean) => lq<null>('lq_kind_loeschen', { p_schluessel: keys, p_kind: kind, p_weg: weg });
export const pinSetzen = (keys: string[], kind: string, pin: string) => lq<null>('lq_pin_setzen', { p_schluessel: keys, p_kind: kind, p_pin: pin });
export const entsperren = (keys: string[], kind: string) => lq<null>('lq_entsperren', { p_schluessel: keys, p_kind: kind });
export const freischalten = (keys: string[], klasse: string, stunde: string, paket: unknown) => lq<null>('lq_freischalten', { p_schluessel: keys, p_klasse: klasse, p_stunde: stunde, p_daten: paket });
export const sperren = (keys: string[], klasse: string, stunde: string) => lq<null>('lq_sperren', { p_schluessel: keys, p_klasse: klasse, p_stunde: stunde });

/** A random 4-digit PIN. */
export function neuePin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return String(n).padStart(4, '0');
}
