// The slide being edited, with its free elements selectable, movable and resizable by mouse or finger.
// While dragging only a draft changes; the slide is saved once when the pointer is let go.
// A double click (on the iPad: a double tap) on a text writes right there, in the slide's own type.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Stroke } from '../model/ink';
import { editText, type Slide, type SlideElement } from '../model/slides';
import { InkSvg } from './Ink';
import { useInkInput, type PenSettings } from './Pen';
import { SLIDE_H, SLIDE_W, SlideView, type SlideContext } from './SlideView';

type Box = Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>;

interface SlideStageProps {
  slide: Slide;
  number: number;
  ctx: SlideContext;
  width: number;
  selected: string | null;
  onSelect(id: string | null): void;
  /** A part of the layout (heading, question 2, answer 2 …), chosen to set when it appears. */
  selectedPart: string | null;
  onPart(key: string | null): void;
  onBox(id: string, box: Box): void;
  /** Double click on a picture, video or QR code: its fields in the panel. */
  onOpen(id: string): void;
  /** A text edited on the slide (see `editText`). */
  onEditText(target: string, value: string): void;
  /** Sketching on the slide instead of choosing and moving. */
  sketch?: SketchState | null;
}

/** Sketching: the strokes in slide pixels, the one being drawn, the pen; `hide` is the sketch being changed. */
export interface SketchState {
  strokes: Stroke[];
  live: Stroke | null;
  pen: PenSettings;
  hide: string | null;
  onBegin(): void;
  onChange(strokes: Stroke[]): void;
  onLive(s: Stroke | null): void;
}

/** Over the slide while sketching: pencil, mouse and finger draw. */
function SketchLayer({ sketch, scale }: { sketch: SketchState; scale: number }) {
  const handlers = useInkInput({ ...sketch, settings: { ...sketch.pen, finger: true }, on: true, scale });
  return (
    <div className="sl-sketch" style={{ touchAction: 'none' }} {...handlers}>
      <InkSvg strokes={sketch.live ? [...sketch.strokes, sketch.live] : sketch.strokes} />
    </div>
  );
}

/** Where the text being edited sits on the stage, and how it looks. */
interface EditBox {
  style: CSSProperties;
  multiline: boolean;
}

/** Targets whose text keeps Enter for a new line; the others finish on Enter. */
const MULTILINE = /^(text|help|el:.*)$/;

/** Which text a chosen part edits ("gaps" are in the Merksatz, pictures have no text). */
const partTarget = (key: string | null) => (key === 'gaps' ? 'title' : key === 'image' ? null : key);

const GRID = 10;
const MIN = 60;
const snap = (n: number) => Math.round(n / GRID) * GRID;

