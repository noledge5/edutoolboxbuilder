# Handoff – 06.11.2026

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`) auf dem Branch `lernquest`. Nächste Sitzung: **Designrunde
zur Professionalisierung des Lernquest-Designs mit Grill-Session** (Skill `grill-with-docs`), bevor Stufe 2 Oberfläche bekommt.

## Stand
- Stufe 1 fertig und gepusht: Server, Kinder-App (`lernquest/`, `src/lernquest/app/`) nach Prototyp
  `docs/design/lernquest/Main.dc.html`, Lehrkraft-Bereich im Baukasten (Übersicht → „Lernquest“).
- Freigabe der Schule für Klarnamen liegt vor (in `docs/lernquest.md` vermerkt).
- Stufe 2 „Held und Beute“ halb fertig:
  - Server eingespielt (freigegeben): `supabase/migrations/20261106b_lernquest_held.sql` (Münzen, Truhen mit Garantie,
    Laden, Avatar, Klassen-Ansicht, Katalog `lq_teil` mit 40 Teilen).
  - Im Browser: `src/lernquest/teile.ts` (Katalog, Seltenheiten, Preise, Boni), Münzen/Truhen in `rules.ts`, Tests grün.
  - **Fehlt:** Oberfläche (Held-Seite, Truhe, Laden, Klasse, Münzen im Kopf, Herzen in der Runde, Kacheln im Ergebnis),
    Avatar-Zeichnungen (SVG je Teil), Server-Aufrufe in `server.ts`, Live-Test für Stufe 2, Doku.
- Tests: Typprüfung grün, 280 Tests grün (Live-Servertest nur mit `LQ_LIVE=1`).
- Letzter Commit: siehe `git log -1` (wip Stufe 2).

## Nächste Schritte
1. ✅ Designrunde erledigt, Regeln in `docs/design/lernquest/README.md` und in `lernquest.css` umgesetzt (Tokens,
   Typo-Skala, Raster, Fokus, Kontrast, zwei Spalten ab 1024 px); `lernquest.css.test.ts` wacht darüber.
   Offen aus den Regeln: Hinweis „Nochmal“ nach 10 s Laden.
2. Stufe 2 Oberfläche nach dem geschärften Design bauen (Held.dc.html, Truhe.dc.html als Vorlage).
3. Browser-Check wie bisher (Skript-Idee: Playwright, Supabase über Node-`fetch` in `page.route`), dann PR nach Freigabe.

## Wichtig zu wissen
- Entschieden: Herzen = nur Bonus-Polster (Fehler kostet ein Herz, übrige Herzen geben Bonus-Münzen, nichts endet).
- Münzen: 5 + 1 je richtige + 2 je übriges Herz, + Bonus-% (max. 20 %), max. 200/Tag. Truhe: Station erstmals ganz
  gespielt, Wochenziel erstmals in der Woche. Chancen 55/28/12/4/1, spätestens jede 5. Truhe selten. Regeln doppelt (TS + SQL).
- Der Server von Stufe 2 läuft schon live; die Stufe-1-App kommt damit klar (zusätzliche Felder werden ignoriert).
- Look-Werte des Prototyps stecken in `src/lernquest/app/lernquest.css` (`--lq-*`, Namen teils noch aus der grünen Fassung).
- Auf `lernquest` arbeiten; `main` = veröffentlichen, nur nach Freigabe.
