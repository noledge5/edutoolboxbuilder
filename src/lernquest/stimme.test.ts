import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { tonSchluessel, vorleseText, vorleseTexte } from './stimme';
import type { Uebung } from './types';

const uebungen: Uebung[] = [
  { art: 'waehlen', id: 'a', frage: 'Hör zu. Was passt?', hoeren: 'I have got a **dog**.', optionen: ['Hund', 'Katze'], richtig: [0] },
  { art: 'waehlen', id: 'b', frage: 'Was heißt das?', aussage: 'the {{school}}  bag', optionen: ['Schultasche', 'Bus'], richtig: [0] },
  { art: 'richtigfalsch', id: 'c', frage: 'Stimmt das?', aussage: '12 = twelve', richtig: true },
  { art: 'bild', id: 'd', frage: 'Welches Bild?', wort: 'apple', bilder: ['🍎', '🍐'], richtig: 0 },
  { art: 'luecke', id: 'e', frage: 'Fill in.', teile: ['There ', 'are', ' two pens.'], kacheln: ['is', 'are'] },
  { art: 'reihenfolge', id: 'f', frage: 'Forme um.', hinweis: '', kacheln: ['Is', 'there', 'a', 'book', '?'], loesung: 'Is there a book?' },
  { art: 'paare', id: 'g', frage: 'Finde die Paare.', paare: [['dog', 'Hund']] },
  { art: 'schreiben', id: 'h', frage: 'Schreib das Wort.', aussage: 'das Buch', loesungen: ['book'] } as Uebung,
  { art: 'richtigfalsch', id: 'i', frage: 'Stimmt das?', aussage: '12 = twelve', richtig: true },
];

describe('Vorlesen mit Aufnahmen', () => {
  it('nimmt genau die Texte, die ein Kind hören kann, jeden einmal', () => {
    expect(vorleseTexte({ lang: 'en', uebungen })).toEqual(['I have got a dog.', 'the school bag', '12 = twelve', 'apple', 'There are two pens.', 'Is there a book?']);
  });
  it('liest in deutschen Paketen nur Hör-Aufgaben', () => {
    expect(vorleseTexte({ lang: 'de', uebungen })).toEqual(['I have got a dog.']);
  });
  it('findet dieselbe Aufnahme für denselben gesprochenen Text', async () => {
    expect(vorleseText('  the **school**\n bag ')).toBe('the school bag');
    const k = await tonSchluessel('the {{school}} bag');
    expect(k).toBe(createHash('sha256').update('en-GB|the school bag').digest('hex'));
    expect(await tonSchluessel('the school  bag')).toBe(k);
    expect(await tonSchluessel('The school bag')).not.toBe(k);
  });
});
