// Lernquest on the server (Supabase, Frankfurt): only database functions (RPC), no direct table access, like the
// handouts. Children prove themselves with a session token, the teacher with the teacher keys of the device.
// The SQL is in supabase/migrations/20261106_lernquest.sql, 20261106b_lernquest_held.sql (Stufe 2) and
// 20261107_lernquest_boss.sql (Stufe 3) and 20261108_lernquest_belohnungen.sql (Stufe 4).
import { SERVER } from '../share/server';
import type { BossFrage } from './boss';
import type { Avatar } from './teile';
import { LEERER_STAND, type Stand } from './types';

/**
 * A refusal of the server: 'code' (class or child unknown), 'pin', 'gesperrt', 'sitzung', 'zugang', 'voll',
 * 'ungueltig', 'muenzen' (not enough coins in the shop), 'leer' (a boss fight nobody joined yet), 'punkte' (not enough
 * class points for a voucher), 'grenze' (a weekly limit is reached).
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
    leer: 'Noch ist niemand beigetreten.',
    punkte: 'Dafür reichen deine Klassenpunkte noch nicht.',
    grenze: 'Für diese Woche ist die Grenze erreicht.',
    gross: 'Das Lernpaket dieser Stunde ist zu groß für den Server. Nimm ein paar Bilder oder Pool-Aufgaben heraus.',
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
  /** Experience, coins, chests and class points this round earned. */
  plus: number;
  muenzenPlus: number;
  truhenPlus: number;
  punktePlus: number;
  /** Counted as a repetition (a third of experience and coins); missing from servers before 20261117. */
  wiederholung?: boolean;
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
  return { plus: r.plus ?? 0, muenzenPlus: r.muenzenPlus ?? 0, truhenPlus: r.truhenPlus ?? 0, punktePlus: r.punktePlus ?? 0, wiederholung: r.wiederholung, stand: voll(r.stand) };
}

