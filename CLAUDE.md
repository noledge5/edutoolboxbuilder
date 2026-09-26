# Arbeitsblatt-Baukasten

Browser tool for a German Realschule teacher to build printable A4 worksheets from blocks. Vite + React + TypeScript, no backend, deployed to GitHub Pages.

## Read first
- `docs/design/README.md`: the design spec (layout, colours, every block type, interactions). The prototype `docs/design/Arbeitsblatt-Baukasten.dc.html` (its `<script data-dc-script>` logic class) is the functional spec.
- `docs/roadmap.md`: decisions made with the user and the phase plan. Stay within the current phase unless asked.

## Rules
- UI text is German and follows the labels in the design spec exactly. Code, identifiers and comments are English.
- Two visual layers: `src/sheet/` is the printed page (Caprasimo headings, Figtree body) and must stay pixel-accurate to the spec. The editor chrome (`src/editor/`, `src/styles/app.css`) uses the Helvetica Neue UI font, never Caprasimo.
- Design tokens live in `src/styles/tokens.css`, copied from `docs/design/tokens/organic-styles.css`. Use the CSS variables, not raw hex values.
- The document (`Doc` in `src/model/types.ts`) is also the JSON import/export format. Any change to it must keep `normalizeDoc` in `src/model/normalize.ts` accepting older data.
- Document changes go through the pure functions in `src/model/ops.ts` (immer), so undo/redo keeps working.
- New block type: add it to `BLOCK_TYPES` (`src/model/blockTypes.ts`), render it in `src/sheet/BlockContent.tsx` with styles in `src/sheet/sheet.css`, and give it an icon in `src/icons.tsx`.
- Everything must work with touch on an iPad (dnd-kit TouchSensor, long-press to drag) and in print (`src/styles/print.css`: one A4 page per sheet).

## Commands
- `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`
- Visual check: build, run `npx vite preview`, and drive it with Playwright (Chromium at `/opt/pw-browsers` in the cloud environment). Check print output with `page.pdf({ preferCSSPageSize: true, printBackground: true })`.
