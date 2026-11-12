// The rules of Lernquest: rounds of a station, checking answers, experience and hero level, stars, the weekly goal
// and spaced repetition (Leitner boxes). Pure, so it is tested without a browser. The server applies the same reward
// rules in `lq_runde_melden` (supabase/migrations/20261106_lernquest.sql); change both together.
import { normalize } from '../share/grade';
import { seeded, shuffle } from '../model/language';
import type { Niveau, Stand, TagesStand, Uebung, Zaehler } from './types';

// — Rounds —

/** Exercises per round. */
export const RUNDE_GROESSE = 5;
/** Rounds per station: 3–5 (a station with only a few exercises has one round). */
export const RUNDEN_MIN = 3;
export const RUNDEN_MAX = 5;
/** Most exercises in one round. */
export const RUNDE_MAX = 8;

/** A round counts as done from this percent right (Stufe C; `lq_runde_melden` uses the same). */
export const GESCHAFFT_AB = 60;
export const geschafft = (best: number | undefined) => (best ?? 0) >= GESCHAFFT_AB;

/** The round a station starts with: the first one not done yet, else the weakest (where stars are still to win). */
export function naechsteRunde(best: number[], runden: number): number {
  const werte = Array.from({ length: runden }, (_, i) => best[i] ?? 0);
  const offen = werte.findIndex((b) => !geschafft(b));
  if (offen >= 0) return offen;
  return werte.reduce((m, b, i) => (b < werte[m] ? i : m), 0);
}

/** How many rounds a station with `n` exercises has. */
export function rundenZahl(n: number): number {
  if (n <= 0) return 0;
  if (n <= RUNDE_GROESSE) return 1;
  return Math.min(RUNDEN_MAX, Math.max(RUNDEN_MIN, Math.ceil(n / RUNDE_GROESSE)));
}

/**
 * The exercises of round `r` (0-based): the list is walked through round by round, so every exercise comes up;
 * with fewer than 3 × 5 exercises some come again in a later round.
 */
export function rundeVon(uebungen: Uebung[], r: number): Uebung[] {
  const n = uebungen.length;
  const runden = rundenZahl(n);
  if (!runden || r < 0 || r >= runden) return [];
  // Usually 5; a station with many exercises takes up to 8 per round, so all of them come up.
  const take = Math.min(RUNDE_MAX, Math.max(Math.min(RUNDE_GROESSE, n), Math.ceil(n / runden)));
  const start = Math.floor((r * n) / runden);
  return Array.from({ length: take }, (_, k) => uebungen[(start + k) % n]);
}

/** How often one exercise comes up in a round at most: once, then again after each mistake. A broken exercise (wrong
 *  solution) must not hold a child in the round for ever. */
export const WIEDER_MAX = 3;

/**
 * The order of a round after the answer at `pos`: `reihe` holds exercise indexes; a missed exercise is put at the
 * end again, so the child meets it once more before the round is over.
 */
export function nachAntwort(reihe: number[], pos: number, richtig: boolean): number[] {
  const i = reihe[pos];
  if (richtig || i === undefined || reihe.filter((x) => x === i).length >= WIEDER_MAX) return reihe;
  return [...reihe, i];
}

/** How a round went, by the first tries: below 60 % it is not called done („Fast!“), all right is „Perfekt!“. */
export function rundenFazit(richtig: number, gesamt: number): 'schwach' | 'gut' | 'perfekt' {
  if (gesamt > 0 && richtig === gesamt) return 'perfekt';
  return gesamt > 0 && richtig * 5 >= gesamt * 3 ? 'gut' : 'schwach';
}

// — Checking —

/** What a child gave: chosen option indexes, true/false, pairs matched (left index → right index), tiles laid. */
export type Antwort =
  | { art: 'waehlen'; gewaehlt: number[] }
  | { art: 'richtigfalsch'; wert: boolean }
  | { art: 'paare'; fehler: number }
  | { art: 'luecke'; gelegt: string[] }
  | { art: 'reihenfolge'; gelegt: string[] }
  /** Group index chosen for each card, in the order of `karten`. */
  | { art: 'gruppen'; zuordnung: number[] }
  | { art: 'bild'; gewaehlt: number }
  /** One tap per point: which point was asked for and where the child tapped (percent of the picture). */
  | { art: 'punkt'; getippt: { ziel: number; x: number; y: number }[] }
  | { art: 'schreiben'; text: string };

