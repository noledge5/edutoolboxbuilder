// Presenting: one slide filling the screen. Arrow keys, space, a click or a swipe go on; answers of a
// slide with "erst auf Klick" appear first. N shows the speaker notes, F full screen, Esc ends.
// Tools: T timer, A Ampel, B black and W white screen. With the Referentenansicht a second window holds either the
// slides (for the projector) or the speaker view; both show the same state from here.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize, Minus, NotebookText, Plus, X } from 'lucide-react';
import { Icon } from '../icons';
import { stepCount, type Slide } from '../model/slides';
import { gong, setSoundOn, soundOn, unlockSound } from './gong';
import { ToolButtons, ToolOverlays, type ToolActions, type ToolState } from './PresentTools';
import { preparePopup, type SpeakerWindows } from './speaker';
import { SLIDE_H, SLIDE_W, SlideView, type SlideContext } from './SlideView';
import { addMinutes, newTimer, nextAmpel, pauseTimer, startTimer, timeLeft, toggleBlank, type Ampel, type Blank, type Timer } from './tools';

interface PresenterProps {
  slides: Slide[];
  ctx: SlideContext;
  start: number;
  /** The second window of the Referentenansicht, when it was opened. */
  speaker?: SpeakerWindows | null;
  /** Ends presenting; `at` is the slide shown last. */
  onClose(at: number): void;
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(s % 60).padStart(2, '0')}`;
};

type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => void };

/** Full screen for presenting, where the browser allows it (it needs a click or a key press first). */
export function enterFullscreen(doc: Document = document) {
  const el = doc.documentElement as FullscreenEl;
  try {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  } catch {
    // Not allowed here (e.g. an iPhone): the slides still fill the window.
  }
}

function leaveFullscreen(doc: Document = document) {
  if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {});
}

function useWindowSize(win: Window) {
  const [size, setSize] = useState({ w: win.innerWidth, h: win.innerHeight });
  useEffect(() => {
    const on = () => setSize({ w: win.innerWidth, h: win.innerHeight });
    on();
    win.addEventListener('resize', on);
    return () => win.removeEventListener('resize', on);
  }, [win]);
  return size;
}

const NOTE_KEY = 'arbeitsblatt-baukasten:notizen-groesse';
const storedNoteSize = () => {
  try {
    return Number(localStorage.getItem(NOTE_KEY)) || 22;
  } catch {
    return 22;
  }
};

/** One slide, scaled; kept apart so the ticking clock does not draw the slide again. */
const ScaledSlide = memo(function ScaledSlide({ slide, number, ctx, step, scale, live }: { slide: Slide; number: number; ctx: SlideContext; step: number; scale: number; live: boolean }) {
  return <SlideView slide={slide} number={number} ctx={ctx} step={step} live={live} style={{ transform: `scale(${scale})` }} />;
});

export function Presenter({ slides, ctx, start, speaker = null, onClose }: PresenterProps) {
  const [k, setK] = useState(Math.min(start, slides.length - 1));
  // Clicks so far on this slide: entries, answers and elements that come on a click.
  const [step, setStep] = useState(0);
  // Direction of the last change, for the "push" transition.
  const [back, setBack] = useState(false);
  const [notes, setNotes] = useState(false);
  const [idle, setIdle] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [began] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [timer, setTimer] = useState<Timer | null>(null);
  const [sound, setSound] = useState(soundOn);
  const [ampel, setAmpel] = useState<Ampel>('');
  const [blank, setBlank] = useState<Blank>('');
  /** The second window; null once it is closed. */
  const [pair, setPair] = useState<SpeakerWindows | null>(speaker);
  const [popupFull, setPopupFull] = useState(false);
  const [noteSize, setNoteSizeState] = useState(storedNoteSize);
  const slide = slides[k];

  const close = useCallback(() => {
    leaveFullscreen();
    pair?.win.close();
    onClose(k);
  }, [k, onClose, pair]);

  const go = useCallback(
    (to: number, at: number) => {
      setBack(to < k);
      setK(to);
      setStep(at);
    },
    [k],
  );

  const next = useCallback(() => {
    if (step < stepCount(slides[k])) setStep(step + 1);
    else if (k < slides.length - 1) go(k + 1, 0);
  }, [k, step, slides, go]);

  const prev = useCallback(() => {
    if (step > 0) setStep(step - 1);
    // Going back shows the previous slide as it was left: everything open.
    else if (k > 0) go(k - 1, stepCount(slides[k - 1]));
  }, [k, step, slides, go]);

  // — Tools —
  const act: ToolActions = {
    startTimer: (m) => {
      unlockSound();
      const t = Date.now();
      setNow(t);
      setTimer(startTimer(newTimer(m), t));
    },
    toggleTimer: () => {
      unlockSound();
      const t = Date.now();
      setNow(t);
      setTimer((x) => x && (x.since === null ? startTimer(x, t) : pauseTimer(x, t)));
    },
    addMinutes: (m) => {
      const t = Date.now();
      setNow(t);
      setTimer((x) => x && addMinutes(x, t, m));
    },
    clearTimer: () => setTimer(null),
    setSound: (on) => {
      setSoundOn(on);
      setSound(on);
    },
    setAmpel,
    setBlank,
  };
  const tools: ToolState = { timer, now, sound, ampel, blank, minutes: slide?.minutes ?? 0 };

  /** T: the timer starts with the slide's minutes, stops or goes on; without minutes the panel is the way. */
  const keyTimer = () => {
    const t = Date.now();
    if (timer && timeLeft(timer, t) > 0) act.toggleTimer();
    else if (slide?.minutes) act.startTimer(slide.minutes);
  };

  // The clock: more often while a timer runs, so its bar moves smoothly.
  const running = !!timer && timer.since !== null;
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), running ? 250 : 1000);
    return () => clearInterval(t);
  }, [running]);

  // The gong, once, when the time is over.
  const rang = useRef<Timer | null>(null);
  useEffect(() => {
    if (timer && timer.since !== null && timeLeft(timer, now) === 0 && rang.current !== timer) {
      rang.current = timer;
      if (sound) gong();
    }
  }, [timer, now, sound]);

  // Keys work in both windows.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {});
  onKey.current = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key;
    const lower = key.toLowerCase();
    const forward = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(key);
    const backward = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(key);
    // A black or white screen ends with the next key, without turning the slide.
    if (blank && (forward || backward)) setBlank('');
    else if (forward) next();
    else if (backward) prev();
    else if (key === 'Home') go(0, 0);
    else if (key === 'End') go(slides.length - 1, 0);
    else if (key === 'Escape') close();
    else if (lower === 'n' && !pair) setNotes((n) => !n);
    else if (lower === 'f') {
      // Full screen for the window the key was pressed in.
      const doc = e.view?.document ?? document;
      if (doc.fullscreenElement) leaveFullscreen(doc);
      else enterFullscreen(doc);
    } else if (lower === 'b') setBlank((b) => toggleBlank(b, 'black'));
    else if (lower === 'w') setBlank((b) => toggleBlank(b, 'white'));
    else if (lower === 'a') setAmpel(nextAmpel);
    else if (lower === 't') keyTimer();
    else return;
    e.preventDefault();
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey.current(e);
    const wins = [window, ...(pair ? [pair.win] : [])];
    for (const w of wins) w.addEventListener('keydown', handler);
    return () => {
      for (const w of wins) w.removeEventListener('keydown', handler);
    };
  }, [pair]);

  // The second window: styles and a place to render into; closing it ends the Referentenansicht.
  const popupRoot = useMemo(() => (pair ? preparePopup(pair.win, pair.popup === 'audience' ? 'Folien für den Beamer' : 'Referentenansicht') : null), [pair]);
  useEffect(() => {
    if (!pair) return;
    const { win } = pair;
    const gone = () => setPair(null);
    const onFull = () => setPopupFull(!!win.document.fullscreenElement);
    win.addEventListener('pagehide', gone);
    win.document.addEventListener('fullscreenchange', onFull);
    const poll = setInterval(() => win.closed && gone(), 700);
    return () => {
      clearInterval(poll);
      win.removeEventListener('pagehide', gone);
      if (!win.closed) win.document.removeEventListener('fullscreenchange', onFull);
    };
  }, [pair]);
  const pairRef = useRef(pair);
  pairRef.current = pair;
  useEffect(() => () => pairRef.current?.win.close(), []);

  // The controls and the pointer disappear while nothing moves.
  useEffect(() => {
    if (idle || panelOpen) return;
    const t = setTimeout(() => setIdle(true), 2500);
    return () => clearTimeout(t);
  }, [idle, k, step, panelOpen]);

  if (!slide) return null;
  const steps = stepCount(slide);
  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();

  const audience = (win: Window, extra: { controls?: ReactNode; hint?: ReactNode }) => (
    <Audience
      win={win}
      slide={slide}
      number={k + 1}
      ctx={ctx}
      step={step}
      back={back}
      k={k}
      tools={tools}
      idle={idle && !panelOpen}
      onActivity={() => setIdle(false)}
      onNext={next}
      onPrev={prev}
      onUnblank={() => setBlank('')}
      hint={extra.hint}
    >
      {extra.controls}
    </Audience>
  );

  const controls = (
    <div className="sl-controls" onClick={stop} onTouchEnd={stop}>
      <button type="button" className="iconbtn" onClick={prev} disabled={k === 0 && step === 0} title="Zurück (←)" aria-label="Zurück">
        <Icon icon={ChevronLeft} size={20} />
      </button>
      <span className="sl-count">
        {k + 1} / {slides.length}
      </span>
      {steps > 0 && (
        <span className="sl-dots" title={`Klick ${step} von ${steps} auf dieser Folie`}>
          {Array.from({ length: steps }, (_, i) => (
            <i key={i} className={i < step ? 'is-on' : ''} />
          ))}
        </span>
      )}
      <button type="button" className="iconbtn" onClick={next} disabled={k === slides.length - 1 && step >= steps} title="Weiter (→, Leertaste)" aria-label="Weiter">
        <Icon icon={ChevronRight} size={20} />
      </button>
      <span className="sl-clock" title="Zeit seit Beginn">
        {clock(now - began)}
      </span>
      <span className="sl-sep" />
      <ToolButtons s={tools} act={act} onPanel={setPanelOpen} />
      <span className="sl-sep" />
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
  );

  const speakerView = (win: Window) => (
    <SpeakerView
      win={win}
      slides={slides}
      ctx={ctx}
      k={k}
      step={step}
      now={now}
      began={began}
      tools={tools}
      act={act}
      noteSize={noteSize}
      onNoteSize={(n) => {
        setNoteSizeState(n);
        try {
          localStorage.setItem(NOTE_KEY, String(n));
        } catch {
          // Not kept.
        }
      }}
      onNext={next}
      onPrev={prev}
      onClose={close}
      waiting={pair?.popup === 'audience' && !popupFull ? 'Das Folienfenster auf den Beamer ziehen und einmal hineinklicken: dann füllt es den Bildschirm.' : ''}
    />
  );

  // Alone: the slides with the bar at the bottom.
  if (!pair || !popupRoot) {
    return (
      <>
        {audience(window, { controls })}
        {notes && (
          <div className="sl-notes" onClick={stop}>
            <b>Notizen zu Folie {k + 1}</b>
            <p>{slide.notes || 'Keine Notizen.'}</p>
            <span className="sl-notes-tip">
              Wird der Bildschirm gespiegelt, sieht die Klasse die Notizen mit; die Referentenansicht zeigt sie nur dir. N blendet sie aus. Nach dem Abspielen eines Videos einmal neben das Video klicken, dann blättern die Tasten wieder.
            </span>
          </div>
        )}
      </>
    );
  }

  // Referentenansicht: here the speaker view and the slides in the new window, or the other way round (Chrome).
  const hint = !popupFull ? (
    <div
      className="sl-popup-hint"
      onClick={(e) => {
        e.stopPropagation();
        enterFullscreen(pair.win.document);
      }}
    >
      <b>Folien für den Beamer</b>
      <span>Zieh dieses Fenster auf den Beamer und klicke hier hinein: dann füllt es den Bildschirm. Blättern und alle Werkzeuge in der Referentenansicht.</span>
    </div>
  ) : null;
  if (pair.popup === 'audience') {
    return (
      <>
        {speakerView(window)}
        {createPortal(audience(pair.win, { hint }), popupRoot)}
      </>
    );
  }
  return (
    <>
      {audience(window, {})}
      {createPortal(speakerView(pair.win), popupRoot)}
    </>
  );
}

interface AudienceProps {
  win: Window;
  slide: Slide;
  number: number;
  ctx: SlideContext;
  step: number;
  back: boolean;
  /** Index of the slide, for the transition. */
  k: number;
  tools: ToolState;
  idle: boolean;
  onActivity(): void;
  onNext(): void;
  onPrev(): void;
  onUnblank(): void;
  /** Shown over the slides until the new window is in full screen. */
  hint?: ReactNode;
  /** The bar at the bottom (not in the Referentenansicht). */
  children?: ReactNode;
}

/** What the class sees: the slide, the timer bar and the Ampel, a black or white screen. */
function Audience({ win, slide, number, ctx, step, back, k, tools, idle, onActivity, onNext, onPrev, onUnblank, hint, children }: AudienceProps) {
  const size = useWindowSize(win);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const scale = Math.min(size.w / SLIDE_W, size.h / SLIDE_H);
  // A video takes its own clicks (play, pause), they do not turn the slide.
  // (Duck-typed: in the second window elements come from another realm.)
  const inVideo = (t: EventTarget) => typeof (t as Element).closest === 'function' && !!(t as Element).closest('.sl-el-video');
  const frame = { width: SLIDE_W * scale, height: SLIDE_H * scale };
  return (
    <div
      className={'sl-present' + (idle ? ' is-idle' : '')}
      role="dialog"
      aria-label="Präsentation"
      onPointerMove={onActivity}
      onClick={(e) => {
        if (inVideo(e.target)) return;
        // Left third goes back, the rest goes on.
        if (e.clientX < size.w / 3) onPrev();
        else onNext();
      }}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t || inVideo(e.target)) return;
        const dx = e.changedTouches[0].clientX - t.x;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.changedTouches[0].clientY - t.y)) {
          e.preventDefault();
          if (dx < 0) onNext();
          else onPrev();
        }
      }}
    >
      <div key={k} className={`sl-present-frame sl-trans-${slide.transition}${back ? ' is-back' : ''}`} style={frame}>
        <ScaledSlide slide={slide} number={number} ctx={ctx} step={step} scale={scale} live />
      </div>
      <div className="sl-present-over" style={{ ...frame, ['--s' as string]: scale }}>
        <ToolOverlays timer={tools.timer} now={tools.now} ampel={tools.ampel} />
      </div>
      {tools.blank && (
        <div
          className={'sl-blank is-' + tools.blank}
          onClick={(e) => {
            e.stopPropagation();
            onUnblank();
          }}
        />
      )}
      {hint}
      {children}
    </div>
  );
}

interface SpeakerViewProps {
  win: Window;
  slides: Slide[];
  ctx: SlideContext;
  k: number;
  step: number;
  now: number;
  began: number;
  tools: ToolState;
  act: ToolActions;
  noteSize: number;
  onNoteSize(n: number): void;
  onNext(): void;
  onPrev(): void;
  onClose(): void;
  /** A note while the slides window is not yet on the projector. */
  waiting: string;
}

/** The teacher's screen, like Keynote: current slide large, the next click or slide, notes, times and tools. */
function SpeakerView({ win, slides, ctx, k, step, now, began, tools, act, noteSize, onNoteSize, onNext, onPrev, onClose, waiting }: SpeakerViewProps) {
  const size = useWindowSize(win);
  const slide = slides[k];
  const steps = stepCount(slide);
  const pad = 20;
  const top = 64;
  const nav = 52;
  const leftW = Math.max(320, Math.round(size.w * 0.64) - pad);
  const bigScale = Math.max(0.05, Math.min(leftW / SLIDE_W, (size.h - top - nav - pad * 3) / SLIDE_H));
  const rightW = Math.max(200, size.w - leftW - pad * 3);
  const smallScale = Math.min(rightW / SLIDE_W, (size.h * 0.32) / SLIDE_H);
  const coming = step < steps ? { slide, number: k + 1, step: step + 1, label: `Als Nächstes: Klick ${step + 1} von ${steps}` } : k < slides.length - 1 ? { slide: slides[k + 1], number: k + 2, step: 0, label: `Als Nächstes: Folie ${k + 2}` } : null;
  const time = new Date(now).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const blankText = tools.blank === 'black' ? 'Die Klasse sieht gerade: Schwarzbild' : tools.blank === 'white' ? 'Die Klasse sieht gerade: Weißbild' : '';
  return (
    <div className="sl-speaker" role="dialog" aria-label="Referentenansicht" style={{ gridTemplateColumns: `${leftW}px minmax(0, 1fr)` }}>
      <header className="sl-speaker-top">
        <span className="sl-speaker-count">
          Folie {k + 1} / {slides.length}
          {steps > 0 && <small> · Klick {step} von {steps}</small>}
        </span>
        <span className="sl-speaker-time" title="Uhrzeit">
          {time}
        </span>
        <span className="sl-speaker-time is-soft" title="Zeit seit Beginn">
          {clock(now - began)}
        </span>
        <ToolButtons s={tools} act={act} below />
        <button type="button" className="sl-pill sl-speaker-end" onClick={onClose} title="Beenden (Esc)">
          <Icon icon={X} size={16} />
          Beenden
        </button>
      </header>
      <div className="sl-speaker-main">
        {waiting && <div className="sl-speaker-wait">{waiting}</div>}
        <div className="sl-speaker-now" style={{ width: SLIDE_W * bigScale, height: SLIDE_H * bigScale }} onClick={onNext} title="Klick: weiter">
          <ScaledSlide slide={slide} number={k + 1} ctx={ctx} step={step} scale={bigScale} live={false} />
          <div className="sl-present-over" style={{ width: SLIDE_W * bigScale, height: SLIDE_H * bigScale, ['--s' as string]: bigScale }}>
            <ToolOverlays timer={tools.timer} now={tools.now} ampel={tools.ampel} />
          </div>
          {blankText && <div className={'sl-speaker-blank is-' + tools.blank}>{blankText}</div>}
        </div>
        <div className="sl-speaker-nav">
          <button type="button" className="sl-pill" onClick={onPrev} disabled={k === 0 && step === 0}>
            <Icon icon={ChevronLeft} size={18} />
            Zurück
          </button>
          <button type="button" className="sl-pill is-main" onClick={onNext} disabled={!coming}>
            Weiter
            <Icon icon={ChevronRight} size={18} />
          </button>
        </div>
      </div>
      <aside className="sl-speaker-side">
        <div className="sl-speaker-label">{coming ? coming.label : 'Ende der Präsentation'}</div>
        {coming && (
          <div className="sl-speaker-next" style={{ width: SLIDE_W * smallScale, height: SLIDE_H * smallScale }}>
            <ScaledSlide slide={coming.slide} number={coming.number} ctx={ctx} step={coming.step} scale={smallScale} live={false} />
          </div>
        )}
        <div className="sl-speaker-label sl-speaker-notes-head">
          Notizen
          <span>
            <button type="button" className="iconbtn" onClick={() => onNoteSize(Math.max(14, noteSize - 2))} title="Kleiner" aria-label="Notizen kleiner">
              <Icon icon={Minus} size={16} />
            </button>
            <button type="button" className="iconbtn" onClick={() => onNoteSize(Math.min(44, noteSize + 2))} title="Größer" aria-label="Notizen größer">
              <Icon icon={Plus} size={16} />
            </button>
          </span>
        </div>
        <div className="sl-speaker-notes" style={{ fontSize: noteSize }}>
          {slide.notes || <span className="is-empty">Keine Notizen zu dieser Folie.</span>}
        </div>
      </aside>
    </div>
  );
}
