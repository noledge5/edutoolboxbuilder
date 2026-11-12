---
name: figur
description: Draw or change a Lernquest figure, item (hat, weapon, hero part) or boss as vector code, pose and animate it, and check it in the figure workshop. Use for any drawing in src/lernquest/figuren/ - new hero parts, bosses, poses, moves - and before publishing the workshop artifact.
---

# Figuren zeichnen und bewegen

Everything drawn in Lernquest (fox, hero, parts, bosses) is vector code in `src/lernquest/figuren/`, built on one rig.
Read `typen.ts` (the model, 80 lines) first; it explains part, pose, move and item.

## The model in one paragraph
A figure is a tree of **parts** (`Teil`), each with a pivot (`drehpunkt`) and a drawing in figure coordinates of the
rest pose. A **pose** lists angles per part (clockwise degrees, children add up), a face, parts drawn in front
(`vorne`) and extras. A **move** (`animationen.ts`) lists keyframes per part or `ganz`: `drehen`, `schieben`,
`strecken` (squash), optional `zeiten`, `kurve` (`weich`, `linear`, `feder`) and `gesichter`. The engine
`bewegung.ts` (pure, tested) turns pose + move + time into a `Stellung`; `Figur.tsx` draws it with a
requestAnimationFrame clock (no SMIL: it did not run in every viewer). Figures blink by themselves (`augenZu`).
An **item** is drawn around (0, 0) on an anchor (`hut`, `hand-rechts`, `hand-links`) and follows that part;
`bewegt: true` items get the time (flame, sparkle; `Funkeln` in `items.tsx`). New figures go into `index.ts`
(`FIGUREN`), new items into `items.tsx` (`ITEMS`) or, for the hero's parts, `items-kopf.tsx`, `items-werkzeug.tsx`,
`begleiter.tsx` (anchor `begleiter`); backgrounds into `hintergruende.tsx`; skin, hair, mouth, eyes and clothes are drawn
inside `held.tsx`. The workshop and the tests pick them up (`held.test.tsx`: every part of `teile.ts` has a drawing).
Quick look without the workshop: `VORSCHAU=<ordner> VORSCHAU_TEIL=held|kopf|werkzeug|begleiter|hintergrund npx vitest run src/lernquest/figuren/vorschau`.

## Style rules (the look of the teacher's mockup, docs/design/lernquest/mockup-stufe-e.png)
- Colours only from `stil.ts` (`P.*`); a test fails on any other hex. Need a new colour: add base, `hell` and `tief`.
- Outline on every shape: `{...UMRISS}` (3 units, round), details `{...UMRISS_FEIN}`. Limbs: the two-stroke trick
  (`Glied` in `fuchs.tsx`): dark 19 under colour 13, round caps; cover the joint seam with a dot of the colour.
- Light from top left: one light stroke or spot (`hell`) top left, one shadow shape (`tief`, about 60 % opacity)
  bottom right. No gradients, no blur, no thin lines under 2 units (they vanish at 48 px).
- Chibi proportions for characters: head about half the height, flat dark eyes without white shine (teacher, 12.11.2026), short limbs.
- Faces carry the emotion; a pose changes arms and face, never redraws the body.
- Rarity shows on the item itself too: 1–2 plain materials (wood, leather), 3 metal or glass, 4 colour plus a star or
  gem, 5 gold with gems. The icon frame takes `SELTEN_FARBE`.
- Items: hats sit with the brim on the anchor and stay within about ±45 wide; held things put the grip on (0, 0).
  Set `rahmen` (x, y, w, h) tight around the drawing; the icon is cut from it.
- Readable at 48 px: check the size row in the workshop.

## Steps
1. **Read the teacher's review first**: `ArtifactData` `list` on the workshop artifact (URL in
   docs/design/lernquest/README.md), collection `pruefung`: one doc per figure / item (`figur--fuchs`,
   `item--krone`) with `status` (`passt`, `aendern`, `offen`) and `notiz`. Work the `aendern` ones.
   Then the teacher's **wishes** for own parts and hair (teacher page „Teile und Wünsche“, Supabase project
   „baukasten“, read-only): `select id, slot, name, seltenheit, wunsch from lq_teil where wunsch is not null`. Draw each
   one not yet in `EIGENE_ZEICHNUNGEN` (figuren/held.tsx) under its id (hair: the id without `frisur-`), add it there, and
   tell the teacher to set where it comes from (it stays out of the game until she does).
2. Draw or change the code. For a pose or a move, use the workshop instead of guessing numbers:
   `npm run spieltest` → `http://localhost:4174/lernquest/werkstatt.html#<figur-id>`. Tab „Pose“: sliders per part,
   face, extras, then „Pose als Code“. Tab „Bewegung“: edit the JSON live, scrub the time line, then „Bewegung als
   Code“. Tab „Übergang“ blends two poses. „Drehpunkte“ / „Anker“ show pivots and anchors; Prüfen lists the colours
   used (a red one is not from the palette). An arm hangs down in rest; rotate(θ) turns it to (−sin θ, cos θ).
3. Look at it: `npm run werkstatt && node scripts/werkstatt-fotos.mjs <scratchpad>/fotos` (bogen, teile, each figure,
   fox at phone width). Check every pose, the 32/48 px sizes and the night background.
4. `npx vitest run src/lernquest/figuren` (parts, faces, anchors, moves at rest, engine, colours), `npm run typecheck`.
5. For the teacher: `npm run werkstatt`, publish `dist-werkstatt/figuren-werkstatt.html` with the Artifact tool to the
   same URL (keeps the `db` capability and her reviews). Tell her what changed and what to check.

## Pitfalls
- Tracks for parts a figure lacks are skipped (one move can serve fox and boss), but a move listed in a figure's
  `animationen` must move at least one of its parts, and its faces must be in the figure's `gesichter` (tests).
- `vorne` works only for top-level parts (an arm, not a forearm).
- Raised arms behind the big head disappear: put the arm in `vorne` or keep the paw outside the head outline.
- „Bewegung reduzieren“ turns moves off in the app (not in the workshop); every pose must read on its own.
- A move that runs a fixed number of times must start and end at rest; an endless one must loop seamlessly (tests).
- Ids inside a drawing (clipPath, gradient) must be unique per drawing: use `useId()` (see `tintenkrake.tsx`).
