import { describe, expect, it } from 'vitest';
import { zaehlerDauer, zaehlerWert } from './zaehler';

describe('Zähler', () => {
  it('beginnt beim Start und endet genau beim Ziel', () => {
    expect(zaehlerWert(0, 42, 0, 800)).toBe(0);
    expect(zaehlerWert(0, 42, 800, 800)).toBe(42);
    expect(zaehlerWert(0, 42, 5000, 800)).toBe(42);
    expect(zaehlerWert(120, 155, -10, 800)).toBe(120);
  });

  it('steigt nur, in ganzen Zahlen, schnell zu Beginn', () => {
    const werte = Array.from({ length: 41 }, (_, i) => zaehlerWert(0, 100, i * 20, 800));
    expect(werte.every((w, i) => i === 0 || w >= werte[i - 1])).toBe(true);
    expect(werte.every((w) => Number.isInteger(w))).toBe(true);
    expect(zaehlerWert(0, 100, 400, 800)).toBeGreaterThan(80);
  });

  it('zählt auch abwärts und kennt keine Dauer null', () => {
    expect(zaehlerWert(50, 20, 400, 800)).toBeLessThan(50);
    expect(zaehlerWert(50, 20, 400, 0)).toBe(20);
  });

  it('dauert kurz für wenig und höchstens 1,2 s', () => {
    expect(zaehlerDauer(0, 5)).toBe(410);
    expect(zaehlerDauer(0, 300)).toBe(1200);
    expect(zaehlerDauer(80, 30)).toBe(950);
  });
});
