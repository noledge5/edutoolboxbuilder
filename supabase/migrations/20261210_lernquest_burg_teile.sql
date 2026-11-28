-- Lernquest: 5 neue Teile „Burg und Wächter“ (28.11.2026, Server-Vorschlag „mehr Teile“ vom Nutzer freigegeben).
-- Zum Solo-Boss am Ende jeder Region (der Wächter der Region) und zu den Mathe-Aufgaben: Rechenrahmen (Ungewöhnlich,
-- Laden), Zinnenhelm und Burgschlüssel (Selten, Laden und Truhen), Kleiner Wächter (Episch) und Burgkrone (Legendär),
-- beide nur aus Truhen. Gleich in src/lernquest/teile.ts (TEILE); ein Test vergleicht. Gezeichnet in
-- src/lernquest/figuren/ (items-kopf.tsx, items-werkzeug.tsx, begleiter.tsx). Die Lehrkraft kann Seltenheit, Herkunft
-- und Boni auf der Lehrerseite ändern (lq_teil_einstellen). Nur neue Zeilen: an Truhen, Laden und Spielständen ändert
-- sich nichts.

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe) values
  ('rechenrahmen', 'werkzeug', 1, false, 5, 0, 0, false),
  ('zinnenhelm', 'kopf', 2, false, 0, 1, 0, false),
  ('burgschluessel', 'werkzeug', 2, false, 5, 0, 1, false),
  ('waechterchen', 'begleiter', 3, false, 0, 1, 1, true),
  ('burgkrone', 'kopf', 4, false, 10, 1, 2, true)
on conflict (id) do nothing;
