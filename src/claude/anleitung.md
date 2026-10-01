---
name: arbeitsblatt-baukasten
description: Erstellt Stundenpakete und Jahrespläne als JSON-Datei für den Arbeitsblatt-Baukasten, auch für Englisch mit Vokabeln, Grammatik, Hör- und Lesetexten, Sprechen, Schreiben und Klassenarbeiten. Verwenden, wenn eine Lehrkraft Arbeitsblätter, Unterrichtsstunden, Units, Module oder einen Jahresplan für den Baukasten erstellen, umwandeln oder überarbeiten möchte.
---

# Stundenpakete für den Arbeitsblatt-Baukasten

Du erstellst Unterrichtsmaterial für eine Lehrkraft an einer Realschule in Baden-Württemberg, zum Beispiel für Englisch oder Geographie. Das Ergebnis ist immer eine **JSON-Datei im Format „Stundenpaket“**. Die Lehrkraft öffnet sie im Arbeitsblatt-Baukasten ({{APP_URL}}) unter „Mit Claude“. Dort entstehen daraus Module mit Stunden und Arbeitsblättern, die sie weiter bearbeitet, druckt (Schüler- oder Lösungsfassung, Farbe oder S/W) und im Jahresplan sieht.

## Grundprinzipien

1. **Ergebnis ist immer eine Datei:** ein Stundenpaket (JSON) nach dieser Anleitung, nichts anderes.
2. **Erst klären, dann bauen:** höchstens drei Rückfragen; mitgebrachtes Material genau übernehmen.
3. **Von oben nach unten planen:** Kompetenzraster (G/M/E, Bildungsplan BW) → je Stunde eine Lehrkraft-Seite (Ziel, Verlauf für 45 Minuten, Erwartungshorizont, Abruffragen) → ein bis drei Schülerseiten → auf Wunsch Folien.
4. **Jede Aufgabe hat eine eindeutige Lösung** (`[[…]]`, `*`, `T/F/NG`, `solution`). Die Schülerfassung zeigt sie nie; Lösungsfassung, Folien und die digitale Auswertung brauchen sie.
5. **Differenzieren:** Niveau-Sterne, jede Kompetenz mit Aufgaben verknüpft, Tipps; Punkte und Notenschlüssel bei Tests.
6. **Gute Arbeitsblätter:** kurze Aufträge mit Operator, vom Einfachen zum Schweren, einfache Sprache, Sicherung am Ende, genug Schreibraum, keine Seite zu voll.
7. **Auch digital lösbar:** Die Lehrkraft teilt Aufgaben per Link und QR-Code aus; Schüler lösen sie am Tablet und der Baukasten wertet automatisch aus. Schreib Aufgaben deshalb so, dass ihre Lösung eindeutig prüfbar ist (siehe „Digital lösbar“).
8. **Englisch:** Aufträge auf Englisch, in Klasse 5/6 mit deutscher Hilfe; Vokabeln mit Lautschrift; ohne Lehrwerk eigene Texte mit der Grammatik als roter Linie.
9. **Bilder:** keine Fotos, sondern Bildunterschrift und englische Suchwörter für die Bildsuche des Baukastens.
10. **Folien begleiten das Arbeitsblatt** Aufgabe für Aufgabe, knapp, Lösungen auf Klick, Sprechernotizen auf Deutsch.

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

Für einen Jahresplan schreibst du ein Paket mit allen Modulen des Jahrgangs, je mit `number`, `title`, `icon`, `description` (Themen- und Grammatikschwerpunkt), `weeks`, `competences` und nur mit Lehrwerk `textbook`. Die Summe der `weeks` sollte die Zahl der Schulwochen nicht übersteigen; plane ein bis zwei Wochen Puffer ein.

Plane die Stunden als **geplante Stunden** (`number`, `title`, `plan`, ohne `pages`), so weit du sie schon absehen kannst; rechne mit den Stunden pro Woche, die die Lehrkraft nennt (Englisch Klasse 5 meist 4–5). Die Lehrkraft sieht sie im Baukasten blass mit dem Hinweis „Geplant“ und arbeitet sie nach und nach aus. Hat sie schon Module im Baukasten, gib ihnen dieselbe `number`: Ausgearbeitete Stunden bleiben erhalten, fehlende geplante Stunden kommen dazu.

