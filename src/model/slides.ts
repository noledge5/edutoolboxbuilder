// Presentation slides of a lesson (16:9, 1920 × 1080), in the style of the design's slide reference
// (docs/design/referenz/Präsentation Treibhauseffekt.dc.html): a header bar with phase and work form,
// a big Caprasimo heading and one of a few layouts. Colours follow the sheet types, so slides and
// worksheets of a phase look alike.
import { normalizeStrokes, type Stroke } from './ink';
import { uid } from './ops';
import { THEMES, WORK_FORMS } from './themes';
import type { SheetType, WorkForm } from './types';
import { isObj } from './text';

export type SlideLayout = 'title' | 'list' | 'task' | 'work' | 'quote' | 'statement' | 'compare' | 'flow' | 'words' | 'image' | 'exit' | 'blank';

/** The look of all slides of a lesson: fonts, background, bars and boxes (see slides.css). */
export type SlideDesign = 'organisch' | 'klar' | 'heft' | 'tafel' | 'kontrast';

export const SLIDE_DESIGNS: { v: SlideDesign; l: string; use: string }[] = [
  { v: 'organisch', l: 'Organisch', use: 'Wie die Arbeitsblätter: runde Formen, warme Farben, Caprasimo' },
  { v: 'klar', l: 'Klar', use: 'Schlicht und modern: weiß, gerade Linien, fette serifenlose Überschriften' },
  { v: 'heft', l: 'Heft', use: 'Kariertes Schulheft mit rotem Rand und Überschriften in Handschrift' },
  { v: 'tafel', l: 'Tafel', use: 'Dunkelgrüne Tafel, Kreideschrift, gut in abgedunkelten Räumen' },
  { v: 'kontrast', l: 'Kontrast', use: 'Schwarz auf Weiß, kräftige Rahmen: für helle Räume und schwache Beamer' },
];

export const isSlideDesign = (x: unknown): x is SlideDesign => SLIDE_DESIGNS.some((d) => d.v === x);

/** How something appears when its click comes: "none" just appears. */
export type SlideAnim = 'none' | 'fade' | 'rise' | 'zoom' | 'left';
/** How a slide comes in while presenting. */
export type SlideTransition = 'none' | 'fade' | 'push' | 'zoom';
export type SlideElementKind = 'text' | 'image' | 'video' | 'qr' | 'cover' | 'ink';
export type TextStyle = 'plain' | 'heading' | 'box' | 'note';

/** When and how a part of a slide appears: on click `step` (0 = with the slide). */
export interface PartAnim {
  step: number;
  anim: SlideAnim;
}

/**
 * Something placed freely on a slide: a text field, a picture, a video, a QR code, a cover over a part of the slide
 * (it goes when tapped or on its click) or a sketch drawn in the editor.
 */
