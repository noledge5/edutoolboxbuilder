# Idee: Klassendorf (Stand 13.11.2026; Stufe 1 entschieden und gebaut, Rest offen)

Idee der Lehrkraft: Jede Klasse hat ein Dorf. Jedes Kind hat dort ein eigenes Haus, die Kinder besuchen sich, und
von ihren Münzen kaufen sie Dinge für das ganze Dorf. Ziel: Es soll sich lohnen und cool sein, für die Klasse
auszugeben, statt nur für den eigenen Helden. Unten Vorschläge zum Auswählen; nichts davon ist gebaut.

## Das eigene Haus
- **Grundstück im Dorf**, das Haus wächst mit: Zelt → Hütte → Fachwerkhaus → Turm → Baumhaus/Schloss. Stufen kosten
  Münzen, die höheren brauchen zusätzlich eine Heldenstufe (wie der Laden mit `ladenAb`).
- **Einrichten:** Möbel, Teppiche, Bilder an der Wand, Garten (Beet, Zaun, Teich, Haustier-Hütte für den Begleiter).
  Seltene Möbel auch in Truhen, damit Truhen nicht nur Kleidung geben.
- **Trophäenregal:** Besiegte Bosse, volle Regionen und Sterne erscheinen als Pokale im Haus. Lernen sieht man.
- **Briefkasten:** Hier landen Grüße von Besuchern und Nachrichten vom Dorf („Der Brunnen ist fertig!“).

## Besuchen
- Auf ein Haus tippen → hineinschauen, den Helden des Kindes sehen, das Trophäenregal ansehen.
- **Grüßen ohne Freitext** (Schutz vor Mobbing): feste Sticker wie „Cooles Haus!“, „Danke fürs Spenden!“,
  „Gemeinsam schaffen wir das“. Höchstens ein paar Grüße am Tag je Kind.
- **Klingeln-Bonus:** Wer am Tag drei Häuser besucht, bekommt ein paar Münzen. Bringt Leben ins Dorf.
- Nur die eigene Klasse sieht das Dorf. Kein Handel und keine Geschenke von Münzen zwischen Kindern (sonst Druck
  und Tauschgeschäfte); nur Sticker.

## Für das Dorf kaufen (der Kern)
- **Dorfprojekte mit Spendenbalken:** Brunnen, Brücke, Marktplatz, Bibliothek, Sternwarte, Leuchtturm, Drachenhort,
  Festwiese, Schmiede, Bäckerei. Jedes Kind wirft Münzen in die Dorfkasse, der Balken füllt sich, dann steht das
  Gebäude mit kleiner Bau-Animation im Dorf.
- **Jedes Gebäude bringt allen etwas**, das man allein nie bekommt:
  - Bäckerei: +5 % Münzen für alle (dauerhaft, gedeckelt durch `MUENZEN_TAG`).
  - Schmiede: neue Teile nur für Kinder dieses Dorfs (Dorfwappen-Schild, Bürgermeisterhut).
  - Bibliothek: ein Tipp mehr je Runde oder ein Herz mehr im Bosskampf.
  - Sternwarte: einmal je Woche eine „Sternschnuppen-Truhe“ für alle, die gelernt haben.
  - Drachenhort: ein neuer Boss oder eine neue Welt auf der Karte.
  - Festwiese: Dorffest, verbunden mit einer echten Belohnung, die die Lehrkraft festlegt (z. B. Spielstunde) –
    nutzt die vorhandenen Klassengutscheine.
- **Spenden lohnt sich mehr als Kaufen:** Jede gespendete Münze zählt 1,5-fach („Bürgermeister-Bonus“), oder die
  Lehrkraft legt einen Zuschuss drauf, wenn die Klasse z. B. die Hälfte geschafft hat.
- **Stifterplakette:** Am fertigen Gebäude stehen die Namen aller, die geholfen haben – ohne Beträge, damit
  niemand vorgeführt wird, der wenig hat. Wer bei fünf Projekten geholfen hat, bekommt den Titel „Dorfgründerin/
  Dorfgründer“ und ein Abzeichen am Helden.
- **Abstimmen, was als Nächstes gebaut wird:** Die Lehrkraft gibt zwei bis drei Projekte zur Wahl, die Klasse
  stimmt ab. Mitbestimmung macht Lust zu spenden.
- **Dorfstufe:** Mit jedem Gebäude steigt das Dorf eine Stufe (Weiler → Dorf → Marktflecken → Stadt). Höhere Stufen
  schalten Jahreszeiten und Deko frei (Schnee im Winter, Laternen im Herbst).

