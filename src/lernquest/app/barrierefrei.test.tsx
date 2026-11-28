// Accessibility of the exercises (28.11.2026): an empty gap has a name, the picture of „places“ can be reached by keyboard.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { UebungView } from './Uebungen';

describe('exercises for keyboard and screen readers', () => {
  it('name the gaps of a fill-in sentence', () => {
    const html = renderToStaticMarkup(<UebungView u={{ art: 'luecke', id: 'l', frage: 'Fill in.', teile: ['There ', 'are', ' two pens.'], kacheln: ['are', 'is'] }} seed="s" locked={false} onChange={() => {}} />);
    expect(html).toContain('aria-label="Lücke 1, leer"');
  });

  it('make the picture of places focusable and say how to aim', () => {
    const html = renderToStaticMarkup(<UebungView u={{ art: 'punkt', id: 'p', frage: 'Finde die Orte.', bild: 'karte:x', punkte: [[30, 40, 'Berlin']] }} seed="s" locked={false} onChange={() => {}} />);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('Mit den Pfeiltasten zielen, mit Enter tippen.');
  });

  it('name the row of a word order', () => {
    const html = renderToStaticMarkup(<UebungView u={{ art: 'reihenfolge', id: 'r', frage: 'Order.', hinweis: '', kacheln: ['I', 'am', 'here'], loesung: 'I am here' }} seed="s" locked={false} onChange={() => {}} />);
    expect(html).toContain('role="group" aria-label="Dein Satz"');
  });
});
