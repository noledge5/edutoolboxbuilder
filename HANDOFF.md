# Handoff – 12.11.2026 (Kinder-App abgeschaltet, Umbau „Stufe E“ steht an)

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

## Nächste Schritte: Umbau der Kinder-App („Stufe E“, neue Sitzung)
Wunsch der Lehrkraft (12.11.2026): die App ganz umbauen, statt Stück für Stück weiter. Ziele:
- **Lernkurve:** wie Kinder lernen und vorankommen (Pfad, Stufen, Wiederholen) neu durchdenken; Grundlage
  `docs/kritik-und-plan.md` (Stufe A–D gebaut) und `docs/lernquest.md`.
- **Aussehen nach dem Mockup der Lehrkraft:** Grafikdesign, Grün und Creme, Karte als Landschaft mit Burgen,
  Tagesaufgaben, Truhen-Bild. Das Mockup liegt nicht im Repo: zu Beginn bei der Lehrkraft anfragen.
- **Fuchs als Charakter, der durch die App führt** (der eigene Held bleibt, `docs/roadmap.md`).
- **Held und Teile neu als Vektorgrafik aus dem Code**, detailreich, Duolingo-Stil (die gemalten ComfyUI-Bilder fallen weg).
- Zuerst planen und mit der Lehrkraft entscheiden (Skill `aufgabe`, Schritt 1), dann bauen. Klären: Was wird aus
  Stufe D Teil 2 (live in der DB)? Werden alte Spielstände übernommen?

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
