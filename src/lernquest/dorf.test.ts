import { describe, expect, it } from 'vitest';
import { DORF_GEBAEUDE, HAUS_MAX, HAUS_STUFEN, hausAusbau, spendeMoeglich, spendeNoetig, spendeWert, SPENDE_WOCHE, zielVorschlag } from './dorf';
import { ZELT_FRAGEN, ZELT_RICHTIG_AB, ZELT_RUNDE, zeltBestanden, zeltFragen } from './zelt';
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

describe('Eigenes Haus (Teil B1)', () => {
  const reich = { muenzen: 99999, heldenstufe: 99 };

  it('hat fünf Stufen mit den Preisen und Heldenstufen der Lehrkraft', () => {
    expect(HAUS_STUFEN.map((h) => [h.name, h.preis, h.ab])).toEqual([
      ['Zelt', 0, 1],
      ['Hütte', 300, 1],
      ['Holzhaus', 800, 3],
      ['Fachwerkhaus', 1800, 5],
      ['Turmhaus', 4000, 12],
    ]);
  });

  it('baut Stufe für Stufe und hört beim Turmhaus auf', () => {
    expect(hausAusbau(null, { muenzen: 0, heldenstufe: 1 })).toEqual({ geht: true, stufe: 0, preis: 0 });
    for (let s = 0; s < HAUS_MAX; s++) expect(hausAusbau(s, reich)).toMatchObject({ geht: true, stufe: s + 1 });
    expect(hausAusbau(HAUS_MAX, reich)).toMatchObject({ geht: false, grund: 'fertig' });
  });

  it('prüft erst die Heldenstufe, dann die Münzen', () => {
    expect(hausAusbau(1, { muenzen: 0, heldenstufe: 2 })).toMatchObject({ geht: false, grund: 'stufe', stufe: 2, ab: 3 });
    expect(hausAusbau(1, { muenzen: 799, heldenstufe: 3 })).toMatchObject({ geht: false, grund: 'muenzen', preis: 800 });
    expect(hausAusbau(1, { muenzen: 800, heldenstufe: 3 })).toMatchObject({ geht: true, stufe: 2, preis: 800 });
    expect(hausAusbau(3, { muenzen: 4000, heldenstufe: 11 })).toMatchObject({ grund: 'stufe', ab: 12 });
  });

  it('kennt dieselben Stufen, Preise und Heldenstufen wie der Server', () => {
    const sql = readFileSync('supabase/migrations/20261203_lernquest_haeuser.sql', 'utf8');
    expect(sql).toContain(`stufe between 0 and ${HAUS_MAX}`);
    expect(sql).toContain(`array[${HAUS_STUFEN.map((h) => h.preis).join(', ')}]`);
    expect(sql).toContain(`array[${HAUS_STUFEN.map((h) => h.ab).join(', ')}]`);
  });
});

describe('Zelt-Quiz', () => {
  it('hat genug eindeutige Fragen mit drei Antworten', () => {
    expect(ZELT_FRAGEN.length).toBeGreaterThanOrEqual(ZELT_RUNDE * 2);
    expect(new Set(ZELT_FRAGEN.map((f) => f.frage)).size).toBe(ZELT_FRAGEN.length);
    for (const f of ZELT_FRAGEN) {
      expect(new Set(f.optionen).size, f.frage).toBe(3);
      expect(f.optionen[f.richtig], f.frage).toBeTruthy();
      expect(f.warum.length, f.frage).toBeGreaterThan(10);
    }
    // The right answer is not always in the same place.
    expect(new Set(ZELT_FRAGEN.map((f) => f.richtig)).size).toBe(3);
  });

  it('zieht fünf verschiedene Fragen, ab vier richtig steht das Zelt', () => {
    let x = 0.3;
    const f = zeltFragen(() => (x = (x * 7.13) % 1));
    expect(f).toHaveLength(ZELT_RUNDE);
    expect(new Set(f).size).toBe(ZELT_RUNDE);
    expect(ZELT_RICHTIG_AB).toBe(4);
    expect(zeltBestanden(3)).toBe(false);
    expect(zeltBestanden(4)).toBe(true);
  });
});
