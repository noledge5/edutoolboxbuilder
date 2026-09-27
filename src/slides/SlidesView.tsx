// The slides of a lesson: thumbnails on the left, the chosen slide in the middle, its fields on the right.
// Presenting and printing (handout, PDF) start from the top bar.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  BringToFront,
  Copy,
  Eye,
  FileText,
  Highlighter,
  ImagePlus,
  Layers,
  Play,
  Plus,
  Printer,
  QrCode,
  Redo2,
  SendToBack,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Video,
} from 'lucide-react';
import { ImageField, NumberField, SegField, TextField } from '../editor/fields';
import { ImageSearchDialog } from '../editor/ImageSearchDialog';
import { Menu } from '../editor/TopBar';
import { Icon } from '../icons';
import { uid } from '../model/ops';
import {
  createElement,
  createSlide,
  ELEMENT_LABELS,
  ITEM_LIMIT,
  SLIDE_ANIMS,
  SLIDE_LAYOUT_ORDER,
  SLIDE_LAYOUTS,
  SLIDE_TRANSITIONS,
  slideParts,
  stepCount,
  type PartAnim,
  type SlidePart,
  type Slide,
  type SlideAnim,
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
import { slidesFromDoc } from './fromDoc';
import { enterFullscreen, Presenter } from './Presenter';
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
  place: string;
  onChange(slides: Slide[]): void;
  onBack(): void;
  onOpenSheet(): void;
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
];

const TEXT_STYLES: { v: TextStyle; l: string }[] = [
  { v: 'box', l: 'Kasten' },
  { v: 'note', l: 'Notizzettel' },
  { v: 'plain', l: 'Schlicht' },
  { v: 'heading', l: 'Überschrift' },
];

