// Hats on the hero (27.11.2026): each names the width of the part that rests on the head, so the hero can fit it; and a
// picture of the hero makes room for every hat instead of cutting it off at the top.
import { describe, expect, it } from 'vitest';
import { HELD_AUSSCHNITT, mitHut } from '../app/heldVektor';
import { hutOben, ITEMS } from '.';

const hute = ITEMS.filter((i) => i.platz === 'hut');

describe('Hüte am Held', () => {
  it('nennen die Weite des Teils auf dem Kopf (außer Stirnbändern)', () => {
    expect(hute.filter((h) => !h.stirn && !h.weite).map((h) => h.id)).toEqual([]);
  });

  it('passen ganz ins Bild, auch beim Kopf-Ausschnitt', () => {
    for (const aus of [HELD_AUSSCHNITT.ganz, HELD_AUSSCHNITT.kopf, '20 0 200 200']) {
      const zuKurz = hute.filter((h) => {
        const oben = hutOben(h)!;
        const y = Number(mitHut(aus, oben).vb.split(' ')[1]);
        return oben < y;
      });
      expect(zuKurz.map((h) => h.id)).toEqual([]);
    }
  });

  it('ohne Hut bleibt der Ausschnitt, wie er ist', () => {
    expect(mitHut(HELD_AUSSCHNITT.ganz, null).vb).toBe(HELD_AUSSCHNITT.ganz);
  });
});
