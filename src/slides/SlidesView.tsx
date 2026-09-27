// The slides of a lesson: thumbnails on the left, the chosen slide in the middle, its fields on the right.
// Presenting and printing (handout, PDF) start from the top bar.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, FileText, Play, Plus, Printer, Redo2, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { AreaField, ImageField, NumberField, SegField, TextField } from '../editor/fields';
import { ImageSearchDialog } from '../editor/ImageSearchDialog';
import { Menu } from '../editor/TopBar';
import { Icon } from '../icons';
import { uid } from '../model/ops';
import { createSlide, SLIDE_LAYOUT_ORDER, SLIDE_LAYOUTS, type Slide, type SlideLayout } from '../model/slides';
import { SHEET_TYPES, THEMES, WORK_FORMS } from '../model/themes';
import type { SheetType, WorkForm } from '../model/types';
import { storeImageFile } from '../storage/images';
import { topicIcon } from '../topicIcons';
import { slidesFromDoc } from './fromDoc';
import { enterFullscreen, Presenter } from './Presenter';
import { SlidesPrint, type SlidesPrintKind } from './SlidesPrint';
import { SLIDE_H, SLIDE_W, SlideBox, type SlideContext } from './SlideView';
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

export function SlidesView(p: SlidesViewProps) {
  const [sel, setSel] = useState(0);
  const [past, setPast] = useState<Slide[][]>([]);
  const [future, setFuture] = useState<Slide[][]>([]);
  const lastEdit = useRef('');
  const [presenting, setPresenting] = useState<number | null>(null);
  const [printing, setPrinting] = useState<SlidesPrintKind | null>(null);
  const [picker, setPicker] = useState(false);
  const [searching, setSearching] = useState(false);
  const slides = p.slides;
  // For changes that arrive later (a stored picture): the slides as they are then.
  const latest = useRef(slides);
  latest.current = slides;
  const i = Math.min(sel, Math.max(0, slides.length - 1));
  const slide = slides[i] as Slide | undefined;

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
  const add = (layout: SlideLayout) => {
    const s = createSlide(layout);
    const at = slides.length ? i + 1 : 0;
    commit([...slides.slice(0, at), s, ...slides.slice(at)]);
    setSel(at);
    setPicker(false);
  };
  const move = (dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
    setSel(j);
  };
  const duplicate = () => {
    if (!slide) return;
    commit([...slides.slice(0, i + 1), { ...slide, id: uid() }, ...slides.slice(i + 1)]);
    setSel(i + 1);
  };
  const remove = () => {
    commit(slides.filter((_, k) => k !== i));
    setSel(Math.max(0, i - 1));
  };
  const suggest = () => {
    commit(slidesFromDoc(p.doc, p.lessonTitle));
    setSel(0);
  };

  // Keyboard: undo/redo, arrows move between slides (not while typing).
  useEffect(() => {
    if (presenting !== null || printing) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest('input, textarea, select') || e.target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        undo(e.shiftKey);
      } else if (!typing && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) setSel((k) => Math.min(slides.length - 1, k + 1));
      else if (!typing && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) setSel((k) => Math.max(0, k - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, slides.length, presenting, printing]);

  // The slide in the middle fills the space it has.
  const stage = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(800);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setStageW(Math.max(240, Math.min(el.clientWidth - 48, ((el.clientHeight - 48) * SLIDE_W) / SLIDE_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slides.length > 0]);

  if (presenting !== null) return <Presenter slides={slides} ctx={p.ctx} start={presenting} onClose={(k) => (setPresenting(null), setSel(k))} />;
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
            <button key={s.id} type="button" className={'sl-thumb' + (k === i ? ' is-on' : '')} aria-current={k === i} onClick={() => setSel(k)}>
              <span className="sl-thumb-num">{k + 1}</span>
              <SlideBox slide={s} number={k + 1} ctx={p.ctx} width={176} />
            </button>
          ))}
          <div className="sl-add">
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPicker((o) => !o)} aria-expanded={picker}>
              <Icon icon={Plus} />
              Folie
            </button>
          </div>
        </nav>

        <main className="sl-stage" ref={stage}>
          {slide ? (
            <SlideBox slide={slide} number={i + 1} ctx={p.ctx} width={stageW} ghost revealed={false} />
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
          {slide && info ? (
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
                <AreaField label={slide.layout === 'quote' ? 'Leitfrage' : 'Überschrift'} value={slide.title} onChange={(title) => set({ title }, 'title')} />
                {info.text && <AreaField label={info.text} value={slide.text} onChange={(text) => set({ text }, 'text')} />}
                {info.items && <AreaField label={info.items} value={slide.items} onChange={(items) => set({ items }, 'items')} />}
                {(slide.layout === 'list' || slide.layout === 'words') && (
                  <SegField<boolean>
                    label={slide.layout === 'list' ? 'Antworten beim Präsentieren' : 'Bedeutungen beim Präsentieren'}
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
                      onSearch={() => setSearching(true)}
                    />
                    <TextField label="Quelle" value={slide.source} onChange={(source) => set({ source }, 'source')} />
                  </>
                )}
                <p className="panel-note">**fett** schreibt fett, {'{{…}}'} markiert farbig.</p>
              </div>
              <div className="panel-section">
                <AreaField label="Sprechernotizen (nur für dich, Taste N beim Präsentieren)" value={slide.notes} onChange={(notes) => set({ notes }, 'notes')} />
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
                <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={remove}>
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
          initialQuery={slide.title}
          onPick={(file, credit) => {
            setSearching(false);
            setPicture(slide.id, file, credit);
          }}
          onClose={() => setSearching(false)}
        />
      )}
    </div>
  );
}
