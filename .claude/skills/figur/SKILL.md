---
name: figur
description: Draw or change a Lernquest figure, item (hat, weapon, hero part) or boss as vector code, pose and animate it, and check it in the figure workshop. Use for any drawing in src/lernquest/figuren/ - new hero parts, bosses, poses, moves - and before publishing the workshop artifact.
---

# Figuren zeichnen und bewegen

Everything drawn in Lernquest (fox, hero, parts, bosses) is vector code in `src/lernquest/figuren/`, built on one rig.
Read `typen.ts` (the model, 80 lines) first; it explains part, pose, move and item.

## The model in one paragraph
A figure is a tree of **parts** (`Teil`), each with a pivot (`drehpunkt`) and a drawing in figure coordinates of the
rest pose. A **pose** lists angles per part (clockwise degrees, children add up), a face name, parts drawn in front
(`vorne`) and extras. A **move** (`animationen.ts`) lists keyframes per part or `ganz`; it runs as SMIL on top of the
pose and must start and end at rest. An **item** is drawn around (0, 0) and sits on an anchor (`hut`, `hand-rechts`,
`hand-links`); it follows that part in every pose. New figures go into `index.ts` (`FIGUREN`), new items into
`items.tsx` (`ITEMS`): the workshop and the tests pick them up.

## Style rules (the look of the teacher's mockup, docs/design/lernquest/mockup-stufe-e.png)
- Colours only from `stil.ts` (`P.*`); a test fails on any other hex. Need a new colour: add base, `hell` and `tief`.
- Outline on every shape: `{...UMRISS}` (3 units, round), details `{...UMRISS_FEIN}`. Limbs: the two-stroke trick
  (`Glied` in `fuchs.tsx`): dark 19 under colour 13, round caps; cover the joint seam with a dot of the colour.
- Light from top left: one light stroke or spot (`hell`) top left, one shadow shape (`tief`, about 60 % opacity)
  bottom right. No gradients, no blur, no thin lines under 2 units (they vanish at 48 px).
- Chibi proportions for characters: head about half the height, big eyes with two white highlights, short limbs.
- Faces carry the emotion; a pose changes arms and face, never redraws the body.
- Rarity shows on the item itself too: 1–2 plain materials (wood, leather), 3 metal or glass, 4 colour plus a star or
  gem, 5 gold with gems. The icon frame takes `SELTEN_FARBE`.
- Items: hats sit with the brim on the anchor and stay within about ±45 wide; held things put the grip on (0, 0).
  Set `rahmen` (x, y, w, h) tight around the drawing; the icon is cut from it.
- Readable at 48 px: check the size row in the workshop.

## Steps
1. Draw or change the code. For a new pose: compute angles from the rest pose (an arm hangs down; rotate(θ) turns the
   down vector to (−sin θ, cos θ)). Turn on „Drehpunkte und Anker zeigen“ in the workshop to see pivots and anchors.
2. `npm run spieltest` and open `http://localhost:4174/lernquest/werkstatt.html#<figur-id>` to play with it, or for
   a picture: `npm run werkstatt && node scripts/werkstatt-fotos.mjs <scratchpad>/fotos` and look at the PNGs
   (`bogen.png` = everything). Look at every pose and the 48 px size.
3. `npx vitest run src/lernquest/figuren` (parts, anchors, moves, colours), then `npm run typecheck`.
4. For the teacher: `npm run werkstatt`, publish `dist-werkstatt/figuren-werkstatt.html` with the Artifact tool to the
   same URL as before (link in docs/design/lernquest/README.md, „Figuren-Werkstatt“).

## Pitfalls
- A move's track names a part id that the figure lacks → the test fails; list moves per figure in `animationen`.
- `vorne` works only for top-level parts (an arm, not a forearm).
- Raised arms behind the big head disappear: put the arm in `vorne` or keep the paw outside the head outline.
- „Bewegung reduzieren“ turns all moves off; every pose must read on its own.
