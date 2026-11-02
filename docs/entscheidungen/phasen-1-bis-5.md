# Phasen 1 bis 5

← [Index](../roadmap.md)

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

### Phase 4 – Planung, Bilder, Folien ✅
- Mehr Themen-Symbole (232, in zehn Gruppen); Kompetenzraster als Übersicht und druckbares Schülerblatt, Seitenumbruch durch Ausmessen
- Jahresplan importieren (Claude-JSON oder Text/Tabelle), geplante Stunden mit Planungsnotiz, blass bis ausgearbeitet; Pakete ergänzen Module mit derselben Nummer, ohne Ausgearbeitetes zu überschreiben
- Bildsuche in Openverse und Wikimedia Commons mit automatischer Quellenangabe; Suchwörter im Baustein „Abbildung“; transparenter Rand bei „Ganz zeigen“
- Rückseiten doppelseitiger Blätter mit schmaler Kopfzeile der Vorderseite
- Farbe je Fach in der App (die Blätter bleiben orange); Toolbox-Gruppe „Oft in <Fach>“
- Folien je Stunde (16:9, nach `docs/design/referenz/Präsentation Treibhauseffekt.dc.html`): neun Arten, Editor, Vorschlag aus dem Arbeitsblatt, Präsentationsmodus (Vollbild, Tasten, Wischen, Antworten auf Klick, Sprechernotizen, Zeit), Handout, Notizfassung, PDF quer; Folien im Stundenpaket und in der Claude-Anleitung
- Folien flexibler: Textfelder, Bilder, Videos (YouTube, Vimeo, MP4) und QR-Codes frei platzieren (ziehen, Größe ändern, auch per Finger), freie Folie „Leer“, Einträge und Elemente schrittweise einblenden, Animationen beim Erscheinen, Übergänge zwischen Folien, Fett/Marker-Knöpfe
- Folien direkt auf der Folie beschreiben (Doppelklick, auf dem iPad zweimal tippen), fünf Designs je Stunde (Organisch, Klar, Heft, Tafel, Kontrast), PowerPoint-Export (bearbeitbar, im Design, Lösungen als Klick-Animation, Notizen, Übergänge) und -Import (passende Folienarten; eigene Folien kommen unverändert zurück)
- Folien begleiten das Arbeitsblatt: jede Aufgabe auf einer eigenen Folie „Aufgabe“ (Nummer, Niveau, Punkte, Auftrag, Hilfe, Einträge, Bild) mit ihrer Lösung auf Klick, Lücken, die sich füllen, auch im Merksatz; Abbildungen, Schemata, Vokabeln und Regeln in der Reihenfolge des Blatts; Handout ohne Lösungen

### Phase 5 – Feinschliff
- Referentenansicht in einem zweiten Fenster (Notizen und nächste Folie auf dem Mac, Folie auf dem Beamer)
- Vorlagen je Blatt-Typ
- Bilder im Stundenpaket als ZIP statt data-URL (für große Fotos)
- Test auf echtem iPad und Mac (Safari), Rückmeldungen einarbeiten
- Leichte Textkorrektur in der App
