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
- **Suchen:** die Lupe oben in Übersicht, Modul, Jahresplan, Arbeitsblatt und Folien, am Mac auch ⌘K. Gesucht wird in allen Fächern und Klassen: Titel von Modulen und Stunden, Planungsnotizen, alle Texte der Bausteine (auch hinterlegte Lösungen) und der Folien samt Sprechernotizen. Groß- und Kleinschreibung und Akzente sind egal (ü findet auch u, ß auch ss); mehrere Wörter grenzen ein, auch mit der Bausteinart („Merksatz Treibhaus“). Treffer aus dem Fach und der Klasse, in denen du gerade bist, stehen oben. Ein Treffer öffnet die Stunde, wählt den Baustein bzw. die Folie aus und markiert das Suchwort ein paar Sekunden lang. Mit leerem Feld zeigt die Suche die zuletzt geöffneten Stunden; ↑/↓ und Enter wählen, Esc schließt.
- Das Kürzel im Fußband (z. B. „K9 · M1 · S2“) und das Themen-Symbol kommen automatisch aus Klasse, Modul und Stunde.

### Arbeitsblatt
- **Bausteine einfügen:** aus der Toolbox auf die Seite ziehen oder anklicken (landet hinter dem ausgewählten Element). Auch auf Kopfband oder Fußband ablegen geht: dann oben bzw. unten auf der Seite. Oben in der Toolbox findet „Baustein suchen …“ einen Baustein nach Namen oder Stichwort („Lücke“, „Mindmap“, „Vokabeltest“, „true false“); Enter fügt den ersten Treffer ein.
- **Mehrere Bausteine:** ⌘-Klick nimmt einen Baustein dazu oder heraus, ⇧-Klick wählt alle bis dorthin, ⌘A alle. Auf dem iPad „Mehrere auswählen“ (in der schwarzen Leiste am Baustein oder unten im Panel), dann weitere Bausteine antippen. Oben über der Seite erscheint eine Leiste: In die Ablage, Ausschneiden, Duplizieren, Löschen und „Fertig“.
- **Ablage, Kopieren zwischen Stunden:** ⌘C oder „In die Ablage“ legt die ausgewählten Bausteine in die Ablage oben in der Toolbox, ⌘X schneidet sie aus. In derselben oder einer anderen Stunde fügt ⌘V den neuesten Eintrag hinter der Auswahl ein; jeden Eintrag kannst du auch in der Toolbox antippen (landet hinter der Auswahl) oder an eine Stelle auf der Seite ziehen. Die Ablage behält die letzten 20 Einträge, bis du sie leerst, und gilt nur für dieses Gerät. Der Text kommt zusätzlich in die Zwischenablage, für andere Apps. Verknüpfungen mit Kompetenzen eines anderen Moduls fallen beim Einfügen weg.
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
- **Tastatur:** Entf löscht, Esc hebt die Auswahl auf, Strg/Cmd+Z macht rückgängig (mit Umschalt: wiederholen), Strg/Cmd+D dupliziert, ↑/↓ wählt das vorige/nächste Element, Alt+↑/↓ verschiebt es. Cmd+C/X/V für die Ablage, Cmd+A wählt alle Bausteine, Cmd+K sucht.
- **Zoom:** −/+, „Seite einpassen“; der Zoom bleibt beim Neuladen erhalten.
- **iPad:** Zum Ziehen kurz gedrückt halten. Im Hochformat öffnet „Toolbox“ die Bausteine und die Ablage, das Panel erscheint beim Antippen eines Elements.
- **Drucken / PDF:** Erst **Schülerfassung** oder **Lösungsfassung** wählen, dann **Farbe** oder **S/W-Kopiervorlage** (Umrisse statt Farbflächen). „Vorschau“ zeigt das Ergebnis, „Drucken“ öffnet den Druckdialog des Browsers: eine A4-Seite pro Blatt, Rand 0. Ist eine Seite zu voll, fragt die App vorher nach.
- **Niveau-Fassungen:** Haben Aufgaben Niveau-Sterne, wählt der Druckdialog, welche Niveaus aufs Blatt kommen (★ G, ★★ M, ★★★ E, auch mehrere). Aufgaben ohne Niveau bleiben immer; Nummern, Punkte, Notenschlüssel und Tippkarten passen sich an, im Fußband steht das Niveau (z. B. „K9 · M1 · S2 · G“). Seiten, auf denen nichts übrig bleibt, fallen weg.
- **Testgruppen A/B:** „Gruppe A“ ist das Blatt, wie es ist; „Gruppe B“ hat die Antworten beim Ankreuzen, Zuordnen und Richtig/Falsch und die Einträge von Sätze ordnen, Umformen, Knick-Vokabeltest, Bild-Vokabeln und Bingo in anderer Reihenfolge (jedes Mal dieselbe). Die Gruppe steht im Kopfband, die Lösungsfassung passt zur Gruppe.

