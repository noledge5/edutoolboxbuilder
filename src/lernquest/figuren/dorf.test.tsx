import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DORF_GEBAEUDE } from '../dorf';
import { DORF_TEILE, DorfBild, GEBAEUDE_BILD } from './dorf';

describe('Klassendorf: Zeichnungen', () => {
  it('hat für jedes Gebäude eine Zeichnung und jede Zeichnung zeichnet', () => {
    for (const g of DORF_GEBAEUDE) expect(GEBAEUDE_BILD[g.id], g.id).toBeTypeOf('function');
    expect(new Set(DORF_TEILE.map((t) => t.id)).size).toBe(DORF_TEILE.length);
    for (const t of DORF_TEILE) expect(renderToStaticMarkup(<svg>{t.zeichnung()}</svg>).length, t.id).toBeGreaterThan(200);
  });

  it('zeigt gebaute Gebäude und die Baustelle im Dorfbild', () => {
    const leer = renderToStaticMarkup(<DorfBild fertig={[]} titel="Dorf" />);
    const voll = renderToStaticMarkup(<DorfBild fertig={['brunnen']} baustelle="bruecke" titel="Dorf" />);
    expect(voll.length).toBeGreaterThan(leer.length + 1000);
    expect(voll).toContain('aria-label="Dorf"');
  });
});
