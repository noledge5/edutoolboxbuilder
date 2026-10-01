// The year plan (Stoffverteilungsplan) with Claude: the request with the school year and the modules already there,
// and reading the answer, modules with planned lessons, as a package for the library.
import { defaultLang, isWorkedOut, lessonsOf, modulesOf } from '../library/model';
import { PACKAGE_FORMAT, PACKAGE_VERSION, readPackage, type ParsedPackage } from '../library/package';
import type { Library, Module } from '../library/types';
import { DocFormatError } from '../model/normalize';
import { dayText, planModules, schoolWeekCount, schoolWeeks, type PlannedModule } from '../library/yearplan';

export interface PlanWishes {
  /** Lessons per week. */
  hours: number;
  textbook: string;
  /** Topics, order, projects, tests … in the teacher's words. */
  wishes: string;
}

const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Subject, grade, school year with holidays and the modules already planned, as Markdown for Claude. */
export function yearPlanContext(lib: Library, subject: string, grade: number, w: PlanWishes): string {
  const out: string[] = ['## Der Jahrgang'];
  out.push(`- Fach: ${subject} · Klasse ${grade} · Sprache der Arbeitsblätter: ${defaultLang(subject) === 'en' ? 'Englisch (`"lang": "en"`)' : 'Deutsch'}`);
  out.push(`- Stunden pro Woche: ${w.hours}`);
  if (w.textbook.trim()) out.push(`- Lehrwerk: ${flat(w.textbook)}`);
  if (w.wishes.trim()) out.push(`- Wünsche der Lehrkraft: ${flat(w.wishes)}`);
  const year = lib.settings.schoolYear;
  if (year) {
    const weeks = schoolWeeks(year);
    out.push(
      '',
      `## Schuljahr ${year.name}`,
      `- Erster Schultag ${dayText(year.start, true)}, letzter Schultag ${dayText(year.end, true)}: ${schoolWeekCount(weeks)} Schulwochen (Ferienwochen schon abgezogen).`,
    );
    for (const h of year.holidays) out.push(`- ${h.name}: ${dayText(h.from, true)} bis ${dayText(h.to, true)}`);
  }
  const modules = modulesOf(lib, subject, grade);
  out.push('', '## Module, die es schon gibt');
  if (!modules.length) out.push('- Noch keine.');
  for (const m of modules) {
    const ls = lessonsOf(lib, m.id);
    const done = ls.filter(isWorkedOut).length;
    out.push(
      `- Modul ${m.number}: „${m.title}“${m.weeks ? `, ${m.weeks} Wochen` : ''}${m.start ? `, ab ${dayText(m.start, true)}` : ''}${m.textbook ? `, ${m.textbook}` : ''} · ${ls.length} Stunden${done ? `, davon ${done} ausgearbeitet` : ''}${m.competences.length ? ` · ${m.competences.length} Kompetenzen` : ''}`,
    );
    if (ls.length) out.push(`  Stunden: ${ls.map((l) => `${l.number}. ${l.title}${isWorkedOut(l) ? ' (ausgearbeitet)' : ''}`).join('; ')}`);
  }
  return out.join('\n');
}

