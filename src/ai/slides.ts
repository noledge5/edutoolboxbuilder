// "Mit KI bauen: Folien": the presentation as its own step once the sheet is done. "build": new slides from the
// whole lesson (teacher page with learning path, course and hook, the sheets, recall questions of earlier lessons);
// "rework": the slides there are, after the teacher's wish. Pictures: the sheet's own (by id) or search words and a
// description for the teacher to fill in.
import { blockText } from '../library/search';
import { BLOCK_TYPES } from '../model/blockTypes';
import { DocFormatError } from '../model/normalize';
import { normalizeSlides, type Slide } from '../model/slides';
import type { Doc } from '../model/types';

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

/** The pages of the lesson for the request: only what is filled in and differs from a block's defaults. */
const leanPages = (doc: Doc) =>
  doc.pages
    .filter((p) => p.blocks.length)
    .map((p) => ({
      title: p.title,
      type: p.type,
      ...(p.back ? { back: true } : {}),
      blocks: p.blocks.map((b) => ({ type: b.type, ...Object.fromEntries(Object.entries(b.props).filter(([k, v]) => v !== '' && v !== BLOCK_TYPES[b.type].defaults[k])) })),
    }));

/** The request for new slides from the whole lesson (the Anleitung is in the chat project). */
export function buildSlidesPrompt(doc: Doc, c: SlidesAiContext, wish: string): string {
  const images = [...sheetImages(doc)];
  return [
    `Bitte nach der Anleitung „Arbeitsblatt-Baukasten“ (Abschnitt „Folien“): Gestalte die Präsentation der Stunde „${c.lessonTitle}“ (${c.subject}, Klasse ${c.grade}, Modul „${c.topic}“). Erst denken: Wie läuft diese Stunde mit dieser Klasse im Raum am besten? Dann so viele Folien, wie sie braucht, aus dem Werkzeugkasten. Lösungen und Merksatz wie auf dem Blatt.`,
    images.length ? `Bilder des Blatts (\`image\` mit ID): ${images.map(([id, cap]) => `\`${id}\`${cap ? ` ${cap}` : ''}`).join(', ')}.` : '',
    c.recall?.length ? `Abruffragen früherer Stunden: ${c.recall.map((r) => `${r.q} | ${r.a}`).join(' · ')}` : '',
    wish.trim() ? `Wunsch der Lehrkraft: ${wish.trim()}` : '',
    c.notes,
    'Antworte nur mit einem JSON-Codeblock `{"slides": […]}`. Die Stunde:',
    JSON.stringify(leanPages(doc)),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** A slide without what Claude does not need (ids, empty fields). */
const leanSlide = (s: Slide) =>
  Object.fromEntries(Object.entries(s).filter(([k, v]) => k !== 'id' && v !== '' && v !== false && v !== 0 && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length)));

export function slidesPrompt(slides: Slide[], doc: Doc, c: SlidesAiContext, wish: string): string {
  const sheet = doc.pages
    .map((p, i) => `### Seite ${i + 1}: ${p.title}\n${p.blocks.map((b) => `- ${BLOCK_TYPES[b.type].label}: ${blockText(b).join(' / ').slice(0, 300)}`).join('\n')}`)
    .join('\n');
  return [
    `Bitte nach der Anleitung „Arbeitsblatt-Baukasten“ (Abschnitt „Folien“): Überarbeite die Folien der Stunde „${c.lessonTitle}“ (${c.subject}, Klasse ${c.grade}, Modul „${c.topic}“), damit sie abwechslungsreich sind und zur Klasse passen. Inhalte, Aufgaben und Lösungen bleiben; Art, Wortlaut, Bilder und Schritte dürfen sich ändern; Folien mit \`image\` behalten ihr Bild.`,
    wish.trim() ? `Wunsch der Lehrkraft: ${wish.trim()}` : '',
    c.notes,
    'Antworte nur mit einem JSON-Codeblock `{"slides": […]}`. Die Folien bisher:',
    JSON.stringify(slides.map(leanSlide)),
    'Das Arbeitsblatt (gekürzt):',
    sheet,
  ]
    .filter(Boolean)
    .join('\n\n');
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
