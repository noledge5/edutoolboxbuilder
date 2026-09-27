// Presentation slides of a lesson (16:9, 1920 × 1080), in the style of the design's slide reference
// (docs/design/referenz/Präsentation Treibhauseffekt.dc.html): a header bar with phase and work form,
// a big Caprasimo heading and one of a few layouts. Colours follow the sheet types, so slides and
// worksheets of a phase look alike.
import { uid } from './ops';
import { THEMES, WORK_FORMS } from './themes';
import type { SheetType, WorkForm } from './types';

export type SlideLayout = 'title' | 'list' | 'quote' | 'statement' | 'compare' | 'flow' | 'words' | 'image' | 'exit';

export interface Slide {
  id: string;
  layout: SlideLayout;
  /** Colour, as the sheet type of that phase: "lehrkraft" is the neutral grey (Einstieg, Abrufphase). */
  type: SheetType;
  /** Phase pill in the header bar: "Einstieg", "Abrufphase", "Versuch", "Sicherung" … */
  phase: string;
  /** Work form and minutes in the second pill; '' and 0 leave them out. */
  form: WorkForm | '';
  minutes: number;
  /** Small line above the heading ("Leitfrage", "Deutung", "Merksatz"); in "quote" the label of the box. */
  label: string;
  title: string;
  /** Subtitle, quote, hint or the text beside a picture, depending on the layout. */
  text: string;
  /** One entry per line: "question | answer", "heading | text", "step | detail", "word | meaning". */
  items: string;
  /** Picture (image id) of the "image" layout, with its source line. */
  image: string;
  source: string;
  /** Answers and meanings stay hidden until a click or tap while presenting. */
  reveal: boolean;
  /** Speaker notes, only for the teacher. */
  notes: string;
}

export interface SlideLayoutInfo {
  label: string;
  /** What the layout is for, shown when choosing it. */
  use: string;
  /** Hint for the entries field; '' = the layout has no entries. */
  items: string;
  /** Meaning of the text field in this layout; '' = not used. */
  text: string;
  /** Meaning of the label field; '' = not used. */
  labelHint: string;
}

export const SLIDE_LAYOUTS: Record<SlideLayout, SlideLayoutInfo> = {
  title: { label: 'Titel', use: 'Erste Folie der Stunde mit Thema und Leitfrage', items: '', text: 'Untertitel oder Leitfrage', labelHint: '' },
  list: { label: 'Fragen', use: 'Nummerierte Fragen oder Aufträge, Antworten auf Klick', items: 'Eine Frage je Zeile, Antwort nach „|“', text: 'Auftrag unter der Überschrift', labelHint: '' },
  quote: {
    label: 'Zitat + Leitfrage',
    use: 'Einstieg: Zitat, Aussage oder Rückblick, darunter die Leitfrage',
    items: '',
    text: 'Zitat oder Aussage im Kasten',
    labelHint: 'Kleine Zeile im Kasten, z. B. „Aus Stunde 1“',
  },
  statement: {
    label: 'Aussage',
    use: 'Deutung, These oder Arbeitsauftrag in großer Schrift, mit Hinweis',
    items: '',
    text: 'Hinweis im grünen Kasten (**fett** möglich)',
    labelHint: 'Kleine Zeile darüber, z. B. „Deutung“',
  },
  compare: { label: 'Vergleich', use: 'Zwei oder drei Kästen nebeneinander', items: 'Ein Kasten je Zeile: Überschrift | Text', text: 'Satz unter den Kästen', labelHint: '' },
  flow: {
    label: 'Fließschema',
    use: 'Schritte mit Pfeilen, z. B. ein Ablauf oder eine Ursache-Wirkungs-Kette',
    items: 'Ein Schritt je Zeile: Begriff | Erklärung',
    text: 'Satz unter dem Schema',
    labelHint: '',
  },
  words: { label: 'Wörter', use: 'Vokabeln oder Fachbegriffe als Karten, Bedeutung auf Klick', items: 'Ein Wort je Zeile: Wort | Bedeutung', text: 'Auftrag unter der Überschrift', labelHint: '' },
  image: { label: 'Bild', use: 'Ein großes Bild mit Text daneben', items: '', text: 'Text neben dem Bild', labelHint: '' },
  exit: { label: 'Exit / Merksatz', use: 'Letzte Folie: Rückbezug und Merksatz auf grünem Grund', items: '', text: 'Rückbezug über dem Merksatz', labelHint: 'Kleine Zeile, z. B. „Merksatz“' },
};

export const SLIDE_LAYOUT_ORDER = Object.keys(SLIDE_LAYOUTS) as SlideLayout[];

