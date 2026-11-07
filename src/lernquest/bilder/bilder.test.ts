// Painted hero pictures (docs/design/lernquest/bilder.md): prompts for every part, the pixel work of
// `npm run lq:bilder`, and the finished files in src/lernquest/app/teile/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FIGUR_DATEI, HAUT, TEILE } from '../teile';
import {
  aenderung,
  einpassen,
  freistellen,
  hautUmfaerben,
  istHaut,
  sichtbar,
  verschieben,
  verschiebung,
  type Rgb,
} from './pixel';
import { BESCHREIBUNG, EBENE_GROESSE, editListe, editPrompt, PLAETZE, prompt, promptListe } from './vorlagen';

/** A w × h picture in one colour, with a square of another colour. */
function bild(w: number, h: number, grund: Rgb, flecken: { x: number; y: number; s: number; farbe: Rgb }[]) {
  const px = new Uint8Array(w * h * 4);
  for (let p = 0; p < w * h; p++) px.set([...grund, 255], p * 4);
  for (const f of flecken)
    for (let y = f.y; y < f.y + f.s; y++)
      for (let x = f.x; x < f.x + f.s; x++) px.set([...f.farbe, 255], (y * w + x) * 4);
  return px;
}
/** Width and height from a WebP header: VP8X (with alpha), VP8 (lossy, opaque like a background) or VP8L. */
function webpGroesse(b: Buffer): [number, number] {
  const art = b.toString('latin1', 12, 16);
  if (art === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  if (art === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  const bits = b.readUInt32LE(21);
  return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
}
const alpha = (px: Uint8Array, w: number, x: number, y: number) => px[(y * w + x) * 4 + 3];

describe('Prompts', () => {
  it('every part has a description, and only parts of the catalogue', () => {
    expect(TEILE.filter((t) => !BESCHREIBUNG[t.id]).map((t) => t.id)).toEqual([]);
    expect(Object.keys(BESCHREIBUNG).filter((id) => !TEILE.some((t) => t.id === id))).toEqual([]);
  });
  it('every prompt carries the style and the rarity', () => {
    const krone = prompt(TEILE.find((t) => t.id === 'krone')!);
    expect(krone).toMatch(/^A royal golden crown/);
    expect(krone).toContain('legendary treasure');
    expect(krone).toContain('soft painted digital illustration');
  });
  it('prompts.md and edit-prompts.md are up to date (else: npm run lq:bilder -- --prompts)', () => {
    const lies = (f: string) =>
      readFileSync(new URL(`../../../docs/design/lernquest/bilder/${f}`, import.meta.url), 'utf8');
    expect(lies('prompts.md')).toBe(promptListe());
    expect(lies('edit-prompts.md')).toBe(editListe());
  });
  it('has an edit instruction for every part on the figure, none for backgrounds', () => {
    for (const t of TEILE) expect(!!editPrompt(t), t.id).toBe(t.slot !== 'hintergrund');
    expect(editPrompt(TEILE.find((t) => t.id === 'kappe')!)).toMatch(
      /^Put a sporty red baseball cap .* on the character's head.*Do not move, crop or zoom/,
    );
  });
});

describe('Pixel', () => {
  const grau: Rgb = [217, 217, 217];
  it('cuts the border background away and keeps a grey spot inside the part', () => {
    const px = bild(40, 40, grau, [
      { x: 10, y: 10, s: 20, farbe: [200, 30, 30] },
      { x: 18, y: 18, s: 4, farbe: grau },
    ]);
    freistellen(px, 40, 40);
    expect(alpha(px, 40, 0, 0)).toBe(0);
    expect(alpha(px, 40, 15, 15)).toBe(255);
    expect(alpha(px, 40, 19, 19)).toBe(255);
    expect(sichtbar(px, 40, 40)).toEqual({ x: 10, y: 10, w: 20, h: 20 });
  });
  it('with `loecher` also takes enclosed background, but not tiny spots', () => {
    const px = bild(100, 100, grau, [{ x: 10, y: 10, s: 80, farbe: [30, 30, 200] }]);
    for (let y = 30; y < 70; y++) for (let x = 30; x < 70; x++) px.set([...grau, 255], (y * 100 + x) * 4); // a hole
    px.set([...grau, 255], (15 * 100 + 15) * 4); // a one-pixel spot
    freistellen(px, 100, 100, 36, true);
    expect(alpha(px, 100, 50, 50)).toBe(0);
    expect(alpha(px, 100, 15, 15)).toBe(255);
  });
  it('fits a part into its place: width first, within the height, anchored at the bottom middle', () => {
    const kopf = PLAETZE.kopf;
    const z = einpassen(200, 100, kopf, 480);
    expect(z.width).toBe(kopf.breite * 2);
    expect(z.left + z.width / 2).toBe(kopf.x * 2);
    expect(z.top + z.height).toBe(kopf.y * 2);
    const hoch = einpassen(100, 400, kopf, 480);
    expect(hoch.height).toBe(kopf.hoehe * 2);
    const klein = einpassen(200, 100, kopf, 480, { s: 0.5, dy: 4 });
    expect(klein.width).toBe(z.width / 2);
    expect(klein.top + klein.height).toBe((kopf.y + 4) * 2);
  });
  it('recolours skin with its shading and leaves hair and clothes alone', () => {
    const haut: Rgb = [242, 201, 160];
    const schatten: Rgb = [194, 161, 128];
    const haar: Rgb = [74, 46, 26];
    expect(istHaut(...haut, haut)).toBe(true);
    expect(istHaut(...schatten, haut)).toBe(true);
    expect(istHaut(...haar, haut)).toBe(false);
    expect(istHaut(47, 111, 219, haut)).toBe(false);
    const px = new Uint8Array([...haut, 255, ...schatten, 255, ...haar, 255]);
    const ziel: Rgb = [122, 78, 46];
    const out = hautUmfaerben(px, haut, ziel);
    expect([...out.slice(0, 3)]).toEqual(ziel);
    expect(out[4]).toBeLessThan(ziel[0]);
    expect([...out.slice(8, 11)]).toEqual(haar);
  });
});

describe('Edit pictures', () => {
  const grau: Rgb = [217, 217, 217];
  // The base: a "figure" (dark square) on grey; the edit adds a "hat" (yellow, with a part in the base colour inside),
  // is a little lighter, has a speck and a thin line, and moved by 3 px right and 2 down.
  const W = 120;
  const basis = bild(W, W, grau, [{ x: 40, y: 40, s: 40, farbe: [74, 46, 26] }]);
  const neu = bild(
    W,
    W,
    [221, 221, 221],
    [
      { x: 40, y: 40, s: 40, farbe: [78, 50, 30] },
      { x: 40, y: 20, s: 40, farbe: [255, 197, 49] },
      { x: 55, y: 28, s: 6, farbe: grau },
      { x: 100, y: 100, s: 1, farbe: [0, 0, 255] },
    ],
  );
  for (let y = 5; y < 90; y++) neu.set([0, 0, 0, 255], (y * W + 95) * 4);
  const bewegt = new Uint8Array(neu.length);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++)
      bewegt.set(
        neu.subarray(
          (Math.max(0, y - 2) * W + Math.max(0, x - 3)) * 4,
          (Math.max(0, y - 2) * W + Math.max(0, x - 3)) * 4 + 4,
        ),
        (y * W + x) * 4,
      );

  it('finds how far the edit moved, without being pulled by the new part', () => {
    expect(verschiebung(basis, bewegt, W, W, 8, { x: 30, y: 10, w: 60, h: 56 })).toEqual({ dx: 3, dy: 2 });
  });
  it('keeps only the change: no figure, no background, no specks or thin lines, holes filled', () => {
    const zurueck = verschieben(bewegt, W, W, 3, 2);
    const ebene = aenderung(basis, zurueck, W, W, { x: 0, y: 0, w: W, h: W });
    expect(alpha(ebene, W, 45, 25)).toBe(255); // the hat
    expect(alpha(ebene, W, 57, 30)).toBe(255); // a base-coloured spot inside the hat stays part of it
    expect(alpha(ebene, W, 50, 60)).toBe(0); // the figure (only a little lighter)
    expect(alpha(ebene, W, 10, 10)).toBe(0); // the background
    expect(alpha(ebene, W, 100, 100)).toBe(0); // a speck
    expect(alpha(ebene, W, 95, 60)).toBe(0); // a one-pixel line
  });
});

describe('Finished pictures (src/lernquest/app/teile/)', () => {
  const ordner = new URL('../app/teile/', import.meta.url);
  const dateien = readdirSync(ordner).filter((f) => f.endsWith('.webp'));
  it('are named after a part or the base figure', () => {
    const erlaubt = new Set([
      ...TEILE.map((t) => t.id),
      ...FIGUR_DATEI.flatMap((f) => HAUT.map((_, i) => `${f}-${i}`)),
    ]);
    expect(dateien.filter((f) => !erlaubt.has(f.slice(0, -5)))).toEqual([]);
  });
  it('have each base figure in every skin tone or not at all', () => {
    for (const figur of FIGUR_DATEI)
      expect([0, HAUT.length], figur).toContain(dateien.filter((f) => f.startsWith(`${figur}-`)).length);
  });
  it('are whole layers of 480 × 480 and small enough for phones', () => {
    for (const f of dateien) {
      const b = readFileSync(new URL(f, ordner));
      expect(b.toString('latin1', 0, 4) + b.toString('latin1', 8, 12), f).toBe('RIFFWEBP');
      expect(webpGroesse(b), f).toEqual([EBENE_GROESSE, EBENE_GROESSE]);
      expect(statSync(new URL(f, ordner)).size, f).toBeLessThan(150_000);
    }
  });
});
