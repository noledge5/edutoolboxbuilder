import { describe, expect, it } from 'vitest';
import { isWorkedOut, newLesson, seedLibrary } from '../library/model';
import { addPackage, packageFromModules, readPackage } from '../library/package';
import { readLesson, readSettings } from '../library/read';
import { BW_2026_27 } from '../library/yearplan';
import type { Library } from '../library/types';
import { classNotes, withClassNotes } from './classNotes';
import { lessonContext } from './context';
import { applyModulePlan, hoursOf, moduleContext, modulePlanFromAnswer, modulePlanPrompt } from './moduleplan';
import { taskPrompt } from './task';
import { yearPlanContext, yearPlanPrompt } from './yearplan';

function library(): Library {
  const lib = seedLibrary();
  lib.settings.schoolYear = BW_2026_27;
  const m = lib.modules[0];
  m.weeks = 3;
  lib.lessons.push({ ...newLesson(lib, m), number: 1, title: 'CO₂ und Temperatur', plan: 'Kurven vergleichen', doc: { ...lib.lessons[0].doc, pages: [{ ...lib.lessons[0].doc.pages[0], blocks: [] }] } });
  lib.lessons.push({ ...newLesson(lib, m), number: 3, title: 'Folgen für Europa', plan: 'Hitzesommer' });
  for (const l of lib.lessons) if (l.number !== 2) l.doc = { ...l.doc, pages: l.doc.pages.map((p) => ({ ...p, blocks: [] })) };
  return lib;
}

