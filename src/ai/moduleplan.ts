// A module (unit) with Claude, planned from its end: what the class can do at the end and how it shows it, the
// competence grid, and the way there as planned lessons with their role and competences. Worked-out lessons stay;
// the planned ones are replaced by the new plan.
import { footerFor, isWorkedOut, lessonCode, lessonsOf, modulesOf, plannedDoc } from '../library/model';
import { PACKAGE_FORMAT, PACKAGE_VERSION, readPackage } from '../library/package';
import { roleLabel } from '../library/planning';
import type { Competence, Lesson, LessonRole, Library, Module } from '../library/types';
import { dayText, planModules, schoolWeeks } from '../library/yearplan';
import { uid } from '../model/ops';
import { DocFormatError } from '../model/normalize';
import { classNotes } from './classNotes';
import { isObj, flat, clip } from '../model/text';

/** How a unit ends: the proof that the class can do what it learnt. '' = Claude decides. */
export type ModuleEnd = '' | 'klassenarbeit' | 'test' | 'lernaufgabe' | 'keins';

export const MODULE_ENDS: { v: ModuleEnd; l: string }[] = [
  { v: '', l: 'Claude entscheidet' },
  { v: 'klassenarbeit', l: 'Klassenarbeit' },
  { v: 'test', l: 'Kurzer Test' },
  { v: 'lernaufgabe', l: 'Lernaufgabe (Produkt, Präsentation, Projekt)' },
  { v: 'keins', l: 'Ohne Leistungsnachweis' },
];

export interface ModuleWishes {
  hours: number;
  end: ModuleEnd;
  wishes: string;
}


/** Lessons per week as the module has them so far (lessons ÷ weeks), else the usual for the subject. */
export function hoursOf(m: Module, lessons: Lesson[]): number {
  if (m.weeks > 0 && lessons.length >= m.weeks) return Math.min(8, Math.max(1, Math.round(lessons.length / m.weeks)));
  return /englisch|english/i.test(m.subject) ? 4 : 2;
}

/** The module, its place in the year and what is in it already, as Markdown for Claude. */
export function moduleContext(lib: Library, m: Module, w: ModuleWishes): string {
  const lessons = lessonsOf(lib, m.id);
  const out: string[] = ['## Das Modul'];
  out.push(`- Fach: ${m.subject} · Klasse ${m.grade} · Sprache der Arbeitsblätter: ${m.lang === 'en' ? 'Englisch (`"lang": "en"`)' : 'Deutsch'}`);
  out.push(`- Modul ${m.number}: „${m.title}“${m.description ? ` – ${flat(m.description)}` : ''}`);
  if (m.textbook) out.push(`- Lehrwerk: ${m.textbook}`);
  const total = m.weeks > 0 ? m.weeks * w.hours : 0;
  out.push(
    m.weeks > 0
      ? `- Dauer: ${m.weeks} Schulwochen mit ${w.hours} Stunden pro Woche, also etwa ${total} Stunden (einschließlich Leistungsnachweis und Rückgabe).`
      : `- Dauer: noch nicht festgelegt; ${w.hours} Stunden pro Woche. Schlag eine passende Zahl von Stunden vor (meist 8 bis 16).`,
  );
  const year = lib.settings.schoolYear;
  if (year && m.weeks > 0) {
    const weeks = schoolWeeks(year);
    const pl = planModules(modulesOf(lib, m.subject, m.grade), weeks).find((x) => x.module.id === m.id);
    if (pl) {
      const holidays = [...new Set(weeks.slice(pl.first, pl.last + 1).flatMap((x) => (x.holiday ? [x.holiday] : [])))];
      out.push(`- Zeitraum: KW ${weeks[pl.first].kw} (ab ${dayText(weeks[pl.first].monday, true)}) bis KW ${weeks[pl.last].kw}${holidays.length ? `, dazwischen ${holidays.join(', ')}` : ''}`);
    }
  }
  const end = MODULE_ENDS.find((e) => e.v === w.end);
  if (w.end) out.push(`- Abschluss des Moduls: ${end?.l}`);
  if (w.wishes.trim()) out.push(`- Wünsche der Lehrkraft: ${flat(w.wishes)}`);

  const notes = classNotes(lib.settings, m.subject, m.grade);
  if (notes) out.push('', notes);

  out.push('', '## Kompetenzraster des Moduls');
  if (m.competences.length) {
    out.push('Behalte die `id` dieser Kompetenzen; neue Kompetenzen bekommen eine neue `id`.');
    for (const c of m.competences) out.push(`- \`${c.id}\` · ${c.area}${c.domain ? ` (${c.domain})` : ''} · G: ${flat(c.g)} · M: ${flat(c.m)} · E: ${flat(c.e)}`);
  } else out.push('- (noch keins)');

  out.push('', '## Die Stunden, die es schon gibt');
  if (!lessons.length) out.push('- Noch keine.');
  for (const l of lessons) {
    const role = l.role ? `, ${roleLabel(l.role)}` : '';
    out.push(
      isWorkedOut(l)
        ? `- Stunde ${l.number} „${l.title}“ (ausgearbeitet${role}; bleibt mit Nummer und Titel)`
        : `- Stunde ${l.number} „${l.title}“ (geplant${role})${l.plan ? `: ${clip(flat(l.plan))}` : ''}`,
    );
  }

  const others = modulesOf(lib, m.subject, m.grade).filter((x) => x.id !== m.id);
  const before = others.filter((x) => x.number < m.number);
  const after = others.filter((x) => x.number > m.number);
  if (before.length || after.length) {
    out.push('', '## Die anderen Module des Jahrgangs');
    for (const x of before) out.push(`- Davor, Modul ${x.number}: „${x.title}“${x.description ? ` – ${clip(flat(x.description), 120)}` : ''}${x.competences.length ? ` · Kompetenzen: ${x.competences.map((c) => c.area).filter(Boolean).join(', ')}` : ''}`);
    for (const x of after) out.push(`- Danach, Modul ${x.number}: „${x.title}“${x.description ? ` – ${clip(flat(x.description), 120)}` : ''}`);
  }
  return out.join('\n');
}

