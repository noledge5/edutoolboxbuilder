import type { SegOption } from './blockTypes';
import type { SheetType, Variant, WorkForm } from './types';

/** Colours of a sheet type: header band, icon circle, type pill, kicker text and task-number circle. */
export interface SheetTheme {
  label: string;
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
    band: 'var(--color-neutral-200)',
    circle: 'var(--color-neutral-800)',
    circleFg: 'var(--color-neutral-100)',
    pill: 'var(--color-neutral-800)',
    pillFg: 'var(--color-neutral-100)',
    kicker: 'var(--color-neutral-700)',
    num: 'var(--color-neutral-800)',
    numFg: 'var(--color-neutral-100)',
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
};

export const VARIANT_OPTIONS: SegOption<Variant>[] = [
  { v: 'accent-2', l: 'Salbei' },
  { v: 'accent', l: 'Terrakotta' },
  { v: 'neutral', l: 'Neutral' },
];

/** Background / secondary-text colour pairs the flow-diagram steps cycle through. */
export const FLOW_COLORS: [string, string][] = [
  ['var(--color-accent-200)', 'var(--color-accent-800)'],
  ['var(--color-accent-2-200)', 'var(--color-accent-2-800)'],
  ['var(--color-accent-300)', 'var(--color-accent-800)'],
  ['var(--color-neutral-300)', 'var(--color-neutral-800)'],
];

export const WORK_FORMS: WorkForm[] = ['allein', 'zu zweit', 'Gruppe', 'Plenum'];
