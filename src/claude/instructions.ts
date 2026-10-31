// The instructions for Claude ("Anleitung für Claude"): a hand-written guide (anleitung.md) with the block reference,
// the icon list, the Bildungsplan areas, the school year and a compact example generated from the code, so they
// always match what the app accepts.
import template from './anleitung.md?raw';
import { FOREIGN_LANGUAGE_DOMAINS } from '../library/curriculum';
import { BW_2026_27, dayText, schoolWeekCount, schoolWeeks } from '../library/yearplan';
import { BLOCK_ORDER, BLOCK_TYPES, GROUPS, type FieldDef } from '../model/blockTypes';
import type { BlockType } from '../model/types';
import { TOPIC_ICONS } from '../topicIcons';
import { lessonExample } from './examples';

export const APP_URL = 'https://noledge5.github.io/edutoolboxbuilder/';
export const INSTRUCTIONS_FILE_NAME = 'Arbeitsblatt-Baukasten Anleitung fuer Claude.md';

/** What each block is for, in the words of the teacher. */
const BLOCK_USE: Record<BlockType, string> = {
  heading: 'Zwischenüberschrift auf der Seite.',
  text: 'Kurzer Informations- oder Materialtext; als Material mit `mat` (z. B. `"M1"`).',
  hint: 'Kasten mit Titel für Tipps, Sicherheitshinweise oder Einschränkungen.',
  merksatz: 'Hervorgehobener Merksatz zur Sicherung, gern mit Lücken.',
  wordbank: 'Begriffe als Hilfe für Lücken oder Beschriftungen.',
  image: 'Platz für ein Bild mit Bildunterschrift; in `search` englische Suchwörter für die Bildsuche der Lehrkraft (Openverse, Wikimedia Commons), die Quelle trägt der Baukasten ein. Beschriftungen in `labels`, ein Begriff je Zeile, nur die Wörter (die Lehrkraft setzt sie aufs Bild); `labelStyle` `"nummern"` (Nummern mit Legende), `"luecken"` (zum Ausfüllen, z. B. „Beschrifte M2“) oder `"text"` (Wörter im Bild).',
  flow: 'Fließschema: Stationen nebeneinander, mit Pfeilen verbunden (bis etwa 5 Schritte).',
  qr: 'QR-Code zu einem Link (Video, Simulation, Karte).',
  code: 'Programmcode mit Zeilennummern (Informatik), z. B. Python zum Lesen und Nachvollziehen; Schlüsselwörter und Werte werden hervorgehoben.',
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
  path: 'Nur Lehrkraft-Seite: der Lernweg der Stunde, den du **vor** den Blättern planst. Je Zeile ein Lernschritt: welches Material (M1, M2 …), was die Klasse damit tut und daraus lernt, welche Aufgabe (mit Seite) und welche Erkenntnis am Ende steht. Blätter und Folien folgen ihm.',
  expect: 'Nur Lehrkraft-Seite: Erwartungshorizont mit typischen Schüleraussagen und ihrer Bewertung.',
  recall: 'Nur Lehrkraft-Seite: Abruffragen zum Stoff dieser Stunde, mit Antworten. Der Baukasten stellt sie in späteren Stunden zum Abrufen (verteiltes Wiederholen), nicht am Anfang dieser Stunde.',
  vocab: 'Vokabelliste mit den Spalten Englisch, Lautschrift (IPA), Deutsch und Beispielsatz. Leere Spalten fallen weg. Eine Liste je Wortfeld (Überschrift = Wortfeld). Für anschauliche Wörter (Dinge, Tiere, Orte, Essen) in `picwords` je Zeile ein englisches Suchwort fürs Bild, sonst eine leere Zeile; dann bekommt die Liste eine Bildspalte, die die Lehrkraft füllt. `pics` lässt du leer.',
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

const VARIANT_TEXT = '`"accent-2"`, `"accent"`, `"neutral"`';

/** Fields every task has, or every material block: described once, not with each block. */
const COMMON = new Set(['level', 'points', 'langPoints', 'competence', 'tip', 'help', 'mat']);

/** A field in short: its key, the format hint of its label, its values. */
function fieldText(f: FieldDef): string {
  const hint = /\(([^)]*)\)/.exec(f.label)?.[1];
  const values =
    f.kind === 'seg'
      ? f.options.map((o) => `\`${JSON.stringify(o.v)}\``).join('/')
      : f.kind === 'number'
        ? `${f.min}–${f.max}`
        : f.kind === 'variant'
          ? VARIANT_TEXT
          : f.kind === 'image'
            ? 'Bild-ID'
            : f.kind === 'pics'
              ? 'Bild-IDs je Zeile'
              : '';
  const more = [hint, values].filter(Boolean).join('; ');
  return `\`${f.key}\`${more ? ` (${more})` : ''}`;
}

