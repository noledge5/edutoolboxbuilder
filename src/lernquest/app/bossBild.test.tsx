// Every boss is drawn as its moving figure (figuren/), in the order of BOSSE.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BOSSE } from '../boss';
import { BossBild } from './Boss';

describe('BossBild', () => {
  it.each([
    [0, 'golem'],
    [1, 'tintenkrake'],
    [2, 'raetseldrache'],
  ])('boss %i is the figure %s, named for screen readers', (boss, id) => {
    const svg = renderToStaticMarkup(<BossBild boss={boss} size={200} />);
    expect(svg).toContain(`data-figur="${id}"`);
    expect(svg).toContain(`aria-label="${BOSSE[boss].name}"`);
  });

  it('shows the beaten pose when it has fallen', () => {
    expect(renderToStaticMarkup(<BossBild boss={0} gefallen />)).toContain('gefallen');
  });
});
