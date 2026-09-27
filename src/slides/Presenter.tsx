// Presenting: one slide filling the screen. Arrow keys, space, a click or a swipe go on; answers of a
// slide with "erst auf Klick" appear first. N shows the speaker notes, F full screen, Esc ends.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, NotebookText, X } from 'lucide-react';
import { Icon } from '../icons';
import { hasReveal, type Slide } from '../model/slides';
import { SLIDE_H, SLIDE_W, SlideView, type SlideContext } from './SlideView';

interface PresenterProps {
  slides: Slide[];
  ctx: SlideContext;
  start: number;
  /** Ends presenting; `at` is the slide shown last. */
  onClose(at: number): void;
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Full screen for presenting, where the browser allows it (it needs a click or a key press first). */
export function enterFullscreen() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  } catch {
    // Not allowed here (e.g. an iPhone): the slides still fill the window.
  }
}

function leaveFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

export function Presenter({ slides, ctx, start, onClose }: PresenterProps) {
  const [k, setK] = useState(Math.min(start, slides.length - 1));
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState(false);
  const [idle, setIdle] = useState(false);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [began] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const slide = slides[k];

  const close = useCallback(() => {
    leaveFullscreen();
    onClose(k);
  }, [k, onClose]);

  const next = useCallback(() => {
    if (hasReveal(slides[k]) && !revealed) setRevealed(true);
    else if (k < slides.length - 1) {
      setK(k + 1);
      setRevealed(false);
    }
  }, [k, revealed, slides]);

  const prev = useCallback(() => {
    if (revealed) setRevealed(false);
    else if (k > 0) {
      setK(k - 1);
      // Going back shows the previous slide as it was left: answers open.
      setRevealed(hasReveal(slides[k - 1]));
    }
  }, [k, revealed, slides]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(key)) next();
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(key)) prev();
      else if (key === 'Home') (setK(0), setRevealed(false));
      else if (key === 'End') (setK(slides.length - 1), setRevealed(false));
      else if (key === 'Escape') close();
      else if (key.toLowerCase() === 'n') setNotes((n) => !n);
      else if (key.toLowerCase() === 'f') document.fullscreenElement ? leaveFullscreen() : enterFullscreen();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, close, slides.length]);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(t);
    };
  }, []);

  // The controls and the pointer disappear while nothing moves.
  useEffect(() => {
    if (idle) return;
    const t = setTimeout(() => setIdle(true), 2500);
    return () => clearTimeout(t);
  }, [idle, k, revealed]);

  if (!slide) return null;
  const scale = Math.min(size.w / SLIDE_W, size.h / SLIDE_H);
  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();

  return (
    <div
      className={'sl-present' + (idle ? ' is-idle' : '')}
      role="dialog"
      aria-label="Präsentation"
      onPointerMove={() => setIdle(false)}
      onClick={(e) => {
        // Left third goes back, the rest goes on.
        if (e.clientX < size.w / 3) prev();
        else next();
      }}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.changedTouches[0].clientY - t.y)) {
          e.preventDefault();
          if (dx < 0) next();
          else prev();
        }
      }}
    >
      <div className="sl-present-frame" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
        <SlideView slide={slide} number={k + 1} ctx={ctx} revealed={revealed} style={{ transform: `scale(${scale})` }} />
      </div>

      {notes && (
        <div className="sl-notes" onClick={stop}>
          <b>Notizen zu Folie {k + 1}</b>
          <p>{slide.notes || 'Keine Notizen.'}</p>
          <span className="sl-notes-tip">Wird der Bildschirm gespiegelt, sieht die Klasse die Notizen mit. N blendet sie aus.</span>
        </div>
      )}

      <div className="sl-controls" onClick={stop} onTouchEnd={stop}>
        <button type="button" className="iconbtn" onClick={prev} disabled={k === 0 && !revealed} title="Zurück (←)" aria-label="Zurück">
          <Icon icon={ChevronLeft} size={20} />
        </button>
        <span className="sl-count">
          {k + 1} / {slides.length}
        </span>
        <button type="button" className="iconbtn" onClick={next} disabled={k === slides.length - 1 && (!hasReveal(slide) || revealed)} title="Weiter (→, Leertaste)" aria-label="Weiter">
          <Icon icon={ChevronRight} size={20} />
        </button>
        <span className="sl-clock" title="Zeit seit Beginn">
          {clock(now - began)}
        </span>
        <button type="button" className={'iconbtn' + (notes ? ' is-on' : '')} onClick={() => setNotes((n) => !n)} title="Sprechernotizen (N)" aria-label="Sprechernotizen" aria-pressed={notes}>
          <Icon icon={NotebookText} size={18} />
        </button>
        <button type="button" className="iconbtn" onClick={() => (document.fullscreenElement ? leaveFullscreen() : enterFullscreen())} title="Vollbild (F)" aria-label="Vollbild">
          <Icon icon={Maximize} size={18} />
        </button>
        <button type="button" className="iconbtn" onClick={close} title="Beenden (Esc)" aria-label="Präsentation beenden">
          <Icon icon={X} size={18} />
        </button>
      </div>
    </div>
  );
}
