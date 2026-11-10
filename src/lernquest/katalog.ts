// The catalogue of parts from the server, kept on the device: every picture is loaded only once (the server sends
// only pictures changed since the last time). Offline the last catalogue is used, else the built-in one.
import { katalogLaden } from './server';
import { leseKatalog, TEILE, type Teil } from './teile';

/** Where the cache lives (IndexedDB through idb-keyval); a `geraet:` key, so never in backups or the sync. */
export const KATALOG_KEY = 'geraet:lq-katalog';

interface Cache {
  jetzt: string;
  teile: unknown[];
  bilder: Record<string, { bild: string | null; bildKurz: string | null }>;
}

export interface Ablage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

/** Parts and pictures together, made safe. */
export function zusammen(teile: unknown[], bilder: Cache['bilder']): Teil[] {
  return leseKatalog(teile.map((t) => (t && typeof t === 'object' ? { ...t, ...(bilder[(t as { id: string }).id] ?? {}) } : t)));
}

function leseCache(x: unknown): Cache | null {
  if (!x || typeof x !== 'object') return null;
  const c = x as Partial<Cache>;
  if (typeof c.jetzt !== 'string' || !Array.isArray(c.teile) || !c.bilder || typeof c.bilder !== 'object') return null;
  return c as Cache;
}

/** The catalogue as stored on the device (or the built-in one). */
export async function katalogVomGeraet(ablage: Ablage): Promise<Teil[]> {
  const c = leseCache(await ablage.get(KATALOG_KEY).catch(() => null));
  return c ? zusammen(c.teile, c.bilder) : TEILE;
}

/** Fetches what changed, stores it and returns the whole catalogue; on trouble the device's one (and the error). */
export async function katalogAktualisieren(ablage: Ablage): Promise<{ teile: Teil[]; fehler?: unknown }> {
  const alt = leseCache(await ablage.get(KATALOG_KEY).catch(() => null));
  try {
    // A little overlap: a picture saved in a transaction that began before the last answer still comes.
    const r = await katalogLaden(alt ? new Date(Date.parse(alt.jetzt) - 120_000).toISOString() : null);
    const bilder = { ...(alt?.bilder ?? {}), ...r.bilder };
    // Pictures of parts that are gone (should not happen: parts are never deleted) are dropped.
    const ids = new Set(r.teile.map((t) => (t as { id?: string } | null)?.id));
    for (const id of Object.keys(bilder)) if (!ids.has(id)) delete bilder[id];
    const neu: Cache = { jetzt: r.jetzt, teile: r.teile, bilder };
    await ablage.set(KATALOG_KEY, neu).catch(() => undefined);
    return { teile: zusammen(neu.teile, neu.bilder) };
  } catch (fehler) {
    return { teile: alt ? zusammen(alt.teile, alt.bilder) : TEILE, fehler };
  }
}
