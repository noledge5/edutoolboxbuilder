import { describe, expect, it } from 'vitest';
import { addMinutes, clockText, isOver, isRunning, leftShare, newTimer, nextAmpel, pauseTimer, startTimer, timeLeft, toggleBlank } from './tools';

describe('timer', () => {
  it('runs, stands and goes on', () => {
    let t = newTimer(5);
    expect(timeLeft(t, 0)).toBe(300_000);
    expect(isRunning(t, 0)).toBe(false);
    t = startTimer(t, 1000);
    expect(timeLeft(t, 61_000)).toBe(240_000);
    expect(isRunning(t, 61_000)).toBe(true);
    t = pauseTimer(t, 61_000);
    // Standing still: no time passes.
    expect(timeLeft(t, 500_000)).toBe(240_000);
    t = startTimer(t, 500_000);
    expect(timeLeft(t, 740_000)).toBe(0);
    expect(isOver(t, 800_000)).toBe(true);
    expect(isRunning(t, 800_000)).toBe(false);
    expect(leftShare(t, 800_000)).toBe(0);
  });

  it('takes a minute more or less, also after running out', () => {
    let t = startTimer(newTimer(1), 0);
    t = addMinutes(t, 30_000, 1);
    expect(timeLeft(t, 30_000)).toBe(90_000);
    expect(t.total).toBe(120_000);
    t = addMinutes(t, 30_000, -2);
    expect(timeLeft(t, 30_000)).toBe(0);
    expect(t.since).toBeNull();
    // Over: one more minute runs on only when started again.
    t = startTimer(addMinutes(t, 40_000, 1), 40_000);
    expect(timeLeft(t, 70_000)).toBe(30_000);
    // Starting an empty timer does nothing.
    expect(startTimer({ total: 60_000, left: 0, since: null }, 5).since).toBeNull();
  });

  it('shows whole seconds, rounded up', () => {
    expect(clockText(300_000)).toBe('5:00');
    expect(clockText(272_001)).toBe('4:33');
    expect(clockText(7_000)).toBe('0:07');
    expect(clockText(1)).toBe('0:01');
    expect(clockText(0)).toBe('0:00');
    expect(clockText(-5)).toBe('0:00');
  });
});

describe('Ampel and blank screen', () => {
  it('goes round the levels and back to off', () => {
    expect(nextAmpel('')).toBe('still');
    expect(nextAmpel('still')).toBe('fluestern');
    expect(nextAmpel('fluestern')).toBe('leise');
    expect(nextAmpel('leise')).toBe('');
  });

  it('switches black and white on and off', () => {
    expect(toggleBlank('', 'black')).toBe('black');
    expect(toggleBlank('black', 'black')).toBe('');
    expect(toggleBlank('black', 'white')).toBe('white');
  });
});
