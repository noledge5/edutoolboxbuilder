---
name: grafik
description: Choose and run the right asset pipeline for Lernquest graphics - flat 2D vector (figures, items, icons, bosses) or 2.5D isometric vector (village, houses, add-ons, map, landscapes), both under the same style rules. Use when drawing or replacing houses, buildings, village scenery, add-ons, map tiles or any asset that must look consistent in a set, and when the teacher asks for "mittelalterlicher", "passt nicht zusammen" or isometric graphics. No 3D renders (ADR 0001), not Figma (the teacher said no, 18.11.2026).
---

# Grafik: flach und isometrisch

Read `docs/design/prinzipien.md` first: it holds the rules every Lernquest graphic follows (three goals, form rules,
checklist). Decision and reasons: `docs/adr/0001-flache-figuren-iso-umgebung.md`.

Two ways, one world. Pick by what it is, never mix within a set (all houses + their add-ons the same way): add-ons that
do not match the house were the teacher's complaint on 18.11.2026 (haus-v2).

| Weg | Wann | Ergebnis |
|---|---|---|
| **Flach (2D Vektor)** | Figuren, Held, Gegenstände, Icons, Bosse, Bilder in Fragen | Code in `src/lernquest/figuren/` – Skill `figur` |
| **Isometrisch (2.5D Vektor)** | Dorfkarte, Häuser, Anbauten, Gemeinschaftsgebäude, Wahrzeichen der Landkarte | React in `src/lernquest/figuren/iso.tsx` (Bausatz: `box`, `steine`, `tiefe`, `band`, `schlag`, `fachL/R`, `satteldach`, `zeltdach`, `fenster`, `tuer`, `zaunX`; rund: `walze`, `ring`, `rundTiefe`, `kegel`, `kuppel`, `rundSchlag`, `bogenTor`), Gebäude und `DorfKarte` in `dorf.tsx`, Wahrzeichen in `gelaende.tsx`/`welten.tsx`; Vorlage `docs/design/lernquest/stilprobe/haus-v3.mjs` |

No 3D renders, no Figma, no paid AI generators without asking the teacher (credits). Hugging Face image spaces are
blocked in sessions.

## Shared rules (both ways)
- Colours only from `stil.ts` (`P.*`), at most four base colours per motif (skin and hair not counted).
- Light from the top left. Per face at most three tones: base, `hell` (light edge or spot top left), `tief` (shadow
  shape bottom right). Hard edges: light and shadow are shapes of their own.
- **No gradients, no blur, no gloss.** Village, map and app landscape are flat since 19.11.2026 (`dorf.test.tsx`,
  `welten.test.tsx` check it). Small map pieces (trees, bushes, stones) stay flat from the front like game pieces;
  trees, fir, palm and cactus come from `figuren/pflanzen.tsx`, shared with the hero backgrounds.
- As few shapes as possible; the silhouette must read at 48 px.
- No outline (decided 19.11.2026, everything switched, `UMRISS` deleted): shapes part by tone and hard shadows.

## Isometric – rules
- One projection for everything: 2:1 iso (x right-down, y left-down, z up).
- Depth by flat tones: top face `hell`, left face base, right face `tief`; a flat shadow band under eaves and the jetty
  (`band`); a light edge at the roof ridge as its own shape; cast shadows as one flat shape with fixed opacity toward
  bottom right (`schlag`), clipped to the ground.
- Build add-ons from the **same** helpers and materials as the house (same roof tiles, same timber, same stone).
  An add-on is drawn on the house's grid and shares its wall height steps.
- Medieval look: timber framing (Fachwerk) with dark beams, stone plinth, steep roofs with tiles or thatch,
  small windows with crossbars, wooden doors with round arch, chimney of stone. No glass fronts, no flat roofs.
- Figures stay flat when they stand in the iso world (like game pieces on a board); scale them to the house grid.

## Check
- `npx vitest run src/lernquest/figuren`, `npm run typecheck`.
- Map without the workshop: `VORSCHAU=<ordner> VORSCHAU_TEIL=karte npx vitest run src/lernquest/figuren/vorschau`
  (start landscape, every world as a region, every piece at full size and at 48 px). The app shows the map only with
  `UMBAU = false` in `app/LernquestApp.tsx`; flip it locally for a look, never commit it.
- Look at it in the workshop (`npm run spieltest` → `/lernquest/werkstatt.html`), next to the fox, at phone width and
  on the night background; go through the checklist in prinzipien.md.
- Show the teacher with the maturity level named (10 % direction, 50 % structure, 99 % polish).
