// Painted pictures replace a vector drawing only where a picture exists (teilBilder.ts); hair is a layer of its own.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FRISUREN, frisurVon, haarfarbeVon, TEILE } from '../teile';
import { AvatarBild, hatHaarZeichnung, TeilBild } from './avatar';

vi.mock('./teilBilder', () => ({
  teilBild: (id?: string) => (id === 'krone' ? 'assets/krone.webp' : undefined),
  koerperBild: (haut: number) => `assets/koerper-${haut}.webp`,
  haareBild: (frisur: string, farbe: number) => (frisur === 'zopf' ? `assets/haare-zopf-${farbe}.webp` : undefined),
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
