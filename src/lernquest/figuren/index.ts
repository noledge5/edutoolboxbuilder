// All drawn figures and items of Lernquest. New ones are added here; the workshop (src/lernquest/werkstatt/) and the
// tests pick them up from these lists.
import { FUCHS } from './fuchs';
import { HELD } from './held';
import { ITEMS } from './items';
import { TINTENKRAKE } from './tintenkrake';
import type { Figur } from './typen';

export const FIGUREN: Figur[] = [FUCHS, HELD, TINTENKRAKE];
export { ITEMS, FUCHS, HELD, TINTENKRAKE };
export { held, KLEIDUNG, AUGEN_ARTEN, MUND_ARTEN, FRISUR_ARTEN } from './held';
export type { Aussehen } from './held';
export { HINTERGRUENDE } from './hintergruende';
export type { Hintergrund } from './hintergruende';
export { ANIMATIONEN } from './animationen';
export { FigurBild, ItemBild } from './Figur';
export type { Animation, Figur, Item, Pose, Teil } from './typen';
export { GELAENDE, Burg, BossBurg, Baum, Tanne, Busch, Blume, Stein } from './gelaende';
export type { GelaendeTeil } from './gelaende';
