// The KI-Fragenpool of a lesson (Stufe 5, Stufe B): about 30 extra exercises in three levels Claude writes from the lesson's student pages,
// which the teacher checks, corrects and releases. Released ones travel in the Lernpaket after the lesson's own
// exercises. Only the lesson content goes to Claude, never names or answers of children. Tasks with places on a
// picture („Punkt auf Karte/Bild“) the teacher makes by hand from a picture of the worksheet. Pure, so it is tested
// without a browser; the dialog is `teacher/Fragenpool.tsx`.
import { blockText } from '../library/search';
import type { Lesson, Module } from '../library/types';
import { seeded, shuffle } from '../model/language';
import { isObj, str } from '../model/text';
import { KARTE_KEY, sentenceTiles, shuffledTiles } from './paket';
import type { Niveau, PoolEintrag, Uebung } from './types';

export const POOL_FORMAT = 'lernquest-fragenpool';
/** Exercises one request asks for. */
export const POOL_ZIEL = 30;
/** Most exercises a lesson's pool keeps (released or not), so the package stays small and every one comes up. */
export const POOL_MAX = 40;

const TEXT_MAX = 240;
const OPTION_MAX = 120;
const OPTIONEN = [2, 6] as const;
const PAARE = [2, 5] as const;
const KARTEN = [3, 8] as const;
const GRUPPEN = [2, 3] as const;
const KACHELN_MAX = 14;
/** Places on one picture: enough for a map, few enough to tap on a phone. */
export const PUNKTE = [1, 6] as const;
const NAME_MAX = 60;
/** The sentence after a mistake: short, a child reads it on a phone. */
const ERKLAERUNG_MAX = 240;
/** Image ids a task with places can name (the key travels in the package and is checked strictly). */
const BILD_ID = /^[\w-]{1,64}$/;
const ABLENKER_MAX = 3;
/** Spellings that count for a typed answer. */
const LOESUNGEN = [1, 4] as const;
export const NIVEAUS: Record<Niveau, string> = { 1: 'leicht', 2: 'mittel', 3: 'schwer' };
const SOURCE_MAX = 16000;

// — Reading (an exercise as stored, synced or from a package) —

const text = (x: unknown, max = TEXT_MAX): string | null => (typeof x === 'string' && x.trim() && x.length <= max ? x : null);
const texts = (x: unknown, [lo, hi]: readonly [number, number], max = OPTION_MAX): string[] | null => {
  if (!Array.isArray(x) || x.length < lo || x.length > hi) return null;
  const out = x.map((y) => text(y, max));
  return out.every((y): y is string => y !== null) ? out : null;
};
const index = (x: unknown, n: number): number | null => (Number.isInteger(x) && (x as number) >= 0 && (x as number) < n ? (x as number) : null);

/** One exercise, checked strictly (a broken one is null): what the teacher keeps must also play. */
export function readUebung(x: unknown): Uebung | null {
  const u = liesUebung(x);
  if (!u || !isObj(x)) return u;
  const erklaerung = text(x.erklaerung, ERKLAERUNG_MAX)?.trim();
  const niveau = x.niveau === 1 || x.niveau === 2 || x.niveau === 3 ? x.niveau : null;
  return { ...u, ...(erklaerung ? { erklaerung } : {}), ...(niveau ? { niveau } : {}) };
}

/** An exercise with the explanation and level the teacher (or Claude) gave it; an empty explanation is none. */
export const mitZusatz = (u: Uebung, erklaerung: string, niveau: Niveau | undefined): Uebung | null => readUebung({ ...u, erklaerung: erklaerung.trim(), niveau });

