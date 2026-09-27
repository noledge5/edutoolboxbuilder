import { describe, expect, it } from 'vitest';
import { favoriteBlocks, seedLibrary } from './model';
import { readSettings } from './read';
import { readSubjectColors, subjectColor, subjectVars } from './subjectColor';
import type { Lesson } from './types';

describe('subject colours', () => {
  const settings = readSettings({});

  it('have fitting defaults and can be chosen', () => {
    expect(subjectColor(settings, 'Englisch')).toBe('accent-3');
    expect(subjectColor(settings, 'Geographie')).toBe('accent-2');
    expect(subjectColor(settings, 'Biologie')).toBe('accent-6');
    // Unknown subjects always get the same colour.
    expect(subjectColor(settings, 'Ukulele')).toBe(subjectColor(settings, 'Ukulele'));
    expect(subjectColor({ ...settings, subjectColors: { Englisch: 'accent-7' } }, 'Englisch')).toBe('accent-7');
    expect(readSubjectColors({ Englisch: 'accent-4', Deutsch: 'lila', Mathe: 3 })).toEqual({ Englisch: 'accent-4' });
  });

  it('become accent variables for the app (orange needs none)', () => {
    expect(subjectVars('accent')).toEqual({});
    expect(subjectVars('accent-3')).toMatchObject({ '--color-accent': 'var(--color-accent-3-600)', '--color-accent-100': 'var(--color-accent-3-100)' });
    expect(subjectVars('accent-2')).toMatchObject({ '--color-accent': 'var(--color-accent-2)' });
  });
});

describe('favourite blocks of a subject', () => {
  it('are those used in at least two lessons', () => {
    const lib = seedLibrary();
    const [lesson] = lib.lessons;
    expect(favoriteBlocks(lib, 'Geographie')).toEqual([]);
    const copy: Lesson = { ...lesson, id: 'kopie', number: 3 };
    const types = favoriteBlocks({ ...lib, lessons: [lesson, copy] }, 'Geographie');
    expect(types.length).toBeGreaterThan(0);
    expect(types.length).toBeLessThanOrEqual(6);
    expect(favoriteBlocks({ ...lib, lessons: [lesson, copy] }, 'Englisch')).toEqual([]);
  });
});
