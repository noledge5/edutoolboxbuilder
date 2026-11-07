// Painted pictures for the hero (docs/design/lernquest/bilder.md): the art style, the prompt templates for Krea 2 in
// ComfyUI and where each place sits on the avatar canvas (viewBox 0 0 240 240). Used by `npm run lq:bilder`
// (scripts/lq-bilder.ts), which runs in plain Node, so imports here carry their `.ts` extension.
import { FRISUREN, HAUT, SLOTS, TEILE, type Slot, type Teil } from '../teile.ts';

/** How a raw picture becomes a layer: placed into a box (`einzeln`), or painted on the base figure (`figur`). */
export type Weg = 'einzeln' | 'figur' | 'flaeche';

/** Where a part sits on the 240 canvas when it is made on its own: scaled to `breite` (or less, so it stays within
 *  `hoehe`), then its bottom middle (`unten`) or its centre (`mitte`) goes to (x, y). */
export interface Platz {
  weg: Weg;
  x: number;
  y: number;
  breite: number;
  hoehe: number;
  anker: 'unten' | 'mitte';
}

export const PLAETZE: Record<Slot, Platz> = {
  hintergrund: {
    weg: 'flaeche',
    x: 120,
    y: 120,
    breite: 240,
    hoehe: 240,
    anker: 'mitte',
  },
  begleiter: {
    weg: 'einzeln',
    x: 48,
    y: 230,
    breite: 70,
    hoehe: 70,
    anker: 'unten',
  },
  kleidung: {
    weg: 'figur',
    x: 120,
    y: 170,
    breite: 88,
    hoehe: 92,
    anker: 'mitte',
  },
  augen: {
    weg: 'einzeln',
    x: 120,
    y: 100,
    breite: 64,
    hoehe: 30,
    anker: 'mitte',
  },
  kopf: {
    weg: 'einzeln',
    x: 120,
    y: 84,
    breite: 100,
    hoehe: 80,
    anker: 'unten',
  },
  werkzeug: {
    weg: 'einzeln',
    x: 182,
    y: 208,
    breite: 64,
    hoehe: 112,
    anker: 'unten',
  },
};

/** The clothes mask on the base figure (canvas units): the torso, a little wider so the edges are covered. */
export const KLEIDUNG_MASKE = { x: 80, y: 126, width: 80, height: 84, rx: 30 };
/** For edit pictures the change itself is the part, so clothes may reach the shoulders; the hands stay out (their
 *  skin would carry one skin tone into every figure): shoulders and chest above the hands, the belly between them. */
export const KLEIDUNG_EDIT_MASKE = [
  { x: 70, y: 120, width: 100, height: 52, rx: 22 },
  { x: 82, y: 150, width: 76, height: 64, rx: 26 },
];
/** The eye area, used to paint painted eyes away on the base figure. */
export const AUGEN_MASKE = { cx: 120, cy: 101, rx: 34, ry: 16 };
/** Points on the base figure that are bare skin (face centre, both hands): the skin colour is measured there. */
export const HAUT_PUNKTE: [number, number][] = [
  [120, 108],
  [112, 104],
  [128, 104],
  [78, 186],
  [162, 186],
];

/** Size of the raw pictures from ComfyUI and of the finished layers (twice the canvas, sharp on phones and iPads). */
export const ROH_GROESSE = 1024;
export const EBENE_GROESSE = 480;
/** The flat background the parts are generated on, so it can be cut away when there is no transparency. */
export const HINTERGRUND_FARBE = '#D9D9D9';

/** The style sentence that ends every prompt: the same words every time keep the 40 parts in one look. */
export const STIL =
  'Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. ' +
  'Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle ' +
  'gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, ' +
  'no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the ' +
  'fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, ' +
  'no watermark, no frame.';

/** What a rarity adds to the picture (Gewöhnlich plain … Legendär gold and sparkle), as in the vector set. */
export const SELTENHEIT_DETAILS = [
  'Simple and plain, one or two colours, no decoration.',
  'A few nice details and one small decoration.',
  'Detailed, with a pattern and one small gem or emblem.',
  'Richly detailed and a little magical, with gold accents and a soft glow.',
  'A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version.',
];

