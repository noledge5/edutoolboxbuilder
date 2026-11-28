// The tower guards (Solo-Boss, 28.11.2026): every world's variant draws every pose in palette colours only, and the
// moves it lists fit its parts and faces (figuren.test.tsx checks the meadow's in FIGUREN; this checks all).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ANIMATIONEN } from './animationen';
import { FigurBild } from './Figur';
import { P } from './stil';
import type { Teil } from './typen';
import { WAECHTER, WAECHTER_NAMEN } from './waechter';
import { WELTEN } from './welten';

const palette = new Set(Object.values(P).map((c) => String(c).toLowerCase()));
const ids = (t: Teil[]): string[] => t.flatMap((x) => [x.id, ...ids(x.kinder ?? [])]);

describe('tower guards', () => {
  it('exist for every world of the map, with a name', () => {
    expect(Object.keys(WAECHTER).sort()).toEqual(Object.keys(WELTEN).sort());
    for (const w of Object.keys(WELTEN)) expect(WAECHTER_NAMEN[w as keyof typeof WAECHTER_NAMEN]).toMatch(/Wächter$/);
  });

  it('draw every pose in palette colours only', () => {
    for (const f of Object.values(WAECHTER))
      for (const pose of Object.keys(f.posen)) {
        const svg = renderToStaticMarkup(<FigurBild figur={f} pose={pose} lebendig={false} />);
        const fremd = (svg.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).filter((c) => !palette.has(c.toLowerCase()));
        expect(fremd, `${f.id} ${pose}`).toEqual([]);
      }
  });

  it('list only moves that move one of their parts, with faces they know', () => {
    for (const f of Object.values(WAECHTER)) {
      const teile = new Set(['ganz', ...ids(f.teile)]);
      for (const id of f.animationen) {
        const a = ANIMATIONEN[id];
        expect(a, id).toBeTruthy();
        expect(Object.keys(a.spuren).some((s) => teile.has(s)), `${f.id} ${id}`).toBe(true);
        for (const [, g] of a.gesichter ?? []) expect(f.gesichter, `${f.id} ${id}`).toContain(g);
      }
    }
  });
});
