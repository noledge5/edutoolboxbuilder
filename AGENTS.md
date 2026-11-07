# Arbeitsblatt-Baukasten

Browser tool for a German Realschule teacher to build printable A4 worksheets, slides and year plans from blocks.
Vite + React + TypeScript, no backend of its own (Supabase only for sync and for handing out tasks), deployed to GitHub Pages.

## Arbeitsweise (gilt für alle Repos von noledge5)
- Deutsch, schlicht, kurz. Fachwörter beim ersten Mal kurz erklären.
- Ich entscheide, was gebaut wird; wie, entscheidest du.
- In GitHub-Repos jede Aufgabe auf einem eigenen Branch, nie direkt auf den Standard-Branch.
  PR nur auf Wunsch, mergen tue ich. In manchen Repos heißt Mergen veröffentlichen (steht in der AGENTS.md).
- Vorher fragen bei allem, was ich sehe oder merke, und bei Daten, Geld, Löschen, Veröffentlichen.
- Mit den Tests des Projekts prüfen, nach dem Push die CI ansehen. Ehrlich sagen, was geprüft ist und was nicht.
- Sicheren Code schreiben; sicherheitskritische Stellen (Anmeldung, Rechte, Schlüssel, Eingaben) gezielt prüfen.
- Pro-Abo: sparsam, für getrennte Themen getrennte Sitzungen.

## Read first
- `docs/design/README.md`: the design spec. The prototype `docs/design/Arbeitsblatt-Baukasten.dc.html` is the functional spec.
- `docs/roadmap.md`: decisions made with the user, their reasons and the phase plan. Stay within the current phase unless
  asked; new decisions go there (this repo keeps no `docs/adr/`).

## Rules
- UI text is German and follows the labels in the design spec exactly. Code, identifiers and comments are English.
- `src/sheet/` is the printed page (Caprasimo headings, Figtree body) and must stay pixel-accurate to the spec; the editor
  chrome uses the Helvetica Neue UI font, never Caprasimo. Colours only as CSS variables from `src/styles/tokens.css`.
- Sheets: one design, per-subject forms in `src/sheet/faecher.css` (classes from `sheetClasses`, `Doc.sheet` from the
  module); the forms differ in heading font and shapes but never in sizes (no `border`, only inset shadows). The old
  subject designs (`look`, `fachdesigns.css`) now only dress the slides; blocks on a sheet never see `doc.look`.
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
- Text on the sheet and in the student view is drawn through `Editable` or `<Marked>` (`richParts`), never as a bare
  string, so `**bold**` and `{{marked}}` work everywhere (only `<option>` gets plain text).
- Everything must work with touch on an iPad (long-press to drag) and in print (one A4 page per sheet).
- Never simplify away: repairs for older data, print values in `sheet.css`, touch handling, the encryption in
  `src/sync/` and `src/share/`, the trash and earlier versions.
- Privacy: keys and tokens (AI key, GitHub token, pairing code) stay on the device (`geraet:*`), never in backups, sync
  files, logs or commits (decided exception: the Lernquest teacher keys travel encrypted in the sync as `g:lernquest`,
  never in backups). Student names and answers never go to the AI; a class profile holds no names.
- Wikimedia thumbnails exist only in its standard widths (330, 1280 …).
- New presentations are made in Canva (`src/canva/`, Runde 9); the own slides are frozen (show, present, edit, no AI).
  Pictures reach Canva only through the edge function `supabase/functions/praesi-bild` (private bucket, signed links,
  deleted after 18 h); the repo holds its source, it is deployed with the Supabase tools, and only after asking the user.
- Lernquest (`docs/lernquest.md`) is the third page (`lernquest/index.html`, `src/lernquest/`, own game look, no
  `src/sheet/`). Reward rules live twice, in `src/lernquest/rules.ts` and in `lq_runde_melden`
  (`supabase/migrations/`): change both (class points also in `lq_boss_ticken`, voucher limits in `lq_anfragen`).
  A new task block that should become an exercise also touches `src/lernquest/paket.ts`. A new exercise kind (`Uebung`)
  touches `UEBUNGS_ARTEN`, `rules.ts` (`istRichtig`, `loesungText`, `richtigeAntwort`), `boss.ts` (`fragenAus`),
  `app/Uebungen.tsx`, and `fragenpool.ts` (`readUebung`; the format list for Claude if it should write it).
  The KI-Fragenpool lives on the lesson (`Lesson.pool`); released ones go into the package after the lesson's own
  exercises, so the server counts rounds from `uebungen` as before.
  The server test `src/lernquest/server.live.test.ts` runs only with `LQ_LIVE=1`.
  To try a Lernquest change end to end: `npm run lq:testlauf` (build, throwaway teacher key, test class and child on the
  real server, one round played in Chromium, server state checked against `rules.ts`, screenshots to the temp folder,
  class deleted). `LQ_URL=…/lernquest/` plays the live site. Never read the `lq_*` tables directly (real names).
  The boss projector (`lernquest/#beamer=<id>`) reads the teacher keys from the Baukasten's IndexedDB (same origin,
  `src/storage/kv.ts`); boss rules live in `rules.ts` (`bossSchaden`, `bossLp`, `bossTrifft`) and in the `lq_boss_*`
  SQL: change both. Try SQL changes first in a throwaway local Postgres (`/usr/lib/postgresql/16`, stub `extensions`
  with pgcrypto and `cron.schedule`) before they go to the server. If the Supabase tool's apply times out waiting
  for a confirmation, ask the user to run the migration file in the dashboard's SQL Editor, then check it through the
  public functions.
  Painted hero pictures (`docs/design/lernquest/bilder.md`): file name = part id in `src/lernquest/app/teile/`, made
  by `npm run lq:bilder`; a new part also needs `BESCHREIBUNG` (`src/lernquest/bilder/vorlagen.ts`) and
  `npm run lq:bilder -- --prompts`. Hair is its own layer over a bald base (`FRISUREN`, `HAARFARBEN`); a new hair
  needs `FRISUR_BESCHREIBUNG` and `HAAR_ZEICHNUNG` (`avatar.tsx`), no server change.
  Open exercises without sign-in (`lernquest/#probe=<id>`, `src/lernquest/probe.ts`, content in `proben/`) never call
  the server; a new set is registered in `PROBEN` and checked by `probe.test.ts`.

## Commands and checks
- `npm run dev`, `npm run typecheck`, `npm test` (Vitest), `npm run build`; the CI (`.github/workflows/ci.yml`) runs the same.
- Visible changes: `npm run build`, `npx vite preview --port 4173 --strictPort`, Playwright (Chromium in `/opt/pw-browsers`
  in the cloud); print via `page.pdf({ preferCSSPageSize: true, printBackground: true })`, and the iPad width.
  Screenshots go to the scratchpad, never into the repo. Supabase calls in browser checks go through Node `fetch` in
  `page.route`; never disable TLS verification.

## Branch and deploy
- A push to `main` publishes the app (`.github/workflows/deploy.yml`), so `main` only when the user asks.
- The `Co-Authored-By` trailer names the model that wrote the commit; no other commit text names a model.
