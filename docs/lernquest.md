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
5. **KI-Fragenpool und mehr Formate:** Pool je Stunde mit Prüfen/Freigeben; Karte/Bild-Punkte, Sortieren, Vorlesen.

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

Mit der Lehrkraft entschieden (Fragerunde, alle Empfehlungen von Claude so angenommen):

- **Zwei Teile:** Teil A = KI-Fragenpool mit Prüfen/Freigeben, „In Gruppen sortieren“, „Bild wählen“ (aus den
  Bild-Vokabeln) und Vorlesen. Teil B = „Punkt auf Bild/Karte setzen“ als eigener Schritt (die Lehrkraft setzt die
  Punkte von Hand, weil die KI Bilder nicht sicher beschriften kann).
- **Prüfen:** Freigeben, verwerfen und Text ändern (auch, welche Antwort richtig ist); „Alle freigeben“.
- **Vorlesen:** mit der Stimme des Geräts (Web Speech API), kein Server, keine Tondateien, keine Kosten.
- **Poolgröße:** etwa 20 Aufgaben je Anfrage, höchstens 40 je Stunde.

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
  - Kinder: Läuft ein Kampf, steht auf Karte, Held und Klasse ein Band „Bosskampf läuft! – Mitmachen“ (Abfrage alle
    15 s). Am Handy nur die Antworten mit Form; Ergebnis, Schaden und Serie nach der Frage.
  - Regeln (`rules.ts`, gleich im SQL): 20 s je Frage (+1,5 s Nachfrist), Schaden 10 + bis 10 fürs Tempo, ab 3 richtig
    in Folge doppelt; Lebenspunkte 13 je Kind und Frage (wer später kommt, macht den Boss größer); 5 Klassen-Herzen,
    eins weg, wenn weniger als die Hälfte der Beigetretenen richtig liegt. Sieg = Truhe für alle mit mindestens einer
    Antwort, nur beim ersten Sieg je Region und Kind. Keine Namen am Beamer, nur Zahlen.
  - Verbindung: Beamer und Handys fragen jede Sekunde (kein Realtime-Kanal, der ohne Anmeldung mitlesbar wäre). Die
    Lösung verlässt den Server erst nach der Frage. Kämpfe enden nach 3 Stunden von selbst und werden nach 2 Tagen
    gelöscht; die Siege je Region bleiben.
  - Noch nicht: „+Schaden“ als Ausrüstungs-Bonus (bräuchte eine Änderung am Teile-Katalog).
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
- **Offene Übungen ohne Anmeldung (06.11.2026, Wunsch der Lehrkraft vor Stufe 5):** `lernquest/#probe=<id>` spielt feste
  Stationen und einen gemischten Probetest (16 Aufgaben) ohne Anmeldung und ohne Server; Fortschritt nur im Browser
  (`lernquest:probe:<id>`), keine Namen, keine Punkte. Inhalt in `src/lernquest/proben/` (von Claude geschrieben, nicht aus
  den Stunden), Logik in `probe.ts`, Seite `app/Probe.tsx`. Erste Probe: `#probe=englisch5` (Numbers, Colours,
  Classroom English, there is / there are; Klassenarbeit Englisch 5).

- **Stufe 5 Teil A „KI-Fragenpool und mehr Formate“ (06.11.2026, Branch `claude/stufe-5-handoff-b9odwp`):**
  - **Keine Serveränderung.** Der Pool hängt an der Stunde (`Lesson.pool`, reist im Abgleich und in Sicherungen mit);
    freigegebene Aufgaben kommen ins Lernpaket hinter die Übungen der Stunde (`buildPaket`), so zählt der Server die
    Runden wie bisher aus `uebungen`. Neue Ids `pool-…`.
  - Lehrkraft: in „Stunden freischalten“ je Stunde „Fragenpool“ (`teacher/Fragenpool.tsx`, Logik in `fragenpool.ts`):
    über den Chat oder direkt mit dem Schlüssel (kleineres Modell der KI-Einstellungen, ca. 5–10 Cent je Anfrage); an Claude gehen nur die Seiten
    der Kinder (keine Lehrkraft-Seiten), das Klassenprofil (ohne Namen) und die schon vorhandenen Übungen. Jede
    Antwort wird streng geprüft (`readUebung`), Unbrauchbares fällt weg. Die Klasse bekommt Änderungen beim nächsten
    Freischalten oder mit „Freigeschaltete neu senden“. Mehr Runden heißt: Wer eine Station schon fertig hatte,
    sieht danach neue Runden (wie bei geänderten Stunden schon vorher).
  - Neue Formate: `gruppen` (Karten einzeln in 2–3 Gruppen legen), `bild` (aus dem Baustein „Bild-Vokabeln“; Emojis
    direkt, eigene Bilder als JPEG mit 160 px im Paket unter `bilder`, höchstens 24, Größenprüfung vor dem Senden in
    `teacher/senden.ts`), „Hören“ (`waehlen` mit `hoeren`: der Satz wird vorgelesen, nur in Englisch-Stunden).
  - Vorlesen (`app/vorlesen.ts`): in Englisch-Paketen Lautsprecher an Aussagen und Wörtern; nach „Prüfen“ wird der
    richtige Satz von Lücke und Reihenfolge vorgelesen (nicht bei „Ton aus“). Ohne Stimme bleibt der Text sichtbar.
  - Bosskampf: Sortier-Karten werden Fragen („Wohin gehört …?“), Bilder nicht. Die Auswertung je Kompetenz zählt
    nur die Übungen der Stunde (Pool-Aufgaben haben keine Kompetenz).
  - Ältere Lernquest-Seiten kennen die neuen Formate nicht; nach dem Neuladen der Seite ist alles da (kein
    Offline-Speicher der Seite). `readPaket` lässt künftig unbekannte Formate weg.

## Offene Punkte

- ✅ Freigabe der Schule für Klarnamen auf dem Server: liegt vor (Lehrkraft, 06.11.2026).
- Supabase-Tabellen und -Funktionen für Stufe 1: von der Lehrkraft am 06.11.2026 freigegeben (Projekt „baukasten“).
  Spätere Stufen, die den Server ändern, wieder kurz ankündigen.
- Testlauf (`npm run lq:testlauf`, `src/lernquest/testlauf.live.test.ts`): spielt Lernquest wie ein Kind gegen den echten
  Server, mit Wegwerf-Schlüssel und Testklasse, die am Ende gelöscht wird (Wunsch der Lehrkraft, 06.11.2026).
- Lernquest ist seit 06.11.2026 live unter `…/lernquest/`; Kinder erreichen es erst mit einem Klassencode der Lehrkraft.
