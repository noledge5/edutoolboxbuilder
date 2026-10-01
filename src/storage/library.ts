// The library in IndexedDB: one entry per module and per lesson, so saving a worksheet writes only that lesson.
import { del, delMany, get, getMany, keys, set, setMany } from 'idb-keyval';
import { addVersion, libraryFromOldDoc, purgeTrash, seedLibrary } from '../library/model';
import { readDeleted, readHandout, readLesson, readModule, readSettings, readTrash, readVersions } from '../library/read';
import type { Lesson, LessonVersion, Library, Module, Settings, TrashEntry } from '../library/types';
import type { Handout } from '../share/assignment';
import { clipImages, readClips, type Clip } from '../model/clips';
import { slideImages } from '../model/slides';
import { deleteOldDoc, deleteUnusedImages, kv, loadDoc } from './db';

const SETTINGS = 'lib:einstellungen';
const DELETED = 'lib:geloescht';
const SYNC = 'lib:abgleich';
const TRASH = 'lib:papierkorb';
const VERSIONS = 'fassung:';
const CLIPS = 'lib:ablage';
const MOD = 'modul:';
const LES = 'stunde:';
const HANDOUT = 'austeilung:';
const GITHUB = 'geraet:github';
const RESULTS = 'ergebnisse:';

// Readers live in src/library/read.ts; re-exported for older imports.
export { readDeleted, readSettings } from '../library/read';

export async function loadLibrary(): Promise<Library> {
  // Read only the library's own entries: images stay in the store until a page shows them.
  const wanted = (await keys<string>(kv())).filter((k) => typeof k === 'string' && (k === SETTINGS || k === DELETED || k.startsWith(MOD) || k.startsWith(LES) || k.startsWith(HANDOUT)));
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
  const handouts = all
    .filter(([k]) => k.startsWith(HANDOUT))
    .map(([, v]) => readHandout(v))
    .filter((h): h is Handout => h !== null);
  if (settings) return { settings: readSettings(settings), modules, lessons, handouts, deleted: readDeleted(all.find(([k]) => k === DELETED)?.[1]) };

  // First start with the library: take over the single worksheet of the first version, or start with the sample.
  const old = await loadDoc().catch(() => null);
  const lib = old ? libraryFromOldDoc(old) : seedLibrary();
  await replaceWhole(lib);
  if (old) await deleteOldDoc();
  return lib;
}

/** Makes the stored library exactly `lib` (first start, after a sync): writes everything, removes what is gone. */
export async function replaceWhole(lib: Library): Promise<void> {
  const keep = new Set([...lib.modules.map((m) => MOD + m.id), ...lib.lessons.map((l) => LES + l.id), ...lib.handouts.map((h) => HANDOUT + h.id)]);
  const stale = (await keys<string>(kv())).filter((k) => typeof k === 'string' && (k.startsWith(MOD) || k.startsWith(LES) || k.startsWith(HANDOUT)) && !keep.has(k));
  await setMany(
    [
      [SETTINGS, lib.settings] as [string, unknown],
      [DELETED, lib.deleted],
      ...lib.modules.map((m) => [MOD + m.id, m] as [string, unknown]),
      ...lib.lessons.map((l) => [LES + l.id, l] as [string, unknown]),
      ...lib.handouts.map((h) => [HANDOUT + h.id, h] as [string, unknown]),
    ],
    kv(),
  );
  if (stale.length) await delMany(stale, kv());
}

export const saveSettings = (s: Settings) => set(SETTINGS, s, kv());
export const saveModule = (m: Module) => set(MOD + m.id, m, kv());
export const saveLesson = (l: Lesson) => set(LES + l.id, l, kv());
export const saveDeleted = (d: Record<string, number>) => set(DELETED, d, kv());
export const saveHandout = (h: Handout) => set(HANDOUT + h.id, h, kv());

// — Digital handouts: the GitHub token of this device, and the results read so far (both on this device only) —

export interface GithubSettings {
  token: string;
  repo: string;
}

export const loadGithub = async (): Promise<GithubSettings | null> => {
  const g = await get<GithubSettings>(GITHUB, kv());
  return g && typeof g.token === 'string' && g.token ? g : null;
};
export const saveGithub = (g: GithubSettings | null) => (g ? set(GITHUB, g, kv()) : del(GITHUB, kv()));

/** Decrypted results of a handout, kept after the server has deleted them. */
export interface StoredResult {
  id: number;
  abgabe: string;
  data: unknown;
}
export const loadResults = async (handoutId: string): Promise<StoredResult[]> => (await get<StoredResult[]>(RESULTS + handoutId, kv())) ?? [];
export const saveResults = (handoutId: string, rows: StoredResult[]) => set(RESULTS + handoutId, rows, kv());

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

// — Trash and earlier versions: on this device only, not in backups —

/** The trash, without what has been in it too long. */
export async function loadTrash(): Promise<TrashEntry[]> {
  return purgeTrash(readTrash(await get(TRASH, kv())), Date.now());
}

export const saveTrash = (trash: TrashEntry[]) => set(TRASH, trash, kv());

export const loadVersions = async (lessonId: string): Promise<LessonVersion[]> => readVersions(await get(VERSIONS + lessonId, kv()));

export const deleteVersions = (lessonIds: string[]) =>
  delMany(
    lessonIds.map((id) => VERSIONS + id),
    kv(),
  );

/** One write after the other per lesson, so quick changes do not lose a version. */
const versionQueue = new Map<string, Promise<void>>();

/** Keeps the lesson as it is now as an earlier version. */
export function keepVersion(lesson: Lesson, reason = ''): Promise<void> {
  const run = (versionQueue.get(lesson.id) ?? Promise.resolve()).then(async () => {
    const versions = await loadVersions(lesson.id);
    await set(VERSIONS + lesson.id, addVersion(versions, lesson, Date.now(), reason), kv());
  });
  const safe = run.catch(() => {});
  versionQueue.set(lesson.id, safe);
  return run;
}

// — The Ablage: blocks put aside for pasting, on this device only —

export const loadClips = async (): Promise<Clip[]> => readClips(await get(CLIPS, kv()));
export const saveClips = (clips: Clip[]) => set(CLIPS, clips, kv());

/** Removes images that nothing uses any more: not the library, the trash, an earlier version or the Ablage. */
export async function cleanUpImages(lib: Library): Promise<void> {
  const trash = await loadTrash();
  const clips = await loadClips();
  const versionKeys = (await keys<string>(kv())).filter((k) => typeof k === 'string' && k.startsWith(VERSIONS));
  const versions = (await getMany<unknown>(versionKeys, kv())).flatMap(readVersions).map((v) => v.lesson);
  const all = [...lib.lessons, ...trash.flatMap((e) => e.lessons), ...versions];
  await deleteUnusedImages(
    all.map((l) => l.doc),
    [...all.flatMap((l) => slideImages(l.slides)), ...clipImages(clips)],
  );
}
