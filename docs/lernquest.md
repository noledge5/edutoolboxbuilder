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
| Ausrüstung | Kleine, gedeckelte Boni nur im Spiel (+Münzen, +Schaden im Bosskampf, ein Herz mehr). Nie Einfluss auf Noten oder echte Belohnungen. | RPG-Gefühl, ohne dass Sammeln wichtiger wird als Lernen. |
| Truhen | Nur fürs Lernen (Station, Wochenziel, Boss), nie für Geld. Inhalt zufällig, Chancen sichtbar, doppelte Teile → Münzen, Garantie nach einigen Truhen ohne Seltenes. Laden für gezielte Käufe mit Münzen. | Spannung ohne Glücksspiel-Mechanik. |
| Echte Belohnungen | Gutscheine je Klasse mit Preis (eigene Währung „Klassenpunkte“, nicht die Münzen), z. B. Sitzplatz wählen, Hausaufgaben-Joker. Kind fragt an, Lehrkraft hakt „eingelöst“ ab; Grenzen je Woche. | Echte Wirkung, Lehrkraft behält die Hand drauf. |
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

## Erfolgskriterien Stufe 1

- Lehrkraft legt im Baukasten eine Klasse mit 3 Kindern an, druckt QR + PINs, schaltet eine Stunde frei.
- Ein Kind meldet sich am Handy (390 px breit) mit Liste + PIN an, spielt eine Station durch, bekommt Erfahrung und
  Sterne; nach Neuladen ist alles noch da; auf einem zweiten Gerät auch.
- 5 falsche PINs sperren das Konto; die Lehrkraft entsperrt es.
- Kein Kind kommt an Daten eines anderen Kindes oder einer anderen Klasse (Test gegen die Server-Funktionen).
- Typprüfung, Tests (neu: Lernpaket aus Bausteinen, Wiederholen-Planung, Belohnungsregeln) und Build grün.

## Offene Punkte

- Freigabe der Schule für Klarnamen auf dem Server (vor dem ersten echten Einsatz).
- Supabase-Tabellen und -Funktionen einspielen: vor Stufe 1 nach Rückfrage.
- Lernquest ist erst nach dem Merge nach `main` für Kinder erreichbar; bis dahin Test über die Vorschau.