export interface SlideElement {
  id: string;
  kind: SlideElementKind;
  /** Position and size in slide pixels (1920 × 1080). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text of a text field; caption of a picture, video or QR code. */
  text: string;
  /** Video link (YouTube, Vimeo, MP4) or the link of a QR code. */
  url: string;
  /** Picture (image id) and its source line. */
  image: string;
  source: string;
  style: TextStyle;
  /** Font size of a text field in slide pixels. */
  size: number;
  align: 'left' | 'center';
  fit: 'contain' | 'cover';
  /** 0: with the slide; n: on the n-th click while presenting. A cover goes on its click (0: only when tapped). */
  step: number;
  anim: SlideAnim;
  /** A sketch: its strokes, in the box it was drawn in (`vw` × `vh`); the box may be moved and resized since. */
  strokes: Stroke[];
  vw: number;
  vh: number;
}

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
  /** Subtitle, quote, hint, solution of a task or the text beside a picture, depending on the layout. */
  text: string;
  /** Task slides: the help under the instruction (e.g. the German help of an English task). */
  help: string;
  /** One entry per line: "question | answer", "heading | text", "step | detail", "word | meaning". */
  items: string;
  /** Picture (image id) of the "image" layout, with its source line. */
  image: string;
  source: string;
  /** Answers and meanings stay hidden until a click or tap while presenting. */
  reveal: boolean;
  /** Hidden answers lie under cards that can be tapped, one by one (else they are invisible until their click). */
  cards: boolean;
  /** A comparison as a vote: tapping a box while presenting counts a hand. */
  vote: boolean;
  /** The entries (questions, boxes, steps, cards) appear one after the other, each on a click. */
  build: boolean;
  /** How entries that appear on a click come in. */
  itemAnim: SlideAnim;
  /** How the slide comes in while presenting. */
  transition: SlideTransition;
  /** Text fields, pictures, videos and QR codes placed freely on the slide. */
  elements: SlideElement[];
  /**
   * When single parts of the layout appear, overriding `build` and `reveal`: keys "title", "text", "label",
   * "image", "item:0", "answer:0" … (see `slideParts`).
   */
  anims: Record<string, PartAnim>;
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
  task: {
    label: 'Aufgabe',
    use: 'Eine Aufgabe des Arbeitsblatts: Nummer, Arbeitsauftrag, Einträge und Lösung, die auf Klick erscheint',
    items: 'Einträge, je Zeile „Eintrag | Lösung“; Lücken als [[Lösung]] füllen sich auf Klick',
    text: 'Lösung (erscheint auf Klick)',
    labelHint: 'Zeile über dem Auftrag, z. B. „Aufgabe 2 · ★★ · 3 P.“',
  },
  work: {
    label: 'Arbeitsauftrag',
    use: 'Arbeitsphase: Kurzauftrag, Zeit und Sozialform groß, Schritte (Ich – Du – Wir) mit eigener Zeit; beim Präsentieren startet der Timer',
    items: 'Ein Schritt je Zeile: „Ich: Lies M1 | 5“ (Sozialform: Auftrag | Minuten)',
    text: 'Hinweis, z. B. auf Hilfen oder Zusatzaufgaben',
    labelHint: 'Kleine Zeile darüber, z. B. „Arbeitsphase · S. 2“',
  },
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
  blank: { label: 'Leer', use: 'Freie Folie: nur Kopfleiste und Überschrift, Textfelder, Bilder und Videos frei platzieren', items: '', text: '', labelHint: '' },
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
  blank: { type: 'uebung', phase: 'Erarbeitung', title: 'Überschrift' },
  work: {
    type: 'uebung',
    phase: 'Erarbeitung',
    form: 'zu zweit',
    minutes: 15,
    label: 'Arbeitsphase · S. 1',
    title: 'Bearbeitet Aufgabe 1–3.',
    text: '★★★ Aufgabe 4 für alle, die fertig sind. Tippkarten liegen am Pult.',
    items: 'Ich: Lies M1 und markiere die Ursachen. | 5\nDu: Vergleicht eure Ergebnisse. | 5\nWir: Stellt eure Ergebnisse vor. | 5',
  },
  task: {
    type: 'uebung',
    phase: 'Übung',
    form: 'allein',
    label: 'Aufgabe 1 · ★★ · 3 P.',
    title: 'Setze die fehlenden Wörter ein.',
    items: 'Die Sonne [[erwärmt]] die Erde.\nDie Erde gibt [[Wärmestrahlung]] ab.\nWie heißt der Vorgang? | Treibhauseffekt',
    reveal: true,
  },
};

const BASE: Omit<Slide, 'id' | 'layout'> = {
  type: 'uebung',
  phase: '',
  form: '',
  minutes: 0,
  label: '',
  title: '',
  text: '',
  help: '',
  items: '',
  image: '',
  source: '',
  reveal: false,
  cards: true,
  vote: false,
  build: false,
  itemAnim: 'rise',
  transition: 'none',
  elements: [],
  anims: {},
  notes: '',
};

/** A new slide of a layout, with example content that shows how it is meant. */
export function createSlide(layout: SlideLayout): Slide {
  return { ...BASE, ...LAYOUT_DEFAULTS[layout], id: uid(), layout, elements: [], anims: {} };
}

