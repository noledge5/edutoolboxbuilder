# Handoff – 06.11.2026 (Nacht)

## Ziel
Lernquest (Lern-App für die Schüler, `docs/lernquest.md`). Stufe 5 „KI-Fragenpool und mehr Formate“ ist **fertig
gebaut** auf Branch `claude/stufe-5-handoff-b9odwp`, noch nicht auf `main` (Merge = veröffentlichen).

## Stand
- **Live:** Stufen 1–4 und die offenen Übungen (`#probe=englisch5`).
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
- Nächster Schritt: Lehrkraft malt Grundfigur und erste Teile; Rohbilder in eine Sitzung laden, Skript laufen lassen,
  Übersicht ansehen, `anpassen.json` nachjustieren.

## Neu: Mehr Beute (gleicher Branch, `docs/lernquest.md` „Mehr Beute“)
- 16 neue Teile (56), Truhen in 40 % nur Münzen, Laden doppelt so teuer, Frisur wählbar (3 Grundfiguren).
- **Server-Änderung** `supabase/migrations/20261109_lernquest_beute.sql` ist am 06.11.2026 auf dem echten Server
  eingespielt (mit OK der Lehrkraft). Server-Tests (`LQ_LIVE=1`) und `npm run lq:testlauf` grün.
- **Bis zum Merge** passt die Live-App nicht zum Server: Sie zeigt die alten Preise, und bei einer Münz-Truhe fehlt
  die Anzeige („Gleich anlegen“ geht dann schief). Darum bald mergen; danach
  `LQ_URL=https://noledge5.github.io/edutoolboxbuilder/lernquest/ npm run lq:testlauf`.

## Nächste Schritte
1. Lehrkraft schaut Stufe 5 an; bei „passt“ PR nach `main` (= veröffentlichen), danach
   `LQ_URL=https://noledge5.github.io/edutoolboxbuilder/lernquest/ npm run lq:testlauf`.
2. Offen aus Stufe 4: Gutscheine mit vielen Kindern gleichzeitig; „Punkte geben“ fragt mit `window.prompt`;
   „+Schaden“ als Ausrüstungs-Bonus.

## Wichtig zu wissen
- `main` = veröffentlichen. Arbeits-Branch nutzen, PR und Merge nur auf Wunsch.
- Neue Übungsart: Liste in `AGENTS.md` (Lernquest) abarbeiten.
- Die `lq_*`-Tabellen nie direkt lesen (echte Kindernamen); nur über die Server-Funktionen mit Wegwerf-Schlüssel.
