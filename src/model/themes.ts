import type { SegOption } from './blockTypes';
import type { SheetType, Variant, WorkForm } from './types';

/** Colours of a sheet type: header band, icon circle, type pill, kicker text and task-number circle. */
export interface SheetTheme {
  label: string;
  /** Label on English worksheets. */
  labelEn: string;
  band: string;
  circle: string;
  circleFg: string;
  pill: string;
  pillFg: string;
  kicker: string;
  num: string;
  numFg: string;
}

export const THEMES: Record<SheetType, SheetTheme> = {
  uebung: {
    label: 'Übung',
    labelEn: 'Practice',
    band: 'var(--color-surface)',
    circle: 'var(--color-accent-700)',
    circleFg: 'var(--color-accent-100)',
    pill: 'var(--color-accent-800)',
    pillFg: 'var(--color-accent-100)',
    kicker: 'var(--color-accent-800)',
    num: 'var(--color-accent-700)',
    numFg: 'var(--color-accent-100)',
  },
  versuch: {
    label: 'Versuch',
    labelEn: 'Experiment',
    band: 'var(--color-accent-100)',
    circle: 'var(--color-accent)',
    circleFg: 'var(--color-accent-100)',
    pill: 'var(--color-accent-700)',
    pillFg: 'var(--color-accent-100)',
    kicker: 'var(--color-accent-700)',
    num: 'var(--color-accent)',
    numFg: 'var(--color-accent-100)',
  },
  sicherung: {
    label: 'Sicherung',
    labelEn: 'Summary',
    band: 'var(--color-accent-2-100)',
    circle: 'var(--color-accent-2-600)',
    circleFg: 'var(--color-accent-2-100)',
    pill: 'var(--color-accent-2-700)',
    pillFg: 'var(--color-accent-2-100)',
    kicker: 'var(--color-accent-2-800)',
    num: 'var(--color-accent-2-600)',
    numFg: 'var(--color-accent-2-100)',
  },
  lehrkraft: {
    label: 'Für die Lehrkraft',
    labelEn: 'Für die Lehrkraft',
    band: 'var(--color-neutral-200)',
    circle: 'var(--color-neutral-800)',
    circleFg: 'var(--color-neutral-100)',
    pill: 'var(--color-neutral-800)',
    pillFg: 'var(--color-neutral-100)',
    kicker: 'var(--color-neutral-700)',
    num: 'var(--color-neutral-800)',
    numFg: 'var(--color-neutral-100)',
  },
  // Sheet types for language lessons, each with its own colour ramp.
  vocab: {
    label: 'Wortschatz',
    labelEn: 'Vocabulary',
    band: 'var(--color-accent-5-100)',
    circle: 'var(--color-accent-5-600)',
    circleFg: 'var(--color-accent-5-100)',
    pill: 'var(--color-accent-5-700)',
    pillFg: 'var(--color-accent-5-100)',
    kicker: 'var(--color-accent-5-800)',
    num: 'var(--color-accent-5-600)',
    numFg: 'var(--color-accent-5-100)',
  },
  grammar: {
    label: 'Grammatik',
    labelEn: 'Grammar',
    band: 'var(--color-accent-3-100)',
    circle: 'var(--color-accent-3-600)',
    circleFg: 'var(--color-accent-3-100)',
    pill: 'var(--color-accent-3-700)',
    pillFg: 'var(--color-accent-3-100)',
    kicker: 'var(--color-accent-3-800)',
    num: 'var(--color-accent-3-600)',
    numFg: 'var(--color-accent-3-100)',
  },
  listening: {
    label: 'Hören',
    labelEn: 'Listening',
    band: 'var(--color-accent-4-100)',
    circle: 'var(--color-accent-4-600)',
    circleFg: 'var(--color-accent-4-100)',
    pill: 'var(--color-accent-4-700)',
    pillFg: 'var(--color-accent-4-100)',
    kicker: 'var(--color-accent-4-800)',
    num: 'var(--color-accent-4-600)',
    numFg: 'var(--color-accent-4-100)',
  },
  speaking: {
    label: 'Sprechen',
    labelEn: 'Speaking',
    band: 'var(--color-accent-6-100)',
    circle: 'var(--color-accent-6-600)',
    circleFg: 'var(--color-accent-6-100)',
    pill: 'var(--color-accent-6-700)',
    pillFg: 'var(--color-accent-6-100)',
    kicker: 'var(--color-accent-6-800)',
    num: 'var(--color-accent-6-600)',
    numFg: 'var(--color-accent-6-100)',
  },
  test: {
    label: 'Test',
    labelEn: 'Test',
    band: 'var(--color-accent-7-100)',
    circle: 'var(--color-accent-7-600)',
    circleFg: 'var(--color-accent-7-100)',
    pill: 'var(--color-accent-7-700)',
    pillFg: 'var(--color-accent-7-100)',
    kicker: 'var(--color-accent-7-800)',
    num: 'var(--color-accent-7-600)',
    numFg: 'var(--color-accent-7-100)',
  },
};

