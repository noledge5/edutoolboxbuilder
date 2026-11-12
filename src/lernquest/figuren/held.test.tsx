// Every part of the catalogue (src/lernquest/teile.ts), every hair, mouth, skin and hair colour has its vector drawing,
// with the same rarity, so old saved heroes show everything.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AUGEN_ARTEN, FigurBild, FRISUR_ARTEN, held, HINTERGRUENDE, ITEMS, KLEIDUNG, MUND_ARTEN } from '.';
import { HAAR_TOENE, HAUT_TOENE } from './stil';
import { FRISUREN, HAARFARBEN, HAUT, MUENDER, TEILE } from '../teile';

const PLATZ = { kopf: ['hut'], werkzeug: ['hand-rechts', 'hand-links'], begleiter: ['begleiter'] } as const;

describe('hero', () => {
  it.each(TEILE.map((t) => [t.id, t] as const))('%s has a drawing', (_, t) => {
    if (t.slot === 'kopf' || t.slot === 'werkzeug' || t.slot === 'begleiter') {
      const item = ITEMS.find((i) => i.id === t.id);
      expect(item, t.id).toBeDefined();
      expect(PLATZ[t.slot]).toContain(item!.platz);
      expect(item!.seltenheit).toBe(t.seltenheit + 1);
    } else if (t.slot === 'augen') expect(AUGEN_ARTEN).toContain(t.id);
    else if (t.slot === 'kleidung') expect(Object.keys(KLEIDUNG)).toContain(t.id);
    else expect(HINTERGRUENDE.find((h) => h.id === t.id)?.seltenheit).toBe(t.seltenheit + 1);
  });

  it('knows every hair, mouth, skin tone and hair colour', () => {
    expect(FRISUR_ARTEN.sort()).toEqual(FRISUREN.map((f) => f.id).sort());
    expect(MUND_ARTEN.sort()).toEqual(MUENDER.map((m) => m.id).sort());
    expect(HAUT_TOENE.map((t) => t.farbe)).toEqual(HAUT);
    expect(HAAR_TOENE.map((t) => t.farbe)).toEqual(HAARFARBEN.map((h) => h.farbe));
  });

  it('draws every look, falls back for unknown ids and keeps one object per look', () => {
    for (const k of Object.keys(KLEIDUNG))
      for (const augen of AUGEN_ARTEN) {
        const svg = renderToStaticMarkup(<FigurBild figur={held({ kleidung: k, augen })} zeit={0.5} />);
        expect(svg, `${k} ${augen}`).not.toMatch(/NaN|undefined/);
      }
    expect(held({ haut: 9, frisur: 'gibtsnicht', kleidung: 'x', augen: 'y', mund: 'z', haarfarbe: -1 })).toBe(held());
    expect(held({ frisur: 'zopf' })).toBe(held({ frisur: 'zopf' }));
  });

  it('backgrounds say so when they move by themselves', () => {
    for (const h of HINTERGRUENDE) {
      const a = renderToStaticMarkup(<svg>{h.zeichnung(0)}</svg>);
      const b = renderToStaticMarkup(<svg>{h.zeichnung(0.7)}</svg>);
      expect(a !== b, h.id).toBe(!!h.bewegt);
      expect(a).not.toMatch(/NaN|undefined/);
    }
  });
});
