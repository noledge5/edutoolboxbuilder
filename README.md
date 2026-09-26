# Arbeitsblatt-Baukasten

Ein Browser-Werkzeug für Lehrkräfte (Realschule, Klasse 5–10): Arbeitsblätter aus fertigen Bausteinen auf A4-Seiten zusammensetzen, nach Fach, Jahrgang und Modul ordnen und drucken oder als PDF speichern. Jede Seite hat ein festes Kopfband und Fußband, damit alle Blätter einheitlich aussehen.

Online: **https://noledge5.github.io/edutoolboxbuilder/** · Stand und Pläne: [docs/roadmap.md](docs/roadmap.md)

## Bedienung

### Übersicht
- **Fach und Jahrgang** oben wählen, darunter erscheinen die Module (Themen). „+ Fach“ legt ein Fach an, „Neues Modul“ ein Modul im gewählten Fach und Jahrgang.
- **Modul:** Thema, Nummer, Fach, Klasse, Kurzbeschreibung und Themen-Symbol (Klick auf den großen Kreis). Zwei Reiter:
  - **Inhalt:** die Stunden des Moduls mit ihren Seiten. Stunde anlegen, umnummerieren, umbenennen, öffnen, duplizieren, löschen.
  - **Kompetenzraster:** je Kompetenz „Ich kann …“-Sätze für die Niveaus G (grundlegend), M (mittel) und E (erweitert). Darunter stehen die Aufgaben, die mit der Kompetenz verknüpft sind („Std. 2 · S. 1 · Nr. 3 (M)“). Die Stunden trägt der Baukasten daraus selbst ein, wenn das Feld „Stunde(n)“ leer bleibt.
- **Drucken** (im Modul): Inhaltsübersicht für die Lehrkraft und Kompetenzraster zum Ankreuzen für die Klasse, im selben A4-Stil wie die Arbeitsblätter.
- **Modul → Als Stundenpaket sichern:** das ganze Modul mit allen Stunden und Bildern als eine Datei, z. B. für Kolleginnen und Kollegen oder als Vorlage für Claude.
- **Zuletzt bearbeitet:** die letzten Stunden für den schnellen Einstieg.
- Das Kürzel im Fußband (z. B. „K9 · M1 · S2“) und das Themen-Symbol kommen automatisch aus Klasse, Modul und Stunde.

### Arbeitsblatt
- **Bausteine einfügen:** aus der Toolbox auf die Seite ziehen oder anklicken (landet hinter dem ausgewählten Element). Auch auf Kopfband oder Fußband ablegen geht: dann oben bzw. unten auf der Seite.
- **Text direkt auf der Seite ändern:** Doppelklick, oder ein ausgewähltes Element noch einmal anklicken bzw. antippen. Esc oder Klick daneben beendet.
- **Panel rechts:** alle Inhalte und die Breite (Ganz · ⅔ · ½ · ⅓). Bei Aufgaben außerdem **Niveau** (★ G · ★★ M · ★★★ E), **Punkte** (druckt „__ / 3 P.“) und die **Kompetenz** aus dem Kompetenzraster des Moduls. Klick auf das Kopfband öffnet Titel, Blatt-Typ, Sozialform, Namensfeld (Name · Namen · Name + Klasse · aus), Symbol und Fußzeile.
- **Lösungen hinterlegen:** in Lücken `[[Wort]]` statt `___`, beim Ankreuzen `*` vor die richtige Antwort, bei Offener Frage, Tabelle und Zuordnen im Feld „Lösung“. Beim Bearbeiten erscheinen sie blass, in der Lösungsfassung deutlich, in der Schülerfassung gar nicht.
- **Bausteine für die Lehrkraft:** Stundenverlauf, Ziel & Bildungsplan, Erwartungshorizont (Richtig/Falsch/Vorsicht) und Abruffragen. Sie gehören auf eine Seite vom Blatt-Typ „Für die Lehrkraft“; solche Seiten haben keine Seitenzahl und werden nur mit der Lösungsfassung gedruckt.
- **Seite ist voll:** Der Knopf „Überlauf auf neue Seite“ verschiebt, was unten abgeschnitten wird, auf eine neue Folgeseite. „Seite hinzufügen“ übernimmt Blatt-Typ, Zeile über dem Titel, Sozialform und Namensfeld der aktuellen Seite.
- **Verschieben:** ziehen (auch auf andere Seiten) oder die Pfeile in der schwarzen Leiste über dem Element; am Seitenrand wandert das Element auf die vorige bzw. nächste Seite.
- **Tastatur:** Entf löscht, Esc hebt die Auswahl auf, Strg/Cmd+Z macht rückgängig (mit Umschalt: wiederholen), Strg/Cmd+D dupliziert, ↑/↓ wählt das vorige/nächste Element, Alt+↑/↓ verschiebt es.
- **Zoom:** −/+, „Seite einpassen“; der Zoom bleibt beim Neuladen erhalten.
- **iPad:** Zum Ziehen kurz gedrückt halten. Im Hochformat öffnet „Toolbox“ die Bausteine, das Panel erscheint beim Antippen eines Elements.
- **Drucken / PDF:** Erst **Schülerfassung** oder **Lösungsfassung** wählen, dann **Farbe** oder **S/W-Kopiervorlage** (Umrisse statt Farbflächen). „Vorschau“ zeigt das Ergebnis, „Drucken“ öffnet den Druckdialog des Browsers: eine A4-Seite pro Blatt, Rand 0. Ist eine Seite zu voll, fragt die App vorher nach.

