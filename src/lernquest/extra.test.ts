import { describe, expect, it } from 'vitest';
import { newLesson, newModule, seedLibrary } from '../library/model';
import { readExtra } from '../library/read';
import type { ExtraPaket, Library } from '../library/types';
import { entriesOf, mergeRemote, toSend } from '../sync/merge';
import { auswertenThemen } from './auswertung';
import { bossFragen } from './boss';
import { extraFaellig, karteKey } from './rules';
import { buildExtraPaket, klassenRegionen, klassenRegionName, regionPakete, extraAlsStunde, extraInhalt, extraModulId, extraStunde, extraVerschieben, extraZiele, newExtra } from './extra';
import { poolPrompt } from './fragenpool';
import { regionenVon, regionName } from './karte';
import { buildPaket } from './paket';
import { freiFuer, vokabelListen } from './teacher/ExtraPakete';
import { LEERER_STAND, type Uebung } from './types';

const rf = (id: string, niveau?: 1 | 2 | 3): Uebung => ({ art: 'richtigfalsch', id, frage: 'Stimmt das?', aussage: id, richtig: true, ...(niveau ? { niveau } : {}) });

function extra(id: string, art: 'grammatik' | 'wortschatz', createdAt: number, title = id): ExtraPaket {
  return { ...newExtra('Englisch', 6, art, title, '', 'en', createdAt), id, pool: [{ u: rf(`${id}-a`, 3), frei: true }, { u: rf(`${id}-b`, 1), frei: true }, { u: rf(`${id}-c`), frei: false }] };
}

describe('Extra-Pakete: Paket', () => {
  const a = extra('xa', 'grammatik', 1, 'simple past');
  const b = extra('xb', 'grammatik', 2, 'going to');
  const c = extra('xc', 'wortschatz', 3, 'Wetter');
  const alle = [b, c, a];

  it('nimmt nur freigegebene Übungen, von leicht nach schwer, unter eigenem Schlüssel', () => {
    const p = buildExtraPaket(a, alle, ['xa']);
    expect(p.stunde).toBe('extra-xa');
    expect(p.stunde.length).toBeLessThanOrEqual(64);
    expect(p.uebungen.map((u) => u.id)).toEqual(['xa-b', 'xa-a']);
    expect(p).toMatchObject({ titel: 'simple past', nummer: 1, fach: 'Englisch', lang: 'en', modul: { id: extraModulId(a), titel: 'Grammatik-Turm', icon: 'castle' } });
  });

  it('nummeriert je Region nach Anlage und zeigt nur freigeschaltete Pakete als Stationen', () => {
    const p = buildExtraPaket(b, alle, ['xb']);
    expect(p.nummer).toBe(2);
    expect(p.modul.stunden).toEqual([{ nummer: 2, titel: 'going to' }]);
    expect(buildExtraPaket(b, alle, ['xa', 'xb', 'xc']).modul.stunden).toEqual([
      { nummer: 1, titel: 'simple past' },
      { nummer: 2, titel: 'going to' },
    ]);
    // Wortschatz ist eine eigene Region.
    expect(buildExtraPaket(c, alle, ['xc']).modul).toMatchObject({ titel: 'Wortschatz-Wald', nummer: 1002 });
    expect(extraModulId(c)).not.toBe(extraModulId(a));
  });

  it('liest freigeschaltete Extra-Pakete aus den Stunden der Klasse', () => {
    expect(freiFuer(['b123', extraStunde(a), 'extra-xc'])).toEqual(['xa', 'xc']);
  });

  it('gibt Claude das Thema und die Wörter statt der Arbeitsblätter', () => {
    const e = { ...a, words: 'rain = Regen\nsun = Sonne', art: 'wortschatz' as const, title: 'Wortfeld Wetter' };
    const { modul, stunde } = extraAlsStunde(e, [e]);
    const prompt = poolPrompt({ modul, stunde, klasse: '', vorhanden: [], wuensche: '', inhalt: extraInhalt(e) });
    expect(prompt).toContain('## Thema des Extra-Pakets');
    expect(prompt).toContain('Thema: Wortfeld Wetter');
    expect(prompt).toContain('rain = Regen');
    expect(prompt).not.toContain('Inhalt der Stunde');
    expect(prompt).not.toContain('Modul 1002');
  });
});

