import type { BlockProps, BlockType } from './types';

export interface SegOption<V extends string | number | boolean = string | number | boolean> {
  v: V;
  l: string;
}

export type FieldDef =
  | { key: string; label: string; kind: 'text' | 'area' | 'variant' | 'image' }
  | { key: string; label: string; kind: 'number'; min: number; max: number }
  | { key: string; label: string; kind: 'seg'; options: SegOption<string>[] };

export interface BlockTypeDef {
  label: string;
  /** Index into GROUPS. */
  group: 0 | 1 | 2;
  span: number;
  /** Tasks are numbered automatically per page. */
  task?: boolean;
  defaults: BlockProps;
  fields: FieldDef[];
}

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
      { key: 'text', label: 'Text (___ = Lücke)', kind: 'area' },
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
    defaults: { caption: 'Abb. 1: Bildunterschrift', height: 200, image: '', fit: 'cover' },
    fields: [
      { key: 'image', label: 'Bild', kind: 'image' },
      { key: 'caption', label: 'Bildunterschrift', kind: 'text' },
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
  open: {
    label: 'Offene Frage',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Beschreibe, was du beobachtest.', lines: 3 },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'lines', label: 'Anzahl Schreiblinien', kind: 'number', min: 0, max: 20 },
    ],
  },
  mc: {
    label: 'Ankreuzen',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Kreuze die richtige Antwort an.', options: 'Antwort A\nAntwort B\nAntwort C' },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'options', label: 'Antworten (eine je Zeile)', kind: 'area' },
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
    },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'text', label: 'Text (___ = Lücke)', kind: 'area' },
    ],
  },
  table: {
    label: 'Tabelle',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Trage deine Werte ein.', cols: 'Zeit\nWert A\nWert B', rows: '0 min\n3 min\n6 min' },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'cols', label: 'Spalten (eine je Zeile)', kind: 'area' },
      { key: 'rows', label: 'Zeilen (eine je Zeile)', kind: 'area' },
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
    },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'left', label: 'Linke Spalte', kind: 'area' },
      { key: 'right', label: 'Rechte Spalte', kind: 'area' },
    ],
  },
  draw: {
    label: 'Zeichenfeld',
    group: 2,
    task: true,
    span: 12,
    defaults: { prompt: 'Zeichne eine Skizze.', height: 160 },
    fields: [
      { key: 'prompt', label: 'Aufgabe', kind: 'area' },
      { key: 'height', label: 'Höhe in px', kind: 'number', min: 40, max: 900 },
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
] as const;

export const SPAN_OPTIONS: SegOption<number>[] = [
  { v: 12, l: 'Ganz' },
  { v: 8, l: '⅔' },
  { v: 6, l: '½' },
  { v: 4, l: '⅓' },
];
