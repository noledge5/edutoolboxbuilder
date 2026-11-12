# Lernquest – Plan

Lern-Web-App für die Schüler, verbunden mit den Modulen des Baukastens: Was in den Stunden behandelt wurde, wird
spielerisch geübt und wiederholt (Vorbild Duolingo und Anton), mit langfristigem Fortschritt, Avatar, Truhen, echten
Belohnungen in der Klasse und Bosskämpfen am Beamer. Entschieden mit der Lehrkraft am 06.11.2026 (Fragerunde), Stand
dieses Dokuments ist der Plan vor dem Bau.

## Entscheidungen

| Thema | Entscheidung | Warum |
|---|---|---|
| Name | **Lernquest** | Wunsch der Lehrkraft. |
| Namen auf dem Server | Klarnamen (Vorname + Kürzel), im Klartext auf Supabase (Frankfurt). | Wunsch der Lehrkraft. Voraussetzung: Freigabe durch die Schule (Verzeichnis der Verarbeitungen, Elterninfo), Vertrag zur Auftragsverarbeitung mit Supabase. Datensparsam: keine E-Mail, kein Geburtsdatum, keine Noten. |
| Anmeldung | Klassen-QR/Klassencode → Namen in der Liste antippen → 4-stelliger PIN. Lehrkraft legt Klasse und PINs im Baukasten an, kann PINs zurücksetzen. | Kein Konto, keine E-Mail, für Klasse 5 machbar. |
| Inhalte | Lösbare Aufgaben der Stunden **plus** ein KI-Fragenpool je Stunde, den die Lehrkraft prüft und freigibt. Eine Stunde wird freigeschaltet, wenn sie unterrichtet ist. | Genug Stoff zum Üben, ohne Handarbeit. |
| Übungsformate | Wirklich wie Anton/Duolingo, nicht das Arbeitsblatt am Bildschirm (Wunsch): Antwort antippen, Paare finden, Wortkacheln zum Satz legen, Lücke mit Kacheln, Bild wählen, Reihenfolge ziehen, in Gruppen sortieren, Punkt auf Karte/Bild setzen, richtig/falsch im Tempo, Englisch mit Vorlesen. Sofortige Rückmeldung mit Ton und Animation, Erklärung bei Fehlern. | Kurze, motivierende Einheiten. |
| Lernweg | Je Fach eine **Weltkarte**, je Modul eine **Region**, je Stunde eine **Station** (Quest) mit 3–5 Runden à ~5 Aufgaben, Sterne je Station; am Ende der Region der Boss. Dazu „Wiederholen“: verteiltes Wiederholen von Früherem und Fehlern (Leitner-Kästen). | Duolingo-Pfad mit RPG-Gefühl (Wunsch). |
| Serie | Wochenziel statt Tagesserie (z. B. 3 Lerntage pro Woche), Ferien und Wochenenden setzen nichts zurück. | Vorschlag, keine Antwort der Lehrkraft; änderbar. Motiviert ohne täglichen Druck. |
| Fortschritt | Erfahrungspunkte → Heldenstufe und Titel; Sterne; Münzen. | Langfristige Progression. |
| Avatar | Eigene Figur aus Ebenen (Körper, Augen, Kopf, Kleidung, Werkzeug, Begleiter, Hintergrund) als Vektorgrafik; erster Satz ~40 Teile in fünf Seltenheiten. | Eigener Stil, keine fremden Spielfiguren. |
| Designregeln | Tokens für Farbe, Schrift, Abstände; feste Zustände, Bewegung, Kontrast nach WCAG AA, Layout für Handy/iPad/Laptop und Avatar-Stil in `docs/design/lernquest/README.md` (Designrunde 06.11.2026, Empfehlungen von Claude, von der Lehrkraft so freigegeben). | Einheitlicher, professioneller Look vor dem Bau von Stufe 2. |
| Ausrüstung | Kleine, gedeckelte Boni nur im Spiel (+Münzen, +Schaden im Bosskampf, ein Herz mehr). Nie Einfluss auf Noten oder echte Belohnungen. | RPG-Gefühl, ohne dass Sammeln wichtiger wird als Lernen. |
| Truhen | Nur fürs Lernen (Sterne: je 3 eine Truhe; Wochenziel, Boss), nie für Geld. Inhalt zufällig, Chancen sichtbar, doppelte Teile → Münzen, Garantie nach einigen Truhen ohne Seltenes. Laden für gezielte Käufe mit Münzen. | Spannung ohne Glücksspiel-Mechanik. |
| Echte Belohnungen | Gutscheine je Klasse mit Preis (eigene Währung „Klassenpunkte“, nicht die Münzen), z. B. Sitzplatz wählen, Hausaufgaben-Joker. Kind fragt an, Lehrkraft hakt „eingelöst“ ab; Grenzen je Woche. Genauer in „Stufe 4“. | Echte Wirkung, Lehrkraft behält die Hand drauf. |
| Bosskampf | Klasse gemeinsam gegen einen Boss: Lehrkraft startet am Beamer, Kinder treten mit ihrem Konto bei, Frage am Beamer, Antwort am Gerät mit Zeitlimit; Richtig = Schaden (schneller und in Serie mehr), Falsch = Boss trifft den Klassen-Lebensbalken. Fällt der Boss, gibt es eine Truhe für alle. Keine Einzel-Rangliste. | Teamaufgabe statt Einzelquest, niemand wird bloßgestellt. |
| Miteinander | Klassen-Ansicht mit Avataren und gemeinsamem Wochenfortschritt, ohne Rangliste und ohne Chat. | Vorschlag, keine Antwort der Lehrkraft; änderbar. |
| Geräte | Zuerst fürs Handy (hochkant, große Knöpfe), genauso iPad und Laptop; als App auf den Home-Bildschirm legbar. | Zuhause Handy, in der Schule iPad. |
| Branch | Langer Branch `lernquest` neben `main`; jede Stufe wird dort fertig und kommt erst nach Freigabe nach `main` (= veröffentlichen). | Wunsch der Lehrkraft. |

## Aufbau (Technik)

- **Eigene Seite im selben Repo**, wie die Schüleransicht: dritter Einstieg `lernquest/index.html` (Vite), Adresse
  `…/lernquest/`. Nutzt die Bausteine, Typen und Prüffunktionen des Baukastens (`src/model`, `src/share/grade.ts`),
  eigener Ordner `src/lernquest/`. Eigener Stil (Spiel-Look), nicht `src/sheet/`.
- **Lehrkraft-Seite im Baukasten:** neuer Bereich „Lernquest“ je Klasse: Klasse und Kinder anlegen, PINs und QR-Code
  drucken, Stunden freischalten, Fragenpool prüfen, Gutscheine verwalten und Anfragen abhaken, Bosskampf am Beamer
  starten, Fortschritt sehen (je Kind und je Kompetenz).
- **So reden die beiden miteinander:** über Supabase (Projekt „baukasten“, Frankfurt), wie beim Austeilen nur über
  Datenbank-Funktionen (RPC), keine direkten Tabellenzugriffe. Der Baukasten **veröffentlicht** je Stunde ein
  Lernpaket (Aufgaben + freigegebener Fragenpool, ohne Lehrkraft-Seiten) an die Klasse; Lernquest lädt nur das.
- **Rechte:**
  - Lehrkraft: ein Lehrkraft-Schlüssel je Lehrkraft, auf dem Gerät erzeugt (`geraet:*`), auf dem Server nur als Hash; reist
    verschlüsselt mit dem Abgleich Mac ↔ iPad. Jede Lehrkraft-Funktion prüft ihn.
  - Kinder: PIN nur als Hash (bcrypt, `pgcrypto`); Anmeldung liefert ein Sitzungs-Token (zufällig, nur als Hash
    gespeichert, läuft ab). Nach 5 falschen PINs ist das Konto gesperrt, bis die Lehrkraft es freigibt.
  - Jede Kinder-Funktion prüft das Token und erlaubt nur die eigenen Daten bzw. die eigene Klasse.
- **Spielstand auf dem Server:** Fortschritt je Aufgabe (für das Wiederholen), Erfahrung, Münzen, Klassenpunkte,
  Inventar, Avatar. Belohnungen (Truhen, Punkte) vergibt **der Server**, nicht der Browser, damit niemand sich
  Münzen schummelt; Übungen prüft der Browser (Lösungen im Lernpaket, Schummeln bringt nur Spiel-Punkte, gedeckelt je
  Tag). Bosskampf-Antworten prüft der Server.
- **Bosskampf live:** Zustand über Supabase Realtime (Broadcast) vom Beamer-Gerät, Antworten per RPC; Ersatz bei
  schlechtem Netz: Abfrage jede Sekunde.
- **Offline:** Lernpaket und Spielstand im Browser zwischengespeichert; Ergebnisse werden nachgereicht.
- **Löschen:** Lehrkraft löscht Kinder und Klassen (Papierkorb 30 Tage); am Schuljahresende Erinnerung zum Löschen
  bzw. Übertragen in die neue Klasse. Gesperrte, nie benutzte Konten nach 90 Tagen weg.
- **Datenschutz:** keine Schülernamen oder -antworten an die KI (der Fragenpool entsteht nur aus dem Stundeninhalt);
  keine Fremd-Tracker, Schriften selbst gehostet; Server-Änderungen (Tabellen, Funktionen) nur nach Rückfrage.

## Stufen

Jede Stufe ist für sich im Unterricht nutzbar und wird einzeln freigegeben.

1. **Lernen:** Klassen, Kinder, PINs, Anmeldung; Lernpaket aus den lösbaren Aufgaben der Stunden; Weltkarte/Region/
   Station; die ersten Anton/Duolingo-Formate (antippen, Paare, Lücke mit Kacheln, Reihenfolge, richtig/falsch);
   Erfahrung, Stufen, Sterne, Wochenziel; Wiederholen. Lehrkraft: Klasse anlegen, freischalten, Fortschritt grob.