export interface TruheInhalt {
  /** Part id (`TEILE`) and its rarity 0–4; null when the chest held only coins (`muenzen`). */
  teil: string | null;
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

/** Wears parts: per place an owned or start part, '' for nothing, the skin tone 0–5, the hair and its colour 0–4. Replaces the whole avatar. */
export const avatarSetzen = async (token: string, avatar: Avatar) => voll(await lq<Stand>('lq_avatar_setzen', { p_token: token, p_avatar: avatar }));

export interface KlasseAnsicht {
  klasse: string;
  /** Learning days of all children this week, for the shared goal. */
  tage: number;
  /** Names and avatars only, no experience and no ranking; `ich` marks the asking child. */
  kinder: { name: string; avatar: Avatar; ich: boolean }[];
}

export const klasseAnsicht = (token: string) => lq<KlasseAnsicht>('lq_klasse_ansicht', { p_token: token });

// — Bosskampf (Stufe 3) —

export type BossPhase = 'warten' | 'frage' | 'aufloesung' | 'ende';
export type BossModus = 'geraete' | 'karten';

/** A fight as everyone sees it (`lq_boss_json`); the right answer only after the question. */
export interface BossStand {
  id: string;
  titel: string;
  /** Index in `BOSSE`. */
  boss: number;
  phase: BossPhase;
  /** 'karten': the children hold up answer cards, the teacher scans; no time limit (docs/lernquest.md). */
  modus: BossModus;
  /** Current question (0-based), -1 while waiting. */
  frage: number;
  fragen: number;
  lp: number;
  lpMax: number;
  herzen: number;
  /** Set when the fight is over. */
  sieg: boolean | null;
  /** Milliseconds left for the question (server clock). */
  rest: number;
  /** Children who joined, and those who answered the current question. */
  kinder: number;
  antworten: number;
  optionen: string[];
  richtig: number | null;
}

/** What a child's phone gets in addition. */
export interface BossKindStand extends BossStand {
  dabei: boolean;
  serie: number;
  /** This child got a chest from this fight. */
  truhe: boolean;
  /** The own answer to the current question, and its damage after the question. */
  wahl: number | null;
  schaden: number | null;
}

/** What the projector gets in addition. */
export interface BossBeamerStand extends BossStand {
  klasse: string;
  text: string;
  aussage: string;
  /** Answers per option, after the question. */
  verteilung: number[] | null;
  /** Children who got a chest. */
  truhen: number;
  /** With cards: names of the children whose card was read for this question (not what they chose); else null. */
  erkannt: string[] | null;
}

export interface BossOffen {
  id: string;
  titel: string;
  boss: number;
}

/** The running fight of the child's class, or null. */
export const bossOffen = (token: string) => lq<BossOffen | null>('lq_boss_offen', { p_token: token });
/** The fight for the child; the first call joins it. */
export const bossStand = (token: string, boss: string) => lq<BossKindStand>('lq_boss_stand', { p_token: token, p_boss: boss });
/** An answer to question `frage`; `angenommen` is false when it came too late or twice. */
export const bossAntworten = (token: string, boss: string, frage: number, wahl: number) =>
  lq<{ angenommen: boolean }>('lq_boss_antworten', { p_token: token, p_boss: boss, p_frage: frage, p_wahl: wahl });

export const bossStarten = (keys: string[], klasse: string, region: string, titel: string, boss: number, fragen: BossFrage[]) =>
  lq<string>('lq_boss_starten', { p_schluessel: keys, p_klasse: klasse, p_region: region, p_titel: titel, p_boss: boss, p_fragen: fragen });
/** Starts a fight with answer cards (no devices; children join with their first scanned card). */
export const bossStartenKarten = (keys: string[], klasse: string, region: string, titel: string, boss: number, fragen: BossFrage[]) =>
  lq<string>('lq_boss_starten_karten', { p_schluessel: keys, p_klasse: klasse, p_region: region, p_titel: titel, p_boss: boss, p_fragen: fragen });
/** The running fight of a class, or null (a second device of the teacher scans it). */
export const bossLaufend = (keys: string[], klasse: string) => lq<{ id: string; modus: BossModus } | null>('lq_boss_laufend', { p_schluessel: keys, p_klasse: klasse });
/** Scanned cards of question `frage` (child id → option, at most 40); the last scan counts until resolved. */
export const bossKarten = (keys: string[], boss: string, frage: number, antworten: Record<string, number>) =>
  lq<{ angenommen: boolean; neu?: number }>('lq_boss_karten', { p_schluessel: keys, p_boss: boss, p_frage: frage, p_antworten: antworten });
export const bossBeamer = (keys: string[], boss: string) => lq<BossBeamerStand>('lq_boss_beamer', { p_schluessel: keys, p_boss: boss });
/** Next step: first question (error 'leer' while nobody joined; with cards allowed), next question, or resolve the running one now. */
export const bossWeiter = (keys: string[], boss: string) => lq<BossBeamerStand>('lq_boss_weiter', { p_schluessel: keys, p_boss: boss });
export const bossBeenden = (keys: string[], boss: string) => lq<BossBeamerStand>('lq_boss_beenden', { p_schluessel: keys, p_boss: boss });

// — Echte Belohnungen (Stufe 4) —

export type AnfrageZustand = 'offen' | 'eingeloest' | 'abgelehnt' | 'zurueck';

/** What the child sees: own class points, the class's active vouchers with this week's counts, own requests (14 days). */
export interface Gutscheine {
  punkte: number;
  gutscheine: { id: string; name: string; preis: number; jeKind: number | null; jeKlasse: number | null; ich: number; klasse: number }[];
  anfragen: { id: string; name: string; preis: number; zustand: AnfrageZustand; erstellt: string; erledigt: string | null }[];
}

export const gutscheine = (token: string) => lq<Gutscheine>('lq_gutscheine', { p_token: token });
/** Asks for a voucher and sets its points aside; refusals 'punkte', 'grenze', 'voll', 'ungueltig'. */
export const anfragen = (token: string, gutschein: string) => lq<Gutscheine>('lq_anfragen', { p_token: token, p_gutschein: gutschein });
/** Takes back an own open request; the points come back. */
export const anfrageZurueck = (token: string, anfrage: string) => lq<Gutscheine>('lq_anfrage_zurueck', { p_token: token, p_anfrage: anfrage });

export interface GutscheinInfo {
  id: string;
  name: string;
  preis: number;
  jeKind: number | null;
  jeKlasse: number | null;
  aktiv: boolean;
  /** Open and redeemed requests this week. */
  woche: number;
}

export interface AnfrageInfo {
  id: string;
  gutschein: string;
  /** Voucher name and child id (the name comes from the class list). */
  name: string;
  kind: string;
  preis: number;
  zustand: AnfrageZustand;
  erstellt: string;
  erledigt: string | null;
}

/** The class's vouchers and its requests (open ones and those of the last 30 days). */
export const belohnungen = (keys: string[], klasse: string) => lq<{ gutscheine: GutscheinInfo[]; anfragen: AnfrageInfo[] }>('lq_belohnungen', { p_schluessel: keys, p_klasse: klasse });
/** New voucher (`id` null) or changed one; limits null = none. */
export const gutscheinSpeichern = (keys: string[], klasse: string, id: string | null, g: Pick<GutscheinInfo, 'name' | 'preis' | 'jeKind' | 'jeKlasse' | 'aktiv'>) =>
  lq<string>('lq_gutschein_speichern', {
    p_schluessel: keys,
    p_klasse: klasse,
    p_id: id,
    p_name: g.name,
    p_preis: g.preis,
    p_je_kind: g.jeKind,
    p_je_klasse: g.jeKlasse,
    p_aktiv: g.aktiv,
  });
/** Deletes a voucher; open requests give their points back. */
export const gutscheinLoeschen = (keys: string[], gutschein: string) => lq<null>('lq_gutschein_loeschen', { p_schluessel: keys, p_gutschein: gutschein });
/** Redeemed (points used) or refused (points back). 'ungueltig' when it is no longer open. */
export const anfrageErledigen = (keys: string[], anfrage: string, eingeloest: boolean) =>
  lq<null>('lq_anfrage_erledigen', { p_schluessel: keys, p_anfrage: anfrage, p_eingeloest: eingeloest });
/** 1–5 class points by hand, at most `PUNKTE_HAND_WOCHE` per child and week ('grenze'); returns the child's points. */
export const punkteGeben = (keys: string[], kind: string, punkte: number) => lq<number>('lq_punkte_geben', { p_schluessel: keys, p_kind: kind, p_punkte: punkte });

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
  /** Stufe 4: review cards (for progress per competence), class points, points given by hand this week. */
  leitner?: Stand['leitner'];
  klassenpunkte?: number;
  punkteHand?: number;
}

