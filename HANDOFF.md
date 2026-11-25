# Handoff – 26.11.2026 (30 neue Teile zu den Welten der Karte, Branch gepusht, nicht gemergt)

## Ziel
Lernquest weiter ausbauen; als Nächstes die übrigen Wünsche der Lehrkraft vom 25.11. (Reihenfolge fragt man sie).

## Stand
- Erledigt, **nicht gemergt**: 30 neue Teile (Wunsch „neue Gegenstände, auch Legendär“). Je Welt der Karte ein Set mit
  einem Teil je Seltenheit, jeder Platz je Seltenheit eins (Liste: `docs/lernquest.md` „Teile zu den Welten der Karte“).
  Herkunft wie bisher (Legendär nur aus Truhen). Branch `claude/neue-teile-welten`, kein PR (nur auf Wunsch).
- Tests grün (699), Typecheck, Build. SQL mit PGlite geprüft (alle 32 Migrationen, Werte = teile.ts, Laden kauft/verweigert
  richtig, 3000 Truhen geben neue Teile aus). Kinder-App im Browser (Handybreite, nachgestellter Server): Teile-Liste und
  Held mit neuen Teilen. Nicht geprüft: echter Server, echtes Handy.
- Die Lehrkraft hat `20261203` und `20261204` (Häuser, Gestalten) am 26.11. eingespielt.
- **Offen bei der Lehrkraft:** mergen ja/nein (= live); danach `20261205_lernquest_welten_teile.sql` in Supabase einspielen
  (erst mergen, sonst kennt die App Truhen-Teile noch nicht). Bilder in der Werkstatt prüfen, wenn veröffentlicht.

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. Rückmeldung zu den neuen Teilen oder zum Dorf einarbeiten.
2. Wünsche vom 25.11. (`docs/plan-klassendorf-haeuser.md`): Mathe-Aufgaben (bald!), Einschmelzen, Abzeichen, Haus und
   Profil anderer besuchen (braucht Namen für Kinder = neue Entscheidung), Anbauten mit Seltenheit aus Truhen/Laden.
3. Solo-Boss an der Burg (Plan Schritt 6; `karte.ts` `MEILENSTEIN_GROESSE`, `meilensteinStarten` in `app/LernquestApp.tsx`).
4. Plan Schritt 2 (Vokabeln getrennt, Kompetenzen statt Blatt), Schritte 4–5 (Fuchs, Lehrerseite neu).
5. Offen: Werkstatt mit neuen Teilen, Kartenteilen, Hausstufen veröffentlichen? (Version 17:
   https://claude.ai/artifact/WmzYWa5W6igWNwv2iUZdnG; ArtifactData-Lesen der Prüfungen ging am 26.11. nicht: kein Zugriff)

## Wichtig zu wissen
- Neue Teile: Kennung der Fackel ist `holzfackel` (`fackel` ist ein Gegenstand des Fuchses, Ids in ITEMS müssen eindeutig
  sein). Katalog-Test in `lernquest.test.ts` liest alle Teil-Migrationen; Ids nur [a-z].
- Werkzeuge halten Abstand zum Gesicht (um 20–30° nach außen drehen); im Gesamtbild prüfen: Held mit Hut, Augen, Kleidung,
  Werkzeug, Begleiter und Hintergrund zusammen (kurzer Vitest in figuren/, danach löschen).
- Vorschau: `VORSCHAU=<ordner> VORSCHAU_TEIL=kopf|werkzeug|begleiter|hintergrund|held [VORSCHAU_NUR=<ids>] npx vitest run
  src/lernquest/figuren/vorschau`; ohne globales Playwright `NODE_PATH=<eigenes playwright>/node_modules PW_CHROME=<Chrome>`.
- Spieltest ohne Server: `npm run spieltest`, `scripts/spieltest-daten.js` einfügen, Playwright `page.route('http://127.0.0.1:9/**')`.
- Dorf: `dorfplan.ts`, `figuren/dorf.tsx`, `dorfdeko.tsx`, `nacht.tsx`; Aussehen doppelt in `dorf.ts` und `lq_aussehen_ok`.
- Gemergte Branches nur nach Rückfrage löschen: `claude/dorf-hochformat`, `claude/compassionate-davinci-8in8er`,
  `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`, `claude/jolly-planck-0jqcot`, `claude/umbau-schalter`,
  `claude/dreamy-bardeen-2fmcg4`.
- Supabase-Migrationen und Werkstatt-Veröffentlichung nur mit Zustimmung; Force-Push gesperrt; kein Figma.
