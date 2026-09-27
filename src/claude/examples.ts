// Complete Stundenpakete for the instructions: an English lesson (Klasse 5), a year plan and the Geography sample.
// Built with the app's own functions, so the tests can check that the Baukasten reads them without a single note.
import { lessonsOf, plannedDoc, seedLibrary } from '../library/model';
import { packageFromModules, type PackageFile } from '../library/package';
import type { Lesson, Module } from '../library/types';
import { BW_2026_27 } from '../library/yearplan';
import { BLOCK_TYPES } from '../model/blockTypes';
import { createBlock as b } from '../model/ops';
import { createElement, SLIDE_DEFAULTS, type Slide, type SlideLayout } from '../model/slides';
import type { Doc, Page } from '../model/types';

const time = 0;

const module = (m: Partial<Module> & Pick<Module, 'subject' | 'grade' | 'number' | 'title' | 'icon'>): Module => ({
  id: 'm' + m.number,
  description: '',
  competences: [],
  lang: 'de',
  help: true,
  textbook: '',
  weeks: 0,
  start: '',
  updatedAt: time,
  ...m,
});

const lesson = (m: Module, number: number, title: string, textbook: string, pages: Page[]): Lesson => ({
  id: `${m.id}-s${number}`,
  moduleId: m.id,
  number,
  title,
  textbook,
  plan: '',
  doc: { icon: m.icon, lang: m.lang, help: m.help, footer: '', code: '', pages } satisfies Doc,
  slides: [],
  updatedAt: time,
});

/** The package without the save time, so the text in the instructions stays the same. */
function clean(p: PackageFile): PackageFile {
  delete p.savedAt;
  return p;
}

