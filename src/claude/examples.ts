// The example in the instructions: one compact lesson (Geographie, Klasse 7) with a teacher page and one sheet.
// Built with the app's own functions, so the tests can check that the Baukasten reads it without a single note and
// that it passes the check without AI.
import { packageFromModules, type PackageFile } from '../library/package';
import type { Lesson, Module } from '../library/types';
import { createBlock as b } from '../model/ops';
import type { Page } from '../model/types';

const m: Module = {
  id: 'm3',
  subject: 'Geographie',
  grade: 7,
  number: 3,
  title: 'Vulkane',
  icon: 'mountain',
  description: 'Am Ende erklärt die Klasse an einem Vulkan der Wahl, wie er ausbricht.',
  competences: [
    { id: 'k1', domain: 'Erklären', area: 'Aufbau eines Vulkans', g: 'Ich kann Teile eines Vulkans benennen.', m: 'Ich kann den Weg des Magmas beschreiben.', e: 'Ich kann einen Ausbruch erklären.', lessons: '' },
  ],
  lang: 'de',
  help: true,
  textbook: '',
  weeks: 3,
  start: '',
  updatedAt: 0,
};

const teacher: Page = {
  title: 'Wie bricht ein Vulkan aus?',
  kicker: 'Klasse 7 · Stundenverlauf',
  type: 'lehrkraft',
  form: 'Plenum',
  nameField: 'aus',
  blocks: [
    b('goal', { goal: 'Die Klasse beschreibt den Weg des Magmas von der Magmakammer bis zum Krater.', curriculum: '3.2.1 Naturräume · Erklären' }),
    b('hook', { kind: 'bild', impulse: 'Was ist hier passiert?', question: 'Wie kommt das Magma nach oben?' }),
    b('path', {
      steps: 'M1 | Die Klasse liest, woher das Magma kommt. | Aufgabe 1 | Magma sammelt sich in der Magmakammer.\nM2 | Die Klasse beschriftet den Vulkan mit den Wörtern aus M1. | Aufgabe 2 | Krater, Schlot, Magmakammer.\nM1, M2 | Die Paare beschreiben den Weg des Magmas. | Aufgabe 3 | Das Magma steigt durch den Schlot zum Krater.',
    }),
    b('plan', {
      rows: '0–5 | Einstieg | Bild zeigen, Vermutungen, Leitfrage | Plenum | Folie\n5–20 | Erarbeitung | Lies M1, beschrifte M2. | Einzel | AB S. 1\n20–35 | Erarbeitung | Beschreibt den Weg des Magmas. | Partner | AB S. 1\n35–45 | Sicherung | Merksatz ergänzen, Leitfrage beantworten | Plenum | AB S. 1',
    }),
    b('expect', { items: 'Falsch | „Die Lava kommt aus dem Erdkern.“ | Das Magma sammelt sich in der Magmakammer, weit über dem Kern.' }),
    b('recall', { items: 'Wo sammelt sich das Magma? | in der Magmakammer\nWie heißt die Öffnung oben? | Krater' }),
  ],
};

const sheet: Page = {
  title: 'Wie bricht ein Vulkan aus?',
  kicker: 'Klasse 7 · Vulkane',
  type: 'uebung',
  form: 'allein',
  nameField: 'name',
  blocks: [
    b('text', { mat: 'M1', text: 'Tief unter dem Vulkan liegt die **Magmakammer**. Dort sammelt sich heißes, flüssiges Gestein, das Magma. Steigt der Druck, drückt es das Magma durch den **Schlot** nach oben. Oben tritt es am **Krater** aus und heißt dann Lava.' }, 7),
    b('image', { mat: 'M2', caption: 'M2: Schnitt durch einen Vulkan', height: 220, search: 'volcano cross section', describe: 'simple cross section of a volcano with magma chamber, vent and crater, no text', labels: 'Krater\nSchlot\nMagmakammer', labelStyle: 'luecken' }, 5),
    b('open', { prompt: 'Lies M1. Nenne, wo sich das Magma sammelt.', lines: 1, solution: 'In der Magmakammer.', level: '1', competence: 'k1' }),
    b('wordbank', { words: 'Krater\nSchlot\nMagmakammer' }),
    b('match', { prompt: 'Ordne in M2 die Begriffe den Nummern zu.', left: '1\n2\n3', right: 'Magmakammer\nKrater\nSchlot', solution: '2, 3, 1', level: '1', competence: 'k1' }),
    b('open', { prompt: 'Beschreibt zu zweit mit M1 und M2 den Weg des Magmas.', lines: 3, solution: 'Das Magma sammelt sich in der Magmakammer, steigt durch den Schlot und tritt am Krater als Lava aus.', level: '2', competence: 'k1', tip: 'Beginne unten bei der Magmakammer.' }),
    b('merksatz', { text: 'Das Magma sammelt sich in der [[Magmakammer]] und steigt durch den [[Schlot]] zum [[Krater]].' }),
  ],
};

const lesson: Lesson = {
  id: 'm3-s2',
  moduleId: m.id,
  number: 2,
  title: 'Wie bricht ein Vulkan aus?',
  textbook: '',
  plan: '',
  role: 'erarbeitung',
  competences: ['k1'],
  doc: { icon: m.icon, lang: m.lang, help: m.help, footer: '', code: '', pages: [teacher, sheet] },
  slides: [],
  slideDesign: 'organisch',
  boards: [],
  updatedAt: 0,
};

/** The example of the instructions, without the save time so the text stays the same. */
export function lessonExample(): PackageFile {
  const p = packageFromModules([{ module: m, lessons: [lesson] }]);
  delete p.savedAt;
  return p;
}
