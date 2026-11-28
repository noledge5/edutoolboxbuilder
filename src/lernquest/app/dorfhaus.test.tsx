// The own house opens „Mein Haus“, the fox invites to the tent quiz (28.11.2026).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { zeltLeer, type Dorf } from '../dorf';
import { DorfKarte } from '../figuren/dorf';
import { LEERER_STAND } from '../types';
import { MeinHaus } from './MeinHaus';

const dorf = (stufe: number | null, an = true): Dorf => ({ an: true, projekt: null, fertig: [], woche: 0, haeuser: { an, ich: 1, plaetze: [{ stufe: 2 }, { stufe }] } });

describe('moving into the village', () => {
  it('invites only with houses on and an empty own plot', () => {
    expect(zeltLeer(dorf(null))).toBe(true);
    expect(zeltLeer(dorf(0))).toBe(false);
    expect(zeltLeer(dorf(null, false))).toBe(false);
    expect(zeltLeer({ an: false, haeuser: dorf(null).haeuser })).toBe(false);
    expect(zeltLeer({ an: true, haeuser: { an: true, ich: null, plaetze: [] } })).toBe(false);
    expect(zeltLeer(null)).toBe(false);
  });

  it('makes the own house a button on the map, only when asked', () => {
    const mit = renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={2} haeuser={[{ stufe: 2 }, { stufe: 1 }]} ich={1} titel="Dorf" onIch={() => {}} />);
    expect(mit).toContain('role="group"');
    expect(mit).toContain('role="button"');
    expect(mit).toContain('aria-label="Mein Haus: ansehen und ausbauen"');
    const ohne = renderToStaticMarkup(<DorfKarte fertig={[]} plaetze={2} haeuser={[{ stufe: 2 }, { stufe: 1 }]} ich={1} titel="Dorf" />);
    expect(ohne).toContain('role="img"');
    expect(ohne).not.toContain('role="button"');
  });

  it('opens „Mein Haus“ straight at the tent quiz from the fox', () => {
    const props = { dorf: dorf(null), aktion: (async () => undefined) as never, stand: LEERER_STAND, setStand: () => {}, setDorf: () => {} };
    expect(renderToStaticMarkup(<MeinHaus {...props} />)).toContain('Zelt aufstellen');
    const quiz = renderToStaticMarkup(<MeinHaus {...props} zeltStart titelId="t" />);
    expect(quiz).toContain('id="t"');
    expect(quiz).not.toContain('Dein Grundstück ist noch leer');
  });
});