const REVEAL_LABEL: Partial<Record<SlideLayout, string>> = {
  list: 'Antworten (Lösungen) beim Präsentieren',
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
  const [presenting, setPresenting] = useState<number | null>(null);
  const [printing, setPrinting] = useState<SlidesPrintKind | null>(null);
  const [picker, setPicker] = useState(false);
  const [searching, setSearching] = useState<'slide' | 'element' | null>(null);
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
    const e = createElement(kind);
    const placed = { ...e, x: Math.min(1920 - e.w, e.x + k * 40), y: Math.min(1080 - e.h, e.y + k * 40) };
    setElements([...slide.elements, placed]);
    setSelEl(placed.id);
    if (kind === 'text' || kind === 'video' || kind === 'qr') requestAnimationFrame(() => document.getElementById(`sl-el-${kind}`)?.focus());
  };
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
  const suggest = () => {
    commit(slidesFromDoc(p.doc, p.lessonTitle));
    pick(0);
  };
  const resuggest = () => {
    if (slides.length && !window.confirm('Die Folien durch neue Vorschläge aus dem Arbeitsblatt ersetzen? Mit „Rückgängig“ (⌘Z) holst du die alten zurück.')) return;
    suggest();
  };

  // Keyboard: undo/redo, arrows move between slides (not while typing).
  useEffect(() => {
    if (presenting !== null || printing) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest('input, textarea, select') || e.target.isContentEditable);
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
    const fit = () => setStageW(Math.max(240, Math.min(el.clientWidth - 48, ((el.clientHeight - 104) * SLIDE_W) / SLIDE_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slides.length > 0]);

  if (presenting !== null) return <Presenter slides={slides} ctx={p.ctx} start={presenting} onClose={(k) => (setPresenting(null), pick(k))} />;
  if (printing) return <SlidesPrint kind={printing} slides={slides} ctx={p.ctx} title={p.lessonTitle} onClose={() => setPrinting(null)} />;

  const info = slide ? SLIDE_LAYOUTS[slide.layout] : null;
  return (
    <div className="app sl-app">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={p.onBack} title="Zum Modul" aria-label="Zum Modul">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={topicIcon(p.ctx.icon)} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">Folien</div>
          <div className="topbar-place">{p.place}</div>
        </div>
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
        <Menu
          label="Folien"
          icon={Layers}
          items={[
            { label: 'Folie löschen', icon: Trash2, onClick: () => slides.length && remove() },
            { label: 'Alle Folien löschen …', icon: Trash2, onClick: removeAll },
            { label: 'Neu aus dem Arbeitsblatt vorschlagen …', icon: Sparkles, onClick: resuggest },
          ]}
        />
        <Menu
          label="Drucken"
          icon={Printer}
          items={[
            { label: 'Handout: zwei Folien je Seite', icon: Printer, onClick: () => slides.length && setPrinting('handout') },
            { label: 'Mit Sprechernotizen (für dich)', icon: Printer, onClick: () => slides.length && setPrinting('notes') },
            { label: 'Folien als PDF (Querformat)', icon: Printer, onClick: () => slides.length && setPrinting('slides') },
          ]}
        />
        <button
          type="button"
          className="btn btn-primary ui-btn"
          disabled={!slides.length}
          onClick={() => {
            enterFullscreen();
            setPresenting(i);
          }}
        >
          <Icon icon={Play} />
          <span className="btn-label">Präsentieren</span>
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
          {slide && (
            <div className="sl-insert" role="toolbar" aria-label="Einfügen">
              {INSERT.map(({ kind, icon }) => (
                <button key={kind} type="button" className="btn btn-secondary ui-btn" onClick={() => addEl(kind)}>
                  <Icon icon={icon} />
                  <span className="btn-label">{ELEMENT_LABELS[kind]}</span>
                </button>
              ))}
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
            />
          ) : (
            <div className="sl-empty">
              <p className="lib-empty">Noch keine Folien für diese Stunde.</p>
              <button type="button" className="btn btn-primary ui-btn" onClick={suggest}>
                <Icon icon={Sparkles} />
                Folien aus dem Arbeitsblatt vorschlagen
              </button>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPicker(true)}>
                <Icon icon={Plus} />
                Leere Folie wählen
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
                <RichArea label={slide.layout === 'quote' ? 'Leitfrage' : 'Überschrift'} rows={2} value={slide.title} onChange={(title) => set({ title }, 'title')} />
                {info.text && <RichArea label={info.text} value={slide.text} onChange={(text) => set({ text }, 'text')} />}
                {info.items && <RichArea label={info.items} rows={5} value={slide.items} onChange={(items) => set({ items }, 'items')} />}
                {REVEAL_LABEL[slide.layout] && (
                  <SegField<boolean>
                    label={REVEAL_LABEL[slide.layout]!}
                    value={slide.reveal}
                    options={[
                      { v: true, l: 'erst auf Klick' },
                      { v: false, l: 'gleich zeigen' },
                    ]}
                    onPick={(reveal) => set({ reveal })}
                  />
                )}
                {slide.layout === 'image' && (
                  <>
                    <ImageField
                      label="Bild"
                      hasImage={!!slide.image}
                      onFile={(file) => setPicture(slide.id, file)}
                      onRemove={() => set({ image: '', source: '' })}
                      onSearch={() => setSearching('slide')}
                    />
                    <TextField label="Quelle" value={slide.source} onChange={(source) => set({ source }, 'source')} />
                  </>
                )}
                <p className="panel-note">Wörter markieren und B drücken schreibt sie fett, der Marker hebt sie farbig hervor.</p>
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
      {searching && slide && (
        <ImageSearchDialog
          initialQuery={searching === 'element' && el?.text ? el.text : slide.title}
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
}

/** Fields of a text field, picture, video or QR code on the slide, and when and how it appears. */
function ElementPanel({ el, slide, textRef, onChange, onBack, onDuplicate, onRemove, onLayer, onPicture, onSearch }: ElementPanelProps) {
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
  const elementName = (e: SlideElement) => `${ELEMENT_LABELS[e.kind]}${e.text ? `: ${e.text.replace(/[*{}]/g, '').slice(0, 20)}` : ''}`;
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
        <p className="panel-note">Mehrere Teile mit derselben Klick-Nummer erscheinen zusammen. Den Text änderst du unter „Zurück zur Folie“.</p>
      </div>
    </>
  );
}
