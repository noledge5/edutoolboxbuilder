// The rules of Lernquest: rounds of a station, checking answers, experience and hero level, stars, the weekly goal
// and spaced repetition (Leitner boxes). Pure, so it is tested without a browser. The server applies the same reward
// rules in `lq_runde_melden` (supabase/migrations/20261106_lernquest.sql); change both together.
import { normalize } from '../share/grade';
import { seeded, shuffle } from '../model/language';
import type { Stand, Uebung } from './types';

// — Rounds —

/** Exercises per round. */
export const RUNDE_GROESSE = 5;
/** Rounds per station: 3–5 (a station with only a few exercises has one round). */
export const RUNDEN_MIN = 3;
export const RUNDEN_MAX = 5;
/** Most exercises in one round. */
export const RUNDE_MAX = 8;

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
  | { art: 'bild'; gewaehlt: number };

/** A sentence from tiles: spaces before end marks and commas go. */
export const satz = (tiles: string[]) => tiles.join(' ').replace(/\s+([.,!?;:])/g, '$1');

/** Whether an answer is right. Pairs count as right when no wrong pair was tried. */
export function istRichtig(u: Uebung, a: Antwort): boolean {
  switch (u.art) {
    case 'waehlen':
      return a.art === 'waehlen' && [...a.gewaehlt].sort().join() === [...u.richtig].sort().join();
    case 'richtigfalsch':
      return a.art === 'richtigfalsch' && a.wert === u.richtig;
    case 'paare':
      return a.art === 'paare' && a.fehler === 0;
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
      return u.teile.map((t, i) => (i % 2 ? `[${t}]` : t)).join('');
    case 'reihenfolge':
      return u.loesung;
    case 'gruppen':
      return u.gruppen.map((g, gi) => `${g}: ${u.karten.filter(([, k]) => k === gi).map(([t]) => t).join(', ')}`).join('; ');
    case 'bild':
      return u.wort;
  }
}

/** Order of the options or tiles on screen, the same for the same exercise and try. */
export const gemischt = <T>(xs: T[], seed: string) => shuffle(xs, seeded(seed));

// — Experience and hero level —

/** Most experience per day (more rounds still count for stars and repetition). */
export const XP_TAG = 300;