export const SLIDE_ANIMS: { v: SlideAnim; l: string }[] = [
  { v: 'none', l: 'Keine' },
  { v: 'fade', l: 'Einblenden' },
  { v: 'rise', l: 'Von unten' },
  { v: 'zoom', l: 'Zoomen' },
  { v: 'left', l: 'Von links' },
];

export const SLIDE_TRANSITIONS: { v: SlideTransition; l: string }[] = [
  { v: 'none', l: 'Keiner' },
  { v: 'fade', l: 'Überblenden' },
  { v: 'push', l: 'Schieben' },
  { v: 'zoom', l: 'Zoomen' },
];

export const ELEMENT_LABELS: Record<SlideElementKind, string> = { text: 'Textfeld', image: 'Bild', video: 'Video', qr: 'QR-Code', cover: 'Abdeckung', ink: 'Skizze' };

/** Looks of a cover (kept in its `style`): the colour of the phase, the paper (unobtrusive, e.g. on a map) or grey. */
export const COVER_LOOKS: { v: TextStyle; l: string }[] = [
  { v: 'box', l: 'Phasenfarbe' },
  { v: 'plain', l: 'Papier' },
  { v: 'note', l: 'Grau' },
];

const ELEMENT_BASE: Omit<SlideElement, 'id' | 'kind'> = {
  x: 660,
  y: 390,
  w: 600,
  h: 300,
  text: '',
  url: '',
  image: '',
  source: '',
  style: 'box',
  size: 40,
  align: 'left',
  fit: 'contain',
  step: 0,
  anim: 'fade',
  strokes: [],
  vw: 0,
  vh: 0,
};

const ELEMENT_DEFAULTS: Record<SlideElementKind, Partial<SlideElement>> = {
  text: { text: 'Text', w: 640, h: 200 },
  image: { w: 720, h: 480, x: 600, y: 330 },
  video: { w: 960, h: 540, x: 480, y: 300 },
  qr: { w: 300, h: 360, x: 1500, y: 560, text: 'Scannen!' },
  cover: { w: 320, h: 120, x: 800, y: 480, anim: 'fade' },
  ink: { w: 600, h: 300, x: 660, y: 390 },
};

/** A new element, in the middle of the slide. */
export function createElement(kind: SlideElementKind, patch: Partial<SlideElement> = {}): SlideElement {
  return { ...ELEMENT_BASE, ...ELEMENT_DEFAULTS[kind], strokes: [], ...patch, id: uid(), kind };
}

/** Defaults a slide in a file may leave out. */
export const SLIDE_DEFAULTS = BASE;

const str = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(str).join('\n') : '');

