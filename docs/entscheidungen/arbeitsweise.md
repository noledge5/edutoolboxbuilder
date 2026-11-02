# Arbeitsweise

← [Index](../roadmap.md)

## Entscheidungen (September 2026)

| Thema | Entscheidung |
|---|---|
| Arbeitsweise | 21.10.2026: schlank statt Regelwerk (vorher noledge5/based, dann noledge5/hierarchie). Die CLAUDE.md enthält nur Zweck, harte Regeln und Fallstricke; keine kopierten Arbeitsweise-Skills und Worker mehr. Grund: neuere Modelle arbeiten mit weniger Vorgaben besser, prüfbare Regeln gehören in Tests und CI. Bleibt: Skill `aufgabe`, eigene Hooks (Typprüfung, Tests vor dem Ende), `main` nur auf Wunsch, Entscheidungen hier im Log. 02.11.2026: Regeln stehen in `AGENTS.md` (gemeinsame Regeldatei, die auch Codex und andere Werkzeuge lesen); `CLAUDE.md` holt sie nur mit `@AGENTS.md` herein. Grund: die Nutzerin will auch andere Programmier-Werkzeuge einsetzen. Die gemeinsame „Arbeitsweise“ steht gleich in allen drei Repos (edutoolboxbuilder, baukasten-aufgaben, generalwork). |
