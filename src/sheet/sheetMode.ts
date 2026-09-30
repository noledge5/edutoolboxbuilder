import { createContext } from 'react';
import type { TestGroup } from '../model/variants';

/** How answers appear: not at all (student sheet), faintly (while editing), or clearly (solution sheet). */
export type SolutionView = 'hidden' | 'ghost' | 'shown';

export interface SheetMode {
  solutions: SolutionView;
  /** Black-and-white copy master: outlines instead of coloured areas. */
  bw: boolean;
  /** Test group printed in the header band ("Gruppe B"); '' for none. */
  group?: TestGroup;
}

export const SheetModeContext = createContext<SheetMode>({ solutions: 'hidden', bw: false });
