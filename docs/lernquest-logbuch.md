# Lernquest-Logbuch

Was an Lernquest gebaut wurde, Schritt für Schritt: was, warum, wie geprüft, PR und Sicherung. Neue Einträge oben.
Vor größeren Änderungen steht ein Git-Tag `backup/<datum>-<thema>` auf dem Stand von `main` davor; zurück geht es mit
`git checkout <tag>` (ansehen) oder einem Revert des PRs.

Prüfung bei jedem Schritt: `npx vitest run`, `npm run typecheck`, `npm run build`, `npm run rundgang` (bei laufendem
`npm run spieltest` oder `npm run demo` mit `LQ_URL`) auf Handy, kleinem Handy, iPad hoch und quer und am Beamer, und
Bildschirmfotos, die angesehen wurden.

## 28.11.2026, nachts und morgens (eigenständig; ab dem Solo-Boss nach erneutem Lesen des Handoffs)

Freigabe am Morgen: „yes and yes … i admit everything till usage limit is reached“ – Werkstatt veröffentlichen und die
Server-Vorschläge (Truhe für den Wächter, mehr Teile, Training ohne Belohnung).

### Lehrerseite: „Diese Aufgaben fallen der Klasse schwer“ (PR folgt)
- **Was:** unter „Fortschritt je Kompetenz“ je Region bis zu fünf Aufgaben, die die meisten Kinder zuletzt falsch
  beantwortet haben (mindestens 3 geübt, 2 und 40 % falsch), mit Lösung in einer Zeile und „2 von 3“; Namen im Tooltip.
- **Warum:** genau diese Aufgaben lohnen eine kurze Wiederholung im Unterricht; die Kompetenz-Ansicht zeigt nur Anteile.
- **Wie:** `schwersteAufgaben`, `aufgabeKurz` in `auswertung.ts` (aus den Karteikästen, ohne Server); Tests
  `schwer.test.ts`, `teacher/auswertungSchwer.test.tsx`.
- **Offen, zu prüfen:** „Fortschritt je Kompetenz“ ordnet die Karten über die Aufgaben der Arbeitsblätter zu; seit dem
  19.11. bekommen die Kinder nur Pool-Fragen. Ob deren Ids zu den Aufgaben passen, ist noch nicht geprüft.

### Besiegte Wächter auf jedem Gerät, Regal auf der Held-Seite (#135, Migration 20261212)
- **Was:** der Spielstand vom Server nennt die besiegten Wächter (`lq_stand_json` mit `waechter`); Karte und Fuchs-Hinweis
  zählen sie (oder den Bestwert auf dem Gerät, `waechterBesiegt`). Auf der Held-Seite ein Regal „Besiegte Wächter
  1 von 2“: je Region ein Platz, besiegte golden mit Regionsnamen, die anderen grau („wartet noch“). Truhen-Hinweis
  nennt jetzt auch den Wächter.
- **Warum:** der Sieg stand nur auf dem Gerät und war nach dem Abmelden oder auf dem Tablet der Schule weg; und ein
  Regal macht das Beherrschen ganzer Regionen sichtbar wie eine Sammlung.
- **Wie geprüft:** PGlite (39 Migrationen, 5 Fälle, Rechte unverändert), `waechterregal.test.tsx`; Browser ohne
  gespeicherten Meilenstein: Knoten „Besiegt“, Regal 1 von 2, keine seitliche Verschiebung (Handy, iPad quer). Live:
  Fassung vorher verglichen, Probelauf mit Rollback, eingespielt.

### Der Moment, in dem der Wächter fällt (#134)
- **Was:** beim letzten Treffer leuchtet die Wächter-Leiste einmal golden auf, „Besiegt!“ ploppt, nach dem
  „Richtig“-Klang läuten die Glocken des Aufstiegs (nur mit Ton an; „Bewegung reduzieren“ ohne Animation).
- **Warum:** der Sieg über den Wächter ist das Ziel einer ganzen Region – er soll sich wie einer anfühlen.
- **Geprüft:** im Browser genau beim 8. Treffer fotografiert; Tests, Rundgang.

### Lehrerseite: Spalte „Wächter“ (#132, Migration 20261211)
- **Was:** in der Klassenliste je Kind „2 von 5“ besiegte Wächter, die Regionen im Tooltip.
- **Warum:** ein besiegter Wächter heißt: ganze Region zu 80 % beim ersten Versuch – ein echtes Lernsignal für die
  Lehrkraft (bisher nur auf dem Gerät des Kindes sichtbar).
- **Wie geprüft:** PGlite (alle 38 Migrationen, 6 Fälle: Liste, leer, kaputte Daten, übrige Felder unverändert,
  Schlüssel), `waechterRegionen.test.ts`; live: Probelauf mit Rollback, eingespielt, per Abfrage geprüft.
