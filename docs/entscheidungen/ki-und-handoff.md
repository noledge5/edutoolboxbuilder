# KI, Handoff-Format und Folien

← [Index](../roadmap.md)

## Entscheidungen (September 2026)

| Thema | Entscheidung |
|---|---|
| KI | Festes Handoff-Format (JSON bzw. ZIP mit Bildern) plus Anleitung/Skill für Claude. Claude erzeugt Dateien, die der Baukasten importiert. Ab Runde 6 zusätzlich KI im Baukasten mit eigenem Schlüssel (Claude direkt oder OpenRouter, wählbar; Schlüssel nur auf dem Gerät, Schülernamen gehen nie an die KI). Ohne Schlüssel bleibt alles wie bisher. |
| Folien | Entstehen per Claude im Handoff-Format. Die App zeigt sie an, erlaubt leichte Textkorrekturen und einen Präsentationsmodus. |
| Handoff-Format | „Stundenpaket“ (`arbeitsblatt-baukasten-paket`, Version 1): ein Modul mit Kompetenzen und Stunden, die Seiten im selben Format wie ein Arbeitsblatt. Der Import repariert, was geht, und zählt auf, was er geändert hat. Die Anleitung für Claude entsteht aus `src/claude/anleitung.md` plus Bausteinliste, Symbolen und Beispiel aus dem Code. |
