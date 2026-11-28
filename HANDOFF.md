# Handoff – 26.11.2026 (Teile, Häuser und Vorlesen mit Google-Stimme live)

> **Freigabe der Lehrkraft (27.11.2026, über Claude weitergegeben):** Beim **Dorf** darfst du richtig loslegen:
> groß umbauen, Neues ausprobieren, nicht nur Feinschliff. Und du darfst **Layout- und Mechanik-Entscheidungen der App neu
> denken**, auch solche, die in `docs/lernquest.md` oder in ADRs schon festgelegt sind. Was du änderst, dort als neue
> Entscheidung mit Grund festhalten.
>
> **Neue Figuren-Werkstatt:** https://claude.ai/artifact/6YDQU9Ghhp6SZ7mLLXj2jD (neuer Bewegungs-Motor, alle 180
> Rückmeldungen übernommen). Rückmeldungen ab jetzt dort lesen (ArtifactData, Sammlung `pruefung`). Die alte Adresse
> (…/WmzYWa5W6igWNwv2iUZdnG) ist in `docs/design/lernquest/README.md` ersetzt (27.11., #122); der Skill `figur` verweist
> auf das README.

> **Hinweis Bewegung (27.11.2026, PR #117 und „Lernquest Held: Hallo“):** Der Bewegungs-Motor (`figuren/bewegung.ts`)
> hat sich geändert: `weich` ist eine Kurve durch alle Schlüsselbilder; neu sind `kurven` je Abschnitt (`rein` zum
> Fallen), `versatz` je Spur (Nachziehen), `vorne` je Bewegung und ein Übergang von 0,2 s bei jedem Wechsel von Pose
> oder Bewegung (`UEBERGANG`). Zum Begrüßen mit dem Helden `hallo` nehmen, nicht `winken` (das wackelt nur einen schon
> erhobenen Arm, z. B. Fuchs-Pose `winken`). Regeln: `docs/design/lernquest/bewegung.md`; `figuren/bewegung.test.ts`
> prüft jede Bewegung (kein Sprung zwischen zwei Bildern bei 60 fps). Nächste Ideen dort unter „Als Nächstes“.

## Ziel
Lernquest weiter ausbauen; als Nächstes die übrigen Wünsche der Lehrkraft vom 25.11. (Reihenfolge fragt man sie).

## Stand
- Erledigt und **gemergt (PR #89, live)**: 30 neue Teile (Wunsch „neue Gegenstände, auch Legendär“). Je Welt der Karte ein Set mit
  einem Teil je Seltenheit, jeder Platz je Seltenheit eins (Liste: `docs/lernquest.md` „Teile zu den Welten der Karte“).
  Herkunft wie bisher (Legendär nur aus Truhen). Branch `claude/neue-teile-welten` (gemergt, nur nach Rückfrage löschen). CI und Pages-Deploy grün.
- Tests grün (699), Typecheck, Build. SQL mit PGlite geprüft (alle 32 Migrationen, Werte = teile.ts, Laden kauft/verweigert
  richtig, 3000 Truhen geben neue Teile aus). Kinder-App im Browser (Handybreite, nachgestellter Server): Teile-Liste und
  Held mit neuen Teilen. Nicht geprüft: echter Server, echtes Handy.
- Erledigt und **gemergt (PR #90, live)**: Vorlesen mit aufgenommener Google-Stimme (`docs/lernquest.md` „Vorlesen mit
  aufgenommener Stimme“; `src/lernquest/stimme.ts`, `app/vorlesen.ts`, `teacher/stimme.ts`, `teacher/StimmeKarte.tsx`).
  Ohne Schlüssel/Aufnahme liest weiter das Gerät. Nicht geprüft: echtes Google, echtes iPad/Handy.
- **Server (26.11., von Claude mit Zustimmung):** `20261206_lernquest_ton.sql` eingespielt (live geprüft per RPC). `20261203`, `20261204`, `20261205` in einer Transaktion eingespielt (vorher
  Probelauf mit Rollback); 174 Teile, Häuser-Funktionen da. Klasse 5c: Dorf an, Häuser an, nicht im Umbau. Die Lehrkraft
  dachte, 1203/1204 seien schon drin; sie waren es nicht. Künftig nach „eingespielt“ per RPC-Probe prüfen.

## Nächste Schritte (je einer pro Session, neuer Branch von `main`)
1. **Vorlesen mit Google prüfen:** Lehrkraft trägt den Google-Schlüssel in der Karte „Vorlesen mit guter Stimme“ ein, hört
   die Probe, drückt „Freigeschaltete neu senden“. Dann auf iPad und Handy hören; welche Stimme Google nimmt, steht in
   localStorage `lernquest:google-stimme-name` (erst `en-GB-Chirp3-HD-Aoede`). Bei Fehlern zeigt die Karte Googles Meldung.
2. Rückmeldung zu den neuen Teilen oder zum Dorf einarbeiten.
3. Wünsche vom 25.11. (`docs/plan-klassendorf-haeuser.md`): Mathe-Aufgaben (bald!), Einschmelzen, Abzeichen, Haus und
   Profil anderer besuchen (braucht Namen für Kinder = neue Entscheidung), Anbauten mit Seltenheit aus Truhen/Laden.
4. ~~Solo-Boss an der Burg~~ – gebaut am 28.11.2026: der Wächter der Region im Meilenstein (`docs/lernquest.md`
   „Solo-Boss: der Wächter der Region“, `docs/lernquest-logbuch.md`).
5. Plan Schritt 2 (Vokabeln getrennt, Kompetenzen statt Blatt), Schritte 4–5 (Fuchs, Lehrerseite neu).
6. Offen: Werkstatt mit neuen Teilen, Kartenteilen, Hausstufen veröffentlichen? (Version 17:
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
- Gemergte Branches nur nach Rückfrage löschen: `claude/sprachausgabe`, `claude/neue-teile-welten`, `claude/dorf-hochformat`, `claude/compassionate-davinci-8in8er`,
  `claude/admiring-fermi-fcitkp`, `claude/eloquent-davinci-xlogq4`, `claude/jolly-planck-0jqcot`, `claude/umbau-schalter`,
  `claude/dreamy-bardeen-2fmcg4`.
- Supabase: CLI ist auf diesem Mac angemeldet (Schlüsselbund). Lesen: `npx supabase db query --remote=txafdkaeotgekoxzgcxd
  --read-only "<sql>"`; Einspielen nur mit Zustimmung: `begin; … commit;` als Datei, `-f <datei> --yes`, erst Probelauf mit rollback.
- Supabase-Migrationen und Werkstatt-Veröffentlichung nur mit Zustimmung; Force-Push gesperrt; kein Figma.
