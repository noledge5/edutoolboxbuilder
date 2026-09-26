import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { updateBlock } from '../model/ops';
import { seedDoc } from '../model/seed';
import { deleteUnusedImages, getImage, loadDoc, putImage, saveDoc } from './db';

describe('storage', () => {
  it('saves and loads the document', async () => {
    const doc = seedDoc();
    await saveDoc(doc);
    expect(await loadDoc()).toEqual(doc);
  });

  it('deletes only images no block uses', async () => {
    const used = await putImage(new Blob(['a'], { type: 'image/png' }));
    const unused = await putImage(new Blob(['b'], { type: 'image/png' }));
    const doc = seedDoc();
    const imageBlock = doc.pages[0].blocks.find((b) => b.type === 'image')!;
    await deleteUnusedImages(updateBlock(doc, imageBlock.id, { props: { image: used } }));
    expect(await getImage(used)).toBeDefined();
    expect(await getImage(unused)).toBeUndefined();
  });
});
