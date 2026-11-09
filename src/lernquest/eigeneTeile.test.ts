// Own parts made on the teacher page (20261118_lernquest_eigene_teile.sql): checked when read, found by `teil`, in the
// shop only while in the game, kept on the device for offline.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { alleTeile, ladenWare, readEigene, setzeEigene, teil, TEILE } from './teile';

const hut = { id: 'e0123456789', slot: 'kopf', name: 'Drachenhut', seltenheit: 2, nurTruhe: false, aktiv: true };

describe('Eigene Teile', () => {
  afterEach(() => setzeEigene([]));

  it('reads only well-formed parts', () => {
    expect(readEigene([hut])).toEqual([{ id: 'e0123456789', slot: 'kopf', name: 'Drachenhut', seltenheit: 2, eigen: true }]);
    expect(readEigene([{ ...hut, aktiv: false, nurTruhe: true }])[0]).toMatchObject({ aus: true, nurTruhe: true });
    for (const kaputt of [
      { ...hut, id: 'krone' },
      { ...hut, id: 'E0123456789' },
      { ...hut, slot: 'fuss' },
      { ...hut, name: '' },
      { ...hut, name: 'x'.repeat(31) },
      { ...hut, seltenheit: 5 },
      { ...hut, seltenheit: 1.5 },
      null,
    ])
      expect(readEigene([kaputt])).toEqual([]);
    expect(readEigene('nichts')).toEqual([]);
  });

  it('are found next to the built-in parts', () => {
    expect(teil('e0123456789')).toBeUndefined();
    setzeEigene(readEigene([hut]));
    expect(teil('e0123456789')?.name).toBe('Drachenhut');
    expect(teil('krone')?.name).toBe('Krone');
    expect(alleTeile()).toHaveLength(TEILE.length + 1);
  });

  it('are in the shop only while in the game and not only from chests', () => {
    setzeEigene(readEigene([hut]));
    expect(ladenWare([], 'kopf').some((t) => t.id === hut.id)).toBe(true);
    expect(ladenWare([hut.id], 'kopf').some((t) => t.id === hut.id)).toBe(false);
    setzeEigene(readEigene([{ ...hut, aktiv: false }]));
    expect(ladenWare([], 'kopf').some((t) => t.id === hut.id)).toBe(false);
    setzeEigene(readEigene([{ ...hut, nurTruhe: true }]));
    expect(ladenWare([], 'kopf').some((t) => t.id === hut.id)).toBe(false);
  });
});

describe('Eigene Teile im Gerät', () => {
  const speicher = new Map<string, string>();
  beforeEach(() => {
    speicher.clear();
    globalThis.localStorage = {
      getItem: (k: string) => speicher.get(k) ?? null,
      setItem: (k: string, v: string) => void speicher.set(k, v),
      removeItem: (k: string) => void speicher.delete(k),
    } as Storage;
  });
  afterEach(() => setzeEigene([]));

  it('keeps the last list for offline', async () => {
    const { eigeneLaden } = await import('./app/hochgeladen');
    expect(await eigeneLaden(async () => [hut])).toHaveLength(1);
    setzeEigene([]);
    // Offline: the server fails, the device still knows the part.
    const offline = async () => {
      throw new TypeError('offline');
    };
    setzeEigene(readEigene(JSON.parse(speicher.get('lernquest:eigeneTeile')!)));
    expect((await eigeneLaden(offline)).map((t) => t.id)).toEqual([hut.id]);
  });
});
