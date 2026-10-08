// The slides of a lesson: thumbnails on the left, the chosen slide in the middle, its fields on the right.
// Presenting and printing (handout, PDF) start from the top bar.
import { lookName } from '../model/look';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  BringToFront,
  Copy,
  Download,
  Eye,
  FileUp,
  History,
  FileText,
  Highlighter,
  ImagePlus,
  Layers,
  Palette,
  PenLine,
  Play,
  Plus,
  Printer,
  Projector,
  QrCode,
  Redo2,
  SendToBack,
  Sparkles,
  SquareDashed,
  Trash2,
  Type,
  Undo2,
  Video,
} from 'lucide-react';
import { ImageField, NumberField, SegField, TextField } from '../editor/fields';
import { ImageSearchDialog } from '../editor/ImageSearchDialog';
import { Menu } from '../editor/TopBar';
import { markFound, pulse, type SearchFocus } from '../library/highlight';
import { SearchButton } from '../library/SearchDialog';
import { Icon } from '../icons';
import { uid } from '../model/ops';
import {
  COVER_LOOKS,
  createElement,
  createSlide,
  ELEMENT_LABELS,
  GAP_TITLE,
  SLIDE_DESIGNS,
  hasGap,
  ITEM_LIMIT,
  SLIDE_ANIMS,
  SLIDE_LAYOUT_ORDER,
  SLIDE_LAYOUTS,
  SLIDE_TRANSITIONS,
  setEditText,
  slideParts,
  stepCount,
  type PartAnim,
  type SlidePart,
  type Slide,
  type SlideAnim,
  type SlideDesign,
  type SlideElement,
  type SlideElementKind,
  type SlideLayout,
  type SlideTransition,
  type TextStyle,
} from '../model/slides';
import { SHEET_TYPES, THEMES, WORK_FORMS } from '../model/themes';
import type { SheetType, WorkForm } from '../model/types';
import { storeImageFile } from '../storage/images';
import { topicIcon } from '../topicIcons';
import { suggestSlides, type SuggestOptions, type SuggestSection } from './fromDoc';
import { SuggestDialog } from './SuggestDialog';
import { enterFullscreen, Presenter } from './Presenter';
import { PptxDialog, PptxImportDialog } from './PptxDialog';
import { openSpeakerWindows, type SpeakerWindows } from './speaker';
import type { PptxRead } from './pptxImport';
import { BoardsDialog } from './BoardsDialog';
import { mapStrokes, MAX_BOARDS, strokeBounds, type Board, type Stroke } from '../model/ink';
import { PenBar, usePenSettings } from './Pen';
import { SlidesPrint, type SlidesPrintKind } from './SlidesPrint';
import { SlideStage } from './SlideStage';
import { SLIDE_H, SLIDE_W, SlideBox, type SlideContext } from './SlideView';
import { videoInfo } from './elements';
import type { Doc } from '../model/types';

interface SlidesViewProps {
  slides: Slide[];
  ctx: SlideContext;
  /** The lesson's worksheets, to suggest first slides. */
  doc: Doc;
  lessonTitle: string;
  /** Earlier lessons for the recall slide of the suggestion. */
  suggest?: SuggestOptions;
  place: string;
  onChange(slides: Slide[]): void;
  /** A design for all slides of the lesson. */
  onDesign(design: SlideDesign): void;
  /** Earlier versions of the lesson. */
  onVersions?(): void;
  /** Saved Tafelbilder of the lesson (newest first) and keeping them. */
  boards: Board[];
  onBoards(boards: Board[]): void;
  onBack(): void;
  onOpenSheet(): void;
  /** A slide found by the search: shown, its words marked. */
  focus?: SearchFocus;
  /** Start presenting right away (from a "Präsentieren" in the module or the worksheet). */
  present?: boolean;
  onPresentStarted?(): void;
}

const MAX_HISTORY = 60;

/** A text area with buttons that mark the selected words **bold** or {{coloured}}. */
function RichArea({ label, value, rows = 3, onChange, inputRef }: { label: string; value: string; rows?: number; onChange(v: string): void; inputRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  const id = useId();
  const own = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? own;
  const wrap = (open: string, close: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const inner = value.slice(a, b) || 'Text';
    onChange(value.slice(0, a) + open + inner + close + value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + open.length, a + open.length + inner.length);
    });
  };
  return (
    <div className="field">
      <div className="sl-rich-head">
        <label htmlFor={id}>{label}</label>
        <span className="sl-rich-tools">
          <button type="button" className="iconbtn" title="Fett" aria-label="Markierte Wörter fett" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap('**', '**')}>
            <Icon icon={Bold} size={15} />
          </button>
          <button type="button" className="iconbtn" title="Farbig markieren" aria-label="Markierte Wörter farbig" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap('{{', '}}')}>
            <Icon icon={Highlighter} size={15} />
          </button>
        </span>
      </div>
      <textarea id={id} ref={ref} className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const INSERT: { kind: SlideElementKind; icon: typeof Type }[] = [
  { kind: 'text', icon: Type },
  { kind: 'image', icon: ImagePlus },
  { kind: 'video', icon: Video },
  { kind: 'qr', icon: QrCode },
  { kind: 'cover', icon: SquareDashed },
];

const TEXT_STYLES: { v: TextStyle; l: string }[] = [
  { v: 'box', l: 'Kasten' },
  { v: 'note', l: 'Notizzettel' },
  { v: 'plain', l: 'Schlicht' },
  { v: 'heading', l: 'Überschrift' },
];

const REVEAL_LABEL: Partial<Record<SlideLayout, string>> = {
  list: 'Antworten (Lösungen) beim Präsentieren',
  task: 'Lösungen beim Präsentieren',
  words: 'Bedeutungen beim Präsentieren',
  compare: 'Text in den Kästen beim Präsentieren',
  flow: 'Erklärungen in den Schritten beim Präsentieren',
};

const TEXT_SIZES = [
  { v: 28, l: 'S' },
  { v: 40, l: 'M' },
  { v: 56, l: 'L' },
  { v: 80, l: 'XL' },
  { v: 120, l: 'XXL' },
];

