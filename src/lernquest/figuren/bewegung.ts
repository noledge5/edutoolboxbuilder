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

const KURVEN: Record<Kurve, (x: number) => number> = {
  linear: (x) => x,
  weich: (x) => 0.5 - Math.cos(Math.PI * x) / 2,
  // Overshoots a little and settles: for rewards and jumps.
  feder: (x) => {
    const c = 1.70158 * 1.2;
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
  },
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Keyframe times of an animation with `n` values per track. */
export function zeitpunkte(a: Pick<Animation, 'zeiten'>, n: number): number[] {
  if (a.zeiten && a.zeiten.length === n) return a.zeiten;
  return Array.from({ length: n }, (_, i) => (n === 1 ? 0 : i / (n - 1)));
}

/** The value of a track at phase `t` (0…1). */
function wert<T>(werte: T[] | undefined, zeiten: number[], t: number, kurve: (x: number) => number, mix: (a: T, b: T, k: number) => T): T | undefined {
  if (!werte?.length) return undefined;
  if (werte.length === 1 || t <= zeiten[0]) return werte[0];
  for (let i = 1; i < werte.length; i++) {
    if (t <= zeiten[i]) {
      const k = (t - zeiten[i - 1]) / Math.max(1e-9, zeiten[i] - zeiten[i - 1]);
      return mix(werte[i - 1], werte[i], kurve(k));
    }
  }
  return werte[werte.length - 1];
}

const mixPunkt = (a: Punkt, b: Punkt, k: number): Punkt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/** A track at phase `t`, as a Lage. */
export function abtasten(spur: Spur, a: Pick<Animation, 'zeiten' | 'kurve'>, t: number): Lage {
  const kurve = KURVEN[a.kurve ?? 'weich'];
  const z = (n: number) => zeitpunkte(a, n);
  return {
    drehen: wert(spur.drehen, z(spur.drehen?.length ?? 0), t, kurve, lerp) ?? 0,
    schieben: wert(spur.schieben, z(spur.schieben?.length ?? 0), t, kurve, mixPunkt) ?? [0, 0],
    strecken: wert(spur.strecken, z(spur.strecken?.length ?? 0), t, kurve, mixPunkt) ?? [1, 1],
  };
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
      const l = abtasten(spur, animation, t);
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
  if (l.strecken[0] !== 1 || l.strecken[1] !== 1) teile.push(`translate(${px} ${py}) scale(${r(l.strecken[0])} ${r(l.strecken[1])}) translate(${-px} ${-py})`);
  return teile.length ? teile.join(' ') : undefined;
}

const r = (x: number) => Math.round(x * 100) / 100;
