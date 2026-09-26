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
| Papier und Oberfläche | Weiß statt Creme (abweichend vom Design-Handoff, Wunsch vom 26.09.2026): Arbeitsblätter über `--paper` in `src/sheet/sheet.css`, Toolbox, obere Leiste und Panel über `--color-ui` in `src/styles/app.css`. Die Fläche hinter den Seiten bleibt grau-beige, damit sich die weißen Blätter abheben. |
| Druck | Farbdruck und S/W-Kopiervorlage, Schüler- oder Lösungsfassung. |
| Übersicht | Startseite: Fach → Jahrgang → Modul (Thema). Je Modul eine Inhaltsübersicht (Stunden) und ein Kompetenzraster mit den Niveaus G/M/E des Bildungsplans BW, beide druckbar. Eine Stunde ist ein Arbeitsblatt-Dokument (mehrere Seiten). |

## Phasen

### Phase 1 – Editor-Fundament ✅
- Vite, React, TypeScript, Design-Tokens, selbst gehostete Schriften
- A4-Seite pixelgenau nach Design: Kopfband, Namensfeld, 12er-Raster, Fußband, 4 Blatt-Typen
- Alle 13 Blocktypen des Prototyps
- Drag-and-Drop mit Maus und Touch (auch über Seitengrenzen), Klick zum Einfügen, schwebende Werkzeugleiste
- Eigenschaften-Panel für Blöcke und Seiten, Zoom, Vorschau, „Seite ist voll“-Warnung
- Rückgängig/Wiederholen
- Themen-Symbol im Kopfband wählbar (gilt für alle Seiten, Auswahl mit Suche)
- JSON-Dialog mit Prüfung
- Speicherung in IndexedDB, Bilder verkleinert gespeichert
- Druck/PDF: eine A4-Seite pro Blatt, weißes Papier
- GitHub Pages Deployment, CI

### Phase 1.5 – Ausbau nach dem ersten Audit ✅
- Übersicht mit Fach, Jahrgang und Modulen; Modulseite mit Stunden, Kompetenzraster (G/M/E) und Druck von Inhaltsübersicht und Kompetenzraster; Kürzel und Symbol kommen aus dem Modul; das bisherige Einzelblatt wurde automatisch übernommen
- Sichern/Öffnen als Datei: ganze Bibliothek bzw. einzelnes Arbeitsblatt, jeweils mit Bildern; Import einer Datei als neue Stunde
- Text direkt auf der Seite bearbeiten (Doppelklick oder erneutes Antippen)
- „Überlauf auf neue Seite“; neue Seiten übernehmen die Kopfband-Einstellungen
- Aufgaben mit Niveau (★–★★★) und Punkten; Namensfeld-Varianten (Name · Namen · Name + Klasse · aus)
- Neue Bausteine: QR-Code, „Ich kann …“; Zeichenfeld mit Karo/Linien/Punkten; Quellenangabe unter Bildern
- Warnung bei zweitem Tab; Zoom merken und „Seite einpassen“; Strg+D, Pfeiltasten, Alt+Pfeiltasten

### Phase 2 – Bibliothek (Rest)
- Vorlagen je Blatt-Typ
- Installierbar als App auf dem Home-Bildschirm (PWA), offline nutzbar
- Kompetenzen im Arbeitsblatt verknüpfen (Aufgabe ↔ Kompetenz/Niveau)

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