export const isSlideLayout = (x: unknown): x is SlideLayout => typeof x === 'string' && x in SLIDE_LAYOUTS;
const pick = <T extends string>(x: unknown, options: readonly { v: T }[], fallback: T): T => (options.some((o) => o.v === x) ? (x as T) : fallback);
const KINDS = Object.keys(ELEMENT_LABELS) as SlideElementKind[];
const STYLES: readonly { v: TextStyle }[] = [{ v: 'plain' }, { v: 'heading' }, { v: 'box' }, { v: 'note' }];
const num = (x: unknown, fallback: number, min: number, max: number) => {
  const n = Number(x);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

const PART_KEY = /^(title|text|label|image|gaps|item:\d{1,2}|answer:\d{1,2})$/;

/** Part animations; unknown parts are left out. */
function normalizeAnims(raw: unknown): Record<string, PartAnim> {
  const out: Record<string, PartAnim> = {};
  if (isObj(raw))
    for (const [k, v] of Object.entries(raw)) {
      if (!PART_KEY.test(k)) continue;
      const a = isObj(v) ? v : { step: v };
      out[k] = { step: num(a.step, 0, 0, 50), anim: pick(a.anim, SLIDE_ANIMS, 'fade') };
    }
  return out;
}

/** Elements of a slide, clamped to the slide. */
function normalizeElements(raw: unknown, where: string, note: (text: string) => void): SlideElement[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    note(`${where}: "elements" ist keine Liste und wurde übersprungen.`);
    return [];
  }
  const out: SlideElement[] = [];
  raw.forEach((r, i) => {
    if (!isObj(r) || !KINDS.includes(r.kind as SlideElementKind)) {
      note(`${where}, Element ${i + 1}: Die Art „${isObj(r) ? str(r.kind) : ''}“ gibt es nicht (möglich: ${KINDS.join(', ')}); es wurde weggelassen.`);
      return;
    }
    const kind = r.kind as SlideElementKind;
    const d = { ...ELEMENT_BASE, ...ELEMENT_DEFAULTS[kind] };
    const w = num(r.w, d.w, 40, 1920);
    const h = num(r.h, d.h, 40, 1080);
    out.push({
      id: typeof r.id === 'string' && r.id ? r.id : uid(),
      kind,
      x: num(r.x, d.x, 0, 1920 - w),
      y: num(r.y, d.y, 0, 1080 - h),
      w,
      h,
      text: str(r.text ?? d.text),
      url: str(r.url),
      image: str(r.image),
      source: str(r.source),
      style: pick(r.style, STYLES, d.style),
      size: num(r.size, d.size, 16, 200),
      align: r.align === 'center' ? 'center' : 'left',
      fit: r.fit === 'cover' ? 'cover' : 'contain',
      step: num(r.step, 0, 0, 50),
      anim: pick(r.anim, SLIDE_ANIMS, d.anim),
      strokes: kind === 'ink' ? normalizeStrokes(r.strokes) : [],
      vw: kind === 'ink' ? num(r.vw, w, 1, 4000) : 0,
      vh: kind === 'ink' ? num(r.vh, h, 1, 4000) : 0,
    });
  });
  return out;
}

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
      help: str(r.help),
      items: str(r.items),
      image: str(r.image),
      source: str(r.source),
      reveal: r.reveal === true,
      cards: r.cards !== false,
      vote: r.vote === true,
      build: r.build === true,
      itemAnim: pick(r.itemAnim, SLIDE_ANIMS, BASE.itemAnim),
      transition: pick(r.transition, SLIDE_TRANSITIONS, BASE.transition),
      elements: normalizeElements(r.elements, `Folie ${i + 1}`, note),
      anims: normalizeAnims(r.anims),
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

/**
 * Texts that can be edited right on the slide: "title", "text", "label", "help", "phase", "item:2" (the entry),
 * "answer:2" (its second part) and "el:<id>" (a text field).
 */
export function editText(s: Slide, target: string): string | null {
  if (target === 'title' || target === 'text' || target === 'label' || target === 'help' || target === 'phase') return s[target];
  const m = /^(item|answer):(\d+)$/.exec(target);
  if (m) return slideItems(s.items)[Number(m[2])]?.[m[1] === 'item' ? 0 : 1] ?? null;
  if (target.startsWith('el:')) return s.elements.find((e) => e.id === target.slice(3))?.text ?? null;
  return null;
}

/** The change to a slide when a text edited on the slide becomes `value`. */
export function setEditText(s: Slide, target: string, value: string): Partial<Slide> {
  if (target === 'title' || target === 'text' || target === 'label' || target === 'help' || target === 'phase')
    return { [target]: target === 'label' || target === 'phase' ? value.replace(/\n/g, ' ') : value };
  const m = /^(item|answer):(\d+)$/.exec(target);
  if (m) {
    const lines = s.items.split('\n');
    const at = lines.map((l, k) => (l.trim() ? k : -1)).filter((k) => k >= 0)[Number(m[2])];
    if (at === undefined) return {};
    const [head, second] = slideItems(lines[at])[0];
    // An entry stays one line; "|" would split it, so it becomes "/" in the entry itself.
    const one = value.replace(/\s*\n\s*/g, ' ');
    const line = m[1] === 'item' ? [one.replace(/\|/g, '/'), second] : [head, one];
    lines[at] = line[1].trim() ? `${line[0]} | ${line[1]}` : line[0];
    return { items: lines.join('\n') };
  }
  if (target.startsWith('el:')) return { elements: s.elements.map((e) => (e.id === target.slice(3) ? { ...e, text: value } : e)) };
  return {};
}

