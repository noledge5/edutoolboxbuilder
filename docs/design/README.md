# Handoff: Arbeitsblatt-Baukasten

## Overview
A browser tool for teachers (German Realschule, students aged 11–16) to assemble printable A4 worksheets from modular elements. The user drags elements from a toolbox onto pages that sit on a 12-column grid, edits the content in a properties panel, and prints or exports to PDF. Every page has a fixed header band ("Kopfband") and footer band ("Fußband") so all worksheets look consistent. A worksheet can also be loaded as JSON, so Claude can turn existing PDF worksheets into data that the tool renders.

UI language: German. Keep all labels as given below.

## About the Design Files
The files in this bundle are **design references created in HTML**: prototypes that show the intended look and behaviour. They are not production code to copy. Recreate them in the target codebase's environment. If there is no codebase yet, a good choice is **Vite + React + TypeScript**, with `@dnd-kit` for drag and drop, plain CSS or CSS Modules using the tokens in `tokens/organic-styles.css`, and `localStorage` for persistence (a later version could add a backend).

`Arbeitsblatt-Baukasten.dc.html` is a working prototype. Open it in a browser to try the behaviour. Its logic class, inside the `<script data-dc-script>` block, holds the complete data model, all block types and the whole interaction logic, so use it as the functional spec.

## Fidelity
**High-fidelity.** Colours, typography, radii and spacing are final. Recreate the worksheet pages pixel-accurately, because they are what gets printed. The editor chrome (toolbox, header, properties panel) should match closely but can follow the codebase's own component conventions.

## Two visual layers (important)
1. **Documents (the A4 pages)** use the *Organic* design system: headings in **Caprasimo 400**, body text in **Figtree 400/600/700**, warm cream paper and terracotta/sage accents.
2. **Editor UI (toolbox, top bar, properties panel, dialogs)** uses a clean neutral font: `'Helvetica Neue', Helvetica, Arial, sans-serif`. Organic colours are still used for the UI surfaces, but never Caprasimo in the UI.

## Screens / Views

