# Phase 9 – KI im Baukasten

← [Index](../roadmap.md)

## Phasen

### Phase 9 – KI im Baukasten (Runde 6) ✅
- Wunsch der Lehrkraft (01.10.2026): der ganze Weg mit Claude. Claude macht den Stoffverteilungsplan fürs Schuljahr, die Stunden sind dann als geplante Stunden angelegt. Danach wird jede Stunde in der Arbeitsblatt-Ansicht mit Claude ausgearbeitet, und zwar eingebettet in ihre Lage im Jahresplan: Fach, Klasse, Modul, Woche und Termin, die Stunden davor (Titel, Merksätze, Abruffragen) und danach, die Kompetenzen des Moduls und die Planungsnotiz der Stunde.
- Zwei Wege: ohne Schlüssel kopiert der Baukasten den fertigen Auftrag samt Kontext für den Claude-Chat und nimmt die Antwort für genau diese Stunde zurück; mit Schlüssel (Claude direkt oder OpenRouter) geschieht das im Baukasten.
Entschieden mit Fragen und Vor- und Nachteilen:
- Ausarbeiten einer geplanten Stunde im Arbeitsblatt: „ganze Stunde“ in einem Schritt, oder „erst Gerüst“ (Lehrkraft-Seite mit Ziel, Einstieg, Verlauf, Aufgabenideen), das die Lehrkraft ändert, dann die Blätter dazu; ohne Schlüssel als Auftrag für den Chat mit Rückweg. Folien macht danach der Folienvorschlag.
- Kontext für Claude: Modul (Thema, Kompetenzraster), Schulwoche und Datum mit Ferien, die Stunden davor (Ziel, Einstiegsart, Merksatz, Abruffragen, Aufgabenarten) und danach (Planungsnotizen).
- Modelle: Claude Opus 5.5 für Stunden und Jahrespläne, Claude Sonnet 5.5 für die Helfer, je Aufgabe wählbar. Ergebnisse erst als Vorschau, dann übernehmen (die vorige Fassung wird gesichert).
- Jahresplan: Assistent in der Jahresplan-Ansicht (Fach, Klasse, Stunden pro Woche, Lehrwerk, Schwerpunkte → Module mit Wochen und geplanten Stunden, Vorschau, übernehmen) und Auftrag für den Chat.
- Helfer am Baustein: umformulieren (einfacher, fachlicher, kürzer, Englisch/Deutsch), G-/M-/E-Fassung, Lösung und Tipps ergänzen.
- Kosten: je Anfrage und je Monat angezeigt, Monatslimit, ab dem der Baukasten vorher fragt. Der Schlüssel bleibt nur auf dem Gerät.
- Umgesetzt (01.10.2026): Claude direkt (Anthropic SDK im Browser, lange Anleitung als zwischengespeicherter Systemprompt, adaptives Denken, Ausweichmodell bei Ablehnungen) und OpenRouter; „Stunde mit Claude“ mit ganzer Stunde, Gerüst, Blättern zum Gerüst und Überarbeiten; Jahresplan-Assistent; Helfer im Panel; alles auch über den Chat.