/** Englisch Klasse 5, Unit 1: a lesson with a teacher page, vocabulary, grammar and speaking/writing. */
export function englishExample(): PackageFile {
  const m = module({
    subject: 'Englisch',
    grade: 5,
    number: 1,
    title: 'Hello, school!',
    icon: 'school',
    lang: 'en',
    help: true,
    weeks: 5,
    description: 'Sich vorstellen, die neue Schule · Grammatik: to be, Personalpronomen',
    competences: [
      {
        id: 'k1',
        domain: 'Sprachliche Mittel: Wortschatz',
        area: 'Wörter rund um die Schule',
        g: 'Ich kann Dinge im Klassenzimmer auf Englisch benennen.',
        m: 'Ich kann die Wörter in kurzen Sätzen verwenden.',
        e: 'Ich kann ein Wort auf Englisch umschreiben, wenn es mir fehlt.',
        lessons: '',
      },
      {
        id: 'k2',
        domain: 'Sprachliche Mittel: Grammatik',
        area: 'to be verwenden',
        g: 'Ich kann die Formen von to be nennen.',
        m: 'Ich kann to be in Sätzen richtig verwenden.',
        e: 'Ich kann mit to be verneinen und Fragen stellen.',
        lessons: '',
      },
      {
        id: 'k3',
        domain: 'Sprechen – an Gesprächen teilnehmen',
        area: 'Sich und andere vorstellen',
        g: 'Ich kann sagen, wie ich heiße und wie alt ich bin.',
        m: 'Ich kann mich und andere vorstellen.',
        e: 'Ich kann ein kurzes Gespräch beginnen und Fragen stellen.',
        lessons: '',
      },
    ],
  });
  const teacher: Page = {
    title: 'Hello, I’m …',
    kicker: 'Klasse 5 · Stundenverlauf',
    type: 'lehrkraft',
    form: 'Plenum',
    nameField: 'aus',
    blocks: [
      b('goal', {
        goal: 'Die Klasse stellt sich auf Englisch vor und festigt die Formen von to be.',
        curriculum: '3.1.3.3 Sprechen – an Gesprächen teilnehmen · 3.1.3.7 Verfügbarkeit sprachlicher Mittel (Wortschatz, Grammatik)',
      }),
      b('plan', {
        rows: [
          '0–5 | Warm-up | Song „Hello, hello“, Begrüßung auf Englisch. | Plenum | Audio',
          '5–15 | Vocabulary | Neue Wörter mit Bildkarten einführen, Aussprache chorisch üben. | Plenum | Bildkarten, AB S. 1',
          '15–25 | Grammar | to be an der Tafel entdecken, Regel gemeinsam formulieren. | Plenum | Tafel, AB S. 2',
          '25–40 | Speaking | Rollenkarten: sich zu zweit vorstellen, dann Partner vorstellen. | Partner | AB S. 3',
          '40–45 | Check | „Ich kann …“ ankreuzen, Hausaufgabe: Knicktest. | Einzel | AB S. 3',
        ].join('\n'),
      }),
      b('expect', {
        items: [
          'Richtig | „My name is Tom. I’m eleven.“ | Vollständige Vorstellung mit Kurzform.',
          'Falsch | „I am eleven years.“ | Es fehlt old: I’m eleven (years old).',
          'Vorsicht | „He are my friend.“ | he / she / it → is. Auf die Grammatik-Box verweisen.',
        ].join('\n'),
      }),
      b('recall', {
        title: 'Abrufphase für die nächste Stunde',
        items: 'Wie sagt man „Tafel“ auf Englisch? | board\nWelche Form von to be gehört zu she? | is\nWie fragst du nach dem Alter? | How old are you?',
      }),
    ],
  };
  const vocab: Page = {
    title: 'My classroom',
    kicker: 'Class 5 · Unit 1',
    type: 'vocab',
    form: 'allein',
    nameField: 'name',
    blocks: [
      b('vocab', {
        title: 'New words',
        rows: [
          'board | bɔːd | Tafel | Look at the board, please.',
          'pencil case | ˈpensl keɪs | Federmäppchen | My pencil case is blue.',
          'rubber | ˈrʌbə | Radiergummi | Can I have a rubber, please?',
          'schoolbag | ˈskuːlbæɡ | Schultasche | My schoolbag is heavy.',
          'desk | desk | Schreibtisch, Pult | The book is on my desk.',
          'classmate | ˈklɑːsmeɪt | Mitschüler/in | Ben is my classmate.',
        ].join('\n'),
      }),
      b('picvocab', {
        prompt: 'Label the pictures.',
        help: 'Schreibe das englische Wort unter jedes Bild.',
        items: '📏 | ruler\n✏️ | pencil\n🎒 | schoolbag\n📖 | book',
        level: '1',
        competence: 'k1',
      }),
      b('foldtest', {
        prompt: 'Fold the page. Write the English words. Then check.',
        help: 'Knicke das Blatt an der gestrichelten Linie. Schreibe die englischen Wörter und kontrolliere dann.',
        rows: 'Tafel | board\nFedermäppchen | pencil case\nRadiergummi | rubber\nMitschüler/in | classmate',
        mode: 'knick',
        level: '2',
        competence: 'k1',
        tip: 'Look at the list “New words” at the top of the page.',
      }),
    ],
  };
  const grammar: Page = {
    title: 'I am, you are …',
    kicker: 'Class 5 · Unit 1 · Grammar',
    type: 'grammar',
    form: 'allein',
    nameField: 'name',
    blocks: [
      b('grammar', {
        title: 'to be',
        rule: 'to be heißt „sein“. Die Form hängt von der Person ab: I {{am}}, he / she / it {{is}}, we / you / they {{are}}.',
        signal: '',
        examples: 'I{{’m}} Emma.\nShe{{’s}} my friend.\nWe{{’re}} in class 5b.',
        variant: 'accent-3',
      }),
      b('jumble', {
        prompt: 'Put the words in the right order.',
        help: 'Bringe die Wörter in die richtige Reihenfolge.',
        items: 'My name is Emma.\nI am eleven years old.\nfriend / is / Ben / my = Ben is my friend.',
        level: '1',
        competence: 'k2',
      }),
      b('transform', {
        prompt: 'Write the sentences with the short form.',
        help: 'Schreibe die Sätze mit der Kurzform.',
        items: "I am Tom. | short form | I'm Tom.\nShe is my sister. | short form | She's my sister.\nWe are friends. | short form | We're friends.",
        level: '2',
        competence: 'k2',
      }),
      b('gap', {
        prompt: 'Fill in am, is or are.',
        help: 'Setze am, is oder are ein.',
        text: 'Hi, I [[am]] Emma. This [[is]] Ben. We [[are]] in class 5b. Our teacher [[is]] Mr Clark.',
        level: '3',
        competence: 'k2',
      }),
    ],
  };
  const speaking: Page = {
    title: 'Let’s meet!',
    kicker: 'Class 5 · Unit 1 · Speaking and writing',
    type: 'speaking',
    form: 'zu zweit',
    nameField: 'namen',
    blocks: [
      b('phrases', {
        title: 'Useful phrases',
        items:
          'Hi, I’m … What’s your name? | Hallo, ich bin … Wie heißt du?\nHow old are you? | Wie alt bist du?\nThis is my friend … | Das ist mein Freund / meine Freundin …\nNice to meet you. | Schön, dich kennenzulernen.',
        variant: 'accent-6',
      }),
      b('rolecards', {
        titleA: 'Partner A',
        textA: 'You are Tom, 11.\nAsk your partner: name? age?\nIntroduce your friend Ben (12).',
        titleB: 'Partner B',
        textB: 'You are Mia, 10.\nAsk your partner: name? age?\nIntroduce your friend Lucy (11).',
      }),
      b('writing', {
        prompt: 'Write about you.',
        help: 'Schreibe über dich. Nutze die Satzanfänge.',
        starters: 'My name is …\nI’m … years old.\nMy best friend is …\nMy favourite subject is …',
        lines: 1,
        checklist: 'I have written four sentences.\nI have used I’m and is.\nI have checked my spelling.',
        level: '2',
        competence: 'k3',
      }),
      b('selfcheck', {
        title: 'I can …',
        items: 'Ich kann Dinge im Klassenzimmer auf Englisch benennen.\nIch kann mich auf Englisch vorstellen.\nIch kann die Formen von to be verwenden.',
      }),
    ],
  };
  const slide = (id: string, layout: SlideLayout, fields: Partial<Slide>): Slide => ({ ...SLIDE_DEFAULTS, id, layout, ...fields });
  const slides: Slide[] = [
    slide('f1', 'title', { type: 'vocab', title: 'Hello, I’m …', text: 'How do we say who we are?', notes: 'Begrüßung auf Englisch, Song „Hello, hello“.' }),
    slide('f2', 'words', {
      type: 'vocab',
      phase: 'Vocabulary',
      form: 'Plenum',
      minutes: 10,
      title: 'My classroom',
      items: 'board | Tafel\npencil case | Federmäppchen\nrubber | Radiergummi\nschoolbag | Schultasche',
      reveal: true,
      notes: 'Bildkarten zeigen, chorisch nachsprechen, dann Bedeutungen aufdecken.',
    }),
    slide('f3', 'list', {
      type: 'grammar',
      phase: 'Grammar',
      form: 'zu zweit',
      minutes: 10,
      title: 'I am, you are …',
      text: 'Complete the sentences.',
      items: 'I ___ Tom. | am\nYou ___ eleven. | are\nShe ___ my friend. | is',
      reveal: true,
      build: true,
      elements: [createElement('text', { id: 'e1', text: '**he / she / it** → is', style: 'note', x: 1240, y: 760, w: 580, h: 180, step: 7, anim: 'zoom' })],
      notes: 'Regel an der Tafel entdecken lassen, dann Satz für Satz aufdecken; zum Schluss der Merkzettel.',
    }),
    slide('f4', 'exit', {
      type: 'sicherung',
      phase: 'Exit',
      form: 'allein',
      minutes: 3,
      text: 'Tell your partner: My name is … I am … years old.',
      label: 'Remember',
      title: 'I am · you are · he / she / it is',
      notes: 'Ich-kann-Satz ankreuzen lassen.',
    }),
  ];
  return clean(packageFromModules([{ module: m, lessons: [{ ...lesson(m, 1, 'Hello, I’m …', '', [teacher, vocab, grammar, speaking]), slides }] }]));
}

