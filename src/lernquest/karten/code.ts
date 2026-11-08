// Answer cards without devices (like Plickers): each child holds up a paper card; which side is on top is the answer
// (A top, B right, C bottom, D left, as printed). The card is a black square with a 4 × 4 pattern inside; the pattern
// tells the card number and, by how it is turned, the answer. Patterns differ from each other and from their own
// turns in at least 4 of the 16 cells, so one misread cell is corrected and two are refused, never mistaken.

/** Card numbers 1 … KARTEN_MAX. */
export const KARTEN_MAX = 63;
/** Cells along one side of the card's square: one black border cell on each side around the 4 × 4 pattern. */
export const RASTER = 6;
export const ANTWORTEN = ['A', 'B', 'C', 'D'] as const;
export type Antwort = (typeof ANTWORTEN)[number];

const ones = (v: number) => {
  let n = 0;
  for (; v; v >>= 1) n += v & 1;
  return n;
};

/** The pattern turned a quarter clockwise (bit y·4+x is the cell in row y, column x; set = white). */
export function drehen(c: number): number {
  let r = 0;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((c >> (y * 4 + x)) & 1) r |= 1 << (x * 4 + (3 - y));
  return r;
}

/** The patterns of cards 1 … KARTEN_MAX (index 0 = card 1): picked in a fixed order, so every device agrees. */
export const MUSTER: readonly number[] = (() => {
  const out: number[] = [];
  for (let c = 0; c < 1 << 16 && out.length < KARTEN_MAX; c++) {
    const n = ones(c);
    if (n < 5 || n > 11) continue;
    const turns = [c, drehen(c)];
    turns.push(drehen(turns[1]), drehen(drehen(turns[1])));
    if (turns.slice(1).some((t) => ones(t ^ c) < 4)) continue;
    if (out.some((o) => turns.some((t) => ones(o ^ t) < 4))) continue;
    out.push(c);
  }
  return out;
})();

/** Which cells are white, row by row, for card `nummer` printed upright (A on top). */
export function zellen(nummer: number): boolean[][] {
  const c = MUSTER[nummer - 1];
  return Array.from({ length: 4 }, (_, y) => Array.from({ length: 4 }, (_, x) => ((c >> (y * 4 + x)) & 1) === 1));
}

/**
 * The card a pattern read in some turn belongs to: `nummer` and how often the read pattern is turned a quarter
 * clockwise against the upright card. Null when no card is within one cell.
 */
export function erkennen(gelesen: number): { nummer: number; drehung: number } | null {
  let best: { nummer: number; drehung: number; d: number } | null = null;
  for (let i = 0; i < MUSTER.length; i++) {
    let t = MUSTER[i];
    for (let k = 0; k < 4; k++, t = drehen(t)) {
      const d = ones(t ^ gelesen);
      if (d <= 1 && (!best || d < best.d)) best = { nummer: i + 1, drehung: k, d };
    }
  }
  return best && { nummer: best.nummer, drehung: best.drehung };
}
