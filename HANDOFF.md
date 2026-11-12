# Handoff – 2026-11-12

## Ziel
Lernquest (Kinder-App), Stufe E: Lern- und Spielablauf zuerst richtig machen (Klassenzimmer/Stufe F ist verschoben).
Schwächere Kinder an die Hand nehmen: Hilfe-Karten, Tipps, aufbauend, Wiederholung eingestreut.

## Stand
- Erledigt und live (PR #61, #62, #63 gemergt = veröffentlicht): Vektor-Held, Runde im neuen Look, Aufgaben/Truhe,
  Töne/Konfetti, Hilfe „So geht's“ + Tipps, KI-Fragenpool plant Tipps/Hilfe/Wiederholung mit, Tipps auch für
  Arbeitsblatt-Aufgaben, Station von leicht nach schwer.
- Datenbank: alte Stationen im Archiv (`lq_paket_archiv`), aktiv nur `test-to-be` und `test-plural`.
- Tests: grün (533), Typprüfung und Build grün, CI grün.
- Letzter Commit: 8812126 „Lernquest: Tipps auch für Arbeitsblatt-Aufgaben, Station von leicht nach schwer“
  (gemergt als 8d0d972 in main). Branch `claude/clever-hamilton-ztdfgt` vor neuer Arbeit auf `origin/main` bringen.

## Nächste Schritte
1. **Neu, Wunsch der Lehrkraft: Animationen der Figur im Spiel.** Die Bewegungen aus
   `src/lernquest/figuren/animationen.ts` (z. B. jubeln, huepfen, nicken, winken, staunen, seufzen, kopfschuetteln)
   sollen im Spiel laufen. Bisher bewegt sich im Spiel nur der Fuchs (`app/Fuchs.tsx`, Prop `animation`); der Held
   (`HeldBild` in `app/heldVektor.tsx`, `AvatarBild` in `app/avatar.tsx`) blinzelt nur und nimmt Posen.
   Ideen: Held reagiert in der Runde auf richtig/falsch, jubelt auf dem Ergebnis, winkt auf der Karte.
   „Bewegung reduzieren“ (`ruhigAn()`) muss sie abschalten. Erst kurz mit der Lehrkraft klären, wo welche Bewegung.
2. Lehrkraft prüft Avatar-Teile in der Werkstatt; danach Prüfungen lesen (ArtifactData, Sammlung `pruefung`,
   Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG) und `aendern` umzeichnen (Skill `figur`).
3. Optional: Lehrkraft drückt für eine echte Stunde „Fragen erzeugen“; KI-Auftrag (`src/lernquest/fragenpool.ts`) nachschärfen.

## Wichtig zu wissen
- Mergen nach `main` = veröffentlichen; jedes Mal neu fragen. Force-Push ist gesperrt.
- Supabase-Migrationen in kleinen Schritten einspielen (große Anfragen laufen ohne Bestätigung ab).
- Figuren: Farben nur aus `figuren/stil.ts` (Test prüft das); Vorschau `VORSCHAU=<ordner> npx vitest run src/lernquest/figuren/vorschau`.
- Spieltest: `npm run spieltest` (Port 4174), Werkstatt `npm run werkstatt`.