/** How far from a point a tap may land, in percent of the picture. */
export const PUNKT_RADIUS = 12;

/** Whether a tap at (x, y) hits point `ziel`: it is the nearest point and not too far away. */
export function punktTrifft(punkte: [number, number, string][], ziel: number, x: number, y: number): boolean {
  const d = punkte.map(([px, py]) => Math.hypot(px - x, py - y));
  const p = d[ziel];
  return p !== undefined && p <= PUNKT_RADIUS && d.every((o, i) => i === ziel || o > p);
}

/**
 * Slips that still count as right when finding pairs or tapping places: one from three items on. Trying is part of
 * these formats; with two items a slip gives the rest away.
 */
export const fehlgriffeFrei = (n: number) => (n >= 3 ? 1 : 0);

/** A sentence from tiles: spaces before end marks and commas go. */
/** Two answers in words are the same, as `istRichtig` compares them (case, spaces, punctuation). */
export const gleich = (a: string, b: string) => normalize(a) === normalize(b);

export const satz = (tiles: string[]) => tiles.join(' ').replace(/\s+([.,!?;:])/g, '$1');

/** Whether an answer is right. Pairs and places allow `fehlgriffeFrei` slips. */
export function istRichtig(u: Uebung, a: Antwort): boolean {
  switch (u.art) {
    case 'waehlen':
      return a.art === 'waehlen' && [...a.gewaehlt].sort().join() === [...u.richtig].sort().join();
    case 'richtigfalsch':
      return a.art === 'richtigfalsch' && a.wert === u.richtig;
    case 'paare':
      return a.art === 'paare' && a.fehler <= fehlgriffeFrei(u.paare.length);
    case 'luecke': {
      if (a.art !== 'luecke') return false;
      const want = u.teile.filter((_, i) => i % 2 === 1);
      return want.length === a.gelegt.length && want.every((w, i) => normalize(w) === normalize(a.gelegt[i] ?? ''));
    }
    case 'reihenfolge':
      return a.art === 'reihenfolge' && normalize(satz(a.gelegt)) === normalize(u.loesung);
    case 'gruppen':
      return a.art === 'gruppen' && a.zuordnung.length === u.karten.length && u.karten.every(([, g], i) => a.zuordnung[i] === g);
    case 'bild':
      return a.art === 'bild' && a.gewaehlt === u.richtig;
    case 'punkt': {
      if (a.art !== 'punkt' || a.getippt.length !== u.punkte.length) return false;
      const asked = new Set(a.getippt.map((t) => t.ziel));
      const daneben = a.getippt.filter((t) => !punktTrifft(u.punkte, t.ziel, t.x, t.y)).length;
      return asked.size === u.punkte.length && daneben <= fehlgriffeFrei(u.punkte.length);
    }
    case 'schreiben':
      return a.art === 'schreiben' && u.loesungen.some((l) => gleich(l, a.text));
  }
}

/** The answer of a child who knows it (for tests and the check of what Claude wrote). */
export function richtigeAntwort(u: Uebung): Antwort {
  switch (u.art) {
    case 'waehlen':
      return { art: 'waehlen', gewaehlt: u.richtig };
    case 'richtigfalsch':
      return { art: 'richtigfalsch', wert: u.richtig };
    case 'paare':
      return { art: 'paare', fehler: 0 };
    case 'luecke':
      return { art: 'luecke', gelegt: u.teile.filter((_, i) => i % 2 === 1) };
    case 'reihenfolge':
      return { art: 'reihenfolge', gelegt: satzKacheln(u.loesung) };
    case 'gruppen':
      return { art: 'gruppen', zuordnung: u.karten.map(([, g]) => g) };
    case 'bild':
      return { art: 'bild', gewaehlt: u.richtig };
    case 'punkt':
      return { art: 'punkt', getippt: u.punkte.map(([x, y], ziel) => ({ ziel, x, y })) };
    case 'schreiben':
      return { art: 'schreiben', text: u.loesungen[0] };
  }
}