function liesUebung(x: unknown): Uebung | null {
  if (!isObj(x) || typeof x.id !== 'string' || !x.id || x.id.length > 80) return null;
  const id = x.id;
  const frage = text(x.frage);
  if (!frage) return null;
  switch (x.art) {
    case 'waehlen': {
      const optionen = texts(x.optionen, OPTIONEN);
      if (!optionen || !Array.isArray(x.richtig) || !x.richtig.length) return null;
      const richtig = x.richtig.map((i) => index(i, optionen.length));
      if (richtig.some((i) => i === null) || new Set(richtig).size !== richtig.length) return null;
      const aussage = x.aussage === undefined || x.aussage === '' ? '' : text(x.aussage);
      const hoeren = x.hoeren === undefined || x.hoeren === '' ? '' : text(x.hoeren);
      if (aussage === null || hoeren === null) return null;
      return { art: 'waehlen', id, frage, ...(aussage ? { aussage } : {}), optionen, richtig: richtig as number[], ...(hoeren ? { hoeren } : {}) };
    }
    case 'richtigfalsch': {
      const aussage = text(x.aussage);
      return aussage && typeof x.richtig === 'boolean' ? { art: 'richtigfalsch', id, frage, aussage, richtig: x.richtig } : null;
    }
    case 'paare': {
      if (!Array.isArray(x.paare) || x.paare.length < PAARE[0] || x.paare.length > PAARE[1]) return null;
      const paare = x.paare.map((p) => texts(p, [2, 2]));
      return paare.every((p): p is string[] => p !== null) ? { art: 'paare', id, frage, paare: paare.map(([a, b]) => [a, b]) } : null;
    }
    case 'luecke': {
      const teile = x.teile;
      if (!Array.isArray(teile) || teile.length < 3 || teile.length % 2 === 0 || teile.length > 9) return null;
      if (!teile.every((t, i) => typeof t === 'string' && t.length <= TEXT_MAX && (i % 2 === 0 || t.trim()))) return null;
      const kacheln = texts(x.kacheln, [1, KACHELN_MAX]);
      if (!kacheln) return null;
      // Every gap's answer must be among the tiles.
      const left = [...kacheln];
      for (let i = 1; i < teile.length; i += 2) {
        const k = left.indexOf(teile[i] as string);
        if (k < 0) return null;
        left.splice(k, 1);
      }
      return { art: 'luecke', id, frage, teile: teile as string[], kacheln };
    }
    case 'reihenfolge': {
      const kacheln = texts(x.kacheln, [2, KACHELN_MAX]);
      const loesung = text(x.loesung);
      const hinweis = x.hinweis === undefined || x.hinweis === '' ? '' : text(x.hinweis);
      return kacheln && loesung && hinweis !== null ? { art: 'reihenfolge', id, frage, hinweis, kacheln, loesung } : null;
    }
    case 'gruppen': {
      const gruppen = texts(x.gruppen, GRUPPEN, 60);
      if (!gruppen || !Array.isArray(x.karten) || x.karten.length < KARTEN[0] || x.karten.length > KARTEN[1]) return null;
      const karten = x.karten.map((k): [string, number] | null => {
        if (!Array.isArray(k) || k.length !== 2) return null;
        const t = text(k[0], OPTION_MAX);
        const g = index(k[1], gruppen.length);
        return t !== null && g !== null ? [t, g] : null;
      });
      if (!karten.every((k): k is [string, number] => k !== null)) return null;
      if (!gruppen.every((_, gi) => karten.some(([, g]) => g === gi))) return null;
      return { art: 'gruppen', id, frage, gruppen, karten };
    }
    case 'bild': {
      const wort = text(x.wort, OPTION_MAX);
      const bilder = texts(x.bilder, [2, 4], 80);
      const richtig = bilder && index(x.richtig, bilder.length);
      return wort && bilder && richtig !== null && richtig !== undefined ? { art: 'bild', id, frage, wort, bilder, richtig } : null;
    }
    case 'punkt': {
      if (typeof x.bild !== 'string' || !x.bild.startsWith(KARTE_KEY) || !BILD_ID.test(x.bild.slice(KARTE_KEY.length))) return null;
      if (!Array.isArray(x.punkte) || x.punkte.length < PUNKTE[0] || x.punkte.length > PUNKTE[1]) return null;
      const pct = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 10) / 10 : null);
      const punkte = x.punkte.map((p): [number, number, string] | null => {
        if (!Array.isArray(p) || p.length !== 3) return null;
        const px = pct(p[0]);
        const py = pct(p[1]);
        const name = text(p[2], NAME_MAX);
        return px !== null && py !== null && name !== null ? [px, py, name.trim()] : null;
      });
      if (!punkte.every((p): p is [number, number, string] => p !== null)) return null;
      if (new Set(punkte.map(([, , n]) => n.toLowerCase())).size !== punkte.length) return null;
      return { art: 'punkt', id, frage, bild: x.bild, punkte };
    }
    case 'schreiben': {
      const loesungen = texts(x.loesungen, LOESUNGEN)?.map((l) => l.trim());
      const aussage = x.aussage === undefined || x.aussage === '' ? '' : text(x.aussage);
      return loesungen && aussage !== null ? { art: 'schreiben', id, frage, ...(aussage ? { aussage } : {}), loesungen } : null;
    }
    default:
      return null;
  }
}