### Mac und iPad
Der Baukasten speichert alles im Browser des jeweiligen Geräts. Abgeglichen wird über eine Datei in iCloud Drive, ohne Server und ohne Konto:
1. Auf dem Gerät, auf dem du gearbeitet hast: **Übersicht → Abgleich Mac/iPad → Sicherung speichern.** Die Datei heißt immer „Arbeitsblatt-Baukasten Bibliothek.json“. Auf dem iPad über „In Dateien sichern“ nach iCloud Drive, auf dem Mac landet sie im Download-Ordner (Tipp: in Safari als Download-Ordner einen Ordner in iCloud Drive wählen).
2. Auf dem anderen Gerät: **Abgleich Mac/iPad → Sicherung öffnen und abgleichen …** und die Datei wählen. Von jeder Stunde und jedem Modul bleibt die neuere Fassung, Gelöschtes bleibt gelöscht.

Der Punkt am Knopf „Abgleich Mac/iPad“ ist orange, solange es Änderungen gibt, die noch nicht gesichert sind.

**Als App installieren:** auf dem iPad in Safari „Teilen → Zum Home-Bildschirm“, auf dem Mac in Safari „Ablage → Zum Dock hinzufügen“. Die App startet dann ohne Browserleiste und funktioniert auch offline. Achtung: Die installierte App hat ihren eigenen Speicher. Öffne dort einmal die Sicherung aus iCloud Drive, dann ist alles da.

### Mit Claude erstellen
**Übersicht → Mit Claude** führt durch drei Schritte:
1. **Anleitung für Claude laden.** Die Datei beschreibt Claude das Format „Stundenpaket“, alle Bausteine mit ihren Feldern, die Themen-Symbole, wie viel auf eine Seite passt, und enthält ein vollständiges Beispiel. Dieselbe Anleitung liegt in [docs/claude/anleitung-fuer-claude.md](docs/claude/anleitung-fuer-claude.md).
2. **In Claude einrichten:** auf claude.ai ein Projekt anlegen und die Anleitung unter „Projektwissen“ hochladen. Dann z. B. schreiben: „Erstelle ein Stundenpaket für Geographie Klasse 9 zum Treibhauseffekt, drei Stunden.“ PDFs, Fotos alter Arbeitsblätter oder ein Stundenpaket aus dem Baukasten können angehängt werden.
3. **Paket öffnen:** die Datei von Claude über „Stundenpaket öffnen …“ wählen, auf die Übersicht ziehen oder den JSON-Text aus dem Chat einfügen. Daraus wird ein neues Modul mit Kompetenzraster und Stunden. Was der Baukasten reparieren musste (unbekannte Bausteine oder Felder, fehlende Kompetenzen), zeigt er danach an.

### Weitere Dateien
- **Arbeitsblatt → Datei → Als Datei sichern / Öffnen …:** ein einzelnes Arbeitsblatt mit Bildern. Im Modul über „Modul → Arbeitsblatt-Datei als Stunde importieren …“ wird daraus eine neue Stunde.
- **Datei → Daten anzeigen (JSON):** das Arbeitsblatt als Text zum Kopieren oder Einfügen.
- Ist der Baukasten in zwei Tabs offen, erscheint eine Warnung, weil sich die Tabs sonst gegenseitig überschreiben.

## Entwicklung

Voraussetzung: Node.js 22.12 oder neuer.

```sh
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # Unit-Tests (Vitest)
npm run typecheck  # TypeScript
npm run build      # Produktions-Build nach dist/
npm run anleitung  # docs/claude/anleitung-fuer-claude.md neu erzeugen (nach Änderungen an Bausteinen oder Symbolen)
```

Technik: Vite, React, TypeScript, [@dnd-kit](https://dndkit.com) für Drag-and-Drop (Maus und Touch), [lucide-react](https://lucide.dev) für Icons, idb-keyval für IndexedDB, immer für unveränderliche Dokument-Updates, uqr für QR-Codes. Die Schriften (Caprasimo, Figtree) liegen über @fontsource im Build, die App braucht also keine Verbindung zu Google Fonts.

### Veröffentlichen auf GitHub Pages

Jeder Push auf `main` baut die App und veröffentlicht sie (`.github/workflows/deploy.yml`). Einmalig im Repository einstellen, in dieser Reihenfolge:
1. **Settings → General → Default branch:** `main` (sonst darf `main` später nicht in die Pages-Umgebung veröffentlichen).
2. **Settings → Pages → Build and deployment → Source:** „GitHub Actions“.
3. Unter **Actions → Deploy to GitHub Pages** „Run workflow“ starten oder etwas auf `main` pushen.

## Aufbau des Codes

```
src/
  App.tsx     lädt die Bibliothek und zeigt je nach Adresse Übersicht, Modul oder Editor
  library/    Übersicht, Modulseite, Kompetenzraster, Druck von Inhaltsübersicht/Kompetenzraster, Routen,
              Abgleich Mac/iPad, Stundenpaket (Import/Export)
  claude/     Anleitung für Claude: Text (anleitung.md) plus Bausteinliste, Symbole und Beispiel aus dem Code
  model/      Datenmodell eines Arbeitsblatts: Typen, Blocktypen, Blatt-Typen, Operationen, JSON-Prüfung, Undo
  sheet/      die gedruckte A4-Seite (Kopfband, Raster, Fußband, alle Blocktypen, Bearbeiten auf der Seite)
  editor/     Editor-Oberfläche: Toolbox, Canvas, Eigenschaften, Datei-Menü, Drag-and-Drop
  storage/    IndexedDB (Bibliothek, Bilder), Sicherungsdateien
  styles/     Design-Tokens, Editor-Styles, Druck-Styles
docs/
  design/     Design-Handoff (Spezifikation, Prototyp, Referenzen, Tokens)
  claude/     Kopie der Anleitung für Claude (wird von einem Test aktuell gehalten)
  roadmap.md  Entscheidungen und Phasen
public/       App-Symbol, Manifest und Service Worker (offline nutzbar)
```
