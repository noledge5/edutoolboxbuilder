# Handoff – 06.11.2026 (Nachmittag)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 2 „Held und Beute“ ist auf dem Branch `claude/lernquest-stufe2` fertig gebaut
(Server-Aufrufe, Oberfläche, Avatar, Testlauf); wartet auf Freigabe.

## Stand
- **Live seit 06.11.2026** (Merge nach `main` = veröffentlichen, auf Wunsch der Lehrkraft):
  https://noledge5.github.io/edutoolboxbuilder/lernquest/, Lehrkraft-Bereich im Baukasten unter Übersicht → „Lernquest“.
- Stufe 1 fertig. Designregeln (`docs/design/lernquest/README.md`, Abschnitt „Designregeln“) sind in
  `src/lernquest/app/lernquest.css` umgesetzt; `lernquest.css.test.ts` prüft Tokens, Schriftgrößen, Raster und Fokus.
- Stufe 2: Server läuft schon live (`supabase/migrations/20261106b_lernquest_held.sql`: Münzen, Truhen, Laden, Avatar,
  Katalog). Im Browser gibt es `src/lernquest/teile.ts` (40 Teile, Seltenheiten, Preise, Boni) und die Münz- und
  Truhenregeln in `rules.ts`. **Fehlt:** Oberfläche, Avatar-Zeichnungen, Server-Aufrufe in `server.ts`, Doku.
- **Testlauf** für echtes Ausprobieren: `npm run lq:testlauf` (`src/lernquest/testlauf.live.test.ts`). Baut die App,
  legt mit Wegwerf-Schlüssel eine Testklasse mit Testkind auf dem echten Server an, spielt eine Runde in Chromium
  (eine Antwort absichtlich falsch), prüft XP, Bestwert, Münzen und Truhe gegen `rules.ts`, macht Bilder (Handy, iPad,
  Laptop) und löscht die Klasse wieder. `LQ_URL=https://noledge5.github.io/edutoolboxbuilder/lernquest/` spielt die
  Live-Seite, `LQ_BILDER=<Ordner>` legt die Bilder in den Scratchpad. Letzter Lauf lokal und live: grün
  (18 EP, 80 %, 13 Münzen, 1 Truhe).
- Tests: Typprüfung grün, 285 Tests grün (Live-Tests nur mit `LQ_LIVE=1` bzw. `LQ_TESTLAUF=1`).

## Nächste Schritte
1. ✅ `server.ts`: `truheOeffnen`, `kaufen`, `avatarSetzen`, `klasseAnsicht`, `rundeMelden` mit Münzen/Truhen;
   Live-Test (`LQ_LIVE=1`) grün. Branch `claude/lernquest-stufe2`.
2. ✅ Oberfläche (`app/Held.tsx`): Münzen im Kopf, Held-Seite, Truhe, Laden, Klasse, Herzen in der Runde, Kacheln im
   Ergebnis; Leiste mit Karte, Wiederholen, Held, Klasse.
3. ✅ Avatar-Zeichnungen: 40 Teile in `app/avatar.tsx` (Test: jedes Teil hat eine Zeichnung).
4. ✅ Testlauf erweitert (Truhe öffnen, Teil anlegen, Klasse; Bilder Held auf allen Größen), lokal gegen den echten
   Server grün.
5. Offen: PR und Merge nur nach Freigabe der Lehrkraft; danach `LQ_URL=…/lernquest/ npm run lq:testlauf` gegen die
   Live-Seite. Hinweis „Nochmal“ nach 10 s Laden fehlt weiter. Danach Stufe 3 (Bosskampf).

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch der Sitzung nutzen, PR und Merge nur auf Wunsch.
- Herzen = nur Bonus-Polster (Fehler kostet ein Herz, übrige geben Bonus-Münzen, nichts endet).
- Münzen: 5 + 1 je richtige + 2 je übriges Herz, + Bonus-% (max. 20 %), max. 200/Tag. Truhe: Station erstmals ganz
  gespielt, Wochenziel erstmals in der Woche. Chancen 55/28/12/4/1, spätestens jede 5. Truhe selten. Regeln doppelt
  (TS + SQL), der Testlauf vergleicht beide.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
- Offen aus den Designregeln: Hinweis „Nochmal“ nach 10 s Laden.