Die Lehrkraft kann einen Jahresplan auch ohne JSON übernehmen, im Baukasten unter „Jahresplan“ → „Importieren“ als Text: eine Zeile pro Modul (`Modul 1: Hello, school! | 5 Wochen | Sich vorstellen`), darunter die Stunden mit „-“ (`- Stunde 1: Hello, I’m … | Begrüßen und vorstellen`). Bittet sie dich um diese Textform, halte dich genau daran.

Der Baukasten kennt das Schuljahr {{SCHULJAHR}} in Baden-Württemberg ({{SCHULWOCHEN}} Schulwochen):

{{FERIEN}}

Für ein anderes Schuljahr oder Bundesland gib `schoolYear` mit (nur mit Daten, die du sicher kennst, z. B. aus dem Material der Lehrkraft oder von der Seite des Kultusministeriums):

```json
"schoolYear": { "name": "2026/27", "start": "2026-09-14", "end": "2027-07-28", "holidays": [ { "name": "Herbstferien", "from": "2026-10-26", "to": "2026-10-31" } ] }
```

## Bilder

Du kannst keine Fotos liefern. Setze stattdessen einen Baustein „Abbildung“ mit aussagekräftiger Bildunterschrift (`caption`) und in `search` zwei, drei **englische Suchwörter** für ein passendes freies Bild (z. B. `"search": "volcano eruption"`, `"search": "map united kingdom"`). Die Lehrkraft tippt im Baukasten auf „Im Internet suchen“; die Suche in Openverse und Wikimedia Commons startet mit deinen Wörtern, und Urheber und Lizenz landen automatisch in `source`. Lass `source` deshalb leer, außer du kennst die Quelle eines Bildes aus dem Material der Lehrkraft. In „Bild-Vokabeln“ nimmst du Emojis (`🐶 | dog`), die die Lehrkraft durch eigene Bilder ersetzen kann. Nur wenn du ein Bild wirklich als Datei hast (z. B. eine selbst erstellte SVG-Grafik), trag es unter `"images": { "abb1": "data:image/svg+xml;base64,…" }` ein und setze im Baustein `"image": "abb1"`.

## Folien

Zu jeder Stunde gehören auf Wunsch Präsentationsfolien: `"slides": [ … ]` in der Stunde. Die Lehrkraft zeigt sie im Baukasten mit „Präsentieren“ (Pfeiltasten, Tippen oder Wischen blättern; Antworten erscheinen auf Klick), druckt sie als Handout oder sichert sie als PDF oder PowerPoint-Datei. Kopfleiste (Stunde · Klasse · Nummer), Symbol, Fußzeile und Foliennummer setzt der Baukasten selbst.

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
| `reveal` | `true`: Lösungen erscheinen erst auf Klick: Antworten (`list`, `task`), Wörter in Lücken (`task`, Merksatz in `exit` und `statement`), die Lösung (`text` bei `task`), Bedeutungen (`words`), Text in den Kästen (`compare`), Erklärungen in den Schritten (`flow`) |
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

Jedes Element hat außerdem `step` (0 = mit der Folie, 1, 2 … = beim ersten, zweiten … Klick) und `anim` (wie es dann erscheint: `"fade"`, Standard, `"rise"`, `"zoom"`, `"left"`, `"none"`). Die Klicks zählen für die ganze Folie gemeinsam: Mit `build` belegen die Einträge die ersten Klicks (bei `list` mit `reveal` zwei je Frage); ein Element danach bekommt die nächste Zahl. Beispiel: `{ "kind": "text", "text": "Tipp: Schaut ins Lernjournal!", "style": "note", "x": 1240, "y": 700, "w": 580, "h": 200, "step": 1 }`.

**Einzelne Teile auf Klick** (`anims`): Jeder Teil einer Folie kann auf einem eigenen Klick erscheinen, mit `step` (Klick-Nummer, 0 = mit der Folie) und `anim`. Schlüssel: `title` (Überschrift, Leitfrage, Merksatz, Arbeitsauftrag), `text` (Untertitel, Zitat, Hinweis, Satz darunter, Rückbezug, Lösung einer Aufgabe), `image` (Bild der Arten `image` und `task`), `gaps` (die Wörter in den Lücken eines Merksatzes), `item:0`, `item:1` … (Einträge, gezählt ab 0) und `answer:0`, `answer:1` … (die Lösung bzw. der zweite Teil des Eintrags, auch die Wörter in seinen Lücken). `anims` gilt vor `build` und `reveal`. Beispiel für eine Deutung, deren Hinweis erst nach einer Diskussion kommt: `"layout": "statement", "anims": { "text": { "step": 1, "anim": "zoom" } }`.

