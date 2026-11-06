// The teacher's side of Lernquest on this device: the teacher keys (made here, the server knows only their hash) and
// the PINs as last handed out (so the cards can be printed again). Stored as `geraet:lernquest`, so never in backups;
// it travels encrypted with the Mac ↔ iPad sync as the entry `g:lernquest` (see src/sync/engine.ts). Both devices end
// up with all keys, so a class made on either device can be managed on both.
import { get, set } from 'idb-keyval';
import { kv } from '../storage/db';

export const LEHRKRAFT_KEY = 'geraet:lernquest';
/** Name of the entry in the sync. */
export const SYNC_KEY = 'g:lernquest';

export interface Lehrkraft {
  /** Teacher keys, 64 hex characters each, sorted; the first one owns new classes. */
  keys: string[];
  /** Child id → PIN as last set from one of the teacher's devices. */
  pins: Record<string, string>;
  updatedAt: number;
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

export const newKey = () => hex(crypto.getRandomValues(new Uint8Array(32)));

/** What came from storage or the other device, or null when it is not a teacher record. */
export function readLehrkraft(x: unknown): Lehrkraft | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Partial<Lehrkraft>;
  const keys = Array.isArray(r.keys) ? r.keys.filter((k): k is string => typeof k === 'string' && /^[0-9a-f]{64}$/.test(k)) : [];
  if (!keys.length) return null;
  const pins: Record<string, string> = {};
  if (r.pins && typeof r.pins === 'object') for (const [id, p] of Object.entries(r.pins)) if (typeof p === 'string' && /^\d{4}$/.test(p)) pins[id] = p;
  return {
    keys: [...new Set(keys)].sort(),
    pins,
    updatedAt: Number(r.updatedAt) || 0,
  };
}

/** Both records together: all keys (at most 10, the server's limit), the PINs of the newer one winning. */
export function mergeLehrkraft(a: Lehrkraft, b: Lehrkraft): Lehrkraft {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a];
  const keys = [...new Set([...a.keys, ...b.keys])].sort().slice(0, 10);
  return {
    keys,
    pins: { ...older.pins, ...newer.pins },
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

/** Same keys and PINs (then nothing needs storing or sending). */
export const sameLehrkraft = (a: Lehrkraft, b: Lehrkraft) => JSON.stringify([a.keys, a.pins]) === JSON.stringify([b.keys, b.pins]);

export async function loadLehrkraft(): Promise<Lehrkraft | null> {
  return readLehrkraft(await get(LEHRKRAFT_KEY, kv()));
}

export const saveLehrkraft = (l: Lehrkraft) => set(LEHRKRAFT_KEY, l, kv());

/** The record of this device, made with a new key the first time. */
export async function ensureLehrkraft(): Promise<Lehrkraft> {
  const have = await loadLehrkraft();
  if (have) return have;
  const l: Lehrkraft = { keys: [newKey()], pins: {}, updatedAt: Date.now() };
  await saveLehrkraft(l);
  return l;
}

/**
 * Takes in the record from the other device. When this device knows more (another key, newer PINs), the merged
 * record gets a new time, so the next sync sends it back.
 */
export async function takeLehrkraft(remote: unknown): Promise<void> {
  const there = readLehrkraft(remote);
  if (!there) return;
  const here = await loadLehrkraft();
  if (!here) return void (await saveLehrkraft(there));
  const merged = mergeLehrkraft(here, there);
  if (!sameLehrkraft(merged, there)) merged.updatedAt = Math.max(Date.now(), there.updatedAt + 1);
  if (!sameLehrkraft(here, merged) || merged.updatedAt !== here.updatedAt) await saveLehrkraft(merged);
}

/** Changes the record (a new PIN) and stamps the time. */
export async function updateLehrkraft(change: (l: Lehrkraft) => Lehrkraft): Promise<Lehrkraft> {
  const l = { ...change(await ensureLehrkraft()), updatedAt: Date.now() };
  await saveLehrkraft(l);
  return l;
}
