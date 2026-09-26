# Arbeitsblatt-Baukasten

Browser tool for a German Realschule teacher to build printable A4 worksheets from blocks. Vite + React + TypeScript, no backend, deployed to GitHub Pages.

## Read first
- `docs/design/README.md`: the design spec (layout, colours, every block type, interactions). The prototype `docs/design/Arbeitsblatt-Baukasten.dc.html` (its `<script data-dc-script>` logic class) is the functional spec.
- `docs/roadmap.md`: decisions made with the user and the phase plan. Stay within the current phase unless asked.

## Structure
- `src/App.tsx` loads the library and routes by URL hash (`src/library/router.ts`): overview `#/?fach=…&klasse=…`, module `#/modul/<id>`, lesson editor `#/stunde/<id>`.
- Library model (`src/library/`): subjects and grades hold modules; a module holds lessons (each one worksheet `Doc`) and a competence grid (G/M/E). A lesson's icon and code (`K9 · M1 · S2`) always come from its module (`docForLesson`).
- Storage (`src/storage/library.ts`): IndexedDB entries `modul:<id>`, `stunde:<id>`, `lib:einstellungen`, `lib:geloescht` (tombstones), `lib:abgleich`, images `img:<id>`. Backup files (`src/storage/backup.ts`) carry images as data URLs.
- Mac ↔ iPad sync (`syncLibrary` in `src/library/model.ts`, `SyncDialog.tsx`): newest `updatedAt` wins per module and lesson, deletions travel as tombstones. Every change to a module or lesson must set `updatedAt`.
- Stundenpaket (`src/library/package.ts`): one module with competences and lessons, the format Claude writes. `readPackage` repairs and returns German notes; `addPackage` makes a new module.
- Instructions for Claude (`src/claude/`): `anleitung.md` plus generated block reference, icon list and example. After changing blocks, fields or icons run `npm run anleitung` to update `docs/claude/anleitung-fuer-claude.md` (a test fails otherwise).
- Sheet modes (`src/sheet/sheetMode.ts`): answers hidden (student sheet), ghost (editing) or shown (solution sheet); `bw` for the black-and-white copy master. Teacher pages (`type: 'lehrkraft'`) have no page number and print only with the solution sheet.
- PWA: `public/manifest.webmanifest`, `public/sw.js` (registered in production only).
- Readers for stored and imported library data: `src/library/read.ts` (defaults for fields added later). Year plan maths: `src/library/yearplan.ts`. Vocabulary, points, grade scale, tips: `src/model/language.ts`.

## Rules
- UI text is German and follows the labels in the design spec exactly. Code, identifiers and comments are English.
- Two visual layers: `src/sheet/` is the printed page (Caprasimo headings, Figtree body) and must stay pixel-accurate to the spec. The editor chrome (`src/editor/`, `src/styles/app.css`) uses the Helvetica Neue UI font, never Caprasimo.
- Design tokens live in `src/styles/tokens.css`, copied from `docs/design/tokens/organic-styles.css`. Use the CSS variables, not raw hex values.
- The document (`Doc` in `src/model/types.ts`) is also the JSON import/export format. Any change to it must keep `normalizeDoc` in `src/model/normalize.ts` accepting older data.
- Document changes go through the pure functions in `src/model/ops.ts` (immer), so undo/redo keeps working.
- Topic icons for the header band are a curated list in `src/topicIcons.ts` (German labels and search words); add new ones there, not by importing all of Lucide.
- New block type: add it to `BLOCK_TYPES` (`src/model/blockTypes.ts`), render it in `src/sheet/BlockContent.tsx` (language, test and whole-sheet blocks in `src/sheet/LanguageBlocks.tsx`, listed in `LANGUAGE_BLOCKS`) with styles in `src/sheet/sheet.css`, give it an icon in `src/icons.tsx` and a line in `BLOCK_USE` (`src/claude/instructions.ts`), then run `npm run anleitung`. Tasks get the common task fields through `taskFields()`.
- Sheet language: the worksheet's `lang` comes from the module. Fixed texts on the sheet go through `SHEET_TEXT` (`src/sheet/lang.ts`), quotation marks through `typo()`. Teacher pages stay German.
- Colours beyond the design handoff: the ramps `--color-accent-3` … `--color-accent-7` in `tokens.css` (sheet types, box variants, toolbox groups).
- Everything must work with touch on an iPad (dnd-kit TouchSensor, long-press to drag) and in print (`src/styles/print.css`: one A4 page per sheet).

## Commands
- `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`
- Visual check: build, run `npx vite preview`, and drive it with Playwright (Chromium at `/opt/pw-browsers` in the cloud environment). Check print output with `page.pdf({ preferCSSPageSize: true, printBackground: true })`.