Videos: Schreib nur Links, die die Lehrkraft dir gegeben hat oder die du sicher kennst; sonst ein Textfeld „Video: …“ als Platzhalter und in `notes`, wonach die Lehrkraft suchen soll.

So werden gute Folien:
- Die Folien begleiten das Arbeitsblatt, in seiner Reihenfolge: Titel, Abrufphase oder Einstieg, dann zu jeder Aufgabe eine Folie `task` (Nummer, Niveau und Punkte wie auf dem Blatt, Arbeitsauftrag, Einträge, Lösung auf Klick mit `reveal`), dazwischen die Abbildungen (`image`, oder als `image` auf der Aufgabenfolie direkt danach), Fließschemata (`flow`), Vokabeln (`words`) und Regeln (`statement`), am Ende der Merksatz (`exit`, Lücken auf Klick).
- Die Lösungen auf den Folien sind dieselben wie in der Lösungsfassung des Arbeitsblatts: angekreuzte Antworten als „Antwort \| ✓“, Lücken als `[[…]]`, Zuordnungen als „links \| rechts“, richtig/falsch als „Aussage \| richtig“, offene Aufgaben als Musterlösung in `text`.
- Schrittweise einblenden (`build`, `step`) lohnt sich, wo die Klasse erst nachdenken soll: Abruffragen, Schritte eines Schemas, Vergleiche. Nicht jede Folie braucht Animationen.
- Folien sind knapp: Aufträge, Stichworte, Lösungen, Merksätze. Lange Texte (Lesetexte, Quellen) stehen auf dem Arbeitsblatt.
- Der Baukasten schlägt solche Folien auch selbst aus dem Arbeitsblatt vor (Menü „Folien“ im Arbeitsblatt); eigene Folien lohnen sich, wenn sie mehr bieten: Einstieg, Impulse, Bilder, Videos.
- Die Farbe (`type`) folgt der Phase: dieselbe wie das Arbeitsblatt, mit dem die Klasse gerade arbeitet.
- Folien für Arbeitsphasen bekommen `form` und `minutes`: Beim Präsentieren startet der Timer mit diesen Minuten (Taste T), und die Lehrkraft kann die Lautstärke-Ampel zeigen.
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
- Jede Aufgabe hat eine Lösung (`[[…]]`, `*`, `T/F/NG`, `solution` …), wo das möglich ist, eindeutig prüfbar, Varianten mit ` / `.
- Englische Module: `"lang": "en"`, Aufträge auf Englisch, in Klasse 5 und 6 mit `help`.
- Keine Seite ist voller als etwa 840 px.
- Geplante Stunden haben `title` und `plan`, aber keine `pages`; ausgearbeitete Stunden haben `pages`.
- Reicht ein Arbeitsblatt nicht auf eine Seite, mach die zweite Seite zur Rückseite (`"back": true`) statt zu einem neuen Blatt.
- Folien: `layout` und `type` aus den Listen, höchstens 6 Einträge bei `list` und `task`, 5 bei `flow`, 3 bei `compare`, 12 bei `words`; Elemente liegen ganz auf der Folie (`x + w` ≤ 1920, `y + h` ≤ 1080) und verdecken keinen Text.

## Alle Bausteine

{{BAUSTEINE}}

## Symbole

Schlüssel für `icon`, mit Bedeutung:

{{SYMBOLE}}

## Beispiel 1: Englisch, Klasse 5 (eine Stunde)

Lehrkraft-Seite, Vokabeln, Grammatik, Sprechen und Schreiben, dazu vier Folien. Felder mit Standardwert sind weggelassen.

```json
{{BEISPIEL_EN}}
```

## Beispiel 2: Jahresplan Englisch, Klasse 5

Nur die Planung, ohne Lehrwerk: Module mit Themen- und Grammatikschwerpunkt und Wochen, die ersten Stunden als geplante Stunden (ohne `pages`), ein Modul schon mit Kompetenz, dazu das Schuljahr.

```json
{{BEISPIEL_PLAN}}
```

## Beispiel 3: Geographie, Klasse 9 (Sachfach)

Lehrkraft-Seite, Versuchsprotokoll und Sicherung, dazu die Folien der Stunde.

```json
{{BEISPIEL_GEO}}
```
