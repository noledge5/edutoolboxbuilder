// Tools while presenting: a timer for work phases, the noise traffic light (Ampel) and a black or white screen.
// Pure, so the timing is tested without a clock; Presenter.tsx holds the state.

export interface Timer {
  /** Length in milliseconds. */
  total: number;
  /** Time left when it last stopped or started (ms). */
  left: number;
  /** When it was started or went on; null while it stands. */
  since: number | null;
}

/** Quick choices in minutes. */
export const QUICK_MINUTES = [1, 3, 5, 10, 15];

const MIN = 60_000;

export const newTimer = (minutes: number): Timer => ({ total: minutes * MIN, left: minutes * MIN, since: null });

export const timeLeft = (t: Timer, now: number) => Math.max(0, t.since === null ? t.left : t.left - (now - t.since));

export const isRunning = (t: Timer, now: number) => t.since !== null && timeLeft(t, now) > 0;

export const isOver = (t: Timer, now: number) => timeLeft(t, now) === 0;

export const startTimer = (t: Timer, now: number): Timer => (t.since !== null || t.left === 0 ? t : { ...t, since: now });

export const pauseTimer = (t: Timer, now: number): Timer => (t.since === null ? t : { ...t, left: timeLeft(t, now), since: null });

/** One minute more or less; a timer that ran out and gets a minute runs on. */
export function addMinutes(t: Timer, now: number, minutes: number): Timer {
  const running = t.since !== null;
  const left = Math.max(0, timeLeft(t, now) + minutes * MIN);
  return { total: Math.max(t.total + minutes * MIN, left, MIN), left, since: running && left > 0 ? now : null };
}

/** Share of the time still left, 1 … 0, for the bar. */
export const leftShare = (t: Timer, now: number) => (t.total > 0 ? timeLeft(t, now) / t.total : 0);

/** "4:32", "0:07": whole seconds, rounded up, so 0:00 shows only when the time is over. */
export function clockText(ms: number): string {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// — The Ampel: how loud the class may be —

export type Ampel = '' | 'still' | 'fluestern' | 'leise';

/** From top to bottom, like a traffic light: red, yellow, green. */
export const AMPEL_LEVELS: { v: Exclude<Ampel, ''>; l: string }[] = [
  { v: 'still', l: 'Still' },
  { v: 'fluestern', l: 'Flüstern' },
  { v: 'leise', l: 'Leise' },
];

/** The next level for the key A: off → still → flüstern → leise → off. */
export function nextAmpel(a: Ampel): Ampel {
  const order: Ampel[] = ['', 'still', 'fluestern', 'leise'];
  return order[(order.indexOf(a) + 1) % order.length];
}

// — Black or white screen (keys B and W, as in PowerPoint) —

export type Blank = '' | 'black' | 'white';

export const toggleBlank = (now: Blank, to: Exclude<Blank, ''>): Blank => (now === to ? '' : to);

/**
 * Answer cards on a Quiz slide (Kartenfrage, src/lernquest/karten): card number → chosen box (0 = A). The cards
 * know only A–D, so a card answering a box the slide does not have does not count.
 */
export type CardAnswers = Record<number, number>;

/** Cards per box, like the hands counted in a vote. */
export function cardVotes(answers: CardAnswers, boxes: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (const i of Object.values(answers)) if (i >= 0 && i < Math.min(boxes, 4)) out[i] = (out[i] ?? 0) + 1;
  return out;
}

/** Card numbers whose answer counts, in order. */
export const cardsIn = (answers: CardAnswers, boxes: number) =>
  Object.entries(answers)
    .filter(([, i]) => i >= 0 && i < Math.min(boxes, 4))
    .map(([n]) => Number(n))
    .sort((a, b) => a - b);
