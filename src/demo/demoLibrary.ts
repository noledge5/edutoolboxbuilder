// Sample library for `npm run demo`: three subjects, several classes, modules with real-looking worksheets, planned and
// empty ones. Only the demo mode loads it, into its own browser storage (its own port), never into the teacher's data.
import { createBlock as b } from '../model/ops';
import { seedDoc } from '../model/seed';
import type { Block, Doc, Page, SheetType, WorkForm } from '../model/types';
import type { Competence, Lesson, Library, Module } from '../library/types';
import { BW_2026_27 } from '../library/yearplan';

const HOUR = 3_600_000;
const FOOTER = 'Musterschule';

function page(title: string, kicker: string, type: SheetType, form: WorkForm, blocks: Block[]): Page {
  return { title, kicker, type, form, nameField: type === 'lehrkraft' ? 'aus' : 'name', blocks };
}

function doc(m: Module, n: number, pages: Page[]): Doc {
  return { icon: m.icon, lang: m.lang, help: m.help, footer: `${FOOTER} · ${m.subject}`, code: `K${m.grade} · M${m.number} · S${n}`, pages };
}

function comp(id: string, area: string, g: string, m: string, e: string, lessons: string, domain = ''): Competence {
  return { id, area, g, m, e, lessons, domain };
}

function mod(id: string, subject: string, grade: number, number: number, title: string, icon: string, description: string, weeks: number, competences: Competence[] = []): Module {
  return {
    id,
    subject,
    grade,
    number,
    title,
    icon,
    description,
    competences,
    lang: /englisch/i.test(subject) ? 'en' : 'de',
    help: true,
    textbook: /englisch/i.test(subject) ? 'Green Line' : '',
    weeks,
    start: '',
    updatedAt: Date.now() - 400 * HOUR,
  };
}

/** A worked-out lesson (with pages) or a planned one (no pages, a planning note). */
function lesson(m: Module, number: number, title: string, pages: Page[] | null, plan = '', ago = 200): Lesson {
  return {
    id: `${m.id}-s${number}`,
    moduleId: m.id,
    number,
    title,
    textbook: '',
    plan,
    role: '',
    competences: [],
    doc: doc(m, number, pages ?? [page(title, `Klasse ${m.grade} · ${m.title}`, 'uebung', 'allein', [])]),
    slides: [],
    slideDesign: 'organisch',
    boards: [],
    updatedAt: Date.now() - ago * HOUR,
  };
}

