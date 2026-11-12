# Handoff – 12.11.2026 (Stufe E: Teil 1, Werkstatt und Teil 2 fertig, als Nächstes Teil 3)

## Stand
- **Kinder-App ist im Code abgeschaltet** (`UMBAU = true` in `src/lernquest/app/LernquestApp.tsx`): Anmeldung, Spiel und
  Boss-Beamer zeigen „Lernquest wird umgebaut“. Offene Übungen per Link laufen weiter. Auf den Geräten wird nichts
  gelöscht (Spielstand, ungesendete Runden bleiben). Live erst, wenn die Lehrkraft den Branch
  `claude/intelligent-knuth-ddy0o4` nach `main` mergt (Mergen = veröffentlichen). Wieder an: `UMBAU = false`.
- `main` hat Lernquest bis Stufe D, Teil 1 (PR #58). Branch `lernquest` = main (+ alter Handoff).
- **Stufe D, Teil 2 gibt es zweimal, beide nicht in `main`:**
  - `claude/lucid-galileo-0dvocr`: Klassen-Aufgabe (neue Sterne, Ziel 3 je Kind, einstellbar), Willkommen.
    **Ihre Migration `20261125_lernquest_klassenaufgabe.sql` ist LIVE eingespielt** (Supabase „baukasten“), die Datei
    liegt aber nur auf diesem Branch. Neue Migrationen müssen darauf aufbauen (Funktionen `lq_runde_melden`,
    `lq_stand_json` u. a. sind dort ersetzt, Tabelle `lq_klasse_woche`) – vorher die Datei ansehen.
  - Eine zweite Fassung (Runden statt Sterne, Truhe für alle) wurde in dieser Sitzung gebaut und per Revert wieder
    herausgenommen (Commit `f9a57f2`, nie eingespielt). Ideen daraus bei Bedarf dort nachlesen.

## Nächste Schritte: Stufe E bauen (Plan steht, entschieden am 12.11.2026)
Plan und Entscheidungen: „Stufe E“ in `docs/kritik-und-plan.md`; Mockup: `docs/design/lernquest/mockup-stufe-e.png`.
Kurz: Lernweg bleibt (sichtbarer), Stufe D Teil 2 übernehmen, Spielstände bleiben, keine Rangliste/Tagesserie.
1. **Fertig auf Branch `claude/amazing-newton-h940fp`** (nicht in `main`, von der Lehrkraft am 12.11. für gut befunden):
   - Teil 1: Farb-Tokens Grün/Creme in `lernquest.css` (wirkt auf alle Bildschirme), Start, Namen, PIN und Umbau-Seite
     neu, `Landschaft.tsx` (Landschaft mit Burg). `npm run spieltest` zeigt die App trotz `UMBAU` (nur dieser Modus).
   - Figuren-Baukasten `src/lernquest/figuren/`: Gerüst aus Teilen, Posen, Animationsmotor `bewegung.ts`
     (requestAnimationFrame, Blinzeln, Strecken, Kurven), Anker für Teile. Fuchs (7 Posen), Tintenkrake (Boss, 4 Posen),
     12 Teile. In der App: `app/Fuchs.tsx` (`Fuchs`, `FuchsSagt`).
   - Figuren-Werkstatt `lernquest/werkstatt.html` (nicht im Produktions-Build), Artefakt
     https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG (`npm run werkstatt`, mit Speicher für die Prüfungen der
     Lehrkraft). Fotos: `node scripts/werkstatt-fotos.mjs <ordner>`. **Jede Zeichnung über den Skill `figur`**; zu
     Beginn die Prüfungen lesen (Schritt 1; am 12.11. noch keine gespeichert).
2. **Fertig auf Branch `claude/clever-hamilton-ztdfgt`** (baut auf Teil 1 auf, nicht in `main`): Teil 2, Karte als
   Landschaft (`app/Landkarte.tsx`, Lage in `weg.ts`, Bauteile in `figuren/gelaende.tsx`, Werkstatt `#karte`), Fuchs
   über der Karte (`fuchsHinweis`), Leiste im Mockup-Look. Die Lehrkraft prüft Teile erst an den Spieler-Avataren (Teil 4,
   Entscheidung in `docs/roadmap.md`).
3. **Als Nächstes Teil 3: Runde im neuen Look**; danach Teile 4–6 je eigene Sitzung. Teil 4: Held als Figur mit denselben Ankern (`hut`, `hand-links`,
   `hand-rechts`, dazu `ruecken`), jedes Teil aus `teile.ts` als Item. Teil 5: Dateien von
   `claude/lucid-galileo-0dvocr` holen (Migration `20261125_lernquest_klassenaufgabe.sql` ist live, muss ins Repo).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
