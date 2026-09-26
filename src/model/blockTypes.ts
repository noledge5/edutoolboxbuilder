import type { BlockProps, BlockType } from './types';

export interface SegOption<V extends string | number | boolean = string | number | boolean> {
  v: V;
  l: string;
}

export type FieldDef = (
  | { key: string; label: string; kind: 'text' | 'area' | 'variant' | 'image' | 'competence' }
  /** Multi-line text with a row of IPA characters to insert (vocabulary). */
  | { key: string; label: string; kind: 'ipa' }
  | { key: string; label: string; kind: 'number'; min: number; max: number }
  | { key: string; label: string; kind: 'seg'; options: SegOption<string>[] }
  /** One picture per line of the prop named in `of`; the prop holds the image ids, one per line. */
  | { key: string; label: string; kind: 'pics'; of: string }
  /** Not a prop: a choice of ready-made contents that fill several props at once. */
  | { key: string; label: string; kind: 'preset'; presets: { l: string; props: BlockProps }[] }
) & {
  /** Only shown for English worksheets. */
  when?: 'en';
};

export interface BlockTypeDef {
  label: string;
  /** Index into GROUPS. */
  group: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  span: number;
  /** Tasks are numbered automatically per page. */
  task?: boolean;
  defaults: BlockProps;
  fields: FieldDef[];
}

/** Fields every task has: German help, level stars, points (content and language), competence and a tip card. */
const TASK_FIELDS: FieldDef[] = [
  {
    key: 'level',
    label: 'Niveau',
    kind: 'seg',
    options: [
      { v: '', l: '–' },
      { v: '1', l: '★ G' },
      { v: '2', l: '★★ M' },
      { v: '3', l: '★★★ E' },
    ],
  },
  { key: 'points', label: 'Punkte (0 = keine)', kind: 'number', min: 0, max: 99 },
  { key: 'langPoints', label: 'Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt)', kind: 'number', min: 0, max: 99 },
  { key: 'competence', label: 'Kompetenz aus dem Kompetenzraster', kind: 'competence' },
  { key: 'tip', label: 'Tipp (erscheint auf den Tippkarten)', kind: 'area' },
];
const HELP_FIELD: FieldDef = { key: 'help', label: 'Deutsche Hilfe (klein unter dem Auftrag)', kind: 'area', when: 'en' };
const TASK_DEFAULTS = { help: '', level: '', points: 0, langPoints: 0, competence: '', tip: '' };

/** A task's fields: its own (the instruction first), the German help right after the instruction, then the common ones. */
const taskFields = ([prompt, ...rest]: FieldDef[]): FieldDef[] => [prompt, HELP_FIELD, ...rest, ...TASK_FIELDS];

/** Level stars as Niveau of the Bildungsplan: ★ = G, ★★ = M, ★★★ = E. */
export const LEVEL_NAMES: Record<string, string> = { '1': 'G', '2': 'M', '3': 'E' };

const PROMPT: FieldDef = { key: 'prompt', label: 'Arbeitsauftrag', kind: 'area' };

/** Ready-made grammar tables for the Formentabelle. */
const FORM_PRESETS: { l: string; props: BlockProps }[] = [
  {
    l: 'to be',
    props: {
      title: 'to be – simple present',
      cols: 'person\nlong form\nshort form\nnegative',
      rows: "I | am | I'm | I'm not\nyou | are | you're | you aren't\nhe / she / it | is | he's / she's / it's | he / she / it isn't\nwe | are | we're | we aren't\nyou | are | you're | you aren't\nthey | are | they're | they aren't",
    },
  },
  {
    l: 'have got',
    props: {
      title: 'have got',
      cols: 'person\nlong form\nshort form\nnegative',
      rows: "I | have got | I've got | I haven't got\nyou | have got | you've got | you haven't got\nhe / she / it | ha{{s}} got | he's got | he ha{{sn't}} got\nwe | have got | we've got | we haven't got\nyou | have got | you've got | you haven't got\nthey | have got | they've got | they haven't got",
    },
  },
  {
    l: 'simple present',
    props: {
      title: 'simple present – play',
      cols: 'person\npositive\nnegative\nquestion',
      rows: "I | play | don't play | Do I play?\nyou | play | don't play | Do you play?\nhe / she / it | play{{s}} | {{doesn't}} play | {{Does}} he play?\nwe | play | don't play | Do we play?\nyou | play | don't play | Do you play?\nthey | play | don't play | Do they play?",
    },
  },
  {
    l: 'can',
    props: {
      title: 'can – can’t',
      cols: 'person\npositive\nnegative\nquestion',
      rows: "I | can swim | can't swim | Can I swim?\nyou | can swim | can't swim | Can you swim?\nhe / she / it | can swim | can't swim | Can he swim?\nwe / you / they | can swim | can't swim | Can they swim?",
    },
  },
  {
    l: 'present progressive',
    props: {
      title: 'present progressive – read',
      cols: 'person\npositive\nnegative\nquestion',
      rows: "I | {{am}} read{{ing}} | I'm not reading | Am I reading?\nhe / she / it | {{is}} read{{ing}} | isn't reading | Is he reading?\nwe / you / they | {{are}} read{{ing}} | aren't reading | Are they reading?",
    },
  },
  {
    l: 'Leere Tabelle zum Ausfüllen',
    props: {
      title: 'simple present – like',
      cols: 'person\npositive\nnegative',
      rows: 'I | [[like]] | [[don’t like]]\nhe / she / it | [[likes]] | [[doesn’t like]]\nwe / you / they | [[like]] | [[don’t like]]',
    },
  },
];