/** A sentence as tiles: words, the end mark on its own. */
function satzKacheln(s: string): string[] {
  const end = /[.?!]$/.exec(s)?.[0] ?? '';
  const words = (end ? s.slice(0, -1) : s).split(/\s+/).filter(Boolean);
  return end ? [...words, end] : words;
}

/** The right answer as a child reads it after a mistake. */
export function loesungText(u: Uebung): string {
  switch (u.art) {
    case 'waehlen':
      return u.richtig.map((i) => u.optionen[i]).join(', ');
    case 'richtigfalsch':
      return u.richtig ? 'richtig' : 'falsch';
    case 'paare':
      return u.paare.map(([l, r]) => `${l} – ${r}`).join('; ');
    case 'luecke':
      // The gaps in bold (`Rich`), not in brackets.
      return u.teile.map((t, i) => (i % 2 ? `**${t}**` : t)).join('');
    case 'reihenfolge':
      return u.loesung;
    case 'gruppen':
      return u.gruppen.map((g, gi) => `${g}: ${u.karten.filter(([, k]) => k === gi).map(([t]) => t).join(', ')}`).join('; ');
    case 'bild':
      return u.wort;
    case 'punkt':
      return 'die grünen Punkte im Bild';
    case 'schreiben':
      return u.loesungen[0];
  }
}

/** Order of the options or tiles on screen, the same for the same exercise and try. */
export const gemischt = <T>(xs: T[], seed: string) => shuffle(xs, seeded(seed));

// — Experience and hero level —

/** Most experience per day (more rounds still count for stars and repetition). */
export const XP_TAG = 300;

/**
 * A repetition gives a third of experience and coins (rounded down): the „Wiederholen“ round (`stunde` empty) and a
 * station round done before (`geschafft`). As `lq_runde_melden`.
 */
export const WIEDERHOLUNG_TEILER = 3;

/** Whether this round is a repetition (see `WIEDERHOLUNG_TEILER`); asked before the round is counted. */
export const istWiederholung = (bestwerte: Stand['bestwerte'], stunde: string, runde: number) =>
  !stunde || geschafft(bestwerte[stunde]?.[runde]);

/** Experience for a round: 10, 2 per right answer, 5 more without mistakes, a third for a repetition; capped by what is left today. */
export function xpFuerRunde(richtig: number, gesamt: number, heuteSchon = 0, wiederholung = false): number {
  let roh = 10 + 2 * richtig + (richtig === gesamt ? 5 : 0);
  if (wiederholung) roh = Math.floor(roh / WIEDERHOLUNG_TEILER);
  return Math.max(0, Math.min(roh, XP_TAG - heuteSchon));
}

/** Experience needed to go from level `n` to `n + 1`: 100, 150, 200 … */
export const xpFuerStufe = (n: number) => 50 + 50 * n;

/** Hero level (from 1) and the experience into it. */
export function heldenstufe(xp: number): {
  stufe: number;
  drin: number;
  noetig: number;
} {
  let stufe = 1;
  let rest = Math.max(0, xp);
  while (rest >= xpFuerStufe(stufe)) {
    rest -= xpFuerStufe(stufe);
    stufe++;
  }
  return { stufe, drin: rest, noetig: xpFuerStufe(stufe) };
}

const TITEL: [number, string][] = [
  [1, 'Neuling'],
  [3, 'Lehrling'],
  [5, 'Entdecker'],
  [8, 'Abenteurer'],
  [12, 'Held'],
  [16, 'Meister'],
  [21, 'Legende'],
];

export function titel(stufe: number): string {
  let t = TITEL[0][1];
  for (const [ab, name] of TITEL) if (stufe >= ab) t = name;
  return t;
}

// — Stars —

/** Difficulty of an exercise: its `niveau` (KI pool), else by format: tapping easy, filling in and sorting medium, writing hard. */
export function niveauVon(u: Uebung): Niveau {
  if (u.niveau === 1 || u.niveau === 2 || u.niveau === 3) return u.niveau;
  return u.art === 'schreiben' ? 3 : u.art === 'paare' || u.art === 'luecke' || u.art === 'reihenfolge' || u.art === 'gruppen' ? 2 : 1;
}

