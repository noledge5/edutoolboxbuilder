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
  --ui-accent: oklch(50% 0.13 160);  --ui-accent-deep: oklch(42% 0.11 162);  --ui-accent-soft: oklch(88% 0.08 160);  --ui-on-accent: oklch(99% 0.006 160);  --ui-focus: oklch(45% 0.14 160);
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

## Motion
- Character: calm; press and hover only, 120 to 220 ms, one easing; under reduced motion everything ends at once.

## Exports
`src/ui/tokens.css` and `src/ui/controls.css` in this project.
