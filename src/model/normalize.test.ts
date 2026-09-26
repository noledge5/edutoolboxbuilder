import { describe, expect, it } from 'vitest';
import { DocFormatError, normalizeDoc, parseDocJson } from './normalize';
import { seedDoc } from './seed';

describe('normalizeDoc', () => {
  it('accepts its own export unchanged', () => {
    const doc = seedDoc();
    expect(normalizeDoc(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
  });

  it('keeps a known topic icon and falls back for unknown ones', () => {
    expect(normalizeDoc({ icon: 'leaf', pages: [{}] }).icon).toBe('leaf');
    expect(normalizeDoc({ icon: 'unbekannt', pages: [{}] }).icon).toBe('thermometer-sun');
    expect(normalizeDoc({ pages: [{}] }).icon).toBe('thermometer-sun');
  });

  it('requires a pages list', () => {
    expect(() => normalizeDoc({ footer: 'x' })).toThrow('Es fehlt die Liste "pages".');
    expect(() => parseDocJson('{nope')).toThrow(DocFormatError);
  });

  it('drops unknown block types and fills missing props from the defaults', () => {
    const doc = normalizeDoc({ pages: [{ blocks: [{ type: 'mc', props: { prompt: 'Frage?' } }, { type: 'video' }] }] });
    const [b] = doc.pages[0].blocks;
    expect(doc.pages[0].blocks).toHaveLength(1);
    expect(b.props).toMatchObject({ prompt: 'Frage?', options: 'Antwort A\nAntwort B\nAntwort C' });
    expect(b.span).toBe(12);
    expect(b.id).toMatch(/^b/);
  });

  it('repairs page fields and block values', () => {
    const doc = normalizeDoc({
      pages: [
        {
          type: 'unbekannt',
          form: 'Einzel',
          blocks: [
            { id: 'x', type: 'open', span: 20, props: { lines: '99' } },
            { id: 'x', type: 'hint', span: 6, props: { variant: 'lila' } },
            { type: 'wordbank', props: { words: ['Weltall', 'Erde'] } },
          ],
        },
      ],
    });
    const pg = doc.pages[0];
    expect(pg).toMatchObject({ type: 'uebung', form: 'allein', nameField: true, title: 'Neues Arbeitsblatt' });
    expect(pg.blocks[0]).toMatchObject({ id: 'x', span: 12, props: { lines: 20 } });
    expect(pg.blocks[1].id).not.toBe('x');
    expect(pg.blocks[1]).toMatchObject({ span: 6, props: { variant: 'accent-2' } });
    expect(pg.blocks[2].props.words).toBe('Weltall\nErde');
  });
});