/** How many entries each layout shows (the rest are left out). */
export const ITEM_LIMIT: Partial<Record<SlideLayout, number>> = { list: 8, task: 8, work: 5, compare: 3, flow: 5, words: 12 };

/** The entries a slide shows. */
export const shownItems = (s: Slide) => (ITEM_LIMIT[s.layout] ? slideItems(s.items).slice(0, ITEM_LIMIT[s.layout]) : []);

/** Layouts whose entries have a second part (answer, text of a box, detail of a step, meaning) that can come on a click. */
const TWO_PART: SlideLayout[] = ['list', 'task', 'words', 'compare', 'flow'];

/** A gap in an entry of a task slide or in a Merksatz: "The cat [[sits]] on the mat." */
export const SLIDE_GAP = /\[\[(.+?)\]\]/g;
export const hasGap = (t: string) => /\[\[.+?\]\]/.test(t);

/** Layouts whose big sentence may have gaps that fill on a click (a Merksatz to complete). */
export const GAP_TITLE: SlideLayout[] = ['exit', 'statement'];
const titleGaps = (s: Slide) => GAP_TITLE.includes(s.layout) && hasGap(s.title);

/** Whether an entry has something that can come on a click: its second part, or the words in its gaps (task slides). */
const hasAnswer = (s: Slide, [head, second]: [string, string]) => !!second || (s.layout === 'task' && hasGap(head));

/** Whether a slide has answers, box texts, meanings or a task's solution to uncover while presenting. */
export const hasReveal = (s: Slide) => s.reveal && ((TWO_PART.includes(s.layout) && shownItems(s).some((it) => hasAnswer(s, it))) || (s.layout === 'task' && !!s.text.trim()) || titleGaps(s));

/**
 * On which click each entry and its second part appear by default (0 = with the slide). Entries one after
 * the other: with answers to uncover, question and answer take turns; otherwise one entry per click.
 * Without that, all answers come together on the first click.
 */
function defaultItemSteps(s: Slide): { item: number; answer: number }[] {
  const reveal = hasReveal(s);
  let n = 0;
  return shownItems(s).map((it, i) => {
    const a = hasAnswer(s, it);
    if (s.build) return reveal ? { item: 2 * i + 1, answer: a ? 2 * i + 2 : 0 } : { item: i + 1, answer: i + 1 };
    // Under cards each answer has its own click; otherwise they come together.
    return { item: 0, answer: reveal && a ? (s.cards ? ++n : 1) : 0 };
  });
}

/** A part of a slide's layout that can appear on its own click. */
export interface SlidePart {
  key: string;
  /** German name for the editor: "Überschrift", "Frage 2", "Antwort 2" … */
  label: string;
  step: number;
  anim: SlideAnim;
  /** Answers, box texts and meanings: shown pale in the editor while they come later than their entry. */
  answer: boolean;
}

const SECOND: Partial<Record<SlideLayout, [string, string]>> = {
  list: ['Frage', 'Antwort'],
  task: ['Eintrag', 'Lösung'],
  words: ['Wort', 'Bedeutung'],
  compare: ['Kasten', 'Text im Kasten'],
  flow: ['Schritt', 'Erklärung im Schritt'],
};

const clip = (t: string) => (t.length > 28 ? t.slice(0, 26).trimEnd() + ' …' : t);

