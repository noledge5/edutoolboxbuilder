// The slide being edited, with its free elements selectable, movable and resizable by mouse or finger.
// While dragging only a draft changes; the slide is saved once when the pointer is let go.
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { Slide, SlideElement } from '../model/slides';
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
  /** Double click on an element: edit its text. */
  onOpen(id: string): void;
}

const GRID = 10;
const MIN = 60;
const snap = (n: number) => Math.round(n / GRID) * GRID;

export function SlideStage({ slide, number, ctx, width, selected, onSelect, selectedPart, onPart, onBox, onOpen }: SlideStageProps) {
  const scale = width / SLIDE_W;
  const frame = useRef<HTMLDivElement>(null);
  const [partBox, setPartBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // The chosen part gets a frame, measured where the slide shows it.
  useLayoutEffect(() => {
    const f = frame.current;
    const el = selectedPart ? f?.querySelector(`.sl-slide [data-part="${selectedPart}"]`) : null;
    if (!f || !el) return setPartBox(null);
    const a = f.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    setPartBox({ left: b.left - a.left, top: b.top - a.top, width: b.width, height: b.height });
  }, [selectedPart, slide, width]);

  /** Tapping the slide chooses the part under the finger, or nothing. */
  const pickPart = (ev: PointerEvent) => {
    const hit = document.elementsFromPoint(ev.clientX, ev.clientY).find((n) => n instanceof HTMLElement && n.dataset.part && frame.current?.contains(n)) as HTMLElement | undefined;
    onSelect(null);
    onPart(hit?.dataset.part ?? null);
  };
  const [draft, setDraft] = useState<{ id: string; box: Box } | null>(null);
  const drag = useRef<{ id: string; mode: 'move' | 'size'; x: number; y: number; box: Box } | null>(null);

  const shown: Slide = draft ? { ...slide, elements: slide.elements.map((e) => (e.id === draft.id ? { ...e, ...draft.box } : e)) } : slide;

  const start = (e: SlideElement, mode: 'move' | 'size') => (ev: PointerEvent) => {
    ev.stopPropagation();
    ev.preventDefault();
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

  return (
    <div ref={frame} className="sl-stage-frame sl-box-frame" style={{ width, height: SLIDE_H * scale }}>
      <SlideView slide={shown} number={number} ctx={ctx} step={null} edit style={{ transform: `scale(${scale})` }} />
      <div className="sl-overlay" onPointerDown={pickPart} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        {partBox && !selected && <div className="sl-part-box" style={partBox} />}
        {shown.elements.map((e) => {
          const on = e.id === selected;
          return (
            <div
              key={e.id}
              className={'sl-handle-box' + (on ? ' is-on' : '')}
              style={{ left: e.x * scale, top: e.y * scale, width: e.w * scale, height: e.h * scale }}
              onPointerDown={start(e, 'move')}
              onDoubleClick={() => onOpen(e.id)}
              title="Ziehen zum Verschieben, Doppelklick zum Bearbeiten"
            >
              {e.step > 0 && <span className="sl-step-badge is-el">{e.step}</span>}
              {on && <span className="sl-resize" onPointerDown={start(e, 'size')} aria-label="Größe ändern" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