2. **Held und Beute:** Avatar-Editor, ~40 Teile, Truhen mit Garantie, Laden, kleine Boni; Klassen-Ansicht.
3. **Bosskampf:** Beamer-Ansicht, Beitritt, Fragen aus den Regionen, Schaden/Lebensbalken, Truhe für alle.
4. **Echte Belohnungen und Auswertung:** Gutscheine, Anfragen, Abhaken, Grenzen; Fortschritt je Kind und Kompetenz.
5. **KI-Fragenpool und mehr Formate:** Pool je Stunde mit Prüfen/Freigeben; Karte/Bild-Punkte, Sortieren, Vorlesen, Bild wählen.

## Stufe 4: Entscheidungen (06.11.2026)

Fragerunde mit der Lehrkraft vor dem Bau; Zahlen sind Vorschläge von Claude und änderbar.
- **Klassenpunkte gehören jedem Kind selbst** (keine Klassenkasse); andere Kinder sehen den Stand nicht.
- **Verdienen:** Wochenziel erreicht (3 Punkte, einmal je Woche), Bosskampf gewonnen (2 Punkte für alle, die dabei
  waren, einmal je Region wie die Truhe), Lehrkraft von Hand (gedeckelt, Vorschlag 5 je Kind und Woche). Nicht für
  einzelne Stationen. Münzen bleiben getrennt und werden nie zu Klassenpunkten.
- **Gutscheine je Klasse:** Name, Preis, an/aus und zwei Grenzen je Woche: höchstens x-mal je Kind und höchstens
  y-mal für die ganze Klasse (leer = ohne Grenze). Vorschlagsliste zum Start.
- **Anfragen:** Beim Anfragen werden die Punkte zurückgelegt; „Eingelöst“ verbraucht sie, „Ablehnen“ oder Zurückziehen
  durch das Kind gibt sie zurück. Offene und eingelöste Anfragen zählen für die Grenzen.
- **Auswertung je Kind und Kompetenz:** aus dem Wiederhol-Kasten (Leitner-Kasten 1–5 je Aufgabe), keine neuen
  Kinderdaten. Die Zuordnung Aufgabe → Kompetenz rechnet der Browser der Lehrkraft aus dem Modul; sie geht nicht an
  den Server.

## Stufe 5: Entscheidungen (06.11.2026)

Mit der Lehrkraft entschieden (Fragerunde 06.11.2026):

- **KI-Fragenpool:** Knopf „Fragen erzeugen“ je Stunde im Lernquest-Bereich (etwa 15 Fragen nur aus dem
  Stundeninhalt, keine Kinderdaten). Die Lehrkraft gibt jede Frage einzeln frei, ändert oder löscht sie; nur
  Freigegebenes kommt ins Lernpaket. Keine Server-Änderung (der Pool reist im vorhandenen Lernpaket).
- **Neue Formate:** in Gruppen sortieren, Punkt auf Karte/Bild, Vorlesen (Englisch), Bild wählen.
- **Vorlesen:** Stimme des Geräts (Browser-Sprachausgabe), keine Ton-Dateien.
- **Karte/Bild-Punkte:** Bild vom Arbeitsblatt, Punkte setzt und benennt die Lehrkraft im Baukasten.

## Gemalte Bilder für Held und Teile (06.11.2026)

- Wunsch: Grundfigur und Teile mit Krea 2 lokal in ComfyUI malen. Entscheidungen der Lehrkraft: **Ebenen bleiben**
  (jede Kombination passt weiter), Stil **„weich gemalt“** (runde Formen, weiche Schatten, Licht von links oben,
  keine schwarzen Umrisse).
- Verknüpfung über den Dateinamen: `src/lernquest/app/teile/<Teil-ID>.webp`, Grundfigur als `koerper-0 … 5.webp`
  (Skript färbt die Haut in die sechs Hauttöne um). Ohne Bild bleibt die Vektorzeichnung. Keine Serveränderung.
- Werkzeug: Prompts, Schablonen und `npm run lq:bilder` (Anleitung `docs/design/lernquest/bilder.md`). Geprüft mit
  Testbildern (Freistellen, Einpassen, Hautton, Build); mit echten Krea-Bildern noch nicht.

## Mehr Beute (06.11.2026)

Entscheidungen der Lehrkraft (Vorschläge von Claude): Migration `20261109_lernquest_beute.sql`, Regeln gleich in
`src/lernquest/teile.ts`.
- **16 neue Teile** (jetzt 56): Schirmmütze, Blumenkranz, Wikingerhelm, Herzaugen, Taucherbrille, Kapuzenpulli,
  Trikot, Drachenrüstung, Pinsel, Laterne, Dreizack, Hamster, Pinguin, Phönix, Unterwasser, Burghof.
- **Truhen geben in 40 % nur Münzen** (26 % 25 Münzen, 14 % 40 Münzen), sonst ein Teil (29 / 14 / 12 / 4 / 1 %).
  Münzen zählen für die Garantie wie ein gewöhnlicher Fund. Weil die Garantie dann öfter greift, sind es in
  Wirklichkeit etwa 35 % Münz-Truhen (3000 Truhen in einer lokalen Datenbank).
- **Laden doppelt so teuer:** 80 / 160 / 320 / 640 / 1600 Münzen.
- **Frisur frei wählbar** wie der Hautton: Kurze Haare, Zopf, Locken (`avatar.figur` 0–2). Seit 07.11.2026 durch
  Frisur-Ebenen ersetzt (unten, „Frisuren und Haarfarben“).

## Frisuren und Haarfarben (07.11.2026)

Entscheidungen der Lehrkraft (Vorschläge von Claude): Migration `20261110_lernquest_frisur.sql`.
- **Frisur als eigene Ebene** über einer kahlen Grundfigur: `avatar.frisur` (Kennung aus `FRISUREN`: kurz, zopf,
  locken, lang, zoepfe, dutt, stacheln, bob, glatze), frei wählbar. Neue Frisuren brauchen keine Server-Änderung
  (der Server speichert jede Kennung aus Kleinbuchstaben und Ziffern). `figur` 0–2 gilt weiter als kurz/zopf/locken.
- **Haarfarbe** frei wählbar (`avatar.haarfarbe` 0–4: Braun, Schwarz, Hellbraun, Blond, Rot); gemalte Haare werden
  braun gemalt und vom Skript umgefärbt.
- **Hauttöne per Edit** (`koerper_h1` … `_h5`), das Skript färbt nur noch fehlende automatisch um.
- Sicherheit: `lq_bonus` zählt nur noch Teile auf den sechs Plätzen. Vorher galt jeder Wert im Avatar als Teile-
  Kennung; mit frei wählbarer Frisur hätte „krone“ den Kronen-Bonus gebracht (vorher nicht ausnutzbar, weil der
  Avatar außer Teilen nur Zahlen enthielt).

## Mund (07.11.2026)

Wunsch der Lehrkraft, weil die gemalte Grundfigur ein leeres Gesicht hat. Migration `20261112_lernquest_mund.sql`
(noch nicht eingespielt, erst nach OK der Lehrkraft und vor dem Merge).
- **Mund als eigene Ebene** wie die Frisur: `avatar.mund` (Kennung aus `MUENDER`: laecheln, grinsen, lachen, staunen,
  frech, ernst), frei wählbar auf der Held-Seite, ohne Bonus. Ebene über Augen, unter dem Kopf-Teil. Standard ist das
  Lächeln. Neue Münder brauchen keine Server-Änderung (der Server speichert jede Kennung aus Kleinbuchstaben und
  Ziffern), nur `lq_avatar_setzen` muss den Schlüssel `mund` einmal kennen.
- **Bäckchen gehören zum Mund** (gemalt wie gezeichnet). Bis es ein gemaltes Bild `mund-<id>.webp` gibt, zeichnet die
  App den Mund als Vektor, auch auf der gemalten Grundfigur; der Körper als Vektor hat keinen eigenen Mund mehr.
- Bilder: Edit von `koerper.png`, Ablage `lernquest-roh/edit/mund-<id>.png`, Suchbereich `EDIT_BEREICH.mund`,
  Prompts `editMund` in `vorlagen.ts` (`edit-prompts.md`, Abschnitt 4).

## Bosskampf mit Karten (Fragerunde 08.11.2026, in Klärung)

**Stand (08.11.2026, gebaut):** Server `supabase/migrations/20261115_lernquest_boss_karten.sql` (lokal mit allen
Migrationen durchgespielt, eingespielt am 09.11.2026 über die Supabase-Verbindung): Spalte `lq_boss.modus` ('geraete' | 'karten'),
`lq_boss_starten_karten`, `lq_boss_karten` (Scans je Frage, Kind-Id → Wahl, der letzte zählt), `lq_boss_laufend`
(zweites Gerät findet den Kampf), Auflösen in `lq_boss_aufloesen` (mit Karten erst dort Schaden: 15 + Ausrüstung, ab 3
in Folge doppelt; `bossKartenSchaden` in `rules.ts`). Mit Karten löst nur „Auflösen“ auf, der Kampf darf ohne
Beigetretene beginnen, ein Boss ohne Lebenspunkte gilt nicht als besiegt, Kinder-Geräte sehen den Kampf nicht.
Abweichung vom Plan: keine Klassennummer auf dem Server; die Kartennummern liegen wie bei der Kartenfrage im
Lehrkraft-Datensatz, das Scan-Gerät schickt Kind-Ids. Scannen: Baukasten → Klasse → „Bosskampf am Beamer“ → „Mit
Karten“ (dieses Gerät scannt, der Beamer öffnet sich im neuen Tab) oder auf einem zweiten Gerät „Laufenden Kampf
scannen“ (`teacher/BossScan.tsx`). Am Beamer stehen die Namen der erkannten Karten grün, nicht ihre Wahl.

Wunsch der Lehrkraft: Bosskampf „wie Plickers“, ohne Geräte der Kinder.
- **Zwei Ausführungen des Bosskampfs:** mit **Geräten** (Beitritt per QR-Code, wie gebaut) oder mit **nummerierten
  Karten**, die die Kinder hochhalten und die Lehrkraft scannt. Die Klasse hat bereits einen Original-Satz
  Plickers-Karten. **Entweder-oder pro Kampf**, kein Mischen: Beim Start wählt die Lehrkraft „mit Karten“ oder „mit
  Geräten“. Warum: Jeder Modus hat klare eigene Regeln (Karten: fester Schaden, kein Zeitlimit; Geräte: Tempo,
  20 Sekunden).