describe('lesson roles and competences in packages', () => {
  const raw = {
    format: 'arbeitsblatt-baukasten-paket',
    version: 2,
    modules: [
      {
        subject: 'Geographie',
        grade: 7,
        number: 4,
        title: 'Flüsse',
        competences: [
          { id: 'k1', area: 'Flusslauf beschreiben', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …' },
          { id: 'k2', area: 'Hochwasser erklären', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …' },
        ],
        lessons: [
          { number: 1, title: 'Vom Bach zum Strom', plan: 'Bildimpuls Rheinfall', role: 'einstieg', competences: ['k1'] },
          { number: 2, title: 'Hochwasser', plan: 'Fallbeispiel Ahr', role: 'Übung', competences: 'k1, k2, k7' },
          { number: 3, title: 'Klassenarbeit', role: 'Prüfung' },
        ],
      },
    ],
  };
  it('reads keys and German words, maps the competence ids and reports what is unknown', () => {
    const p = readPackage(raw);
    const [k1, k2] = p.modules[0].module.competences;
    const ls = p.modules[0].lessons;
    expect(ls[0].role).toBe('einstieg');
    expect(ls[0].competences).toEqual([k1.id]);
    expect(ls[1].role).toBe('uebung');
    expect(ls[1].competences).toEqual([k1.id, k2.id]);
    expect(ls[2].role).toBe('');
    expect(p.notes.some((n) => n.includes('„k7“'))).toBe(true);
    expect(p.notes.some((n) => n.includes('„Prüfung“'))).toBe(true);
  });
  it('keeps them through the library and back into a package', () => {
    const lib = seedLibrary();
    const done = addPackage(lib, readPackage(raw));
    const l2 = done.lessons.find((l) => l.number === 2)!;
    expect(l2.role).toBe('uebung');
    expect(l2.competences).toHaveLength(2);
    const file = packageFromModules([{ module: done.modules[0], lessons: done.lessons }]);
    const back = file.modules[0].lessons.find((l) => l.number === 2)!;
    expect(back.role).toBe('uebung');
    expect(back.competences).toEqual(l2.competences);
    expect(file.modules[0].competences.map((c) => c.id)).toContain(l2.competences[0]);
  });
  it('finds a module’s own competences again when a year plan completes a module in progress', () => {
    const lib = library();
    const m = lib.modules[0];
    const own = m.competences[1];
    const p = readPackage({
      format: 'arbeitsblatt-baukasten-paket',
      version: 2,
      modules: [
        {
          subject: m.subject,
          grade: m.grade,
          number: m.number,
          title: m.title,
          competences: [{ id: own.id, area: 'anders formuliert' }, { id: 'neu', area: m.competences[0].area }],
          lessons: [{ number: 4, title: 'Neu', plan: 'x', role: 'wiederholung', competences: [own.id, 'neu'] }],
        },
      ],
    });
    const done = addPackage(lib, p);
    expect(done.modules[0].competences).toEqual(m.competences);
    expect(done.lessons.find((l) => l.number === 4)!.competences).toEqual([own.id, m.competences[0].id]);
  });
  it('reads older lessons and settings with defaults', () => {
    const l = readLesson({ id: 'a', moduleId: 'b', doc: { pages: [{ title: 'x', blocks: [] }] } })!;
    expect(l.role).toBe('');
    expect(l.competences).toEqual([]);
    const s = readSettings({ classProfiles: { 'Englisch · 5': 'viele DaZ', leer: '' }, principles: 'Ich-Du-Wir' });
    expect(s.classProfiles).toEqual({ 'Englisch · 5': 'viele DaZ' });
    expect(readSettings({}).principles).toBe('');
  });
});

describe('class profile and principles', () => {
  it('go with the lesson, year plan, module and task requests', () => {
    const lib = library();
    const m = lib.modules[0];
    expect(classNotes(lib.settings, m.subject, m.grade)).toBe('');
    lib.settings = withClassNotes(lib.settings, m.subject, m.grade, '  24 Kinder, viele DaZ  ', 'Ich – Du – Wir');
    const notes = classNotes(lib.settings, m.subject, m.grade);
    expect(notes).toContain(`Die Klasse (${m.subject}, Klasse ${m.grade}): 24 Kinder, viele DaZ`);
    expect(notes).toContain('Grundsätze der Lehrkraft: Ich – Du – Wir');
    expect(classNotes(lib.settings, 'Englisch', 5)).toContain('Grundsätze');
    expect(classNotes(lib.settings, 'Englisch', 5)).not.toContain('24 Kinder');
    const l = lib.lessons.find((x) => x.number === 2)!;
    expect(lessonContext(lib, m, l)).toContain('24 Kinder, viele DaZ');
    expect(yearPlanContext(lib, m.subject, m.grade, { hours: 2, textbook: '', wishes: '' })).toContain('24 Kinder');
    expect(moduleContext(lib, m, { hours: 2, end: '', wishes: '' })).toContain('24 Kinder');
    const page = l.doc.pages[0];
    expect(taskPrompt('Mach ein Rätsel', { subject: m.subject, grade: m.grade, topic: m.title, lang: 'de', page, competences: [], notes })).toContain('24 Kinder');
    // Empty profile removes the entry.
    expect(withClassNotes(lib.settings, m.subject, m.grade, ' ', '').classProfiles).toEqual({});
  });
  it('lesson context names the role and competences of lessons', () => {
    const lib = library();
    const m = lib.modules[0];
    const l = lib.lessons.find((x) => x.number === 2)!;
    l.role = 'erarbeitung';
    l.competences = [m.competences[0].id];
    lib.lessons.find((x) => x.number === 3)!.role = 'uebung';
    const text = lessonContext(lib, m, l);
    expect(text).toContain('Rolle der Stunde im Modul: Erarbeitung');
    expect(text).toContain(`Kompetenzen dieser Stunde: \`${m.competences[0].id}\``);
    expect(text).toContain('Stunde 3 „Folgen für Europa“ · Übung: Hitzesommer');
  });
});

describe('year plan wishes', () => {
  it('tell Claude the Klassenarbeiten and fixed dates, and ask for roles', () => {
    const lib = library();
    const text = yearPlanContext(lib, 'Englisch', 8, { hours: 4, textbook: '', wishes: '', tests: 4, dates: 'VERA 8 im Mai' });
    expect(text).toContain('Klassenarbeiten im Schuljahr: 4');
    expect(text).toContain('Prüfungen, Projekte und feste Termine: VERA 8 im Mai');
    expect(yearPlanContext(lib, 'Englisch', 8, { hours: 4, textbook: '', wishes: '', tests: 0 })).toContain('keine');
    expect(yearPlanContext(lib, 'Englisch', 8, { hours: 4, textbook: '', wishes: '' })).not.toContain('Klassenarbeiten im Schuljahr');
    expect(yearPlanPrompt('Englisch', 8, '')).toContain('`role`');
  });
});

describe('module plan', () => {
  const answer = (lib: Library, lessons: unknown[]) => {
    const m = lib.modules[0];
    return {
      format: 'arbeitsblatt-baukasten-paket',
      version: 2,
      modules: [
        {
          subject: m.subject,
          grade: m.grade,
          number: m.number,
          title: 'Ein anderer Titel',
          description: 'Am Ende erklärt die Klasse den Treibhauseffekt auf einem Lernplakat.',
          competences: [
            { id: m.competences[1].id, area: 'Treibhauseffekt erklären (neu formuliert)', g: 'a', m: 'b', e: 'c' },
            { id: 'k9', area: 'Maßnahmen beurteilen', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …' },
          ],
          lessons,
        },
      ],
    };
  };
  it('asks with the module, its lessons and the year', () => {
    const lib = library();
    const m = lib.modules[0];
    const text = moduleContext(lib, m, { hours: 2, end: 'lernaufgabe', wishes: 'mit Exkursion' });
    expect(text).toContain('3 Schulwochen mit 2 Stunden pro Woche, also etwa 6 Stunden');
    expect(text).toContain('Abschluss des Moduls: Lernaufgabe');
    expect(text).toContain('Stunde 2 „Der Treibhauseffekt“ (ausgearbeitet; bleibt mit Nummer und Titel)');
    expect(text).toContain('Stunde 3 „Folgen für Europa“ (geplant): Hitzesommer');
    expect(text).toContain(`\`${m.competences[0].id}\``);
    expect(text).toMatch(/Zeitraum: KW \d+/);
    expect(modulePlanPrompt(m, text)).toContain('rückwärts');
    expect(hoursOf(m, lib.lessons)).toBe(1);
  });
  it('keeps worked-out lessons and the grid of a module in progress, replaces and drops planned lessons', () => {
    const lib = library();
    const m = lib.modules[0];
    const existing = lib.lessons.filter((l) => l.moduleId === m.id);
    const plan = modulePlanFromAnswer(
      answer(lib, [
        { number: 1, title: 'Wird das Klima wärmer?', plan: 'Schätzfrage', role: 'einstieg', competences: ['k9'] },
        { number: 2, title: 'Überschrieben?', role: 'erarbeitung', competences: [m.competences[1].id] },
        { number: 4, title: 'Lernplakat', plan: 'Gruppen', role: 'anwendung', competences: [m.competences[1].id, 'k9'] },
        { number: 5, title: 'Plakate vorstellen', role: 'leistung', pages: [{ blocks: [] }] },
      ]),
      m,
      existing,
    );
    // In progress: the old grid stays word for word, the new competence comes on top.
    expect(plan.competences.slice(0, m.competences.length)).toEqual(m.competences);
    expect(plan.competences).toHaveLength(m.competences.length + 1);
    const k9 = plan.added[0];
    expect(plan.lessons.map((l) => [l.number, l.status])).toEqual([
      [1, 'geändert'],
      [2, 'bleibt'],
      [4, 'neu'],
      [5, 'neu'],
    ]);
    expect(plan.lessons[1].title).toBe('Der Treibhauseffekt');
    expect(plan.lessons[2].competences).toEqual([m.competences[1].id, k9]);
    expect(plan.dropped.map((l) => l.number)).toEqual([3]);

    const done = applyModulePlan(lib, m, plan);
    expect(done.module.description).toContain('Lernplakat');
    expect(done.module.title).toBe(m.title);
    expect(done.remove.map((l) => l.number)).toEqual([3]);
    const by = new Map(done.lessons.map((l) => [l.number, l]));
    expect(by.get(1)!.title).toBe('Wird das Klima wärmer?');
    expect(by.get(1)!.id).toBe(existing.find((l) => l.number === 1)!.id);
    expect(by.get(2)!.doc).toBe(existing.find((l) => l.number === 2)!.doc);
    expect(by.get(2)!.role).toBe('erarbeitung');
    expect(isWorkedOut(by.get(4)!)).toBe(false);
    expect(by.get(4)!.doc.code).toBe(`K${m.grade} · M${m.number} · S4`);
    expect(by.get(5)!.role).toBe('leistung');
  });
  it('takes Claude’s grid in a module that has not begun', () => {
    const lib = library();
    const m = lib.modules[0];
    const existing = lib.lessons.filter((l) => l.moduleId === m.id && l.number !== 2);
    const plan = modulePlanFromAnswer(answer(lib, [{ number: 1, title: 'A', role: 'einstieg' }]), m, existing);
    expect(plan.competences).toHaveLength(2);
    expect(plan.competences[0]).toMatchObject({ id: m.competences[1].id, area: 'Treibhauseffekt erklären (neu formuliert)' });
    expect(plan.dropped.map((l) => l.number)).toEqual([3]);
  });
  it('says what is wrong with an answer', () => {
    const lib = library();
    expect(() => modulePlanFromAnswer({ modules: [{ subject: 'x' }] }, lib.modules[0], [])).toThrow('Stunden');
    expect(() => modulePlanFromAnswer('nein', lib.modules[0], [])).toThrow();
  });
});
