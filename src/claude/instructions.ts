// The instructions for Claude ("Anleitung für Claude"): a hand-written guide (anleitung.md) with the block reference,
// the icon list, the Bildungsplan areas, the school year and complete examples generated from the code, so they
// always match what the app accepts.
import template from './anleitung.md?raw';
import { FOREIGN_LANGUAGE_DOMAINS } from '../library/curriculum';
import { BW_2026_27, dayText, schoolWeekCount, schoolWeeks } from '../library/yearplan';
import { BLOCK_ORDER, BLOCK_TYPES, GROUPS, type FieldDef } from '../model/blockTypes';
import type { BlockType } from '../model/types';
import { TOPIC_ICONS } from '../topicIcons';
import { englishExample, geographyExample, yearPlanExample } from './examples';

export const APP_URL = 'https://noledge5.github.io/edutoolboxbuilder/';
export const INSTRUCTIONS_FILE_NAME = 'Arbeitsblatt-Baukasten Anleitung fuer Claude.md';

/** What each block is for, in the words of the teacher. */
const BLOCK_USE: Record<BlockType, string> = {
  heading: 'Zwischenüberschrift auf der Seite.',
  text: 'Kurzer Informations- oder Materialtext.',
  hint: 'Kasten mit Titel für Tipps, Sicherheitshinweise oder Einschränkungen.',
  merksatz: 'Hervorgehobener Merksatz zur Sicherung, gern mit Lücken.',
  wordbank: 'Begriffe als Hilfe für Lücken oder Beschriftungen.',
  image: 'Platz für ein Bild mit Bildunterschrift; in `search` englische Suchwörter für die Bildsuche der Lehrkraft (Openverse, Wikimedia Commons), die Quelle trägt der Baukasten ein.',
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
  hook: 'Nur Lehrkraft-Seite: der Einstieg mit seiner Art (`kind`), dem Impuls, der Auflösung, Bild oder Video und der Leitfrage. Daraus baut der Baukasten die Einstiegsfolie.',
  expect: 'Nur Lehrkraft-Seite: Erwartungshorizont mit typischen Schüleraussagen und ihrer Bewertung.',
  recall: 'Nur Lehrkraft-Seite: Abruffragen zum Stoff dieser Stunde, mit Antworten. Der Baukasten stellt sie in späteren Stunden zum Abrufen (verteiltes Wiederholen), nicht am Anfang dieser Stunde.',
  vocab: 'Vokabelliste mit den Spalten Englisch, Lautschrift (IPA), Deutsch und Beispielsatz. Leere Spalten fallen weg.',
  foldtest: 'Knick-Vokabeltest: vorgegebenes Wort, Schreiblinie, Faltlinie, Lösung zum Selbstkontrollieren. Als „test“ ohne Lösungsspalte.',
  picvocab: 'Bilder (Emoji oder eingefügte Bilder) mit Beschriftungslinie („Label the pictures“).',
  wordweb: 'Wortnetz (Mindmap): Mitte und Äste mit Wörtern, Lücken und Lösungen.',
  grammar: 'Grammatik-Box mit Regel, Signalwörtern und Beispielsätzen; {{…}} markiert Endungen farbig.',
  forms: 'Formentabelle (Konjugation), z. B. to be, have got, simple present; auch mit Lücken.',
  jumble: 'Wörter ordnen: die Wörter eines Satzes erscheinen gemischt, die Lösung ist der Satz.',
  transform: 'Umformen: Ausgangssatz → Zielform (z. B. negative, question) mit Schreiblinie.',
  syntax: 'Satzbaustellen-Tabelle mit farbigen Spalten (subject, verb, object, place, time).',
  listening: 'Hörverstehen: Phase (pre/while/post), Track im Lehrwerk, QR-Code zur Audiodatei, Transkript in der Lösungsfassung.',
  reading: 'Lesetext mit automatischen Zeilennummern und Worterklärungen als Fußnote (mit Zeilenangabe).',
  truefalse: 'Richtig/falsch/steht nicht im Text: mehrere Aussagen in einer Tabelle zum Ankreuzen.',
  phrases: 'Redemittel zweispaltig: Englisch | Deutsch.',
  rolecards: 'Zwei Rollenkarten A und B zum Ausschneiden, z. B. für Information Gap.',
  bingo: 'Raster für „Find someone who …“ (mit Namenslinie) oder Bingo.',
  writing: 'Schreibrahmen: Satzanfänge mit Linien und eine Checkliste für den eigenen Text.',
  mediation: 'Sprachmittlung: deutsche Vorlage im Kasten, englische Aufgabe, Schreiblinien, Lösung.',
  gradescale: 'Notenschlüssel: zählt die Punkte aller Aufgaben (Inhalt und Sprache) und zeigt die Punktbereiche der Noten 1–6.',
  tipcards: 'Tippkarten zum Ausschneiden: sammelt die Tipps aller Aufgaben des Arbeitsblatts.',
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
      return '`id` aus `competences` des Moduls';
    case 'ipa':
      return 'Text, mehrzeilig (IPA-Zeichen erlaubt)';
    case 'pics':
      return 'Bild-IDs aus `images`, eine je Zeile';
    case 'preset':
      return 'keine Eigenschaft: Vorlagen ' + f.presets.map((p) => `„${p.l}“`).join(', ');
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

const holidayTable = () =>
  ['| Ferien | von | bis |', '|---|---|---|', ...BW_2026_27.holidays.map((h) => `| ${h.name} | ${dayText(h.from, true)} | ${dayText(h.to, true)} |`)].join('\n') +
  `\n\nErster Schultag: ${dayText(BW_2026_27.start, true)}, letzter Schultag: ${dayText(BW_2026_27.end, true)}.`;

const json = (x: unknown) => JSON.stringify(x, null, 2);

/** The full instructions as Markdown. */
export function claudeInstructions(): string {
  const fill: Record<string, string> = {
    APP_URL,
    BEREICHE: FOREIGN_LANGUAGE_DOMAINS.map((d) => `- ${d}`).join('\n'),
    SCHULJAHR: BW_2026_27.name,
    SCHULWOCHEN: String(schoolWeekCount(schoolWeeks(BW_2026_27))),
    FERIEN: holidayTable(),
    BAUSTEINE: blockReference(),
    SYMBOLE: iconList(),
    BEISPIEL_EN: json(englishExample()),
    BEISPIEL_PLAN: json(yearPlanExample()),
    BEISPIEL_GEO: json(geographyExample()),
  };
  // Only the known placeholders: {{s}} and the like in the text are examples of the highlight syntax.
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (all, key: string) => fill[key] ?? all);
}

/** The placeholders the template must contain (checked by the tests). */
export const PLACEHOLDERS = ['APP_URL', 'BEREICHE', 'SCHULJAHR', 'SCHULWOCHEN', 'FERIEN', 'BAUSTEINE', 'SYMBOLE', 'BEISPIEL_EN', 'BEISPIEL_PLAN', 'BEISPIEL_GEO'];
export { template as instructionsTemplate };
