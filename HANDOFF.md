# Handoff – 09.11.2026 (Bilder und eigene Teile auf der Lehrerseite)

## Stand
- Auf „Bilder der Teile“ (nur Admin): Bilder hochladen (#48), nachjustieren, drehen, mit KI malen (#49), eigene Teile
  anlegen (dieser Branch). Details: `docs/lernquest.md` → „Bilder hochladen …“, „Bilder nachjustieren …“, „Eigene Teile“.
- Migrationen `20261117_lernquest_bilder.sql` und `20261118_lernquest_eigene_teile.sql` eingespielt; Admin = Besitzer-Hash
  der Klasse „5c“. Live-Tests (`LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`) grün.
- Nicht geprüft: echter OpenRouter-Aufruf, Safari/iPad.

## Nächste Schritte
- Rückmeldung der Lehrkraft abwarten. Fehlt der Knopf auf einem Gerät: zweiten Schlüssel-Hash in `lq_admin` nachtragen.

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App; ohne Antwort bricht es
  nach knapp 4 Minuten ab (dann prüfen, ob etwas angekommen ist, und neu versuchen).
