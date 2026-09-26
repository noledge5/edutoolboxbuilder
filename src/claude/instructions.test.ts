import { describe, expect, it } from 'vitest';
import { BLOCK_ORDER, BLOCK_TYPES } from '../model/blockTypes';
import { readPackage } from '../library/package';
import { TOPIC_ICONS } from '../topicIcons';
import { claudeInstructions, examplePackage } from './instructions';

describe('Anleitung für Claude', () => {
  const text = claudeInstructions();

  it('documents every block type with all its fields, and every icon', () => {
    for (const t of BLOCK_ORDER) {
      const section = text.split(`#### \`${t}\` · `)[1]?.split('\n####')[0];
      expect(section, t).toBeDefined();
      for (const f of BLOCK_TYPES[t].fields) expect(section, `${t}.${f.key}`).toContain(`| \`${f.key}\` |`);
    }
    for (const i of TOPIC_ICONS) expect(text).toContain(`- \`${i.key}\`: `);
    expect(text).not.toContain('{{');
  });

  it('has an example that the Baukasten reads without any notes', () => {
    const p = readPackage(JSON.parse(JSON.stringify(examplePackage())));
    expect(p.notes).toEqual([]);
    expect(p.lessons).toHaveLength(1);
    expect(p.lessons[0].doc.pages.map((pg) => pg.type)).toEqual(['lehrkraft', 'versuch', 'sicherung']);
    const linked = p.lessons[0].doc.pages.flatMap((pg) => pg.blocks).filter((b) => b.props.competence);
    expect(new Set(linked.map((b) => b.props.competence)).size).toBe(p.module.competences.length);
    // The example in the text is the same one.
    const json = text.split('```json\n').at(-1)!.split('\n```')[0];
    expect(JSON.parse(json)).toEqual(examplePackage());
  });

  // The copy in docs/ is for reading on GitHub; `npm run anleitung` updates it.
  it('matches the copy in docs/claude', async () => {
    await expect(text).toMatchFileSnapshot('../../docs/claude/anleitung-fuer-claude.md');
  });
});
