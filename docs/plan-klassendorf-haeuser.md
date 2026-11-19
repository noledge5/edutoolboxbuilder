# Plan (auf Halde): Klassendorf Stufe 2, Teil B – eigene Häuser

Stand 19.11.2026. Die Lehrkraft gefällt alles; es ist **zurückgestellt**, bis der Workflow für Vokabeln/Inhalte und die
Verbindung zwischen Aufgaben erstellen und Spiel überarbeitet ist. Vorher nichts davon bauen. Teil A (Stil, Dorfkarte)
ist live. Hintergrund: `docs/idee-klassendorf.md`.

## Scheiben (je eine Sitzung, je ein Branch; erst planen mit Skill `aufgabe`)

### B1 – Eigenes Haus
- Migration `lq_haus`: eine Zeile je Kind, Stufe 0–4 (Zelt, Hütte, Holzhaus, Fachwerk, Turm).
- Funktion `lq_haus_bauen`: hebt um 1 Stufe, zieht Münzen nur auf dem Server ab. Preise 0 / 300 / 800 / 1800 / 4000.
- Höhere Stufen brauchen eine Heldenstufe. Vorschlag (noch nicht bestätigt): Hütte ab 1, Holzhaus ab 3, Fachwerk ab 5,
  Turm ab 12 (wie `LADEN_AB` in `rules.ts`).
- Regeln stehen doppelt (SQL und `dorf.ts`), ein Test vergleicht beide.
- `DorfKarte`: eigenes Grundstück zeigt das Haus in seiner Stufe, Knopf „Ausbauen“ mit Preis; Lehrkraft sieht die
  Häuser mit Namensschildern. Fünf Hausstufen im Bausatz `figuren/iso.tsx`, in der Werkstatt prüfen.
- **Zelt aufstellen = kleine Aufgabe (Wunsch der Lehrkraft, 19.11.):** Das Zelt steht nicht einfach da. Das Kind
  stellt es auf, indem es ein kurzes Quiz löst: verantwortungsvoller Umgang mit Lernquest, Mediennutzung allgemein,
  wie das Spiel funktioniert und wie man die App benutzt. Offen dazu: Wer schreibt die Fragen (Lehrkraft einstellbar
  oder fest in der App)? Wie viele Fragen, ab wie vielen richtig? Darf man wiederholen (Vorschlag: ja, ohne Strafe)?
  Passt zu den vorhandenen Aufgaben und Karten (`fragenpool.ts`); beim Planen prüfen, ob der Fragenpool das trägt.

### B2 – Anbauten
- Teile: Turm, Anbau, Balkon, Garten, Laterne, Zaun u. a., mit Seltenheit.
- Herkunft: kaufen und aus Truhen (dafür `lq_truhe_oeffnen` ändern, zuletzt `20261128_lernquest_truhen_neu.sql`).

### B3 – Besuchen
- Haus antippen: hineinschauen, Held und Trophäenregal sehen.
- Sticker-Gruß ohne Freitext, höchstens ein paar je Kind und Tag. Kein Handel, keine Münzgeschenke.

## Erfolgskriterien (für jede Scheibe)
Typecheck, Tests und Build grün; SQL-Regeln mit lokalem Postgres oder PGlite geprüft; Bild der Karte und Handybreite;
ehrlich sagen, was nicht in der laufenden App mit Server getestet wurde. Migrationen bestätigt die Lehrkraft in ihrer
Supabase-App.

## Danach (weiter wie in HANDOFF.md)
Teil C: Held, Fuchs, Bosse, Lernkarte und ~70 Gegenstände im neuen Stil neu zeichnen.
