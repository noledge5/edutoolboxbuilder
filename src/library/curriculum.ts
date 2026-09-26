// Areas of the Bildungsplan BW (2016) that the competence grid offers as a template, per subject.

/** Foreign languages (Englisch, Französisch, Spanisch …): the areas of the functional, intercultural and text competence. */
export const FOREIGN_LANGUAGE_DOMAINS = [
  'Hör-/Hörsehverstehen',
  'Leseverstehen',
  'Sprechen – an Gesprächen teilnehmen',
  'Sprechen – zusammenhängendes monologisches Sprechen',
  'Schreiben',
  'Sprachmittlung',
  'Sprachliche Mittel: Wortschatz',
  'Sprachliche Mittel: Grammatik',
  'Sprachliche Mittel: Aussprache und Intonation',
  'Sprachliche Mittel: Orthografie',
  'Interkulturelle kommunikative Kompetenz',
  'Text- und Medienkompetenz',
] as const;

const FOREIGN = /englisch|english|franz|spanisch|italienisch|latein/i;

/** The areas to choose from for a module; empty when the subject has no template (the field stays free text). */
export function domainsFor(subject: string, lang: string): readonly string[] {
  return lang === 'en' || FOREIGN.test(subject) ? FOREIGN_LANGUAGE_DOMAINS : [];
}