- **Eigene Karten statt Original-Plickers-Karten:** gleiche Bedienung (Nummer je Kind, Drehung = Antwort A–D, die
  Lehrkraft scannt), aber eigenes Muster aus freien ArUco-Markern, gedruckt aus dem Baukasten wie die PIN-Karten.
  Warum: Plickers ist ein fremdes Produkt mit US-Patent auf das Verfahren, das Muster ist nicht offen; eigene Karten
  sind rechtlich sauber, und die Erkennung bleibt in unserer Hand. Kosten: einmal drucken und laminieren.
- **Karte = nur eine Nummer, Kind = Klassennummer:** Die Karten tragen nur eine Nummer, keinen Namen, und gehören
  keiner Klasse; ein Satz reicht für alle Klassen. Jedes Kind in Lernquest hat eine **Klassennummer** in seiner Klasse.
  Beim Kampf wählt die Lehrkraft die Klasse; eine gescannte Nummer gilt für das Kind mit dieser Klassennummer, und
  Schaden, Truhe und Klassenpunkte zählen auf sein Konto. Server: `lq_kind` braucht dafür eine Nummer (eindeutig je
  Klasse), also eine Migration (vorher fragen).
- **Klassennummern wie bei Plickers:** Ein neues Kind bekommt automatisch die kleinste freie Nummer, bestehende
  Klassen werden einmal alphabetisch durchnummeriert; die Lehrkraft kann Nummern in der Kinderliste ändern, der Server
  verhindert doppelte. Nummern 1–40 (Kartensatz mit 40 Karten). Abweichung von Plickers: Die Nummer eines gelöschten
  Kindes bleibt belegt, solange es im Papierkorb liegt.
- **Namen am Beamer sind erlaubt** (Lehrkraft, 08.11.2026; vorher galt „keine Namen am Beamer, nur Zahlen“). Wie bei
  Plickers wird am Beamer markiert, wessen Karte erkannt ist, damit das Kind sie herunternehmen kann.
- **Ablauf einer Frage mit Karten:** Frage am Beamer (A–D mit Form) → Kinder halten die Karte hoch, die Lehrkraft
  scannt, gern in mehreren Durchgängen (kein Zeitlimit) → am Beamer wird der Name grün, sobald die Karte erkannt ist →
  „Auflösen“: Balken A–D, richtige Antwort, Schaden. Ohne Tempo: **15 Schaden je richtiger Karte**, Serie ab 3 doppelt
  wie gehabt; Herzen und Truhe wie bisher; beigetreten ist, wessen Karte im Kampf einmal erkannt wurde. Am Beamer nur,
  **wer** geantwortet hat, nicht **was**; die einzelnen Antworten sieht nur die Lehrkraft auf dem Scan-Gerät.
  Regeln doppelt pflegen (`rules.ts` und `lq_boss_*`).
- **Mehrfach gescannt: der letzte Scan zählt**, bis „Auflösen“ gedrückt ist (wie Plickers). Kinder dürfen sich
  umentscheiden, und ein Fehlscan bessert sich beim nächsten Durchgang aus; das Scan-Gerät zeigt den neuen Buchstaben.
- **Ohne Netz kein Scannen** (Lehrkraft, 08.11.2026): Fällt die Verbindung aus, stoppt das Scannen mit „Keine
  Verbindung“; keine Warteschlange auf dem Gerät. Warum: einfacher, und Schaden, Truhe und Klassenpunkte liegen ohnehin
  auf dem Server. Ein Kampf nur zwischen Scan-Gerät und Beamer ohne Server ist nicht geplant.
- **Scan-Gerät ist das iPhone oder iPad der Lehrkraft** (sie hat Mac, iPad und iPhone dabei), nicht das Gerät am
  Beamer. Die Karten müssen schnell und einfach erfasst werden: viele Karten pro Bild, vier Antworten je nach Haltung
  der Karte.
- **Wunsch: Lehrkraft-Bereich in der Lernquest-App**, aus dem heraus die Lehrkraft Lernfortschritte sieht und
  Bosskämpfe steuert (auch scannt).
- **Anmeldung als Lehrkraft in Lernquest: derselbe Lehrkraft-Schlüssel, kein neues Konto.** Auf der Startseite klein
  „Ich bin Lehrkraft“; die App liest den Schlüssel aus dem Speicher des Baukastens (gleiche Adresse, wie heute der
  Beamer). Mac und iPad haben ihn über den Abgleich; das iPhone bekommt ihn, indem man dort einmal den Baukasten öffnet
  und mit „Weiteres Gerät koppeln“ verbindet. Ohne Schlüssel nur der Hinweis „Auf diesem Gerät ist keine Lehrkraft
  eingerichtet“. Warum: kein Passwort, keine neuen Daten auf dem Server, keine neue Angriffsfläche.
- **Lehrkraft-Bereich in der App = was im Unterricht in die Hand gehört:** Bosskampf (Klasse und Region wählen, Karten
  oder Geräte, starten, weiter, scannen, „Auflösen“, beenden), Fortschritt je Kind und Kompetenz (nur lesen, aus
  `Auswertung.tsx`), schnelle Hilfe (PIN zurücksetzen, Konto freigeben, Gutschein-Anfragen abhaken). Alles andere
  bleibt im Baukasten (Klassen und Kinder, Klassennummern, PINs und Karten drucken, Stunden, Fragenpool, Gutscheine
  anlegen). Gleiche Bausteine, Lernquest-Look, nichts doppelt pflegen.
- **Karte:** eine je A4-Blatt, laminiert, schwarz-weiß; Muster etwa 17 × 17 cm (sicher bis ~8 m mit dem iPhone-Video);
  an den Kanten klein A–D mit Form (oben = Antwort), Nummer klein in einer Ecke, kein Name. Druck im Baukasten neben
  den PIN-Karten („Antwortkarten drucken (1–40)“). Erst 3–4 Probekarten im Klassenraum testen, dann alle 40.

## Stunden ausblenden (08.11.2026)

Wunsch der Lehrkraft: Stunden eines Moduls ganz ausblenden können. Je Klasse hat jede Stunde drei Stufen, im Baukasten
unter „Stunden freischalten“ als Auswahl statt Häkchen: **Freigeschaltet** (Station zum Spielen), **Gesperrt** (Station
mit Schloss, „Öffnet sich, sobald ihr es im Unterricht hattet“) und **Ausgeblendet** (gar nicht auf der Karte).
- **Pro Klasse**, nicht für alle Klassen (Lehrkraft): Klassen sind unterschiedlich weit.
- Gespeichert im Lehrkraft-Datensatz (`versteckt`, Klasse → Stunden), reist verschlüsselt mit dem Abgleich wie die
  PINs; **keine Server-Änderung**. Ausgeblendete Stunden fehlen in `modul.stunden` der Pakete, ihre Titel kommen also
  gar nicht auf den Server. Wer die Stufe ändert, sendet die freigeschalteten Stunden des Moduls neu
  (`src/lernquest/sichtbarkeit.ts`). Freigeschaltet geht immer vor ausgeblendet.
- Die Karte nimmt die längste Stundenliste der Pakete eines Moduls; scheitert das Neusenden mittendrin, hilft
  „Freigeschaltete neu senden“.

## Truhen aus Sternen (08.11.2026)

Wunsch der Lehrkraft: Truhen kamen zu oft, auch für eine Station mit einem oder zwei Sternen. Wer fehlerfrei übt, soll
mehr bekommen, spätestens beim Wiederholen der Station.
- **Je 3 Sterne eine Truhe**, über alle Stationen gezählt: drei Stationen mit einem Stern oder eine mit drei. Die
  Truhe fürs erste Durchspielen einer Station gibt es nicht mehr. Wochenziel- und Boss-Truhe bleiben.
- Jeder Stern einer Station zählt **einmal** (höchster Stand je Station, `sterneStationen`); was über eine volle Truhe
  hinausgeht, bleibt als `sterneRest` (0–2) für die nächste. Eine Station später besser spielen bringt die fehlenden
  Sterne nach; dieselbe Runde nochmal ohne neuen Stern bringt nichts.
- Alte Stationen (ihre Truhe gab es schon): Es zählen nur Sterne über dem Stand vor der ersten Runde nach der
  Umstellung. Keine Truhe wird zurückgenommen.
- Im Ergebnis steht unter den Kacheln, wie viele Sterne neu sind und wie viele bis zur nächsten Truhe fehlen.
- Regeln doppelt: `sterne`, `neueSterne`, `STERNE_JE_TRUHE`, `rundeAnwenden` in `rules.ts` und `lq_sterne`,
  `lq_runde_melden`, `lq_stand_json` in `20261113_lernquest_sterne.sql`.

## Feinschliff Kinder-App (09.11.2026)

Ohne Server-Änderung, Vorschläge von Claude („runder, anschaulicher, Bugs finden“).
- **Behoben:** Truhen-Text beim Helden nannte noch die alte Regel („für ganz gespielte Stationen“); Lösung einer Lücke
  stand in eckigen Klammern (jetzt fett); eine neue Seite öffnete sich so weit gescrollt wie die vorige; „Los geht’s!“
  an einer fertigen Station startete immer Runde 1 (jetzt die schwächste Runde, `naechsteRunde` in `rules.ts`, auch für
  die Probe); das Menü im Kopf schloss nur über den Knopf (jetzt auch Escape und Tippen daneben).
- **Anschaulicher:** im Kopf der eigene Held statt des Anfangsbuchstabens; auf der Karte „Nächste Truhe“ mit drei
  Sternen (je 3 Sterne eine Truhe) und Öffnen-Knopf, Sterne je Region im Band, Fußspuren zwischen den Stationen, die
  Karte springt zur aktuellen Station; an der Station, was jeder Stern braucht (abgehakt, was geschafft ist); nach dem
  Prüfen Lücken und gelegter Satz grün oder rot; im Ergebnis ein Punkt je Aufgabe (richtig/falsch).

## Truhen-Schätze (09.11.2026)

