import { describe, expect, it } from 'vitest';
import { newLesson, plannedDoc, seedLibrary } from '../library/model';
import { BW_2026_27 } from '../library/yearplan';
import type { Library } from '../library/types';
import { DocFormatError } from '../model/normalize';
import { jsonOf } from './client';
import { lessonContext, lessonSummary, lessonWeek } from './context';
import { lessonFromAnswer, lessonPrompt } from './lesson';
import { costOf, dollars, priceOf } from './prices';
import { modelLabel, overLimit, readAiSettings, withSpent } from './settings';

describe('prices', () => {
  it('counts input, cache and output tokens', () => {
    // 30 000 tokens written to the cache, 2 000 input, 10 000 output on Opus 5.5.
    expect(costOf('claude-opus-5-5', { input: 2000, output: 10000, cacheRead: 0, cacheWrite: 30000 })).toBeCloseTo(0.008 + 0.15 + 0.2, 6);
    expect(costOf('claude-opus-5-5', { input: 0, output: 0, cacheRead: 30000, cacheWrite: 0 })).toBeCloseTo(0.006, 6);
  });
  it('knows OpenRouter ids and counts unknown models like Opus', () => {
    expect(priceOf('anthropic/claude-sonnet-5.5').output).toBe(10);
    expect(priceOf('irgendein-modell').output).toBe(20);
  });
  it('writes dollars the German way', () => {
    expect(dollars(0.615)).toBe('0,61 $');
    expect(dollars(0.004)).toBe('< 0,01 $');
    expect(dollars(0)).toBe('0,00 $');
  });
});

describe('settings', () => {
  it('names models', () => {
    expect(modelLabel('claude-opus-5-5')).toBe('Claude Opus 5.5');
    expect(modelLabel('anthropic/claude-sonnet-5.5')).toBe('Claude Sonnet 5.5');
    expect(modelLabel('claude-opus-5')).toBe('Claude Opus 5');
    expect(modelLabel('claude-haiku-4-5-20251001')).toBe('Claude Haiku 4.5');
    expect(modelLabel('gpt-9')).toBe('gpt-9');
  });
  const oct = new Date(2026, 9, 1).getTime();
  const nov = new Date(2026, 10, 3).getTime();
  it('needs a key', () => {
    expect(readAiSettings(null)).toBeNull();
    expect(readAiSettings({ provider: 'anthropic', key: ' ' })).toBeNull();
  });
  it('fills defaults and starts a new month at zero', () => {
    const s = readAiSettings({ provider: 'openrouter', key: 'sk-or-1', month: '2026-10', spent: 4.2 }, oct)!;
    expect(s.models.big).toBe('anthropic/claude-opus-5.5');
    expect(s.limit).toBe(10);
    expect(s.spent).toBe(4.2);
    expect(readAiSettings({ ...s }, nov)!.spent).toBe(0);
  });
  it('adds what a request cost and asks once the limit is reached', () => {
    let s = readAiSettings({ key: 'sk-ant-1', limit: 1, month: '2026-10', spent: 0.7 }, oct)!;
    expect(overLimit(s)).toBe(false);
    s = withSpent(s, 'Stunde ausarbeiten', 'claude-opus-5-5', 0.4, oct);
    expect(s.spent).toBeCloseTo(1.1);
    expect(s.log[0].what).toBe('Stunde ausarbeiten');
    expect(overLimit(s)).toBe(true);
    expect(overLimit({ ...s, limit: 0 })).toBe(false);
    expect(withSpent(s, 'Umformulieren', 'claude-sonnet-5-5', 0.01, nov).spent).toBeCloseTo(0.01);
  });
});

describe('jsonOf', () => {
  it('finds the object in a fenced answer', () => {
    expect(jsonOf('Hier ist das Paket:\n```json\n{"a": {"b": 1}}\n```\nViel Erfolg!')).toEqual({ a: { b: 1 } });
    expect(jsonOf('{"a": 2}')).toEqual({ a: 2 });
    expect(() => jsonOf('Ich habe eine Frage.')).toThrow();
    expect(() => jsonOf('```json\n{"a": \n```')).toThrow();
  });
});

/** The example module with a school year, four planned weeks and lessons before and after the example lesson. */
function library(): Library {
  const lib = seedLibrary();
  lib.settings.schoolYear = BW_2026_27;
  lib.modules[0].weeks = 4;
  const m = lib.modules[0];
  const first = { ...newLesson(lib, m), number: 1, title: 'CO₂ und Temperatur', plan: 'Kurven vergleichen' };
  lib.lessons.push(first);
  const third = { ...newLesson(lib, m), number: 3, title: 'Folgen für Europa', plan: 'Hitzesommer und Starkregen' };
  lib.lessons.push(third);
  return lib;
}

