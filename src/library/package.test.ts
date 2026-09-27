import { describe, expect, it } from 'vitest';
import { DocFormatError } from '../model/normalize';
import { isWorkedOut, lessonsOf, seedLibrary } from './model';
import type { Library } from './types';
import { addPackage, packageFromModule, packageFromModules, readPackage, PACKAGE_FORMAT } from './package';

const lesson = () => ({
  number: 1,
  title: 'Die Zelle',
  textbook: 'SB S. 12',
  pages: [{ title: 'Zellen', type: 'uebung', blocks: [{ type: 'open', props: { prompt: 'Beschreibe.', level: 2, competence: 'k1' } }] }],
});

/** Version 1: one module, lessons beside it. */
const v1 = (extra: Record<string, unknown> = {}) => ({
  format: PACKAGE_FORMAT,
  version: 1,
  module: { subject: 'Biologie', grade: 7, number: 2, title: 'Zellen', icon: 'leaf', competences: [{ id: 'k1', area: 'Zellen mikroskopieren', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …' }] },
  lessons: [lesson()],
  ...extra,
});

/** Version 2: a year plan with two English units and the school year. */
const v2 = () => ({
  format: PACKAGE_FORMAT,
  version: 2,
  schoolYear: { name: '2026/27', start: '14.09.2026', end: '2027-07-28', holidays: [{ name: 'Herbstferien', from: '2026-10-26', to: '2026-10-30' }] },
  modules: [
    {
      subject: 'Englisch',
      grade: 5,
      number: 1,
      title: 'Hello!',
      icon: 'school',
      textbook: 'Green Line 1, Unit 1',
      weeks: 5,
      competences: [{ id: 'k1', domain: 'Leseverstehen', area: 'Kurze Texte verstehen', g: 'I can …', m: 'I can …', e: 'I can …' }],
      lessons: [lesson()],
    },
    { subject: 'Englisch', grade: 5, number: 2, title: 'My family', weeks: 4, start: '2026-11-02' },
  ],
});

describe('Stundenpaket', () => {
  it('reads a version 1 package and links tasks to the new competence ids', () => {
    const p = readPackage(v1());
    expect(p.notes).toEqual([]);
    const [m] = p.modules;
    expect(m.module).toMatchObject({ subject: 'Biologie', grade: 7, number: 2, title: 'Zellen', icon: 'leaf', lang: 'de', help: true });
    const [c] = m.module.competences;
    expect(c.id).not.toBe('k1');
    expect(m.lessons[0].textbook).toBe('SB S. 12');
    const task = m.lessons[0].doc.pages[0].blocks[0];
    expect(task.props).toMatchObject({ prompt: 'Beschreibe.', level: '2', competence: c.id, lines: 3 });
  });

  it('reads a year plan with several modules and the school year', () => {
    const p = readPackage(v2());
    expect(p.notes).toEqual([]);
    expect(p.modules.map((m) => [m.module.title, m.module.lang, m.module.weeks, m.module.start, m.lessons.length])).toEqual([
      ['Hello!', 'en', 5, '', 1],
      ['My family', 'en', 4, '2026-11-02', 0],
    ]);
    expect(p.modules[0].module.textbook).toBe('Green Line 1, Unit 1');
    expect(p.modules[0].module.competences[0].domain).toBe('Leseverstehen');
    expect(p.modules[0].lessons[0].doc.lang).toBe('en');
    expect(p.schoolYear).toEqual({ name: '2026/27', start: '2026-09-14', end: '2027-07-28', holidays: [{ name: 'Herbstferien', from: '2026-10-26', to: '2026-10-30' }] });
  });

  it('gives German errors for what cannot be repaired', () => {
    const bad = (patch: Record<string, unknown>) => () => readPackage({ ...v1(), ...patch });
    expect(bad({ module: undefined })).toThrow(DocFormatError);
    expect(bad({ module: { grade: 7, title: 'x' } })).toThrow('Fach');
    expect(bad({ module: { subject: 'Bio', grade: 12 } })).toThrow('Klasse ("grade") muss eine Zahl von 5 bis 10 sein');
    expect(bad({ lessons: [] })).toThrow('keine Stunden');
    expect(bad({ lessons: [{ number: 1, pages: [] }] })).toThrow('Stunde 1 hat keine Seiten');
    expect(bad({ version: 3 })).toThrow('neueren Version');
    expect(() => readPackage({ ...v2(), modules: [] })).toThrow('keine Module');
    const two = v2();
    two.modules[1].grade = 11;
    expect(() => readPackage(two)).toThrow('bei Modul 2');
  });

  it('repairs the rest and says what it changed', () => {
    const raw = v1();
    raw.module.icon = 'einhorn';
    raw.lessons[0].pages[0].blocks.push(
      { type: 'video', props: {} } as never,
      { type: 'open', props: { question: 'Was?', competence: 'k9' } } as never,
      { type: 'image', props: { image: 'abb7' } } as never,
    );
    const p = readPackage({ ...raw, images: { abb1: 'data:image/png;base64,AAAA', kaputt: 'http://example.com/a.png' }, schoolYear: { name: 'x' } });
    const [m] = p.modules;
    expect(m.module.icon).toBe('thermometer-sun');
    expect(m.lessons[0].doc.pages[0].blocks.map((b) => b.type)).toEqual(['open', 'open', 'image']);
    const notes = p.notes.join('\n');
    expect(notes).toContain('Symbol „einhorn“');
    expect(notes).toContain('Baustein „video“');
    expect(notes).toContain('unbekannte Felder „question“');
    expect(notes).toContain('Kompetenz „k9“');
    expect(notes).toContain('Bild „abb7“ fehlt');
    expect(notes).toContain('Bild „kaputt“ ist kein gültiges Bild');
    expect(notes).toContain('Schuljahr');
    expect(Object.values(p.images)).toEqual(['data:image/png;base64,AAAA']);
    expect(Object.keys(p.images)[0]).not.toBe('abb1');
  });

  it('gives images fresh ids and points the blocks to them, also in picture grids', () => {
    const raw = v1();
    raw.lessons[0].pages[0].blocks.push({ type: 'image', props: { image: 'abb1' } } as never, { type: 'picvocab', props: { items: '🐶 | dog\n| cat', pics: '\nabb1' } } as never);
    const p = readPackage({ ...raw, images: { abb1: 'data:image/svg+xml;base64,PHN2Zy8+' } });
    const [id] = Object.keys(p.images);
    const blocks = p.modules[0].lessons[0].doc.pages[0].blocks;
    expect(blocks[1].props.image).toBe(id);
    expect(blocks[2].props.pics).toBe('\n' + id);
  });

  it('numbers lessons in order when their numbers are missing or doubled', () => {
    const raw = v1();
    const l = raw.lessons[0];
    const p = readPackage({ ...raw, lessons: [l, { ...l, title: 'Zwei' }, { ...l, number: undefined, title: 'Drei' }] });
    expect(p.modules[0].lessons.map((x) => [x.number, x.title])).toEqual([
      [1, 'Die Zelle'],
      [2, 'Zwei'],
      [3, 'Drei'],
    ]);
  });

  it('becomes new modules with codes, footer, icon and language from the library', () => {
    const lib = seedLibrary();
    const r = addPackage(lib, readPackage(v1()));
    expect(r.modules[0].number).toBe(2);
    expect(r.lessons[0]).toMatchObject({ moduleId: r.modules[0].id, number: 1, title: 'Die Zelle', textbook: 'SB S. 12' });
    expect(r.lessons[0].doc).toMatchObject({ icon: 'leaf', lang: 'de', code: 'K7 · M2 · S1', footer: 'Kuhl · Grafen-von-Zimmern-Realschule · Biologie' });
    // Modul 1 in Geographie 9 exists already: the package gets the next free number.
    const geo = readPackage({ ...v1(), module: { subject: 'Geographie', grade: 9, number: 1, title: 'Wetter' } });
    expect(addPackage(lib, geo).modules[0].number).toBe(2);
    // Two modules asking for the same free number: the second one moves on.
    const plan = v2();
    plan.modules[1].number = 1;
    expect(addPackage(lib, readPackage(plan)).modules.map((m) => m.number)).toEqual([1, 2]);
  });

  it('survives a round trip: module → file → new module', () => {
    const lib = seedLibrary();
    const m = { ...lib.modules[0], textbook: 'Diercke', weeks: 3, competences: lib.modules[0].competences.map((c) => ({ ...c, domain: 'Erkenntnisgewinnung' })) };
    const lessons = lessonsOf(lib, m.id);
    lessons[0].doc.pages[0].blocks[3].props.competence = m.competences[1].id;
    const file = JSON.parse(JSON.stringify(packageFromModule(m, lessons)));
    expect(file.version).toBe(2);
    expect(file.modules[0].lessons[0].pages[0].blocks[0]).toEqual({ type: 'heading', span: 12, props: { text: 'Aufbau' } });
    const p = readPackage(file);
    expect(p.notes).toEqual([]);
    const r = addPackage({ ...lib, modules: [], lessons: [] }, p);
    const [back] = r.modules;
    expect(back).toMatchObject({ subject: m.subject, grade: m.grade, number: m.number, title: m.title, icon: m.icon, description: m.description, textbook: 'Diercke', weeks: 3, lang: 'de' });
    expect(back.competences.map((c) => [c.area, c.domain])).toEqual(m.competences.map((c) => [c.area, c.domain]));
    const strip = (pages: (typeof lessons)[0]['doc']['pages']) => pages.map((pg) => ({ ...pg, blocks: pg.blocks.map((b) => ({ ...b, id: '', props: { ...b.props, competence: '' } })) }));
    expect(strip(r.lessons[0].doc.pages)).toEqual(strip(lessons[0].doc.pages));
    expect(r.lessons[0].doc.pages[0].blocks[3].props.competence).toBe(back.competences[1].id);
  });

  it('saves a whole year plan with the school year', () => {
    const lib = seedLibrary();
    const year = { name: '2026/27', start: '2026-09-14', end: '2027-07-28', holidays: [] };
    const file = packageFromModules([{ module: lib.modules[0], lessons: lessonsOf(lib, lib.modules[0].id) }], year);
    expect(file.schoolYear).toEqual(year);
    expect(readPackage(JSON.parse(JSON.stringify(file))).schoolYear).toEqual(year);
  });

  it('reads planned lessons: title and planning note, no pages yet', () => {
    const plan = v2();
    (plan.modules[1] as Record<string, unknown>).lessons = [
      { number: 1, title: 'This is my family', plan: ['Familienwörter', 'Stammbaum'] },
      { number: 2, title: 'Pets', pages: [] },
    ];
    const p = readPackage(plan);
    expect(p.notes).toEqual([]);
    const [one, two] = p.modules[1].lessons;
    expect(one).toMatchObject({ number: 1, title: 'This is my family', plan: 'Familienwörter\nStammbaum' });
    expect(one.doc.pages).toHaveLength(1);
    expect(one.doc.pages[0]).toMatchObject({ title: 'This is my family', kicker: 'Class 5 · My family', blocks: [] });
    expect(two.doc.pages[0].blocks).toEqual([]);
  });

  it('merges a year plan into the modules that exist, without touching worked-out lessons', () => {
    const lib: Library = { ...seedLibrary(), modules: [], lessons: [] };
    const first = addPackage(lib, readPackage(v2()));
    const withUnit: Library = { ...lib, modules: first.modules, lessons: first.lessons };
    const [unit1] = first.modules;
    const worked = first.lessons[0];

    // The year plan from Claude: unit 1 with three planned lessons, unit 2 and a new unit 3.
    const plan = {
      format: PACKAGE_FORMAT,
      version: 2,
      modules: [
        {
          subject: 'Englisch',
          grade: 5,
          number: 1,
          title: 'Hello, school!',
          weeks: 6,
          description: 'Sich vorstellen',
          lessons: [
            { number: 1, title: 'Hello', plan: 'Begrüßen' },
            { number: 2, title: 'My classroom', plan: 'Schulsachen' },
            { number: 3, title: 'To be' },
          ],
        },
        { subject: 'Englisch', grade: 5, number: 2, title: 'My family and me', lessons: [{ number: 1, title: 'This is my family', plan: 'Stammbaum' }] },
        { subject: 'Englisch', grade: 5, number: 3, title: 'A day in my life', weeks: 6 },
      ],
    };
    const r = addPackage(withUnit, readPackage(plan));
    expect(r.results.map((x) => [x.module.number, x.action, x.added, x.changed, x.planned])).toEqual([
      [1, 'ergänzt', 2, 1, 2],
      [2, 'ergänzt', 1, 0, 1],
      [3, 'neu', 0, 0, 0],
    ]);
    // Unit 1 is in progress: same id, title and weeks stay, the empty description is filled.
    expect(r.modules[0]).toMatchObject({ id: unit1.id, title: 'Hello!', weeks: 5, description: 'Sich vorstellen' });
    // Its worked-out lesson 1 keeps its worksheet and only gets the planning note.
    const one = r.lessons.find((l) => l.id === worked.id)!;
    expect(one.doc.pages).toEqual(worked.doc.pages);
    expect(one).toMatchObject({ title: 'Die Zelle', plan: 'Begrüßen' });
    const added = r.lessons.filter((l) => l.moduleId === unit1.id && l.id !== worked.id);
    expect(added.map((l) => [l.number, l.title, isWorkedOut(l), l.doc.code])).toEqual([
      [2, 'My classroom', false, 'K5 · M1 · S2'],
      [3, 'To be', false, 'K5 · M1 · S3'],
    ]);
    // Unit 2 was only planned (no lessons): it takes the plan's title.
    expect(r.modules[1]).toMatchObject({ id: first.modules[1].id, title: 'My family and me', weeks: 4 });
  });

  it('fills a planned module with the worked-out lessons from Claude', () => {
    const lib: Library = { ...seedLibrary(), modules: [], lessons: [] };
    const planned = readPackage({
      format: PACKAGE_FORMAT,
      version: 2,
      modules: [{ subject: 'Biologie', grade: 7, number: 2, title: 'Zellen', lessons: [{ number: 1, title: 'Die Zelle', plan: 'Mikroskopieren' }, { number: 2, title: 'Zellteilung' }] }],
    });
    const a = addPackage(lib, planned);
    const planLib: Library = { ...lib, modules: a.modules, lessons: a.lessons };
    const r = addPackage(planLib, readPackage(v1()));
    expect(r.results[0]).toMatchObject({ action: 'ergänzt', added: 0, changed: 1, planned: 0 });
    expect(r.modules[0].id).toBe(a.modules[0].id);
    expect(r.modules[0].competences.map((c) => c.area)).toEqual(['Zellen mikroskopieren']);
    const [lesson1] = r.lessons;
    expect(lesson1.id).toBe(a.lessons[0].id);
    expect(isWorkedOut(lesson1)).toBe(true);
    expect(lesson1).toMatchObject({ plan: 'Mikroskopieren', textbook: 'SB S. 12' });
    expect(lesson1.doc.pages[0].blocks[0].props.competence).toBe(r.modules[0].competences[0].id);
    // Worked out on both sides: nothing is overwritten, the package becomes a new module.
    const done: Library = { ...planLib, modules: r.modules, lessons: [...planLib.lessons.filter((l) => l.id !== lesson1.id), lesson1] };
    const again = addPackage(done, readPackage(v1()));
    expect(again.results[0]).toMatchObject({ action: 'neu' });
    expect(again.modules[0].number).toBe(3);
  });

  it('saves planned lessons without pages', () => {
    const lib: Library = { ...seedLibrary(), modules: [], lessons: [] };
    const a = addPackage(lib, readPackage({ format: PACKAGE_FORMAT, version: 2, modules: [{ subject: 'Englisch', grade: 6, number: 1, title: 'London', lessons: [{ number: 1, title: 'Sights', plan: 'Sehenswürdigkeiten' }] }] }));
    const file = JSON.parse(JSON.stringify(packageFromModule(a.modules[0], a.lessons)));
    expect(file.modules[0].lessons).toEqual([{ number: 1, title: 'Sights', plan: 'Sehenswürdigkeiten' }]);
    expect(readPackage(file).modules[0].lessons[0]).toMatchObject({ title: 'Sights', plan: 'Sehenswürdigkeiten' });
  });
});
