// Short sounds made in the browser (no sound files), Stufe E: soft bells instead of beeps. A bell is a sine with two
// quieter overtones that fade fast, so it sounds warm on phone speakers. Wrong is a low, gentle „bonk“, never harsh.
import { tonAn } from './speicher';

let ctx: AudioContext | null = null;

export type TonArt = 'richtig' | 'falsch' | 'fertig' | 'tipp' | 'stern' | 'truhe';

function note(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** A bell: the tone and two overtones that die away sooner. */
function glocke(freq: number, start: number, dur = 0.5, vol = 0.14) {
  note(freq, start, dur, 'sine', vol);
  note(freq * 2, start, dur * 0.5, 'sine', vol * 0.35);
  note(freq * 3, start, dur * 0.25, 'sine', vol * 0.15);
}

// C major, from C5: the notes the jingles use.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;
const G6 = 1568;

/** The notes of each sound: [frequency, start in s, length in s, volume]. Pure, for the test. */
export function noten(art: TonArt): [number, number, number, number][] {
  switch (art) {
    case 'richtig':
      return [
        [E6, 0, 0.35, 0.13],
        [G6, 0.09, 0.5, 0.13],
      ];
    case 'falsch':
      return [
        [196, 0, 0.3, 0.12],
        [165, 0.13, 0.4, 0.12],
      ];
    case 'fertig':
      return [
        [C5, 0, 0.3, 0.12],
        [E5, 0.11, 0.3, 0.12],
        [G5, 0.22, 0.3, 0.12],
        [C6, 0.33, 0.7, 0.13],
        [E6, 0.33, 0.7, 0.06],
      ];
    case 'stern':
      return [G5, C6, E6, G6].map((f, i) => [f, i * 0.06, 0.4, 0.08]);
    case 'truhe':
      return [
        ...[C5, E5, G5, C6, E6, G6].map((f, i): [number, number, number, number] => [f, i * 0.07, 0.35, 0.09]),
        [C6, 0.45, 0.9, 0.12],
        [G6, 0.45, 0.9, 0.05],
      ];
    default:
      return [[1760, 0, 0.06, 0.05]];
  }
}

export function ton(art: TonArt) {
  if (!tonAn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    return;
  }
  for (const [f, start, dur, vol] of noten(art)) {
    if (art === 'falsch') note(f, start, dur, 'sine', vol);
    else glocke(f, start, dur, vol);
  }
}
