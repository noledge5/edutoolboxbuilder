# Handoff – 06.11.2026 (Nacht)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 5 „KI-Fragenpool und mehr Formate“ ist fertig und
**veröffentlicht** (PR #27, auf Wunsch der Lehrkraft gemergt). Nächstes Thema wählt die Lehrkraft.

## Stand
- Erledigt: Stufen 1–5 live. Stufe 5: „Fragen erzeugen“ je Stunde (etwa 15, einzeln freigeben/ändern/löschen),
  „Punkte im Bild …“, Sortieren, Bild wählen, Hören, Vorlesen mit der Stimme des Geräts. Keine Serveränderung.
- Tests: grün (Typprüfung, 319 Tests, Build, CI). `lq:testlauf` lokal und gegen die Live-Seite grün
  (inkl. zweiter Station mit den neuen Formaten), Testklassen gelöscht.
- Letzter Commit auf `main`: 4beed12 Lernquest Stufe 5: KI-Fragenpool und mehr Formate (#27)
- Nicht geprüft: echter Aufruf mit KI-Schlüssel (Chat-Weg geprüft), Vorlesen mit echter Stimme (Lehrkraft am iPad).

## Nächste Schritte
1. Lehrkraft fragen, welches Thema als Nächstes kommt. Kandidaten (offen aus Stufe 4):
   Gutscheine mit vielen Kindern gleichzeitig prüfen; „Punkte geben“ fragt mit `window.prompt` (am iPad unschön,
   durch eigenes Feld ersetzen); „+Schaden“ als Ausrüstungs-Bonus (Katalog-Änderung, Regeln TS + SQL).
2. Rückmeldung der Lehrkraft zu Stufe 5 (Fragen erzeugen, Punkte im Bild, Vorlesen am iPad) einarbeiten.

## Wichtig zu wissen
- `main` = veröffentlichen. Neue Arbeit auf eigenem Branch von `main`; PR und Merge nur auf Wunsch.
- Neue Übungsart: Liste in `AGENTS.md` (Lernquest) abarbeiten; `lq:testlauf` spielt jede Art einmal.
- Pool an der Stunde (`Lesson.pool`), Logik `src/lernquest/fragenpool.ts`, Dialog `teacher/Fragenpool.tsx`,
  Senden mit Bildern und Größenprüfung `teacher/senden.ts`.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
