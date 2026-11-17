// Battle music for the boss fight on the projector (teacher 17.11.2026), made in the browser like the sounds (ton.ts),
// no sound files: a four-bar loop in A minor at 132 bpm (Am – F – G – E) with kick, snare, hi-hat, a pulsing bass and
// a short lead. Only on the projector (one music for the class); a button there turns it off, remembered per device.
// Browsers start audio only after a tap or key: `wecken` is called on every input of the projector page.

const K_MUSIK = 'lernquest:bossmusik';
export const BPM = 132;
/** Sixteenth notes per bar and bars per loop. */
export const SCHRITTE = 16;
export const TAKTE = 4;

export type Spur = 'bass' | 'lead' | 'kick' | 'snare' | 'hihat';
export interface Ereignis {
  spur: Spur;
  /** Sixteenth in the loop (0 … SCHRITTE·TAKTE − 1). */
  schritt: number;
  /** Frequency in Hz (drums: 0). */
  freq: number;
  /** Length in sixteenths. */
  laenge: number;
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// Root of each bar: A, F, G, E (MIDI, octave 2) and the chord tones above for the lead.
const GRUND = [45, 41, 43, 40];
const LEAD: [number, number, number][][] = [
  // [sixteenth, MIDI, length]
  [[0, 69, 3], [3, 72, 3], [6, 76, 2], [8, 74, 4], [12, 72, 4]],
  [[0, 69, 3], [3, 72, 3], [6, 77, 2], [8, 76, 4], [12, 72, 4]],
  [[0, 71, 3], [3, 74, 3], [6, 79, 2], [8, 77, 4], [12, 74, 4]],
  [[0, 76, 4], [4, 75, 2], [6, 76, 2], [8, 80, 4], [12, 83, 4]],
];

/** All events of the loop. Pure, for the test. */
export function schleife(): Ereignis[] {
  const out: Ereignis[] = [];
  for (let t = 0; t < TAKTE; t++) {
    const b = t * SCHRITTE;
    for (let i = 0; i < SCHRITTE; i += 2) out.push({ spur: 'bass', schritt: b + i, freq: hz(GRUND[t] + (i % 8 === 6 ? 12 : 0)), laenge: 2 });
    for (const i of [0, 6, 8, 10]) out.push({ spur: 'kick', schritt: b + i, freq: 0, laenge: 1 });
    for (const i of [4, 12]) out.push({ spur: 'snare', schritt: b + i, freq: 0, laenge: 1 });
    for (let i = 0; i < SCHRITTE; i += 2) out.push({ spur: 'hihat', schritt: b + i, freq: 0, laenge: 1 });
    for (const [i, m, l] of LEAD[t]) out.push({ spur: 'lead', schritt: b + i, freq: hz(m), laenge: l });
  }
  return out;
}

export function musikAn(): boolean {
  try {
    return localStorage.getItem(K_MUSIK) !== 'aus';
  } catch {
    return true;
  }
}
export function setzeMusik(an: boolean) {
  try {
    localStorage.setItem(K_MUSIK, an ? 'an' : 'aus');
  } catch {
    // private mode: only for this page
  }
}

let ctx: AudioContext | null = null;
let haupt: GainNode | null = null;
let rauschen: AudioBuffer | null = null;
let timer: number | undefined;
let start = 0;
let naechster = 0;
const EREIGNISSE = schleife();
const SCHRITT_S = 60 / BPM / 4;

function kontext(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
  } catch {
    return null;
  }
  if (!haupt) {
    haupt = ctx.createGain();
    haupt.gain.value = 0.22;
    haupt.connect(ctx.destination);
  }
  if (!rauschen) {
    rauschen = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = rauschen.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

/** Resumes the audio after a tap or key (browsers start it suspended). */
export function wecken() {
  if (ctx?.state === 'suspended') void ctx.resume();
}

function spielen(c: AudioContext, e: Ereignis, t: number) {
  const g = c.createGain();
  g.connect(haupt!);
  const dauer = e.laenge * SCHRITT_S;
  if (e.spur === 'kick') {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.2);
    return;
  }
  if (e.spur === 'snare' || e.spur === 'hihat') {
    const n = c.createBufferSource();
    n.buffer = rauschen;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = e.spur === 'snare' ? 1200 : 7000;
    const lang = e.spur === 'snare' ? 0.14 : 0.04;
    g.gain.setValueAtTime(e.spur === 'snare' ? 0.35 : 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + lang);
    n.connect(f).connect(g);
    n.start(t);
    n.stop(t + lang + 0.02);
    return;
  }
  const o = c.createOscillator();
  o.type = e.spur === 'bass' ? 'sawtooth' : 'square';
  o.frequency.value = e.freq;
  const vol = e.spur === 'bass' ? 0.16 : 0.07;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.setValueAtTime(vol, t + dauer * 0.7);
  g.gain.exponentialRampToValueAtTime(0.001, t + dauer * 0.95);
  if (e.spur === 'bass') {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    o.connect(f).connect(g);
  } else o.connect(g);
  o.start(t);
  o.stop(t + dauer);
}

/** Plans the sixteenths of the next 0.3 s (called every 0.1 s, so timer delays do not stutter). */
function planen() {
  const c = ctx;
  if (!c) return;
  const ende = c.currentTime + 0.3;
  const n = SCHRITTE * TAKTE;
  while (start + naechster * SCHRITT_S < ende) {
    const t = start + naechster * SCHRITT_S;
    const schritt = naechster % n;
    for (const e of EREIGNISSE) if (e.schritt === schritt && t >= c.currentTime) spielen(c, e, t);
    naechster++;
  }
}

export const laeuft = () => timer !== undefined;

export function musikStarten() {
  if (timer !== undefined) return;
  const c = kontext();
  if (!c || !haupt) return;
  wecken();
  haupt.gain.cancelScheduledValues(c.currentTime);
  haupt.gain.setValueAtTime(0.22, c.currentTime);
  start = c.currentTime + 0.05;
  naechster = 0;
  timer = window.setInterval(planen, 100);
  planen();
}

/** Stops with a short fade (notes already planned die out). */
export function musikStoppen() {
  if (timer === undefined) return;
  window.clearInterval(timer);
  timer = undefined;
  if (ctx && haupt) {
    haupt.gain.setValueAtTime(haupt.gain.value, ctx.currentTime);
    haupt.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  }
}
