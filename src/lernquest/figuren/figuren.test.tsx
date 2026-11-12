// The figure system keeps itself consistent: poses, moves and items only name parts, faces and anchors that exist,
// every combination draws, the motion engine computes the right frame, and the art uses only the colours of stil.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ANIMATIONEN, FIGUREN, FigurBild, ITEMS, ItemBild } from '.';
import { versetzt } from './animationen';
import { abtasten, blinzelt, mischePosen, phase, stellung, transform } from './bewegung';
import { SELTEN_FARBE } from './stil';
import type { Animation, Figur, Teil } from './typen';
import { SELTENHEITEN } from '../teile';

const alle = (teile: Teil[]): Teil[] => teile.flatMap((t) => [t, ...alle(t.kinder ?? [])]);
const ids = (f: Figur) => alle(f.teile).map((t) => t.id);
const anker = (f: Figur) => alle(f.teile).flatMap((t) => Object.keys(t.anker ?? {}));
const jeFigur = FIGUREN.map((f) => [f.id, f] as const);

describe('figures', () => {
  it('have unique ids and part ids', () => {
    expect(new Set(FIGUREN.map((f) => f.id)).size).toBe(FIGUREN.length);
    for (const f of FIGUREN) expect(new Set(ids(f)).size, f.id).toBe(ids(f).length);
  });

  it.each(jeFigur)('%s: poses name only its parts, faces and extras', (_, f) => {
    const teile = new Set(ids(f));
    const oben = new Set(f.teile.map((t) => t.id));
    for (const [name, p] of Object.entries(f.posen)) {
      expect(f.gesichter, `${name}: Gesicht`).toContain(p.gesicht);
      for (const t of Object.keys(p.winkel ?? {})) expect(teile.has(t), `${name}: ${t}`).toBe(true);
      for (const t of p.vorne ?? []) expect(oben.has(t), `${name}: vorne ${t}`).toBe(true);
      for (const e of p.extras ?? []) expect(f.extras?.[e], `${name}: extra ${e}`).toBeTypeOf('function');
    }
  });

  it.each(jeFigur)('%s: each listed move moves one of its parts and uses its faces', (_, f) => {
    const teile = new Set([...ids(f), 'ganz']);
    for (const a of f.animationen) {
      expect(ANIMATIONEN[a], a).toBeDefined();
      expect(Object.keys(ANIMATIONEN[a].spuren).some((t) => teile.has(t)), a).toBe(true);
      for (const [, g] of ANIMATIONEN[a].gesichter ?? []) expect(f.gesichter, `${a}: Gesicht`).toContain(g);
    }
  });

  it('draws every figure in every pose with every move, at several times', () => {
    for (const f of FIGUREN)
      for (const pose of Object.keys(f.posen))
        for (const animation of [undefined, ...f.animationen])
          for (const zeit of [0, 0.37, 3.1]) {
            const svg = renderToStaticMarkup(<FigurBild figur={f} pose={pose} animation={animation} zeit={zeit} />);
            for (const t of ids(f)) expect(svg, `${f.id}/${pose}`).toContain(`data-teil="${t}"`);
            expect(svg, `${f.id}/${pose}/${animation}/${zeit}`).not.toMatch(/NaN|undefined|Infinity/);
          }
  });
});

describe('moves', () => {
  it('only name parts some figure has', () => {
    const teile = new Set(['ganz', ...FIGUREN.flatMap(ids)]);
    for (const a of Object.values(ANIMATIONEN)) for (const t of Object.keys(a.spuren)) expect(teile.has(t), `${a.id}: ${t}`).toBe(true);
  });

  it('loop seamlessly, and moves that end start and end at rest (so the pose stands after them)', () => {
    for (const a of Object.values(ANIMATIONEN))
      for (const [t, s] of Object.entries(a.spuren)) {
        for (const w of [s.drehen, s.schieben, s.strecken]) if (w) expect(w.at(-1), `${a.id}/${t}: Schleife`).toEqual(w[0]);
        if (a.wiederholen === 'immer') continue;
        if (s.drehen) expect([s.drehen[0], s.drehen.at(-1)], `${a.id}/${t}`).toEqual([0, 0]);
        if (s.schieben) expect([s.schieben[0], s.schieben.at(-1)], `${a.id}/${t}`).toEqual([[0, 0], [0, 0]]);
        if (s.strecken) expect([s.strecken[0], s.strecken.at(-1)], `${a.id}/${t}`).toEqual([[1, 1], [1, 1]]);
      }
  });

  it('have keyframe times that fit their tracks', () => {
    for (const a of Object.values(ANIMATIONEN)) {
      if (!a.zeiten) continue;
      expect(a.zeiten[0], a.id).toBe(0);
      expect(a.zeiten.at(-1), a.id).toBe(1);
      for (const s of Object.values(a.spuren)) for (const w of [s.drehen, s.schieben, s.strecken]) if (w) expect(w.length, a.id).toBe(a.zeiten.length);
    }
  });

  it('shifts a loop without breaking it', () => {
    expect(versetzt([0, 9, 0, -9, 0], 1)).toEqual([9, 0, -9, 0, 9]);
  });
});

