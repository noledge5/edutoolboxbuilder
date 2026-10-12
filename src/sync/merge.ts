// What the automatic sync sends and how it takes in what came from the other device. Every module, lesson and
// handout is one entry ("m:<id>", "l:<id>", "h:<id>"), plus the settings ("s") and the deletions ("d"). `base` remembers
// per entry the `updatedAt` both sides last agreed on: newer here means "send", newer there means "take", both newer
// is a conflict. The newest wins; for a lesson the other side is kept as an earlier version.
import { readHandout, readLesson, readModule, readSettings } from '../library/read';
import type { Lesson, Library, Module, Settings } from '../library/types';
import type { Handout } from '../share/assignment';
import { isObj } from '../model/text';

export type Base = Record<string, number>;

export interface Entry {
  key: string;
  updatedAt: number;
  value: unknown;
}

const maxOf = (d: Record<string, number>) => Object.values(d).reduce((a, b) => Math.max(a, b), 0);

/** All entries of the library that could go to the server (untouched sample data has `updatedAt` 0 and stays). */
export function entriesOf(lib: Library): Entry[] {
  return [
    ...lib.modules.map((m) => ({ key: `m:${m.id}`, updatedAt: m.updatedAt, value: m })),
    ...lib.lessons.map((l) => ({ key: `l:${l.id}`, updatedAt: l.updatedAt, value: l })),
    ...(lib.handouts ?? []).map((h) => ({ key: `h:${h.id}`, updatedAt: h.updatedAt, value: h })),
    { key: 's', updatedAt: lib.settings.updatedAt, value: lib.settings },
    { key: 'd', updatedAt: maxOf(lib.deleted), value: lib.deleted },
  ];
}

/**
 * What changed here since the last agreement with the server. An untouched module (the sample) goes along once when
 * one of its lessons was changed, so the lesson does not arrive without its module.
 */
export function toSend(lib: Library, base: Base): Entry[] {
  const touched = new Set(lib.lessons.filter((l) => l.updatedAt > 0).map((l) => l.moduleId));
  return entriesOf(lib).filter((e) => (e.updatedAt > 0 && e.updatedAt > (base[e.key] ?? 0)) || (e.updatedAt === 0 && e.key.startsWith('m:') && base[e.key] === undefined && touched.has(e.key.slice(2))));
}

export interface MergeResult {
  library: Library;
  base: Base;
  /** Changed here, to store. */
  modules: Module[];
  lessons: Lesson[];
  handouts: Handout[];
  settings: boolean;
  deleted: boolean;
  removedModules: string[];
  removedLessons: string[];
  /** The side of a conflict that lost, to keep as an earlier version of its lesson. */
  keep: { lesson: Lesson; reason: string }[];
  /** Titles of lessons changed on both devices. */
  conflicts: string[];
  /** Entries taken from the other device. */
  taken: number;
}


/** Settings changed on both devices: the newer ones, with the subjects and class profiles of both. */
function mergeSettings(here: Settings, there: Settings, now: number): Settings {
  const subjects = [...there.subjects];
  for (const s of here.subjects) if (!subjects.includes(s)) subjects.push(s);
  const newer = there.updatedAt > here.updatedAt ? there : here;
  const older = newer === there ? here : there;
  return { ...newer, subjects, classProfiles: { ...older.classProfiles, ...newer.classProfiles }, updatedAt: now };
}

/**
 * Takes in the entries from the server (`remote`: key → value, the newest per key). Pure: the caller stores what the
 * result lists. `now` stamps settings merged from both sides, so they go back to the server.
 */