### Folien
Jede Stunde hat ein eigenes Abteil für Präsentationsfolien (16:9), im Stil der Arbeitsblätter und der Folien-Vorlage aus dem Design. Öffnen über „Folien“ in der Stundenliste des Moduls oder oben im Arbeitsblatt.
- **Aus dem Arbeitsblatt:** „Folien aus dem Arbeitsblatt vorschlagen“ baut Folien, die das Blatt in seiner Reihenfolge begleiten: Titel mit Leitfrage, Abruffragen, dann Seite für Seite jede Aufgabe auf einer eigenen Folie (Nummer, Niveau-Sterne, Punkte, Arbeitsauftrag, Hilfe, Einträge) mit ihrer Lösung auf Klick. Angekreuzte Antworten bekommen ein ✓, Lücken füllen sich, Zuordnungen, richtig/falsch, Tabellen, geordnete Sätze und Musterlösungen erscheinen. Dazu kommen Abbildungen (vor einer Aufgabe neben ihr, sonst als eigene Bildfolie), Fließschemata, Vokabeln, Wortspeicher, Grammatikregeln, Hinweise, QR-Codes und am Ende der Merksatz, dessen Lücken sich auf Klick füllen. Zeiten und Notizen kommen aus dem Stundenverlauf, Tipps und Erwartungshorizont in die Sprechernotizen.
- **Arten:** Titel, Fragen (nummeriert, Antworten erst auf Klick), Aufgabe (wie auf dem Arbeitsblatt, Lücken als [[Wort]], Lösung auf Klick, Bild daneben), Zitat + Leitfrage, Aussage mit Hinweis, Vergleich (2–3 Kästen), Fließschema, Wörter (Karten, Bedeutung auf Klick), Bild (mit Bildsuche), Exit/Merksatz und „Leer“ für ganz freie Folien. Farbe wie ein Blatt-Typ, Phase, Sozialform und Minuten in der Kopfleiste, Sprechernotizen.
- **Elemente einfügen:** über der Folie „Textfeld“, „Bild“, „Video“, „QR-Code“. Auf der Folie ziehen verschiebt, die Ecke unten rechts ändert die Größe (auch mit dem Finger), Pfeiltasten schieben genau, Entf löscht, Doppelklick auf ein Textfeld schreibt direkt darin, bei Bild, Video und QR-Code springt er zu den Feldern. Textfelder als Kasten, Notizzettel, schlicht oder Überschrift, in fünf Größen. Videos von YouTube (im erweiterten Datenschutzmodus, Startzeit aus dem Link), Vimeo oder als MP4-Link; sie spielen beim Präsentieren (dafür braucht es Internet), im Editor steht ein Standbild, im Handout ein QR-Code.
- **Fett und farbig:** Wörter im Textfeld markieren, dann **B** (fett) oder den Marker (farbig) drücken.
- **Schrittweise einblenden und Animationen:** Einträge einer Folie (Fragen, Kästen, Schritte, Wortkarten) „nacheinander, je Klick“, bei Fragen mit Antworten abwechselnd Frage und Antwort; jedes Element „auf Klick“ beim wievielten Klick. Auch jeder einzelne Teil einer Folie lässt sich antippen und auf einen eigenen Klick legen: Überschrift, Text, Zitat, Hinweis, Bild, jede Frage und jede Antwort. Lösungen per Klick gibt es bei Fragen, Wörtern, Vergleich (Text in den Kästen) und Fließschema (Erklärungen). „Ablauf beim Präsentieren“ zeigt, was auf Klick 1, 2, 3 … kommt; „Alles gleich zeigen“ nimmt alle Klicks wieder heraus. Erscheinen als Einblenden, Von unten, Zoomen oder Von links; dazu ein Übergang je Folie (Überblenden, Schieben, Zoomen). Im Editor zeigen kleine Zahlen, auf welchem Klick etwas kommt; „Ab hier zeigen“ spielt die Folie mit allen Animationen ab.
- **Bearbeiten:** links die Folien, in der Mitte die gewählte, rechts die Felder (auf dem iPad im Hochformat darunter). „+ Folie“ fügt nach der gewählten ein, Pfeile verschieben, Duplizieren, Rückgängig (⌘Z).
- **Direkt auf der Folie schreiben:** Doppelklick (iPad: zweimal tippen) auf einen Text der Folie öffnet ihn genau dort, in der Schrift der Folie: Überschrift, Arbeitsauftrag, Hilfe, Phase, jede Frage, Antwort, jedes Wort, jeder Kasten und jedes Textfeld. Ein angetippter Teil hat außerdem den Knopf „Text ändern“. Enter oder Esc beendet (in längeren Texten macht Enter eine neue Zeile).
- **Design:** oben „Design“ wählt das Aussehen aller Folien der Stunde: Organisch (wie die Arbeitsblätter), Klar (schlicht, weiß, serifenlos), Heft (kariertes Schulheft mit rotem Rand, Handschrift), Tafel (dunkelgrüne Tafel, Kreide) oder Kontrast (schwarz auf weiß für helle Räume und schwache Beamer). Es gilt beim Bearbeiten, Präsentieren, Drucken und im PowerPoint-Export.
- **PowerPoint:** „Folien → Als PowerPoint sichern …“ macht eine .pptx-Datei, die so aussieht wie hier, im gewählten Design. Alle Texte, Kästen und Bilder bleiben in PowerPoint und Keynote bearbeitbar; was hier auf Klick kommt (Lösungen, Lücken, Einträge), kommt dort als Animation auf Klick; Sprechernotizen, Übergänge und QR-Links kommen mit. „Standardschriften“ (Georgia, Arial, Comic Sans) sehen auf jedem Rechner gleich aus; „Wie im Baukasten“ braucht Caprasimo, Figtree und Kalam (kostenlos bei Google Fonts). „Folien → PowerPoint öffnen …“ liest eine .pptx-Datei: Titelfolien, Aufzählungen, Folien mit Bild, Tabellen und Sprechernotizen werden passende Folienarten, mehrere Bilder eine freie Folie; die Folien lassen sich hinten anhängen oder ersetzen. Folien, die aus dem Baukasten kommen und in PowerPoint nicht geändert wurden, kommen genau so zurück, wie sie waren (mit Design, Animationen und Bildern).
- **Löschen:** der Papierkorb an der Folie in der Leiste links oder Entf auf der gewählten Folie; „Folien → Alle Folien löschen …“ entfernt die ganze Präsentation der Stunde. Rückgängig (⌘Z) holt sie zurück, solange die Folien offen sind.
- **Ohne die Folien zu öffnen:** Im Arbeitsblatt (oben „Folien · 9“) und in der Stundenliste des Moduls öffnet der Knopf „Folien“ ein Menü: „Folien öffnen“, „Neu aus diesem Arbeitsblatt erzeugen …“ (ersetzt die Folien durch neue Vorschläge aus dem aktuellen Arbeitsblatt) und „Alle Folien löschen …“. Danach erscheint unten „Rückgängig“.
- **Präsentieren:** Vollbild; weiter mit →, Leertaste, Klick oder Wischen nach links (erst die Klicks der Folie, dann die nächste Folie), zurück mit ←, Klick ins linke Drittel oder Wischen nach rechts. Punkte unten zeigen die Klicks der Folie. N zeigt die Sprechernotizen, F Vollbild, Esc beendet. Nach dem Abspielen eines Videos einmal neben das Video klicken, dann reagieren die Tasten wieder.
- **Werkzeuge beim Präsentieren** (in der Leiste unten, die nach ein paar Sekunden verschwindet und bei Bewegung oder Antippen wiederkommt):
  - **Timer (T):** Hat die Folie Minuten (z. B. „allein · 5 min“), startet T bzw. „5 Min. starten“ genau diese Zeit; sonst 1, 3, 5, 10 oder 15 Minuten. Unten am Rand läuft ein Balken leer, darüber stehen die Minuten, in der letzten Minute orange, am Ende blinkend. Anhalten, ±1 Minute und „Aus“ im selben Feld. Der Timer läuft weiter, wenn du blätterst. „Gong am Ende“ an oder aus (bleibt gespeichert).
  - **Lautstärke-Ampel (A):** Still (rot), Flüstern (gelb), Leise (grün) unten rechts auf der Folie; A schaltet weiter, ein Tipp auf die aktive Farbe schaltet sie aus.
  - **Schwarzbild (B) und Weißbild (W):** Der Beamer zeigt kurz schwarz oder weiß, ohne die Präsentation zu verlassen; die nächste Taste oder ein Klick holt die Folie zurück, ohne weiterzublättern.
