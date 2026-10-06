// Bringing in a worksheet from a PDF: Claude reads the pages (pictures and text) and writes them as blocks, true to
// the original, with solutions; the figures it names are cut out of the PDF by the Baukasten (pictures found in the
// PDF by their id, everything else by Claude's box on the page).
import { PACKAGE_FORMAT, PACKAGE_VERSION } from '../library/package';
import type { Module } from '../library/types';
import { DocFormatError } from '../model/normalize';
import type { Doc, Page } from '../model/types';
import type { Box, PdfCandidate } from '../storage/pdf';

export interface PdfImportOptions {
  /** Claude adds a page "Für die Lehrkraft". */
  teacher: boolean;
  /** The teacher's notes for this file ("Seite 3 ist das Lösungsblatt"). */
  wishes: string;
}

/** What the request needs of the read PDF. */
export interface PdfSummary {
  fileName: string;
  pages: { text: string; scan: boolean }[];
  candidates: PdfCandidate[];
  pageCount: number;
}

const pct = (v: number) => `${Math.round(v)} %`;
const boxText = (b: Box) => `x ${pct(b[0])}, y ${pct(b[1])}, Breite ${pct(b[2])}, Höhe ${pct(b[3])}`;

/** The request: the task, how figures are named, and the text of each page. `context`: the lesson's place in the module. */
export function pdfPrompt(m: Module, pdf: PdfSummary, context: string, o: PdfImportOptions, chat = false): string {
  const task = [
    `Pflege das Arbeitsblatt aus der PDF-Datei „${pdf.fileName}“ in den Baukasten ein (${m.subject}, Klasse ${m.grade}). Übertrage es **treu**:`,
    '- Wortlaut der Texte und Aufträge, Reihenfolge und alle Aufgaben bleiben, wie sie sind (offensichtliche Tippfehler darfst du verbessern). Aufgabennummern lässt du weg, der Baukasten nummeriert selbst. Kopf- und Fußzeilen, Logos, Namens- und Datumszeilen, Seitenzahlen und Verlagsangaben übernimmst du nicht.',
    '- Wähle für jede Aufgabe den Baustein, der ihr am besten entspricht (Lückentext, Ankreuzen, Zuordnen, Tabelle, Richtig/Falsch, Offene Frage mit so vielen Schreiblinien wie im Original …). Sachtexte werden Textblock oder Lesetext, Kästen Hinweis-Box oder Merksatz, Wörterlisten Wortspeicher oder Vokabelliste.',
    '- **Lösungen:** Trag zu jeder Aufgabe die Lösung ein. Enthält das PDF Lösungen (Lösungsblatt, ausgefüllte Lücken, angekreuzte Antworten), übernimm sie; sonst löse die Aufgaben selbst, eindeutig und digital prüfbar. Ein Lösungsblatt wird keine eigene Schülerseite.',
    '- Keine neuen Aufgaben, Texte oder Bilder auf den Schülerseiten, auch nicht in Klasse 5 und 6. Verteile den Inhalt so auf Seiten, dass keine zu voll ist („Platz auf der Seite“); Titel und Kicker aus dem Original, Blatt-Typ und Sozialform passend.',
    '- **Abbildungen:** Für jede Abbildung des Originals (Foto, Karte, Diagramm, Zeichnung, Bildergeschichte; keine Logos, Symbole oder Verzierungen) setzt du einen Baustein „Abbildung“ mit `"image": "f1"`, `"f2"` … und der Bildunterschrift aus dem Original (`source` bleibt leer, `height` passend zum Seitenverhältnis). Abbildungen, die zu einer Aufgabe gehören, nimmst du auch dort, wo der Baustein ein Bildfeld hat (Bildimpuls, Bild-Vokabeln). Woher jedes Bild kommt, steht in `figures`:',
    '  - ein im PDF erkanntes Bild: `"f1": "B2"` (auf den Seitenbildern rot umrandet und beschriftet, Liste unten),',
    '  - sonst ein Ausschnitt der Seite: `"f2": { "page": 1, "box": [x, y, w, h] }` in Prozent der Seitenbreite und -höhe, x und y links oben (am Seitenrand stehen Marken alle 10 %). Nimm Beschriftungen, Legende und Pfeile mit, die zum Bild gehören, aber keinen Aufgabentext; lieber etwas zu groß als zu klein. Mehrere erkannte Bilder, die eine Abbildung bilden, fasst du so als einen Ausschnitt zusammen.',
    o.teacher
      ? '- Schreib dazu eine Seite „Für die Lehrkraft“ als erste Seite: Kernziel und Bildungsplanbezug, ein Einstieg mit Leitfrage, Verlauf für 45 Minuten mit den Schülerseiten als „AB S. 1“ …, Erwartungshorizont mit typischen Fehlern, Abruffragen; nach den „Didaktischen Leitlinien“, passend zu diesem Material.'
      : '- Keine Seite „Für die Lehrkraft“.',
    '- Verknüpfe die Aufgaben über `competence` mit dem Kompetenzraster des Moduls (fehlt eine passende Kompetenz, lege sie mit eigener ID an) und setze die Niveau-Sterne (`level`).',
  ];
  const out: string[] = [];
  if (chat) out.push('Bitte nach der Anleitung „Arbeitsblatt-Baukasten“ im Projektwissen. Das PDF ist an diese Nachricht angehängt.', '');
  else out.push('Du arbeitest diesmal direkt im Baukasten, nicht im Chat: Es gibt keine Rückfragen und keine Dateien. Die Seiten des PDFs hängen als Bilder an.', '');
  out.push('**Auftrag:**', ...task, '');
  if (o.wishes.trim()) out.push(`**Hinweise der Lehrkraft zu dieser Datei:** ${o.wishes.trim()}`, '');
  out.push(
    `**Form der Antwort:** genau ein JSON-Codeblock mit einem Stundenpaket („${PACKAGE_FORMAT}“, Version ${PACKAGE_VERSION}) mit genau einem Modul (subject „${m.subject}“, grade ${m.grade}, number ${m.number}) und genau einer Stunde mit \`title\` (Thema des Blatts) und \`pages\`, dazu oben im Paket \`"figures": { "f1": "B1", "f2": { "page": 2, "box": [10, 45, 40, 25] } }\`. ` +
      'Keine Folien. ' +
      (chat ? 'Gib das Paket als Codeblock im Chat aus, keine Datei.' : 'Kein Text vor oder nach dem Codeblock.'),
    '',
    context,
    '',
    `## Das PDF: ${pdf.pageCount} ${pdf.pageCount === 1 ? 'Seite' : 'Seiten'}${pdf.pageCount > pdf.pages.length ? `, davon die ersten ${pdf.pages.length}` : ''}`,
  );
  out.push('', '### Im PDF erkannte Bilder');
  if (pdf.candidates.length) for (const c of pdf.candidates) out.push(`- \`${c.id}\`: Seite ${c.page}, ${boxText(c.box)}`);
  else out.push('- Keine (gescannte Seiten oder nur Zeichnungen): gib Abbildungen als Ausschnitt an.');
  pdf.pages.forEach((p, i) => {
    out.push('', `### Seite ${i + 1}`);
    if (p.scan || !p.text.trim()) out.push('(gescannt, keine Textebene: lies das Seitenbild)');
    else out.push('Textebene (Reihenfolge kann bei Spalten springen; im Zweifel gilt das Seitenbild):', '```', p.text.slice(0, 8000), '```');
  });
  return out.join('\n');
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown) => (typeof x === 'number' ? x : typeof x === 'string' ? parseFloat(x) : NaN);

