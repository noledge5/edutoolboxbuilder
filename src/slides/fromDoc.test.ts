import { describe, expect, it } from 'vitest';
import { createBlock } from '../model/ops';
import { seedDoc } from '../model/seed';
import type { Block, Doc, Page } from '../model/types';
import { phaseKind, pickedSlides, planRows, questionsOf, recallQuestions, suggestSlides, type EarlierLesson } from './fromDoc';

const page = (type: Page['type'], blocks: Block[], title = 'Seite'): Page => ({ title, kicker: '', type, form: 'allein', nameField: 'aus', blocks });
const teacher = (...blocks: Block[]) => page('lehrkraft', blocks, 'Stundenverlauf');
const withTeacher = (doc: Doc, ...blocks: Block[]): Doc => ({ ...doc, pages: [teacher(...blocks), ...doc.pages] });

const PLAN = [
  '0–5 | Abrufphase | 3 Fragen ins Lernjournal | Einzel | Lernjournal',
  '5–10 | Einstieg | Schätzfrage, dann Leitfrage | Plenum | Tafel',
  '10–15 | Erarbeitung | Lies den Versuchsaufbau. | Einzel | AB S. 1',
  '15–25 | Erarbeitung | Führt den Versuch durch, notiert die Werte. | Partner | AB S. 1',
  '25–30 | Erarbeitung | Vergleicht mit einer anderen Gruppe. | Gruppe | AB S. 1',
  '30–35 | Besprechung | Ergebnisse vergleichen | Plenum | Folie',
  '35–42 | Sicherung | Fließschema und Merksatz | Einzel | AB S. 2',
  '42–45 | Exit | Zurück zur Leitfrage | Plenum |',
].join('\n');

const earlierLesson = (where: string, sameModule: boolean, items: string, merksatz = ''): EarlierLesson => ({
  where,
  sameModule,
  doc: { ...seedDoc(), pages: [teacher(createBlock('recall', { items })), page('sicherung', merksatz ? [createBlock('merksatz', { text: merksatz })] : [])] },
});

