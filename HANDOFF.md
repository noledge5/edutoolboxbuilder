# Handoff – 12.11.2026 (Plan für Stufe E entschieden, Bau beginnt)

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
1. **Teil 1 als Nächstes** (eigener Branch, Skill `aufgabe` ab Schritt 2): Farben Grün/Creme, Schrift, Knöpfe als
   Tokens in `lernquest.css`; Fuchs als Vektor-Komponente mit Posen (winken, jubeln, denken, trösten); Start- und
   Anmeldeseite im neuen Look. Screenshots am Handy-Format an die Lehrkraft. `UMBAU` bleibt `true`.
2. Danach Teile 2–6 je eigene Sitzung. Für Teil 5 die Dateien von `claude/lucid-galileo-0dvocr` holen (Migration
   `20261125_lernquest_klassenaufgabe.sql` ist live, muss ins Repo).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
