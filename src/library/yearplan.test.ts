import { describe, expect, it } from 'vitest';
import { seedLibrary } from './model';
import type { Module } from './types';
import { addDays, BW_2026_27, dayText, isoWeek, mondayOf, planModules, schoolWeekCount, schoolWeeks } from './yearplan';

const mod = (number: number, weeks: number, start = ''): Module => ({ ...seedLibrary().modules[0], id: 'm' + number, number, weeks, start });

describe('year plan', () => {
  it('finds Mondays, calendar weeks and German dates', () => {
    expect(mondayOf('2026-09-17')).toBe('2026-09-14');
    expect(mondayOf('2026-09-14')).toBe('2026-09-14');
    expect(mondayOf('2027-01-03')).toBe('2026-12-28');
    expect(isoWeek('2026-09-14')).toBe(38);
    expect(isoWeek('2027-01-04')).toBe(1);
    expect(isoWeek('2026-12-28')).toBe(53);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(dayText('2026-09-14')).toBe('14.09.');
    expect(dayText('2026-09-14', true)).toBe('14.09.2026');
  });

  it('marks holiday weeks of the school year 2026/27 in Baden-Württemberg', () => {
    const weeks = schoolWeeks(BW_2026_27);
    expect(weeks).toHaveLength(46);
    expect(weeks.filter((w) => w.holiday).map((w) => `${w.monday} ${w.holiday}`)).toEqual([
      '2026-10-26 Herbstferien',
      '2026-12-21 Weihnachtsferien',
      '2026-12-28 Weihnachtsferien',
      '2027-01-04 Weihnachtsferien',
      '2027-03-29 Osterferien',
      '2027-05-17 Pfingstferien',
      '2027-05-24 Pfingstferien',
    ]);
    expect(schoolWeekCount(weeks)).toBe(39);
    const week = (monday: string) => weeks.find((w) => w.monday === monday)!;
    expect(week('2027-03-22').days).toBe(4); // Karfreitag
    expect(week('2027-05-03').days).toBe(4); // Christi Himmelfahrt
    expect(week('2027-07-26').days).toBe(3); // last school day is a Wednesday
  });

  it('lays out modules one after another, skipping holidays', () => {
    const weeks = schoolWeeks(BW_2026_27);
    const plan = planModules([mod(2, 3), mod(1, 7), mod(3, 0), mod(4, 2, '2027-01-13')], weeks);
    const at = (i: number) => weeks[i].monday;
    expect(plan.map((p) => [p.module.number, at(p.first), at(p.last), p.short])).toEqual([
      // Seven school weeks from 14.09.: the autumn holidays (26.10.) are skipped.
      [1, '2026-09-14', '2026-11-02', false],
      [2, '2026-11-09', '2026-11-23', false],
      // Module 3 has no weeks planned. Module 4 starts on its own date, from the Wednesday's Monday.
      [4, '2027-01-11', '2027-01-18', false],
    ]);
  });

  it('says when a module does not fit before the summer', () => {
    const weeks = schoolWeeks(BW_2026_27);
    const plan = planModules([mod(1, 38), mod(2, 3)], weeks);
    expect(plan[0].short).toBe(false);
    expect(plan[1].short).toBe(true);
  });
});