/** The request for the module plan. `chat`: for pasting into a Claude project. */
export function modulePlanPrompt(m: Module, context: string, chat = false): string {
  const task =
    `Plane das Modul ${m.number} „${m.title}“ (${m.subject}, Klasse ${m.grade}) rückwärts, wie unter „Ein Modul planen“ beschrieben: zuerst, was die Klasse am Ende kann und woran man es sieht (Abschluss), ` +
    'dann das Kompetenzraster (G/M/E), dann den Lernweg als geplante Stunden mit `number`, `title`, `role`, `competences` (IDs aus dem Raster) und `plan` (ein, zwei Sätze: was passiert, mit Einstiegsidee). ' +
    'Ausgearbeitete Stunden bleiben mit Nummer und Titel; plane die übrigen drumherum. Geplante Stunden darfst du ersetzen, umstellen oder weglassen.';
  const out: string[] = [];
  if (chat) out.push(`Bitte nach der Anleitung „Arbeitsblatt-Baukasten“ im Projektwissen: ${task}`);
  else out.push('Du arbeitest diesmal direkt im Baukasten, nicht im Chat: Es gibt keine Rückfragen und keine Dateien. Entscheide selbst, was fehlt, im Sinne der Anleitung.', '', `**Auftrag:** ${task}`);
  out.push(
    '',
    `**Form der Antwort:** genau ein JSON-Codeblock mit einem Stundenpaket („${PACKAGE_FORMAT}“, Version ${PACKAGE_VERSION}) mit genau diesem einen Modul (subject „${m.subject}“, grade ${m.grade}, number ${m.number}): ` +
      '`description` (Abschluss und Schwerpunkte in ein, zwei Sätzen), `competences` und `lessons` mit allen Stunden des Moduls in ihrer Reihenfolge (ausgearbeitete nur mit `number` und `title`), ohne `pages`, ohne Folien. ' +
      (chat ? 'Gib das Paket als Codeblock im Chat aus, keine Datei.' : 'Kein Text vor oder nach dem Codeblock.'),
    '',
    context,
  );
  return out.join('\n');
}

export interface PlannedLesson {
  number: number;
  title: string;
  plan: string;
  role: LessonRole | '';
  /** Competence ids of the module after the plan is applied. */
  competences: string[];
  /** What happens to the lesson: a new planned lesson, a planned one replaced, or a worked-out one that stays. */
  status: 'neu' | 'geändert' | 'bleibt';
}

export interface ModulePlan {
  description: string;
  competences: Competence[];
  /** Ids of competences the module did not have. */
  added: string[];
  lessons: PlannedLesson[];
  /** Planned lessons of the module that the new plan leaves out (they go to the trash). */
  dropped: Lesson[];
  notes: string[];
}


/**
 * Reads Claude's module plan for `m` (with its lessons `existing`). Competences Claude kept keep their ids; in a
 * module that has begun (worked-out lessons) they also keep their text, and none is dropped. Throws a German
 * DocFormatError.
 */
