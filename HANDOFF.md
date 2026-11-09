# Handoff – 09.11.2026 (Bilder hochladen)

## Ziel
Die Lehrkraft lädt gemalte Bilder auf der Lehrerseite hoch und ordnet sie direkt einem Teil zu (statt umbenennen,
`npm run lq:bilder`, committen). Nur sie lädt hoch; die Bilder gelten für alle Klassen.

## Stand
- Gebaut auf `claude/sweet-tesla-pcomqy`. Details: `docs/lernquest.md` → „Bilder hochladen auf der Lehrerseite“.
- Migration `supabase/migrations/20261117_lernquest_bilder.sql` lokal mit allen Migrationen geprüft, **noch nicht
  eingespielt** (wartet auf OK der Lehrkraft, vor dem Merge).
- Tests, Typprüfung, Build grün; im Browser mit nachgeahmten RPCs durchgeklickt.

## Nächste Schritte
1. OK der Lehrkraft → Migration einspielen.
2. Ihren Schlüssel-Hash in `lq_admin` eintragen, gemeinsam mit ihr: ihre Klassen erkennen
   (`select name, besitzer from lq_klasse`), dann `insert into public.lq_admin (hash, notiz) select distinct besitzer, 'Lehrkraft' from public.lq_klasse where id in (…)`.
   Den Hash nicht ins Repo schreiben.
3. `LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts` (Test „Bilder der Teile“).
4. Danach Merge (= live).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role` (mit Standardrechten wie bei Supabase).
