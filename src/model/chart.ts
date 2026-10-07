// The numbers behind the chart block (Diagramm): reading values as teachers write them ("1,8", "−3", "1.250"),
// series and labels from the block's fields, nice axis steps and the climate diagram's scales. Pure, tested.
import type { BlockProps, Lang } from './types';
import { lines, rows, str } from './text';

export type ChartKind = 'klima' | 'saeulen' | 'balken' | 'linie' | 'kreis' | 'tabelle';
const KINDS: ChartKind[] = ['klima', 'saeulen', 'balken', 'linie', 'kreis', 'tabelle'];

export interface ChartSeries {
  name: string;
  values: (number | null)[];
}

export interface ChartData {
  kind: ChartKind;
  /** Label of each row (month, year, country …). */
  labels: string[];
  series: ChartSeries[];
  /** Header of the label column, for the table. */
  labelHead: string;
}

/** "1,8" and "1.8" → 1.8, "−3" → -3, "1.250" or "1 250" → 1250, "12 %" → 12; else null. */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[−–]/g, '-').replace(/[%‰°a-zA-ZäöüÄÖÜ€$]+\.?$/u, '').trim();
  s = s.replace(/(\d)[\s  '](?=\d{3}\b)/g, '$1');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** A number as the class reads it: German comma, at most `digits` decimals, no trailing zeros. */
export function formatNumber(n: number, lang: Lang = 'de', digits = 1): string {
  return n.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export const chartKind = (x: unknown): ChartKind => (KINDS.includes(x as ChartKind) ? (x as ChartKind) : 'saeulen');

/** Labels and series of a chart block. The headers may name the label column first or only the series. */
export function chartData(p: BlockProps): ChartData {
  const kind = chartKind(p.kind);
  const table = rows(p.rows).filter((r) => r.some(Boolean));
  const width = Math.max(1, ...table.map((r) => r.length - 1));
  const heads = lines(p.cols);
  const named = heads.length > width ? heads.slice(1, width + 1) : heads.slice(0, width);
  const labelHead = heads.length > width ? heads[0] : '';
  const series = Array.from({ length: width }, (_, k) => ({ name: named[k] ?? '', values: table.map((r) => parseNumber(r[k + 1] ?? '')) }));
  return { kind, labels: table.map((r) => r[0] ?? ''), series, labelHead };
}

/** Axis from `lo` to `hi` in round steps (1, 2, 2.5, 5 × 10ⁿ), about `ticks` of them. */
export function niceScale(lo: number, hi: number, ticks = 5): { min: number; max: number; step: number } {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const min = Math.floor(lo / step + 1e-9) * step;
  const max = Math.ceil(hi / step - 1e-9) * step;
  return { min: round(min), max: round(max), step };
}

const round = (n: number) => Math.round(n * 1e9) / 1e9;

/** Ticks of a scale. */
export const ticksOf = (s: { min: number; max: number; step: number }) => Array.from({ length: Math.round((s.max - s.min) / s.step) + 1 }, (_, k) => round(s.min + k * s.step));

const MONTHS = 'JFMAMJJASOND';

/**
 * Climate diagram after Walter and Lieth, as in school atlases: 10 °C on the left equal 20 mm on the right, so the
 * dry months show where the temperature line runs above the precipitation bars. Above 100 mm the precipitation scale
 * shrinks to a tenth (1 °C ≙ 20 mm), as in the atlas.
 */
export interface Climate {
  months: string[];
  temps: (number | null)[];
  precs: (number | null)[];
  /** Annual mean temperature and total precipitation. */
  meanT: number | null;
  sumP: number | null;
  /** Lowest and highest value on the temperature axis (°C); the top also carries the precipitation scale. */
  low: number;
  top: number;
}

/** Height of a precipitation value in °C units of the temperature axis. */
export const precUnits = (mm: number) => (mm <= 100 ? mm / 2 : 50 + (mm - 100) / 20);

/** Precipitation at a height in °C units (the inverse of `precUnits`). */
export const unitsPrec = (u: number) => (u <= 50 ? u * 2 : 100 + (u - 50) * 20);

export function climateOf(d: ChartData): Climate {
  const temps = d.series[0]?.values ?? [];
  const precs = d.series[1]?.values ?? [];
  const n = Math.max(temps.length, precs.length, 1);
  const months = Array.from({ length: n }, (_, k) => {
    const l = d.labels[k]?.trim() ?? '';
    return n === 12 ? (l ? l[0].toUpperCase() : MONTHS[k]) : l;
  });
  const t = temps.filter((x): x is number => x !== null);
  const p = precs.filter((x): x is number => x !== null);
  const meanT = t.length ? t.reduce((a, b) => a + b, 0) / t.length : null;
  const sumP = p.length ? p.reduce((a, b) => a + b, 0) : null;
  const low = Math.min(0, Math.floor(Math.min(0, ...t) / 10) * 10);
  const top = Math.max(30, Math.ceil(Math.max(0, ...t) / 10) * 10, Math.ceil(precUnits(Math.max(0, ...p)) / 10) * 10);
  return { months, temps, precs, meanT, sumP, low, top };
}

/** Shares of a pie in percent (values that are no number count 0). */
export function shares(values: (number | null)[]): number[] {
  const v = values.map((x) => Math.max(0, x ?? 0));
  const sum = v.reduce((a, b) => a + b, 0);
  return v.map((x) => (sum > 0 ? (x / sum) * 100 : 0));
}

/** Width of a block of `span` columns on the A4 page (body 722 px, 12 columns, 16 px gaps). */
export const blockWidth = (span: number) => Math.round((span * (722 - 11 * 16)) / 12 + (span - 1) * 16);

/** A label in at most two lines of about `chars` characters (at spaces or hyphens). */
export function wrapLabel(label: string, chars: number): string[] {
  const words = label.split(/(?<=-)|\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    const last = out.length - 1;
    if (last >= 0 && (out[last] + ' ' + w).length <= chars) out[last] = out[last].endsWith('-') ? out[last] + w : out[last] + ' ' + w;
    else out.push(w);
  }
  if (out.length <= 2) return out;
  return [out[0], out.slice(1).join(' ').slice(0, chars - 1) + '…'];
}

export const chartTitle = (p: BlockProps) => str(p.title).trim();