/** Experience for a round: 10, 2 per right answer, 5 more without mistakes; capped by what is left today. */
export function xpFuerRunde(richtig: number, gesamt: number, heuteSchon = 0): number {
  const roh = 10 + 2 * richtig + (richtig === gesamt ? 5 : 0);
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

/**
 * Stars of a station from the best percent per round: none until every round is done once; 1 for all done, 2 when
 * the rounds average at least 80 %, 3 when every round was once without mistakes.
 */
export function sterne(bestwerte: number[] | undefined, runden: number): number {
  if (!runden || !bestwerte) return 0;
  const b = Array.from({ length: runden }, (_, i) => bestwerte[i]);
  if (b.some((x) => x === undefined || x <= 0)) return 0;
  if (b.every((x) => x! >= 100)) return 3;
  const avg = b.reduce((s, x) => s + x!, 0) / runden;
  return avg >= 80 ? 2 : 1;
}

/** Rounds of a station that are done (best above 0). */
export const rundenGeschafft = (bestwerte: number[] | undefined, runden: number) => Array.from({ length: runden }, (_, i) => (bestwerte?.[i] ?? 0) > 0).filter(Boolean).length;

// — Weekly goal —

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

// — Repetition (Leitner boxes) —

/** Days until an exercise is due again, by box 1–5. */
export const ABSTAND = [0, 1, 3, 7, 14, 30];

export const tagNummer = (tag: string) => Math.round(Date.parse(`${tag}T00:00:00Z`) / 86_400_000);

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

// — Coins (Stufe 2) —

/** Most coins per day. */
export const MUENZEN_TAG = 200;

/**
 * Coins for a round: 5, 1 per right answer, 2 per heart left (every mistake costs a heart; empty hearts end nothing),
 * then the bonus percent (rounded down); capped by what is left today. As `lq_runde_melden`.
 */
export function muenzenFuerRunde(richtig: number, gesamt: number, herzen: number, bonusProzent: number, heuteSchon = 0): number {
  const uebrig = Math.max(0, herzen - (gesamt - richtig));
  let roh = 5 + richtig + 2 * uebrig;
  roh += Math.floor((roh * bonusProzent) / 100);
  return Math.max(0, Math.min(roh, MUENZEN_TAG - heuteSchon));
}

// — A round on this device, before the server answers —

export interface RundenKontext {
  /** Hearts and coin bonus of what the child wears. */
  herzen: number;
  bonusProzent: number;
  /** Rounds of the station (0 for „Wiederholen“). */
  runden: number;
  /** A chest for this station was given already (it shows stars). */
  stationSchonBelohnt: boolean;
}

/**
 * The Spielstand after a round, as the server will count it (`lq_runde_melden`): experience, coins, the round's best,
 * today as a learning day, the changed cards and new chests (station done for the first time, weekly goal reached
 * this week). Used to show the result at once, also offline.
 */
export function rundeAnwenden(
  s: Stand,
  m: { stunde: string; runde: number; richtig: number; gesamt: number; leitner: Stand['leitner'] },
  tag = heute(),
  k: RundenKontext = { herzen: 3, bonusProzent: 0, runden: 0, stationSchonBelohnt: true },
): { plus: number; muenzenPlus: number; truhenPlus: number; punktePlus: number; stand: Stand } {
  const neuerTag = !s.tage.includes(tag);
  const schon = neuerTag ? 0 : s.xpHeute;
  const plus = xpFuerRunde(m.richtig, m.gesamt, schon);
  const mSchon = neuerTag ? 0 : s.muenzenHeute;
  const muenzenPlus = muenzenFuerRunde(m.richtig, m.gesamt, k.herzen, k.bonusProzent, mSchon);
  const bestwerte = { ...s.bestwerte };
  let truhenPlus = 0;
  if (m.stunde) {
    const best = [...(bestwerte[m.stunde] ?? [])];
    while (best.length <= m.runde) best.push(0);
    best[m.runde] = Math.max(best[m.runde], Math.round((100 * m.richtig) / m.gesamt));
    bestwerte[m.stunde] = best;
    if (!k.stationSchonBelohnt && k.runden > 0 && Array.from({ length: k.runden }, (_, i) => best[i] ?? 0).every((x) => x > 0)) truhenPlus++;
  }
  const tage = neuerTag ? [...s.tage, tag].sort().slice(-70) : s.tage;
  // Weekly goal reached now: a chest and class points (the server gives both once per week).
  const ziel = neuerTag && woche(s.tage, tag).diese === WOCHENZIEL - 1;
  if (ziel) truhenPlus++;
  const punktePlus = ziel ? PUNKTE_WOCHENZIEL : 0;
  return {
    plus,
    muenzenPlus,
    truhenPlus,
    punktePlus,
    stand: {
      ...s,
      xp: s.xp + plus,
      xpHeute: schon + plus,
      muenzen: s.muenzen + muenzenPlus,
      muenzenHeute: mSchon + muenzenPlus,
      truhen: s.truhen + truhenPlus,
      klassenpunkte: (s.klassenpunkte ?? 0) + punktePlus,
      bestwerte,
      tage,
      leitner: { ...s.leitner, ...m.leitner },
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

/** Damage of a right answer given `ms` after the question showed; `serie` = right answers in a row, this one included. */
export function bossSchaden(ms: number, serie: number): number {
  const tempo = Math.round(10 * Math.max(0, 1 - Math.max(0, ms) / BOSS_ZEIT_MS));
  return (10 + tempo) * (serie >= 3 ? 2 : 1);
}

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
