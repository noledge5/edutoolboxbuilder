-- Lernquest: eigene Teile von der Lehrerseite (Projekt „baukasten“). Gewünscht von der Lehrkraft am 09.11.2026.
-- Die Admin-Lehrkraft (lq_admin) legt neue Teile mit Name, Platz, Seltenheit und Bild an; „nur aus Truhen“ wie die
-- Truhen-Schätze. Preis wie bei allen Teilen aus der Seltenheit, keine Boni. Ein Teil kann aus dem Spiel genommen
-- werden (nicht mehr im Laden und in Truhen); Kinder, die es haben, behalten es. Löschen gibt es nicht, damit kein
-- Inventar ins Leere zeigt.

alter table public.lq_teil
  add column name text,
  add column eigen boolean not null default false,
  add column aktiv boolean not null default true,
  add column erstellt timestamptz;

-- Truhe und Laden: nur Teile im Spiel (sonst wie 20261109_lernquest_beute.sql und 20261116_lernquest_truhenschaetze.sql).
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
    select * into t from public.lq_teil x where x.seltenheit = s and not x.start and x.aktiv order by random() limit 1;
    doppelt := t.id = any (k.inventar);
    if doppelt then wert := (array[10, 20, 40, 80, 150])[s + 1]; end if;
  end if;
  update public.lq_kind set truhen = truhen - 1, pech = case when s >= 2 then 0 else pech + 1 end,
    inventar = case when nur_muenzen or doppelt then inventar else inventar || t.id end, muenzen = muenzen + wert
   where id = k.id returning * into k;
  return jsonb_build_object('teil', t.id, 'seltenheit', s, 'doppelt', doppelt, 'muenzen', wert, 'stand', public.lq_stand_json(k));
end;
$$;

create or replace function public.lq_kaufen(p_token text, p_teil text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  t public.lq_teil;
  preis int;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select * into t from public.lq_teil x where x.id = p_teil and not x.start and not x.nur_truhe and x.aktiv;
  if t.id is null or t.id = any (k.inventar) then raise exception 'ungueltig'; end if;
  preis := (array[80, 160, 320, 640, 1600])[t.seltenheit + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  update public.lq_kind set muenzen = muenzen - preis, inventar = inventar || t.id where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;

/** Ein gültiger Name für ein eigenes Teil (1–30 Zeichen, ohne Steuerzeichen) oder null. */
create function public.lq_teil_name(p text) returns text
language sql immutable set search_path = '' as $$
  select case when btrim(p) ~ '^[^[:cntrl:]]{1,30}$' then btrim(p) end
$$;

/** Legt ein eigenes Teil mit seinem Bild an (beides oder nichts) und gibt die neue Kennung zurück. Nur für Admins;
 *  höchstens 200 eigene Teile. Fehler wie lq_bild_setzen. */
create function public.lq_teil_anlegen(p_schluessel text[], p_name text, p_slot text, p_seltenheit int, p_nur_truhe boolean,
  p_typ text, p_daten text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.lq_teil_name(p_name);
  id text;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if n is null or p_slot is null or p_slot not in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund')
     or p_seltenheit is null or p_seltenheit not between 0 and 4 or p_nur_truhe is null then
    raise exception 'ungueltig';
  end if;
  if (select count(*) from public.lq_teil t where t.eigen) >= 200 then raise exception 'voll'; end if;
  -- Kleinbuchstaben und Ziffern wie die eingebauten Kennungen; „e“ vorn, damit sie nie mit einer kollidiert.
  id := 'e' || substr(md5(gen_random_uuid()::text), 1, 10);
  insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe, name, eigen, erstellt)
    values (id, p_slot, p_seltenheit, false, 0, 0, 0, p_nur_truhe, n, true, now());
  perform public.lq_bild_setzen(p_schluessel, id, p_typ, p_daten);
  return id;
end;
$$;

/** Benennt ein eigenes Teil um und nimmt es aus dem Spiel oder wieder hinein. Nur für Admins, nur eigene Teile. */
create function public.lq_teil_aendern(p_schluessel text[], p_teil text, p_name text, p_aktiv boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.lq_teil_name(p_name);
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if n is null or p_aktiv is null then raise exception 'ungueltig'; end if;
  update public.lq_teil set name = n, aktiv = p_aktiv where id = p_teil and eigen;
  if not found then raise exception 'ungueltig'; end if;
end;
$$;

/** Die eigenen Teile für App und Lehrerseite: [{id, slot, name, seltenheit, nurTruhe, aktiv}]. Für alle. */
create function public.lq_teile_eigen() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'slot', t.slot, 'name', t.name, 'seltenheit', t.seltenheit,
    'nurTruhe', t.nur_truhe, 'aktiv', t.aktiv) order by t.erstellt), '[]'::jsonb)
  from public.lq_teil t where t.eigen
$$;

/** Wie 20261117_lernquest_bilder.sql; ein eigenes Teil braucht sein Bild (es hat keine Zeichnung), also nicht löschbar. */
create or replace function public.lq_bild_loeschen(p_schluessel text[], p_teil text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if exists (select 1 from public.lq_teil t where t.id = p_teil and t.eigen) then raise exception 'ungueltig'; end if;
  delete from public.lq_bild where teil = p_teil;
end;
$$;

revoke execute on function public.lq_teil_name(text) from public, anon, authenticated;
