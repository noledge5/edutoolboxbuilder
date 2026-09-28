import { describe, expect, it } from 'vitest';
import { normalizeDoc } from '../model/normalize';
import { readDay, readLesson, readModule, readSchoolYear, readSettings } from './read';

describe('reading older data', () => {
  it('gives modules, lessons and settings of earlier versions the new fields', () => {
    const m = readModule({
      id: 'm1',
      subject: 'Geographie',
      grade: 9,
      number: 1,
      title: 'Klima',
      icon: 'sun',
      description: '',
      competences: [{ id: 'k', area: 'A', g: '', m: '', e: '', lessons: '1' }],
      updatedAt: 5,
    });
    expect(m).toMatchObject({ lang: 'de', help: true, textbook: '', weeks: 0, start: '', updatedAt: 5 });
    expect(m!.competences[0].domain).toBe('');
    const l = readLesson({ id: 'l1', moduleId: 'm1', number: 2, title: 'x', doc: { pages: [{ title: 'S' }] } });
    expect(l).toMatchObject({ textbook: '', number: 2, slideDesign: 'organisch' });
    expect(readLesson({ id: 'l2', moduleId: 'm1', doc: { pages: [{ title: 'S' }] }, slideDesign: 'tafel' })!.slideDesign).toBe('tafel');
    expect(readLesson({ id: 'l3', moduleId: 'm1', doc: { pages: [{ title: 'S' }] }, slideDesign: 'neon' })!.slideDesign).toBe('organisch');
    expect(l!.doc).toMatchObject({ lang: 'de', help: true });
    expect(readSettings({ subjects: ['Englisch'], footerBase: 'x' })).toMatchObject({ schoolYear: null });
  });

  it('reads dates as ISO or as German dates', () => {
    expect(readDay('2026-09-14')).toBe('2026-09-14');
    expect(readDay('14.9.2026')).toBe('2026-09-14');
    expect(readDay('morgen')).toBe('');
  });

  it('checks the school year and sorts the holidays', () => {
    expect(readSchoolYear({ name: '2026/27', start: '2026-09-14', end: '2026-01-01' })).toBeNull();
    expect(
      readSchoolYear({
        name: '2026/27',
        start: '14.09.2026',
        end: '28.07.2027',
        holidays: [{ name: 'Ostern', from: '2027-03-26', to: '2027-04-03' }, { name: 'Herbst', from: '26.10.2026' }, { name: 'kaputt' }],
      }),
    ).toEqual({
      name: '2026/27',
      start: '2026-09-14',
      end: '2027-07-28',
      holidays: [
        { name: 'Herbst', from: '2026-10-26', to: '2026-10-26' },
        { name: 'Ostern', from: '2027-03-26', to: '2027-04-03' },
      ],
    });
  });

  it('keeps language and help of a worksheet', () => {
    expect(normalizeDoc({ pages: [{}], lang: 'en', help: false })).toMatchObject({ lang: 'en', help: false });
    expect(normalizeDoc({ pages: [{}], lang: 'fr' })).toMatchObject({ lang: 'de', help: true });
  });
});
