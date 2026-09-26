// The library in IndexedDB: one entry per module and per lesson, so saving a worksheet writes only that lesson.
import { del, get, getMany, keys, set, setMany } from 'idb-keyval';
import { libraryFromOldDoc, seedLibrary } from '../library/model';
import type { Lesson, Library, Module, Settings } from '../library/types';
import { normalizeDoc } from '../model/normalize';
import { deleteOldDoc, deleteUnusedImages, kv, loadDoc } from './db';

const SETTINGS = 'lib:einstellungen';
const MOD = 'modul:';
const LES = 'stunde:';

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function readLesson(raw: unknown): Lesson | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.moduleId !== 'string') return null;
  try {
    return { ...(raw as unknown as Lesson), doc: normalizeDoc(raw.doc) };
  } catch {
    return null;
  }
}

export async function loadLibrary(): Promise<Library> {
  // Read only the library's own entries: images stay in the store until a page shows them.
  const wanted = (await keys<string>(kv())).filter((k) => typeof k === 'string' && (k === SETTINGS || k.startsWith(MOD) || k.startsWith(LES)));
  const values = await getMany<unknown>(wanted, kv());
  const all = wanted.map((k, i) => [k, values[i]] as const);
  const settings = all.find(([k]) => k === SETTINGS)?.[1] as Settings | undefined;
  const modules = all.filter(([k]) => String(k).startsWith(MOD)).map(([, v]) => v as Module);
  const lessons = all
    .filter(([k]) => String(k).startsWith(LES))
    .map(([, v]) => readLesson(v))
    .filter((l): l is Lesson => l !== null);
  if (settings) return { settings: { subjects: settings.subjects ?? [], footerBase: settings.footerBase ?? '' }, modules, lessons };

  // First start with the library: take over the single worksheet of the first version, or start with the sample.
  const old = await loadDoc().catch(() => null);
  const lib = old ? libraryFromOldDoc(old) : seedLibrary();
  await saveWhole(lib);
  if (old) await deleteOldDoc();
  return lib;
}

/** Writes settings, all modules and all lessons (first start, opening a library backup). */
export function saveWhole(lib: Library): Promise<void> {
  return setMany(
    [[SETTINGS, lib.settings] as [string, unknown]]
      .concat(lib.modules.map((m) => [MOD + m.id, m]))
      .concat(lib.lessons.map((l) => [LES + l.id, l])),
    kv(),
  );
}

export const saveSettings = (s: Settings) => set(SETTINGS, s, kv());
export const saveModule = (m: Module) => set(MOD + m.id, m, kv());
export const saveLesson = (l: Lesson) => set(LES + l.id, l, kv());
export const deleteLesson = (id: string) => del(LES + id, kv());

export async function deleteModule(m: Module, lessons: Lesson[]): Promise<void> {
  await Promise.all(lessons.map((l) => deleteLesson(l.id)));
  await del(MOD + m.id, kv());
}

export const getLesson = async (id: string) => readLesson(await get(LES + id, kv()));

/** Removes images that no worksheet in the library uses any more. */
export const cleanUpImages = (lib: Library) => deleteUnusedImages(lib.lessons.map((l) => l.doc));