- **Referentenansicht** (am Mac, Beamer als zweiter Bildschirm, nicht gespiegelt): Die Klasse sieht nur die Folien, du siehst wie in Keynote die aktuelle Folie groß, darunter Zurück/Weiter, rechts den nächsten Klick bzw. die nächste Folie und die Sprechernotizen (mit − und + größer oder kleiner), oben Uhrzeit, Zeit seit Beginn, Timer, Ampel und Schwarz-/Weißbild. In Chrome und Edge legt der Baukasten die Folien nach einmaliger Erlaubnis selbst in Vollbild auf den Beamer. In Safari öffnet sich ein zweites Fenster mit den Folien: einmal auf den Beamer ziehen und hineinklicken, dann füllt es den Bildschirm. Blättern geht in beiden Fenstern; schließt du eines, läuft die Präsentation im anderen weiter. Auf dem iPad gibt es die Referentenansicht nicht, weil das iPad den Bildschirm immer spiegelt.
- **Drucken:** Handout (zwei Folien je A4-Seite, ohne die Lösungen, die erst auf Klick kommen), mit Sprechernotizen (drei je Seite, für dich) oder die Folien als PDF im Querformat.

### Digital austeilen
Aufgaben gehen per Link und QR-Code an die Klasse und werden am Tablet, Handy oder Laptop gelöst, ohne Konto und ohne Code.
- **Austeilen:** im Arbeitsblatt eine Aufgabe („Digital austeilen“ in der Leiste am Baustein oder im Panel), mehrere ausgewählte Bausteine (Leiste oben → „Austeilen“) oder oben „Digital → Ganzes Arbeitsblatt austeilen …“. Titel und Art wählen:
  - **Übung:** Die Schüler prüfen jede Aufgabe selbst („Prüfen“), versuchen es nochmal und können danach die Lösung sehen; bei offenen Fragen die Musterlösung.
  - **Test:** keine Lösungen, am Ende „Abgeben“. Die Lösungen werden gar nicht erst mitgeschickt.