/** What each part shows, in English (the model reads English best). Every catalogue part needs one (test). */
export const BESCHREIBUNG: Record<string, string> = {
  // Kopf
  wollmuetze: 'a knitted wool beanie hat in red with a fluffy white pompom',
  stirnband: 'a sporty terry headband in teal, seen as a ring from the front',
  ritterhelm: 'a small rounded knight’s helmet in silver steel with an open face and a short red plume',
  entdeckerhut: 'an explorer’s safari hat in khaki with a brown band and a small compass pin',
  piratenhut: 'a black pirate tricorn hat with gold trim and a small white anchor emblem',
  zauberhut: 'a tall pointy wizard hat in deep purple with golden stars and a moon, the tip bent a little',
  krone: 'a royal golden crown with five points, red and blue jewels and a velvet inside',
  // Augen
  punktaugen: 'a pair of simple round black dot eyes with a tiny white highlight each',
  froehlich: 'a pair of happy curved smiling eyes (closed upward arcs) in dark brown',
  brille: 'a pair of round reading glasses with thin dark blue frames and clear lenses with a light reflection',
  sternaugen: 'a pair of big shining eyes with yellow star-shaped pupils',
  sonnenbrille: 'a pair of cool rectangular sunglasses with black frames and dark lenses with a light reflection',
  funkelaugen: 'a pair of big sparkling anime-style eyes with purple irises and several white star highlights',
  // Kleidung
  tshirt: 'a plain blue t-shirt',
  pulli: 'a cosy knitted green sweater with a simple stripe',
  latzhose: 'blue denim dungarees over a yellow shirt',
  weste: 'an explorer’s khaki vest with many pockets over a white shirt',
  ruestung: 'a knight’s silver plate armour with round shoulder plates and a red shield emblem on the chest',
  sternenmantel: 'a dark blue cloak sprinkled with little silver stars, closed with a round clasp',
  zauberrobe: 'a purple wizard robe with golden trim and a golden moon emblem on the chest',
  goldruestung: 'a shining golden plate armour with a blue diamond emblem on the chest',
  // Werkzeug
  lupe: 'a magnifying glass with a wooden handle and a brass rim',
  buch: 'a thick closed adventure book with a red leather cover and a golden bookmark ribbon',
  fernrohr: 'a brass telescope with leather grip, slightly extended',
  kompass: 'an old brass compass with a red needle, held upright on a short chain',
  zauberstab: 'a magic wand of dark wood with a glowing golden star on its tip',
  sternenschwert: 'a heroic sword with a pale blue crystal blade, golden crossguard and a blue star gem',
  // Begleiter
  schnecke: 'a tiny smiling snail with a spiral orange shell',
  katze: 'a small cute orange tabby cat sitting',
  eule: 'a small round brown owl with big eyes sitting',
  fuchs: 'a small cute red fox sitting with its fluffy tail curled around',
  roboter: 'a small friendly round robot with a single antenna and glowing blue eyes, standing',
  drache: 'a small cute baby dragon in green with tiny wings and a golden belly, sitting',
  // Hintergrund
  wiese: 'a sunny green meadow with a few flowers, soft rolling hills and a blue sky with one small cloud',
  strand: 'a sunny beach with soft sand, gentle blue sea waves and a bright sky',
  wald: 'a friendly green forest clearing with round trees on both sides and soft light',
  berge: 'a mountain valley with snowy peaks in the distance, a green meadow in front and a clear sky',
  nacht: 'a calm night meadow under a deep blue sky full of stars and a crescent moon',
  weltall: 'outer space with colourful planets, a purple nebula and many stars, a small rocky ground in front',
  regenbogen: 'a magical meadow under a big bright rainbow, golden light and tiny sparkles in the air',
  // Added 06.11.2026
  kappe: 'a sporty red baseball cap with the visor pointing to the right and a small yellow button on top',
  blumenkranz: 'a flower crown of pink, yellow and light blue flowers on a ring of green leaves',
  wikingerhelm: 'a round steel viking helmet with two curved cream horns and a leather band, cartoon style',
  herzaugen: 'a pair of pink heart-shaped eyes with a tiny white highlight each',
  taucherbrille: 'a pair of turquoise diving goggles with two clear lenses and a short strap on each side',
  kapuzenpulli: 'a cosy purple hoodie with the hood lying around the neck, two cream drawstrings and a front pocket',
  trikot: 'a red football jersey with two white stripes across the chest and a small yellow badge',
  drachenruestung: 'a green dragon-scale armour with golden round shoulder plates and a red gem on the chest',
  pinsel: 'a big artist paintbrush with a wooden handle, a silver ferrule and blue paint on the bristles',
  laterne: 'a small dark metal lantern with a handle on top and a warm glowing candle flame inside',
  dreizack: 'a golden trident with three sharp prongs and a small turquoise gem',
  hamster: 'a small chubby golden hamster with round cheeks, sitting',
  pinguin: 'a small cute penguin with a white belly and orange feet, standing',
  phoenix: 'a small cute phoenix bird with red and orange feathers, a golden flame tail and a golden crest, sitting',
  unterwasser: 'an underwater scene with blue water, light rays from above, green seaweed, bubbles and a sandy ground',
  burg: 'the courtyard of a friendly stone castle with two round towers, a wooden gate, a golden flag and green grass',
};

