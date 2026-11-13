-- Lernquest: 50 neue Teile, je Seltenheit zehn (Wunsch der Lehrkraft, 13.11.2026): gemischt aus Frisuren, Kleidung,
-- Werkzeugen, Hüten, Augen, Begleitern und Hintergründen. Nach den neuen Truhen (20261128) war „Legendär“ leer.
-- Gleich in src/lernquest/teile.ts (TEILE, FRISUREN); ein Test vergleicht. Gezeichnet in src/lernquest/figuren/.
-- Die Lehrkraft kann Seltenheit, Herkunft und Boni auf der Lehrerseite ändern (lq_teil_einstellen).

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe) values
  ('baskenmuetze', 'kopf', 0, false, 0, 0, 0, false),
  ('kulleraugen', 'augen', 0, false, 0, 0, 0, false),
  ('karohemd', 'kleidung', 0, false, 0, 0, 0, false),
  ('trainingsanzug', 'kleidung', 0, false, 0, 0, 0, false),
  ('bleistift', 'werkzeug', 0, false, 0, 0, 0, false),
  ('regenschirm', 'werkzeug', 0, false, 0, 0, 0, false),
  ('hase', 'begleiter', 0, false, 0, 0, 0, false),
  ('klassenzimmer', 'hintergrund', 0, false, 0, 0, 0, false),
  ('propellermuetze', 'kopf', 1, false, 5, 0, 0, false),
  ('katzenaugen', 'augen', 1, false, 0, 0, 0, false),
  ('matrosenanzug', 'kleidung', 1, false, 0, 0, 0, false),
  ('feuerwehranzug', 'kleidung', 1, false, 0, 1, 0, false),
  ('gitarre', 'werkzeug', 1, false, 5, 0, 0, false),
  ('kescher', 'werkzeug', 1, false, 0, 0, 0, false),
  ('frosch', 'begleiter', 1, false, 0, 0, 0, false),
  ('bibliothek', 'hintergrund', 1, false, 5, 0, 0, false),
  ('detektivhut', 'kopf', 2, false, 5, 0, 0, false),
  ('roboteraugen', 'augen', 2, false, 0, 0, 1, false),
  ('detektivmantel', 'kleidung', 2, false, 5, 0, 0, false),
  ('piratenjacke', 'kleidung', 2, false, 0, 1, 0, false),
  ('bogen', 'werkzeug', 2, false, 0, 0, 1, false),
  ('zauberbuch', 'werkzeug', 2, false, 5, 0, 1, false),
  ('panda', 'begleiter', 2, false, 0, 1, 0, false),
  ('dschungel', 'hintergrund', 2, false, 5, 0, 0, true),
  ('federkrone', 'kopf', 3, false, 10, 1, 0, true),
  ('galaxieaugen', 'augen', 3, false, 10, 0, 0, true),
  ('samurairuestung', 'kleidung', 3, false, 0, 1, 1, true),
  ('magiermantel', 'kleidung', 3, false, 10, 0, 0, false),
  ('flammenschwert', 'werkzeug', 3, false, 5, 0, 2, true),
  ('frostbogen', 'werkzeug', 3, false, 0, 1, 2, false),
  ('mondwolf', 'begleiter', 3, false, 0, 1, 1, true),
  ('piratenschiff', 'hintergrund', 3, false, 10, 0, 0, false),
  ('phoenixkrone', 'kopf', 4, false, 15, 2, 0, true),
  ('regenbogenaugen', 'augen', 4, false, 15, 1, 0, true),
  ('sonnenruestung', 'kleidung', 4, false, 15, 2, 0, true),
  ('schattenmantel', 'kleidung', 4, false, 10, 1, 2, true),
  ('sonnenzepter', 'werkzeug', 4, false, 10, 1, 3, true),
  ('mondsichel', 'werkzeug', 4, false, 15, 0, 3, true),
  ('sternenhirsch', 'begleiter', 4, false, 10, 1, 1, true),
  ('nordlicht', 'hintergrund', 4, false, 15, 0, 0, true)
on conflict (id) do nothing;

-- Frisuren: nicht von Anfang an da, sondern aus dem Laden oder (die seltensten) nur aus Truhen.
insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe, name, eigen) values
  ('frisur-pferdeschwanz', 'frisur', 0, false, 0, 0, 0, false, 'Pferdeschwanz', false),
  ('frisur-buerste', 'frisur', 0, false, 0, 0, 0, false, 'Bürstenschnitt', false),
  ('frisur-afro', 'frisur', 1, false, 0, 0, 0, false, 'Afro', false),
  ('frisur-seitenzopf', 'frisur', 1, false, 0, 0, 0, false, 'Seitenzopf', false),
  ('frisur-haarschnecken', 'frisur', 2, false, 0, 0, 0, false, 'Haarschnecken', false),
  ('frisur-wuschelkopf', 'frisur', 2, false, 0, 0, 0, false, 'Wuschelkopf', false),
  ('frisur-blitzfrisur', 'frisur', 3, false, 0, 0, 0, true, 'Blitzfrisur', false),
  ('frisur-sternenzopf', 'frisur', 3, false, 0, 0, 0, false, 'Sternenzopf', false),
  ('frisur-regenbogenhaar', 'frisur', 4, false, 0, 0, 0, true, 'Regenbogenhaar', false),
  ('frisur-feuerhaar', 'frisur', 4, false, 0, 0, 0, true, 'Feuerhaar', false)
on conflict (id) do nothing;
