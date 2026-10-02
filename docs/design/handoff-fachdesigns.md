# Auftrag an Claude Design: Fachdesigns für Arbeitsblatt und Präsentation

*Stand 02.10.2026. Den Text ab „Auftrag“ in Claude Design einfügen und die Dateien unter „Anhänge“ mitgeben.*

## Anhänge (aus diesem Repository)

| Datei | Wozu |
|---|---|
| `docs/design/README.md` | Die bisherige Spezifikation: A4-Seite, Kopfband, Fußband, Raster, alle Bausteine |
| `docs/design/tokens/organic-styles.css` | Die Design-Tokens (Farbrampen 100–900, Schriften, Radien, Schatten) |
| `docs/design/referenz/Arbeitsblatt Treibhauseffekt.dc.html` | Ein echtes Arbeitsblatt im jetzigen Design |
| `docs/design/referenz/Präsentation Treibhauseffekt.dc.html` | Die Folien im jetzigen Design |
| `src/sheet/sheet.css`, `src/slides/slides.css` (freiwillig) | Die echten Klassen und Maße, damit der Entwurf zur Umsetzung passt |

---

## Auftrag

Entwirf **Fachdesigns** für den Arbeitsblatt-Baukasten: ein Werkzeug, mit dem eine Lehrkraft an einer Realschule in Baden-Württemberg Arbeitsblätter (A4, gedruckt) und Präsentationsfolien (16:9, Beamer und iPad) aus Bausteinen baut. Bisher sehen alle Fächer gleich aus (Design „Organisch“, siehe Anhänge). Künftig soll man einem Blatt und den Folien sofort ansehen, zu welchem Fach sie gehören, und das Design soll zum Alter der Klasse passen. Es soll ansprechend und fachtypisch wirken, aber **nicht überladen**: Das Fach zeigt sich in wenigen, ruhigen Zeichen, der Inhalt bleibt die Hauptsache.

### Fächer und Altersstufen

Drei Fächer, je zwei Altersstufen, also **sechs Designs**:

| Fach | Klasse 5–6 (Unterstufe, 10–12 Jahre) | Klasse 7–10 (Mittelstufe, 12–16 Jahre) |
|---|---|---|
| **Geographie** | freundlich, entdeckend | sachlich, wie ein guter Atlas |
| **Englisch** | verspielt, einladend | lässig, jugendlich, nicht kindlich |
| **Informatik** | spielerisch (Klasse 5/6: Medienbildung, Blockprogrammierung) | klar, technisch (Algorithmen, Daten, Python) |

Unterstufe: etwas größere und weichere Formen, mehr Farbe, gern ein kleines wiederkehrendes Motiv. Mittelstufe: zurückhaltender, erwachsener; nichts, was Jugendliche „babyhaft“ finden.

Ideen für Motive (Vorschläge, nicht Pflicht; wähle pro Design höchstens ein bis zwei):
- **Geographie:** Höhenlinien, Gradnetz/Koordinaten, Kompassrose, Maßstabsleiste, Kartenrand mit Planquadraten, Legendenkästchen.
- **Englisch:** Notizbuch/Postkarte/Briefmarke, Sprechblasen, Etiketten, Reisestempel, britische und andere englischsprachige Bezüge ohne Klischee-Überladung.
- **Informatik:** Pixelraster, Leiterbahnen, Bausteine wie in Scratch (Unterstufe), Code-Klammern und Terminal-Zeile, Binärzahlen, Flussdiagramm-Formen (Mittelstufe).

### Was das Fachdesign ändern darf

- **Kopfband:** Form, Hintergrund, ein dezentes Motiv, die Gestaltung von Symbolkreis, Blatt-Typ-Pille und Sozialform-Pille.
- **Farben:** eine Palette je Fach, aufgebaut wie die vorhandenen Rampen (100–900), Text in Kontrast nach WCAG AA.
- **Muster:** ein feines Hintergrundmuster für Seite bzw. Folie (sehr zurückhaltend, nie unter dichtem Text störend).
- **Kästen und Rahmen:** Aussehen von Hinweis, Merksatz, Aufgabennummer, Tabellenkopf, Antwortpillen, Wortspeicher.
- **Fußband:** Farbe und Form, Inhalt bleibt.

### Was gleich bleiben muss

