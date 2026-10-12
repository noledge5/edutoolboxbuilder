import { describe, expect, it } from 'vitest';
import { createSlide } from '../model/slides';
import { normalizeDoc } from '../model/normalize';
import { slidesFromAnswer, slidesPrompt } from './slides';

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
});