/** The parts of a slide in reading order, with when and how they appear. */
export function slideParts(s: Slide): SlidePart[] {
  const parts: { key: string; label: string; answer?: boolean; step?: number; anim?: SlideAnim }[] = [];
  const t = !!s.text.trim();
  const titleLabel = s.layout === 'quote' ? 'Leitfrage' : s.layout === 'exit' ? 'Merksatz' : s.layout === 'task' ? 'Arbeitsauftrag' : s.layout === 'work' ? 'Kurzauftrag' : 'Überschrift';
  const textLabel: Partial<Record<SlideLayout, string>> = { title: 'Untertitel', quote: 'Zitat', statement: 'Hinweis', image: 'Text neben dem Bild', exit: 'Rückbezug', work: 'Hinweis' };
  if (s.layout === 'quote' || s.layout === 'exit') {
    if (t) parts.push({ key: 'text', label: textLabel[s.layout]! });
    if (s.title.trim()) parts.push({ key: 'title', label: titleLabel });
  } else {
    if (s.title.trim()) parts.push({ key: 'title', label: titleLabel });
    if (t && (s.layout === 'title' || s.layout === 'statement' || s.layout === 'list' || s.layout === 'words' || s.layout === 'work')) parts.push({ key: 'text', label: textLabel[s.layout] ?? 'Auftrag' });
  }
  if (titleGaps(s)) parts.push({ key: 'gaps', label: s.layout === 'exit' ? 'Lücken im Merksatz' : 'Lücken', answer: true, step: s.reveal ? 1 : 0, anim: 'fade' });
  if (s.layout === 'image' || (s.layout === 'task' && s.image)) parts.push({ key: 'image', label: 'Bild' });
  const names = s.layout === 'work' ? undefined : SECOND[s.layout];
  if (names) {
    const defaults = defaultItemSteps(s);
    shownItems(s).forEach((it, i) => {
      parts.push({ key: `item:${i}`, label: `${names[0]} ${i + 1}: ${clip(it[0].replace(SLIDE_GAP, '…').replace(/_{3,}/g, '…'))}`, step: defaults[i].item, anim: s.itemAnim });
      if (hasAnswer(s, it)) parts.push({ key: `answer:${i}`, label: `${names[1]} ${i + 1}`, answer: true, step: defaults[i].answer, anim: 'fade' });
    });
  }
  if (t && (s.layout === 'compare' || s.layout === 'flow' || s.layout === 'image')) parts.push({ key: 'text', label: textLabel[s.layout] ?? 'Satz darunter' });
  if (t && s.layout === 'task') {
    // The solution of a task: after the entries' solutions, or with them.
    const last = parts.reduce((n, p) => Math.max(n, p.step ?? 0), 0);
    parts.push({ key: 'text', label: 'Lösung', answer: true, step: s.reveal ? (s.build || s.cards ? last + 1 : Math.max(1, last)) : 0, anim: 'fade' });
  }
  return parts.map((p) => {
    const own = s.anims[p.key];
    return { key: p.key, label: p.label, answer: !!p.answer, step: own ? own.step : (p.step ?? 0), anim: own ? own.anim : (p.anim ?? 'fade') };
  });
}

/** When and how each part appears, by key. */
export const partSteps = (s: Slide): Map<string, SlidePart> => new Map(slideParts(s).map((p) => [p.key, p]));

/** On which click each entry and its second part appear (0 = with the slide). */
export function itemSteps(s: Slide): { item: number; answer: number }[] {
  const parts = partSteps(s);
  return shownItems(s).map((_, i) => ({ item: parts.get(`item:${i}`)?.step ?? 0, answer: parts.get(`answer:${i}`)?.step ?? 0 }));
}

/** Number of clicks on a slide before the next slide comes. */
export function stepCount(s: Slide): number {
  let n = s.layout === 'work' ? Math.max(0, workSteps(s).length - 1) : 0;
  for (const p of slideParts(s)) n = Math.max(n, p.step);
  for (const e of s.elements) n = Math.max(n, e.step);
  return n;
}

/** Number of gaps in a part with gaps: the Merksatz ("gaps") or an entry of a task ("answer:2"). */
export function gapCount(s: Slide, key: string): number {
  const text = key === 'gaps' ? s.title : s.layout === 'task' && key.startsWith('answer:') ? (shownItems(s)[Number(key.slice(7))]?.[0] ?? '') : '';
  return (text.match(SLIDE_GAP) ?? []).length;
}

