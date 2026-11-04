# Handoff – 04.11.2026

## Ziel
Runde 9 (siehe `docs/roadmap.md`): schlichte Schülerblätter, freiere KI-Anleitung mit Rückfragen vor jeder Stunde,
neue Präsentationen in Canva statt eigener Folien.

## Stand
- Erledigt: PR #17 (Schülerblatt schlicht, Anleitung freier, „Erst fragen, dann bauen“), gemerged.
  PR #18 („Präsi in Canva …“, Bild-Links über Supabase, „Mit KI bauen: Folien“ entfernt), gemerged.
- Server: Bucket `praesi-bilder` (privat) und Edge-Function `praesi-bild` (verify_jwt aus) sind eingespielt und mit curl
  sowie im Browser getestet.
- Tests: grün (253), Typprüfung grün.
- Letzter Commit: siehe `git log -1` auf `main`.

## Nächste Schritte
1. Rückmeldung der Lehrkraft abwarten: neue Anleitung ins Claude-Projekt geladen? Wie laufen die Rückfragen?
2. Ersten echten Canva-Auftrag auswerten (Gliederung, Bilder, Zwillingsfolien, Vorlage) und den Auftragstext in
   `src/canva/prompt.ts` danach schärfen.
3. Offen aus früheren Runden: Editor-Bedienung (Anordnen, iPad hochkant), interaktive Modelle (Runde 7).

## Wichtig zu wissen
- Die Quelle der Edge-Function liegt in `supabase/functions/praesi-bild/index.ts`; ändern = neu einspielen mit den
  Supabase-Tools, vorher die Lehrkraft fragen. Aufräumen läuft alle 6 h über `.github/workflows/server-wach.yml`.
- Die Canva-Verbindung kann keine Animationen setzen, deshalb Lösungen als Zwillingsfolie. Eigene Bilder gehen nur über
  `generate-design-structured` (höchstens 10, mit Gliederungsprüfung) in eine neue Präsi.
- Canva-Autofill (Vorlagen automatisch füllen) braucht Canva Enterprise, für die Lehrkraft nicht machbar.
- Sterne, Sozialform und Kompetenz werden nur noch im Editor gezeigt (`data-noprint`, `editing`).
