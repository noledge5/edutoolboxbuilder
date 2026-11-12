// The figure system keeps itself consistent: poses, moves and items only name parts and anchors that exist,
// every combination draws, and the art uses only the colours of stil.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ANIMATIONEN, FIGUREN, FigurBild, ITEMS, ItemBild } from '.';
import { versetzt } from './animationen';
import { SELTEN_FARBE } from './stil';
import type { Figur, Teil } from './typen';
import { SELTENHEITEN } from '../teile';

const alle = (teile: Teil[]): Teil[] => teile.flatMap((t) => [t, ...alle(t.kinder ?? [])]);
const ids = (f: Figur) => alle(f.teile).map((t) => t.id);
const anker = (f: Figur) => alle(f.teile).flatMap((t) => Object.keys(t.anker ?? {}));

describe('figures', () => {
  it('have unique ids and part ids', () => {
    expect(new Set(FIGUREN.map((f) => f.id)).size).toBe(FIGUREN.length);
    for (const f of FIGUREN) expect(new Set(ids(f)).size, f.id).toBe(ids(f).length);
  });

  it.each(FIGUREN.map((f) => [f.id, f] as const))('%s: poses name only its parts and extras', (_, f) => {
    const teile = new Set(ids(f));
    const oben = new Set(f.teile.map((t) => t.id));
    for (const [name, p] of Object.entries(f.posen)) {
      for (const t of Object.keys(p.winkel ?? {})) expect(teile.has(t), `${name}: ${t}`).toBe(true);
      for (const t of p.vorne ?? []) expect(oben.has(t), `${name}: vorne ${t}`).toBe(true);
      for (const e of p.extras ?? []) expect(f.extras?.[e], `${name}: extra ${e}`).toBeTypeOf('function');
    }
  });

  it.each(FIGUREN.map((f) => [f.id, f] as const))('%s: moves exist and name only its parts', (_, f) => {
    const teile = new Set([...ids(f), 'ganz']);
    for (const a of f.animationen) {
      expect(ANIMATIONEN[a], a).toBeDefined();
      for (const t of Object.keys(ANIMATIONEN[a].spuren)) expect(teile.has(t), `${a}: ${t}`).toBe(true);
    }
  });

  it('draws every figure in every pose with every move', () => {
    for (const f of FIGUREN)
      for (const pose of Object.keys(f.posen))
        for (const animation of [undefined, ...f.animationen]) {
          const svg = renderToStaticMarkup(<FigurBild figur={f} pose={pose} animation={animation} />);
          for (const t of ids(f)) expect(svg, `${f.id}/${pose}`).toContain(`data-teil="${t}"`);
          expect(svg).not.toMatch(/NaN|undefined/);
        }
  });

  it('moves the parts with SMIL on top of the pose', () => {
    const svg = renderToStaticMarkup(<FigurBild figur={FIGUREN[0]} pose="winken" animation="winken" />);
    expect(svg).toMatch(/<g data-teil="unterarm-r"[^>]*><animateTransform[^>]*additive="sum"/);
  });
});

describe('moves', () => {
  it('have keyframes that start and end at rest, so a run ends in the pose', () => {
    for (const a of Object.values(ANIMATIONEN))
      for (const [t, s] of Object.entries(a.spuren)) {
        if (s.drehen) expect([s.drehen[0], s.drehen.at(-1)], `${a.id}/${t}`).toEqual([s.drehen[0], s.drehen[0]]);
        if (s.schieben) expect(s.schieben.at(-1), `${a.id}/${t}`).toEqual(s.schieben[0]);
      }
  });

  it('shifts a loop without breaking it', () => {
    expect(versetzt([0, 9, 0, -9, 0], 1)).toEqual([9, 0, -9, 0, 9]);
  });
});

describe('items', () => {
  it('sit on an anchor some figure has, and draw as icon and worn', () => {
    const plaetze = new Set(FIGUREN.flatMap(anker));
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const i of ITEMS) {
      expect(plaetze.has(i.platz), i.id).toBe(true);
      expect(renderToStaticMarkup(<ItemBild item={i} />)).toContain(`data-item="${i.id}"`);
      const traeger = FIGUREN.find((f) => anker(f).includes(i.platz))!;
      expect(renderToStaticMarkup(<FigurBild figur={traeger} items={[i]} />)).toContain(`data-item="${i.id}"`);
    }
  });

  it('use the rarity colours of the app', () => {
    expect(SELTEN_FARBE).toEqual(SELTENHEITEN.map((s) => s.farbe));
  });
});

describe('style', () => {
  it('uses colours only from stil.ts', () => {
    const dir = new URL('.', import.meta.url);
    const bad = readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f) && f !== 'stil.ts' && !f.includes('.test.'))
      .flatMap((f) => [...readFileSync(new URL(f, dir), 'utf8').matchAll(/#[0-9a-f]{3,8}\b|rgba?\(/gi)].map((m) => `${f}: ${m[0]}`));
    expect(bad).toEqual([]);
  });
});
