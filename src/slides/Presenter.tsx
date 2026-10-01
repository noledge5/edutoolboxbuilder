// Presenting: one slide filling the screen. Arrow keys, space, a click or a swipe go on; answers of a
// slide with "erst auf Klick" appear first, under cards that can also be tapped open one by one. N shows the speaker
// notes, F full screen, Esc ends. Tools: T timer, A Ampel, B black and W white screen, P the pen (the pencil on an
// iPad always writes). Blank boards can be put in between; what was written can be kept as a Tafelbild.
// With the Referentenansicht a second window holds either the slides (for the projector) or the speaker view; both
// show the same state from here.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize, Minus, NotebookText, PenLine, Plus, X } from 'lucide-react';
import { Icon } from '../icons';
import { boardFromInk, boardName, deckOrder, hasInk, inkFromBoard, type BlankBoard, type Board, type DeckItem, type Paper, type Stroke } from '../model/ink';
import { uid } from '../model/ops';
import { gapCount, nextStep, stepCount, workSteps, type Slide } from '../model/slides';
import { gong, setSoundOn, soundOn, unlockSound } from './gong';
import { BoardView, InkSvg } from './Ink';
import { PenBar, pencilSeen, useInkInput, usePenSettings, type PenSettings } from './Pen';
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
  /** Saved Tafelbilder of the lesson, to show again. */
  boards?: Board[];
  /** Start with this Tafelbild on the slides. */
  board?: Board | null;
  /** Keeps what was written as a Tafelbild (asked when presenting ends). */
  onSaveBoard?(board: Board): void;
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

type Item = DeckItem<Slide>;
const NONE: ReadonlySet<string> = new Set();
const NO_STROKES: Stroke[] = [];

/** One page (a slide or a blank board), scaled; kept apart so the ticking clock does not draw it again. */
const ScaledPage = memo(function ScaledPage(p: { item: Item; ctx: SlideContext; step: number; scale: number; live: boolean; opened: ReadonlySet<string>; votes: Record<number, number> }) {
  const style = { transform: `scale(${p.scale})` };
  if (p.item.kind === 'board') return <BoardView paper={p.item.board.paper} design={p.ctx.design} style={style} />;
  return <SlideView slide={p.item.slide} number={p.item.number} ctx={p.ctx} step={p.step} live={p.live} opened={p.opened} votes={p.votes} style={style} />;
});

/** What was written on a page, over it. */
const InkOverlay = memo(function InkOverlay({ strokes, live, scale, design }: { strokes: Stroke[]; live: Stroke | null; scale: number; design: string }) {
  if (!strokes.length && !live) return null;
  return (
    <div className={`sl-ink-page is-d-${design}`} style={{ transform: `scale(${scale})` }}>
      <InkSvg strokes={live ? [...strokes, live] : strokes} />
    </div>
  );
});

/** The pen's state and actions for a page, shared by both windows. */
interface InkPort {
  settings: PenSettings;
  on: boolean;
  strokes: Stroke[];
  live: Stroke | null;
  onBegin(): void;
  onChange(strokes: Stroke[]): void;
  onLive(s: Stroke | null): void;
  onPencil(): void;
}

/** A frame showing a page at `scale` where the pen writes. */
function InkFrame({ ink, scale, design, className, style, busy, onClick, title, children }: { ink: InkPort; scale: number; design: string; className: string; style: CSSProperties; busy?: { current: number }; onClick?(e: React.MouseEvent): void; title?: string; children: ReactNode }) {
  const handlers = useInkInput({ ...ink, scale, busy });
  return (
    <div className={className} style={{ ...style, touchAction: 'none' }} {...handlers} onClick={onClick} title={title}>
      {children}
      <InkOverlay strokes={ink.strokes} live={ink.live} scale={scale} design={design} />
    </div>
  );
}

