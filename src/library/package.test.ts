import { describe, expect, it } from 'vitest';
import { DocFormatError } from '../model/normalize';
import { lessonsOf, seedLibrary } from './model';
import { addPackage, packageFromModule, readPackage, PACKAGE_FORMAT } from './package';

const minimal = (extra: Record<string, unknown> = {}) => ({
  format: PACKAGE_FORMAT,
  version: 1,
  module: { subject: 'Biologie', grade: 7, number: 2, title: 'Zellen', icon: 'leaf', competences: [{ id: 'k1', area: 'Zellen mikroskopieren', g: 'Ich kann …', m: 'Ich kann …', e: 'Ich kann …' }] },
  lessons: [
    {
      number: 1,
      title: 'Die Zelle',
      pages: [{ title: 'Zellen', type: 'uebung', blocks: [{ type: 'open', props: { prompt: 'Beschreibe.', level: 2, competence: 'k1' } }] }],
    },
  ],
  ...extra,
});

describe('Stundenpaket', () => {
  it('reads a package and links tasks to the new competence ids', () => {
    const p = readPackage(minimal());
    expect(p.notes).toEqual([]);
    expect(p.module).toMatchObject({ subject: 'Biologie', grade: 7, number: 2, title: 'Zellen', icon: 'leaf' });
    const [c] = p.module.competences;
    expect(c.id).not.toBe('k1');
    const task = p.lessons[0].doc.pages[0].blocks[0];
    expect(task.props).toMatchObject({ prompt: 'Beschreibe.', level: '2', competence: c.id, lines: 3 });
  });

  it('gives German errors for what cannot be repaired', () => {
    const bad = (patch: Record<string, unknown>) => () => readPackage({ ...minimal(), ...patch });
    expect(bad({ module: undefined })).toThrow(DocFormatError);
    expect(bad({ module: { grade: 7, title: 'x' } })).toThrow('Fach');
    expect(bad({ module: { subject: 'Bio', grade: 12 } })).toThrow('Klasse ("module.grade") muss eine Zahl von 5 bis 10 sein');
    expect(bad({ lessons: [] })).toThrow('keine Stunden');
    expect(bad({ lessons: [{ title: 'x', pages: [] }] })).toThrow('Stunde 1 hat keine Seiten');
    expect(bad({ version: 2 })).toThrow('neueren Version');
  });

  it('repairs the rest and says what it changed', () => {
    const raw = minimal();
    raw.module.icon = 'einhorn';
    raw.lessons[0].pages[0].blocks.push(
      { type: 'video', props: {} } as never,
      { type: 'open', props: { question: 'Was?', competence: 'k9' } } as never,
      { type: 'image', props: { image: 'abb7' } } as never,
    );
    const p = readPackage({ ...raw, images: { abb1: 'data:image/png;base64,AAAA', kaputt: 'http://example.com/a.png' } });
    expect(p.module.icon).toBe('thermometer-sun');
    expect(p.lessons[0].doc.pages[0].blocks.map((b) => b.type)).toEqual(['open', 'open', 'image']);
    expect(p.notes.join('\n')).toContain('Symbol „einhorn“');
    expect(p.notes.join('\n')).toContain('Baustein „video“');
    expect(p.notes.join('\n')).toContain('unbekannte Felder „question“');
    expect(p.notes.join('\n')).toContain('Kompetenz „k9“');
    expect(p.notes.join('\n')).toContain('Bild „abb7“ fehlt');
    expect(p.notes.join('\n')).toContain('Bild „kaputt“ ist kein gültiges Bild');
    expect(Object.values(p.images)).toEqual(['data:image/png;base64,AAAA']);
    expect(Object.keys(p.images)[0]).not.toBe('abb1');
  });

  it('gives images fresh ids and points the blocks to them', () => {
    const raw = minimal();
    raw.lessons[0].pages[0].blocks.push({ type: 'image', props: { image: 'abb1' } } as never);
    const p = readPackage({ ...raw, images: { abb1: 'data:image/svg+xml;base64,PHN2Zy8+' } });
    const [id] = Object.keys(p.images);
    expect(p.lessons[0].doc.pages[0].blocks[1].props.image).toBe(id);
  });

  it('numbers lessons in order when their numbers are missing or doubled', () => {
    const raw = minimal();
    const l = raw.lessons[0];
    const p = readPackage({ ...raw, lessons: [l, { ...l, title: 'Zwei' }, { ...l, number: undefined, title: 'Drei' }] });
    expect(p.lessons.map((x) => [x.number, x.title])).toEqual([
      [1, 'Die Zelle'],
      [2, 'Zwei'],
      [3, 'Drei'],
    ]);
  });

  it('becomes a new module with codes, footer and icon from the library', () => {
    const lib = seedLibrary();
    const r = addPackage(lib, readPackage(minimal()));
    expect(r.module.number).toBe(2);
    expect(r.lessons[0]).toMatchObject({ moduleId: r.module.id, number: 1, title: 'Die Zelle' });
    expect(r.lessons[0].doc).toMatchObject({ icon: 'leaf', code: 'K7 · M2 · S1', footer: 'Kuhl · Grafen-von-Zimmern-Realschule · Biologie' });
    // Modul 1 in Geographie 9 exists already: the package gets the next free number.
    const geo = readPackage({ ...minimal(), module: { subject: 'Geographie', grade: 9, number: 1, title: 'Wetter' } });
    const r2 = addPackage(lib, geo);
    expect(r2.module.number).toBe(2);
  });

  it('survives a round trip: module → file → new module', () => {
    const lib = seedLibrary();
    const m = lib.modules[0];
    const lessons = lessonsOf(lib, m.id);
    lessons[0].doc.pages[0].blocks[3].props.competence = m.competences[1].id;
    const file = JSON.parse(JSON.stringify(packageFromModule(m, lessons)));
    expect(file.lessons[0].pages[0].blocks[0]).toEqual({ type: 'heading', span: 12, props: { text: 'Aufbau' } });
    const p = readPackage(file);
    expect(p.notes).toEqual([]);
    const r = addPackage({ ...lib, modules: [], lessons: [] }, p);
    expect(r.module).toMatchObject({ subject: m.subject, grade: m.grade, number: m.number, title: m.title, icon: m.icon, description: m.description });
    expect(r.module.competences.map((c) => c.area)).toEqual(m.competences.map((c) => c.area));
    const strip = (pages: typeof lessons[0]['doc']['pages']) => pages.map((pg) => ({ ...pg, blocks: pg.blocks.map((b) => ({ ...b, id: '', props: { ...b.props, competence: '' } })) }));
    expect(strip(r.lessons[0].doc.pages)).toEqual(strip(lessons[0].doc.pages));
    expect(r.lessons[0].doc.pages[0].blocks[3].props.competence).toBe(r.module.competences[1].id);
  });
});
