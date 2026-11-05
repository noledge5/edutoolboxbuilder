# Handoff – 05.11.2026

## Ziel
Runde 10 (siehe `docs/roadmap.md`): Design-Runde fürs Arbeitsblatt, schlichter, und ein Schalter „Planung“ im Editor.

## Stand
- Runde 9 ist fertig und gemerged (PR #17, #18); Server für „Präsi in Canva“ läuft.
- Die Lehrkraft hat die aktuelle Anleitung (`docs/claude/anleitung-fuer-claude.md`) und eine Kurzanleitung bekommen.
- Runde 10 ist entschieden, aber noch nichts gebaut.

## Nächste Schritte
1. 2–3 Entwürfe desselben Blatts (z. B. Geographie K5 „Luftbild und Karte“: Tabelle, Abbildungen M1–M4, Auswahl- und
   Schreibaufgaben) als Screenshot/PDF in den Scratchpad; Unterschiede: Rahmen/Flächen, Aufgabennummern, Material-Marken.
   Kein Rastermuster, weniger Farbflächen. Lehrkraft wählt.
2. Gewählten Entwurf umsetzen (`src/sheet/`, `sheet.css`, Spec in `docs/design/` nachziehen), Druck und iPad prüfen.
3. Schalter „Planung“ an/aus im Editor (Sterne, Kompetenz, Lösungen); aus als Normalfall.
4. Überlappung der Lösungszeile im Editor beheben.
5. Weiter offen: erster echter Canva-Auftrag auswerten (`src/canva/prompt.ts`), Editor-Bedienung, Runde 7.

## Wichtig zu wissen
- `src/sheet/` muss pixelgenau zur Spec passen: Designänderung heißt Spec mitändern, nach Absprache.
- Fachdesigns (`src/model/look.ts`) ändern keine Geometrie (keine `border`, nur Innenschatten).
- Edge-Function `supabase/functions/praesi-bild` nur nach Rückfrage neu einspielen.
