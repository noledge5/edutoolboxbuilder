// Handwriting on slides: strokes of the pen and the marker in slide pixels (1920 × 1080), drawn while presenting or
// sketched in the slide editor. A saved Tafelbild ("board") keeps the strokes of each slide and the blank boards
// that were put in between. Strokes are outlined with perfect-freehand, so a pencil's pressure shapes the line.
import { getStroke } from 'perfect-freehand';
import { uid } from './ops';
import { isObj } from './text';

export type InkTool = 'pen' | 'marker';
export type InkColor = 'dark' | 'red' | 'blue' | 'green' | 'orange' | 'yellow' | 'white';

export const INK_COLORS: { v: InkColor; l: string }[] = [
  { v: 'dark', l: 'Schwarz' },
  { v: 'red', l: 'Rot' },
  { v: 'blue', l: 'Blau' },
  { v: 'green', l: 'Grün' },
  { v: 'orange', l: 'Orange' },
  { v: 'yellow', l: 'Gelb' },
  { v: 'white', l: 'Weiß' },
];

/** Line widths of the pen in slide pixels: thin, middle, thick. */
export const PEN_SIZES = [5, 9, 16];
export const MARKER_SIZE = 36;

export interface Stroke {
  tool: InkTool;
  color: InkColor;
  size: number;
  /** x, y, pressure, x, y, pressure … in slide pixels; pressure 0 … 1. */
  points: number[];
  /** The pressure comes from a pencil; otherwise the line is shaped by the speed of drawing. */
  pressure: boolean;
  /** A straight line from the first to the last point. */
  line: boolean;
  /** An arrow head at the end. */
  arrow: boolean;
}

/** Paper of a blank board put in while presenting. */
export type Paper = 'white' | 'grid' | 'lines';

export const PAPERS: { v: Paper; l: string }[] = [
  { v: 'white', l: 'Leer' },
  { v: 'grid', l: 'Kariert' },
  { v: 'lines', l: 'Liniert' },
];

/** The strokes on one slide, or a blank board between the slides. */
export interface BoardPage {
  id: string;
  /** The slide written on; '' for a blank board. */
  slideId: string;
  /** A blank board: the slide it comes after ('' = before the first). */
  after: string;
  paper: Paper;
  strokes: Stroke[];
}

/** A Tafelbild: what was written on the slides in one lesson, kept with the lesson. */
export interface Board {
  id: string;
  name: string;
  /** When it was saved. */
  at: number;
  pages: BoardPage[];
}

const pick = <T extends string>(x: unknown, options: readonly { v: T }[], fallback: T): T => (options.some((o) => o.v === x) ? (x as T) : fallback);
const round = (n: number, d = 10) => Math.round(n * d) / d;

/** Strokes from storage or a file; broken ones are left out. */
export function normalizeStrokes(raw: unknown): Stroke[] {
  if (!Array.isArray(raw)) return [];
  const out: Stroke[] = [];
  for (const r of raw) {
    if (!isObj(r) || !Array.isArray(r.points)) continue;
    const points = r.points.map(Number);
    if (points.length < 3 || points.length % 3 || points.some((n) => !Number.isFinite(n))) continue;
    const size = Number(r.size);
    out.push({
      tool: r.tool === 'marker' ? 'marker' : 'pen',
      color: pick(r.color, INK_COLORS, 'dark'),
      size: Number.isFinite(size) ? Math.min(80, Math.max(1, size)) : PEN_SIZES[1],
      points,
      pressure: r.pressure === true,
      line: r.line === true,
      arrow: r.arrow === true,
    });
  }
  return out;
}

export function normalizeBoardPages(raw: unknown): BoardPage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObj).map((p) => ({
    id: typeof p.id === 'string' && p.id ? p.id : uid(),
    slideId: typeof p.slideId === 'string' ? p.slideId : '',
    after: typeof p.after === 'string' ? p.after : '',
    paper: pick(p.paper, PAPERS, 'white'),
    strokes: normalizeStrokes(p.strokes),
  }));
}

/** Saved Tafelbilder of a lesson, newest first. */
export function normalizeBoards(raw: unknown): Board[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .map((b) => ({
      id: typeof b.id === 'string' && b.id ? b.id : uid(),
      name: typeof b.name === 'string' ? b.name : '',
      at: Number(b.at) || 0,
      pages: normalizeBoardPages(b.pages),
    }))
    .filter((b) => b.pages.some((p) => p.strokes.length || !p.slideId))
    .sort((a, b) => b.at - a.at);
}

/** How many Tafelbilder a lesson keeps; older ones go. */
export const MAX_BOARDS = 12;

