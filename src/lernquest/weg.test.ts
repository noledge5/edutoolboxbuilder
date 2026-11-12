import { describe, expect, it } from 'vitest';
import { WEG_BREITE, wegPlan } from './weg';

describe('wegPlan', () => {
  it('puts the waypoints top to bottom inside the picture, swinging left and right', () => {
    const w = wegPlan(5, false, 'r1');
    expect(w.punkte).toHaveLength(5);
    for (let i = 1; i < 5; i++) expect(w.punkte[i].y).toBeGreaterThan(w.punkte[i - 1].y);
    for (const p of w.punkte) {
      expect(p.x).toBeGreaterThanOrEqual(60);
      expect(p.x).toBeLessThanOrEqual(WEG_BREITE - 60);
    }
    expect(new Set(w.punkte.map((p) => p.x)).size).toBeGreaterThan(1);
    expect(w.hoehe).toBeGreaterThan(w.punkte[4].y);
    expect(w.burg.y).toBeLessThan(w.punkte[0].y);
  });

  it('starts the path at the castle and passes through every waypoint', () => {
    const w = wegPlan(4, true, 'r2');
    expect(w.pfad.startsWith(`M${w.burg.x} ${w.burg.y}`)).toBe(true);
    for (const p of w.punkte) expect(w.pfad).toContain(` ${p.x} ${p.y}`);
  });

  it('centres the Meilenstein in front of the boss castle and makes room for it', () => {
    const ohne = wegPlan(3, false, 'r');
    const mit = wegPlan(3, true, 'r');
    expect(ohne.boss).toBeUndefined();
    expect(mit.boss).toBeDefined();
    expect(mit.punkte[2].x).toBe(WEG_BREITE / 2);
    expect(mit.punkte[2].y - mit.punkte[1].y).toBeGreaterThan(ohne.punkte[2].y - ohne.punkte[1].y);
  });

  it('plants trees clear of the waypoints, inside the picture, back to front, the same every time', () => {
    const w = wegPlan(6, true, 'modul-7');
    expect(w.deko.length).toBeGreaterThan(8);
    for (const d of w.deko) {
      for (const p of w.punkte) {
        expect(Math.hypot(d.x - p.x, d.y - p.y)).toBeGreaterThanOrEqual(58);
        // nothing stands on the label under a waypoint
        expect(Math.abs(d.x - p.x) < 78 && d.y > p.y && d.y < p.y + 80).toBe(false);
      }
      expect(d.x).toBeGreaterThan(0);
      expect(d.x).toBeLessThan(WEG_BREITE);
      expect(d.y).toBeLessThan(w.hoehe);
    }
    expect(w.deko.map((d) => d.y)).toEqual([...w.deko.map((d) => d.y)].sort((a, b) => a - b));
    expect(wegPlan(6, true, 'modul-7')).toEqual(w);
    expect(wegPlan(6, true, 'modul-8').deko).not.toEqual(w.deko);
  });

  it('copes with an empty region', () => {
    const w = wegPlan(0, false, 'leer');
    expect(w.punkte).toEqual([]);
    expect(w.pfad).toBe(`M${w.burg.x} ${w.burg.y}`);
    expect(w.hoehe).toBeGreaterThan(w.burg.y);
  });
});
