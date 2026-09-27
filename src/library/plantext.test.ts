import { describe, expect, it } from 'vitest';
import { addPackage } from './package';
import { isWorkedOut, seedLibrary } from './model';
import { readPlanText } from './plantext';

describe('year plan as text', () => {
  it('reads modules with weeks, start and focus, and the planned lessons below them', () => {
    const p = readPlanText(
      `Jahresplan Englisch Klasse 5
Modul 1: Hello, school! | 5 Wochen | Sich vorstellen, Schule
- Stunde 1: Hello, I'm … | Begrüßen und vorstellen | SB S. 8
- My classroom – Schulsachen benennen
- Stunde 4: I am, you are
Modul 2: My family and me | 6 Wochen | ab 02.11.2026
Unit 3 – A day in my life`,
      'Englisch',
      5,
    );
    expect(p.notes).toEqual([]);
    expect(p.modules.map((m) => [m.module.number, m.module.title, m.module.weeks, m.module.start, m.module.description, m.module.lang])).toEqual([
      [1, 'Hello, school!', 5, '', 'Sich vorstellen, Schule', 'en'],
      [2, 'My family and me', 6, '2026-11-02', '', 'en'],
      [3, 'A day in my life', 0, '', '', 'en'],
    ]);
    expect(p.modules[0].lessons.map((l) => [l.number, l.title, l.plan, l.textbook])).toEqual([
      [1, "Hello, I'm …", 'Begrüßen und vorstellen', 'SB S. 8'],
      [2, 'My classroom', 'Schulsachen benennen', ''],
      [4, 'I am, you are', '', ''],
    ]);
    expect(p.modules[0].lessons[0].doc.pages[0]).toMatchObject({ title: "Hello, I'm …", kicker: 'Class 5 · Hello, school!', blocks: [] });
  });

  it('reads tables from Excel, Word or Markdown', () => {
    const excel = readPlanText('Nr\tThema\tWochen\n1\tWetter und Klima\t4\n2\tPlattentektonik\t5\n1.1 Wetterelemente\tTemperatur messen', 'Geographie', 8);
    expect(excel.modules.map((m) => [m.module.number, m.module.title, m.module.weeks, m.module.lang])).toEqual([
      [1, 'Wetter und Klima', 4, 'de'],
      [2, 'Plattentektonik', 5, 'de'],
    ]);
    expect(excel.modules[1].lessons.map((l) => [l.number, l.title, l.plan])).toEqual([[1, 'Wetterelemente', 'Temperatur messen']]);
    const md = readPlanText('| Modul | Thema | Wochen |\n|---|---|---|\n| 1 | Zellen | 3 |\n\n## Modul 2: Ökosystem Wald\n* Nahrungsketten', 'Biologie', 7);
    expect(md.modules.map((m) => [m.module.number, m.module.title, m.module.weeks, m.lessons.length])).toEqual([
      [1, 'Zellen', 3, 0],
      [2, 'Ökosystem Wald', 0, 1],
    ]);
  });

  it('skips lessons before the first module with a note', () => {
    const p = readPlanText('- Stunde ohne Modul\nWetter', 'Geographie', 8);
    expect(p.notes).toHaveLength(1);
    expect(p.modules.map((m) => m.module.title)).toEqual(['Wetter']);
  });

  it('becomes planned modules in the library', () => {
    const lib = seedLibrary();
    const r = addPackage(lib, readPlanText('Modul 1: Hello\n- Hi\n- Bye', 'Englisch', 5));
    expect(r.results[0]).toMatchObject({ action: 'neu', added: 2, planned: 2 });
    expect(r.lessons.every((l) => !isWorkedOut(l))).toBe(true);
    expect(r.lessons.map((l) => l.doc.code)).toEqual(['K5 · M1 · S1', 'K5 · M1 · S2']);
  });
});

describe('icons for planned modules', () => {
  it('are guessed from the title', async () => {
    const { guessTopicIcon } = await import('../topicIcons');
    expect(guessTopicIcon('My family and me')).toBe('home');
    expect(guessTopicIcon('Birthdays and parties')).toBe('cake');
    expect(guessTopicIcon('Xyzzy')).toBe('book-open');
  });
});
