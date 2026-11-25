# Handoff – 26.11.2026 (Klassendorf im Hochformat + Häuser gestalten, PR #88 gemergt und live; Migrationen offen)

## Ziel
Lernquest weiter ausbauen; als Nächstes die Wünsche der Lehrkraft vom 25.11. (Reihenfolge fragt man sie).

## Stand
- Erledigt und **gemergt (PR #88, live)**: Klassendorf neu nach Richtung A (Stilproben-Artifact, Bilder:
  https://claude.ai/artifact/UuzbsuRWBjo9jqdx8t9XhC). Hochformat mit Schlängelweg, wächst nach oben, öffnet am eigenen
  Haus; Dorfstufen Weiler/Dorf/Marktflecken/Stadt ab 0/2/4/6 fertigen Gebäuden; Abend 17–7 Uhr und Winter Dez–Feb nach
  Geräteuhr; Animationen; „Haus gestalten“ (Dach, Wände, Tür, Fahne, Zaun, Garten, Schmuck; ab Hütte; gratis).
  Branch `claude/dorf-hochformat` (gemergt, nur nach Rückfrage löschen). CI und Pages-Deploy grün.
- Tests grün (669), Typecheck, Build. SQL mit PGlite geprüft (alle 31 Migrationen, 21 Prüfungen, 3000 Zufallsfälle
  App = Server). Kinder-App im Browser (Handybreite, nachgestellter Server) geprüft. Nicht geprüft: echter Server,
  echtes Handy, Lehrerseite im Browser.
- **Offen bei der Lehrkraft:** in Supabase zuerst `20261203_lernquest_haeuser.sql`, dann `20261204_lernquest_haus_aussehen.sql`
  einspielen (bis dahin blendet die App Häuser bzw. „Haus gestalten“ aus); je Klasse „Eigene Häuser freigeschaltet“;
  Quizfragen in `src/lernquest/zelt.ts` prüfen. Offene Frage: Soll Gestalten Münzen kosten? (umgesetzt: gratis, Empfehlung)

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Rückmeldung der Lehrkraft zum neuen Dorf einarbeiten (Bilder, Stufen, Preise fürs Gestalten).
2. Wünsche vom 25.11. (Plan: `docs/plan-klassendorf-haeuser.md`): Mathe-Aufgaben (bald!), neue Gegenstände (auch
   Legendär), Einschmelzen, Abzeichen, Haus und Profil anderer besuchen (braucht Namen für Kinder = neue Entscheidung),
   Anbauten mit Seltenheit aus Truhen/Laden.
3. Solo-Boss an der Burg (Plan Schritt 6; `karte.ts` `MEILENSTEIN_GROESSE`, `meilensteinStarten` in `app/LernquestApp.tsx`).
4. Plan Schritt 2 (Vokabeln getrennt, Kompetenzen statt Blatt), Schritte 4–5 (Fuchs, Lehrerseite neu).
5. Offen: Werkstatt mit neuen Kartenteilen, Hausstufen und Aussehen veröffentlichen? (Version 17:
   https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG)

## Wichtig zu wissen
- Dorf: Aufbau rein rechnend in `src/lernquest/dorfplan.ts` (Grundstück jetzt 64 × 64), Zeichnung `figuren/dorf.tsx`,
  kleine Teile `figuren/dorfdeko.tsx`, Abend `figuren/nacht.tsx` (leuchtende Teile brauchen `data-licht`), Winter über
  `isoStift(…, { schnee })`. Regeln in `docs/design/prinzipien.md` („Klassendorf“).
- Aussehen: Listen doppelt in `dorf.ts` (`AUSSEHEN`) und `lq_aussehen_ok` (Migration 20261204), Test vergleicht; Farben
  je Wahl in `figuren/haeuser.tsx`. Neu seit letztem Besuch: `lernquest:dorf-gesehen` je Kind (`app/speicher.ts`).
- Vorschau: `VORSCHAU=<ordner> VORSCHAU_TEIL=dorf npx vitest run src/lernquest/figuren/vorschau` (alle Stufen, Abend, Winter,
  Lehrkraft, 30 Häuser); ohne globales Playwright: `NODE_PATH=<eigenes playwright>/node_modules PW_CHROME=<Chrome-Pfad>`.
- Spieltest mit fester Uhrzeit (Playwright `clock.setFixedTime`) hält Aktionen als „offline“ fest; mit echter Uhr testen.
- Supabase-Migrationen und Werkstatt-Veröffentlichung nur mit Zustimmung; Force-Push gesperrt; kein Figma.