/** A figure to cut out: page and box in percent. */
export interface FigureCut {
  page: number;
  box: Box;
}

/** The figures of Claude's answer, each as page and box; what cannot be used is reported. */
export function figuresOf(raw: unknown, candidates: PdfCandidate[], pages: number): { cuts: Record<string, FigureCut>; notes: string[] } {
  const cuts: Record<string, FigureCut> = {};
  const notes: string[] = [];
  const figures = isObj(raw) && isObj(raw.figures) ? raw.figures : {};
  for (const [id, f] of Object.entries(figures)) {
    if (typeof f === 'string') {
      const c = candidates.find((x) => x.id.toLowerCase() === f.trim().toLowerCase());
      if (c) cuts[id] = { page: c.page, box: c.box };
      else notes.push(`Abbildung „${id}“: Das Bild „${f}“ gibt es im PDF nicht; es bleibt ein Platzhalter.`);
      continue;
    }
    const page = isObj(f) ? Math.round(num(f.page)) : NaN;
    const b = isObj(f) && Array.isArray(f.box) ? f.box.map(num) : [];
    if (!(page >= 1 && page <= pages) || b.length !== 4 || b.some((v) => !Number.isFinite(v))) {
      notes.push(`Abbildung „${id}“: Seite oder Ausschnitt fehlen; es bleibt ein Platzhalter.`);
      continue;
    }
    // Boxes given as fractions (0–1) instead of percent.
    const scale = b.every((v) => v <= 1) ? 100 : 1;
    const [x, y, w, h] = b.map((v) => v * scale);
    const x0 = Math.min(100, Math.max(0, x));
    const y0 = Math.min(100, Math.max(0, y));
    const box: Box = [x0, y0, Math.min(100 - x0, Math.max(0, w)), Math.min(100 - y0, Math.max(0, h))];
    if (box[2] < 2 || box[3] < 2) {
      notes.push(`Abbildung „${id}“: Der Ausschnitt ist zu klein; es bleibt ein Platzhalter.`);
      continue;
    }
    cuts[id] = { page, box };
  }
  return { cuts, notes };
}

/** The answer with the cut-out figures as its images, ready for `lessonFromAnswer`. */
export function withFigures(raw: unknown, images: Record<string, string>): Record<string, unknown> {
  if (!isObj(raw)) throw new DocFormatError('Die Antwort ist kein Stundenpaket.');
  return { ...raw, images: { ...(isObj(raw.images) ? raw.images : {}), ...images } };
}

/** The title Claude gave the worksheet ('' without). */
export function titleOf(raw: unknown): string {
  if (!isObj(raw)) return '';
  const mod = Array.isArray(raw.modules) ? raw.modules.find(isObj) : null;
  const lesson = isObj(mod) && Array.isArray(mod.lessons) ? mod.lessons.find(isObj) : null;
  return isObj(lesson) && typeof lesson.title === 'string' ? lesson.title.trim() : '';
}

const filled = (p: Page) => p.blocks.length > 0;
const teacher = (p: Page) => p.type === 'lehrkraft';

/**
 * The worksheet with the imported pages. An empty worksheet (or `replace`) takes them as they are; otherwise they go
 * after the pages there, a teacher page first, and only when the worksheet has none yet.
 */
export function placePages(current: Doc, made: Page[], replace: boolean): Doc {
  const old = current.pages.filter(filled);
  if (replace || !old.length) return { ...current, pages: [...made.filter(teacher), ...made.filter((p) => !teacher(p))] };
  const teachers = old.some(teacher) ? old.filter(teacher) : made.filter(teacher);
  return { ...current, pages: [...teachers, ...old.filter((p) => !teacher(p)), ...made.filter((p) => !teacher(p))] };
}
