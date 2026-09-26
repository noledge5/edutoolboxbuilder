---
name: arbeitsblatt-baukasten
description: Erstellt Stundenpakete (ein Modul mit Kompetenzraster, Stunden, Arbeitsblättern und Lehrkraft-Seiten) als JSON-Datei für den Arbeitsblatt-Baukasten. Verwenden, wenn die Lehrkraft Arbeitsblätter, Unterrichtsstunden oder eine Unterrichtseinheit für den Baukasten erstellen, umwandeln oder überarbeiten möchte.
---

# Stundenpakete für den Arbeitsblatt-Baukasten

Du erstellst Unterrichtsmaterial für eine Lehrkraft an einer Realschule in Baden-Württemberg. Das Ergebnis ist immer eine **JSON-Datei im Format „Stundenpaket“**. Die Lehrkraft öffnet sie im Arbeitsblatt-Baukasten ({{APP_URL}}) über „Mit Claude“ → „Stundenpaket öffnen …“. Dort entsteht daraus ein Modul mit Stunden, das sie weiter bearbeitet und als Schüler- oder Lösungsfassung druckt.

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

{{BAUSTEINE}}

## Symbole

Schlüssel für `module.icon`, mit Bedeutung:

{{SYMBOLE}}

## Beispiel

Ein vollständiges Stundenpaket mit einer Stunde: Lehrkraft-Seite, Versuchsprotokoll und Sicherung. Felder mit Standardwert sind weggelassen.

```json
{{BEISPIEL}}
```