/**
 * The next click on a slide, after what was tapped open already: a click whose answers, covers and parts were all
 * tapped open shows nothing new and is skipped. null: the slide is done. `opened` holds part keys ("answer:2",
 * "gaps"), single gaps ("gaps#1") and covers ("el:<id>").
 */
export function nextStep(s: Slide, step: number, opened: ReadonlySet<string>): number | null {
  const total = stepCount(s);
  const parts = slideParts(s);
  for (let k = step + 1; k <= total; k++) {
    if (s.layout === 'work' && k < workSteps(s).length) return k;
    if (parts.some((p) => p.step === k && !(p.answer && s.cards && opened.has(p.key)))) return k;
    if (s.elements.some((e) => e.step === k && !(e.kind === 'cover' && opened.has(`el:${e.id}`)))) return k;
  }
  return null;
}

/** A step of a work phase: "Ich: Lies M1 | 5" → the work form, the instruction and its minutes. */
export interface WorkStep {
  form: WorkForm | '';
  /** The word before the colon as written ("Ich", "Partner"), shown on the slide. */
  who: string;
  text: string;
  minutes: number;
}

const WHO: [RegExp, WorkForm][] = [
  [/^(ich|allein|einzeln|einzelarbeit|alone|on your own|think)$/i, 'allein'],
  [/^(du|zu zweit|partner|partnerarbeit|tandem|pairs?|in pairs|pair)$/i, 'zu zweit'],
  [/^(gruppe|gruppen|gruppenarbeit|team|groups?|in groups)$/i, 'Gruppe'],
  [/^(wir|plenum|alle|klasse|whole class|share|class)$/i, 'Plenum'],
];

/** The steps of a work slide. */
export function workSteps(s: Slide): WorkStep[] {
  return shownItems(s).map(([head, second]) => {
    const m = /^([^:]{1,24}):\s*(.+)$/.exec(head);
    const who = m ? m[1].trim() : '';
    const form = WHO.find(([re]) => re.test(who))?.[1] ?? '';
    const minutes = parseInt(second, 10);
    return { form, who: form ? who : '', text: form ? m![2] : head, minutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(90, minutes) : 0 };
  });
}

/** Image ids the slides use (for backups and cleaning up). */
export const slideImages = (slides: Slide[]) => slides.flatMap((s) => [s.image, ...s.elements.map((e) => e.image)]).filter(Boolean);

/** Changes every image id of the slides (packages give pictures fresh ids); '' drops a picture. */
export function mapSlideImages(s: Slide, map: (id: string) => string): Slide {
  return { ...s, image: s.image && map(s.image), elements: s.elements.map((e) => (e.image ? { ...e, image: map(e.image) } : e)) };
}

/** A slide without the fields that equal the defaults, for files. */
export function leanSlide(s: Slide): Partial<Omit<Slide, 'elements'>> & { layout: SlideLayout; elements?: Partial<SlideElement>[] } {
  const out: Record<string, unknown> = { layout: s.layout };
  for (const [k, v] of Object.entries(s)) if (k !== 'id' && k !== 'layout' && k !== 'elements' && k !== 'anims' && v !== (BASE as Record<string, unknown>)[k]) out[k] = v;
  if (Object.keys(s.anims).length) out.anims = s.anims;
  if (s.elements.length)
    out.elements = s.elements.map((e) => {
      const d: Record<string, unknown> = { ...ELEMENT_BASE, ...ELEMENT_DEFAULTS[e.kind] };
      const lean: Record<string, unknown> = { kind: e.kind };
      for (const [k, v] of Object.entries(e)) if (k !== 'id' && k !== 'kind' && v !== d[k] && !(Array.isArray(v) && !v.length)) lean[k] = v;
      return lean;
    });
  return out as ReturnType<typeof leanSlide>;
}
