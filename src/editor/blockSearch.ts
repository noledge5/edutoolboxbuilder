// Search field of the toolbox: typing "Lücke" shows the gap text. Besides the label and group of a block, these
// words find it (German and English, as the teacher would call it).
import { fold, queryWords } from '../library/search';
import { BLOCK_ORDER, BLOCK_TYPES, GROUPS } from '../model/blockTypes';
import type { BlockType } from '../model/types';

export const BLOCK_WORDS: Record<BlockType, string> = {
  heading: 'Titel Zwischenüberschrift headline',
  text: 'Text Info Material Absatz Informationstext',
  hint: 'Hinweis Tipp Kasten Achtung Sicherheit Info-Box',
  merksatz: 'Merksatz Merke Regel Sicherung Hefteintrag',
  wordbank: 'Wortspeicher Begriffe Wortliste Hilfswörter word bank',
  image: 'Bild Foto Abbildung Grafik Karte Diagramm picture',
  flow: 'Fließschema Ablauf Pfeile Kreislauf Schritte Wirkungskette',
  qr: 'QR Link Video Internet',
  code: 'Code Programm Python Informatik Quelltext Algorithmus',
  open: 'Offene Frage Schreiblinien Antwort Linien Frage',
  mc: 'Ankreuzen Multiple Choice Quiz Auswahl Antworten',
  gap: 'Lückentext Lücken Cloze fill in gaps',
  table: 'Tabelle Raster Spalten Zeilen',
  match: 'Zuordnen verbinden Linien Paare matching',
  draw: 'Zeichenfeld Zeichnen Skizze Rechnen Karo Linien Kästchen',
  selfcheck: 'Ich kann Selbsteinschätzung Smileys Reflexion Checkliste',
  plan: 'Stundenverlauf Verlaufsplan Phasen Ablauf Lehrkraft',
  goal: 'Ziel Bildungsplan Kompetenz Stundenziel Lehrkraft',
  hook: 'Einstieg Impuls Bildimpuls Schätzfrage Zitat Karikatur Problem Fall Video Experiment Abstimmung Rätsel Vorwissen Leitfrage Lehrkraft',
  expect: 'Erwartungshorizont Bewertung Musterlösung Lehrkraft',
  recall: 'Abruffragen Wiederholung Einstieg Quiz Lehrkraft',
  vocab: 'Vokabelliste Vokabeln Wörter Wortschatz vocabulary words',
  foldtest: 'Knick-Vokabeltest Vokabeltest Test falten Abfrage',
  picvocab: 'Bild-Vokabeln Bilder beschriften label the pictures',
  wordweb: 'Wortnetz Mindmap Wortfeld word web',
  grammar: 'Grammatik Regel Signalwörter grammar rule',
  forms: 'Formentabelle Konjugation Verbformen to be have got',
  jumble: 'Wörter ordnen Satz ordnen word order jumbled sentences',
  transform: 'Umformen Verneinung Frage Zeitform rewrite',
  syntax: 'Satzbaustellen Satzbau Satzstellung word order SVO',
  listening: 'Hörverstehen Hören Audio listening Track',
  reading: 'Lesetext Lesen reading Text Zeilennummern',
  truefalse: 'Richtig Falsch true false not given',
  phrases: 'Redemittel useful phrases Sprechen Formulierungen',
  rolecards: 'Rollenkarten Rollenspiel Dialog information gap Sprechen',
  bingo: 'Bingo Find someone who Umfrage',
  writing: 'Schreibrahmen Schreiben writing Checkliste Text',
  mediation: 'Sprachmittlung Mediation Übersetzen',
  gradescale: 'Notenschlüssel Noten Punkte Klassenarbeit Test',
  tipcards: 'Tippkarten Tipps Hilfen Hilfekarten',
};

const haystack = new Map(BLOCK_ORDER.map((t) => [t, fold([BLOCK_TYPES[t].label, GROUPS[BLOCK_TYPES[t].group].label, BLOCK_WORDS[t]].join(' '))]));

/** Block types whose label, group or words contain every word of the query; those whose label starts with it first. */
export function findBlockTypes(query: string): BlockType[] {
  const words = queryWords(query);
  if (!words.length) return [];
  const found = BLOCK_ORDER.filter((t) => words.every((w) => haystack.get(t)!.includes(w)));
  const first = (t: BlockType) => (fold(BLOCK_TYPES[t].label).startsWith(words[0]) ? 0 : 1);
  return found.sort((a, b) => first(a) - first(b));
}
