// Writing on slides: the pen's settings (kept on this device), the input from a pencil, a mouse or a finger, and the
// pen bar. The Presenter keeps the strokes; the slide editor uses the same input to sketch.
// On the iPad the pencil always writes and the finger goes on turning slides and tapping cards (unless "Finger" is
// switched on); a mouse writes while the pen is switched on (button or P). Holding still at the end of a stroke makes
// it a straight line; the arrow button puts an arrow head at the end of each stroke.
import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Eraser, FolderOpen, Hand, Highlighter, MoveUpRight, PenLine, SquarePlus, Trash2, Undo2, X } from 'lucide-react';
import { Icon } from '../icons';
import { hitStroke, INK_COLORS, inkPoint, MARKER_SIZE, PAPERS, PEN_SIZES, type Board, type InkColor, type Paper, type Stroke } from '../model/ink';

export type PenTool = 'pen' | 'marker' | 'eraser';

export interface PenSettings {
  tool: PenTool;
  /** Colour of the pen and of the marker, each kept. */
  color: InkColor;
  marker: InkColor;
  /** Index into PEN_SIZES. */
  size: number;
  arrow: boolean;
  /** The finger writes too (on a touch screen without a pencil). */
  finger: boolean;
}

const KEY = 'arbeitsblatt-baukasten:stift';
const PENCIL_KEY = 'arbeitsblatt-baukasten:pencil';
const DEFAULTS: PenSettings = { tool: 'pen', color: 'red', marker: 'yellow', size: 1, arrow: false, finger: true };

function stored(): PenSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<PenSettings>;
    const s = { ...DEFAULTS, ...raw };
    // Once a pencil was used on this device, the finger turns slides again unless switched on.
    if (raw.finger === undefined && localStorage.getItem(PENCIL_KEY)) s.finger = false;
    return s;
  } catch {
    return DEFAULTS;
  }
}

export function usePenSettings(): [PenSettings, (p: Partial<PenSettings>) => void] {
  const [s, setS] = useState(stored);
  const set = useCallback((p: Partial<PenSettings>) => {
    setS((x) => {
      const next = { ...x, ...p };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Kept for this time only.
      }
      return next;
    });
  }, []);
  return [s, set];
}

/** Notes that this device has a pencil: from now on the finger turns slides by default. */
export function pencilSeen() {
  try {
    if (localStorage.getItem(PENCIL_KEY)) return false;
    localStorage.setItem(PENCIL_KEY, '1');
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<PenSettings>;
    return raw.finger === undefined;
  } catch {
    return false;
  }
}

/** The stroke the pen makes now. */
export const penStroke = (s: PenSettings, pressure: boolean): Stroke => ({
  tool: s.tool === 'marker' ? 'marker' : 'pen',
  color: s.tool === 'marker' ? s.marker : s.color,
  size: s.tool === 'marker' ? MARKER_SIZE : PEN_SIZES[s.size] ?? PEN_SIZES[1],
  points: [],
  pressure,
  line: false,
  arrow: s.arrow && s.tool !== 'marker',
});

export interface InkInput {
  settings: PenSettings;
  /** The pen is switched on: the mouse (and the finger, if allowed) write. */
  on: boolean;
  /** Slide pixels per screen pixel of the frame. */
  scale: number;
  /** The strokes of the page (for the eraser). */
  strokes: Stroke[];
  /** Before the first change of a gesture (to undo it as a whole). */
  onBegin(): void;
  onChange(strokes: Stroke[]): void;
  /** The stroke being drawn, null when done. */
  onLive(s: Stroke | null): void;
  /** A pencil touched the screen. */
  onPencil?(): void;
  /** Set to the time of the last gesture that wrote or erased (to ignore its swipe). */
  busy?: { current: number };
}

/** Radius of the eraser in screen pixels. */
const ERASER = 18;
/** Holding still this long at the end of a stroke makes it straight. */
const HOLD_MS = 550;