export interface KlasseInfo {
  id: string;
  name: string;
  code: string;
  geloescht: string | null;
  /** Unlocked lessons. */
  stunden: string[];
  kinder: KindInfo[];
  /** Stufe 4: open voucher requests. */
  anfragen?: number;
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

// — Pictures of the parts (supabase/migrations/20261117_lernquest_bilder.sql): uploaded on the teacher page by the
// admin teacher, for every class; read by everyone. —

/** Whether one of the keys belongs to an admin teacher (who may upload pictures). */
export const istAdmin = (keys: string[]) => lq<boolean>('lq_ist_admin', { p_schluessel: keys });
/** Stores the finished layer of a part (base64), replacing an older one; returns the new version. */
export const bildSetzen = (keys: string[], teil: string, typ: string, daten: string) =>
  lq<number>('lq_bild_setzen', { p_schluessel: keys, p_teil: teil, p_typ: typ, p_daten: daten });
export const bildLoeschen = (keys: string[], teil: string) => lq<null>('lq_bild_loeschen', { p_schluessel: keys, p_teil: teil });
/** Which parts have an uploaded picture: {part id: version}. */
export const bilderListe = () => lq<Record<string, number>>('lq_bilder', {});
/** The pictures of up to 10 parts. */
export const bildDaten = (teile: string[]) =>
  lq<{ teil: string; version: number; typ: string; daten: string }[]>('lq_bild_daten', { p_teile: teile });

// — Own parts (supabase/migrations/20261118_lernquest_eigene_teile.sql): made by the admin teacher with their picture. —

/** The own parts, as the server keeps them (checked by `readEigene`). */
export const teileEigen = () => lq<unknown>('lq_teile_eigen', {});
/** Makes an own part with its picture (base64); returns its id. */
export const teilAnlegen = (keys: string[], t: { name: string; slot: string; seltenheit: number; nurTruhe: boolean }, typ: string, daten: string) =>
  lq<string>('lq_teil_anlegen', {
    p_schluessel: keys,
    p_name: t.name,
    p_slot: t.slot,
    p_seltenheit: t.seltenheit,
    p_nur_truhe: t.nurTruhe,
    p_typ: typ,
    p_daten: daten,
  });
/** Renames an own part and takes it out of the game or back in. */
export const teilAendern = (keys: string[], teil: string, name: string, aktiv: boolean) =>
  lq<null>('lq_teil_aendern', { p_schluessel: keys, p_teil: teil, p_name: name, p_aktiv: aktiv });
