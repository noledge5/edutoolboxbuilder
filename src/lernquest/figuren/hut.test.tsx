// Hats and companions on the hero (27.11.2026): each hat names the width of the part that rests on the head, so the
// hero can fit it; and a picture of the hero makes room for every hat, every companion and a jump instead of cutting
// them off.
import { describe, expect, it } from 'vitest';
import { HELD_AUSSCHNITT, mitPlatz } from '../app/heldVektor';
import { heldRaum, hutOben, ITEMS } from '.';

const hute = ITEMS.filter((i) => i.platz === 'hut');
const tiere = ITEMS.filter((i) => i.platz === 'begleiter');
const box = (vb: string) => vb.split(' ').map(Number);

describe('Hüte und Begleiter am Held', () => {
  it('Hüte nennen die Weite des Teils auf dem Kopf (außer Stirnbändern)', () => {
    expect(hute.filter((h) => !h.stirn && !h.weite).map((h) => h.id)).toEqual([]);
  });

  it('jeder Hut passt ganz ins Bild, auch beim Kopf-Ausschnitt', () => {
    for (const aus of [HELD_AUSSCHNITT.ganz, HELD_AUSSCHNITT.kopf, '20 0 200 200']) {
      const zuKurz = hute.filter((h) => hutOben(h)! < box(mitPlatz(aus, { oben: hutOben(h) }).vb)[1]);
      expect(zuKurz.map((h) => h.id)).toEqual([]);
    }
  });

  it('jeder Begleiter passt ganz ins Bild des ganzen Helden', () => {
    const zuEng = tiere.filter((t) => {
      const raum = heldRaum('kurz', [t]);
      return raum.links! < box(mitPlatz(HELD_AUSSCHNITT.ganz, raum).vb)[0];
    });
    expect(zuEng.map((t) => t.id)).toEqual([]);
  });

  it('hohes Haar und ein Sprung passen ins Bild', () => {
    const { oben } = heldRaum('dutt', []);
    expect(box(mitPlatz(HELD_AUSSCHNITT.ganz, { oben: oben - 30 }).vb)[1]).toBeLessThan(oben - 30);
  });

  it('ohne Hut, Begleiter und Sprung bleibt der Ausschnitt, wie er ist', () => {
    expect(mitPlatz(HELD_AUSSCHNITT.ganz, heldRaum('kurz', [])).vb).toBe(HELD_AUSSCHNITT.ganz);
  });
});