export function modulePlanFromAnswer(raw: unknown, m: Module, existing: Lesson[]): ModulePlan {
  if (!isObj(raw)) throw new DocFormatError('Die Antwort ist kein Stundenpaket.');
  const mod = Array.isArray(raw.modules) ? raw.modules.find(isObj) : isObj(raw.module) ? { ...raw.module, lessons: raw.lessons } : Array.isArray(raw.lessons) ? raw : null;
  if (!isObj(mod)) throw new DocFormatError('In der Antwort fehlt das Modul ("modules").');
  if (!Array.isArray(mod.lessons) || !mod.lessons.length) throw new DocFormatError('In der Antwort fehlen die Stunden ("lessons").');
  const lessons = mod.lessons.filter(isObj).map(({ pages: _p, slides: _s, slideDesign: _d, ...l }) => l);
  const parsed = readPackage({
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    modules: [{ ...mod, subject: m.subject, grade: m.grade, number: m.number, title: m.title, icon: m.icon, lang: m.lang, help: m.help, lessons }],
  });
  const pm = parsed.modules[0];

  // Competences: the module's own ones (found by the id Claude echoed) keep their id.
  const begun = existing.some(isWorkedOut);
  const ids = new Map<string, string>();
  const competences: Competence[] = [];
  const added: string[] = [];
  for (const c of pm.module.competences) {
    const own = m.competences.find((k) => k.id === pm.fileIds?.[c.id]);
    if (own) {
      ids.set(c.id, own.id);
      competences.push({ ...c, id: own.id, domain: c.domain || own.domain });
    } else {
      ids.set(c.id, c.id);
      competences.push(c);
      added.push(c.id);
    }
  }
  // A module that has begun keeps its grid as it is (order and words); new competences come after it.
  const grid = begun ? [...m.competences, ...competences.filter((c) => added.includes(c.id))] : competences;

  const byNumber = new Map(existing.map((l) => [l.number, l]));
  const planned: PlannedLesson[] = pm.lessons.map((l) => {
    const old = byNumber.get(l.number);
    const comps = [...new Set(l.competences.map((id) => ids.get(id)).filter((id): id is string => !!id))];
    if (old && isWorkedOut(old)) return { number: l.number, title: old.title, plan: old.plan || l.plan, role: old.role || l.role, competences: old.competences.length ? old.competences : comps, status: 'bleibt' };
    return { number: l.number, title: l.title, plan: l.plan, role: l.role, competences: comps, status: old ? 'geändert' : 'neu' };
  });
  // Worked-out lessons Claude left out stay as they are.
  for (const l of existing) if (isWorkedOut(l) && !planned.some((x) => x.number === l.number)) planned.push({ number: l.number, title: l.title, plan: l.plan, role: l.role, competences: l.competences, status: 'bleibt' });
  planned.sort((a, b) => a.number - b.number);
  const dropped = existing.filter((l) => !isWorkedOut(l) && !planned.some((x) => x.number === l.number));
  return { description: pm.module.description, competences: grid, added, lessons: planned, dropped, notes: parsed.notes };
}

/** The module and its lessons with the plan applied; `remove` are the planned lessons that go to the trash. */
export function applyModulePlan(lib: Library, m: Module, plan: ModulePlan): { module: Module; lessons: Lesson[]; remove: Lesson[] } {
  const now = Date.now();
  const module: Module = { ...m, description: plan.description || m.description, competences: plan.competences, updatedAt: now };
  const existing = lessonsOf(lib, m.id);
  const footer = footerFor(lib.settings, m.subject);
  const lessons: Lesson[] = [];
  for (const p of plan.lessons) {
    const old = existing.find((l) => l.number === p.number);
    if (old && isWorkedOut(old)) {
      if ((!old.role && p.role) || (!old.competences.length && p.competences.length) || (!old.plan && p.plan))
        lessons.push({ ...old, role: old.role || p.role, competences: old.competences.length ? old.competences : p.competences, plan: old.plan || p.plan, updatedAt: now });
      continue;
    }
    const doc = { ...plannedDoc(module, p.title), footer, code: lessonCode(module, p.number) };
    if (old) lessons.push({ ...old, title: p.title || old.title, plan: p.plan, role: p.role, competences: p.competences, doc: { ...old.doc, pages: doc.pages }, updatedAt: now });
    else
      lessons.push({
        id: uid(),
        moduleId: m.id,
        number: p.number,
        title: p.title,
        textbook: '',
        plan: p.plan,
        role: p.role,
        competences: p.competences,
        doc,
        slides: [],
        slideDesign: 'organisch',
        boards: [],
        updatedAt: now,
      });
  }
  return { module, lessons, remove: plan.dropped };
}
