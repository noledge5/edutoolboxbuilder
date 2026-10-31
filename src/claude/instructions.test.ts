import { describe, expect, it } from 'vitest';
import { FOREIGN_LANGUAGE_DOMAINS } from '../library/curriculum';
import { readPackage } from '../library/package';
import { coherence } from '../model/coherence';
import { BLOCK_ORDER, BLOCK_TYPES } from '../model/blockTypes';
import { THEMES } from '../model/themes';
import { SLIDE_LAYOUT_ORDER } from '../model/slides';
import { TOPIC_ICONS } from '../topicIcons';
import { lessonExample } from './examples';
import { claudeInstructions, instructionsTemplate, PLACEHOLDERS } from './instructions';

describe('Anleitung für Claude', () => {
  const text = claudeInstructions();

  it('fills every placeholder', () => {
    for (const p of PLACEHOLDERS) expect(instructionsTemplate, p).toContain(`{{${p}}}`);
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
    // The highlight syntax stays as an example.
    expect(text).toContain('play{{s}}');
  });

  it('stays short enough to be read to the end (about 35,000 characters)', () => {
    expect(text.length).toBeLessThan(40000);
  });

  it('names every block type with its fields, every sheet type, slide layout, area and icon', () => {
    for (const t of BLOCK_ORDER) {
      const line = text.split('\n').find((l) => l.startsWith(`- **\`${t}\`** `));
      expect(line, t).toBeDefined();
      for (const f of BLOCK_TYPES[t].fields) if (f.kind !== 'preset') expect(line! + text, `${t}.${f.key}`).toContain(`\`${f.key}\``);
    }
    for (const type of Object.keys(THEMES)) expect(text, type).toContain(`\`${type}\``);
    for (const l of SLIDE_LAYOUT_ORDER) expect(text, l).toContain(`| \`${l}\` |`);
    for (const d of FOREIGN_LANGUAGE_DOMAINS) expect(text).toContain(`„${d}“`);
    for (const i of TOPIC_ICONS) expect(text).toContain(i.key);
  });

  it('has an example the Baukasten reads without notes and that passes the check without AI', () => {
    const example = lessonExample();
    const p = readPackage(JSON.parse(JSON.stringify(example)));
    expect(p.notes).toEqual([]);
    expect(coherence(p.modules[0].lessons[0].doc)).toEqual([]);
    const block = text.split('## Beispiel')[1].split('```json\n')[1].split('\n```')[0];
    expect(JSON.parse(block)).toEqual(example);
  });

  // The copy in docs/ is for reading on GitHub; `npm run anleitung` updates it.
  it('matches the copy in docs/claude', async () => {
    await expect(text).toMatchFileSnapshot('../../docs/claude/anleitung-fuer-claude.md');
  });
});
