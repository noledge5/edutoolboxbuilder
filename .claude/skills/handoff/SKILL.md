---
name: handoff
description: Session sauber abschließen – Tests laufen lassen, Arbeit auf dem eigenen Branch committen und pushen, kurze HANDOFF.md direkt in main ablegen, damit eine frische Session nahtlos weitermachen kann. Nutzen bei /handoff oder wenn der Nutzer sagt "ich bin fertig für heute", "Feierabend", "Schluss für heute", "I'm done for today", "wrap up". Gilt auch, wenn ohne den Skill eine HANDOFF.md geschrieben wird.
---

# Handoff

Ziel: Die nächste Session soll mit "weiter laut HANDOFF.md" ohne Rückfragen weiterarbeiten können. Halte dich kurz.

## Regel: HANDOFF.md liegt immer in `main`
Jede Session und jeder Agent legt die HANDOFF.md direkt auf `main` ab (Wunsch der Lehrkraft, 18.11.2026), nie nur auf
einem Arbeits-Branch. Das ist die einzige Ausnahme von „nie direkt auf den Standard-Branch“: Der Commit auf `main`
enthält **nur** HANDOFF.md. Code, Doku und alles andere bleiben auf dem eigenen Branch (PR nur auf Wunsch).
Eine neue Session liest HANDOFF.md immer aus `main` (`git fetch origin main && git show origin/main:HANDOFF.md`).

## Ablauf

1. **Tests/Checks** – den Testbefehl des Projekts ausführen (aus package.json o. ä., nicht raten). Schlägt etwas fehl:
   nicht reparieren, nur festhalten.
2. **Arbeit sichern** – Änderungen (ohne HANDOFF.md) auf dem eigenen Branch committen und pushen (Präfix `wip:`, wenn
   unfertig oder Tests rot).
3. **Dev-Server/Hintergrundprozesse** beenden, die in dieser Session gestartet wurden.
4. **HANDOFF.md schreiben** (überschreiben, nicht anhängen), höchstens ~40 Zeilen. Unter „Stand“ angeben, auf welchem
   Branch die Arbeit liegt und ob sie gemergt ist.
5. **HANDOFF.md nach `main`:**
   ```bash
   git fetch origin main
   git worktree add /tmp/handoff-main origin/main --detach   # Scratchpad-Pfad nehmen, falls vorhanden
   cp HANDOFF.md /tmp/handoff-main/HANDOFF.md
   cd /tmp/handoff-main && git add HANDOFF.md && git commit -m "Handoff: <Datum>, <Kurzfassung>"
   git push origin HEAD:main            # bei Ablehnung: erneut fetchen, neu aufsetzen, nochmal
   cd - && git worktree remove /tmp/handoff-main
   ```
   Hat jemand anderes heute schon eine HANDOFF.md in `main` abgelegt, deren Punkte nicht erledigt sind: beide Stände
   zusammenführen, nichts davon verwerfen.
6. Zum Schluss dem Nutzer genau das sagen (eine Zeile, dann nichts mehr):

> Fertig. Jetzt `/clear` und in der neuen Session: **weiter laut HANDOFF.md**

## Vorlage

```markdown
# Handoff – <Datum> (<Kurzfassung>)

## Ziel
<1–2 Sätze>

## Stand
- Erledigt: …  (Branch: …, gemergt ja/nein)
- Tests: <grün / rot (welche) / keine>

## Nächste Schritte (je einer pro Session)
1. …

## Wichtig zu wissen
- <Entscheidungen, Fallstricke, Dateien mit Pfad – nur was nicht aus dem Code ersichtlich ist>
```
