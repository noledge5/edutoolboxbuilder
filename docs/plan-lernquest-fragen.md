# Plan: Lernquest-Überarbeitung „lösbare Fragen“ (entschieden 19.11.2026)

Anlass: Fragen wurden 1:1 aus Arbeitsblättern übernommen und waren ohne das Bild des Blatts nicht lösbar (Beispiel
Englisch, Präpositionen: Ball vor/in/neben der Box). Eltern finden die Zeit am Nachmittag zu lang; die 45 Minuten
(`ZEIT_LIMIT_STANDARD`) sollen effektiv genutzt werden.

## Schon umgesetzt (19.11.2026)
- Kinder-App im Umbau (`UMBAU = true` in `app/LernquestApp.tsx`). Offene Übungs-Links (`#probe=`) gehen weiter.
- `buildPaket` gibt keine Aufgaben 1:1 vom Blatt mehr ins Paket, nur freigegebene Pool-Fragen. Der Fragenpool-Auftrag
  nennt die Blatt-Aufgaben nicht mehr als „vorhanden“.
- Auf dem Server ist nichts gelöscht (Pakete, Pool, Fortschritt der Kinder bleiben). Alte Pakete werden erst durch
  neues Veröffentlichen ersetzt; vor dem Wieder-Anschalten alle Stationen der laufenden Klassen neu veröffentlichen.

## Reihenfolge (je eine Sitzung, eigener Branch, erst planen mit Skill `aufgabe`)
1. ✅ (20.11.2026) **Claude schreibt die Fragen aus dem Blatt.** Claude bekommt die JSON-Struktur der Schülerseiten (Blöcke, Lösungen,
   Hinweis auf Bilder mit Bildbeschreibung), nicht nur Text. Regeln im Auftrag: jede Frage ohne das Blatt lösbar, am
   Curriculum ausgerichtet, verschiedene Formate; Bilder nur, wenn sie mitgeliefert werden (Emoji oder eigene Bilder).
   Testfall: Präpositionen mit Ball und Box (`fragenpool.test.ts`).
   App wieder an: Die Lehrkraft schaltet jede Klasse selbst live (Schalter „Kinder-App“ auf der Lehrerseite,
   20.11.2026), sobald deren Stationen neue, geprüfte Fragen haben und neu veröffentlicht sind.
2. **Vokabeln getrennt von anderen Inhalten**; Geografie und andere Fächer nach Kompetenzen statt nach Blatt.
3. ✅ (20.11.2026, vorgezogen) **Wiederholung mit Maß:** höchstens 16 Wiederholungen am Tag (zwei Runden), das
   Wichtigste zuerst; 45 Minuten bleiben das Tageslimit. Anlass: 58 fällige Aufgaben beim Testen der Lehrkraft.
4. **Fuchs und Animationen:** Fuchs kommentiert und hilft während der Aufgaben, kleine Fuchs-Challenges je Landkarte
   (wie Duolingo); nächste Aufgabe gleitet schnell herein, Zuordnungen mit fliegenden Wörtern.
5. **Lehrerseite neu gestalten**, übersichtlicher (Lernquest-Bereich der Lehrkraft).

Zurückgestellt: Klassendorf Teil B, siehe `docs/plan-klassendorf-haeuser.md`.