Die Blätter der Lehrkraft gibt es schon zu Hunderten; sie dürfen sich beim Wechsel des Designs **nicht neu umbrechen**.
- Schriften bleiben: Überschriften **Caprasimo**, Text **Figtree**, mit denselben Größen und Zeilenabständen.
- A4-Seite 794 × 1123 px, Innenabstände der Seite, **12-Spalten-Raster**, Abstände zwischen Bausteinen, Höhe von Kopfband, Namenszeile und Fußband bleiben (±0 px).
- Alle Inhalte und Beschriftungen bleiben (Kicker, Titel, Blatt-Typ, Sozialform, Name/Datum, Fußzeile, Kürzel „K9 · M1 · S2“, Seitenzahl).
- Die **Blatt-Typen** müssen innerhalb jedes Fachdesigns unterscheidbar bleiben: Übung, Versuch, Sicherung, Für die Lehrkraft, Wortschatz, Grammatik, Hören, Sprechen, Test (heute über die Farbe von Kopfband, Pille und Nummernkreis).
- Englische Blätter haben englische Beschriftungen („Name · Class · Date“, „Practice“); das Design muss mit beiden Sprachen funktionieren.

### Druck: Farbe und S/W-Kopiervorlage

Jedes Design braucht eine **S/W-Fassung** für den Kopierer: keine großen Farbflächen, Muster als feine Linien (oder weg), Rahmen statt Flächen, gut lesbar nach dem Kopieren, tonersparend. Die farbige Fassung muss auf einem normalen Schulfarbdrucker gut aussehen (kein randloser Druck, keine vollflächigen dunklen Hintergründe).

### Folien (16:9, 1920 × 1080)

Zu jedem der sechs Designs ein passendes **Foliendesign**, das mit allen vorhandenen Folienarten funktioniert: Titel, Fragen (Liste), Aufgabe, Arbeitsauftrag (große Minutenzahl, Sozialform, Ich–Du–Wir-Schritte), Zitat, Aussage, Vergleich, Fließschema, Wörter, Bild, Exit/Merksatz, Leer. Dazu gehören Kopfleiste (Stunde · Klasse · Nummer, Phase, Sozialform, Minuten), Fußzeile mit Foliennummer und die **Karten**, die Lösungen bis zum Antippen verdecken (in der Phasenfarbe, mit Nummer).
- Gut lesbar am Beamer, auch in hellen Räumen; auf dem iPad mit dem Stift beschreibbar (die Stiftfarben Schwarz, Rot, Blau, Grün, Orange, Gelb, Weiß müssen auf dem Hintergrund sichtbar bleiben).
- Motive als einfache Vektorformen (SVG), damit sie auch im PowerPoint-Export funktionieren.

### Was ich von dir bekommen möchte

1. **Übersicht:** die sechs Designs nebeneinander, je ein Arbeitsblatt und eine Folie, damit man sie vergleichen kann.
2. **Je Design, Arbeitsblatt** (mit echtem Inhalt, siehe unten): eine Seite „Übung“ mit Aufgaben, Hinweis und Merksatz, dazu die Kopfbänder aller Blatt-Typen untereinander, und dieselbe Übungsseite als **S/W-Kopiervorlage**.
3. **Je Design, Folien:** Titel, Aufgabe mit Lösungskarten (zu und aufgedeckt), Arbeitsauftrag.
4. **Spezifikation** im Stil der beiliegenden `README.md`: Farbwerte als Rampen (100–900) mit Namen, welche Farbe wofür, Motive als SVG mit Maßen und Deckkraft, Maße und Radien, was sich gegenüber „Organisch“ ändert. Gern als CSS-Variablen und Klassen, die sich auf die vorhandenen Klassen setzen lassen (z. B. `.ws-page.is-f-geo.is-age-1`, `.sl-slide.is-f-geo.is-age-1`).
5. Kurze **Begründung** je Design: was es fachtypisch und altersgerecht macht und warum es nicht überladen wirkt.

### Inhalte für die Beispiele

- **Geographie 5:** „Wir orientieren uns: Kompass und Himmelsrichtungen“ (Aufgaben: Himmelsrichtungen eintragen, Karte lesen).
- **Geographie 9:** „Das Klima kippt: der Treibhauseffekt“ (wie in der beiliegenden Referenz).
- **Englisch 5:** „My family“ (Wortschatz, Lückentext mit *have got*, Sprechaufgabe).
- **Englisch 8:** „New York, New York“ (Lesetext mit Aufgaben, Simple Past / Present Perfect).
- **Informatik 6:** „Sichere Passwörter“ (Basiskurs Medienbildung: Ankreuzen, Regeln ordnen).
- **Informatik 9:** „Algorithmen: Schleifen in Python“ (Code lesen, Ablauf als Flussdiagramm, Lückentext).

### Wie es später eingebaut wird (zur Orientierung)

Die Lehrkraft wählt das Design je Modul, Vorgabe ist das Design des Fachs; die Altersstufe ergibt sich aus der Klasse. „Organisch“ bleibt als neutrales Design für alle anderen Fächer erhalten, ebenso die bisherigen Foliendesigns (Klar, Heft, Tafel, Kontrast). Der Baukasten lädt Schriften nur von Google Fonts und hat keine Bilddateien im Design: Motive also als Inline-SVG oder CSS.