/** A point for a stroke, rounded so stored strokes stay small. */
export const inkPoint = (x: number, y: number, pressure: number) => [round(x), round(y), round(pressure, 100)];

const pointsOf = (s: Stroke): number[][] => {
  const out: number[][] = [];
  for (let k = 0; k + 2 < s.points.length; k += 3) out.push([s.points[k], s.points[k + 1], s.points[k + 2]]);
  return out;
};

/** A straight line as points along it, so it is drawn with the same even outline as a stroke. */
function linePoints(s: Stroke): number[][] {
  const p = pointsOf(s);
  const [a, b] = [p[0], p[p.length - 1]];
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12));
  return Array.from({ length: n + 1 }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, 0.5]);
}

/** SVG path of an outline (closed, smoothed with quadratic curves). */
function outlinePath(points: number[][]): string {
  const n = points.length;
  if (n < 4) return '';
  const f = (x: number) => x.toFixed(1);
  const avg = (a: number, b: number) => (a + b) / 2;
  let d = `M${f(points[0][0])},${f(points[0][1])} Q${f(points[1][0])},${f(points[1][1])} ${f(avg(points[1][0], points[2][0]))},${f(avg(points[1][1], points[2][1]))} T`;
  for (let k = 2; k < n - 1; k++) d += `${f(avg(points[k][0], points[k + 1][0]))},${f(avg(points[k][1], points[k + 1][1]))} `;
  return d + 'Z';
}

const paths = new WeakMap<Stroke, string>();

