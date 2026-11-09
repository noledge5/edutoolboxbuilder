# Handoff – 09.11.2026 (Truhen-Schätze)

## Ziel
Mehr Teile für den Helden; manche nur aus Truhen, bis zum Fund nur als „?“ in der Teile-Liste.

## Stand
- Gebaut auf `claude/optimistic-keller-ypt0vr`: 24 neue Teile (jetzt 80), davon 12 Truhen-Schätze. Zeichnungen,
  Bild-Prompts (`docs/design/lernquest/bilder/prompts.md`, `edit-prompts.md`), Laden ohne Schätze, Liste „? Nur in
  Truhen“. Details: `docs/lernquest.md` → „Truhen-Schätze (09.11.2026)“.
- Migration `supabase/migrations/20261116_lernquest_truhenschaetze.sql` lokal geprüft (alle Migrationen, Kauf eines
  Schatzes → `ungueltig`, 2000 Truhen finden alle 12 Schätze) und live eingespielt (80 Teile, 12 Schätze).
- Tests grün (365), Build grün. Nicht geprüft: Held- und Laden-Seite im Browser durchgeklickt.

## Nächste Schritte
1. PR #45 gemergt (= live). Deploy prüfen, Rückmeldung der Lehrkraft abwarten.
2. Neue Arbeit: Branch frisch von `main`.
3. Gemalte Bilder für die 24 neuen Teile mit den Prompts machen (`npm run lq:bilder`).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16 ist installiert; vor den Migrationen Ersatz für `auth`, `extensions`
  (pgcrypto) und `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role`.