export function demoLibrary(): Library {
  // — Geographie, Klasse 9 —
  const klima = mod('demo-geo9-m1', 'Geographie', 9, 1, 'Das Klima kippt', 'thermometer-sun', 'Vom Zusammenhang zwischen CO₂ und Temperatur zum Mechanismus des Treibhauseffekts.', 5, [
    comp('k1', 'Klimadiagramme lesen', 'Ich kann Temperatur und Niederschlag ablesen.', 'Ich kann zwei Klimadiagramme vergleichen.', 'Ich kann aus einem Diagramm auf die Klimazone schließen.', '1'),
    comp('k2', 'Den Treibhauseffekt erklären', 'Ich kann die Schritte im Fließschema nennen.', 'Ich kann den Treibhauseffekt mit eigenen Worten erklären.', 'Ich kann natürlichen und zusätzlichen Treibhauseffekt unterscheiden.', '2, 3'),
    comp('k3', 'Folgen beurteilen', 'Ich kann Folgen des Klimawandels nennen.', 'Ich kann Folgen für eine Region beschreiben.', 'Ich kann Maßnahmen bewerten.', '4'),
  ]);
  const seed = seedDoc();
  const klimaLessons = [
    lesson(klima, 1, 'CO₂ und Temperatur', [
      page('Zwei Kurven, ein Zusammenhang?', 'Klasse 9 · CO₂ und Temperatur', 'uebung', 'zu zweit', [
        b('text', { text: 'Seit 1850 messen Wetterstationen die Temperatur. Seit 1958 misst eine Station auf dem Mauna Loa (Hawaii) den CO₂-Gehalt der Luft.' }),
        b('image', { caption: 'M1: CO₂-Gehalt und Temperatur seit 1850', height: 150 }, 7),
        b('hint', { title: 'So liest du ein Diagramm', text: 'Erst die Achsen, dann der Verlauf, dann die Ausreißer.' }, 5),
        b('mc', { prompt: 'Wie hat sich der CO₂-Gehalt seit 1958 entwickelt?', options: 'Er ist gleich geblieben.\n*Er ist stetig gestiegen.\nEr ist gesunken.' }),
        b('table', { prompt: 'Lies die Werte ab.', cols: 'Jahr\nCO₂ (ppm)\nTemperatur (°C)', rows: '1960\n1990\n2020' }),
        b('open', { prompt: 'Beweisen die beiden Kurven, dass CO₂ die Erde erwärmt? Begründe.', lines: 3 }),
      ]),
    ], '', 30),
    { ...lesson(klima, 2, 'Der Treibhauseffekt', null, '', 2), doc: { ...seed, footer: `${FOOTER} · Geographie` } },
    lesson(klima, 3, 'Natürlich oder gemacht?', [
      page('Natürlicher und zusätzlicher Treibhauseffekt', 'Klasse 9 · Sicherung', 'sicherung', 'allein', [
        b('heading', { text: 'Ohne Treibhauseffekt kein Leben' }),
        b('gap', { prompt: 'Ergänze.', text: 'Ohne den natürlichen Treibhauseffekt läge die Durchschnittstemperatur bei [[−18]] °C, mit ihm bei etwa [[15]] °C.' }),
        b('match', { prompt: 'Ordne zu.', left: 'Kohlenstoffdioxid\nMethan\nLachgas', right: 'Rinderhaltung und Reisanbau\nDüngung in der Landwirtschaft\nVerbrennen von Kohle, Öl und Gas', solution: '2, 3, 1' }),
        b('wordbank', { words: 'Verkehr\nIndustrie\nLandwirtschaft\nHeizen' }),
        b('merksatz', { text: 'Der Mensch [[verstärkt]] den natürlichen Treibhauseffekt.' }),
      ]),
    ], '', 50),
    lesson(klima, 4, 'Folgen in Europa', null, 'Gruppenpuzzle: Alpen, Mittelmeer, Nordsee. Je Gruppe ein Steckbrief.', 120),
  ];
  const platten = mod('demo-geo9-m2', 'Geographie', 9, 2, 'Die Erde in Bewegung', 'mountain', 'Plattentektonik, Vulkane und Erdbeben.', 4);
  const plattenLessons = [
    lesson(platten, 1, 'Platten treiben auseinander', [
      page('Die Erde in Bewegung', 'Klasse 9 · Plattentektonik', 'uebung', 'allein', [
        b('flow', { steps: 'Magma steigt auf | am Rücken\nNeue Kruste | entsteht\nPlatten | driften auseinander' }),
        b('open', { prompt: 'Beschreibe mit dem Fließschema, wie ein Mittelozeanischer Rücken entsteht.', lines: 4 }),
        b('mc', { prompt: 'Wie schnell bewegen sich die Platten etwa?', options: 'wenige Millimeter pro Jahr\n*wenige Zentimeter pro Jahr\nwenige Meter pro Jahr' }),
        b('draw', { prompt: 'Zeichne eine Subduktionszone und beschrifte sie.', height: 150 }),
      ]),
    ], '', 90),
    lesson(platten, 2, 'Vulkane', null, 'Vulkantypen an Plattengrenzen, Fallbeispiel Ätna.', 140),
    lesson(platten, 3, 'Erdbeben', null, 'Erdbebenwellen, Richter-Skala, Verhalten im Ernstfall.', 140),
  ];
  const bevoelkerung = mod('demo-geo9-m3', 'Geographie', 9, 3, 'Bevölkerung und Migration', 'users', 'Bevölkerungsdiagramme, Push- und Pull-Faktoren.', 4);
  const bevLessons = [
    lesson(bevoelkerung, 1, 'Bevölkerungspyramiden', null, 'Drei Pyramiden vergleichen: Niger, Deutschland, Japan.', 160),
    lesson(bevoelkerung, 2, 'Warum Menschen wandern', null, 'Push- und Pull-Faktoren an Fallbeispielen.', 160),
  ];
  const global = mod('demo-geo9-m4', 'Geographie', 9, 4, 'Globalisierung', 'globe', '', 0);

  // — Geographie, Klasse 7 and 5 —
  const wetter = mod('demo-geo7-m1', 'Geographie', 7, 1, 'Wetter und Klima', 'cloud-sun-rain', 'Wetterelemente messen und Klimadiagramme zeichnen.', 4);
  const wetterLessons = [
    lesson(wetter, 1, 'Wir messen das Wetter', [
      page('Unsere Wetterstation', 'Klasse 7 · Wetter und Klima', 'versuch', 'Gruppe', [
        b('text', { text: 'Eine Woche lang messt ihr jeden Morgen um 8 Uhr Temperatur, Niederschlag und Wind auf dem Schulhof.' }),
        b('table', { prompt: 'Trage eure Messwerte ein.', cols: 'Tag\nTemperatur (°C)\nNiederschlag (mm)\nWind', rows: 'Montag\nDienstag\nMittwoch\nDonnerstag\nFreitag' }),
        b('hint', { title: 'Achtung', text: 'Das Thermometer hängt im Schatten, 2 m über dem Boden.' }),
        b('open', { prompt: 'An welchem Tag war es am wärmsten? Woran lag das?', lines: 2 }),
      ]),
    ], '', 70),
    lesson(wetter, 2, 'Klimadiagramme zeichnen', [
      page('Ein Klimadiagramm zeichnen', 'Klasse 7 · Wetter und Klima', 'uebung', 'allein', [
        b('flow', { steps: 'Achsen | zeichnen\nNiederschlag | als Säulen\nTemperatur | als Linie\nKlimazone | bestimmen' }),
        b('draw', { prompt: 'Zeichne das Klimadiagramm von Freiburg.', height: 220 }),
        b('merksatz', { text: 'Temperatur ist eine [[Linie]], Niederschlag sind [[Säulen]].' }),
      ]),
    ], '', 75),
  ];
  const gewaesser = mod('demo-geo7-m2', 'Geographie', 7, 2, 'Flüsse und Meere', 'waves', 'Vom Quellbach zur Mündung.', 3);
  const gewLessons = [lesson(gewaesser, 1, 'Ein Fluss von der Quelle bis zur Mündung', null, 'Oberlauf, Mittellauf, Unterlauf am Rhein.', 180)];
  const karten = mod('demo-geo5-m1', 'Geographie', 5, 1, 'Mit Karten unterwegs', 'map', 'Himmelsrichtungen, Maßstab und Legende.', 3);
  const kartenLessons = [
    lesson(karten, 1, 'Himmelsrichtungen', [
      page('Wo ist Norden?', 'Klasse 5 · Mit Karten unterwegs', 'uebung', 'allein', [
        b('image', { caption: 'M1: Der Schulhof von oben', height: 180 }),
        b('gap', { prompt: 'Ergänze die Himmelsrichtungen.', text: 'Die Sonne geht im [[Osten]] auf und im [[Westen]] unter. Mittags steht sie im [[Süden]].' }),
        b('mc', { prompt: 'Wo liegt die Turnhalle vom Eingang aus?', options: 'im Norden\n*im Osten\nim Westen' }),
      ]),
    ], '', 100),
  ];

  // — Englisch —
  const school = mod('demo-eng6-m1', 'Englisch', 6, 1, 'Back to school', 'school', 'Talking about school subjects, timetables and the time.', 4);
  const schoolLessons = [
    lesson(school, 1, 'My timetable', [
      page('My new timetable', 'Class 6 · Unit 1: Back to school', 'uebung', 'zu zweit', [
        b('wordbank', { words: 'Maths\nEnglish\nGerman\nPE\nArt\nMusic' }),
        b('table', { prompt: 'Fill in your timetable.', cols: 'Time\nMonday\nTuesday\nWednesday', rows: '8:00\n8:45\n9:50\n10:35' }),
        b('gap', { prompt: 'Complete the sentences.', text: 'On Monday I have [[Maths]] first. My favourite subject is ___ because ___.' }),
        b('open', { prompt: 'Ask your partner: What is your favourite day? Why?', lines: 2 }),
      ]),
    ], '', 6),
    lesson(school, 2, 'Telling the time', [
      page('What time is it?', 'Class 6 · Unit 1: Back to school', 'uebung', 'allein', [
        b('match', { prompt: 'Match the clocks and the times.', left: 'quarter past eight\nhalf past nine\nten to eleven', right: '9:30\n10:50\n8:15', solution: '2, 3, 1' }),
        b('mc', { prompt: 'School starts at 7:55. That is …', options: '*five to eight\nfive past eight\nfive to seven' }),
        b('merksatz', { text: 'We say [[past]] after the hour and [[to]] before the next hour.' }),
      ]),
    ], '', 20),
  ];
  const family = mod('demo-eng6-m2', 'Englisch', 6, 2, 'My family and me', 'home', 'Family words, possessive s, describing people.', 4);
  const familyLessons = [lesson(family, 1, 'This is my family', null, 'Family tree, possessive s.', 150), lesson(family, 2, 'Describing people', null, 'Adjectives for looks and character.', 150)];
  const london = mod('demo-eng8-m1', 'Englisch', 8, 1, 'Life in London', 'landmark', 'Sights, the Tube and asking the way.', 5);
  const londonLessons = [
    lesson(london, 1, 'Getting around London', [
      page('On the Tube', 'Class 8 · Unit 3: Life in London', 'uebung', 'zu zweit', [
        b('text', { text: 'Maya and her brother want to go from King\'s Cross to the London Eye. They look at the Tube map.' }),
        b('image', { caption: 'M1: Part of the Tube map', height: 160 }),
        b('open', { prompt: 'Write down the way: Take the … line to …, then change to …', lines: 3 }),
        b('hint', { title: 'Useful phrases', text: 'Excuse me, how do I get to …? · Take the … line. · Change at …' }),
      ]),
    ], '', 40),
  ];

  // — Informatik —
  const algo = mod('demo-inf10-m1', 'Informatik', 10, 1, 'Algorithmen mit Python', 'code', 'Variablen, Schleifen und Verzweigungen in Python.', 6);
  const algoLessons = [
    lesson(algo, 1, 'Schleifen', [
      page('Immer wieder: die for-Schleife', 'Klasse 10 · Algorithmen mit Python', 'uebung', 'allein', [
        b('code', { code: 'summe = 0\nfor i in range(1, 6):\n    summe = summe + i\nprint(summe)', language: 'python' }),
        b('table', { prompt: 'Verfolge das Programm Schritt für Schritt.', cols: 'Durchlauf\ni\nsumme', rows: '1\n2\n3\n4\n5' }),
        b('mc', { prompt: 'Was gibt das Programm aus?', options: '5\n10\n*15' }),
        b('open', { prompt: 'Ändere das Programm so, dass es die Zahlen von 1 bis 100 addiert.', lines: 3 }),
      ]),
    ], '', 12),
    lesson(algo, 2, 'Verzweigungen', null, 'if, elif, else am Beispiel Notenrechner.', 130),
  ];
  const daten = mod('demo-inf10-m2', 'Informatik', 10, 2, 'Daten und Codierung', 'binary', '', 3);
  const datenLessons = [lesson(daten, 1, 'Binärzahlen', null, 'Zählen mit zwei Fingern: von 0 bis 31.', 170)];

  const modules = [klima, platten, bevoelkerung, global, wetter, gewaesser, karten, school, family, london, algo, daten];
  const lessons = [...klimaLessons, ...plattenLessons, ...bevLessons, ...wetterLessons, ...gewLessons, ...kartenLessons, ...schoolLessons, ...familyLessons, ...londonLessons, ...algoLessons, ...datenLessons];
  return {
    settings: {
      subjects: ['Geographie', 'Englisch', 'Informatik', 'Biologie'],
      footerBase: FOOTER,
      schoolYear: BW_2026_27,
      subjectColors: {},
      principles: '',
      classProfiles: {},
      updatedAt: Date.now() - 500 * HOUR,
    },
    modules,
    lessons,
    handouts: [],
    deleted: {},
  };
}
