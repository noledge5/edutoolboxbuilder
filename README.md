# Arbeitsblatt-Baukasten

Ein Browser-Werkzeug für Lehrkräfte (Realschule, Klasse 5–10): Arbeitsblätter aus fertigen Bausteinen auf A4-Seiten zusammensetzen, nach Fach, Jahrgang und Modul ordnen, übers Schuljahr planen und drucken oder als PDF speichern. Jede Seite hat ein festes Kopfband und Fußband, damit alle Blätter einheitlich aussehen. Für Englisch gibt es eigene Bausteine, Blatt-Typen und englische Beschriftungen.

Online: **https://noledge5.github.io/edutoolboxbuilder/** · Stand und Pläne: [docs/roadmap.md](docs/roadmap.md)

## Bedienung

### Übersicht
- **Fach und Jahrgang** oben wählen, darunter erscheinen die Module (Themen). „+ Fach“ legt ein Fach an, „Neues Modul“ ein Modul im gewählten Fach und Jahrgang.
- **Modul:** Thema, Nummer, Fach, Klasse, Kurzbeschreibung und Themen-Symbol (Klick auf den großen Kreis). Zwei Reiter:
  - **Inhalt:** die Stunden des Moduls mit ihren Seiten. Stunde anlegen, umnummerieren, umbenennen, öffnen, duplizieren, löschen.
  - **Kompetenzraster:** je Kompetenz „Ich kann …“-Sätze für die Niveaus G (grundlegend), M (mittel) und E (erweitert). Darunter stehen die Aufgaben, die mit der Kompetenz verknüpft sind („Std. 2 · S. 1 · Nr. 3 (M)“). Die Stunden trägt der Baukasten daraus selbst ein, wenn das Feld „Stunde(n)“ leer bleibt.
- **Drucken** (im Modul): Inhaltsübersicht für die Lehrkraft und Kompetenzraster zum Ankreuzen für die Klasse, im selben A4-Stil wie die Arbeitsblätter.
- **Modul:** außerdem Sprache der Blätter (Deutsch/Englisch), deutsche Hilfe unter englischen Aufträgen, Lehrwerksbezug, Dauer in Schulwochen und Beginn für den Jahresplan. Jede Stunde hat ein Feld für die Seiten im Lehrwerk.
- **Kompetenzraster:** jede Kompetenz mit Bereich; für Englisch und andere Fremdsprachen lassen sich die Bereiche des Bildungsplans BW einzeln oder alle auf einmal hinzufügen (Hör-/Hörsehverstehen, Leseverstehen, Sprechen, Schreiben, Sprachmittlung, sprachliche Mittel, interkulturelle sowie Text- und Medienkompetenz).
- **Jahresplan** (in der Übersicht neben den Modulen): alle Module des Jahrgangs auf den Schulwochen, Ferienwochen übersprungen, mit Kalenderwochen und Daten. Das Schuljahr 2026/27 für Baden-Württemberg ist mit einem Klick eingetragen; Schuljahr und Ferien lassen sich unter „Einstellungen“ ändern. Druckbar auf einer A4-Seite, und als Stundenpaket für Claude sicherbar.
- **Vokabeln** (im Modul, bei Englisch): „Vokabeltest erstellen …“ wählt zufällig Wörter aus den Vokabellisten des Moduls und legt eine Stunde mit dem Test (und Notenschlüssel) an; „Vokabeln als CSV“ für Anki, Quizlet oder LearningApps.
- **Modul → Als Stundenpaket sichern:** das ganze Modul mit allen Stunden und Bildern als eine Datei, z. B. für Kolleginnen und Kollegen oder als Vorlage für Claude.
- **Kompetenzraster als Übersicht:** Im Reiter „Kompetenzraster“ zeigt „Übersicht“ das Raster so, wie die Klasse es bekommt (mit Sternen für G/M/E, Bereichen des Bildungsplans und Kästchen zum Ankreuzen); „Für die Klasse drucken“ druckt es, auch über mehrere Seiten. „Bearbeiten“ öffnet die Eingabe.
- **Jahresplan importieren** (im Jahresplan): von Claude (Datei oder JSON-Text) oder aus der eigenen Planung als Text, eine Zeile pro Modul, darunter die Stunden mit „-“, Wochen, Beginn und Schwerpunkte mit „|“ getrennt (auch Tabellen aus Excel oder Word). Vorab zeigt der Baukasten, welche Module neu sind und welche ergänzt werden. Module mit derselben Nummer werden ergänzt; ausgearbeitete Stunden bleiben, wie sie sind.
- **Geplant und ausgearbeitet:** Stunden aus dem Jahresplan haben erst nur Titel und Planungsnotiz. Sie erscheinen blass mit „Geplant“ (auch Module, deren Stunden alle erst geplant sind), mit Fortschrittsbalken „2 von 6 Stunden ausgearbeitet“. „Ausarbeiten“ öffnet das leere Arbeitsblatt, die Planungsnotiz steht darüber. Schickt Claude später das ausgearbeitete Modul mit derselben Nummer, füllt es das geplante.
- **Farbe je Fach:** Knöpfe und Symbole haben die Farbe des Fachs (Englisch blau, Geographie grün …), änderbar unter „Einstellungen → Farbe je Fach“. Die gedruckten Blätter bleiben gleich. In der Toolbox steht oben „Oft in <Fach>“ mit den Bausteinen, die du in diesem Fach am meisten nutzt.
- **Zuletzt bearbeitet:** die letzten Stunden für den schnellen Einstieg.
- Das Kürzel im Fußband (z. B. „K9 · M1 · S2“) und das Themen-Symbol kommen automatisch aus Klasse, Modul und Stunde.

