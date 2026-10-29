import { describe, expect, it } from 'vitest';
import { figureLabels, labelLine, labelsWithoutWords } from './labels';

describe('figure labels', () => {
  it('reads words and positions, placed or not', () => {
    expect(figureLabels('Krater\nSchlot | 40 | 75.25\nMagma | x | 3')).toEqual([
      { text: 'Krater', at: null },
      { text: 'Schlot', at: { x: 40, y: 75.3 } },
      { text: 'Magma', at: null },
    ]);
  });
  it('keeps positions inside the picture', () => {
    expect(figureLabels('A | -5 | 130')[0].at).toEqual({ x: 0, y: 100 });
    expect(labelLine('Krater', { x: 12.345, y: 50 })).toBe('Krater | 12.3 | 50');
    expect(labelLine('Krater', null)).toBe('Krater');
  });
  it('drops the words for a test, keeps the positions', () => {
    expect(labelsWithoutWords('Krater | 10 | 20\nSchlot')).toBe(' | 10 | 20\n–');
  });
});