/** The level of each round of a station: its hardest exercise (`lq_stufen` on the server). */
export const rundenStufen = (uebungen: Uebung[]): Niveau[] =>
  Array.from({ length: rundenZahl(uebungen.length) }, (_, r) => Math.max(...rundeVon(uebungen, r).map(niveauVon)) as Niveau);

/**
 * What each of the three stars needs (Stufe C): Kennenlernen, Anwenden, Meistern. Each level the station has gives one
 * star, from easy to hard: its rounds and all easier ones done (`geschafft`). Stars left over (a station without some
 * level) ask for at least 80 % on average over all rounds, then for every round once without mistakes.
 */
export type SternZiel = { art: 'runden'; runden: number[] } | { art: 'schnitt' } | { art: 'fehlerfrei' };
export function sternZiele(stufen: readonly number[]): SternZiel[] {
  const ziele: SternZiel[] = [...new Set(stufen)].sort((a, b) => a - b).map((n) => ({ art: 'runden', runden: stufen.flatMap((s, i) => (s <= n ? [i] : [])) }));
  return [...ziele, { art: 'schnitt' } as const, { art: 'fehlerfrei' } as const].slice(0, 3);
}

/** Whether a star's goal is met (`sternZiele`). */
export function sternErreicht(z: SternZiel, bestwerte: number[], runden: number): boolean {
  const b = Array.from({ length: runden }, (_, i) => bestwerte[i] ?? 0);
  if (z.art === 'runden') return z.runden.every((i) => geschafft(b[i]));
  if (z.art === 'fehlerfrei') return b.every((x) => x >= 100);
  return b.every(geschafft) && b.reduce((s, x) => s + x, 0) >= 80 * runden;
}

/** Stars of a station from the best percent per round and the rounds' levels (`rundenStufen`); as `lq_sterne`. */
export function sterne(bestwerte: number[] | undefined, stufen: readonly number[]): number {
  if (!stufen.length || !bestwerte) return 0;
  const ziele = sternZiele(stufen);
  const n = ziele.findIndex((z) => !sternErreicht(z, bestwerte, stufen.length));
  return n < 0 ? 3 : n;
}

/** Stars a station shows: by the rules now, but never fewer than once counted (`sterneStationen`, earned stays earned). */
export const sterneVon = (s: Stand, p: { stunde: string; uebungen: Uebung[] }) =>
  Math.max(sterne(s.bestwerte[p.stunde], rundenStufen(p.uebungen)), s.sterneStationen?.[p.stunde] ?? 0);

/** Rounds of a station that are done (`geschafft`). */
export const rundenGeschafft = (bestwerte: number[] | undefined, runden: number) => Array.from({ length: runden }, (_, i) => geschafft(bestwerte?.[i])).filter(Boolean).length;

// — Weekly goal —

/** Klassen-Aufgabe der Woche: rounds passed (from 60 %) per child who played in the last 28 days; the server counts
 *  (`lq_klassen_ziel` in 20261125_lernquest_willkommen_klassenziel.sql, change both together). */
export const KLASSEN_ZIEL_JE_KIND = 5;

/** Learning days per week for the weekly goal. Weekends and holidays never reset anything. */
export const WOCHENZIEL = 3;

