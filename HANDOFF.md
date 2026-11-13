# Handoff – 13.11.2026 (Extra-Pakete vervollständigt; Idee Klassendorf notiert)

## Ziel
Lernquest weiter ausbauen. Je Session ein Punkt aus „Nächste Schritte“, von oben nach unten.

## Stand
- Erledigt (Branch `claude/bold-fermi-y5ou5o`, PR offen, live erst nach dem Merge): Auswertung, „Wiederholen sofort“ und
  Bosskampf kennen Grammatik-Turm und Wortschatz-Wald (`klassenRegionen`/`regionPakete` in `src/lernquest/extra.ts`;
  Auswertung dort je Thema, `auswertenThemen` in `auswertung.ts`). Keine Migration.
- Tests: grün (604), Typprüfung und Build ok; Oberfläche nicht im Browser geprüft (braucht echte Klasse).
- Neue Idee der Lehrkraft: **Klassendorf**, ausgearbeitet in `docs/idee-klassendorf.md` (noch nicht entschieden).

## Für die Lehrkraft offen
- PR prüfen und mergen; dann ein Extra-Paket freischalten und in Auswertung, Wiederholen sofort, Bosskampf ansehen.
- Die 50 neuen Teile, Golem, Rätseldrache, Drache-Begleiter, Einhorn, Militärhelm in der Werkstatt prüfen
  (am 13.11. noch keine Prüfung dazu).
- Sperre auf jedem Gerät einrichten; am iPhone prüfen, ob sich die Figuren bewegen.
- `docs/idee-klassendorf.md` lesen und auswählen, was gebaut wird.

## Nächste Schritte (je einer pro Session)
1. **Prüfungen der Lehrkraft lesen**, sobald da (Skill `figur`, Schritt 1), Teile mit „aendern“ überarbeiten.
2. **Klassendorf planen**, sobald die Lehrkraft ausgewählt hat: Skill `aufgabe`, Plan zeigen (braucht Migrationen).
3. **„Frage melden“:** Kinder melden fehlerhafte Übungen, Lehrkraft sieht sie beim Fragenpool. Migration; erst planen.
4. **Lehrkraft-Bereich in der Lernquest-App** für den Bosskampf mit Karten. Erst planen.
5. Kleinkram: `docs/kritik-und-plan.md` an überholten Stellen nachziehen (Hinweis in `docs/roadmap.md`).
6. Offen zur Entscheidung: Fremde können leere Klassen auf dem Server anlegen (bis 40 je Schlüssel). Datenmüll
   möglich; Abhilfe bräuchte eine Migration.

## Wichtig zu wissen
- Prüfungen: Werkstatt https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG, Sammlung `pruefung` (Skill `figur`);
  die Notizen bei Einhorn und Drache sind alt und schon umgesetzt.
- Wünsche für eigene Teile: `lq_teil where wunsch is not null` (Supabase „baukasten“).
- Boss-Sieg zählt je Region (`lq_boss_sieg`): der Grammatik-Turm ist eine Region, auch wenn Pakete dazukommen.
- Lokale Datenbank: Postgres 16 (`/usr/lib/postgresql/16/bin`, Nutzer `postgres`); vor den Migrationen Ersatz für
  `auth` (`uid()`, `role()`), `extensions` (pgcrypto), `cron.schedule`/`cron.unschedule`, Rollen `anon`,
  `authenticated`, `service_role` anlegen.
- Supabase-Migrationen brauchen eine Bestätigung der Lehrkraft in ihrer App (sonst Abbruch nach ~4 Minuten).
- App im Browser prüfen: `npm run spieltest`, Daten aus `scripts/spieltest-daten.js`, Helfer `scripts/spieltest-helfer.js`.