- Danach gibt es **Link und QR-Code** (kopieren, „Groß zeigen“ für den Beamer, „Ausprobieren“). Schüler geben Vorname und ersten Buchstaben des Nachnamens ein („Lea M.“) und arbeiten los; ihr Stand bleibt beim Neuladen erhalten.
- **Auswertung** (oben „Digital → Auswertung: …“ oder direkt nach dem Austeilen), alle 5 Sekunden aktuell:
  - **Klasse:** wer dabei ist und wer abgegeben hat, Punkte je Aufgabe farbig (grün ab 80 %, gelb ab 50 %, rot darunter). Eine Zelle antippen zeigt die Antworten, bei Übungen auch den ersten Versuch.
  - **Häufige Fehler:** je Aufgabe, welche falsche Antwort wie oft kam (bei Übungen aus dem ersten Versuch) und die Antworten auf offene Fragen.
  - **Kompetenzen:** je Kompetenz aus dem Kompetenzraster, wer wie viel richtig hat und wer Hilfe braucht, dazu die Ergebnisse nach Niveau G/M/E.
  - **Für den Beamer:** ohne Namen, mit Anteil richtig und Antwortverteilung zum Besprechen.
- **Formate:** Ankreuzen (auch mehrere richtige), Lückentext, Richtig/Falsch, Zuordnen, Tabelle, Wörter ordnen (Teile antippen), Umformen, Knick-Vokabeltest, Bild-Vokabeln, Wortnetz, Satzbaustellen und frei: Offene Frage, Schreibrahmen, Sprachmittlung. Texte, Bilder, Merksätze und Hinweise erscheinen wie auf dem Blatt. Zeichenfeld und Bingo bleiben auf Papier. Ausgewertet wird ohne Groß-/Kleinschreibung und Satzzeichen am Ende; Lösungsvarianten schreibst du als `[[Erde / Erdoberfläche]]`.
- **Datenschutz:** Namen und Antworten werden im Browser der Schüler verschlüsselt; jeder Auftrag hat einen eigenen Schlüssel, den nur deine Geräte kennen (er reist mit dem Abgleich Mac/iPad). Der Server (Supabase, Frankfurt) sieht nur verschlüsselte Daten und löscht sie nach 14 Tagen; was du einmal geöffnet hast, bleibt auf deinem Gerät. Die Schulleitung solltest du trotzdem informieren.
- **Einrichten (einmal pro Gerät):** Der Baukasten veröffentlicht die Aufträge im GitHub-Repository „baukasten-aufgaben“ und braucht dafür einen Schlüssel, der nur dort schreiben darf. Beim ersten Austeilen führt der Dialog durch die Schritte (Repository anlegen, Schlüssel mit „Contents: Read and write“ nur für dieses Repository erstellen, einfügen).

