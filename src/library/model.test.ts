import { describe, expect, it } from 'vitest';
import { BLOCK_TYPES } from '../model/blockTypes';
import { seedDoc } from '../model/seed';
import { changedSince, competenceLessons, competenceLinks, docForLesson, duplicateLesson, lessonCode, libraryFromOldDoc, lessonsOf, linkLabel, modulesOf, newLesson, newModule, seedLibrary, subjectsOf, syncLibrary } from './model';
import type { Library } from './types';

describe('library model', () => {
  it('moves the old single worksheet into a module placed by its code and footer', () => {
    const lib = libraryFromOldDoc(seedDoc());
    expect(lib.settings).toMatchObject({ subjects: ['Geographie'], footerBase: 'Kuhl · Grafen-von-Zimmern-Realschule' });
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
    const withTwo: Library = { ...lib, modules: [m2, ...lib.modules], settings: { ...lib.settings, subjects: ['Geographie', 'Biologie'] } };
    expect(modulesOf(withTwo, 'Geographie', 9).map((m) => m.number)).toEqual([1, 2]);
    expect(subjectsOf(withTwo)).toEqual(['Geographie', 'Biologie']);
    const dup = duplicateLesson(lib, lib.modules[0], lib.lessons[0]);
    expect(lessonsOf({ ...lib, lessons: [dup, ...lib.lessons] }, lib.modules[0].id).map((l) => l.number)).toEqual([2, 3]);
    expect(dup.title).toBe('Der Treibhauseffekt (Kopie)');
  });

  it('syncs two devices: the newer version wins in both directions', () => {
    const base = seedLibrary();
    const m = { ...base.modules[0], title: 'Klima', updatedAt: 10 };
    const l = { ...base.lessons[0], title: 'Alt', updatedAt: 10 };
    const here: Library = { ...base, modules: [{ ...m, title: 'Klima (Mac)', updatedAt: 30 }], lessons: [{ ...l, title: 'Mac', updatedAt: 5 }] };
    const file: Library = { ...base, modules: [{ ...m, title: 'Klima (iPad)', updatedAt: 20 }], lessons: [{ ...l, title: 'iPad', updatedAt: 40 }] };
    const r = syncLibrary(here, file);
    expect(r.library.modules[0].title).toBe('Klima (Mac)');
    expect(r.library.lessons[0].title).toBe('iPad');
    expect(r).toMatchObject({ fromFile: 1, keptHere: 1, removed: 0 });
  });

  it('carries deletions over, unless the other device changed the entry later', () => {
    const base = seedLibrary();
    const m = { ...base.modules[0], updatedAt: 10 };
    const l1 = { ...base.lessons[0], id: 's1', updatedAt: 10 };
    const l2 = { ...base.lessons[0], id: 's2', updatedAt: 50 };
    const here: Library = { ...base, modules: [m], lessons: [l1, l2], deleted: {} };
    const file: Library = { ...base, modules: [m], lessons: [], deleted: { s1: 20, s2: 30 } };
    const r = syncLibrary(here, file);
    expect(r.library.lessons.map((x) => x.id)).toEqual(['s2']);
    expect(r.removed).toBe(1);
    // s1 was changed here but deleted there later: removed, not "newer here". s2 is newer here.
    expect(r.keptHere).toBe(1);
    expect(r.library.deleted).toEqual({ s1: 20, s2: 30 });
  });

  it('drops lessons of a module deleted on the other device, and the untouched sample', () => {
    const sample = seedLibrary();
    const own = { ...newModule(sample, 'Biologie', 7), updatedAt: 5 };
    const ownLesson = { ...newLesson(sample, own), updatedAt: 5 };
    const file: Library = { ...sample, modules: [own], lessons: [ownLesson], deleted: {} };
    const r = syncLibrary(sample, file);
    expect(r.library.modules.map((x) => x.id)).toEqual([own.id]);
    expect(r.library.lessons.map((x) => x.id)).toEqual([ownLesson.id]);
    const gone = syncLibrary({ ...file }, { ...file, modules: [], lessons: [], deleted: { [own.id]: 9 } });
    expect(gone.library.modules).toHaveLength(0);
    expect(gone.library.lessons).toHaveLength(0);
  });

  it('counts changes since the last backup', () => {
    const lib = seedLibrary();
    expect(changedSince(lib, 0)).toBe(0);
    const later = { ...lib, lessons: [{ ...lib.lessons[0], updatedAt: 100 }], deleted: { x: 200 } };
    expect(changedSince(later, 50)).toBe(2);
    expect(changedSince(later, 150)).toBe(1);
  });

  it('finds the tasks linked to each competence', () => {
    const lib = seedLibrary();
    const m = lib.modules[0];
    const [k1, k2] = m.competences;
    const lesson = { ...lib.lessons[0], number: 2, doc: structuredClone(lib.lessons[0].doc) };
    const tasksOf = (p: number) => lesson.doc.pages[p].blocks.filter((b) => BLOCK_TYPES[b.type].task);
    const [t1, t2] = tasksOf(0);
    t2.props.competence = k1.id;
    t2.props.level = '2';
    t1.props.competence = 'gibt-es-nicht';
    tasksOf(1)[0].props.competence = k1.id;
    const links = competenceLinks([lesson]);
    expect(links.get(k1.id)).toEqual([
      { lesson: 2, page: 1, task: 2, level: '2' },
      { lesson: 2, page: 2, task: 1, level: String(tasksOf(1)[0].props.level ?? '') },
    ]);
    expect(links.has(k2.id)).toBe(false);
    expect(linkLabel(links.get(k1.id)![0])).toBe('Std. 2 · S. 1 · Nr. 2 (M)');
    expect(competenceLessons({ ...k1, lessons: '' }, links.get(k1.id))).toBe('2');
    expect(competenceLessons({ ...k1, lessons: ' 1, 4 ' }, links.get(k1.id))).toBe('1, 4');
    expect(competenceLessons({ ...k2, lessons: '' }, links.get(k2.id))).toBe('');
  });
});
