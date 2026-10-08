// The automatic sync between the teacher's devices through the server (Supabase, Frankfurt): fetch what changed
// there, take it in (`mergeRemote`), send what changed here, then the pictures both ways. Everything travels
// encrypted with the key from the pairing code. One run at a time; `poke` asks for a run a few seconds later.
import { get, set, del } from 'idb-keyval';
import type { Library } from '../library/types';
import { blockImages, referencedImages } from '../model/ops';
import { slideImages } from '../model/slides';
import { rpc } from '../share/server';
import { getImage, kv, putImageAs } from '../storage/db';
import { imagesArrived } from '../storage/images';
import { decryptBlob, decryptJson, deriveKeys, encryptBlob, encryptJson, serverName, type SyncKeys } from './keys';
import { mergeRemote, toSend, type Base, type MergeResult } from './merge';

/** On this device only (never in backups): the pairing code and how far the sync got. */
export interface SyncState {
  code: string;
  /** The last `stand` fetched from the server. */
  seit: number;
  base: Base;
  /** Pictures the server has. */
  images: string[];
  /** Last run that went through. */
  last: number;
}

const STATE = 'geraet:abgleich';

export async function loadSyncState(): Promise<SyncState | null> {
  const s = await get<SyncState>(STATE, kv());
  return s && typeof s.code === 'string' ? Object.assign({ seit: 0, base: {}, images: [], last: 0 }, s) : null;
}
const saveState = (s: SyncState | null) => (s ? set(STATE, s, kv()) : del(STATE, kv()));

export type SyncStatus =
  | { kind: 'aus' }
  | { kind: 'laeuft'; text: string; last: number }
  | { kind: 'ok'; last: number }
  | { kind: 'offline'; last: number }
  | { kind: 'fehler'; last: number; message: string };

export interface SyncHost {
  /** The library as it is now. */
  getLib(): Library | null;
  /** Stores and shows what came from the other device. */
  apply(r: MergeResult): Promise<void>;
  onStatus(s: SyncStatus): void;
}

/** All pictures the library uses (worksheets, slides, handouts). */
export function libraryImages(lib: Library): string[] {
  const ids = new Set<string>();
  for (const l of lib.lessons) {
    for (const id of referencedImages(l.doc)) ids.add(id);
    for (const id of slideImages(l.slides)) ids.add(id);
  }
  for (const h of lib.handouts ?? []) for (const p of h.pages) for (const b of p.blocks) for (const id of blockImages(b)) ids.add(id);
  return [...ids];
}

