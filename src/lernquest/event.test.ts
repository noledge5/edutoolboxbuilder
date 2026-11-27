import { describe, expect, it } from 'vitest';
import { bisAnpassen, bisSpaetestens, eventFehler, eventFortschritt, eventGeplant, eventLaeuft, eventNoch, eventPakete, eventVorschlag, readEvent, standardBis, type KlassenEvent } from './event';
import { regionenVon } from './karte';
import { LEERER_STAND, type Paket, type Uebung } from './types';

const pk = (stunde: string, nummer: number, modul: { id: string; nummer: number; stunden?: { nummer: number; titel: string }[] }, fach = 'Englisch'): Paket => ({
  format: 'lernquest-paket',
  v: 1,
  stunde,
  nummer,
  titel: `Stunde ${nummer}`,
  modul: { titel: 'M', icon: 'book-open', ...modul },
  fach,
  lang: 'en',
  uebungen: [{ art: 'richtigfalsch', id: 'u0', frage: '', aussage: '', richtig: true } as Uebung],
});
const m1 = { id: 'm1', nummer: 1, stunden: [1, 2, 3, 4].map((n) => ({ nummer: n, titel: `Titel ${n}` })) };
const wald = { id: 'extra-wortschatz-6-Englisch', nummer: 1002 };
const pakete = [pk('a', 1, m1), pk('b', 2, m1), pk('c', 3, m1), pk('extra-x', 1, wald), pk('d', 1, { id: 'm2', nummer: 2 }, 'Erdkunde')];
// Thursday, 26.11.2026 … Sunday, 29.11.2026.
const ev: KlassenEvent = { art: 'vokabeltest', titel: 'Vokabeltest diese Woche', ab: '2026-11-26', bis: '2026-11-27', stunden: ['b', 'extra-x', 'weg'] };

describe('Events: lesen', () => {
  it('nimmt nur ein vollständiges Event an', () => {
    expect(readEvent(ev)).toEqual(ev);
    expect(readEvent({ ...ev, titel: '  Test  ' })?.titel).toBe('Test');
    expect(readEvent(null)).toBeNull();
    expect(readEvent({ ...ev, art: 'party' })).toBeNull();
    expect(readEvent({ ...ev, titel: ' ' })).toBeNull();
    expect(readEvent({ ...ev, ab: 'morgen' })).toBeNull();
    expect(readEvent({ ...ev, bis: '2026-11-25' })).toBeNull();
    expect(readEvent({ ...ev, stunden: [] })).toBeNull();
    expect(readEvent({ ...ev, stunden: [1] })).toBeNull();
  });

  it('läuft vom ersten bis zum letzten Tag', () => {
    expect(eventLaeuft(ev, '2026-11-25')).toBe(false);
    expect(eventGeplant(ev, '2026-11-25')).toBe(true);
    expect(eventLaeuft(ev, '2026-11-26')).toBe(true);
    expect(eventLaeuft(ev, '2026-11-27')).toBe(true);
    expect(eventLaeuft(ev, '2026-11-28')).toBe(false);
    expect(eventGeplant(ev, '2026-11-28')).toBe(false);
    expect(eventLaeuft(null, '2026-11-26')).toBe(false);
  });
});

