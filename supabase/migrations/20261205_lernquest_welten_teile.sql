-- Lernquest: 30 neue Teile zu den Welten der Karte (Wunsch der Lehrkraft vom 25.11.2026, entschieden am 26.11.2026).
-- Je Welt (Wüste, Schneeland, Strand, Vulkan, Weltall, Wald) ein kleines Set mit einem Teil je Seltenheit; jeder Platz
-- (Kopf, Augen, Kleidung, Werkzeug, Begleiter, Hintergrund) bekommt je Seltenheit genau ein neues Teil.
-- Herkunft wie bisher: Gewöhnlich und Ungewöhnlich im Laden, Selten gemischt, Episch meist und Legendär immer nur aus
-- Truhen. Gleich in src/lernquest/teile.ts (TEILE); ein Test vergleicht. Gezeichnet in src/lernquest/figuren/.
-- Die Lehrkraft kann Seltenheit, Herkunft und Boni auf der Lehrerseite ändern (lq_teil_einstellen).
-- Nur neue Zeilen: an Truhen, Laden und Spielständen ändert sich nichts.

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe) values
  ('pilzhut', 'kopf', 0, false, 0, 0, 0, false),
  ('seesternbrille', 'augen', 0, false, 0, 0, 0, false),
  ('daunenjacke', 'kleidung', 0, false, 0, 0, 0, false),
  ('holzfackel', 'werkzeug', 0, false, 0, 0, 1, false),
  ('erdmaennchen', 'begleiter', 0, false, 0, 0, 0, false),
  ('raumstation', 'hintergrund', 0, false, 0, 0, 0, false),
  ('antennenreif', 'kopf', 1, false, 5, 0, 0, false),
  ('schneebrille', 'augen', 1, false, 0, 0, 0, false),
  ('hawaiihemd', 'kleidung', 1, false, 0, 0, 0, false),
  ('schleuder', 'werkzeug', 1, false, 0, 0, 1, false),
  ('salamander', 'begleiter', 1, false, 0, 1, 0, false),
  ('oase', 'hintergrund', 1, false, 5, 0, 0, false),
  ('kapitaensmuetze', 'kopf', 2, false, 5, 0, 0, false),
  ('forscherbrille', 'augen', 2, false, 0, 0, 1, false),
  ('blaettermantel', 'kleidung', 2, false, 0, 1, 0, false),
  ('sanduhr', 'werkzeug', 2, false, 0, 1, 0, false),
  ('alien', 'begleiter', 2, false, 5, 0, 1, true),
  ('eisburg', 'hintergrund', 2, false, 5, 0, 0, true),
  ('pharaonenhaube', 'kopf', 3, false, 10, 1, 0, true),
  ('smaragdaugen', 'augen', 3, false, 10, 0, 0, true),
  ('lavaruestung', 'kleidung', 3, false, 0, 1, 1, true),
  ('planetenstab', 'werkzeug', 3, false, 5, 0, 2, false),
  ('eisbaer', 'begleiter', 3, false, 0, 1, 1, true),
  ('leuchtturm', 'hintergrund', 3, false, 10, 0, 0, false),
  ('flammenkrone', 'kopf', 4, false, 10, 1, 2, true),
  ('kometenaugen', 'augen', 4, false, 15, 0, 1, true),
  ('pharaonengewand', 'kleidung', 4, false, 15, 2, 0, true),
  ('eiszepter', 'werkzeug', 4, false, 10, 1, 3, true),
  ('leuchtqualle', 'begleiter', 4, false, 15, 1, 0, true),
  ('gluehwuermchenwald', 'hintergrund', 4, false, 15, 0, 0, true)
on conflict (id) do nothing;
