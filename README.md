# Arbeitsblatt-Baukasten

Ein Browser-Werkzeug für Lehrkräfte (Realschule, Klasse 5–10): Arbeitsblätter aus fertigen Bausteinen auf A4-Seiten zusammensetzen, nach Fach, Jahrgang und Modul ordnen und drucken oder als PDF speichern. Jede Seite hat ein festes Kopfband und Fußband, damit alle Blätter einheitlich aussehen.

Online: **https://noledge5.github.io/edutoolboxbuilder/** · Stand und Pläne: [docs/roadmap.md](docs/roadmap.md)

## Bedienung

### Übersicht
- **Fach und Jahrgang** oben wählen, darunter erscheinen die Module (Themen). „+ Fach“ legt ein Fach an, „Neues Modul“ ein Modul im gewählten Fach und Jahrgang.
- **Modul:** Thema, Nummer, Fach, Klasse, Kurzbeschreibung und Themen-Symbol (Klick auf den großen Kreis). Zwei Reiter:
  - **Inhalt:** die Stunden des Moduls mit ihren Seiten. Stunde anlegen, umnummerieren, umbenennen, öffnen, duplizieren, löschen.
  - **Kompetenzraster:** je Kompetenz „Ich kann …“-Sätze für die Niveaus G (grundlegend), M (mittel) und E (erweitert), dazu die Stunden.
- **Drucken** (im Modul): Inhaltsübersicht für die Lehrkraft und Kompetenzraster zum Ankreuzen für die Klasse, im selben A4-Stil wie die Arbeitsblätter.
- **Zuletzt bearbeitet:** die letzten Stunden für den schnellen Einstieg.
- Das Kürzel im Fußband (z. B. „K9 · M1 · S2“) und das Themen-Symbol kommen automatisch aus Klasse, Modul und Stunde.

### Arbeitsblatt
- **Bausteine einfügen:** aus der Toolbox auf die Seite ziehen oder anklicken (landet hinter dem ausgewählten Element). Auch auf Kopfband oder Fußband ablegen geht: dann oben bzw. unten auf der Seite.
- **Text direkt auf der Seite ändern:** Doppelklick, oder ein ausgewähltes Element noch einmal anklicken bzw. antippen. Esc oder Klick daneben beendet. Das geht für Überschrift, Text, Hinweis, Merksatz, Aufgabenstellung, Lückentext, Bildunterschrift, QR-Beschriftung, „Ich kann“-Überschrift sowie Titel und Zeile im Kopfband.
- **Panel rechts:** alle Inhalte, Breite (Ganz · ⅔ · ½ · ⅓), bei Aufgaben **Niveau** (★ bis ★★★) und **Punkte** (druckt „__ / 3 P.“). Klick auf das Kopfband öffnet Titel, Blatt-Typ, Sozialform, **Namensfeld** (Name · Namen · Name + Klasse · aus), Symbol und Fußzeile.
- **Neue Bausteine:** QR-Code (Link eintragen), „Ich kann …“-Selbsteinschätzung mit Smileys, Zeichenfeld mit Karo, Linien oder Punkten, Quellenangabe unter Bildern.
- **Seite ist voll:** Der Knopf „Überlauf auf neue Seite“ verschiebt, was unten abgeschnitten wird, auf eine neue Folgeseite. „Seite hinzufügen“ übernimmt Blatt-Typ, Zeile über dem Titel, Sozialform und Namensfeld der aktuellen Seite.
- **Verschieben:** ziehen (auch auf andere Seiten) oder die Pfeile in der schwarzen Leiste über dem Element; am Seitenrand wandert das Element auf die vorige bzw. nächste Seite.
- **Tastatur:** Entf löscht, Esc hebt die Auswahl auf, Strg/Cmd+Z macht rückgängig (mit Umschalt: wiederholen), Strg/Cmd+D dupliziert, ↑/↓ wählt das vorige/nächste Element, Alt+↑/↓ verschiebt es.
- **Zoom:** −/+, „Seite einpassen“; der Zoom bleibt beim Neuladen erhalten.
- **iPad:** Zum Ziehen kurz gedrückt halten. Im Hochformat öffnet „Toolbox“ die Bausteine, das Panel erscheint beim Antippen eines Elements.
- **Drucken / PDF:** Druckdialog des Browsers, eine A4-Seite pro Blatt, Rand 0. Ist eine Seite zu voll, fragt die App vorher nach.

### Sichern und Austauschen
Alles wird automatisch in diesem Browser auf diesem Gerät gespeichert (IndexedDB). iPad und Laptop haben also getrennte Stände, deshalb:
- **Übersicht → Datei → Alles sichern:** eine Datei mit allen Fächern, Modulen, Stunden und Bildern. Mit „Sicherung öffnen …“ auf einem anderen Gerät (oder nach einem Datenverlust) wieder einlesen; gleiche Einträge werden ersetzt, andere bleiben.
- **Arbeitsblatt → Datei → Als Datei sichern / Öffnen …:** ein einzelnes Arbeitsblatt mit Bildern. Eine solche Datei lässt sich auch ins Fenster ziehen oder im Modul als neue Stunde importieren – auch reine Arbeitsblatt-Daten, wie Claude sie erzeugt.
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
  library/    Übersicht, Modulseite, Kompetenzraster, Druck von Inhaltsübersicht/Kompetenzraster, Routen
  model/      Datenmodell eines Arbeitsblatts: Typen, Blocktypen, Blatt-Typen, Operationen, JSON-Prüfung, Undo
  sheet/      die gedruckte A4-Seite (Kopfband, Raster, Fußband, alle Blocktypen, Bearbeiten auf der Seite)
  editor/     Editor-Oberfläche: Toolbox, Canvas, Eigenschaften, Datei-Menü, Drag-and-Drop
  storage/    IndexedDB (Bibliothek, Bilder), Sicherungsdateien
  styles/     Design-Tokens, Editor-Styles, Druck-Styles
docs/
  design/     Design-Handoff (Spezifikation, Prototyp, Referenzen, Tokens)
  roadmap.md  Entscheidungen und Phasen
```
