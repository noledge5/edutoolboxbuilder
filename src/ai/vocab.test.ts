import { describe, expect, it } from 'vitest';
import { createBlock } from '../model/ops';
import type { Doc } from '../model/types';
import { DocFormatError } from '../model/normalize';
import { draftWords, sourceText, vocabFromAnswer, vocabPages, vocabPrompt, wordKey } from './vocab';

const doc: Doc = {
  icon: 'house',
  lang: 'en',
  help: true,
  footer: '',
  code: '',
  pages: [
    { title: 'My family', kicker: '', type: 'uebung', form: 'allein', nameField: 'name', blocks: [createBlock('text', { text: 'This is my grandma. She lives in a cottage.' }), createBlock('vocab', { rows: 'house | haʊs | Haus | x' })] },
    { title: 'Stundenverlauf', kicker: '', type: 'lehrkraft', form: 'allein', nameField: 'aus', blocks: [createBlock('goal', { goal: 'GEHEIM' })] },
  ],
};

const answer = {
  topic: 'My family',
  fields: [
    {
      name: 'Family',
      words: [
        { en: 'grandma', ipa: '/ˈɡrænmɑː/', de: 'Oma', example: 'My grandma lives in Leeds.', picture: 'grandmother' },
        { en: 'House', ipa: '', de: 'Haus', example: '', picture: '' },
        { en: 'to look after', ipa: 'lʊk ˈɑːftə', de: 'sich kümmern um', example: 'I look after my brother.', picture: '' },
        { en: 'grandma', ipa: '', de: 'doppelt', example: '', picture: '' },
        { en: '', de: 'leer' },
      ],
    },
    { name: 'At home', words: [{ en: 'cottage', ipa: 'ˈkɒtɪdʒ', de: 'Häuschen', example: 'They live in a cottage.', picture: 'cottage' }] },
    { name: 'Empty', words: [] },
  ],
};

describe('vocabulary with Claude', () => {
  it('sends the students’ pages, not the teacher page or old lists', () => {
    const t = sourceText([{ title: 'Stunde 1', doc }]);
    expect(t).toContain('grandma');
    expect(t).not.toContain('GEHEIM');
    expect(t).not.toContain('haʊs');
    const p = vocabPrompt({ grade: 5, topic: 'My family', scope: 'lesson', sources: [{ title: 'Stunde 1', doc }], known: ['house', 'house', 'dog'] });
    expect(p).toContain('Klasse 5');
    expect(p).toContain('house, dog');
  });
  it('reads the answer without known words and repeats', () => {
    const d = vocabFromAnswer(answer, ['house'], 'X');
    expect(d.fields.map((f) => f.name)).toEqual(['Family', 'At home']);
    expect(d.fields[0].words.map((w) => w.en)).toEqual(['grandma', 'to look after']);
    expect(d.fields[0].words[0].ipa).toBe('ˈɡrænmɑː');
    expect(draftWords(d)).toBe(3);
    expect(wordKey('To Look  after')).toBe('look after');
    expect(() => vocabFromAnswer({ fields: [] }, [], 'X')).toThrow(DocFormatError);
  });
  it('makes a Vocabulary page: one list per word field with a picture column, then a word web', () => {
    const d = vocabFromAnswer(answer, ['house'], 'X');
    const pages = vocabPages(d, { lang: 'en', kicker: 'Class 5 · Unit 2' });
    expect(pages).toHaveLength(1);
    expect(pages[0].type).toBe('vocab');
    expect(pages[0].title).toBe('Vocabulary: My family');
    const [family, home, web] = pages[0].blocks;
    expect(family.type).toBe('vocab');
    expect(family.props.title).toBe('Family');
    expect(String(family.props.rows).split('\n')[0]).toBe('grandma | ˈɡrænmɑː | Oma | My grandma lives in Leeds.');
    expect(family.props.picwords).toBe('grandmother\n');
    expect(home.props.picwords).toBe('cottage');
    expect(web.type).toBe('wordweb');
    expect(web.props.branches).toBe('Family | grandma, to look after\nAt home | cottage');
  });
  it('shares a long list out over pages', () => {
    const words = Array.from({ length: 60 }, (_, i) => ({ en: `word${i}`, ipa: '', de: `Wort ${i}`, example: 'A rather long example sentence that needs two lines.', picture: i % 2 ? 'thing' : '' }));
    const pages = vocabPages({ topic: 'Big', fields: [{ name: 'A', words }, { name: 'B', words: words.slice(0, 3).map((w) => ({ ...w, en: w.en + 'b' })) }] }, { lang: 'en', kicker: '' });
    expect(pages.length).toBeGreaterThan(2);
    const all = pages.flatMap((p) => p.blocks.filter((b) => b.type === 'vocab').flatMap((b) => String(b.props.rows).split('\n')));
    expect(all).toHaveLength(63);
  });
});
