# Handoff: Fachdesigns (subject designs for worksheets and slides)

## Overview
Six subject themes for the existing worksheet builder ("Arbeitsblatt-Baukasten"), which already uses the base design "Organisch". There is one theme per subject and age group:

| Subject | Grades 5–6 (`is-age-1`) | Grades 7–10 (`is-age-2`) |
|---|---|---|
| Geographie `is-f-geo` | Entdecker | Atlas |
| Englisch `is-f-eng` | 3 variants: Sprechblase `is-x-bubble` · Sticker `is-x-sticker` · Comic `is-x-comic` | Notizbuch |
| Informatik `is-f-inf` | Bausteine | Terminal |

A theme changes only colours, radii, backgrounds, one or two motifs, and optionally the heading font. Body font (Figtree), line heights, padding, grid and element heights stay exactly as in "Organisch", so existing sheets do not reflow.

## About the design files
The files in `design/` are **design references built in HTML**. They show the intended look and behaviour and are not production code. Recreate them in the builder's existing codebase, following its patterns. `design/fachdesigns.css` is written as a drop-in layer on top of the builder's `sheet.css` and `slides.css` (copies in `design/vendor/`). Where the codebase allows it, port that file directly. Treat the other files (`fd-render.js`, `fd-content.js`, `fd-docs.css`, both HTML pages) as preview scaffolding only.

## Fidelity
**High fidelity.** Colours, radii, motif sizes, font scale factors and fixed line heights are final and were checked against the page geometry. Reproduce them exactly.

## Source of truth
**`design/Fachdesigns-Spezifikation.md`** (German) is the complete spec. It contains:
- all palettes (four 9-step ramps per theme: `--fd-p`, `--fd-s`, `--fd-t`, `--fd-n`), with hex values
- the mapping from Organisch variables to theme variables
- the 9 sheet types (Blatt-Typen) with band, line, circle, pill, kicker and number colours, plus WCAG contrast results
- radius tokens per theme (`--fd-r-*`)
- every motif with position, size, colour and opacity
- B/W copy-master rules (`.is-bw`)
- slide rules
- the three Englisch 5–6 variants
- heading fonts with scale factors
- the new `ws-code` block
- open test items

Read it before implementing. This README covers integration only.

## Integration (must-dos)
1. **Activation classes** go on the page or slide root:
   `<div class="ws-page is-fd is-f-geo is-age-2 is-t-uebung">` and `<div class="sl-slide is-task is-fd …">`.
   For Englisch 5–6, also add `is-x-bubble | is-x-sticker | is-x-comic`. The age class comes from the grade: grades 5–6 → `is-age-1`, grades 7–10 → `is-age-2`. A page without `is-fd` is plain Organisch.
2. **Stop writing sheet-type colours inline** when a theme is active. Set only the class `is-t-<type>`, because inline values override the palette.
3. **Hinweis/Merksatz** boxes use the classes `is-v-p | is-v-s | is-v-n | is-v-t` instead of inline variants. Flow-chart steps use `is-c1…is-c4`.
4. **Heading font**: `is-fh-a` or `is-fh-b` on the page, slide or any ancestor. With no class, headings stay Caprasimo. The font changes only for headings: `.ws-title`, `.ws-h3`, back-page title, task numbers, box titles and slide titles. Each theme loads only its own single font weight from Google Fonts.
5. **Never use `border`** for lines. Use `box-shadow: inset 0 0 0 Npx …`, in both colour and B/W. Motifs are `::before`/`::after` with `position:absolute`. Header-band children need `position:relative`.
6. **PowerPoint export**: add `data-om-raster` to `.sl-deco` and `.sl-bar` so masked or clip-path motifs are exported as images.
7. Slide designs Klar, Heft, Tafel and Kontrast are unchanged and are mutually exclusive with `is-fd`.

## Geometry invariants (acceptance tests)
These were verified in all 6 themes, all 3 Englisch variants and all font options (A, B, Caprasimo), in colour and B/W:
- A4 page 794 × 1123 px, padding 30/36/24
- header band (Kopfband) height **92 px**
- content area **868 px**
- slide titles keep the same number of lines

Use these as automated layout tests. Fixed line heights: `.ws-title` 31.36 px, `.ws-h3` 23.52 px, slide title 150 px. The font factor `--fd-hs` is at most 1.2. The builder's existing "page is full" warning still applies.

## Interactions (preview pages only)
- `Übersicht.html` is a grid of all six themes. Clicking one opens `Fachdesign.html#<key>`; the keys are `geo-1`, `geo-2`, `eng-1`, `eng-2`, `inf-1`, `inf-2`.
- `Fachdesign.html` shows the worksheet, the B/W version, all sheet types and the slides for one theme. Its top bar has a heading-font switcher, which is saved to localStorage under `fd-heads` (values `a`, `b`, `o`). For `eng-1` there is also a variant switcher, saved under `fd-x-eng-1`.
- In the real builder, the theme, Englisch variant and heading-font choice should be saved per document. They are document settings, not global preferences.

## Design tokens
All tokens live as CSS custom properties in `design/fachdesigns.css`, and their hex values are listed in the spec:
- colour ramps: `--fd-{p,s,t,n}-{100…900}`
- surfaces: `--fd-surface`, `--fd-head`, `--fd-word`, `--fd-foot`, `--fd-slide`
- sheet-type colours: `--t-*`
- radii: `--fd-r-*`
- motifs (SVG masks): `--fd-m-*`
- heading font and scale: `--fd-hs`

Text colour is #201e1d and paper is #ffffff, unchanged from Organisch.

## Assets
There are no image files. All motifs (compass rose, contour lines, circuit traces, blocks, halftone, tape, speech-bubble tail) are inline SVG data URIs or CSS shapes defined in `fachdesigns.css`. Fonts come from Google Fonts; the family list is in the `<link>` in either HTML page.

## Files
- `design/Fachdesigns-Spezifikation.md`: the full spec
- `design/fachdesigns.css`: the implementable theme layer
- `design/vendor/sheet.css`, `design/vendor/slides.css`, `design/vendor/organic-styles.css`: the base Organisch styles the layer sits on
- `design/Übersicht.html`, `design/Fachdesign.html`: preview pages (open locally in a browser)
- `design/fd-render.js`, `design/fd-content.js`, `design/fd-docs.css`: preview scaffolding (sample content and renderer), not for production

## Open items (from the spec)
- Colour print test on the school printer, especially p-100/p-200 surfaces.
- Copier test of the B/W version. If the 35 % motif lines disappear, raise them to 50 %.
- iPad check of the white and yellow pens on the tinted slide backgrounds.
- Check that masks survive PowerPoint export.
