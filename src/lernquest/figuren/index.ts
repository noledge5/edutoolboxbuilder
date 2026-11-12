// All drawn figures and items of Lernquest. New ones are added here; the workshop (src/lernquest/werkstatt/) and the
// tests pick them up from these lists.
import { FUCHS } from './fuchs';
import { ITEMS } from './items';
import { TINTENKRAKE } from './tintenkrake';
import type { Figur } from './typen';

export const FIGUREN: Figur[] = [FUCHS, TINTENKRAKE];
export { ITEMS, FUCHS, TINTENKRAKE };
export { ANIMATIONEN } from './animationen';
export { FigurBild, ItemBild } from './Figur';
export type { Animation, Figur, Item, Pose, Teil } from './typen';
