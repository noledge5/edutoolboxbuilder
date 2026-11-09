-- Lernquest: Truhen-Schätze (Projekt „baukasten“). Gewünscht von der Lehrkraft am 09.11.2026.
-- 24 neue Teile, je Platz zwei zum Kaufen und zwei, die es nur aus Truhen gibt (nicht im Laden). Truhen ziehen weiter
-- aus allen Teilen einer Seltenheit, also auch aus den Schätzen. Gleich in src/lernquest/teile.ts (TEILE, nurTruhe);
-- ein Test vergleicht den Katalog hier mit dem dort.

alter table public.lq_teil add column nur_truhe boolean not null default false;

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe) values
  ('kochmuetze', 'kopf', 0, false, 0, 0, 0, false),
  ('cowboyhut', 'kopf', 1, false, 0, 0, 0, false),
  ('raumhelm', 'kopf', 3, false, 5, 0, 0, true),
  ('eiskrone', 'kopf', 4, false, 10, 1, 0, true),
  ('schlaefrig', 'augen', 0, false, 0, 0, 0, false),
  ('zwinkern', 'augen', 1, false, 0, 0, 0, false),
  ('monokel', 'augen', 2, false, 5, 0, 0, true),
  ('feueraugen', 'augen', 3, false, 0, 0, 1, true),
  ('regenjacke', 'kleidung', 0, false, 0, 0, 0, false),
  ('ninjaanzug', 'kleidung', 1, false, 0, 0, 0, false),
  ('raumanzug', 'kleidung', 2, false, 0, 1, 0, true),
  ('kristallruestung', 'kleidung', 4, false, 10, 1, 0, true),
  ('angel', 'werkzeug', 0, false, 0, 0, 0, false),
  ('bumerang', 'werkzeug', 1, false, 0, 0, 0, false),
  ('hammer', 'werkzeug', 2, false, 0, 0, 1, true),
  ('blitzstab', 'werkzeug', 4, false, 10, 0, 3, true),
  ('igel', 'begleiter', 0, false, 0, 0, 0, false),
  ('papagei', 'begleiter', 1, false, 0, 0, 0, false),
  ('axolotl', 'begleiter', 2, false, 5, 0, 0, true),
  ('einhorn', 'begleiter', 3, false, 0, 1, 0, true),
  ('wueste', 'hintergrund', 0, false, 0, 0, 0, false),
  ('winterwald', 'hintergrund', 1, false, 0, 0, 0, false),
  ('vulkan', 'hintergrund', 3, false, 5, 0, 0, true),
  ('wolkenschloss', 'hintergrund', 4, false, 10, 0, 0, true);

/** Kauft ein Teil im Laden: 80 / 160 / 320 / 640 / 1600 Münzen. Truhen-Schätze (nur_truhe) gibt es hier nicht.
 *  Fehler 'muenzen', wenn es nicht reicht. */
create or replace function public.lq_kaufen(p_token text, p_teil text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  t public.lq_teil;
  preis int;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select * into t from public.lq_teil x where x.id = p_teil and not x.start and not x.nur_truhe;
  if t.id is null or t.id = any (k.inventar) then raise exception 'ungueltig'; end if;
  preis := (array[80, 160, 320, 640, 1600])[t.seltenheit + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  update public.lq_kind set muenzen = muenzen - preis, inventar = inventar || t.id where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;
