// The teacher's values for every part and hairstyle (supabase/migrations/20261121_lernquest_teile_einstellen.sql).
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  alleTeile,
  angelegt,
  bonusVon,
  FRISUREN,
  frisurAusTeil,
  frisurTeil,
  hat,
  hatFrisur,
  ladenFrisuren,
  ladenWare,
  mitWerten,
  readWerte,
  setzeWerte,
  standardTeil,
  teil,
} from './teile';

const w = (id: string, x: Partial<{ seltenheit: number; start: boolean; nurTruhe: boolean; nurLaden: boolean; aktiv: boolean; muenzen: number; herz: number; schaden: number }>) => ({
  id,
  seltenheit: 0,
  start: false,
  nurTruhe: false,
  nurLaden: false,
  aktiv: true,
  muenzen: 0,
  herz: 0,
  schaden: 0,
  ...x,
});

afterEach(() => setzeWerte({}));

describe('Werte der Teile', () => {
  it('liest nur gültige Werte', () => {
    const r = readWerte([w('krone', { seltenheit: 2, muenzen: 20, herz: 2, schaden: 3 }), { id: 'Böse', seltenheit: 1 }, { id: 'x', seltenheit: 7 }, w('y', { muenzen: 99 }), null]);
    expect(Object.keys(r)).toEqual(['krone', 'y']);
    expect(r.krone).toEqual({ seltenheit: 2, start: false, nurTruhe: false, nurLaden: false, aus: false, muenzen: 20, herz: 2, schaden: 3 });
    expect(r.y.muenzen).toBe(0);
    expect(readWerte('kaputt')).toEqual({});
  });

  it('gelten vor den eingebauten Werten', () => {
    expect(teil('krone')?.seltenheit).toBe(4);
    setzeWerte(readWerte([w('krone', { seltenheit: 1, nurLaden: true, muenzen: 5 }), w('eiskrone', { aktiv: false })]));
    const k = teil('krone')!;
    expect([k.seltenheit, k.nurLaden, k.muenzen, k.herz]).toEqual([1, true, 5, undefined]);
    expect(bonusVon({ kopf: 'krone' })).toEqual({ muenzen: 5, herz: 0, schaden: 0 });
    expect(teil('eiskrone')?.aus).toBe(true);
    // Not in the shop when it is out of the game; only-shop parts are there.
    expect(ladenWare([], 'kopf').some((t) => t.id === 'eiskrone')).toBe(false);
    expect(ladenWare([], 'kopf').some((t) => t.id === 'krone')).toBe(true);
    expect(alleTeile().find((t) => t.id === 'krone')).toEqual(mitWerten(TEILE_KRONE()));
  });

  it('nimmt als Standard das Startteil mit der kleinsten Kennung', () => {
    expect(standardTeil('kleidung')?.id).toBe('tshirt');
    setzeWerte(readWerte([w('pulli', { start: true })]));
    expect(standardTeil('kleidung')?.id).toBe('pulli');
    expect(angelegt({}, 'kleidung')?.id).toBe('pulli');
    expect(angelegt({ kleidung: 'tshirt' }, 'kleidung')?.id).toBe('tshirt');
    expect(hat([], teil('pulli')!)).toBe(true);
  });
});

describe('Frisuren als Teile', () => {
  it('sind ohne Werte vom Server alle frei', () => {
    expect(FRISUREN.every((f) => hatFrisur([], f.id))).toBe(true);
    expect(ladenFrisuren([])).toEqual([]);
  });

  it('kommen aus Laden oder Truhe, wenn die Lehrkraft es so einstellt', () => {
    setzeWerte(readWerte([w('frisur-locken', { seltenheit: 1, nurLaden: true }), w('frisur-dutt', { seltenheit: 3, nurTruhe: true }), w('frisur-bob', { aktiv: false })]));
    expect(hatFrisur([], 'locken')).toBe(false);
    expect(hatFrisur(['frisur-locken'], 'locken')).toBe(true);
    // Worn already: kept.
    expect(hatFrisur([], 'locken', { frisur: 'locken' })).toBe(true);
    expect(hatFrisur([], 'kurz')).toBe(true);
    expect(ladenFrisuren([]).map((x) => x.f.id)).toEqual(['locken']);
    expect(ladenFrisuren(['frisur-locken'])).toEqual([]);
    expect(frisurTeil({ id: 'dutt', name: 'Dutt' })).toMatchObject({ id: 'frisur-dutt', seltenheit: 3, nurTruhe: true });
    expect(frisurAusTeil('frisur-dutt')?.name).toBe('Dutt');
    expect(frisurAusTeil('krone')).toBeUndefined();
    expect(frisurAusTeil(null)).toBeUndefined();
  });

  it('stehen alle im Server-Katalog', () => {
    const sql = readFileSync(new URL('../../supabase/migrations/20261121_lernquest_teile_einstellen.sql', import.meta.url), 'utf8');
    const ids = [...sql.matchAll(/\('frisur-([a-z0-9]+)', 'frisur', 0, true, 0, 0, 0, false, '([^']+)', false\)/g)].map((m) => [m[1], m[2]]);
    expect(ids).toEqual(FRISUREN.map((f) => [f.id, f.name]));
  });
});

const TEILE_KRONE = () => ({ id: 'krone', slot: 'kopf' as const, name: 'Krone', seltenheit: 4, muenzen: 10, herz: 1 });
