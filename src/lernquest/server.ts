// Lernquest on the server (Supabase, Frankfurt): only database functions (RPC), no direct table access, like the
// handouts. Children prove themselves with a session token, the teacher with the teacher keys of the device.
// The SQL is in supabase/migrations/20261106_lernquest.sql and 20261106b_lernquest_held.sql (Stufe 2).
import { SERVER } from '../share/server';
import type { Avatar } from './teile';
import { LEERER_STAND, type Stand } from './types';

/**
 * A refusal of the server: 'code' (class or child unknown), 'pin', 'gesperrt', 'sitzung', 'zugang', 'voll',
 * 'ungueltig', 'muenzen' (not enough coins in the shop).
 */
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
    muenzen: 'Dafür reichen deine Münzen noch nicht.',
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
  const r = await lq<string>('lq_anmelden', {
    p_code: code,
    p_kind: kind,
    p_pin: pin,
  });
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
  const r = await lq<MeinStand>('lq_mein_stand', {
    p_token: token,
    p_seit: seit,
  });
  return { ...r, stand: { ...LEERER_STAND, ...r.stand } };
}

/** Older or partial answers get the missing fields of an empty Stand. */
const voll = (s: Partial<Stand> | null | undefined): Stand => ({ ...LEERER_STAND, ...s });

export interface RundeErgebnis {
  /** Experience, coins and chests this round earned. */
  plus: number;
  muenzenPlus: number;
  truhenPlus: number;
  stand: Stand;
}

export async function rundeMelden(token: string, stunde: string, runde: number, richtig: number, gesamt: number, leitner: Stand['leitner']): Promise<RundeErgebnis> {
  const r = await lq<Partial<RundeErgebnis>>('lq_runde_melden', {
    p_token: token,
    p_stunde: stunde,
    p_runde: runde,
    p_richtig: richtig,
    p_gesamt: gesamt,
    p_leitner: leitner,
  });
  return { plus: r.plus ?? 0, muenzenPlus: r.muenzenPlus ?? 0, truhenPlus: r.truhenPlus ?? 0, stand: voll(r.stand) };
}

export interface TruheInhalt {
  /** Part id (`TEILE`) and its rarity 0–4. */
  teil: string;
  seltenheit: number;
  /** Already owned: became `muenzen` coins instead. */
  doppelt: boolean;
  muenzen: number;
  stand: Stand;
}

/** Opens one waiting chest; the server draws the part. 'ungueltig' when no chest is waiting. */
export async function truheOeffnen(token: string): Promise<TruheInhalt> {
  const r = await lq<TruheInhalt>('lq_truhe_oeffnen', { p_token: token });
  return { ...r, stand: voll(r.stand) };
}

/** Buys a part in the shop. 'muenzen' when the coins do not reach, 'ungueltig' for owned or start parts. */
export const kaufen = async (token: string, teil: string) => voll(await lq<Stand>('lq_kaufen', { p_token: token, p_teil: teil }));

/** Wears parts: per place an owned or start part, '' for nothing, and the skin tone 0–5. Replaces the whole avatar. */
export const avatarSetzen = async (token: string, avatar: Avatar) => voll(await lq<Stand>('lq_avatar_setzen', { p_token: token, p_avatar: avatar }));

export interface KlasseAnsicht {
  klasse: string;
  /** Learning days of all children this week, for the shared goal. */
  tage: number;
  /** Names and avatars only, no experience and no ranking; `ich` marks the asking child. */
  kinder: { name: string; avatar: Avatar; ich: boolean }[];
}

export const klasseAnsicht = (token: string) => lq<KlasseAnsicht>('lq_klasse_ansicht', { p_token: token });

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
export const klasseAnlegen = (keys: string[], name: string) =>
  lq<{ id: string; code: string }>('lq_klasse_anlegen', {
    p_schluessel: keys,
    p_name: name,
  });
export const klasseUmbenennen = (keys: string[], klasse: string, name: string) =>
  lq<null>('lq_klasse_umbenennen', {
    p_schluessel: keys,
    p_klasse: klasse,
    p_name: name,
  });
export const klasseLoeschen = (keys: string[], klasse: string, weg: boolean) =>
  lq<null>('lq_klasse_loeschen', {
    p_schluessel: keys,
    p_klasse: klasse,
    p_weg: weg,
  });
export const klasseEndgueltig = (keys: string[], klasse: string) => lq<null>('lq_klasse_endgueltig', { p_schluessel: keys, p_klasse: klasse });
export const kindAnlegen = (keys: string[], klasse: string, name: string, pin: string) =>
  lq<string>('lq_kind_anlegen', {
    p_schluessel: keys,
    p_klasse: klasse,
    p_name: name,
    p_pin: pin,
  });
export const kindUmbenennen = (keys: string[], kind: string, name: string) =>
  lq<null>('lq_kind_umbenennen', {
    p_schluessel: keys,
    p_kind: kind,
    p_name: name,
  });
export const kindLoeschen = (keys: string[], kind: string, weg: boolean) =>
  lq<null>('lq_kind_loeschen', {
    p_schluessel: keys,
    p_kind: kind,
    p_weg: weg,
  });
export const pinSetzen = (keys: string[], kind: string, pin: string) => lq<null>('lq_pin_setzen', { p_schluessel: keys, p_kind: kind, p_pin: pin });
export const entsperren = (keys: string[], kind: string) => lq<null>('lq_entsperren', { p_schluessel: keys, p_kind: kind });
export const freischalten = (keys: string[], klasse: string, stunde: string, paket: unknown) =>
  lq<null>('lq_freischalten', {
    p_schluessel: keys,
    p_klasse: klasse,
    p_stunde: stunde,
    p_daten: paket,
  });
export const sperren = (keys: string[], klasse: string, stunde: string) =>
  lq<null>('lq_sperren', {
    p_schluessel: keys,
    p_klasse: klasse,
    p_stunde: stunde,
  });

/** A random 4-digit PIN. */
export function neuePin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return String(n).padStart(4, '0');
}
