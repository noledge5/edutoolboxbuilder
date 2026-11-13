// Lernquest Extra-Pakete (Grammatik, Wortschatz): exercises on one topic that belong to no lesson. Each subject and
// grade gets up to two regions behind the modules on the map, „Grammatik-Turm“ and „Wortschatz-Wald“; each released
// package is a station there. The package reuses the lesson's path (buildPaket, Fragenpool, sending): an Extra-Paket
// is shown to them as a lesson without pages in a module of its own.
import { DEFAULT_TOPIC_ICON } from '../topicIcons';
import type { ExtraArt, ExtraPaket, Lesson, Library, Module } from '../library/types';
import { buildPaket } from './paket';
import type { Paket } from './types';

export const EXTRA_ARTEN: Record<ExtraArt, { region: string; icon: string; nummer: number; name: string }> = {
  grammatik: { region: 'Grammatik-Turm', icon: 'castle', nummer: 1001, name: 'Grammatik' },
  wortschatz: { region: 'Wortschatz-Wald', icon: 'trees', nummer: 1002, name: 'Wortschatz' },
};

/** Packages of an Extra-Paket are stored on the server under this key (instead of a lesson id; at most 64 chars). */
export const extraStunde = (e: Pick<ExtraPaket, 'id'>) => `extra-${e.id}`;
export const istExtraStunde = (stunde: string) => stunde.startsWith('extra-');
/** The region (module) of the Extra-Pakete of one kind in a subject and grade. */
export const extraModulId = (e: Pick<ExtraPaket, 'subject' | 'grade' | 'art'>) => `extra-${e.art}-${e.grade}-${e.subject}`;
export const istExtraModul = (id: string) => id.startsWith('extra-');

/** The Extra-Pakete of the same region as `e` (same subject, grade and kind), oldest first. */
export const gleicheRegion = (alle: ExtraPaket[], e: ExtraPaket) =>
  alle.filter((x) => x.subject === e.subject && x.grade === e.grade && x.art === e.art).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

/** The station number of `e` in its region (1, 2, …). */
export const extraNummer = (alle: ExtraPaket[], e: ExtraPaket) => Math.max(1, gleicheRegion(alle, e).findIndex((x) => x.id === e.id) + 1);

/** The Extra-Paket as a module and a lesson without pages, for the Fragenpool and buildPaket. */
export function extraAlsStunde(e: ExtraPaket, alle: ExtraPaket[] = [e]): { modul: Module; stunde: Lesson } {
  const a = EXTRA_ARTEN[e.art];
  const modul: Module = {
    id: extraModulId(e),
    subject: e.subject,
    grade: e.grade,
    number: a.nummer,
    title: a.region,
    icon: a.icon || DEFAULT_TOPIC_ICON,
    description: '',
    competences: [],
    lang: e.lang,
    help: true,
    textbook: '',
    weeks: 0,
    start: '',
    updatedAt: e.updatedAt,
  };
  const stunde: Lesson = {
    id: extraStunde(e),
    moduleId: modul.id,
    number: extraNummer(alle, e),
    title: e.title,
    textbook: '',
    plan: '',
    role: '',
    competences: [],
    slides: [],
    slideDesign: 'organisch',
    boards: [],
    doc: { icon: modul.icon, lang: e.lang, help: true, footer: '', code: '', pages: [] },
    ...(e.pool ? { pool: e.pool } : {}),
    ...(e.poolHilfe ? { poolHilfe: e.poolHilfe } : {}),
    updatedAt: e.updatedAt,
  };
  return { modul, stunde };
}

/**
 * The Lernpaket of an Extra-Paket: its released exercises and help cards. `freigeschaltet`: the Extra-Pakete of the
 * class (the region shows only those, no locked stations: an Extra-Paket is never „not yet in class“).
 */
export function buildExtraPaket(e: ExtraPaket, alle: ExtraPaket[], freigeschaltet: readonly string[] = [e.id]): Paket {
  const { modul, stunde } = extraAlsStunde(e, alle);
  const p = buildPaket(modul, stunde, [stunde]);
  const stunden = gleicheRegion(alle, e)
    .filter((x) => x.id === e.id || freigeschaltet.includes(x.id))
    .map((x) => ({ nummer: extraNummer(alle, x), titel: x.title }));
  return { ...p, modul: { ...p.modul, stunden } };
}

/** The Extra-Pakete unlocked for a class (from its unlocked „stunden“). */
export const freiFuer = (stunden: readonly string[]) => stunden.filter(istExtraStunde).map((s) => s.slice('extra-'.length));

/** A region of a class on the teacher's page: a module with its unlocked lessons, or Grammatik-Turm / Wortschatz-Wald
 *  of a subject and grade with its unlocked Extra-Pakete (as lessons without pages, `extraAlsStunde`). */
export interface KlassenRegion {
  modul: Module;
  stunden: Lesson[];
  extra: boolean;
}