/** The filled outline of a stroke (with its arrow head) as an SVG path. */
export function strokePath(s: Stroke): string {
  const known = paths.get(s);
  if (known !== undefined) return known;
  const pts = s.line ? linePoints(s) : pointsOf(s);
  const marker = s.tool === 'marker';
  const outline = getStroke(pts, {
    size: s.size,
    thinning: marker || s.line ? 0 : 0.55,
    smoothing: 0.5,
    streamline: s.line ? 0 : 0.45,
    simulatePressure: !marker && !s.line && !s.pressure,
    last: true,
  });
  let d = outlinePath(outline);
  if (!d) {
    // A dot.
    const [x, y] = pts[0] ?? [0, 0];
    const r = s.size / 2;
    d = `M${x - r},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
  }
  const head = s.arrow ? arrowHead(s) : '';
  const out = head ? `${d} ${head}` : d;
  paths.set(s, out);
  return out;
}

/** A triangle at the end of a stroke, pointing the way it was drawn. */
function arrowHead(s: Stroke): string {
  const p = s.line ? [pointsOf(s)[0], pointsOf(s).at(-1)!] : pointsOf(s);
  if (p.length < 2) return '';
  const tip = p[p.length - 1];
  const len = Math.max(26, s.size * 3.4);
  // The direction over the last stretch of the stroke, not only its last wiggle.
  let from = p[0];
  for (let k = p.length - 2; k >= 0; k--) {
    from = p[k];
    if (Math.hypot(tip[0] - from[0], tip[1] - from[1]) >= len) break;
  }
  const dx = tip[0] - from[0];
  const dy = tip[1] - from[1];
  const d = Math.hypot(dx, dy);
  if (d < 1) return '';
  const [ux, uy] = [dx / d, dy / d];
  const w = len * 0.55;
  const end = [tip[0] + ux * s.size * 0.4, tip[1] + uy * s.size * 0.4];
  const back = [end[0] - ux * len, end[1] - uy * len];
  const f = (x: number) => x.toFixed(1);
  return `M${f(end[0])},${f(end[1])} L${f(back[0] - uy * w)},${f(back[1] + ux * w)} L${f(back[0] + uy * w)},${f(back[1] - ux * w)} Z`;
}

/** The box around strokes, with room for their width. */
export function strokeBounds(strokes: Stroke[]): { x: number; y: number; w: number; h: number } | null {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of strokes) {
    const pad = s.size / 2 + (s.arrow ? Math.max(26, s.size * 3.4) * 0.6 : 0);
    for (let k = 0; k + 2 < s.points.length; k += 3) {
      x0 = Math.min(x0, s.points[k] - pad);
      y0 = Math.min(y0, s.points[k + 1] - pad);
      x1 = Math.max(x1, s.points[k] + pad);
      y1 = Math.max(y1, s.points[k + 1] + pad);
    }
  }
  if (x0 === Infinity) return null;
  return { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) };
}

/** Strokes moved (and scaled) from one place to another, e.g. into or out of a sketch's own box. */
export function mapStrokes(strokes: Stroke[], f: (x: number, y: number) => [number, number], scale = 1): Stroke[] {
  return strokes.map((s) => {
    const points = [...s.points];
    for (let k = 0; k + 2 < points.length; k += 3) {
      const [x, y] = f(points[k], points[k + 1]);
      points[k] = round(x);
      points[k + 1] = round(y);
    }
    return { ...s, points, size: round(s.size * scale) };
  });
}

/** Distance from a point to the segment a–b. */
function toSegment(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0;
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

/** Whether the eraser at x, y (radius r) touches a stroke. */
export function hitStroke(s: Stroke, x: number, y: number, r: number): boolean {
  const p = s.points;
  const reach = r + s.size / 2;
  if (p.length === 3) return Math.hypot(x - p[0], y - p[1]) <= reach;
  if (s.line) return toSegment(x, y, p[0], p[1], p[p.length - 3], p[p.length - 2]) <= reach;
  for (let k = 0; k + 5 < p.length; k += 3) if (toSegment(x, y, p[k], p[k + 1], p[k + 3], p[k + 4]) <= reach) return true;
  return false;
}

/** The pages of a board that are worth keeping: slides written on and blank boards. */
export const boardPagesWithInk = (pages: BoardPage[]) => pages.filter((p) => p.strokes.length > 0 || !p.slideId);

/** A name for a board saved now: "Tafelbild 1.10.2026". */
export const boardName = (at: number) => `Tafelbild ${new Date(at).toLocaleDateString('de-DE')}`;

/** A blank board put in while presenting, after a slide or after another blank board. */
export interface BlankBoard {
  id: string;
  /** The slide or blank board it follows ('' = before the first slide). */
  after: string;
  paper: Paper;
}

export type DeckItem<T> = { kind: 'slide'; id: string; slide: T; number: number } | { kind: 'board'; id: string; board: BlankBoard; number: number };

/**
 * The order while presenting: the slides with the blank boards after the page they were put in after (several
 * after one page in the order they were made). `number` is the slide's number, for a board that of the slide before.
 */
export function deckOrder<T extends { id: string }>(slides: T[], blanks: BlankBoard[]): DeckItem<T>[] {
  const out: DeckItem<T>[] = [];
  const known = new Set([...slides.map((s) => s.id), ...blanks.map((b) => b.id)]);
  const placed = new Set<string>();
  const follow = (id: string, number: number) => {
    for (const b of blanks)
      if (b.after === id && !placed.has(b.id)) {
        placed.add(b.id);
        out.push({ kind: 'board', id: b.id, board: b, number });
        follow(b.id, number);
      }
  };
  follow('', 0);
  slides.forEach((s, k) => {
    out.push({ kind: 'slide', id: s.id, slide: s, number: k + 1 });
    follow(s.id, k + 1);
  });
  // Boards whose page is gone come at the end.
  for (const b of blanks)
    if (!placed.has(b.id) && !known.has(b.after)) {
      placed.add(b.id);
      out.push({ kind: 'board', id: b.id, board: b, number: slides.length });
      follow(b.id, slides.length);
    }
  return out;
}

/** What was written while presenting, as a Tafelbild to keep (slides without strokes are left out). */
export function boardFromInk(ink: Record<string, Stroke[]>, blanks: BlankBoard[], slideIds: string[], name: string, at: number): Board {
  const pages: BoardPage[] = [
    ...slideIds.filter((id) => ink[id]?.length).map((id) => ({ id: uid(), slideId: id, after: '', paper: 'white' as Paper, strokes: ink[id] })),
    ...blanks.map((b) => ({ id: b.id, slideId: '', after: b.after, paper: b.paper, strokes: ink[b.id] ?? [] })),
  ];
  return { id: uid(), name, at, pages };
}

/** A saved Tafelbild back on the slides: strokes by page and the blank boards. */
export function inkFromBoard(board: Board): { ink: Record<string, Stroke[]>; blanks: BlankBoard[] } {
  const ink: Record<string, Stroke[]> = {};
  const blanks: BlankBoard[] = [];
  for (const p of board.pages) {
    if (p.slideId) ink[p.slideId] = [...(ink[p.slideId] ?? []), ...p.strokes];
    else {
      blanks.push({ id: p.id, after: p.after, paper: p.paper });
      ink[p.id] = p.strokes;
    }
  }
  return { ink, blanks };
}

/** Whether anything was written or put in. */
export const hasInk = (ink: Record<string, Stroke[]>, blanks: BlankBoard[]) => blanks.length > 0 || Object.values(ink).some((s) => s.length > 0);
