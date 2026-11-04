import { describe, expect, it } from 'vitest';
import { canvaDesignId, canvaPrompt, canvaTemplateOf, lessonImages, MAX_IMAGES } from './prompt';
import { seedLibrary } from '../library/model';
import type { Block, Doc, Page } from '../model/types';
import { canvaLink, readLesson, readModule, readSettings } from '../library/read';

const b = (type: Block['type'], props: Record<string, unknown> = {}): Block => ({ id: Math.random().toString(36).slice(2), type, span: 12, props } as Block);
const page = (blocks: Block[], type: Page['type'] = 'uebung'): Page => ({ title: 'T', kicker: '', type, form: 'allein', nameField: 'name', blocks } as Page);
const doc = (...pages: Page[]): Doc => ({ ...seedLibrary().lessons[0].doc, pages });

describe('Präsi in Canva', () => {
  it('takes numbered material first, each picture once, the hook from the teacher page', () => {
    const d = doc(
      page([b('hook', { image: 'h1' }), b('image', { image: 'tx' })], 'lehrkraft'),
      page([b('image', { image: 'a', caption: 'Foto' }), b('image', { image: 'm1', mat: 'M1', caption: 'Karte' }), b('image', { image: 'a' })]),
    );
    expect(lessonImages(d)).toEqual([
      { id: 'm1', label: 'M1: Karte' },
      { id: 'h1', label: 'Einstieg' },
      { id: 'a', label: 'Foto' },
    ]);
  });

  it('keeps at most ten pictures', () => {
    const d = doc(page(Array.from({ length: 14 }, (_, i) => b('image', { image: `i${i}` }))));
    expect(lessonImages(d)).toHaveLength(MAX_IMAGES);
  });

  it('reads the design id of a Canva link and only accepts Canva links', () => {
    expect(canvaDesignId('https://www.canva.com/design/DAGx1_-y/abc/edit')).toBe('DAGx1_-y');
    expect(canvaDesignId('https://example.org/design/DAG')).toBe('');
    expect(canvaLink('https://www.canva.com/design/DAG1/view')).toBe('https://www.canva.com/design/DAG1/view');
    expect(canvaLink('https://evil.example/design/x')).toBe('');
    expect(canvaLink('javascript:alert(1)')).toBe('');
  });

  it('uses the module template before the subject template', () => {
    const lib = seedLibrary();
    const s = readSettings({ ...lib.settings, canvaTemplates: { Geographie: 'https://www.canva.com/design/FACH/edit', Englisch: 'https://evil.example/x' } });
    expect(s.canvaTemplates).toEqual({ Geographie: 'https://www.canva.com/design/FACH/edit' });
    const m = lib.modules[0];
    expect(canvaTemplateOf(s, m)).toBe('https://www.canva.com/design/FACH/edit');
    const own = readModule({ ...m, canvaTemplate: 'https://www.canva.com/design/MOD/edit' })!;
    expect(canvaTemplateOf(s, own)).toBe('https://www.canva.com/design/MOD/edit');
    expect(readLesson({ ...lib.lessons[0], canvaUrl: 'nope' })!.canvaUrl).toBeUndefined();
  });

  it('writes the request with pictures, template and the lesson, without planning data on the slides', () => {
    const lib = seedLibrary();
    const text = canvaPrompt(lib.modules[0], lib.lessons[0], 'https://www.canva.com/design/DAGvorlage/edit', [{ label: 'M1: Karte', url: 'https://x.supabase.co/s/1?token=t' }]);
    expect(text).toContain('Canva-Design `DAGvorlage`');
    expect(text).toContain('1. M1: Karte: https://x.supabase.co/s/1?token=t');
    expect(text).toContain('Lade das Bild unten mit seinem Link');
    expect(text).toContain('Zwillingsfolie');
    expect(text).toContain('Nicht auf die Folien: Niveaus');
    expect(text).toContain('"title":"Versuchsprotokoll: Wärme einfangen"');
    expect(canvaPrompt(lib.modules[0], lib.lessons[0], '', [])).toContain('keine eigenen Bilder');
  });
});
