// "Mit KI bauen: Folien": the presentation as its own step once the sheet is done. "build": new slides from the
// whole lesson (teacher page with learning path, course and hook, the sheets, recall questions of earlier lessons);
// "rework": the slides there are, after the teacher's wish. Pictures: the sheet's own (by id) or search words and a
// description for the teacher to fill in.
import { claudeInstructions } from '../claude/instructions';
import { blockText } from '../library/search';
import { BLOCK_TYPES } from '../model/blockTypes';
import { DocFormatError } from '../model/normalize';
import { normalizeSlides, type Slide } from '../model/slides';
import type { Doc } from '../model/types';
import { packagePages } from './lesson';

export type SlidesAiMode = 'build' | 'rework';

export interface SlidesAiContext {
  subject: string;
  grade: number;
  topic: string;
  lessonTitle: string;
  /** The class profile and the teacher's principles, '' without. */
  notes: string;
  /** Questions from earlier lessons for the recall phase (spaced), if the course has one. */
  recall?: { q: string; a: string; where: string }[];
}

/** The pictures of the sheet (image blocks, hooks) that slides may show: id → caption. */
export function sheetImages(doc: Doc): Map<string, string> {
  const out = new Map<string, string>();
  for (const p of doc.pages) for (const b of p.blocks) if (typeof b.props.image === 'string' && b.props.image) out.set(b.props.image, String(b.props.caption ?? b.props.impulse ?? ''));
  return out;
}

/** The request for new slides from the whole lesson. */
export function buildSlidesPrompt(doc: Doc, c: SlidesAiContext, wish: string): string {
  const images = [...sheetImages(doc)];
  return [
    `**Auftrag:** Gestalte die Präsentation der Stunde „${c.lessonTitle}“ (${c.subject}, Klasse ${c.grade}, Modul „${c.topic}“). Das Arbeitsblatt ist fertig; die Folien begleiten die Klasse durch dieselbe Stunde.`,
    '- **Erst denken:** Sieh dir die Lehrkraft-Seite (Lernweg, Verlauf, Einstieg) und die Arbeitsblätter genau an und überlege selbst, wie diese Stunde mit dieser Klasse im Raum am besten läuft (siehe „Folien“ → „Erst denken, dann Folien“): Was müssen alle gemeinsam sehen, wo braucht es einen Impuls, eine klare Anweisung, eine Besprechung, wo wird die Klasse an der Wand aktiv (Quiz, Ordnen, Aufdecken), was ist für dieses Alter angemessen? Es gibt keinen festen Ablauf und keine feste Zahl an Folien.',
    '- **Frei in der Form:** Nutze die Folienarten als Werkzeugkasten (auch `quiz`, `sort`, `bullets`, `text`, `full`, `big`, Abdeckungen und Schritte), knapp und gut lesbar, Sprechernotizen (`notes`) auf Deutsch. Lösungen und Merksatz wie auf dem Blatt. In die Notizen der ersten Folie schreibst du in zwei, drei Sätzen deine Idee für die Präsentation.',
    images.length
      ? `- **Bilder des Blatts:** Diese Bilder darfst du auf Folien zeigen (Feld \`image\` mit der ID): ${images.map(([id, cap]) => `\`${id}\`${cap ? ` (${cap})` : ''}`).join(', ')}. Für andere Bilder schreib \`search\` und \`describe\`.`
      : '- **Bilder:** Das Blatt hat noch keine Bilder; schreib für Bildfolien `search` und `describe`.',
    c.recall?.length ? `- **Abruffragen aus früheren Stunden** (für eine Abrufphase): ${c.recall.map((r) => `${r.q} | ${r.a} (${r.where})`).join(' · ')}` : '',
    wish.trim() ? `- **Wunsch der Lehrkraft:** ${wish.trim()}` : '',
    c.notes ? `\n${c.notes}` : '',
    '',
    'Antworte nur mit einem JSON-Codeblock: ```json\n{"slides": [ … ]}\n```',
    '',
    '**Die Stunde (Lehrkraft-Seite und Arbeitsblätter):**',
    '```json',
    JSON.stringify(packagePages(doc.pages.filter((p) => p.blocks.length))),
    '```',
  ]
    .filter((x) => x !== '')
    .join('\n');
}

export const slidesSystem = () => claudeInstructions();

/** A slide without what Claude does not need (ids, empty fields). */
const leanSlide = (s: Slide) =>
  Object.fromEntries(Object.entries(s).filter(([k, v]) => k !== 'id' && v !== '' && v !== false && v !== 0 && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length)));

export function slidesPrompt(slides: Slide[], doc: Doc, c: SlidesAiContext, wish: string): string {
  const sheet = doc.pages
    .map((p, i) => `### Seite ${i + 1}: ${p.title}\n${p.blocks.map((b) => `- ${BLOCK_TYPES[b.type].label}: ${blockText(b).join(' / ').slice(0, 300)}`).join('\n')}`)
    .join('\n');
  return [
    `**Auftrag:** Überarbeite die Folien der Stunde „${c.lessonTitle}“ (${c.subject}, Klasse ${c.grade}, Modul „${c.topic}“), damit sie abwechslungsreich sind und zur Klasse passen.`,
    '- Behalte Ablauf, Inhalte, Aufgaben und Lösungen; ändere Art (`layout`), Wortlaut der Überschriften und Impulse, Bilder und Animationen.',
    '- Wechsle die Arten ab (siehe „Abwechslung“): ein starkes Bild (`full`) oder eine große Zahl oder Frage (`big`) zum Einstieg, Bilder (`image`, `full`) dort, wo Anschauung hilft, mit `search` und `describe`. Folien mit `image` behalten ihr Bild.',
    '- Arbeitsaufträge (`work`) und Aufgaben (`task`) bleiben, wie sie sind, bis auf Bilder und Wortlaut.',
    wish.trim() ? `- **Wunsch der Lehrkraft:** ${wish.trim()}` : '',
    c.notes ? `\n${c.notes}` : '',
    '',
    'Antworte nur mit einem JSON-Codeblock: ```json\n{"slides": [ … ]}\n```',
    '',
    '**Die Folien bisher:**',
    '```json',
    JSON.stringify(slides.map(leanSlide)),
    '```',
    '',
    '**Das Arbeitsblatt der Stunde (gekürzt):**',
    sheet,
  ]
    .filter((x) => x !== '')
    .join('\n');
}

/** Claude's slides; pictures only the old slides' own or the sheet's (Claude cannot make new ones). */
export function slidesFromAnswer(raw: unknown, old: Slide[], doc?: Doc): { slides: Slide[]; notes: string[] } {
  const list = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as { slides?: unknown }).slides : raw;
  if (!Array.isArray(list) || !list.length) throw new DocFormatError('In der Antwort fehlen die Folien ("slides").');
  const notes: string[] = [];
  const slides = normalizeSlides(list, (t) => notes.push(t));
  const images = new Set([...old.flatMap((s) => [s.image, ...s.elements.map((e) => e.image ?? '')]), ...(doc ? sheetImages(doc).keys() : [])].filter(Boolean));
  for (const s of slides) {
    if (s.image && !images.has(s.image)) s.image = '';
    for (const e of s.elements) if (e.image && !images.has(e.image)) e.image = '';
  }
  return { slides, notes };
}