describe('slides along the course of the lesson', () => {
  it('reads the phases of the plan', () => {
    const rows = planRows([createBlock('plan', { rows: PLAN })]);
    expect(rows.map((r) => r.kind)).toEqual(['abruf', 'einstieg', 'arbeit', 'arbeit', 'arbeit', 'besprechung', 'sicherung', 'exit']);
    expect(rows[3]).toMatchObject({ minutes: 10, form: 'zu zweit', material: 'AB S. 1' });
    expect(phaseKind('Warm-up')).toBe('einstieg');
    expect(phaseKind('Check')).toBe('exit');
    expect(phaseKind('Vocabulary')).toBe('arbeit');
  });

  it('asks earlier lessons, spaced: the last one, an earlier one, an earlier module', () => {
    const earlier = [
      earlierLesson('Stunde 3', true, 'Frage A? | a\nFrage B? | b'),
      earlierLesson('Stunde 2', true, 'Frage C? | c'),
      earlierLesson('Stunde 1', true, ''),
      earlierLesson('Modul 1 · Stunde 4', false, '', 'Wasser [[verdunstet]] über dem Meer.'),
    ];
    expect(recallQuestions(earlier).map((q) => q.where)).toEqual(['Stunde 3', 'Stunde 2', 'Modul 1 · Stunde 4']);
    expect(recallQuestions(earlier)[2]).toMatchObject({ q: 'Ergänze: Wasser … über dem Meer.', a: 'verdunstet' });
    // Only one earlier lesson: its questions fill the slide.
    expect(recallQuestions(earlier.slice(0, 1)).map((q) => q.q)).toEqual(['Frage A?', 'Frage B?']);
    expect(recallQuestions([])).toEqual([]);
    // Tasks with a single right answer or a short solution count too.
    expect(questionsOf({ ...seedDoc() }).map(([q]) => q)).toContain('Unsere Vorhersage: Welches Glas wird nach 15 Minuten wärmer sein?');
  });

  it('follow the plan: recall, beginning, work with its steps, discussion, Merksatz', () => {
    const hook = createBlock('hook', { kind: 'schaetzen', impulse: 'Wie viel wärmer wird es?', answer: 'etwa 3 °C', question: 'Wie genau erwärmt CO₂ die Luft?' });
    const doc = withTeacher(seedDoc(), createBlock('plan', { rows: PLAN }), hook, createBlock('recall', { items: 'Was hält die Folie zurück? | Wärmestrahlung' }));
    const sections = suggestSlides(doc, 'Der Treibhauseffekt', { earlier: [earlierLesson('Stunde 1', true, 'Was misst ppm? | den CO₂-Anteil')], lessonNumber: 2 });
    expect(sections.map((s) => s.label)).toEqual([
      'Start',
      'Abrufphase · 5 min',
      'Einstieg · Schätzfrage · 5 min',
      'Arbeitsphase 1 · Erarbeitung · Versuch · S. 1 · 20 min',
      'Arbeitsphase 2 · Sicherung · S. 2 · 7 min',
      'Sicherung und Exit · 3 min',
    ]);
    const slides = pickedSlides(sections);
    // The title does not give the key question away: the beginning leads to it.
    expect(slides[0]).toMatchObject({ layout: 'title', text: '' });
    expect(slides[1]).toMatchObject({ layout: 'list', title: 'Aus dem Gedächtnis', items: 'Was misst ppm? | den CO₂-Anteil', reveal: true });
    expect(slides[2]).toMatchObject({ layout: 'big', label: 'Schätzfrage', title: 'Wie viel wärmer wird es?', text: 'etwa 3 °C' });
    expect(slides[2].anims).toEqual({ text: { step: 1, anim: 'zoom' } });
    expect(slides[3]).toMatchObject({ layout: 'statement', label: 'Leitfrage', title: 'Wie genau erwärmt CO₂ die Luft?' });
    // Ich – Du – Wir as steps with their minutes; the work form of the first step.
    const work = slides.find((s) => s.layout === 'work')!;
    expect(work).toMatchObject({
      phase: 'Erarbeitung',
      form: 'allein',
      minutes: 20,
      title: 'Bearbeite Aufgabe 1–4 auf S. 1.',
      items: 'Ich: Lies den Versuchsaufbau. | 5\nDu: Führt den Versuch durch, notiert die Werte. | 10\nGruppe: Vergleicht mit einer anderen Gruppe. | 5',
    });
    // The discussion's course goes to the first task of the phase.
    const first = slides.find((s) => s.layout === 'task' && s.label.startsWith('Aufgabe 1 · S. 1'))!;
    expect(first.notes).toContain('Besprechung: Ergebnisse vergleichen');
    const exit = slides[slides.length - 1];
    expect(exit).toMatchObject({ layout: 'exit', text: 'Zurück zur Leitfrage: Wie genau erwärmt CO₂ die Luft?', minutes: 3 });
    // This lesson's recall questions are offered for the exit, not ticked.
    const own = sections[sections.length - 1].items.find((i) => i.label.startsWith('Abruffragen dieser Stunde'))!;
    expect(own.on).toBe(false);
    expect(own.slide.items).toBe('Was hält die Folie zurück? | Wärmestrahlung');
  });

  it('say why there is no recall and turn each kind of beginning into its slide', () => {
    const doc = withTeacher(seedDoc(), createBlock('plan', { rows: PLAN }));
    const sections = suggestSlides(doc, 'T');
    expect(sections[1].note).toBe('Noch keine früheren Stunden zum Abrufen.');
    expect(sections[2].note).toContain('Baustein „Einstieg“');
    // Without a beginning the key question stays on the title.
    expect(sections[0].items[0].slide.text).toBe('');
    const layouts: Record<string, string> = {};
    for (const kind of ['bild', 'zitat', 'fall', 'video', 'versuch', 'abstimmung', 'raetsel', 'vorwissen']) {
      const hook = createBlock('hook', { kind, impulse: 'Impuls', answer: 'Ja / Nein / Vielleicht', url: 'https://youtu.be/abcdefghijk', question: 'Leitfrage?' });
      const s = suggestSlides(withTeacher(seedDoc(), hook), 'T');
      layouts[kind] = s[1].items.map((i) => i.slide.layout).join(' ');
      if (kind === 'abstimmung') expect(s[1].items[0].slide).toMatchObject({ vote: true, items: 'Ja\nNein\nVielleicht' });
      if (kind === 'video') expect(s[1].items[0].slide.elements[0]).toMatchObject({ kind: 'video', url: 'https://youtu.be/abcdefghijk' });
    }
    expect(layouts).toEqual({
      bild: 'full statement',
      zitat: 'quote',
      fall: 'quote',
      video: 'blank statement',
      versuch: 'statement statement',
      abstimmung: 'compare statement',
      raetsel: 'task statement',
      vorwissen: 'statement statement',
    });
  });
});
