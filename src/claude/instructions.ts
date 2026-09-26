// The instructions for Claude ("Anleitung für Claude"): a hand-written guide with the block reference,
// the icon list and a complete example generated from the code, so they always match what the app accepts.
import template from './anleitung.md?raw';
import { BLOCK_ORDER, BLOCK_TYPES, GROUPS, type FieldDef } from '../model/blockTypes';
import { createBlock } from '../model/ops';
import type { BlockType, Page } from '../model/types';
import { lessonsOf, seedLibrary } from '../library/model';
import { packageFromModule, type PackageFile } from '../library/package';
import { TOPIC_ICONS } from '../topicIcons';

export const APP_URL = 'https://noledge5.github.io/edutoolboxbuilder/';
export const INSTRUCTIONS_FILE_NAME = 'Arbeitsblatt-Baukasten Anleitung fuer Claude.md';

/** What each block is for, in the words of the teacher. */
const BLOCK_USE: Record<BlockType, string> = {
  heading: 'Zwischenüberschrift auf der Seite.',
  text: 'Kurzer Informations- oder Materialtext.',
  hint: 'Kasten mit Titel für Tipps, Sicherheitshinweise oder Einschränkungen.',
  merksatz: 'Hervorgehobener Merksatz zur Sicherung, gern mit Lücken.',
  wordbank: 'Begriffe als Hilfe für Lücken oder Beschriftungen.',
  image: 'Platz für ein Bild mit Bildunterschrift und Quelle; die Lehrkraft fügt das Bild ein.',
  flow: 'Fließschema: Stationen nebeneinander, mit Pfeilen verbunden (bis etwa 5 Schritte).',
  qr: 'QR-Code zu einem Link (Video, Simulation, Karte).',
  open: 'Offene Frage mit Schreiblinien.',
  mc: 'Ankreuzaufgabe.',
  gap: 'Lückentext.',
  table: 'Tabelle zum Ausfüllen: Spaltenköpfe und die erste Spalte sind vorgegeben.',
  match: 'Zuordnen: linke und rechte Spalte werden mit Linien verbunden.',
  draw: 'Feld zum Zeichnen, Beschriften oder Rechnen.',
  selfcheck: 'Selbsteinschätzung „Ich kann …“ mit Smileys, am Ende einer Stunde.',
  plan: 'Nur Lehrkraft-Seite: Stundenverlauf als Tabelle.',
  goal: 'Nur Lehrkraft-Seite: Ziel der Stunde und Bildungsplanbezug.',
  expect: 'Nur Lehrkraft-Seite: Erwartungshorizont mit typischen Schüleraussagen und ihrer Bewertung.',
  recall: 'Nur Lehrkraft-Seite: Abruffragen mit Antworten, z. B. für den Einstieg.',
};

const VARIANT_TEXT = '`"accent-2"` (grün), `"accent"` (orange), `"neutral"` (grau)';

function fieldType(f: FieldDef): string {
  switch (f.kind) {
    case 'text':
      return 'Text';
    case 'area':
      return 'Text, mehrzeilig';
    case 'number':
      return `Zahl ${f.min}–${f.max}`;
    case 'variant':
      return VARIANT_TEXT;
    case 'seg':
      return f.options.map((o) => `\`${JSON.stringify(o.v)}\` (${o.l})`).join(', ');
    case 'image':
      return 'Bild-ID aus `images`';
    case 'competence':
      return '`id` aus `module.competences`';
  }
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function defaultText(v: unknown): string {
  if (v === '' || v === undefined) return '–';
  const json = JSON.stringify(v);
  return '`' + cell(json.length > 70 ? json.slice(0, 67) + '…"' : json) + '`';
}

function blockReference(): string {
  return GROUPS.map((g, gi) => {
    const types = BLOCK_ORDER.filter((t) => BLOCK_TYPES[t].group === gi);
    const parts = types.map((t) => {
      const T = BLOCK_TYPES[t];
      const rows = T.fields.map((f) => `| \`${f.key}\` | ${cell(f.label)} | ${fieldType(f)} | ${defaultText(T.defaults[f.key])} |`);
      return [
        `#### \`${t}\` · ${T.label}${T.task ? ' (Aufgabe, wird nummeriert)' : ''}`,
        '',
        `${BLOCK_USE[t]} Standardbreite: ${T.span}.`,
        '',
        '| Feld | Bedeutung | Werte | Standard |',
        '|---|---|---|---|',
        ...rows,
      ].join('\n');
    });
    return `### ${g.label}\n\n${parts.join('\n\n')}`;
  }).join('\n\n');
}

function iconList(): string {
  return TOPIC_ICONS.map((i) => `- \`${i.key}\`: ${i.label}${i.words ? ` (${i.words.split(' ').join(', ')})` : ''}`).join('\n');
}

/** The sample module as a Stundenpaket, with a teacher page and tasks linked to its competences. */
export function examplePackage(): PackageFile {
  const lib = seedLibrary();
  const m = lib.modules[0];
  const [k1, k2, k3] = m.competences;
  const lesson = { ...lessonsOf(lib, m.id)[0], number: 1 };
  const [versuch, sicherung] = lesson.doc.pages;
  const teacher: Page = {
    title: 'Der Treibhauseffekt',
    kicker: 'Klasse 9 · Stundenverlauf',
    type: 'lehrkraft',
    form: 'Plenum',
    nameField: 'aus',
    blocks: [createBlock('goal'), createBlock('plan'), createBlock('expect'), createBlock('recall')],
  };
  const tasks = (p: Page) => p.blocks.filter((b) => BLOCK_TYPES[b.type].task);
  const link = (p: Page, i: number, competence: string, level: string) => Object.assign(tasks(p)[i].props, { competence, level });
  link(versuch, 0, k3.id, '1');
  link(versuch, 1, k3.id, '1');
  link(versuch, 2, k1.id, '2');
  link(versuch, 3, k3.id, '3');
  link(sicherung, 0, k2.id, '2');
  link(sicherung, 1, k2.id, '1');
  link(sicherung, 2, k2.id, '3');
  sicherung.blocks.push(createBlock('selfcheck'));
  const pkg = packageFromModule(
    { ...m, competences: m.competences.map((c, i) => ({ ...c, id: `k${i + 1}`, lessons: '' })) },
    [{ ...lesson, doc: { ...lesson.doc, pages: [teacher, versuch, sicherung] } }],
  );
  const ids = new Map(m.competences.map((c, i) => [c.id, `k${i + 1}`]));
  for (const pg of pkg.lessons[0].pages) for (const b of pg.blocks) if (b.props.competence) b.props.competence = ids.get(String(b.props.competence));
  delete pkg.savedAt;
  return pkg;
}

/** The full instructions as Markdown. */
export function claudeInstructions(): string {
  return template
    .replace('{{APP_URL}}', APP_URL)
    .replace('{{BAUSTEINE}}', blockReference())
    .replace('{{SYMBOLE}}', iconList())
    .replace('{{BEISPIEL}}', JSON.stringify(examplePackage(), null, 2));
}
