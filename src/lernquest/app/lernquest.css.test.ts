// Design rules of Lernquest (docs/design/lernquest/README.md, „Designregeln“): outside :root the stylesheet uses only
// tokens for colours, font sizes, spacing and corners, so the look stays one system.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./lernquest.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Everything after the token blocks (the first :root and its media query for larger screens).
const rules = css.replace(/:root\s*\{[^}]*\}/g, '');
const decls = [...rules.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map(([, prop, value]) => ({ prop, value: value.trim() }));

const TOKENS = [...css.matchAll(/(--lq-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);

describe('lernquest.css follows the design rules', () => {
  it('has no raw colours outside :root', () => {
    const bad = decls.filter((d) => /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(d.value));
    expect(bad).toEqual([]);
  });

  it('uses only the seven font sizes', () => {
    const sizes = decls.filter((d) => d.prop === 'font-size' && d.value !== 'inherit');
    const font = decls.filter((d) => d.prop === 'font' && d.value !== 'inherit');
    const bad = [...sizes.filter((d) => !/^var\(--lq-t-[a-z0-9]+\)$/.test(d.value)), ...font.filter((d) => /\d+px/.test(d.value))];
    expect(bad).toEqual([]);
  });

  it('puts spacing and corners on the grid', () => {
    const spacing = decls.filter((d) => /^(padding|margin|gap|row-gap|column-gap)(-[a-z]+)?$/.test(d.prop));
    const radius = decls.filter((d) => d.prop === 'border-radius');
    const bad = [
      ...spacing.filter((d) => /(?<![\w-])[1-9]\d*px/.test(d.value)),
      ...radius.filter((d) => /\d+px/.test(d.value)),
    ];
    expect(bad).toEqual([]);
  });

  it('only refers to tokens that exist', () => {
    const used = [...rules.matchAll(/var\((--lq-[a-z0-9-]+)/g)].map((m) => m[1]);
    expect([...new Set(used.filter((t) => !TOKENS.includes(t)))]).toEqual([]);
  });

  it('shows a focus ring for the keyboard', () => {
    expect(rules).toMatch(/:focus-visible\s*\{[^}]*outline:[^;]*var\(--lq-fokus\)/);
  });
});