const LAYOUT_DEFAULTS: Record<SlideLayout, Partial<Slide>> = {
  title: { type: 'versuch', title: 'Thema der Stunde', text: 'Leitfrage der Stunde?' },
  list: {
    type: 'lehrkraft',
    phase: 'Abrufphase',
    form: 'allein',
    minutes: 5,
    title: 'Aus dem Gedächtnis',
    items: 'Erste Frage? | Antwort\nZweite Frage? | Antwort\nDritte Frage? | Antwort',
    reveal: true,
  },
  quote: { type: 'lehrkraft', phase: 'Einstieg', form: 'Plenum', minutes: 5, label: 'Aus Stunde 1', text: '„Ein Satz, der zum Nachdenken bringt.“', title: 'Leitfrage der Stunde?' },
  statement: { type: 'versuch', phase: 'Deutung', form: 'Plenum', label: 'Deutung', title: 'Eine Aussage, die die Klasse festhält.', text: '**Wichtiger Hinweis:** Was man dabei beachten muss.' },
  compare: { type: 'sicherung', phase: 'Sicherung', form: 'allein', title: 'Zwei Begriffe, ein Unterschied', items: 'Erster Begriff | Erklärung\nZweiter Begriff | Erklärung' },
  flow: { type: 'sicherung', phase: 'Sicherung', form: 'allein', title: 'Wie hängt das zusammen?', items: 'Ursache | Erklärung\nZwischenschritt | Erklärung\nFolge | Erklärung' },
  words: { type: 'vocab', phase: 'Vocabulary', form: 'Plenum', title: 'New words', items: 'classroom | Klassenzimmer\nteacher | Lehrer/in\nboard | Tafel\npencil case | Federmäppchen', reveal: true },
  image: { type: 'uebung', phase: 'Erarbeitung', form: 'zu zweit', title: 'Was seht ihr?', text: 'Beschreibt das Bild in drei Sätzen.' },
  exit: { type: 'sicherung', phase: 'Exit', form: 'Plenum', minutes: 3, label: 'Merksatz', text: 'Rückbezug auf die Leitfrage.', title: 'Der wichtigste Satz der Stunde.' },
};

const BASE: Omit<Slide, 'id' | 'layout'> = { type: 'uebung', phase: '', form: '', minutes: 0, label: '', title: '', text: '', items: '', image: '', source: '', reveal: false, notes: '' };

/** A new slide of a layout, with example content that shows how it is meant. */
export function createSlide(layout: SlideLayout): Slide {
  return { ...BASE, ...LAYOUT_DEFAULTS[layout], id: uid(), layout };
}

/** Defaults a slide in a file may leave out. */
export const SLIDE_DEFAULTS = BASE;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(str).join('\n') : '');

export const isSlideLayout = (x: unknown): x is SlideLayout => typeof x === 'string' && x in SLIDE_LAYOUTS;

/**
 * Slides from storage, a backup or a package. Unknown layouts become "statement"; `note` is told
 * what was repaired (in German, for the teacher).
 */
export function normalizeSlides(raw: unknown, note: (text: string) => void = () => {}): Slide[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    note('"slides" ist keine Liste und wurde übersprungen.');
    return [];
  }
  const seen = new Set<string>();
  const out: Slide[] = [];
  raw.forEach((r, i) => {
    if (!isObj(r)) {
      note(`Folie ${i + 1} ist kein Objekt und wurde übersprungen.`);
      return;
    }
    let layout: SlideLayout = 'statement';
    if (isSlideLayout(r.layout)) layout = r.layout;
    else note(`Folie ${i + 1}: Das Layout „${str(r.layout)}“ gibt es nicht, die Folie ist jetzt eine „Aussage“.`);
    let type: SheetType = 'uebung';
    if (typeof r.type === 'string' && r.type in THEMES) type = r.type as SheetType;
    else if (r.type !== undefined) note(`Folie ${i + 1}: Die Farbe „${str(r.type)}“ gibt es nicht, jetzt „uebung“.`);
    let id = typeof r.id === 'string' && r.id ? r.id : uid();
    while (seen.has(id)) id = uid();
    seen.add(id);
    const minutes = Number(r.minutes);
    out.push({
      id,
      layout,
      type,
      phase: str(r.phase),
      form: WORK_FORMS.includes(r.form as WorkForm) ? (r.form as WorkForm) : '',
      minutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0,
      label: str(r.label),
      title: str(r.title),
      text: str(r.text),
      items: str(r.items),
      image: str(r.image),
      source: str(r.source),
      reveal: r.reveal === true,
      notes: str(r.notes),
    });
  });
  return out;
}

/** "question | answer" lines as pairs; empty lines are left out. */
export function slideItems(items: string): [string, string][] {
  return items
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const k = l.indexOf('|');
      return k < 0 ? [l, ''] : [l.slice(0, k).trim(), l.slice(k + 1).trim()];
    });
}

/** Whether a slide has something to uncover while presenting. */
export const hasReveal = (s: Slide) => s.reveal && (s.layout === 'list' || s.layout === 'words') && slideItems(s.items).some(([, a]) => a);

/** Image ids the slides use (for backups and cleaning up). */
export const slideImages = (slides: Slide[]) => slides.map((s) => s.image).filter(Boolean);

/** A slide without the fields that equal the defaults, for files. */
export function leanSlide(s: Slide): Partial<Slide> & { layout: SlideLayout } {
  const out: Record<string, unknown> = { layout: s.layout };
  for (const [k, v] of Object.entries(s)) if (k !== 'id' && k !== 'layout' && v !== (BASE as Record<string, unknown>)[k]) out[k] = v;
  return out as Partial<Slide> & { layout: SlideLayout };
}
