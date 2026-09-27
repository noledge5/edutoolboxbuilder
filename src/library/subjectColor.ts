// Every subject has its own colour in the app (buttons, icons, chosen chips), so Englisch and Geographie
// are told apart at a glance. The printed page keeps the design's orange. The colour is one of the
// token ramps; the teacher can change it in the settings.
import type { CSSProperties } from 'react';
import type { Settings } from './types';

export const SUBJECT_COLORS = [
  { key: 'accent', label: 'Orange' },
  { key: 'accent-2', label: 'Grün' },
  { key: 'accent-3', label: 'Blau' },
  { key: 'accent-4', label: 'Lila' },
  { key: 'accent-5', label: 'Ocker' },
  { key: 'accent-6', label: 'Türkis' },
  { key: 'accent-7', label: 'Rosa' },
] as const;

export type SubjectColor = (typeof SUBJECT_COLORS)[number]['key'];

const isColor = (x: unknown): x is SubjectColor => SUBJECT_COLORS.some((c) => c.key === x);

/** Colours for common subjects at a Realschule in Baden-Württemberg. */
const KNOWN: [RegExp, SubjectColor][] = [
  [/englisch|english|französisch|franz|spanisch|latein/i, 'accent-3'],
  [/geo|erdkunde/i, 'accent-2'],
  [/bio|nwa|naturwissen|naturphänomene/i, 'accent-6'],
  [/mathe|informatik|imp/i, 'accent-4'],
  [/deutsch/i, 'accent-7'],
  [/geschichte|gemeinschaft|wbs|wirtschaft|ethik|religion/i, 'accent-5'],
  [/physik|chemie|technik|aes|kunst|musik|sport/i, 'accent'],
];

/** The subject's colour: chosen in the settings, else a fitting default, else one from its name. */
export function subjectColor(settings: Settings, subject: string): SubjectColor {
  const chosen = settings.subjectColors[subject];
  if (isColor(chosen)) return chosen;
  const known = KNOWN.find(([re]) => re.test(subject));
  if (known) return known[1];
  let h = 0;
  for (const ch of subject) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length].key;
}

/** CSS variables that give everything inside the subject's colour (the printed page resets them). */
export function subjectVars(color: SubjectColor): CSSProperties {
  if (color === 'accent') return {};
  const ramp = `--color-${color}`;
  const vars: Record<string, string> = { '--color-accent': color === 'accent-2' ? `var(${ramp})` : `var(${ramp}-600)` };
  for (const step of [100, 200, 300, 400, 500, 600, 700, 800, 900]) vars[`--color-accent-${step}`] = `var(${ramp}-${step})`;
  return vars as CSSProperties;
}

/** The colour itself, for a swatch or a dot next to the subject's name. */
export const swatch = (color: SubjectColor) => (color === 'accent' ? 'var(--color-accent-1)' : color === 'accent-2' ? 'var(--color-accent-2)' : `var(--color-${color}-600)`);

/** The subjects' chosen colours as read from storage or a backup. */
export function readSubjectColors(raw: unknown): Record<string, SubjectColor> {
  const out: Record<string, SubjectColor> = {};
  if (typeof raw === 'object' && raw !== null) for (const [k, v] of Object.entries(raw)) if (isColor(v)) out[k] = v;
  return out;
}
