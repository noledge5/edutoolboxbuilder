# Handoff – 09.11.2026

## Ziel
Lernquest (Kinder-App, `src/lernquest/app/`) runder und anschaulicher machen, Bugs finden. Ohne Server-Änderungen.

## Stand
- Erledigt: PR #44 gemergt (= live). Fehler behoben (alter Truhen-Text, Lücken-Lösung in Klammern, Scroll beim
  Seitenwechsel, „Los geht’s!“ nimmt jetzt die schwächste Runde, Menü schließt). Neu: Held im Kopf, „Nächste Truhe“
  auf der Karte, Sterne je Region, Fußspuren, Stern-Regeln an der Station, Lücke/Satz grün-rot, Ergebnis-Punkte.
  Details in `docs/lernquest.md` → „Feinschliff Kinder-App (09.11.2026)“.
- Tests: grün (364), CI grün; Deploy lief beim Ende noch.
- Letzter Commit: 50bcbbc Merge PR #44 (Branch-Commit 9437ef0)

## Nächste Schritte
1. Deploy-Ergebnis prüfen (Actions → „Deploy to GitHub Pages“ #84) und Rückmeldung der Lehrkraft am Handy abwarten.
2. Weitere Ideen, noch nicht gebaut: Fußspuren auf dem iPad kräftiger/dichter; Paare/Punkt-Übungen zeigen einen
   nutzlosen grauen „Prüfen“-Knopf; Boss-Seiten (Kind/Beamer), Gutscheine und Truhen-Animation noch nicht durchgesehen.
3. Neue Arbeit: Branch frisch von `main` (der alte ist gemergt).

## Wichtig zu wissen
- Durchspielen ohne echten Server: Playwright mit `page.route('**/rest/v1/rpc/*')` die RPCs nachahmen
  (`lq_mein_stand`, `lq_boss_offen`, `lq_runde_melden`, …), Sitzung in localStorage `lernquest:sitzung` mit
  64-stelligem Hex-Token, Pakete aus `stationPaket(ENGLISCH5, i)` (`src/lernquest/probe.ts`). `npm run build` +
  `npx vite preview`, Seite `/lernquest/`.
- CSS-Regeln werden getestet (`lernquest.css.test.ts`): nur Tokens für Farben, Schriftgrößen, Abstände, Radien.
- Mergen nach `main` = veröffentlichen (GitHub Pages).
- HANDOFF.md liegt nur auf dem Branch claude/laughing-hawking-c0iobh, nicht in main.
