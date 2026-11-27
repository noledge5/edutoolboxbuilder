# Lernquest-Logbuch

Was an Lernquest gebaut wurde, Schritt für Schritt: was, warum, wie geprüft, PR und Sicherung. Neue Einträge oben.
Vor größeren Änderungen steht ein Git-Tag `backup/<datum>-<thema>` auf dem Stand von `main` davor; zurück geht es mit
`git checkout <tag>` (ansehen) oder einem Revert des PRs.

Prüfung bei jedem Schritt: `npx vitest run`, `npm run typecheck`, `npm run build`, `npm run rundgang` (bei laufendem
`npm run spieltest` oder `npm run demo` mit `LQ_URL`) auf Handy, kleinem Handy, iPad hoch und quer und am Beamer, und
Bildschirmfotos, die angesehen wurden.

## 27.11.2026, abends (eigenständig, mit Erlaubnis für PRs und Merges)

### Abzeichen „Eroberer“ und richtiges Deutsch (PR folgt)
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
