// Year plan: the school weeks of the school year (holiday weeks marked) and the modules laid out on them.
// Dates are ISO days ("2026-09-14") and computed in UTC, so time zones and summer time cannot shift a day.
import type { Holiday, Module, SchoolYear } from './types';

const DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The Monday of the week containing the day. */
export function mondayOf(iso: string): string {
  const t = toTime(iso);
  const weekday = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  return toIso(t - weekday * DAY);
}

export const addDays = (iso: string, days: number) => toIso(toTime(iso) + days * DAY);

/** ISO calendar week (KW). */
export function isoWeek(iso: string): number {
  const t = toTime(iso);
  const thursday = t + (3 - ((new Date(t).getUTCDay() + 6) % 7)) * DAY;
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return Math.floor((thursday - yearStart) / DAY / 7) + 1;
}

/** "14.09." or with the year "14.09.2026". */
export function dayText(iso: string, withYear = false): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${withYear ? y : ''}`;
}

export interface PlanWeek {
  monday: string;
  kw: number;
  /** Name of the holidays when most of the week (3 or more school days) is off; such weeks get no lessons. */
  holiday: string | null;
  /** School days Monday to Friday in this week (after holidays and outside the school year). */
  days: number;
}

/** All weeks from the first to the last day of school. */
export function schoolWeeks(year: SchoolYear): PlanWeek[] {
  const out: PlanWeek[] = [];
  const end = toTime(year.end);
  for (let monday = mondayOf(year.start); toTime(monday) <= end; monday = addDays(monday, 7)) {
    let days = 0;
    let off: Holiday | null = null;
    let offDays = 0;
    for (let i = 0; i < 5; i++) {
      const day = addDays(monday, i);
      if (day < year.start || day > year.end) continue;
      const h = year.holidays.find((x) => x.from <= day && day <= x.to);
      if (h) {
        off = h;
        offDays++;
      } else days++;
    }
    out.push({ monday, kw: isoWeek(monday), holiday: off && offDays >= 3 ? off.name || 'Ferien' : null, days });
  }
  return out;
}

export interface PlannedModule {
  module: Module;
  /** Indices into the weeks: first and last week of the module (holiday weeks in between are skipped). */
  first: number;
  last: number;
  /** Not all planned weeks fit before the end of the school year. */
  short: boolean;
}

/**
 * Lays the modules (in order of their number) one after the other on the school weeks. A module with a start date
 * begins in that week (or the next school week); without one it follows the previous module. Modules without planned
 * weeks are left out.
 */
export function planModules(modules: Module[], weeks: PlanWeek[]): PlannedModule[] {
  const isSchool = (i: number) => !weeks[i].holiday && weeks[i].days > 0;
  const nextSchool = (i: number) => {
    while (i < weeks.length && !isSchool(i)) i++;
    return i;
  };
  const out: PlannedModule[] = [];
  let cursor = nextSchool(0);
  for (const m of [...modules].sort((a, b) => a.number - b.number)) {
    if (m.weeks <= 0) continue;
    if (m.start) {
      const i = weeks.findIndex((w) => w.monday === mondayOf(m.start));
      if (i >= 0) cursor = nextSchool(i);
      else if (m.start < (weeks[0]?.monday ?? '')) cursor = nextSchool(0);
    }
    if (cursor >= weeks.length) {
      out.push({ module: m, first: weeks.length - 1, last: weeks.length - 1, short: true });
      continue;
    }
    const first = cursor;
    let left = m.weeks;
    let last = cursor;
    for (let i = cursor; i < weeks.length && left > 0; i++) {
      if (!isSchool(i)) continue;
      last = i;
      left--;
    }
    out.push({ module: m, first, last, short: left > 0 });
    cursor = nextSchool(last + 1);
  }
  return out;
}

/** School weeks in the school year (weeks with lessons). */
export const schoolWeekCount = (weeks: PlanWeek[]) => weeks.filter((w) => !w.holiday && w.days > 0).length;

/** The school year 2026/27 in Baden-Württemberg (Kultusministerium). Movable days off are set by each school and are not included. */
export const BW_2026_27: SchoolYear = {
  name: '2026/27',
  start: '2026-09-14',
  end: '2027-07-28',
  holidays: [
    { name: 'Herbstferien', from: '2026-10-26', to: '2026-10-31' },
    { name: 'Weihnachtsferien', from: '2026-12-23', to: '2027-01-09' },
    { name: 'Osterferien', from: '2027-03-26', to: '2027-04-03' },
    { name: 'Christi Himmelfahrt', from: '2027-05-06', to: '2027-05-06' },
    { name: 'Pfingstferien', from: '2027-05-17', to: '2027-05-29' },
  ],
};

/** Holidays as editable text, one per line: "Herbstferien | 26.10.2026 | 31.10.2026". */
export const holidaysText = (hs: Holiday[]) => hs.map((h) => `${h.name} | ${dayText(h.from, true)} | ${dayText(h.to, true)}`).join('\n');