## Dorf und Lernen verbinden
- **Dorfaufträge der Woche:** „Wenn die Klasse 300 Aufgaben richtig hat, wächst der Dorfbaum“, „Alle besiegen den
  Boss zusammen → Feuerwerk“. Baut auf dem vorhandenen Klassenziel (`klassenZiel`) auf.
- **Ereignisse:** Ein Sturm beschädigt die Brücke, wenn die Klasse eine Woche kaum lernt; Reparieren geht nur mit
  Lernen (Sterne), nicht mit Münzen. Sanft, ohne Verlust von Gekauftem.
- Ein Teil der Bosskampf-Beute landet in der Dorfkasse.

## Fairness und Schutz
- Spenden je Kind und Woche deckeln (sonst entscheidet ein fleißiges Kind allein).
- Keine Beträge anderer Kinder sichtbar; Ranglisten nur fürs ganze Dorf, nie Kind gegen Kind.
- Kein Freitext, keine Fotos; Namen wie bisher nur in der Klasse.
- Die Lehrkraft kann das Dorf an- und ausschalten und Projekte freigeben.

## Technik (grob)
- Braucht Migrationen (Freigabe der Lehrkraft in ihrer App): Dorf je Klasse, Haus je Kind, Spenden,
  Dorfprojekte; Münzen werden nur auf dem Server abgezogen (wie beim Laden).
- Häuser, Möbel und Gebäude als Vektor-Code wie die Figuren (Skill `figur`), Werkstatt zum Prüfen.
- Erst planen (Skill `aufgabe`), in Stufen bauen: 1. Dorfkasse mit einem Projekt und Stifterplakette,
  2. eigenes Haus und Besuche, 3. Einrichten, Abstimmen, Ereignisse.

## Entschieden (13.11.2026)
- Zuerst Stufe 1 „Dorfkasse“ (gebaut, siehe docs/roadmap.md). Bürgermeister-Bonus 1,5-fach, kein Zuschuss der
  Lehrkraft. Deckel 200 Münzen je Kind und Woche. Echte Belohnung: ja, frei als Text je Projekt.

## Stufe 2: eigene Häuser und neuer Stil (18.11.2026)
- **Entschieden:** Dorf zuerst (Stil + Dorf als scrollbare Karte, dann eigene Häuser, danach Figuren und Gegenstände
  neu zeichnen). Hauspreise „teuer“: Zelt gratis, Hütte 300, Holzhaus 800, Fachwerkhaus 1800, Turm 4000 Münzen
  (höhere Stufen zusätzlich mit Heldenstufe).
- **Vorschlag Aufbau:** eigene Dorfkarte zum Scrollen mit Weg; Dorfplatz mit den Gemeinschaftsgebäuden; am Weg ein
  Grundstück je Kind mit Namensschild, freie abgesteckt; je 6 Häuser ein Viertel um einen kleinen Platz,
  Gemeinschaftsgebäude als Wegmarken dazwischen. Gemeinschaftsgebäude schalten etwas für alle Häuser frei
  (Bäckerei → Brezelschild, Schmiede → Eisenzaun …). Besuchen: Held vor dem Haus, Trophäenregal, Sticker-Gruß.
- **Stil:** Stilprobe `docs/design/lernquest/stilprobe/dorf-v1.mjs` (Bild daneben): runde Grundformen, drei Töne und
  Lichtkante je Fläche, weiche Verläufe, Pillenschatten, Material (Ziegel, Fachwerk, Balken), Schrägansicht, ohne dunkle
  Umrisse. Vorbild: Duolingo „Shape Language“ und das Mockup der Lehrkraft.
- **Rückmeldung der Lehrkraft (18.11.):** mehr Detail; Umgebung und Häuser schräg von oben (isometrisch), Figuren flach
  und rund wie Duolingo; Farben passen; Häuser größer und modular; Licht am Abend; Anbauten auch über Belohnungen
  (Truhen) freischaltbar. Umgesetzt in Stilprobe 2 `docs/design/lernquest/stilprobe/haus-v2.mjs` (Bild daneben):
  Grundhaus am Tag, ausgebaut am Abend (Turm, Anbau, Balkon, Garten, Zaun, Laterne), Kind im Duolingo-Stil, Anbauten
  als Belohnungs-Karten mit Seltenheitsrahmen. Iso-Helfer (`box`, `dach`, Fenster) im Skript sind die Grundlage für den
  Umbau in `src/lernquest/figuren/`.

## Offen zur Entscheidung (Lehrkraft)
- Welche Teile davon? Reihenfolge? Bürgermeister-Bonus oder Zuschuss der Lehrkraft? Deckel je Woche wie hoch?
- Echte Belohnung beim Dorffest: ja/nein, welche?
