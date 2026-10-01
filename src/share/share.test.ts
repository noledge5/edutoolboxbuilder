import { describe, expect, it } from 'vitest';
import { createBlock } from '../model/ops';
import { seedDoc } from '../model/seed';
import { handoutPages, handoutTasks, handoutTitle, readAssignment, studentPages, type Handout, type Submission } from './assignment';
import { newKeyPair, open, randomId, seal } from './crypto';
import { evaluate, latestSubmissions } from './evaluate';
import { gradeTask, isRight, normalize, stripSolutions, taskSlots } from './grade';

const gap = createBlock('gap', { prompt: 'Ergänze.', text: 'Die [[Sonne]] wärmt die [[Erde / Erdoberfläche]]. Dann ___.' });
const mc = createBlock('mc', { prompt: 'Welches Glas?', options: 'Glas A\n*Glas B\ngleich' });
const multi = createBlock('mc', { prompt: 'Treibhausgase?', options: '*CO₂\nStickstoff\n*Methan' });
const tf = createBlock('truefalse', { prompt: 'Richtig oder falsch?', items: 'CO₂ ist ein Gas. | R\nDer Mond ist warm. | F', mode: 'tf' });
const match = createBlock('match', { prompt: 'Verbinde.', left: 'Wetter\nKlima', right: 'langfristig\nkurzfristig', solution: '2, 1' });
const table = createBlock('table', { prompt: 'Trage ein.', cols: 'Zeit\nGlas A\nGlas B', rows: '0 min\n15 min', solution: '20 | 20\n24 | 27' });
const jumble = createBlock('jumble', { prompt: 'Order.', items: 'I go to school.' });
const open1 = createBlock('open', { prompt: 'Erkläre.', solution: 'Weil …' });

describe('slots and grading', () => {
  it('cuts tasks into parts with their solutions', () => {
    expect(taskSlots(gap).map((s) => s.expected)).toEqual(['Sonne', 'Erde / Erdoberfläche', '']);
    expect(taskSlots(mc)[0]).toMatchObject({ kind: 'choice', expected: '1' });
    expect(taskSlots(multi)[0]).toMatchObject({ kind: 'multi', expected: '0|2' });
    expect(taskSlots(tf).map((s) => [s.expected, s.options?.length])).toEqual([
      ['T', 2],
      ['F', 2],
    ]);
    expect(taskSlots(match).map((s) => s.expected)).toEqual(['2', '1']);
    expect(taskSlots(table).map((s) => s.key)).toEqual(['t0-0', 't0-1', 't1-0', 't1-1']);
    expect(taskSlots(jumble)[0]).toMatchObject({ kind: 'order', expected: 'I go to school.' });
    expect(taskSlots(open1)[0].kind).toBe('free');
  });

  it('compares typed answers kindly: case, spaces, end punctuation, alternatives', () => {
    expect(normalize('  Die  Sonne. ')).toBe('die sonne');
    const [sun, earth, free] = taskSlots(gap);
    expect(isRight(sun, 'sonne')).toBe(true);
    expect(isRight(earth, 'Erdoberfläche')).toBe(true);
    expect(isRight(earth, 'Mond')).toBe(false);
    expect(isRight(free, 'egal')).toBeNull();
    expect(isRight(taskSlots(multi)[0], '2|0')).toBe(true);
    expect(isRight(taskSlots(multi)[0], '0')).toBe(false);
    expect(isRight(taskSlots(jumble)[0], 'I go to school')).toBe(true);
    const g = gradeTask(gap, { g0: 'Sonne', g1: 'Luft' });
    expect([g.right, g.total]).toEqual([1, 2]);
  });

  it('takes the solutions out for a test, keeping the structure', () => {
    expect(stripSolutions(gap).props.text).toBe('Die [[]] wärmt die [[]]. Dann ___.');
    expect(stripSolutions(mc).props.options).toBe('Glas A\nGlas B\ngleich');
    expect(stripSolutions(tf).props.items).toBe('CO₂ ist ein Gas.\nDer Mond ist warm.');
    expect(stripSolutions(match).props.solution).toBe('');
    expect(stripSolutions(table).props.solution).toBe('');
    const merk = createBlock('merksatz', { text: 'Die [[Sonne]] wärmt.' });
    expect(stripSolutions(merk).props.text).toBe('Die [[]] wärmt.');
    expect(stripSolutions(createBlock('listening', { transcript: 'A: Hi!' })).props.transcript).toBe('');
    const parts = String(stripSolutions(jumble).props.items);
    expect(parts).toContain(' / ');
    expect(parts).not.toContain('=');
    // The parts stay answerable: same slots, no expected answers.
    expect(taskSlots(stripSolutions(gap)).map((s) => s.expected)).toEqual(['', '', '']);
    expect(taskSlots(stripSolutions(jumble))[0].options?.length).toBe(5);
  });
});

