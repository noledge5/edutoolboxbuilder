// The motion engine: pose + animation + time → where every part is (a Stellung). Pure functions, no DOM, so the
// app, the workshop and the tests all compute the same frame. Figur.tsx draws a Stellung; useZeit drives the clock.
import type { Animation, Kurve, Pose, Punkt, Spur } from './typen';

export interface Lage {
  drehen: number;
  schieben: Punkt;
  strecken: Punkt;
}

export interface Stellung {
  /** Per part id; parts not listed stand as drawn. */
  teile: Record<string, Lage>;
  ganz: Lage;
  gesicht: string;
  augenZu: boolean;
  extras: string[];
  vorne: string[];
  zeit: number;
}

export const RUHE: Lage = { drehen: 0, schieben: [0, 0], strecken: [1, 1] };

type Ease = (x: number) => number;

/** Easing within one segment (0…1 → 0…1). `weich` here is only used to blend poses; tracks use the spline below. */
const KURVEN: Record<Kurve, Ease> = {
  linear: (x) => x,
  weich: (x) => 0.5 - Math.cos(Math.PI * x) / 2,
  // Overshoots a little and settles: for rewards and jumps.
  feder: (x) => {
    const c = 1.70158 * 1.2;
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
  },
  rein: (x) => x * x * x,
  raus: (x) => 1 - (1 - x) ** 3,
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Keyframe times of an animation with `n` values per track. */
export function zeitpunkte(a: Pick<Animation, 'zeiten'>, n: number): number[] {
  if (a.zeiten && a.zeiten.length === n) return a.zeiten;
  return Array.from({ length: n }, (_, i) => (n === 1 ? 0 : i / (n - 1)));
}

/** Slopes for a monotone cubic curve through the keyframes (Steffen 1990): zero where a value turns round, so a
 *  wave still rests at its ends and nothing overshoots, but a keyframe the value passes through keeps its speed.
 *  The ends: zero for a move with an end (it starts and stops softly), wrapped round for a loop. */
export function steigungen(y: number[], x: number[], schleife: boolean): number[] {
  const n = y.length;
  const h = (i: number) => x[i + 1] - x[i];
  const s = (i: number) => (y[i + 1] - y[i]) / Math.max(1e-9, h(i));
  const steffen = (s0: number, s1: number, h0: number, h1: number) => {
    if (s0 * s1 <= 0) return 0;
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return Math.sign(s0) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) * 2;
  };
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) m[i] = steffen(s(i - 1), s(i), h(i - 1), h(i));
  if (schleife && n > 2) m[0] = m[n - 1] = steffen(s(n - 2), s(0), h(n - 2), h(0));
  return m;
}

/** Cubic Hermite between two keyframes. */
const hermite = (y0: number, y1: number, m0: number, m1: number, h: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * m1;
};

type Takt = Pick<Animation, 'zeiten' | 'kurve' | 'kurven'> & { wiederholen?: Animation['wiederholen'] };

/** One number track at phase `t` (0…1). */
function kanal(y: number[], a: Takt, t: number): number {
  const x = zeitpunkte(a, y.length);
  if (y.length === 1 || t <= x[0]) return y[0];
  if (t >= x[y.length - 1]) return y[y.length - 1];
  let i = 1;
  while (t > x[i]) i++;
  const h = x[i] - x[i - 1];
  const u = (t - x[i - 1]) / Math.max(1e-9, h);
  const art = a.kurven?.[i - 1] ?? a.kurve ?? 'weich';
  if (art !== 'weich') return lerp(y[i - 1], y[i], KURVEN[art](u));
  const m = steigungen(y, x, a.wiederholen === 'immer');
  return hermite(y[i - 1], y[i], m[i - 1], m[i], h, u);
}

/** A track at phase `t`, as a Lage. */
export function abtasten(spur: Spur, a: Takt, t: number): Lage {
  const punkt = (w: Punkt[]): Punkt => [kanal(w.map((p) => p[0]), a, t), kanal(w.map((p) => p[1]), a, t)];
  return {
    drehen: spur.drehen?.length ? kanal(spur.drehen, a, t) : 0,
    schieben: spur.schieben?.length ? punkt(spur.schieben) : [0, 0],
    strecken: spur.strecken?.length ? punkt(spur.strecken) : [1, 1],
  };
}

/** Phase of a track that lags by `versatz` (share of a run) at `zeit` seconds. A loop is simply shifted; a move with an
 *  end starts the late track later and lets it catch up, so it still ends at rest when the move ends. */
export function spurPhase(a: Pick<Animation, 'dauer' | 'wiederholen'>, zeit: number, versatz = 0): number {
  const g = Math.max(0, zeit / a.dauer);
  if (a.wiederholen === 'immer') {
    const v = g - versatz;
    return v - Math.floor(v);
  }
  const w = a.wiederholen;
  const v = Math.min(w, Math.max(0, ((g - versatz) * w) / Math.max(1e-9, w - versatz)));
  if (v >= w) return 1;
  return v - Math.floor(v);
}