export const BLOCK_TYPES: Record<BlockType, BlockTypeDef> = {
  heading: {
    label: 'Überschrift',
    group: 0,
    span: 12,
    defaults: { text: 'Neue Überschrift' },
    fields: [{ key: 'text', label: 'Text', kind: 'text' }],
  },
  text: {
    label: 'Textblock',
    group: 0,
    span: 12,
    defaults: { text: 'Hier steht ein kurzer Informationstext für die Klasse.' },
    fields: [{ key: 'text', label: 'Text', kind: 'area' }],
  },
  hint: {
    label: 'Hinweis-Box',
    group: 0,
    span: 12,
    defaults: { title: 'Wichtiger Hinweis', text: 'Kurzer Hinweis oder Tipp.', variant: 'accent-2' },
    fields: [
      { key: 'title', label: 'Titel', kind: 'text' },
      { key: 'text', label: 'Text', kind: 'area' },
      { key: 'variant', label: 'Farbe', kind: 'variant' },
    ],
  },
  merksatz: {
    label: 'Merksatz',
    group: 0,
    span: 12,
    defaults: { text: 'Beobachtung + ___ = eine Erklärung, die überzeugt.', variant: 'accent-2' },
    fields: [
      { key: 'text', label: 'Text (___ = Lücke, [[Wort]] = Lücke mit Lösung)', kind: 'area' },
      { key: 'variant', label: 'Farbe', kind: 'variant' },
    ],
  },
  wordbank: {
    label: 'Wortspeicher',
    group: 0,
    span: 12,
    defaults: { words: 'Begriff 1\nBegriff 2\nBegriff 3' },
    fields: [{ key: 'words', label: 'Wörter (eins je Zeile)', kind: 'area' }],
  },
  image: {
    label: 'Abbildung',
    group: 1,
    span: 6,
    defaults: { caption: 'Abb. 1: Bildunterschrift', source: '', height: 200, image: '', fit: 'cover' },
    fields: [
      { key: 'image', label: 'Bild', kind: 'image' },
      { key: 'caption', label: 'Bildunterschrift', kind: 'text' },
      { key: 'source', label: 'Quelle', kind: 'text' },
      { key: 'height', label: 'Höhe in px', kind: 'number', min: 40, max: 900 },
      {
        key: 'fit',
        label: 'Bild einpassen',
        kind: 'seg',
        options: [
          { v: 'cover', l: 'Füllen' },
          { v: 'contain', l: 'Ganz zeigen' },
        ],
      },
    ],
  },
  flow: {
    label: 'Fließschema',
    group: 1,
    span: 12,
    defaults: { steps: 'Schritt 1 | Zusatz\nSchritt 2\nSchritt 3' },
    fields: [{ key: 'steps', label: 'Schritte (Titel | Zusatz, eine Zeile je Schritt)', kind: 'area' }],
  },
  qr: {
    label: 'QR-Code',
    group: 1,
    span: 4,
    defaults: { url: 'https://', caption: 'Scanne den Code.' },
    fields: [
      { key: 'url', label: 'Link (Adresse)', kind: 'text' },
      { key: 'caption', label: 'Beschriftung', kind: 'text' },
    ],
  },
  open: {
    label: 'Offene Frage',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Beschreibe, was du beobachtest.', lines: 3, solution: '', ...TASK_DEFAULTS },
    fields: taskFields([
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'lines', label: 'Anzahl Schreiblinien', kind: 'number', min: 0, max: 20 },
      { key: 'solution', label: 'Lösung / Erwartung (für die Lösungsfassung)', kind: 'area' },
    ]),
  },
  mc: {
    label: 'Ankreuzen',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Kreuze die richtige Antwort an.', options: 'Antwort A\nAntwort B\nAntwort C', ...TASK_DEFAULTS },
    fields: taskFields([
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'options', label: 'Antworten (eine je Zeile, richtige mit * davor)', kind: 'area' },
    ]),
  },
  gap: {
    label: 'Lückentext',
    group: 2,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Ergänze die Lücken.',
      text: 'Der Treibhauseffekt ist ___ und wird durch ___ verstärkt.',
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'text', label: 'Text (___ = Lücke, [[Wort]] = Lücke mit Lösung)', kind: 'area' },
    ]),
  },
  table: {
    label: 'Tabelle',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Trage deine Werte ein.', cols: 'Zeit\nWert A\nWert B', rows: '0 min\n3 min\n6 min', solution: '', ...TASK_DEFAULTS },
    fields: taskFields([
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'cols', label: 'Spalten (eine je Zeile)', kind: 'area' },
      { key: 'rows', label: 'Zeilen (eine je Zeile)', kind: 'area' },
      { key: 'solution', label: 'Lösungen (eine Zeile je Tabellenzeile, Zellen mit | trennen)', kind: 'area' },
    ]),
  },
  match: {
    label: 'Zuordnen',
    group: 2,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Verbinde, was zusammengehört.',
      left: 'Begriff A\nBegriff B\nBegriff C',
      right: 'Erklärung 2\nErklärung 3\nErklärung 1',
      solution: '',
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'left', label: 'Linke Spalte', kind: 'area' },
      { key: 'right', label: 'Rechte Spalte', kind: 'area' },
      { key: 'solution', label: 'Lösung: Nummer der linken Zeile für jede rechte (z. B. 2, 3, 1)', kind: 'text' },
    ]),
  },
  draw: {
    label: 'Zeichenfeld',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Zeichne eine Skizze.', height: 160, pattern: 'leer', ...TASK_DEFAULTS },
    fields: taskFields([
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'height', label: 'Höhe in px', kind: 'number', min: 40, max: 900 },
      {
        key: 'pattern',
        label: 'Hintergrund',
        kind: 'seg',
        options: [
          { v: 'leer', l: 'Leer' },
          { v: 'karo', l: 'Karo' },
          { v: 'linien', l: 'Linien' },
          { v: 'punkte', l: 'Punkte' },
        ],
      },
    ]),
  },
  plan: {
    label: 'Stundenverlauf',
    group: 6,
    span: 12,
    defaults: {
      rows: [
        '0–5 | Abrufphase | 3 Fragen aus dem Gedächtnis ins Lernjournal, dann Selbstkorrektur. | Einzel | Lernjournal',
        '5–10 | Einstieg | Leitfrage: Wie genau erwärmt CO₂ die Luft? | Plenum | Tafel',
        '10–30 | Erarbeitung | Modellversuch in Partnerarbeit, Werte alle 3 Minuten notieren. | Partner | Versuchsprotokoll',
        '30–45 | Sicherung | Fließschema ins Lernjournal, Merksatz. | Einzel | Arbeitsblatt',
      ].join('\n'),
    },
    fields: [{ key: 'rows', label: 'Phasen (je Zeile: Zeit | Phase | Ablauf | Sozialform | Material)', kind: 'area' }],
  },
  goal: {
    label: 'Ziel & Bildungsplan',
    group: 6,
    span: 12,
    defaults: {
      goal: 'Die Klasse erarbeitet den Mechanismus des Treibhauseffekts (Modell + Fließschema).',
      curriculum: '3.2.2.3 (1) · prozessbezogen: Modelle nutzen und kritisch reflektieren.',
    },
    fields: [
      { key: 'goal', label: 'Ziel der Stunde', kind: 'area' },
      { key: 'curriculum', label: 'Bildungsplan', kind: 'area' },
    ],
  },
  expect: {
    label: 'Erwartungshorizont',
    group: 6,
    span: 12,
    defaults: {
      items: [
        'Falsch | „Treibhausgase heizen die Luft direkt auf.“ | Sie erzeugen keine eigene Energie, sie halten Wärmestrahlung zurück.',
        'Vorsicht | „Unser Versuch beweist, dass CO₂ die Erde erwärmt.“ | Der Versuch zeigt nur das Prinzip, nicht dass es speziell CO₂ ist.',
      ].join('\n'),
    },
    fields: [{ key: 'items', label: 'Einträge (je Zeile: Richtig/Falsch/Vorsicht | Schüleraussage | Erklärung)', kind: 'area' }],
  },
  recall: {
    label: 'Abruffragen',
    group: 6,
    span: 12,
    defaults: {
      title: 'Abrufphase — die drei Fragen',
      items: 'Welche Einheit hat der CO₂-Wert in unserer Kurve? | ppm\nReicht ein zeitlicher Zusammenhang als Beweis? | Nein',
      answers: 'immer',
    },
    fields: [
      { key: 'title', label: 'Überschrift', kind: 'text' },
      { key: 'items', label: 'Fragen (je Zeile: Frage | Antwort)', kind: 'area' },
      {
        key: 'answers',
        label: 'Antworten zeigen',
        kind: 'seg',
        options: [
          { v: 'immer', l: 'Immer' },
          { v: 'loesung', l: 'Nur in der Lösungsfassung' },
        ],
      },
    ],
  },
  selfcheck: {
    label: 'Ich kann …',
    group: 5,
    span: 12,
    defaults: {
      title: 'Das kann ich jetzt',
      items: 'Ich kann den Treibhauseffekt mit eigenen Worten erklären.\nIch kann natürlichen und zusätzlichen Treibhauseffekt unterscheiden.',
    },
    fields: [
      { key: 'title', label: 'Überschrift', kind: 'text' },
      { key: 'items', label: 'Aussagen (eine je Zeile)', kind: 'area' },
    ],
  },
  // — Wortschatz & Grammatik —
  vocab: {
    label: 'Vokabelliste',
    group: 3,
    span: 12,
    defaults: {
      title: 'Vocabulary',
      rows: 'house | haʊs | Haus | My house is next to the school.\nfriend | frend | Freund, Freundin | Tom is my best friend.\nto live | lɪv | wohnen, leben | I live in Stuttgart.',
    },
    fields: [
      { key: 'title', label: 'Überschrift', kind: 'text' },
      { key: 'rows', label: 'Wörter (je Zeile: Englisch | Lautschrift | Deutsch | Beispielsatz)', kind: 'ipa' },
    ],
  },
  foldtest: {
    label: 'Knick-Vokabeltest',
    group: 3,
    task: true,
    span: 12,
    defaults: { prompt: 'Fold the page. Write the English words. Then check.', rows: 'Haus | house\nSchule | school\nFreund | friend\nwohnen | to live', mode: 'knick', ...TASK_DEFAULTS },
    fields: taskFields([
      PROMPT,
      { key: 'rows', label: 'Wörter (je Zeile: vorgegeben | gesucht)', kind: 'area' },
      {
        key: 'mode',
        label: 'Art',
        kind: 'seg',
        options: [
          { v: 'knick', l: 'Knicktest (Lösung hinter der Faltlinie)' },
          { v: 'test', l: 'Test (Lösung nur in der Lösungsfassung)' },
        ],
      },
    ]),
  },
  picvocab: {
    label: 'Bild-Vokabeln',
    group: 3,
    task: true,
    span: 12,
    defaults: { prompt: 'Label the pictures.', items: '🐶 | dog\n🐱 | cat\n🐦 | bird\n🐟 | fish', pics: '', cols: 4, height: 90, ...TASK_DEFAULTS },
    fields: taskFields([
      PROMPT,
      { key: 'items', label: 'Bilder (je Zeile: Emoji oder leer | Wort als Lösung)', kind: 'area' },
      { key: 'pics', label: 'Eigene Bilder', kind: 'pics', of: 'items' },
      { key: 'cols', label: 'Bilder je Zeile', kind: 'number', min: 2, max: 6 },
      { key: 'height', label: 'Bildhöhe in px', kind: 'number', min: 40, max: 300 },
    ]),
  },
  wordweb: {
    label: 'Wortnetz',
    group: 3,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Complete the word web.',
      center: 'my family',
      branches: 'people | mum, dad, [[sister]]\nhome | house, garden\nfree time | ___, ___\npets | [[dog]], cat',
      height: 250,
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      PROMPT,
      { key: 'center', label: 'Mitte', kind: 'text' },
      { key: 'branches', label: 'Äste (je Zeile: Oberbegriff | Wort, Wort, [[Lösung]], ___)', kind: 'area' },
      { key: 'height', label: 'Höhe in px', kind: 'number', min: 120, max: 600 },
    ]),
  },
  grammar: {
    label: 'Grammatik-Box',
    group: 3,
    span: 12,
    defaults: {
      title: 'Simple present',
      rule: 'Bei he / she / it hängst du ein -s an das Verb.',
      signal: 'always, usually, often, sometimes, never, every day',
      examples: 'I play football.\nShe play{{s}} football.\nHe watch{{es}} TV every day.',
      variant: 'accent-3',
    },
    fields: [
      { key: 'title', label: 'Thema', kind: 'text' },
      { key: 'rule', label: 'Regel ({{…}} = farbig markiert)', kind: 'area' },
      { key: 'signal', label: 'Signalwörter (mit Komma getrennt)', kind: 'text' },
      { key: 'examples', label: 'Beispielsätze (einer je Zeile; {{s}} markiert die Endung)', kind: 'area' },
      { key: 'variant', label: 'Farbe', kind: 'variant' },
    ],
  },
  forms: {
    label: 'Formentabelle',
    group: 3,
    span: 12,
    defaults: { ...FORM_PRESETS[0].props, variant: 'accent-3' },
    fields: [
      { key: 'preset', label: 'Vorlage', kind: 'preset', presets: FORM_PRESETS },
      { key: 'title', label: 'Überschrift', kind: 'text' },
      { key: 'cols', label: 'Spaltenköpfe (einer je Zeile)', kind: 'area' },
      { key: 'rows', label: 'Zeilen (Zellen mit | trennen; {{…}} markiert, [[…]] ist eine Lücke mit Lösung)', kind: 'area' },
      { key: 'variant', label: 'Farbe', kind: 'variant' },
    ],
  },
  jumble: {
    label: 'Wörter ordnen',
    group: 3,
    task: true,
    span: 12,
    defaults: { prompt: 'Put the words in the right order.', items: 'I go to school by bus.\nMy sister likes pizza.\nfriend / is / best / my / Tom = Tom is my best friend.', ...TASK_DEFAULTS },
    fields: taskFields([PROMPT, { key: 'items', label: 'Sätze (je Zeile der richtige Satz; oder „Teil / Teil / Teil = Lösung“)', kind: 'area' }]),
  },
  transform: {
    label: 'Umformen',
    group: 3,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Make the sentences negative or ask questions.',
      items: "She plays football. | negative | She doesn't play football.\nThey like tea. | question | Do they like tea?\nHe is at home. | negative | He isn't at home.",
      ...TASK_DEFAULTS,
    },
    fields: taskFields([PROMPT, { key: 'items', label: 'Sätze (je Zeile: Ausgangssatz | Zielform | Lösung)', kind: 'area' }]),
  },
  syntax: {
    label: 'Satzbaustellen',
    group: 3,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Write the sentences in the table.',
      cols: 'subject\nverb\nobject\nplace\ntime',
      rows: 'I | play | football | in the park | on Sundays.\n[[My sister]] | [[reads]] | [[books]] | [[in her room]] | [[every evening]].\n | | | | ',
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      PROMPT,
      { key: 'cols', label: 'Spalten (eine je Zeile, z. B. subject, verb, object, place, time)', kind: 'area' },
      { key: 'rows', label: 'Sätze (Teile mit | trennen; leer = Lücke, [[…]] = Lücke mit Lösung)', kind: 'area' },
    ]),
  },
  // — Hören, Sprechen, Lesen, Schreiben —
  listening: {
    label: 'Hörverstehen',
    group: 4,
    span: 12,
    defaults: { stage: 'while', track: 'Audio 1/12', note: 'Listen to the dialogue twice.', url: '', transcript: '' },
    fields: [
      {
        key: 'stage',
        label: 'Phase',
        kind: 'seg',
        options: [
          { v: '', l: '–' },
          { v: 'pre', l: 'Pre-listening' },
          { v: 'while', l: 'While-listening' },
          { v: 'post', l: 'Post-listening' },
        ],
      },
      { key: 'track', label: 'Track im Lehrwerk (z. B. Audio 1/12)', kind: 'text' },
      { key: 'note', label: 'Hinweis für die Klasse', kind: 'area' },
      { key: 'url', label: 'Link zur Audiodatei (wird als QR-Code gedruckt)', kind: 'text' },
      { key: 'transcript', label: 'Transkript (nur in der Lösungsfassung)', kind: 'area' },
    ],
  },
  reading: {
    label: 'Lesetext',
    group: 4,
    span: 12,
    defaults: {
      title: 'A new school',
      text: 'Hi, I’m Emma and I’m eleven. Today is my first day at Hillside School in Bristol. I’m a bit nervous. My mum takes me to school by car. At the gate I meet Ben. He’s in my class and he’s very friendly. We have got English first. Our teacher is Mr Clark. He’s funny and the lesson is great. At break Ben shows me the canteen. In the afternoon we have got PE. I love sports, so that’s my favourite lesson!',
      glossary: 'nervous | aufgeregt, nervös\ngate | Tor\ncanteen | Kantine, Mensa',
      numbers: 5,
    },
    fields: [
      { key: 'title', label: 'Überschrift', kind: 'text' },
      { key: 'text', label: 'Text (Absätze ohne Leerzeile)', kind: 'area' },
      { key: 'glossary', label: 'Worterklärungen (je Zeile: Wort | Erklärung; die Zeile im Text wird ergänzt)', kind: 'area' },
      { key: 'numbers', label: 'Zeilennummern alle … Zeilen (0 = keine)', kind: 'number', min: 0, max: 10 },
    ],
  },
  truefalse: {
    label: 'Richtig / Falsch',
    group: 4,
    task: true,
    span: 12,
    defaults: {
      prompt: 'True, false or not in the text? Tick.',
      items: 'Emma is eleven. | T\nEmma goes to school by bus. | F\nBen has got a sister. | NG\nEmma likes PE. | T',
      mode: 'tfn',
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      PROMPT,
      { key: 'items', label: 'Aussagen (je Zeile: Aussage | T, F oder NG als Lösung)', kind: 'area' },
      {
        key: 'mode',
        label: 'Spalten',
        kind: 'seg',
        options: [
          { v: 'tf', l: 'true · false' },
          { v: 'tfn', l: 'true · false · not in the text' },
        ],
      },
    ]),
  },
  phrases: {
    label: 'Redemittel',
    group: 4,
    span: 12,
    defaults: {
      title: 'Useful phrases',
      items: 'Can you help me, please? | Kannst du mir bitte helfen?\nHow do you say … in English? | Wie sagt man … auf Englisch?\nCan you say that again, please? | Kannst du das bitte wiederholen?',
      variant: 'accent-6',
    },
    fields: [
      { key: 'title', label: 'Überschrift', kind: 'text' },
      { key: 'items', label: 'Redemittel (je Zeile: Englisch | Deutsch)', kind: 'area' },
      { key: 'variant', label: 'Farbe', kind: 'variant' },
    ],
  },
  rolecards: {
    label: 'Rollenkarten',
    group: 4,
    span: 12,
    defaults: {
      titleA: 'Partner A',
      textA: 'You are at the tourist information in London.\nAsk: When does the museum open?\nAsk: How much is a ticket?',
      titleB: 'Partner B',
      textB: 'You work at the tourist information.\nThe museum opens at 10 am.\nA ticket is £8.',
    },
    fields: [
      { key: 'titleA', label: 'Karte A: Titel', kind: 'text' },
      { key: 'textA', label: 'Karte A: Text (___ = Lücke für das Information Gap)', kind: 'area' },
      { key: 'titleB', label: 'Karte B: Titel', kind: 'text' },
      { key: 'textB', label: 'Karte B: Text', kind: 'area' },
    ],
  },
  bingo: {
    label: 'Bingo / Find someone who',
    group: 4,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Walk around and ask. Write the names.',
      mode: 'find',
      items: 'has got a pet\nlikes pizza\ncan swim\nplays football\nhas got a sister\nloves maths',
      cols: 3,
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      PROMPT,
      {
        key: 'mode',
        label: 'Art',
        kind: 'seg',
        options: [
          { v: 'find', l: 'Find someone who …' },
          { v: 'bingo', l: 'Bingo' },
        ],
      },
      { key: 'items', label: 'Felder (eins je Zeile)', kind: 'area' },
      { key: 'cols', label: 'Spalten', kind: 'number', min: 2, max: 5 },
    ]),
  },
  writing: {
    label: 'Schreibrahmen',
    group: 4,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Write about your family.',
      starters: 'My name is …\nI live in …\nIn my family there are …\nMy favourite …',
      lines: 1,
      checklist: 'I have written at least five sentences.\nI have used and / but / because.\nI have checked my spelling.',
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      PROMPT,
      { key: 'starters', label: 'Satzanfänge (einer je Zeile)', kind: 'area' },
      { key: 'lines', label: 'Schreiblinien je Satzanfang', kind: 'number', min: 1, max: 6 },
      { key: 'checklist', label: 'Checkliste für den eigenen Text (eine Aussage je Zeile)', kind: 'area' },
    ]),
  },
  mediation: {
    label: 'Sprachmittlung',
    group: 4,
    task: true,
    span: 12,
    defaults: {
      prompt: 'Your English friend Tom is visiting you. He wants to know what the sign says. Tell him in English.',
      source: 'Liebe Badegäste! Das Hallenbad ist am Montag wegen Reinigungsarbeiten geschlossen. Kinder unter 10 Jahren nur in Begleitung eines Erwachsenen.',
      lines: 4,
      solution: 'The swimming pool is closed on Monday because they are cleaning it. Children under 10 must come with an adult.',
      ...TASK_DEFAULTS,
    },
    fields: taskFields([
      PROMPT,
      { key: 'source', label: 'Deutsche Vorlage', kind: 'area' },
      { key: 'lines', label: 'Schreiblinien', kind: 'number', min: 0, max: 20 },
      { key: 'solution', label: 'Lösung / Erwartung (für die Lösungsfassung)', kind: 'area' },
    ]),
  },
  // — Test & Differenzierung —
  gradescale: {
    label: 'Notenschlüssel',
    group: 5,
    span: 12,
    defaults: { thresholds: '92 | 81 | 67 | 50 | 30', half: 'ja' },
    fields: [
      { key: 'thresholds', label: 'Mindestprozent für die Noten 1 | 2 | 3 | 4 | 5', kind: 'text' },
      {
        key: 'half',
        label: 'Halbe Punkte',
        kind: 'seg',
        options: [
          { v: 'ja', l: 'Ja' },
          { v: 'nein', l: 'Nein' },
        ],
      },
    ],
  },
  tipcards: {
    label: 'Tippkarten',
    group: 5,
    span: 12,
    defaults: { cols: 2 },
    fields: [{ key: 'cols', label: 'Karten nebeneinander', kind: 'number', min: 1, max: 3 }],
  },
};