/** One block type in the reference, one line: what it is for and its own fields. */
export function blockEntry(t: BlockType): string {
  const T = BLOCK_TYPES[t];
  const fields = T.fields.filter((f) => f.kind !== 'preset' && !COMMON.has(f.key)).map(fieldText);
  const mat = T.fields.some((f) => f.key === 'mat') ? ' Material: `mat`.' : '';
  return `- **\`${t}\`** ${T.label}${T.task ? ' (Aufgabe)' : ''}, Breite ${T.span}. ${BLOCK_USE[t]} Felder: ${fields.join(', ') || '–'}.${mat}`;
}

/** The didactic guidelines in short, for the requests that do not carry the whole Anleitung (Stunde prüfen). */
export const DIDACTICS_BRIEF =
  'Didaktisch (Kurzfassung der Leitlinien): Jeder Auftrag beginnt mit einem Operator und verlangt genau, was er sagt. Niveau G vor allem Wiedergeben (AFB I: nennen, beschreiben, zuordnen), ' +
  'M Anwenden und Zusammenhänge herstellen (AFB II: erklären, vergleichen, auswerten), E Beurteilen und Gestalten (AFB III: beurteilen, begründet Stellung nehmen, entwickeln). ' +
  'Aufgaben verlangen Denken statt Abschreiben (vergleichen, begründen, vorhersagen, Fehler finden); falsche Antworten beim Ankreuzen sind typische Fehlvorstellungen. ' +
  'Hilfen in Stufen als `tip` (erst den Blick lenken, dann eine Strategie, dann ein Teil der Lösung), sprachliche Hilfen (Wortspeicher, Satzanfänge), einfache Sprache: ein Auftrag je Satz. ' +
  'Jede Aufgabe ist allein mit dem lösbar, was davor auf dem Blatt steht (Infotext, Material, Abbildung) oder aus früheren Stunden sicher bekannt ist; das Wissen kommt vor der Aufgabe. ' +
  'Steht ein Klassenprofil oder stehen Grundsätze der Lehrkraft im Auftrag, richte dich danach.';

function blockReference(): string {
  return GROUPS.map((g, gi) => {
    const types = BLOCK_ORDER.filter((t) => BLOCK_TYPES[t].group === gi);
    return `**${g.label}**\n${types.map(blockEntry).join('\n')}`;
  }).join('\n\n');
}

const holidays = () =>
  BW_2026_27.holidays.map((h) => `${h.name} ${dayText(h.from, true)}–${dayText(h.to, true)}`).join(', ') +
  `; erster Schultag ${dayText(BW_2026_27.start, true)}, letzter ${dayText(BW_2026_27.end, true)}.`;

/** The full instructions as Markdown. */
export function claudeInstructions(): string {
  const fill: Record<string, string> = {
    APP_URL,
    BEREICHE: FOREIGN_LANGUAGE_DOMAINS.map((d) => `„${d}“`).join(', '),
    SCHULJAHR: BW_2026_27.name,
    SCHULWOCHEN: String(schoolWeekCount(schoolWeeks(BW_2026_27))),
    FERIEN: holidays(),
    BAUSTEINE: blockReference(),
    SYMBOLE: TOPIC_ICONS.map((i) => i.key).join(', '),
    BEISPIEL: JSON.stringify(lessonExample()),
  };
  // Only the known placeholders: {{s}} and the like in the text are examples of the highlight syntax.
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (all, key: string) => fill[key] ?? all);
}

/** The placeholders the template must contain (checked by the tests). */
export const PLACEHOLDERS = ['APP_URL', 'BEREICHE', 'SCHULJAHR', 'SCHULWOCHEN', 'FERIEN', 'BAUSTEINE', 'SYMBOLE', 'BEISPIEL'];
export { template as instructionsTemplate };
