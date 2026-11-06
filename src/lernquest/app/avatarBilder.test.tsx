// Painted pictures replace a part's vector drawing only where a picture exists (teilBilder.ts).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TEILE } from '../teile';
import { AvatarBild, TeilBild } from './avatar';

vi.mock('./teilBilder', () => ({
  teilBild: (id?: string) => (id === 'krone' ? 'assets/krone.webp' : undefined),
  koerperBild: (haut: number) => `assets/koerper-${haut}.webp`,
}));

describe('avatar with pictures', () => {
  it('stacks the picture layers and keeps vectors for parts without a picture', () => {
    const svg = renderToStaticMarkup(<AvatarBild avatar={{ kopf: 'krone', kleidung: 'tshirt', haut: 3 }} />);
    expect(svg).toContain('href="assets/koerper-3.webp"');
    expect(svg).toContain('href="assets/krone.webp"');
    expect(svg).toContain('lq-funkeln'); // Legendär keeps its sparkle
    expect(svg).toContain('fill="#2F6FDB"'); // the T-shirt is still drawn
    expect(svg.indexOf('koerper-3')).toBeLessThan(svg.indexOf('krone.webp'));
  });
  it('shows a painted part alone in its cut-out', () => {
    const svg = renderToStaticMarkup(<TeilBild teil={TEILE.find((t) => t.id === 'krone')!} />);
    expect(svg).toContain('viewBox="56 0 128 104"');
    expect(svg).toContain('href="assets/krone.webp"');
  });
});