describe('handing out', () => {
  it('takes the chosen blocks or all pages for the class, without teacher blocks', () => {
    const doc = seedDoc();
    const all = handoutPages(doc, null);
    expect(all.every((p) => p.type !== 'lehrkraft')).toBe(true);
    expect(all.flatMap((p) => p.blocks).some((b) => ['plan', 'goal', 'expect', 'recall'].includes(b.type))).toBe(false);
    const one = doc.pages.flatMap((p) => p.blocks).find((b) => b.type === 'mc')!;
    const pages = handoutPages(doc, [one.id]);
    expect(pages).toHaveLength(1);
    expect(pages[0].blocks).toEqual([one]);
    expect(handoutTitle(pages, 'Stunde')).toBe(String(one.props.prompt));
    expect(handoutTasks(all).length).toBeGreaterThan(2);
    expect(studentPages(pages, 'test')[0].blocks[0].props.options).not.toContain('*');
    expect(studentPages(pages, 'uebung')).toBe(pages);
    expect(readAssignment({ format: 'baukasten-auftrag', id: 'x', pages: [], key: {} })?.mode).toBe('uebung');
    expect(readAssignment({ format: 'anders' })).toBeNull();
  });
});

describe('encryption', () => {
  it('only the handout key opens what a student sealed', async () => {
    const keys = await newKeyPair();
    const other = await newKeyPair();
    const sealed = await seal({ name: 'Lea M.', answers: { a: { g0: 'Sonne' } } }, keys.publicKey);
    expect(sealed).not.toContain('Lea');
    expect(await open(sealed, keys.privateKey)).toEqual({ name: 'Lea M.', answers: { a: { g0: 'Sonne' } } });
    await expect(open(sealed, other.privateKey)).rejects.toThrow();
    expect(randomId()).toMatch(/^[A-Za-z0-9]{10}$/);
  });
});

describe('evaluation', () => {
  const handout: Handout = {
    id: 'h1',
    lessonId: 'l1',
    title: 'Test',
    mode: 'uebung',
    url: '',
    privateKey: {},
    createdAt: 0,
    updatedAt: 0,
    pages: [{ title: 'S1', kicker: '', type: 'uebung', blocks: [{ ...mc, props: { ...mc.props, competence: 'k1' } }, gap] }],
  };
  const sub = (name: string, at: number, answers: Submission['answers'], done = true): Submission => ({ name, done, answers, first: {}, checks: {}, started: 0, at });

  it('takes the last state per student and finds frequent mistakes', () => {
    const latest = latestSubmissions([
      { abgabe: 'a', data: sub('Lea M.', 1, {}, false) },
      { abgabe: 'b', data: sub('Tom K.', 2, { [mc.id]: { a: '0' }, [gap.id]: { g0: 'Mond', g1: 'Erde' } }) },
      { abgabe: 'a', data: sub('Lea M.', 3, { [mc.id]: { a: '1' }, [gap.id]: { g0: 'Sonne', g1: 'Erde' } }) },
      { abgabe: 'c', data: sub('Ali S.', 4, { [mc.id]: { a: '0' } }) },
    ]);
    expect(latest.size).toBe(3);
    const r = evaluate(handout, latest);
    expect(r.students.map((s) => [s.name, s.right, s.total])).toEqual([
      ['Ali S.', 0, 3],
      ['Lea M.', 3, 3],
      ['Tom K.', 1, 3],
    ]);
    const [mcSum, gapSum] = r.summaries;
    expect(mcSum.answered).toBe(3);
    expect(mcSum.share).toBeCloseTo(1 / 3);
    expect(mcSum.mistakes[0]).toMatchObject({ expected: 'Glas B', wrong: [{ answer: 'Glas A', count: 2 }] });
    expect(gapSum.mistakes[0]).toMatchObject({ slotLabel: '1. Lücke', wrong: [{ answer: 'Mond', count: 1 }] });
    expect(r.competences[0].id).toBe('k1');
    expect(r.competences[0].byStudent[latest.keys().next().value!]).toBe(1);
  });
});

describe('evaluation of practice', () => {
  it('counts mistakes from the first check', () => {
    const handout: Handout = {
      id: 'h',
      lessonId: 'l',
      title: 'Ü',
      mode: 'uebung',
      url: '',
      privateKey: {},
      createdAt: 0,
      updatedAt: 0,
      pages: [{ title: '', kicker: '', type: 'uebung', blocks: [mc] }],
    };
    const s: Submission = { name: 'Lea M.', done: true, answers: { [mc.id]: { a: '1' } }, first: { [mc.id]: { a: '2' } }, checks: { [mc.id]: 2 }, started: 0, at: 1 };
    const r = evaluate(handout, new Map([['a', s]]));
    expect(r.summaries[0].share).toBe(1);
    expect(r.summaries[0].firstShare).toBe(0);
    expect(r.summaries[0].mistakes[0].wrong).toEqual([{ answer: 'gleich', count: 1 }]);
    expect(r.students[0].firstTry[0]?.right).toBe(0);
  });
});
