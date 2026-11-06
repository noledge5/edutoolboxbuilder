# Handoff – 06.11.2026

## Ziel
Runde 10: **Lernquest**, eine Lern-Web-App für die Schüler (Duolingo/Anton mit RPG-Gefühl), verbunden mit den
Modulen. Plan und alle Entscheidungen: `docs/lernquest.md`.

## Stand
- Blatt-Design B1 (PR #19) ist gemerged und veröffentlicht.
- Plan für Lernquest steht, auf dem langen Branch `lernquest` (neben `main`); noch kein Code.
- Supabase-Tabellen und -Funktionen für Stufe 1 sind von der Lehrkraft freigegeben.
- Tests: grün (257), Typprüfung grün.

## Nächste Schritte
1. Neue Sitzung: „Lernquest Stufe 1 laut docs/lernquest.md auf Branch lernquest“. Mit dem Skill `aufgabe` arbeiten,
   Erfolgskriterien stehen im Plan.
2. Danach Stufen 2–5 der Reihe nach, jede einzeln nach `main` (= veröffentlichen, nur nach Freigabe).

## Wichtig zu wissen
- Auf `lernquest` arbeiten, nicht auf `main`; PR nach `main` nur auf Wunsch.
- Server-Muster wie beim Austeilen: nur RPC-Funktionen (`src/share/server.ts`), keine direkten Tabellenzugriffe.
- Klarnamen auf dem Server: vor dem ersten echten Einsatz Freigabe der Schule nötig.
- Offen in Runde 9: Rückmeldung zur neuen KI-Anleitung und zum ersten Canva-Auftrag (läuft parallel).
- Auf Halde: Editor-Bedienung (Anordnen, iPad hochkant), interaktive Modelle (Runde 7).
