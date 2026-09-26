// The library in IndexedDB: one entry per module and per lesson, so saving a worksheet writes only that lesson.
import { delMany, get, getMany, keys, set, setMany } from 'idb-keyval';
import { libraryFromOldDoc, seedLibrary } from '../library/model';
import type { Lesson, Library, Module, Settings } from '../library/types';
import { normalizeDoc } from '../model/normalize';
import { deleteOldDoc, deleteUnusedImages, kv, loadDoc } from './db';

const SETTINGS = 'lib:einstellungen';
const DELETED = 'lib:geloescht';
const SYNC = 'lib:abgleich';
const MOD = 'modul:';
const LES = 'stunde:';

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function readLesson(raw: unknown): Lesson | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.moduleId !== 'string') return null;
  try {
    return { ...(raw as unknown as Lesson), updatedAt: Number(raw.updatedAt) || 0, doc: normalizeDoc(raw.doc) };
  } catch {
    return null;
  }
}

const readModule = (raw: unknown): Module | null =>
  isObj(raw) && typeof raw.id === 'string' ? { ...(raw as unknown as Module), competences: Array.isArray(raw.competences) ? (raw.competences as Module['competences']) : [], updatedAt: Number(raw.updatedAt) || 0 } : null;

/** Settings and deletions of older versions or other devices, completed with defaults. */
export function readSettings(raw: unknown): Settings {
  const s = isObj(raw) ? raw : {};
  return {
    subjects: Array.isArray(s.subjects) ? s.subjects.filter((x): x is string => typeof x === 'string') : [],
    footerBase: typeof s.footerBase === 'string' ? s.footerBase : '',
    updatedAt: Number(s.updatedAt) || 0,
  };
}

export function readDeleted(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObj(raw)) for (const [k, v] of Object.entries(raw)) if (typeof v === 'number') out[k] = v;
  return out;
}

export async function loadLibrary(): Promise<Library> {
  // Read only the library's own entries: images stay in the store until a page shows them.
  const wanted = (await keys<string>(kv())).filter((k) => typeof k === 'string' && (k === SETTINGS || k === DELETED || k.startsWith(MOD) || k.startsWith(LES)));
  const values = await getMany<unknown>(wanted, kv());
  const all = wanted.map((k, i) => [k, values[i]] as const);
  const settings = all.find(([k]) => k === SETTINGS)?.[1];
  const modules = all
    .filter(([k]) => k.startsWith(MOD))
    .map(([, v]) => readModule(v))
    .filter((m): m is Module => m !== null);
  const lessons = all
    .filter(([k]) => k.startsWith(LES))
    .map(([, v]) => readLesson(v))
    .filter((l): l is Lesson => l !== null);
  if (settings) return { settings: readSettings(settings), modules, lessons, deleted: readDeleted(all.find(([k]) => k === DELETED)?.[1]) };

  // First start with the library: take over the single worksheet of the first version, or start with the sample.
  const old = await loadDoc().catch(() => null);
  const lib = old ? libraryFromOldDoc(old) : seedLibrary();
  await replaceWhole(lib);
  if (old) await deleteOldDoc();
  return lib;
}

/** Makes the stored library exactly `lib` (first start, after a sync): writes everything, removes what is gone. */
export async function replaceWhole(lib: Library): Promise<void> {
  const keep = new Set([...lib.modules.map((m) => MOD + m.id), ...lib.lessons.map((l) => LES + l.id)]);
  const stale = (await keys<string>(kv())).filter((k) => typeof k === 'string' && (k.startsWith(MOD) || k.startsWith(LES)) && !keep.has(k));
  await setMany(
    [
      [SETTINGS, lib.settings] as [string, unknown],
      [DELETED, lib.deleted],
      ...lib.modules.map((m) => [MOD + m.id, m] as [string, unknown]),
      ...lib.lessons.map((l) => [LES + l.id, l] as [string, unknown]),
    ],
    kv(),
  );
  if (stale.length) await delMany(stale, kv());
}

export const saveSettings = (s: Settings) => set(SETTINGS, s, kv());
export const saveModule = (m: Module) => set(MOD + m.id, m, kv());
export const saveLesson = (l: Lesson) => set(LES + l.id, l, kv());
export const saveDeleted = (d: Record<string, number>) => set(DELETED, d, kv());

export async function deleteEntries(moduleIds: string[], lessonIds: string[]): Promise<void> {
  await delMany([...moduleIds.map((id) => MOD + id), ...lessonIds.map((id) => LES + id)], kv());
}

export const getLesson = async (id: string) => readLesson(await get(LES + id, kv()));

/** Everything changed up to this time is in the last backup file (on this device). */
export async function loadInSyncUntil(): Promise<number> {
  const s = await get<{ inSyncUntil?: number }>(SYNC, kv());
  return Number(s?.inSyncUntil) || 0;
}

export const saveInSyncUntil = (t: number) => set(SYNC, { inSyncUntil: t }, kv());

/** Removes images that no worksheet in the library uses any more. */
export const cleanUpImages = (lib: Library) => deleteUnusedImages(lib.lessons.map((l) => l.doc));
