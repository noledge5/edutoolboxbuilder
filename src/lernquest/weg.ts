// The layout of a region on the map (Stufe E, Teil 2): where the castle, the waypoints and the boss castle sit, the
// winding path through them and the trees and bushes beside it. Pure and deterministic (same region, same picture);
// drawn by app/Landkarte.tsx in a 360-unit-wide SVG that scales with the screen.

export interface Punkt {
  x: number;
  y: number;
}

export type DekoArt = 'baum' | 'tanne' | 'busch' | 'blume' | 'stein';
export interface Deko extends Punkt {
  art: DekoArt;
  /** Scale, 0.7–1.2. */
  s: number;
  /** Mirror the drawing (variety). */
  spiegeln: boolean;
}

export interface WegPlan {
  breite: number;
  hoehe: number;
  /** Centre bottom of the region's castle (top of the region). */
  burg: Punkt;
  /** Centre of each waypoint, in path order. */
  punkte: Punkt[];
  /** Centre bottom of the boss castle when the last waypoint is the Meilenstein. */
  boss?: Punkt;
  /** SVG path data from the castle gate through every waypoint. */
  pfad: string;
  deko: Deko[];
}

export const WEG_BREITE = 360;
const MITTE = WEG_BREITE / 2;
/** Room for the castle and the region's title card above the first waypoint. */
const KOPF = 200;
const SCHRITT = 132;
/** Extra room above the Meilenstein for the boss castle behind it. */
const BOSS_RAUM = 130;
const FUSS = 120;
/** The sideways swing of the path: centre, right, centre, left … */
const SCHWUNG = [0, 76, 0, -76];
/** Nothing is planted closer than this to the path or a waypoint. */
const ABSTAND_WEG = 34;
const ABSTAND_PUNKT = 58;

/** Small seeded random numbers (mulberry32), so a region looks the same on every visit. */
function zufall(saat: string): () => number {
  let h = 1779033703 ^ saat.length;
  for (let i = 0; i < saat.length; i++) {
    h = Math.imul(h ^ saat.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points along a cubic Bézier, for keeping the trees off the path. */
function bezier(a: Punkt, b: Punkt, c: Punkt, d: Punkt, n = 12): Punkt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
  });
}

const abstand = (a: Punkt, b: Punkt) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * The plan of one region. `n`: the waypoints (stations, the „Wiederholen“ node, the Meilenstein); `mitBoss`: the last
 * one is the Meilenstein in front of the boss castle; `saat`: the region's id, for the trees.
 */
export function wegPlan(n: number, mitBoss: boolean, saat: string): WegPlan {
  const burg = { x: MITTE, y: KOPF - 44 };
  const punkte: Punkt[] = [];
  let y = KOPF + 24;
  for (let i = 0; i < n; i++) {
    const boss = mitBoss && i === n - 1;
    if (i > 0) y += SCHRITT + (boss ? BOSS_RAUM : 0);
    punkte.push({ x: boss ? MITTE : MITTE + SCHWUNG[i % 4], y });
  }
  const hoehe = (punkte.at(-1)?.y ?? KOPF) + FUSS;
  const boss = mitBoss && n > 0 ? { x: MITTE, y: punkte[n - 1].y + 6 } : undefined;

  // The path leaves the castle gate and runs through each waypoint with vertical tangents (soft S-curves).
  const stuetzen = [burg, ...punkte];
  let pfad = `M${burg.x} ${burg.y}`;
  const probe: Punkt[] = [];
  for (let i = 1; i < stuetzen.length; i++) {
    const a = stuetzen[i - 1];
    const d = stuetzen[i];
    const k = (d.y - a.y) * 0.5;
    const b = { x: a.x, y: a.y + k };
    const c = { x: d.x, y: d.y - k };
    pfad += ` C${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
    probe.push(...bezier(a, b, c, d));
  }

  // Trees and bushes: try spots on a loose grid with a little jitter, keep those clear of the path, the waypoints,
  // the castle and the boss castle. Bigger trees towards the edges, small bushes and flowers near the path.
  const r = zufall(saat);
  const deko: Deko[] = [];
  const frei = (p: Punkt, rand: number) =>
    probe.every((q) => abstand(p, q) >= ABSTAND_WEG + rand) &&
    punkte.every((q) => abstand(p, q) >= ABSTAND_PUNKT + rand) &&
    // The name and hint under a waypoint: keep that strip free too.
    punkte.every((q) => !(Math.abs(p.x - q.x) < 78 + rand && p.y > q.y && p.y < q.y + 80 + rand)) &&
    !(Math.abs(p.x - burg.x) < 110 && p.y > burg.y - 150 && p.y < burg.y + 30) &&
    !(boss && Math.abs(p.x - boss.x) < 100 && p.y > boss.y - 160 && p.y < boss.y + 30);
  for (let gy = KOPF - 10; gy < hoehe - 16; gy += 46) {
    for (let gx = 22; gx < WEG_BREITE; gx += 52) {
      const p = { x: gx + (r() - 0.5) * 26, y: gy + (r() - 0.5) * 22 };
      const rand = Math.min(p.x, WEG_BREITE - p.x) < 70;
      const art: DekoArt = rand ? (r() < 0.3 ? 'tanne' : 'baum') : (['busch', 'busch', 'blume', 'stein', 'baum'] as const)[Math.floor(r() * 5)];
      const gross = art === 'baum' || art === 'tanne';
      const s = gross ? 0.8 + r() * 0.4 : 0.7 + r() * 0.3;
      const spiegeln = r() < 0.5;
      if (r() < 0.4) continue; // leave some meadow
      if (!frei(p, gross ? 10 * s : 0)) continue;
      if (deko.some((d) => abstand(d, p) < (gross ? 36 : 24))) continue;
      deko.push({ art, x: Math.round(p.x), y: Math.round(p.y), s: Math.round(s * 100) / 100, spiegeln });
    }
  }
  // Back to front: what stands lower is drawn later, so it covers what is behind it.
  deko.sort((a, b) => a.y - b.y);
  return { breite: WEG_BREITE, hoehe, burg, punkte, boss, pfad, deko };
}
