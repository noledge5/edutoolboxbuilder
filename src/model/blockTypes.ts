import type { BlockProps, BlockType } from './types';

export interface SegOption<V extends string | number | boolean = string | number | boolean> {
  v: V;
  l: string;
}

export type FieldDef =
  | { key: string; label: string; kind: 'text' | 'area' | 'variant' | 'image' | 'competence' }
  | { key: string; label: string; kind: 'number'; min: number; max: number }
  | { key: string; label: string; kind: 'seg'; options: SegOption<string>[] };

export interface BlockTypeDef {
  label: string;
  /** Index into GROUPS. */
  group: 0 | 1 | 2 | 3;
  span: number;
  /** Tasks are numbered automatically per page. */
  task?: boolean;
  defaults: BlockProps;
  fields: FieldDef[];
}

/** Differentiation fields every task has: level stars and points. */
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
  { key: 'competence', label: 'Kompetenz aus dem Kompetenzraster', kind: 'competence' },
];
const TASK_DEFAULTS = { level: '', points: 0, competence: '' };

/** Level stars as Niveau of the Bildungsplan: ★ = G, ★★ = M, ★★★ = E. */
export const LEVEL_NAMES: Record<string, string> = { '1': 'G', '2': 'M', '3': 'E' };

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
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'lines', label: 'Anzahl Schreiblinien', kind: 'number', min: 0, max: 20 },
      { key: 'solution', label: 'Lösung / Erwartung (für die Lösungsfassung)', kind: 'area' },
      ...TASK_FIELDS,
    ],
  },
  mc: {
    label: 'Ankreuzen',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Kreuze die richtige Antwort an.', options: 'Antwort A\nAntwort B\nAntwort C', ...TASK_DEFAULTS },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'options', label: 'Antworten (eine je Zeile, richtige mit * davor)', kind: 'area' },
      ...TASK_FIELDS,
    ],
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
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'text', label: 'Text (___ = Lücke, [[Wort]] = Lücke mit Lösung)', kind: 'area' },
      ...TASK_FIELDS,
    ],
  },
  table: {
    label: 'Tabelle',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Trage deine Werte ein.', cols: 'Zeit\nWert A\nWert B', rows: '0 min\n3 min\n6 min', solution: '', ...TASK_DEFAULTS },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'cols', label: 'Spalten (eine je Zeile)', kind: 'area' },
      { key: 'rows', label: 'Zeilen (eine je Zeile)', kind: 'area' },
      { key: 'solution', label: 'Lösungen (eine Zeile je Tabellenzeile, Zellen mit | trennen)', kind: 'area' },
      ...TASK_FIELDS,
    ],
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
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'left', label: 'Linke Spalte', kind: 'area' },
      { key: 'right', label: 'Rechte Spalte', kind: 'area' },
      { key: 'solution', label: 'Lösung: Nummer der linken Zeile für jede rechte (z. B. 2, 3, 1)', kind: 'text' },
      ...TASK_FIELDS,
    ],
  },
  draw: {
    label: 'Zeichenfeld',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Zeichne eine Skizze.', height: 160, pattern: 'leer', ...TASK_DEFAULTS },
    fields: [
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
      ...TASK_FIELDS,
    ],
  },
  plan: {
    label: 'Stundenverlauf',
    group: 3,
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
    group: 3,
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
    group: 3,
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
    group: 3,
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
    group: 2,
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
};

export const BLOCK_ORDER = Object.keys(BLOCK_TYPES) as BlockType[];

export function isBlockType(x: unknown): x is BlockType {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(BLOCK_TYPES, x);
}

export const GROUPS = [
  { label: 'Text & Struktur', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-800)' },
  { label: 'Grafik & Abbildung', bg: 'var(--color-accent-2-100)', fg: 'var(--color-accent-2-800)' },
  { label: 'Aufgaben', bg: 'var(--color-accent-100)', fg: 'var(--color-accent-800)' },
  { label: 'Für die Lehrkraft', bg: 'var(--color-neutral-800)', fg: 'var(--color-neutral-100)' },
] as const;

export const SPAN_OPTIONS: SegOption<number>[] = [
  { v: 12, l: 'Ganz' },
  { v: 8, l: '⅔' },
  { v: 6, l: '½' },
  { v: 4, l: '⅓' },
];
