import { describe, expect, it } from 'vitest';
import { slidesFromDoc } from '../slides/fromDoc';
import { createBlock } from './ops';
import { seedDoc, seedSlides } from './seed';
import type { Doc } from './types';
import { videoInfo } from '../slides/elements';
import {
  createElement,
  createSlide,
  editText,
  hasReveal,
  itemSteps,
  leanSlide,
  mapSlideImages,
  normalizeSlides,
  partSteps,
  setEditText,
  SLIDE_LAYOUT_ORDER,
  slideImages,
  slideItems,
  slideParts,
  stepCount,
  type Slide,
} from './slides';

describe('slides', () => {
  it('have example content for every layout', () => {
    for (const layout of SLIDE_LAYOUT_ORDER) expect(createSlide(layout)).toMatchObject({ layout, title: expect.any(String) });
  });

  it('are read leniently and repaired with notes', () => {
    const notes: string[] = [];
    const slides = normalizeSlides(
      [{ layout: 'list', type: 'sicherung', title: 'Fragen', items: ['A? | a', 'B?'], form: 'zu zweit', minutes: '5', reveal: true }, { layout: 'bubbles', type: 'rosa' }, 'x'],
      (n) => notes.push(n),
    );
    expect(slides).toHaveLength(2);
    expect(slides[0]).toMatchObject({ layout: 'list', type: 'sicherung', items: 'A? | a\nB?', form: 'zu zweit', minutes: 5, reveal: true });
    expect(slides[1]).toMatchObject({ layout: 'statement', type: 'uebung' });
    expect(notes).toHaveLength(3);
    expect(normalizeSlides(undefined)).toEqual([]);
  });

  it('split entries, know when there is something to uncover and leave defaults out of files', () => {
    expect(slideItems('A? | a\n\nB?')).toEqual([
      ['A?', 'a'],
      ['B?', ''],
    ]);
    const list = { ...createSlide('list'), reveal: true };
    expect(hasReveal(list)).toBe(true);
    expect(hasReveal({ ...list, items: 'ohne Antwort' })).toBe(false);
    // Box texts of a comparison can come on a click too (solutions); a title slide has nothing to uncover.
    expect(hasReveal({ ...createSlide('compare'), reveal: true })).toBe(true);
    expect(hasReveal({ ...createSlide('title'), reveal: true })).toBe(false);
    expect(leanSlide({ ...createSlide('statement'), image: '', notes: '' })).not.toHaveProperty('image');
  });

  it('are suggested from the worksheets: title, every task with its solution, Merksatz as exit', () => {
    const doc = seedDoc();
    const teacher = { title: 'Stundenverlauf', kicker: '', type: 'lehrkraft' as const, form: 'Plenum' as const, nameField: 'aus' as const, blocks: [] };
    const slides = slidesFromDoc(doc, 'Der Treibhauseffekt');
    expect(slides[0]).toMatchObject({ layout: 'title', title: 'Der Treibhauseffekt' });
    // The multiple choice task of the experiment page: the right answer comes on a click.
    const mc = slides.find((s) => s.layout === 'task' && s.type === 'versuch' && s.items.includes('✓'))!;
    expect(mc).toMatchObject({ label: 'Aufgabe 1 · S. 1', phase: 'Versuch', reveal: true });
    expect(hasReveal(mc)).toBe(true);
    expect(slides.some((s) => s.layout === 'task' && s.text.includes('Folie'))).toBe(true);
    expect(slides.some((s) => s.layout === 'flow')).toBe(true);
    const exit = slides[slides.length - 1];
    expect(exit).toMatchObject({ layout: 'exit', label: 'Merksatz', title: expect.stringContaining('[[Mechanismus]]'), reveal: true });
    expect(partSteps(exit).get('gaps')).toMatchObject({ step: 1, answer: true });
    expect(slidesFromDoc({ ...doc, pages: [teacher] }, 'Leer')).toHaveLength(1);
  });

  it('turn each kind of task into entries with their solutions', () => {
    const page = (blocks: Doc['pages'][number]['blocks']) => ({ title: 'Übung', kicker: '', type: 'uebung' as const, form: 'allein' as const, nameField: 'aus' as const, blocks });
    const doc: Doc = {
      icon: 'globe',
      lang: 'en',
      help: true,
      footer: '',
      code: '',
      pages: [
        page([
          createBlock('image', { caption: 'Abb. 1: The classroom', image: 'img-1', source: 'Wikimedia' }),
          createBlock('match', { prompt: 'Match.', left: 'dog\ncat', right: 'Katze\nHund', solution: '2, 1', level: 2, points: 4 }),
          createBlock('truefalse', { prompt: 'True or false?', items: 'Emma is eleven. | T\nBen is a teacher. | NG', mode: 'tfn', help: 'Richtig oder falsch?' }),
          createBlock('table', { prompt: 'Complete.', cols: 'Person\nAge\nTown', rows: 'Emma\nBen', solution: '11 | Bristol\n12 | Bath' }),
          createBlock('qr', { url: 'https://example.org/song', caption: 'Listen to the song.' }),
        ]),
        page([createBlock('gap', { prompt: 'Fill in.', text: 'I [[am]] Tom.\nShe ___ Emma.' }), createBlock('image', { caption: 'A map', image: 'img-2' })]),
      ],
    };
    const slides = slidesFromDoc(doc, 'Hello');
    expect(slides.map((s) => s.layout)).toEqual(['title', 'task', 'task', 'task', 'blank', 'task', 'image']);
    const [, match, tf, table, qr, gap, image] = slides;
    // A picture right before a task goes on the task's slide.
    expect(match).toMatchObject({ label: 'Task 1 · p. 1 · ★★☆ · 4 pts', items: 'dog | Hund\ncat | Katze', image: 'img-1', source: 'Wikimedia' });
    expect(tf).toMatchObject({ help: 'Richtig oder falsch?', items: 'Emma is eleven. | true\nBen is a teacher. | not in the text' });
    expect(table.items).toBe('Emma | Age: 11 · Town: Bristol\nBen | Age: 12 · Town: Bath');
    expect(qr.elements[0]).toMatchObject({ kind: 'qr', url: 'https://example.org/song' });
    expect(gap).toMatchObject({ label: 'Task 1 · p. 2', items: 'I [[am]] Tom.\nShe ___ Emma.' });
    // The words in the gaps come on a click; a gap without a given word has nothing to uncover.
    expect(itemSteps(gap)).toEqual([
      { item: 0, answer: 1 },
      { item: 0, answer: 0 },
    ]);
    expect(image).toMatchObject({ title: 'A map', image: 'img-2' });
  });

  it('edit single texts right on the slide', () => {
    const s = { ...createSlide('list'), items: 'A? | a\n\nB?', elements: [{ ...createElement('text', { text: 'Hallo' }), id: 't1' }] };
    expect(editText(s, 'item:1')).toBe('B?');
    expect(editText(s, 'answer:0')).toBe('a');
    expect(editText(s, 'el:t1')).toBe('Hallo');
    expect(editText(s, 'item:5')).toBeNull();
    // Entries stay one line each; an answer can be added or taken away.
    expect(setEditText(s, 'item:1', 'Neue | Frage\nzwei')).toEqual({ items: 'A? | a\n\nNeue / Frage zwei' });
    expect(setEditText(s, 'answer:1', 'b')).toEqual({ items: 'A? | a\n\nB? | b' });
    expect(setEditText(s, 'answer:0', '')).toEqual({ items: 'A?\n\nB?' });
    expect(setEditText(s, 'phase', 'Ein\nstieg')).toEqual({ phase: 'Ein stieg' });
    expect(setEditText(s, 'el:t1', 'Zeile 1\nZeile 2').elements?.[0].text).toBe('Zeile 1\nZeile 2');
  });

  it('show the solution of a task after the answers of its entries', () => {
    const task = { ...createSlide('task'), items: 'A? | a\nB? | b', text: 'Lösung', reveal: true };
    // Under cards each answer has its own click, the solution comes last.
    expect(itemSteps(task)).toEqual([
      { item: 0, answer: 1 },
      { item: 0, answer: 2 },
    ]);
    expect(partSteps(task).get('text')).toMatchObject({ label: 'Lösung', step: 3, answer: true });
    // Without cards all answers come together, the solution with them.
    expect(partSteps({ ...task, cards: false }).get('text')).toMatchObject({ step: 1 });
    expect(partSteps({ ...task, build: true }).get('text')?.step).toBe(5);
    expect(stepCount({ ...task, reveal: false })).toBe(0);
  });

  it('come with the sample lesson', () => {
    const s = seedSlides();
    expect(s.map((x) => x.layout)).toEqual(['title', 'list', 'quote', 'compare', 'list', 'statement', 'flow', 'compare', 'exit']);
    expect(normalizeSlides(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe('slides with elements, steps and animations', () => {
  it('read elements, clamp them to the slide and fill in defaults', () => {
    const notes: string[] = [];
    const [s] = normalizeSlides(
      [
        {
          layout: 'blank',
          transition: 'push',
          elements: [{ kind: 'text', text: 'Hi', x: 1900, y: -5, w: 400, h: 100, step: 2, anim: 'zoom' }, { kind: 'sticker' }, { kind: 'video', url: 'https://youtu.be/abcdefghijk' }],
        },
      ],
      (n) => notes.push(n),
    );
    expect(s.transition).toBe('push');
    expect(s.elements).toHaveLength(2);
    expect(s.elements[0]).toMatchObject({ kind: 'text', x: 1520, y: 0, w: 400, h: 100, step: 2, anim: 'zoom', style: 'box' });
    expect(s.elements[1]).toMatchObject({ kind: 'video', w: 960, h: 540, step: 0 });
    expect(notes).toHaveLength(1);
    // Older slides without the new fields still read.
    expect(normalizeSlides([{ layout: 'list' }])[0]).toMatchObject({ build: false, itemAnim: 'rise', transition: 'none', elements: [] });
  });

  it('count the clicks: entries one by one, question and answer taking turns, elements on their click', () => {
    const list = { ...createSlide('list'), items: 'A? | a\nB? | b\nC?', reveal: true, cards: false };
    expect(itemSteps(list)).toEqual([
      { item: 0, answer: 1 },
      { item: 0, answer: 1 },
      { item: 0, answer: 0 },
    ]);
    expect(stepCount(list)).toBe(1);
    expect(itemSteps({ ...list, cards: true }).map((x) => x.answer)).toEqual([1, 2, 0]);
    const built = { ...list, build: true };
    expect(itemSteps(built)).toEqual([
      { item: 1, answer: 2 },
      { item: 3, answer: 4 },
      { item: 5, answer: 0 },
    ]);
    expect(stepCount(built)).toBe(5);
    const flow = { ...createSlide('flow'), build: true, elements: [createElement('text', { step: 7 })] };
    expect(itemSteps(flow).map((x) => x.item)).toEqual([1, 2, 3]);
    expect(stepCount(flow)).toBe(7);
    expect(stepCount(createSlide('title'))).toBe(0);
  });

  it('leave defaults out of files and keep pictures of elements', () => {
    const s = { ...createSlide('blank'), elements: [createElement('image', { image: 'bild', x: 100 })] };
    expect(leanSlide(s).elements).toEqual([{ kind: 'image', x: 100, image: 'bild' }]);
    expect(slideImages([s])).toEqual(['bild']);
    expect(mapSlideImages(s, (id) => id + '2').elements[0].image).toBe('bild2');
  });
});

describe('video links', () => {
  it('are recognised and embedded without cookies where possible', () => {
    expect(videoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')).toMatchObject({
      kind: 'youtube',
      src: expect.stringContaining('youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'),
      thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
    expect(videoInfo('https://youtu.be/dQw4w9WgXcQ?t=90').src).toContain('&start=90');
    expect(videoInfo('https://www.youtube.com/shorts/abcdefghijk').kind).toBe('youtube');
    expect(videoInfo('https://vimeo.com/76979871').src).toBe('https://player.vimeo.com/video/76979871');
    expect(videoInfo('https://example.org/film.mp4?x=1')).toMatchObject({ kind: 'file' });
    expect(videoInfo('keine Adresse').kind).toBe('unknown');
    expect(videoInfo('https://example.org/seite').kind).toBe('unknown');
  });
});

describe('single parts of a slide', () => {
  it('each get their own click and animation, overriding the entries one by one', () => {
    const s = { ...createSlide('list'), title: 'Fragen', text: 'Auftrag', items: 'A? | a\nB? | b', reveal: true, build: true };
    expect(slideParts(s).map((p) => [p.key, p.step])).toEqual([
      ['title', 0],
      ['text', 0],
      ['item:0', 1],
      ['answer:0', 2],
      ['item:1', 3],
      ['answer:1', 4],
    ]);
    // The heading comes last, zoomed in; the second answer together with the first.
    const own = { ...s, anims: { title: { step: 5, anim: 'zoom' as const }, 'answer:1': { step: 2, anim: 'fade' as const } } };
    const parts = partSteps(own);
    expect(parts.get('title')).toMatchObject({ step: 5, anim: 'zoom' });
    expect(itemSteps(own)).toEqual([
      { item: 1, answer: 2 },
      { item: 3, answer: 2 },
    ]);
    expect(stepCount(own)).toBe(5);
    expect(slideParts(own).find((p) => p.key === 'answer:0')).toMatchObject({ label: 'Antwort 1', answer: true });
  });

  it('are read from files, unknown parts left out, and written only when set', () => {
    const [s] = normalizeSlides([{ layout: 'statement', title: 'X', text: 'Hinweis', anims: { text: { step: 1 }, 'item:0': 2, bogus: { step: 3 } } }]);
    expect(s.anims).toEqual({ text: { step: 1, anim: 'fade' }, 'item:0': { step: 2, anim: 'fade' } });
    expect(stepCount(s)).toBe(1);
    expect(leanSlide(s).anims).toEqual(s.anims);
    expect(leanSlide(createSlide('statement'))).not.toHaveProperty('anims');
  });

  it('name the parts of every layout', () => {
    const labels = (s: Slide) => slideParts(s).map((p) => p.label);
    expect(labels(createSlide('quote'))).toEqual(['Zitat', 'Leitfrage']);
    expect(labels({ ...createSlide('image') })).toEqual(['Überschrift', 'Bild', 'Text neben dem Bild']);
    expect(labels(createSlide('compare'))).toEqual(['Überschrift', 'Kasten 1: Erster Begriff', 'Text im Kasten 1', 'Kasten 2: Zweiter Begriff', 'Text im Kasten 2']);
  });
});
