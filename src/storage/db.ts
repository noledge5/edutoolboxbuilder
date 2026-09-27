// Local persistence in IndexedDB (more room than localStorage, and it can hold image blobs).
import { createStore, del, get, keys, set, type UseStore } from 'idb-keyval';
import { normalizeDoc } from '../model/normalize';
import { referencedImages } from '../model/ops';
import type { Doc } from '../model/types';

const DOC_KEY = 'doc:aktuell';
const IMG_PREFIX = 'img:';

let store: UseStore | null = null;
const db = (): UseStore => (store ??= createStore('arbeitsblatt-baukasten', 'daten'));

/** The shared key-value store (also used by the library, see storage/library.ts). */
export const kv = db;

/** The worksheet of the first version (before the library). */
export async function loadDoc(): Promise<Doc | null> {
  const raw = await get<unknown>(DOC_KEY, db());
  if (raw == null) return null;
  try {
    return normalizeDoc(raw);
  } catch {
    // Keep the unreadable data aside instead of overwriting it with the sample on the next save.
    await set('doc:unlesbar-' + Date.now(), raw, db());
    return null;
  }
}

export function saveDoc(doc: Doc): Promise<void> {
  return set(DOC_KEY, doc, db());
}

/** Removes the first version's worksheet once it has moved into the library. */
export function deleteOldDoc(): Promise<void> {
  return del(DOC_KEY, db());
}

export async function putImage(blob: Blob): Promise<string> {
  const id = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await set(IMG_PREFIX + id, blob, db());
  return id;
}

/** Stores an image under a known id (when opening a backup file). */
export function putImageAs(id: string, blob: Blob): Promise<void> {
  return set(IMG_PREFIX + id, blob, db());
}

export function getImage(id: string): Promise<Blob | undefined> {
  return get<Blob>(IMG_PREFIX + id, db());
}

/** Deletes stored images no block refers to. Run at start-up only, while no undo history exists. */
/** Deletes stored images that no block of `docs` uses and that are not in `alsoUsed` (e.g. slide pictures). */
export async function deleteUnusedImages(docs: Doc[], alsoUsed: string[] = []): Promise<void> {
  const used = new Set([...docs.flatMap((d) => [...referencedImages(d)]), ...alsoUsed]);
  const all = await keys<string>(db());
  await Promise.all(all.filter((k) => typeof k === 'string' && k.startsWith(IMG_PREFIX) && !used.has(k.slice(IMG_PREFIX.length))).map((k) => del(k, db())));
}

/** Asks the browser not to evict our data (Safari otherwise may clear it after a while without use). */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist?.();
  } catch {
    // Not supported or denied: data is still stored, just not guaranteed.
  }
}
