# Handoff – 07.11.2026

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 5, mehr Beute und Frisuren sind
**live** (#27–#31). Server-Änderung `lernquest_frisur` ist eingespielt (07.11.2026), Testlauf gegen die Live-Seite
am 07.11.2026 grün.

## Stand
- **Live:** Stufen 1–5, mehr Beute, Frisuren/Haarfarben und die offenen Übungen (`#probe=englisch5`).
- **Stufe 5** (Entscheidungen und Stand in `docs/lernquest.md`, „Stufe 5“):
  - „Fragen erzeugen“ je Stunde (Lehrkraft-Seite → „Stunden freischalten“): etwa 15 Fragen von Claude (Chat oder
    eigener Schlüssel), jede einzeln freigeben, ändern, löschen. Pool an der Stunde (`Lesson.pool`).
  - „Punkte im Bild …“ im selben Dialog: Bild vom Arbeitsblatt, Punkte setzen und benennen.
  - Neue Formate: Sortieren, Bild wählen (aus Bild-Vokabeln), Punkt auf Karte/Bild, Hören; Vorlesen mit der Stimme
    des Geräts in Englisch-Paketen. Keine Serveränderung.
- Geprüft: Typprüfung, alle Tests, Build, CI. Testlauf gegen den echten Server (`npm run lq:testlauf`, jetzt mit
  zweiter Station aus den neuen Formaten und Bildern im Paket) grün, Testklasse gelöscht. Dialog und Punkte-Editor im
  Browser am iPad- und Handy-Format (Hilfsseiten, nicht im Repo).
- **Nicht geprüft:** echter Aufruf an Claude mit Schlüssel (kein Schlüssel in der Sitzung, der Chat-Weg ist geprüft);
  Vorlesen mit echter Stimme (am iPad anhören); Bild-Vokabeln mit eigenen Fotos im echten Baukasten.

## Neu: Bilder für Held und Teile (Branch `claude/eager-lamport-r82nq1`)
- Vorbereitet für Krea 2 in ComfyUI: Stil „weich gemalt“, Prompts für alle 40 Teile und die Grundfigur, Schablonen,
  `npm run lq:bilder` (freistellen, einpassen, 6 Hauttöne), App nimmt `src/lernquest/app/teile/<id>.webp`, sonst Vektor.
  Anleitung: `docs/design/lernquest/bilder.md`.
- Geprüft mit Testbildern (Skript, Tests, Build). Nicht geprüft: echte Krea-Bilder, Einstellungen in ComfyUI.
- Edit-Weg (07.11.2026): Teile mit FLUX.2 Klein Image Edit auf `koerper.png` malen, nach `lernquest-roh/edit/`;
  das Skript behält nur die Änderung (Vergleich mit der Grundfigur, gleicht kleine Verschiebungen aus). Prompts in
  `docs/design/lernquest/bilder/edit-prompts.md`, Regeln in `bilder.md` („Mit einem Edit-Modell“). Geprüft nur mit
  nachgestellten Edits, noch nicht mit echten Klein-Bildern.
- Nächster Schritt: Lehrkraft malt Grundfigur und erste Teile; Rohbilder in eine Sitzung laden, Skript laufen lassen,
  Übersicht ansehen, `anpassen.json` nachjustieren.

## Neu: Mehr Beute (gleicher Branch, `docs/lernquest.md` „Mehr Beute“)
- 16 neue Teile (56), Truhen in 40 % nur Münzen, Laden doppelt so teuer, Frisur wählbar (3 Grundfiguren).
- **Server-Änderung** `supabase/migrations/20261109_lernquest_beute.sql` ist am 06.11.2026 auf dem echten Server
  eingespielt (mit OK der Lehrkraft). Server-Tests (`LQ_LIVE=1`) und `npm run lq:testlauf` grün.
- Gemergt (#28) und live; Testlauf gegen die Live-Seite grün.

## Neu: Frisuren und Haarfarben (07.11.2026, Branch `claude/eager-lamport-r82nq1`)
- Grundfigur kahl, Frisur als eigene Ebene (8 Frisuren + keine), 5 Haarfarben, Hauttöne per Edit (`koerper_h1` …).
  Entscheidungen in `docs/lernquest.md` („Frisuren und Haarfarben“), Ablauf in `docs/design/lernquest/bilder.md`.
- Server: `supabase/migrations/20261110_lernquest_frisur.sql` (Frisur, Haarfarbe, `lq_bonus` nur noch für die sechs
  Plätze), auf dem echten Server eingespielt, gemergt (#31).
- Geprüft mit den echten Figuren der Lehrkraft (kurz/Zopf/Locken): Freistellen, Haarfarben aus einer Haar-Ebene.
  Noch nicht: eine echte Glatzkopf-Grundfigur und echte Hautton-Edits.

## Neu: Offene Punkte aus Stufe 4 (07.11.2026, Branch `claude/weiter-laut-handoff-qqiycp`)
- „Klassenpunkte geben“ als Dialog (+1 … +5), Live-Test „Gutscheine gleichzeitig“ (12 Kinder) grün,
  „+Schaden“ im Bosskampf (Werkzeuge + Ritterhelm, höchstens +3). Stand in `docs/lernquest.md`.
- Server: `supabase/migrations/20261111_lernquest_schaden.sql`, lokal geprüft (Postgres 16); auf dem echten Server
  erst nach OK der Lehrkraft und **vor** dem Merge (sonst zeigt die App „+3 Schaden“, der Server rechnet ohne).

## Nächste Schritte
1. OK der Lehrkraft → Migration einspielen → PR → Merge → Testlauf gegen die Live-Seite.
2. Ton am iPad: Vorlesen (Web Speech) und Klick-Töne (Web Audio) blieben stumm. Vorschlag im Chat vom 07.11.2026:
   erst `navigator.audioSession.type = 'playback'` und Vorlesen ohne `cancel()` davor, Knopf „Ton testen“; hilft das
   nicht, Ton-Dateien beim Senden des Pakets erzeugen und mit `<audio>` abspielen.
3. Bilder: Lehrkraft malt Glatzkopf-Grundfigur, Hautton-Edits und erste Teile; dann `npm run lq:bilder`.

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch nutzen, PR und Merge nur auf Wunsch.
- Neue Übungsart: Liste in `AGENTS.md` (Lernquest) abarbeiten.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
