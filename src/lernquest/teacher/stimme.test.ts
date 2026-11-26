import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Uebung } from '../types';

const server = vi.hoisted(() => ({ fehlend: vi.fn(), speichern: vi.fn() }));
vi.mock('../server', () => ({ toeneFehlend: server.fehlend, toeneSpeichern: server.speichern }));

import { tonSchluessel } from '../stimme';
import { googleSchluesselSetzen, STIMMEN, toeneErzeugen, tonStand } from './stimme';

const uebungen: Uebung[] = [
  { art: 'richtigfalsch', id: 'a', frage: 'Stimmt das?', aussage: 'one', richtig: true },
  { art: 'richtigfalsch', id: 'b', frage: 'Stimmt das?', aussage: 'two', richtig: true },
  { art: 'richtigfalsch', id: 'c', frage: 'Stimmt das?', aussage: 'three', richtig: true },
];
const speicher = new Map<string, string>();
const google = vi.fn();

beforeEach(() => {
  speicher.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => speicher.set(k, v),
    removeItem: (k: string) => speicher.delete(k),
  });
  vi.stubGlobal('fetch', google);
  server.fehlend.mockReset();
  server.speichern.mockReset().mockResolvedValue(1);
  google.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

const antwort = (status: number, body: unknown) => ({ ok: status === 200, status, text: async () => JSON.stringify(body) });

describe('Aufnehmen mit Google', () => {
  it('tut ohne Schlüssel nichts', async () => {
    await toeneErzeugen(['k'], { lang: 'en', uebungen });
    expect(server.fehlend).not.toHaveBeenCalled();
    expect(google).not.toHaveBeenCalled();
  });

  it('nimmt nur fehlende Sätze auf, nimmt die nächste Stimme, wenn Google eine nicht kennt, und speichert sie', async () => {
    googleSchluesselSetzen('AIza-test');
    server.fehlend.mockImplementation(async (h: string[]) => h.slice(1));
    google.mockImplementation(async (_url: string, init: { body: string }) => {
      const b = JSON.parse(init.body);
      return b.voice.name === STIMMEN[0] ? antwort(400, { error: { message: 'voice not found' } }) : antwort(200, { audioContent: 'SUQz' + b.input.text });
    });
    await toeneErzeugen(['k'], { lang: 'en', uebungen });
    const gespeichert = server.speichern.mock.calls.flatMap((c) => c[1]);
    expect(gespeichert.map((x: { s: string }) => x.s).sort()).toEqual([await tonSchluessel('two'), await tonSchluessel('three')].sort());
    expect(gespeichert.map((x: { d: string }) => x.d).sort()).toEqual(['SUQzthree', 'SUQztwo']);
    expect(server.speichern.mock.calls[0][0]).toEqual(['k']);
    expect(speicher.get('lernquest:google-stimme-name')).toBe(STIMMEN[1]);
    expect(String(google.mock.calls[0][0])).toContain('key=AIza-test');
    expect(tonStand()).toMatchObject({ laeuft: false, fehler: '' });
  });

  it('meldet einen falschen Schlüssel verständlich und wirft nicht', async () => {
    googleSchluesselSetzen('falsch');
    server.fehlend.mockImplementation(async (h: string[]) => h);
    google.mockResolvedValue(antwort(403, { error: { message: 'API key not valid', status: 'PERMISSION_DENIED' } }));
    await expect(toeneErzeugen(['k'], { lang: 'en', uebungen })).resolves.toBeUndefined();
    expect(tonStand().fehler).toMatch(/nimmt den Schlüssel nicht an/);
    expect(server.speichern).not.toHaveBeenCalled();
  });

  it('macht in deutschen Paketen ohne Hören nichts', async () => {
    googleSchluesselSetzen('AIza-test');
    await toeneErzeugen(['k'], { lang: 'de', uebungen });
    expect(server.fehlend).not.toHaveBeenCalled();
  });
});