/** Taps on a card, a cover or a vote while presenting: the key of the card, or the box voted for. */
function tapTarget(t: EventTarget): { card: string } | { vote: number; by: 1 | -1 } | null {
  // Duck-typed: in the second window elements come from another realm.
  const el = t as HTMLElement;
  if (typeof el.closest !== 'function') return null;
  const card = el.closest<HTMLElement>('[data-card]');
  if (card?.dataset.card) return { card: card.dataset.card };
  const minus = el.closest<HTMLElement>('[data-unvote]');
  if (minus) return { vote: Number(minus.dataset.unvote), by: -1 };
  const vote = el.closest<HTMLElement>('[data-vote]');
  if (vote) return { vote: Number(vote.dataset.vote), by: 1 };
  return null;
}

export function Presenter({ slides, ctx, start, speaker = null, boards = [], board = null, onSaveBoard, onClose }: PresenterProps) {
  // — The pen: strokes per page, blank boards, undo —
  const [initial] = useState(() => (board ? inkFromBoard(board) : { ink: {}, blanks: [] as BlankBoard[] }));
  const [ink, setInk] = useState<Record<string, Stroke[]>>(initial.ink);
  const [blanks, setBlanks] = useState<BlankBoard[]>(initial.blanks);
  const [history, setHistory] = useState<{ page: string; strokes: Stroke[]; blanks?: BlankBoard[] }[]>([]);
  const [live, setLive] = useState<{ page: string; stroke: Stroke } | null>(null);
  const [pen, setPen] = usePenSettings();
  const [penOn, setPenOn] = useState(false);
  /** The pen bar was closed by hand: a pencil writes on without opening it again. */
  const barClosed = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const deck = useMemo(() => deckOrder(slides, blanks), [slides, blanks]);

  const [k, setK] = useState(() => {
    const id = slides[Math.min(start, slides.length - 1)]?.id;
    return Math.max(0, deck.findIndex((d) => d.id === id));
  });
  // Clicks so far on this slide: entries, answers and elements that come on a click.
  const [step, setStep] = useState(0);
  /** Cards, gaps and covers tapped open on this slide; hands counted in a vote. */
  const [opened, setOpened] = useState<ReadonlySet<string>>(NONE);
  const [votes, setVotes] = useState<Record<number, number>>({});
  // Direction of the last change, for the "push" transition.
  const [back, setBack] = useState(false);
  const forward = useRef(true);
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
  /** The hint in the slides window was clicked (also when the browser does not allow full screen there). */
  const [hintDone, setHintDone] = useState(false);
  const placed = popupFull || hintDone;
  const [noteSize, setNoteSizeState] = useState(storedNoteSize);
  const item = deck[Math.min(k, deck.length - 1)];
  const slide = item?.kind === 'slide' ? item.slide : null;
  /** The slide shown, or for a blank board the slide before it (where presenting ends). */
  const slideIndex = Math.max(0, item ? item.number - 1 : 0);

  const finish = useCallback(() => {
    leaveFullscreen();
    pair?.win.close();
    onClose(slideIndex);
  }, [slideIndex, onClose, pair]);

  /** Ends presenting; asks first whether to keep what was written. */
  const close = useCallback(() => {
    if (onSaveBoard && dirty && hasInk(ink, blanks)) {
      setSaveName(boardName(Date.now()));
      setSaving(true);
      setPanelOpen(true);
    } else finish();
  }, [onSaveBoard, dirty, ink, blanks, finish]);

  const save = () => {
    onSaveBoard?.(
      boardFromInk(
        ink,
        blanks,
        slides.map((s) => s.id),
        saveName.trim() || boardName(Date.now()),
        Date.now(),
      ),
    );
    finish();
  };

  const go = useCallback(
    (to: number, at: number) => {
      setBack(to < k);
      forward.current = to > k;
      setK(to);
      setStep(at);
      setOpened(NONE);
      setVotes({});
    },
    [k],
  );

  const steps = slide ? stepCount(slide) : 0;
  const next = useCallback(() => {
    const s = slide ? nextStep(slide, step, opened) : null;
    if (s !== null) {
      forward.current = true;
      setStep(s);
    } else if (k < deck.length - 1) go(k + 1, 0);
  }, [k, step, slide, opened, deck.length, go]);

  const prev = useCallback(() => {
    if (step > 0) {
      forward.current = false;
      setStep(step - 1);
    }
    // Going back shows the previous slide as it was left: everything open.
    else if (k > 0) {
      const before = deck[k - 1];
      go(k - 1, before.kind === 'slide' ? stepCount(before.slide) : 0);
    }
  }, [k, step, deck, go]);

  /** A card, gap or cover tapped open; a gap's part counts as open once all its gaps are. */
  const openCard = useCallback(
    (key: string) => {
      setOpened((o) => {
        const n = new Set(o);
        n.add(key);
        const m = /^(.+)#\d+$/.exec(key);
        if (m && slide) {
          const total = gapCount(slide, m[1]);
          if (Array.from({ length: total }, (_, i) => n.has(`${m[1]}#${i}`)).every(Boolean)) n.add(m[1]);
        }
        return n;
      });
    },
    [slide],
  );
  const vote = (i: number, by: 1 | -1) => setVotes((v) => ({ ...v, [i]: Math.max(0, (v[i] ?? 0) + by) }));
  /** A tap on the slide: a card, a cover or a vote, if that is what was tapped. */
  const tap = (t: EventTarget) => {
    const hit = tapTarget(t);
    if (!hit) return false;
    if ('card' in hit) openCard(hit.card);
    else vote(hit.vote, hit.by);
    return true;
  };

  // — The pen —
  const page = item?.id ?? '';
  const pageStrokes = ink[page] ?? NO_STROKES;
  const port: InkPort = {
    settings: pen,
    on: penOn,
    strokes: pageStrokes,
    live: live?.page === page ? live.stroke : null,
    onBegin: () => {
      setHistory((h) => [...h.slice(-99), { page, strokes: pageStrokes }]);
      setDirty(true);
    },
    onChange: (strokes) => setInk((x) => ({ ...x, [page]: strokes })),
    onLive: (stroke) => setLive(stroke ? { page, stroke } : null),
    onPencil: () => {
      if (pencilSeen()) setPen({ finger: false });
      if (!penOn && !barClosed.current) setPenOn(true);
    },
  };
  const togglePen = () => {
    barClosed.current = penOn;
    setPenOn(!penOn);
  };
  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(history.slice(0, -1));
    setInk((x) => ({ ...x, [last.page]: last.strokes }));
    if (last.blanks) setBlanks(last.blanks);
  };
  const clearPage = () => {
    if (!pageStrokes.length) return;
    port.onBegin();
    setInk((x) => ({ ...x, [page]: [] }));
  };
  const addBlank = (paper: Paper) => {
    const b: BlankBoard = { id: uid(), after: page, paper };
    setHistory((h) => [...h.slice(-99), { page, strokes: pageStrokes, blanks }]);
    setDirty(true);
    setBlanks([...blanks, b]);
    // The new board comes right after this page.
    setBack(false);
    forward.current = true;
    setK(k + 1);
    setStep(0);
    setOpened(NONE);
    setVotes({});
    if (!penOn) setPenOn(true);
  };
  const loadBoard = (b: Board) => {
    if (hasInk(ink, blanks) && !window.confirm(`Das Geschriebene durch „${b.name || 'Tafelbild'}“ ersetzen?`)) return;
    const loaded = inkFromBoard(b);
    const id = item?.kind === 'slide' ? item.id : '';
    setInk(loaded.ink);
    setBlanks(loaded.blanks);
    setHistory([]);
    setDirty(false);
    // Stay on the slide shown (blank boards of the old Tafelbild are gone).
    const at = deckOrder(slides, loaded.blanks).findIndex((d) => d.id === id);
    setK(Math.max(0, at));
    setStep(0);
  };

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
  const minutes = slide ? (slide.layout === 'work' && workSteps(slide).length > 1 ? workSteps(slide)[step]?.minutes || slide.minutes : slide.minutes) : 0;
  const tools: ToolState = { timer, now, sound, ampel, blank, minutes };

  /** T: the timer starts with the slide's minutes, stops or goes on; without minutes the panel is the way. */
  const keyTimer = () => {
    const t = Date.now();
    if (timer && timeLeft(timer, t) > 0) act.toggleTimer();
    else if (minutes) act.startTimer(minutes);
  };

  // A work phase starts its timer when it comes (and each of its steps), going forward.
  const autoTimer = useRef('');
  useEffect(() => {
    if (!slide || slide.layout !== 'work' || !forward.current) return;
    const key = `${slide.id}:${step}`;
    if (autoTimer.current === key) return;
    autoTimer.current = key;
    const ws = workSteps(slide);
    const m = ws.length > 1 ? ws[step]?.minutes : slide.minutes || ws[0]?.minutes || 0;
    if (m) {
      const t = Date.now();
      setNow(t);
      setTimer(startTimer(newTimer(m), t));
    }
  }, [slide, step]);

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
    const typing = typeof (e.target as HTMLElement)?.closest === 'function' && !!(e.target as HTMLElement).closest('input, textarea');
    if (saving) {
      if (e.key === 'Escape') {
        setSaving(false);
        setPanelOpen(false);
      }
      return;
    }
    if (typing) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key;
    const lower = key.toLowerCase();
    const forwardKey = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(key);
    const backwardKey = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(key);
    // A black or white screen ends with the next key, without turning the slide.
    if (blank && (forwardKey || backwardKey)) setBlank('');
    else if (forwardKey) next();
    else if (backwardKey) prev();
    else if (key === 'Home') go(0, 0);
    else if (key === 'End') go(deck.length - 1, 0);
    else if (key === 'Escape') {
      if (penOn) togglePen();
      else close();
    } else if (lower === 'n' && !pair) setNotes((n) => !n);
    else if (lower === 'f') {
      // Full screen for the window the key was pressed in.
      const doc = e.view?.document ?? document;
      if (doc.fullscreenElement) leaveFullscreen(doc);
      else enterFullscreen(doc);
    } else if (lower === 'b') setBlank((b) => toggleBlank(b, 'black'));
    else if (lower === 'w') setBlank((b) => toggleBlank(b, 'white'));
    else if (lower === 'a') setAmpel(nextAmpel);
    else if (lower === 't') keyTimer();
    else if (lower === 'p') togglePen();
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

  // The controls and the pointer disappear while nothing moves (not while the pen is out).
  useEffect(() => {
    if (idle || panelOpen || penOn) return;
    const t = setTimeout(() => setIdle(true), 2500);
    return () => clearTimeout(t);
  }, [idle, k, step, panelOpen, penOn]);

  if (!item) return null;
  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();

  const penBar = (place: 'top' | 'inline') =>
    penOn && (
      <PenBar
        s={pen}
        set={setPen}
        canUndo={history.length > 0}
        onUndo={undo}
        onClear={clearPage}
        onBlank={addBlank}
        boards={boards}
        onLoad={loadBoard}
        onClose={togglePen}
        place={place}
      />
    );
  const penButton = (
    <button type="button" className={'iconbtn' + (penOn ? ' is-on' : '')} onClick={togglePen} title="Stift (P)" aria-label="Stift" aria-pressed={penOn}>
      <Icon icon={PenLine} size={18} />
    </button>
  );

  const saveDialog = saving && (
    <div className="sl-save-board" role="dialog" aria-label="Tafelbild sichern" onClick={stop} onPointerDown={stop} onTouchEnd={stop}>
      <b>Tafelbild sichern?</b>
      <p>Was du auf die Folien geschrieben hast, bleibt bei der Stunde. Du kannst es beim nächsten Mal wieder einblenden oder als PDF drucken.</p>
      <input className="input" value={saveName} onChange={(e) => setSaveName(e.target.value)} aria-label="Name des Tafelbilds" autoFocus onKeyDown={(e) => e.key === 'Enter' && save()} />
      <div className="sl-save-row">
        <button type="button" className="sl-pill" onClick={() => (setSaving(false), setPanelOpen(false))}>
          Zurück
        </button>
        <button type="button" className="sl-pill" onClick={finish}>
          Nicht sichern
        </button>
        <button type="button" className="sl-pill is-main" onClick={save}>
          Sichern
        </button>
      </div>
    </div>
  );

  const audience = (win: Window, extra: { controls?: ReactNode; hint?: ReactNode }) => (
    <Audience
      win={win}
      item={item}
      ctx={ctx}
      step={step}
      opened={opened}
      votes={votes}
      ink={port}
      back={back}
      k={k}
      tools={tools}
      idle={idle && !panelOpen && !penOn}
      onActivity={() => setIdle(false)}
      onNext={next}
      onPrev={prev}
      onTap={tap}
      onUnblank={() => setBlank('')}
      hint={extra.hint}
    >
      {extra.controls}
    </Audience>
  );

  const controls = (
    <>
      {penBar('top')}
      <div className="sl-controls" onClick={stop} onTouchEnd={stop}>
        <button type="button" className="iconbtn" onClick={prev} disabled={k === 0 && step === 0} title="Zurück (←)" aria-label="Zurück">
          <Icon icon={ChevronLeft} size={20} />
        </button>
        <span className="sl-count">
          {item.kind === 'board' ? 'Tafel' : `${item.number} / ${slides.length}`}
        </span>
        {steps > 0 && (
          <span className="sl-dots" title={`Klick ${step} von ${steps} auf dieser Folie`}>
            {Array.from({ length: steps }, (_, i) => (
              <i key={i} className={i < step ? 'is-on' : ''} />
            ))}
          </span>
        )}
        <button type="button" className="iconbtn" onClick={next} disabled={k === deck.length - 1 && step >= steps} title="Weiter (→, Leertaste)" aria-label="Weiter">
          <Icon icon={ChevronRight} size={20} />
        </button>
        <span className="sl-clock" title="Zeit seit Beginn">
          {clock(now - began)}
        </span>
        <span className="sl-sep" />
        <ToolButtons s={tools} act={act} onPanel={setPanelOpen} />
        {penButton}
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
      {saveDialog}
    </>
  );

  const speakerView = (win: Window) => (
    <SpeakerView
      win={win}
      deck={deck}
      slideCount={slides.length}
      ctx={ctx}
      k={k}
      step={step}
      opened={opened}
      votes={votes}
      ink={port}
      allInk={ink}
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
      onTap={tap}
      onClose={close}
      penButton={penButton}
      penBar={penBar('inline')}
      dialog={saveDialog}
      waiting={pair?.popup === 'audience' && !placed ? 'Das Folienfenster auf den Beamer ziehen und einmal hineinklicken: dann füllt es den Bildschirm.' : ''}
    />
  );

  // Alone: the slides with the bar at the bottom.
  if (!pair || !popupRoot) {
    return (
      <>
        {audience(window, { controls })}
        {notes && (
          <div className="sl-notes" onClick={stop}>
            <b>Notizen zu Folie {item.number}</b>
            <p>{slide?.notes || 'Keine Notizen.'}</p>
            <span className="sl-notes-tip">
              Wird der Bildschirm gespiegelt, sieht die Klasse die Notizen mit; die Referentenansicht zeigt sie nur dir. N blendet sie aus. Nach dem Abspielen eines Videos einmal neben das Video
              klicken, dann blättern die Tasten wieder.
            </span>
          </div>
        )}
      </>
    );
  }

  // Referentenansicht: here the speaker view and the slides in the new window, or the other way round (Chrome).
  const hint = !placed ? (
    <div
      className="sl-popup-hint"
      onClick={(e) => {
        e.stopPropagation();
        setHintDone(true);
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
  item: Item;
  ctx: SlideContext;
  step: number;
  opened: ReadonlySet<string>;
  votes: Record<number, number>;
  ink: InkPort;
  back: boolean;
  /** Index of the page, for the transition. */
  k: number;
  tools: ToolState;
  idle: boolean;
  onActivity(): void;
  onNext(): void;
  onPrev(): void;
  /** A tap on a card, a cover or a vote: true when it was one. */
  onTap(target: EventTarget): boolean;
  onUnblank(): void;
  /** Shown over the slides until the new window is in full screen. */
  hint?: ReactNode;
  /** The bar at the bottom (not in the Referentenansicht). */
  children?: ReactNode;
}

/** What the class sees: the slide with what was written on it, the timer bar and the Ampel, a black or white screen. */
function Audience({ win, item, ctx, step, opened, votes, ink, back, k, tools, idle, onActivity, onNext, onPrev, onTap, onUnblank, hint, children }: AudienceProps) {
  const size = useWindowSize(win);
  const touch = useRef<{ x: number; y: number } | null>(null);
  /** When the pen last wrote: its touches are not swipes. */
  const busy = useRef(0);
  const scale = Math.min(size.w / SLIDE_W, size.h / SLIDE_H);
  // A video takes its own clicks (play, pause), they do not turn the slide.
  // (Duck-typed: in the second window elements come from another realm.)
  const inVideo = (t: EventTarget) => typeof (t as Element).closest === 'function' && !!(t as Element).closest('.sl-el-video');
  const frame = { width: SLIDE_W * scale, height: SLIDE_H * scale };
  const transition = item.kind === 'slide' ? item.slide.transition : 'fade';
  return (
    <div
      className={'sl-present' + (idle ? ' is-idle' : '') + (ink.on ? ' is-pen' : '')}
      role="dialog"
      aria-label="Präsentation"
      onPointerMove={onActivity}
      onClick={(e) => {
        if (inVideo(e.target) || onTap(e.target)) return;
        // Left third goes back, the rest goes on.
        if (e.clientX < size.w / 3) onPrev();
        else onNext();
      }}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        const stylus = (e.changedTouches[0] as Touch & { touchType?: string }).touchType === 'stylus';
        if (!t || stylus || inVideo(e.target) || Date.now() - busy.current < 500) return;
        const dx = e.changedTouches[0].clientX - t.x;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.changedTouches[0].clientY - t.y)) {
          e.preventDefault();
          if (dx < 0) onNext();
          else onPrev();
        }
      }}
    >
      <InkFrame key={k} ink={ink} scale={scale} design={ctx.design} className={`sl-present-frame sl-trans-${transition}${back ? ' is-back' : ''}`} style={frame} busy={busy}>
        <ScaledPage item={item} ctx={ctx} step={step} scale={scale} live opened={opened} votes={votes} />
      </InkFrame>
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
  deck: Item[];
  slideCount: number;
  ctx: SlideContext;
  k: number;
  step: number;
  opened: ReadonlySet<string>;
  votes: Record<number, number>;
  ink: InkPort;
  /** Strokes of all pages (for the next one). */
  allInk: Record<string, Stroke[]>;
  now: number;
  began: number;
  tools: ToolState;
  act: ToolActions;
  noteSize: number;
  onNoteSize(n: number): void;
  onNext(): void;
  onPrev(): void;
  onTap(target: EventTarget): boolean;
  onClose(): void;
  penButton: ReactNode;
  penBar: ReactNode;
  dialog: ReactNode;
  /** A note while the slides window is not yet on the projector. */
  waiting: string;
}

