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
| Mac ↔ iPad | Abgleich über eine Sicherungsdatei in iCloud Drive (immer derselbe Dateiname), kein Server, kein Konto. Je Modul und Stunde gewinnt die neuere Fassung, Löschungen werden mitgenommen. Als App (Home-Bildschirm/Dock) installierbar und offline nutzbar. |
| Niveaus | Die Sterne einer Aufgabe sind die Niveaus des Kompetenzrasters: ★ = G, ★★ = M, ★★★ = E. |
| Lehrkraft-Seiten | Blatt-Typ „Für die Lehrkraft“: keine Seitenzahl (Schülerseiten zählen ab 1) und nur in der Lösungsfassung gedruckt. |
| Englisch | Sprache pro Modul (`lang`): englische Beschriftungen auf den Schülerblättern, Lehrkraft-Seiten bleiben deutsch. Deutsche Hilfe unter englischen Aufträgen, pro Modul abschaltbar. Eigene Blatt-Typen (Wortschatz, Grammatik, Hören, Sprechen, Test) mit zusätzlichen Farbverläufen in der Tonalität des Design-Systems. Lautschrift in Noto Sans, weil Figtree die IPA-Zeichen nicht hat. |
| Jahresplan | Schuljahr mit Ferien in den Einstellungen (BW 2026/27 laut Kultusministerium als Vorschlag). Module haben Dauer in Schulwochen und optional einen Beginn; sie folgen in der Reihenfolge ihrer Nummer, Ferienwochen (ab 3 freien Tagen) werden übersprungen. Stundenpakete ab Version 2 enthalten mehrere Module und optional das Schuljahr. |
| Handoff-Format | „Stundenpaket“ (`arbeitsblatt-baukasten-paket`, Version 1): ein Modul mit Kompetenzen und Stunden, die Seiten im selben Format wie ein Arbeitsblatt. Der Import repariert, was geht, und zählt auf, was er geändert hat. Die Anleitung für Claude entsteht aus `src/claude/anleitung.md` plus Bausteinliste, Symbolen und Beispiel aus dem Code. |

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

### Phase 2 – Bibliothek, Geräte, Lösungen, Claude ✅
- Abgleich Mac ↔ iPad über eine Datei in iCloud Drive (neuere Fassung gewinnt, Löschungen werden übernommen), Hinweis auf nicht gesicherte Änderungen
- Installierbar als App (Home-Bildschirm, Dock), offline nutzbar (Service Worker)
- Aufgaben mit Kompetenzen verknüpfen; das Kompetenzraster zeigt die verknüpften Aufgaben, die Lösungsfassung Kompetenz und Niveau
- Lehrkraft-Bausteine: Stundenverlauf, Ziel & Bildungsplan, Erwartungshorizont (Richtig/Falsch/Vorsicht), Abruffragen
- Lösungen in Lücken (`[[−18]]`), Ankreuzen (`*`), Offener Frage, Tabelle und Zuordnen; Druckdialog mit Schüler-/Lösungsfassung und Farbe/S-W-Kopiervorlage
- Stundenpaket als Datei: Import (Datei, Ziehen, Einfügen aus dem Chat) mit deutschen Fehlermeldungen und Hinweisen, Export eines Moduls
- Anleitung für Claude mit allen Bausteinen, Symbolen, Platzregeln und dem Treibhauseffekt-Paket als Beispiel

### Phase 3 – Englisch und Jahresplan ✅
- Sprache pro Modul, englische Kopfzeile, typografische Anführungszeichen, deutsche Hilfe unter Aufträgen
- Blatt-Typen Wortschatz, Grammatik, Hören, Sprechen, Test
- Bausteine: Vokabelliste (IPA), Knick-Vokabeltest, Bild-Vokabeln, Wortnetz, Grammatik-Box, Formentabelle mit Vorlagen, Wörter ordnen, Umformen, Satzbaustellen, Hörverstehen, Lesetext mit Zeilennummern und Glossar, Richtig/Falsch/Not in the text, Redemittel, Rollenkarten, Bingo/Find someone who, Schreibrahmen, Sprachmittlung, Notenschlüssel, Tippkarten
- Punkte getrennt nach Inhalt und Sprache, Vokabeltest-Generator, Vokabel-Export als CSV
- Kompetenzbereiche des Bildungsplans als Vorlage im Kompetenzraster, Lehrwerksbezug je Modul und Stunde
- Jahresplan mit Schulwochen und Ferien, druckbar, als Stundenpaket (mehrere Module) für Claude
- Neue Themen-Symbole für Englisch-Units; Claude-Anleitung neu mit drei Beispielen

### Phase 4 – Feinschliff
- Vorlagen je Blatt-Typ
- Bilder im Stundenpaket als ZIP statt data-URL (für große Fotos)
- Test auf echtem iPad und Mac (Safari), Rückmeldungen einarbeiten

### Phase 5 – Folien
- 16:9-Folien im Stil von `docs/design/referenz/Präsentation Treibhauseffekt.dc.html`
- Präsentationsmodus: Vollbild, Pfeiltasten, Sprechernotizen
- Leichte Textkorrektur in der App