export function SlidesView(p: SlidesViewProps) {
  const [sel, setSel] = useState(0);
  const [past, setPast] = useState<Slide[][]>([]);
  const [future, setFuture] = useState<Slide[][]>([]);
  const lastEdit = useRef('');
  // Started from a "Präsentieren" elsewhere (module, worksheet): present from the first slide.
  const [presenting, setPresenting] = useState<number | null>(p.present && p.slides.length ? 0 : null);
  useEffect(() => {
    if (p.present) p.onPresentStarted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** The second window of the Referentenansicht. */
  const [speaker, setSpeaker] = useState<SpeakerWindows | null>(null);
  const [printing, setPrinting] = useState<SlidesPrintKind | null>(null);
  /** A Tafelbild to print, or to start presenting with. */
  const [printBoard, setPrintBoard] = useState<Board | null>(null);
  const [startBoard, setStartBoard] = useState<Board | null>(null);
  const [showBoards, setShowBoards] = useState(false);
  /** The suggestion as a list to tick, or single slides from the worksheet to put in. */
  const [suggesting, setSuggesting] = useState<{ mode: 'suggest' | 'pick'; sections: SuggestSection[] } | null>(null);
  /** Sketching on the slide: a new sketch (id null) or one being changed, with its strokes in slide pixels. */
  const [sketch, setSketch] = useState<{ slideId: string; id: string | null; strokes: Stroke[]; past: Stroke[][] } | null>(null);
  const [sketchLive, setSketchLive] = useState<Stroke | null>(null);
  const [pen, setPen] = usePenSettings();
  const [picker, setPicker] = useState(false);
  const [designing, setDesigning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imported, setImported] = useState<(PptxRead & { fileName: string }) | null>(null);
  const pptxInput = useRef<HTMLInputElement>(null);
  const openPptx = async (file: File) => {
    try {
      const { readPptx } = await import('./pptxImport');
      setImported({ ...(await readPptx(file, storeImageFile)), fileName: file.name });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Die PowerPoint-Datei konnte nicht gelesen werden.');
    }
  };
  const takeImported = (replace: boolean) => {
    if (!imported) return;
    const at = replace ? 0 : slides.length;
    commit(replace ? imported.slides : [...slides, ...imported.slides]);
    if ((replace || !slides.length) && imported.design) p.onDesign(imported.design);
    pick(at);
    setImported(null);
  };
  const [searching, setSearching] = useState<'slide' | 'slide-ai' | 'element' | null>(null);
  const [selEl, setSelEl] = useState<string | null>(null);
  const [selPart, setSelPart] = useState<string | null>(null);
  const elText = useRef<HTMLTextAreaElement>(null);
  const slides = p.slides;
  // For changes that arrive later (a stored picture): the slides as they are then.
  const latest = useRef(slides);
  latest.current = slides;
  const i = Math.min(sel, Math.max(0, slides.length - 1));
  const slide = slides[i] as Slide | undefined;
  const el = slide?.elements.find((e) => e.id === selEl) ?? null;
  const partInfo = slide && selPart ? (slideParts(slide).find((x) => x.key === selPart) ?? null) : null;
  /** When a part of the layout appears: its own click and animation, or back to what build/reveal give. */
  const setPartAnim = (key: string, a: PartAnim | null) => {
    if (!slide) return;
    const anims = { ...slide.anims };
    if (a) anims[key] = a;
    else delete anims[key];
    set({ anims }, `anim.${key}`);
  };
  const clearSteps = () => slide && set({ anims: {}, build: false, reveal: false, elements: slide.elements.map((e) => ({ ...e, step: 0 })) });
  const pick = (k: number) => {
    setSel(k);
    setSelEl(null);
    setSelPart(null);
  };

  // A jump from the search: show the slide and mark the words found.
  useEffect(() => {
    const f = p.focus;
    const k = f ? latest.current.findIndex((s) => s.id === f.id) : -1;
    if (!f || k < 0) return;
    pick(k);
    const t = setTimeout(() => {
      const thumb = document.querySelector('.sl-thumb-wrap.is-on');
      thumb?.scrollIntoView({ block: 'nearest' });
      if (thumb) pulse(thumb);
      const shown = stage.current?.querySelector('.sl-slide');
      if (shown) markFound(shown, f.query);
    }, 150);
    return () => clearTimeout(t);
  }, [p.focus?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Every change goes through here; edits of the same field one after another make one undo step. */
  const commit = useCallback(
    (next: Slide[], mergeKey = '') => {
      if (!mergeKey || mergeKey !== lastEdit.current) {
        setPast((h) => [...h.slice(-MAX_HISTORY + 1), p.slides]);
        setFuture([]);
      }
      lastEdit.current = mergeKey;
      p.onChange(next);
    },
    [p],
  );
  const undo = useCallback(
    (redo = false) => {
      const from = redo ? future : past;
      if (!from.length) return;
      const prev = from[from.length - 1];
      if (redo) {
        setFuture(from.slice(0, -1));
        setPast((h) => [...h, p.slides]);
      } else {
        setPast(from.slice(0, -1));
        setFuture((f) => [...f, p.slides]);
      }
      lastEdit.current = '';
      p.onChange(prev);
    },
    [past, future, p],
  );

  const set = (patch: Partial<Slide>, key = '') =>
    slide &&
    commit(
      slides.map((s, k) => (k === i ? { ...s, ...patch } : s)),
      key && `${slide.id}.${key}`,
    );
  const setPicture = (id: string, file: File, source?: string) =>
    storeImageFile(file)
      .then((image) => commit(latest.current.map((s) => (s.id === id ? { ...s, image, ...(source !== undefined ? { source } : {}) } : s))))
      .catch(() => window.alert('Das Bild konnte nicht gespeichert werden.'));
  const setElements = (elements: SlideElement[], key = '') => set({ elements }, key);
  const setEl = (patch: Partial<SlideElement>, key = '') =>
    slide &&
    el &&
    setElements(
      slide.elements.map((e) => (e.id === el.id ? { ...e, ...patch } : e)),
      key && `${el.id}.${key}`,
    );
  const addEl = (kind: SlideElementKind) => {
    if (!slide) return;
    // New elements step a little to the side, so they do not cover each other.
    const k = slide.elements.length % 6;
    // A cover goes on the next click (and when tapped).
    const e = createElement(kind, kind === 'cover' ? { step: stepCount(slide) + 1 } : {});
    const placed = { ...e, x: Math.min(1920 - e.w, e.x + k * 40), y: Math.min(1080 - e.h, e.y + k * 40) };
    setElements([...slide.elements, placed]);
    setSelEl(placed.id);
    if (kind === 'text' || kind === 'video' || kind === 'qr') requestAnimationFrame(() => document.getElementById(`sl-el-${kind}`)?.focus());
  };

  /** Starts sketching: a new sketch, or the chosen one with its strokes back on the whole slide. */
  const startSketch = (e: SlideElement | null) => {
    if (!slide) return;
    setSelEl(null);
    setSelPart(null);
    if (!e) return setSketch({ slideId: slide.id, id: null, strokes: [], past: [] });
    const sx = e.w / (e.vw || e.w);
    const sy = e.h / (e.vh || e.h);
    setSketch({ slideId: slide.id, id: e.id, strokes: mapStrokes(e.strokes, (x, y) => [e.x + x * sx, e.y + y * sy], Math.min(sx, sy)), past: [] });
  };
  /** Done sketching: the strokes become one sketch element in the box around them (none: the sketch goes). */
  const endSketch = () => {
    const target = sketch && slides.find((s) => s.id === sketch.slideId);
    if (!sketch || !target) return setSketch(null);
    const setOn = (elements: SlideElement[]) => commit(slides.map((s) => (s.id === target.id ? { ...s, elements } : s)));
    const box = strokeBounds(sketch.strokes);
    const rest = target.elements.filter((e) => e.id !== sketch.id);
    const old = target.elements.find((e) => e.id === sketch.id);
    if (!box) {
      if (old) setOn(rest);
    } else {
      const x = Math.max(0, box.x);
      const y = Math.max(0, box.y);
      const w = Math.max(40, Math.min(1920 - x, box.w - (x - box.x)));
      const h = Math.max(40, Math.min(1080 - y, box.h - (y - box.y)));
      const strokes = mapStrokes(sketch.strokes, (px, py) => [px - x, py - y]);
      const el = old
        ? { ...old, x, y, w, h, strokes, vw: w, vh: h }
        : createElement('ink', { x, y, w, h, strokes, vw: w, vh: h, step: stepCount(target) + 1, anim: 'fade' });
      setOn(old ? target.elements.map((e) => (e.id === old.id ? el : e)) : [...target.elements, el]);
      if (target.id === slide?.id) setSelEl(el.id);
    }
    setSketch(null);
    setSketchLive(null);
  };
  // Another slide: the sketch is done.
  useEffect(() => {
    if (sketch && slide?.id !== sketch.slideId) endSketch();
  }, [slide?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Keeps a Tafelbild made while presenting (the newest first, at most MAX_BOARDS). */
  const saveBoard = (b: Board) => p.onBoards([b, ...p.boards].slice(0, MAX_BOARDS));
  const removeEl = () => {
    if (!slide || !el) return;
    setElements(slide.elements.filter((e) => e.id !== el.id));
    setSelEl(null);
  };
  const duplicateEl = () => {
    if (!slide || !el) return;
    const copy = { ...el, id: uid(), x: Math.min(1920 - el.w, el.x + 40), y: Math.min(1080 - el.h, el.y + 40) };
    setElements([...slide.elements, copy]);
    setSelEl(copy.id);
  };
  const layerEl = (front: boolean) => {
    if (!slide || !el) return;
    const rest = slide.elements.filter((e) => e.id !== el.id);
    setElements(front ? [...rest, el] : [el, ...rest]);
  };
  const setElPicture = (slideId: string, elId: string, file: File, source?: string) =>
    storeImageFile(file)
      .then((image) =>
        commit(latest.current.map((s) => (s.id !== slideId ? s : { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, image, ...(source !== undefined ? { source } : {}) } : e)) }))),
      )
      .catch(() => window.alert('Das Bild konnte nicht gespeichert werden.'));

  const add = (layout: SlideLayout) => {
    const s = createSlide(layout);
    const at = slides.length ? i + 1 : 0;
    commit([...slides.slice(0, at), s, ...slides.slice(at)]);
    pick(at);
    setPicker(false);
  };
  const move = (dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
    pick(j);
  };
  const duplicate = () => {
    if (!slide) return;
    commit([...slides.slice(0, i + 1), { ...slide, id: uid(), elements: slide.elements.map((e) => ({ ...e, id: uid() })) }, ...slides.slice(i + 1)]);
    pick(i + 1);
  };
  const remove = (at = i) => {
    commit(slides.filter((_, k) => k !== at));
    pick(Math.max(0, Math.min(at, slides.length - 2)));
  };
  const removeAll = () => {
    if (!slides.length || !window.confirm(`Alle ${slides.length} Folien dieser Stunde löschen? Mit „Rückgängig“ (⌘Z) holst du sie zurück, solange die Folien offen sind.`)) return;
    commit([]);
    pick(0);
  };
  const suggest = (mode: 'suggest' | 'pick' = 'suggest') => setSuggesting({ mode, sections: suggestSlides(p.doc, p.lessonTitle, p.suggest) });
  const takeSuggested = (made: Slide[], how: 'replace' | 'append' | 'insert') => {
    setSuggesting(null);
    if (how === 'replace') {
      commit(made);
      pick(0);
    } else if (how === 'append') {
      commit([...slides, ...made]);
      pick(slides.length);
    } else {
      const at = slides.length ? i + 1 : 0;
      commit([...slides.slice(0, at), ...made, ...slides.slice(at)]);
      pick(at);
    }
  };

  // Keyboard: undo/redo, arrows move between slides (not while typing).
  useEffect(() => {
    if (presenting !== null || printing || printBoard || showBoards || suggesting) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest('input, textarea, select') || e.target.isContentEditable);
      // Sketching: ⌘Z takes back the last stroke, Esc finishes.
      if (sketch && !typing) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && sketch.past.length) {
          e.preventDefault();
          setSketch({ ...sketch, strokes: sketch.past[sketch.past.length - 1], past: sketch.past.slice(0, -1) });
        } else if (e.key === 'Escape') endSketch();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        undo(e.shiftKey);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el) {
        // A chosen element: arrows nudge it (Shift: further), Delete removes it, Esc lets it go.
        const by = e.shiftKey ? 50 : 10;
        const nudge: Record<string, [number, number]> = { ArrowLeft: [-by, 0], ArrowRight: [by, 0], ArrowUp: [0, -by], ArrowDown: [0, by] };
        if (nudge[e.key]) {
          const [dx, dy] = nudge[e.key];
          setEl({ x: Math.min(1920 - el.w, Math.max(0, el.x + dx)), y: Math.min(1080 - el.h, Math.max(0, el.y + dy)) }, 'nudge');
        } else if (e.key === 'Delete' || e.key === 'Backspace') removeEl();
        else if (e.key === 'Escape') setSelEl(null);
        else return;
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape' && selPart) setSelPart(null);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') pick(Math.min(slides.length - 1, i + 1));
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') pick(Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // The slide in the middle fills the space it has.
  const stage = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(800);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setStageW(Math.max(240, Math.min(el.clientWidth - 32, ((el.clientHeight - 80) * SLIDE_W) / SLIDE_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
    // Measured again when the stage comes back after presenting or printing.
  }, [slides.length > 0, presenting === null, !printing && !printBoard]);

  if (presenting !== null)
    return (
      <Presenter
        slides={slides}
        ctx={p.ctx}
        start={presenting}
        speaker={speaker}
        boards={p.boards}
        board={startBoard}
        onSaveBoard={saveBoard}
        onClose={(k) => {
          setPresenting(null);
          setSpeaker(null);
          setStartBoard(null);
          pick(k);
        }}
      />
    );
  if (printing) return <SlidesPrint kind={printing} slides={slides} ctx={p.ctx} title={p.lessonTitle} onClose={() => setPrinting(null)} />;
  if (printBoard) return <SlidesPrint kind="board" board={printBoard} slides={slides} ctx={p.ctx} title={p.lessonTitle} onClose={() => setPrintBoard(null)} />;

  const info = slide ? SLIDE_LAYOUTS[slide.layout] : null;
  const revealLabel = slide && (REVEAL_LABEL[slide.layout] ?? (GAP_TITLE.includes(slide.layout) && hasGap(slide.title) ? 'Lücken beim Präsentieren' : ''));
  return (
    <div className="app sl-app">
      <header className="topbar topbar-ed">
        <button type="button" className="iconbtn topbar-back" onClick={p.onBack} title="Zum Modul" aria-label="Zum Modul">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={topicIcon(p.ctx.icon)} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title" title={p.place}>{p.place.split(' · ').at(-1)}</div>
          <div className="topbar-place">Folien · {p.place.split(' · ').slice(0, -1).join(' · ')}</div>
        </div>
        <SearchButton />
        <div className="seg sl-undo">
          <button type="button" className="iconbtn" disabled={!past.length} onClick={() => undo()} title="Rückgängig (⌘Z)" aria-label="Rückgängig">
            <Icon icon={Undo2} />
          </button>
          <button type="button" className="iconbtn" disabled={!future.length} onClick={() => undo(true)} title="Wiederholen (⇧⌘Z)" aria-label="Wiederholen">
            <Icon icon={Redo2} />
          </button>
        </div>
        <button type="button" className="btn btn-secondary ui-btn" onClick={p.onOpenSheet} title="Das Arbeitsblatt der Stunde">
          <Icon icon={FileText} />
          <span className="btn-label">Arbeitsblatt</span>
        </button>
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setDesigning(true)} title="Design aller Folien dieser Stunde">
          <Icon icon={Palette} />
          <span className="btn-label">Design</span>
        </button>
        <Menu
          label="Folien"
          icon={Layers}
          items={[
            { label: 'Folie löschen', icon: Trash2, onClick: () => slides.length && remove() },
            { label: 'Alle Folien löschen …', icon: Trash2, onClick: removeAll },
            { label: 'Neu aus dem Arbeitsblatt vorschlagen …', icon: Sparkles, onClick: () => suggest() },
            { label: 'Aus dem Arbeitsblatt einfügen …', icon: FileText, onClick: () => suggest('pick') },
            { label: `Tafelbilder${p.boards.length ? ` · ${p.boards.length}` : ''} …`, icon: PenLine, onClick: () => setShowBoards(true) },
            { label: 'PowerPoint öffnen …', icon: FileUp, onClick: () => pptxInput.current?.click() },
            { label: 'Als PowerPoint sichern …', icon: Download, onClick: () => slides.length && setExporting(true) },
            ...(p.onVersions ? [{ label: 'Frühere Fassungen …', icon: History, onClick: p.onVersions }] : []),
          ]}
        />
        <Menu
          label="Drucken"
          icon={Printer}
          items={[
            { label: 'Handout: zwei Folien je Seite, ohne Lösungen', icon: Printer, onClick: () => slides.length && setPrinting('handout') },
            { label: 'Mit Sprechernotizen (für dich)', icon: Printer, onClick: () => slides.length && setPrinting('notes') },
            { label: 'Folien als PDF (Querformat)', icon: Printer, onClick: () => slides.length && setPrinting('slides') },
          ]}
        />
        <button
          type="button"
          className="btn btn-primary ui-btn sl-present-btn"
          disabled={!slides.length}
          title="Präsentieren ab dieser Folie"
          onClick={() => {
            enterFullscreen();
            setPresenting(i);
          }}
        >
          <Icon icon={Play} />
          <span className="btn-label">Präsentieren</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary ui-btn sl-speaker-btn"
          disabled={!slides.length}
          title="Beamer als zweiter Bildschirm: die Klasse sieht die Folien, du siehst die nächste Folie, Notizen, Uhr und Werkzeuge"
          onClick={async () => {
            const r = await openSpeakerWindows();
            if ('error' in r) window.alert(r.error);
            else if ('again' in r) window.alert(r.again);
            else {
              setSpeaker(r);
              setPresenting(i);
            }
          }}
        >
          <Icon icon={Projector} />
          <span className="btn-label">Referentenansicht</span>
        </button>
      </header>

      <div className="sl-work">
        <nav className="sl-thumbs" aria-label="Folien">
          {slides.map((s, k) => (
            <div key={s.id} className={'sl-thumb-wrap' + (k === i ? ' is-on' : '')}>
              <button
                type="button"
                className={'sl-thumb' + (k === i ? ' is-on' : '')}
                aria-current={k === i}
                onClick={() => pick(k)}
                onKeyDown={(e) => {
                  // Delete or Backspace on a chosen slide removes it (⌘Z brings it back).
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    e.stopPropagation();
                    remove(k);
                  }
                }}
              >
                <span className="sl-thumb-num">{k + 1}</span>
                <SlideBox slide={s} number={k + 1} ctx={p.ctx} width={176} />
              </button>
              <button type="button" className="iconbtn sl-thumb-del" title={`Folie ${k + 1} löschen`} aria-label={`Folie ${k + 1} löschen`} onClick={() => remove(k)}>
                <Icon icon={Trash2} size={15} />
              </button>
            </div>
          ))}
          <div className="sl-add">
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPicker((o) => !o)} aria-expanded={picker}>
              <Icon icon={Plus} />
              Folie
            </button>
          </div>
        </nav>

        <main className="sl-stage" ref={stage}>
          {slide && sketch && (
            <div className="sl-insert is-sketch">
              <PenBar
                s={pen}
                set={setPen}
                place="inline"
                canUndo={sketch.past.length > 0}
                onUndo={() => setSketch({ ...sketch, strokes: sketch.past[sketch.past.length - 1], past: sketch.past.slice(0, -1) })}
                onClear={() => sketch.strokes.length && setSketch({ ...sketch, strokes: [], past: [...sketch.past, sketch.strokes] })}
                onBlank={() => {}}
                onClose={endSketch}
                editor={
                  <>
                    <button type="button" className="sl-pill" onClick={() => (setSketch(null), setSketchLive(null))}>
                      Abbrechen
                    </button>
                    <button type="button" className="sl-pill is-main" onClick={endSketch}>
                      Fertig
                    </button>
                  </>
                }
              />
            </div>
          )}
          {slide && !sketch && (
            <div className="sl-insert" role="toolbar" aria-label="Einfügen">
              {INSERT.map(({ kind, icon }) => (
                <button key={kind} type="button" className="btn btn-secondary ui-btn" onClick={() => addEl(kind)} title={kind === 'cover' ? 'Rechteck, das einen Teil der Folie verdeckt, bis es angetippt wird oder sein Klick kommt' : undefined}>
                  <Icon icon={icon} />
                  <span className="btn-label">{ELEMENT_LABELS[kind]}</span>
                </button>
              ))}
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => startSketch(null)} title="Mit Stift, Maus oder Finger auf die Folie zeichnen; die Skizze erscheint beim Präsentieren auf Klick">
                <Icon icon={PenLine} />
                <span className="btn-label">Zeichnen</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary ui-btn sl-insert-preview"
                onClick={() => {
                  enterFullscreen();
                  setPresenting(i);
                }}
                title="Ab dieser Folie präsentieren, mit Animationen"
              >
                <Icon icon={Eye} />
                <span className="btn-label">Ab hier zeigen</span>
              </button>
            </div>
          )}
          {slide ? (
            <SlideStage
              slide={slide}
              number={i + 1}
              ctx={p.ctx}
              width={stageW}
              selected={selEl}
              onSelect={setSelEl}
              selectedPart={selPart}
              onPart={setSelPart}
              onBox={(id, box) => setElements(slide.elements.map((e) => (e.id === id ? { ...e, ...box } : e)))}
              onOpen={(id) => {
                setSelEl(id);
                requestAnimationFrame(() => elText.current?.focus());
              }}
              onEditText={(target, value) => set(setEditText(slide, target, value), `edit.${target}`)}
              sketch={
                sketch
                  ? {
                      strokes: sketch.strokes,
                      live: sketchLive,
                      pen,
                      hide: sketch.id,
                      onBegin: () => setSketch((x) => x && { ...x, past: [...x.past.slice(-60), x.strokes] }),
                      onChange: (strokes) => setSketch((x) => x && { ...x, strokes }),
                      onLive: setSketchLive,
                    }
                  : null
              }
            />
          ) : (
            <div className="sl-empty">
              <p className="lib-empty">Noch keine Folien für diese Stunde.</p>
              <button type="button" className="btn btn-primary ui-btn" onClick={() => suggest()}>
                <Icon icon={Sparkles} />
                Folien aus dem Arbeitsblatt vorschlagen
              </button>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPicker(true)}>
                <Icon icon={Plus} />
                Leere Folie wählen
              </button>
            </div>
          )}
          {designing && (
            <div className="sl-picker" role="dialog" aria-label="Design der Folien">
              <div className="panel-section-label">Design für alle Folien dieser Stunde</div>
              <div className="sl-picker-grid is-designs">
                {SLIDE_DESIGNS.map((d) => (
                  <button
                    key={d.v}
                    type="button"
                    className={'sl-picker-item' + (d.v === p.ctx.design ? ' is-on' : '')}
                    aria-pressed={d.v === p.ctx.design}
                    onClick={() => {
                      p.onDesign(d.v);
                      setDesigning(false);
                    }}
                  >
                    <SlideBox slide={slide ?? createSlide('task')} number={i + 1} ctx={{ ...p.ctx, design: d.v }} width={264} />
                    <b>{d.v === 'organisch' && p.ctx.look ? `Fachdesign „${lookName(p.ctx.look)}“` : d.l}</b>
                    <span>{d.v === 'organisch' && p.ctx.look ? 'Wie die Arbeitsblätter des Moduls (im Modul einstellbar)' : d.use}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setDesigning(false)}>
                Schließen
              </button>
            </div>
          )}
          {picker && (
            <div className="sl-picker" role="dialog" aria-label="Neue Folie">
              <div className="panel-section-label">Neue Folie nach Folie {slides.length ? i + 1 : 0}</div>
              <div className="sl-picker-grid">
                {SLIDE_LAYOUT_ORDER.map((l) => (
                  <button key={l} type="button" className="sl-picker-item" onClick={() => add(l)}>
                    <SlideBox slide={createSlide(l)} number={1} ctx={p.ctx} width={160} />
                    <b>{SLIDE_LAYOUTS[l].label}</b>
                    <span>{SLIDE_LAYOUTS[l].use}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPicker(false)}>
                Abbrechen
              </button>
            </div>
          )}
        </main>

        <aside className="panel is-open sl-panel" aria-label="Eigenschaften der Folie">
          {slide && el ? (
            <ElementPanel
              el={el}
              slide={slide}
              textRef={elText}
              onChange={setEl}
              onBack={() => setSelEl(null)}
              onDuplicate={duplicateEl}
              onRemove={removeEl}
              onLayer={layerEl}
              onPicture={(file) => setElPicture(slide.id, el.id, file)}
              onSearch={() => setSearching('element')}
              onSketch={() => startSketch(el)}
            />
          ) : slide && partInfo ? (
            <PartPanel part={partInfo} own={!!slide.anims[partInfo.key]} nextStep={stepCount(slide) + 1} onChange={(a) => setPartAnim(partInfo.key, a)} onBack={() => setSelPart(null)} />
          ) : slide && info ? (
            <>
              <div className="panel-head">
                <div className="panel-title">Folie {i + 1}</div>
              </div>
              <div className="panel-section">
                <div className="field">
                  <label htmlFor="sl-layout">Art der Folie</label>
                  <select id="sl-layout" className="input" value={slide.layout} onChange={(e) => set({ layout: e.target.value as SlideLayout })}>
                    {SLIDE_LAYOUT_ORDER.map((l) => (
                      <option key={l} value={l}>
                        {SLIDE_LAYOUTS[l].label}
                      </option>
                    ))}
                  </select>
                  <p className="panel-note">{info.use}</p>
                </div>
                {slide.layout !== 'title' && (
                  <>
                    <SegField<SheetType>
                      label="Farbe wie der Blatt-Typ"
                      value={slide.type}
                      options={SHEET_TYPES.map((k) => ({ v: k, l: k === 'lehrkraft' ? 'Neutral' : THEMES[k].label }))}
                      onPick={(type) => set({ type })}
                    />
                    <TextField label="Phase (Feld in der Kopfleiste)" value={slide.phase} onChange={(phase) => set({ phase }, 'phase')} />
                    <SegField<WorkForm | ''> label="Sozialform" value={slide.form} options={[{ v: '', l: 'keine' }, ...WORK_FORMS.map((v) => ({ v, l: v }))]} onPick={(form) => set({ form })} />
                    <NumberField label="Minuten (0 = keine Angabe)" value={slide.minutes} min={0} max={90} onChange={(minutes) => set({ minutes }, 'minutes')} />
                  </>
                )}
              </div>
              <div className="panel-section">
                {info.labelHint && <TextField label={info.labelHint} value={slide.label} onChange={(label) => set({ label }, 'label')} />}
                <RichArea
                  label={slide.layout === 'quote' ? 'Leitfrage' : slide.layout === 'task' ? 'Arbeitsauftrag' : 'Überschrift'}
                  rows={2}
                  value={slide.title}
                  onChange={(title) => set({ title }, 'title')}
                />
                {slide.layout === 'task' && <RichArea label="Hilfe unter dem Auftrag (z. B. auf Deutsch)" rows={2} value={slide.help} onChange={(help) => set({ help }, 'help')} />}
                {info.text && <RichArea label={info.text} value={slide.text} onChange={(text) => set({ text }, 'text')} />}
                {info.items && <RichArea label={info.items} rows={5} value={slide.items} onChange={(items) => set({ items }, 'items')} />}
                {revealLabel && (
                  <SegField<boolean>
                    label={revealLabel}
                    value={slide.reveal}
                    options={[
                      { v: true, l: 'erst auf Klick' },
                      { v: false, l: 'gleich zeigen' },
                    ]}
                    onPick={(reveal) => set({ reveal })}
                  />
                )}
                {revealLabel && slide.reveal && (
                  <SegField<boolean>
                    label="Bis dahin"
                    value={slide.cards}
                    options={[
                      { v: true, l: 'unter Karten (antippen)' },
                      { v: false, l: 'unsichtbar' },
                    ]}
                    onPick={(cards) => set({ cards })}
                  />
                )}
                {slide.layout === 'compare' && (
                  <SegField<boolean>
                    label="Abstimmung"
                    value={slide.vote}
                    options={[
                      { v: false, l: 'nein' },
                      { v: true, l: 'Antippen zählt Hände' },
                    ]}
                    onPick={(vote) => set({ vote })}
                  />
                )}
                {(slide.layout === 'image' || slide.layout === 'full' || slide.layout === 'task') && (
                  <>
                    <ImageField
                      label="Bild"
                      hasImage={!!slide.image}
                      onFile={(file) => setPicture(slide.id, file)}
                      onRemove={() => set({ image: '', source: '' })}
                      onSearch={() => setSearching('slide')}
                      onGenerate={() => setSearching('slide-ai')}
                    />
                    <TextField label="Quelle" value={slide.source} onChange={(source) => set({ source }, 'source')} />
                    <TextField label="Suchwörter (englisch)" value={slide.search} onChange={(search) => set({ search }, 'search')} />
                    <TextField label="Bildbeschreibung für KI" value={slide.describe} onChange={(describe) => set({ describe }, 'describe')} />
                  </>
                )}
                <p className="panel-note">
                  Doppelklick auf einen Text der Folie (iPad: zweimal tippen) schreibt direkt dort. Wörter markieren und B drücken schreibt sie fett, der Marker hebt sie farbig hervor.
                </p>
              </div>
              <div className="panel-section">
                <div className="panel-section-label">Animation</div>
                {ITEM_LIMIT[slide.layout] && (
                  <>
                    <SegField<boolean>
                      label={slide.layout === 'list' && slide.reveal ? 'Fragen und Antworten' : 'Einträge'}
                      value={slide.build}
                      options={[
                        { v: false, l: 'alle gleich' },
                        { v: true, l: 'nacheinander, je Klick' },
                      ]}
                      onPick={(build) => set({ build })}
                    />
                    {slide.build && <SegField<SlideAnim> label="So erscheinen die Einträge" value={slide.itemAnim} options={SLIDE_ANIMS} onPick={(itemAnim) => set({ itemAnim })} />}
                  </>
                )}
                <SegField<SlideTransition> label="Übergang zu dieser Folie" value={slide.transition} options={SLIDE_TRANSITIONS} onPick={(transition) => set({ transition })} />
                <Sequence
                  slide={slide}
                  onPart={(key) => {
                    setSelEl(null);
                    setSelPart(key);
                  }}
                  onElement={(id) => {
                    setSelPart(null);
                    setSelEl(id);
                  }}
                  onClear={clearSteps}
                />
                <p className="panel-note">Tippe auf der Folie auf einen Teil (Überschrift, Frage, Antwort, Kasten …) oder ein eingefügtes Element, um festzulegen, auf welchem Klick er erscheint.</p>
              </div>
              <div className="panel-section">
                <RichArea label="Sprechernotizen (nur für dich, Taste N beim Präsentieren)" rows={4} value={slide.notes} onChange={(notes) => set({ notes }, 'notes')} />
              </div>
              <div className="panel-row">
                <button type="button" className="iconbtn" disabled={i === 0} onClick={() => move(-1)} title="Nach vorne" aria-label="Nach vorne">
                  <Icon icon={ArrowUp} />
                </button>
                <button type="button" className="iconbtn" disabled={i === slides.length - 1} onClick={() => move(1)} title="Nach hinten" aria-label="Nach hinten">
                  <Icon icon={ArrowDown} />
                </button>
                <button type="button" className="btn btn-secondary ui-btn" onClick={duplicate}>
                  <Icon icon={Copy} />
                  Duplizieren
                </button>
                <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={() => remove()}>
                  <Icon icon={Trash2} />
                  Löschen
                </button>
              </div>
            </>
          ) : (
            <div className="panel-intro">
              <div className="panel-title">Folien</div>
              <p className="panel-help">
                Folien für die Tafel oder den Beamer, im Stil der Arbeitsblätter. Der Baukasten kann sie aus dem Arbeitsblatt vorschlagen; danach kürzt und ergänzt du sie hier. Beim Präsentieren
                blättern Pfeiltasten, Leertaste oder ein Tippen weiter.
              </p>
            </div>
          )}
        </aside>
      </div>
      {exporting && <PptxDialog slides={slides} ctx={p.ctx} title={p.lessonTitle} onClose={() => setExporting(false)} />}
      {suggesting && (
        <SuggestDialog sections={suggesting.sections} ctx={p.ctx} mode={suggesting.mode} hasSlides={slides.length > 0} onDone={takeSuggested} onClose={() => setSuggesting(null)} />
      )}
      {showBoards && (
        <BoardsDialog
          boards={p.boards}
          slides={slides}
          ctx={p.ctx}
          onShow={(b) => {
            setShowBoards(false);
            setStartBoard(b);
            enterFullscreen();
            setPresenting(0);
          }}
          onPrint={(b) => {
            setShowBoards(false);
            setPrintBoard(b);
          }}
          onRename={(b, name) => p.onBoards(p.boards.map((x) => (x.id === b.id ? { ...x, name } : x)))}
          onDelete={(b) => p.onBoards(p.boards.filter((x) => x.id !== b.id))}
          onClose={() => setShowBoards(false)}
        />
      )}
      <input
        ref={pptxInput}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) openPptx(file);
        }}
      />
      {imported && (
        <PptxImportDialog
          fileName={imported.fileName}
          count={imported.slides.length}
          kept={imported.kept}
          notes={imported.notes}
          hasSlides={slides.length > 0}
          onAppend={() => takeImported(false)}
          onReplace={() => takeImported(true)}
          onClose={() => setImported(null)}
        />
      )}
      {searching && slide && (
        <ImageSearchDialog
          initialQuery={searching === 'element' && el?.text ? el.text : slide.search || slide.title}
          describe={searching === 'element' ? undefined : slide.describe || undefined}
          startAi={searching === 'slide-ai'}
          aspect={slide.layout === 'full' ? '16:9' : undefined}
          onPick={(file, credit) => {
            setSearching(null);
            if (searching === 'element' && el) setElPicture(slide.id, el.id, file, credit);
            else setPicture(slide.id, file, credit);
          }}
          onClose={() => setSearching(null)}
        />
      )}
    </div>
  );
}

