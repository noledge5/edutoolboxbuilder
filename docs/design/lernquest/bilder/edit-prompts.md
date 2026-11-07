# Lernquest-Bilder: Edit-Prompts (z. B. FLUX.2 Klein Image Edit)

Erzeugt mit `npm run lq:bilder -- --prompts` aus `src/lernquest/bilder/vorlagen.ts`; nicht von Hand ändern.
Regeln für die Ergebnisse: `docs/design/lernquest/bilder.md`, Abschnitt „Mit einem Edit-Modell“.

## Grundfigur `koerper.png` (Eingabe: `schablonen/grundfigur-vorlage.png`)

```text
Repaint this simple flat character as a soft painted illustration. Keep exactly the same pose, proportions, position and size in the picture and the same plain flat light grey background. Short simple brown hair, rosy cheeks, a small smile, a smooth blank face with no eyes and no eyebrows, a plain white sleeveless undershirt, dark brown trousers, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light, no hard black outlines (edges are a slightly darker shade of the fill colour). Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

## Zopf: `koerper2.png` (Eingabe: `koerper.png`)

```text
Change only the hair to brown hair tied into one ponytail with a small red hair tie, the ponytail hangs down behind the head on the right side. Keep the face (still without eyes), the skin, the body, the pose, the position and size in the picture and the plain flat light grey background exactly the same.
```

## Locken: `koerper3.png` (Eingabe: `koerper.png`)

```text
Change only the hair to fluffy round curly dark brown hair. Keep the face (still without eyes), the skin, the body, the pose, the position and size in the picture and the plain flat light grey background exactly the same.
```

## Kopf (Eingabe: `koerper.png`, Ergebnis nach `lernquest-roh/edit/`)

### `wollmuetze` – Wollmütze

```text
Put a knitted wool beanie hat in red with a fluffy white pompom on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `stirnband` – Stirnband

```text
Put a sporty terry headband in teal, seen as a ring from the front on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `ritterhelm` – Ritterhelm

```text
Put a small rounded knight’s helmet in silver steel with an open face and a short red plume on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `entdeckerhut` – Entdeckerhut

```text
Put an explorer’s safari hat in khaki with a brown band and a small compass pin on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `piratenhut` – Piratenhut

```text
Put a black pirate tricorn hat with gold trim and a small white anchor emblem on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `zauberhut` – Zauberhut

```text
Put a tall pointy wizard hat in deep purple with golden stars and a moon, the tip bent a little on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `krone` – Krone

```text
Put a royal golden crown with five points, red and blue jewels and a velvet inside on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `kappe` – Schirmmütze

```text
Put a sporty red baseball cap with the visor pointing to the right and a small yellow button on top on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `blumenkranz` – Blumenkranz

```text
Put a flower crown of pink, yellow and light blue flowers on a ring of green leaves on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `wikingerhelm` – Wikingerhelm

```text
Put a round steel viking helmet with two curved cream horns and a leather band, cartoon style on the character's head, sitting naturally on top of the hair, front view, sized to fit the head. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Augen (Eingabe: `koerper.png`, Ergebnis nach `lernquest-roh/edit/`)

### `punktaugen` – Punktaugen

```text
Paint a pair of simple round black dot eyes with a tiny white highlight each on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `froehlich` – Fröhliche Augen

```text
Paint a pair of happy curved smiling eyes (closed upward arcs) in dark brown on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `brille` – Brille

```text
Paint a pair of round reading glasses with thin dark blue frames and clear lenses with a light reflection on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sternaugen` – Sternaugen

```text
Paint a pair of big shining eyes with yellow star-shaped pupils on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sonnenbrille` – Sonnenbrille

```text
Paint a pair of cool rectangular sunglasses with black frames and dark lenses with a light reflection on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `funkelaugen` – Funkelaugen

```text
Paint a pair of big sparkling anime-style eyes with purple irises and several white star highlights on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `herzaugen` – Herzaugen

```text
Paint a pair of pink heart-shaped eyes with a tiny white highlight each on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `taucherbrille` – Taucherbrille

```text
Paint a pair of turquoise diving goggles with two clear lenses and a short strap on each side on the character's face where the eyes belong, between the hair and the cheeks, both eyes the same size. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Kleidung (Eingabe: `koerper.png`, Ergebnis nach `lernquest-roh/edit/`)

### `tshirt` – T-Shirt

```text
Dress the character in a plain blue t-shirt. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `pulli` – Pulli