Wunsch der Lehrkraft: mehr Teile, manche nur aus Truhen, und die erst sichtbar, wenn man sie hat. Entscheidungen der
Lehrkraft (Vorschläge von Claude): 24 neue Teile, etwa die Hälfte nur aus Truhen, in der Liste „?“ mit „Nur in Truhen“.
Migration `20261116_lernquest_truhenschaetze.sql` (lokal mit allen Migrationen durchgespielt, eingespielt am
09.11.2026 über die Supabase-Verbindung, vor dem Merge von PR #45).
- **24 neue Teile** (jetzt 80), je Platz zwei zum Kaufen (Gewöhnlich, Ungewöhnlich) und zwei **Truhen-Schätze**
  (Selten bis Legendär): Kochmütze, Cowboyhut, *Raumhelm, Eiskrone*; Schläfrige Augen, Zwinkern, *Monokel,
  Feueraugen*; Regenjacke, Ninja-Anzug, *Raumanzug, Kristallrüstung*; Angel, Bumerang, *Zwergenhammer, Blitzstab*;
  Igel, Papagei, *Axolotl, Einhorn*; Wüste, Winterwald, *Vulkaninsel, Wolkenschloss* (kursiv = nur aus Truhen).
- **Nur aus Truhen:** Spalte `lq_teil.nur_truhe`, `lq_kaufen` lehnt solche Teile ab (`ungueltig`). Truhen ziehen weiter
  aus allen Teilen einer Seltenheit, Chancen und Garantie bleiben gleich. In der App `nurTruhe` in `teile.ts`;
  `ladenWare` zeigt sie im Laden nie.
- **Unbekannt bis gefunden:** In der Teile-Liste steht ein Schatz bis zum Fund als „?“ mit „Nur in Truhen“ und seiner
  Seltenheit, ohne Bild und Namen. Weil er nicht im Laden steht, sieht man ihn vorher nirgends.
- Zeichnungen in `avatar.tsx`, Bild-Prompts aus `BESCHREIBUNG` in `vorlagen.ts` (`npm run lq:bilder -- --prompts`
  schreibt `prompts.md` und `edit-prompts.md` neu).

## Bilder hochladen auf der Lehrerseite (09.11.2026)

- Wunsch: gemalte Bilder nicht mehr von Hand umbenennen, ablegen, Skript laufen lassen und committen, sondern auf der
  Lehrerseite hochladen und einem Teil zuordnen. Entscheidungen der Lehrkraft: **nur sie lädt hoch, die Bilder gelten
  für alle Klassen aller Lehrkräfte**; **Vorschau, dann „Übernehmen“**; Ersetzen und Löschen jederzeit, danach gilt
  wieder das eingebaute Bild bzw. die Vektorzeichnung.
- **Server** (`supabase/migrations/20261117_lernquest_bilder.sql`, eingespielt am 09.11.2026 nach OK der Lehrkraft;
  Admin = der Besitzer-Hash ihrer Klasse „5c“, damals die einzige Klasse): `lq_admin` (Hashes von Lehrkraft-Schlüsseln, ohne
  Rechte für anon/authenticated, **von Hand per SQL eingetragen**, es gibt bewusst keine Funktion zum Selbst-Eintragen),
  `lq_bild` (je Teil-ID aus `lq_teil` ein Bild, Version aus einer Folge). Funktionen: `lq_ist_admin`, `lq_bild_setzen`
  und `lq_bild_loeschen` (nur Admin; WebP oder PNG mit 480 × 480 laut Dateikopf, JPEG nur für Hintergründe, höchstens
  400 KB; `voll` ab 400 MB Datenbank), `lq_bilder` (`{teil: version}`) und `lq_bild_daten` (höchstens 10 je Aufruf,
  Base64) für alle, denn die Bilder sind nicht persönlich.
- **Lehrerseite:** Knopf „Bilder der Teile“ oben, nur wenn `lq_ist_admin` ja sagt (`teacher/TeilBilder.tsx`, lädt erst
  bei Bedarf). Raster aller Teile mit Herkunft (Hochgeladen / Eingebaut / Zeichnung) → Teil antippen → Bild wählen →
  Weg wählen, wo es zwei gibt (einzeln gemalt auf Grau oder Edit der Grundfigur; Kleidung nur Edit, Hintergrund ganzes
  Bild) → Vorschau am Helden und als Kachel, Regler (Größe, links/rechts, hoch/runter, Freistellen; beim Edit die
  Empfindlichkeit), Startwerte aus `anpassen.json` → „Übernehmen“. Die Vorschau ist genau die Datei, die hochgeht.
- **Bildarbeit im Browser** (`teacher/bildVerarbeiten.ts`): dieselben Schritte wie `npm run lq:bilder`, gemeinsam in
  `bilder/ebene.ts`; nur das Skalieren macht dort sharp, hier ein Canvas. Ein Edit wird mit der eingebauten
  Grundfigur `koerper-0.webp` verglichen (auf dem Grau, das das Edit-Bild am Rand hat). Kodiert als WebP (Chrome,
  Firefox, Edge); Safari kann kein WebP speichern, dort PNG (Hintergründe JPEG). Geprüft: Browser und Skript liefern
  fast dieselbe Ebene (Edit 0,03 %, einzeln 0,16 % abweichende Deckung, Farbe im Mittel 0,6 von 255).
- **Kinder-App** (`app/hochgeladen.tsx`): beim Start und nach 10 Minuten im Hintergrund die Liste holen, fehlende oder
  neue Versionen laden, gelöschte vergessen; die Bilder liegen im Gerät (IndexedDB `lernquest-bilder`), also auch nach
  Neuladen und offline da. `avatar.tsx` nimmt ein hochgeladenes Bild vor dem eingebauten (Kontext
  `HochgeladeneBilder`). Ohne Server-Funktion (vor dem Einspielen) bleibt alles wie bisher.
- Frisuren, Münder, Hauttöne und die Grundfigur bleiben beim Skript.
- Geprüft: lokal mit allen Migrationen (Postgres 16; Nicht-Admin, Kinder-Token, falsche Formate und Größen, direkter
  Tabellenzugriff abgelehnt; Ersetzen, Löschen, neue Version); im Browser mit nachgeahmten RPCs (Hochladen einzeln
  und als Edit, Löschen, Kinder-App online, nach Neuladen ohne neues Laden, offline). Live-Test im
  `server.live.test.ts` („Bilder der Teile“) nach dem Einspielen grün.
- Hat die Lehrkraft auf einem Gerät einen anderen Schlüssel (vor dem Abgleich), fehlt dort der Knopf; dann den
  weiteren Besitzer-Hash ihrer Klassen in `lq_admin` nachtragen.

## Bilder nachjustieren und mit KI malen (09.11.2026)

- Wunsch: auch die eingebauten Bilder auf der Seite bearbeiten (Größe, Freistellen, **Drehen**) und neue Bilder mit
  Nano Banana über OpenRouter direkt auf der Seite malen lassen. Ganz neue Teile (Name, Platz, Preis) kommen später als
  eigener Schritt, weil dafür der Server-Katalog und die App umgebaut werden müssen.
- **Nachjustieren:** „Eingebautes Bild nachjustieren“ bzw. „Hochgeladenes Bild nachjustieren“ nimmt die fertige Ebene;
  Regler Größe, links/rechts, hoch/runter, Drehen und „Grauen Rand wegschneiden“ (`ebeneAnpassen` in
  `bilder/ebene.ts`; Hintergründe ohne Regler). Das Ergebnis geht wie ein Upload auf den Server; „Löschen“ bringt das
  eingebaute Original zurück, das Repo bleibt unverändert.
- **Drehen** auch für einzeln gemalte Teile (Regler, im Skript `r` in `anpassen.json`, Grad im Uhrzeigersinn).
- **Mit KI malen:** Prompt aus `vorlagen.ts` (änderbar), ein Bild je Klick mit dem Bildmodell und dem OpenRouter-Schlüssel
  aus „KI im Baukasten“ (nur auf dem Gerät); Kosten werden wie andere KI-Bilder gezählt (Monatsgrenze fragt vorher).
  Kleidung und Augen standardmäßig als Edit: die gemalte Grundfigur (`koerper-0.webp` auf Grau, 1024 px) geht mit.
  Das Ergebnis landet in der Vorschau wie ein gewähltes Bild. Keine Server-Änderung.

## Eigene Teile (09.11.2026)

- Wunsch: ganz neue Teile auf der Lehrerseite anlegen. Umsetzung (Vorschlag von Claude, die Lehrkraft hat „ja mach das“
  gesagt): auf „Bilder der Teile“ je Platz die Kachel „Neues Teil“ → Name (bis 30 Zeichen), Seltenheit, „Nur aus Truhen“,
  Bild wählen oder mit KI malen → „Teil anlegen“. **Preis aus der Seltenheit wie bei allen Teilen, keine Boni.**
- **Kein Löschen**, damit kein Inventar ins Leere zeigt: Umbenennen und „Im Spiel“ aus/an. Aus dem Spiel = nicht mehr
  im Laden und in Truhen; wer es hat, behält es und sieht es weiter (andere sehen es in ihrer Liste nicht mehr).
- **Server** (`supabase/migrations/20261118_lernquest_eigene_teile.sql`, eingespielt am 09.11.2026 nach OK der Lehrkraft;
  Live-Tests grün): `lq_teil` bekommt `name`, `eigen`, `aktiv`,
  `erstellt`; `lq_teil_anlegen` (nur Admin, Teil und Bild in einem Schritt, Kennung `e` + 10 Hexzeichen, höchstens 200
  eigene), `lq_teil_aendern` (nur Admin, nur eigene), `lq_teile_eigen` (für alle); `lq_truhe_oeffnen` und `lq_kaufen`
  nehmen nur Teile im Spiel; das Bild eines eigenen Teils lässt sich nicht löschen (es hat keine Zeichnung).
- **App:** `teile.ts` kennt neben `TEILE` die eigenen Teile (`setzeEigene`, `alleTeile`, `teil` findet beide;
  `readEigene` prüft jeden Eintrag). Geladen mit den Bildern (`app/hochgeladen.tsx`), im Gerät in
  `lernquest:eigeneTeile` (offline). Seiten, die Teile auflisten, lesen den Kontext `EigeneTeile` (`useAlleTeile`).
  Bringt eine Truhe ein Teil, das das Gerät noch nicht kennt, lädt es Teile und Bilder sofort nach.
- Geprüft: lokal mit allen Migrationen (nur Admin, Fehler im Bild → kein Teil, aus dem Spiel nie gekauft und in 1500
  Truhen nie gefunden, im Spiel beides); im Browser (anlegen mit KI, umbenennen, Kind sieht es im Laden, auch offline).

## Wiederholungen geben weniger (09.11.2026)

Wunsch der Lehrkraft: „Wiederholungen bereits erledigter Übungen geben eine kleine Anzahl von EP und Münzen.“
Entscheidungen der Lehrkraft (Vorschläge von Claude): beides zählt als Wiederholung, sie gibt ein Drittel.
Migration `20261117_lernquest_wiederholung.sql` (lokal mit allen Migrationen in Postgres 16 durchgespielt, eingespielt
am 09.11.2026 über die Supabase-Verbindung nach OK der Lehrkraft, vor dem Merge).
- **Was zählt:** die Runde „Wiederholen“ (Leitner-Kästen) und eine Stationsrunde, die schon einmal geschafft war
  (Bestwert dieser Runde über 0, vor dieser Runde). Eine Runde mit 0 % gilt nicht als geschafft und gibt weiter alles.
- **Wie viel:** ein Drittel der Erfahrung und der Münzen, abgerundet (Münzen erst mit Bonus, dann ein Drittel); danach
  die Tagesgrenze wie bisher (300 EP, 200 Münzen). Beispiel 5 von 5 richtig: 8 statt 25 EP, 5 statt 16 Münzen.
- **Bleibt:** Bestwert, Sterne und Truhen aus Sternen (eine Runde besser spielen bringt weiter den fehlenden Stern),
  Lerntag und Wochenziel, Leitner-Kästen.
- **Im Ergebnis** steht unter den Kacheln „Diese Runde hattest du schon geschafft. Wiederholen gibt ein Drittel der
  Erfahrung und Münzen.“ (bei „Wiederholen“ nur der zweite Satz).
- Regeln doppelt: `istWiederholung`, `WIEDERHOLUNG_TEILER`, `xpFuerRunde`, `muenzenFuerRunde`, `rundeAnwenden` in
  `rules.ts` und `lq_runde_melden` (gibt jetzt auch `wiederholung` zurück); ein Test vergleicht beides.

## Wiederholen: „Morgen dran“ und „Wiederholen sofort“ (09.11.2026)

- Wunsch der Lehrkraft: ein Hinweis „Morgen sind … dran“ und ein Knopf, um Wiederholungen ausnahmsweise sofort zu
  geben („z. B. wegen morgen Klassenarbeit“).
- **Kind** („Wiederholen“): unter dem Knopf „Morgen kommt 1 Aufgabe dazu“ bzw. ohne heutige Aufgaben „Morgen sind 3
  Aufgaben dran“ (`morgenDran`). Läuft „Wiederholen sofort“, steht dort „Deine Lehrkraft hat Aufgaben zum Üben
  freigegeben, zum Beispiel vor einer Klassenarbeit.“
- **Lehrkraft**: Karte „Wiederholen sofort“ je Klasse (`teacher/WiederholenSofort.tsx`): freigeschaltete Stunden nach Modul
  ankreuzen, Dauer (nur heute, bis morgen, bis übermorgen, eine Woche) → „Freigeben“; „Beenden“ und „Ändern“.
- **Regel** (`rules.ts` `extraFaellig`, `heuteDran`): in der Zeit sind alle Aufgaben der gewählten Stunden dran, die das
  Kind seit dem Start nicht beantwortet hat, auch nie gespielte, jede einmal (beantwortet am = fällig am − Abstand des
  Kastens, darum keine neue Speicherung). Erst die nach Kasten fälligen, dann diese. Belohnung wie jede Wiederholung (ein
  Drittel). Danach läuft alles nach den Kästen weiter.
- **Server** (`supabase/migrations/20261119_lernquest_wiederholen_sofort.sql`, eingespielt am 09.11.2026 nach OK der
  Lehrkraft, Live-Tests grün): `lq_klasse.extra_wdh`
  ({ab, bis, stunden}); `lq_wiederholen_setzen` (nur Besitzerin, `ab` heute ± 1 Tag, höchstens 14 Tage, nur
  freigeschaltete Stunden, null beendet); `lq_mein_stand` und `lq_klassen` liefern `extra` mit. Im Gerät des Kindes in
  `lernquest:daten` (offline).
- Geprüft: lokal mit allen Migrationen (fremde Lehrkraft, fremde Stunde, zu lang, rückwärts abgelehnt; Kind sieht es;
  Beenden); Tests `wiederholen.test.ts`; im Browser (Kind: 1 fällig + 6 freigegeben = 7, Hinweis morgen; Lehrkraft:
  Freigeben, „Läuft vom … bis …“, Beenden).

## Frisuren hochladen und Radiergummi (09.11.2026)

- Wunsch: Frisuren auf „Bilder der Teile“ anpassen wie die Teile, dazu ein Radiergummi.
- **Frisuren:** eigener Abschnitt mit allen Frisuren (außer Glatze). Gearbeitet wird an der braunen Ebene, immer als Edit
  der Grundfigur (Bild wählen, mit KI malen mit `editFrisur`, eingebautes oder hochgeladenes Bild nachjustieren); die Seite
  rechnet daraus alle fünf Haarfarben (`haarFarben`, wie `npm run lq:bilder`) und lädt fünf Dateien
  `haare-<frisur>-<0–4>` hoch. Vorschau am Helden und als Köpfe in allen Farben. Löschen entfernt alle fünf.
- **App:** `avatar.tsx` nimmt eine hochgeladene Frisur vor der eingebauten (in der Haarfarbe, sonst die braune), nur mit
  der gemalten Grundfigur.
- **Server** (`supabase/migrations/20261120_lernquest_frisur_bilder.sql`, eingespielt am 09.11.2026 nach OK, Live-Tests
  grün): `lq_bild` hängt nicht mehr fest an `lq_teil`;
  `lq_bild_setzen` nimmt Teile aus `lq_teil` und `haare-<frisur>-<0–4>` (nur Admin, sonst wie bisher).
- **Radiergummi** (`teacher/Radierer.tsx`, `pixel.ts` `radieren`): in der Vorschau mit Finger oder Maus wegradieren,
  Radiergröße, „Rückgängig“, „Alles wieder da“. Die Striche liegen in Ebenen-Pixeln und kommen nach den Reglern, also am
  besten zuletzt radieren. Bei Frisuren vor dem Umfärben, gilt also für alle Farben. Nicht bei Hintergründen.

## Teile einstellen und Frisuren sammeln (10.11.2026)

Wunsch der Lehrkraft (Designrunde): bei jedem Teil Seltenheit, Herkunft und Effekte einstellen; Frisuren teils frei,
teils aus Truhen und Laden. Migration `supabase/migrations/20261121_lernquest_teile_einstellen.sql` (lokal mit allen
Migrationen in Postgres 16 durchgespielt, eingespielt am 10.11.2026 auf Wunsch der Lehrkraft, Live-Tests grün).
- **Lehrerseite** („Bilder der Teile“, nur Admin): bei jedem Teil und jeder Frisur ein Kasten „Einstellungen“ mit
  Seltenheit, Herkunft (Start, Nur Truhe, Truhe und Laden, Nur Laden, Nicht erhältlich) und Bonus Münzen / Herzen /
  Schaden (Frisuren ohne Boni). Die Kacheln zeigen die Werte. Gilt auch für eingebaute und eigene Teile.
- **Frisuren** stehen als `frisur-<id>` in `lq_teil`, zu Beginn alle Start (frei wie bisher). Nicht freie stehen in der
  Kinder-App grau mit „Im Laden“ bzw. „Nur in Truhen“; der Laden hat den Bereich „Frisur“, Truhen können Frisuren bringen.
- **Regeln:** Besitz bleibt. Verliert ein Teil „Start“, bekommen es alle, die es tragen (auch als Standard ohne eigene
  Wahl); was ein Kind gerade trägt, darf es behalten. Wird ein Teil neu Start, behalten Kinder ohne eigene Wahl ihren
  bisherigen Standard. Der Standard eines Platzes ist das Startteil mit der kleinsten Kennung (`standardTeil`,
  `lq_standard_teil`). Das letzte Startteil von Kleidung, Augen, Hintergrund und Frisur bleibt Start (`letztes`).
  Findet die Truhe in der gezogenen Seltenheit kein Truhen-Teil, nimmt sie die nächste daneben, sonst gibt sie Münzen.
- **App:** `lq_teile_werte` wird mit den Bildern geladen (`app/hochgeladen.tsx`, offline in `lernquest:teilWerte`);
  `teil`, `alleTeile`, `angelegt`, `bonusVon` und `ladenWare` rechnen mit den Werten der Lehrkraft (`mitWerten`).
  Ohne Werte (älterer Server, offline beim ersten Start) gilt der Katalog in `teile.ts`.

## Eigene Frisuren und Abmelden (10.11.2026)

Wunsch der Lehrkraft: auf „Bilder der Teile“ neue Frisuren anlegen; ein sichtbarer „Abmelden“-Knopf für die Kinder.
Migration `supabase/migrations/20261122_lernquest_eigene_frisuren.sql` (lokal mit allen Migrationen geprüft, am 10.11.2026 von der Lehrkraft im SQL-Editor eingespielt, Live-Tests grün).
- **Neue Frisur:** Kachel „Neue Frisur“ → Name → Bild wählen oder mit KI malen (braun, als Edit der Grundfigur) → Vorschau
  am Helden und in allen fünf Haarfarben → „Frisur anlegen“ (Frisur und fünf Bilder in einem Schritt, `lq_frisur_anlegen`,
  höchstens 50). Umbenennen über „Speichern“; kein Löschen, die Bilder einer eigenen Frisur lassen sich nicht löschen.
- Jede eigene Frisur steht auch im Teile-Katalog als `frisur-<id>`: zu Beginn frei; unter „Einstellungen“ wie jede Frisur
  Seltenheit und Herkunft (frei, Laden, Truhe, nicht erhältlich).
- **App:** `lq_frisuren_eigen` wird mit den Bildern geladen (offline in `lernquest:eigeneFrisuren`); Held-Wahl, Laden und
  Truhe kennen eigene Frisuren (`alleFrisuren`).
- **Abmelden:** Knopf unten auf der Held-Seite und im Menü oben, beide fragen nach (mit Warnung, wenn ungesendete Runden
  verloren gingen).

## Die Runde, die lehrt (11.11.2026, „Stufe A“ aus `docs/kritik-und-plan.md`)

Entscheidung der Lehrkraft: Lernquest bleibt ein Duolingo-Pfad und wird dort Spitzenniveau, kein Umbau zum
Kampf-Rollenspiel. Erster Schritt ist die Übungsrunde, neu gebaut in `app/Runde.tsx`. **Keine Server-Änderung:** Der
Server bekommt wie bisher „richtig von gesamt“, gezählt werden die ersten Versuche.
- **Fehler kommen wieder:** Eine falsch beantwortete Aufgabe wird hinten angehängt („Nochmal: das war vorhin falsch“),
  bis sie richtig ist, höchstens dreimal je Aufgabe (`nachAntwort`, `WIEDER_MAX`; eine kaputte Frage darf niemanden
  festhalten). Für Ergebnis, Herzen, Sterne und die Wiederhol-Kästen zählt nur der erste Versuch. Im Probetest der
  offenen Übung kommt nichts wieder (er bietet „Fehler nochmal üben“ am Ende).
- **Ehrliches Ergebnis:** Unter 60 % heißt es „Fast!“ mit dem Hauptknopf „Runde nochmal spielen“ (`rundenFazit`).
  Sonst ist der Hauptknopf „Nächste Runde“, solange die Station offene Runden hat. Offen: Für den Server gilt auch
  eine schwache Runde als gespielt (erster Stern); das zu ändern wäre eine Server-Änderung.
- **Faire Wertung:** Bei Paaren und Punkten im Bild geht ab drei Teilen ein Fehlgriff durch (`fehlgriffeFrei`). Paare
  mit gleichem Wort („big – groß“, „large – groß“) passen in beiden Richtungen. Die Lösung steht nicht doppelt da,
  wenn sie in der Aufgabe schon zu sehen ist; „Prüfen“ fehlt, wo die Aufgabe sich selbst prüft.
- **Erklärung:** Jede Aufgabe kann einen kurzen Satz `erklaerung` tragen, der nach einem Fehler erscheint. Noch
  schreibt ihn niemand automatisch; das kommt mit dem KI-Pool (Stufe B).
- **Gefühl:** Der eigene Held lacht oder staunt in der Rückmeldung, ab drei richtigen in Folge steht „3 in Folge!“.
- **Verlassen:** Die Zurück-Taste des Handys geht einen Schritt zurück statt aus der App (`app/zurueck.ts`), auch in
  der Anmeldung. Eine Runde mit Antworten fragt vorher „Runde beenden?“. Ein neuer Link im selben Tab lädt neu.
- **Hören ohne Stimme:** „Ich höre nichts – Text zeigen“ unter dem Lautsprecher.
- **Spieltest ohne Server:** `npm run spieltest` startet Lernquest gegen einen toten Server (offline); die Daten einer
  erfundenen Schülerin mit allen acht Formaten legt `scripts/spieltest-daten.js` in den Browser,
  `scripts/spieltest-helfer.js` spielt Aufgaben richtig oder falsch. So gespielt am 11.11.2026: alle Formate, Wiederholen,
  Held, Laden, Truhe, Gutscheine und Klasse ohne Netz, offene Übung mit Probetest, Zurück-Taste überall.

## Inhalte, die reichen (11.11.2026, „Stufe B“ aus `docs/kritik-und-plan.md`)

Entscheidung der Lehrkraft: Die KI füllt jede Stunde automatisch auf, die Lehrkraft prüft grob. **Keine
Server-Änderung:** Der Pool reist wie bisher im Lernpaket, der Server zählt nur die Übungen.
- **Automatisch:** Wird eine Stunde für eine Klasse freigeschaltet und ihr Pool ist leer, schreibt Claude von selbst
  etwa 30 Fragen (`fragenErzeugen` in `teacher/LernquestView.tsx`, eine Stunde nach der anderen). Nur mit einem
  KI-Schlüssel auf dem Gerät; ohne bleibt der Knopf „Fragen erzeugen“. Am Knopf steht „Claude schreibt …“, danach
  „30 zu prüfen“. Die Monatsgrenze fragt wie bei jeder KI-Anfrage vorher. Wechselt die Lehrkraft die Seite, läuft
  die Anfrage zu Ende.
- **Drei Schwierigkeiten:** Jede Pool-Frage trägt `niveau` (1 leicht: wiedererkennen, 2 mittel: anwenden, 3 schwer:
  selbst erzeugen oder übertragen), je etwa ein Drittel, und eine `erklaerung`; falsche Antworten sollen typische
  Denkfehler sein (`poolSystem`). Im Paket stehen die freigegebenen Fragen von leicht nach schwer hinter den
  Übungen der Stunde (`buildPaket`), also werden die Runden einer Station schwerer. Die drei Stufen je Station
  kommen mit Stufe C; bis dahin gilt weiter: höchstens 40 Übungen je Station kommen dran, höchstens 40 im Pool.
- **Alle freigeben:** ein Knopf im Dialog, daneben wie bisher einzeln freigeben, ändern, löschen. Ist die Stunde für
  die geöffnete Klasse freigeschaltet, geht das Paket beim Schließen des Dialogs von selbst neu an diese Klasse,
  wenn sich das Freigegebene geändert hat; andere Klassen bekommen es mit „Freigeschaltete neu senden“.
- **Ändern:** Erklärung und Schwierigkeit lassen sich bearbeiten und bleiben erhalten (vorher gingen sie bei Lücke
  und Reihenfolge verloren, `mitZusatz`).
- **Selbst schreiben** (`schreiben`): Das Kind tippt ein Wort oder einen kurzen Satz. Bis zu vier Schreibweisen
  zählen (`loesungen`, die erste wird gezeigt); Groß- und Kleinschreibung, Leerzeichen und der Punkt am Ende zählen
  nicht (`gleich`), Tippfehler schon. Die Tastatur hilft nicht mit (keine Autokorrektur, keine Großschreibung).
  Entsteht vorerst nur im KI-Pool, nicht aus den Bausteinen der Arbeitsblätter (sonst änderten sich die Runden
  schon freigeschalteter Stunden). Im Bosskampf wird daraus keine Frage. Ältere geöffnete Lernquest-Seiten kennen
  das Format erst nach dem Neuladen.
- **Nicht gebaut:** „Frage melden“ durch Kinder (braucht eine Server-Änderung).
- Geprüft: Tests (`fragenpool.test.ts`, `teacher/Fragenpool.test.tsx`), Typprüfung, Build; im Spieltest ohne Server
  „Selbst schreiben“ falsch und richtig gespielt (Erklärung, kommt wieder, „  BOOK. “ zählt als „book“). **Nicht
  geprüft:** eine echte KI-Anfrage mit 30 Fragen und der Lehrkraft-Dialog im Browser (beides braucht Server und
  Schlüssel der Lehrkraft), die Tastatur am echten Handy.

## Die Lernspirale im Pfad (11.11.2026, „Stufe C“ ohne Server)

Entscheidungen der Lehrkraft siehe `docs/roadmap.md` (Stufe C). Dieser Teil braucht **keine Server-Änderung**: Alles
läuft als Runde „Wiederholen“ (ein Drittel der Erfahrung und Münzen, Wiederhol-Kästen wie bisher).
- **Verblassen:** Eine fertige Station mit heute fälligen Aufgaben wird blass (Auffrisch-Zeichen statt Haken, „2 zum
  Auffrischen“). Antippen startet gleich eine Runde mit genau diesen Aufgaben; danach glänzt sie wieder. Ihre Runden
  bleiben über die Station erreichbar (`faellig` in `regionenVon`, `karte.ts`).
- **Wiederholen im Pfad:** Ist im Fach etwas fällig, steht vor der aktuellen Station ein Knoten „Wiederholen“ mit dem
  gemischten Stoff früherer Stationen (höchstens 8 je Runde); ohne aktuelle Station am Ende des Pfads. Der Reiter
  „Wiederholen“ bleibt für alle Fächer zusammen.
- **Meilenstein:** Am Ende jeder Region mit mindestens zwei Stationen. Er öffnet sich, wenn alle Stationen der Region
  freigeschaltet und geschafft sind, und mischt 10 Aufgaben gleichmäßig aus allen Stationen (`gemischterTest` in
  `probe.ts`, auch für den Probetest der offenen Übung). Fehler kommen wieder wie in jeder Runde; ab 80 % beim
  ersten Versuch heißt es „Meilenstein geschafft!“, sonst „Fast!“ mit „Meilenstein nochmal“. Das beste Ergebnis
  steht am Knoten. **Nur auf dem Gerät** gespeichert (`lernquest:meilensteine`, beim Abmelden gelöscht): Der Server
  kennt Meilensteine nicht; der Server-Teil von Stufe C brachte nur Stufen und 60 %. Der Bosskampf hängt nicht
  am Meilenstein (ihn startet die Lehrkraft).
- Geprüft: Tests (`lernquest.test.ts`, „Weltkarte“), Typprüfung, Build; im Spieltest ohne Server am Handy-Format:
  verblasste Station aufgefrischt (glänzt danach, Wiederholen-Knoten weg), Meilenstein mit 7 von 10 („Fast!“) und
  10 von 10 („geschafft“, Haken und Bestwert am Knoten). Nicht mit echtem Server gespielt.

## Sterne aus drei Stufen, Runden ab 60 % (11.11.2026, Server-Teil von „Stufe C“)

Entscheidungen der Lehrkraft siehe `docs/roadmap.md` (Stufe C). Migration `20261123_lernquest_stufen.sql`; die Regeln
stehen gleich in `rules.ts` (`GESCHAFFT_AB`, `niveauVon`, `rundenStufen`, `sternZiele`, `sterne`, `sterneVon`).
- **Geschafft ab 60 %:** Eine Runde zählt erst ab 60 % beim ersten Versuch als geschafft (vorher: eine richtige
  Antwort). Das gilt für die Sterne, für „nächste Runde“ und dafür, ob eine Runde als Wiederholung zählt.
- **Stufe einer Runde:** ihre schwerste Übung. Pool-Fragen bringen `niveau` mit; sonst nach Format: Antippen,
  Richtig/Falsch, Bild wählen, Punkt auf der Karte leicht; Lücke, Paare, Reihenfolge, Gruppen mittel; Selbst
  schreiben schwer. Die Runden selbst bleiben, wie sie waren (`rundeVon`).
- **Sterne:** Jede Stufe, die die Station hat, gibt einen Stern, von leicht nach schwer: ihre Runden und alle
  leichteren geschafft. Fehlen Stufen, verlangen die übrigen Sterne im Schnitt 80 %, danach jede Runde einmal ohne
  Fehler. Eine Station nur mit leichten Aufgaben hat also die alte Regel, nur mit 60 % statt einer richtigen Antwort.
  Die Station zeigt bei jedem Stern, was fehlt (Kennenlernen, Anwenden, Meistern).
- **Verdient bleibt verdient:** Die Migration schreibt für jedes Kind die Sterne nach der alten Regel in
  `sterneStationen` (nur nach oben). Die App zeigt nie weniger Sterne als dort stehen (`sterneVon`); Truhen gibt es
  nur für Sterne darüber hinaus. Die Lehrkraft-Tabelle rechnet die Sterne neu (ohne diesen Stand) und nimmt die
  Runden aus dem Paket mit dem freigegebenen Pool (vorher nur aus dem Arbeitsblatt).
- Geprüft: Tests (`lernquest.test.ts`), Typprüfung, Build; Migration lokal in Postgres 16 auf alle früheren
  Migrationen mit alten Spielständen (Sterne übernommen, Runde mit 40 % keine Wiederholung, 60 % ein Stern, keine
  Truhe doppelt); App und Server rechnen Stufen und Sterne in 1500 Zufallsfällen gleich; im Spieltest am
  Handy-Format zwei Stationen angesehen und eine Runde gespielt.

## Erfolgskriterien Stufe 1

- Lehrkraft legt im Baukasten eine Klasse mit 3 Kindern an, druckt QR + PINs, schaltet eine Stunde frei.
- Ein Kind meldet sich am Handy (390 px breit) mit Liste + PIN an, spielt eine Station durch, bekommt Erfahrung und
  Sterne; nach Neuladen ist alles noch da; auf einem zweiten Gerät auch.
- 5 falsche PINs sperren das Konto; die Lehrkraft entsperrt es.
- Kein Kind kommt an Daten eines anderen Kindes oder einer anderen Klasse (Test gegen die Server-Funktionen).
- Typprüfung, Tests (neu: Lernpaket aus Bausteinen, Wiederholen-Planung, Belohnungsregeln) und Build grün.

## Stand Stufe 1 (06.11.2026, Branch `lernquest`)

Gebaut und geprüft (Tests, Rechte-Test gegen den Server, Durchlauf im Browser am Handy und iPad); auf Wunsch der Lehrkraft am 06.11.2026 nach `main` gebracht (live zum Testen mit
Lehrkraft- und Testkonto, Stufe 2 nur als Server und Regeln ohne Oberfläche).
- **Server:** `supabase/migrations/20261106_lernquest.sql` (eingespielt ins Projekt „baukasten“). Tabellen `lq_klasse`,
  `lq_kind`, `lq_sitzung`, `lq_paket`; nur Funktionen `lq_*`. Aufräumen nachts per `pg_cron` (Papierkorb 30 Tage,
  gesperrte nie benutzte Konten 90 Tage, abgelaufene Sitzungen). Sitzung 180 Tage, höchstens 5 Geräte je Kind.
  Stufe 2 in `20261106b_lernquest_held.sql` (Katalog `lq_teil`, Münzen, Truhen, Inventar, Avatar); im Browser über
  `server.ts`: `truheOeffnen`, `kaufen` (Fehler `muenzen`, wenn es nicht reicht), `avatarSetzen` (ersetzt den ganzen
  Avatar), `klasseAnsicht` (nur Namen, Avatare und die Lerntage der Woche); `rundeMelden` liefert auch
  `muenzenPlus` und `truhenPlus`.
- **Lehrkraft-Schlüssel:** mehrere möglich (je Gerät einer, bis der Abgleich sie zusammenführt). Sie liegen mit den
  zuletzt vergebenen PINs als `geraet:lernquest` und reisen verschlüsselt als Eintrag `g:lernquest` im Abgleich mit.
  Jede Lehrkraft-Funktion bekommt die Liste und erlaubt, was einem der Schlüssel gehört.
- **Übungen aus Bausteinen:** Ankreuzen → antippen, Richtig/Falsch → zwei Knöpfe (mit „steht nicht im Text“ als
  Antippen; weggelassen, wenn auf der Seite ein Lese- oder Hörtext steht), Zuordnen → Paare (höchstens 5 je Übung),
  Lückentext → je Zeile eine Lücke mit Kacheln (+2 Ablenker aus der Stunde), Satzbau und Umformen → Wortkacheln,
  Knickvokabeln → antippen mit 3 falschen Antworten. Nur mit Lösung; Lehrkraft-Seiten nie.
- **Regeln** (`src/lernquest/rules.ts`, gleich im Server): Runde 10 + 2 je richtige + 5 ohne Fehler Erfahrung
  (Wiederholung ein Drittel, seit 09.11.2026), höchstens 300 am Tag; Stufe n → n+1 braucht 50 + 50·n; Sterne aus drei Stufen, eine Runde
  geschafft ab 60 % (seit Stufe C, siehe oben); Wochenziel 3 Lerntage, gezählt werden geschaffte Wochen (keine Serie, die reißt); Wiederholen mit
  5 Kästen (1, 3, 7, 14, 30 Tage), falsch → Kasten 1.
- **Aussehen nach dem Prototyp** (`docs/design/lernquest/Main.dc.html`): Start mit Wappen und „Klassen-QR scannen“,
  Namen mit farbigen Anfangsbuchstaben, Karte mit Kopfleiste, Wochenziel-Karte (Mo–So), Regions-Band, Stationen
  erledigt / aktuell / offen / gesperrt (das Lernpaket trägt dafür Nummer und Titel aller Stunden des Moduls),
  Leiste unten mit Karte, Wiederholen, Held und Klasse.
- **Stufe 2 „Held und Beute“ in der App** (nach `Held.dc.html` und `Truhe.dc.html`, Seiten in
  `src/lernquest/app/Held.tsx`): Münzen im Kopf; Held-Seite mit Avatar, Teile-Raster je Platz (nicht gefundene als „?“
  mit Seltenheit), Hautfarbe und Truhen-Leiste; Laden (Teil wählen, dann kaufen; fehlen Münzen, steht da, wie viele);
  Truhe auf dunklem Grund mit sichtbaren Chancen, Öffnen höchstens ~1,2 s, antippen überspringt; Klasse mit Namen,
  Avataren und Lerntagen der Woche; Herzen in der Runde; Münzen und verdiente Truhe im Ergebnis. Avatar-Zeichnungen
  (40 Teile, eine Zeichenfläche, feste Ebenen) in `src/lernquest/app/avatar.tsx`. Münzen, Truhen und Teile ändern
  sich nur über den Server; offline gesperrt, bis die wartenden Runden gesendet sind.
- **Lehrkraft-Seite** (Übersicht → „Lernquest“): PINs am Bildschirm verborgen, bis „PINs zeigen“ (Beamer).
- **Stufe 3 „Bosskampf“** (live geschaltet am Server am 06.11.2026, `supabase/migrations/20261107_lernquest_boss.sql`;
  App nach `Boss-Beamer.dc.html` und `Boss-Handy.dc.html` in `src/lernquest/app/Boss.tsx`):
  - Lehrkraft: Übersicht → „Lernquest“ → „Bosskampf am Beamer“, Region (Modul mit freigeschalteten Stunden) wählen,
    „Bosskampf starten“. Die Fragen macht das Gerät der Lehrkraft (`src/lernquest/boss.ts`: Antippen mit einer
    richtigen Antwort, Richtig/Falsch, je Paar eine Frage, Lücke mit einer Lücke; höchstens 4 Antworten, 10 Fragen,
    jedes Mal neu gemischt). Der Beamer öffnet sich als `lernquest/#beamer=<id>` in einem neuen Tab und findet die
    Lehrkraft-Schlüssel im Speicher des Geräts (gleiche Adresse wie der Baukasten). Bühne 1080 × 608, auf jede
    Fenstergröße gezoomt; „Los geht’s!“, „Auflösen“, „Nächste Frage“ auch mit Leertaste oder →.
  - Beitritt per QR-Code (08.11.2026): In der Warte-Ansicht (vor „Los geht’s!“) steht neben der Kinderzahl ein QR-Code
    mit dem Klassenlink `lernquest/#<Klassencode>`, derselbe wie auf den Karten, also Anmeldung mit Klassencode. Die
    Lehrkraft-Seite hängt den Code an den Beamer-Link: `#beamer=<id>&klasse=<Code>` (`beamerAusHash`, `beitrittsLink`
    in `karte.ts`); ohne Code (alter Link) fehlt nur der QR-Code. Kein Server-Teil. Schon angemeldete Kinder sehen
    nach dem Scan das Band „Mitmachen“ (Abfrage alle 15 s). `QrBild.tsx` zeichnet den Code selbst mit `uqr`, damit
    die Kinder-App den Arbeitsblatt-Code nicht lädt.
  - Kinder: Läuft ein Kampf, steht auf Karte, Held und Klasse ein Band „Bosskampf läuft! – Mitmachen“ (Abfrage alle
    15 s). Am Handy nur die Antworten mit Form; Ergebnis, Schaden und Serie nach der Frage.
  - Regeln (`rules.ts`, gleich im SQL): 20 s je Frage (+1,5 s Nachfrist), Schaden 10 + bis 10 fürs Tempo, ab 3 richtig
    in Folge doppelt; Lebenspunkte 13 je Kind und Frage (wer später kommt, macht den Boss größer); 5 Klassen-Herzen,
    eins weg, wenn weniger als die Hälfte der Beigetretenen richtig liegt. Sieg = Truhe für alle mit mindestens einer
    Antwort, nur beim ersten Sieg je Region und Kind. Keine Namen am Beamer, nur Zahlen (seit 08.11.2026 erlaubt,
    siehe „Bosskampf mit Karten“).
  - Verbindung: Beamer und Handys fragen jede Sekunde (kein Realtime-Kanal, der ohne Anmeldung mitlesbar wäre). Die
    Lösung verlässt den Server erst nach der Frage. Kämpfe enden nach 3 Stunden von selbst und werden nach 2 Tagen
    gelöscht; die Siege je Region bleiben.
  - „+Schaden“ als Ausrüstungs-Bonus (07.11.2026, mit der Lehrkraft entschieden): Ritterhelm und Fernrohr +1,
    Zauberstab und Dreizack +2, Sternenschwert +3; zusammen höchstens +3, vor dem Verdoppeln in Serie
    (`teile.ts` `schaden`/`SCHADEN_MAX`, `bossSchaden`; Server `20261111_lernquest_schaden.sql`, eingespielt 07.11.2026). Auch wenn jedes
    Kind im Schnitt +1 trüge, reichen 60 % richtig weiterhin nicht (Test in `boss.test.ts`).
- **Lädt:** Dauert das erste Laden oder der Beamer länger als 10 s, steht „Nochmal“ da (Designregel „Lädt“).
- **Noch nicht:** Vorlesen, Ton-Dateien, App-Hülle offline (Daten sind offline da, die Seite selbst braucht beim
  ersten Öffnen Netz), Bild-Aufgaben (Bildvokabeln, Tabelle, Wortnetz, Satzbaustellen kommen in Stufe 5).
- **Stufe 4 „Echte Belohnungen und Auswertung“ (06.11.2026):**
  - Server: `supabase/migrations/20261108_lernquest_belohnungen.sql` (eingespielt von der Lehrkraft im SQL Editor, weil
    die Bestätigung der Supabase-Verbindung nicht ankam). Klassenpunkte am Kind, `lq_gutschein`, `lq_anfrage`; Punkte
    fürs Wochenziel in `lq_runde_melden`, für den Bosssieg in `lq_boss_ticken`; erledigte Anfragen nach 90 Tagen weg.
    Vorher lokal mit 76 Prüfungen durchgespielt; Live-Test „Stufe 4“ und Testlauf (Bosssieg → Punkte → Gutschein
    anfragen → einlösen) grün.
  - Regeln doppelt: `PUNKTE_WOCHENZIEL`, `PUNKTE_BOSS`, `PUNKTE_HAND_WOCHE`, `gutscheinFrei` in `rules.ts`.
  - Kind: „Held“ → Leiste „Klassenpunkte“ → „Gutscheine“ (`app/Gutscheine.tsx`); Ticket-Zeichen in Violett, damit es
    nicht mit den Münzen verwechselt wird.
  - Lehrkraft: Spalte „Klassenpunkte“ mit „+“, Karte „Gutscheine und Anfragen“ (`teacher/Belohnungen.tsx`), Karte
    „Fortschritt je Kompetenz“ (`teacher/Auswertung.tsx`, Rechnung in `auswertung.ts`: eine Übung sitzt ab Kasten 3).
  - Nachgezogen (07.11.2026): „+“ öffnet den Dialog „Klassenpunkte geben“ mit Knöpfen +1 … +5 (statt
    `window.prompt`, `teacher/PunkteDialog.tsx`). Gutscheine mit vielen Kindern gleichzeitig: Live-Test mit 12 Kindern
    (Klassen-Grenze hält, Mehrfach-Tippen, Zurückziehen gegen Einlösen, Löschen während Anfragen) grün.
- **Offene Übungen ohne Anmeldung (06.11.2026, Wunsch der Lehrkraft vor Stufe 5):** `lernquest/#probe=<id>` spielt feste
  Stationen und einen gemischten Probetest (16 Aufgaben) ohne Anmeldung und ohne Server; Fortschritt nur im Browser
  (`lernquest:probe:<id>`), keine Namen, keine Punkte. Inhalt in `src/lernquest/proben/` (von Claude geschrieben, nicht aus
  den Stunden), Logik in `probe.ts`, Seite `app/Probe.tsx`. Erste Probe: `#probe=englisch5` (Numbers, Colours,
  Classroom English, there is / there are; Klassenarbeit Englisch 5).

- **Stufe 5 „KI-Fragenpool und mehr Formate“ (06.11.2026, Branch `claude/stufe-5-handoff-b9odwp`):**
  - **Keine Serveränderung.** Der Pool hängt an der Stunde (`Lesson.pool`, reist im Abgleich und in Sicherungen mit);
    freigegebene Fragen kommen ins Lernpaket hinter die Übungen der Stunde (`buildPaket`), so zählt der Server die
    Runden wie bisher aus `uebungen`. Ids `pool-…`; höchstens 40 je Stunde.
  - Lehrkraft: in „Stunden freischalten“ je Stunde „Fragen erzeugen“ (`teacher/Fragenpool.tsx`, Logik in
    `fragenpool.ts`): über den Chat oder direkt mit dem Schlüssel (kleineres Modell der KI-Einstellungen, ca. 5–10 Cent
    je Anfrage). An Claude gehen nur die Seiten der Kinder (keine Lehrkraft-Seiten), das Klassenprofil (ohne Namen)
    und die schon vorhandenen Übungen. Jede Antwort wird streng geprüft (`readUebung`), Unbrauchbares fällt weg. Jede
    Frage einzeln: „Freigeben“/„Zurücknehmen“, „Ändern“ (Text und richtige Antwort), „Löschen“. Die Klasse bekommt
    Änderungen beim nächsten Freischalten oder mit „Freigeschaltete neu senden“. Mehr Runden heißt: Wer eine Station
    schon fertig hatte, sieht danach neue Runden (wie bei geänderten Stunden schon vorher).
  - **Punkt auf Karte/Bild** (`punkt`): im selben Dialog „Punkte im Bild …“: Bild einer Abbildung der Kinderseiten
    wählen, ins Bild tippen, Punkte benennen (1–6, verschieben, löschen). Das Kind bekommt die Namen nacheinander
    („Tippe auf: Rhein“) und tippt ins Bild; getroffen ist, wenn der gesuchte Punkt der nächste ist und höchstens
    12 % entfernt (`punktTrifft` in `rules.ts`). Daneben-Tipps zeigen sofort die richtige Stelle. Die Beschriftungen
    der Abbildung auf dem Blatt werden nicht übernommen (sie beziehen sich auf den Kasten, nicht aufs Bild). Das
    Bild reist als JPEG mit 720 px im Paket (`karte:<id>`, höchstens 3 je Paket).
  - **Sortieren** (`gruppen`, Karten einzeln in 2–3 Gruppen), **Bild wählen** (`bild`, aus dem Baustein
    „Bild-Vokabeln“; Emojis direkt, eigene Bilder als JPEG mit 160 px unter `bilder`, höchstens 24), **Hören**
    (`waehlen` mit `hoeren`: der Satz wird vorgelesen, nur in Englisch-Stunden). Größenprüfung vor dem Senden in
    `teacher/senden.ts` (270 KB, der Server nimmt 300 KB `jsonb::text`).
  - **Vorlesen** (`app/vorlesen.ts`): in Englisch-Paketen Lautsprecher an Aussagen und Wörtern („Anhören“,
    „langsam“); nach „Prüfen“ wird der richtige Satz von Lücke und Reihenfolge vorgelesen (nicht bei „Ton aus“).
    Ohne Stimme bleibt der Text sichtbar.
  - Bosskampf: Sortier-Karten werden Fragen („Wohin gehört …?“), Bilder und Punkte nicht. Die Auswertung je
    Kompetenz zählt nur die Übungen der Stunde (Pool-Fragen haben keine Kompetenz).
  - Ältere geöffnete Lernquest-Seiten kennen die neuen Formate nicht; nach dem Neuladen ist alles da (kein
    Offline-Speicher der Seite). `readPaket` lässt künftig unbekannte Formate weg.
  - Testlauf (`npm run lq:testlauf`): spielt jetzt zusätzlich eine zweite Station mit Sortieren, Bild wählen,
    Punkten im Bild und Hören (Bilder im Paket) und prüft die Runde am Server.

## Offene Punkte

- ✅ Freigabe der Schule für Klarnamen auf dem Server: liegt vor (Lehrkraft, 06.11.2026).
- Supabase-Tabellen und -Funktionen für Stufe 1: von der Lehrkraft am 06.11.2026 freigegeben (Projekt „baukasten“).
  Spätere Stufen, die den Server ändern, wieder kurz ankündigen.
- Testlauf (`npm run lq:testlauf`, `src/lernquest/testlauf.live.test.ts`): spielt Lernquest wie ein Kind gegen den echten
  Server, mit Wegwerf-Schlüssel und Testklasse, die am Ende gelöscht wird (Wunsch der Lehrkraft, 06.11.2026).
  Unter Windows geht das npm-Skript nicht (Umgebungsvariable auf Unix-Art): `vite build`, dann in Git Bash
  `LQ_TESTLAUF=1 NODE_PATH=<Ordner mit playwright>/node_modules npx vitest run src/lernquest/testlauf.live.test.ts`.
  Seit Stufe A spielt das Skript die absichtlich falsche Aufgabe am Ende der Runde nochmal richtig. Zuletzt grün am
  11.11.2026 nach Stufe B (Anmelden, Runde, Truhe, Held, Klasse, Bosskampf, Gutschein, neue Formate).
- Lernquest ist seit 06.11.2026 live unter `…/lernquest/`; Kinder erreichen es erst mit einem Klassencode der Lehrkraft.
