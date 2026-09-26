import { describe, expect, it } from 'vitest';
import { flowSteps, lines, segments } from './text';

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

  it('reads flow steps as "Titel | Zusatz"', () => {
    expect(flowSteps('Sonne | kurzwellig\nErde')).toEqual([
      { title: 'Sonne', sub: 'kurzwellig' },
      { title: 'Erde', sub: '' },
    ]);
  });
});