/** The teacher's screen, like Keynote: current slide large (to write on), the next click or slide, notes, times and tools. */
function SpeakerView(p: SpeakerViewProps) {
  const { win, deck, ctx, k, step, opened, votes, ink, now, began, tools, act, noteSize, onNoteSize, onNext, onPrev, onTap, onClose, waiting } = p;
  const size = useWindowSize(win);
  const item = deck[k];
  const slide = item.kind === 'slide' ? item.slide : null;
  const steps = slide ? stepCount(slide) : 0;
  const pad = 20;
  const top = 64;
  const nav = 52;
  const bar = ink.on ? 64 : 0;
  const leftW = Math.max(320, Math.round(size.w * 0.64) - pad);
  const bigScale = Math.max(0.05, Math.min(leftW / SLIDE_W, (size.h - top - nav - bar - pad * 3) / SLIDE_H));
  const rightW = Math.max(200, size.w - leftW - pad * 3);
  const smallScale = Math.min(rightW / SLIDE_W, (size.h * 0.32) / SLIDE_H);
  const nextAt = slide ? nextStep(slide, step, opened) : null;
  const coming =
    nextAt !== null
      ? { item, step: nextAt, opened, label: `Als Nächstes: Klick ${nextAt} von ${steps}` }
      : k < deck.length - 1
        ? { item: deck[k + 1], step: 0, opened: NONE, label: deck[k + 1].kind === 'board' ? 'Als Nächstes: leere Tafel' : `Als Nächstes: Folie ${deck[k + 1].number}` }
        : null;
  const time = new Date(now).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const blankText = tools.blank === 'black' ? 'Die Klasse sieht gerade: Schwarzbild' : tools.blank === 'white' ? 'Die Klasse sieht gerade: Weißbild' : '';
  return (
    <div className="sl-speaker" role="dialog" aria-label="Referentenansicht" style={{ gridTemplateColumns: `${leftW}px minmax(0, 1fr)` }}>
      <header className="sl-speaker-top">
        <span className="sl-speaker-count">
          {item.kind === 'board' ? `Leere Tafel nach Folie ${item.number}` : `Folie ${item.number} / ${p.slideCount}`}
          {steps > 0 && (
            <small>
              {' '}
              · Klick {step} von {steps}
            </small>
          )}
        </span>
        <span className="sl-speaker-time" title="Uhrzeit">
          {time}
        </span>
        <span className="sl-speaker-time is-soft" title="Zeit seit Beginn">
          {clock(now - began)}
        </span>
        <ToolButtons s={tools} act={act} below />
        <span className="sl-speaker-pen">{p.penButton}</span>
        <button type="button" className="sl-pill sl-speaker-end" onClick={onClose} title="Beenden (Esc)">
          <Icon icon={X} size={16} />
          Beenden
        </button>
      </header>
      <div className="sl-speaker-main">
        {waiting && <div className="sl-speaker-wait">{waiting}</div>}
        {p.penBar}
        <InkFrame
          ink={ink}
          scale={bigScale}
          design={ctx.design}
          className="sl-speaker-now"
          style={{ width: SLIDE_W * bigScale, height: SLIDE_H * bigScale }}
          onClick={(e) => onTap(e.target) || onNext()}
          title={ink.on ? undefined : 'Klick: weiter'}
        >
          <ScaledPage item={item} ctx={ctx} step={step} scale={bigScale} live={false} opened={opened} votes={votes} />
          <div className="sl-present-over" style={{ width: SLIDE_W * bigScale, height: SLIDE_H * bigScale, ['--s' as string]: bigScale }}>
            <ToolOverlays timer={tools.timer} now={tools.now} ampel={tools.ampel} />
          </div>
          {blankText && <div className={'sl-speaker-blank is-' + tools.blank}>{blankText}</div>}
        </InkFrame>
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
            <ScaledPage item={coming.item} ctx={ctx} step={coming.step} scale={smallScale} live={false} opened={coming.opened} votes={{}} />
            <InkOverlay strokes={p.allInk[coming.item.id] ?? NO_STROKES} live={null} scale={smallScale} design={ctx.design} />
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
          {slide?.notes || <span className="is-empty">{item.kind === 'board' ? 'Leere Tafel: hier frei schreiben.' : 'Keine Notizen zu dieser Folie.'}</span>}
        </div>
      </aside>
      {p.dialog}
    </div>
  );
}
