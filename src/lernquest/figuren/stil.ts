// The one style of all Lernquest drawings (fox, hero, parts, bosses): colours, outline, light. Figure files use only
// these colours (checked by figuren.test.tsx), so everything drawn looks like one world. Rules: .claude/skills/figur.

/** Colours of the art, named by what they paint. Each base colour has a light (hell) and a dark (tief) shade:
 *  the light comes from the top left, the shadow sits bottom right. */
export const P = {
  linie: '#4A2414',
  weiss: '#FFFFFF',
  auge: '#2A1810',
  backe: '#FF8F86',
  mund: '#8E2B26',
  zunge: '#FF7C78',
  herz: '#E8485A',

  fell: '#F2792B',
  fellHell: '#F9A55A',
  fellTief: '#C9561A',
  creme: '#FFF3E0',
  ohrInnen: '#7A3A1E',

  gruen: '#2F8A2A',
  gruenTief: '#1F6420',
  gruenHell: '#45A93A',
  oliv: '#7E9A3E',
  olivTief: '#647C2E',
  leder: '#7A4A24',
  lederTief: '#5A3418',
  lederHell: '#A06A3A',

  gold: '#FFC531',
  goldTief: '#C98F00',
  goldHell: '#FFE38A',
  metall: '#C9D3DC',
  metallTief: '#8C99A6',
  metallHell: '#F2F6FA',
  holz: '#B9824A',
  holzTief: '#8A5A2C',
  rot: '#D9473B',
  rotTief: '#A3302A',
  blau: '#4F8FE0',
  blauTief: '#2F62B0',
  blauHell: '#A9D2FF',
  lila: '#8A55D9',
  lilaTief: '#5E33A6',
  lilaHell: '#C7A8F5',

  tinte: '#3E3F8F',
  tinteTief: '#2A2A66',
  tinteHell: '#6E70C9',
  saugnapf: '#F6C6E0',

  // The landscape of the map (gelaende.tsx): meadow, leaves, castle stone, roofs, path, water, sky.
  wiese: '#7CC04F',
  wieseHell: '#A3D86A',
  wieseTief: '#5DA83A',
  blatt: '#3F9A35',
  blattHell: '#6CC24A',
  blattTief: '#2B7A2A',
  stein: '#EDE3CB',
  steinHell: '#FFF9EA',
  steinTief: '#C2B393',
  sand: '#F6E7BC',
  sandHell: '#FFF6D8',
  sandTief: '#D9C28A',
  wasser: '#6FC3E8',
  wasserHell: '#C4ECFA',
  wasserTief: '#3E97C4',
  himmel: '#CDEBF3',
  nacht: '#4B2D6E',
  nachtHell: '#7A55A8',
  nachtTief: '#2E1A47',
  schatten: '#4A2414',

  // The hero (held.tsx, Stufe E Teil 4): skin tones in the order of HAUT in src/lernquest/teile.ts, hair in the order
  // of HAARFARBEN, then more colours for clothes, items, companions and backgrounds.
  haut0: '#F2C9A0',
  haut0Hell: '#F9DEC2',
  haut0Tief: '#DDAE80',
  haut1: '#E8B48A',
  haut1Hell: '#F2CBA8',
  haut1Tief: '#D29A6E',
  haut2: '#C98E62',
  haut2Hell: '#DCA77F',
  haut2Tief: '#AE744A',
  haut3: '#A86E45',
  haut3Hell: '#C08A60',
  haut3Tief: '#8E5833',
  haut4: '#7A4E2E',
  haut4Hell: '#94653F',
  haut4Tief: '#5F3A20',
  haut5: '#F6DCC4',
  haut5Hell: '#FCEBDB',
  haut5Tief: '#E8C3A2',
  haar0: '#4A2E1A',
  haar0Hell: '#6E4A2E',
  haar0Tief: '#331E10',
  haar1: '#1E1A1A',
  haar1Hell: '#4A4040',
  haar1Tief: '#0E0B0B',
  haar2: '#8A5A32',
  haar2Hell: '#AE7C4E',
  haar2Tief: '#6A4224',
  haar3: '#D9B061',
  haar3Hell: '#F0D08A',
  haar3Tief: '#B88E40',
  haar4: '#A8441E',
  haar4Hell: '#CC6A3E',
  haar4Tief: '#82300F',
  rosa: '#F28DB2',
  rosaHell: '#FBC3D8',
  rosaTief: '#C9608A',
  orange: '#F59A2E',
  orangeHell: '#FFC27A',
  orangeTief: '#C4701A',
  tuerkis: '#2FC2B0',
  tuerkisHell: '#8CE8DC',
  tuerkisTief: '#1E8E82',
  eis: '#BFE9F7',
  eisHell: '#EAF9FF',
  eisTief: '#7FC4DE',
  grau: '#8A8F99',
  grauHell: '#B9BEC6',
  grauTief: '#5E636D',
  dunkel: '#3A3550',
  dunkelHell: '#5C5677',
  dunkelTief: '#231F33',
  lava: '#FF5A1F',
  lavaHell: '#FFB13D',
  lavaTief: '#B8300E',
  gelb: '#FFE24A',
  gelbHell: '#FFF29A',
  gelbTief: '#D9B300',
  schnee: '#F4F8FC',
} as const;

/** The outline every shape gets: 3 units, round joins. Small details (mouth, belt) use 2.5. */
export const UMRISS = { stroke: P.linie, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
export const UMRISS_FEIN = { ...UMRISS, strokeWidth: 2.5 } as const;

/** Rarity frame colours, the same as SELTENHEITEN in src/lernquest/teile.ts (index 0 = Gewöhnlich). */
export const SELTEN_FARBE = ['#6E6990', '#13804A', '#2459B8', '#6A2FC4', '#8A6100'] as const;

/** A colour with its light and dark shade. */
export interface Ton {
  farbe: string;
  hell: string;
  tief: string;
}
const ton = (k: 'haut0' | 'haut1' | 'haut2' | 'haut3' | 'haut4' | 'haut5' | 'haar0' | 'haar1' | 'haar2' | 'haar3' | 'haar4'): Ton => ({ farbe: P[k], hell: P[`${k}Hell`], tief: P[`${k}Tief`] });
/** Skin tones, index = `avatar.haut` (HAUT in src/lernquest/teile.ts, the same base colours). */
export const HAUT_TOENE: Ton[] = [ton('haut0'), ton('haut1'), ton('haut2'), ton('haut3'), ton('haut4'), ton('haut5')];
/** Hair colours, index = `avatar.haarfarbe` (HAARFARBEN in src/lernquest/teile.ts). */
export const HAAR_TOENE: Ton[] = [ton('haar0'), ton('haar1'), ton('haar2'), ton('haar3'), ton('haar4')];
