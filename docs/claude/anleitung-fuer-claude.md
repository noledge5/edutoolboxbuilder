---
name: arbeitsblatt-baukasten
description: Erstellt Stundenpakete und Jahrespläne als JSON-Datei für den Arbeitsblatt-Baukasten, auch für Englisch mit Vokabeln, Grammatik, Hör- und Lesetexten, Sprechen, Schreiben und Klassenarbeiten. Verwenden, wenn eine Lehrkraft Arbeitsblätter, Unterrichtsstunden, Units, Module oder einen Jahresplan für den Baukasten erstellen, umwandeln oder überarbeiten möchte.
---

# Stundenpakete für den Arbeitsblatt-Baukasten

Du erstellst Unterrichtsmaterial für eine Lehrkraft an einer Realschule in Baden-Württemberg, zum Beispiel für Englisch oder Geographie. Das Ergebnis ist immer eine **JSON-Datei im Format „Stundenpaket“**. Die Lehrkraft öffnet sie im Arbeitsblatt-Baukasten (https://noledge5.github.io/edutoolboxbuilder/) unter „Mit Claude“. Dort entstehen daraus Module mit Stunden und Arbeitsblättern, die sie weiter bearbeitet, druckt (Schüler- oder Lösungsfassung, Farbe oder S/W) und im Jahresplan sieht.

## Was du erstellen kannst

- **Eine Stunde oder ein ganzes Modul** (eine Unit): Kompetenzraster, Lehrkraft-Seite und Schülerblätter für jede Stunde.
- **Einen Jahresplan**: alle Module (Units) eines Fachs und Jahrgangs mit Lehrwerksbezug und Dauer in Schulwochen, auf Wunsch mit den ersten Stunden. Der Baukasten verteilt die Module auf die Schulwochen und überspringt die Ferien.
- **Eine Überarbeitung**: Die Lehrkraft kann ein Modul oder ihren Jahresplan aus dem Baukasten als Stundenpaket sichern und dir geben. Ändere dann nur, was sie möchte, und gib das ganze Paket zurück.

## So arbeitest du

1. **Klären.** Frage kurz nach, was fehlt: Fach, Klasse (5–10), Thema bzw. Unit, Lehrwerk (z. B. Green Line, Access, Red Line) mit Unit und Seiten, Zahl der Stunden, Besonderheiten der Klasse. Bei einem Jahresplan außerdem: Stunden pro Woche und welche Units in welcher Reihenfolge. Stelle höchstens drei Fragen auf einmal; wenn genug klar ist, fang an.
2. **Material übernehmen.** Hat die Lehrkraft Material angehängt (PDF, Foto eines Arbeitsblatts, Tafelbild, Lehrwerksseite, Jahresplan, Stundenpaket), übernimm dessen Inhalte möglichst genau und bilde sie auf die Bausteine unten ab. Erfinde keine Seitenzahlen des Lehrwerks: Nenne nur die Unit, wenn du die Seiten nicht aus ihrem Material kennst.
3. **Planen.** Lege zuerst die Kompetenzen fest (G, M, E, mit Bereich aus dem Bildungsplan). Plane dann jede Stunde: eine Seite „Für die Lehrkraft“ (Ziel, Verlauf, Erwartungshorizont, Abruffragen) und ein bis drei Schülerseiten.
4. **Datei schreiben.** Erzeuge `Stundenpaket <Thema>.json` bzw. `Jahresplan <Fach> <Klasse>.json` als Download (Datei oder Artefakt). Geht das nicht, gib das Paket als **einen einzigen** JSON-Codeblock aus. Die Lehrkraft kann ihn im Baukasten unter „Mit Claude“ einfügen.
5. **Kurz berichten.** Nenne in zwei, drei Sätzen, was im Paket steckt und was die Lehrkraft noch ergänzen muss (vor allem Bilder, Audiodateien und Seitenzahlen).

## Aufbau der Datei

```json
{
  "format": "arbeitsblatt-baukasten-paket",
  "version": 2,
  "modules": [
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 1,
      "title": "Hello, school!",
      "icon": "school",
      "lang": "en",
      "help": true,
      "textbook": "Green Line 1, Unit 1",
      "weeks": 5,
      "description": "Ein Satz für die Inhaltsübersicht.",
      "competences": [
        { "id": "k1", "domain": "Sprachliche Mittel: Wortschatz", "area": "Wörter rund um die Schule", "g": "Ich kann …", "m": "Ich kann …", "e": "Ich kann …" }
      ],
      "lessons": [
        { "number": 1, "title": "Hello, I’m …", "textbook": "SB S. 10–11", "pages": [ { "title": "…", "kicker": "…", "type": "vocab", "form": "allein", "nameField": "name", "blocks": [] } ] }
      ]
    }
  ]
}
```

Ein Paket enthält ein oder mehrere Module. Optional steht davor `"schoolYear"` (siehe „Jahresplan“).

### Ein Modul (`modules[…]`)

| Feld | Bedeutung |
|---|---|
| `subject` | Fach, z. B. „Englisch“, „Geographie“, „Biologie“ |
| `grade` | Klasse, Zahl von 5 bis 10 |
| `number` | Modulnummer im Fach und Jahrgang, bei Units meist die Unit-Nummer (ist sie vergeben, nimmt der Baukasten die nächste freie) |
| `title` | Thema des Moduls, kurz und griffig |
| `icon` | Themen-Symbol im Kopfband aller Seiten, ein Schlüssel aus der Liste „Symbole“ |
| `lang` | Sprache der Arbeitsblätter: `"en"` für Englisch, sonst `"de"` (Standard bei anderen Fächern) |
| `help` | `true`: Die deutsche Hilfe (`help` einer Aufgabe) steht klein unter dem englischen Arbeitsauftrag. `false` blendet sie im ganzen Modul aus. |
| `textbook` | Lehrwerksbezug, z. B. „Green Line 1, Unit 2, S. 34–51“ |
| `weeks` | Dauer in Schulwochen für den Jahresplan (`0` = nicht eingeplant) |
| `start` | optional: erster Tag, z. B. `"2027-01-11"`; ohne `start` folgt das Modul direkt auf das vorige |
| `description` | ein Satz für die Inhaltsübersicht |
| `competences` | Kompetenzraster (siehe „Kompetenzen und Niveaus“) |
| `lessons` | die Stunden; darf bei einem reinen Jahresplan fehlen |

Kürzel („K5 · M1 · S2“), Fußzeile und Symbol der einzelnen Seiten setzt der Baukasten selbst. Schreib sie nicht in die Seiten.

### Stunden und Seiten

Jede Stunde hat `number` (1, 2, 3 …), `title`, optional `textbook` (Seiten im Schülerbuch und Workbook, z. B. „SB S. 36–37, WB S. 20“) und `pages`. Eine Seite ist ein A4-Blatt im Hochformat:

| Feld | Werte |
|---|---|
| `title` | Titel im Kopfband, kurz (höchstens etwa 40 Zeichen) |
| `kicker` | kleine Zeile über dem Titel, z. B. „Class 5 · Unit 1“ oder „Klasse 9 · Modellversuch zum Treibhauseffekt“ |
| `type` | Blatt-Typ, bestimmt die Farbe und die Aufschrift im Kopfband (siehe unten) |
| `form` | Sozialform: `"allein"`, `"zu zweit"`, `"Gruppe"`, `"Plenum"` (auf englischen Blättern gedruckt als „on your own“, „in pairs“, „in groups“, „whole class“) |
| `nameField` | Zeile unter dem Kopfband: `"name"` (Name + Datum), `"namen"` (für Partner- und Gruppenarbeit), `"klasse"` (Name + Klasse + Datum, gut für Tests), `"aus"` (keine, für Lehrkraft-Seiten) |
| `blocks` | die Bausteine der Seite, von oben nach unten |

Blatt-Typen:

| `type` | Aufschrift (deutsch / englisch) | wofür |
|---|---|---|
| `uebung` | Übung / Practice | Übungen aller Art |
| `versuch` | Versuch / Experiment | Versuche, Beobachtungen (Sachfächer) |
| `sicherung` | Sicherung / Summary | Merksätze, Schemas, Zusammenfassungen |
| `vocab` | Wortschatz / Vocabulary | Vokabeln, Wortfelder |
| `grammar` | Grammatik / Grammar | Regeln und Übungen zur Grammatik |
| `listening` | Hören / Listening | Hör- und Lesetexte mit Aufgaben |
| `speaking` | Sprechen / Speaking | Dialoge, Rollenspiele, Schreibaufgaben |
| `test` | Test | Tests und Klassenarbeiten |
| `lehrkraft` | Für die Lehrkraft | Ziel, Verlauf, Erwartungshorizont; keine Seitenzahl, nur in der Lösungsfassung gedruckt |

### Bausteine

Jeder Baustein ist `{ "type": "…", "span": 12, "props": { … } }`.

- `span` ist die Breite im 12er-Raster: `12` (ganz), `8` (zwei Drittel), `6` (halb), `4` (ein Drittel). Bausteine laufen wie Text von links nach rechts; `6` + `6` oder `8` + `4` stehen nebeneinander. Ohne `span` gilt die Standardbreite.
- Felder, die du weglässt, bekommen den Standardwert. Schreib keine Felder, die es nicht gibt; der Baukasten ignoriert sie und meldet sie.
- Aufgaben werden auf jeder Seite automatisch nummeriert. Schreib keine Nummern in den Text.

Alle Bausteine mit ihren Feldern stehen unten unter „Alle Bausteine“.

### Schreibweisen in Textfeldern

- **Listen:** eine Zeile je Eintrag, getrennt mit `\n` (Wörter, Antworten, Spalten, Zeilen). Statt eines Textes mit `\n` darfst du auch eine JSON-Liste von Texten schreiben.
- **Spalten in einer Zeile** trennst du mit ` | ` (Vokabelliste, Tabellenlösungen, Redemittel, Stundenverlauf …).
- **Lücken:** `___` (drei oder mehr Unterstriche) ist eine leere Lücke, `[[Wort]]` eine Lücke mit Lösung. Schreib Lösungen immer mit `[[…]]`, damit die Lösungsfassung sie zeigt. Das gilt in Lückentext, Merksatz, Formentabelle, Satzbaustellen, Wortnetz und Rollenkarten.
- **Markieren:** `{{…}}` hebt einen Teil farbig hervor, z. B. `She play{{s}} football.` oder `I {{am}}`. Das geht in Grammatik-Box, Formentabelle, Textblock, Hinweis-Box, Lesetext, Lückentext und in den Beispielsätzen der Vokabelliste.
- **Ankreuzen:** die richtige Antwort bekommt ein `*` davor, z. B. `"Glas A\n*Glas B\ngleich"`.
- **Richtig/Falsch:** je Aussage `Aussage | T`, `| F` oder `| NG` (not in the text).
- **Wörter ordnen:** der richtige Satz (der Baukasten mischt die Wörter selbst) oder vorbereitete Teile mit Lösung: `school / I / to / go = I go to school.`
- **Lösungen** gehören immer dazu: `solution` bei Offener Frage und Sprachmittlung (Erwartung in ein, zwei Sätzen), Tabelle (eine Zeile je Tabellenzeile, Zellen mit ` | `) und Zuordnen (für jede rechte Zeile die Nummer der passenden linken, z. B. `"2, 3, 1"`). Die Schülerfassung zeigt sie nie.
- Schreib typografisch. Deutsch: „Anführungszeichen“, Gedankenstrich –. Englisch: “quotation marks”, Apostroph ’ (I’m). Gerade Anführungszeichen setzt der Baukasten passend zur Sprache um.

### Kompetenzen und Niveaus

Jedes Modul hat ein Kompetenzraster: je Eintrag `id` (frei wählbar, z. B. `"k1"`), `domain` (Bereich des Bildungsplans), `area` (die Kompetenz), `g`, `m`, `e` (je ein „Ich kann …“-Satz für grundlegend, mittel, erweitert) und optional `lessons` (z. B. `"1, 2"`; sonst ermittelt der Baukasten die Stunden aus den verknüpften Aufgaben).

Bereiche für Fremdsprachen (Bildungsplan BW), genau so schreiben:

- Hör-/Hörsehverstehen
- Leseverstehen
- Sprechen – an Gesprächen teilnehmen
- Sprechen – zusammenhängendes monologisches Sprechen
- Schreiben
- Sprachmittlung
- Sprachliche Mittel: Wortschatz
- Sprachliche Mittel: Grammatik
- Sprachliche Mittel: Aussprache und Intonation
- Sprachliche Mittel: Orthografie
- Interkulturelle kommunikative Kompetenz
- Text- und Medienkompetenz

In anderen Fächern ist `domain` frei, z. B. „Erkenntnisgewinnung“, „Kommunikation“, „Bewertung“.

Jede Aufgabe kann außerdem haben:

- `level`: `"1"` = ★ G (grundlegend), `"2"` = ★★ M (mittel), `"3"` = ★★★ E (erweitert), `""` = keine Sterne. Die Sterne sind auf dem Blatt sichtbar.
- `competence`: die `id` einer Kompetenz aus demselben Modul. Die Lösungsfassung zeigt dann „Kompetenz: … · Niveau M“, und das Kompetenzraster listet die verknüpften Aufgaben.
- `points` und `langPoints`: Punkte für Tests. Mit `langPoints` werden Inhalt (`points`) und Sprache (`langPoints`) getrennt ausgewiesen, wie in Klassenarbeiten üblich.
- `help`: deutsche Hilfe unter einem englischen Arbeitsauftrag (siehe „Englisch“).
- `tip`: ein Tipp. Der Baustein „Tippkarten“ sammelt alle Tipps eines Arbeitsblatts als Karten zum Ausschneiden; die Aufgabe zeigt ein kleines Glühbirnen-Zeichen.

Verknüpfe jede Kompetenz mit mindestens einer Aufgabe, und biete in jeder Stunde Aufgaben auf mehreren Niveaus an.

## Englisch

- **Sprache:** `"lang": "en"` für das ganze Modul. Kopfzeile, Blatt-Typ und Sozialform erscheinen dann auf Englisch („Name · Class · Date“, „Vocabulary“, „in pairs“), Rechtschreibprüfung und Silbentrennung laufen auf Englisch. Lehrkraft-Seiten, Notenschlüssel und Kompetenzangaben bleiben deutsch.
- **Arbeitsaufträge** schreibst du auf Englisch, kurz, mit Operator am Anfang („Read …“, „Complete …“, „Match …“, „Tick …“, „Write …“). In Klasse 5 und 6 bekommt jede Aufgabe eine deutsche Hilfe in `help` („Lies den Text und kreuze an.“). Ab Klasse 7 nur noch bei schwierigen Aufträgen.
- **Kicker** auf Englisch: „Class 5 · Unit 1“, auf Lehrkraft-Seiten deutsch: „Klasse 5 · Stundenverlauf“.
- **Vokabeln** mit Lautschrift (IPA, britisches Englisch, ohne Klammern: `bɔːd`, `ˈpensl keɪs`) und einem kurzen Beispielsatz. Deutsche Bedeutungen wie im Lehrwerk, mehrere mit Komma.
- **Aufbau einer Unit:** Lead-in, neue Wörter, Grammatik entdecken und üben, Hören/Lesen, Sprechen/Schreiben, Revision, zum Schluss Test oder Klassenarbeit. Wähle die Blatt-Typen `vocab`, `grammar`, `listening`, `speaking`, `test`.
- **Hören:** Den Hörtext hat die Lehrkraft im Lehrwerk. Nenne im Baustein „Hörverstehen“ den Track (`track`), die Phase (`stage`: pre, while, post) und schreib ein kurzes Transkript nur, wenn du es aus ihrem Material kennst. Eine `url` nur, wenn die Lehrkraft einen Link gegeben hat.
- **Tests und Klassenarbeiten:** Blatt-Typ `test`, `nameField` `"klasse"`, Punkte an jeder Aufgabe (bei freien Schreibaufgaben `points` für den Inhalt und `langPoints` für die Sprache), am Ende der Baustein „Notenschlüssel“. Er zählt die Punkte aller Aufgaben der Stunde. Lege eine Klassenarbeit deshalb als eigene Stunde an.
- **Differenzierung:** Niveausterne, Tipps (`tip`) und der Baustein „Tippkarten“ auf einer eigenen Seite oder am Seitenende.

## Jahresplan

Für einen Jahresplan schreibst du ein Paket mit allen Modulen des Jahrgangs, je mit `number`, `title`, `icon`, `textbook`, `weeks` und `competences` (die Stunden dürfen fehlen). Die Summe der `weeks` sollte die Zahl der Schulwochen nicht übersteigen; plane ein bis zwei Wochen Puffer ein.

Der Baukasten kennt das Schuljahr 2026/27 in Baden-Württemberg (39 Schulwochen):

| Ferien | von | bis |
|---|---|---|
| Herbstferien | 26.10.2026 | 31.10.2026 |
| Weihnachtsferien | 23.12.2026 | 09.01.2027 |
| Osterferien | 26.03.2027 | 03.04.2027 |
| Christi Himmelfahrt | 06.05.2027 | 06.05.2027 |
| Pfingstferien | 17.05.2027 | 29.05.2027 |

Erster Schultag: 14.09.2026, letzter Schultag: 28.07.2027.

Für ein anderes Schuljahr oder Bundesland gib `schoolYear` mit (nur mit Daten, die du sicher kennst, z. B. aus dem Material der Lehrkraft oder von der Seite des Kultusministeriums):

```json
"schoolYear": { "name": "2026/27", "start": "2026-09-14", "end": "2027-07-28", "holidays": [ { "name": "Herbstferien", "from": "2026-10-26", "to": "2026-10-31" } ] }
```

## Bilder

Du kannst keine Fotos liefern. Setze stattdessen einen Baustein „Abbildung“ mit aussagekräftiger Bildunterschrift (`caption`) und, wenn bekannt, Quelle (`source`); die Lehrkraft zieht das Bild später hinein. In „Bild-Vokabeln“ nimmst du Emojis (`🐶 | dog`), die die Lehrkraft durch eigene Bilder ersetzen kann. Nur wenn du ein Bild wirklich als Datei hast (z. B. eine selbst erstellte SVG-Grafik), trag es unter `"images": { "abb1": "data:image/svg+xml;base64,…" }` ein und setze im Baustein `"image": "abb1"`.

## Platz auf der Seite

Was nicht auf die Seite passt, wird unten abgeschnitten. Eine Seite hat etwa **840 px** Platz für Bausteine, zwischen zwei Bausteinen liegen 18 px. Rechne mit diesen Höhen (volle Breite; eine Aufgabe braucht 35 px für den Auftrag, mit deutscher Hilfe 18 px mehr):

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
| Vokabelliste | 65 px + 32 px je Wort |
| Knick-Vokabeltest | 35 px + 33 px je Wort |
| Bild-Vokabeln | 35 px + (Bildhöhe + 32 px) je Bildreihe |
| Wortnetz | `height` + 35 px |
| Grammatik-Box | 70 px + 25 px je Zeile (Regel, Signalwörter, jedes Beispiel) |
| Formentabelle | 80 px + 33 px je Zeile |
| Wörter ordnen | 35 px + 64 px je Satz |
| Umformen | 35 px + 56 px je Satz |
| Satzbaustellen | 65 px + 42 px je Zeile |
| Hörverstehen | 70 px (mit QR-Code 85 px) |
| Lesetext | 60 px + 22 px je Zeile (etwa 105 Zeichen je Zeile) |
| Richtig / Falsch | 65 px + 37 px je Aussage |
| Redemittel | 60 px + 33 px je Zeile |
| Rollenkarten | 45 px + 28 px je Zeile der längeren Karte |
| Bingo / Find someone who | 35 px + 80 px je Reihe |
| Schreibrahmen | 35 px + 32 px je Satzanfang; Checkliste 40 px + 22 px je Punkt |
| Sprachmittlung | 70 px + 22 px je Zeile der Vorlage + 28 px je Schreiblinie |
| Ich kann … | 40 px + 37 px je Aussage |
| Notenschlüssel | 145 px |
| Tippkarten | 70 px je Reihe von Karten |
| Ziel & Bildungsplan | 90 px |
| Stundenverlauf | 40 px + 50 px je Phase |
| Erwartungshorizont | 40 px + 60 px je Eintrag |
| Abruffragen | 40 px + 32 px je Frage |

Aufgabentexte, die über eine Zeile gehen, brauchen je weitere Zeile 22 px mehr. Plane lieber eine Seite mehr als eine volle. Bausteine nebeneinander (`6` + `6`) zählen nur einmal, mit der Höhe des höheren.

## Gute Arbeitsblätter für die Realschule

- Klare, kurze Arbeitsaufträge mit Operator am Anfang. Ein Auftrag je Aufgabe.
- Vom Einfachen zum Schweren: erst Reproduktion (G), dann Anwendung (M), dann Transfer und Beurteilung (E).
- Informationstexte kurz und in einfacher Sprache; neue Wörter im Wortspeicher, in der Vokabelliste oder im Glossar des Lesetexts sichern.
- Jede Stunde endet mit einer Sicherung (Merksatz, Grammatik-Box, Fließschema, „Ich kann …“).
- Genug Schreibraum: für einen Satz zwei Linien, für eine Begründung drei bis vier.
- Die Lehrkraft-Seite nennt Ziel und Bildungsplanbezug, einen Verlauf mit Zeiten für 45 Minuten, typische Fehler im Erwartungshorizont und Abruffragen für den Einstieg der nächsten Stunde.

## Prüfe vor der Ausgabe

- Die Datei ist gültiges JSON (keine Kommentare, keine Kommas am Ende, Zeilenumbrüche in Texten als `\n`).
- `format` ist `"arbeitsblatt-baukasten-paket"`, `version` ist `2`, die Module stehen in `modules`.
- `icon`, `lang`, `type`, `form`, `nameField`, Baustein-`type` und Felder stammen aus den Listen dieser Anleitung.
- Jede `competence` einer Aufgabe steht als `id` in `competences` desselben Moduls; jeder `domain` ist ein Bereich aus der Liste.
- Jede Aufgabe hat eine Lösung (`[[…]]`, `*`, `T/F/NG`, `solution` …), wo das möglich ist.
- Englische Module: `"lang": "en"`, Aufträge auf Englisch, in Klasse 5 und 6 mit `help`.
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
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `lines` | Anzahl Schreiblinien | Zahl 0–20 | `3` |
| `solution` | Lösung / Erwartung (für die Lösungsfassung) | Text, mehrzeilig | – |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `mc` · Ankreuzen (Aufgabe, wird nummeriert)

Ankreuzaufgabe. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Kreuze die richtige Antwort an."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `options` | Antworten (eine je Zeile, richtige mit * davor) | Text, mehrzeilig | `"Antwort A\nAntwort B\nAntwort C"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `gap` · Lückentext (Aufgabe, wird nummeriert)

Lückentext. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Ergänze die Lücken."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `text` | Text (___ = Lücke, [[Wort]] = Lücke mit Lösung) | Text, mehrzeilig | `"Der Treibhauseffekt ist ___ und wird durch ___ verstärkt."` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `table` · Tabelle (Aufgabe, wird nummeriert)

Tabelle zum Ausfüllen: Spaltenköpfe und die erste Spalte sind vorgegeben. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Trage deine Werte ein."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `cols` | Spalten (eine je Zeile) | Text, mehrzeilig | `"Zeit\nWert A\nWert B"` |
| `rows` | Zeilen (eine je Zeile) | Text, mehrzeilig | `"0 min\n3 min\n6 min"` |
| `solution` | Lösungen (eine Zeile je Tabellenzeile, Zellen mit \| trennen) | Text, mehrzeilig | – |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `match` · Zuordnen (Aufgabe, wird nummeriert)

Zuordnen: linke und rechte Spalte werden mit Linien verbunden. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Verbinde, was zusammengehört."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `left` | Linke Spalte | Text, mehrzeilig | `"Begriff A\nBegriff B\nBegriff C"` |
| `right` | Rechte Spalte | Text, mehrzeilig | `"Erklärung 2\nErklärung 3\nErklärung 1"` |
| `solution` | Lösung: Nummer der linken Zeile für jede rechte (z. B. 2, 3, 1) | Text | – |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `draw` · Zeichenfeld (Aufgabe, wird nummeriert)

Feld zum Zeichnen, Beschriften oder Rechnen. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Aufgabe | Text, mehrzeilig | `"Zeichne eine Skizze."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `height` | Höhe in px | Zahl 40–900 | `160` |
| `pattern` | Hintergrund | `"leer"` (Leer), `"karo"` (Karo), `"linien"` (Linien), `"punkte"` (Punkte) | `"leer"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

### Wortschatz & Grammatik

#### `vocab` · Vokabelliste

Vokabelliste mit den Spalten Englisch, Lautschrift (IPA), Deutsch und Beispielsatz. Leere Spalten fallen weg. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"Vocabulary"` |
| `rows` | Wörter (je Zeile: Englisch \| Lautschrift \| Deutsch \| Beispielsatz) | Text, mehrzeilig (IPA-Zeichen erlaubt) | `"house \| haʊs \| Haus \| My house is next to the school.\nfriend \| fr…"` |

#### `foldtest` · Knick-Vokabeltest (Aufgabe, wird nummeriert)

Knick-Vokabeltest: vorgegebenes Wort, Schreiblinie, Faltlinie, Lösung zum Selbstkontrollieren. Als „test“ ohne Lösungsspalte. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Fold the page. Write the English words. Then check."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `rows` | Wörter (je Zeile: vorgegeben \| gesucht) | Text, mehrzeilig | `"Haus \| house\nSchule \| school\nFreund \| friend\nwohnen \| to live"` |
| `mode` | Art | `"knick"` (Knicktest (Lösung hinter der Faltlinie)), `"test"` (Test (Lösung nur in der Lösungsfassung)) | `"knick"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `picvocab` · Bild-Vokabeln (Aufgabe, wird nummeriert)

Bilder (Emoji oder eingefügte Bilder) mit Beschriftungslinie („Label the pictures“). Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Label the pictures."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `items` | Bilder (je Zeile: Emoji oder leer \| Wort als Lösung) | Text, mehrzeilig | `"🐶 \| dog\n🐱 \| cat\n🐦 \| bird\n🐟 \| fish"` |
| `pics` | Eigene Bilder | Bild-IDs aus `images`, eine je Zeile | – |
| `cols` | Bilder je Zeile | Zahl 2–6 | `4` |
| `height` | Bildhöhe in px | Zahl 40–300 | `90` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `wordweb` · Wortnetz (Aufgabe, wird nummeriert)

Wortnetz (Mindmap): Mitte und Äste mit Wörtern, Lücken und Lösungen. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Complete the word web."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `center` | Mitte | Text | `"my family"` |
| `branches` | Äste (je Zeile: Oberbegriff \| Wort, Wort, [[Lösung]], ___) | Text, mehrzeilig | `"people \| mum, dad, [[sister]]\nhome \| house, garden\nfree time \| _…"` |
| `height` | Höhe in px | Zahl 120–600 | `250` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `grammar` · Grammatik-Box

Grammatik-Box mit Regel, Signalwörtern und Beispielsätzen; {{…}} markiert Endungen farbig. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Thema | Text | `"Simple present"` |
| `rule` | Regel ({{…}} = farbig markiert) | Text, mehrzeilig | `"Bei he / she / it hängst du ein -s an das Verb."` |
| `signal` | Signalwörter (mit Komma getrennt) | Text | `"always, usually, often, sometimes, never, every day"` |
| `examples` | Beispielsätze (einer je Zeile; {{s}} markiert die Endung) | Text, mehrzeilig | `"I play football.\nShe play{{s}} football.\nHe watch{{es}} TV every…"` |
| `variant` | Farbe | `"accent-2"` (grün), `"accent"` (orange), `"neutral"` (grau) | `"accent-3"` |

#### `forms` · Formentabelle

Formentabelle (Konjugation), z. B. to be, have got, simple present; auch mit Lücken. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `preset` | Vorlage | keine Eigenschaft: Vorlagen „to be“, „have got“, „simple present“, „can“, „present progressive“, „Leere Tabelle zum Ausfüllen“ | – |
| `title` | Überschrift | Text | `"to be – simple present"` |
| `cols` | Spaltenköpfe (einer je Zeile) | Text, mehrzeilig | `"person\nlong form\nshort form\nnegative"` |
| `rows` | Zeilen (Zellen mit \| trennen; {{…}} markiert, [[…]] ist eine Lücke mit Lösung) | Text, mehrzeilig | `"I \| am \| I'm \| I'm not\nyou \| are \| you're \| you aren't\nhe / she …"` |
| `variant` | Farbe | `"accent-2"` (grün), `"accent"` (orange), `"neutral"` (grau) | `"accent-3"` |

#### `jumble` · Wörter ordnen (Aufgabe, wird nummeriert)

Wörter ordnen: die Wörter eines Satzes erscheinen gemischt, die Lösung ist der Satz. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Put the words in the right order."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `items` | Sätze (je Zeile der richtige Satz; oder „Teil / Teil / Teil = Lösung“) | Text, mehrzeilig | `"I go to school by bus.\nMy sister likes pizza.\nfriend / is / best…"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `transform` · Umformen (Aufgabe, wird nummeriert)

Umformen: Ausgangssatz → Zielform (z. B. negative, question) mit Schreiblinie. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Make the sentences negative or ask questions."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `items` | Sätze (je Zeile: Ausgangssatz \| Zielform \| Lösung) | Text, mehrzeilig | `"She plays football. \| negative \| She doesn't play football.\nThey …"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `syntax` · Satzbaustellen (Aufgabe, wird nummeriert)

Satzbaustellen-Tabelle mit farbigen Spalten (subject, verb, object, place, time). Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Write the sentences in the table."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `cols` | Spalten (eine je Zeile, z. B. subject, verb, object, place, time) | Text, mehrzeilig | `"subject\nverb\nobject\nplace\ntime"` |
| `rows` | Sätze (Teile mit \| trennen; leer = Lücke, [[…]] = Lücke mit Lösung) | Text, mehrzeilig | `"I \| play \| football \| in the park \| on Sundays.\n[[My sister]] \| […"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

### Hören, Sprechen, Lesen, Schreiben

#### `listening` · Hörverstehen

Hörverstehen: Phase (pre/while/post), Track im Lehrwerk, QR-Code zur Audiodatei, Transkript in der Lösungsfassung. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `stage` | Phase | `""` (–), `"pre"` (Pre-listening), `"while"` (While-listening), `"post"` (Post-listening) | `"while"` |
| `track` | Track im Lehrwerk (z. B. Audio 1/12) | Text | `"Audio 1/12"` |
| `note` | Hinweis für die Klasse | Text, mehrzeilig | `"Listen to the dialogue twice."` |
| `url` | Link zur Audiodatei (wird als QR-Code gedruckt) | Text | – |
| `transcript` | Transkript (nur in der Lösungsfassung) | Text, mehrzeilig | – |

#### `reading` · Lesetext

Lesetext mit automatischen Zeilennummern und Worterklärungen als Fußnote (mit Zeilenangabe). Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"A new school"` |
| `text` | Text (Absätze ohne Leerzeile) | Text, mehrzeilig | `"Hi, I’m Emma and I’m eleven. Today is my first day at Hillside Sch…"` |
| `glossary` | Worterklärungen (je Zeile: Wort \| Erklärung; die Zeile im Text wird ergänzt) | Text, mehrzeilig | `"nervous \| aufgeregt, nervös\ngate \| Tor\ncanteen \| Kantine, Mensa"` |
| `numbers` | Zeilennummern alle … Zeilen (0 = keine) | Zahl 0–10 | `5` |

#### `truefalse` · Richtig / Falsch (Aufgabe, wird nummeriert)

Richtig/falsch/steht nicht im Text: mehrere Aussagen in einer Tabelle zum Ankreuzen. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"True, false or not in the text? Tick."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `items` | Aussagen (je Zeile: Aussage \| T, F oder NG als Lösung) | Text, mehrzeilig | `"Emma is eleven. \| T\nEmma goes to school by bus. \| F\nBen has got …"` |
| `mode` | Spalten | `"tf"` (true · false), `"tfn"` (true · false · not in the text) | `"tfn"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `phrases` · Redemittel

Redemittel zweispaltig: Englisch | Deutsch. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"Useful phrases"` |
| `items` | Redemittel (je Zeile: Englisch \| Deutsch) | Text, mehrzeilig | `"Can you help me, please? \| Kannst du mir bitte helfen?\nHow do you…"` |
| `variant` | Farbe | `"accent-2"` (grün), `"accent"` (orange), `"neutral"` (grau) | `"accent-6"` |

#### `rolecards` · Rollenkarten

Zwei Rollenkarten A und B zum Ausschneiden, z. B. für Information Gap. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `titleA` | Karte A: Titel | Text | `"Partner A"` |
| `textA` | Karte A: Text (___ = Lücke für das Information Gap) | Text, mehrzeilig | `"You are at the tourist information in London.\nAsk: When does the …"` |
| `titleB` | Karte B: Titel | Text | `"Partner B"` |
| `textB` | Karte B: Text | Text, mehrzeilig | `"You work at the tourist information.\nThe museum opens at 10 am.\n…"` |

#### `bingo` · Bingo / Find someone who (Aufgabe, wird nummeriert)

Raster für „Find someone who …“ (mit Namenslinie) oder Bingo. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Walk around and ask. Write the names."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `mode` | Art | `"find"` (Find someone who …), `"bingo"` (Bingo) | `"find"` |
| `items` | Felder (eins je Zeile) | Text, mehrzeilig | `"has got a pet\nlikes pizza\ncan swim\nplays football\nhas got a si…"` |
| `cols` | Spalten | Zahl 2–5 | `3` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `writing` · Schreibrahmen (Aufgabe, wird nummeriert)

Schreibrahmen: Satzanfänge mit Linien und eine Checkliste für den eigenen Text. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Write about your family."` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `starters` | Satzanfänge (einer je Zeile) | Text, mehrzeilig | `"My name is …\nI live in …\nIn my family there are …\nMy favourite …"` |
| `lines` | Schreiblinien je Satzanfang | Zahl 1–6 | `1` |
| `checklist` | Checkliste für den eigenen Text (eine Aussage je Zeile) | Text, mehrzeilig | `"I have written at least five sentences.\nI have used and / but / b…"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

#### `mediation` · Sprachmittlung (Aufgabe, wird nummeriert)

Sprachmittlung: deutsche Vorlage im Kasten, englische Aufgabe, Schreiblinien, Lösung. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `prompt` | Arbeitsauftrag | Text, mehrzeilig | `"Your English friend Tom is visiting you. He wants to know what the…"` |
| `help` | Deutsche Hilfe (klein unter dem Auftrag) | Text, mehrzeilig | – |
| `source` | Deutsche Vorlage | Text, mehrzeilig | `"Liebe Badegäste! Das Hallenbad ist am Montag wegen Reinigungsarbei…"` |
| `lines` | Schreiblinien | Zahl 0–20 | `4` |
| `solution` | Lösung / Erwartung (für die Lösungsfassung) | Text, mehrzeilig | `"The swimming pool is closed on Monday because they are cleaning it…"` |
| `level` | Niveau | `""` (–), `"1"` (★ G), `"2"` (★★ M), `"3"` (★★★ E) | – |
| `points` | Punkte (0 = keine) | Zahl 0–99 | `0` |
| `langPoints` | Punkte Sprache (Klassenarbeit; dann gelten „Punkte“ für den Inhalt) | Zahl 0–99 | `0` |
| `competence` | Kompetenz aus dem Kompetenzraster | `id` aus `competences` des Moduls | – |
| `tip` | Tipp (erscheint auf den Tippkarten) | Text, mehrzeilig | – |

### Test & Differenzierung

#### `selfcheck` · Ich kann …

Selbsteinschätzung „Ich kann …“ mit Smileys, am Ende einer Stunde. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"Das kann ich jetzt"` |
| `items` | Aussagen (eine je Zeile) | Text, mehrzeilig | `"Ich kann den Treibhauseffekt mit eigenen Worten erklären.\nIch kan…"` |

#### `gradescale` · Notenschlüssel

Notenschlüssel: zählt die Punkte aller Aufgaben (Inhalt und Sprache) und zeigt die Punktbereiche der Noten 1–6. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `thresholds` | Mindestprozent für die Noten 1 \| 2 \| 3 \| 4 \| 5 | Text | `"92 \| 81 \| 67 \| 50 \| 30"` |
| `half` | Halbe Punkte | `"ja"` (Ja), `"nein"` (Nein) | `"ja"` |

#### `tipcards` · Tippkarten

Tippkarten zum Ausschneiden: sammelt die Tipps aller Aufgaben des Arbeitsblatts. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `cols` | Karten nebeneinander | Zahl 1–3 | `2` |

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

Schlüssel für `icon`, mit Bedeutung:

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
- `landmark`: Staat (politik, demokratie, antike, landeskunde, sehenswürdigkeit, london)
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
- `headphones`: Hören (listening, hörverstehen, audio)
- `mic`: Sprechen (speaking, aussprache, dialog)
- `spell-check`: Wortschatz (vokabeln, vocabulary, rechtschreibung)
- `flag`: Landeskunde (land, großbritannien, usa, kultur)
- `home`: Zuhause (haus, wohnen, family, familie, home)
- `school`: Schule (school, klassenzimmer, unterricht)
- `shirt`: Kleidung (clothes, anziehen, mode)
- `cake`: Geburtstag (birthday, feier, party)
- `party-popper`: Feste (feiern, festivals, party)
- `gift`: Geschenke (weihnachten, christmas, feiertage)
- `ghost`: Halloween (gruseln, feiertage)
- `dog`: Haustiere (pets, tiere, hund)
- `utensils`: Essen (food, mahlzeit, restaurant)
- `shopping-cart`: Einkaufen (shopping, geld, laden)
- `bus`: Unterwegs (schulweg, verkehr, stadt)
- `tent`: Ferien (holidays, urlaub, camping, reisen)
- `smartphone`: Handy (medien, internet, social, media)
- `gamepad-2`: Freizeit (hobbys, spiele, free, time)
- `graduation-cap`: Abschluss (prüfung, schule)
- `puzzle`: Rätsel (knobeln)
- `target`: Ziel (lernziel)
- `clock`: Uhr (zeit)
- `calendar`: Kalender (termin, jahr)

## Beispiel 1: Englisch, Klasse 5 (eine Stunde)

Lehrkraft-Seite, Vokabeln, Grammatik, Sprechen und Schreiben. Felder mit Standardwert sind weggelassen.

```json
{
  "format": "arbeitsblatt-baukasten-paket",
  "version": 2,
  "modules": [
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 1,
      "title": "Hello, school!",
      "icon": "school",
      "description": "Sich vorstellen, die neue Schule und die Formen von to be.",
      "lang": "en",
      "help": true,
      "textbook": "Unit 1",
      "weeks": 5,
      "competences": [
        {
          "id": "k1",
          "domain": "Sprachliche Mittel: Wortschatz",
          "area": "Wörter rund um die Schule",
          "g": "Ich kann Dinge im Klassenzimmer auf Englisch benennen.",
          "m": "Ich kann die Wörter in kurzen Sätzen verwenden.",
          "e": "Ich kann ein Wort auf Englisch umschreiben, wenn es mir fehlt."
        },
        {
          "id": "k2",
          "domain": "Sprachliche Mittel: Grammatik",
          "area": "to be verwenden",
          "g": "Ich kann die Formen von to be nennen.",
          "m": "Ich kann to be in Sätzen richtig verwenden.",
          "e": "Ich kann mit to be verneinen und Fragen stellen."
        },
        {
          "id": "k3",
          "domain": "Sprechen – an Gesprächen teilnehmen",
          "area": "Sich und andere vorstellen",
          "g": "Ich kann sagen, wie ich heiße und wie alt ich bin.",
          "m": "Ich kann mich und andere vorstellen.",
          "e": "Ich kann ein kurzes Gespräch beginnen und Fragen stellen."
        }
      ],
      "lessons": [
        {
          "number": 1,
          "title": "Hello, I’m …",
          "textbook": "SB Unit 1, Station 1",
          "pages": [
            {
              "title": "Hello, I’m …",
              "kicker": "Klasse 5 · Stundenverlauf",
              "type": "lehrkraft",
              "form": "Plenum",
              "nameField": "aus",
              "blocks": [
                {
                  "type": "goal",
                  "span": 12,
                  "props": {
                    "goal": "Die Klasse stellt sich auf Englisch vor und festigt die Formen von to be.",
                    "curriculum": "3.1.3.3 Sprechen – an Gesprächen teilnehmen · 3.1.3.7 Verfügbarkeit sprachlicher Mittel (Wortschatz, Grammatik)"
                  }
                },
                {
                  "type": "plan",
                  "span": 12,
                  "props": {
                    "rows": "0–5 | Warm-up | Song „Hello, hello“, Begrüßung auf Englisch. | Plenum | Audio\n5–15 | Vocabulary | Neue Wörter mit Bildkarten einführen, Aussprache chorisch üben. | Plenum | Bildkarten, AB S. 1\n15–25 | Grammar | to be an der Tafel entdecken, Regel gemeinsam formulieren. | Plenum | Tafel, AB S. 2\n25–40 | Speaking | Rollenkarten: sich zu zweit vorstellen, dann Partner vorstellen. | Partner | AB S. 3\n40–45 | Check | „Ich kann …“ ankreuzen, Hausaufgabe: Knicktest. | Einzel | AB S. 3"
                  }
                },
                {
                  "type": "expect",
                  "span": 12,
                  "props": {
                    "items": "Richtig | „My name is Tom. I’m eleven.“ | Vollständige Vorstellung mit Kurzform.\nFalsch | „I am eleven years.“ | Es fehlt old: I’m eleven (years old).\nVorsicht | „He are my friend.“ | he / she / it → is. Auf die Grammatik-Box verweisen."
                  }
                },
                {
                  "type": "recall",
                  "span": 12,
                  "props": {
                    "title": "Abrufphase für die nächste Stunde",
                    "items": "Wie sagt man „Tafel“ auf Englisch? | board\nWelche Form von to be gehört zu she? | is\nWie fragst du nach dem Alter? | How old are you?"
                  }
                }
              ]
            },
            {
              "title": "My classroom",
              "kicker": "Class 5 · Unit 1",
              "type": "vocab",
              "form": "allein",
              "nameField": "name",
              "blocks": [
                {
                  "type": "vocab",
                  "span": 12,
                  "props": {
                    "title": "New words",
                    "rows": "board | bɔːd | Tafel | Look at the board, please.\npencil case | ˈpensl keɪs | Federmäppchen | My pencil case is blue.\nrubber | ˈrʌbə | Radiergummi | Can I have a rubber, please?\nschoolbag | ˈskuːlbæɡ | Schultasche | My schoolbag is heavy.\ndesk | desk | Schreibtisch, Pult | The book is on my desk.\nclassmate | ˈklɑːsmeɪt | Mitschüler/in | Ben is my classmate."
                  }
                },
                {
                  "type": "picvocab",
                  "span": 12,
                  "props": {
                    "items": "📏 | ruler\n✏️ | pencil\n🎒 | schoolbag\n📖 | book",
                    "help": "Schreibe das englische Wort unter jedes Bild.",
                    "level": "1",
                    "competence": "k1"
                  }
                },
                {
                  "type": "foldtest",
                  "span": 12,
                  "props": {
                    "rows": "Tafel | board\nFedermäppchen | pencil case\nRadiergummi | rubber\nMitschüler/in | classmate",
                    "help": "Knicke das Blatt an der gestrichelten Linie. Schreibe die englischen Wörter und kontrolliere dann.",
                    "level": "2",
                    "competence": "k1",
                    "tip": "Look at the list “New words” at the top of the page."
                  }
                }
              ]
            },
            {
              "title": "I am, you are …",
              "kicker": "Class 5 · Unit 1 · Grammar",
              "type": "grammar",
              "form": "allein",
              "nameField": "name",
              "blocks": [
                {
                  "type": "grammar",
                  "span": 12,
                  "props": {
                    "title": "to be",
                    "rule": "to be heißt „sein“. Die Form hängt von der Person ab: I {{am}}, he / she / it {{is}}, we / you / they {{are}}.",
                    "signal": "",
                    "examples": "I{{’m}} Emma.\nShe{{’s}} my friend.\nWe{{’re}} in class 5b."
                  }
                },
                {
                  "type": "jumble",
                  "span": 12,
                  "props": {
                    "items": "My name is Emma.\nI am eleven years old.\nfriend / is / Ben / my = Ben is my friend.",
                    "help": "Bringe die Wörter in die richtige Reihenfolge.",
                    "level": "1",
                    "competence": "k2"
                  }
                },
                {
                  "type": "transform",
                  "span": 12,
                  "props": {
                    "prompt": "Write the sentences with the short form.",
                    "items": "I am Tom. | short form | I'm Tom.\nShe is my sister. | short form | She's my sister.\nWe are friends. | short form | We're friends.",
                    "help": "Schreibe die Sätze mit der Kurzform.",
                    "level": "2",
                    "competence": "k2"
                  }
                },
                {
                  "type": "gap",
                  "span": 12,
                  "props": {
                    "prompt": "Fill in am, is or are.",
                    "text": "Hi, I [[am]] Emma. This [[is]] Ben. We [[are]] in class 5b. Our teacher [[is]] Mr Clark.",
                    "help": "Setze am, is oder are ein.",
                    "level": "3",
                    "competence": "k2"
                  }
                }
              ]
            },
            {
              "title": "Let’s meet!",
              "kicker": "Class 5 · Unit 1 · Speaking and writing",
              "type": "speaking",
              "form": "zu zweit",
              "nameField": "namen",
              "blocks": [
                {
                  "type": "phrases",
                  "span": 12,
                  "props": {
                    "items": "Hi, I’m … What’s your name? | Hallo, ich bin … Wie heißt du?\nHow old are you? | Wie alt bist du?\nThis is my friend … | Das ist mein Freund / meine Freundin …\nNice to meet you. | Schön, dich kennenzulernen."
                  }
                },
                {
                  "type": "rolecards",
                  "span": 12,
                  "props": {
                    "textA": "You are Tom, 11.\nAsk your partner: name? age?\nIntroduce your friend Ben (12).",
                    "textB": "You are Mia, 10.\nAsk your partner: name? age?\nIntroduce your friend Lucy (11)."
                  }
                },
                {
                  "type": "writing",
                  "span": 12,
                  "props": {
                    "prompt": "Write about you.",
                    "starters": "My name is …\nI’m … years old.\nMy best friend is …\nMy favourite subject is …",
                    "checklist": "I have written four sentences.\nI have used I’m and is.\nI have checked my spelling.",
                    "help": "Schreibe über dich. Nutze die Satzanfänge.",
                    "level": "2",
                    "competence": "k3"
                  }
                },
                {
                  "type": "selfcheck",
                  "span": 12,
                  "props": {
                    "title": "I can …",
                    "items": "Ich kann Dinge im Klassenzimmer auf Englisch benennen.\nIch kann mich auf Englisch vorstellen.\nIch kann die Formen von to be verwenden."
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Beispiel 2: Jahresplan Englisch, Klasse 5

Nur die Planung: Module mit Lehrwerk und Wochen, ein Modul schon mit Kompetenz, dazu das Schuljahr.

```json
{
  "format": "arbeitsblatt-baukasten-paket",
  "version": 2,
  "schoolYear": {
    "name": "2026/27",
    "start": "2026-09-14",
    "end": "2027-07-28",
    "holidays": [
      {
        "name": "Herbstferien",
        "from": "2026-10-26",
        "to": "2026-10-31"
      },
      {
        "name": "Weihnachtsferien",
        "from": "2026-12-23",
        "to": "2027-01-09"
      },
      {
        "name": "Osterferien",
        "from": "2027-03-26",
        "to": "2027-04-03"
      },
      {
        "name": "Christi Himmelfahrt",
        "from": "2027-05-06",
        "to": "2027-05-06"
      },
      {
        "name": "Pfingstferien",
        "from": "2027-05-17",
        "to": "2027-05-29"
      }
    ]
  },
  "modules": [
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 1,
      "title": "Hello, school!",
      "icon": "school",
      "description": "",
      "lang": "en",
      "help": true,
      "textbook": "Unit 1",
      "weeks": 5,
      "competences": [],
      "lessons": []
    },
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 2,
      "title": "My family and me",
      "icon": "home",
      "description": "",
      "lang": "en",
      "help": true,
      "textbook": "Unit 2",
      "weeks": 6,
      "competences": [
        {
          "id": "k1",
          "domain": "Hör-/Hörsehverstehen",
          "area": "Familienmitglieder in Gesprächen erkennen",
          "g": "Ich kann Namen und Familienwörter heraushören.",
          "m": "Ich kann verstehen, wer mit wem verwandt ist.",
          "e": "Ich kann Einzelheiten zu Personen heraushören."
        }
      ],
      "lessons": []
    },
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 3,
      "title": "A day in my life",
      "icon": "clock",
      "description": "",
      "lang": "en",
      "help": true,
      "textbook": "Unit 3",
      "weeks": 6,
      "competences": [],
      "lessons": []
    },
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 4,
      "title": "Birthdays and parties",
      "icon": "cake",
      "description": "",
      "lang": "en",
      "help": true,
      "textbook": "Unit 4",
      "weeks": 5,
      "competences": [],
      "lessons": []
    }
  ]
}
```

## Beispiel 3: Geographie, Klasse 9 (Sachfach)

Lehrkraft-Seite, Versuchsprotokoll und Sicherung.

```json
{
  "format": "arbeitsblatt-baukasten-paket",
  "version": 2,
  "modules": [
    {
      "subject": "Geographie",
      "grade": 9,
      "number": 1,
      "title": "Das Klima kippt",
      "icon": "thermometer-sun",
      "description": "Vom Zusammenhang zwischen CO₂ und Temperatur zum Mechanismus des Treibhauseffekts.",
      "lang": "de",
      "help": true,
      "textbook": "",
      "weeks": 0,
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
      ],
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
  ]
}
```
