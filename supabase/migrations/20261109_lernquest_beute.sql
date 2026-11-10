-- Lernquest: mehr Beute (Projekt „baukasten“). Gewünscht von der Lehrkraft am 06.11.2026.
-- 16 neue Teile, Truhen geben in 40 % nur Münzen, Laden doppelt so teuer, Frisur (Grundfigur 0–2) frei wählbar.
-- Die Regeln stehen gleich in src/lernquest/teile.ts (TEILE, MUENZ_CHANCEN, CHANCEN, MUENZ_TRUHE, PREISE, FIGUREN);
-- ein Test vergleicht den Katalog hier mit dem dort.

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz) values
  ('kappe', 'kopf', 0, false, 0, 0),
  ('blumenkranz', 'kopf', 1, false, 0, 0),
  ('wikingerhelm', 'kopf', 2, false, 0, 1),
  ('herzaugen', 'augen', 1, false, 0, 0),
  ('taucherbrille', 'augen', 2, false, 0, 0),
  ('kapuzenpulli', 'kleidung', 0, false, 0, 0),
  ('trikot', 'kleidung', 1, false, 0, 0),
  ('drachenruestung', 'kleidung', 3, false, 5, 1),
  ('pinsel', 'werkzeug', 0, false, 0, 0),
  ('laterne', 'werkzeug', 1, false, 0, 0),
  ('dreizack', 'werkzeug', 3, false, 10, 0),
  ('hamster', 'begleiter', 0, false, 0, 0),
  ('pinguin', 'begleiter', 1, false, 0, 0),
  ('phoenix', 'begleiter', 4, false, 10, 1),
  ('unterwasser', 'hintergrund', 2, false, 0, 0),
  ('burg', 'hintergrund', 3, false, 5, 0);

/**
 * Öffnet eine Truhe. Je 100 Truhen: 26 nur 25 Münzen, 14 nur 40 Münzen, sonst ein Teil (29 Gewöhnlich,
 * 14 Ungewöhnlich, 12 Selten, 4 Episch, 1 Legendär); als Seltenheit zählt also weiter 55 / 28 / 12 / 4 / 1.
 * Nach 4 Truhen ohne Seltenes (Münzen zählen mit) ist die 5. sicher ein seltenes Teil (12 : 4 : 1).
 * Ein Teil, das das Kind schon hat, wird zu Münzen (10 / 20 / 40 / 80 / 150).
 */
create or replace function public.lq_truhe_oeffnen(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  r double precision := random() * 100;
  s int;
  nur_muenzen boolean := r < 40;
  t public.lq_teil;
  doppelt boolean := false;
  wert int := 0;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  if k.truhen < 1 then raise exception 'ungueltig'; end if;
  if nur_muenzen then
    s := case when r < 26 then 0 else 1 end;
  else
    s := case when r < 69 then 0 when r < 83 then 1 when r < 95 then 2 when r < 99 then 3 else 4 end;
  end if;
  if s < 2 and k.pech >= 4 then
    nur_muenzen := false;
    r := random() * 17;
    s := case when r < 12 then 2 when r < 16 then 3 else 4 end;
  end if;
  if nur_muenzen then
    wert := (array[25, 40])[s + 1];
  else
    select * into t from public.lq_teil x where x.seltenheit = s and not x.start order by random() limit 1;
    doppelt := t.id = any (k.inventar);
    if doppelt then wert := (array[10, 20, 40, 80, 150])[s + 1]; end if;
  end if;
  update public.lq_kind set truhen = truhen - 1, pech = case when s >= 2 then 0 else pech + 1 end,
    inventar = case when nur_muenzen or doppelt then inventar else inventar || t.id end, muenzen = muenzen + wert
   where id = k.id returning * into k;
  return jsonb_build_object('teil', t.id, 'seltenheit', s, 'doppelt', doppelt, 'muenzen', wert, 'stand', public.lq_stand_json(k));
end;
$$;

/** Kauft ein Teil im Laden: 80 / 160 / 320 / 640 / 1600 Münzen. Fehler 'muenzen', wenn es nicht reicht. */
create or replace function public.lq_kaufen(p_token text, p_teil text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  t public.lq_teil;
  preis int;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select * into t from public.lq_teil x where x.id = p_teil and not x.start;
  if t.id is null or t.id = any (k.inventar) then raise exception 'ungueltig'; end if;
  preis := (array[80, 160, 320, 640, 1600])[t.seltenheit + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  update public.lq_kind set muenzen = muenzen - preis, inventar = inventar || t.id where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;

/** Legt Teile an: je Platz ein Teil, das das Kind hat (oder ein Startteil), '' für nichts; dazu die Hautfarbe 0–5 und
 *  die Frisur (Grundfigur) 0–2. */
create or replace function public.lq_avatar_setzen(p_token text, p_avatar jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  e record;
  a jsonb := '{}'::jsonb;
begin
  if p_avatar is null or jsonb_typeof(p_avatar) <> 'object' then raise exception 'ungueltig'; end if;
  for e in select key, value from jsonb_each(p_avatar) loop
    if e.key = 'haut' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 5 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('haut', (e.value::text)::int);
    elsif e.key = 'figur' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 2 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('figur', (e.value::text)::int);
    elsif e.key in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund') and jsonb_typeof(e.value) = 'string' then
      if e.value #>> '{}' <> '' and not exists (select 1 from public.lq_teil t where t.id = e.value #>> '{}' and t.slot = e.key and (t.start or t.id = any (k.inventar))) then
        raise exception 'ungueltig';
      end if;
      a := a || jsonb_build_object(e.key, e.value #>> '{}');
    else
      raise exception 'ungueltig';
    end if;
  end loop;
  update public.lq_kind set avatar = a where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;