/** The request for the year plan. `chat`: for pasting into a Claude project. */
export function yearPlanPrompt(subject: string, grade: number, context: string, chat = false): string {
  const task =
    `Erstelle den Jahresplan (Stoffverteilungsplan) für ${subject}, Klasse ${grade}: Module in sinnvoller Reihenfolge mit \`weeks\`, die zusammen in die Schulwochen passen (lass ein, zwei Wochen Puffer), ` +
    'je Modul ein Kompetenzraster (G/M/E, Bildungsplan BW) und alle Stunden als geplante Stunden (`number`, `title`, `plan`: ein, zwei Sätze, was in der Stunde passiert, mit Lehrwerksseiten, wenn du sie kennst), ' +
    'so viele Stunden je Modul, wie Wochen × Stunden pro Woche ergeben. Plane Wiederholung und Klassenarbeiten als eigene Stunden ein, wo sie üblich sind. ' +
    'Module, die es schon gibt, behalten ihre Nummer und ihre Stunden; ergänze sie nur, wo noch Stunden fehlen, und plane die übrigen Module drumherum.';
  const out: string[] = [];
  if (chat) out.push(`Bitte nach der Anleitung „Arbeitsblatt-Baukasten“ im Projektwissen: ${task}`);
  else out.push('Du arbeitest diesmal direkt im Baukasten, nicht im Chat: Es gibt keine Rückfragen und keine Dateien. Entscheide selbst, was fehlt, im Sinne der Anleitung.', '', `**Auftrag:** ${task}`);
  out.push(
    '',
    `**Form der Antwort:** genau ein JSON-Codeblock mit einem Stundenpaket („${PACKAGE_FORMAT}“, Version ${PACKAGE_VERSION}) mit allen Modulen des Jahrgangs, ohne \`pages\`, ohne Folien und ohne \`schoolYear\`. ` +
      (chat ? 'Gib das Paket als Codeblock im Chat aus, keine Datei.' : 'Kein Text vor oder nach dem Codeblock.'),
    '',
    context,
  );
  return out.join('\n');
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Reads Claude's year plan for `subject` and grade `grade`: every module gets this subject and grade, lessons stay
 * planned (pages and slides are left out), the school year in the library stays. Throws a German DocFormatError.
 */
export function yearPlanFromAnswer(raw: unknown, subject: string, grade: number): ParsedPackage {
  if (!isObj(raw)) throw new DocFormatError('Die Antwort ist kein Stundenpaket.');
  const list = Array.isArray(raw.modules) ? raw.modules : isObj(raw.module) ? [{ ...raw.module, lessons: raw.lessons }] : null;
  if (!list?.length) throw new DocFormatError('In der Antwort fehlen die Module ("modules").');
  const modules = list.filter(isObj).map((m) => ({
    ...m,
    subject,
    grade,
    lessons: (Array.isArray(m.lessons) ? m.lessons : []).filter(isObj).map(({ pages: _p, slides: _s, slideDesign: _d, ...l }) => l),
  }));
  return readPackage({ format: PACKAGE_FORMAT, version: PACKAGE_VERSION, modules });
}

/** One module of the plan in the preview: what it does to the library and where it falls in the year. */
export interface PlanRow {
  number: number;
  title: string;
  weeks: number;
  lessons: number;
  competences: number;
  /** Adds to the module with the same number (which is only planned or gets missing lessons), or a new module. */
  action: 'neu' | 'ergänzt';
  /** "KW 38–42" in the year plan, '' without school year. */
  when: string;
  short: boolean;
  lessonTitles: string[];
}

/** The plan as it will look: modules of the package (merged by number) and the ones that stay, in the school weeks. */
export function planPreview(lib: Library, subject: string, grade: number, p: ParsedPackage): { rows: PlanRow[]; used: number; total: number } {
  const existing = modulesOf(lib, subject, grade);
  const year = lib.settings.schoolYear;
  const weeks = year ? schoolWeeks(year) : [];
  const incoming = p.modules.map((pm, i) => {
    const old = existing.find((m) => m.number === pm.module.number);
    const keep = old && lessonsOf(lib, old.id).some(isWorkedOut);
    const m: Module = { ...pm.module, id: old?.id ?? `neu-${i}`, weeks: keep ? old.weeks || pm.module.weeks : pm.module.weeks || old?.weeks || 0, updatedAt: 0 };
    return { m, pm, old };
  });
  const all = [...existing.filter((m) => !incoming.some((x) => x.old?.id === m.id)), ...incoming.map((x) => x.m)];
  const planned = new Map<string, PlannedModule>(planModules(all, weeks).map((x) => [x.module.id, x]));
  const rows = incoming
    .map(({ m, pm, old }): PlanRow => {
      const pl = planned.get(m.id);
      // As addPackage merges: lessons by number; the grid of a module in progress stays, a planned one takes Claude's.
      const oldLessons = old ? lessonsOf(lib, old.id) : [];
      const inProgress = oldLessons.some(isWorkedOut);
      const grid = !old ? pm.module.competences : inProgress ? (old.competences.length ? old.competences : pm.module.competences) : pm.module.competences.length ? pm.module.competences : old.competences;
      return {
        number: m.number,
        title: m.title,
        weeks: m.weeks,
        lessons: new Set([...oldLessons.map((l) => l.number), ...pm.lessons.map((l) => l.number)]).size,
        competences: grid.length,
        action: old ? 'ergänzt' : 'neu',
        when: pl ? `KW ${weeks[pl.first].kw}–${weeks[pl.last].kw}` : '',
        short: !!pl?.short,
        lessonTitles: pm.lessons.map((l) => `${l.number}. ${l.title}`),
      };
    })
    .sort((a, b) => a.number - b.number);
  return { rows, used: all.reduce((n, m) => n + m.weeks, 0), total: schoolWeekCount(weeks) };
}
