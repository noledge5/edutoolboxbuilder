# Handoff – 06.11.2026 (2)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Nächste Sitzung: **Designrunde zur Professionalisierung des
Lernquest-Designs mit Grill-Session** (Skill `grill-with-docs`), dazu **Slop Patterns** (Plugin, prüft UI-Code auf
KI-Standard-Design) auf die gebaute App, bevor Stufe 2 Oberfläche bekommt.

## Stand
- Stufe 1 fertig: Server, Kinder-App (`lernquest/`, `src/lernquest/app/`), Lehrkraft-Bereich im Baukasten.
- Stufe 2 „Held und Beute“ halb fertig: Server live (`supabase/migrations/20261106b_lernquest_held.sql`), Katalog
  `src/lernquest/teile.ts`, Münzen/Truhen in `rules.ts`. **Fehlt:** Oberfläche (Held, Truhe, Laden, Klasse, Münzen im
  Kopf, Herzen, Kacheln im Ergebnis), Avatar-SVGs, Aufrufe in `server.ts`, Live-Test Stufe 2, Doku.
- Diese Sitzung: unslop-Prüfung der App-Texte, 8 Texte geschärft (`LernquestApp.tsx`, Fehlermeldungen in `server.ts`).
- Tests: Typprüfung grün, 280 Tests grün; CI für den ersten Text-Commit grün, für `fe61762` noch nicht angesehen.
- Letzter Commit: `fe61762` Lernquest: Fehlermeldungen nennen Ursache, Hinweis zum Tageslimit konkret.

## Nächste Schritte
1. CI für `fe61762` ansehen.
2. Prüfen, ob Slop Patterns geladen ist (Werkzeuge per ToolSearch „slop“); auf `src/lernquest/app/` + `lernquest.css` laufen lassen.
3. Designrunde mit `grill-with-docs`: Prototyp (Canvas https://claude.ai/artifact/H586HwfxoGuewKukR4dRv4,
   Dateien `docs/design/lernquest/*.dc.html`, README dort) gegen die App: Typo-Skala, Abstände, Farb-Tokens, Zustände,
   Animationen, Barrierefreiheit, iPad/Laptop, Avatar-Stil für 40 Teile. Entscheidungen in `docs/lernquest.md` /
   `docs/design/lernquest/README.md`.
4. Danach Stufe 2 Oberfläche bauen (Held.dc.html, Truhe.dc.html als Vorlage), Browser-Check, PR nach Freigabe.

## Wichtig zu wissen
- Branch: `claude/intelligent-brown-pd2fp0` (enthält den Stand von `lernquest`); `main` = veröffentlichen, nur nach Freigabe.
- Prototyp-Texte unter `docs/design/` sind bewusst nicht an die neuen App-Texte angepasst (nur Vorlage).
- Fehler `zugang`/`voll`/`ungueltig` (`lqText` in `server.ts`) treffen praktisch nur den Lehrkraft-Bereich.
- Herzen = nur Bonus-Polster. Münzen: 5 + 1 je richtige + 2 je übriges Herz, + Bonus-% (max. 20 %), max. 200/Tag.
  Truhe: Station erstmals ganz gespielt, Wochenziel erstmals in der Woche. Chancen 55/28/12/4/1, spätestens jede
  5. Truhe selten. Regeln doppelt (TS `rules.ts` + SQL `lq_runde_melden`).
- Look-Werte in `src/lernquest/app/lernquest.css` (`--lq-*`, Namen teils noch aus der grünen Fassung).
