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
  schatten: '#4A2414',
} as const;

/** The outline every shape gets: 3 units, round joins. Small details (mouth, belt) use 2.5. */
export const UMRISS = { stroke: P.linie, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
export const UMRISS_FEIN = { ...UMRISS, strokeWidth: 2.5 } as const;

/** Rarity frame colours, the same as SELTENHEITEN in src/lernquest/teile.ts (index 0 = Gewöhnlich). */
export const SELTEN_FARBE = ['#6E6990', '#13804A', '#2459B8', '#6A2FC4', '#8A6100'] as const;