### Arbeitsblatt
- **Bausteine einfügen:** aus der Toolbox auf die Seite ziehen oder anklicken (landet hinter dem ausgewählten Element). Auch auf Kopfband oder Fußband ablegen geht: dann oben bzw. unten auf der Seite.
- **Text direkt auf der Seite ändern:** Doppelklick, oder ein ausgewähltes Element noch einmal anklicken bzw. antippen. Esc oder Klick daneben beendet.
- **Panel rechts:** alle Inhalte und die Breite (Ganz · ⅔ · ½ · ⅓). Bei Aufgaben außerdem **Niveau** (★ G · ★★ M · ★★★ E), **Punkte** (druckt „__ / 3 P.“) und die **Kompetenz** aus dem Kompetenzraster des Moduls. Klick auf das Kopfband öffnet Titel, Blatt-Typ, Sozialform, Namensfeld (Name · Namen · Name + Klasse · aus), Symbol und Fußzeile.
- **Lösungen hinterlegen:** in Lücken `[[Wort]]` statt `___`, beim Ankreuzen `*` vor die richtige Antwort, bei Offener Frage, Tabelle und Zuordnen im Feld „Lösung“. Beim Bearbeiten erscheinen sie blass, in der Lösungsfassung deutlich, in der Schülerfassung gar nicht.
- **Englisch:** Ist das Modul englisch, stehen auf den Blättern „Name · Class · Date“, englische Blatt-Typen und Sozialformen und englische Anführungszeichen; Rechtschreibprüfung und Silbentrennung laufen auf Englisch. Jede Aufgabe kann eine **deutsche Hilfe** haben, die klein unter dem Auftrag steht und sich pro Modul ausblenden lässt. Lehrkraft-Seiten bleiben deutsch.
- **Bausteine für Sprachen:** Vokabelliste mit Lautschrift (mit Zeichenleiste für ə, θ, ʃ …), Knick-Vokabeltest, Bild-Vokabeln (Emoji oder eigene Bilder), Wortnetz, Grammatik-Box (`{{s}}` markiert Endungen farbig), Formentabelle mit Vorlagen (to be, have got, simple present, can, present progressive), Wörter ordnen, Umformen, Satzbaustellen, Hörverstehen (Track, QR-Code zur Audiodatei, Transkript nur in der Lösungsfassung), Lesetext mit Zeilennummern und Worterklärungen, Richtig/Falsch/Not in the text, Redemittel, Rollenkarten zum Ausschneiden, Bingo und „Find someone who“, Schreibrahmen mit Checkliste, Sprachmittlung. Die Sprach-Gruppen der Toolbox sind in deutschen Modulen zugeklappt.
- **Tests und Differenzierung:** Blatt-Typ „Test“; Punkte je Aufgabe, auf Wunsch getrennt nach Inhalt und Sprache; Notenschlüssel, der die Punkte des Arbeitsblatts zählt (Prozentgrenzen einstellbar, halbe Punkte); Tipps an Aufgaben, die der Baustein „Tippkarten“ als Karten zum Ausschneiden sammelt.
- **Bausteine für die Lehrkraft:** Stundenverlauf, Ziel & Bildungsplan, Erwartungshorizont (Richtig/Falsch/Vorsicht) und Abruffragen. Sie gehören auf eine Seite vom Blatt-Typ „Für die Lehrkraft“; solche Seiten haben keine Seitenzahl und werden nur mit der Lösungsfassung gedruckt.
- **Bilder aus dem Internet:** Im Panel eines Bildes „Im Internet suchen“ (bei Bild-Vokabeln der Globus je Karte): Suche in Openverse (über 800 Millionen freie Bilder, u. a. Flickr, Wikimedia, Museen) oder Wikimedia Commons (stark bei Karten und Schaubildern), Filter Fotos/Zeichnungen und „nur gemeinfrei“. Urheber und Lizenz landen automatisch als Quelle unter dem Bild. Englische Suchwörter finden meist mehr; die Suche braucht Internet. Passt ein Bild nicht ins Feld („Ganz zeigen“), bleibt der Rand transparent.
- **Rückseite:** Im Panel der Seite (Klick aufs Kopfband) „Doppelseitiges Blatt → Rückseite von Seite 1“. Die Rückseite hat nur eine schmale Kopfzeile mit Symbol und Titel der Vorderseite und „Rückseite“, kein Namensfeld, und rund 110 px mehr Platz. Beim Drucken „beidseitig“ wählen.
- **Seite ist voll:** Der Knopf „Überlauf auf neue Seite“ verschiebt, was unten abgeschnitten wird, auf eine neue Folgeseite. „Seite hinzufügen“ übernimmt Blatt-Typ, Zeile über dem Titel, Sozialform und Namensfeld der aktuellen Seite.
- **Verschieben:** ziehen (auch auf andere Seiten) oder die Pfeile in der schwarzen Leiste über dem Element; am Seitenrand wandert das Element auf die vorige bzw. nächste Seite.
- **Tastatur:** Entf löscht, Esc hebt die Auswahl auf, Strg/Cmd+Z macht rückgängig (mit Umschalt: wiederholen), Strg/Cmd+D dupliziert, ↑/↓ wählt das vorige/nächste Element, Alt+↑/↓ verschiebt es.
- **Zoom:** −/+, „Seite einpassen“; der Zoom bleibt beim Neuladen erhalten.
- **iPad:** Zum Ziehen kurz gedrückt halten. Im Hochformat öffnet „Toolbox“ die Bausteine, das Panel erscheint beim Antippen eines Elements.
- **Drucken / PDF:** Erst **Schülerfassung** oder **Lösungsfassung** wählen, dann **Farbe** oder **S/W-Kopiervorlage** (Umrisse statt Farbflächen). „Vorschau“ zeigt das Ergebnis, „Drucken“ öffnet den Druckdialog des Browsers: eine A4-Seite pro Blatt, Rand 0. Ist eine Seite zu voll, fragt die App vorher nach.