/** The sentence about the picture's layout, by place. */
const AUFBAU: Record<Slot, string> = {
  kopf:
    'Only the headwear, as if worn on an invisible head, seen straight from the front, fully visible and centred with ' +
    'empty space around it, on a plain flat light grey background. No head, no face, no hair, no person, no shadow on the ground.',
  augen:
    'Only the eyes as a flat sticker, seen straight from the front, both eyes side by side and centred, on a plain flat ' +
    'light grey background. No face, no skin, no eyebrows, no nose, no head.',
  werkzeug:
    'Only the object, standing upright and tilted slightly to the right, fully visible and centred with empty space ' +
    'around it, on a plain flat light grey background. No hand, no person, no shadow on the ground.',
  begleiter:
    'A small pet companion, full body, facing the viewer, fully visible and centred with empty space around it, on a ' +
    'plain flat light grey background. No person, no shadow on the ground.',
  hintergrund:
    'A square game background scene seen from the front, simple shapes and gentle depth, with a calm empty spot in the ' +
    'lower middle where a character will stand. No characters, no animals, no people.',
  kleidung:
    'The same cute child hero, standing front-facing with arms down at the sides, now wearing this clothing on the ' +
    'torso. Keep the pose, the body and the plain background unchanged.',
};

/**
 * Places whose parts are best made alone on grey (text to picture) and set onto the figure by the script: they do not
 * hang on `koerper.png`, so a new base figure keeps them. Everything else (skin, hair, eyes, clothes) is an edit of
 * `koerper.png`, because it has to fit the body exactly (decided with the teacher, 07.11.2026).
 */
export const EINZELN: Slot[] = ['kopf', 'werkzeug', 'begleiter'];

/** The full prompt for one part: what it is, the layout, the rarity and the shared style. */
export function prompt(t: Teil): string {
  const was = BESCHREIBUNG[t.id] ?? t.name;
  const satz = t.slot === 'hintergrund' ? `A background: ${was}.` : `${gross(was)}.`;
  return [satz, AUFBAU[t.slot], SELTENHEIT_DETAILS[t.seltenheit] ?? '', STIL].join(' ');
}

const gross = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** How each hair looks (`FRISUREN`), always painted medium brown; the script makes the other colours. */
export const FRISUR_BESCHREIBUNG: Record<string, string> = {
  kurz: 'short simple medium brown hair',
  zopf: 'medium brown hair tied into one ponytail with a small red hair tie, the ponytail hangs down behind the head on the right side',
  locken: 'fluffy round curly medium brown hair',
  lang: 'long straight medium brown hair falling over the shoulders',
  zoepfe: 'medium brown hair in two pigtails, one on each side of the head, with small blue hair ties',
  dutt: 'medium brown hair pulled up into a round bun on top of the head with a small pink hair band',
  stacheln: 'short spiky medium brown hair standing up',
  bob: 'a medium brown bob haircut, chin length, with a straight fringe above the eyes',
  glatze: 'no hair at all',
};

/** The base figure every part and hair sits on: bald, blank face (eyes and mouth come as layers) (T2I or picture to picture from the template). */
export const grundfigur = () =>
  'A cute chibi child hero standing front-facing with arms down at the sides, big round completely bald head with ' +
  'smooth skin, a completely blank smooth face with no eyes, no eyebrows, no mouth and no cheeks, a plain white ' +
  'sleeveless undershirt, dark brown trousers, a little space between the legs. Gender-neutral, friendly. The whole ' +
  `figure is visible on a plain flat light grey background, no shadow on the ground. ${STIL}`;

