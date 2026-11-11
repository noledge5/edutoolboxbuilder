// Every part of the catalogue is drawn (Avatar-Stil, docs/design/lernquest/README.md).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TEILE } from '../teile';
import { hatZeichnung, TeilBild } from './avatar';

// Draw the vectors, not the painted pictures.
vi.mock('./teilBilder', () => ({
  teilBild: () => undefined,
  koerperBild: () => undefined,
  haareBild: () => undefined,
  mundBild: () => undefined,
}));

describe('avatar drawings', () => {
  it('draws all 56 parts', () => {
    expect(TEILE).toHaveLength(80);
    expect(TEILE.filter((t) => !hatZeichnung(t.id)).map((t) => t.id)).toEqual([]);
  });

  it('builds valid path data for every part (no "--" from negative values)', () => {
    const kaputt = TEILE.flatMap((teil) => {
      const svg = renderToStaticMarkup(createElement(TeilBild, { teil }));
      return [...svg.matchAll(/ d="([^"]*)"/g)].filter(([, d]) => d.includes('--')).map(([, d]) => `${teil.id}: ${d}`);
    });
    expect(kaputt).toEqual([]);
  });
});