describe('lesson context', () => {
  it('places the lesson in the year plan, with the lessons around it', () => {
    const lib = library();
    const m = lib.modules[0];
    const l = lib.lessons.find((x) => x.number === 2)!;
    const week = lessonWeek(lib, m, l)!;
    expect(week.week.monday >= BW_2026_27.start.slice(0, 8)).toBe(true);
    const text = lessonContext(lib, m, l, 'mit Bildimpuls');
    expect(text).toContain('Modul 1: „Das Klima kippt“');
    expect(text).toContain('Stunde 2 von 3, „Der Treibhauseffekt“');
    expect(text).toContain(`KW ${week.week.kw}`);
    expect(text).toContain('Wünsche der Lehrkraft: mit Bildimpuls');
    expect(text).toContain('`beispiel-k2` · Den Treibhauseffekt erklären');
    expect(text).toContain('Stunde 1 „CO₂ und Temperatur“ (geplant): Kurven vergleichen');
    expect(text).toContain('Stunde 3 „Folgen für Europa“: Hitzesommer und Starkregen');
  });
  it('sums up a worked-out lesson', () => {
    const s = lessonSummary(seedLibrary().lessons[0].doc);
    expect(s).toContain('Merksatz: Beobachtung + Mechanismus');
    expect(s).toContain('Aufgabenarten: Ankreuzen');
  });
  it('has no week without a school year', () => {
    const lib = seedLibrary();
    expect(lessonWeek(lib, lib.modules[0], lib.lessons[0])).toBeNull();
  });
});

describe('lesson from Claude', () => {
  const lib = library();
  const m = lib.modules[0];
  const l = lib.lessons.find((x) => x.number === 1)!;
  const teacher = { title: 'Stundenverlauf', type: 'lehrkraft', blocks: [{ type: 'goal', props: { goal: 'Kurven lesen' } }] };
  const sheet = { title: 'Zwei Kurven', type: 'uebung', blocks: [{ type: 'open', props: { prompt: 'Vergleiche.', competence: 'beispiel-k1' } }] };
  const answer = (pages: unknown[], competences: unknown[] = []) => ({
    format: 'arbeitsblatt-baukasten-paket',
    version: 2,
    modules: [{ subject: 'Geographie', grade: 9, number: 1, title: 'Das Klima kippt', competences, lessons: [{ number: 1, title: 'X', pages }] }],
  });

  it('keeps the module and its competence ids', () => {
    const d = lessonFromAnswer(answer([teacher, sheet]), m, l, l.doc, 'full');
    expect(d.doc.pages.map((p) => p.type)).toEqual(['lehrkraft', 'uebung']);
    expect(d.doc.pages[1].blocks[0].props.competence).toBe('beispiel-k1');
    expect(d.doc.icon).toBe(l.doc.icon);
    expect(d.added).toEqual([]);
  });
  it('adds new competences', () => {
    const extra = { id: 'neu', area: 'Kurven vergleichen', g: 'a', m: 'b', e: 'c' };
    const page = { ...sheet, blocks: [{ type: 'open', props: { prompt: 'Vergleiche.', competence: 'neu' } }] };
    const d = lessonFromAnswer(answer([page], [m.competences[0], extra]), m, l, l.doc, 'full');
    expect(d.added.map((c) => c.area)).toEqual(['Kurven vergleichen']);
    expect(d.doc.pages[0].blocks[0].props.competence).toBe(d.added[0].id);
  });
  it('builds the sheets to the scaffold and keeps the teacher page', () => {
    const scaffold = lessonFromAnswer(answer([teacher, sheet]), m, l, l.doc, 'scaffold');
    expect(scaffold.doc.pages.map((p) => p.type)).toEqual(['lehrkraft']);
    const built = lessonFromAnswer({ pages: [teacher, sheet] }, m, l, scaffold.doc, 'sheets');
    expect(built.doc.pages.map((p) => p.type)).toEqual(['lehrkraft', 'uebung']);
    expect(built.doc.pages[0]).toBe(scaffold.doc.pages[0]);
    expect(built.made).toHaveLength(1);
  });
  it('drops the empty page of a planned lesson', () => {
    const planned = plannedDoc(m, l.title);
    const d = lessonFromAnswer(answer([teacher]), m, l, planned, 'scaffold');
    expect(d.doc.pages).toHaveLength(1);
  });
  it('says what is missing', () => {
    expect(() => lessonFromAnswer({ format: 'arbeitsblatt-baukasten-paket', modules: [{ lessons: [{ number: 1, title: 'X', plan: 'nur geplant' }] }] }, m, l, l.doc, 'full')).toThrow(DocFormatError);
    expect(() => lessonFromAnswer('Hallo', m, l, l.doc, 'full')).toThrow(DocFormatError);
  });
  it('asks for one lesson in the package format, with the teacher page for the sheets', () => {
    const withTeacher = { ...l, doc: lessonFromAnswer(answer([teacher]), m, l, l.doc, 'scaffold').doc };
    const p = lessonPrompt(m, withTeacher, 'KONTEXT', 'sheets');
    expect(p).toContain('"number": 1');
    expect(p).toContain('KONTEXT');
    expect(p).toContain('Kurven lesen');
    expect(p).toContain('keine Rückfragen');
    expect(lessonPrompt(m, l, 'KONTEXT', 'full', true)).toContain('Projektwissen');
  });
});