/** All prompts in catalogue order, grouped by place (for docs/design/lernquest/bilder/prompts.md). */
export function promptListe(): string {
  const out = [
    '# Lernquest-Bilder: alle Prompts (Text zu Bild)',
    '',
    'Erzeugt mit `npm run lq:bilder -- --prompts` aus `src/lernquest/bilder/vorlagen.ts`; nicht von Hand ändern.',
    'Dateiname des fertigen Bildes = ID (z. B. `krone.png`). Ablauf und Einstellungen: `docs/design/lernquest/bilder.md`.',
    'Empfehlung: Kopf, Werkzeug und Begleiter einzeln mit diesen Prompts (das Skript setzt sie an ihren Platz), dazu die',
    'Hintergründe. Grundfigur, Hauttöne, Frisuren, Augen und Kleidung als Edit von `koerper.png`: `edit-prompts.md`.',
    '',
    '## Grundfigur (`koerper.png`, Glatze; nur ohne Edit-Modell, Bild zu Bild aus `schablonen/grundfigur-vorlage.png`)',
    '',
    '```text',
    grundfigur(),
    '```',
  ];
  for (const { slot, label } of SLOTS) {
    const weg = PLAETZE[slot].weg;
    out.push(
      '',
      `## ${label} (${weg === 'figur' ? 'auf der Grundfigur mit `schablonen/kleidung-maske.png`' : weg === 'flaeche' ? 'ganzes Bild' : 'einzeln, grauer Hintergrund'}${EINZELN.includes(slot) || slot === 'hintergrund' ? '' : '; besser als Edit, siehe `edit-prompts.md`'})`,
    );
    for (const t of TEILE.filter((x) => x.slot === slot)) {
      out.push('', `### \`${t.id}\` – ${t.name}`, '', '```text', prompt(t), '```');
    }
  }
  return out.join('\n') + '\n';
}

// — Edit models (e.g. FLUX.2 Klein Image Edit): the part is painted onto the base figure `koerper.png` and
// `npm run lq:bilder` keeps only what changed (raw pictures in lernquest-roh/edit/). —

/** Where the script looks for the change, per place and for hair (canvas units); outside it the edit is ignored. */
export const EDIT_BEREICH: Record<Slot | 'haare', { x: number; y: number; width: number; height: number }> = {
  kopf: { x: 36, y: 0, width: 168, height: 98 },
  augen: { x: 80, y: 82, width: 80, height: 36 },
  werkzeug: { x: 126, y: 60, width: 114, height: 180 },
  begleiter: { x: 0, y: 120, width: 98, height: 120 },
  kleidung: { x: 64, y: 118, width: 112, height: 100 },
  hintergrund: { x: 0, y: 0, width: 240, height: 240 },
  haare: { x: 28, y: 0, width: 184, height: 176 },
};

/** The sentence that ends every edit: the figure must not move, so the change lands exactly on the canvas. */
export const EDIT_BEHALTEN =
  'Keep everything else exactly as it is: the same character, the same pose, the same position and size in the ' +
  'picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background ' +
  'and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.';

const EDIT_AUFTRAG: Record<Exclude<Slot, 'hintergrund'>, (was: string) => string> = {
  kopf: (was) =>
    `Put ${was} on the character's head, sitting naturally on top of the head, front view, sized to fit the head.`,
  augen: (was) =>
    `Paint ${was} on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size.`,
  kleidung: (was) =>
    `Dress the character in ${was}. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged.`,
  werkzeug: (was) =>
    `Let the character hold ${was} in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character.`,
  begleiter: (was) =>
    `Add ${was} on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character.`,
};

/** The edit instruction for one part (backgrounds are made as whole pictures instead). */
export function editPrompt(t: Teil): string | undefined {
  if (t.slot === 'hintergrund') return undefined;
  const was = BESCHREIBUNG[t.id] ?? t.name;
  return [
    EDIT_AUFTRAG[t.slot](was),
    `In the same soft painted style. ${SELTENHEIT_DETAILS[t.seltenheit] ?? ''}`,
    // Eyes are the change here: only the mouth stays away.
    t.slot === 'augen' ? EDIT_BEHALTEN.replace('the blank face without eyes or mouth', 'no mouth') : EDIT_BEHALTEN,
  ].join(' ');
}

/** The bald base figure from the vector template, with an edit model. */
export const editGrundfigur = () =>
  'Repaint this simple flat character as a soft painted illustration. Keep exactly the same pose, proportions, ' +
  'position and size in the picture and the same plain flat light grey background. A completely bald round head ' +
  'with smooth skin, a completely blank smooth face with no eyes, no eyebrows, no mouth and no cheeks, a plain white ' +
  `sleeveless undershirt, dark brown trousers, no shadow on the ground. ${STIL}`;

