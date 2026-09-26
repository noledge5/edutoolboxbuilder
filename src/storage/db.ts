// Local persistence in IndexedDB (more room than localStorage, and it can hold image blobs).
import { createStore, del, get, keys, set, type UseStore } from 'idb-keyval';
import { normalizeDoc } from '../model/normalize';
import { referencedImages } from '../model/ops';
import type { Doc } from '../model/types';

const DOC_KEY = 'doc:aktuell';
const IMG_PREFIX = 'img:';

let store: UseStore | null = null;
const db = (): UseStore => (store ??= createStore('arbeitsblatt-baukasten', 'daten'));

export async function loadDoc(): Promise<Doc | null> {
  const raw = await get<unknown>(DOC_KEY, db());
  if (raw == null) return null;
  try {
    return normalizeDoc(raw);
  } catch {
    return null;
  }
}

export function saveDoc(doc: Doc): Promise<void> {
  return set(DOC_KEY, doc, db());
}

export async function putImage(blob: Blob): Promise<string> {
  const id = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await set(IMG_PREFIX + id, blob, db());
  return id;
}

export function getImage(id: string): Promise<Blob | undefined> {
  return get<Blob>(IMG_PREFIX + id, db());
}

/** Deletes stored images no block refers to. Run at start-up only, while the undo history is empty. */
export async function deleteUnusedImages(doc: Doc): Promise<void> {
  const used = referencedImages(doc);
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