describe('Events: Karte', () => {
  it('zeigt während des Events nur seine Stationen, ohne gesperrte', () => {
    const im = eventPakete(pakete, ev, '2026-11-26');
    expect(im.map((p) => p.stunde)).toEqual(['b', 'extra-x']);
    const [r] = regionenVon(im, 'Englisch', LEERER_STAND).filter((x) => x.id === 'm1');
    expect(r.stationen.map((s) => [s.nummer, s.zustand])).toEqual([[2, 'aktuell']]);
    // Erdkunde has no station in the event: the subject is gone from the map.
    expect(im.some((p) => p.fach === 'Erdkunde')).toBe(false);
  });

  it('lässt vor und nach dem Event alles, wie es war', () => {
    expect(eventPakete(pakete, ev, '2026-11-25')).toBe(pakete);
    expect(eventPakete(pakete, ev, '2026-11-28')).toBe(pakete);
    expect(eventPakete(pakete, null, '2026-11-26')).toBe(pakete);
  });

  it('zählt die geschafften Stationen', () => {
    const im = eventPakete(pakete, ev, '2026-11-26');
    expect(eventFortschritt(im, LEERER_STAND)).toEqual({ geschafft: 0, gesamt: 2 });
    expect(eventFortschritt(im, { ...LEERER_STAND, bestwerte: { b: [100], a: [100] } })).toEqual({ geschafft: 1, gesamt: 2 });
  });

  it('sagt, wie lange es noch läuft', () => {
    expect(eventNoch({ bis: '2026-11-27' }, '2026-11-27')).toBe('Heute ist der letzte Tag.');
    expect(eventNoch({ bis: '2026-11-27' }, '2026-11-26')).toBe('Noch heute und morgen.');
    expect(eventNoch({ bis: '2026-11-27' }, '2026-11-24')).toBe('Noch 4 Tage, bis Freitag.');
    expect(eventNoch({ bis: '2026-12-11' }, '2026-11-26')).toBe('Noch 16 Tage, bis zum 11.12.');
  });
});

describe('Events: Lehrkraft', () => {
  it('schlägt Freitag als letzten Tag vor, ab Freitag den der nächsten Woche', () => {
    expect(standardBis('2026-11-23')).toBe('2026-11-27');
    expect(standardBis('2026-11-26')).toBe('2026-11-27');
    expect(standardBis('2026-11-27')).toBe('2026-12-04');
    expect(standardBis('2026-11-29')).toBe('2026-12-04');
  });

  it('passt den letzten Tag an, auch bei geleertem Datumsfeld', () => {
    expect(bisAnpassen('2026-11-27', '2026-12-04')).toBe('2026-12-04');
    expect(bisAnpassen('2026-12-05', '2026-12-04')).toBe('2026-12-05');
    expect(bisAnpassen('2026-11-27', '2026-12-31')).toBe('2026-12-17');
    expect(bisAnpassen('2026-11-27', '')).toBe('2026-11-27');
    expect(bisAnpassen('', '2026-12-04')).toBe('2026-12-04');
    expect(bisSpaetestens('2026-11-27')).toBe('2026-12-17');
    expect(bisSpaetestens('')).toBe('');
  });

  it('wählt für einen Vokabeltest den Wortschatz-Wald vor', () => {
    const module = [
      { id: 'm1', stunden: ['a', 'b'] },
      { id: 'extra-wortschatz-6-Englisch', stunden: ['extra-x', 'extra-y'] },
      { id: 'extra-grammatik-6-Englisch', stunden: ['extra-z'] },
    ];
    expect(eventVorschlag('vokabeltest', module)).toEqual(['extra-x', 'extra-y']);
    expect(eventVorschlag('klassenarbeit', module)).toEqual([]);
    expect(eventVorschlag('eigenes', module)).toEqual([]);
  });

  it('prüft wie der Server', () => {
    const tag = '2026-11-26';
    const ok: KlassenEvent = { ...ev, ab: tag, bis: '2026-12-16', stunden: ['b'] };
    expect(eventFehler(ok, tag)).toBe('');
    expect(eventFehler({ ...ok, titel: ' ' }, tag)).toBe('Gib dem Event einen Titel.');
    expect(eventFehler({ ...ok, titel: 'x'.repeat(61) }, tag)).toMatch(/höchstens 60 Zeichen/);
    expect(eventFehler({ ...ok, ab: '2026-11-24' }, tag)).toMatch(/zu weit zurück/);
    expect(eventFehler({ ...ok, ab: '2027-01-26', bis: '2027-01-27' }, tag)).toMatch(/im Voraus/);
    expect(eventFehler({ ...ok, bis: '2026-11-25' }, tag)).toMatch(/vor dem ersten/);
    expect(eventFehler({ ...ok, bis: '2026-12-17' }, tag)).toBe('Ein Event dauert höchstens drei Wochen.');
    expect(eventFehler({ ...ok, stunden: [] }, tag)).toBe('Wähle mindestens eine Station.');
  });
});