/** A lesson's pool as stored or synced: broken entries and doubled ids are left out. */
export function readPool(x: unknown): PoolEintrag[] {
  if (!Array.isArray(x)) return [];
  const seen = new Set<string>();
  const out: PoolEintrag[] = [];
  for (const e of x) {
    if (!isObj(e)) continue;
    const u = readUebung(e.u);
    if (!u || seen.has(u.id)) continue;
    seen.add(u.id);
    out.push({ u, frei: e.frei === true });
  }
  return out.slice(0, POOL_MAX);
}

/** The released exercises that go into the Lernpaket. */
export const freigegeben = (pool: PoolEintrag[] | undefined) => (pool ?? []).filter((e) => e.frei).map((e) => e.u);

// — Writing and editing —

/** A new id for a pool exercise: not one of `taken`. */
export function neueId(taken: Iterable<string>, rnd: () => number = Math.random): string {
  const have = new Set(taken);
  for (;;) {
    const id = `pool-${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0')}`;
    if (!have.has(id)) return id;
  }
}

/** A gap sentence as the teacher writes it: the answers in square brackets ("The sun is a [star]."). */
export const lueckeText = (u: Extract<Uebung, { art: 'luecke' }>) => u.teile.map((t, i) => (i % 2 ? `[${t}]` : t)).join('');

/** The tiles of a gap exercise that are no answer (the distractors). */
export function ablenkerVon(u: Extract<Uebung, { art: 'luecke' }>): string[] {
  const left = [...u.kacheln];
  for (let i = 1; i < u.teile.length; i += 2) {
    const k = left.indexOf(u.teile[i]);
    if (k >= 0) left.splice(k, 1);
  }
  return left;
}

