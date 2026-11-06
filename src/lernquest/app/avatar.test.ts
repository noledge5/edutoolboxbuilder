// Every part of the catalogue is drawn (Avatar-Stil, docs/design/lernquest/README.md).
import { describe, expect, it } from 'vitest';
import { TEILE } from '../teile';
import { hatZeichnung } from './avatar';

describe('avatar drawings', () => {
  it('draws all 40 parts', () => {
    expect(TEILE).toHaveLength(40);
    expect(TEILE.filter((t) => !hatZeichnung(t.id)).map((t) => t.id)).toEqual([]);
  });
});
