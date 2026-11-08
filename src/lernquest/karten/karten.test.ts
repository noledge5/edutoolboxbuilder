import { describe, expect, it } from 'vitest';
import { drehen, erkennen, KARTEN_MAX, MUSTER, zellen, type Antwort } from './code';
import { kartenLesen } from './lesen';
import { kartenNummern, mergeLehrkraft, readLehrkraft, sameLehrkraft } from '../lehrkraft';

const ones = (v: number) => v.toString(2).split('1').length - 1;

interface Karte {
  nummer: number;
  /** Centre and side of the black square in pixels. */
  x: number;
  y: number;
  seite: number;
  /** Turned clockwise on screen, in degrees. */
  grad: number;
  /** Squeezed vertically (card tilted away), 1 = flat. */
  kippen?: number;
}

/** A grey picture with cards drawn as printed (white paper around the square), light falling off to one side. */
function bild(w: number, h: number, karten: Karte[], rauschen = 0, seed = 1): Uint8Array {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = 120 + (60 * x) / w;
  for (const k of karten) {
    const a = (k.grad * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const c = zellen(k.nummer);
    const reach = k.seite;
    for (let y = Math.floor(k.y - reach); y <= k.y + reach; y++)
      for (let x = Math.floor(k.x - reach); x <= k.x + reach; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        let sum = 0;
        let hit = 0;
        for (const [ox, oy] of [
          [0.25, 0.25],
          [0.75, 0.25],
          [0.25, 0.75],
          [0.75, 0.75],
        ]) {
          // Back from the picture to the card (units: the black square is -0.5 … 0.5).
          const dx = x + ox - k.x;
          const dy = (y + oy - k.y) / (k.kippen ?? 1);
          const u = (dx * cos + dy * sin) / k.seite;
          const v = (-dx * sin + dy * cos) / k.seite;
          if (Math.abs(u) > 0.8 || Math.abs(v) > 0.8) continue;
          hit++;
          let val = 235;
          if (Math.abs(u) < 0.5 && Math.abs(v) < 0.5) {
            const cx = Math.floor((u + 0.5) * 6);
            const cy = Math.floor((v + 0.5) * 6);
            const border = cx === 0 || cy === 0 || cx === 5 || cy === 5;
            val = border || !c[cy - 1][cx - 1] ? 25 : 235;
          }
          sum += val;
        }
        if (hit) g[y * w + x] = Math.round((sum + (4 - hit) * g[y * w + x]) / 4);
      }
  }
  if (rauschen) for (let i = 0; i < g.length; i++) g[i] = Math.max(0, Math.min(255, g[i] + (rnd() - 0.5) * 2 * rauschen));
  return g;
}

const ANTWORT_BEI: Record<number, Antwort> = { 0: 'A', 90: 'D', 180: 'C', 270: 'B' };

describe('Kartenmuster', () => {
  it('has 63 cards that differ from each other and from their own turns in at least 4 cells', () => {
    expect(MUSTER).toHaveLength(KARTEN_MAX);
    const turns = MUSTER.map((c) => [c, drehen(c), drehen(drehen(c)), drehen(drehen(drehen(c)))]);
    for (let i = 0; i < turns.length; i++) {
      for (let k = 1; k < 4; k++) expect(ones(turns[i][0] ^ turns[i][k])).toBeGreaterThanOrEqual(4);
      for (let j = 0; j < i; j++) for (const t of turns[i]) expect(ones(MUSTER[j] ^ t)).toBeGreaterThanOrEqual(4);
    }
  });

  it('turning four times gives the card back', () => {
    for (const c of MUSTER) expect(drehen(drehen(drehen(drehen(c))))).toBe(c);
  });

  it('corrects one wrong cell and refuses two', () => {
    const c = MUSTER[9];
    expect(erkennen(drehen(c))).toEqual({ nummer: 10, drehung: 1 });
    expect(erkennen(c ^ 0b100)).toEqual({ nummer: 10, drehung: 0 });
    expect(erkennen(c ^ 0b101)).toBeNull();
  });
});

describe('Karten lesen', () => {
  it('reads the four answers of a straight card', () => {
    for (const grad of [0, 90, 180, 270]) {
      const t = kartenLesen(bild(320, 240, [{ nummer: 7, x: 160, y: 120, seite: 80, grad }]), 320, 240);
      expect(t.map((x) => [x.nummer, x.antwort])).toEqual([[7, ANTWORT_BEI[grad]]]);
    }
  });

  it('reads a whole class: 30 small, slanted, tilted cards with noise', () => {
    const karten: Karte[] = [];
    const want: [number, Antwort][] = [];
    for (let i = 0; i < 30; i++) {
      const base = [0, 90, 180, 270][i % 4];
      const grad = base + ((i * 7) % 31) - 15;
      karten.push({ nummer: i + 1, x: 70 + (i % 6) * 140, y: 70 + Math.floor(i / 6) * 120, seite: 40 + (i % 5) * 8, grad, kippen: 1 - (i % 3) * 0.15 });
      want.push([i + 1, ANTWORT_BEI[base]]);
    }
    const t = kartenLesen(bild(900, 640, karten, 12), 900, 640);
    expect(t.map((x) => [x.nummer, x.antwort])).toEqual(want);
  });

  it('reads small cards of about 3 pixels per cell', () => {
    const t = kartenLesen(bild(200, 120, [{ nummer: 63, x: 50, y: 60, seite: 20, grad: 8 }, { nummer: 2, x: 150, y: 60, seite: 22, grad: 185 }]), 200, 120);
    expect(t.map((x) => [x.nummer, x.antwort])).toEqual([
      [2, 'C'],
      [63, 'A'],
    ]);
  });

  it('gives the corners of the card as printed', () => {
    const [t] = kartenLesen(bild(320, 240, [{ nummer: 3, x: 160, y: 120, seite: 100, grad: 90 }]), 320, 240);
    // Turned a quarter clockwise: the printed top left corner is now top right on screen.
    const [tl] = t.ecken;
    expect(tl[0]).toBeGreaterThan(190);
    expect(tl[1]).toBeLessThan(90);
  });

  it('finds nothing in noise, plain squares or a half hidden card', () => {
    const w = 400;
    const h = 300;
    expect(kartenLesen(bild(w, h, [], 60), w, h)).toEqual([]);
    const g = bild(w, h, []);
    for (let y = 50; y < 150; y++) for (let x = 50; x < 150; x++) g[y * w + x] = 20;
    expect(kartenLesen(g, w, h)).toEqual([]);
    const half = bild(w, h, [{ nummer: 5, x: 200, y: 150, seite: 100, grad: 0 }]);
    for (let y = 0; y < h; y++) for (let x = 200; x < w; x++) half[y * w + x] = 140;
    expect(kartenLesen(half, w, h)).toEqual([]);
  });
});

describe('Kartennummern', () => {
  it('keeps numbers, fills gaps, frees the numbers of children gone for good', () => {
    expect(kartenNummern(['a', 'b', 'c'])).toEqual({ a: 1, b: 2, c: 3 });
    expect(kartenNummern(['a', 'c', 'd'], { a: 1, b: 2, c: 3 })).toEqual({ a: 1, c: 3, d: 2 });
    const voll = Array.from({ length: 70 }, (_, i) => `k${i}`);
    expect(Object.keys(kartenNummern(voll))).toHaveLength(63);
  });

  it('travels with the teacher record and the newer numbering of a class wins', () => {
    const key = 'a'.repeat(64);
    expect(readLehrkraft({ keys: [key], karten: { k1: { x: 3, y: 0, z: 'b', w: 64 } }, updatedAt: 1 })?.karten).toEqual({ k1: { x: 3 } });
    const alt = readLehrkraft({ keys: [key], karten: { k1: { x: 1 }, k2: { y: 2 } }, updatedAt: 1 })!;
    const neu = readLehrkraft({ keys: [key], karten: { k1: { x: 5 } }, updatedAt: 2 })!;
    expect(mergeLehrkraft(alt, neu).karten).toEqual({ k1: { x: 5 }, k2: { y: 2 } });
    expect(sameLehrkraft(alt, { ...alt, karten: {} })).toBe(false);
  });
});
