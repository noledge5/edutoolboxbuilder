// The teacher's side of Lernquest on this device: the teacher keys (made here, the server knows only their hash) and
// the PINs as last handed out (so the cards can be printed again). Stored as `geraet:lernquest`, so never in backups;
// it travels encrypted with the Mac ↔ iPad sync as the entry `g:lernquest` (see src/sync/engine.ts). Both devices end
// up with all keys, so a class made on either device can be managed on both.
import { get, set } from 'idb-keyval';
import { kv } from '../storage/kv';
import { KARTEN_MAX } from './karten/code';

export const LEHRKRAFT_KEY = 'geraet:lernquest';
/** Name of the entry in the sync. */
export const SYNC_KEY = 'g:lernquest';

export interface Lehrkraft {
  /** Teacher keys, 64 hex characters each, sorted; the first one owns new classes. */
  keys: string[];
  /** Child id → PIN as last set from one of the teacher's devices. */
  pins: Record<string, string>;
  /** Class id → lessons hidden from that class (not even a locked station; src/lernquest/sichtbarkeit.ts). */
  versteckt: Record<string, string[]>;
  /** Class id → child id → number of the child's answer card (karten/code.ts), kept so printed cards stay valid. */
  karten: Record<string, Record<string, number>>;
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
  const versteckt: Record<string, string[]> = {};
  if (r.versteckt && typeof r.versteckt === 'object')
    for (const [klasse, ids] of Object.entries(r.versteckt))
      if (Array.isArray(ids)) versteckt[klasse] = [...new Set(ids.filter((x): x is string => typeof x === 'string' && x.length <= 100))].slice(0, 1000);
  const karten: Record<string, Record<string, number>> = {};
  if (r.karten && typeof r.karten === 'object')
    for (const [klasse, m] of Object.entries(r.karten)) {
      if (!m || typeof m !== 'object') continue;
      const ok: Record<string, number> = {};
      const used = new Set<number>();
      for (const [kind, n] of Object.entries(m))
        if (typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= KARTEN_MAX && !used.has(n)) {
          ok[kind] = n;
          used.add(n);
        }
      karten[klasse] = ok;
    }
  return {
    keys: [...new Set(keys)].sort(),
    pins,
    versteckt,
    karten,
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
    // Per class the newer record wins (an empty list too: everything shown again).
    versteckt: { ...older.versteckt, ...newer.versteckt },
    karten: mergeKarten(older.karten, newer.karten),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

/**
 * Card numbers of both devices, per class: the newer number of a child wins; a child only the older record knows
 * keeps its number unless the newer record gave that number to another child. So a child numbered on one device is not
 * lost when the other device numbered a different child at the same time, and no number is given twice.
 */
function mergeKarten(older: Lehrkraft['karten'], newer: Lehrkraft['karten']): Lehrkraft['karten'] {
  const out: Lehrkraft['karten'] = {};
  for (const klasse of new Set([...Object.keys(older), ...Object.keys(newer)])) {
    const m = { ...(newer[klasse] ?? {}) };
    const used = new Set(Object.values(m));
    for (const [kind, n] of Object.entries(older[klasse] ?? {}))
      if (!(kind in m) && !used.has(n)) {
        m[kind] = n;
        used.add(n);
      }
    out[klasse] = m;
  }
  return out;
}

/** Same keys, PINs and hidden lessons (then nothing needs storing or sending). */
export const sameLehrkraft = (a: Lehrkraft, b: Lehrkraft) =>
  JSON.stringify([a.keys, a.pins, a.versteckt, a.karten]) === JSON.stringify([b.keys, b.pins, b.versteckt, b.karten]);

export async function loadLehrkraft(): Promise<Lehrkraft | null> {
  return readLehrkraft(await get(LEHRKRAFT_KEY, kv()));
}

export const saveLehrkraft = (l: Lehrkraft) => set(LEHRKRAFT_KEY, l, kv());

/** The record of this device, made with a new key the first time. */
export async function ensureLehrkraft(): Promise<Lehrkraft> {
  const have = await loadLehrkraft();
  if (have) return have;
  const l: Lehrkraft = { keys: [newKey()], pins: {}, versteckt: {}, karten: {}, updatedAt: Date.now() };
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

/** Changes the record (a new PIN, hidden lessons) and stamps the time. */
export async function updateLehrkraft(change: (l: Lehrkraft) => Lehrkraft): Promise<Lehrkraft> {
  const l = { ...change(await ensureLehrkraft()), updatedAt: Date.now() };
  await saveLehrkraft(l);
  return l;
}

/**
 * Card numbers for the children of a class: a child keeps its number, a new child gets the lowest free one. Children
 * in the class's trash keep theirs (they may come back); children gone for good free theirs. Children beyond
 * KARTEN_MAX get none.
 */
export function kartenNummern(kinder: string[], bisher: Record<string, number> = {}): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of kinder) if (bisher[k]) out[k] = bisher[k];
  const used = new Set(Object.values(out));
  let next = 1;
  for (const k of kinder) {
    if (out[k]) continue;
    while (used.has(next)) next++;
    if (next > KARTEN_MAX) break;
    out[k] = next;
    used.add(next);
  }
  return out;
}

/**
 * Numbers every child of the given classes (a new child gets the lowest free number as soon as the class list shows
 * it). Null when nothing changed; the order of the stored entries does not count, so a merge never causes a write.
 */
export function alleNummern(karten: Lehrkraft['karten'], klassen: { id: string; kinder: string[] }[]): Lehrkraft['karten'] | null {
  let out: Lehrkraft['karten'] | null = null;
  for (const k of klassen) {
    const bisher = karten[k.id] ?? {};
    const neu = kartenNummern(k.kinder, bisher);
    const gleich = Object.keys(neu).length === Object.keys(bisher).length && Object.entries(neu).every(([kind, n]) => bisher[kind] === n);
    if (!gleich) out = { ...(out ?? karten), [k.id]: neu };
  }
  return out;
}