/** A planned lesson of the year plan: title and planning note, no pages yet. */
const planned = (m: Module, number: number, title: string, plan: string): Lesson => ({ ...lesson(m, number, title, '', []), plan, doc: plannedDoc(m, title) });

/**
 * A year plan without a textbook: the units of Englisch Klasse 5 with their focus and weeks, the school year,
 * and planned lessons (title and note, no pages) where they are already known.
 */
export function yearPlanExample(): PackageFile {
  const units: [string, string, number, string][] = [
    ['Hello, school!', 'school', 5, 'Sich vorstellen, Schule und Klassenzimmer · Grammatik: to be, Personalpronomen'],
    ['My family and me', 'home', 6, 'Familie, Haustiere, Zuhause · Grammatik: have got, Plural, Possessivbegleiter'],
    ['A day in my life', 'clock', 6, 'Tagesablauf, Uhrzeit, Schulfächer · Grammatik: simple present'],
    ['Birthdays and parties', 'cake', 5, 'Geburtstage, Monate, Einladungen · Grammatik: can, Imperativ'],
  ];
  const modules = units.map(([title, icon, weeks, description], i) => module({ subject: 'Englisch', grade: 5, number: i + 1, title, icon, lang: 'en', weeks, description }));
  modules[1].competences = [
    {
      id: 'k1',
      domain: 'Hör-/Hörsehverstehen',
      area: 'Familienmitglieder in Gesprächen erkennen',
      g: 'Ich kann Namen und Familienwörter heraushören.',
      m: 'Ich kann verstehen, wer mit wem verwandt ist.',
      e: 'Ich kann Einzelheiten zu Personen heraushören.',
      lessons: '',
    },
  ];
  const [m1, m2] = modules;
  const lessons: Record<string, Lesson[]> = {
    [m1.id]: [
      planned(m1, 1, 'Hello, I’m …', 'Sich begrüßen und vorstellen; Wortschatz Klassenzimmer; Kennenlernspiel.'),
      planned(m1, 2, 'My classroom', 'Schulsachen benennen; Hörverstehen: What’s in your school bag?'),
      planned(m1, 3, 'I am, you are …', 'Formen von to be entdecken und üben; Personalpronomen.'),
    ],
    [m2.id]: [planned(m2, 1, 'This is my family', 'Familienwörter; Stammbaum beschriften; Possessivbegleiter my/your.')],
  };
  return clean(
    packageFromModules(
      modules.map((m) => ({ module: m, lessons: lessons[m.id] ?? [] })),
      BW_2026_27,
    ),
  );
}