- **Nicht gebaut:** mehr Haarfarben – eigene Frisuren der Lehrkraft haben genau fünf gespeicherte Farb-Ebenen
  (`haare-<frisur>-0…4`); neue Farben bräuchten neue Ebenen auf der Lehrerseite und im Bildspeicher. Vorschlag.

### Teile „Burg und Wächter“ (#131, Migration 20261210)
- **Was:** Rechenrahmen, Zinnenhelm, Burgschlüssel, Kleiner Wächter (Begleiter, wippt), Burgkrone (Gold, Wimpel weht).
- **Warum:** mehr Beute, die zum neuen Ziel jeder Region passt (der Wächter) und zu Mathe; Hüte und Begleiter hatten nur
  zwei legendäre Teile, Werkzeuge wenige ungewöhnliche.
- **Wie geprüft:** Seltenheits-, Hut- und Katalog-Tests; Vorschau als Bild und am Helden (zwei Werkzeuge danach
  weiter vom Gesicht weg gedreht, der Schlüssel dunkler, damit er auf Weiß liest); die Wächter-Figur trägt keinen Hut
  mehr (sie hatte die Hut-Vorschau übernommen). Live: Probelauf mit Rollback, eingespielt, Zeilen geprüft.
  Sicherung `backup/2026-11-28-vor-burg-teile`.

### Training ohne Belohnung (#130, Migration 20261209)
- **Was:** Karte „Training“ unter „Wiederholen“: bis zu 8 der schwersten Karten (Kasten 1 und 2), so oft das Kind will;
  Ergebnis „Gut geübt!“ ohne Kacheln. Server `lq_training_melden` zählt nur die Lernzeit.
- **Warum:** schwache Kinder brauchen mehr Übung als 16 Karten am Tag – ohne das Sammeln wieder zu öffnen (17.11.) und
  ohne die Abstände des Wiederholens zu zerstören: darum keine Belohnung und kein Kasten-Wechsel, aber Lernzeit und
  Tageslimit wie bei jeder Runde.
- **Geprüft:** PGlite (11 Fälle), Tests, Browser mit nachgestelltem Server; live: Probelauf mit Rollback, eingespielt,
  per RPC geprüft. Sicherung `backup/2026-11-28-vor-training`.

### Truhe vom Wächter (#129, Migration 20261208)
- **Was:** der erste Sieg über den Wächter einer Region bringt eine Truhe. Neue Server-Funktion `lq_waechter_melden`
  (prüft 80 %, Region mit mindestens zwei Stationen in der Klasse, jede mit Stern beim Kind, noch nicht besiegt; merkt
  `daten.waechter`). Die App fragt nach der Runde über die Warteschlange und zeigt „Truhe vom Wächter!“.
- **Warum:** ein Ziel am Ende jeder Region, das sich lohnt, ohne neues Sammeln (nur der erste Sieg zählt).
- **Wie geprüft:** alle 35 Migrationen auf leerem PGlite (Supabase-Ersatz: Rollen, pgcrypto-Funktionen, cron, auth),
  17 Fälle für die neue Funktion (Sieg, Niederlage, zweiter Sieg, Station ohne Stern, festgehaltener Stern, andere
  Klasse, eine Station, falsche Werte, fremde Sitzung; `lq_runde_melden` läuft weiter); Tests für den Aufruf in
  `rundeMelden.test.ts`; im Browser mit nachgestelltem Server: Runde genau einmal gemeldet, Truhe erst nach „wieder
  online“, Warteschlange danach leer. Auf dem Server: Probelauf mit Rollback, dann eingespielt und per RPC geprüft.
- **Werkstatt:** neu veröffentlicht unter https://claude.ai/artifact/1GB4Cpk8e3yZRSPLkLXEok (#128); die alte Adresse war
  für Claude nicht mehr erreichbar.

### Solo-Boss: der Wächter der Region (PR folgt, Plan Schritt 6, Handoff Schritt 4)
- **Was:** Der Meilenstein ist ein Kampf gegen den Wächter der Region: ein kleiner lebender Turm (Zinnen als Kopf,
  das Tor als Mund mit Fallgitter, wenn er angreift) in den Farben der acht Welten. Leiste über der Aufgabe mit
  Lebenspunkten; Treffer bei richtiger Antwort, Angriff bei einem Fehler; Ergebnis mit Wächter statt Fuchs; Knoten auf
  der Karte mit dem Wächter.
- **Warum:** Wunsch der Lehrkraft vom 20.11.; ein Ziel am Ende jeder Region, das man spürt – die gleichen zehn Fragen
  wie vorher, aber als Kampf. Die offenen Fragen aus dem Plan sind mit der Freigabe vom 27.11. entschieden und in
  `docs/lernquest.md` und `docs/roadmap.md` begründet.
