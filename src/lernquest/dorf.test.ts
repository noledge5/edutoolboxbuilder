import { describe, expect, it } from 'vitest';
import { DORF_GEBAEUDE, spendeMoeglich, spendeNoetig, spendeWert, SPENDE_WOCHE, zielVorschlag } from './dorf';
import { readFileSync } from 'node:fs';

describe('Dorfkasse', () => {
  it('zählt Spenden 1,5-fach, abgerundet', () => {
    expect([1, 2, 10, 25, 100].map(spendeWert)).toEqual([1, 3, 15, 37, 150]);
  });

  it('nimmt nie mehr Münzen, als das Projekt noch braucht', () => {
    for (let fehlt = 1; fehlt < 500; fehlt++) {
      const m = spendeNoetig(fehlt);
      expect(spendeWert(m)).toBeGreaterThanOrEqual(fehlt);
      expect(spendeWert(m - 1)).toBeLessThan(fehlt);
    }
  });

  it('begrenzt auf Wochendeckel, Bedarf und eigene Münzen', () => {
    const d = { muenzen: 500, woche: 0, ziel: 1000, stand: 0 };
    expect(spendeMoeglich(50, d)).toBe(50);
    expect(spendeMoeglich(300, d)).toBe(SPENDE_WOCHE);
    expect(spendeMoeglich(50, { ...d, woche: 180 })).toBe(20);
    expect(spendeMoeglich(50, { ...d, stand: 991 })).toBe(6);
    expect(spendeMoeglich(50, { ...d, muenzen: 7 })).toBe(7);
    expect(spendeMoeglich(50, { ...d, woche: SPENDE_WOCHE })).toBe(0);
  });

  it('schlägt 100 Münzen je Kind vor, in den Grenzen des Servers', () => {
    expect(zielVorschlag(24)).toBe(2400);
    expect(zielVorschlag(0)).toBe(50);
    expect(zielVorschlag(500)).toBe(20000);
  });

  it('kennt dieselben Gebäude und Grenzen wie der Server', () => {
    const sql = readFileSync('supabase/migrations/20261130_lernquest_dorf.sql', 'utf8');
    expect(sql).toContain(`gebaeude in (${DORF_GEBAEUDE.map((g) => `'${g.id}'`).join(', ')})`);
    expect(sql).toContain(`rest := ${SPENDE_WOCHE} -`);
    expect(sql).toContain('(2 * (p.ziel - p.stand) + 2) / 3');
    expect(sql).toContain('wert := m + m / 2');
  });
});
