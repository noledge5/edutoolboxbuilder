import { describe, expect, it } from 'vitest';
import { BLOCK_ORDER } from '../model/blockTypes';
import { BLOCK_WORDS, findBlockTypes } from './blockSearch';

describe('toolbox search', () => {
  it('finds blocks by label, group and other words, in German and English', () => {
    expect(findBlockTypes('Lücke')[0]).toBe('gap');
    expect(findBlockTypes('lucke')[0]).toBe('gap');
    expect(findBlockTypes('multiple choice')).toEqual(['mc']);
    expect(findBlockTypes('mindmap')).toEqual(['wordweb']);
    expect(findBlockTypes('Lehrkraft')).toEqual(expect.arrayContaining(['plan', 'goal', 'expect', 'recall']));
    // A label starting with the word comes first.
    expect(findBlockTypes('tab')[0]).toBe('table');
    expect(findBlockTypes('')).toEqual([]);
    expect(findBlockTypes('xyz')).toEqual([]);
  });

  it('has words for every block', () => {
    for (const t of BLOCK_ORDER) expect(BLOCK_WORDS[t]).toBeTruthy();
  });
});