describe('Extra-Pakete: Karte', () => {
  it('stellt Extra-Regionen hinter die Module und macht sie nie zur aktuellen Station', () => {
    const lib = seedLibrary();
    const m = { ...newModule(lib, 'Englisch', 6), number: 3 };
    const l = { ...newLesson(lib, m), id: 'l1', pool: [{ u: rf('l-a'), frei: true }] };
    const e = { ...extra('xa', 'grammatik', 1), subject: 'Englisch' };
    const pakete = [buildExtraPaket(e, [e]), buildPaket(m, l, [l])];
    const regionen = regionenVon(pakete, 'Englisch', LEERER_STAND);
    expect(regionen.map((r) => r.titel)).toEqual([m.title, 'Grammatik-Turm']);
    expect(regionen[0].stationen[0].zustand).toBe('aktuell');
    expect(regionen[1].stationen[0].zustand).toBe('offen');
    // Ist die Stunde erledigt, bleibt die Extra-Station trotzdem „offen“.
    const fertig = regionenVon(pakete, 'Englisch', { ...LEERER_STAND, bestwerte: { l1: [100] } });
    expect(fertig[1].stationen[0].zustand).toBe('offen');
    expect(regionName(regionen[1].id, regionen[1].nummer)).toBe('Extra');
    expect(regionName(regionen[0].id, regionen[0].nummer)).toBe('Region 3');
  });
});

describe('Extra-Pakete: Auswertung, Wiederholen sofort und Bosskampf', () => {
  const lib = seedLibrary();
  const m = { ...newModule(lib, 'Englisch', 6), number: 3 };
  const l = { ...newLesson(lib, m), id: 'l1', pool: [{ u: rf('l-a'), frei: true }] };
  const a = extra('xa', 'grammatik', 1, 'simple past');
  const b = extra('xb', 'grammatik', 2, 'going to');
  const c = extra('xc', 'wortschatz', 3, 'Wetter');
  const d = { ...extra('xd', 'grammatik', 4), subject: 'Deutsch', grade: 5 };
  const bib = { modules: [m], lessons: [l], extras: [c, b, a, d] };

  it('nimmt freigeschaltete Extra-Pakete als Regionen hinter die Module, gesperrte und gelöschte nicht', () => {
    const r = klassenRegionen(bib, ['l1', 'extra-xb', 'extra-xa', 'extra-xc', 'extra-weg']);
    expect(r.map((x) => [x.modul.id, x.extra, x.stunden.map((s) => s.id)])).toEqual([
      [m.id, false, ['l1']],
      [extraModulId(a), true, ['extra-xa', 'extra-xb']],
      [extraModulId(c), true, ['extra-xc']],
    ]);
    expect(klassenRegionName(r[1])).toBe('Englisch 6 · Grammatik-Turm');
    expect(klassenRegionName(r[0])).toBe(`Englisch 6 · Modul 3: ${m.title}`);
    expect(klassenRegionen(bib, ['extra-xd']).map((x) => x.modul.subject)).toEqual(['Deutsch']);
    expect(klassenRegionen(bib, [])).toEqual([]);
  });

  it('gibt der Region die Pakete, wie die Kinder sie haben, und wertet je Thema aus', () => {
    const frei = ['l1', 'extra-xa', 'extra-xb'];
    const [stunde, turm] = klassenRegionen(bib, frei);
    expect(regionPakete(bib, stunde, frei)).toEqual([buildPaket(m, l, [l])]);
    const pakete = regionPakete(bib, turm, frei);
    expect(pakete).toEqual([buildExtraPaket(a, bib.extras, ['xa', 'xb']), buildExtraPaket(b, bib.extras, ['xa', 'xb'])]);
    expect(bossFragen(pakete, 'zaehlen', 1000).length).toBe(4);
    const leitner = { [karteKey('extra-xa', 'xa-a')]: [3, 0] as [number, number], [karteKey('extra-xa', 'xa-b')]: [1, 0] as [number, number] };
    const r = auswertenThemen(pakete, [{ id: 'k1', leitner }, { id: 'k2', leitner: {} }]);
    expect(r.zeilen.map((z) => [z.id, z.name, z.aufgaben])).toEqual([
      ['extra-xa', 'simple past', 2],
      ['extra-xb', 'going to', 2],
    ]);
    expect(r.zeilen[0].kinder.k1).toMatchObject({ geuebt: 2, sitzt: 1, anteil: 0.5 });
    expect(r.zeilen[0].anteil).toBe(0.5);
    expect(r.zeilen[1].anteil).toBeNull();
  });

  it('„Wiederholen sofort“ mit einem Extra-Paket macht dessen Karten fällig', () => {
    const karten = [karteKey('extra-xa', 'xa-a'), karteKey('l1', 'l-a')];
    expect(extraFaellig({}, karten, { ab: '2026-11-13', bis: '2026-11-14', stunden: ['extra-xa'] }, '2026-11-13')).toEqual([karteKey('extra-xa', 'xa-a')]);
  });
});

