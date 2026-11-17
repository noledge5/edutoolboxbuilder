import { describe, expect, it } from 'vitest';
import { schleife, SCHRITTE, TAKTE } from './musik';

describe('Kampfmusik', () => {
  const e = schleife();
  it('füllt vier Takte und bleibt in der Schleife', () => {
    expect(Math.min(...e.map((x) => x.schritt))).toBe(0);
    for (const x of e) expect(x.schritt + x.laenge).toBeLessThanOrEqual(SCHRITTE * TAKTE);
    for (let t = 0; t < TAKTE; t++) {
      const takt = e.filter((x) => Math.floor(x.schritt / SCHRITTE) === t);
      for (const spur of ['bass', 'lead', 'kick', 'snare', 'hihat']) expect(takt.some((x) => x.spur === spur), `${t} ${spur}`).toBe(true);
    }
  });
  it('spielt Töne in hörbarer, nicht schriller Lage', () => {
    for (const x of e.filter((y) => y.spur === 'bass' || y.spur === 'lead')) {
      expect(x.freq).toBeGreaterThan(80);
      expect(x.freq).toBeLessThan(1100);
    }
  });
});
