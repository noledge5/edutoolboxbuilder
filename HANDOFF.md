# Handoff – 09.11.2026 (Bilder hochladen)

## Ziel
Die Lehrkraft lädt gemalte Bilder auf der Lehrerseite hoch und ordnet sie direkt einem Teil zu (statt umbenennen,
`npm run lq:bilder`, committen). Nur sie lädt hoch; die Bilder gelten für alle Klassen.

## Stand
- Gebaut auf `claude/sweet-tesla-pcomqy`. Details: `docs/lernquest.md` → „Bilder hochladen auf der Lehrerseite“.
- Migration `20261117_lernquest_bilder.sql` eingespielt (09.11.2026, mit OK); Admin = Besitzer-Hash der Klasse „5c“.
  Live-Test „Bilder der Teile“ grün. CI grün.
- Nicht geprüft: echte Flux2-Klein-Bilder, Safari auf dem iPad.

## Nächste Schritte
1. Lehrkraft merged (= live), probiert „Bilder der Teile“ mit echten Bildern.
2. Fehlt der Knopf auf einem Gerät: zweiten Schlüssel-Hash in `lq_admin` nachtragen.

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
