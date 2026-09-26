import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { updateBlock } from '../model/ops';
import { seedDoc } from '../model/seed';
import { backupFileName, createBackup, readBackup, safeFileName } from './backup';
import { getImage, putImage } from './db';

describe('backup file', () => {
  it('round-trips the document with its images', async () => {
    const id = await putImage(new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/png' }));
    const seed = seedDoc();
    const imageBlock = seed.pages[0].blocks.find((b) => b.type === 'image')!;
    const doc = updateBlock(seed, imageBlock.id, { props: { image: id } });
    const file = await createBackup(doc);
    expect(Object.keys(file.images)).toEqual([id]);

    const text = JSON.stringify(file);
    const back = await readBackup(text);
    expect(back).toEqual(doc);
    const blob = await getImage(id);
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 250]));
  });

  it('also opens a bare document and rejects other files', async () => {
    const doc = seedDoc();
    expect(await readBackup(JSON.stringify(doc))).toEqual(doc);
    await expect(readBackup('hallo')).rejects.toThrow('kein JSON');
    await expect(readBackup('{"format":"arbeitsblatt-baukasten","version":99,"doc":{}}')).rejects.toThrow('neueren Version');
  });

  it('names the file after the first page', () => {
    expect(backupFileName(seedDoc())).toBe('Versuchsprotokoll Waerme einfangen.json');
    expect(safeFileName('Größe: 5 € / Maß?')).toBe('Groesse 5 Mass');
  });
});
