// Every part of the catalogue is drawn (Avatar-Stil, docs/design/lernquest/README.md).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TEILE } from '../teile';
import { hatZeichnung, TeilBild } from './avatar';

// Draw the vectors, not the painted pictures.

describe('avatar drawings', () => {
  // The older drawing is only the fallback for heroes wearing an uploaded picture (Stufe E, Teil 4); parts added later
  // (from 13.11.2026) exist only as vectors (src/lernquest/figuren/held.test.tsx checks those).
  it('draws the first 80 parts the older way too', () => {
    expect(TEILE.slice(0, 80).filter((t) => !hatZeichnung(t.id)).map((t) => t.id)).toEqual([]);
  });

  it('builds valid path data for every part (no "--" from negative values)', () => {
    const kaputt = TEILE.flatMap((teil) => {
      const svg = renderToStaticMarkup(createElement(TeilBild, { teil }));
      return [...svg.matchAll(/ d="([^"]*)"/g)].filter(([, d]) => d.includes('--')).map(([, d]) => `${teil.id}: ${d}`);
    });
    expect(kaputt).toEqual([]);
  });
});
