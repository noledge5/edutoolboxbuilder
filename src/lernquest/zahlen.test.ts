// Numbers in typed answers (27.11.2026, Mathe): the same value counts, whatever the decimal mark; ambiguous or
// different numbers do not; a number is never „almost right“ like a misspelt word.
import { describe, expect, it } from 'vitest';
import { fastRichtig, gleicheAntwort, istRichtig, nurZahlen, zahlAus } from './rules';

describe('numbers in typed answers', () => {
  it('read comma and point, spaces and the typographic minus', () => {
    expect(zahlAus('3,5')).toBe(3.5);
    expect(zahlAus('3.5')).toBe(3.5);
    expect(zahlAus('1 000')).toBe(1000);
    expect(zahlAus('−12')).toBe(-12);
    expect(zahlAus('84.')).toBe(84);
  });
  it('leave words, mixed text and „1.000“ alone', () => {
    expect(zahlAus('book')).toBeNull();
    expect(zahlAus('5 cm')).toBeNull();
    expect(zahlAus('1.000')).toBeNull();
    expect(zahlAus('3/4')).toBeNull();
  });
  it('count the same value as right', () => {
    expect(gleicheAntwort('3,5', '3.5')).toBe(true);
    expect(gleicheAntwort('3,5', '3,50')).toBe(true);
    expect(gleicheAntwort('1000', '1 000')).toBe(true);
    expect(gleicheAntwort('-4', '−4')).toBe(true);
  });
  it('do not count other or ambiguous numbers', () => {
    expect(gleicheAntwort('3,5', '35')).toBe(false);
    expect(gleicheAntwort('1000', '1.000')).toBe(false);
    expect(gleicheAntwort('84', '85')).toBe(false);
  });
  it('keep words as before', () => {
    expect(gleicheAntwort('book', 'Book')).toBe(true);
    expect(gleicheAntwort('book', 'bok')).toBe(false);
  });
  it('grade a typed number and never call it almost right', () => {
    const u = { art: 'schreiben' as const, id: 'm', frage: 'Rechne: 7 · 12', loesungen: ['84'] };
    expect(istRichtig(u, { art: 'schreiben', text: ' 84 ' })).toBe(true);
    expect(fastRichtig(u, { art: 'schreiben', text: '85' })).toBe(0);
    const d = { ...u, loesungen: ['0,25'] };
    expect(istRichtig(d, { art: 'schreiben', text: '0.25' })).toBe(true);
    expect(nurZahlen(d.loesungen)).toBe(true);
    expect(nurZahlen(['book', '3'])).toBe(false);
  });
});