export function mergeRemote(lib: Library, remote: Map<string, unknown>, base: Base, now = Date.now()): MergeResult {
  const nextBase = { ...base };
  const modules = new Map(lib.modules.map((m) => [m.id, m]));
  const lessons = new Map(lib.lessons.map((l) => [l.id, l]));
  const handouts = new Map((lib.handouts ?? []).map((h) => [h.id, h]));
  const changedM = new Map<string, Module>();
  const changedL = new Map<string, Lesson>();
  const changedH = new Map<string, Handout>();
  const keep: MergeResult['keep'] = [];
  const conflicts: string[] = [];
  let settings = lib.settings;
  let settingsChanged = false;
  const deleted = { ...lib.deleted };
  let deletedChanged = false;
  let taken = 0;

  // Deletions first: an entry deleted on either side stays deleted unless it was changed after that.
  const theirDeleted = remote.get('d');
  if (isObj(theirDeleted)) {
    for (const [id, t] of Object.entries(theirDeleted)) {
      const time = Number(t);
      if (Number.isFinite(time) && time > (deleted[id] ?? 0)) {
        deleted[id] = time;
        deletedChanged = true;
      }
    }
    // The server knows these deletions; if this device knows more, the merged list goes back.
    const knowsMore = Object.entries(lib.deleted).some(([id, t]) => t > (Number(theirDeleted[id]) || 0));
    nextBase.d = knowsMore ? 0 : Math.max(nextBase.d ?? 0, maxOf(deleted));
  }

  const first = Object.keys(base).length === 0;
  let remoteHasContent = false;

  for (const [key, value] of remote) {
    if (key === 'd') continue;
    if (key === 's') {
      const there = readSettings(value);
      const b = base.s ?? 0;
      if (there.updatedAt > settings.updatedAt) {
        if (settings.updatedAt > b && settings.updatedAt > 0) settings = mergeSettings(settings, there, now);
        else settings = there;
        settingsChanged = true;
        taken++;
      }
      nextBase.s = Math.max(b, there.updatedAt);
      continue;
    }
    const kind = key[0];
    const item = kind === 'm' ? readModule(value) : kind === 'l' ? readLesson(value) : kind === 'h' ? readHandout(value) : null;
    if (!item) continue;
    remoteHasContent ||= kind === 'm' || kind === 'l';
    const b = base[key] ?? 0;
    nextBase[key] = Math.max(b, item.updatedAt);
    if ((deleted[item.id] ?? -1) >= item.updatedAt) continue;
    const local = kind === 'm' ? modules.get(item.id) : kind === 'l' ? lessons.get(item.id) : handouts.get(item.id);
    const lu = local?.updatedAt ?? -1;
    if (item.updatedAt > lu) {
      if (kind === 'l' && local && lu > b) {
        keep.push({ lesson: local as Lesson, reason: 'Fassung von diesem Gerät (vor dem Abgleich)' });
        conflicts.push((item as Lesson).title);
      }
      if (kind === 'm') changedM.set(item.id, item as Module), modules.set(item.id, item as Module);
      else if (kind === 'l') changedL.set(item.id, item as Lesson), lessons.set(item.id, item as Lesson);
      else changedH.set(item.id, item as Handout), handouts.set(item.id, item as Handout);
      taken++;
    } else if (kind === 'l' && item.updatedAt < lu && item.updatedAt > b) {
      // Changed there too, but later here: this one stays, the other device's version is kept.
      keep.push({ lesson: item as Lesson, reason: 'Fassung vom anderen Gerät (vor dem Abgleich)' });
      conflicts.push((local as Lesson).title);
    }
  }

  // The first sync with a library that has content: the untouched sample of this device goes, unless the other
  // device has it too.
  const removedModules: string[] = [];
  const removedLessons: string[] = [];
  const gone = (key: string, id: string, updatedAt: number) => (deleted[id] ?? -1) >= updatedAt || (first && remoteHasContent && updatedAt === 0 && !remote.has(key));
  for (const m of [...modules.values()])
    if (gone(`m:${m.id}`, m.id, m.updatedAt)) {
      modules.delete(m.id);
      changedM.delete(m.id);
      if (lib.modules.some((x) => x.id === m.id)) removedModules.push(m.id);
    }
  for (const l of [...lessons.values()])
    if (gone(`l:${l.id}`, l.id, l.updatedAt)) {
      lessons.delete(l.id);
      changedL.delete(l.id);
      if (lib.lessons.some((x) => x.id === l.id)) removedLessons.push(l.id);
    }
  for (const h of [...handouts.values()]) if ((deleted[h.id] ?? -1) >= h.updatedAt) handouts.delete(h.id);

  return {
    library: { ...lib, settings, modules: [...modules.values()], lessons: [...lessons.values()], handouts: [...handouts.values()], deleted },
    base: nextBase,
    modules: [...changedM.values()],
    lessons: [...changedL.values()],
    handouts: [...changedH.values()],
    settings: settingsChanged,
    deleted: deletedChanged,
    removedModules,
    removedLessons,
    keep,
    conflicts,
    taken,
  };
}
