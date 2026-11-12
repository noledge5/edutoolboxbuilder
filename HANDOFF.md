# Handoff – 12.11.2026 (Stufe D, Teil 2 gebaut)

## Stand
- `main` hat alles: Teile einstellen, Frisuren, eigene Frisuren, Abmelden (PR #53, #54) und Stufe A–D Teil 1
  (Runde, KI-Pool, Lernspirale, Sterne aus drei Stufen, Tagesaufgaben, Laden nach Heldenstufe; bis PR #58).
- Branch `lernquest` am 12.11.2026 auf den Stand von `main` gebracht (main hineingemergt, Inhalt gleich).
  `lernquest-designrunde-alt` ist nur eine Sicherung, nicht mergen.
- Alle Migrationen bis `20261124_lernquest_tagesaufgaben.sql` sind live eingespielt.

- Stufe D, Teil 2 (Willkommen, Klassen-Aufgabe der Woche) auf `claude/intelligent-knuth-ddy0o4`, Details in
  `docs/lernquest.md`. Migration `20261125_lernquest_willkommen_klassenziel.sql` lokal geprüft, **noch nicht live**.

## Nächste Schritte (Plan: `docs/kritik-und-plan.md`, Teil 3)
- Migration 20261125 einspielen (Freigabe der Lehrkraft), dann `LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`.
  Erst danach mergen: Die App zeigt Willkommen und Klassenziel nur mit dem neuen Server, alte Server stören nicht.
- Danach Stufe E (Aussehen: Karte als Landschaft, Vektor-Held, Töne, Jubel), dann F (Klassenzimmer). G läuft nebenher.
- Offene Entscheidungen der Lehrkraft: Erinnerungen aufs Handy (Stufe D); eingefrorene Folien entfernen (Stufe G).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
