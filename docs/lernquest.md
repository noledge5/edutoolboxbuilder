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
| Truhen | Nur fürs Lernen (Station, Wochenziel, Boss), nie für Geld. Inhalt zufällig, Chancen sichtbar, doppelte Teile → Münzen, Garantie nach einigen Truhen ohne Seltenes. Laden für gezielte Käufe mit Münzen. | Spannung ohne Glücksspiel-Mechanik. |
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

Wunsch der Lehrkraft: Bosskampf „wie Plickers“, ohne Geräte der Kinder.
- **Zwei Ausführungen des Bosskampfs:** mit **Geräten** (Beitritt per QR-Code, wie gebaut) oder mit **nummerierten
  Karten**, die die Kinder hochhalten und die Lehrkraft scannt. Die Klasse hat bereits einen Original-Satz
  Plickers-Karten.
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
- **Regeln** (`src/lernquest/rules.ts`, gleich im Server): Runde 10 + 2 je richtige + 5 ohne Fehler Erfahrung, höchstens
  300 am Tag; Stufe n → n+1 braucht 50 + 50·n; Sterne: 1 = alle Runden gespielt, 2 = Schnitt ≥ 80 %, 3 = jede Runde
  einmal fehlerfrei; Wochenziel 3 Lerntage, gezählt werden geschaffte Wochen (keine Serie, die reißt); Wiederholen mit
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
- Lernquest ist seit 06.11.2026 live unter `…/lernquest/`; Kinder erreichen es erst mit einem Klassencode der Lehrkraft.
