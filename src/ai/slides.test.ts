import { describe, expect, it } from 'vitest';
import { createSlide } from '../model/slides';
import { normalizeDoc } from '../model/normalize';
import { buildSlidesPrompt, slidesFromAnswer, slidesPrompt } from './slides';

describe('Folien mit Claude', () => {
  const old = [{ ...createSlide('image'), image: 'img-1' }];

  it('keeps only pictures the old slides had', () => {
    const { slides } = slidesFromAnswer(
      { slides: [{ layout: 'full', title: 'Was ist passiert?', image: 'img-1', search: 'volcano' }, { layout: 'image', title: 'x', image: 'made-up' }, { layout: 'big', title: '1,5 °C' }] },
      old,
    );
    expect(slides.map((s) => s.layout)).toEqual(['full', 'image', 'big']);
    expect(slides[0]).toMatchObject({ image: 'img-1', search: 'volcano' });
    expect(slides[1].image).toBe('');
    expect(() => slidesFromAnswer({ slides: [] }, old)).toThrow();
  });

  it('sends the slides without ids and the sheet', () => {
    const doc = normalizeDoc({ pages: [{ title: 'Vulkane', blocks: [{ type: 'text', props: { text: 'Magma steigt auf.' } }] }] });
    const p = slidesPrompt(old, doc, { subject: 'Geographie', grade: 7, topic: 'Vulkane', lessonTitle: 'Ausbruch', notes: '' }, 'Mehr Bilder');
    expect(p).toContain('Mehr Bilder');
    expect(p).toContain('Magma steigt auf.');
    expect(p).not.toContain(old[0].id);
  });

  const lesson = normalizeDoc({
    pages: [
      { title: 'Verlauf', type: 'lehrkraft', blocks: [{ type: 'path', props: { steps: 'M1 | Die Klasse sieht den Vulkan. | Aufgabe 1 | Magma steigt auf.' } }] },
      { title: 'Vulkane', blocks: [{ type: 'image', props: { mat: 'M1', image: 'img-vulkan', caption: 'Abb. 1: Querschnitt' } }, { type: 'open', props: { prompt: 'Beschreibe M1.' } }] },
    ],
  });
  const ctx = { subject: 'Geographie', grade: 7, topic: 'Vulkane', lessonTitle: 'Ausbruch', notes: '', recall: [{ q: 'Was ist Magma?', a: 'Gesteinsschmelze', where: 'Stunde 1' }] };

  it('builds new slides from the whole lesson: learning path, sheets, pictures, recall', () => {
    const p = buildSlidesPrompt(lesson, ctx, '');
    expect(p).toContain('Folge dem Lernweg');
    expect(p).toContain('Die Klasse sieht den Vulkan.');
    expect(p).toContain('Beschreibe M1.');
    expect(p).toContain('`img-vulkan` (Abb. 1: Querschnitt)');
    expect(p).toContain('Was ist Magma? | Gesteinsschmelze (Stunde 1)');
  });

  it('lets new slides show the pictures of the sheet', () => {
    const { slides } = slidesFromAnswer({ slides: [{ layout: 'full', label: 'M1', title: 'Was passiert hier?', image: 'img-vulkan' }, { layout: 'image', image: 'erfunden' }] }, [], lesson);
    expect(slides[0].image).toBe('img-vulkan');
    expect(slides[1].image).toBe('');
  });
});