/** Monday of the week of a day ("2026-11-06" → "2026-11-02"). */
export function wochenStart(tag: string): string {
  const d = new Date(`${tag}T12:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd);
  return d.toISOString().slice(0, 10);
}

/** Today in Germany ("2026-11-06"), as the server counts it. */
export const heute = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(now);

/** Learning days this week, and how many weeks reached the goal (all of them, no streak to lose). */
export function woche(tage: string[], tag = heute()): { diese: number; geschafft: number } {
  const start = wochenStart(tag);
  const proWoche = new Map<string, number>();
  for (const t of new Set(tage)) proWoche.set(wochenStart(t), (proWoche.get(wochenStart(t)) ?? 0) + 1);
  return {
    diese: proWoche.get(start) ?? 0,
    geschafft: [...proWoche.values()].filter((n) => n >= WOCHENZIEL).length,
  };
}

// — Daily tasks (Stufe D), as lq_runde_melden —

export interface Tagesaufgabe {
  id: string;
  text: string;
  zaehler: Zaehler;
  ziel: number;
}

/** The list the day's three tasks come from. Ids, order and goals are the server's too (`lq_aufgaben`); change both. */
export const TAGESAUFGABEN: Tagesaufgabe[] = [
  { id: 'schaffen', text: 'Schaffe eine Runde', zaehler: 'geschafft', ziel: 1 },
  { id: 'fehlerfrei', text: 'Spiele eine Runde ohne Fehler', zaehler: 'fehlerfrei', ziel: 1 },
  { id: 'wiederholen', text: 'Spiele eine Wiederholung', zaehler: 'wdh', ziel: 1 },
  { id: 'drei', text: 'Spiele 3 Runden', zaehler: 'runden', ziel: 3 },
  { id: 'richtig', text: 'Beantworte 15 Aufgaben richtig', zaehler: 'richtig', ziel: 15 },
  { id: 'stern', text: 'Hol dir einen Stern', zaehler: 'sterne', ziel: 1 },
  { id: 'zwei', text: 'Schaffe 2 Runden', zaehler: 'geschafft', ziel: 2 },
  { id: 'neu', text: 'Spiele eine neue Runde', zaehler: 'neu', ziel: 1 },
];

/** Coins per task done and for all three of a day; on top of `MUENZEN_TAG`. */
export const AUFGABE_MUENZEN = 15;
export const AUFGABEN_BONUS = 30;

/** The three tasks of a day, the same for everyone: day number + 0, 3 and 5 in the list (never twice the same). */
export const aufgabenVon = (tag: string): Tagesaufgabe[] =>
  [0, 3, 5].map((o) => TAGESAUFGABEN[(tagNummer(tag) + o) % TAGESAUFGABEN.length]);

/** Today's counters; a Stand from another day counts as empty. */
export const tagesStand = (a: TagesStand | undefined, tag: string): TagesStand =>
  a?.tag === tag ? a : { tag, zaehler: {}, erledigt: [] };

/**
 * Counts one round into the day's tasks: tasks reaching their goal now give `AUFGABE_MUENZEN`, the third one
 * `AUFGABEN_BONUS` on top. `sterne` are the stars the station gained this round.
 */
export function aufgabenNach(
  a: TagesStand | undefined,
  tag: string,
  r: { richtig: number; gesamt: number; wiederholung: boolean; sterne: number },
): { aufgaben: TagesStand; muenzen: number; neu: string[] } {
  const alt = tagesStand(a, tag);
  const z = { ...alt.zaehler };
  const add = (k: Zaehler, n: number) => (z[k] = (z[k] ?? 0) + n);
  add('runden', 1);
  add('geschafft', geschafft(Math.round((100 * r.richtig) / r.gesamt)) ? 1 : 0);
  add('fehlerfrei', r.richtig === r.gesamt ? 1 : 0);
  add(r.wiederholung ? 'wdh' : 'neu', 1);
  add('richtig', r.richtig);
  add('sterne', Math.max(0, r.sterne));
  const neu = aufgabenVon(tag)
    .filter((t) => !alt.erledigt.includes(t.id) && (z[t.zaehler] ?? 0) >= t.ziel)
    .map((t) => t.id);
  const erledigt = [...alt.erledigt, ...neu];
  const alle = neu.length > 0 && erledigt.length === 3;
  return { aufgaben: { tag, zaehler: z, erledigt }, muenzen: neu.length * AUFGABE_MUENZEN + (alle ? AUFGABEN_BONUS : 0), neu };
}

// — Shop by hero level (Stufe D), as lq_kaufen —

/** Hero level from which the shop sells a rarity (0 common … 4 legendary). Chests give everything. */
export const LADEN_AB = [1, 3, 5, 12, 16];
export const ladenAb = (seltenheit: number) => LADEN_AB[seltenheit] ?? 1;

// — Repetition (Leitner boxes) —

/** Days until an exercise is due again, by box 1–5. */
export const ABSTAND = [0, 1, 3, 7, 14, 30];

export const tagNummer = (tag: string) => Math.round(Date.parse(`${tag}T00:00:00Z`) / 86_400_000);
/** The day `tage` after `tag` (both like `heute()`). */
export const tagPlus = (tag: string, tage: number) => new Date((tagNummer(tag) + tage) * 86_400_000).toISOString().slice(0, 10);

/** The key of an exercise card: lesson and exercise. */
export const karteKey = (stunde: string, uebung: string) => `${stunde}/${uebung}`;

/** A card after an answer: right moves it up a box (a new card starts in box 1), wrong back to box 1 (due tomorrow). */
export function karteNach(alt: [number, number] | undefined, richtig: boolean, heuteNr: number): [number, number] {
  const box = richtig ? Math.min(5, (alt?.[0] ?? 1) + 1) : 1;
  return [box, heuteNr + ABSTAND[box]];
}

/** Cards due today or earlier, the most overdue and lowest box first. */
export function faellig(leitner: Stand['leitner'], heuteNr: number, gueltig?: Set<string>): string[] {
  return Object.entries(leitner)
    .filter(([k, [, due]]) => due <= heuteNr && (!gueltig || gueltig.has(k)))
    .sort(([, a], [, b]) => a[1] - b[1] || a[0] - b[0])
    .map(([k]) => k);
}

/** „Wiederholen sofort“ from the teacher (e.g. before a test): the exercises of these lessons are due from `ab` to
 *  `bis` (dates as `heute()`), once each, also those never played. Kept on the class (`lq_klasse.extra_wdh`). */
export interface ExtraWiederholen {
  ab: string;
  bis: string;
  stunden: string[];
}

export function readExtra(x: unknown): ExtraWiederholen | null {
  const r = x as Partial<ExtraWiederholen> | null;
  const tag = /^\d{4}-\d{2}-\d{2}$/;
  if (!r || typeof r !== 'object' || typeof r.ab !== 'string' || !tag.test(r.ab) || typeof r.bis !== 'string' || !tag.test(r.bis)) return null;
  if (!Array.isArray(r.stunden) || !r.stunden.every((s) => typeof s === 'string')) return null;
  return { ab: r.ab, bis: r.bis, stunden: r.stunden };
}

/** The day a card was last answered: its due day minus the gap of its box (`karteNach`). */
const beantwortet = ([box, due]: [number, number]) => due - ABSTAND[box];

/** Cards due because of „Wiederholen sofort“: of the chosen lessons (`karten`: all keys of the lessons there are), not
 *  answered since `ab`; none outside `ab` … `bis`. */
export function extraFaellig(leitner: Stand['leitner'], karten: string[], extra: ExtraWiederholen | null | undefined, tag: string): string[] {
  if (!extra || tag < extra.ab || tag > extra.bis) return [];
  const ab = tagNummer(extra.ab);
  const stunden = new Set(extra.stunden);
  return karten.filter((k) => {
    if (!stunden.has(k.slice(0, k.indexOf('/')))) return false;
    const e = leitner[k];
    return !e || beantwortet(e) < ab;
  });
}

/** What the „Wiederholen“ round takes today: the cards due by their box, then those of „Wiederholen sofort“. */
export function heuteDran(leitner: Stand['leitner'], karten: string[], extra: ExtraWiederholen | null | undefined, tag: string): string[] {
  const normal = faellig(leitner, tagNummer(tag), new Set(karten));
  const schon = new Set(normal);
  return [...normal, ...extraFaellig(leitner, karten, extra, tag).filter((k) => !schon.has(k))];
}

/** How many cards come due tomorrow that are not due today (for „Morgen sind … dran“). */
export function morgenDran(leitner: Stand['leitner'], karten: string[], tag: string): number {
  const g = new Set(karten);
  const n = tagNummer(tag);
  return faellig(leitner, n + 1, g).length - faellig(leitner, n, g).length;
}

// — Coins (Stufe 2) —

/** Most coins per day. */
export const MUENZEN_TAG = 200;

/**
 * Coins for a round: 5, 1 per right answer, 2 per heart left (every mistake costs a heart; empty hearts end nothing),
 * then the bonus percent (rounded down), a third of it for a repetition; capped by what is left today. As `lq_runde_melden`.
 */
export function muenzenFuerRunde(richtig: number, gesamt: number, herzen: number, bonusProzent: number, heuteSchon = 0, wiederholung = false): number {
  const uebrig = Math.max(0, herzen - (gesamt - richtig));
  let roh = 5 + richtig + 2 * uebrig;
  roh += Math.floor((roh * bonusProzent) / 100);
  if (wiederholung) roh = Math.floor(roh / WIEDERHOLUNG_TEILER);
  return Math.max(0, Math.min(roh, MUENZEN_TAG - heuteSchon));
}

// — A round on this device, before the server answers —

export interface RundenKontext {
  /** Hearts and coin bonus of what the child wears. */
  herzen: number;
  bonusProzent: number;
  /** Levels of the station's rounds (`rundenStufen`; none for „Wiederholen“). */
  stufen: readonly number[];
}

/** Stars that fill one chest. Every star of a station counts once, so better rounds later fill the next chest. */
export const STERNE_JE_TRUHE = 3;

/**
 * Stars of a station not yet counted for chests: the stars now minus the most counted before. A station without an
 * entry (played before chests came from stars; its old chest was given) counts the stars it had before this round.
 */
export function neueSterne(gezaehlt: number | undefined, vorher: number, jetzt: number): number {
  return Math.max(0, jetzt - (gezaehlt ?? vorher));
}

/**
 * The Spielstand after a round, as the server will count it (`lq_runde_melden`): experience, coins, the round's best,
 * today as a learning day, the changed cards and new chests (every `STERNE_JE_TRUHE` new stars, weekly goal reached
 * this week). Used to show the result at once, also offline.
 */
export function rundeAnwenden(
  s: Stand,
  m: { stunde: string; runde: number; richtig: number; gesamt: number; leitner: Stand['leitner'] },
  tag = heute(),
  k: RundenKontext = { herzen: 3, bonusProzent: 0, stufen: [] },
): { plus: number; muenzenPlus: number; truhenPlus: number; punktePlus: number; sternePlus: number; aufgabenPlus: number; aufgabenNeu: string[]; wiederholung: boolean; stand: Stand } {
  const neuerTag = !s.tage.includes(tag);
  const wiederholung = istWiederholung(s.bestwerte, m.stunde, m.runde);
  const schon = neuerTag ? 0 : s.xpHeute;
  const plus = xpFuerRunde(m.richtig, m.gesamt, schon, wiederholung);
  const mSchon = neuerTag ? 0 : s.muenzenHeute;
  const muenzenPlus = muenzenFuerRunde(m.richtig, m.gesamt, k.herzen, k.bonusProzent, mSchon, wiederholung);
  const bestwerte = { ...s.bestwerte };
  let truhenPlus = 0;
  let sternePlus = 0;
  let sterneRest = s.sterneRest ?? 0;
  let sterneStationen = s.sterneStationen ?? {};
  let sterneGewonnen = 0;
  if (m.stunde) {
    const vorher = sterne(bestwerte[m.stunde], k.stufen);
    const best = [...(bestwerte[m.stunde] ?? [])];
    while (best.length <= m.runde) best.push(0);
    best[m.runde] = Math.max(best[m.runde], Math.round((100 * m.richtig) / m.gesamt));
    bestwerte[m.stunde] = best;
    const jetzt = sterne(best, k.stufen);
    sterneGewonnen = jetzt - vorher;
    sternePlus = neueSterne(sterneStationen[m.stunde], vorher, jetzt);
    if (sternePlus > 0) {
      sterneStationen = { ...sterneStationen, [m.stunde]: jetzt };
      truhenPlus += Math.floor((sterneRest + sternePlus) / STERNE_JE_TRUHE);
      sterneRest = (sterneRest + sternePlus) % STERNE_JE_TRUHE;
    }
  }
  const tage = neuerTag ? [...s.tage, tag].sort().slice(-70) : s.tage;
  // Weekly goal reached now: a chest and class points (the server gives both once per week).
  const ziel = neuerTag && woche(s.tage, tag).diese === WOCHENZIEL - 1;
  if (ziel) truhenPlus++;
  const punktePlus = ziel ? PUNKTE_WOCHENZIEL : 0;
  const auf = aufgabenNach(s.aufgaben, tag, { richtig: m.richtig, gesamt: m.gesamt, wiederholung, sterne: sterneGewonnen });
  return {
    plus,
    muenzenPlus,
    truhenPlus,
    punktePlus,
    sternePlus,
    aufgabenPlus: auf.muenzen,
    aufgabenNeu: auf.neu,
    wiederholung,
    stand: {
      ...s,
      xp: s.xp + plus,
      xpHeute: schon + plus,
      muenzen: s.muenzen + muenzenPlus + auf.muenzen,
      muenzenHeute: mSchon + muenzenPlus,
      truhen: s.truhen + truhenPlus,
      klassenpunkte: (s.klassenpunkte ?? 0) + punktePlus,
      sterneRest,
      sterneStationen,
      bestwerte,
      tage,
      leitner: { ...s.leitner, ...m.leitner },
      aufgaben: auf.aufgaben,
    },
  };
}

// — Bosskampf (Stufe 3), as the lq_boss_* functions on the server —

/** Questions per fight, seconds per question, hearts of the class. */
export const BOSS_FRAGEN = 10;
export const BOSS_ZEIT_MS = 20_000;
export const BOSS_HERZEN = 5;
/** Answers still taken after the time is up (the network is slower than the clock on the projector). */
export const BOSS_NACHFRIST_MS = 1_500;
/**
 * Life points per child and question. A right answer does 10 to 20 (faster = more), doubled from the third right one in
 * a row; at middle speed that is ~14.6 per answer with 70 % right and ~11.6 with 60 %, so 13 lets a class win from
 * about two thirds right.
 */
export const BOSS_LP_JE = 13;

/**
 * Damage of a right answer given `ms` after the question showed; `serie` = right answers in a row, this one included;
 * `bonus` = damage bonus of what the child wears (`bonusVon(...).schaden`, 0–3), added before doubling.
 */
export function bossSchaden(ms: number, serie: number, bonus = 0): number {
  const tempo = Math.round(10 * Math.max(0, 1 - Math.max(0, ms) / BOSS_ZEIT_MS));
  return (10 + tempo + bonus) * (serie >= 3 ? 2 : 1);
}

/**
 * Fight with answer cards (no devices): no time limit, so no speed part; a right card does 15 (the middle speed of a
 * device answer), doubled from the third right one in a row, the child's damage bonus added before doubling.
 * As lq_boss_aufloesen on the server.
 */
export const BOSS_KARTE_SCHADEN = 15;
export const bossKartenSchaden = (serie: number, bonus = 0) => (BOSS_KARTE_SCHADEN + bonus) * (serie >= 3 ? 2 : 1);

/** The boss's life points for `kinder` children and `fragen` questions. */
export const bossLp = (kinder: number, fragen: number) => Math.max(1, kinder * fragen * BOSS_LP_JE);

/** The boss hits the class (one heart) when fewer than half of the children who joined answered right. */
export const bossTrifft = (richtig: number, kinder: number) => richtig * 2 < kinder;

// — Echte Belohnungen (Stufe 4), as lq_runde_melden, lq_boss_ticken, lq_punkte_geben and lq_anfragen on the server —

/** Class points for the weekly goal (once a week, with its chest) and for a boss win (once per region, with its chest). */
export const PUNKTE_WOCHENZIEL = 3;
export const PUNKTE_BOSS = 2;
/** Most class points a teacher gives a child by hand per week (1–5 at a time). */
export const PUNKTE_HAND_WOCHE = 5;
/** Most open requests per child. */
export const ANFRAGEN_OFFEN_MAX = 10;

/** A voucher as the child sees it: `ich` and `klasse` count this week's open and redeemed requests. */
export interface GutscheinSicht {
  preis: number;
  /** Limits per week; null = none. */
  jeKind: number | null;
  jeKlasse: number | null;
  ich: number;
  klasse: number;
}

/** Whether a child can ask for a voucher now, in the order the server checks: points, own limit, class limit, open requests. */
export function gutscheinFrei(g: GutscheinSicht, punkte: number, offen: number): 'ok' | 'punkte' | 'grenze' | 'voll' {
  if (punkte < g.preis) return 'punkte';
  if (g.jeKind !== null && g.ich >= g.jeKind) return 'grenze';
  if (g.jeKlasse !== null && g.klasse >= g.jeKlasse) return 'grenze';
  if (offen >= ANFRAGEN_OFFEN_MAX) return 'voll';
  return 'ok';
}

/** How many class points the teacher can still give a child this week. */
export const punkteHandRest = (schonDieseWoche: number) => Math.max(0, PUNKTE_HAND_WOCHE - schonDieseWoche);
