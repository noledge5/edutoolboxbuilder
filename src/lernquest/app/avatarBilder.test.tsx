// Stufe E: the hero is the vector figure; the older drawing (below) stays for parts that exist only as uploaded pictures.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FRISUREN, frisurVon, haarfarbeVon, MUENDER, mundVon, TEILE } from '../teile';
import { AvatarBild, AvatarBildGemalt as AvatarBildAlt, hatHaarZeichnung, hatMundZeichnung, KopfBild, TeilBild, TeilBildGemalt } from './avatar';
import { setzeEigene } from '../teile';
import { HochgeladeneBilder } from './bilderKontext';

describe('vector hero', () => {
  it('draws the saved avatar as the vector figure, with its items and background', () => {
    const svg = renderToStaticMarkup(<AvatarBild avatar={{ kopf: 'krone', werkzeug: 'lupe', begleiter: 'katze', hintergrund: 'strand', haut: 4, frisur: 'zopf' }} />);
    expect(svg).toContain('data-held="vektor"');
    for (const i of ['krone', 'lupe', 'katze']) expect(svg).toContain(`data-item="${i}"`);
    expect(svg).not.toContain('<image');
  });
  it('shows old saves (the older `figur`, empty places) and parts alone', () => {
    expect(renderToStaticMarkup(<AvatarBild avatar={{ figur: 2 }} />)).toContain('data-held="vektor"');
    for (const t of TEILE) expect(renderToStaticMarkup(<TeilBild teil={t} />), t.id).toContain('data-held="vektor"');
    expect(renderToStaticMarkup(<KopfBild avatar={{ frisur: 'dutt' }} nah />)).toContain('viewBox="88 104 64 52"');
  });
  it('falls back to the older drawing when a worn part exists only as an uploaded picture', () => {
    setzeEigene([{ id: 'e0123456789', slot: 'kopf', name: 'Eigener Hut', seltenheit: 1, eigen: true }]);
    try {
      expect(renderToStaticMarkup(<AvatarBild avatar={{ kopf: 'e0123456789' }} />)).not.toContain('data-held');
    } finally {
      setzeEigene([]);
    }
  });
});

describe('own parts as uploaded pictures (teacher page)', () => {
  it('shows the uploaded picture of an own part that has no drawing yet', () => {
    setzeEigene([{ id: 'e0123456789', slot: 'kopf', name: 'Eigener Hut', seltenheit: 1, eigen: true }]);
    try {
      const svg = renderToStaticMarkup(
        <HochgeladeneBilder.Provider value={{ e0123456789: 'blob:hut' }}>
          <AvatarBild avatar={{ kopf: 'e0123456789' }} />
        </HochgeladeneBilder.Provider>,
      );
      expect(svg).toContain('href="blob:hut"');
      expect(renderToStaticMarkup(<TeilBildGemalt teil={{ id: 'e0123456789', slot: 'kopf', name: 'Eigener Hut', seltenheit: 1, eigen: true }} />)).toContain('viewBox="56 0 128 104"');
    } finally {
      setzeEigene([]);
    }
  });
});

describe('hair', () => {
  it('has an older drawing for the first hairstyles (later ones are vector only, figuren/held.test.tsx)', () => {
    const alt = ['kurz', 'zopf', 'locken', 'lang', 'zoepfe', 'dutt', 'stacheln', 'bob', 'glatze'];
    expect(FRISUREN.filter((f) => alt.includes(f.id) && !hatHaarZeichnung(f.id)).map((f) => f.id)).toEqual([]);
  });
  it('reads the older figure as hair and keeps unknown values safe', () => {
    expect(frisurVon({})).toBe('kurz');
    expect(frisurVon({ figur: 2 })).toBe('locken');
    expect(frisurVon({ figur: 1, frisur: 'dutt' })).toBe('dutt');
    expect(frisurVon({ frisur: 'gibtsnicht' })).toBe('kurz');
    expect(haarfarbeVon({ haarfarbe: 9 })).toBe(0);
    expect(haarfarbeVon({ haarfarbe: 4 })).toBe(4);
  });
});

describe('mouth', () => {
  it('has a vector drawing for every mouth', () => {
    expect(MUENDER.filter((m) => !hatMundZeichnung(m.id)).map((m) => m.id)).toEqual([]);
  });
  it('is the smile unless a known mouth is chosen', () => {
    expect(mundVon({})).toBe('laecheln');
    expect(mundVon({ mund: 'staunen' })).toBe('staunen');
    expect(mundVon({ mund: 'gibtsnicht' })).toBe('laecheln');
  });
  it('is drawn in the older drawing too', () => {
    expect(renderToStaticMarkup(<AvatarBildAlt avatar={{ mund: 'staunen' }} />)).toContain('rx="5.5" ry="7"'); // the round mouth
    expect(renderToStaticMarkup(<AvatarBildAlt avatar={{}} />)).toContain('M108 116q12 9 24 0'); // the smile
  });

});