/** Batches of entries of at most ~1.5 MB of ciphertext and 100 entries. */
function batches<T extends { d: string }>(items: T[], max = 1_500_000): T[][] {
  const out: T[][] = [];
  let cur: T[] = [];
  let size = 0;
  for (const it of items) {
    if (cur.length && (size + it.d.length > max || cur.length >= 100)) {
      out.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(it);
    size += it.d.length;
  }
  if (cur.length) out.push(cur);
  return out;
}

export class AutoSync {
  private state: SyncState | null = null;
  private keys: SyncKeys | null = null;
  private running: Promise<void> | null = null;
  private again = false;
  private timer = 0;
  /** Pictures known to be on this device (saves a lookup per picture and run). */
  private local = new Set<string>();
  private status: SyncStatus = { kind: 'aus' };

  constructor(private host: SyncHost) {}

  get code() {
    return this.state?.code ?? '';
  }

  async load() {
    this.state = await loadSyncState();
    this.keys = this.state ? await deriveKeys(this.state.code) : null;
    this.setStatus(this.state ? { kind: 'ok', last: this.state.last } : { kind: 'aus' });
    return !!this.state;
  }

  /** Starts syncing with a pairing code (new, or from the other device). */
  async start(code: string) {
    this.state = { code, seit: 0, base: {}, images: [], last: 0 };
    this.keys = await deriveKeys(code);
    await saveState(this.state);
    return this.run();
  }

  /** Stops syncing on this device; what is on the server stays (encrypted). */
  async stop() {
    window.clearTimeout(this.timer);
    await this.running?.catch(() => {});
    this.state = null;
    this.keys = null;
    await saveState(null);
    this.setStatus({ kind: 'aus' });
  }

  /** A run a little later (after a change, so several changes go in one run). */
  poke(delay = 4000) {
    if (!this.state) return;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.run(), delay);
  }

  /** One run now; if one is going, another one follows it. */
  run(): Promise<void> {
    if (!this.state) return Promise.resolve();
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.once()
      .catch((e) => {
        const last = this.state?.last ?? 0;
        if (e instanceof TypeError || !navigator.onLine) this.setStatus({ kind: 'offline', last });
        else this.setStatus({ kind: 'fehler', last, message: e instanceof Error ? e.message : String(e) });
      })
      .finally(() => {
        this.running = null;
        if (this.again) {
          this.again = false;
          this.poke(500);
        }
      });
    return this.running;
  }

  private setStatus(s: SyncStatus) {
    this.status = s;
    this.host.onStatus(s);
  }

  private progress(text: string) {
    this.setStatus({ kind: 'laeuft', text, last: this.state?.last ?? 0 });
  }

  private async once() {
    const state = this.state!;
    const k = this.keys!;
    const auth = { p_raum: k.room, p_token: k.token };
    if (this.status.kind !== 'laeuft') this.progress('Gleicht ab …');

    // 1. What changed on the server.
    const remote = new Map<string, unknown>();
    let seit = state.seit;
    for (;;) {
      const rows = await rpc<{ schluessel: string; daten: string; stand: number }[]>('abgleich_holen', { ...auth, p_seit: seit });
      for (const r of rows) {
        try {
          const e = await decryptJson<{ k: string; v: unknown }>(k, r.daten);
          if (typeof e.k === 'string') remote.set(e.k, e.v);
        } catch {
          // Not readable with this key: skip.
        }
        seit = Math.max(seit, Number(r.stand));
      }
      if (rows.length < 100) break;
      this.progress(`Holt Änderungen … ${remote.size}`);
    }
    if (remote.size) {
      const lib = this.host.getLib();
      if (lib) {
        const r = mergeRemote(lib, remote, state.base);
        await this.host.apply(r);
        state.base = r.base;
      }
    }
    state.seit = seit;
    await saveState(state);

    // 2. What changed here.
    const lib = this.host.getLib();
    if (!lib) return;
    const send = toSend(lib, state.base);
    if (send.length) {
      const items = await Promise.all(send.map(async (e) => ({ k: await serverName(k, e.key), d: await encryptJson(k, { k: e.key, v: e.value }), e })));
      let done = 0;
      for (const b of batches(items)) {
        if (items.length > 20) this.progress(`Sendet Änderungen … ${done} von ${items.length}`);
        await rpc<number>('abgleich_senden', { ...auth, p_eintraege: b.map(({ k: key, d }) => ({ k: key, d })) });
        for (const { e } of b) state.base[e.key] = e.updatedAt;
        done += b.length;
        await saveState(state);
      }
    }

    // 3. Pictures: up what the server lacks, down what this device lacks.
    const used = libraryImages(lib);
    const onServer = new Set(state.images);
    const unsure = used.filter((id) => !onServer.has(id));
    for (let i = 0; i < unsure.length; i += 100) {
      const part = unsure.slice(i, i + 100);
      const names = await Promise.all(part.map((id) => serverName(k, `i:${id}`)));
      const there = new Set(await rpc<string[]>('abgleich_bilder_vorhanden', { ...auth, p_bilder: names }));
      for (const [j, id] of part.entries()) {
        if (there.has(names[j])) {
          onServer.add(id);
          continue;
        }
        const blob = await getImage(id);
        if (!blob) continue;
        this.progress(`Lädt Bilder hoch … ${j + 1 + i} von ${unsure.length}`);
        await rpc('abgleich_bild_senden', { ...auth, p_bild: names[j], p_daten: await encryptBlob(k, blob) });
        onServer.add(id);
        this.local.add(id);
      }
      state.images = [...onServer];
      await saveState(state);
    }
    const missing: string[] = [];
    for (const id of used) {
      if (this.local.has(id)) continue;
      if (await getImage(id)) this.local.add(id);
      else missing.push(id);
    }
    let arrived = 0;
    for (const [i, id] of missing.entries()) {
      if (missing.length > 3) this.progress(`Holt Bilder … ${i + 1} von ${missing.length}`);
      const data = await rpc<string | null>('abgleich_bild_holen', { ...auth, p_bild: await serverName(k, `i:${id}`) });
      if (!data) continue;
      await putImageAs(id, await decryptBlob(k, data));
      this.local.add(id);
      onServer.add(id);
      arrived++;
    }
    if (arrived) imagesArrived();
    state.images = [...onServer];
    state.last = Date.now();
    await saveState(state);
    this.setStatus({ kind: 'ok', last: state.last });
  }
}
