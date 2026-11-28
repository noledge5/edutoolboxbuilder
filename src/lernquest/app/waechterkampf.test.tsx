// The Meilenstein as a fight against the region's guard (Solo-Boss, 28.11.2026).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MEILENSTEIN_GUT, waechterLeben } from '../karte';
import { LEERER_STAND } from '../types';
import { Runde } from './Runde';

describe('guard fight', () => {
  it('needs exactly the right answers that pass the Meilenstein', () => {
    expect(waechterLeben(10)).toBe(8);
    expect(waechterLeben(5)).toBe(4);
    expect(waechterLeben(1)).toBe(1);
    for (const n of [3, 7, 10, 12]) {
      expect((waechterLeben(n) * 100) / n).toBeGreaterThanOrEqual(MEILENSTEIN_GUT);
      expect(((waechterLeben(n) - 1) * 100) / n).toBeLessThan(MEILENSTEIN_GUT);
    }
  });

  it('shows the guard with its life over the exercise, and only in the Meilenstein', () => {
    const uebungen = Array.from({ length: 10 }, (_, i) => ({ stunde: 's', u: { art: 'richtigfalsch' as const, id: `r${i}`, frage: 'Stimmt das?', aussage: 'A', richtig: true } }));
    const mit = (gegner?: 'wueste') => renderToStaticMarkup(<Runde uebungen={uebungen} stunde="" runde={0} stand={LEERER_STAND} herzen={3} titel="Wächter · Region 2" gegner={gegner} onAbbruch={() => {}} onFertig={() => {}} />);
    const kampf = mit('wueste');
    expect(kampf).toContain('Der Wüsten-Wächter');
    expect(kampf).toContain('Noch 8 Treffer');
    expect(kampf.match(/<i class="voll"/g)).toHaveLength(8);
    expect(mit()).not.toContain('lq-waechter');
  });
});
