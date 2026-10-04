---
name: arbeitsblatt-baukasten
description: Erstellt Stundenpakete und Jahrespläne als JSON-Datei für den Arbeitsblatt-Baukasten, auch für Englisch mit Vokabeln, Grammatik, Hör- und Lesetexten, Sprechen, Schreiben und Klassenarbeiten. Verwenden, wenn eine Lehrkraft Arbeitsblätter, Unterrichtsstunden, Units, Module oder einen Jahresplan für den Baukasten erstellen, umwandeln oder überarbeiten möchte.
---

# Stundenpakete für den Arbeitsblatt-Baukasten

Du erstellst Unterrichtsmaterial für eine Lehrkraft an einer Realschule in Baden-Württemberg, zum Beispiel für Englisch oder Geographie. Das Ergebnis ist immer eine **JSON-Datei im Format „Stundenpaket“**. Die Lehrkraft öffnet sie im Arbeitsblatt-Baukasten (https://noledge5.github.io/edutoolboxbuilder/) unter „Mit Claude“. Dort entstehen daraus Module mit Stunden und Arbeitsblättern, die sie weiter bearbeitet, druckt (Schüler- oder Lösungsfassung, Farbe oder S/W) und im Jahresplan sieht.

## Grundprinzipien

1. **Ergebnis ist immer eine Datei:** ein Stundenpaket (JSON) nach dieser Anleitung, nichts anderes.
2. **Erst klären, dann bauen:** höchstens drei Rückfragen; mitgebrachtes Material genau übernehmen.
3. **Von oben nach unten planen:** Kompetenzraster (G/M/E, Bildungsplan BW) → je Stunde eine Lehrkraft-Seite (Ziel, Einstieg, Verlauf für 45 Minuten, Erwartungshorizont, Abruffragen) → ein bis drei Schülerseiten → auf Wunsch Folien.
4. **Jede Aufgabe hat eine eindeutige Lösung** (`[[…]]`, `*`, `T/F/NG`, `solution`). Die Schülerfassung zeigt sie nie; Lösungsfassung, Folien und die digitale Auswertung brauchen sie.
5. **Differenzieren:** Niveau-Sterne, jede Kompetenz mit Aufgaben verknüpft, Tipps; Punkte und Notenschlüssel bei Tests.
6. **Gute Arbeitsblätter:** kurze Aufträge mit Operator, vom Einfachen zum Schweren, einfache Sprache, Sicherung am Ende, genug Schreibraum, keine Seite zu voll.
7. **Auch digital lösbar:** Die Lehrkraft teilt Aufgaben per Link und QR-Code aus; Schüler lösen sie am Tablet und der Baukasten wertet automatisch aus. Schreib Aufgaben deshalb so, dass ihre Lösung eindeutig prüfbar ist (siehe „Digital lösbar“).
8. **Englisch:** Aufträge auf Englisch, in Klasse 5/6 mit deutscher Hilfe; Vokabeln mit Lautschrift; ohne Lehrwerk eigene Texte mit der Grammatik als roter Linie.
9. **Bilder:** keine Fotos, sondern Bildunterschrift und englische Suchwörter für die Bildsuche des Baukastens.
10. **Vielfältig einsteigen:** Nicht jede Stunde knüpft an Vorwissen an. Wähle für jede Stunde eine passende Einstiegsart und wechsle ab (siehe „Einstieg, Abruf und Verlauf“).
11. **Abruf nur mit Bekanntem:** Abruffragen einer Stunde fragen den Stoff **dieser** Stunde ab; der Baukasten stellt sie in **späteren** Stunden (verteiltes Wiederholen). Nie Fragen zu etwas, das die Klasse erst noch erarbeitet.
12. **Folien folgen dem Stundenverlauf:** Einstieg, je Arbeitsphase ein Auftrag mit Zeit und Sozialform, Besprechung der Aufgaben mit Lösungen auf Klick, Merksatz. Knapp, Sprechernotizen auf Deutsch.

## Was du erstellen kannst

- **Eine Stunde oder ein ganzes Modul** (eine Unit): Kompetenzraster, Lehrkraft-Seite und Schülerblätter für jede Stunde.
- **Einen Jahresplan**: alle Module (Units) eines Fachs und Jahrgangs mit Thema, Schwerpunkten und Dauer in Schulwochen, dazu die **geplanten Stunden** (nur Titel und Planungsnotiz, noch ohne Arbeitsblätter). Der Baukasten verteilt die Module auf die Schulwochen, überspringt die Ferien und zeigt Geplantes blass, bis es ausgearbeitet ist.
- **Folien zu einer Stunde** (16:9, für Beamer oder Tafel), wenn die Lehrkraft Folien möchte: im Stil der Arbeitsblätter, mit Sprechernotizen. Siehe „Folien“.
- **Ein geplantes Modul ausarbeiten**: Gib ihm dieselbe `number` wie im Jahresplan. Der Baukasten füllt dann das geplante Modul und seine geplanten Stunden, statt ein neues Modul anzulegen.
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
| `number` | Modulnummer im Fach und Jahrgang, bei Units meist die Unit-Nummer. Gibt es das Modul schon, ergänzt der Baukasten es, solange nichts Ausgearbeitetes überschrieben würde; sonst nimmt er die nächste freie Nummer. |
| `title` | Thema des Moduls, kurz und griffig |
| `icon` | Themen-Symbol im Kopfband aller Seiten, ein Schlüssel aus der Liste „Symbole“ |
| `lang` | Sprache der Arbeitsblätter: `"en"` für Englisch, sonst `"de"` (Standard bei anderen Fächern) |
| `help` | `true`: Die deutsche Hilfe (`help` einer Aufgabe) steht klein unter dem englischen Arbeitsauftrag. `false` blendet sie im ganzen Modul aus. |
| `textbook` | nur mit Lehrwerk: Lehrwerksbezug, z. B. „Green Line 1, Unit 2, S. 34–51“; ohne Lehrwerk weglassen |
| `weeks` | Dauer in Schulwochen für den Jahresplan (`0` = nicht eingeplant) |
| `start` | optional: erster Tag, z. B. `"2027-01-11"`; ohne `start` folgt das Modul direkt auf das vorige |
| `description` | ein Satz für die Inhaltsübersicht |
| `competences` | Kompetenzraster (siehe „Kompetenzen und Niveaus“) |
| `lessons` | die Stunden; im Jahresplan geplante Stunden ohne `pages`, oder ganz weglassen |

Kürzel („K5 · M1 · S2“), Fußzeile und Symbol der einzelnen Seiten setzt der Baukasten selbst. Schreib sie nicht in die Seiten.

### Stunden und Seiten

Jede Stunde hat `number` (1, 2, 3 …), `title`, nur mit Lehrwerk `textbook` (Seiten im Schülerbuch und Workbook, z. B. „SB S. 36–37, WB S. 20“), optional `plan` (Planungsnotiz: was in der Stunde passiert, ein bis zwei Sätze), `pages` und optional `slides` (Folien, siehe „Folien“) mit ihrem Design `slideDesign`. Eine **geplante Stunde** hat nur `number`, `title` und `plan`, aber keine `pages`: `{ "number": 2, "title": "My classroom", "plan": "Schulsachen benennen; Hörverstehen: What’s in your school bag?" }`. Eine Seite ist ein A4-Blatt im Hochformat:

| Feld | Werte |
|---|---|
| `title` | Titel im Kopfband, kurz (höchstens etwa 40 Zeichen) |
| `kicker` | kleine Zeile über dem Titel, z. B. „Class 5 · Unit 1“ oder „Klasse 9 · Modellversuch zum Treibhauseffekt“ |
| `type` | Blatt-Typ, bestimmt die Farbe und die Aufschrift im Kopfband (siehe unten) |
| `form` | Sozialform: `"allein"`, `"zu zweit"`, `"Gruppe"`, `"Plenum"` (auf englischen Blättern gedruckt als „on your own“, „in pairs“, „in groups“, „whole class“) |
| `nameField` | Zeile unter dem Kopfband: `"name"` (Name + Datum), `"namen"` (für Partner- und Gruppenarbeit), `"klasse"` (Name + Klasse + Datum, gut für Tests), `"aus"` (keine, für Lehrkraft-Seiten) |
| `back` | optional `true`: Die Seite ist die **Rückseite** der Seite davor (doppelseitiges Arbeitsblatt). Statt des Kopfbands hat sie nur eine schmale Kopfzeile mit Symbol und Titel der Vorderseite und dem Hinweis „Rückseite“; so bleibt mehr Platz, und es ist klar, wozu sie gehört. Gib ihr denselben `type` und `"nameField": "aus"`; `title` und `kicker` werden nicht gedruckt. Die erste Seite einer Stunde kann keine Rückseite sein. |
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
- **Lücken:** `___` (drei oder mehr Unterstriche) ist eine leere Lücke, `[[Wort]]` eine Lücke mit Lösung. Schreib Lösungen immer mit `[[…]]`, damit die Lösungsfassung sie zeigt. Das gilt in Lückentext, Merksatz, Formentabelle, Satzbaustellen, Wortnetz und Rollenkarten. Sind mehrere Antworten richtig, trenn sie mit ` / ` (Leerzeichen, Schrägstrich, Leerzeichen): `[[Erde / Erdoberfläche]]`. Das gilt auch für Lösungen in Tabelle, Umformen und Knick-Vokabeltest.
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

Für einen Jahresplan schreibst du ein Paket mit allen Modulen des Jahrgangs, je mit `number`, `title`, `icon`, `description` (Themen- und Grammatikschwerpunkt), `weeks`, `competences` und nur mit Lehrwerk `textbook`. Die Summe der `weeks` sollte die Zahl der Schulwochen nicht übersteigen; plane ein bis zwei Wochen Puffer ein.

Plane die Stunden als **geplante Stunden** (`number`, `title`, `plan`, ohne `pages`), so weit du sie schon absehen kannst; rechne mit den Stunden pro Woche, die die Lehrkraft nennt (Englisch Klasse 5 meist 4–5). Die Lehrkraft sieht sie im Baukasten blass mit dem Hinweis „Geplant“ und arbeitet sie nach und nach aus. Hat sie schon Module im Baukasten, gib ihnen dieselbe `number`: Ausgearbeitete Stunden bleiben erhalten, fehlende geplante Stunden kommen dazu.

Die Lehrkraft kann einen Jahresplan auch ohne JSON übernehmen, im Baukasten unter „Jahresplan“ → „Importieren“ als Text: eine Zeile pro Modul (`Modul 1: Hello, school! | 5 Wochen | Sich vorstellen`), darunter die Stunden mit „-“ (`- Stunde 1: Hello, I’m … | Begrüßen und vorstellen`). Bittet sie dich um diese Textform, halte dich genau daran.

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

## Einstieg, Abruf und Verlauf

Der Baukasten baut aus der Lehrkraft-Seite die Folien der Stunde. Er liest dafür den **Stundenverlauf**, den **Einstieg** und die **Abruffragen**; schreib sie deshalb so:

**Einstieg** (Baustein `hook`, eine je Stunde): Wähle die Art (`kind`), die zum Thema passt, und wechsle über die Stunden eines Moduls ab. Nicht jede Stunde beginnt mit Vorwissen.

| `kind` | Einstieg | was in die Felder gehört |
|---|---|---|
| `bild` | Bildimpuls | `impulse`: Frage zum Bild („Was fällt euch auf?“); das Bild sucht die Lehrkraft (beschreibe es in `impulse` oder auf dem Blatt in einer Abbildung mit `search`) |
| `schaetzen` | Schätzfrage | `impulse`: die Frage mit Zahl als Antwort; `answer`: die Auflösung |
| `zitat` | Zitat, Karikatur | `impulse`: das Zitat oder die Beschreibung der Karikatur; `source`: wer es sagte |
| `fall` | Problem, Fall | `impulse`: eine kurze Situation, ein Dilemma („Stell dir vor …“) |
| `video` | Video | `url`: nur ein Link, den die Lehrkraft gegeben hat; `impulse`: Beobachtungsauftrag |
| `versuch` | Experiment, Gegenstand | `impulse`: was die Lehrkraft zeigt; die Klasse vermutet |
| `abstimmung` | Abstimmung, Kontroverse | `impulse`: die Aussage; `answer`: die Antworten mit ` / ` (Standard „Stimme zu / Stimme nicht zu“); beim Präsentieren zählt Antippen die Hände |
| `raetsel` | Rätsel | `impulse`: das Rätsel; `answer`: die Lösung |
| `vorwissen` | Vorwissen | `impulse`: der Impuls zum Sammeln („Klima – was fällt euch ein?“); die Lehrkraft schreibt mit dem Stift mit |

`question` ist die **Leitfrage** der Stunde, die aus dem Einstieg entsteht. Sie steht nach dem Einstieg auf einer eigenen Folie und am Ende beim Merksatz („Zurück zur Leitfrage“).

**Abruffragen** (Baustein `recall`): zwei bis vier Fragen mit kurzen Antworten zum Stoff **dieser** Stunde. Sie erscheinen nicht am Anfang dieser Stunde, sondern in der Abrufphase späterer Stunden: eine aus der letzten Stunde, eine aus einer früheren, eine aus einem früheren Modul. Auch Merksätze mit Lücken und Ankreuz-Aufgaben früherer Stunden dienen dort als Abruffragen.

**Stundenverlauf** (Baustein `plan`), eine Zeile je Phase: `Zeit | Phase | Ablauf | Sozialform | Material`.
- Benenne die Phasen eindeutig: „Abrufphase“, „Einstieg“, „Erarbeitung“ (oder „Übung“, „Versuch“, in Englisch „Vocabulary“, „Grammar“, „Listening“, „Speaking“), „Besprechung“, „Sicherung“, „Exit“. Nur wo der Verlauf eine Abrufphase hat, gibt es eine Abruffolie.
- Sozialform als `Einzel`, `Partner`, `Gruppe` oder `Plenum`.
- Nenne in `Material` das Arbeitsblatt der Phase: „AB S. 2“. So weiß der Baukasten, welche Aufgaben zu welcher Arbeitsphase gehören.
- Kooperative Phasen (Ich – Du – Wir, Think – Pair – Share) als aufeinanderfolgende Zeilen mit **derselben Phase** und eigener Sozialform und Zeit. Auf der Folie werden sie zu Schritten mit eigenem Timer.
- Schreib den Ablauf von Arbeitsphasen so, dass er sich an die Klasse richtet („Lies M1 und markiere …“); er steht auf der Auftragsfolie.

Beispiel: `"0–5 | Abrufphase | 3 Fragen ins Lernjournal | Einzel | Lernjournal\n5–10 | Einstieg | Schätzfrage, dann Leitfrage | Plenum | Tafel\n10–15 | Erarbeitung | Lies den Versuchsaufbau. | Einzel | AB S. 1\n15–25 | Erarbeitung | Führt den Versuch durch. | Partner | AB S. 1\n25–30 | Besprechung | Ergebnisse vergleichen | Plenum | Folie\n30–42 | Sicherung | Fließschema und Merksatz | Einzel | AB S. 2\n42–45 | Exit | Zurück zur Leitfrage | Plenum |"`

## Bilder

Du kannst keine Fotos liefern. Setze stattdessen einen Baustein „Abbildung“ mit aussagekräftiger Bildunterschrift (`caption`) und in `search` zwei, drei **englische Suchwörter** für ein passendes freies Bild (z. B. `"search": "volcano eruption"`, `"search": "map united kingdom"`). Die Lehrkraft tippt im Baukasten auf „Im Internet suchen“; die Suche in Openverse und Wikimedia Commons startet mit deinen Wörtern, und Urheber und Lizenz landen automatisch in `source`. Lass `source` deshalb leer, außer du kennst die Quelle eines Bildes aus dem Material der Lehrkraft. In „Bild-Vokabeln“ nimmst du Emojis (`🐶 | dog`), die die Lehrkraft durch eigene Bilder ersetzen kann. Nur wenn du ein Bild wirklich als Datei hast (z. B. eine selbst erstellte SVG-Grafik), trag es unter `"images": { "abb1": "data:image/svg+xml;base64,…" }` ein und setze im Baustein `"image": "abb1"`.

## Folien

Zu jeder Stunde gehören auf Wunsch Präsentationsfolien: `"slides": [ … ]` in der Stunde. Meist reicht es, die Lehrkraft-Seite gut zu schreiben: Der Baukasten schlägt daraus selbst Folien vor (siehe „Einstieg, Abruf und Verlauf“), und die Lehrkraft hakt ab, was sie braucht. Schreib eigene Folien, wenn die Lehrkraft sie möchte oder wenn sie mehr bieten. Die Lehrkraft zeigt sie im Baukasten mit „Präsentieren“ (Pfeiltasten, Tippen oder Wischen blättern; Lösungen liegen unter Karten, die sich auf Klick oder durch Antippen aufdecken; sie schreibt mit dem Stift auf die Folien), druckt sie als Handout oder sichert sie als PDF oder PowerPoint-Datei. Kopfleiste (Stunde · Klasse · Nummer), Symbol, Fußzeile und Foliennummer setzt der Baukasten selbst.

Das Aussehen aller Folien einer Stunde bestimmt `"slideDesign"` in der Stunde (neben `slides`): `"organisch"` (Standard, wie die Arbeitsblätter), `"klar"` (schlicht, weiß, serifenlos), `"heft"` (kariertes Schulheft, Handschrift), `"tafel"` (dunkelgrüne Tafel, Kreide) oder `"kontrast"` (schwarz auf weiß, für helle Räume). Setze es nur, wenn die Lehrkraft ein Design nennt; sonst weglassen.

| Feld | Bedeutung |
|---|---|
| `layout` | Art der Folie (Tabelle unten) |
| `type` | Farbe wie ein Blatt-Typ: `lehrkraft` ist neutrales Grau (für Einstieg und Abrufphase), sonst `uebung`, `versuch`, `sicherung`, `vocab`, `grammar`, `listening`, `speaking`, `test` |
| `phase` | Aufschrift der Phase in der Kopfleiste, z. B. „Abrufphase“, „Einstieg“, „Erarbeitung“, „Sicherung“, „Exit“; in Englisch z. B. „Warm-up“, „Vocabulary“, „Grammar“ |
| `form` | Sozialform wie bei Seiten (`"allein"`, `"zu zweit"`, `"Gruppe"`, `"Plenum"`), weglassen, wenn keine |
| `minutes` | Dauer der Phase in Minuten, weglassen, wenn keine |
| `label` | kleine Zeile über der Überschrift (`statement`, `exit`), im Zitatkasten (`quote`) bzw. über dem Arbeitsauftrag (`task`: „Aufgabe 2 · S. 1 · ★★☆ · 3 P.“, die erste Zahl steht im Kreis) |
| `title` | große Überschrift, höchstens etwa 60 Zeichen; bei `quote` die Leitfrage, bei `task` der Arbeitsauftrag |
| `help` | nur `task`: Hilfe unter dem Auftrag, z. B. die deutsche Hilfe einer englischen Aufgabe |
| `text` | je nach Art: Untertitel, Zitat, Hinweis, Satz unter Kästen oder Schema, Text neben dem Bild, bei `task` die Lösung |
| `items` | Einträge, einer je Zeile (`\n`), Aufbau je nach Art |
| `image`, `source` | Bild und Quelle der Arten `image` und `task`: die Bild-Id aus `images` (wie bei Seiten) |
| `reveal` | `true`: Lösungen erscheinen erst auf Klick: Antworten (`list`, `task`), Wörter in Lücken (`task`, Merksatz in `exit` und `statement`), die Lösung (`text` bei `task`), Bedeutungen (`words`), Text in den Kästen (`compare`), Erklärungen in den Schritten (`flow`). Bis dahin liegen sie unter Karten mit Nummer, die die Lehrkraft einzeln antippen kann; `"cards": false` macht sie stattdessen unsichtbar |
| `vote` | nur `compare`: `true` macht die Kästen zu einer Abstimmung; beim Präsentieren zählt Antippen eines Kastens eine Hand |
| `build` | `true`: Die Einträge (`list`, `task`, `compare`, `flow`, `words`) erscheinen nacheinander, je Klick einer; mit `reveal` abwechselnd Eintrag und Lösung |
| `itemAnim` | wie die Einträge dabei erscheinen: `"rise"` (von unten, Standard), `"fade"`, `"zoom"`, `"left"`, `"none"` |
| `transition` | Übergang zu dieser Folie: `"none"` (Standard), `"fade"`, `"push"`, `"zoom"`; sparsam einsetzen |
| `elements` | frei platzierte Elemente auf der Folie (siehe unten) |
| `anims` | optional: einzelne Teile der Folie auf einem eigenen Klick, z. B. `{ "text": { "step": 1, "anim": "zoom" } }` (siehe unten) |
| `notes` | Sprechernotizen für die Lehrkraft: Zeit, Sozialform, Material, Impulse, erwartete Antworten |

| `layout` | Folie |
|---|---|
| `title` | erste Folie: Thema der Stunde (`title`) und Leitfrage (`text`) |
| `list` | nummerierte Fragen oder Aufträge, `items` als „Frage \| Antwort“ (Antwort optional), höchstens 6 |
| `task` | eine Aufgabe des Arbeitsblatts: Nummer und Niveau (`label`), Arbeitsauftrag (`title`), Hilfe (`help`), Einträge (`items`) als „Eintrag \| Lösung“ oder mit Lücken „I [[am]] Tom.“ (höchstens 6), Lösung (`text`), daneben ein Bild (`image`); mit `reveal` erscheinen alle Lösungen auf Klick |
| `work` | Auftrag einer Arbeitsphase: Kurzauftrag (`title`, z. B. „Bearbeitet Aufgabe 1–3 auf S. 2.“), kleine Zeile (`label`), Hinweis auf Hilfen (`text`), Zeit (`minutes`) und Sozialform (`form`) groß; Schritte (`items`) als „Ich: Lies M1. \| 5“ (Sozialform: Auftrag \| Minuten), höchstens 5. Beim Präsentieren startet der Timer mit der Folie und mit jedem Schritt |
| `quote` | Einstieg: Zitat oder Rückblick im Kasten (`text`, darüber `label`), darunter die Leitfrage (`title`) |
| `statement` | große Aussage oder Deutung (`title`) mit kleiner Zeile (`label`) und Hinweis im grünen Kasten (`text`) |
| `compare` | zwei oder drei Kästen nebeneinander, `items` als „Überschrift \| Text“ |
| `flow` | Fließschema mit Pfeilen, `items` als „Begriff \| Erklärung“, drei bis fünf Schritte |
| `words` | Wortkarten, `items` als „Wort \| Bedeutung“, bis zwölf |
| `image` | großes Bild mit Text daneben (`text`); das Bild sucht die Lehrkraft im Baukasten, nenne in `notes`, was darauf zu sehen sein soll |
| `exit` | letzte Folie auf grünem Grund: Rückbezug (`text`), `label` (z. B. „Merksatz“) und Merksatz (`title`); Lücken im Merksatz als `[[Wort]]` füllen sich mit `reveal` auf Klick |
| `blank` | freie Folie: Kopfleiste, Überschrift (`title`, darf leer sein) und nur `elements` |

**Elemente** (`elements`) liegen frei auf jeder Folie, gemessen in Pixeln einer Folie von 1920 × 1080 (`x`, `y` links oben, `w`, `h`; Kopfleiste bis etwa `y` 170, Fußzeile ab etwa `y` 1000, Rand links und rechts 96):

| `kind` | Felder |
|---|---|
| `text` | Textfeld: `text` (`**fett**`, `{{…}}` möglich), `style` `"box"` (Kasten, Standard), `"note"` (Notizzettel), `"plain"`, `"heading"`; `size` Schriftgröße (28, 40, 56, 80, 120; Standard 40), `align` `"left"` oder `"center"` |
| `image` | Bild: `text` (Bildunterschrift und Suchwort), `source`; das Bild sucht die Lehrkraft im Baukasten |
| `video` | eingebettetes Video: `url` (YouTube-, Vimeo- oder MP4-Link), `text` (Titel); spielt beim Präsentieren, im Handout steht ein QR-Code |
| `qr` | QR-Code: `url`, `text` (Beschriftung) |
| `cover` | Abdeckung über einem Teil der Folie, z. B. über den Beschriftungen einer Karte: `text` (Aufschrift, leer = Nummer), `style` `"box"` (Phasenfarbe), `"plain"` (Papier), `"note"` (grau); sie verschwindet auf ihrem Klick (`step`) oder durch Antippen (`step` 0: nur durch Antippen) |

Jedes Element hat außerdem `step` (0 = mit der Folie, 1, 2 … = beim ersten, zweiten … Klick) und `anim` (wie es dann erscheint: `"fade"`, Standard, `"rise"`, `"zoom"`, `"left"`, `"none"`). Die Klicks zählen für die ganze Folie gemeinsam: Mit `build` belegen die Einträge die ersten Klicks (bei `list` mit `reveal` zwei je Frage); ein Element danach bekommt die nächste Zahl. Beispiel: `{ "kind": "text", "text": "Tipp: Schaut ins Lernjournal!", "style": "note", "x": 1240, "y": 700, "w": 580, "h": 200, "step": 1 }`.

**Einzelne Teile auf Klick** (`anims`): Jeder Teil einer Folie kann auf einem eigenen Klick erscheinen, mit `step` (Klick-Nummer, 0 = mit der Folie) und `anim`. Schlüssel: `title` (Überschrift, Leitfrage, Merksatz, Arbeitsauftrag), `text` (Untertitel, Zitat, Hinweis, Satz darunter, Rückbezug, Lösung einer Aufgabe), `image` (Bild der Arten `image` und `task`), `gaps` (die Wörter in den Lücken eines Merksatzes), `item:0`, `item:1` … (Einträge, gezählt ab 0) und `answer:0`, `answer:1` … (die Lösung bzw. der zweite Teil des Eintrags, auch die Wörter in seinen Lücken). `anims` gilt vor `build` und `reveal`. Beispiel für eine Deutung, deren Hinweis erst nach einer Diskussion kommt: `"layout": "statement", "anims": { "text": { "step": 1, "anim": "zoom" } }`.

Videos: Schreib nur Links, die die Lehrkraft dir gegeben hat oder die du sicher kennst; sonst ein Textfeld „Video: …“ als Platzhalter und in `notes`, wonach die Lehrkraft suchen soll.

So werden gute Folien:
- Die Folien folgen dem Stundenverlauf, nicht dem Blatt Baustein für Baustein: Titel, Abruf (nur Stoff früherer Stunden), Einstieg nach seiner Art und die Leitfrage, je Arbeitsphase eine Folie `work` (Kurzauftrag, Zeit, Sozialform, Schritte), danach die Aufgaben dieser Phase zur Besprechung als `task` (Nummer, Niveau und Punkte wie auf dem Blatt, Lösung auf Klick mit `reveal`), dazu Abbildungen, Fließschemata (`flow`), Vokabeln (`words`) und Regeln (`statement`), wo sie gebraucht werden, am Ende der Merksatz (`exit`, Lücken auf Klick).
- Die Lösungen auf den Folien sind dieselben wie in der Lösungsfassung des Arbeitsblatts: angekreuzte Antworten als „Antwort \| ✓“, Lücken als `[[…]]`, Zuordnungen als „links \| rechts“, richtig/falsch als „Aussage \| richtig“, offene Aufgaben als Musterlösung in `text`.
- Schrittweise einblenden (`build`, `step`) lohnt sich, wo die Klasse erst nachdenken soll: Abruffragen, Schritte eines Schemas, Vergleiche. Nicht jede Folie braucht Animationen.
- Folien sind knapp: Aufträge, Stichworte, Lösungen, Merksätze. Lange Texte (Lesetexte, Quellen) stehen auf dem Arbeitsblatt.
- Der Baukasten schlägt solche Folien auch selbst vor; eigene Folien lohnen sich, wenn sie mehr bieten: besondere Impulse, Bilder mit Abdeckungen (`cover`), Videos.
- Die Farbe (`type`) folgt der Phase: dieselbe wie das Arbeitsblatt, mit dem die Klasse gerade arbeitet.
- Folien für Arbeitsphasen bekommen `form` und `minutes`: Auf einer Folie `work` startet der Timer von selbst, sonst mit Taste T; die Lehrkraft kann die Lautstärke-Ampel zeigen.
- Englische Stunden: Folien auf Englisch, Sprechernotizen auf Deutsch.
- In `title`, `text` und `items` schreibt `**fett**` fett und `{{…}}` markiert farbig.
- Folien für eine Stunde, die es im Baukasten schon gibt: ein Paket mit dem Modul (gleiche `number`) und nur dieser Stunde mit `number`, `title` und `slides`, ohne `pages`. Der Baukasten hängt die Folien an und lässt das Arbeitsblatt, wie es ist.

## Digital lösbar

Die Lehrkraft kann jede Aufgabe, eine Auswahl oder das ganze Arbeitsblatt **digital austeilen**: Die Schüler öffnen einen Link oder QR-Code, geben ihren Vornamen ein und lösen die Aufgaben am Tablet oder Handy. Als **Übung** prüfen sie jede Aufgabe selbst und sehen danach die Lösung; als **Test** geben sie nur ab. Die Lehrkraft sieht eine Auswertung: Punkte je Aufgabe, häufige falsche Antworten und wer bei welcher Kompetenz Hilfe braucht. Dafür gilt:

- **Ausgewertet wird automatisch:** Ankreuzen (`*`, auch mehrere richtige), Lückentext, Richtig/Falsch, Zuordnen, Tabelle (je Zelle), Wörter ordnen, Umformen, Knick-Vokabeltest, Bild-Vokabeln, Wortnetz und Satzbaustellen (je Lücke). Verglichen wird ohne Groß-/Kleinschreibung, ohne doppelte Leerzeichen und ohne Satzzeichen am Ende.
- **Lösungen eindeutig halten:** in Lücken ein Wort oder eine kurze Wendung; mehrere richtige Antworten mit ` / `. Keine Lösung wie „z. B. …“ oder „individuell“ in `[[…]]`; was frei ist, gehört in eine Offene Frage.
- **Frei geschrieben** werden Offene Frage, Schreibrahmen und Sprachmittlung. Sie werden nicht automatisch bewertet; ihre `solution` (Musterlösung, ein bis zwei Sätze) sehen die Schüler in der Übung, nachdem sie selbst geschrieben haben.
- **Tabellen** ohne `solution` (z. B. eigene Messwerte) werden digital ausgefüllt, aber nicht bewertet. Gibt es richtige Werte, schreib sie in `solution`.
- **Nur auf Papier** bleiben Zeichenfeld und Bingo; plane für digitale Stunden eine Alternative (z. B. Ankreuzen oder Zuordnen statt Beschriften).
- **Kompetenz an jede Aufgabe** (`competence`) und Niveau (`level`): Daraus entsteht die Diagnose „wer braucht wobei Hilfe“.
- **Tipps** (`tip`) erscheinen digital als „💡 Tipp“ zum Aufklappen.
- Texte, Bilder, Merksätze, Hinweise und Wortspeicher erscheinen digital wie auf dem Blatt.

## Platz auf der Seite

Was nicht auf die Seite passt, wird unten abgeschnitten. Eine Seite hat etwa **840 px** Platz für Bausteine (ohne Namenszeile etwa 880 px, eine Rückseite etwa **950 px**), zwischen zwei Bausteinen liegen 18 px. Rechne mit diesen Höhen (volle Breite; eine Aufgabe braucht 35 px für den Auftrag, mit deutscher Hilfe 18 px mehr):

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
| Einstieg | 110 px (mit Bild 130 px) |
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
- Die Lehrkraft-Seite nennt Ziel und Bildungsplanbezug, den Einstieg mit seiner Art und der Leitfrage, einen Verlauf mit Zeiten für 45 Minuten (Phasen, Sozialform, „AB S. …“), typische Fehler im Erwartungshorizont und Abruffragen zum Stoff dieser Stunde für spätere Stunden.

## Prüfe vor der Ausgabe

- Die Datei ist gültiges JSON (keine Kommentare, keine Kommas am Ende, Zeilenumbrüche in Texten als `\n`).
- `format` ist `"arbeitsblatt-baukasten-paket"`, `version` ist `2`, die Module stehen in `modules`.
- `icon`, `lang`, `type`, `form`, `nameField`, Baustein-`type` und Felder stammen aus den Listen dieser Anleitung.
- Jede `competence` einer Aufgabe steht als `id` in `competences` desselben Moduls; jeder `domain` ist ein Bereich aus der Liste.
- Jede Aufgabe hat eine Lösung (`[[…]]`, `*`, `T/F/NG`, `solution` …), wo das möglich ist, eindeutig prüfbar, Varianten mit ` / `.
- Englische Module: `"lang": "en"`, Aufträge auf Englisch, in Klasse 5 und 6 mit `help`.
- Keine Seite ist voller als etwa 840 px.
- Geplante Stunden haben `title` und `plan`, aber keine `pages`; ausgearbeitete Stunden haben `pages`.
- Reicht ein Arbeitsblatt nicht auf eine Seite, mach die zweite Seite zur Rückseite (`"back": true`) statt zu einem neuen Blatt.
- Jede ausgearbeitete Stunde hat auf der Lehrkraft-Seite einen Einstieg (`hook`) mit `kind` und `question`; die Einstiegsarten eines Moduls wechseln.
- Abruffragen fragen nur den Stoff ihrer eigenen Stunde ab; der Verlauf nennt Phasen, Sozialform und das Arbeitsblatt („AB S. 1“).
- Folien: `layout` und `type` aus den Listen, höchstens 6 Einträge bei `list` und `task`, 5 bei `flow` und `work`, 3 bei `compare`, 12 bei `words`; Elemente liegen ganz auf der Folie (`x + w` ≤ 1920, `y + h` ≤ 1080) und verdecken keinen Text (außer Abdeckungen, die das sollen).

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

#### `code` · Code

Programmcode mit Zeilennummern (Informatik), z. B. Python zum Lesen und Nachvollziehen; Schlüsselwörter und Werte werden hervorgehoben. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `code` | Code (je Zeile eine Programmzeile; Einrückung mit Leerzeichen) | Text, mehrzeilig | `"summe = 0\nfor i in range(1, 6):\n    summe = summe + i\nprint(sum…"` |
| `language` | Hervorheben | `"python"` (Python), `"plain"` (Ohne) | `"python"` |

### Grafik & Abbildung

#### `image` · Abbildung

Platz für ein Bild mit Bildunterschrift; in `search` englische Suchwörter für die Bildsuche der Lehrkraft (Openverse, Wikimedia Commons), die Quelle trägt der Baukasten ein. Standardbreite: 6.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `image` | Bild | Bild-ID aus `images` | – |
| `caption` | Bildunterschrift | Text | `"Abb. 1: Bildunterschrift"` |
| `source` | Quelle | Text | – |
| `search` | Suchwörter für die Bildsuche (englisch findet mehr) | Text | – |
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

#### `hook` · Einstieg

Nur Lehrkraft-Seite: der Einstieg mit seiner Art (`kind`), dem Impuls, der Auflösung, Bild oder Video und der Leitfrage. Daraus baut der Baukasten die Einstiegsfolie. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `kind` | Art des Einstiegs | `"bild"` (Bildimpuls), `"schaetzen"` (Schätzfrage), `"zitat"` (Zitat/Karikatur), `"fall"` (Problem/Fall), `"video"` (Video), `"versuch"` (Experiment/Gegenstand), `"abstimmung"` (Abstimmung), `"raetsel"` (Rätsel), `"vorwissen"` (Vorwissen) | `"schaetzen"` |
| `impulse` | Impuls (Frage, Zitat, Fall, Aussage zum Abstimmen, Rätsel …) | Text, mehrzeilig | `"Wie viel wärmer wird es im Glas mit Folie nach 15 Minuten?"` |
| `answer` | Auflösung (Schätzfrage, Rätsel) oder Antworten zum Abstimmen, mit / getrennt | Text | `"etwa 3 °C"` |
| `image` | Bild (Bildimpuls, Karikatur, Gegenstand) | Bild-ID aus `images` | – |
| `source` | Quelle des Bilds | Text | – |
| `url` | Video-Link | Text | – |
| `question` | Leitfrage der Stunde | Text | `"Wie genau erwärmt CO₂ die Luft?"` |

#### `recall` · Abruffragen

Nur Lehrkraft-Seite: Abruffragen zum Stoff dieser Stunde, mit Antworten. Der Baukasten stellt sie in späteren Stunden zum Abrufen (verteiltes Wiederholen), nicht am Anfang dieser Stunde. Standardbreite: 12.

| Feld | Bedeutung | Werte | Standard |
|---|---|---|---|
| `title` | Überschrift | Text | `"Abruffragen für spätere Stunden"` |
| `items` | Fragen (je Zeile: Frage \| Antwort) | Text, mehrzeilig | `"Welche Einheit hat der CO₂-Wert in unserer Kurve? \| ppm\nReicht ei…"` |
| `answers` | Antworten zeigen | `"immer"` (Immer), `"loesung"` (Nur in der Lösungsfassung) | `"immer"` |

## Symbole

Schlüssel für `icon`, mit Bedeutung:

- `thermometer-sun`: Klima (temperatur, treibhaus, wärme)
- `sun`: Sonne (energie, licht)
- `cloud-sun-rain`: Wetter
- `cloud-rain`: Niederschlag (regen, wasserkreislauf)
- `cloud-lightning`: Gewitter (blitz, unwetter)
- `tornado`: Sturm (wirbelsturm, hurrikan, unwetter)
- `rainbow`: Regenbogen (licht, farben, wetter)
- `sunrise`: Tageszeiten (sonnenaufgang, morgen)
- `umbrella`: Regen (wetter, schirm)
- `wind`: Wind (luft, atmosphäre)
- `snowflake`: Eis (schnee, kälte, gletscher, polar)
- `earth`: Erde (planet, welt)
- `globe`: Globus (welt, länder)
- `map`: Karte (atlas, geographie)
- `compass`: Kompass (orientierung, himmelsrichtung)
- `map-pin`: Ort (lage, standort)
- `signpost`: Wegweiser (orientierung, richtung)
- `route`: Route (weg, reise, karte)
- `mountain`: Gebirge (berg, alpen, relief, vulkan)
- `mountain-snow`: Hochgebirge (alpen, gletscher, berge)
- `waves`: Meer (ozean, küste, wasser)
- `droplets`: Wasser (fluss, trinkwasser)
- `shell`: Küste (strand, muschel, meer)
- `pickaxe`: Rohstoffe (bergbau, gestein)
- `tree-palm`: Tropen (palme, regenwald, urlaub)
- `trees`: Wald (bäume, regenwald, ökosystem)
- `leaf`: Pflanzen (biologie, blatt)
- `sprout`: Wachstum (keimung, samen)
- `tree-pine`: Wald (baum, ökosystem)
- `tree-deciduous`: Laubbaum (baum, jahreszeiten)
- `flower-2`: Blüte (blume, bestäubung)
- `bug`: Insekten (käfer, tiere)
- `fish`: Fische (tiere, wasser)
- `bird`: Vögel (tiere)
- `paw-print`: Tiere (säugetiere, zoologie)
- `cat`: Katze (tiere, haustier)
- `rabbit`: Kaninchen (tiere, haustier, hase)
- `squirrel`: Eichhörnchen (tiere, wald)
- `turtle`: Schildkröte (reptilien, tiere)
- `snail`: Schnecke (tiere, garten)
- `rat`: Nagetiere (maus, ratte, tiere)
- `shrimp`: Meerestiere (krebstiere, tiere)
- `worm`: Boden (regenwurm, erde)
- `feather`: Feder (vögel, leicht)
- `egg`: Ei (fortpflanzung, ostern, frühstück)
- `dna`: Genetik (vererbung, zelle)
- `microscope`: Mikroskop (zelle, untersuchen)
- `heart-pulse`: Körper (herz, kreislauf, gesundheit)
- `brain`: Gehirn (nerven, lernen)
- `stethoscope`: Gesundheit (medizin, krankheit)
- `bone`: Skelett (knochen, körper)
- `ear`: Hören (ohr, sinne)
- `eye`: Sehen (auge, sinne)
- `hand`: Hand (tastsinn, körper)
- `footprints`: Spuren (bewegung, evolution, fußabdruck)
- `baby`: Entwicklung (baby, pubertät, wachstum)
- `pill`: Medikamente (sucht, gesundheit)
- `syringe`: Impfen (medizin, gesundheit)
- `hospital`: Krankenhaus (medizin, notfall)
- `biohazard`: Krankheitserreger (bakterien, viren, infektion)
- `apple`: Ernährung (essen, obst)
- `salad`: Lebensmittel (essen, kochen)
- `wheat`: Landwirtschaft (getreide, ernte)
- `carrot`: Gemüse (ernährung, gesund)
- `milk`: Milch (ernährung, frühstück)
- `cookie`: Süßes (zucker, ernährung)
- `cup-soda`: Getränke (zucker, limo, ernährung)
- `recycle`: Umwelt (nachhaltigkeit, müll, recycling)
- `atom`: Physik (teilchen)
- `flask-conical`: Chemie (versuch, labor)
- `flask-round`: Chemie (kolben, labor)
- `test-tubes`: Experiment (reagenzglas, labor)
- `magnet`: Magnetismus
- `zap`: Elektrizität (strom, energie)
- `flame`: Feuer (verbrennung, wärme)
- `lightbulb`: Idee (licht, erfindung)
- `plug`: Stromkreis (strom, elektrizität)
- `battery-charging`: Batterie (akku, energie, strom)
- `solar-panel`: Solarenergie (erneuerbar, energie, sonne)
- `fuel`: Brennstoff (öl, benzin, energie)
- `gauge`: Messen (messgerät, druck)
- `thermometer`: Temperatur (wärme, messen)
- `weight`: Masse (gewicht, wiegen)
- `rocket`: Raumfahrt (weltall)
- `telescope`: Astronomie (sterne, weltall)
- `moon`: Mond (nacht, weltall)
- `orbit`: Planeten (sonnensystem, weltall)
- `satellite`: Satellit (weltall, kommunikation)
- `cog`: Maschine (zahnrad, technik)
- `wrench`: Werkzeug (reparieren, technik)
- `hammer`: Werken (bauen, holz)
- `drill`: Bohrmaschine (werken, technik)
- `construction`: Baustelle (bauen, verkehr)
- `hard-hat`: Arbeitssicherheit (beruf, bauen)
- `factory`: Industrie (fabrik, wirtschaft)
- `tractor`: Traktor (landwirtschaft)
- `car`: Auto (verkehr, mobilität)
- `train`: Verkehr (bahn, mobilität)
- `ship`: Handel (schiff, hafen)
- `sailboat`: Segeln (boot, meer)
- `plane`: Reisen (flugzeug, tourismus)
- `anchor`: Hafen (seefahrt)
- `truck`: Transport (lkw, handel, güter)
- `calculator`: Rechnen (mathe)
- `sigma`: Mathematik (summe, formel)
- `pi`: Kreis (pi, geometrie)
- `percent`: Prozent (prozentrechnung, zinsen)
- `divide`: Bruchrechnung (teilen, brüche)
- `ruler`: Messen (geometrie, länge)
- `pencil-ruler`: Konstruieren (geometrie, zeichnen)
- `shapes`: Geometrie (formen, körper)
- `chart-column`: Diagramm (statistik, daten)
- `chart-pie`: Anteile (prozent, bruch, statistik)
- `laptop`: Computer (informatik, medien)
- `code`: Programmieren (informatik)
- `cpu`: Computer (prozessor, informatik)
- `circuit-board`: Elektronik (platine, technik)
- `binary`: Daten (binär, informatik, codierung)
- `bot`: Roboter (ki, künstliche, intelligenz)
- `landmark`: Staat (politik, demokratie, antike, landeskunde, sehenswürdigkeit, london)
- `vote`: Wahlen (politik, demokratie)
- `scale`: Recht (gerechtigkeit, gesetz)
- `gavel`: Recht (gericht, gesetz)
- `users`: Gesellschaft (gemeinschaft, gruppe)
- `handshake`: Zusammenarbeit (frieden, vertrag)
- `heart-handshake`: Soziales (ehrenamt, zusammenhalt)
- `hand-heart`: Helfen (spende, hilfe)
- `accessibility`: Inklusion (barrierefrei, teilhabe)
- `coins`: Wirtschaft (geld, finanzen)
- `euro`: Geld (euro, wirtschaft, preise)
- `piggy-bank`: Sparen (geld, taschengeld)
- `hand-coins`: Taschengeld (geld, bezahlen)
- `shopping-bag`: Konsum (einkaufen, werbung)
- `store`: Laden (markt, geschäft)
- `container`: Welthandel (globalisierung, hafen)
- `briefcase`: Beruf (arbeit, berufsorientierung)
- `building-2`: Stadt (urbanisierung)
- `building`: Gebäude (wohnen, stadt)
- `hotel`: Tourismus (hotel, reisen)
- `hourglass`: Zeit (geschichte, epoche)
- `scroll`: Quellen (geschichte, urkunde)
- `pyramid`: Ägypten (antike, hochkultur)
- `amphora`: Antike (griechen, römer)
- `castle`: Mittelalter (burg, geschichte)
- `crown`: Herrschaft (könig, absolutismus)
- `sword`: Konflikt (krieg, geschichte)
- `swords`: Ritter (kampf, mittelalter)
- `shield`: Schutz (wappen, sicherheit)
- `church`: Religion (glaube, ethik, kirche)
- `newspaper`: Medien (zeitung, nachrichten)
- `megaphone`: Werbung (protest, meinung)
- `book-open`: Lesen (deutsch, literatur, buch)
- `book-a`: Wörterbuch (vokabeln, nachschlagen)
- `library`: Bibliothek (bücher, lesen)
- `notebook-pen`: Lernjournal (heft, notizen)
- `pen-line`: Schreiben (deutsch, aufsatz)
- `pencil`: Stift (schreiben, zeichnen)
- `quote`: Zitat (rede, text)
- `type`: Schrift (buchstaben, rechtschreibung)
- `languages`: Sprachen (englisch, französisch)
- `spell-check`: Wortschatz (vokabeln, vocabulary, rechtschreibung)
- `messages-square`: Diskussion (gespräch, kommunikation)
- `message-circle`: Gespräch (dialog, sprechen)
- `mail`: Brief (e-mail, schreiben)
- `speech`: Rede (vortrag, sprechen)
- `presentation`: Präsentation (referat, vortrag)
- `headphones`: Hören (listening, hörverstehen, audio)
- `mic`: Sprechen (speaking, aussprache, dialog)
- `flag`: Landeskunde (land, großbritannien, usa, kultur)
- `home`: Zuhause (haus, wohnen, family, familie, home)
- `sofa`: Wohnzimmer (wohnen, möbel)
- `bed`: Schlafen (tagesablauf, zimmer)
- `school`: Schule (school, klassenzimmer, unterricht)
- `backpack`: Schulsachen (ranzen, schule)
- `shirt`: Kleidung (clothes, anziehen, mode)
- `glasses`: Aussehen (brille, beschreiben)
- `dog`: Haustiere (pets, tiere, hund)
- `cake`: Geburtstag (birthday, feier, party)
- `party-popper`: Feste (feiern, festivals, party)
- `gift`: Geschenke (weihnachten, christmas, feiertage)
- `candy-cane`: Weihnachten (christmas, feiertage)
- `ghost`: Halloween (gruseln, feiertage)
- `utensils`: Essen (food, mahlzeit, restaurant)
- `pizza`: Pizza (essen, food)
- `ice-cream-cone`: Eis (sommer, essen)
- `sandwich`: Pausenbrot (lunch, essen)
- `coffee`: Frühstück (breakfast, getränke)
- `croissant`: Bäckerei (frühstück, einkaufen)
- `shopping-cart`: Einkaufen (shopping, geld, laden)
- `bus`: Unterwegs (schulweg, verkehr, stadt)
- `bike`: Fahrrad (verkehr, sport)
- `tent`: Ferien (holidays, urlaub, camping, reisen)
- `tickets`: Ausflug (tickets, freizeit, kino)
- `gamepad-2`: Freizeit (hobbys, spiele, free, time)
- `smartphone`: Handy (medien, internet, social, media)
- `tv`: Fernsehen (medien, serien)
- `palette`: Kunst (malen, farbe)
- `brush`: Malen (kunst, pinsel)
- `scissors`: Basteln (schneiden, kunst)
- `camera`: Foto (bild, medien)
- `clapperboard`: Film (video, medien)
- `film`: Video (film, medien)
- `popcorn`: Kino (film, freizeit)
- `drama`: Theater (schauspiel)
- `music`: Musik (lied, noten)
- `mic-vocal`: Singen (chor, lied)
- `guitar`: Gitarre (instrument, musik)
- `piano`: Klavier (instrument, musik)
- `drum`: Trommel (rhythmus, musik)
- `dumbbell`: Sport (fitness, training)
- `volleyball`: Ballsport (volleyball, spiel)
- `goal`: Tor (fußball, ziel)
- `medal`: Medaille (wettkampf, sieg)
- `trophy`: Wettbewerb (sieg, sport)
- `graduation-cap`: Abschluss (prüfung, schule)
- `puzzle`: Rätsel (knobeln)
- `target`: Ziel (lernziel)
- `sparkles`: Kreativität (ideen, besonders)
- `star`: Stern (favorit, bewertung)
- `heart`: Gefühle (liebe, freundschaft)
- `smile`: Stimmung (gefühle, freude)
- `search`: Recherche (suchen, finden)
- `list-checks`: Checkliste (aufgaben, liste)
- `clipboard-list`: Projekt (organisation, planung)
- `key`: Schlüssel (lösung, zugang)
- `lock`: Datenschutz (privat, sicherheit)
- `shield-check`: Sicherheit (schutz, internet)
- `siren`: Notfall (polizei, feuerwehr)
- `briefcase-medical`: Erste Hilfe (notfall, gesundheit)
- `clock`: Uhr (zeit)
- `alarm-clock`: Wecker (zeit, tagesablauf)
- `calendar`: Kalender (termin, jahr)

## Beispiel 1: Englisch, Klasse 5 (eine Stunde)

Lehrkraft-Seite, Vokabeln, Grammatik, Sprechen und Schreiben, dazu vier Folien. Felder mit Standardwert sind weggelassen.

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
      "description": "Sich vorstellen, die neue Schule · Grammatik: to be, Personalpronomen",
      "lang": "en",
      "help": true,
      "textbook": "",
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
                  "type": "hook",
                  "span": 12,
                  "props": {
                    "kind": "vorwissen",
                    "impulse": "Hello! Which English words for saying hello do you know?",
                    "answer": "",
                    "question": "How can we introduce ourselves in English?"
                  }
                },
                {
                  "type": "plan",
                  "span": 12,
                  "props": {
                    "rows": "0–5 | Warm-up | Song „Hello, hello“, Begrüßung auf Englisch, Wörter sammeln. | Plenum | Audio\n5–15 | Vocabulary | Neue Wörter mit Bildkarten einführen, Aussprache chorisch üben. | Plenum | Bildkarten, AB S. 1\n15–25 | Grammar | to be an der Tafel entdecken, Regel gemeinsam formulieren. | Plenum | Tafel, AB S. 2\n25–40 | Speaking | Rollenkarten: sich zu zweit vorstellen, dann Partner vorstellen. | Partner | AB S. 3\n40–45 | Check | „Ich kann …“ ankreuzen, Hausaufgabe: Knicktest. | Einzel | AB S. 3"
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
          ],
          "slides": [
            {
              "layout": "title",
              "type": "vocab",
              "title": "Hello, I’m …",
              "text": "How do we say who we are?",
              "notes": "Begrüßung auf Englisch, Song „Hello, hello“."
            },
            {
              "layout": "words",
              "type": "vocab",
              "phase": "Vocabulary",
              "form": "Plenum",
              "minutes": 10,
              "title": "My classroom",
              "items": "board | Tafel\npencil case | Federmäppchen\nrubber | Radiergummi\nschoolbag | Schultasche",
              "reveal": true,
              "notes": "Bildkarten zeigen, chorisch nachsprechen, dann Bedeutungen aufdecken."
            },
            {
              "layout": "task",
              "type": "grammar",
              "phase": "Grammar",
              "form": "zu zweit",
              "minutes": 10,
              "label": "Task 3 · p. 2 · ★★★",
              "title": "Fill in am, is or are.",
              "help": "Setze am, is oder are ein.",
              "items": "Hi, I [[am]] Emma.\nThis [[is]] Ben.\nWe [[are]] in class 5b.",
              "reveal": true,
              "build": true,
              "notes": "Aufgabe 3 vom Arbeitsblatt gemeinsam vergleichen: Satz für Satz zeigen, dann die Lösung aufdecken; zum Schluss der Merkzettel.",
              "elements": [
                {
                  "kind": "text",
                  "x": 1240,
                  "y": 760,
                  "w": 580,
                  "h": 180,
                  "text": "**he / she / it** → is",
                  "style": "note",
                  "step": 7,
                  "anim": "zoom"
                }
              ]
            },
            {
              "layout": "exit",
              "type": "sicherung",
              "phase": "Exit",
              "form": "allein",
              "minutes": 3,
              "label": "Remember",
              "title": "I [[am]] · you [[are]] · he / she / it [[is]]",
              "text": "Tell your partner: My name is … I am … years old.",
              "reveal": true,
              "notes": "Ich-kann-Satz ankreuzen lassen."
            }
          ]
        }
      ]
    }
  ]
}
```

## Beispiel 2: Jahresplan Englisch, Klasse 5

Nur die Planung, ohne Lehrwerk: Module mit Themen- und Grammatikschwerpunkt und Wochen, die ersten Stunden als geplante Stunden (ohne `pages`), ein Modul schon mit Kompetenz, dazu das Schuljahr.

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
      "description": "Sich vorstellen, Schule und Klassenzimmer · Grammatik: to be, Personalpronomen",
      "lang": "en",
      "help": true,
      "textbook": "",
      "weeks": 5,
      "competences": [],
      "lessons": [
        {
          "number": 1,
          "title": "Hello, I’m …",
          "plan": "Sich begrüßen und vorstellen; Wortschatz Klassenzimmer; Kennenlernspiel."
        },
        {
          "number": 2,
          "title": "My classroom",
          "plan": "Schulsachen benennen; Hörverstehen: What’s in your school bag?"
        },
        {
          "number": 3,
          "title": "I am, you are …",
          "plan": "Formen von to be entdecken und üben; Personalpronomen."
        }
      ]
    },
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 2,
      "title": "My family and me",
      "icon": "home",
      "description": "Familie, Haustiere, Zuhause · Grammatik: have got, Plural, Possessivbegleiter",
      "lang": "en",
      "help": true,
      "textbook": "",
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
      "lessons": [
        {
          "number": 1,
          "title": "This is my family",
          "plan": "Familienwörter; Stammbaum beschriften; Possessivbegleiter my/your."
        }
      ]
    },
    {
      "subject": "Englisch",
      "grade": 5,
      "number": 3,
      "title": "A day in my life",
      "icon": "clock",
      "description": "Tagesablauf, Uhrzeit, Schulfächer · Grammatik: simple present",
      "lang": "en",
      "help": true,
      "textbook": "",
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
      "description": "Geburtstage, Monate, Einladungen · Grammatik: can, Imperativ",
      "lang": "en",
      "help": true,
      "textbook": "",
      "weeks": 5,
      "competences": [],
      "lessons": []
    }
  ]
}
```

