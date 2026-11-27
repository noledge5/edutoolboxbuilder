import { describe, expect, it } from 'vitest';
import { detectForm, detectSymbol, formOf, hasOperator, symbolOf } from './symbols';
import type { Block } from '../model/types';

const task = (type: Block['type'], prompt: string, more: Record<string, string> = {}): Block => ({ id: 'x', type, span: 12, props: { prompt, ...more } });

describe('Symbole der Aufgaben', () => {
  it('nimmt den ersten Operator des Auftrags, deutsch und englisch', () => {
    expect(detectSymbol('Lies die Werte ab.', 'table')).toBe('lesen');
    expect(detectSymbol('Lies den Text und markiere die Fachwörter.', 'open')).toBe('lesen');
    expect(detectSymbol('Markiere alle Fachwörter.', 'open')).toBe('markieren');
    expect(detectSymbol('Kreuze die richtige Antwort an.', 'mc')).toBe('ankreuzen');
    expect(detectSymbol('Ergänze die Lücken.', 'gap')).toBe('ergaenzen');
    expect(detectSymbol('Ordne die Begriffe den Bildern zu.', 'match')).toBe('zuordnen');
    expect(detectSymbol('Ordne die Schritte.', 'jumble')).toBe('ordnen');
    expect(detectSymbol('Trage deine Werte ein.', 'table')).toBe('eintragen');
    expect(detectSymbol('Übertrage die Tabelle in dein Heft.', 'open')).toBe('eintragen');
    expect(detectSymbol('Zeichne ein Klimadiagramm.', 'draw')).toBe('zeichnen');
    expect(detectSymbol('Berechne den Mittelwert.', 'open')).toBe('rechnen');
    expect(detectSymbol('Besprecht eure Ergebnisse.', 'open')).toBe('sprechen');
    expect(detectSymbol('Hör zu und kreuze an.', 'mc')).toBe('hoeren');
    expect(detectSymbol('Recherchiere die Einwohnerzahl.', 'open')).toBe('recherchieren');
    expect(detectSymbol('Begründe deine Antwort.', 'open')).toBe('schreiben');
    expect(detectSymbol('Write down the way.', 'open')).toBe('schreiben');
    expect(detectSymbol('Match the words and the pictures.', 'match')).toBe('zuordnen');
    expect(detectSymbol('Ask your partner: What is your favourite day?', 'open')).toBe('sprechen');
  });

  it('nimmt sonst die Art der Aufgabe, und erkennt Umlaute als Teil des Worts', () => {
    expect(detectSymbol('Wie hat sich der CO₂-Gehalt seit 1958 entwickelt?', 'mc')).toBe('ankreuzen');
    expect(detectSymbol('Was ist richtig?', 'open')).toBe('schreiben');
    expect(detectSymbol('Kreisläufe der Natur', 'gap')).toBe('ergaenzen');
    expect(detectSymbol('Was passt?', 'hint')).toBeNull();
  });

  it('folgt der Wahl der Lehrkraft und lässt sich abschalten', () => {
    expect(symbolOf(task('open', 'Begründe.', { sym: 'zeichnen' }))).toBe('zeichnen');
    expect(symbolOf(task('open', 'Begründe.', { sym: 'none' }))).toBeNull();
    expect(symbolOf(task('open', 'Begründe.', { sym: 'unbekannt' }))).toBe('schreiben');
  });

  it('zeigt die Sozialform nur, wenn sie gewählt ist oder klar im Auftrag steht', () => {
    expect(detectForm('Vergleicht eure Ergebnisse zu zweit.')).toBe('partner');
    expect(detectForm('Arbeitet in der Gruppe.')).toBe('gruppe');
    expect(detectForm('Nenne eine Gruppe von Säugetieren.')).toBeNull();
    expect(detectForm('Ask your partner.')).toBeNull();
    expect(detectForm('Work with a partner.')).toBe('partner');
    expect(formOf(task('open', 'Begründe.'))).toBeNull();
    expect(formOf(task('open', 'Begründe.', { form: 'gruppe' }))).toBe('gruppe');
    expect(formOf(task('open', 'Arbeitet zu zweit.', { form: 'none' }))).toBeNull();
  });

  it('erkennt, ob ein Auftrag einen Operator nennt', () => {
    expect(hasOperator('Vermute, welches Glas wärmer wird.')).toBe(true);
    expect(hasOperator('Sieh dir M1 an und beschreibe den Verlauf.')).toBe(true);
    expect(hasOperator('Verorte die Städte auf der Karte.')).toBe(true);
    expect(hasOperator('Look at the map.')).toBe(true);
    expect(hasOperator('Warum, glaubt ihr, war das so?')).toBe(false);
    expect(hasOperator('Messwerte')).toBe(false);
    expect(hasOperator('Wie hat sich der CO₂-Gehalt seit 1958 entwickelt?')).toBe(false);
  });
});
