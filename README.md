# Arbeitsblatt-Baukasten

Ein Browser-Werkzeug für Lehrkräfte (Realschule, Klasse 5–10): Arbeitsblätter aus fertigen Bausteinen auf A4-Seiten zusammensetzen, Inhalte im Eigenschaften-Panel bearbeiten und drucken oder als PDF speichern. Jede Seite hat ein festes Kopfband und Fußband, damit alle Blätter einheitlich aussehen.

Stand: **Phase 1** (Editor). Was danach kommt, steht in [docs/roadmap.md](docs/roadmap.md).

## Bedienung

- **Bausteine einfügen:** aus der Toolbox auf die Seite ziehen oder anklicken. Beim Anklicken landet der Baustein hinter dem ausgewählten Element.
- **Bearbeiten:** Element anklicken, dann rechts im Panel Inhalt und Breite (Ganz · ⅔ · ½ · ⅓) ändern. Ein Klick auf das Kopfband öffnet Titel, Blatt-Typ, Sozialform und Fußzeile.
- **Verschieben:** Elemente mit der Maus ziehen, auch auf eine andere Seite. Alternativ geht es mit den Pfeilen in der schwarzen Leiste über dem Element.
- **Tastatur:** Entf löscht das ausgewählte Element, Esc hebt die Auswahl auf, Strg/Cmd+Z macht rückgängig, Strg/Cmd+Umschalt+Z stellt wieder her.
- **iPad:** Zum Ziehen kurz gedrückt halten. Im Hochformat öffnet der Knopf „Toolbox“ die Bausteine, das Panel erscheint beim Antippen eines Elements.
- **Drucken / PDF:** öffnet den Druckdialog des Browsers. Zum Speichern „Als PDF sichern“ bzw. „Als PDF speichern“ wählen. Die Seiten sind genau A4, der Rand steht auf 0.
- **Daten:** zeigt das ganze Arbeitsblatt als JSON. So lässt es sich sichern oder durch neue Daten ersetzen, z. B. von Claude aus einem PDF erzeugt. „Übernehmen“ kann mit Strg/Cmd+Z rückgängig gemacht werden.

### Wo werden die Daten gespeichert?

Nur lokal in diesem Browser auf diesem Gerät (IndexedDB), bei jeder Änderung automatisch. iPad und Laptop haben also getrennte Stände. Zum Sichern oder Übertragen gibt es „Daten“ → „Alles kopieren“. Bilder werden nicht in diese JSON-Daten übernommen, sie bleiben auf dem Gerät, auf dem sie eingefügt wurden (ein Export mit Bildern kommt in Phase 2).

## Entwicklung

Voraussetzung: Node.js 22.12 oder neuer.

```sh
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # Unit-Tests (Vitest)
npm run typecheck  # TypeScript
npm run build      # Produktions-Build nach dist/
```

Technik: Vite, React, TypeScript, [@dnd-kit](https://dndkit.com) für Drag-and-Drop (Maus und Touch), [lucide-react](https://lucide.dev) für Icons, idb-keyval für IndexedDB, immer für unveränderliche Dokument-Updates. Die Schriften (Caprasimo, Figtree) liegen über @fontsource im Build, die App braucht also keine Verbindung zu Google Fonts.

### Veröffentlichen auf GitHub Pages

Jeder Push auf `main` baut die App und veröffentlicht sie (`.github/workflows/deploy.yml`) unter **https://noledge5.github.io/edutoolboxbuilder/**.

Einmalig im Repository einstellen, in dieser Reihenfolge:
1. **Settings → General → Default branch:** `main` (sonst darf `main` später nicht in die Pages-Umgebung veröffentlichen).
2. **Settings → Pages → Build and deployment → Source:** „GitHub Actions“.
3. Unter **Actions → Deploy to GitHub Pages** „Run workflow“ starten oder etwas auf `main` pushen.

## Aufbau des Codes

```
src/
  model/      Datenmodell: Typen, Blocktypen, Blatt-Typen, Operationen, JSON-Prüfung, Undo-Verlauf
  sheet/      die gedruckte A4-Seite (Kopfband, Raster, Fußband, alle Blocktypen) – pixelgenau nach Design
  editor/     Editor-Oberfläche: Toolbox, Canvas, Eigenschaften, Daten-Dialog, Drag-and-Drop
  storage/    Speicherung in IndexedDB, Bilder verkleinern und laden
  styles/     Design-Tokens, Editor-Styles, Druck-Styles
docs/
  design/     Design-Handoff (Spezifikation, Prototyp, Referenzen, Tokens)
  roadmap.md  Entscheidungen und Phasen
```
