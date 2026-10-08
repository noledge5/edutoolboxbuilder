import { describe, expect, it } from 'vitest';
import { cellRows, choices, flowSteps, lines, matchNumbers, segments, setPart } from './text';

describe('text helpers', () => {
  it('splits one-per-line fields and skips empty lines', () => {
    expect(lines(' A \n\nB\n')).toEqual(['A', 'B']);
    expect(lines(undefined)).toEqual([]);
  });

  it('finds blanks of three or more underscores', () => {
    expect(segments('bei etwa ___ °C, seit _____ messbar')).toEqual([
      { text: 'bei etwa ', blank: false },
      { text: '___', blank: true },
      { text: ' °C, seit ', blank: false },
      { text: '_____', blank: true },
      { text: ' messbar', blank: false },
    ]);
    expect(segments('a__b')).toEqual([{ text: 'a__b', blank: false }]);
  });

  it('reads [[answers]] in gaps', () => {
    expect(segments('etwa [[−18]] °C, seit ___')).toEqual([
      { text: 'etwa ', blank: false },
      { text: '[[−18]]', blank: true, solution: '−18' },
      { text: ' °C, seit ', blank: false },
      { text: '___', blank: true },
    ]);
  });

  it('reads correct choices, table solutions and matching numbers', () => {
    expect(choices('Glas A\n* Glas B\ngleich')).toEqual([
      { text: 'Glas A', correct: false },
      { text: 'Glas B', correct: true },
      { text: 'gleich', correct: false },
    ]);
    expect(cellRows('20 | 20\n\n22 |')).toEqual([['20', '20'], [''], ['22', '']]);
    expect(matchNumbers('2, 3 1;x')).toEqual([2, 3, 1]);
  });

  it('reads flow steps as "Titel | Zusatz"', () => {
    expect(flowSteps('Sonne | kurzwellig\nErde')).toEqual([
      { title: 'Sonne', sub: 'kurzwellig' },
      { title: 'Erde', sub: '' },
    ]);
  });
});

describe('setPart (editing on the page)', () => {
  it('changes the n-th non-empty line, and removes it when emptied', () => {
    expect(setPart('A\n\nB\nC', 1, 'b')).toBe('A\n\nb\nC');
    expect(setPart('A\nB\nC', 1, '')).toBe('A\nC');
  });
  it('changes a cell, adding cells as needed', () => {
    expect(setPart('Ursache | alt\nFolge', 1, 'neu', 1)).toBe('Ursache | alt\nFolge | neu');
    expect(setPart('a | b', 0, 'x|y', 0)).toBe('x/y | b');
  });
  it('counts empty lines with raw (table solutions)', () => {
    expect(setPart('1 | 2\n', 2, '5', 1, true)).toBe('1 | 2\n\n | 5');
  });
});