- **Wie:** `figuren/waechter.tsx` (eine Zeichnung, Farben je Welt, Teile wie beim Golem, damit die Boss-Bewegungen
  passen), `app/Waechter.tsx`, `waechterLeben` und `MEILENSTEIN_GUT` in `karte.ts`, Prop `gegner` an der Runde.
- **Geprüft:** Tests (neu: `figuren/waechter.test.tsx`, `app/waechterkampf.test.tsx`), Runde im Browser gewonnen und
  verloren; jede Aufgabe auf 375 × 667 und 360 × 640 vermessen – zuerst lag die unterste Antwort unter dem Fuß, darum
  ist die Leiste auf kurzen Bildschirmen schmaler. Nebenbei: „Das nimmst du mit“ hatte doppelte Schlüssel, wenn zwei
  Stationen gleiche Aufgaben-Ids haben (behoben).
- **Sicherung:** `backup/2026-11-28-vor-solo-boss`.

### Ergebnis: erst das Verdiente, dann die Feier (#126)
- **Was:** Reihenfolge im Ergebnis neu: Haken, beste Serie, gleich danach die Kacheln (Erfahrung, Münzen, Woche) mit
  dem Stern-Hinweis; dann Hinweise zur Runde, Heldenstufe, Abzeichen, „Das nimmst du mit“, Tagesaufgabe, Wochenziel,
  Truhe. Mehrere neue Abzeichen stehen in **einem** Band mit Medaillen in einer Reihe („4 neue Abzeichen!“).
- **Warum:** auf dem Handy war das Ergebnis bei vielen Ereignissen 1661 px hoch (Bildschirm 844), die Kacheln standen
  ganz unten; jedes Abzeichen hatte ein eigenes Band. Jetzt 1449 px, die Kacheln auf dem ersten Bildschirm, und sie
  zählen hoch, während das Kind hinsieht.
- **Wie:** nur verschoben (39 Zeilen) in `LernquestApp.tsx`; `AbzeichenNeu` mit Gruppen-Band, CSS `.lq-abzeichen-mehr`;
  Test in `app/abzeichentext.test.tsx`. Geprüft mit einer Runde, die alles auf einmal bringt (Aufstieg, vier Abzeichen,
  Tagesaufgabe, Wochenziel, Truhe).

### Einzahl bei eins, überall (#125)
- **Was:** alle Texte der Kinder-App mit einer Zahl vor einem Wort durchgesehen; wo eine 1 möglich ist, steht jetzt die
  Einzahl: „Noch 1 Münze sammeln“ (Laden), „Dir fehlt noch eine Münze“ (Haus), „noch 1 Münze spenden“ und „Deine
  Münze zählt 1“ (Dorf), „von 1 Runde“ und „1 Aufgabe aus allen Stationen“ (Probetest), Wiederholen-Knoten für
  Vorleser, Klassen-Aufgabe.
