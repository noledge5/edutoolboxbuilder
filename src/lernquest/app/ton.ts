// Short sounds made in the browser (no sound files): right, wrong, round done.
import { tonAn } from './speicher';

let ctx: AudioContext | null = null;

function note(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function ton(art: 'richtig' | 'falsch' | 'fertig' | 'tipp') {
  if (!tonAn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    return;
  }
  if (art === 'richtig') {
    note(660, 0, 0.12);
    note(990, 0.1, 0.22);
  } else if (art === 'falsch') {
    note(200, 0, 0.25, 'triangle', 0.22);
    note(150, 0.12, 0.3, 'triangle', 0.22);
  } else if (art === 'fertig') {
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.11, 0.3));
  } else {
    note(880, 0, 0.05, 'sine', 0.08);
  }
}
