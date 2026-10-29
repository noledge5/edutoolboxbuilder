# Arbeitsblatt-Baukasten

Browser tool for a German Realschule teacher to build printable A4 worksheets, slides and year plans from blocks.
Vite + React + TypeScript, no backend of its own (Supabase only for sync and for handing out tasks), deployed to GitHub Pages.

## Read first
- `docs/design/README.md`: the design spec. The prototype `docs/design/Arbeitsblatt-Baukasten.dc.html` is the functional spec.
- `docs/roadmap.md`: decisions made with the user, their reasons and the phase plan. Stay within the current phase unless
  asked; new decisions go there (this repo keeps no `docs/adr/`).

## Rules
- UI text is German and follows the labels in the design spec exactly. Code, identifiers and comments are English.
- `src/sheet/` is the printed page (Caprasimo headings, Figtree body) and must stay pixel-accurate to the spec; the editor
  chrome uses the Helvetica Neue UI font, never Caprasimo. Colours only as CSS variables from `src/styles/tokens.css`.
- Subject designs (`src/model/look.ts`) must not change geometry: no `border`, only inset shadows.
- `Doc` is also the import/export format: older data must keep loading (`normalizeDoc`, `src/library/read.ts`).
  Document changes go through the pure functions in `src/model/ops.ts`, so undo/redo keeps working.
- Every change to a module or lesson sets `updatedAt` (sync: newest wins per entry, deletions travel as tombstones).
- A new block type touches `BLOCK_TYPES`, `src/sheet/BlockContent.tsx` (or `LanguageBlocks.tsx`), `sheet.css`,
  `src/icons.tsx`, `BLOCK_USE` and `BLOCK_WORDS`; a material block also `MAT_FIELD` (`src/model/coherence.ts` follows
  the numbers); a task block also `taskSlots`, `stripSolutions`, the student `Body` (`src/student/Tasks.tsx`) and
  `taskBody` (`src/slides/fromDoc.ts`). After changing blocks, fields or icons run `npm run anleitung` (a test fails
  otherwise).
- Topic icons are a curated list in `src/topicIcons.ts`; never import all of Lucide. Fixed sheet texts go through
  `SHEET_TEXT` (`src/sheet/lang.ts`), quotation marks through `typo()`; teacher pages stay German.
- Everything must work with touch on an iPad (long-press to drag) and in print (one A4 page per sheet).
- Never simplify away: repairs for older data, print values in `sheet.css`, touch handling, the encryption in
  `src/sync/` and `src/share/`, the trash and earlier versions.
- Privacy: keys and tokens (AI key, GitHub token, pairing code) stay on the device (`geraet:*`), never in backups, sync
  files, logs or commits. Student names and answers never go to the AI; a class profile holds no names.
- Wikimedia thumbnails exist only in its standard widths (330, 1280 …).

## Commands and checks
- `npm run dev`, `npm run typecheck`, `npm test` (Vitest), `npm run build`; the CI (`.github/workflows/ci.yml`) runs the same.
- Visible changes: `npm run build`, `npx vite preview --port 4173 --strictPort`, Playwright (Chromium in `/opt/pw-browsers`
  in the cloud); print via `page.pdf({ preferCSSPageSize: true, printBackground: true })`, and the iPad width.
  Screenshots go to the scratchpad, never into the repo. Supabase calls in browser checks go through Node `fetch` in
  `page.route`; never disable TLS verification.

## Branch and deploy
- A push to `main` publishes the app (`.github/workflows/deploy.yml`), so `main` only when the user asks.
- The `Co-Authored-By` trailer names the model that wrote the commit; no other commit text names a model.