### Sicherheitsnetz
- **Papierkorb:** Gelöschte Module und Stunden landen im Papierkorb (unten in der Übersicht „Papierkorb · 2“) und bleiben dort 30 Tage mit allen Seiten, Folien und Bildern. Direkt nach dem Löschen holt „Rückgängig“ sie zurück, später „Wiederherstellen“ im Papierkorb. Der Papierkorb gilt nur für dieses Gerät.
- **Frühere Fassungen:** Beim Arbeiten merkt sich der Baukasten etwa jede halbe Stunde, wie eine Stunde vorher aussah, dazu vor jedem Abgleich, Import und neuen Folien (die letzten 20 Fassungen, 30 Tage). Im Arbeitsblatt unter „Datei → Frühere Fassungen …“ oder bei den Folien unter „Folien → Frühere Fassungen …“: „Wiederherstellen“ (die jetzige Fassung bleibt als frühere erhalten) oder „Als Kopie“ (als neue Stunde daneben).
- **Safari:** Im Safari-Tab löscht Safari gespeicherte Daten, wenn die Seite 7 Tage lang nicht geöffnet wurde. Die Übersicht erinnert daran, den Baukasten als App zu installieren, und färbt den Hinweis auf nicht gesicherte Änderungen kräftiger, wenn die letzte Sicherung eine Woche her ist.

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
  share/      Digital austeilen: Auftragsformat, Auswertung je Aufgabe, Verschlüsselung, GitHub, Ergebnis-Server, Auswertung
  student/    die Schüleransicht (a/#<id>): Name, Aufgaben am Gerät lösen, verschlüsselt abgeben
  library/    Übersicht, Modulseite, Kompetenzraster, Druck von Inhaltsübersicht/Kompetenzraster, Routen,
              Abgleich Mac/iPad, Stundenpaket (Import/Export), Jahresplan und sein Import, Vokabeltest, Fachfarben,
              Suche, Papierkorb und frühere Fassungen
  slides/     Folien: Darstellung, Editor, Präsentationsmodus, Druck, Vorschlag aus dem Arbeitsblatt
  claude/     Anleitung für Claude: Text (anleitung.md) plus Bausteinliste, Symbole, Bereiche, Ferien und Beispiele aus dem Code
  model/      Datenmodell eines Arbeitsblatts: Typen, Blocktypen, Blatt-Typen, Operationen, JSON-Prüfung, Undo
  sheet/      die gedruckte A4-Seite (Kopfband, Raster, Fußband, alle Blocktypen, Bearbeiten auf der Seite)
  editor/     Editor-Oberfläche: Toolbox (mit Suche und Ablage), Canvas, Eigenschaften, Datei-Menü, Drag-and-Drop
  storage/    IndexedDB (Bibliothek, Bilder), Sicherungsdateien, Bildsuche (Openverse, Wikimedia Commons)
  styles/     Design-Tokens, Editor-Styles, Druck-Styles
docs/
  design/     Design-Handoff (Spezifikation, Prototyp, Referenzen, Tokens)
  claude/     Kopie der Anleitung für Claude (wird von einem Test aktuell gehalten)
  roadmap.md  Entscheidungen und Phasen
public/       App-Symbol, Manifest und Service Worker (offline nutzbar)
```