## Beispiel 3: Geographie, Klasse 9 (Sachfach)

Lehrkraft-Seite, Versuchsprotokoll und Sicherung, dazu die Folien der Stunde.

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
                  "type": "hook",
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
          ],
          "slides": [
            {
              "layout": "title",
              "type": "versuch",
              "title": "Der Treibhauseffekt",
              "text": "Wie genau hängen CO₂ und Temperatur zusammen?",
              "notes": "Stunde 2 im Modul Das Klima kippt. Ziel: Mechanismus des Treibhauseffekts erarbeiten und die offene Frage aus Stunde 1 beantworten."
            },
            {
              "layout": "list",
              "type": "lehrkraft",
              "phase": "Abrufphase",
              "form": "allein",
              "minutes": 5,
              "title": "Aus dem Gedächtnis",
              "text": "Schreibt eure Antworten ins Lernjournal.",
              "items": "Welche Einheit hat der CO₂-Wert in unserer ersten Kurve? | ppm\nReicht ein zeitlicher Zusammenhang aus, um eine Ursache zu beweisen? | Nein\nAus Klasse 8: Was entsteht, wenn zwei Platten auseinanderdriften? | neue Kruste / Mittelozeanischer Rücken",
              "reveal": true,
              "notes": "0–5 min, Einzel. Drei Fragen aus dem Gedächtnis ins Lernjournal, dann Selbstkorrektur: Antworten mit einem Klick aufdecken."
            },
            {
              "layout": "quote",
              "type": "lehrkraft",
              "phase": "Einstieg",
              "form": "Plenum",
              "minutes": 5,
              "label": "Aus Stunde 1",
              "title": "Wie genau erwärmt CO₂ die Luft?",
              "text": "„Was müsste man wissen, damit der Zusammenhang belegt ist?“",
              "notes": "5–10 min, Plenum. Whiteboard-Antworten aus Stunde 1 kurz zeigen, dann die Leitfrage stellen."
            },
            {
              "layout": "compare",
              "type": "versuch",
              "phase": "Versuch",
              "form": "zu zweit",
              "minutes": 5,
              "title": "Wärme einfangen",
              "text": "Je ein Thermometer. Beide stehen gleich weit von der Lampe entfernt. Unsere Vorhersage: Welches Glas wird nach 15 Minuten wärmer sein?",
              "items": "Glas A | bleibt offen\nGlas B | wird mit Klarsichtfolie verschlossen",
              "notes": "10–15 min, Partner. Material: 2 Gläser, Folie, 2 Thermometer, Lampe. Vorhersage auf dem Versuchsprotokoll ankreuzen lassen."
            },
            {
              "layout": "list",
              "type": "versuch",
              "phase": "Messwerte & Deutung",
              "form": "Plenum",
              "minutes": 8,
              "title": "Was habt ihr gemessen?",
              "items": "Welches Glas war am Ende wärmer, und um wie viel?\nWarum, glaubt ihr, war das so?",
              "notes": "30–38 min, Plenum. Werte der Paare vergleichen, dann die Deutung gemeinsam erarbeiten."
            },
            {
              "layout": "statement",
              "type": "versuch",
              "phase": "Messwerte & Deutung",
              "form": "Plenum",
              "label": "Deutung",
              "title": "Die Folie hält Wärmestrahlung zurück — genau das tun Treibhausgase in der Atmosphäre, nur ohne Folie.",
              "text": "**Wichtiger Hinweis:** Dieser Versuch zeigt nur das allgemeine Prinzip — eine Barriere hält Wärmestrahlung zurück. Er beweist nicht, dass genau CO₂ das tut.",
              "notes": "Wichtig: Der Versuch zeigt das Prinzip, nicht dass es speziell CO₂ ist. Diese Unterscheidung ist selbst ein Lernziel."
            },
            {
              "layout": "flow",
              "type": "sicherung",
              "phase": "Sicherung",
              "form": "allein",
              "minutes": 4,
              "title": "Wie erwärmt CO₂ die Luft?",
              "text": "Ein Teil entweicht ins Weltall — ein Teil wird zur Erdoberfläche zurückgestrahlt.",
              "items": "Sonnenstrahlung | kurzwellig\nErdoberfläche | erwärmt sich\nWärmestrahlung | langwellig\nTreibhausgase | CO₂, Methan, Wasserdampf",
              "notes": "38–42 min, Einzel. Fließschema fertig ins Lernjournal übertragen (Fließschema-Arbeitsblatt)."
            },
            {
              "layout": "compare",
              "type": "sicherung",
              "phase": "Sicherung",
              "form": "allein",
              "title": "Zwei Begriffe, ein Unterschied",
              "items": "natürlicher Treibhauseffekt | notwendig — ohne ihn läge die Erde bei etwa **−18 °C**.\nzusätzlicher Treibhauseffekt | von Menschen verursacht — seit etwa **1850** messbar.",
              "notes": "Begriffe natürlicher und zusätzlicher Treibhauseffekt sichern. Fehlvorstellung aufgreifen: Ohne Treibhauseffekt wäre es nicht angenehmer."
            },
            {
              "layout": "exit",
              "type": "sicherung",
              "phase": "Exit",
              "form": "Plenum",
              "minutes": 3,
              "label": "Merksatz",
              "title": "Beobachtung + Mechanismus = Erklärung.",
              "text": "Rückbezug Stunde 1: Jetzt gibt es einen Mechanismus.",
              "notes": "42–45 min, Plenum. Rückbezug auf Stunde 1: Jetzt gibt es einen Mechanismus. Merksatz ins Lernjournal."
            }
          ]
        }
      ]
    }
  ]
}
```