### Folien
Jede Stunde hat ein eigenes Abteil für Präsentationsfolien (16:9), im Stil der Arbeitsblätter und der Folien-Vorlage aus dem Design. Öffnen über „Folien“ in der Stundenliste des Moduls oder oben im Arbeitsblatt.
- **Vorschlagen:** Bei einer Stunde ohne Folien erzeugt „Folien aus dem Arbeitsblatt vorschlagen“ einen ersten Satz: Titel mit Leitfrage, Abruffragen, Aufgaben je Seite, Vokabelkarten, Merksatz als Exit.
- **Arten:** Titel, Fragen (nummeriert, Antworten erst auf Klick), Zitat + Leitfrage, Aussage mit Hinweis, Vergleich (2–3 Kästen), Fließschema, Wörter (Karten, Bedeutung auf Klick), Bild (mit Bildsuche), Exit/Merksatz. Farbe wie ein Blatt-Typ, Phase, Sozialform und Minuten in der Kopfleiste, Sprechernotizen.
- **Bearbeiten:** links die Folien, in der Mitte die gewählte, rechts die Felder. „+ Folie“ fügt nach der gewählten ein, Pfeile verschieben, Duplizieren, Löschen, Rückgängig (⌘Z).
- **Präsentieren:** Vollbild; weiter mit →, Leertaste, Klick oder Wischen nach links, zurück mit ←, Klick ins linke Drittel oder Wischen nach rechts. N zeigt die Sprechernotizen, F Vollbild, Esc beendet. Unten laufen Foliennummer und Zeit mit.
- **Drucken:** Handout (zwei Folien je A4-Seite), mit Sprechernotizen (drei je Seite, für dich) oder die Folien als PDF im Querformat.

### Mac und iPad
Der Baukasten speichert alles im Browser des jeweiligen Geräts. Abgeglichen wird über eine Datei in iCloud Drive, ohne Server und ohne Konto:
1. Auf dem Gerät, auf dem du gearbeitet hast: **Übersicht → Abgleich Mac/iPad → Sicherung speichern.** Die Datei heißt immer „Arbeitsblatt-Baukasten Bibliothek.json“. Auf dem iPad über „In Dateien sichern“ nach iCloud Drive, auf dem Mac landet sie im Download-Ordner (Tipp: in Safari als Download-Ordner einen Ordner in iCloud Drive wählen).
2. Auf dem anderen Gerät: **Abgleich Mac/iPad → Sicherung öffnen und abgleichen …** und die Datei wählen. Von jeder Stunde und jedem Modul bleibt die neuere Fassung, Gelöschtes bleibt gelöscht.

