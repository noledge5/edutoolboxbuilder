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

### B2 – Häuser gestalten ✅ (gebaut 25.11.2026, zusammen mit dem Dorf im Hochformat)
Entschieden am 25.11.: Richtung A (Schlängelweg im Hochformat, Stilproben als Claude-Artifact), Dorfstufen nach fertigen
Gemeinschaftsgebäuden (Weiler 0, Dorf 2, Marktflecken 4, Stadt 6), Abend und Winter nach der Uhr, Gestalten gleich mit
(Server-Änderung `20261204_lernquest_haus_aussehen.sql`). Gestalten ist kostenlos (Empfehlung, Antwort offen): Farben von
Dach, Wänden, Tür, Fahne; Zaun, Garten, Schmuck; mehr Auswahl mit höherer Hausstufe (`AUSSEHEN` in `dorf.ts`, gleiche Listen
in `lq_aussehen_ok`, ein Test vergleicht sie). Neues seit dem letzten Besuch ploppt auf (auf dem Gerät gemerkt).
Offen: Anbauten (Turm, Balkon, Anbau) mit Seltenheit aus Truhen oder Laden; ob Gestalten doch Münzen kosten soll.

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
- ~~**Häuser gestalten**~~: gebaut am 25.11.2026 (siehe B2).

## Erfolgskriterien (für jede Scheibe)
Typecheck, Tests und Build grün; SQL-Regeln mit lokalem Postgres oder PGlite geprüft; Bild der Karte und Handybreite;
ehrlich sagen, was nicht in der laufenden App mit Server getestet wurde. Migrationen bestätigt die Lehrkraft in ihrer
Supabase-App.

## Danach (weiter wie in HANDOFF.md)
Teil C: Held, Fuchs, Bosse, Lernkarte und ~70 Gegenstände im neuen Stil neu zeichnen.
