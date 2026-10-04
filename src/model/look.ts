// Subject designs (Fachdesigns, after docs/design/fachdesigns/): a colour palette, shapes, motifs and a heading font per
// subject and age group, laid over the "Organisch" sheet and slides by CSS classes (src/sheet/fachdesigns.css).
// The module chooses; by default the subject decides and the grade gives the age group.
import type { SheetType, Variant } from './types';

export type Fach = 'geo' | 'eng' | 'inf';
export type EngVariant = 'bubble' | 'sticker' | 'comic';
/** Heading font: suggestion A, B, or Caprasimo as in "Organisch". */
export type HeadFont = 'a' | 'b' | 'o';

/** What a document is drawn with (absent: "Organisch"). */
export interface Look {
  fach: Fach;
  /** 1: grades 5–6, 2: grades 7–10. */
  age: 1 | 2;
  variant: EngVariant;
  head: HeadFont;
}

/** The module's choice: `auto` follows the subject. */
export interface ModuleLook {
  theme: 'auto' | 'organisch' | Fach;
  variant: EngVariant;
  head: HeadFont;
}

export const DEFAULT_MODULE_LOOK: ModuleLook = { theme: 'auto', variant: 'bubble', head: 'a' };

export const FACH_LABELS: Record<Fach, string> = { geo: 'Geographie', eng: 'Englisch', inf: 'Informatik' };

/** Name of each design, by subject and age group. */
export const LOOK_NAMES: Record<Fach, [string, string]> = {
  geo: ['Entdecker', 'Atlas'],
  eng: ['Sprechblase', 'Notizbuch'],
  inf: ['Bausteine', 'Terminal'],
};

export const ENG_VARIANTS: { v: EngVariant; l: string }[] = [
  { v: 'bubble', l: 'Sprechblase' },
  { v: 'sticker', l: 'Sticker' },
  { v: 'comic', l: 'Comic' },
];

/** The two heading-font suggestions of each design (key: fach-age, or eng-1-<variant>). */
export const HEAD_FONTS: Record<string, [string, string]> = {
  'geo-1': ['Baloo 2', 'Nunito'],
  'geo-2': ['Archivo', 'IBM Plex Sans Condensed'],
  'eng-1-bubble': ['Sniglet', 'Patrick Hand'],
  'eng-1-sticker': ['Rubik', 'Lilita One'],
  'eng-1-comic': ['Bangers', 'Luckiest Guy'],
  'eng-2': ['DM Serif Display', 'Bricolage Grotesque'],
  'inf-1': ['Fredoka', 'Lilita One'],
  'inf-2': ['JetBrains Mono', 'Space Grotesk'],
};

export const lookKey = (l: Pick<Look, 'fach' | 'age' | 'variant'>) => `${l.fach}-${l.age}${l.fach === 'eng' && l.age === 1 ? `-${l.variant}` : ''}`;

export const lookName = (l: Look) => (l.fach === 'eng' && l.age === 1 ? ENG_VARIANTS.find((v) => v.v === l.variant)!.l : LOOK_NAMES[l.fach][l.age - 1]);

/** The subject's own design, if it has one. */
export function fachOf(subject: string): Fach | null {
  if (/geo|erdkunde/i.test(subject)) return 'geo';
  if (/englisch|english/i.test(subject)) return 'eng';
  if (/informatik|imp\b|medienbildung|computer/i.test(subject)) return 'inf';
  return null;
}

export const ageOf = (grade: number): 1 | 2 => (grade <= 6 ? 1 : 2);

/** The look of a module's sheets and slides; null for "Organisch". */
export function lookFor(m: { subject: string; grade: number; look?: ModuleLook }): Look | null {
  const ml = m.look ?? DEFAULT_MODULE_LOOK;
  const fach = ml.theme === 'auto' ? fachOf(m.subject) : ml.theme === 'organisch' ? null : ml.theme;
  return fach ? { fach, age: ageOf(m.grade), variant: ml.variant, head: ml.head } : null;
}

/** CSS classes for a page or slide root. */
export const lookClasses = (l: Look | null | undefined): string =>
  l ? ` is-fd is-f-${l.fach} is-age-${l.age}${l.fach === 'eng' && l.age === 1 ? ` is-x-${l.variant}` : ''}${l.head === 'o' ? '' : ` is-fh-${l.head}`}` : '';

/** Hinweis and Merksatz colours in a subject design: the subject's colour, its partner, neutral or the third. */
export function variantClass(v: Variant | string): string {
  if (v === 'accent') return 'is-v-p';
  if (v === 'accent-2') return 'is-v-s';
  if (v === 'neutral') return 'is-v-n';
  return 'is-v-t';
}

/** The sheet type's class in a subject design (its colours come from the palette, not inline). */
const TYPE_CLASS: Record<SheetType, string> = {
  uebung: 'uebung',
  versuch: 'versuch',
  sicherung: 'sicherung',
  lehrkraft: 'lehrkraft',
  vocab: 'wortschatz',
  grammar: 'grammatik',
  listening: 'hoeren',
  speaking: 'sprechen',
  test: 'test',
};
export const typeClass = (t: SheetType) => ` is-t-${TYPE_CLASS[t] ?? 'uebung'}`;

const FACHE: Fach[] = ['geo', 'eng', 'inf'];
const VARIANTS: EngVariant[] = ['bubble', 'sticker', 'comic'];

/** Reads a stored module look (lenient; unknown values fall back to the default). */
export function readModuleLook(x: unknown): ModuleLook | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const r = x as Partial<ModuleLook>;
  const theme = r.theme === 'organisch' || FACHE.includes(r.theme as Fach) ? (r.theme as ModuleLook['theme']) : 'auto';
  return {
    theme,
    variant: VARIANTS.includes(r.variant as EngVariant) ? (r.variant as EngVariant) : 'bubble',
    head: r.head === 'b' || r.head === 'o' ? r.head : 'a',
  };
}

/** Reads a document's look (from JSON). */
export function readLook(x: unknown): Look | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const r = x as Partial<Look>;
  if (!FACHE.includes(r.fach as Fach)) return undefined;
  return { fach: r.fach as Fach, age: r.age === 1 ? 1 : 2, variant: VARIANTS.includes(r.variant as EngVariant) ? (r.variant as EngVariant) : 'bubble', head: r.head === 'b' || r.head === 'o' ? r.head : 'a' };
}
