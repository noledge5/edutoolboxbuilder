// The badge texts read as correct German (28.11.2026): dative after „von“, singular for one.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AbzeichenKarte, AbzeichenNeu } from './Abzeichen';
import { LEERER_STAND } from '../types';

describe('badge texts', () => {
  const karte = renderToStaticMarkup(<AbzeichenKarte stand={{ ...LEERER_STAND, tage: ['2026-11-27'], inventar: ['kappe'] }} pakete={[]} />);
  it('use the dative after „von“', () => {
    expect(karte).toContain('1 von 3 Lerntagen');
    expect(karte).toContain('0 von 5 Sternen');
    expect(karte).toContain('1 von 5 Teilen');
  });
  it('use the singular for one', () => {
    expect(karte).toContain('0 von 1 perfekten Runde');
    expect(karte).toContain('0 von 1 Region geschafft');
  });
  it('say what a new badge was earned for', () => {
    const neu = renderToStaticMarkup(<AbzeichenNeu neu={[{ id: 'perfekt', stufe: 1 }, { id: 'gedaechtnis', stufe: 2 }, { id: 'aufsteiger', stufe: 1 }]} />);
    expect(neu).toContain('Bronze für die erste perfekte Runde.');
    expect(neu).toContain('Silber für 40 Aufgaben, die sitzen.');
    expect(neu).toContain('Bronze für Heldenstufe 3.');
  });
});
