// The rarity standard for items (27.11.2026, docs/design/prinzipien.md „Seltenheit am Teil“): rarity shows on the item
// itself, not only on its plate. Colours are read from the drawing, so a new item that breaks the standard fails here.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ITEMS } from '.';
import { P } from './stil';
import type { Item } from './typen';

const NAME = new Map(Object.entries(P).map(([k, v]) => [String(v).toUpperCase(), k]));
const svgVon = (i: Item) => renderToStaticMarkup(<>{i.zeichnung(0)}</>);
const farben = (i: Item) => new Set([...svgVon(i).matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) => NAME.get(m[1].toUpperCase()) ?? m[1]));
const hat = (i: Item, re: RegExp) => [...farben(i)].some((f) => re.test(f));

/** Gold as a material. */
const GOLD = /^gold/;
/** Gem and magic tones (not pink: that is cheeks and tongues). */
const EDEL = /^(lila|tuerkis|eis|lava|nacht|tinte)/;
/** Metal and glass. */
const METALL = /^(metall|glas|eis|wasser|blauHell|bruch|grau)/;
/** Common things that move or glow because that is what they do (a light, a flame), not to look precious. */
const LICHT = new Set(['laterne', 'holzfackel']);

const dinge = ITEMS.filter((i) => i.platz !== 'begleiter');
const tiere = ITEMS.filter((i) => i.platz === 'begleiter');
const name = (l: Item[]) => l.map((i) => i.id);

describe('Seltenheit am Teil', () => {
  it('Legendär: Gold und Bewegung', () => {
    expect(name(ITEMS.filter((i) => i.seltenheit === 5 && !(hat(i, GOLD) && i.bewegt)))).toEqual([]);
  });

  it('Episch: Gold oder Edelstein, dazu Bewegung', () => {
    expect(name(ITEMS.filter((i) => i.seltenheit === 4 && !((hat(i, GOLD) || hat(i, EDEL)) && i.bewegt)))).toEqual([]);
  });

  it('Selten: Metall, Glas oder ein magischer Akzent', () => {
    expect(name(dinge.filter((i) => i.seltenheit === 3 && !(hat(i, METALL) || hat(i, GOLD) || hat(i, EDEL))))).toEqual([]);
  });

  it('Gewöhnlich: schlichte Stoffe, kein Gold, kein Funkeln (Lichter ausgenommen)', () => {
    expect(name(dinge.filter((i) => i.seltenheit === 1 && !LICHT.has(i.id) && (hat(i, GOLD) || i.bewegt)))).toEqual([]);
  });

  it('Begleiter ab Episch bewegen sich', () => {
    expect(name(tiere.filter((i) => i.seltenheit >= 4 && !i.bewegt))).toEqual([]);
  });

  it('keine sichtbaren Linien unter 2 Einheiten', () => {
    const duenn = ITEMS.filter((i) =>
      [...svgVon(i).matchAll(/<(?:path|line|polyline|circle|ellipse)[^>]*>/g)]
        .map((m) => m[0])
        .filter((t) => /fill="none"/.test(t))
        .some((t) => Number(/stroke-width="([\d.]+)"/.exec(t)?.[1] ?? 99) < 2),
    );
    expect(name(duenn)).toEqual([]);
  });

  it('Gehaltenes ist mindestens 56 Einheiten groß', () => {
    expect(name(ITEMS.filter((i) => i.platz.startsWith('hand') && Math.max(i.rahmen[2], i.rahmen[3]) < 56))).toEqual([]);
  });
});
