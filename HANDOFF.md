# Handoff – 12.11.2026 (Stufe D veröffentlicht, Teil 2 gebaut)

## Stand
- Stufe D Teil 1 (Tagesaufgaben, Laden nach Heldenstufe, Held auf der Karte) ist mit PR #58 auf `main` = veröffentlicht.
  Dabei Zeilenenden in 5 Dateien von CRLF zurück auf LF gesetzt.
- Stufe D Teil 2 auf `claude/lucid-galileo-0dvocr` (Entscheidungen der Lehrkraft 12.11.2026):
  Klassen-Aufgabe der Woche (3 Sterne je Kind, Lehrerseite 1–20, Truhe für alle mit Stern) und Willkommen für neue
  Kinder (Held → Mini-Runde → Willkommens-Truhe). Details: `docs/lernquest.md` → „Klassen-Aufgabe und Willkommen“.
- Migration `20261125_lernquest_klassenaufgabe.sql`: eingespielt am 12.11.2026, Live-Tests grün (12/12, neuer Test
  „Stufe D, Teil 2“). Vorher geprüft: die ersetzten Live-Funktionen glichen dem Repo (nur Kommentare fehlten).
- Geprüft: Typprüfung, 427 Tests, Build; Browser-Durchlauf im Spieltest-Modus (offline).

## Nächste Schritte
- PR für Teil 2 ist offen; Merge (= veröffentlichen) macht die Lehrkraft. Offen aus Stufe D: Heldenstufen schalten mehr frei (Begleiter wachsen,
  Titel am Beamer), Erinnerungen aufs Handy (Entscheidung offen).

## Wichtig zu wissen
- Lokale Datenbank zum Prüfen: Postgres 16; vor den Migrationen Ersatz für `auth`, `extensions` (pgcrypto) und
  `cron.schedule` anlegen, Rollen `anon`, `authenticated`, `service_role`. Token aus `lq_anmelden` hat Präfix `ok:`.
- Supabase-Migrationen über die Verbindung brauchen eine Bestätigung der Lehrkraft in ihrer App.
