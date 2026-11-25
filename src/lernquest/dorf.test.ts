import { describe, expect, it } from 'vitest';
import {
  AUSSEHEN,
  AUSSEHEN_TEILE,
  aussehenAuto,
  aussehenGueltig,
  aussehenVon,
  DORF_GEBAEUDE,
  DORF_STUFEN,
  dorfStufe,
  HAUS_MAX,
  HAUS_STUFEN,
  hausAusbau,
  istAbend,
  istWinter,
  naechsteDorfStufe,
  spendeMoeglich,
  spendeNoetig,
  spendeWert,
  SPENDE_WOCHE,
  zielVorschlag,
} from './dorf';
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

describe('Dorfstufen (Richtung A)', () => {
  it('wächst mit den fertigen Gemeinschaftsgebäuden vom Weiler zur Stadt', () => {
    expect(DORF_STUFEN.map((s) => [s.name, s.ab])).toEqual([
      ['Weiler', 0],
      ['Dorf', 2],
      ['Marktflecken', 4],
      ['Stadt', 6],
    ]);
    expect([0, 1, 2, 3, 4, 5, 6, 9, -1].map(dorfStufe)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 0]);
    expect(naechsteDorfStufe(0)).toEqual({ name: 'Dorf', fehlt: 2 });
    expect(naechsteDorfStufe(3)).toEqual({ name: 'Marktflecken', fehlt: 1 });
    expect(naechsteDorfStufe(6)).toBeNull();
    expect(DORF_STUFEN.at(-1)!.ab).toBe(DORF_GEBAEUDE.length);
  });

  it('kennt Abend (17 bis 7 Uhr) und Winter (Dezember bis Februar)', () => {
    const um = (h: number, m = 0) => new Date(2026, 5, 1, h, m);
    expect([um(6, 59), um(7), um(16, 59), um(17), um(23, 30), um(0)].map(istAbend)).toEqual([true, false, false, true, true, true]);
    expect(Array.from({ length: 12 }, (_, m) => istWinter(new Date(2026, m, 15)))).toEqual([
      true, true, false, false, false, false, false, false, false, false, false, true,
    ]);
  });
});

describe('Häuser gestalten', () => {
  const voll = { dach: 0, wand: 1, tuer: 2, fahne: 3, zaun: 1, garten: 2, deko: 1 };

  it('nimmt genau die sieben Teile mit erlaubter Wahl an, sonst nichts', () => {
    expect(aussehenGueltig(voll, 1)).toEqual(voll);
    expect(aussehenGueltig({ ...voll, extra: 1 }, 4)).toBeNull();
    const { deko: _, ...ohne } = voll;
    expect(aussehenGueltig(ohne, 4)).toBeNull();
    expect(aussehenGueltig({ ...ohne, schmuck: 1 }, 4)).toBeNull();
    expect(aussehenGueltig({ ...voll, dach: 6 }, 4)).toBeNull();
    expect(aussehenGueltig({ ...voll, dach: -1 }, 4)).toBeNull();
    expect(aussehenGueltig({ ...voll, dach: 1.5 }, 4)).toBeNull();
    expect(aussehenGueltig({ ...voll, dach: '1' }, 4)).toBeNull();
    expect(aussehenGueltig([1, 2], 4)).toBeNull();
    expect(aussehenGueltig(null, 4)).toBeNull();
  });

  it('schaltet mehr Auswahl mit höherer Hausstufe frei', () => {
    expect(aussehenGueltig({ ...voll, dach: 5 }, 3)).toBeNull();
    expect(aussehenGueltig({ ...voll, dach: 5 }, 4)).not.toBeNull();
    expect(aussehenGueltig({ ...voll, zaun: 4 }, 2)).toBeNull();
    expect(aussehenGueltig({ ...voll, zaun: 4 }, 3)).not.toBeNull();
    // The tent: only the flag; the first choice of every other part, so it can still be saved.
    const zelt = { dach: 0, wand: 0, tuer: 0, fahne: 2, zaun: 0, garten: 0, deko: 0 };
    expect(aussehenGueltig(zelt, 0)).toEqual(zelt);
    expect(aussehenGueltig({ ...zelt, dach: 1 }, 0)).toBeNull();
    expect(aussehenGueltig({ ...zelt, zaun: 1 }, 0)).toBeNull();
    for (const t of AUSSEHEN_TEILE) expect(AUSSEHEN[t].wahl[0].ab, t).toBe(0);
    for (const t of AUSSEHEN_TEILE) {
      const ab = AUSSEHEN[t].wahl.map((w) => w.ab);
      expect(ab, t).toEqual([...ab].sort((a, b) => a - b));
      expect(Math.max(...ab), t).toBeLessThanOrEqual(HAUS_MAX);
    }
  });

  it('gibt jedem Haus ohne eigene Wahl ein festes, erlaubtes Aussehen, und die Häuser sehen verschieden aus', () => {
    for (let stufe = 0; stufe <= HAUS_MAX; stufe++)
      for (let p = 0; p < 60; p++) {
        const a = aussehenAuto(p, stufe);
        expect(aussehenGueltig(a, stufe), `${stufe}/${p}`).toEqual(a);
        expect(aussehenAuto(p, stufe)).toEqual(a);
      }
    const daecher = new Set(Array.from({ length: 40 }, (_, p) => aussehenAuto(p, HAUS_MAX).dach));
    expect(daecher.size).toBeGreaterThanOrEqual(5);
    const ganz = new Set(Array.from({ length: 30 }, (_, p) => JSON.stringify(aussehenAuto(p, 3))));
    expect(ganz.size).toBe(30);
  });

  it('zeichnet die eigene Wahl, soweit sie erlaubt ist, und füllt den Rest auf', () => {
    expect(aussehenVon(voll, 7, 1)).toEqual(voll);
    const halb = aussehenVon({ dach: 5, zaun: 1, wand: 'x' }, 7, 1);
    expect(halb.zaun).toBe(1);
    expect(halb.dach).toBe(aussehenAuto(7, 1).dach);
    expect(halb.wand).toBe(aussehenAuto(7, 1).wand);
    expect(aussehenVon(null, 3, 2)).toEqual(aussehenAuto(3, 2));
  });

  it('kennt dieselben Teile und Stufen wie der Server', () => {
    const sql = readFileSync('supabase/migrations/20261204_lernquest_haus_aussehen.sql', 'utf8');
    for (const t of AUSSEHEN_TEILE) expect(sql).toContain(`('${t}', array[${AUSSEHEN[t].wahl.map((w) => w.ab).join(', ')}])`);
    expect(sql).toContain(`jsonb_object_keys(p_aussehen)) = ${AUSSEHEN_TEILE.length}`);
    expect(sql).toContain("'aussehen', h.aussehen");
  });
});
