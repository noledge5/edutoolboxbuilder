import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { P } from './stil';
import { MODUL_WELTEN, WELT_TEILE, WELTEN, weltVon } from './welten';

const PALETTE = new Set(Object.values(P).map((x) => x.toLowerCase()));

describe('Welten der Karte', () => {
  it('gibt den Extra-Regionen feste Welten und den Modulen reihum eine', () => {
    expect(weltVon('extra-wortschatz-5-Englisch', 1002).id).toBe('wald');
    expect(weltVon('extra-grammatik-5-Englisch', 1001).id).toBe('turm');
    expect(MODUL_WELTEN.map((_, i) => weltVon(`m${i}`, i + 1).id)).toEqual(['wiese', 'wueste', 'schnee', 'strand', 'vulkan', 'weltall']);
    expect(weltVon('m7', 7).id).toBe('wiese');
    expect(weltVon('m0', 0).id).toBe('wiese');
  });

  it('zeichnet jede Welt nur mit Farben der Palette', () => {
    for (const w of Object.values(WELTEN)) {
      const html = renderToStaticMarkup(
        <svg>
          {w.wahrzeichen()}
          {Object.values(w.deko).map((d, i) => (
            <g key={i}>{d()}</g>
          ))}
        </svg>,
      );
      const farben = [...html.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase());
      expect(farben.filter((f) => !PALETTE.has(f)), w.id).toEqual([]);
      for (const f of [w.boden, w.flecken, w.bodenTief, w.weg, w.wegRand, w.wegLinie]) expect(PALETTE.has(f.toLowerCase()), w.id).toBe(true);
    }
  });

  it('zeigt alle neuen Teile in der Werkstatt, jedes einmal', () => {
    expect(new Set(WELT_TEILE.map((t) => t.id)).size).toBe(WELT_TEILE.length);
    for (const t of WELT_TEILE) expect(renderToStaticMarkup(<svg>{t.zeichnung()}</svg>).length, t.id).toBeGreaterThan(40);
  });
});
