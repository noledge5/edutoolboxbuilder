import { createContext } from 'react';

/** How answers appear: not at all (student sheet), faintly (while editing), or clearly (solution sheet). */
export type SolutionView = 'hidden' | 'ghost' | 'shown';

export interface SheetMode {
  solutions: SolutionView;
  /** Black-and-white copy master: outlines instead of coloured areas. */
  bw: boolean;
}

export const SheetModeContext = createContext<SheetMode>({ solutions: 'hidden', bw: false });