```text
Dress the character in a cosy knitted green sweater with a simple stripe. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `latzhose` – Latzhose

```text
Dress the character in blue denim dungarees over a yellow shirt. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `weste` – Entdeckerweste

```text
Dress the character in an explorer’s khaki vest with many pockets over a white shirt. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `ruestung` – Ritterrüstung

```text
Dress the character in a knight’s silver plate armour with round shoulder plates and a red shield emblem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sternenmantel` – Sternenmantel

```text
Dress the character in a dark blue cloak sprinkled with little silver stars, closed with a round clasp. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `zauberrobe` – Zauberrobe

```text
Dress the character in a purple wizard robe with golden trim and a golden moon emblem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `goldruestung` – Goldrüstung

```text
Dress the character in a shining golden plate armour with a blue diamond emblem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `kapuzenpulli` – Kapuzenpulli

```text
Dress the character in a cosy purple hoodie with the hood lying around the neck, two cream drawstrings and a front pocket. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `trikot` – Trikot

```text
Dress the character in a red football jersey with two white stripes across the chest and a small yellow badge. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `drachenruestung` – Drachenrüstung

```text
Dress the character in a green dragon-scale armour with golden round shoulder plates and a red gem on the chest. It covers only the upper body (chest, belly and shoulders); the hands, legs, head and hair stay unchanged. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Werkzeug (Eingabe: `koerper.png`, Ergebnis nach `lernquest-roh/edit/`)

### `lupe` – Lupe

```text
Let the character hold a magnifying glass with a wooden handle and a brass rim in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `buch` – Buch

```text
Let the character hold a thick closed adventure book with a red leather cover and a golden bookmark ribbon in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `fernrohr` – Fernrohr

```text
Let the character hold a brass telescope with leather grip, slightly extended in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `kompass` – Kompass

```text
Let the character hold an old brass compass with a red needle, held upright on a short chain in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `zauberstab` – Zauberstab

```text
Let the character hold a magic wand of dark wood with a glowing golden star on its tip in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `sternenschwert` – Sternenschwert

```text
Let the character hold a heroic sword with a pale blue crystal blade, golden crossguard and a blue star gem in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `pinsel` – Pinsel

```text
Let the character hold a big artist paintbrush with a wooden handle, a silver ferrule and blue paint on the bristles in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `laterne` – Laterne

```text
Let the character hold a small dark metal lantern with a handle on top and a warm glowing candle flame inside in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `dreizack` – Dreizack

```text
Let the character hold a golden trident with three sharp prongs and a small turquoise gem in the hand on the right side of the picture, upright and slightly tilted to the right, about half as tall as the character. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Begleiter (Eingabe: `koerper.png`, Ergebnis nach `lernquest-roh/edit/`)

### `schnecke` – Schnecke

```text
Add a tiny smiling snail with a spiral orange shell on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `katze` – Katze

```text
Add a small cute orange tabby cat sitting on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `eule` – Eule

```text
Add a small round brown owl with big eyes sitting on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `fuchs` – Fuchs

```text
Add a small cute red fox sitting with its fluffy tail curled around on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. Detailed, with a pattern and one small gem or emblem. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `roboter` – Roboter

```text
Add a small friendly round robot with a single antenna and glowing blue eyes, standing on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. Richly detailed and a little magical, with gold accents and a soft glow. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `drache` – Drache

```text
Add a small cute baby dragon in green with tiny wings and a golden belly, sitting on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `hamster` – Hamster

```text
Add a small chubby golden hamster with round cheeks, sitting on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. Simple and plain, one or two colours, no decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `pinguin` – Pinguin

```text
Add a small cute penguin with a white belly and orange feet, standing on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. A few nice details and one small decoration. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

### `phoenix` – Phönix

```text
Add a small cute phoenix bird with red and orange feathers, a golden flame tail and a golden crest, sitting on the ground to the left of the character's feet, about a third as tall as the character, facing the viewer, not touching the character. In the same soft painted style. A legendary treasure: ornate gold details, a warm glow and a few tiny sparkles, the most precious looking version. Keep everything else exactly as it is: the same character, the same pose, the same position and size in the picture, the face without eyes, the hair, the body, the plain flat light grey background and the soft painted style. Do not move, crop or zoom. Change nothing else and add nothing else.
```

## Hintergründe

Keine Edits: als ganzes Bild mit Text zu Bild, Prompts in `prompts.md`.
