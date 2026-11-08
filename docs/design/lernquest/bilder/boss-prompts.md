# Lernquest-Bilder: Prompts für die drei Bosse

Von Hand geschrieben (08.11.2026), nicht vom Skript; der Stil-Teil am Ende jedes Prompts ist `STIL` aus
`src/lernquest/bilder/vorlagen.ts`. Ändert sich `STIL`, hier mitziehen. Regeln: `docs/design/lernquest/bilder.md`.

**Ablauf:** Vorlage = das Vektor-Bild des Bosses (`schablonen/boss-1-der-kompass-golem.png` …, 1024 × 1024, aus
`BossBild` in `src/lernquest/app/Boss.tsx`), vorher auf einen
einfarbigen hellgrauen Hintergrund legen. Dann der Edit-Prompt; ohne Edit-Modell der Text-zu-Bild-Prompt. Danach
freistellen (durchsichtig), quadratisch, mindestens 1024 × 1024. Das fertige Bild ist später das Start- und Endbild
der Bewegungsschleife.

Die Bosse dürfen etwas bedrohlicher wirken als Held und Begleiter, bleiben aber Gegner zum Liebhaben: frech, nicht
gruselig. Die Kennzeichen bleiben (Kompass, Tinte, Fragezeichen), damit die Kinder sie wiedererkennen.

## 1. Der Kompass-Golem (`boss-1`)

Edit:

```text
Repaint this simple flat boss character as a soft painted illustration. Keep exactly the same pose, proportions, position and size in the picture. A big, chunky stone golem made of rounded blue-grey rock with a few cracks and small mossy spots, two short stone horns on top of the head, small glowing warm yellow eyes, stubby stone legs and heavy rounded arms. In the middle of its body sits a large round golden compass with a pale lavender face and a red and dark red needle pointing up, the compass glows softly. It looks grumpy but friendly, like a playful villain in a children's game, not scary. Replace the dark oval shadow and the background with a plain flat light grey background, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

Text zu Bild:

```text
A big, chunky stone golem boss, full body, front view, centred in a square picture with some space around it. Made of rounded blue-grey rock with a few cracks and small mossy spots, two short stone horns on top of the head, small glowing warm yellow eyes, stubby stone legs and heavy rounded arms. In the middle of its body sits a large round golden compass with a pale lavender face and a red and dark red needle pointing up, the compass glows softly. It looks grumpy but friendly, like a playful villain in a children's game, not scary. Plain flat light grey background, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

## 2. Die Tintenkrake (`boss-2`)

Edit:

```text
Repaint this simple flat boss character as a soft painted illustration. Keep exactly the same pose, proportions, position and size in the picture. A big round purple octopus with a smooth glossy dome head, a darker purple band around the lower head, two large white eyes with dark pupils, a cheeky grin, and six thick wavy tentacles curling down, with small pale suction cups on the inner side. A dark indigo ink drop floats next to the top of its head and a few small ink splashes drip from the tips of two tentacles. One small golden spot shines on its head. It looks mischievous, like a playful villain in a children's game, not scary. Replace the dark oval shadow and the background with a plain flat light grey background, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

Text zu Bild:

```text
A big round purple octopus boss, full body, front view, centred in a square picture with some space around it. A smooth glossy dome head, a darker purple band around the lower head, two large white eyes with dark pupils, a cheeky grin, and six thick wavy tentacles curling down, with small pale suction cups on the inner side. A dark indigo ink drop floats next to the top of its head and a few small ink splashes drip from the tips of two tentacles. One small golden spot shines on its head. It looks mischievous, like a playful villain in a children's game, not scary. Plain flat light grey background, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

## 3. Der Rätseldrache (`boss-3`)

Das Fragezeichen auf dem Bauch ist ein Muster, keine Schrift; kommt es verzerrt heraus, im Edit nur den Bauch neu
malen lassen.

Edit:

```text
Repaint this simple flat boss character as a soft painted illustration. Keep exactly the same pose, proportions, position and size in the picture. A chubby green dragon sitting upright, with a big round head, two small curved golden horns, large yellow eyes with narrow dark slit pupils and a flat, puzzled mouth, two small pointed dark green wings at its sides, and a pale mint green belly with one big dark green question mark shape on it like a birthmark. Small rounded scales on the shoulders. It looks clever and a bit smug, like a playful villain in a children's game, not scary. Replace the dark oval shadow and the background with a plain flat light grey background, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```

Text zu Bild:

```text
A chubby green dragon boss sitting upright, full body, front view, centred in a square picture with some space around it. A big round head, two small curved golden horns, large yellow eyes with narrow dark slit pupils and a flat, puzzled mouth, two small pointed dark green wings at its sides, and a pale mint green belly with one big dark green question mark shape on it like a birthmark. Small rounded scales on the shoulders. It looks clever and a bit smug, like a playful villain in a children's game, not scary. Plain flat light grey background, no shadow on the ground. Cute children’s game art, soft painted digital illustration like a cozy mobile adventure game for 10 to 12 year olds. Rounded, chunky, friendly shapes with a clear silhouette that reads at small sizes. Smooth soft shading with gentle gradients, light from the upper left, a subtle warm rim light. No outlines at all: no black or dark contour lines, no line art, not a flat vector or sticker look; edges are soft and painted, only a slightly darker shade of the fill colour. Bright, warm, saturated but not neon colours. Clean and uncluttered, no text, no letters, no watermark, no frame.
```
