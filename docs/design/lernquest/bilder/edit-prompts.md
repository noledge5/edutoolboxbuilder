# Lernquest-Bilder: Edit-Prompts (z. B. FLUX.2 Klein Image Edit)

Erzeugt mit `npm run lq:bilder -- --prompts` aus `src/lernquest/bilder/vorlagen.ts`; nicht von Hand ändern.
Regeln für die Ergebnisse: `docs/design/lernquest/bilder.md`, Abschnitt „Mit einem Edit-Modell“.
Alles wird auf die Glatzkopf-Grundfigur `koerper.png` gemalt (Hautton 1, Gesicht leer), außer den Hauttönen selbst.
Kopf, Werkzeug und Begleiter entstehen einzeln mit Text zu Bild (`prompts.md`), damit sie bei einer neuen
Grundfigur gültig bleiben.

## 1. Grundfigur `koerper.png` (Glatze)

Aus einer fertigen Figur mit Haaren (z. B. deinen kurzen Haaren):

```text
Remove all the hair: the character is completely bald, with a smooth round head in the same skin colour as the face and the same ears, and make the face completely blank and smooth (no eyes, no mouth, no cheeks). Keep the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom.
```

Oder neu aus `schablonen/grundfigur-vorlage.png`:

```text
Repaint this simple flat character as a soft painted illustration. Keep exactly the same pose, proportions, position and size in the picture and the same plain flat light grey background. A completely bald round head with smooth skin, a completely blank smooth face with no eyes, no eyebrows, no mouth and no cheeks, a plain white sleeveless undershirt, dark brown trousers, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

## 2. Hauttöne `koerper_h1.png` … `koerper_h5.png` (Eingabe: `koerper.png`, Ablage in `lernquest-roh/`)

### `koerper_h1` – Hautton 2 (#E8B48A)

```text
Change the skin colour of the character to a natural warm light tan human skin tone (about #E8B48A) everywhere: head, ears, face, neck, arms and hands, with matching soft shading and the same warm rim light. Keep the soft painted edges without dark outlines. Keep the bald head, the blank face without eyes or mouth, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom.
```

### `koerper_h2` – Hautton 3 (#C98E62)

```text
Change the skin colour of the character to a natural medium golden tan human skin tone (about #C98E62) everywhere: head, ears, face, neck, arms and hands, with matching soft shading and the same warm rim light. Keep the soft painted edges without dark outlines. Keep the bald head, the blank face without eyes or mouth, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom.
```

### `koerper_h3` – Hautton 4 (#A86E45)

```text
Change the skin colour of the character to a natural warm medium brown human skin tone (about #A86E45) everywhere: head, ears, face, neck, arms and hands, with matching soft shading and the same warm rim light. Keep the soft painted edges without dark outlines. Keep the bald head, the blank face without eyes or mouth, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom.
```

### `koerper_h4` – Hautton 5 (#7A4E2E)

```text
Change the skin colour of the character to a natural deep dark brown human skin tone (about #7A4E2E) everywhere: head, ears, face, neck, arms and hands, with matching soft shading and the same warm rim light. Keep the soft painted edges without dark outlines. Keep the bald head, the blank face without eyes or mouth, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom.
```

### `koerper_h5` – Hautton 6 (#F6DCC4)

```text
Change the skin colour of the character to a natural very fair light pinkish beige human skin tone (about #F6DCC4) everywhere: head, ears, face, neck, arms and hands, with matching soft shading and the same warm rim light. Keep the soft painted edges without dark outlines. Keep the bald head, the blank face without eyes or mouth, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom.
```

## 3. Frisuren `haare-<id>.png` (Eingabe: `koerper.png`, Ablage in `lernquest-roh/edit/`)

### `haare-kurz` – Kurze Haare

```text
Give the character short simple medium brown hair, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-zopf` – Zopf

```text
Give the character medium brown hair tied into one ponytail with a small red hair tie, the ponytail hangs down behind the head on the right side, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-locken` – Locken

```text
Give the character fluffy round curly medium brown hair, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-lang` – Lange Haare

```text
Give the character long straight medium brown hair falling over the shoulders, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-zoepfe` – Zwei Zöpfe

```text
Give the character medium brown hair in two pigtails, one on each side of the head, with small blue hair ties, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-dutt` – Dutt

```text
Give the character medium brown hair pulled up into a round bun on top of the head with a small pink hair band, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-stacheln` – Stachelhaare

```text
Give the character short spiky medium brown hair standing up, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

### `haare-bob` – Bob

```text
Give the character a medium brown bob haircut, chin length, with a straight fringe above the eyes, in the same soft painted style. Keep the face (still blank, without eyes or mouth), the forehead, the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background exactly the same. Do not move, crop or zoom. Change nothing else.
```

## 4. Münder `mund-<id>.png` (Eingabe: `koerper.png`, Ablage in `lernquest-roh/edit/`)

### `mund-laecheln` – Lächeln

```text
Paint a small friendly closed-mouth smile on the character's blank face, centred in the lower third of the face, with two small soft pink cheeks left and right of it, in the same soft painted style. Keep everything else exactly as it is: the same character, the bald head, the rest of the face still blank (no eyes, no eyebrows, no nose), the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `mund-grinsen` – Grinsen

```text
Paint a wide cheerful grin that shows a row of white teeth on the character's blank face, centred in the lower third of the face, with two small soft pink cheeks left and right of it, in the same soft painted style. Keep everything else exactly as it is: the same character, the bald head, the rest of the face still blank (no eyes, no eyebrows, no nose), the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `mund-lachen` – Lachen

```text
Paint a big laughing open mouth with a pink tongue on the character's blank face, centred in the lower third of the face, with two small soft pink cheeks left and right of it, in the same soft painted style. Keep everything else exactly as it is: the same character, the bald head, the rest of the face still blank (no eyes, no eyebrows, no nose), the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `mund-staunen` – Staunen

```text
Paint a small round open mouth, as if surprised on the character's blank face, centred in the lower third of the face, with two small soft pink cheeks left and right of it, in the same soft painted style. Keep everything else exactly as it is: the same character, the bald head, the rest of the face still blank (no eyes, no eyebrows, no nose), the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `mund-frech` – Zunge raus

```text
Paint a cheeky smile with the tongue sticking out on the character's blank face, centred in the lower third of the face, with two small soft pink cheeks left and right of it, in the same soft painted style. Keep everything else exactly as it is: the same character, the bald head, the rest of the face still blank (no eyes, no eyebrows, no nose), the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `mund-ernst` – Ernst

```text
Paint a small straight serious mouth on the character's blank face, centred in the lower third of the face, with two small soft pink cheeks left and right of it, in the same soft painted style. Keep everything else exactly as it is: the same character, the bald head, the rest of the face still blank (no eyes, no eyebrows, no nose), the skin colour, the body, the clothes, the pose, the position and size in the picture and the plain flat light grey background. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Augen (Eingabe: `koerper.png`, Ablage in `lernquest-roh/edit/`)

### `punktaugen` – Punktaugen

```text
Paint a pair of simple round black dot eyes with a tiny white highlight each on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `froehlich` – Fröhliche Augen

```text
Paint a pair of happy curved smiling eyes (closed upward arcs) in dark brown on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `brille` – Brille

```text
Paint a pair of round reading glasses with thin dark blue frames and clear lenses with a light reflection on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sternaugen` – Sternaugen

```text
Paint a pair of big shining eyes with yellow star-shaped pupils on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sonnenbrille` – Sonnenbrille

```text
Paint a pair of cool rectangular sunglasses with black frames and dark lenses with a light reflection on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `funkelaugen` – Funkelaugen

```text
Paint a pair of big sparkling anime-style eyes with purple irises and several white star highlights on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `herzaugen` – Herzaugen

```text
Paint a pair of pink heart-shaped eyes with a tiny white highlight each on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `taucherbrille` – Taucherbrille

```text
Paint a pair of turquoise diving goggles with two clear lenses and a short strap on each side on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `schlaefrig` – Schläfrige Augen

```text
Paint a pair of sleepy half-closed eyes with heavy lids and long lashes, in dark brown on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `zwinkern` – Zwinkern

```text
Paint a pair of eyes with one eye winking as a curved line and the other eye open and round with a white highlight on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `monokel` – Monokel

```text
Paint one round golden monocle with a thin golden chain over the right eye, the left eye a simple round dark eye with a white highlight on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `feueraugen` – Feueraugen

```text
Paint a pair of fiery eyes with orange and red flame-shaped irises and a small flickering flame above each eye on the character's face where the eyes belong, between the forehead and the cheeks, both eyes the same size. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, no mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Kleidung (Eingabe: `koerper.png`, Ablage in `lernquest-roh/edit/`)

### `tshirt` – T-Shirt

```text
Dress the character in a plain blue t-shirt. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `pulli` – Pulli

```text
Dress the character in a cosy knitted green sweater with a simple stripe. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `latzhose` – Latzhose

```text
Dress the character in blue denim dungarees over a yellow shirt. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `weste` – Entdeckerweste

```text
Dress the character in an explorer’s khaki vest with many pockets over a white shirt. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `ruestung` – Ritterrüstung

```text
Dress the character in a knight’s silver plate armour with round shoulder plates and a red shield emblem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sternenmantel` – Sternenmantel

```text
Dress the character in a dark blue cloak sprinkled with little silver stars, closed with a round clasp. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `zauberrobe` – Zauberrobe

```text
Dress the character in a purple wizard robe with golden trim and a golden moon emblem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `goldruestung` – Goldrüstung

```text
Dress the character in a shining golden plate armour with a blue diamond emblem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `kapuzenpulli` – Kapuzenpulli

```text
Dress the character in a cosy purple hoodie with the hood lying around the neck, two cream drawstrings and a front pocket. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `trikot` – Trikot

```text
Dress the character in a red football jersey with two white stripes across the chest and a small yellow badge. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `drachenruestung` – Drachenrüstung

```text
Dress the character in a green dragon-scale armour with golden round shoulder plates and a red gem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `regenjacke` – Regenjacke

```text
Dress the character in a shiny yellow raincoat with a turned-down collar, big round wooden toggle buttons and two pockets. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `ninjaanzug` – Ninja-Anzug

```text
Dress the character in a dark blue ninja suit with a wrapped front, a red cloth belt tied in a knot and light blue trim. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `raumanzug` – Raumanzug

```text
Dress the character in a white astronaut suit with a blue chest control panel with little coloured buttons, orange stripes and a round mission patch. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `kristallruestung` – Kristallrüstung

```text
Dress the character in a shining armour of pale blue crystal plates with silver edges, round crystal shoulder plates and a glowing diamond on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs and head stay unchanged. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the bald head, the blank face without eyes or mouth, the skin colour, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Kopf, Werkzeug, Begleiter und Hintergründe

Keine Edits: einzeln (Hintergründe als ganzes Bild) mit Text zu Bild, Prompts in `prompts.md`.
