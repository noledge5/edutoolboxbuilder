# Design: Arbeitsblatt-Baukasten

The locked system of the app around the worksheets. Every Hallmark run reads this first and screens share it. Change it on purpose; the file is the rule. The worksheets and slides have their own system (`src/styles/tokens.css`, Organic) until step 5 of the redesign.

## System
- Genre: modern-minimal
- Shape of the first page: app screen (sidebar + class board)
- Theme: Dose (dealt 1/3, seed worksheet-lesson-builder-teachers-d8c2·eb728414·2026-11-26·r0)
- Axes: light/grotesk-sans/chromatic-green · posture: committed · ground: white

## Tokens
`src/ui/tokens.css` is the source of truth. The roles:
```css
:root {
  --ui-paper: oklch(97.6% 0.011 88);  --ui-paper-2: oklch(96.5% 0.02 160);  --ui-paper-3: oklch(93% 0.036 160);  --ui-desk: oklch(93.4% 0.012 96);
  --ui-surface: oklch(99.5% 0.004 90);  --ui-ink: oklch(21% 0.025 170);  --ui-ink-2: oklch(31% 0.02 170);  --ui-muted: oklch(49% 0.024 165);  --ui-rule: oklch(86.5% 0.022 140);
  --ui-accent: oklch(50% 0.13 160);  --ui-accent-deep: oklch(42% 0.11 162);  --ui-accent-soft: oklch(88% 0.08 160);  --ui-on-accent: oklch(99% 0.006 160);  --ui-focus: oklch(45% 0.14 160);  --ui-danger: oklch(45% 0.13 30);
  --ui-font-display: "Schibsted Grotesk";  --ui-font: "Instrument Sans";  --ui-font-mono: "DM Mono";
  --ui-radius-control: 10px;  --ui-radius-card: 14px;  --ui-shadow-lift: (see tokens.css);
}
```
On `<body>` the shared Organic names (`--color-text`, `--color-neutral-*`, `--color-accent-*`) are re-pointed to these; `.ws-page` and `.sl-slide` point them back, so a sheet looks the same in the app and in print.

## Subjects
- A subject is identity, never a signal: `subjectTint()` gives `--subject-tint` (band, tray), `--subject-tint-2` and `--subject-mark` from the subject's ramp. The green does every signal.

## Controls
- Primary: green plastic (accent to accent-deep), 10px, 36px, a 2px rim below; sinks 2px on press.
- Secondary: clear plastic (surface, 1px rule rim, 2px rim below), same radius and height; quiet (no rim) in a top bar.
- Choices: keys, mint (`--ui-accent-soft`) when chosen. Fields: surface, 1px edge at 3:1, green focus ring.
- Codes and numbers (K9 · M1 · S2, counts, weeks): DM Mono. Titles: Schibsted Grotesk 700. Labels: Instrument Sans 500, sentence case, never tracked capitals.

## Screens
- Every library screen opens with the band: the subject's tint, a path (Fach › Klasse › here), the title in Schibsted Grotesk, figures in DM Mono, then the actions with one primary (the thing the screen creates: Neues Modul, Neue Stunde; on the year plan Drucken). No top bar on these screens; the sidebar is the navigation.
- Module page: lessons first, one row each with its real sheets fanned in a tray of the subject's tint (a planned lesson: a blank dashed sheet and the grey stamp "geplant"); title, Lehrwerk, role and plan are quiet fields that show their edge on hover. The module's data sits in a side panel ("Moduldaten"), open at once for a new module. Tabs are underlined in green.
- Year plan: the year as a strip of weeks (months on top, holidays hatched, a green line at this week), each module a bar in the subject's tint (dashed while only planned); below it the modules and the weeks as tables.
- Editor: a paper bar (back, topic key, path over the lesson's title, undo, the view as two keys Bearbeiten and Vorschau, then Suchen, Datei, Folien, Digital, KI and the one primary Drucken / PDF). The toolbox is the kit: each block a moulded key, two to a row, a neutral icon on a small key (no group colours); the subject's favourites on a tray of its tint; the Ablage a dashed tray. The properties panel keeps choices as a grid of keys and the shortcuts as a list with keys. Zoom is a dock at the bottom right of the desk. Selection on the page is the green.
- Worksheets (since 27.11.2026): the header as a label in the subject's tint, task numbers as keys, the lesson code in DM Mono, and under each number the task's action symbol and, where set, its social form (src/sheet/blatt.css, src/sheet/symbols.ts). The principles behind them, with sources: docs/design/arbeitsblatt-prinzipien.md.
- Ranges in the chrome are written with "bis" (KW 38 bis 42), never with a dash. The A4 prints keep their own wording until step 5.

## Motion
- Character: calm; press and hover only, 120 to 220 ms, one easing; under reduced motion everything ends at once.

## Exports
`src/ui/tokens.css` and `src/ui/controls.css` in this project.