Der Punkt am Knopf „Abgleich Mac/iPad“ ist orange, solange es Änderungen gibt, die noch nicht gesichert sind.

**Als App installieren:** auf dem iPad in Safari „Teilen → Zum Home-Bildschirm“, auf dem Mac in Safari „Ablage → Zum Dock hinzufügen“. Die App startet dann ohne Browserleiste und funktioniert auch offline. Achtung: Die installierte App hat ihren eigenen Speicher. Öffne dort einmal die Sicherung aus iCloud Drive, dann ist alles da.

### Mit Claude erstellen
**Übersicht → Mit Claude** führt durch drei Schritte:
1. **Anleitung für Claude laden.** Die Datei beschreibt Claude das Format „Stundenpaket“ (auch mit mehreren Modulen für einen Jahresplan), alle Bausteine mit ihren Feldern, Blatt-Typen, Bereiche des Bildungsplans, die Ferien 2026/27, die Themen-Symbole, wie viel auf eine Seite passt, was bei Englisch gilt, und enthält drei vollständige Beispiele (Englisch Klasse 5, Jahresplan, Geographie). Dieselbe Anleitung liegt in [docs/claude/anleitung-fuer-claude.md](docs/claude/anleitung-fuer-claude.md).
2. **In Claude einrichten:** auf claude.ai ein Projekt anlegen und die Anleitung unter „Projektwissen“ hochladen (eine ältere Fassung ersetzen). Dann z. B. schreiben: „Erstelle ein Stundenpaket für Englisch Klasse 5 zum Thema My family, drei Stunden, ohne Lehrwerk.“ oder „Erstelle den Jahresplan für Englisch Klasse 5.“ Ohne Lehrwerk plant Claude Themen, Grammatikfolge, Lese- und Hörtexte selbst (Hörtexte als Transkript zum Vorlesen). PDFs, Fotos alter Arbeitsblätter oder ein Stundenpaket aus dem Baukasten können angehängt werden.
3. **Paket öffnen:** die Datei von Claude über „Stundenpaket öffnen …“ wählen, auf die Übersicht ziehen oder den JSON-Text aus dem Chat einfügen. Daraus werden neue Module mit Kompetenzraster und Stunden; ein Jahresplan bringt auch das Schuljahr mit. Was der Baukasten reparieren musste (unbekannte Bausteine oder Felder, fehlende Kompetenzen), zeigt er danach an.

Die Anleitung erklärt auch geplante Stunden (Jahresplan), Rückseiten (`"back": true`), Folien (`"slides"`) und Suchwörter für Bilder, sodass auch andere KIs damit Pakete schreiben können. Folien für eine vorhandene Stunde: Claude schickt das Modul mit derselben Nummer und nur die Stunde mit ihren Folien; der Baukasten hängt sie an.

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
  App.tsx     lädt die Bibliothek und zeigt je nach Adresse Übersicht, Modul, Editor oder Folien
  library/    Übersicht, Modulseite, Kompetenzraster, Druck von Inhaltsübersicht/Kompetenzraster, Routen,
              Abgleich Mac/iPad, Stundenpaket (Import/Export), Jahresplan und sein Import, Vokabeltest, Fachfarben
  slides/     Folien: Darstellung, Editor, Präsentationsmodus, Druck, Vorschlag aus dem Arbeitsblatt
  claude/     Anleitung für Claude: Text (anleitung.md) plus Bausteinliste, Symbole, Bereiche, Ferien und Beispiele aus dem Code
  model/      Datenmodell eines Arbeitsblatts: Typen, Blocktypen, Blatt-Typen, Operationen, JSON-Prüfung, Undo
  sheet/      die gedruckte A4-Seite (Kopfband, Raster, Fußband, alle Blocktypen, Bearbeiten auf der Seite)
  editor/     Editor-Oberfläche: Toolbox, Canvas, Eigenschaften, Datei-Menü, Drag-and-Drop
  storage/    IndexedDB (Bibliothek, Bilder), Sicherungsdateien, Bildsuche (Openverse, Wikimedia Commons)
  styles/     Design-Tokens, Editor-Styles, Druck-Styles
docs/
  design/     Design-Handoff (Spezifikation, Prototyp, Referenzen, Tokens)
  claude/     Kopie der Anleitung für Claude (wird von einem Test aktuell gehalten)
  roadmap.md  Entscheidungen und Phasen
public/       App-Symbol, Manifest und Service Worker (offline nutzbar)
```
