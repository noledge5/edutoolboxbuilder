// Rewards that count up (Belohnungen, 27.11.2026): experience and coins on the result screen, coins in the status row,
// coins from a chest. Pure, so the curve is tested without a browser (zaehler.test.ts); app/Zaehler.tsx draws it.

/** The number shown `t` ms into a count of `dauer` ms from `von` to `bis`: fast at first, slowing at the end, whole
 *  numbers, never past the target. */
export function zaehlerWert(von: number, bis: number, t: number, dauer: number): number {
  if (dauer <= 0 || t >= dauer) return bis;
  if (t <= 0) return von;
  const k = 1 - Math.pow(1 - t / dauer, 3);
  return Math.round(von + (bis - von) * k);
}

/** How long a count takes: short for a few coins, at most 1.2 s for many. */
export const zaehlerDauer = (von: number, bis: number) => Math.min(1200, 350 + Math.abs(bis - von) * 12);
