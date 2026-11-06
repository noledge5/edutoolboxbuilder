import { describe, expect, it } from 'vitest';
import { probeAusUrl, probeTest, PROBEN, schwachePunkte, stationPaket, TEST_GROESSE } from './probe';
import { istRichtig, richtigeAntwort, rundenZahl, satz } from './rules';

describe.each(Object.values(PROBEN))('Offene Übungen „$id“', (p) => {
  const alle = p.stationen.flatMap((s) => s.uebungen);

  it('hat lösbare Übungen, jede nur einmal', () => {
    expect(new Set(alle.map((u) => u.id)).size).toBe(alle.length);
    for (const u of alle) {
      expect(istRichtig(u, richtigeAntwort(u)), u.id).toBe(true);
      if (u.art === 'waehlen') {
        expect(u.optionen.length, u.id).toBeGreaterThanOrEqual(2);
        expect(new Set(u.optionen).size, u.id).toBe(u.optionen.length);
        expect(istRichtig(u, { art: 'waehlen', gewaehlt: [(u.richtig[0] + 1) % u.optionen.length] }), u.id).toBe(false);
      }
      if (u.art === 'paare') expect(u.paare.length, u.id).toBeLessThanOrEqual(5);
      if (u.art === 'luecke') {
        for (const w of u.teile.filter((_, i) => i % 2 === 1)) expect(u.kacheln, u.id).toContain(w);
        expect(u.kacheln.length, u.id).toBeGreaterThan(1);
      }
      if (u.art === 'reihenfolge') {
        expect(satz(u.kacheln), u.id).toBe(u.loesung);
        expect(u.kacheln.length, u.id).toBeGreaterThan(2);
      }
    }
  });

  it('macht aus jeder Station ein Paket mit Runden', () => {
    p.stationen.forEach((_, i) => {
      const paket = stationPaket(p, i);
      expect(paket.stunde).toBe(`${p.id}:${i}`);
      expect(rundenZahl(paket.uebungen.length)).toBeGreaterThanOrEqual(3);
    });
  });

  it('mischt den Probetest aus allen Stationen, gleich für denselben Versuch', () => {
    const t = probeTest(p, 'a');
    expect(t).toHaveLength(TEST_GROESSE);
    expect(new Set(t.map((x) => x.u.id)).size).toBe(TEST_GROESSE);
    expect(new Set(t.map((x) => x.stunde)).size).toBe(p.stationen.length);
    expect(probeTest(p, 'a')).toEqual(t);
    expect(probeTest(p, 'b').map((x) => x.u.id)).not.toEqual(t.map((x) => x.u.id));
  });

  it('nennt die Stationen mit Fehlern', () => {
    expect(schwachePunkte(p, [{ stunde: `${p.id}:1`, richtig: false }, { stunde: `${p.id}:0`, richtig: true }])).toEqual([p.stationen[1].titel]);
  });
});

it('liest die Probe aus der Adresse', () => {
  expect(probeAusUrl('#probe=englisch5')).toBe('englisch5');
  expect(probeAusUrl('#ABCDEFGH')).toBe('');
  expect(probeAusUrl('#probe=../x')).toBe('');
});
