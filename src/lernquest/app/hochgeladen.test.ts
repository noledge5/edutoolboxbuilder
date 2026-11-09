// Uploaded pictures on the device (hochgeladen.tsx): fetched once per version, kept for offline, dropped when deleted.
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { abgleich, ausBase64, bilderLaden } from './hochgeladen';

const b64 = (s: string) => btoa(s);
const text = (b: ArrayBuffer) => new TextDecoder().decode(b);

describe('Hochgeladene Bilder im Gerät', () => {
  it('fetches new and changed versions, drops deleted ones', () => {
    expect(abgleich({ krone: 3, katze: 5 }, { krone: 4, wiese: 1 })).toEqual({ holen: ['krone', 'wiese'], weg: ['katze'] });
    expect(abgleich({ krone: 3 }, { krone: 3 })).toEqual({ holen: [], weg: [] });
  });

  it('decodes base64', () => expect(text(ausBase64(b64('RIFF')))).toBe('RIFF'));

  it('keeps pictures for offline, replaces a new version and forgets a deleted one', async () => {
    let liste: Record<string, number> = { krone: 1, katze: 2 };
    const geholt: string[][] = [];
    const server = {
      liste: async () => liste,
      daten: async (ids: string[]) => {
        geholt.push(ids);
        return ids.map((id) => ({ teil: id, version: liste[id], typ: 'image/webp', daten: b64(`${id}${liste[id]}`) }));
      },
    };
    let b = await bilderLaden(server);
    expect(Object.keys(b).sort()).toEqual(['katze', 'krone']);
    expect(text(b.krone.daten)).toBe('krone1');
    // Offline: the same pictures from the device, nothing fetched.
    b = await bilderLaden({ liste: () => Promise.reject(new TypeError('offline')), daten: server.daten });
    expect(text(b.katze.daten)).toBe('katze2');
    // Same versions: nothing fetched again.
    geholt.length = 0;
    await bilderLaden(server);
    expect(geholt).toEqual([]);
    // Krone replaced, Katze deleted.
    liste = { krone: 7 };
    b = await bilderLaden(server);
    expect(geholt).toEqual([['krone']]);
    expect(Object.keys(b)).toEqual(['krone']);
    expect(text(b.krone.daten)).toBe('krone7');
    b = await bilderLaden({ liste: () => Promise.reject(new TypeError('offline')), daten: server.daten });
    expect(Object.keys(b)).toEqual(['krone']);
  });

  it('fetches at most 10 pictures per call', async () => {
    const liste = Object.fromEntries(Array.from({ length: 23 }, (_, i) => [`t${i}`, 1]));
    const geholt: number[] = [];
    await bilderLaden({
      liste: async () => liste,
      daten: async (ids) => (geholt.push(ids.length), ids.map((id) => ({ teil: id, version: 1, typ: 'image/png', daten: '' }))),
    });
    expect(geholt).toEqual([10, 10, 3]);
  });
});