/** The bald base figure from a finished figure with hair (e.g. short hair), with an edit model. */
export const editGlatze =
  'Remove all the hair: the character is completely bald, with a smooth round head in the same skin colour as the ' +
  'face and the same ears, and make the face completely blank and smooth (no eyes, no mouth, no cheeks). Keep the ' +
  'body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not ' +
  'move, crop or zoom.';

/** Words for the skin tones (`HAUT`, same order) for the edits that make them. */
export const HAUT_BESCHREIBUNG = [
  'light peach',
  'warm light tan',
  'medium golden tan',
  'warm medium brown',
  'deep dark brown',
  'very fair light pinkish beige',
];

/** One skin tone of the bald base figure (`koerper_h<i>.png`), with an edit model. */
export const editHaut = (i: number) =>
  `Change the skin colour of the character to a natural ${HAUT_BESCHREIBUNG[i]} human skin tone (about ${HAUT[i]}) ` +
  'everywhere: head, ears, face, neck, arms and hands, with matching soft shading and the same warm rim light. Keep ' +
  'the soft painted edges without dark outlines. ' +
  'Keep the bald head, the blank face without eyes or mouth, the clothes, the pose, the position and size in the picture and the ' +
  'plain flat light grey background exactly the same. Do not move, crop or zoom.';

/** One hair on the bald base figure (`edit/haare-<id>.png`), with an edit model; always brown. */
export const editFrisur = (id: string) =>
  `Give the character ${FRISUR_BESCHREIBUNG[id] ?? id}, in the same soft painted style. Keep the face (still blank, ` +
  'without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and ' +
  'the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.';

/** All edit instructions (for docs/design/lernquest/bilder/edit-prompts.md). */
export function editListe(): string {
  const out = [
    '# Lernquest-Bilder: Edit-Prompts (z. B. FLUX.2 Klein Image Edit)',
    '',
    'Erzeugt mit `npm run lq:bilder -- --prompts` aus `src/lernquest/bilder/vorlagen.ts`; nicht von Hand ändern.',
    'Regeln für die Ergebnisse: `docs/design/lernquest/bilder.md`, Abschnitt „Mit einem Edit-Modell“.',
    'Alles wird auf die Glatzkopf-Grundfigur `koerper.png` gemalt (Hautton 1, Gesicht leer), außer den Hauttönen selbst.',
    'Kopf, Werkzeug und Begleiter entstehen einzeln mit Text zu Bild (`prompts.md`), damit sie bei einer neuen',
    'Grundfigur gültig bleiben.',
    '',
    '## 1. Grundfigur `koerper.png` (Glatze)',
    '',
    'Aus einer fertigen Figur mit Haaren (z. B. deinen kurzen Haaren):',
    '',
    '```text',
    editGlatze,
    '```',
    '',
    'Oder neu aus `schablonen/grundfigur-vorlage.png`:',
    '',
    '```text',
    editGrundfigur(),
    '```',
    '',
    '## 2. Hauttöne `koerper_h1.png` … `koerper_h5.png` (Eingabe: `koerper.png`, Ablage in `lernquest-roh/`)',
  ];
  for (let i = 1; i < HAUT.length; i++)
    out.push('', `### \`koerper_h${i}\` – Hautton ${i + 1} (${HAUT[i]})`, '', '```text', editHaut(i), '```');
  out.push('', '## 3. Frisuren `haare-<id>.png` (Eingabe: `koerper.png`, Ablage in `lernquest-roh/edit/`)');
  for (const f of FRISUREN.filter((x) => x.id !== 'glatze'))
    out.push('', `### \`haare-${f.id}\` – ${f.name}`, '', '```text', editFrisur(f.id), '```');
  for (const { slot, label } of SLOTS) {
    if (slot === 'hintergrund' || EINZELN.includes(slot)) continue;
    out.push('', `## ${label} (Eingabe: \`koerper.png\`, Ablage in \`lernquest-roh/edit/\`)`);
    for (const t of TEILE.filter((x) => x.slot === slot))
      out.push('', `### \`${t.id}\` – ${t.name}`, '', '```text', editPrompt(t)!, '```');
  }
  out.push(
    '',
    '## Kopf, Werkzeug, Begleiter und Hintergründe',
    '',
    'Keine Edits: einzeln (Hintergründe als ganzes Bild) mit Text zu Bild, Prompts in `prompts.md`.',
  );
  return out.join('\n') + '\n';
}
