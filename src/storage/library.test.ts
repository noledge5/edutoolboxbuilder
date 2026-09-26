import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedDoc } from '../model/seed';

// Every test starts with an empty browser database and fresh modules (the store connection is cached).
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
});

describe('library storage', () => {
  it('starts with the sample library and keeps it', async () => {
    const { loadLibrary } = await import('./library');
    const first = await loadLibrary();
    expect(first.modules.map((m) => m.title)).toEqual(['Das Klima kippt']);
    const again = await loadLibrary();
    expect(again.modules.map((m) => m.id)).toEqual(first.modules.map((m) => m.id));
    expect(again.lessons).toHaveLength(1);
  });

  it('takes over the worksheet of the first version and removes the old entry', async () => {
    const db = await import('./db');
    await db.saveDoc({ ...seedDoc(), code: 'K7 · M3 · S4', footer: 'Muster · Schule · Biologie' });
    const { loadLibrary } = await import('./library');
    const lib = await loadLibrary();
    expect(lib.modules[0]).toMatchObject({ subject: 'Biologie', grade: 7, number: 3 });
    expect(lib.lessons[0].number).toBe(4);
    expect(await db.loadDoc()).toBeNull();
  });

  it('saves lessons and modules one by one', async () => {
    const { loadLibrary, saveLesson, saveModule } = await import('./library');
    const lib = await loadLibrary();
    await saveModule({ ...lib.modules[0], title: 'Klima' });
    await saveLesson({ ...lib.lessons[0], title: 'Treibhaus' });
    const again = await loadLibrary();
    expect(again.modules[0].title).toBe('Klima');
    expect(again.lessons[0].title).toBe('Treibhaus');
  });
});
