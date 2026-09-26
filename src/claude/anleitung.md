---
name: arbeitsblatt-baukasten
description: Erstellt Stundenpakete und Jahrespläne als JSON-Datei für den Arbeitsblatt-Baukasten, auch für Englisch mit Vokabeln, Grammatik, Hör- und Lesetexten, Sprechen, Schreiben und Klassenarbeiten. Verwenden, wenn eine Lehrkraft Arbeitsblätter, Unterrichtsstunden, Units, Module oder einen Jahresplan für den Baukasten erstellen, umwandeln oder überarbeiten möchte.
---

# Stundenpakete für den Arbeitsblatt-Baukasten

Du erstellst Unterrichtsmaterial für eine Lehrkraft an einer Realschule in Baden-Württemberg, zum Beispiel für Englisch oder Geographie. Das Ergebnis ist immer eine **JSON-Datei im Format „Stundenpaket“**. Die Lehrkraft öffnet sie im Arbeitsblatt-Baukasten ({{APP_URL}}) unter „Mit Claude“. Dort entstehen daraus Module mit Stunden und Arbeitsblättern, die sie weiter bearbeitet, druckt (Schüler- oder Lösungsfassung, Farbe oder S/W) und im Jahresplan sieht.

## Was du erstellen kannst

- **Eine Stunde oder ein ganzes Modul** (eine Unit): Kompetenzraster, Lehrkraft-Seite und Schülerblätter für jede Stunde.
- **Einen Jahresplan**: alle Module (Units) eines Fachs und Jahrgangs mit Thema, Schwerpunkten und Dauer in Schulwochen, auf Wunsch mit den ersten Stunden. Der Baukasten verteilt die Module auf die Schulwochen und überspringt die Ferien.
- **Eine Überarbeitung**: Die Lehrkraft kann ein Modul oder ihren Jahresplan aus dem Baukasten als Stundenpaket sichern und dir geben. Ändere dann nur, was sie möchte, und gib das ganze Paket zurück.

## So arbeitest du

