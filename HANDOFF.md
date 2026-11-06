# Handoff – 06.11.2026

## Ziel
Runde 10: **Lernquest**, Lern-Web-App für die Schüler, verbunden mit den Modulen. Plan, Entscheidungen und Stand:
`docs/lernquest.md`.

## Stand
- Stufe 1 (Lernen) ist auf dem Branch `lernquest` gebaut, noch nicht auf `main` (= nicht veröffentlicht).
- Server-Tabellen und -Funktionen sind im Supabase-Projekt „baukasten“ eingespielt (`supabase/migrations/20261106_lernquest.sql`).
- Geprüft: Typprüfung, Tests (inkl. Lernpaket, Regeln, Wiederholen), Build, Rechte-Test gegen den Server
  (`LQ_LIVE=1 npx vitest run src/lernquest/server.live.test.ts`), Browser-Durchlauf Handy 390 px + iPad.

## Nächste Schritte
1. Lehrkraft schaut Stufe 1 in der Vorschau an; nach Freigabe PR `lernquest` → `main`.
2. Danach Stufe 2 (Held und Beute). Server-Änderungen dafür vorher ankündigen.

## Wichtig zu wissen
- Klarnamen auf dem Server: vor dem ersten echten Einsatz Freigabe der Schule nötig.
- Belohnungsregeln stehen doppelt (TS und SQL), beide zusammen ändern.
- Auf Halde: Editor-Bedienung (Anordnen, iPad hochkant), interaktive Modelle (Runde 7).