describe('Extra-Pakete: Bibliothek', () => {
  it('liest gespeicherte Pakete und weist kaputte ab', () => {
    const e = extra('xa', 'wortschatz', 5);
    expect(readExtra(JSON.parse(JSON.stringify(e)))).toEqual(e);
    expect(readExtra({ id: 'x', grade: 6 })).toBeNull();
    expect(readExtra(null)).toBeNull();
  });

  it('findet die Vokabellisten eines Fachs und einer Klassenstufe', () => {
    const lib = seedLibrary();
    const m = newModule(lib, 'Englisch', 6);
    const l = newLesson(lib, m);
    l.doc.pages[0].blocks.push({ id: 'v1', type: 'vocab', props: { title: 'Weather', rows: 'rain | reɪn | Regen | It rains.\nsun |  | Sonne |' } } as never);
    const listen = vokabelListen({ ...lib, modules: [m], lessons: [l] }, 'Englisch', 6);
    expect(listen).toEqual([{ id: 'v1', name: `M${m.number} S${l.number}: Weather`, words: 'rain = Regen\nsun = Sonne' }]);
    expect(vokabelListen({ ...lib, modules: [m], lessons: [l] }, 'Englisch', 7)).toEqual([]);
  });

  it('gleicht Extra-Pakete zwischen Geräten ab, auch gelöschte', () => {
    const lib: Library = { ...seedLibrary(), extras: [] };
    const e = extra('xa', 'grammatik', 10);
    const hier: Library = { ...lib, extras: [{ ...e, updatedAt: 10 }] };
    expect(toSend(hier, {}).map((x) => x.key)).toContain('x:xa');
    // Das andere Gerät bekommt es.
    const remote = new Map(entriesOf(hier).map((x) => [x.key, JSON.parse(JSON.stringify(x.value))]));
    const r = mergeRemote(lib, remote, { s: 1 });
    expect(r.extras.map((x) => x.id)).toEqual(['xa']);
    expect(r.library.extras?.map((x) => x.id)).toEqual(['xa']);
    // Auf einem Gerät gelöscht: das andere entfernt es und bringt es nicht zurück.
    const geloescht = new Map<string, unknown>([['d', { xa: 20 }]]);
    const r2 = mergeRemote(hier, geloescht, { s: 1 });
    expect(r2.removedExtras).toEqual(['xa']);
    expect(r2.library.extras).toEqual([]);
    // Eine neuere Fassung gewinnt.
    const neuer = new Map<string, unknown>([['x:xa', { ...e, title: 'neu', updatedAt: 30 }]]);
    expect(mergeRemote(hier, neuer, { s: 1 }).library.extras?.[0].title).toBe('neu');
  });
});

describe('moving an Extra-Paket to another subject and grade', () => {
  const leer = seedLibrary();
  const modul = (subject: string, grade: number, lang: 'de' | 'en') => ({ ...newModule(leer, subject, grade), lang });
  const lib = { modules: [modul('Chemie', 10, 'de'), modul('Englisch', 5, 'en'), modul('Englisch', 5, 'de'), modul('', 0, 'de')] };

  it('offers each subject and grade once, English when a module there is English', () => {
    expect(extraZiele(lib)).toEqual([
      { subject: 'Chemie', grade: 10, lang: 'de' },
      { subject: 'Englisch', grade: 5, lang: 'en' },
    ]);
  });

  it('keeps id and exercises, takes subject, grade and language of the target', () => {
    const e = { ...newExtra('Chemie', 10, 'grammatik', 'simple past', '', 'de', 1), pool: [{ u: { art: 'waehlen', id: 'a', frage: 'f', optionen: ['x', 'y'], richtig: [0] }, frei: true }] } as ExtraPaket;
    const m = extraVerschieben(e, { subject: 'Englisch', grade: 5, lang: 'en' }, 5);
    expect(m).toMatchObject({ id: e.id, subject: 'Englisch', grade: 5, lang: 'en', title: 'simple past', updatedAt: 5, createdAt: 1 });
    expect(m.pool).toBe(e.pool);
    expect(extraModulId(m)).toBe('extra-grammatik-5-Englisch');
  });
});
