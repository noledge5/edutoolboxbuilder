import { describe, expect, it } from 'vitest';
import { boardFromInk, deckOrder, hasInk, hitStroke, inkFromBoard, mapStrokes, normalizeBoards, normalizeStrokes, strokeBounds, strokePath, type Stroke } from './ink';
import { createElement, createSlide, gapCount, leanSlide, nextStep, normalizeSlides, stepCount, workSteps } from './slides';

const stroke = (points: number[], patch: Partial<Stroke> = {}): Stroke => ({ tool: 'pen', color: 'red', size: 10, points, pressure: false, line: false, arrow: false, ...patch });

describe('ink', () => {
  it('reads strokes leniently and draws them as outlines', () => {
    const s = normalizeStrokes([{ tool: 'marker', color: 'lila', size: 500, points: [10, 10, 0.5, 50, 60, 0.5] }, { points: [1, 2] }, 'x']);
    expect(s).toEqual([stroke([10, 10, 0.5, 50, 60, 0.5], { tool: 'marker', color: 'dark', size: 80 })]);
    expect(strokePath(s[0])).toMatch(/^M-?[\d.]+,-?[\d.]+ Q/);
    // A dot and a straight line with an arrow head draw too.
    expect(strokePath(stroke([5, 5, 0.5]))).toMatch(/Z$/);
    expect(strokePath(stroke([0, 0, 0.5, 300, 0, 0.5], { line: true, arrow: true })).match(/M/g)?.length).toBe(2);
  });

  it('erases what the eraser touches and knows the box around strokes', () => {
    const s = stroke([0, 0, 0.5, 100, 0, 0.5, 100, 100, 0.5]);
    expect(hitStroke(s, 50, 8, 4)).toBe(true);
    expect(hitStroke(s, 50, 40, 4)).toBe(false);
    expect(hitStroke({ ...s, line: true }, 50, 50, 4)).toBe(true);
    expect(strokeBounds([s])).toEqual({ x: -5, y: -5, w: 110, h: 110 });
    expect(strokeBounds([])).toBeNull();
    expect(mapStrokes([s], (x, y) => [x / 2, y / 2], 0.5)[0]).toMatchObject({ points: [0, 0, 0.5, 50, 0, 0.5, 50, 50, 0.5], size: 5 });
  });

  it('puts blank boards after their page and keeps them in a Tafelbild', () => {
    const slides = [{ id: 'a' }, { id: 'b' }];
    const blanks = [
      { id: 'x', after: 'a', paper: 'grid' as const },
      { id: 'y', after: 'x', paper: 'white' as const },
      { id: 'z', after: 'gone', paper: 'lines' as const },
    ];
    expect(deckOrder(slides, blanks).map((d) => `${d.id}:${d.number}`)).toEqual(['a:1', 'x:1', 'y:1', 'b:2', 'z:2']);
    const ink = { a: [stroke([1, 1, 0.5])], b: [], x: [stroke([2, 2, 0.5])] };
    expect(hasInk({}, [])).toBe(false);
    expect(hasInk(ink, [])).toBe(true);
    const board = boardFromInk(ink, blanks.slice(0, 2), ['a', 'b'], 'Tafelbild', 5);
    // Slides without strokes are left out, blank boards stay (also empty ones).
    expect(board.pages.map((p) => p.slideId || p.id)).toEqual(['a', 'x', 'y']);
    const back = inkFromBoard(board);
    expect(back.blanks).toEqual(blanks.slice(0, 2));
    expect(back.ink).toEqual({ a: ink.a, x: ink.x, y: [] });
    expect(normalizeBoards(JSON.parse(JSON.stringify([board, { pages: [] }])))).toEqual([board]);
  });
});

describe('tapping open while presenting', () => {
  it('skips clicks whose answers were all tapped open', () => {
    const list = { ...createSlide('list'), items: 'A? | a\nB? | b\nC? | c', reveal: true };
    expect(stepCount(list)).toBe(3);
    expect(nextStep(list, 0, new Set())).toBe(1);
    expect(nextStep(list, 0, new Set(['answer:0', 'answer:1']))).toBe(3);
    expect(nextStep(list, 2, new Set(['answer:2']))).toBeNull();
    // Without cards nothing is tapped open, every click counts.
    expect(nextStep({ ...list, cards: false }, 0, new Set(['answer:0']))).toBe(1);
  });

  it('counts gaps and lets covers go on their click or when tapped', () => {
    const exit = { ...createSlide('exit'), title: 'Die [[Sonne]] wärmt die [[Erde]].', reveal: true };
    expect(gapCount(exit, 'gaps')).toBe(2);
    const task = { ...createSlide('task'), items: 'Ich [[bin]] Tom.\nOhne Lücke', reveal: true };
    expect(gapCount(task, 'answer:0')).toBe(1);
    expect(gapCount(task, 'answer:1')).toBe(0);
    const cover = createElement('cover', { step: 1 });
    const s = { ...createSlide('image'), elements: [cover, createElement('cover')] };
    expect(stepCount(s)).toBe(1);
    expect(nextStep(s, 0, new Set())).toBe(1);
    expect(nextStep(s, 0, new Set([`el:${cover.id}`]))).toBeNull();
  });

  it('reads the steps of a work phase', () => {
    const w = createSlide('work');
    expect(workSteps(w)).toEqual([
      { form: 'allein', who: 'Ich', text: 'Lies M1 und markiere die Ursachen.', minutes: 5 },
      { form: 'zu zweit', who: 'Du', text: 'Vergleicht eure Ergebnisse.', minutes: 5 },
      { form: 'Plenum', who: 'Wir', text: 'Stellt eure Ergebnisse vor.', minutes: 5 },
    ]);
    expect(workSteps({ ...w, items: 'Zeit: 12 Uhr | x' })[0]).toEqual({ form: '', who: '', text: 'Zeit: 12 Uhr', minutes: 0 });
    // One click per further step: the timer starts for each.
    expect(stepCount(w)).toBe(2);
    expect(nextStep(w, 0, new Set())).toBe(1);
  });

  it('keeps sketches and new fields in files', () => {
    const ink = createElement('ink', { strokes: [stroke([1, 2, 0.5, 3, 4, 0.5])], vw: 600, vh: 300 });
    const s = { ...createSlide('blank'), vote: true, elements: [ink, createElement('cover', { step: 2, text: 'Fluss' })] };
    const lean = leanSlide(s);
    expect(lean).toMatchObject({ vote: true });
    expect(lean.elements?.[1]).toEqual({ kind: 'cover', step: 2, text: 'Fluss' });
    const back = normalizeSlides(JSON.parse(JSON.stringify([lean])))[0];
    expect(back.elements[0]).toMatchObject({ kind: 'ink', vw: 600, vh: 300, strokes: ink.strokes });
    expect(back).toMatchObject({ vote: true, cards: true });
    expect(normalizeSlides([{ layout: 'task', cards: false }])[0].cards).toBe(false);
  });
});
