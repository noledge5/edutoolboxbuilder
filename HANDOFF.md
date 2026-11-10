# Handoff – 10.11.2026

## Ziel
Lernquest (`docs/lernquest.md`) auf dem Branch `lernquest`. Designrunde ist gelaufen; Entscheidungen in
`docs/design/lernquest/README.md` („Designrunde 10.11.2026“).

## Stand
- Stufe 1 fertig. Stufe 2 „Held und Beute“: Server-Regeln (live), Katalog in `teile.ts`.
- Neu (10.11.): Farb-Tokens + Schriftskala in `lernquest.css`; Teile-Katalog von der Lehrkraft einstellbar (Seite „Teile“
  im Lernquest-Bereich des Baukastens), Frisuren + Haarfarbe, Herkunft je Teil, Bilder per Bild-KI oder Datei, Freistellen,
  Platzieren. Server: `supabase/migrations/20261110_lernquest_katalog.sql` – **nicht eingespielt**, wartet auf Freigabe.
- Geprüft: Typprüfung, alle Tests, Build; Migration lokal auf Postgres 16 (Admin, Truhe, Laden, Avatar, Startteil-Regel);
  Seite „Teile“ im Browser gegen die lokale Datenbank (Laptop- und iPad-Breite).

## Nächste Schritte
1. Lehrkraft fragen, ob die Migration eingespielt werden darf; danach sofort „Katalog übernehmen“ tippen.
2. Bilder für die 46 Teile erzeugen (Seite „Teile“), Kästen in `SLOT_BOX` ggf. nachjustieren.
3. Stufe 2 Oberfläche in der Kinder-App: Held (mit `AvatarBild`), Truhe, Laden, Klasse, Münzen, Herzen;
   Katalog über `katalogAktualisieren` laden. Live-Test für Stufe 2.
4. Noch offen aus der Designrunde: iPad/Laptop-Layout der Kinder-App, Zustände, Animationen.

## Wichtig zu wissen
- Admin des Katalogs: wer zuerst „Katalog übernehmen“ tippt (bewusst vorläufig, später Login).
- Teile nie löschen, nur „Nicht erhältlich“; Besitz bleibt; verliert ein Teil „Start“, behält es, wer es trägt.
- Startteil ohne Wahl = das mit der kleinsten id (TS `ersterStart`, SQL `lq_erster_start`).
- Migrationen lassen sich lokal prüfen: `/usr/lib/postgresql/16/bin` (initdb, Rollen anon/authenticated, Schema `extensions` mit pgcrypto, Stub `cron.schedule`), dann alle `lq`-Migrationen der Reihe nach einspielen.