export function SlideStage({ slide, number, ctx, width, selected, onSelect, selectedPart, onPart, onBox, onOpen, onEditText, sketch = null }: SlideStageProps) {
  const scale = width / SLIDE_W;
  const frame = useRef<HTMLDivElement>(null);
  const [partBox, setPartBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [editing, setEditing] = useState<{ target: string; value: string } | null>(null);
  const [editBox, setEditBox] = useState<EditBox | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  /** A double tap waits for its click, so the keyboard opens within the tap (iPad). */
  const pendingEdit = useRef<string | null>(null);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  /** The node of an editable text on the slide. */
  const nodeOf = (target: string) => {
    const f = frame.current;
    if (!f) return null;
    if (target.startsWith('el:')) return f.querySelector<HTMLElement>(`.sl-slide [data-el="${CSS.escape(target.slice(3))}"] > div`);
    return f.querySelector<HTMLElement>(`.sl-slide [data-edit="${CSS.escape(target)}"]`);
  };
  /** The editable text under a point, if any. */
  const targetAt = (x: number, y: number): string | null => {
    for (const n of document.elementsFromPoint(x, y)) {
      if (!(n instanceof HTMLElement) || !frame.current?.contains(n)) continue;
      const hit = n.closest<HTMLElement>('[data-edit], [data-el]');
      if (hit?.dataset.edit) return hit.dataset.edit;
      if (hit?.dataset.el && hit.classList.contains('sl-el-text')) return `el:${hit.dataset.el}`;
    }
    return null;
  };
  const startEdit = (target: string | null) => {
    const value = target ? editText(slide, target) : null;
    if (target === null || value === null || !nodeOf(target)) return;
    setEditing({ target, value });
  };
  const finish = () => setEditing(null);
  /** A second tap of a finger close to the first. */
  const doubleTap = (ev: PointerEvent) => {
    if (ev.pointerType === 'mouse') return false;
    const now = performance.now();
    const l = lastTap.current;
    const hit = now - l.t < 400 && Math.hypot(ev.clientX - l.x, ev.clientY - l.y) < 30;
    lastTap.current = hit ? { t: 0, x: 0, y: 0 } : { t: now, x: ev.clientX, y: ev.clientY };
    return hit;
  };

  // Another slide: stop editing.
  useEffect(() => setEditing(null), [slide.id]);

  // The editor lies exactly over the text, in its font and size; it grows as the text on the slide grows.
  useLayoutEffect(() => {
    const f = frame.current;
    const n = editing && nodeOf(editing.target);
    if (!f || !n || !editing) return setEditBox(null);
    const a = f.getBoundingClientRect();
    const b = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    const px = (v: string) => (v.endsWith('px') ? `${parseFloat(v) * scale}px` : v);
    let bg = 'transparent';
    for (let p: HTMLElement | null = n; p && p !== f; p = p.parentElement) {
      const c = getComputedStyle(p).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) {
        bg = c;
        break;
      }
    }
    setEditBox({
      multiline: MULTILINE.test(editing.target),
      style: {
        left: b.left - a.left,
        top: b.top - a.top,
        width: Math.max(b.width, 80),
        minHeight: b.height,
        fontFamily: cs.fontFamily,
        fontSize: px(cs.fontSize),
        fontWeight: cs.fontWeight,
        fontStyle: cs.fontStyle,
        lineHeight: cs.lineHeight === 'normal' ? 1.25 : px(cs.lineHeight),
        letterSpacing: px(cs.letterSpacing),
        textAlign: cs.textAlign as CSSProperties['textAlign'],
        textTransform: cs.textTransform as CSSProperties['textTransform'],
        color: cs.color,
        padding: `${px(cs.paddingTop)} ${px(cs.paddingRight)} ${px(cs.paddingBottom)} ${px(cs.paddingLeft)}`,
        borderRadius: px(cs.borderTopLeftRadius),
        background: bg,
      },
    });
  }, [editing, slide, width]);

  // The editor grows with its text.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = el.scrollHeight + 'px';
  }, [editing?.value, editBox]);

  // The chosen part gets a frame, measured where the slide shows it.
  useLayoutEffect(() => {
    const f = frame.current;
    const el = selectedPart ? f?.querySelector(`.sl-slide [data-part="${selectedPart}"]`) : null;
    if (!f || !el) return setPartBox(null);
    const a = f.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    setPartBox({ left: b.left - a.left, top: b.top - a.top, width: b.width, height: b.height });
  }, [selectedPart, slide, width]);

  /** Tapping the slide chooses the part under the finger, or nothing; tapping twice writes there. */
  const pickPart = (ev: PointerEvent) => {
    if (doubleTap(ev)) pendingEdit.current = targetAt(ev.clientX, ev.clientY);
    const hit = document.elementsFromPoint(ev.clientX, ev.clientY).find((n) => n instanceof HTMLElement && n.dataset.part && frame.current?.contains(n)) as HTMLElement | undefined;
    onSelect(null);
    onPart(hit?.dataset.part ?? null);
  };
  const onClick = () => {
    if (pendingEdit.current) startEdit(pendingEdit.current);
    pendingEdit.current = null;
  };
  const [draft, setDraft] = useState<{ id: string; box: Box } | null>(null);
  const drag = useRef<{ id: string; mode: 'move' | 'size'; x: number; y: number; box: Box } | null>(null);

  const moved: Slide = draft ? { ...slide, elements: slide.elements.map((e) => (e.id === draft.id ? { ...e, ...draft.box } : e)) } : slide;
  // The sketch being changed is drawn by the sketch layer instead.
  const shown: Slide = sketch?.hide ? { ...moved, elements: moved.elements.filter((e) => e.id !== sketch.hide) } : moved;

  const start = (e: SlideElement, mode: 'move' | 'size') => (ev: PointerEvent) => {
    ev.stopPropagation();
    ev.preventDefault();
    if (mode === 'move' && doubleTap(ev) && e.kind === 'text') pendingEdit.current = `el:${e.id}`;
    onPart(null);
    onSelect(e.id);
    (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
    drag.current = { id: e.id, mode, x: ev.clientX, y: ev.clientY, box: { x: e.x, y: e.y, w: e.w, h: e.h } };
  };

  const move = (ev: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (ev.clientX - d.x) / scale;
    const dy = (ev.clientY - d.y) / scale;
    const b = d.box;
    let box: Box;
    if (d.mode === 'move') box = { ...b, x: Math.min(SLIDE_W - b.w, Math.max(0, snap(b.x + dx))), y: Math.min(SLIDE_H - b.h, Math.max(0, snap(b.y + dy))) };
    else box = { ...b, w: Math.min(SLIDE_W - b.x, Math.max(MIN, snap(b.w + dx))), h: Math.min(SLIDE_H - b.y, Math.max(MIN, snap(b.h + dy))) };
    setDraft({ id: d.id, box });
  };

  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (d && draft && draft.id === d.id) onBox(d.id, draft.box);
    setDraft(null);
  };

  const chip = partTarget(selectedPart);
  const hidden = editing ? (editing.target.startsWith('el:') ? `[data-el="${CSS.escape(editing.target.slice(3))}"] > div` : `[data-edit="${CSS.escape(editing.target)}"]`) : '';
  return (
    <div ref={frame} className="sl-stage-frame sl-box-frame" style={{ width, height: SLIDE_H * scale }}>
      {hidden && <style>{`.sl-stage-frame .sl-slide ${hidden} { visibility: hidden; }`}</style>}
      <SlideView slide={shown} number={number} ctx={ctx} step={null} edit style={{ transform: `scale(${scale})` }} />
      {sketch && <SketchLayer sketch={sketch} scale={scale} />}
      <div
        hidden={!!sketch}
        className="sl-overlay"
        onPointerDown={pickPart}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onClick={onClick}
        onDoubleClick={(ev) => startEdit(targetAt(ev.clientX, ev.clientY))}
      >
        {partBox && !selected && !editing && <div className="sl-part-box" style={partBox} />}
        {partBox && !selected && !editing && chip && editText(slide, chip) !== null && (
          <button
            type="button"
            className="sl-edit-chip"
            style={{ left: partBox.left, top: partBox.top }}
            onPointerDown={(ev) => ev.stopPropagation()}
            onClick={(ev) => {
              ev.stopPropagation();
              startEdit(chip);
            }}
          >
            Text ändern
          </button>
        )}
        {shown.elements.map((e) => {
          const on = e.id === selected;
          return (
            <div
              key={e.id}
              className={'sl-handle-box' + (on ? ' is-on' : '')}
              style={{ left: e.x * scale, top: e.y * scale, width: e.w * scale, height: e.h * scale }}
              onPointerDown={start(e, 'move')}
              onDoubleClick={(ev) => {
                ev.stopPropagation();
                if (e.kind === 'text') startEdit(`el:${e.id}`);
                else onOpen(e.id);
              }}
              title={e.kind === 'text' ? 'Ziehen zum Verschieben, Doppelklick zum Schreiben' : 'Ziehen zum Verschieben, Doppelklick zum Bearbeiten'}
            >
              {e.step > 0 && <span className="sl-step-badge is-el">{e.step}</span>}
              {on && <span className="sl-resize" onPointerDown={start(e, 'size')} aria-label="Größe ändern" />}
            </div>
          );
        })}
        {editing && editBox && (
          <textarea
            ref={input}
            className="sl-inline"
            style={editBox.style}
            rows={1}
            lang={ctx.lang}
            spellCheck
            autoFocus
            aria-label="Text auf der Folie"
            value={editing.value}
            onFocus={(ev) => ev.currentTarget.setSelectionRange(ev.currentTarget.value.length, ev.currentTarget.value.length)}
            onChange={(ev) => {
              const value = editBox.multiline ? ev.target.value : ev.target.value.replace(/\n/g, ' ');
              setEditing({ target: editing.target, value });
              onEditText(editing.target, value);
            }}
            onKeyDown={(ev) => {
              if (ev.key === 'Escape' || (ev.key === 'Enter' && !ev.shiftKey && !editBox.multiline) || (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey))) {
                ev.preventDefault();
                finish();
              }
            }}
            onBlur={finish}
            onPointerDown={(ev) => ev.stopPropagation()}
            onClick={(ev) => ev.stopPropagation()}
            onDoubleClick={(ev) => ev.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}