interface ElementPanelProps {
  el: SlideElement;
  slide: Slide;
  textRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange(patch: Partial<SlideElement>, key?: string): void;
  onBack(): void;
  onDuplicate(): void;
  onRemove(): void;
  onLayer(front: boolean): void;
  onPicture(file: File): void;
  onSearch(): void;
  onSketch(): void;
}

/** Fields of a text field, picture, video, QR code, cover or sketch on the slide, and when and how it appears (or goes). */
function ElementPanel({ el, slide, textRef, onChange, onBack, onDuplicate, onRemove, onLayer, onPicture, onSearch, onSketch }: ElementPanelProps) {
  const video = el.kind === 'video' ? videoInfo(el.url) : null;
  // "On a click": the next click after everything else on the slide.
  const nextStep = Math.max(1, stepCount({ ...slide, elements: slide.elements.filter((e) => e.id !== el.id) }) + 1);
  return (
    <>
      <div className="panel-head">
        <button type="button" className="iconbtn" onClick={onBack} title="Zurück zur Folie" aria-label="Zurück zur Folie">
          <Icon icon={ArrowLeft} />
        </button>
        <div className="panel-title">{ELEMENT_LABELS[el.kind]}</div>
      </div>
      <div className="panel-section">
        {el.kind === 'text' && (
          <>
            <RichArea label="Text" rows={4} value={el.text} inputRef={textRef} onChange={(text) => onChange({ text }, 'text')} />
            <SegField<TextStyle> label="Aussehen" value={el.style} options={TEXT_STYLES} onPick={(style) => onChange({ style })} />
            <SegField<number> label="Schriftgröße" value={el.size} options={TEXT_SIZES} onPick={(size) => onChange({ size })} />
            <SegField<'left' | 'center'>
              label="Ausrichtung"
              value={el.align}
              options={[
                { v: 'left', l: 'Links' },
                { v: 'center', l: 'Mitte' },
              ]}
              onPick={(align) => onChange({ align })}
            />
          </>
        )}
        {el.kind === 'image' && (
          <>
            <ImageField label="Bild" hasImage={!!el.image} onFile={onPicture} onRemove={() => onChange({ image: '', source: '' })} onSearch={onSearch} />
            <TextField label="Bildunterschrift (auch Suchwort für die Bildsuche)" value={el.text} onChange={(text) => onChange({ text }, 'text')} />
            <TextField label="Quelle" value={el.source} onChange={(source) => onChange({ source }, 'source')} />
            <SegField<'contain' | 'cover'>
              label="Bild einpassen"
              value={el.fit}
              options={[
                { v: 'contain', l: 'Ganz zeigen' },
                { v: 'cover', l: 'Füllen' },
              ]}
              onPick={(fit) => onChange({ fit })}
            />
          </>
        )}
        {el.kind === 'video' && (
          <>
            <div className="field">
              <label htmlFor="sl-el-video">Video-Link (YouTube, Vimeo oder MP4)</label>
              <input
                id="sl-el-video"
                className="input"
                type="url"
                inputMode="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={el.url}
                onChange={(e) => onChange({ url: e.target.value }, 'url')}
              />
              <p className="panel-note">
                {!el.url.trim()
                  ? 'Link aus der Adresszeile oder über „Teilen“ kopieren. Eine Startzeit (…&t=90) wird übernommen.'
                  : video?.kind === 'unknown'
                    ? 'Diesen Link erkennt der Baukasten nicht. Möglich sind YouTube, Vimeo und Links auf Videodateien (.mp4, .webm).'
                    : `Erkannt: ${video?.kind === 'youtube' ? 'YouTube (im erweiterten Datenschutzmodus)' : video?.kind === 'vimeo' ? 'Vimeo' : 'Videodatei'}. Es spielt beim Präsentieren und braucht dann Internet. Im Handout steht ein QR-Code zum Video.`}
              </p>
            </div>
            <TextField label="Titel (im Editor und im Handout)" value={el.text} onChange={(text) => onChange({ text }, 'text')} />
          </>
        )}
        {el.kind === 'cover' && (
          <>
            <TextField label="Aufschrift (leer: eine Nummer)" value={el.text} onChange={(text) => onChange({ text }, 'text')} />
            <SegField<TextStyle> label="Aussehen" value={el.style} options={COVER_LOOKS} onPick={(style) => onChange({ style })} />
            <p className="panel-note">Leg die Abdeckung über das, was die Klasse erst später sehen soll, z. B. Beschriftungen einer Karte. Beim Präsentieren nimmt Antippen sie weg.</p>
          </>
        )}
        {el.kind === 'ink' && (
          <>
            <button type="button" className="btn btn-secondary ui-btn" onClick={onSketch}>
              <Icon icon={PenLine} />
              Skizze ändern
            </button>
            <p className="panel-note">Die Skizze lässt sich verschieben und in der Größe ändern; „Skizze ändern“ zeichnet weiter oder radiert.</p>
          </>
        )}
        {el.kind === 'qr' && (
          <>
            <div className="field">
              <label htmlFor="sl-el-qr">Link</label>
              <input id="sl-el-qr" className="input" type="url" inputMode="url" value={el.url} placeholder="https://" onChange={(e) => onChange({ url: e.target.value }, 'url')} />
            </div>
            <TextField label="Beschriftung" value={el.text} onChange={(text) => onChange({ text }, 'text')} />
          </>
        )}
      </div>
      {el.kind === 'cover' ? (
        <div className="panel-section">
          <div className="panel-section-label">Verschwinden</div>
          <SegField<boolean>
            label="Wann"
            value={el.step > 0}
            options={[
              { v: true, l: 'auf Klick oder Antippen' },
              { v: false, l: 'nur durch Antippen' },
            ]}
            onPick={(click) => onChange({ step: click ? nextStep : 0 })}
          />
          {el.step > 0 && <NumberField label="Beim wievielten Klick" value={el.step} min={1} max={30} onChange={(step) => onChange({ step }, 'step')} />}
        </div>
      ) : (
      <div className="panel-section">
        <div className="panel-section-label">Erscheinen</div>
        <SegField<boolean>
          label="Wann"
          value={el.step > 0}
          options={[
            { v: false, l: 'mit der Folie' },
            { v: true, l: 'auf Klick' },
          ]}
          onPick={(later) => onChange({ step: later ? nextStep : 0 })}
        />
        {el.step > 0 && (
          <>
            <NumberField label="Beim wievielten Klick" value={el.step} min={1} max={30} onChange={(step) => onChange({ step }, 'step')} />
            <SegField<SlideAnim> label="Wie" value={el.anim} options={SLIDE_ANIMS} onPick={(anim) => onChange({ anim })} />
          </>
        )}
        <p className="panel-note">Auf der Folie: ziehen verschiebt, die Ecke unten rechts ändert die Größe, Pfeiltasten schieben genau, Entf löscht.</p>
      </div>
      )}
      <div className="panel-row">
        <button type="button" className="iconbtn" onClick={() => onLayer(true)} title="Nach vorne holen" aria-label="Nach vorne holen">
          <Icon icon={BringToFront} />
        </button>
        <button type="button" className="iconbtn" onClick={() => onLayer(false)} title="Nach hinten legen" aria-label="Nach hinten legen">
          <Icon icon={SendToBack} />
        </button>
        <button type="button" className="btn btn-secondary ui-btn" onClick={onDuplicate}>
          <Icon icon={Copy} />
          Duplizieren
        </button>
        <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={onRemove}>
          <Icon icon={Trash2} />
          Löschen
        </button>
      </div>
    </>
  );
}

