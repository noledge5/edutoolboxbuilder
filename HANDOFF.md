# Handoff – 07.11.2026 (Abend)

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
- Server: `supabase/migrations/20261111_lernquest_schaden.sql` am 07.11.2026 mit OK der Lehrkraft eingespielt;
  Server-Tests (`LQ_LIVE=1`) und `npm run lq:testlauf` danach grün.

## Nächste Schritte
1. **Erledigt:** offene Punkte aus Stufe 4 sind live (#32), Migration `lernquest_schaden` eingespielt, Testlauf gegen
   die Live-Seite grün (07.11.2026).
2. **Bilder: Mund als eigene Ebene (Wunsch der Lehrkraft, 07.11.2026, noch nicht gebaut).** Die Lehrkraft will
   verschiedene Münder; die bisherige `koerper.png` hat Lächeln und Bäckchen. Plan:
   - Grundfigur `koerper.png` neu: **Gesicht leer (ohne Augen, Mund, Bäckchen)**; Bäckchen kommen mit in die
     Mund-Ebene. Eine solche Figur hat die Lehrkraft am 07.11.2026 gezeigt (nur im Chat, noch nicht in Drive).
   - Entschieden (07.11.2026): Kopf, Werkzeug, Begleiter einzeln mit Text zu Bild (`EINZELN`, `prompts.md`), der Rest
     als Edit von `koerper.png`. Prompts und `bilder.md` sind angepasst (`STIL` verbietet Umrisse jetzt deutlich).
   - Claude baut „Mund“ wie die Frisur: frei wählbar auf der Held-Seite, eigene Ebene (über Grundfigur und Augen,
     unter Kopf-Teil), Edits `edit/mund-<id>.png`, Suchbereich um den Mund in `EDIT_BEREICH`, Liste wie `FRISUREN`.
     Server: `lq_avatar_setzen` muss den Schlüssel `mund` annehmen (Migration, erst nach OK der Lehrkraft, vor dem
     Merge).
   - Der kleine Suchbereich für Kopf-Edits (endet an der Stirn) ist kein Problem mehr, weil Kopf-Teile einzeln
     entstehen.
   - Rohbilder kommen über Google Drive: Ordner `lernquest-roh` (Grundfigur, Hauttöne) mit Unterordner `edit`
     (Teile, Frisuren, Münder), Original-PNGs aus ComfyUI. Claude holt sie mit dem Drive-Werkzeug und lässt
     `npm run lq:bilder` laufen. Erste Edits (Piratenhut, Entdeckerhut, Ritterhelm, Stirnband, Wollmütze) gab es nur
     als WebP im Chat; sie müssen auf der neuen Grundfigur neu gemacht werden.
3. **Ton am iPad:** Vorlesen (Web Speech) und Klick-Töne (Web Audio) blieben stumm. Vorschlag: erst
   `navigator.audioSession.type = 'playback'`, Vorlesen ohne `cancel()` davor, Knopf „Ton testen“; hilft das nicht,
   Ton-Dateien beim Senden des Pakets erzeugen und mit `<audio>` abspielen.

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch nutzen, PR und Merge nur auf Wunsch.
- Neue Übungsart: Liste in `AGENTS.md` (Lernquest) abarbeiten.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
