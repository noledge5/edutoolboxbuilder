import { describe, expect, it } from 'vitest';
import { seedDoc } from '../model/seed';
import { docForLesson, duplicateLesson, lessonCode, libraryFromOldDoc, lessonsOf, mergeLibrary, modulesOf, newLesson, newModule, seedLibrary, subjectsOf } from './model';

describe('library model', () => {
  it('moves the old single worksheet into a module placed by its code and footer', () => {
    const lib = libraryFromOldDoc(seedDoc());
    expect(lib.settings).toEqual({ subjects: ['Geographie'], footerBase: 'Kuhl · Grafen-von-Zimmern-Realschule' });
    expect(lib.modules[0]).toMatchObject({ subject: 'Geographie', grade: 9, number: 1 });
    expect(lib.lessons[0]).toMatchObject({ number: 2, title: 'Versuchsprotokoll: Wärme einfangen' });
  });

  it('numbers new modules and lessons after the existing ones and derives the code', () => {
    const lib = seedLibrary();
    const m = newModule(lib, 'Geographie', 9);
    expect(m.number).toBe(2);
    expect(newModule(lib, 'Biologie', 7).number).toBe(1);
    const l = newLesson(lib, lib.modules[0]);
    expect(l.number).toBe(3);
    expect(l.doc.code).toBe('K9 · M1 · S3');
    expect(l.doc.footer).toBe('Kuhl · Grafen-von-Zimmern-Realschule · Geographie');
    expect(l.doc.pages[0].kicker).toBe('Klasse 9 · Das Klima kippt');
  });

  it('takes icon and code of a worksheet from its module', () => {
    const lib = seedLibrary();
    const m = { ...lib.modules[0], icon: 'leaf', number: 4 };
    const doc = docForLesson(m, lib.lessons[0]);
    expect(doc.icon).toBe('leaf');
    expect(doc.code).toBe(lessonCode(m, 2));
    expect(doc.code).toBe('K9 · M4 · S2');
  });

  it('lists modules and lessons in order, and subjects including empty ones', () => {
    const lib = seedLibrary();
    const m2 = { ...newModule(lib, 'Geographie', 9), number: 2 };
    const withTwo = { ...lib, modules: [m2, ...lib.modules], settings: { ...lib.settings, subjects: ['Geographie', 'Biologie'] } };
    expect(modulesOf(withTwo, 'Geographie', 9).map((m) => m.number)).toEqual([1, 2]);
    expect(subjectsOf(withTwo)).toEqual(['Geographie', 'Biologie']);
    const dup = duplicateLesson(lib, lib.modules[0], lib.lessons[0]);
    expect(lessonsOf({ ...lib, lessons: [dup, ...lib.lessons] }, lib.modules[0].id).map((l) => l.number)).toEqual([2, 3]);
    expect(dup.title).toBe('Der Treibhauseffekt (Kopie)');
  });

  it('merges a backup by id', () => {
    const a = seedLibrary();
    const b = seedLibrary();
    b.settings.subjects = ['Biologie'];
    const changed = { ...a.modules[0], title: 'Geändert' };
    const merged = mergeLibrary(a, { ...b, modules: [...b.modules, changed] });
    expect(merged.modules).toHaveLength(2);
    expect(merged.modules.find((m) => m.id === a.modules[0].id)?.title).toBe('Geändert');
    expect(merged.lessons).toHaveLength(2);
    expect(merged.settings.subjects).toEqual(['Geographie', 'Biologie']);
  });
});
