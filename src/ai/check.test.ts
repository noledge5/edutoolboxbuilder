import { describe, expect, it } from 'vitest';
import { normalizeDoc } from '../model/normalize';
import { checkPrompt, findingsFromAnswer, fixWishesOf } from './check';

const doc = normalizeDoc({
  pages: [
    { title: 'Vulkane', blocks: [{ type: 'text', props: { text: 'Magma steigt auf.' } }, { type: 'text', props: { text: 'Lava fließt.' } }] },
    { title: 'Aufgaben', blocks: [{ type: 'text', props: { text: 'Erkläre.' } }] },
  ],
});
const ctx = { subject: 'Geographie', grade: 7, topic: 'Vulkane', lang: 'de' as const, competences: [] };

describe('Stunde prüfen', () => {
  it('names every block by page and number', () => {
    const p = checkPrompt(doc, ctx);
    expect(p).toContain('S1.2');
    expect(p).toContain('S2.1');
    expect(p).toContain('Lava fließt.');
  });

  it('maps refs to blocks and drops what it cannot read', () => {
    const f = findingsFromAnswer(
      { findings: [{ ref: 's2.1', kind: 'loesbar', problem: 'Kein Material.', fix: 'Ergänze einen Infotext.' }, { ref: 'S9.9', kind: 'quatsch', problem: 'x' }, { ref: 'S1.1' }, 'nix'] },
      doc,
    );
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ blockId: doc.pages[1].blocks[0].id, kind: 'loesbar', fix: 'Ergänze einen Infotext.' });
    expect(f[1]).toMatchObject({ blockId: null, kind: 'sonst' });
    expect(() => findingsFromAnswer({}, doc)).toThrow();
  });
});

describe('fixWishesOf', () => {
  it('lists the findings as wishes for the revision', () => {
    const w = fixWishesOf([
      { ref: 'S2.4', problem: 'M3 fehlt.', fix: 'Ergänze M3.' },
      { ref: '', problem: 'Kein Lernweg.' },
    ]);
    expect(w).toBe('Behebe diese Befunde aus „Stunde prüfen“ und lass alles andere, wie es ist:\n- S2.4: M3 fehlt. → Ergänze M3.\n- Kein Lernweg.');
  });
});