/** Keeps the pointer's moves coming to the element, also outside it (not possible for some synthetic pointers). */
const capture = (e: ReactPointerEvent<HTMLElement>) => {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // The moves still come while the pointer stays on the element.
  }
};

/** Pointer handlers for an element that shows a page at `scale`: they turn the pen's gestures into strokes. */
export function useInkInput(o: InkInput) {
  const opts = useRef(o);
  opts.current = o;
  const g = useRef<{
    id: number;
    stroke: Stroke | null;
    erasing: boolean;
    begun: boolean;
    /** A tap on a card or a vote: it only writes once the pointer moves. */
    pending: { x: number; y: number; pressure: number } | null;
    start: { cx: number; cy: number };
    still: { cx: number; cy: number };
    timer: number;
    strokes: Stroke[];
  } | null>(null);
  const suppress = useRef(false);

  const at = (e: ReactPointerEvent | PointerEvent, el: Element) => {
    const r = el.getBoundingClientRect();
    const s = opts.current.scale;
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s, pressure: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5 };
  };
  const begin = () => {
    const c = g.current;
    if (c && !c.begun) {
      c.begun = true;
      opts.current.onBegin();
      if (opts.current.busy) opts.current.busy.current = Date.now();
    }
  };
  const erase = (x: number, y: number) => {
    const c = g.current;
    if (!c) return;
    // About as wide as a fingertip on the screen, whatever the size of the slide.
    const left = c.strokes.filter((s) => !hitStroke(s, x, y, ERASER / Math.max(0.1, opts.current.scale)));
    if (left.length !== c.strokes.length) {
      begin();
      c.strokes = left;
      opts.current.onChange(left);
    }
  };
  const straighten = () => {
    const c = g.current;
    const s = c?.stroke;
    if (!c || !s || s.line || s.points.length < 6) return;
    const p = s.points;
    const [x0, y0, x1, y1] = [p[0], p[1], p[p.length - 3], p[p.length - 2]];
    if (Math.hypot(x1 - x0, y1 - y0) < 30) return;
    c.stroke = { ...s, line: true, points: [x0, y0, 0.5, x1, y1, 0.5] };
    opts.current.onLive(c.stroke);
  };
  const startStroke = (p: { x: number; y: number; pressure: number }, pen: boolean) => {
    const c = g.current!;
    c.stroke = { ...penStroke(opts.current.settings, pen), points: inkPoint(p.x, p.y, p.pressure) };
    begin();
    opts.current.onLive(c.stroke);
  };

  const onPointerDownCapture = (e: ReactPointerEvent<HTMLElement>) => {
    const o = opts.current;
    if (g.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const pen = e.pointerType === 'pen';
    const writes = pen || (o.on && (e.pointerType === 'mouse' || (e.pointerType === 'touch' && o.settings.finger)));
    if (!writes) return;
    if (pen) o.onPencil?.();
    const target = e.target as Element;
    const p = at(e, e.currentTarget);
    const tap = typeof target.closest === 'function' && !!target.closest('[data-card], [data-vote], [data-unvote]');
    g.current = {
      id: e.pointerId,
      stroke: null,
      erasing: o.settings.tool === 'eraser',
      begun: false,
      pending: tap ? p : null,
      start: { cx: e.clientX, cy: e.clientY },
      still: { cx: e.clientX, cy: e.clientY },
      timer: 0,
      strokes: o.strokes,
    };
    if (tap) return;
    e.preventDefault();
    e.stopPropagation();
    capture(e);
    suppress.current = true;
    if (g.current.erasing) erase(p.x, p.y);
    else startStroke(p, pen);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const c = g.current;
    if (!c || c.id !== e.pointerId) return;
    if (c.pending) {
      if (Math.hypot(e.clientX - c.start.cx, e.clientY - c.start.cy) < 8) return;
      // It moves: no tap after all, but writing from where it began.
      const p = c.pending;
      c.pending = null;
      capture(e);
      suppress.current = true;
      if (c.erasing) erase(p.x, p.y);
      else startStroke(p, e.pointerType === 'pen');
    }
    e.preventDefault();
    const events = (e.nativeEvent.getCoalescedEvents?.() ?? []).length ? e.nativeEvent.getCoalescedEvents() : [e.nativeEvent];
    for (const ev of events) {
      const p = at(ev, e.currentTarget);
      if (c.erasing) {
        erase(p.x, p.y);
        continue;
      }
      const s = c.stroke;
      if (!s) continue;
      if (s.line) {
        c.stroke = { ...s, points: [s.points[0], s.points[1], 0.5, ...inkPoint(p.x, p.y, 0.5)] };
        continue;
      }
      const n = s.points.length;
      if (Math.hypot(p.x - s.points[n - 3], p.y - s.points[n - 2]) < 1.5) continue;
      c.stroke = { ...s, points: [...s.points, ...inkPoint(p.x, p.y, p.pressure)] };
    }
    if (c.stroke) opts.current.onLive(c.stroke);
    // Holding still: a straight line.
    if (!c.erasing && Math.hypot(e.clientX - c.still.cx, e.clientY - c.still.cy) > 4) {
      c.still = { cx: e.clientX, cy: e.clientY };
      window.clearTimeout(c.timer);
      c.timer = window.setTimeout(straighten, HOLD_MS);
    }
  };

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const c = g.current;
    if (!c || c.id !== e.pointerId) return;
    window.clearTimeout(c.timer);
    g.current = null;
    if (c.stroke) {
      opts.current.onLive(null);
      opts.current.onChange([...opts.current.strokes, c.stroke]);
    }
    if (c.begun && opts.current.busy) opts.current.busy.current = Date.now();
  };

  /** A click after writing is not a click on the slide (it would turn it). */
  const onClickCapture = (e: ReactMouseEvent) => {
    if (!suppress.current) return;
    suppress.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  return { onPointerDownCapture, onPointerMove, onPointerUp: end, onPointerCancel: end, onClickCapture };
}

