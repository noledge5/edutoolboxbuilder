// Painted pictures replace a vector drawing only where a picture exists (teilBilder.ts); hair and mouth are layers of their own.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FRISUREN, frisurVon, haarfarbeVon, MUENDER, mundVon, TEILE } from '../teile';
import { AvatarBild, hatHaarZeichnung, hatMundZeichnung, TeilBild } from './avatar';
import { HochgeladeneBilder } from './bilderKontext';

vi.mock('./teilBilder', () => ({
  teilBild: (id?: string) => (id === 'krone' ? 'assets/krone.webp' : undefined),
  koerperBild: (haut: number) => `assets/koerper-${haut}.webp`,
  haareBild: (frisur: string, farbe: number) => (frisur === 'zopf' ? `assets/haare-zopf-${farbe}.webp` : undefined),
  mundBild: (mund: string) => (mund === 'lachen' ? 'assets/mund-lachen.webp' : undefined),
}));

describe('avatar with pictures', () => {
  it('stacks body, clothes, hair and parts, and keeps vectors where there is no picture', () => {
    const svg = renderToStaticMarkup(
      <AvatarBild avatar={{ kopf: 'krone', kleidung: 'tshirt', haut: 3, frisur: 'zopf', haarfarbe: 3 }} />,
    );
    expect(svg).toContain('href="assets/koerper-3.webp"');
    expect(svg).toContain('href="assets/haare-zopf-3.webp"');
    expect(svg).toContain('href="assets/krone.webp"');
    expect(svg).toContain('lq-funkeln'); // Legendär keeps its sparkle
    expect(svg).toContain('fill="#2F6FDB"'); // the T-shirt is still drawn
    const reihe = ['koerper-3', '#2F6FDB', 'haare-zopf', 'krone.webp'].map((s) => svg.indexOf(s));
    expect(reihe).toEqual([...reihe].sort((a, b) => a - b));
  });
  it('takes uploaded pictures (teacher page) before built-in ones, hair in its colour or else the brown one', () => {
    const mit = (bilder: Record<string, string>, avatar: object) =>
      renderToStaticMarkup(
        <HochgeladeneBilder.Provider value={bilder}>
          <AvatarBild avatar={avatar} />
        </HochgeladeneBilder.Provider>,
      );
    const svg = mit({ krone: 'blob:krone', 'haare-zopf-2': 'blob:zopf2', 'haare-locken-0': 'blob:locken0' }, { kopf: 'krone', frisur: 'zopf', haarfarbe: 2 });
    expect(svg).toContain('href="blob:krone"');
    expect(svg).toContain('href="blob:zopf2"');
    expect(svg).not.toContain('assets/haare-zopf');
    expect(mit({ 'haare-locken-0': 'blob:locken0' }, { frisur: 'locken', haarfarbe: 3 })).toContain('href="blob:locken0"');
  });
  it('shows a painted part alone in its cut-out', () => {
    const svg = renderToStaticMarkup(<TeilBild teil={TEILE.find((t) => t.id === 'krone')!} />);
    expect(svg).toContain('viewBox="56 0 128 104"');
    expect(svg).toContain('href="assets/krone.webp"');
  });
});

describe('hair', () => {
  it('has a vector drawing for every hair', () => {
    expect(FRISUREN.filter((f) => !hatHaarZeichnung(f.id)).map((f) => f.id)).toEqual([]);
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
  it('sits over the eyes and under the head part, painted where there is a picture, else drawn', () => {
    const gemalt = renderToStaticMarkup(<AvatarBild avatar={{ kopf: 'krone', augen: 'punktaugen', mund: 'lachen' }} />);
    const reihe = ['cx="104"', 'mund-lachen.webp', 'krone.webp'].map((s) => gemalt.indexOf(s));
    expect(reihe.every((i) => i >= 0)).toBe(true);
    expect(reihe).toEqual([...reihe].sort((a, b) => a - b));
    const gezeichnet = renderToStaticMarkup(<AvatarBild avatar={{ mund: 'staunen' }} />);
    expect(gezeichnet).toContain('rx="5.5" ry="7"'); // the round mouth
    expect(renderToStaticMarkup(<AvatarBild avatar={{}} />)).toContain('M108 116q12 9 24 0'); // the smile
  });
});
