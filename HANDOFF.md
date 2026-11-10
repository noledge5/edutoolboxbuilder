# Handoff – 10.11.2026 (Teile einstellen, Frisuren sammeln)

## Stand
- Branch `lernquest` = `main` + diese Arbeit (alle Lernquest-Arbeit liegt auf `main`; `lernquest` stand bis 10.11. auf dem
  06.11. – die alte Designrunde ist auf `lernquest-designrunde-alt` gesichert, nicht mergen).
- Neu: auf „Bilder der Teile“ bei jedem Teil und jeder Frisur „Einstellungen“ (Seltenheit, Herkunft, Boni); Frisuren als
  Teile (`frisur-<id>`), in der Kinder-App gesperrt mit „Im Laden“/„Nur in Truhen“, Laden-Bereich „Frisur“.
  Details: `docs/lernquest.md` → „Teile einstellen und Frisuren sammeln“.
- Migration `20261121_lernquest_teile_einstellen.sql`: eingespielt am 10.11.2026, Live-Tests grün; lokal geprüft; Browser-Durchlauf
  Lehrerseite + Kinder-App gegen die lokale Datenbank.

## Nächste Schritte
- Rückmeldung der Lehrkraft. WIP auf `claude/sweet-tesla-pcomqy` (Abmelden-Knopf, eigene Frisuren) ist noch nicht auf `main`.

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