/** The slide's clicks while presenting: what appears on click 1, 2, 3 … Each entry opens its settings. */
function Sequence({ slide, onPart, onElement, onClear }: { slide: Slide; onPart(key: string): void; onElement(id: string): void; onClear(): void }) {
  const n = stepCount(slide);
  if (!n) return <p className="panel-note">Alles erscheint gleich mit der Folie.</p>;
  const parts = slideParts(slide);
  const elementName = (e: SlideElement) => `${ELEMENT_LABELS[e.kind]}${e.text ? `: ${e.text.replace(/[*{}]/g, '').slice(0, 20)}` : ''}${e.kind === 'cover' ? ' geht weg' : ''}`;
  return (
    <div className="field">
      <label>Ablauf beim Präsentieren</label>
      <ol className="sl-sequence">
        {Array.from({ length: n }, (_, k) => k + 1).map((click) => {
          const ps = parts.filter((x) => x.step === click);
          const es = slide.elements.filter((e) => e.step === click);
          return (
            <li key={click}>
              <span className="sl-seq-num">Klick {click}</span>
              <span className="sl-seq-items">
                {ps.map((x) => (
                  <button key={x.key} type="button" className={'sl-seq-chip' + (x.answer ? ' is-answer' : '')} onClick={() => onPart(x.key)}>
                    {x.label}
                  </button>
                ))}
                {es.map((e) => (
                  <button key={e.id} type="button" className="sl-seq-chip is-element" onClick={() => onElement(e.id)}>
                    {elementName(e)}
                  </button>
                ))}
                {!ps.length && !es.length && <span className="sl-seq-empty">nichts (leerer Klick)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn btn-secondary ui-btn sl-seq-clear" onClick={onClear}>
        Alles gleich zeigen
      </button>
    </div>
  );
}

/** When and how one part of the layout appears. */
function PartPanel({ part, own, nextStep, onChange, onBack }: { part: SlidePart; own: boolean; nextStep: number; onChange(a: PartAnim | null): void; onBack(): void }) {
  return (
    <>
      <div className="panel-head">
        <button type="button" className="iconbtn" onClick={onBack} title="Zurück zur Folie" aria-label="Zurück zur Folie">
          <Icon icon={ArrowLeft} />
        </button>
        <div className="panel-title">{part.label}</div>
      </div>
      <div className="panel-section">
        <div className="panel-section-label">Erscheinen</div>
        <SegField<boolean>
          label="Wann"
          value={part.step > 0}
          options={[
            { v: false, l: 'mit der Folie' },
            { v: true, l: 'auf Klick' },
          ]}
          onPick={(later) => onChange({ step: later ? part.step || nextStep : 0, anim: part.anim })}
        />
        {part.step > 0 && (
          <>
            <NumberField label="Beim wievielten Klick" value={part.step} min={1} max={30} onChange={(step) => onChange({ step, anim: part.anim })} />
            <SegField<SlideAnim> label="Wie" value={part.anim} options={SLIDE_ANIMS} onPick={(anim) => onChange({ step: part.step, anim })} />
          </>
        )}
        {part.answer && <p className="panel-note">Lösungen, die auf einen Klick kommen, stehen im Editor blass da; beim Präsentieren erscheinen sie erst mit ihrem Klick.</p>}
        {own && (
          <button type="button" className="btn btn-secondary ui-btn" onClick={() => onChange(null)}>
            Wie die übrigen Einträge
          </button>
        )}
        <p className="panel-note">
          Mehrere Teile mit derselben Klick-Nummer erscheinen zusammen. Den Text änderst du direkt auf der Folie („Text ändern“ oder Doppelklick) oder unter „Zurück zur Folie“.
        </p>
      </div>
    </>
  );
}