/** The regions of a class for evaluation, „Wiederholen sofort“ and the boss fight: modules with unlocked lessons, then
 *  the regions of the unlocked Extra-Pakete (by subject, grade and number; lessons by number). */
export function klassenRegionen(lib: Pick<Library, 'modules' | 'lessons' | 'extras'>, freigeschaltet: readonly string[]): KlassenRegion[] {
  const frei = new Set(freigeschaltet);
  const out: KlassenRegion[] = [];
  for (const m of lib.modules) {
    const stunden = lib.lessons.filter((l) => l.moduleId === m.id && frei.has(l.id)).sort((a, b) => a.number - b.number);
    if (stunden.length) out.push({ modul: m, stunden, extra: false });
  }
  const alle = lib.extras ?? [];
  const extras = new Map<string, KlassenRegion>();
  for (const e of alle) {
    if (!frei.has(extraStunde(e))) continue;
    const { modul, stunde } = extraAlsStunde(e, alle);
    const r = extras.get(modul.id) ?? { modul, stunden: [], extra: true };
    r.stunden.push(stunde);
    extras.set(modul.id, r);
  }
  for (const r of extras.values()) out.push({ ...r, stunden: r.stunden.sort((a, b) => a.number - b.number) });
  return out.sort((a, b) => a.modul.subject.localeCompare(b.modul.subject, 'de') || a.modul.grade - b.modul.grade || a.modul.number - b.modul.number);
}

/** How a region is named in the teacher's selects. */
export const klassenRegionName = (r: KlassenRegion) => `${r.modul.subject} ${r.modul.grade} · ${r.extra ? r.modul.title : `Modul ${r.modul.number}: ${r.modul.title}`}`;

/** The packages of a region as the children have them (`freigeschaltet`: the class's unlocked „stunden“). */
export function regionPakete(lib: Pick<Library, 'lessons' | 'extras'>, r: KlassenRegion, freigeschaltet: readonly string[]): Paket[] {
  if (!r.extra) return r.stunden.map((l) => buildPaket(r.modul, l, lib.lessons));
  const alle = lib.extras ?? [];
  const frei = freiFuer(freigeschaltet);
  return r.stunden.flatMap((s) => {
    const e = alle.find((x) => extraStunde(x) === s.id);
    return e ? [buildExtraPaket(e, alle, frei)] : [];
  });
}

/** What Claude writes from instead of the lesson's sheets: the topic and the words. */
export function extraInhalt(e: ExtraPaket): string {
  const a = EXTRA_ARTEN[e.art];
  const out = [
    `Extra-Paket ${a.name} (ohne Stunde): Grundlage ist nur das Thema${e.words.trim() ? ' und die Wortliste' : ''} unten, auf dem Stand von Klasse ${e.grade}.`,
    `Thema: ${e.title.trim() || '(ohne Titel)'}`,
    e.art === 'grammatik'
      ? 'Übe die Grammatik des Themas: Formen bilden, Regeln anwenden, Fehler finden, Sätze bauen. Die Lernkarten erklären die Regel mit Beispielen.'
      : 'Übe die Wörter des Wortfelds: Bedeutung, Schreibung, passende Wörter im Satz, Ober- und Unterbegriffe. Die Lernkarten zeigen die Wörter in Gruppen.',
  ];
  if (e.words.trim()) out.push('', '## Wortliste', e.words.trim().slice(0, 4000));
  return out.join('\n');
}

/** A new Extra-Paket (the topic is typed in, or a vocabulary list fills `words`). */
/** Subjects and grades of the library an Extra-Paket can belong to (each once, by subject then grade). */
export function extraZiele(lib: Pick<Library, 'modules'>): { subject: string; grade: number; lang: 'de' | 'en' }[] {
  const out = new Map<string, { subject: string; grade: number; lang: 'de' | 'en' }>();
  for (const m of lib.modules) {
    if (!m.subject || !m.grade) continue;
    const k = `${m.subject}|${m.grade}`;
    const alt = out.get(k);
    out.set(k, { subject: m.subject, grade: m.grade, lang: alt?.lang === 'en' || m.lang === 'en' ? 'en' : 'de' });
  }
  return [...out.values()].sort((a, b) => a.subject.localeCompare(b.subject, 'de') || a.grade - b.grade);
}

/** The package moved to another subject and grade (created there by mistake): its exercises come along, the language
 *  follows the target (English if a module there is English). Unlock it there anew; lock it in the old class first. */
export function extraVerschieben(e: ExtraPaket, ziel: { subject: string; grade: number; lang: 'de' | 'en' }, now = Date.now()): ExtraPaket {
  return { ...e, subject: ziel.subject, grade: ziel.grade, lang: ziel.lang, updatedAt: now };
}

export function newExtra(subject: string, grade: number, art: ExtraArt, title: string, words = '', lang: 'de' | 'en' = 'de', now = Date.now()): ExtraPaket {
  return { id: 'x' + Math.random().toString(36).slice(2, 10), subject, grade, art, title: title.trim(), words, lang, createdAt: now, updatedAt: now };
}
