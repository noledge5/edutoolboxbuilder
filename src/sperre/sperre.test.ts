import { describe, expect, it } from 'vitest';
import { codeFehler, FREIE_VERSUCHE, leseSperre, neueSperre, pruefe, wartezeit } from './sperre';

describe('Sperre des Baukastens', () => {
  it('nimmt nur sechs Ziffern, ohne Reihen und gleiche Ziffern', () => {
    expect(codeFehler('482913')).toBe('');
    expect(codeFehler('48291')).not.toBe('');
    expect(codeFehler('48291a')).not.toBe('');
    expect(codeFehler('111111')).not.toBe('');
    expect(codeFehler('123456')).not.toBe('');
    expect(codeFehler('654321')).not.toBe('');
  });

  it('speichert den Code nicht im Klartext und erkennt ihn wieder', async () => {
    const s = await neueSperre('482913');
    expect(JSON.stringify(s)).not.toContain('482913');
    expect((await pruefe(s, '482913')).ergebnis).toBe('ok');
    expect((await pruefe(s, '482914')).ergebnis).toBe('falsch');
    // Gleicher Code, anderes Salz: anderer Hash.
    expect((await neueSperre('482913')).hash).not.toBe(s.hash);
  });

  it('lässt nach fünf Fehlern warten, auch der richtige Code hilft dann nicht', async () => {
    let s = await neueSperre('482913');
    const t = 1_000_000;
    for (let i = 0; i < FREIE_VERSUCHE; i++) s = (await pruefe(s, '000001', t)).sperre;
    expect(s.fehler).toBe(FREIE_VERSUCHE);
    expect(s.bis).toBe(t + 30_000);
    expect((await pruefe(s, '482913', t + 1000)).ergebnis).toBe('warten');
    const danach = await pruefe(s, '482913', t + 31_000);
    expect(danach.ergebnis).toBe('ok');
    expect(danach.sperre).toMatchObject({ fehler: 0, bis: 0 });
  });

  it('verdoppelt die Wartezeit bis höchstens eine Stunde', () => {
    expect(wartezeit(FREIE_VERSUCHE - 1)).toBe(0);
    expect(wartezeit(FREIE_VERSUCHE)).toBe(30_000);
    expect(wartezeit(FREIE_VERSUCHE + 1)).toBe(60_000);
    expect(wartezeit(FREIE_VERSUCHE + 30)).toBe(3_600_000);
  });

  it('weist kaputte gespeicherte Daten ab', async () => {
    const s = await neueSperre('482913');
    expect(leseSperre(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(leseSperre({ salt: 'xx', hash: s.hash })).toBeNull();
    expect(leseSperre(null)).toBeNull();
  });
});
