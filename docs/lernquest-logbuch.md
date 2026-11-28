# Lernquest-Logbuch

Was an Lernquest gebaut wurde, Schritt für Schritt: was, warum, wie geprüft, PR und Sicherung. Neue Einträge oben.
Vor größeren Änderungen steht ein Git-Tag `backup/<datum>-<thema>` auf dem Stand von `main` davor; zurück geht es mit
`git checkout <tag>` (ansehen) oder einem Revert des PRs.

Prüfung bei jedem Schritt: `npx vitest run`, `npm run typecheck`, `npm run build`, `npm run rundgang` (bei laufendem
`npm run spieltest` oder `npm run demo` mit `LQ_URL`) auf Handy, kleinem Handy, iPad hoch und quer und am Beamer, und
Bildschirmfotos, die angesehen wurden.

## 28.11.2026, nachts und morgens (eigenständig; ab dem Solo-Boss nach erneutem Lesen des Handoffs)

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
- **Nicht gebaut, zur Entscheidung:** ein Trainingsplatz für schwache Karten. Der Server nimmt Wiederholungsrunden mit
  beliebigen Karten an und gibt ein Drittel Erfahrung und Münzen – das öffnete wieder das Sammeln, das die Lehrkraft
  am 17.11. abgestellt hat. Möglich wäre Training ohne Belohnung (braucht eine kleine Server-Änderung).

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
