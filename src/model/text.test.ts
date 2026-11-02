import { describe, expect, it } from 'vitest';
import { cellRows, choices, flowSteps, gapRuns, inlineRuns, lines, matchNumbers, plain, segments, setPart } from './text';

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

describe('inlineRuns, plain and gapRuns (bold and marked text)', () => {
  const r = (text: string, bold = false, mark = false) => ({ text, bold, mark });
  it('finds **bold** and {{marked}} parts', () => {
    expect(inlineRuns('Das ist **wichtig** und play{{s}}.')).toEqual([r('Das ist '), r('wichtig', true), r(' und play'), r('s', false, true), r('.')]);
  });
  it('nests both ways', () => {
    expect(inlineRuns('**he play{{s}}**')).toEqual([r('he play', true), r('s', true, true)]);
    expect(inlineRuns('{{a **b** c}}')).toEqual([r('a ', false, true), r('b', true, true), r(' c', false, true)]);
  });
  it('leaves lone or empty markers as they are, and bold stops at a line break', () => {
    expect(inlineRuns('5 ** 2')).toEqual([r('5 ** 2')]);
    expect(inlineRuns('**a\nb**')).toEqual([r('**a\nb**')]);
    expect(inlineRuns('****')).toEqual([r('****')]);
    expect(inlineRuns('')).toEqual([]);
  });
  it('plain drops the markers', () => {
    expect(plain('**Hund**')).toBe('Hund');
    expect(plain('play{{s}}')).toBe('plays');
    expect(plain('a * b')).toBe('a * b');
  });
  it('gapRuns keeps gaps and lets bold run across them', () => {
    const [g] = segments('[[Hund]]');
    expect(gapRuns('**Der [[Hund]] bellt.**')).toEqual([r('Der ', true), { gap: g, bold: true, mark: false }, r(' bellt.', true)]);
    const [g2] = segments('[[**Hund**]]');
    expect(gapRuns('Der [[**Hund**]] ___.')).toEqual([r('Der '), { gap: g2, bold: false, mark: false }, r(' '), { gap: segments('___')[0], bold: false, mark: false }, r('.')]);
    expect(gapRuns('ohne Lücke **fett**')).toEqual([r('ohne Lücke '), r('fett', true)]);
  });
});