/** The Geography sample (Sachfach): teacher page, experiment and summary, tasks linked to the competences. */
export function geographyExample(): PackageFile {
  const lib = seedLibrary();
  const m = lib.modules[0];
  const [k1, k2, k3] = m.competences;
  const l = { ...lessonsOf(lib, m.id)[0], number: 1 };
  const [versuch, sicherung] = l.doc.pages;
  const teacher: Page = {
    title: 'Der Treibhauseffekt',
    kicker: 'Klasse 9 · Stundenverlauf',
    type: 'lehrkraft',
    form: 'Plenum',
    nameField: 'aus',
    blocks: [b('goal'), b('plan'), b('expect'), b('recall')],
  };
  const tasks = (p: Page) => p.blocks.filter((x) => BLOCK_TYPES[x.type].task);
  const link = (p: Page, i: number, competence: string, level: string) => Object.assign(tasks(p)[i].props, { competence, level });
  link(versuch, 0, k3.id, '1');
  link(versuch, 1, k3.id, '1');
  link(versuch, 2, k1.id, '2');
  link(versuch, 3, k3.id, '3');
  link(sicherung, 0, k2.id, '2');
  link(sicherung, 1, k2.id, '1');
  link(sicherung, 2, k2.id, '3');
  sicherung.blocks.push(b('selfcheck'));
  const ids = new Map(m.competences.map((c, i) => [c.id, `k${i + 1}`]));
  const pkg = packageFromModules([
    {
      module: { ...m, competences: m.competences.map((c) => ({ ...c, id: ids.get(c.id)!, lessons: '' })) },
      lessons: [{ ...l, doc: { ...l.doc, pages: [teacher, versuch, sicherung] } }],
    },
  ]);
  for (const pg of pkg.modules[0].lessons[0].pages ?? []) for (const x of pg.blocks) if (x.props.competence) x.props.competence = ids.get(String(x.props.competence));
  return clean(pkg);
}