/** Phase (0…1) of an animation at `zeit` seconds, or null when it has finished (then the pose stands). */
export function phase(a: Pick<Animation, 'dauer' | 'wiederholen'>, zeit: number): number | null {
  if (zeit < 0) return 0;
  const laeufe = zeit / a.dauer;
  if (a.wiederholen !== 'immer' && laeufe >= a.wiederholen) return null;
  return laeufe - Math.floor(laeufe);
}

/** A pose between two poses (k = 0 → a, 1 → b): angles blend, face and extras switch at the middle. */
export function mischePosen(a: Pose, b: Pose, k: number): Pose {
  const winkel: Record<string, number> = {};
  for (const t of new Set([...Object.keys(a.winkel ?? {}), ...Object.keys(b.winkel ?? {})])) {
    winkel[t] = lerp(a.winkel?.[t] ?? 0, b.winkel?.[t] ?? 0, KURVEN.weich(k));
  }
  const n = k < 0.5 ? a : b;
  return { name: `${a.name} → ${b.name}`, gesicht: n.gesicht, winkel, vorne: n.vorne, extras: n.extras };
}

const mischeLage = (a: Lage, b: Lage, k: number): Lage => ({
  drehen: lerp(a.drehen, b.drehen, k),
  schieben: [lerp(a.schieben[0], b.schieben[0], k), lerp(a.schieben[1], b.schieben[1], k)],
  strecken: [lerp(a.strecken[0], b.strecken[0], k), lerp(a.strecken[1], b.strecken[1], k)],
});

/** How long a figure blends from what it showed into a new pose or move, in seconds (`--lq-dauer` is 0.24 s). */
export const UEBERGANG = 0.2;

/** A frame between two frames (k = 0 → a, 1 → b), so a new pose or move never jumps. The parts glide with `raus`
 *  (fast start, soft arrival); the face, the extras and what is drawn in front switch at once to the new one, because
 *  the face shows the reaction (a cross face that fades in late reads as a delay). */
export function mischeStellungen(a: Stellung, b: Stellung, k: number): Stellung {
  if (k >= 1) return b;
  const e = KURVEN.raus(Math.max(0, k));
  const teile: Record<string, Lage> = {};
  for (const id of new Set([...Object.keys(a.teile), ...Object.keys(b.teile)])) teile[id] = mischeLage(a.teile[id] ?? RUHE, b.teile[id] ?? RUHE, e);
  return { ...b, teile, ganz: mischeLage(a.ganz, b.ganz, e) };
}

/** Blinking: eyes shut for 0.14 s every 3.4 s, with a double blink every third time. */
export function blinzelt(zeit: number): boolean {
  const zyklus = 3.4;
  const n = Math.floor(zeit / zyklus);
  const t = zeit - n * zyklus;
  return t > 3.0 && (t < 3.14 || (n % 3 === 2 && t > 3.22 && t < 3.34));
}

export interface StellungOptionen {
  animation?: Animation;
  /** Seconds since the animation started (and the clock for blinking and item loops). */
  zeit?: number;
  /** Blink by itself. */
  lebendig?: boolean;
}

export function stellung(pose: Pose, { animation, zeit = 0, lebendig = false }: StellungOptionen = {}): Stellung {
  const teile: Record<string, Lage> = {};
  for (const [id, w] of Object.entries(pose.winkel ?? {})) teile[id] = { ...RUHE, drehen: w };
  let ganz = RUHE;
  let gesicht = pose.gesicht;
  const t = animation ? phase(animation, zeit) : null;
  if (animation && t !== null) {
    for (const [id, spur] of Object.entries(animation.spuren)) {
      const l = abtasten(spur, animation, spur.versatz ? spurPhase(animation, zeit, spur.versatz) : t);
      if (id === 'ganz') {
        ganz = l;
        continue;
      }
      const basis = teile[id] ?? RUHE;
      teile[id] = { drehen: basis.drehen + l.drehen, schieben: l.schieben, strecken: l.strecken };
    }
    for (const [ab, g] of animation.gesichter ?? []) if (t >= ab) gesicht = g;
  }
  return {
    teile,
    ganz,
    gesicht,
    augenZu: lebendig && blinzelt(zeit),
    extras: pose.extras ?? [],
    vorne: pose.vorne ?? [],
    zeit,
  };
}

/** SVG transform of a Lage around a pivot: move, then turn and stretch around the pivot. */
export function transform(l: Lage, [px, py]: Punkt): string | undefined {
  const teile: string[] = [];
  if (l.schieben[0] || l.schieben[1]) teile.push(`translate(${r(l.schieben[0])} ${r(l.schieben[1])})`);
  if (l.drehen) teile.push(`rotate(${r(l.drehen)} ${px} ${py})`);
  if (l.strecken[0] !== 1 || l.strecken[1] !== 1) teile.push(`translate(${px} ${py}) scale(${rs(l.strecken[0])} ${rs(l.strecken[1])}) translate(${-px} ${-py})`);
  return teile.length ? teile.join(' ') : undefined;
}

const r = (x: number) => Math.round(x * 100) / 100;
/** Scales finer: breathing stretches the whole figure by 1.5 %, and steps of 0.01 made it jump about every 0.4 s, some 3 px
 *  at a time, instead of moving smoothly (27.11.2026). */
const rs = (x: number) => Math.round(x * 10000) / 10000;
