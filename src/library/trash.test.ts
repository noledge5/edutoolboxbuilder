import { describe, expect, it } from 'vitest';
import { addVersion, lessonSize, MAX_VERSIONS, newLesson, purgeTrash, restoreFromTrash, seedLibrary, syncLibrary, toTrash, trashDaysLeft } from './model';
import { readTrash, readVersions } from './read';
import type { Library } from './types';

const DAY = 86_400_000;

describe('trash', () => {
  it('keeps a deleted module with its lessons, and a single lesson on its own', () => {
    const lib = seedLibrary();
    const [m] = lib.modules;
    const [l] = lib.lessons;
    const both = toTrash(lib, [m.id], [l.id], 1000);
    expect(both).toHaveLength(1);
    expect(both[0]).toMatchObject({ at: 1000, module: m, lessons: [l] });
    const single = toTrash(lib, [], [l.id], 1000);
    expect(single[0]).toMatchObject({ module: null, lessons: [l] });
    expect(readTrash(JSON.parse(JSON.stringify(both)))[0].lessons[0].id).toBe(l.id);
  });

  it('brings entries back as changed now, so a sync keeps them', () => {
    const lib = seedLibrary();
    const [m] = lib.modules;
    const [l] = lib.lessons;
    const trash = toTrash(lib, [m.id], [l.id], 1000);
    const gone: Library = { ...lib, modules: [], lessons: [], deleted: { [m.id]: 1000, [l.id]: 1000 } };
    const r = restoreFromTrash(gone, trash, trash[0].id, 5000);
    if ('error' in r) throw new Error(r.error);
    expect(r.modules[0]).toMatchObject({ id: m.id, updatedAt: 5000 });
    expect(r.lessons[0]).toMatchObject({ id: l.id, updatedAt: 5000 });
    expect(r.trash).toEqual([]);
    // The other device still has the deletion from before: the restored module wins.
    const back: Library = { ...gone, modules: r.modules, lessons: r.lessons };
    const synced = syncLibrary(back, { ...gone, deleted: { [m.id]: 1000, [l.id]: 1000 } });
    expect(synced.library.modules.map((x) => x.id)).toEqual([m.id]);
  });

  it('brings a lesson back with its module from the trash, on a free number', () => {
    const lib = seedLibrary();
    const [m] = lib.modules;
    const [l] = lib.lessons;
    const lessonEntry = toTrash(lib, [], [l.id], 1000);
    const moduleEntry = toTrash({ ...lib, lessons: [] }, [m.id], [], 2000);
    const empty: Library = { ...lib, modules: [], lessons: [] };
    const r = restoreFromTrash(empty, [...lessonEntry, ...moduleEntry], lessonEntry[0].id, 3000);
    if ('error' in r) throw new Error(r.error);
    expect(r.modules.map((x) => x.id)).toEqual([m.id]);
    expect(r.trash).toEqual([]);
    // Without the module anywhere, the lesson cannot come back.
    expect(restoreFromTrash(empty, lessonEntry, lessonEntry[0].id, 3000)).toHaveProperty('error');
    // Its number is taken in the meantime: it gets the next free one.
    const taken: Library = { ...lib, lessons: [{ ...newLesson(lib, m), number: l.number }] };
    const again = restoreFromTrash(taken, lessonEntry, lessonEntry[0].id, 3000);
    if ('error' in again) throw new Error(again.error);
    expect(again.lessons[0].number).toBe(l.number + 1);
  });

  it('forgets entries after 30 days', () => {
    const lib = seedLibrary();
    const trash = toTrash(lib, [], [lib.lessons[0].id], 0);
    expect(purgeTrash(trash, 29 * DAY)).toHaveLength(1);
    expect(trashDaysLeft(trash[0], 29 * DAY)).toBe(1);
    expect(purgeTrash(trash, 31 * DAY)).toHaveLength(0);
  });
});

describe('earlier versions', () => {
  it('keep a lesson once per state, newest first, up to a limit', () => {
    const [l] = seedLibrary().lessons;
    let v = addVersion([], l, 1000);
    v = addVersion(v, l, 2000);
    expect(v).toHaveLength(1);
    v = addVersion(v, { ...l, updatedAt: 5 }, 3000, 'Vor dem Abgleich');
    expect(v.map((x) => x.reason)).toEqual(['Vor dem Abgleich', '']);
    for (let k = 0; k < 30; k++) v = addVersion(v, { ...l, updatedAt: 100 + k }, 4000 + k);
    expect(v).toHaveLength(MAX_VERSIONS);
    expect(v[0].at).toBe(4029);
    expect(addVersion(v, { ...l, updatedAt: 999 }, 40 * DAY)).toHaveLength(1);
    expect(readVersions(JSON.parse(JSON.stringify(v))).length).toBe(MAX_VERSIONS);
    expect(lessonSize(l)).toMatch(/^\d+ Seiten · \d+ Bausteine · \d+ Folien$/);
  });
});