/** A gap exercise from "text with [answers]" and distractors; null when there is no gap. */
export function lueckeAus(id: string, frage: string, satz: string, ablenker: string[]): Extract<Uebung, { art: 'luecke' }> | null {
  const teile: string[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  for (let m = re.exec(satz); m; m = re.exec(satz)) {
    teile.push(satz.slice(last, m.index), m[1].trim());
    last = m.index + m[0].length;
  }
  teile.push(satz.slice(last));
  if (teile.length < 3) return null;
  const answers = teile.filter((_, i) => i % 2 === 1);
  const extra = ablenker.map((a) => a.trim()).filter((a) => a && !answers.some((x) => x.toLowerCase() === a.toLowerCase()));
  const kacheln = shuffle([...answers, ...extra.slice(0, ABLENKER_MAX)], seeded(`${id}:k`));
  return { art: 'luecke', id, frage, teile, kacheln };
}

/** A word-order exercise from its solution sentence (tiles: words, the end mark on its own). */
export function reihenfolgeAus(id: string, frage: string, loesung: string, hinweis = ''): Extract<Uebung, { art: 'reihenfolge' }> | null {
  const words = sentenceTiles(loesung.trim());
  if (words.length < 2 || words.length > KACHELN_MAX) return null;
  return { art: 'reihenfolge', id, frage, hinweis, kacheln: shuffledTiles(words, id), loesung: loesung.trim() };
}

// — Places on a picture —

/** The pictures of the lesson's student pages (blocks „Abbildung“ with an own picture), for a task with places. */
export function bilderDerStunde(l: Lesson): { id: string; titel: string }[] {
  const out: { id: string; titel: string }[] = [];
  for (const p of l.doc.pages) {
    if (p.type === 'lehrkraft') continue;
    for (const b of p.blocks) {
      const id = str(b.props.image).trim();
      if (b.type === 'image' && BILD_ID.test(id) && !out.some((x) => x.id === id)) out.push({ id, titel: str(b.props.caption).trim() || p.title || 'Abbildung' });
    }
  }
  return out;
}

/** A task with places on the picture `bildId`. */
export const punktAufgabe = (id: string, bildId: string, punkte: [number, number, string][], frage = 'Tippe auf die richtige Stelle.'): Uebung => ({
  art: 'punkt',
  id,
  frage,
  bild: `${KARTE_KEY}${bildId}`,
  punkte,
});

// — Claude —

export interface PoolAuftrag {
  modul: Module;
  stunde: Lesson;
  /** About the class without names (the teacher's class profile), '' when there is none. */
  klasse: string;
  /** Exercises already there (from the lesson and the pool), so Claude writes other ones. */
  vorhanden: Uebung[];
  wuensche: string;
}

/** What the children see of the lesson: the student pages as text (teacher pages stay out). */
export function stundenText(l: Lesson): string {
  const out: string[] = [];
  for (const p of l.doc.pages) {
    if (p.type === 'lehrkraft') continue;
    out.push(`### ${p.title || 'Seite'}`);
    for (const b of p.blocks) out.push(...blockText(b));
  }
  const t = out.join('\n');
  return t.length > SOURCE_MAX ? t.slice(0, SOURCE_MAX) + '\n…' : t;
}

/** One line per exercise, for the list of what is already there. */
export function kurzText(u: Uebung): string {
  switch (u.art) {
    case 'waehlen':
      return [u.frage, u.hoeren, u.aussage, u.optionen[u.richtig[0]]].filter(Boolean).join(' – ');
    case 'richtigfalsch':
      return u.aussage;
    case 'paare':
      return u.paare.map(([a, b]) => `${a} = ${b}`).join(', ');
    case 'luecke':
      return lueckeText(u);
    case 'reihenfolge':
      return u.loesung;
    case 'gruppen':
      return `${u.gruppen.join(' / ')}: ${u.karten.map(([t]) => t).join(', ')}`;
    case 'bild':
      return u.wort;
    case 'punkt':
      return `Stellen im Bild: ${u.punkte.map(([, , n]) => n).join(', ')}`;
    case 'schreiben':
      return [u.aussage, u.loesungen[0]].filter(Boolean).join(' – ');
  }
}

/** The fixed instructions (cached between requests). */
export function poolSystem(): string {
  return [
    'Du schreibst Übungen für „Lernquest“, eine Lern-App im Stil von Anton und Duolingo für eine Realschule in Baden-Württemberg (Klasse 5–10). Die Kinder üben damit zu Hause und in der Schule, was in einer Stunde behandelt wurde.',
    'Grundlage ist nur der Inhalt der Stunde (die Arbeitsblätter der Kinder). Frag nichts ab, was dort nicht steht oder für die Klassenstufe nicht zu erwarten ist. Die Lehrkraft prüft jede Übung, bevor die Klasse sie sieht.',
    '',
    '## Regeln',
    '- Kurz und eindeutig: genau eine richtige Lösung (bei „waehlen“ höchstens zwei richtige Antworten), keine Fangfragen, keine doppelte Verneinung.',
    '- Falsche Antworten sind typische Denkfehler der Klassenstufe (was Kinder wirklich verwechseln), aber eindeutig falsch.',
    '- Jede Übung bekommt "niveau" (1 leicht: wiedererkennen; 2 mittel: anwenden; 3 schwer: selbst erzeugen oder übertragen) und "erklaerung": ein kurzer Satz in Kindersprache, warum die Lösung stimmt (höchstens 200 Zeichen, auf Deutsch, verrät nichts über andere Übungen).',
    '- Sprache der Klassenstufe; Anweisungen („frage“) auf Deutsch, kurz („Tippe die richtige Antwort an.“). In Englisch-Stunden stehen Aussagen, Sätze und Antworten auf Englisch.',
    '- Abwechslung: alle Formate nutzen, nicht zweimal dieselbe Frage, keine Übung, die schon in der Liste „Schon vorhanden“ steht.',
    '- Höchstens 240 Zeichen je Text, Antworten und Karten höchstens 120.',
    '- **fett** und {{markiert}} sind erlaubt, sonst kein Markdown.',
    '',
    '## Formate',
    '- waehlen: {"art":"waehlen","frage":"…","aussage":"…(freiwillig)","optionen":["…","…","…"],"richtig":[0]} – 2 bis 6 Optionen, „richtig“ sind die Stellen (ab 0).',
    '- hoeren (nur Englisch): {"art":"hoeren","frage":"Hör zu. Was passt?","text":"englischer Satz, der vorgelesen wird","optionen":["…","…","…"],"richtig":0}',
    '- richtigfalsch: {"art":"richtigfalsch","frage":"Stimmt das?","aussage":"…","richtig":true}',
    '- paare: {"art":"paare","frage":"Finde die Paare.","paare":[["…","…"],["…","…"]]} – 3 bis 5 Paare.',
    '- luecke: {"art":"luecke","frage":"Ergänze die Lücke.","satz":"Die Sonne ist ein [Stern].","ablenker":["Planet","Mond"]} – 1 bis 3 Lücken in eckigen Klammern, 2 bis 3 Ablenker.',
    '- reihenfolge: {"art":"reihenfolge","frage":"Bring die Wörter in die richtige Reihenfolge.","hinweis":"(freiwillig)","loesung":"I like my new school."} – 3 bis 10 Wörter, die App mischt sie.',
    '- gruppen: {"art":"gruppen","frage":"Sortiere.","gruppen":["…","…"],"karten":[["…",0],["…",1]]} – 2 bis 3 Gruppen, 4 bis 8 Karten, jede Gruppe mindestens eine Karte.',
    '- schreiben: {"art":"schreiben","frage":"Schreib das Wort auf Englisch.","aussage":"die Schwester","loesungen":["sister","the sister"]} – das Kind tippt ein Wort oder einen ganz kurzen Satz. Nur wenn die Lösung eindeutig ist (Vokabeln, Fachbegriffe, Zahlen); alle richtigen Schreibweisen angeben (höchstens 4). Groß- und Kleinschreibung und der Punkt am Ende zählen nicht.',
    '',
    '## Antwort',
    `Nur ein JSON-Block: {"format":"${POOL_FORMAT}","uebungen":[{"art":"…","niveau":1,"erklaerung":"…",…}]}. Etwa ${POOL_ZIEL} Übungen, je ein Drittel leicht, mittel und schwer, jedes Format mindestens einmal (hoeren nur in Englisch-Stunden).`,
    'Leicht sind vor allem waehlen, richtigfalsch und paare; mittel vor allem luecke, reihenfolge, gruppen und hoeren; schwer vor allem schreiben, Lücken mit mehreren Wörtern und Fragen, die das Gelernte auf einen neuen Fall übertragen.',
  ].join('\n');
}

/** The request for one lesson. */
export function poolPrompt(a: PoolAuftrag): string {
  const m = a.modul;
  const l = a.stunde;
  const en = m.lang === 'en';
  const kopf = [
    `# Übungen für Lernquest: ${m.subject}, Klasse ${m.grade}`,
    `Modul ${m.number}: ${m.title} · Stunde ${l.number}: ${l.title}`,
    en ? 'Englisch-Stunde: Aussagen, Sätze und Antworten auf Englisch; „hoeren“ nutzen.' : 'Deutschsprachige Stunde: kein Format „hoeren“.',
  ];
  if (a.klasse.trim()) kopf.push(`Die Klasse (ohne Namen): ${a.klasse.trim()}`);
  if (a.wuensche.trim()) kopf.push(`Wünsche der Lehrkraft: ${a.wuensche.trim()}`);
  return [
    ...kopf,
    '',
    '## Inhalt der Stunde',
    stundenText(l) || '(Auf den Arbeitsblättern steht noch nichts.)',
    '',
    '## Schon vorhanden',
    a.vorhanden.length ? a.vorhanden.map((u) => `- ${kurzText(u)}`).join('\n') : '(nichts)',
  ].join('\n');
}

/** The whole request, for „Fragen erzeugen“ and for the automatic one after unlocking a lesson. */
export const poolAnfrage = (a: PoolAuftrag) => ({ job: 'small' as const, what: 'Lernquest-Fragenpool', system: poolSystem(), user: poolPrompt(a), maxTokens: 16000, effort: 'low' as const });

const s = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
const strs = (x: unknown) => (Array.isArray(x) ? x.map(s).filter(Boolean) : []);

/** One exercise as Claude writes it, turned into the app's form (null when it does not hold up). */
function ausEntwurf(x: unknown, id: string, en: boolean): Uebung | null {
  const u = ohneZusatz(x, id, en);
  // A too long explanation or an unknown level is dropped, the exercise stays.
  return u && isObj(x) ? readUebung({ ...u, erklaerung: s(x.erklaerung), niveau: Number(x.niveau) }) : u;
}

function ohneZusatz(x: unknown, id: string, en: boolean): Uebung | null {
  if (!isObj(x)) return null;
  const frage = s(x.frage);
  switch (x.art) {
    case 'hoeren': {
      if (!en) return null;
      const r = Number(x.richtig);
      return readUebung({ art: 'waehlen', id, frage: frage || 'Hör zu. Was passt?', hoeren: s(x.text), optionen: strs(x.optionen), richtig: [r] });
    }
    case 'waehlen': {
      const richtig = Array.isArray(x.richtig) ? x.richtig.map(Number) : [Number(x.richtig)];
      return readUebung({ art: 'waehlen', id, frage: frage || 'Tippe die richtige Antwort an.', aussage: s(x.aussage), optionen: strs(x.optionen), richtig });
    }
    case 'richtigfalsch':
      return readUebung({ art: 'richtigfalsch', id, frage: frage || 'Stimmt das?', aussage: s(x.aussage), richtig: x.richtig === true || x.richtig === 'true' });
    case 'paare':
      return readUebung({ art: 'paare', id, frage: frage || 'Finde die Paare.', paare: Array.isArray(x.paare) ? x.paare.map(strs) : [] });
    case 'luecke': {
      const u = lueckeAus(id, frage || 'Ergänze die Lücke.', s(x.satz), strs(x.ablenker));
      return u && readUebung(u);
    }
    case 'reihenfolge': {
      const u = reihenfolgeAus(id, frage || 'Bring die Wörter in die richtige Reihenfolge.', s(x.loesung), s(x.hinweis));
      return u && readUebung(u);
    }
    case 'gruppen':
      return readUebung({
        art: 'gruppen',
        id,
        frage: frage || 'Sortiere.',
        gruppen: strs(x.gruppen),
        karten: Array.isArray(x.karten) ? x.karten.map((k) => (Array.isArray(k) ? [s(k[0]), Number(k[1])] : null)) : [],
      });
    case 'schreiben':
      return readUebung({ art: 'schreiben', id, frage: frage || 'Schreib die Antwort.', aussage: s(x.aussage), loesungen: strs(x.loesungen) });
    default:
      return null;
  }
}

/**
 * The exercises of Claude's answer, each with a new id (not one of `ids`); what does not hold up is left out and
 * counted. Throws a German message when the answer is no pool at all.
 */
export function poolAusAntwort(raw: unknown, ids: Iterable<string>, en: boolean): { neu: Uebung[]; verworfen: number } {
  const list = isObj(raw) && Array.isArray(raw.uebungen) ? raw.uebungen : Array.isArray(raw) ? raw : null;
  if (!list) throw new Error('Das ist kein Fragenpool: In der Antwort fehlt die Liste „uebungen“.');
  const taken = new Set(ids);
  const neu: Uebung[] = [];
  let verworfen = 0;
  for (const x of list) {
    const id = neueId(taken);
    const u = ausEntwurf(x, id, en);
    if (!u) {
      verworfen++;
      continue;
    }
    taken.add(id);
    neu.push(u);
  }
  if (!neu.length) throw new Error('In der Antwort war keine brauchbare Übung.');
  return { neu, verworfen };
}
