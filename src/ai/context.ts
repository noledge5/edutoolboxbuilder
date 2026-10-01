// What Claude is told about a lesson's place in the school year: subject, grade and module with its competences, the
// school week (and holidays around it), the lessons before (what they did) and after (what they are to do).
import { BLOCK_TYPES, HOOK_KINDS } from '../model/blockTypes';
import { rows, str } from '../model/text';
import type { Doc } from '../model/types';
import { isWorkedOut, lessonsOf } from '../library/model';
import type { Lesson, Library, Module } from '../library/types';
import { addDays, dayText, planModules, schoolWeeks, type PlanWeek } from '../library/yearplan';

const flat = (s: string) => s.replace(/\s+/g, ' ').trim();
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** The week a lesson falls in, from the year plan: its module's school weeks shared out among its lessons. */
export function lessonWeek(lib: Library, m: Module, l: Lesson): { week: PlanWeek; before: string; after: string } | null {
  const year = lib.settings.schoolYear;
  if (!year || m.weeks <= 0) return null;
  const weeks = schoolWeeks(year);
  const planned = planModules(
    lib.modules.filter((x) => x.subject === m.subject && x.grade === m.grade),
    weeks,
  ).find((p) => p.module.id === m.id);
  if (!planned) return null;
  const own = weeks.map((w, i) => ({ w, i })).filter(({ w, i }) => i >= planned.first && i <= planned.last && !w.holiday && w.days > 0);
  if (!own.length) return null;
  const lessons = lessonsOf(lib, m.id);
  const k = Math.max(0, lessons.findIndex((x) => x.id === l.id));
  const at = own[Math.min(own.length - 1, Math.floor((k * own.length) / Math.max(1, lessons.length)))];
  return { week: at.w, before: weeks[at.i - 1]?.holiday ?? '', after: weeks[at.i + 1]?.holiday ?? '' };
}

/** What a worked-out lesson did, in one line for Claude. */
export function lessonSummary(doc: Doc): string {
  const all = doc.pages.flatMap((p) => p.blocks);
  const goal = flat(str(all.find((b) => b.type === 'goal')?.props.goal));
  const hook = all.find((b) => b.type === 'hook');
  const kind = hook ? HOOK_KINDS.find((k) => k.v === str(hook.props.kind))?.l : '';
  const merksatz = all.filter((b) => b.type === 'merksatz').map((b) => flat(str(b.props.text).replace(/\[\[(.*?)\]\]/g, '$1')));
  const recall = rows(all.find((b) => b.type === 'recall')?.props.items)
    .map(([q = '']) => flat(q))
    .filter(Boolean);
  const tasks = [...new Set(all.filter((b) => BLOCK_TYPES[b.type]?.task).map((b) => BLOCK_TYPES[b.type].label))];
  return [
    goal && `Ziel: ${clip(goal)}`,
    kind && `Einstieg: ${kind}`,
    merksatz.length && `Merksatz: ${clip(merksatz.join(' / '), 220)}`,
    recall.length && `Abruffragen: ${clip(recall.join(' · '), 220)}`,
    tasks.length && `Aufgabenarten: ${tasks.join(', ')}`,
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * The lesson in its year plan, as Markdown for Claude. `wishes` are the teacher's words for this lesson.
 * The competence ids are the module's own: tasks link to them.
 */
export function lessonContext(lib: Library, m: Module, l: Lesson, wishes = ''): string {
  const lessons = lessonsOf(lib, m.id);
  const before = lessons.filter((x) => x.number < l.number);
  const after = lessons.filter((x) => x.number > l.number);
  const when = lessonWeek(lib, m, l);
  const out: string[] = [];
  out.push('## Die Stunde im Jahresplan');
  out.push(`- Fach: ${m.subject} · Klasse ${m.grade} · Sprache der Arbeitsblätter: ${m.lang === 'en' ? 'Englisch (`"lang": "en"`)' : 'Deutsch'}${m.lang === 'en' ? ` · deutsche Hilfe: ${m.help ? 'ja' : 'nein'}` : ''}`);
  out.push(`- Modul ${m.number}: „${m.title}“${m.description ? ` – ${flat(m.description)}` : ''}${m.weeks ? ` (${m.weeks} Schulwochen)` : ''}`);
  if (m.textbook) out.push(`- Lehrwerk: ${m.textbook}`);
  out.push(`- Diese Stunde: Stunde ${l.number} von ${Math.max(lessons.length, ...lessons.map((x) => x.number))}, „${l.title}“${l.textbook ? ` (${l.textbook})` : ''}`);
  if (l.plan.trim()) out.push(`- Planungsnotiz: ${flat(l.plan)}`);
  if (when) {
    const w = when.week;
    out.push(
      `- Voraussichtlich in KW ${w.kw} (${dayText(w.monday)} bis ${dayText(addDays(w.monday, 4), true)})${when.before ? `, direkt nach den ${when.before}` : ''}${when.after ? `, direkt vor den ${when.after}` : ''}`,
    );
  }
  if (wishes.trim()) out.push(`- Wünsche der Lehrkraft: ${flat(wishes)}`);

  out.push('', '## Kompetenzraster des Moduls (verwende genau diese `id` für `competence`)');
  if (m.competences.length)
    for (const c of m.competences) out.push(`- \`${c.id}\` · ${c.area}${c.domain ? ` (${c.domain})` : ''} · G: ${flat(c.g)} · M: ${flat(c.m)} · E: ${flat(c.e)}`);
  else out.push('- (noch keins; lege passende Kompetenzen an)');

  out.push('', '## Die Stunden davor');
  if (!before.length) out.push('- Keine, dies ist die erste Stunde des Moduls.');
  for (const x of before) out.push(isWorkedOut(x) ? `- Stunde ${x.number} „${x.title}“: ${lessonSummary(x.doc) || 'ausgearbeitet'}` : `- Stunde ${x.number} „${x.title}“ (geplant)${x.plan ? `: ${clip(flat(x.plan))}` : ''}`);

  out.push('', '## Die Stunden danach');
  if (!after.length) out.push('- Keine, dies ist die letzte Stunde des Moduls.');
  for (const x of after) out.push(`- Stunde ${x.number} „${x.title}“${x.plan ? `: ${clip(flat(x.plan))}` : ''}${isWorkedOut(x) ? ' (schon ausgearbeitet)' : ''}`);
  return out.join('\n');
}
