// "Folien mit Claude": Claude reworks the slides of a lesson so they vary and fit the class: a layout per slide,
// strong pictures where looking helps (with search words and a description), the content and solutions kept.
import { claudeInstructions } from '../claude/instructions';
import { blockText } from '../library/search';
import { BLOCK_TYPES } from '../model/blockTypes';
import { DocFormatError } from '../model/normalize';
import { normalizeSlides, type Slide } from '../model/slides';
import type { Doc } from '../model/types';

export interface SlidesAiContext {
  subject: string;
  grade: number;
  topic: string;
  lessonTitle: string;
  /** The class profile and the teacher's principles, '' without. */
  notes: string;
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

/** Claude's slides; pictures only where they are the old slides' own (Claude cannot make new ones). */
export function slidesFromAnswer(raw: unknown, old: Slide[]): { slides: Slide[]; notes: string[] } {
  const list = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as { slides?: unknown }).slides : raw;
  if (!Array.isArray(list) || !list.length) throw new DocFormatError('In der Antwort fehlen die Folien ("slides").');
  const notes: string[] = [];
  const slides = normalizeSlides(list, (t) => notes.push(t));
  const images = new Set(old.flatMap((s) => [s.image, ...s.elements.map((e) => e.image ?? '')]).filter(Boolean));
  for (const s of slides) {
    if (s.image && !images.has(s.image)) s.image = '';
    for (const e of s.elements) if (e.image && !images.has(e.image)) e.image = '';
  }
  return { slides, notes };
}
