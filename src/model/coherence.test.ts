import { describe, expect, it } from 'vitest';
import { coherence, materialRefs } from './coherence';
import { createBlock as b, createPage } from './ops';
import type { Block, Doc, Page } from './types';

const page = (blocks: Block[], type: Page['type'] = 'uebung'): Page => ({ ...createPage(), type, blocks });
const doc = (...pages: Page[]): Doc => ({ icon: '', lang: 'de', help: true, footer: '', code: '', pages });
const kinds = (d: Doc) => coherence(d).map((f) => `${f.kind} ${f.ref}`);

describe('materialRefs', () => {
  it('reads single numbers, lists and ranges', () => {
    expect(materialRefs('Lies M1 und vergleiche mit M 3.')).toEqual(['M1', 'M3']);
    expect(materialRefs('Werte M2–M4 aus.')).toEqual(['M2', 'M3', 'M4']);
    expect(materialRefs('Nutze m1-3.')).toEqual(['M1', 'M2', 'M3']);
    expect(materialRefs('Niveau M, Klasse 7')).toEqual([]);
  });
});

describe('coherence', () => {
  it('accepts a lesson whose tasks use material that comes before them', () => {
    const d = doc(
      page([b('path', { steps: 'M1 | lesen | Aufgabe 1 | Idee' })], 'lehrkraft'),
      page([b('text', { mat: 'M1', text: 'Info' }), b('open', { prompt: 'Erkläre mit M1 …' }), b('mc', { prompt: 'Kreuze an.' })]),
    );
    expect(kinds(d)).toEqual([]);
  });

  it('finds missing material, material after the task and unused material', () => {
    const d = doc(
      page([b('open', { prompt: 'Erkläre mit M2 und M3.' }), b('image', { mat: 'M2' }), b('text', { mat: 'M4' })]),
    );
    expect(kinds(d)).toEqual(['material S1.1', 'reihenfolge S1.1', 'unbenutzt S1.3']);
  });

  it('counts material on earlier pages as before', () => {
    const d = doc(page([b('reading', { mat: 'M1' })]), page([b('open', { prompt: 'Read M1 again.' })]));
    expect(kinds(d)).toEqual([]);
  });

  it('flags a number used twice', () => {
    const d = doc(page([b('text', { mat: 'M1' }), b('image', { mat: 'm 1' }), b('open', { prompt: 'M1' })]));
    expect(kinds(d)).toEqual(['doppelt S1.2']);
  });

  it('flags the same kind of task twice in a row, open questions only from the third', () => {
    const d = doc(
      page([
        b('text', { mat: 'M1' }),
        b('gap', { prompt: 'M1' }),
        b('gap', { prompt: 'M1' }),
        b('open', { prompt: 'M1' }),
        b('open', { prompt: 'M1' }),
        b('heading'),
        b('open', { prompt: 'M1' }),
      ]),
    );
    expect(kinds(d)).toEqual(['abwechslung S1.3', 'abwechslung S1.7']);
    const halves = doc(page([b('text', { mat: 'M1' }), b('gap', { prompt: 'M1' }, 6), b('gap', { prompt: 'M1' }, 6), b('mc', { prompt: 'M1' })]));
    expect(kinds(halves)).toEqual([]);
  });

  it('asks for material when a lesson has tasks but no numbered material', () => {
    const d = doc(page([b('open'), b('mc')]));
    expect(kinds(d)).toEqual(['ohne-material ']);
  });

  it('checks the learning path: missing on the teacher page, unknown material', () => {
    expect(kinds(doc(page([b('goal')], 'lehrkraft'), page([b('text', { mat: 'M1' }), b('open', { prompt: 'M1' })])))).toEqual(['lernweg ']);
    const d = doc(page([b('path', { steps: 'M1, M5 | … | Aufgabe 1 | …' })], 'lehrkraft'), page([b('text', { mat: 'M1' }), b('open', { prompt: 'M1' })]));
    expect(kinds(d)).toEqual(['lernweg S1.1']);
  });

  it('ignores material numbers on teacher pages', () => {
    const d = doc(page([b('text', { mat: 'M1' }), b('path', { steps: 'M1 | … | … | …' })], 'lehrkraft'), page([b('open', { prompt: 'M1' })]));
    expect(kinds(d)).toEqual(['material S2.1', 'lernweg S1.2']);
  });

  it('finds words in a Merksatz the sheets did not have before', () => {
    const d = doc(
      page([
        b('text', { mat: 'M1', text: 'Treibhausgase halten Wärmestrahlung zurück.' }),
        b('open', { prompt: 'Erkläre mit M1.' }),
        b('merksatz', { text: 'Treibhausgase halten [[Wärmestrahlung]] zurück, das heißt [[Absorption]].' }),
      ]),
    );
    expect(coherence(d).map((f) => [f.kind, f.problem.slice(0, 13)])).toEqual([['merksatz', '„Absorption“ ']]);
  });
});
