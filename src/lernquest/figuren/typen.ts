// The model of a drawn figure: a tree of named parts that turn around their pivot. A pose only lists angles and a
// face, an animation only lists keyframes per part, a worn item only names an anchor. No pose is a new drawing.
// bewegung.ts turns pose + animation + time into a Stellung; Figur.tsx draws it.
import type { ReactNode } from 'react';

export type Punkt = readonly [number, number];

/** What a part's drawing may depend on: the face of the pose (eyes, mouth, brows), closed eyes (blinking) and the
 *  time in seconds (for small loops inside a drawing, like a flame). */
export interface Stand {
  gesicht: string;
  augenZu: boolean;
  zeit: number;
}

export interface Teil {
  /** Unique within the figure; poses and animations refer to it. */
  id: string;
  /** Pivot in figure coordinates (rest pose). The part and its children turn around it. */
  drehpunkt: Punkt;
  /** Drawn in figure coordinates of the rest pose. */
  zeichnung: (s: Stand) => ReactNode;
  /** Children follow this part (upper arm → forearm), drawn after it. */
  kinder?: Teil[];
  /** Places for items (`hut`, `hand-rechts`, …) in figure coordinates of the rest pose. They follow the part. */
  anker?: Record<string, Punkt>;
}

export interface Pose {
  name: string;
  gesicht: string;
  /** Degrees, clockwise, around the part's pivot (children add up). Missing = 0. */
  winkel?: Record<string, number>;
  /** Top-level parts drawn last (in front of the head), e.g. a paw at the chin. */
  vorne?: string[];
  /** Extra drawings of the figure shown in this pose (a heart, thought bubbles). */
  extras?: string[];
}

/** One track: values at equally spaced keyframes, from start to end. */
export interface Spur {
  /** Degrees, clockwise, around the part's pivot (added to the pose). */
  drehen?: number[];
  /** Offset in figure units. */
  schieben?: Punkt[];
  /** Scale x / y around the pivot (1 = as drawn), for squash and stretch. */
  strecken?: Punkt[];
}

/** How the values move between two keyframes. */
export type Kurve = 'weich' | 'linear' | 'feder';

export interface Animation {
  id: string;
  name: string;
  /** Seconds per run. */
  dauer: number;
  wiederholen: number | 'immer';
  /** Keyframe times from 0 to 1 (the same for every track); missing = equally spaced. */
  zeiten?: number[];
  kurve?: Kurve;
  /** Per part id, or `ganz` for the whole figure (turns and stretches around its `boden`). */
  spuren: Record<string, Spur>;
  /** Faces during the move: [from time 0…1, face]; before the first entry the pose's face. */
  gesichter?: [number, string][];
}

export interface Figur {
  id: string;
  name: string;
  art: 'begleiter' | 'held' | 'boss';
  /** Width and height of the drawing; the origin is top left. */
  groesse: Punkt;
  /** Where the figure stands: shadow and the pivot of `ganz`. */
  boden: Punkt;
  /** Top-level parts in drawing order (back to front). */
  teile: Teil[];
  posen: Record<string, Pose>;
  /** Ids of the animations (animationen.ts) that fit this figure. */
  animationen: string[];
  /** Every face the drawings know (for the workshop's pose editor). */
  gesichter: string[];
  extras?: Record<string, (s: Stand) => ReactNode>;
}

/** Something a figure can wear or hold: drawn around (0, 0), which sits on the anchor `platz`. */
export interface Item {
  id: string;
  name: string;
  platz: string;
  /** 1 Gewöhnlich … 5 Legendär (src/lernquest/teile.ts). */
  seltenheit: 1 | 2 | 3 | 4 | 5;
  /** Behind the part that carries the anchor (a cape behind the body). */
  hinten?: boolean;
  /** View box of the item alone (for the icon): x, y, width, height around the anchor. */
  rahmen: readonly [number, number, number, number];
  /** Draws differently over time (a flame, a sparkle): icons of it run a clock. */
  bewegt?: boolean;
  /** `zeit` in seconds, for an item that moves by itself; 0 when still. */
  zeichnung: (zeit: number) => ReactNode;
}
