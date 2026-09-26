import { describe, expect, it } from 'vitest';
import { FOREIGN_LANGUAGE_DOMAINS } from '../library/curriculum';
import { addPackage, readPackage } from '../library/package';
import { seedLibrary } from '../library/model';
import { docPoints } from '../model/language';
import { BLOCK_ORDER, BLOCK_TYPES } from '../model/blockTypes';
import { THEMES } from '../model/themes';
import { TOPIC_ICONS } from '../topicIcons';
import { englishExample, geographyExample, yearPlanExample } from './examples';
import { claudeInstructions, instructionsTemplate, PLACEHOLDERS } from './instructions';

describe('Anleitung für Claude', () => {
  const text = claudeInstructions();

  it('fills every placeholder', () => {
    for (const p of PLACEHOLDERS) expect(instructionsTemplate, p).toContain(`{{${p}}}`);
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
    // The highlight syntax stays as an example.
    expect(text).toContain('play{{s}}');
  });

  it('documents every block type with all its fields, every sheet type, area and icon', () => {
    for (const t of BLOCK_ORDER) {
      const section = text.split(`#### \`${t}\` · `)[1]?.split('\n####')[0];
      expect(section, t).toBeDefined();
      for (const f of BLOCK_TYPES[t].fields) expect(section, `${t}.${f.key}`).toContain(`| \`${f.key}\` |`);
    }
    for (const type of Object.keys(THEMES)) expect(text, type).toContain(`| \`${type}\` |`);
    for (const d of FOREIGN_LANGUAGE_DOMAINS) expect(text).toContain(`- ${d}\n`);
    for (const i of TOPIC_ICONS) expect(text).toContain(`- \`${i.key}\`: `);
  });

  it('has examples that the Baukasten reads without any notes, and shows them unchanged', () => {
    for (const [name, example] of [
      ['BEISPIEL_EN', englishExample()],
      ['BEISPIEL_PLAN', yearPlanExample()],
      ['BEISPIEL_GEO', geographyExample()],
    ] as const) {
      const p = readPackage(JSON.parse(JSON.stringify(example)));
      expect(p.notes, name).toEqual([]);
      const heading = { BEISPIEL_EN: '## Beispiel 1', BEISPIEL_PLAN: '## Beispiel 2', BEISPIEL_GEO: '## Beispiel 3' }[name];
      const block = text.split(heading)[1].split('```json\n')[1].split('\n```')[0];
      expect(JSON.parse(block), name).toEqual(example);
    }
  });

  it('English example: English sheets, help under every task, every competence linked', () => {
    const [m] = readPackage(englishExample()).modules;
    expect(m.module.lang).toBe('en');
    const pages = m.lessons[0].doc.pages;
    expect(pages.map((pg) => pg.type)).toEqual(['lehrkraft', 'vocab', 'grammar', 'speaking']);
    const tasks = pages.flatMap((pg) => pg.blocks).filter((b) => BLOCK_TYPES[b.type].task);
    for (const t of tasks) expect(String(t.props.help), t.type).not.toBe('');
    expect(new Set(tasks.map((t) => t.props.competence).filter(Boolean)).size).toBe(m.module.competences.length);
    expect(docPoints(m.lessons[0].doc).total).toBe(0);
  });

  it('year plan example: modules with weeks and the school year', () => {
    const p = readPackage(yearPlanExample());
    expect(p.schoolYear?.name).toBe('2026/27');
    expect(p.modules.map((m) => m.module.weeks)).toEqual([5, 6, 6, 5]);
    const r = addPackage(seedLibrary(), p);
    // Without a textbook: no textbook reference, the focus is in the description.
    expect(r.modules.map((m) => [m.number, m.lang, m.textbook])).toEqual([
      [1, 'en', ''],
      [2, 'en', ''],
      [3, 'en', ''],
      [4, 'en', ''],
    ]);
    for (const m of r.modules) expect(m.description).toContain('Grammatik:');
  });

  // The copy in docs/ is for reading on GitHub; `npm run anleitung` updates it.
  it('matches the copy in docs/claude', async () => {
    await expect(text).toMatchFileSnapshot('../../docs/claude/anleitung-fuer-claude.md');
  });
});