describe('motion engine', () => {
  const a: Animation = { id: 't', name: 'T', dauer: 2, wiederholen: 2, kurve: 'linear', spuren: { kopf: { drehen: [0, 10, 0] }, ganz: { schieben: [[0, 0], [0, -8], [0, 0]] } } };

  it('finds the phase and stops after the last run', () => {
    expect(phase(a, 0.5)).toBe(0.25);
    expect(phase(a, 2.5)).toBe(0.25);
    expect(phase(a, 4)).toBeNull();
    expect(phase({ ...a, wiederholen: 'immer' }, 9)).toBe(0.5);
  });

  it('samples tracks between keyframes', () => {
    expect(abtasten(a.spuren.kopf, a, 0.25).drehen).toBe(5);
    expect(abtasten(a.spuren.ganz, a, 0.5).schieben).toEqual([0, -8]);
    expect(abtasten({ drehen: [0, 10] }, { kurve: 'weich' }, 0.5).drehen).toBeCloseTo(5);
  });

  it('adds the move to the pose and returns to the pose when done', () => {
    const pose = { name: 'P', gesicht: 'froh', winkel: { kopf: 20 } };
    expect(stellung(pose, { animation: a, zeit: 0.5 }).teile.kopf.drehen).toBe(25);
    expect(stellung(pose, { animation: a, zeit: 0.5 }).ganz.schieben).toEqual([0, -4]);
    const fertig = stellung(pose, { animation: a, zeit: 5 });
    expect(fertig.teile.kopf.drehen).toBe(20);
    expect(fertig.ganz.schieben).toEqual([0, 0]);
  });

  it('switches faces during a move', () => {
    const pose = { name: 'P', gesicht: 'froh' };
    expect(stellung(pose, { animation: { ...a, gesichter: [[0.5, 'au']] }, zeit: 0.4 }).gesicht).toBe('froh');
    expect(stellung(pose, { animation: { ...a, gesichter: [[0.5, 'au']] }, zeit: 1.2 }).gesicht).toBe('au');
  });

  it('blinks briefly and only when alive', () => {
    expect(blinzelt(1)).toBe(false);
    expect(blinzelt(3.05)).toBe(true);
    expect(stellung({ name: 'P', gesicht: 'froh' }, { zeit: 3.05 }).augenZu).toBe(false);
    expect(stellung({ name: 'P', gesicht: 'froh' }, { zeit: 3.05, lebendig: true }).augenZu).toBe(true);
  });

  it('blends two poses', () => {
    const von = { name: 'A', gesicht: 'froh', winkel: { arm: 0 } };
    const nach = { name: 'B', gesicht: 'jubel', winkel: { arm: 90 }, extras: ['sterne'] };
    expect(mischePosen(von, nach, 0).winkel).toEqual({ arm: 0 });
    expect(mischePosen(von, nach, 1).winkel).toEqual({ arm: 90 });
    expect(mischePosen(von, nach, 0.5).winkel!.arm).toBeCloseTo(45);
    expect(mischePosen(von, nach, 0.8).gesicht).toBe('jubel');
  });

  it('writes transforms only for what moves', () => {
    expect(transform({ drehen: 0, schieben: [0, 0], strecken: [1, 1] }, [10, 20])).toBeUndefined();
    expect(transform({ drehen: 15, schieben: [2, 0], strecken: [1, 1.1] }, [10, 20])).toBe('translate(2 0) rotate(15 10 20) translate(10 20) scale(1 1.1) translate(-10 -20)');
  });
});

describe('items', () => {
  it('sit on an anchor some figure has, and draw as icon and worn, still and moving', () => {
    const plaetze = new Set(FIGUREN.flatMap(anker));
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const i of ITEMS) {
      expect(plaetze.has(i.platz), i.id).toBe(true);
      for (const zeit of [0, 1.3]) {
        const icon = renderToStaticMarkup(<ItemBild item={i} zeit={zeit} />);
        expect(icon).toContain(`data-item="${i.id}"`);
        expect(icon, i.id).not.toMatch(/NaN|undefined/);
      }
      const traeger = FIGUREN.find((f) => anker(f).includes(i.platz))!;
      expect(renderToStaticMarkup(<FigurBild figur={traeger} items={[i]} zeit={0} />)).toContain(`data-item="${i.id}"`);
    }
  });

  it('say so when they move by themselves', () => {
    for (const i of ITEMS) {
      const still = renderToStaticMarkup(<ItemBild item={i} zeit={0} />);
      const spaeter = renderToStaticMarkup(<ItemBild item={i} zeit={0.7} />);
      expect(still !== spaeter, i.id).toBe(!!i.bewegt);
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
