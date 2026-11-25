# Plan: Klassendorf Stufe 2, Teil B – eigene Häuser

Stand 25.11.2026. Am 19.11. zurückgestellt; am 25.11. hat die Lehrkraft die Häuser vorgezogen („zuerst wichtig“).
Teil A (Stil, Dorfkarte) ist live, **B1 ist gebaut** (Branch `claude/compassionate-davinci-8in8er`, noch nicht gemergt,
Migration noch nicht eingespielt). Hintergrund: `docs/idee-klassendorf.md`.

## Scheiben (je eine Sitzung, je ein Branch; erst planen mit Skill `aufgabe`)

### B1 – Eigenes Haus ✅ (gebaut 25.11.2026)
Entschieden am 25.11.: eigener Schalter „Eigene Häuser freigeschaltet“ je Klasse (Standard aus, braucht das Dorf);
Zelt-Quiz mit festen Fragen in der App (`src/lernquest/zelt.ts`, 12 Fragen, 5 zufällige, ab 4 richtig, Wiederholen
ohne Strafe; die Lehrkraft prüft die Fragen im Pull Request); Preise und Heldenstufen wie unten; Kinder sehen alle
Häuser, Namen nur die Lehrkraft, am eigenen steht „Du“. Umgesetzt: `dorf.ts` (`HAUS_STUFEN`, `hausAusbau`),
`figuren/haeuser.tsx`, `app/MeinHaus.tsx`, `teacher/KlassenDorf.tsx`, Migration `20261203_lernquest_haeuser.sql`.
Das Quiz prüft nur der Browser (das Zelt kostet nichts). Grundstücke folgen der Reihenfolge, in der die Kinder in die
Klasse kamen; wird ein Kind gelöscht, rücken die Häuser dahinter einen Platz auf.

Ursprünglicher Plan:
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

## Weitere Wünsche der Lehrkraft (25.11.2026, noch nicht geplant)
Je eine eigene Session, Reihenfolge entscheidet die Lehrkraft. Vor dem Bauen mit Skill `aufgabe` planen und die
offenen Fragen klären.
- **Mathe-Aufgaben** kommen bald: prüfen, ob die Aufgabenformate (`fragenpool.ts`, `Uebungen.tsx`) Rechnen tragen
  (Zahleneingabe, Brüche, Einheiten, Rechenweg?).
- **Neue Gegenstände** für alle Seltenheiten, auch Legendär (ist seit 13.11. leer, `docs/roadmap.md`).
- **Einschmelzen** (langfristig): mehrere Gegenstände einer Seltenheit ergeben einen der nächst selteneren.
  Legendär ist ausgenommen. Offen: wie viele, Zufall oder Wahl, Gegenstände aus Truhen und Laden gleich, was mit
  getragenen Teilen, Startteilen und eigenen Teilen der Lehrkraft. Server-Regel (wie `lq_truhe_oeffnen`).
- **Auszeichnungen und Abzeichen** (Badges): z. B. für Lernserien, geschaffte Regionen, Hausstufen. Keine Rangliste.
- **Besuchen**: Haus und Profil der anderen ansehen (erweitert B3: Held, Trophäenregal, Abzeichen). Dafür müssen
  Kinder Namen sehen; das ist eine neue Entscheidung zur Sichtbarkeit.
- **Häuser gestalten**, damit nicht alle gleich aussehen (B2 Anbauten, dazu z. B. Farben von Dach und Wand, Zaun,
  Garten). Gleicher Bausatz `figuren/iso.tsx`, gleiche Materialien.

## Erfolgskriterien (für jede Scheibe)
Typecheck, Tests und Build grün; SQL-Regeln mit lokalem Postgres oder PGlite geprüft; Bild der Karte und Handybreite;
ehrlich sagen, was nicht in der laufenden App mit Server getestet wurde. Migrationen bestätigt die Lehrkraft in ihrer
Supabase-App.

## Danach (weiter wie in HANDOFF.md)
Teil C: Held, Fuchs, Bosse, Lernkarte und ~70 Gegenstände im neuen Stil neu zeichnen.
