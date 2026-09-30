import { describe, expect, it } from 'vitest';
import { addClip, clipImages, clipLabel, clipText, MAX_CLIPS, readClips } from './clips';
import { createBlock } from './ops';

describe('Ablage', () => {
  it('puts new entries on top and keeps the last ones', () => {
    const gap = createBlock('gap', { prompt: 'Setze ein.', text: 'Die [[Sonne]] scheint.' });
    const image = createBlock('image', { image: 'i1', caption: 'Karte' });
    let clips = addClip([], [gap], 'Modul 1 · Stunde 2: Klima', 10);
    clips = addClip(clips, [gap, image], 'Modul 1 · Stunde 3', 20);
    expect(clips.map((c) => c.at)).toEqual([20, 10]);
    expect(clipLabel(clips[1])).toBe('Lückentext');
    expect(clipLabel(clips[0])).toBe('2 Bausteine');
    expect(clipText(clips[1])).toBe('Setze ein.');
    expect(clipImages(clips)).toEqual(['i1']);
    // A copy: changing the worksheet later does not change the Ablage.
    gap.props.prompt = 'Anders';
    expect(clipText(clips[1])).toBe('Setze ein.');
    for (let k = 0; k < MAX_CLIPS + 5; k++) clips = addClip(clips, [gap], '', k);
    expect(clips).toHaveLength(MAX_CLIPS);
    expect(addClip(clips, [], '', 99)).toBe(clips);
  });

  it('reads what was stored, leaving out what cannot be read', () => {
    const stored = JSON.parse(JSON.stringify(addClip([], [createBlock('mc', { prompt: 'Was stimmt?' })], 'S1', 5)));
    const back = readClips([...stored, { blocks: [{ type: 'unbekannt' }] }, 'kaputt', { at: 3 }]);
    expect(back).toHaveLength(1);
    expect(back[0]).toMatchObject({ at: 5, from: 'S1' });
    expect(back[0].blocks[0]).toMatchObject({ type: 'mc', props: { prompt: 'Was stimmt?' } });
    expect(readClips(null)).toEqual([]);
  });
});
