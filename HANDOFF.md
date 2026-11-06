# Handoff – 06.11.2026 (Abend)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 3 „Bosskampf“ ist auf dem Branch
`claude/lernquest-stufe3` gebaut; der Server-Teil ist schon im Projekt „baukasten“ eingespielt (freigegeben),
die App wartet auf PR und Merge (Merge = veröffentlichen, nur auf Wunsch der Lehrkraft).

## Stand
- **Live seit 06.11.2026:** Stufe 1 und Stufe 2 „Held und Beute“ (PR #23 gemergt, GitHub Pages veröffentlicht,
  Testlauf gegen die Live-Seite grün). https://noledge5.github.io/edutoolboxbuilder/lernquest/, Lehrkraft-Bereich im
  Baukasten unter Übersicht → „Lernquest“.
- **Stufe 3 Bosskampf** (Einzelheiten in `docs/lernquest.md`, „Stufe 3“):
  - Server: `supabase/migrations/20261107_lernquest_boss.sql`, eingespielt als `lernquest_stufe3_boss`. Vorher lokal in
    einer Wegwerf-Postgres-Datenbank mit 44 Prüfungen durchgespielt (Rechte, Zeit, Schaden, Herzen, Sieg, Truhe einmal
    je Region, Ablauf nach 3 h). Supabase-Sicherheitsprüfung: nur die gewollt öffentlichen Funktionen.
  - Browser: Regeln und Fragen in `rules.ts` und `boss.ts` (Tests in `boss.test.ts`), Aufrufe in `server.ts`,
    Beamer und Handy in `app/Boss.tsx`, Start im Baukasten in `teacher/LernquestView.tsx` („Bosskampf am Beamer“).
  - Hinweis „Nochmal“ nach 10 s Laden ist jetzt da (erstes Laden, Beamer, Handy im Kampf).
- Tests: Typprüfung, 293 Tests und Build grün. Live-Test (`LQ_LIVE=1`) mit neuem Bosskampf-Test grün. Testlauf
  (`npm run lq:testlauf`) lokal gegen den echten Server zweimal hintereinander grün: spielt jetzt auch einen Bosskampf
  mit Beamer (1440 × 810) und Handy bis zum Sieg und prüft die Truhe.

## Nächste Schritte
1. Lehrkraft schaut den Bosskampf an (Bilder vom Testlauf), dann PR nach `main` nur auf Wunsch; nach dem Merge
   `LQ_URL=https://noledge5.github.io/edutoolboxbuilder/lernquest/ npm run lq:testlauf` gegen die Live-Seite.
2. Nicht geprüft: die neue Karte „Bosskampf am Beamer“ auf der Lehrkraft-Seite im Browser (nur Typprüfung und Build);
   ein echter Kampf mit vielen Geräten gleichzeitig.
3. Offen: „+Schaden“ als Ausrüstungs-Bonus (Katalog-Änderung, eigener Schritt). Danach Stufe 4 (echte Belohnungen
   und Auswertung).

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch der Sitzung nutzen, PR und Merge nur auf Wunsch.
- Bosskampf-Regeln doppelt (TS + SQL): 20 s je Frage (+1,5 s Nachfrist), Schaden 10 + bis 10 fürs Tempo, ab 3 in
  Folge doppelt, 13 Lebenspunkte je Kind und Frage, 5 Herzen.
- Der Beamer liest die Lehrkraft-Schlüssel aus dem Speicher des Geräts: Er muss im selben Browser laufen wie der
  Baukasten.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
