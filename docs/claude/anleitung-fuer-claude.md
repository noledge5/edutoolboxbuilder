---
name: arbeitsblatt-baukasten
description: Erstellt Stundenpakete (ein Modul mit Kompetenzraster, Stunden, Arbeitsblättern und Lehrkraft-Seiten) als JSON-Datei für den Arbeitsblatt-Baukasten. Verwenden, wenn die Lehrkraft Arbeitsblätter, Unterrichtsstunden oder eine Unterrichtseinheit für den Baukasten erstellen, umwandeln oder überarbeiten möchte.
---

# Stundenpakete für den Arbeitsblatt-Baukasten

Du erstellst Unterrichtsmaterial für eine Lehrkraft an einer Realschule in Baden-Württemberg. Das Ergebnis ist immer eine **JSON-Datei im Format „Stundenpaket“**. Die Lehrkraft öffnet sie im Arbeitsblatt-Baukasten (https://noledge5.github.io/edutoolboxbuilder/) über „Mit Claude“ → „Stundenpaket öffnen …“. Dort entsteht daraus ein Modul mit Stunden, das sie weiter bearbeitet und als Schüler- oder Lösungsfassung druckt.

## So arbeitest du

1. **Klären.** Wenn es nicht schon gesagt ist, frage kurz nach: Fach, Klasse (5–10), Thema, Zahl der Stunden, Bezug zum Bildungsplan, Besonderheiten der Klasse. Stelle höchstens drei Fragen auf einmal. Wenn genug klar ist, fang an.
2. **Material übernehmen.** Hat die Lehrkraft Material angehängt (PDF, Foto eines Arbeitsblatts, Tafelbild, alte Datei, Design-Entwurf, ein Stundenpaket aus dem Baukasten), übernimm dessen Inhalte möglichst genau und bilde sie auf die Bausteine unten ab. Bei einem Stundenpaket: ändere nur, was gewünscht ist, und behalte den Rest.
3. **Planen.** Lege zuerst die Kompetenzen mit den Niveaus G, M und E fest. Plane dann jede Stunde: eine Seite „Für die Lehrkraft“ (Ziel, Verlauf, Erwartungshorizont, Abruffragen) und ein bis drei Schülerseiten.
4. **Datei schreiben.** Erzeuge die Datei `Stundenpaket <Thema>.json` als Download (Datei oder Artefakt). Geht das nicht, gib das Paket als **einen einzigen** JSON-Codeblock aus; die Lehrkraft kann ihn im Baukasten unter „Mit Claude“ einfügen.
5. **Kurz berichten.** Nenne danach in zwei, drei Sätzen, was im Paket steckt, und was die Lehrkraft noch selbst ergänzen muss (vor allem Bilder).

## Aufbau der Datei

```json
{
  "format": "arbeitsblatt-baukasten-paket",
  "version": 1,
  "module": {
    "subject": "Geographie",
    "grade": 9,
    "number": 1,
    "title": "Das Klima kippt",
    "icon": "thermometer-sun",
    "description": "Ein Satz für die Inhaltsübersicht.",
    "competences": [
      { "id": "k1", "area": "Den Treibhauseffekt erklären", "g": "Ich kann …", "m": "Ich kann …", "e": "Ich kann …" }
    ]
  },
  "lessons": [
    { "number": 1, "title": "Der Treibhauseffekt", "pages": [ { "title": "…", "kicker": "…", "type": "uebung", "form": "allein", "nameField": "name", "blocks": [] } ] }
  ]
}
```

### `module`

| Feld | Bedeutung |
|---|---|
| `subject` | Fach, z. B. „Geographie“, „Biologie“, „Deutsch“ |
| `grade` | Klasse, Zahl von 5 bis 10 |
| `number` | Modulnummer im Fach und Jahrgang (ist sie schon vergeben, nimmt der Baukasten die nächste freie) |
| `title` | Thema des Moduls, kurz und griffig |
| `icon` | Themen-Symbol im Kopfband aller Seiten, ein Schlüssel aus der Liste „Symbole“ unten |
| `description` | Ein Satz für die Inhaltsübersicht |
| `competences` | Kompetenzraster: je Eintrag `id` (frei wählbar, z. B. `"k1"`), `area` (die Kompetenz), `g`, `m`, `e` (je ein „Ich kann …“-Satz für grundlegend, mittel, erweitert) und optional `lessons` (z. B. `"1, 2"`; sonst ermittelt der Baukasten die Stunden aus den verknüpften Aufgaben) |

Kürzel („K9 · M1 · S2“), Fußzeile und Symbol der einzelnen Seiten setzt der Baukasten selbst aus Modul und Stunde. Schreib sie nicht in die Seiten.

### `lessons`

Jede Stunde hat `number` (1, 2, 3 …), `title` und `pages`. Eine Seite ist ein A4-Blatt im Hochformat:

| Feld | Werte |
|---|---|
| `title` | Titel im Kopfband, z. B. „Versuchsprotokoll: Wärme einfangen“ (kurz, höchstens etwa 40 Zeichen) |
| `kicker` | kleine Zeile über dem Titel, z. B. „Klasse 9 · Modellversuch zum Treibhauseffekt“ |
| `type` | Blatt-Typ und Farbe: `"uebung"` (Übung), `"versuch"` (Versuch), `"sicherung"` (Sicherung, z. B. Merksätze und Schemas), `"lehrkraft"` (Für die Lehrkraft) |
| `form` | Sozialform: `"allein"`, `"zu zweit"`, `"Gruppe"`, `"Plenum"` |
| `nameField` | Zeile unter dem Kopfband: `"name"` (Name + Datum), `"namen"` (Namen + Datum, für Partner- und Gruppenarbeit), `"klasse"` (Name + Klasse + Datum), `"aus"` (keine, für Lehrkraft-Seiten) |
| `blocks` | die Bausteine der Seite, von oben nach unten |

Seiten vom Typ `"lehrkraft"` erscheinen nur in der Lösungsfassung, nicht auf den Kopien für die Klasse.

### Bausteine

Jeder Baustein ist `{ "type": "…", "span": 12, "props": { … } }`.

- `span` ist die Breite im 12er-Raster: `12` (ganz), `8` (zwei Drittel), `6` (halb), `4` (ein Drittel). Bausteine laufen wie Text von links nach rechts; `6` + `6` oder `8` + `4` stehen nebeneinander. Lässt du `span` weg, gilt die Standardbreite des Bausteins.
- Felder, die du weglässt, bekommen den Standardwert. Schreib keine Felder, die es nicht gibt; der Baukasten ignoriert sie und meldet sie.
- Aufgaben (Offene Frage, Ankreuzen, Lückentext, Tabelle, Zuordnen, Zeichenfeld) werden auf jeder Seite automatisch nummeriert. Schreib keine Nummern in den Text.

Alle Bausteine mit ihren Feldern stehen unten unter „Alle Bausteine“.

### Schreibweisen in Textfeldern

- **Listen:** eine Zeile je Eintrag, getrennt mit `\n` (Wortspeicher, Antworten, Spalten, Zeilen, Schritte). Du darfst statt eines Textes mit `\n` auch eine JSON-Liste von Texten schreiben.
- **Spalten in einer Zeile** trennst du mit ` | ` (Fließschema „Titel | Zusatz“, Tabellenlösungen, Stundenverlauf, Erwartungshorizont, Abruffragen).
- **Lücken** in Lückentext und Merksatz: `___` (drei oder mehr Unterstriche) ist eine leere Lücke, `[[Wort]]` ist eine Lücke mit Lösung. Schreib Lösungen immer mit `[[…]]`, damit die Lösungsfassung sie zeigt.
- **Ankreuzen:** die richtige Antwort bekommt ein `*` davor, z. B. `"Glas A\n*Glas B\ngleich"`. Mehrere richtige Antworten sind erlaubt.
- **Lösungen** gehören immer dazu: `solution` bei Offener Frage (Erwartung in ein, zwei Sätzen), Tabelle (eine Zeile je Tabellenzeile, Zellen mit ` | `) und Zuordnen (für jede rechte Zeile die Nummer der passenden linken, z. B. `"2, 3, 1"`). Die Schülerfassung zeigt sie nie.
- Schreib typografisch: „deutsche Anführungszeichen“, Gedankenstrich –, CO₂, °C, × und ·.

### Kompetenzen und Niveaus

Jede Aufgabe kann `level` und `competence` haben:

- `level`: `"1"` = ★ G (grundlegend), `"2"` = ★★ M (mittel), `"3"` = ★★★ E (erweitert), `""` = keine Sterne. Die Sterne sind auf dem Blatt sichtbar.
- `competence`: die `id` einer Kompetenz aus `module.competences`. Die Lösungsfassung zeigt dann „Kompetenz: … · Niveau M“, und das Kompetenzraster des Moduls listet die verknüpften Aufgaben.
- `points`: Punkte für Tests und Lernkontrollen (`0` = keine Anzeige).

Verknüpfe jede Kompetenz mit mindestens einer Aufgabe, und biete in jeder Stunde Aufgaben auf mehreren Niveaus an.

### Bilder

Du kannst keine Fotos liefern. Setze stattdessen einen Baustein `image` mit aussagekräftiger Bildunterschrift (`caption`) und, wenn bekannt, Quelle (`source`); die Lehrkraft zieht das Bild später hinein. Nur wenn du ein Bild wirklich als Datei hast (z. B. eine selbst erstellte SVG-Grafik), trag es unter `"images": { "abb1": "data:image/svg+xml;base64,…" }` ein und setze im Baustein `"image": "abb1"`.

## Platz auf der Seite

Was nicht auf die Seite passt, wird unten abgeschnitten. Eine Seite hat etwa **840 px** Platz für Bausteine, zwischen zwei Bausteinen liegen 18 px. Rechne mit diesen Höhen (volle Breite):

| Baustein | Höhe etwa |
|---|---|
| Überschrift | 25 px |
| Textblock | 22 px je Zeile (etwa 100 Zeichen je Zeile bei voller Breite, 50 bei halber) |
| Hinweis-Box, Merksatz | 90 px bei kurzem Text |
| Wortspeicher | 35 px |
| Fließschema | 120 px |
| QR-Code | 105 px |
| Abbildung | `height` + 25 px |
| Zeichenfeld | `height` + 35 px |
| Offene Frage | 35 px + 28 px je Schreiblinie |
| Ankreuzen | 70 px (die Antworten stehen nebeneinander) |
| Lückentext | 35 px + 31 px je Textzeile |
| Tabelle | 60 px + 30 px je Zeile (Kopfzeile mitgezählt) |
| Zuordnen | 35 px + 40 px je Paar |
| Ich kann … | 40 px + 37 px je Aussage |
| Ziel & Bildungsplan | 90 px |
| Stundenverlauf | 40 px + 50 px je Phase |
| Erwartungshorizont | 40 px + 60 px je Eintrag |
| Abruffragen | 40 px + 32 px je Frage |

Aufgabentexte, die über eine Zeile gehen, brauchen je weitere Zeile 22 px mehr. Plane lieber eine Seite mehr als eine volle. Bausteine nebeneinander (`6` + `6`) zählen nur einmal, mit der Höhe des höheren.

## Gute Arbeitsblätter für die Realschule

- Klare, kurze Arbeitsaufträge mit Operator am Anfang („Beschreibe …“, „Erkläre …“, „Begründe …“). Ein Auftrag je Aufgabe.
- Vom Einfachen zum Schweren: erst Reproduktion (G), dann Anwendung (M), dann Transfer und Beurteilung (E).
- Informationstexte kurz und in einfacher Sprache; Fachbegriffe im Wortspeicher oder im Merksatz sichern.
- Jede Stunde endet mit einer Sicherung (Merksatz, Fließschema, „Ich kann …“).
- Genug Schreibraum: für einen Satz zwei Linien, für eine Begründung drei bis vier.
- Die Lehrkraft-Seite nennt Ziel und Bildungsplanbezug, einen Verlauf mit Zeiten für 45 Minuten, typische Fehlvorstellungen im Erwartungshorizont und Abruffragen für den Einstieg der nächsten Stunde.

## Prüfe vor der Ausgabe

- Die Datei ist gültiges JSON (keine Kommentare, keine Kommas am Ende, Zeilenumbrüche in Texten als `\n`).
- `format` ist `"arbeitsblatt-baukasten-paket"`, `version` ist `1`.
- `icon`, `type`, `form`, `nameField`, Baustein-`type` und Felder stammen aus den Listen dieser Anleitung.
- Jede `competence` einer Aufgabe steht als `id` in `module.competences`.
- Jede Aufgabe hat eine Lösung (`[[…]]`, `*`, `solution`), wo das möglich ist.
- Keine Seite ist voller als etwa 840 px.

## Alle Bausteine

### Text & Struktur

#### `heading` · Überschrift

Zwischenüberschrift auf der Seite. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `text` | Text | Text | `"Neue Überschrift"` |

#### `text` · Textblock

Kurzer Informations- oder Materialtext. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `text` | Text | Text, mehrzeilig | `"Hier steht ein kurzer Informationstext für die Klasse."` |

#### `hint` · Hinweis-Box

Kasten mit Titel für Tipps, Sicherheitshinweise oder Einschränkungen. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Titel | Text | `"Wichtiger Hinweis"` |
| `text` | Text | Text, mehrzeilig | `"Kurzer Hinweis oder Tipp."` |
| `variant` | Farbe | `"accent-2"` (grün), `"accent"` (orange), `"neutral"` (grau) | `"accent-2"` |

#### `merksatz` · Merksatz

Hervorgehobener Merksatz zur Sicherung, gern mit Lücken. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `text` | Text (___ = Lücke, [[Wort]] = Lücke mit Lösung) | Text, mehrzeilig | `"Beobachtung + ___ = eine Erklärung, die überzeugt."` |
| `variant` | Farbe | `"accent-2"` (grün), `"accent"` (orange), `"neutral"` (grau) | `"accent-2"` |

#### `wordbank` · Wortspeicher

Begriffe als Hilfe für Lücken oder Beschriftungen. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `words` | Wörter (eins je Zeile) | Text, mehrzeilig | `"Begriff 1\nBegriff 2\nBegriff 3"` |

### Grafik & Abbildung

#### `image` · Abbildung

Platz für ein Bild mit Bildunterschrift und Quelle; die Lehrkraft fügt das Bild ein. Standardbreite: 6.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `image` | Bild | Bild-ID aus `images` | – |
| `caption` | Bildunterschrift | Text | `"Abb. 1: Bildunterschrift"` |
| `source` | Quelle | Text | – |
| `height` | Höhe in px | Zahl 40–900 | `200` |
| `fit` | Bild einpassen | `"cover"` (Füllen), `"contain"` (Ganz zeigen) | `"cover"` |

#### `flow` · Fließschema

Fließschema: Stationen nebeneinander, mit Pfeilen verbunden (bis etwa 5 Schritte). Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `steps` | Schritte (Titel \| Zusatz, eine Zeile je Schritt) | Text, mehrzeilig | `"Schritt 1 \| Zusatz\nSchritt 2\nSchritt 3"` |

#### `qr` · QR-Code

QR-Code zu einem Link (Video, Simulation, Karte). Standardbreite: 4.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `url` | Link (Adresse) | Text | `"https://"` |
| `caption` | Beschriftung | Text | `"Scanne den Code."` |

### Aufgaben

#### `open` · Offene Frage (Aufgabe, wird nummeriert)

Offene Frage mit Schreiblinien. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Beschreibe, was du beobachtest."` |
| `lines` | Anzahl Schreiblinien | Zahl 0–20 | `3` |
| `solution` | Lösung / Erwartung (für die Lösungsfassung) | Text, mehrzeilig | – |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `module.competences` | – |

#### `mc` · Ankreuzen (Aufgabe, wird nummeriert)

Ankreuzaufgabe. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Kreuze die richtige Antwort an."` |
| `options` | Antworten (eine je Zeile, richtige mit * davor) | Text, mehrzeilig | `"Antwort A\nAntwort B\nAntwort C"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `module.competences` | – |

#### `gap` · Lückentext (Aufgabe, wird nummeriert)

Lückentext. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Ergänze die Lücken."` |
| `text` | Text (___ = Lücke, [[Wort]] = Lücke mit Lösung) | Text, mehrzeilig | `"Der Treibhauseffekt ist ___ und wird durch ___ verstärkt."` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `module.competences` | – |

#### `table` · Tabelle (Aufgabe, wird nummeriert)

Tabelle zum Ausfüllen: Spaltenköpfe und die erste Spalte sind vorgegeben. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Trage deine Werte ein."` |
| `cols` | Spalten (eine je Zeile) | Text, mehrzeilig | `"Zeit\nWert A\nWert B"` |
| `rows` | Zeilen (eine je Zeile) | Text, mehrzeilig | `"0 min\n3 min\n6 min"` |
| `solution` | Lösungen (eine Zeile je Tabellenzeile, Zellen mit \| trennen) | Text, mehrzeilig | – |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `module.competences` | – |

#### `match` · Zuordnen (Aufgabe, wird nummeriert)

Zuordnen: linke und rechte Spalte werden mit Linien verbunden. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Verbinde, was zusammengehört."` |
| `left` | Linke Spalte | Text, mehrzeilig | `"Begriff A\nBegriff B\nBegriff C"` |
| `right` | Rechte Spalte | Text, mehrzeilig | `"Erklärung 2\nErklärung 3\nErklärung 1"` |
| `solution` | Lösung: Nummer der linken Zeile für jede rechte (z. B. 2, 3, 1) | Text | – |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `module.competences` | – |

#### `draw` · Zeichenfeld (Aufgabe, wird nummeriert)

Feld zum Zeichnen, Beschriften oder Rechnen. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Zeichne eine Skizze."` |
| `height` | Höhe in px | Zahl 40–900 | `160` |
| `pattern` | Hintergrund | `"leer"` (Leer), `"karo"` (Karo), `"linien"` (Linien), `"punkte"` (Punkte) | `"leer"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `module.competences` | – |

#### `selfcheck` · Ich kann …

Selbsteinschätzung „Ich kann …“ mit Smileys, am Ende einer Stunde. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"Das kann ich jetzt"` |
| `items` | Aussagen (eine je Zeile) | Text, mehrzeilig | `"Ich kann den Treibhauseffekt mit eigenen Worten erklären.\nIch kan…"` |

### Für die Lehrkraft

#### `plan` · Stundenverlauf

Nur Lehrkraft-Seite: Stundenverlauf als Tabelle. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `rows` | Phasen (je Zeile: Zeit \| Phase \| Ablauf \| Sozialform \| Material) | Text, mehrzeilig | `"0–5 \| Abrufphase \| 3 Fragen aus dem Gedächtnis ins Lernjournal, da…"` |

#### `goal` · Ziel & Bildungsplan

Nur Lehrkraft-Seite: Ziel der Stunde und Bildungsplanbezug. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `goal` | Ziel der Stunde | Text, mehrzeilig | `"Die Klasse erarbeitet den Mechanismus des Treibhauseffekts (Modell…"` |
| `curriculum` | Bildungsplan | Text, mehrzeilig | `"3.2.2.3 (1) · prozessbezogen: Modelle nutzen und kritisch reflekti…"` |

#### `expect` · Erwartungshorizont

Nur Lehrkraft-Seite: Erwartungshorizont mit typischen Schüleraussagen und ihrer Bewertung. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `items` | Einträge (je Zeile: Richtig/Falsch/Vorsicht \| Schüleraussage \| Erklärung) | Text, mehrzeilig | `"Falsch \| „Treibhausgase heizen die Luft direkt auf.“ \| Sie erzeuge…"` |

#### `recall` · Abruffragen

Nur Lehrkraft-Seite: Abruffragen mit Antworten, z. B. für den Einstieg. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"Abrufphase — die drei Fragen"` |
| `items` | Fragen (je Zeile: Frage \| Antwort) | Text, mehrzeilig | `"Welche Einheit hat der CO₂-Wert in unserer Kurve? \| ppm\nReicht ei…"` |
| `answers` | Antworten zeigen | `"immer"` (Immer), `"loesung"` (Nur in der Lösungsfassung) | `"immer"` |

## Symbole

Schlüssel für `module.icon`, mit Bedeutung:

- `thermometer-sun`: Klima (temperatur, treibhaus, wärme)
- `sun`: Sonne (energie, licht)
- `cloud-sun-rain`: Wetter
- `cloud-rain`: Niederschlag (regen, wasserkreislauf)
- `wind`: Wind (luft, atmosphäre)
- `snowflake`: Eis (schnee, kälte, gletscher, polar)
- `earth`: Erde (planet, welt)
- `globe`: Globus (welt, länder)
- `map`: Karte (atlas, geographie)
- `compass`: Kompass (orientierung, himmelsrichtung)
- `map-pin`: Ort (lage, standort)
- `mountain`: Gebirge (berg, alpen, relief, vulkan)
- `waves`: Meer (ozean, küste, wasser)
- `droplets`: Wasser (fluss, trinkwasser)
- `pickaxe`: Rohstoffe (bergbau, gestein)
- `leaf`: Pflanzen (biologie, blatt)
- `sprout`: Wachstum (keimung, samen)
- `tree-pine`: Wald (baum, ökosystem)
- `flower-2`: Blüte (blume, bestäubung)
- `bug`: Insekten (käfer, tiere)
- `fish`: Fische (tiere, wasser)
- `bird`: Vögel (tiere)
- `paw-print`: Tiere (säugetiere, zoologie)
- `dna`: Genetik (vererbung, zelle)
- `microscope`: Mikroskop (zelle, untersuchen)
- `heart-pulse`: Körper (herz, kreislauf, gesundheit)
- `brain`: Gehirn (nerven, lernen)
- `stethoscope`: Gesundheit (medizin, krankheit)
- `apple`: Ernährung (essen, obst)
- `salad`: Lebensmittel (essen, kochen)
- `wheat`: Landwirtschaft (getreide, ernte)
- `recycle`: Umwelt (nachhaltigkeit, müll, recycling)
- `atom`: Physik (teilchen)
- `flask-conical`: Chemie (versuch, labor)
- `magnet`: Magnetismus
- `zap`: Elektrizität (strom, energie)
- `flame`: Feuer (verbrennung, wärme)
- `lightbulb`: Idee (licht, erfindung)
- `rocket`: Raumfahrt (weltall)
- `telescope`: Astronomie (sterne, weltall)
- `moon`: Mond (nacht, weltall)
- `laptop`: Computer (informatik, medien)
- `code`: Programmieren (informatik)
- `factory`: Industrie (fabrik, wirtschaft)
- `tractor`: Traktor (landwirtschaft)
- `train`: Verkehr (bahn, mobilität)
- `ship`: Handel (schiff, hafen)
- `plane`: Reisen (flugzeug, tourismus)
- `anchor`: Hafen (seefahrt)
- `calculator`: Rechnen (mathe)
- `sigma`: Mathematik (summe, formel)
- `ruler`: Messen (geometrie, länge)
- `shapes`: Geometrie (formen, körper)
- `chart-column`: Diagramm (statistik, daten)
- `chart-pie`: Anteile (prozent, bruch, statistik)
- `landmark`: Staat (politik, demokratie, antike)
- `vote`: Wahlen (politik, demokratie)
- `scale`: Recht (gerechtigkeit, gesetz)
- `users`: Gesellschaft (gemeinschaft, gruppe)
- `handshake`: Zusammenarbeit (frieden, vertrag)
- `coins`: Wirtschaft (geld, finanzen)
- `briefcase`: Beruf (arbeit, berufsorientierung)
- `building-2`: Stadt (urbanisierung)
- `hourglass`: Zeit (geschichte, epoche)
- `scroll`: Quellen (geschichte, urkunde)
- `castle`: Mittelalter (burg, geschichte)
- `crown`: Herrschaft (könig, absolutismus)
- `sword`: Konflikt (krieg, geschichte)
- `church`: Religion (glaube, ethik, kirche)
- `newspaper`: Medien (zeitung, nachrichten)
- `book-open`: Lesen (deutsch, literatur, buch)
- `pen-line`: Schreiben (deutsch, aufsatz)
- `languages`: Sprachen (englisch, französisch)
- `messages-square`: Diskussion (gespräch, kommunikation)
- `palette`: Kunst (malen, farbe)
- `camera`: Foto (bild, medien)
- `clapperboard`: Film (video, medien)
- `drama`: Theater (schauspiel)
- `music`: Musik (lied, noten)
- `dumbbell`: Sport (fitness, training)
- `bike`: Fahrrad (verkehr, sport)
- `trophy`: Wettbewerb (sieg, sport)
- `graduation-cap`: Abschluss (prüfung, schule)
- `puzzle`: Rätsel (knobeln)
- `target`: Ziel (lernziel)
- `clock`: Uhr (zeit)
- `calendar`: Kalender (termin, jahr)

## Beispiel

Ein vollständiges Stundenpaket mit einer Stunde: Lehrkraft-Seite, Versuchsprotokoll und Sicherung. Felder mit Standardwert sind weggelassen.

```json
{
  "format": "arbeitsblatt-baukasten-paket",
  "version": 1,
  "module": {
    "subject": "Geographie",
    "grade": 9,
    "number": 1,
    "title": "Das Klima kippt",
    "icon": "thermometer-sun",
    "description": "Vom Zusammenhang zwischen CO₂ und Temperatur zum Mechanismus des Treibhauseffekts.",
    "competences": [
      {
        "id": "k1",
        "area": "Klimadiagramme und Kurven auswerten",
        "g": "Ich kann Werte aus einer Kurve ablesen.",
        "m": "Ich kann beschreiben, wie sich CO₂ und Temperatur entwickeln.",
        "e": "Ich kann begründen, warum ein zeitlicher Zusammenhang noch keine Ursache beweist."
      },
      {
        "id": "k2",
        "area": "Den Treibhauseffekt erklären",
        "g": "Ich kann die Stationen des Fließschemas nennen.",
        "m": "Ich kann den Treibhauseffekt mit dem Fließschema erklären.",
        "e": "Ich kann natürlichen und zusätzlichen Treibhauseffekt vergleichen."
      },
      {
        "id": "k3",
        "area": "Mit Modellen arbeiten",
        "g": "Ich kann den Modellversuch durchführen und Werte notieren.",
        "m": "Ich kann das Ergebnis des Versuchs deuten.",
        "e": "Ich kann erklären, was das Modell zeigt und was nicht."
      }
    ]
  },
  "lessons": [
    {
      "number": 1,
      "title": "Der Treibhauseffekt",
      "pages": [
        {
          "title": "Der Treibhauseffekt",
          "kicker": "Klasse 9 · Stundenverlauf",
          "type": "lehrkraft",
          "form": "Plenum",
          "nameField": "aus",
          "blocks": [
            {
              "type": "goal",
              "span": 12,
              "props": {}
            },
            {
              "type": "plan",
              "span": 12,
              "props": {}
            },
            {
              "type": "expect",
              "span": 12,
              "props": {}
            },
            {
              "type": "recall",
              "span": 12,
              "props": {}
            }
          ]
        },
        {
          "title": "Versuchsprotokoll: Wärme einfangen",
          "kicker": "Klasse 9 · Modellversuch zum Treibhauseffekt",
          "type": "versuch",
          "form": "zu zweit",
          "nameField": "namen",
          "blocks": [
            {
              "type": "heading",
              "span": 12,
              "props": {
                "text": "Aufbau"
              }
            },
            {
              "type": "text",
              "span": 7,
              "props": {
                "text": "Zwei gleiche Gläser, je ein Thermometer. Glas A bleibt offen. Glas B wird mit Klarsichtfolie verschlossen. Beide stehen gleich weit von der Lampe entfernt."
              }
            },
            {
              "type": "image",
              "span": 5,
              "props": {
                "caption": "Abb. 1: Versuchsaufbau",
                "height": 90
              }
            },
            {
              "type": "mc",
              "span": 12,
              "props": {
                "prompt": "Unsere Vorhersage: Welches Glas wird nach 15 Minuten wärmer sein?",
                "options": "Glas A\n*Glas B\ngleich",
                "level": "1",
                "competence": "k3"
              }
            },
            {
              "type": "table",
              "span": 12,
              "props": {
                "prompt": "Messwerte",
                "cols": "Zeit\nGlas A (offen)\nGlas B (Folie)\nUnterschied",
                "rows": "0 min (Start)\n3 min\n6 min\n9 min\n12 min\n15 min",
                "level": "1",
                "competence": "k3"
              }
            },
            {
              "type": "open",
              "span": 12,
              "props": {
                "prompt": "Welches Glas war am Ende wärmer, und um wie viel?",
                "lines": 1,
                "solution": "Glas B (mit Folie), um einige Grad.",
                "level": "2",
                "competence": "k1"
              }
            },
            {
              "type": "open",
              "span": 12,
              "props": {
                "prompt": "Warum, glaubt ihr, war das so?",
                "lines": 2,
                "solution": "Die Folie hält die Wärmestrahlung zurück, die Luft im Glas kühlt langsamer ab.",
                "level": "3",
                "competence": "k3"
              }
            },
            {
              "type": "hint",
              "span": 12,
              "props": {
                "text": "Dieser Versuch zeigt nur das allgemeine Prinzip — eine Barriere hält Wärmestrahlung zurück. Er beweist nicht, dass genau CO₂ das tut."
              }
            }
          ]
        },
        {
          "title": "Fließschema: Der Treibhauseffekt",
          "kicker": "Klasse 9 · Sicherung fürs Lernjournal",
          "type": "sicherung",
          "form": "allein",
          "nameField": "name",
          "blocks": [
            {
              "type": "flow",
              "span": 12,
              "props": {
                "steps": "Sonnenstrahlung | (kurzwellig)\nErdoberfläche | erwärmt sich\nWärmestrahlung | (langwellig)\nTreibhausgase | CO₂, Methan, Wasserdampf"
              }
            },
            {
              "type": "draw",
              "span": 12,
              "props": {
                "prompt": "Von den Treibhausgasen aus geht es in zwei Richtungen weiter. Zeichnet beide Pfeile ein: ein Teil entweicht … ein Teil wird zurückgestrahlt zur …",
                "height": 130,
                "level": "2",
                "competence": "k2"
              }
            },
            {
              "type": "wordbank",
              "span": 12,
              "props": {
                "words": "Weltall\nErdoberfläche\nzusätzliche Erwärmung"
              }
            },
            {
              "type": "heading",
              "span": 12,
              "props": {
                "text": "Zwei Begriffe, ein Unterschied"
              }
            },
            {
              "type": "gap",
              "span": 6,
              "props": {
                "prompt": "natürlicher Treibhauseffekt",
                "text": "notwendig — ohne ihn läge die Erde bei etwa [[−18]] °C.",
                "level": "1",
                "competence": "k2"
              }
            },
            {
              "type": "gap",
              "span": 6,
              "props": {
                "prompt": "zusätzlicher Treibhauseffekt",
                "text": "von Menschen verursacht — seit etwa [[1850]] messbar.",
                "level": "3",
                "competence": "k2"
              }
            },
            {
              "type": "merksatz",
              "span": 12,
              "props": {
                "text": "Beobachtung + [[Mechanismus]] = eine Erklärung, die überzeugt."
              }
            },
            {
              "type": "selfcheck",
              "span": 12,
              "props": {}
            }
          ]
        }
      ]
    }
  ]
}
```