- **Warum:** nach dem Fund bei den Abzeichen (#124) die gleiche Art Fehler überall suchen statt warten, bis ein Kind ihn
  sieht. Schon richtig waren: Wiederholen-Hinweise, Abmelden, Truhen, Event-Banner, Helfer im Dorf.
- **Wie:** `mitZahl(n, einzahl, mehrzahl)` in rules.ts (Test in `zahlen.test.ts`); Dorf und Haus nur je eine Textzeile,
  damit der Umbau des Dorfs (andere Sitzung) nicht berührt wird.
- **Korrektur:** den Solo-Boss hatte ich hier zuerst verworfen, weil `docs/lernquest.md` sagt „Der Bosskampf hängt nicht
  am Meilenstein“. Das war falsch: er ist Wunsch der Lehrkraft (20.11., `docs/plan-lernquest-fragen.md` Schritt 6) und
  nächster Schritt im Handoff; der Klassen-Boss am Beamer bleibt davon unberührt. Er kommt als eigener Schritt.

## 27.11.2026, abends (eigenständig, mit Erlaubnis für PRs und Merges)

### Abzeichen „Eroberer“ und richtiges Deutsch (#124)
- **Was:** achtes Abzeichen „Eroberer“ für geschaffte Regionen (1, 3, 6) mit eigener Burg als Symbol
  (`SymbolBurg`); eine Region zählt erst, wenn alle Stunden des Moduls einen Stern haben, auch noch nicht offene.
  Dazu die Texte der Abzeichen in richtigem Deutsch: Dativ nach „von“ („5 von 10 Lerntagen“, „6 von 15 Teilen“),
  Einzahl bei eins („0 von 1 Region“), „Silber für 40 Aufgaben, die sitzen“; und „einmal danebengetippt“ statt „1-mal“.
- **Warum:** Wunsch der Lehrkraft („Abzeichen z. B. für geschaffte Regionen“); und weil eine Kinder-App, die falsch
  dekliniert, nicht mit Liebe gemacht wirkt – der Fehler stand seit #121 auf der Held-Seite.
- **Wie:** `regionenGeschafft` in rules.ts, Texte je Abzeichen in `app/Abzeichen.tsx`; Tests: `abzeichen.test.ts`,
  `app/abzeichentext.test.tsx`, `runde.test.ts`.

### Zahlen in Antworten (#123, Mathe-Wunsch vom 25.11.)
- **Was:** gleicher Wert zählt (3,5 = 3.5 = 3,50; 1 000 = 1000; −4 = -4), „1.000“ bleibt mehrdeutig und zählt nicht;
  Zahlentastatur, wenn alle Lösungen Zahlen sind; eine falsche Zahl heißt nie „fast richtig“.
- **Warum:** der Plan verlangte zu prüfen, ob die Formate Rechnen tragen; ein Kind, das 3.5 statt 3,5 tippt, hat
  richtig gerechnet. Die Lücken- und Reihenfolge-Marken bleiben bewusst beim reinen Textvergleich (gleich), damit
  Anzeige und Bewertung nicht auseinanderlaufen.
- **Wie:** `zahlAus`, `gleicheAntwort`, `nurZahlen` in rules.ts, Tests in `zahlen.test.ts`; Prüfung und offene Fragen
  (Brüche, Einheiten, Rechenweg, Kopfrechnen, Zahlenstrahl) in `docs/lernquest.md`.

### Combo-Flamme in der Runde (#122)
- **Was:** ab zwei richtigen Antworten in Folge steht neben den Herzen eine kleine Flamme mit der Zahl; sie ploppt bei
  jeder weiteren richtigen Antwort.
- **Warum:** der rote Faden zwischen den Serien-Momenten (3, 5, 10 …): Konzentration wird sichtbar belohnt.
- **Wie:** `SymbolFlamme` in `figuren/symbole.tsx` (Palette, ohne Umriss), `.lq-combo` in der Runde.
- **Geprüft:** Runde im Browser (Flamme bei 3); Rundgang; Tests.
- **Damals nicht gebaut:** ein Trainingsplatz für schwache Karten (er hätte das Sammeln wieder geöffnet). Am 28.11. als
  Training ohne Belohnung gebaut (siehe oben).

### Abzeichen (#121)
- **Was:** sieben Abzeichen mit Bronze, Silber und Gold – Fleißig (Lerntage), Gedächtnis (Aufgaben, die sitzen),
  Sternensammler, Fehlerfrei (perfekte Runden), Entdecker (Stationen mit Stern), Sammler (Teile), Aufsteiger
  (Heldenstufe). Auf der Held-Seite mit Medaille und Weg zur nächsten Stufe; nach einer Runde ein Band „Neues Abzeichen“.
- **Warum:** Spielbarkeit wie bei Duolingo, aber für Lernverhalten (Tage, Sitzen, Fehlerfreiheit), nicht fürs Sammeln
  von Münzen. Nur aus dem Spielstand gezählt, kein Server.
- **Wie:** `ABZEICHEN`, `abzeichenWerte`, `abzeichenStufe`, `neueAbzeichen` in `rules.ts` (Tests:
  `abzeichen.test.ts`), `app/Abzeichen.tsx`, Farben `--lq-bronze`, `--lq-silber`.
- **Geprüft:** Held-Seite am Handy und iPad quer, perfekte Runde mit neuem Abzeichen im Browser; Rundgang.
- **Sicherung:** `backup/2026-11-27-vor-abzeichen`.

### #105–#118 (siehe auch „Feinschliff am Abend“ in `docs/lernquest.md`)
- #105 Held nirgends abgeschnitten, Anprobe im Laden · #106 Fehlgriffe erklärt, Tastatur · #107 „Das sitzt schon“ ·
  #108 Karte: Sterne ploppen, Held hüpft · #109 vier neue Münder · #110 Aufgaben gleiten herein, beste Serie ·
  #111 falsche Antwort wackelt, Herz zerbricht · #112 „Das nimmst du mit“, Knöpfe unten · #113 Reiter blenden ein ·
  #114 Tippfehler benannt · #115 Aufstieg zur Heldenstufe · #116 Klang für den Aufstieg · #118 Fuchs im Willkommen.
- Fund und Lehre: #110 schob die Seite auf einem kleinen Handy kurz seitlich; behoben vor dem Merge. Der Rundgang
  wird seitdem nie mehr durch `tail` geleitet, damit sein Exit-Code zählt.
