import { describe, expect, it } from 'vitest';
import {
  aufGrund,
  deko,
  GRUND,
  GRUND_HALB,
  grundstuecke,
  JE_VIERTEL,
  KARTE_BREITE,
  laternen,
  MAUER,
  plaetzchen,
  rahmen,
  schirm,
  WEG_HALB,
  WEG_START,
  wegEnde,
  wegX,
  welt,
  wasser,
} from './dorfplan';

const GROESSEN = [0, 1, 5, 6, 7, 30, 200];

describe('Dorfkarte im Hochformat: Aufbau', () => {
  it('rechnet zwischen Bildschirm und Welt hin und zurück', () => {
    for (const [x, y] of [[0, 0], [100, -40], [-73, 12]]) {
      const [a, b] = welt(...schirm(x, y));
      expect(a).toBeCloseTo(x, 6);
      expect(b).toBeCloseTo(y, 6);
    }
  });

  it.each(GROESSEN)('legt %i Grundstücke ohne Überlappung an, abseits von Weg, Platz und Mauer, auf der Karte', (n) => {
    const g = grundstuecke(n);
    expect(g).toHaveLength(n);
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++)
        expect(Math.abs(g[i].x - g[j].x) < GRUND && Math.abs(g[i].y - g[j].y) < GRUND, `${i}/${j}`).toBe(false);
    for (const p of g) {
      // The road band never touches the plot's diamond.
      for (let dy = -GRUND_HALB[1]; dy <= GRUND_HALB[1]; dy += 1) {
        const y = p.sy + dy;
        const halb = GRUND_HALB[0] * (1 - Math.abs(dy) / GRUND_HALB[1]);
        const abstand = Math.abs(p.sx - wegX(y)) - halb;
        expect(abstand, `${n}: ${p.sx}/${y}`).toBeGreaterThanOrEqual(WEG_HALB);
      }
      expect(Math.abs(p.sx) + GRUND_HALB[0], 'auf der Karte').toBeLessThanOrEqual(KARTE_BREITE / 2);
      expect(p.sy + GRUND_HALB[1], 'über Platz und Mauer').toBeLessThan(MAUER.eckeL[1] - 20);
    }
  });

  it('wächst nur nach oben und verträgt Unsinn', () => {
    const unten = (n: number) => rahmen(n)[1] + rahmen(n)[3];
    for (const n of GROESSEN) {
      expect(unten(n)).toBe(unten(0));
      expect(rahmen(n)[2]).toBe(KARTE_BREITE);
    }
    expect(rahmen(30)[1]).toBeLessThan(rahmen(6)[1]);
    expect(rahmen(6)[1]).toBeLessThan(rahmen(0)[1]);
    expect(rahmen(Number.NaN)).toEqual(rahmen(0));
    expect(rahmen(-4)).toEqual(rahmen(0));
    expect(rahmen(1e9)).toEqual(rahmen(200));
    expect(wegEnde(30)).toBeLessThan(grundstuecke(30).at(-1)!.sy);
    expect(wegX(WEG_START + 10)).toBe(0);
  });

  it('setzt nach je sechs Grundstücken einen kleinen Platz, nur wenn danach noch welche kommen', () => {
    expect(plaetzchen(6)).toHaveLength(0);
    expect(plaetzchen(7)).toHaveLength(1);
    expect(plaetzchen(30)).toHaveLength(Math.ceil(30 / JE_VIERTEL) - 1);
    for (const q of plaetzchen(30)) for (const p of grundstuecke(30)) expect(aufGrund(p, q, 20)).toBe(false);
  });

  it.each(GROESSEN)('stellt Laternen und Deko (%i) nicht auf Grundstücke oder den Weg, und Bäume nie vor ein Haus', (n) => {
    const g = grundstuecke(n);
    for (const l of laternen(n)) {
      expect(g.some((p) => aufGrund(p, l, 2))).toBe(false);
      expect(Math.abs(l[0] - wegX(l[1]))).toBeGreaterThanOrEqual(WEG_HALB);
    }
    const d = deko(n);
    for (const x of d) {
      expect(g.some((p) => aufGrund(p, x.p))).toBe(false);
      if (x.p[1] >= wegEnde(n)) expect(Math.abs(x.p[0] - wegX(x.p[1])), JSON.stringify(x)).toBeGreaterThan(WEG_HALB);
      if (x.art === 'baum')
        expect(g.some((p) => Math.abs(x.p[0] - p.sx) < GRUND_HALB[0] && x.p[1] > p.sy && x.p[1] - p.sy < 60)).toBe(false);
    }
    expect(deko(n)).toEqual(d);
    expect(wasser(n).length).toBeGreaterThan(0);
  });

  it('hat bei 30 Kindern genug Grün', () => {
    const d = deko(30);
    expect(d.filter((x) => x.art === 'baum').length).toBeGreaterThanOrEqual(6);
    expect(d.filter((x) => x.art === 'blume').length).toBeGreaterThanOrEqual(15);
  });
});
