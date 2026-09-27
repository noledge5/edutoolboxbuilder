// A year plan typed or pasted as text (from Word, Excel, Pages or notes): one line per module,
// the planned lessons below it as a list. Cells may be separated by "|", tabs or ";".
//
//   Modul 1: Hello, school! | 5 Wochen | Sich vorstellen, Schule
//   - Stunde 1: Hello, I'm … | Begrüßen und vorstellen
//   - My classroom – Schulsachen benennen
//   Modul 2: My family and me | 6 Wochen | ab 02.11.2026
import { guessTopicIcon } from '../topicIcons';
import { defaultLang, plannedDoc } from './model';
import type { ParsedLesson, ParsedModule, ParsedPackage } from './package';
import { readDay } from './read';

const BULLET = /^[-–•*·▪◦+]\s*/;
const LESSON = /^(?:stunde|std\.?|lesson|einzelstunde|doppelstunde|ds)\b\.?\s*(\d+)?\s*[:.)–-]?\s*/i;
const SUB_NUMBER = /^\d+\.(\d+)\.?\s+/;
const MODULE = /^(?:modul|unit|einheit|kapitel|thema|reihe|ue|unterrichtseinheit|theme)\b\s*(\d+)?\s*[:.)–-]?\s*/i;
const NUMBERED = /^(\d+)\s*[:.)–-]\s*/;
const WEEKS = /^(\d+)\s*(?:wochen|woche|wo\.?|w)$/i;
const HEADER_WORDS = /^(nr\.?|nummer|thema|titel|wochen|dauer|modul|unit|schwerpunkte?|inhalte?|stunde|beginn|lehrwerk|bemerkungen?)$/i;
const TEXTBOOK = /^(?:lehrwerk:\s*|sb\b|wb\b|ah\b|buch\b|s\.\s*\d)/i;
const TITLE_LINE = /^(jahresplan|stoffverteilung|schuljahr|fach:|klasse\s*\d+\s*$)/i;

/** Cells of a line: split at "|", tabs or ";"; Markdown marks and table borders removed. */
function cells(line: string): string[] {
  const plain = line
    .replace(/^#+\s*/, '')
    .replace(/\*\*|__/g, '')
    .trim();
  const parts = /[|\t;]/.test(plain) ? plain.split(/\s*[|\t;]\s*/) : [plain];
  // "| a | b |" has empty cells at both ends.
  while (parts.length && !parts[0].trim()) parts.shift();
  while (parts.length && !parts[parts.length - 1].trim()) parts.pop();
  return parts.map((c) => c.trim());
}

/** Reads a year plan written as text into a package for one subject and grade. */
export function readPlanText(text: string, subject: string, grade: number): ParsedPackage {
  const lang = defaultLang(subject);
  const modules: ParsedModule[] = [];
  const notes: string[] = [];
  let current: ParsedModule | null = null;

  const addModule = (number: number, title: string, rest: string[]) => {
    const described: string[] = [];
    let weeks = 0;
    let start = '';
    let textbook = '';
    for (const c of rest) {
      const w = WEEKS.exec(c) ?? (/^\d+$/.test(c) && !weeks ? [c, c] : null);
      const day = readDay(c.replace(/^(ab|beginn:?|start:?)\s*/i, ''));
      if (w && !weeks) weeks = Number(w[1]);
      else if (day && !start) start = day;
      else if (TEXTBOOK.test(c) && !textbook) textbook = c.replace(/^lehrwerk:\s*/i, '');
      else if (c) described.push(c);
    }
    const taken = modules.map((m) => m.module.number);
    const n = number && !taken.includes(number) ? number : taken.length ? Math.max(...taken) + 1 : 1;
    current = {
      module: { subject, grade, number: n, title: title || `Modul ${n}`, icon: guessTopicIcon(title), description: described.join(' · '), competences: [], lang, help: true, textbook, weeks, start },
      lessons: [],
    };
    modules.push(current);
  };

  const addLesson = (m: ParsedModule, number: number, title: string, rest: string[]) => {
    const plan: string[] = [];
    let textbook = '';
    for (const c of rest) {
      if (TEXTBOOK.test(c) && !textbook) textbook = c.replace(/^lehrwerk:\s*/i, '');
      else if (c) plan.push(c);
    }
    // "Hello – sich vorstellen": title and planning note in one cell.
    if (!rest.length) {
      const dash = /\s[–-]\s/.exec(title);
      if (dash) {
        plan.push(title.slice(dash.index + dash[0].length).trim());
        title = title.slice(0, dash.index).trim();
      }
    }
    const taken = m.lessons.map((l) => l.number);
    const n = number && !taken.includes(number) ? number : taken.length ? Math.max(...taken) + 1 : 1;
    const t = title || `Stunde ${n}`;
    const lesson: ParsedLesson = { number: n, title: t, textbook, plan: plan.join('; '), doc: plannedDoc(m.module, t) };
    m.lessons.push(lesson);
  };

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || /^[|:\-\s]+$/.test(line)) return; // empty, or the line under a Markdown table head
    const cs = cells(line);
    if (!cs.length) return;
    if (cs.filter((c) => HEADER_WORDS.test(c)).length >= 2) return; // table head
    let [first, ...rest] = cs;
    if (TITLE_LINE.test(first) && !current) return;

    const bullet = BULLET.test(first);
    if (bullet) first = first.replace(BULLET, '');
    const lesson = LESSON.exec(first);
    const sub = SUB_NUMBER.exec(first);
    if (bullet || lesson || sub) {
      if (!current) {
        notes.push(`Zeile ${i + 1} („${line.slice(0, 40)}“) steht vor dem ersten Modul und wurde übersprungen.`);
        return;
      }
      const number = lesson?.[1] ? Number(lesson[1]) : sub ? Number(sub[1]) : 0;
      const title = first.replace(LESSON, '').replace(SUB_NUMBER, '').trim();
      addLesson(current, number, title, rest);
      return;
    }

    // A module line: "Modul 3: Title", "3. Title", or a number in the first cell and the title in the second.
    const mod = MODULE.exec(first);
    const numbered = NUMBERED.exec(first);
    if (/^\d+$/.test(first) && rest.length) {
      const [title, ...more] = rest;
      addModule(Number(first), title.replace(MODULE, '').trim(), more);
    } else if (mod) {
      addModule(mod[1] ? Number(mod[1]) : 0, first.slice(mod[0].length).trim(), rest);
    } else if (numbered) {
      addModule(Number(numbered[1]), first.slice(numbered[0].length).trim(), rest);
    } else addModule(0, first, rest);
  });

  return { modules, schoolYear: null, images: {}, notes };
}
