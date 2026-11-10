// The shared IndexedDB key-value store of the Baukasten, on its own so the Lernquest page (same origin) can read the
// teacher keys for the projector view without loading the editor's storage code.
import { createStore, type UseStore } from 'idb-keyval';

let store: UseStore | null = null;
export const kv = (): UseStore => (store ??= createStore('arbeitsblatt-baukasten', 'daten'));