const isTouchDevice = () => typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

interface PenBarProps {
  s: PenSettings;
  set(p: Partial<PenSettings>): void;
  canUndo: boolean;
  onUndo(): void;
  onClear(): void;
  onBlank(paper: Paper): void;
  /** Saved Tafelbilder of the lesson, to show again. */
  boards?: Board[];
  onLoad?(board: Board): void;
  onClose(): void;
  /** Where it sits: over the slides (presenting alone, the editor) or in the speaker view. */
  place?: 'top' | 'inline';
  /** In the editor: no blank boards, no saved Tafelbilder, "Fertig" instead of closing. */
  editor?: ReactNode;
}

/** The pen bar: tools, colours, thickness, arrow, undo, clear, blank board, finger, saved Tafelbilder. */
export function PenBar({ s, set, canUndo, onUndo, onClear, onBlank, boards = [], onLoad, onClose, place = 'top', editor }: PenBarProps) {
  const [menu, setMenu] = useState<'' | 'blank' | 'load'>('');
  const color = s.tool === 'marker' ? s.marker : s.color;
  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();
  const tool = (t: PenTool, icon: typeof PenLine, label: string) => (
    <button type="button" className={'sl-pen-btn' + (s.tool === t ? ' is-on' : '')} aria-pressed={s.tool === t} onClick={() => set({ tool: t })} title={label} aria-label={label}>
      <Icon icon={icon} size={20} />
    </button>
  );
  return (
    <div className={'sl-pen-bar is-' + place} role="toolbar" aria-label="Stift" onClick={stop} onPointerDown={stop} onTouchEnd={stop}>
      {tool('pen', PenLine, 'Stift')}
      {tool('marker', Highlighter, 'Marker')}
      {tool('eraser', Eraser, 'Radierer: Striche wegwischen')}
      <span className="sl-pen-sep" />
      {INK_COLORS.map((c) => (
        <button
          key={c.v}
          type="button"
          className={'sl-pen-color' + (color === c.v && s.tool !== 'eraser' ? ' is-on' : '')}
          style={{ ['--c' as string]: `var(--ink-${c.v})` }}
          onClick={() => set(s.tool === 'marker' ? { marker: c.v } : { color: c.v, tool: 'pen' })}
          title={c.v === 'dark' ? 'Schwarz (auf der Tafel: Kreide)' : c.l}
          aria-label={c.l}
        />
      ))}
      <span className="sl-pen-sep" />
      <button
        type="button"
        className="sl-pen-btn"
        onClick={() => set({ size: (s.size + 1) % PEN_SIZES.length, tool: s.tool === 'eraser' ? 'pen' : s.tool })}
        title="Strichstärke"
        aria-label="Strichstärke"
      >
        <span className="sl-pen-size" style={{ width: 6 + s.size * 5, height: 6 + s.size * 5 }} />
      </button>
      <button type="button" className={'sl-pen-btn' + (s.arrow ? ' is-on' : '')} aria-pressed={s.arrow} onClick={() => set({ arrow: !s.arrow })} title="Pfeilspitze am Ende jedes Strichs" aria-label="Pfeil">
        <Icon icon={MoveUpRight} size={20} />
      </button>
      <span className="sl-pen-sep" />
      <button type="button" className="sl-pen-btn" onClick={onUndo} disabled={!canUndo} title="Rückgängig (⌘Z)" aria-label="Rückgängig">
        <Icon icon={Undo2} size={20} />
      </button>
      <button type="button" className="sl-pen-btn" onClick={onClear} title="Alles auf dieser Seite wegwischen" aria-label="Alles wegwischen">
        <Icon icon={Trash2} size={20} />
      </button>
      {!editor && (
        <div className="sl-pen-menu">
          <button type="button" className={'sl-pen-btn' + (menu === 'blank' ? ' is-on' : '')} onClick={() => setMenu(menu === 'blank' ? '' : 'blank')} title="Leere Tafel einschieben" aria-label="Leere Tafel" aria-expanded={menu === 'blank'}>
            <Icon icon={SquarePlus} size={20} />
          </button>
          {menu === 'blank' && (
            <div className="sl-pen-pop">
              <b>Leere Tafel nach dieser Folie</b>
              {PAPERS.map((p) => (
                <button
                  key={p.v}
                  type="button"
                  className="sl-pill"
                  onClick={() => {
                    setMenu('');
                    onBlank(p.v);
                  }}
                >
                  {p.l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {isTouchDevice() && (
        <button type="button" className={'sl-pen-btn' + (s.finger ? ' is-on' : '')} aria-pressed={s.finger} onClick={() => set({ finger: !s.finger })} title="Mit dem Finger schreiben (sonst blättert der Finger, der Stift schreibt)" aria-label="Finger schreibt">
          <Icon icon={Hand} size={20} />
        </button>
      )}
      {!editor && boards.length > 0 && onLoad && (
        <div className="sl-pen-menu">
          <button type="button" className={'sl-pen-btn' + (menu === 'load' ? ' is-on' : '')} onClick={() => setMenu(menu === 'load' ? '' : 'load')} title="Gesichertes Tafelbild zeigen" aria-label="Tafelbild zeigen" aria-expanded={menu === 'load'}>
            <Icon icon={FolderOpen} size={20} />
          </button>
          {menu === 'load' && (
            <div className="sl-pen-pop is-list">
              <b>Gesichertes Tafelbild zeigen</b>
              {boards.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="sl-pill"
                  onClick={() => {
                    setMenu('');
                    onLoad(b);
                  }}
                >
                  {b.name || 'Tafelbild'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <span className="sl-pen-sep" />
      {editor ?? (
        <button type="button" className="sl-pen-btn" onClick={onClose} title="Stift aus (P)" aria-label="Stift aus">
          <Icon icon={X} size={20} />
        </button>
      )}
    </div>
  );
}
