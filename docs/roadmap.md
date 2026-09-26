# Roadmap und Entscheidungen

## Entscheidungen (September 2026)

| Thema | Entscheidung |
|---|---|
| Nutzer und Speicherung | Nur eine Lehrkraft, lokal im Browser (IndexedDB), kein Login, kein Server. Sicherung und Austausch zwischen Geräten über Export-Dateien. |
| Geräte | Laptop/Desktop und iPad (Touch-Drag-and-Drop, Hochformat mit ausklappbarer Toolbox und Panel). |
| Hosting | GitHub Pages, statisch. Alles läuft im Browser. |
| Bibliothek | Stundenpakete: Klasse › Modul › Stunde. Ein Paket enthält Lehrkraft-Seiten, Schülerblätter und Folien. Kürzel (z. B. „K9 · M1 · S2“) und Themen-Icon kommen aus Klasse/Modul/Stunde. |
| KI | Festes Handoff-Format (JSON bzw. ZIP mit Bildern) plus Anleitung/Skill für Claude. Claude erzeugt Dateien, die der Baukasten importiert. Kein API-Key in der App. |
| Folien | Entstehen per Claude im Handoff-Format. Die App zeigt sie an, erlaubt leichte Textkorrekturen und einen Präsentationsmodus. |
| Papier | Weiß statt Creme (abweichend vom Design-Handoff, Wunsch vom 26.09.2026). Alle Flächen in Papierfarbe nutzen `--paper` in `src/sheet/sheet.css`. |
| Druck | Farbdruck und S/W-Kopiervorlage, Schüler- oder Lösungsfassung. |

## Phasen

### Phase 1 – Editor-Fundament ✅
- Vite, React, TypeScript, Design-Tokens, selbst gehostete Schriften
- A4-Seite pixelgenau nach Design: Kopfband, Namensfeld, 12er-Raster, Fußband, 4 Blatt-Typen
- Alle 13 Blocktypen des Prototyps
- Drag-and-Drop mit Maus und Touch (auch über Seitengrenzen), Klick zum Einfügen, schwebende Werkzeugleiste
- Eigenschaften-Panel für Blöcke und Seiten, Zoom, Vorschau, „Seite ist voll“-Warnung
- Rückgängig/Wiederholen
- JSON-Dialog mit Prüfung
- Speicherung in IndexedDB, Bilder verkleinert gespeichert
- Druck/PDF: eine A4-Seite pro Blatt, weißes Papier
- GitHub Pages Deployment, CI

### Phase 2 – Bibliothek
- Stundenpakete speichern, öffnen, duplizieren; Ordnung Klasse › Modul › Stunde
- Themen-Icon-Auswahl pro Modul, Kürzel automatisch
- Vorlagen je Blatt-Typ
- Export/Import eines Pakets als Datei inklusive Bilder (Sicherung, Austausch iPad ↔ Laptop)
- Installierbar als App auf dem Home-Bildschirm (PWA), offline nutzbar

### Phase 3 – Lehrkraft-Blöcke, Lösungen, Druckoptionen
- Blöcke: Stundenverlauf (Zeit · Phase · Sozialform · Material), Ziel/Bildungsplan, Erwartungshorizont (Falsch/Vorsicht), Abruffragen mit Lösung (siehe `docs/design/referenz/Arbeitsblatt Treibhauseffekt.dc.html`, Seiten 1–2)
- Lösungen in Lücken, Ankreuzen, Tabellen und Zuordnen hinterlegen (z. B. `[[−18]]` statt `___`)
- Druckdialog: Schüler-/Lösungsfassung, Farbe/S-W-Kopiervorlage

### Phase 4 – Handoff-Format und Claude-Anleitung
- Versioniertes Format (JSON Schema) für Stundenpakete, Prüfung mit verständlichen deutschen Fehlermeldungen
- Import per Drag-and-Drop einer Datei
- Skill/Projekt-Anweisung für Claude mit dem Treibhauseffekt-Paket als Musterbeispiel (PDF, Idee oder Design-Handoff → Datei)

### Phase 5 – Folien
- 16:9-Folien im Stil von `docs/design/referenz/Präsentation Treibhauseffekt.dc.html`
- Präsentationsmodus: Vollbild, Pfeiltasten, Sprechernotizen
- Leichte Textkorrektur in der App
