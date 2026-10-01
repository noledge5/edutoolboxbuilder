// The teacher's evaluation of a handout: who is working or done, points per task, frequent wrong answers, and who
// needs help with which competence. Pure; the results come decrypted.
import { num } from '../model/text';
import type { Block } from '../model/types';
import { handoutTasks, type Handout, type Submission } from './assignment';
import { answerText, expectedText, gradeTask, taskSlots, type TaskGrade } from './grade';

export interface StudentResult {
  /** Submission id: one per student and device. */
  id: string;
  name: string;
  done: boolean;
  at: number;
  /** Per task (in the order of `handoutTasks`): the grade of the current answers. */
  tasks: TaskGrade[];
  /** Practice: the grade at the first check, per task (null if not checked). */
  firstTry: (TaskGrade | null)[];
  right: number;
  total: number;
}

export interface Mistake {
  slotLabel: string;
  expected: string;
  /** Wrong answers with how often they were given, most frequent first. */
  wrong: { answer: string; count: number }[];
}

export interface TaskSummary {
  block: Block;
  label: string;
  /** Students who answered at least one part of it. */
  answered: number;
  /** Share of graded parts answered right, 0 … 1 (null: nothing to grade). */
  share: number | null;
  /** Practice: the share right at the first check (null: nobody checked). */
  firstShare: number | null;
  /** Wrong answers; in practice those of the first check, which show what students really thought. */
  mistakes: Mistake[];
}

export interface CompetenceSummary {
  id: string;
  /** Per student id: share right in the tasks linked to the competence (null: none answered). */
  byStudent: Record<string, number | null>;
  share: number | null;
}

/** The last state of each student (rows come in the order they were handed in). */
export function latestSubmissions(rows: { abgabe: string; data: Submission }[]): Map<string, Submission> {
  const out = new Map<string, Submission>();
  for (const r of rows) {
    const before = out.get(r.abgabe);
    if (!before || r.data.at >= before.at) out.set(r.abgabe, r.data);
  }
  return out;
}

const share = (right: number, total: number) => (total > 0 ? right / total : null);

export function evaluate(handout: Handout, subs: Map<string, Submission>) {
  const tasks = handoutTasks(handout.pages);
  const students: StudentResult[] = [...subs.entries()]
    .map(([id, s]) => {
      const grades = tasks.map((t) => gradeTask(t.block, s.answers[t.block.id] ?? {}));
      const firstTry = tasks.map((t) => (s.first[t.block.id] ? gradeTask(t.block, s.first[t.block.id]) : null));
      return {
        id,
        name: s.name,
        done: s.done,
        at: s.at,
        tasks: grades,
        firstTry,
        right: grades.reduce((k, g) => k + g.right, 0),
        total: grades.reduce((k, g) => k + g.total, 0),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const summaries: TaskSummary[] = tasks.map((t, i) => {
    const slots = taskSlots(t.block);
    const mistakes: Mistake[] = slots
      .filter((sl) => sl.kind !== 'free' && sl.expected)
      .map((sl) => {
        const counts = new Map<string, number>();
        for (const st of students) {
          const g = (st.firstTry[i] ?? st.tasks[i]).slots.find((x) => x.key === sl.key);
          if (g && g.ok === false && g.given) {
            const text = answerText(sl, g.given);
            counts.set(text, (counts.get(text) ?? 0) + 1);
          }
        }
        return { slotLabel: sl.label, expected: expectedText(sl), wrong: [...counts.entries()].map(([answer, count]) => ({ answer, count })).sort((a, b) => b.count - a.count) };
      })
      .filter((m) => m.wrong.length > 0);
    const right = students.reduce((k, s) => k + s.tasks[i].right, 0);
    const total = students.reduce((k, s) => k + (s.tasks[i].slots.some((x) => x.given) ? s.tasks[i].total : 0), 0);
    const firsts = students.map((s) => s.firstTry[i]).filter((g): g is TaskGrade => g !== null);
    return {
      block: t.block,
      label: `Aufgabe ${t.num}${handout.pages.length > 1 ? ` · S. ${t.page + 1}` : ''}`,
      answered: students.filter((s) => s.tasks[i].slots.some((x) => x.given)).length,
      share: share(right, total),
      firstShare: share(
        firsts.reduce((k, g) => k + g.right, 0),
        firsts.reduce((k, g) => k + g.total, 0),
      ),
      mistakes,
    };
  });

  // Competences: tasks linked with one, per student.
  const compIds = [...new Set(tasks.map((t) => String(t.block.props.competence ?? '')).filter(Boolean))];
  const competences: CompetenceSummary[] = compIds.map((id) => {
    const idx = tasks.map((t, i) => (String(t.block.props.competence ?? '') === id ? i : -1)).filter((i) => i >= 0);
    let r = 0;
    let n = 0;
    const byStudent: Record<string, number | null> = {};
    for (const s of students) {
      const answered = idx.filter((i) => s.tasks[i].slots.some((x) => x.given));
      const right = answered.reduce((k, i) => k + s.tasks[i].right, 0);
      const total = answered.reduce((k, i) => k + s.tasks[i].total, 0);
      byStudent[s.id] = share(right, total);
      r += right;
      n += total;
    }
    return { id, byStudent, share: share(r, n) };
  });

  return { tasks, students, summaries, competences };
}

/** Level of a task ('1' G, '2' M, '3' E, '' none). */
export const levelOf = (b: Block) => {
  const l = num(b.props.level, 0);
  return l >= 1 && l <= 3 ? String(l) : '';
};
