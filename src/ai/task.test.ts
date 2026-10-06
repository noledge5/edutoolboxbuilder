import { describe, expect, it } from 'vitest';
import { createBlock } from '../model/ops';
import { DocFormatError } from '../model/normalize';
import { imagePrompt } from './images';
import { IMAGE_MODEL, imageKeyOf, readAiSettings } from './settings';
import { blocksFromAnswer, taskPrompt, taskSystem } from './task';

const comp = [{ id: 'k1', area: 'Himmelsrichtungen', g: '', m: '', e: '', lessons: '', domain: '' }];
const old = { ...createBlock('mc', { prompt: 'Wo geht die Sonne auf?', options: '*Osten\nWesten', competence: 'k1', level: '1' }), id: 'alt' };
const page = { title: 'Kompass', kicker: '', type: 'uebung' as const, form: 'allein' as const, nameField: 'name' as const, blocks: [old, createBlock('text', { text: 'Der Kompass zeigt nach Norden.' })] };
const ctx = { subject: 'Geographie', grade: 5, topic: 'Wir orientieren uns', lang: 'de' as const, page, competences: comp };

describe('tasks by instruction', () => {
  it('tells Claude the instruction, the block, the page and all block types', () => {
    const p = taskPrompt('Mach daraus eine Zuordnung', ctx, old);
    expect(p).toContain('Mach daraus eine Zuordnung');
    expect(p).toContain('"type":"mc"');
    expect(p).toContain('Der Kompass zeigt nach Norden.');
    expect(p).not.toContain('Wo geht die Sonne auf?</'); // the block itself is not listed as "else on the page"
    expect(taskPrompt('Neu', ctx)).toContain('kommt neu auf das Blatt');
    expect(taskSystem()).toContain('`match`');
  });
  it('reads one to three blocks of any type, with new ids, keeping competence and level', () => {
    const blocks = blocksFromAnswer(
      { blocks: [{ type: 'image', props: { caption: 'Abb. 1', describe: 'a compass', image: 'fremd' } }, { type: 'match', props: { prompt: 'Ordne zu.', pairs: 'N | Norden' } }, { type: 'nix' }] },
      comp,
      old,
    );
    expect(blocks.map((b) => b.type)).toEqual(['image', 'match']);
    expect(blocks[0].props.image).toBe('');
    expect(blocks[0].props.describe).toBe('a compass');
    expect(blocks[1].props.competence).toBe('k1');
    expect(blocks[1].props.level).toBe('1');
    expect(blocks.every((b) => b.id !== 'alt')).toBe(true);
  });
  it('drops competences that are not in the grid and says when nothing is usable', () => {
    expect(blocksFromAnswer({ blocks: [{ type: 'open', props: { prompt: 'x', competence: 'k9' } }] }, comp)[0].props.competence).toBe('');
    expect(() => blocksFromAnswer({ blocks: [{ type: 'nix' }] }, comp)).toThrow(DocFormatError);
    expect(() => blocksFromAnswer('Hallo', comp)).toThrow(DocFormatError);
  });
});

describe('pictures with KI', () => {
  it('describes the picture in the chosen style, without text', () => {
    const p = imagePrompt('ein Kompass', 'linie');
    expect(p).toContain('ein Kompass');
    expect(p).toContain('line art');
    expect(p).toContain('No text');
  });
  it('takes the OpenRouter key for pictures', () => {
    const a = readAiSettings({ provider: 'anthropic', key: 'sk-ant', imageKey: ' sk-or-x ' })!;
    expect(imageKeyOf(a)).toBe('sk-or-x');
    expect(a.imageModel).toBe(IMAGE_MODEL);
    expect(imageKeyOf(readAiSettings({ provider: 'openrouter', key: 'sk-or-main' }))).toBe('sk-or-main');
    expect(imageKeyOf(readAiSettings({ provider: 'anthropic', key: 'sk-ant' }))).toBe('');
  });
});
