import { describe, expect, it } from 'vitest';
import { slidesFromDoc } from '../slides/fromDoc';
import { seedDoc, seedSlides } from './seed';
import { createSlide, hasReveal, leanSlide, normalizeSlides, SLIDE_LAYOUT_ORDER, slideItems } from './slides';

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
    expect(hasReveal({ ...createSlide('compare'), reveal: true })).toBe(false);
    expect(leanSlide({ ...createSlide('statement'), image: '', notes: '' })).not.toHaveProperty('image');
  });

  it('are suggested from the worksheets: title, recall, tasks per page, Merksatz as exit', () => {
    const doc = seedDoc();
    const teacher = { title: 'Stundenverlauf', kicker: '', type: 'lehrkraft' as const, form: 'Plenum' as const, nameField: 'aus' as const, blocks: [] };
    const slides = slidesFromDoc(doc, 'Der Treibhauseffekt');
    expect(slides[0]).toMatchObject({ layout: 'title', title: 'Der Treibhauseffekt' });
    expect(slides.some((s) => s.layout === 'list' && s.type === 'versuch')).toBe(true);
    expect(slides[slides.length - 1]).toMatchObject({ layout: 'exit', label: 'Merksatz', title: expect.stringContaining('Beobachtung') });
    expect(slidesFromDoc({ ...doc, pages: [teacher] }, 'Leer')).toHaveLength(1);
  });

  it('come with the sample lesson', () => {
    const s = seedSlides();
    expect(s.map((x) => x.layout)).toEqual(['title', 'list', 'quote', 'compare', 'list', 'statement', 'flow', 'compare', 'exit']);
    expect(normalizeSlides(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
