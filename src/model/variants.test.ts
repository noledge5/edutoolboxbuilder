import { describe, expect, it } from 'vitest';
import { createBlock } from './ops';
import type { Doc } from './types';
import { hasLevels, hasShuffle, levelCode, PLAIN_VARIANT, variantDoc } from './variants';

const doc = (): Doc => ({
  icon: 'globe',
  lang: 'de',
  help: true,
  footer: '',
  code: 'K7 · M1 · S2',
  pages: [
    {
      title: 'Test',
      kicker: '',
      type: 'test',
      form: 'allein',
      nameField: 'name',
      blocks: [
        createBlock('text', { text: 'Lies genau.' }),
        createBlock('mc', { prompt: 'Welche?', options: 'Regen\n*Sonne\nSchnee\nWind', level: '1' }),
        createBlock('match', { prompt: 'Verbinde.', left: 'A\nB\nC\nD', right: 'zu B\nzu C\nzu A\nzu D', solution: '2, 3, 1, 4', level: 2 }),
        createBlock('open', { prompt: 'Erkläre.', level: '3' }),
        createBlock('gap', { prompt: 'Ergänze.', text: 'Ein [[Wort]].' }),
      ],
    },
    { title: 'Nur E', kicker: '', type: 'uebung', form: 'allein', nameField: 'aus', blocks: [createBlock('open', { prompt: 'Knobelaufgabe', level: '3' })] },
  ],
});

describe('sheet variants', () => {
  it('leave the worksheet as it is by default', () => {
    const d = doc();
    expect(variantDoc(d, PLAIN_VARIANT)).toBe(d);
    expect(hasLevels(d)).toBe(true);
    expect(hasShuffle(d)).toBe(true);
  });

  it('print only the tasks of the chosen levels, tasks without a level always', () => {
    const g = variantDoc(doc(), { levels: ['1'], group: '' });
    expect(g.pages).toHaveLength(1);
    expect(g.pages[0].blocks.map((b) => b.type)).toEqual(['text', 'mc', 'gap']);
    expect(g.code).toBe('K7 · M1 · S2 · G');
    expect(levelCode(['2', '3'])).toBe('M/E');
    expect(levelCode(['1', '2', '3'])).toBe('');
  });

  it('give group B another order of answers, with the solution following', () => {
    const d = doc();
    const b = variantDoc(d, { levels: ['1', '2', '3'], group: 'B' });
    const mc = b.pages[0].blocks[1];
    expect(String(mc.props.options)).not.toBe(String(d.pages[0].blocks[1].props.options));
    expect(String(mc.props.options).split('\n').sort()).toEqual(['*Sonne', 'Regen', 'Schnee', 'Wind']);
    // Every right item still points to the left item it belongs to.
    const m = b.pages[0].blocks[2].props;
    const left = String(m.left).split('\n');
    const right = String(m.right).split('\n');
    const sol = String(m.solution).split(', ').map(Number);
    right.forEach((r, k) => expect(r).toBe(`zu ${left[sol[k] - 1]}`));
    // The same group B every time.
    expect(variantDoc(d, { levels: ['1', '2', '3'], group: 'B' })).toEqual(b);
    // Group A is the worksheet as it is.
    expect(variantDoc(d, { levels: ['1', '2', '3'], group: 'A' })).toBe(d);
  });
});