export const BLOCK_ORDER = Object.keys(BLOCK_TYPES) as BlockType[];

export function isBlockType(x: unknown): x is BlockType {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(BLOCK_TYPES, x);
}

export const GROUPS = [
  { label: 'Text & Struktur', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-800)' },
  { label: 'Grafik & Abbildung', bg: 'var(--color-accent-2-100)', fg: 'var(--color-accent-2-800)' },
  { label: 'Aufgaben', bg: 'var(--color-accent-100)', fg: 'var(--color-accent-800)' },
  { label: 'Wortschatz & Grammatik', bg: 'var(--color-accent-5-100)', fg: 'var(--color-accent-5-800)', lang: true },
  { label: 'Hören, Sprechen, Lesen, Schreiben', bg: 'var(--color-accent-3-100)', fg: 'var(--color-accent-3-800)', lang: true },
  { label: 'Test & Differenzierung', bg: 'var(--color-accent-7-100)', fg: 'var(--color-accent-7-800)' },
  { label: 'Für die Lehrkraft', bg: 'var(--color-neutral-800)', fg: 'var(--color-neutral-100)' },
] as const;

export const SPAN_OPTIONS: SegOption<number>[] = [
  { v: 12, l: 'Ganz' },
  { v: 8, l: '⅔' },
  { v: 6, l: '½' },
  { v: 4, l: '⅓' },
];
