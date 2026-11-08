import { describe, expect, it } from 'vitest';
import type { Lesson, Module } from '../library/types';
import { mergeLehrkraft, readLehrkraft, sameLehrkraft, type Lehrkraft } from './lehrkraft';
import { regionenVon } from './karte';
import { buildPaket } from './paket';
import { stufenPlan, stufeVon } from './sichtbarkeit';
import { LEERER_STAND } from './types';

const modul = { id: 'm1', number: 1, title: 'Wetter', icon: 'cloud', subject: 'Erdkunde', grade: 5, lang: 'de' } as unknown as Module;
const stunde = (id: string, number: number): Lesson =>
  ({ id, moduleId: 'm1', number, title: `Stunde ${number}`, doc: { pages: [] }, updatedAt: 1 }) as unknown as Lesson;
const stunden = [stunde('a', 1), stunde('b', 2), stunde('c', 3)];
const key = 'a'.repeat(64);

describe('Sichtbarkeit der Stunden je Klasse', () => {
  it('liest die Stufe: freigeschaltet geht vor ausgeblendet', () => {
    expect(stufeVon('a', ['a'], [])).toBe('frei');
    expect(stufeVon('a', ['a'], ['a'])).toBe('frei');
    expect(stufeVon('b', ['a'], [])).toBe('gesperrt');
    expect(stufeVon('b', ['a'], ['b'])).toBe('aus');
  });

  it('lässt ausgeblendete Stunden aus der Stundenliste des Pakets, nie die Stunde selbst', () => {
    expect(buildPaket(modul, stunden[0], stunden, ['b']).modul.stunden?.map((s) => s.nummer)).toEqual([1, 3]);
    expect(buildPaket(modul, stunden[0], stunden, ['a', 'b']).modul.stunden?.map((s) => s.nummer)).toEqual([1, 3]);
    expect(buildPaket(modul, stunden[0], stunden).modul.stunden?.map((s) => s.nummer)).toEqual([1, 2, 3]);
  });

  it('zeigt eine ausgeblendete Stunde nicht als gesperrte Station', () => {
    const [r] = regionenVon([buildPaket(modul, stunden[0], stunden, ['c'])], 'Erdkunde', LEERER_STAND);
    expect(r.stationen.map((s) => [s.nummer, s.zustand])).toEqual([
      [1, 'aktuell'],
      [2, 'gesperrt'],
    ]);
  });

  it('plant, was zum Server muss', () => {
    const modulIds = ['a', 'b', 'c'];
    // Gesperrt → ausgeblendet: merken, die freigeschalteten des Moduls neu senden.
    expect(stufenPlan('b', 'aus', ['a'], [], modulIds)).toEqual({ versteckt: ['b'], senden: false, sperren: false, neuSenden: ['a'] });
    // Freigeschaltet → ausgeblendet: sperren und die anderen neu senden.
    expect(stufenPlan('a', 'aus', ['a', 'c'], [], modulIds)).toEqual({ versteckt: ['a'], senden: false, sperren: true, neuSenden: ['c'] });
    // Ausgeblendet → freigeschaltet: senden, nicht mehr merken, die anderen bekommen die Stunde wieder in die Liste.
    expect(stufenPlan('b', 'frei', ['a'], ['b'], modulIds)).toEqual({ versteckt: [], senden: true, sperren: false, neuSenden: ['a'] });
    // Freigeschaltet → gesperrt: nur sperren, die Liste bleibt gleich.
    expect(stufenPlan('a', 'gesperrt', ['a', 'c'], [], modulIds)).toEqual({ versteckt: [], senden: false, sperren: true, neuSenden: [] });
    // Gleiche Stufe: nichts.
    expect(stufenPlan('b', 'aus', ['a'], ['b'], modulIds)).toEqual({ versteckt: ['b'], senden: false, sperren: false, neuSenden: [] });
    // Stunden anderer Module werden nicht neu gesendet.
    expect(stufenPlan('b', 'aus', ['a', 'x'], [], modulIds).neuSenden).toEqual(['a']);
  });

  it('speichert ausgeblendete Stunden je Klasse im Lehrkraft-Datensatz und gleicht sie ab', () => {
    const r = readLehrkraft({ keys: [key], pins: {}, versteckt: { k1: ['a', 3, 'b'], k2: 'kaputt' }, updatedAt: 5 });
    expect(r?.versteckt).toEqual({ k1: ['a', 'b'] });
    expect(readLehrkraft({ keys: [key], pins: {}, updatedAt: 5 })?.versteckt).toEqual({});

    const alt: Lehrkraft = { keys: [key], pins: {}, versteckt: { k1: ['a'], k2: ['c'] }, updatedAt: 1 };
    const neu: Lehrkraft = { keys: [key], pins: {}, versteckt: { k1: [] }, updatedAt: 2 };
    expect(mergeLehrkraft(alt, neu).versteckt).toEqual({ k1: [], k2: ['c'] });
    expect(sameLehrkraft(alt, { ...alt, versteckt: { k1: ['a'] } })).toBe(false);
  });
});