export const SHEET_TYPES = Object.keys(THEMES) as SheetType[];

/** Colours of the hint box and the Merksatz: tinted (bg/circle/title) and solid variants. */
export interface VariantColors {
  bg: string;
  circle: string;
  circleFg: string;
  title: string;
  solid: string;
  solidFg: string;
}

export const VARIANTS: Record<Variant, VariantColors> = {
  'accent-2': {
    bg: 'var(--color-accent-2-100)',
    circle: 'var(--color-accent-2-600)',
    circleFg: 'var(--color-accent-2-100)',
    title: 'var(--color-accent-2-800)',
    solid: 'var(--color-accent-2-600)',
    solidFg: 'var(--color-accent-2-100)',
  },
  accent: {
    bg: 'var(--color-accent-100)',
    circle: 'var(--color-accent)',
    circleFg: 'var(--color-accent-100)',
    title: 'var(--color-accent-800)',
    solid: 'var(--color-accent-700)',
    solidFg: 'var(--color-accent-100)',
  },
  neutral: {
    bg: 'var(--color-neutral-200)',
    circle: 'var(--color-neutral-800)',
    circleFg: 'var(--color-neutral-100)',
    title: 'var(--color-neutral-800)',
    solid: 'var(--color-neutral-800)',
    solidFg: 'var(--color-neutral-100)',
  },
  'accent-3': {
    bg: 'var(--color-accent-3-100)',
    circle: 'var(--color-accent-3-600)',
    circleFg: 'var(--color-accent-3-100)',
    title: 'var(--color-accent-3-800)',
    solid: 'var(--color-accent-3-600)',
    solidFg: 'var(--color-accent-3-100)',
  },
  'accent-4': {
    bg: 'var(--color-accent-4-100)',
    circle: 'var(--color-accent-4-600)',
    circleFg: 'var(--color-accent-4-100)',
    title: 'var(--color-accent-4-800)',
    solid: 'var(--color-accent-4-600)',
    solidFg: 'var(--color-accent-4-100)',
  },
  'accent-5': {
    bg: 'var(--color-accent-5-100)',
    circle: 'var(--color-accent-5-600)',
    circleFg: 'var(--color-accent-5-100)',
    title: 'var(--color-accent-5-800)',
    solid: 'var(--color-accent-5-600)',
    solidFg: 'var(--color-accent-5-100)',
  },
  'accent-6': {
    bg: 'var(--color-accent-6-100)',
    circle: 'var(--color-accent-6-600)',
    circleFg: 'var(--color-accent-6-100)',
    title: 'var(--color-accent-6-800)',
    solid: 'var(--color-accent-6-600)',
    solidFg: 'var(--color-accent-6-100)',
  },
  'accent-7': {
    bg: 'var(--color-accent-7-100)',
    circle: 'var(--color-accent-7-600)',
    circleFg: 'var(--color-accent-7-100)',
    title: 'var(--color-accent-7-800)',
    solid: 'var(--color-accent-7-600)',
    solidFg: 'var(--color-accent-7-100)',
  },
};

export const VARIANT_OPTIONS: SegOption<Variant>[] = [
  { v: 'accent-2', l: 'Salbei' },
  { v: 'accent', l: 'Terrakotta' },
  { v: 'neutral', l: 'Neutral' },
  { v: 'accent-3', l: 'Blau' },
  { v: 'accent-4', l: 'Pflaume' },
  { v: 'accent-5', l: 'Ocker' },
  { v: 'accent-6', l: 'Petrol' },
  { v: 'accent-7', l: 'Rosé' },
];

/** Background / secondary-text colour pairs the flow-diagram steps cycle through. */
export const FLOW_COLORS: [string, string][] = [
  ['var(--color-accent-200)', 'var(--color-accent-800)'],
  ['var(--color-accent-2-200)', 'var(--color-accent-2-800)'],
  ['var(--color-accent-300)', 'var(--color-accent-800)'],
  ['var(--color-neutral-300)', 'var(--color-neutral-800)'],
];

export const WORK_FORMS: WorkForm[] = ['allein', 'zu zweit', 'Gruppe', 'Plenum'];

/** The work form as printed on English worksheets. */
export const WORK_FORMS_EN: Record<WorkForm, string> = { allein: 'on your own', 'zu zweit': 'in pairs', Gruppe: 'in groups', Plenum: 'whole class' };
