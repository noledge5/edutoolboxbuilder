# Roadmap als Index, docs/ als Obsidian-Vault

← [Index](../roadmap.md)

**Datum:** 02.11.2026

**Entscheidung:** Die Roadmap ist ein kurzer Index (`docs/roadmap.md`) mit einer Zeile pro Thema; die Entscheidungen und der Phasenplan stehen als einzelne Notizen in `docs/entscheidungen/`, wörtlich aus der alten Roadmap übernommen. `docs/` ist ein Obsidian-Vault (Einstellungen in `docs/.obsidian/app.json`: Markdown-Links, relativ, Anhänge in `docs/anhaenge/`). Links sind normale relative Markdown-Links, keine `[[Wikilinks]]`. Wer eine Entscheidung ändert oder neu festhält, pflegt die Notiz und die Index-Zeile im selben Commit.

**Grund:** Kontext sparen (die alte Roadmap hatte rund 31.000 Zeichen und wurde vor jeder Aufgabe ganz gelesen), Agenten finden schneller die passende Stelle, und die Nutzerin kann die Notizen in Obsidian lesen und pflegen.

**Dazu entschieden (Fragen mit Empfehlung):**
- Ein Push, der nur `docs/` ändert, veröffentlicht die App nicht (`paths-ignore: ['docs/**']` in `.github/workflows/deploy.yml`). Die CI (`ci.yml`) läuft weiter bei jedem Push, weil ein Test prüft, dass `docs/claude/anleitung-fuer-claude.md` zum Code passt.
- Die Nutzerin schreibt Notizen direkt auf `main` (die Regel „nie direkt auf main“ gilt für die KI). Agenten holen deshalb vor Änderungen an Notizen den neuesten Stand von `main`.
- In Git liegt aus `docs/.obsidian/` nur `app.json`; alles andere (Arbeitsbereich, Cache, Plugins mit ihren Einstellungen, z. B. ein GitHub-Schlüssel des Git-Plugins) bleibt auf dem Gerät.
