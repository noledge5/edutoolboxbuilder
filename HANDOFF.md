# Handoff – 13.11.2026 (alles in main: PR #66 Stunden-Filter, #67 Extra-Pakete, #68 Militärhelm)

## Ziel
Lernquest weiter ausbauen. Je Session ein Punkt aus „Nächste Schritte“, von oben nach unten.

## Stand
- `main` = live. PR #66: nur ausgearbeitete Stunden auf der Lehrkraft-Seite und als Station. PR #67: Extra-Pakete
  (Grammatik-Turm, Wortschatz-Wald; `src/lernquest/extra.ts`, `teacher/ExtraPakete.tsx`, Entscheidung in
  `docs/roadmap.md`). PR #68: Militärhelm (eigenes Teil `e48100506fe`). Tests 550 grün, Build grün.
- Die Lehrkraft muss noch: „Freigeschaltete neu senden“ drücken; ein Extra-Paket anlegen, erzeugen, freischalten (bisher
  ungetestet, auch das Erzeugen mit Claude); in der Werkstatt Golem, Rätseldrache, Drache-Begleiter, Einhorn und
  Militärhelm prüfen; beim Helm die Herkunft einstellen; „Teile und Wünsche“ angemeldet ansehen.

## Nächste Schritte (je einer pro Session)
1. **Animationen auf dem iPhone** (Safari): laut Lehrkraft „noch nicht wirklich da“, die Werkstatt bewegt sich dort.
   Verdacht: Service Worker (`public/sw.js`) liefert eine alte Fassung, oder „Bewegung reduzieren“ (`lernquest:ruhig`,
   Klasse `lq-ruhig`) bzw. die Systemeinstellung „Bewegung reduzieren“ (`prefers-reduced-motion`) ist an. Erst die
   Lehrkraft fragen, ob Neuladen/Schalter hilft; dann Code prüfen (Update-Weg des Service Workers, Medienabfrage).
   Safari ist hier nicht testbar, nur Chromium mit WebKit-ähnlichen Einstellungen.
2. **Extra-Pakete vervollständigen:** Auswertung (`teacher/Auswertung.tsx`), „Wiederholen sofort“
   (`teacher/WiederholenSofort.tsx`) und Bosskampf am Beamer (`useRegion`/`BossStart` in `LernquestView.tsx`) kennen nur
   Stunden (`lib.lessons` mit `klasse.stunden`); Extra-Pakete über `freiFuer`/`buildExtraPaket` dazunehmen.
3. **„Frage melden“:** Kinder melden eine fehlerhafte Übung, die Lehrkraft sieht die Meldungen beim Fragenpool. Braucht
   eine Migration (Freigabe der Lehrkraft in ihrer App); erst planen (Skill `aufgabe`) und Plan zeigen.
4. **Lehrkraft-Bereich in der Lernquest-App** für den Bosskampf mit Karten (heute scannt der Baukasten). Erst planen.
5. Kleinkram: `docs/kritik-und-plan.md` an den überholten Stellen nachziehen (Hinweis in `docs/roadmap.md`).

## Wichtig zu wissen
- Prüfungen der Lehrkraft: Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG, Sammlung `pruefung`
  (Skill `figur`). Offen zum Prüfen: Golem, Rätseldrache, Drache-Begleiter, Einhorn (Notiz dort ist alt, schon umgesetzt), Militärhelm.
- Wünsche für eigene Teile: `lq_teil where wunsch is not null` (Supabase „baukasten“); am 13.11. keine offen (Militärhelm gezeichnet).
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role`.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App (sonst Abbruch nach ~4 Minuten).
- App im Browser prüfen: `npm run spieltest`, Daten aus `scripts/spieltest-daten.js` in die Konsole, Helfer `scripts/spieltest-helfer.js`.