1. **Klären.** Frage kurz nach, was fehlt: Fach, Klasse (5–10), Thema bzw. Unit, Zahl der Stunden, Besonderheiten der Klasse und ob die Klasse mit einem Lehrwerk arbeitet. Viele Lehrkräfte unterrichten Englisch **ohne Lehrwerk**; dann planst du Themen, Texte und Grammatik selbst (siehe „Englisch ohne Lehrwerk“). Bei einem Jahresplan außerdem: Stunden pro Woche und welche Themen in welcher Reihenfolge. Stelle höchstens drei Fragen auf einmal; wenn genug klar ist, fang an.
2. **Material übernehmen.** Hat die Lehrkraft Material angehängt (PDF, Foto eines Arbeitsblatts, Tafelbild, Buchseite, Jahresplan, Stundenpaket), übernimm dessen Inhalte möglichst genau und bilde sie auf die Bausteine unten ab. Einen Lehrwerksbezug (`textbook`) schreibst du nur, wenn die Lehrkraft mit einem Lehrwerk arbeitet, und Seitenzahlen nur, wenn du sie aus ihrem Material kennst.
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
      "weeks": 5,
      "description": "Ein Satz für die Inhaltsübersicht.",
      "competences": [
        { "id": "k1", "domain": "Sprachliche Mittel: Wortschatz", "area": "Wörter rund um die Schule", "g": "Ich kann …", "m": "Ich kann …", "e": "Ich kann …" }
      ],
      "lessons": [
        { "number": 1, "title": "Hello, I’m …", "pages": [ { "title": "…", "kicker": "…", "type": "vocab", "form": "allein", "nameField": "name", "blocks": [] } ] }
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
| `textbook` | nur mit Lehrwerk: Lehrwerksbezug, z. B. „Green Line 1, Unit 2, S. 34–51“; ohne Lehrwerk weglassen |
| `weeks` | Dauer in Schulwochen für den Jahresplan (`0` = nicht eingeplant) |
| `start` | optional: erster Tag, z. B. `"2027-01-11"`; ohne `start` folgt das Modul direkt auf das vorige |
| `description` | ein Satz für die Inhaltsübersicht |
| `competences` | Kompetenzraster (siehe „Kompetenzen und Niveaus“) |
| `lessons` | die Stunden; darf bei einem reinen Jahresplan fehlen |

Kürzel („K5 · M1 · S2“), Fußzeile und Symbol der einzelnen Seiten setzt der Baukasten selbst. Schreib sie nicht in die Seiten.

### Stunden und Seiten

Jede Stunde hat `number` (1, 2, 3 …), `title`, nur mit Lehrwerk `textbook` (Seiten im Schülerbuch und Workbook, z. B. „SB S. 36–37, WB S. 20“) und `pages`. Eine Seite ist ein A4-Blatt im Hochformat:

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

{{BEREICHE}}

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
- **Vokabeln** mit Lautschrift (IPA, britisches Englisch, ohne Klammern: `bɔːd`, `ˈpensl keɪs`) und einem kurzen Beispielsatz. Mehrere deutsche Bedeutungen mit Komma. Gib jeder Unit mindestens eine Vokabelliste: Aus ihr erstellt der Baukasten Vokabeltests und den Export für Anki oder Quizlet.
- **Aufbau einer Unit:** Lead-in, neue Wörter, Grammatik entdecken und üben, Hören/Lesen, Sprechen/Schreiben, Revision, zum Schluss Test oder Klassenarbeit. Wähle die Blatt-Typen `vocab`, `grammar`, `listening`, `speaking`, `test`.
- **Hören:** Mit Lehrwerk nennst du im Baustein „Hörverstehen“ den Track (`track`) und schreibst ein Transkript nur, wenn du es aus ihrem Material kennst. Ohne Lehrwerk schreibst du den Hörtext selbst als `transcript` (siehe unten). Die Phase (`stage`: pre, while, post) gibst du immer an, eine `url` nur, wenn die Lehrkraft einen Link gegeben hat.
- **Tests und Klassenarbeiten:** Blatt-Typ `test`, `nameField` `"klasse"`, Punkte an jeder Aufgabe (bei freien Schreibaufgaben `points` für den Inhalt und `langPoints` für die Sprache), am Ende der Baustein „Notenschlüssel“. Er zählt die Punkte aller Aufgaben der Stunde. Lege eine Klassenarbeit deshalb als eigene Stunde an.
- **Differenzierung:** Niveausterne, Tipps (`tip`) und der Baustein „Tippkarten“ auf einer eigenen Seite oder am Seitenende.

### Englisch ohne Lehrwerk

- **Themen:** Orientiere dich am Bildungsplan BW und an dem, was die Lehrkraft vorgibt. Für Klasse 5 und 6 eignen sich zum Beispiel: ich und meine neue Schule, Familie und Freunde, mein Zuhause, Tagesablauf und Uhrzeit, Hobbys und Freizeit, Essen und Einkaufen, Tiere, Feste und Feiertage im Jahreslauf, Einblicke in das Leben in Großbritannien.
- **Grammatik als rote Linie:** Verteile die Grammatik über das Jahr und baue sie aufeinander auf, in Klasse 5 etwa: to be, Personalpronomen, have got, Plural, can, Imperativ, Possessivbegleiter und ’s, there is / there are, simple present (mit Verneinung und Fragen), Uhrzeit, present progressive. Schreib den Schwerpunkt jeder Unit in `description`, z. B. „Grammatik: have got, Plural · Wortschatz: Familie, Haustiere“.
- **Texte selbst schreiben:** Lese- und Hörtexte schreibst du selbst, passend zum Niveau (Klasse 5/6: A1, kurze Hauptsätze, fast nur bekannte Wörter). Neue Wörter kommen in die Vokabelliste oder ins Glossar des Lesetexts. Figuren, die in mehreren Units vorkommen (eine Familie, eine Klasse in England), machen den Unterricht zusammenhängend.
- **Hörtexte:** Schreib den Hörtext als `transcript` (kurzer Dialog, zwei bis vier Sprecher mit Namen) und lass `track` leer. Die Lehrkraft liest ihn vor oder nimmt ihn auf; das Transkript steht in der Lösungsfassung, auf dem Schülerblatt nicht. Auf der Lehrkraft-Seite sagst du im Stundenverlauf, wann vorgelesen wird.
- **Lehrwerksbezug:** `textbook` bleibt leer.

## Jahresplan

Für einen Jahresplan schreibst du ein Paket mit allen Modulen des Jahrgangs, je mit `number`, `title`, `icon`, `description` (Themen- und Grammatikschwerpunkt), `weeks`, `competences` und nur mit Lehrwerk `textbook`. Die Stunden dürfen fehlen. Die Summe der `weeks` sollte die Zahl der Schulwochen nicht übersteigen; plane ein bis zwei Wochen Puffer ein.

Der Baukasten kennt das Schuljahr {{SCHULJAHR}} in Baden-Württemberg ({{SCHULWOCHEN}} Schulwochen):

{{FERIEN}}

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

{{BAUSTEINE}}

## Symbole

Schlüssel für `icon`, mit Bedeutung:

{{SYMBOLE}}

## Beispiel 1: Englisch, Klasse 5 (eine Stunde)

Lehrkraft-Seite, Vokabeln, Grammatik, Sprechen und Schreiben. Felder mit Standardwert sind weggelassen.

```json
{{BEISPIEL_EN}}
```

## Beispiel 2: Jahresplan Englisch, Klasse 5

Nur die Planung, ohne Lehrwerk: Module mit Themen- und Grammatikschwerpunkt und Wochen, ein Modul schon mit Kompetenz, dazu das Schuljahr.

```json
{{BEISPIEL_PLAN}}
```

## Beispiel 3: Geographie, Klasse 9 (Sachfach)

Lehrkraft-Seite, Versuchsprotokoll und Sicherung.

```json
{{BEISPIEL_GEO}}
```
