import { describe, expect, it } from 'vitest';
import { seedLibrary } from '../library/model';
import type { Page } from '../model/types';
import { lessonFromAnswer } from './lesson';
import { figuresOf, pdfPrompt, placePages, titleOf, withFigures } from './pdfImport';

const candidates = [
  { id: 'B1', page: 1, box: [10, 20, 40, 30] as [number, number, number, number] },
  { id: 'B2', page: 2, box: [50, 10, 40, 20] as [number, number, number, number] },
];

describe('PDF import request', () => {
  it('asks for a faithful copy with solutions, names the found pictures and gives the text of each page', () => {
    const lib = seedLibrary();
    const m = lib.modules[0];
    const pdf = { fileName: 'Flüsse.pdf', pages: [{ text: 'Aufgabe 1: Beschrifte den Fluss.', scan: false }, { text: '', scan: true }], candidates, pageCount: 2 };
    const text = pdfPrompt(m, pdf, '## Kontext', { teacher: true, wishes: 'Seite 2 ist das Lösungsblatt' });
    expect(text).toContain('„Flüsse.pdf“');
    expect(text).toContain('treu');
    expect(text).toContain('Lösungen');
    expect(text).toContain('`B1`: Seite 1, x 10 %, y 20 %, Breite 40 %, Höhe 30 %');
    expect(text).toContain('Aufgabe 1: Beschrifte den Fluss.');
    expect(text).toContain('(gescannt, keine Textebene');
    expect(text).toContain('Seite „Für die Lehrkraft“ als erste Seite');
    expect(text).toContain('Seite 2 ist das Lösungsblatt');
    expect(text).toContain('## Kontext');
    expect(pdfPrompt(m, pdf, '', { teacher: false, wishes: '' }, true)).toContain('Das PDF ist an diese Nachricht angehängt');
    expect(pdfPrompt(m, pdf, '', { teacher: false, wishes: '' })).toContain('Keine Seite „Für die Lehrkraft“');
  });
});

describe('figures', () => {
  it('resolves found pictures and boxes, also fractions, and reports what cannot be cut', () => {
    const { cuts, notes } = figuresOf(
      { figures: { f1: 'b2', f2: { page: 1, box: [5, 50, 90, 30] }, f3: { page: 1, box: [0.1, 0.2, 0.3, 0.4] }, f4: 'B9', f5: { page: 7, box: [1, 1, 10, 10] }, f6: { page: 1, box: [95, 95, 20, 1] } } },
      candidates,
      2,
    );
    expect(cuts.f1).toEqual({ page: 2, box: [50, 10, 40, 20] });
    expect(cuts.f2).toEqual({ page: 1, box: [5, 50, 90, 30] });
    expect(cuts.f3.box.map((v) => Math.round(v))).toEqual([10, 20, 30, 40]);
    expect(Object.keys(cuts)).toEqual(['f1', 'f2', 'f3']);
    expect(notes).toHaveLength(3);
    expect(notes[0]).toContain('„B9“');
  });
  it('turn into the images of the lesson, which keeps its competence ids', () => {
    const lib = seedLibrary();
    const m = lib.modules[0];
    const l = lib.lessons[0];
    const raw = {
      format: 'arbeitsblatt-baukasten-paket',
      version: 2,
      figures: { f1: 'B1' },
      modules: [
        {
          subject: m.subject,
          grade: m.grade,
          number: m.number,
          lessons: [
            {
              number: 1,
              title: 'Der Rhein',
              pages: [
                { title: 'Der Rhein', type: 'uebung', blocks: [{ type: 'image', props: { image: 'f1', caption: 'Abb. 1: Rheinfall' } }, { type: 'open', props: { prompt: 'Beschreibe.', competence: m.competences[0].id } }] },
              ],
            },
          ],
        },
      ],
    };
    expect(titleOf(raw)).toBe('Der Rhein');
    const draft = lessonFromAnswer(withFigures(raw, { f1: 'data:image/jpeg;base64,AAAA' }), m, l, l.doc, 'full');
    const img = draft.made[0].blocks[0].props.image as string;
    expect(draft.images[img]).toBe('data:image/jpeg;base64,AAAA');
    expect(draft.made[0].blocks[1].props.competence).toBe(m.competences[0].id);
    expect(() => withFigures('x', {})).toThrow();
  });
});

describe('placing the pages', () => {
  const page = (title: string, type: Page['type'], blocks = 1): Page => ({ title, kicker: '', type, form: 'allein', nameField: 'name', blocks: Array.from({ length: blocks }, (_, i) => ({ id: `${title}${i}`, type: 'text', span: 12, props: { text: title } })) }) as Page;
  const doc = seedLibrary().lessons[0].doc;
  it('fills an empty worksheet, teacher page first', () => {
    const empty = { ...doc, pages: [page('leer', 'uebung', 0)] };
    expect(placePages(empty, [page('A', 'uebung'), page('L', 'lehrkraft')], false).pages.map((p) => p.title)).toEqual(['L', 'A']);
  });
  it('appends to a worksheet and keeps its own teacher page', () => {
    const full = { ...doc, pages: [page('L0', 'lehrkraft'), page('S1', 'uebung')] };
    expect(placePages(full, [page('L', 'lehrkraft'), page('A', 'uebung')], false).pages.map((p) => p.title)).toEqual(['L0', 'S1', 'A']);
    const noTeacher = { ...doc, pages: [page('S1', 'uebung')] };
    expect(placePages(noTeacher, [page('L', 'lehrkraft'), page('A', 'uebung')], false).pages.map((p) => p.title)).toEqual(['L', 'S1', 'A']);
    expect(placePages(full, [page('A', 'uebung')], true).pages.map((p) => p.title)).toEqual(['A']);
  });
});