### 1. Editor (main view)
Full viewport height. CSS grid: `grid-template-rows: auto minmax(0,1fr)`. App background `--color-neutral-200` (#eee7db).

**Top bar** (padding 12px 20px, background `--color-bg` #f5ead8, `--shadow-sm`, flex with gap 14px):
- Topic icon: 38px circle, background `--color-accent` #c67139, icon colour #fff2eb. Icon: thermometer + sun (Lucide `thermometer-sun`), 20px, stroke 2.75.
- Title "Arbeitsblatt-Baukasten": Helvetica Neue 700, 18px, letter-spacing −0.01em, `margin-right:auto`.
- Zoom control: pill (padding 3px, bg `--color-surface` #ebddc5) with "−" and "+" icon buttons (32×32) and a label such as "80%" (13px/700, min-width 48px). Range 40–150%, step 10%. Default 80%.
- Buttons (pill-shaped, Helvetica Neue 600, 13.5px, nowrap, 16px icon plus label): "Daten" (secondary, braces icon), "Vorschau"/"Bearbeiten" toggle (secondary, eye icon; tinted `--color-accent-100` while preview is on), "Drucken / PDF" (primary, printer icon).

**Body**: three columns `clamp(200px,18vw,256px) | minmax(0,1fr) | clamp(260px,22vw,320px)`. In preview mode only the middle column is shown.

**Left: Toolbox** (bg `--color-bg`, padding 20px 16px 32px, right border 1px `--color-divider`, gap 22px, scrolls):
- Header "Toolbox" (16px/700) and helper text "Auf die Seite ziehen oder anklicken." (12.5px, `--color-neutral-700`).
- Three groups. Each has an uppercase label (10.5px/700, letter-spacing 0.1em, `--color-neutral-700`) and a list of items.
- Item: flex row, gap 10px, padding 7px 12px 7px 7px, pill radius, 14px/600, `cursor:grab`; hover background `--color-accent-100`. Left: 32px icon circle in the group colours.
  - **Text & Struktur** (circle bg #eee7db, fg #474238): Überschrift, Textblock, Hinweis-Box, Merksatz, Wortspeicher
  - **Grafik & Abbildung** (bg #f0fae1, fg #3d472b): Abbildung, Fließschema
  - **Aufgaben** (bg #fff2eb, fg #643312): Offene Frage, Ankreuzen, Lückentext, Tabelle, Zuordnen, Zeichenfeld
- Dragging an item onto a page inserts that block type. Clicking an item inserts it after the selected block (or at the end of the selected page, or page 1).

**Middle: Canvas** (scrolls both ways, padding 28px 32px 80px). The pages are stacked vertically and centred, gap 28px, scaled with CSS `zoom`. Above each page is a label "Seite N" (13px/700, `--color-neutral-700`); when content overflows the page, a warning pill appears next to it: "Seite ist voll: Inhalt wird unten abgeschnitten" (bg #ffe1d0, text #402310). Below the last page sits a "Seite hinzufügen" button.

**Right: Properties panel ("Eigenschaften")** (bg `--color-bg`, padding 20px, left border, gap 18px):
- Nothing selected: title "Eigenschaften" and the help texts "Wähle ein Element auf der Seite aus, um Inhalt und Breite zu ändern. Ein Klick auf den Kopf der Seite öffnet Titel, Blatt-Typ und Fußzeile." and "Entf löscht das ausgewählte Element, Esc hebt die Auswahl auf."
- Block selected: a 36px icon circle (#fff2eb / #643312) with the block label, then the fields. The first field is always "Breite im 12er-Raster", a segmented choice: Ganz (12) · ⅔ (8) · ½ (6) · ⅓ (4). Then the per-type fields (see the Block types section), followed by the buttons "Duplizieren" and "Löschen" (the latter in text colour #8c491a).
- Page selected (by clicking the header band): section "KOPFBAND" with Titel, "Zeile über dem Titel", Blatt-Typ (segmented), Sozialform (segmented: allein / zu zweit / Gruppe / Plenum) and Namensfeld (Anzeigen/Ausblenden). Section "FUSSBAND · ALLE SEITEN" with Fußzeile and Kürzel. Button "Seite löschen" (only if there is more than one page).
- Field styling: Organic `.field` label plus a pill `.input` (14px, min-height 36px, 1px border `--color-divider`, focus border `--color-accent`). Textareas have radius 16px and 4 rows. Segmented options are pills (padding 6px 13px, 13px/600); selected = bg #c67139 with text #f5ead8, unselected = transparent with a border in `--color-divider`.

### 2. A4 page (the printed artefact)
- Size **794 × 1123 px** (A4 at 96 dpi), `box-sizing:border-box`, padding **30px 36px 24px**, flex column, gap 16px, bg `--color-bg` #f5ead8, `overflow:hidden`. On screen: radius 8px, `--shadow-md`. In print: no radius, no shadow, one page per sheet (`@page{size:A4;margin:0}`, `break-after:page`).
- Base text: Figtree 14px, line-height 1.55, colour #201e1d.

**Kopfband (header band)**: flex, gap 16px, padding 16px 20px, **radius 28px**, bg from the sheet type.
- 52px circle with the topic icon (26px). **The icon is the same on every page of a topic** (one icon per overarching theme). Circle colours come from the sheet type.
- Kicker line: 11px/700, uppercase, letter-spacing 0.08em, colour from the sheet type. Example: "Klasse 9 · Modellversuch zum Treibhauseffekt".
- Title: h1 in **Caprasimo 400, 28px**, margin 2px 0 0.
- Right side, stacked with gap 6px: a type pill (padding 5px 14px, 11px/700 uppercase, letter-spacing 0.06em) and a working-mode pill (bg `--color-bg`, 12px/600, 14px user/users icon plus the text, e.g. "zu zweit").

**Sheet types** (colours for band / circle bg / pill bg / kicker text / task-number circle):

| key | label | band | circle | pill | kicker | number circle |
|---|---|---|---|---|---|---|
| uebung | Übung | #ebddc5 | #8c491a | #643312 | #643312 | #8c491a |
| versuch | Versuch | #fff2eb | #c67139 | #8c491a | #8c491a | #c67139 |
| sicherung | Sicherung | #f0fae1 | #728157 | #56633f | #3d472b | #728157 |
| lehrkraft | Für die Lehrkraft | #eee7db | #474238 | #474238 | #645c50 | #474238 |

The circle icon and the pill text are light: #fff2eb for the terracotta types, #f0fae1 for sage, #f9f4ed for neutral.

**Namensfeld** (optional): row with "Name:" (700) + a flexible line (2px border-bottom #c0b6a5, height 22px), then "Datum:" + a 130px line. Padding 0 6px.

**Body grid**: `display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); column-gap:16px; row-gap:18px; align-content:start; flex:1; overflow:hidden; padding-top:6px`. Each block sets `grid-column: span N` (N ∈ 12, 8, 6, 4).

**Grid overlay**: in edit mode, 12 column stripes are drawn behind the blocks (absolute, same column template and gap, bg #fff2eb at 75% opacity, radius 6px, `pointer-events:none`). They are **always visible while editing** and **hidden in preview and print**.

**Fußband (footer band)**: flex, gap 12px, padding 8px 8px 8px 18px, pill radius, bg #eee7db, 11px, colour #474238. It holds the footer text (flex:1), the code (700, letter-spacing 0.06em, e.g. "K9 · M1 · S2") and a pill "Seite N" (bg `--color-bg`, 700, padding 3px 12px). The footer text and code are shared across all pages of the document.

## Block types
All block data has the shape `{ id, type, span, props }`. Fields: `text` = input, `area` = textarea, `number` = numeric, `variant` = segmented Salbei / Terrakotta / Neutral. **Tasks** (group Aufgaben) are numbered automatically per page, 1, 2, 3…, in a 30px circle (Caprasimo 15px, colours from the sheet type), followed by the prompt (600, pre-wrap).

| type | label | default span | props (defaults) | rendering |
|---|---|---|---|---|
| heading | Überschrift | 12 | text | h3 Caprasimo 21px |
| text | Textblock | 12 | text | p, pre-wrap, `text-wrap:pretty` |
| hint | Hinweis-Box | 12 | title, text, variant (accent-2) | radius 22px, padding 14px 18px, tinted bg; 30px circle with an info icon; bold title in the variant's dark colour; 13.5px body text |
| merksatz | Merksatz | 12 | text (`___` = blank), variant | solid bg (sage #728157 / terracotta #8c491a / neutral #474238) with light text; radius 28px; padding 18px 22px; 40px inverted circle with a light-bulb icon; label "MERKSATZ" 11px uppercase; sentence 18px/700; each blank is a 150px underline |
| wordbank | Wortspeicher | 12 | words (one per line) | label "WORTSPEICHER" 11px uppercase, then pills (padding 5px 14px, bg #ebddc5, 600) |
| image | Abbildung | 6 | caption, height (200) | drop zone for an image (radius 18px, bg #ebddc5) with the caption below (11.5px, #645c50). Needs a real image upload or drop. |
| flow | Fließschema | 12 | steps: one line per step, `Titel \| Zusatz` | box with a 2px #dcd3c4 border, radius 24px, padding 18px; steps are equal-width boxes (radius 18px, centred) with a → between them. Colours cycle through #ffe1d0, #e1eecc, #ffc6a5, #dcd3c4. |
| open | Offene Frage | 12 | prompt, lines (3) | N writing lines, each 28px high with a 1.5px #c0b6a5 bottom border |
| mc | Ankreuzen | 12 | prompt, options (one per line) | pills (bg #ebddc5, padding 6px 16px 6px 9px) with an empty 17px circle (2px border in the number colour) |
| gap | Lückentext | 12 | prompt, text (`___` = blank) | line-height 2.2; each blank is a 90px underline (2px #a19786) |
| table | Tabelle | 12 | prompt, cols, rows (one per line) | radius 18px, 2px #dcd3c4 border; header row bg #ebddc5 12px/700; first column shows the row labels (600), the other cells are empty for writing; row min-height 34px; columns `1.2fr repeat(n,1fr)` |
| match | Zuordnen | 12 | prompt, left, right (one per line) | two columns of pills with a 64px gap; a 12px dot on the inner side of each pill for drawing lines |
| draw | Zeichenfeld | 12 | prompt, height (160) | empty box, 2px dashed #c0b6a5, radius 20px |

## Interactions & Behavior
- **Selecting**: click a block to select it (2px solid #c67139 outline, offset 5px). Hovering shows a dashed #c0b6a5 outline. Clicking the header band selects the page; clicking empty canvas clears the selection.
- **Floating toolbar** on the selected block (above its top-right corner, dark pill bg #201e1d): Nach oben, Nach unten, Duplizieren, Löschen (the last with a #ffc6a5 icon).
- **Drag and drop**: from the toolbox, insert a new block; dragging an existing block moves it, also across pages. Where a block will land is shown as a 4px #c67139 bar: vertical bars at the left/right of partial-width blocks (the cursor's x position decides before or after), horizontal bars above/below full-width blocks (y position). Dropping on empty page space appends at the end, and an empty page shows a dashed placeholder "Element aus der Toolbox hierher ziehen".
- **Keyboard**: Entf/Backspace deletes the selected block (not while typing in a field), Esc clears the selection.
- **Overflow detection**: after every change, compare the body's `scrollHeight` to its `clientHeight` and show the "Seite ist voll" warning when the content is too long.
- **Vorschau**: hides the toolbox, the properties panel, the grid, the outlines and the toolbar.
- **Drucken / PDF**: switches to preview at 100% zoom, calls `window.print()`, then restores the previous zoom. Elements marked `data-noprint` are hidden in print.
- **Daten (JSON)**: a dialog "Arbeitsblatt als Daten" with a monospace textarea showing the whole document. "Übernehmen" validates it: the data must contain `pages[]`, unknown block types are dropped, and missing props are filled from the defaults. On error, show "Die Daten konnten nicht gelesen werden: …" in #8c491a.
- **Persistence**: the document is saved to localStorage (key `arbeitsblatt-baukasten-v2`) on every change.

## State Management
- `doc`: `{ footer, code, pages: [{ title, kicker, type, form, nameField, blocks: [{ id, type, span, props }] }] }`, which is also the JSON import/export format.
- `sel`: `null | { kind: 'page', p } | { kind: 'block', p, i }`
- `drop` (the current drop target `{ p, i, pos: before|after|end }`), `drag` (a ref: `{kind:'new', type}` or `{kind:'move', p, i}`), `hover`, `zoom`, `preview`, `over[]` (overflow per page), `jsonOpen`, `jsonText`, `jsonErr`.

### Suggested next steps (not built yet)
- Save and open several worksheets (a library), and templates per sheet type.
- A topic icon picker per module (the prompt was to use one icon per overarching topic).
- Generating the matching projector slides from the same `doc` (see `referenz/Präsentation Treibhauseffekt.dc.html` for the slide style).
- Server-side PDF export (e.g. Playwright) for pixel-exact output.
- An import path that turns an existing PDF into `doc` JSON with the help of Claude.

## Design Tokens
See `tokens/organic-styles.css` (source of truth).
- Paper/bg #f5ead8 · surface #ebddc5 · text #201e1d · accent (terracotta) #c67139 · accent-2 (sage) #7a8a5e · divider = #201e1d at 16%
- Neutral 100–900: #f9f4ed #eee7db #dcd3c4 #c0b6a5 #a19786 #82796a #645c50 #474238 #2e2b25
- Accent 100–900: #fff2eb #ffe1d0 #ffc6a5 #f6a06b #d67f48 #b2622d #8c491a #643312 #402310
- Accent-2 100–900: #f0fae1 #e1eecc #ccdbb2 #aebf92 #8fa073 #728157 #56633f #3d472b #272e1b
- Fonts: Caprasimo 400 (document headings only), Figtree 400/600/700 (document body), Helvetica Neue (editor UI). Google Fonts import: see the top of `organic-styles.css`.
- Radii: 8 / 16 / 28px; pills 999px; page elements use 14–28px.
- Shadows: sm `0 1px 2px rgba(46,43,37,.14)`, md `0 3px 10px rgba(46,43,37,.16)`, lg `0 12px 32px rgba(46,43,37,.22)`.
- Spacing scale: 4.4 / 8.8 / 13.2 / 17.6 / 26.4 / 35.2px.
- Print minimums: body text 14px on the page and never below 11px; hit targets in the UI at least 30px.

## Assets
- Icons: **Lucide** (lucide.dev), stroke width 2.75, round caps and joins. Used: thermometer-sun (topic), heading, align-left, info, lightbulb, tag, image, workflow, pencil-line, list-checks, text-cursor-input, table, arrow-left-right, brush, trash-2, copy, chevron-up/down, plus, minus, printer, braces, eye, user, users, file. Use the `lucide-react` package.
- Images: none are included; teachers add their own through the image block.

## Files
- `Arbeitsblatt-Baukasten.dc.html`: working prototype of the builder (the functional spec lives in its logic class).
- `referenz/Arbeitsblatt Treibhauseffekt.dc.html`: four finished sample pages (teacher lesson plan, board summary, experiment sheet, flow-diagram sheet), the visual reference for page styling.
- `referenz/Präsentation Treibhauseffekt.dc.html`: matching 16:9 projector slides in the same style.
- `tokens/organic-styles.css`: design tokens and base classes.

Note: the `.dc.html` files need the prototype runtime to open, so read them as source. The spec above is complete without them.
