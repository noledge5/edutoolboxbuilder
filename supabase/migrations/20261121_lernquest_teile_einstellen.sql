-- Lernquest: alle Teile einstellbar und Frisuren als Teile (Designrunde 10.11.2026, Projekt „baukasten“).
-- Gewünscht von der Lehrkraft am 10.11.2026 („Seltenheit, ob nur Truhe oder auch Laden und welche Effekte“; „Frisuren
-- teils verfügbar und teils aus Truhen und Laden“).
--   * Die Admin-Lehrkraft (lq_admin) stellt bei jedem Teil, eingebaut oder eigen, Seltenheit, Herkunft und Boni ein
--     (lq_teil_einstellen). Herkunft: start (alle haben es), truhe (nur Truhen), truhe_laden, laden (nur Laden),
--     aus (nicht erhältlich). Gespeichert in start, nur_truhe, neu nur_laden und aktiv.
--   * Frisuren stehen als Teile mit Platz „frisur“ und Kennung „frisur-<id>“ im Katalog, zu Beginn alle Start (wie
--     bisher frei wählbar). Frisuren geben keine Boni (lq_bonus zählt nur die sechs Plätze).
--   * Besitz bleibt immer. Verliert ein Teil „Start“, bekommen es alle, die es gerade tragen, ins Inventar; außerdem
--     darf ein Kind behalten, was es gerade trägt (lq_avatar_setzen).
--   * Truhe: findet sich in der gezogenen Seltenheit kein Truhen-Teil, die nächste daneben, sonst nur Münzen.
--   * Die App liest alle Werte über lq_teile_werte (für alle; nichts darin ist geheim).

alter table public.lq_teil add column nur_laden boolean not null default false;
alter table public.lq_teil drop constraint lq_teil_slot_check;
alter table public.lq_teil add constraint lq_teil_slot_check
  check (slot in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund', 'frisur'));

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe, name, eigen) values
  ('frisur-kurz', 'frisur', 0, true, 0, 0, 0, false, 'Kurze Haare', false),
  ('frisur-zopf', 'frisur', 0, true, 0, 0, 0, false, 'Zopf', false),
  ('frisur-locken', 'frisur', 0, true, 0, 0, 0, false, 'Locken', false),
  ('frisur-lang', 'frisur', 0, true, 0, 0, 0, false, 'Lange Haare', false),
  ('frisur-zoepfe', 'frisur', 0, true, 0, 0, 0, false, 'Zwei Zöpfe', false),
  ('frisur-dutt', 'frisur', 0, true, 0, 0, 0, false, 'Dutt', false),
  ('frisur-stacheln', 'frisur', 0, true, 0, 0, 0, false, 'Stachelhaare', false),
  ('frisur-bob', 'frisur', 0, true, 0, 0, 0, false, 'Bob', false),
  ('frisur-glatze', 'frisur', 0, true, 0, 0, 0, false, 'Keine', false)
on conflict (id) do nothing;

-- — Hilfen —

/** Die Frisur, die ein Avatar zeigt (wie frisurVon in teile.ts): frisur, sonst die ältere figur 0–2, sonst kurz. */
create function public.lq_frisur_von(a jsonb) returns text
language sql immutable set search_path = '' as $$
  select coalesce(a ->> 'frisur', (array['kurz', 'zopf', 'locken'])[coalesce((a ->> 'figur')::int, 0) + 1], 'kurz')
$$;

/** Das Startteil, das ein Platz ohne eigene Wahl zeigt: das mit der kleinsten Kennung (wie standardTeil in teile.ts). */
create function public.lq_standard_teil(p_slot text) returns text
language sql stable set search_path = '' as $$
  select t.id from public.lq_teil t where t.slot = p_slot and t.start order by t.id collate "C" limit 1
$$;

-- — Lesen (für alle) —

/** Alle Werte aller Teile: [{id, slot, seltenheit, start, nurTruhe, nurLaden, aktiv, muenzen, herz, schaden}]. */
create function public.lq_teile_werte() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'slot', t.slot, 'seltenheit', t.seltenheit, 'start', t.start,
    'nurTruhe', t.nur_truhe, 'nurLaden', t.nur_laden, 'aktiv', t.aktiv, 'muenzen', t.bonus_muenzen, 'herz', t.bonus_herz,
    'schaden', t.bonus_schaden) order by t.id collate "C"), '[]'::jsonb)
  from public.lq_teil t
$$;

-- — Einstellen (nur Admin) —

/**
 * p_werte: {seltenheit 0–4, herkunft, muenzen 0–20, herz 0–2, schaden 0–3}; Frisuren ohne Boni. Der letzte
 * Start-Teil von Kleidung, Augen, Hintergrund und Frisur bleibt Start (sonst stünde ein neues Kind ohne da): 'letztes'.
 */
create function public.lq_teil_einstellen(p_schluessel text[], p_teil text, p_werte jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t public.lq_teil;
  v_sel int;
  v_her text := p_werte ->> 'herkunft';
  v_m int;
  v_h int;
  v_d int;
  v_frisur text;
  war_standard boolean;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if p_werte is null or jsonb_typeof(p_werte) <> 'object'
     or jsonb_typeof(p_werte -> 'seltenheit') <> 'number' or jsonb_typeof(p_werte -> 'muenzen') <> 'number'
     or jsonb_typeof(p_werte -> 'herz') <> 'number' or jsonb_typeof(p_werte -> 'schaden') <> 'number'
     or v_her is null or v_her not in ('start', 'truhe', 'truhe_laden', 'laden', 'aus') then
    raise exception 'ungueltig';
  end if;
  v_sel := (p_werte ->> 'seltenheit')::numeric;
  v_m := (p_werte ->> 'muenzen')::numeric;
  v_h := (p_werte ->> 'herz')::numeric;
  v_d := (p_werte ->> 'schaden')::numeric;
  if v_sel not between 0 and 4 or v_m not between 0 and 20 or v_h not between 0 and 2 or v_d not between 0 and 3 then
    raise exception 'ungueltig';
  end if;
  select * into t from public.lq_teil x where x.id = p_teil for update;
  if t.id is null then raise exception 'ungueltig'; end if;
  if t.slot = 'frisur' and (v_m <> 0 or v_h <> 0 or v_d <> 0) then raise exception 'ungueltig'; end if;

  if t.start and v_her <> 'start' then
    if t.slot in ('kleidung', 'augen', 'hintergrund', 'frisur')
       and not exists (select 1 from public.lq_teil x where x.slot = t.slot and x.start and x.id <> t.id) then
      raise exception 'letztes';
    end if;
    -- Wer es gerade trägt (gewählt oder als Standard des Platzes), bekommt es ins Inventar.
    if t.slot = 'frisur' then
      v_frisur := substr(t.id, 8);
      update public.lq_kind c set inventar = c.inventar || t.id
       where public.lq_frisur_von(c.avatar) = v_frisur and not t.id = any (c.inventar);
    else
      war_standard := public.lq_standard_teil(t.slot) = t.id;
      update public.lq_kind c
         set inventar = case when t.id = any (c.inventar) then c.inventar else c.inventar || t.id end,
             avatar = case when c.avatar ? t.slot then c.avatar else c.avatar || jsonb_build_object(t.slot, t.id) end
       where c.avatar ->> t.slot = t.id or (war_standard and not c.avatar ? t.slot);
    end if;
  end if;

  -- Wird ein Teil neu Start, zeigt kein Kind ohne eigene Wahl plötzlich etwas anderes: der bisherige Standard bleibt.
  if not t.start and v_her = 'start' and t.slot <> 'frisur' and public.lq_standard_teil(t.slot) is not null then
    update public.lq_kind c set avatar = c.avatar || jsonb_build_object(t.slot, public.lq_standard_teil(t.slot))
     where not c.avatar ? t.slot;
  end if;

  update public.lq_teil set seltenheit = v_sel,
    start = v_her = 'start',
    nur_truhe = v_her = 'truhe',
    nur_laden = v_her = 'laden',
    aktiv = v_her <> 'aus',
    bonus_muenzen = v_m, bonus_herz = v_h, bonus_schaden = v_d
   where id = t.id;
end;
$$;

-- — Truhe, Laden, Avatar —

/** Wie 20261118_lernquest_eigene_teile.sql, dazu: nicht aus „nur Laden“; fehlt die Seltenheit, die nächste daneben
 *  (zählt dann mit deren Seltenheit), gibt es gar kein Truhen-Teil, nur Münzen. */
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
  if not nur_muenzen then
    select * into t from public.lq_teil x where not x.start and x.aktiv and not x.nur_laden
     order by abs(x.seltenheit - s), x.seltenheit desc, random() limit 1;
    if t.id is null then
      nur_muenzen := true;
      s := 0;
    else
      s := t.seltenheit;
    end if;
  end if;
  if nur_muenzen then
    wert := (array[25, 40])[least(s, 1) + 1];
  else
    doppelt := t.id = any (k.inventar);
    if doppelt then wert := (array[10, 20, 40, 80, 150])[s + 1]; end if;
  end if;
  update public.lq_kind set truhen = truhen - 1, pech = case when s >= 2 then 0 else pech + 1 end,
    inventar = case when nur_muenzen or doppelt then inventar else inventar || t.id end, muenzen = muenzen + wert
   where id = k.id returning * into k;
  return jsonb_build_object('teil', t.id, 'seltenheit', s, 'doppelt', doppelt, 'muenzen', wert, 'stand', public.lq_stand_json(k));
end;
$$;

/** Wie 20261118_lernquest_eigene_teile.sql; Frisuren lassen sich jetzt auch kaufen (sie stehen im Katalog). */
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

/**
 * Wie 20261112_lernquest_mund.sql, dazu: eine Frisur, die im Katalog nicht Start ist, braucht das Kind im Inventar;
 * was das Kind gerade trägt (Teil oder Frisur), darf es behalten, auch wenn es kein Startteil mehr ist.
 */
create or replace function public.lq_avatar_setzen(p_token text, p_avatar jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  e record;
  a jsonb := '{}'::jsonb;
  v text;
begin
  if p_avatar is null or jsonb_typeof(p_avatar) <> 'object' then raise exception 'ungueltig'; end if;
  for e in select key, value from jsonb_each(p_avatar) loop
    if e.key = 'haut' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 5 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('haut', (e.value::text)::int);
    elsif e.key = 'figur' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 2 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('figur', (e.value::text)::int);
    elsif e.key = 'haarfarbe' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 4 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('haarfarbe', (e.value::text)::int);
    elsif e.key in ('frisur', 'mund') then
      v := e.value #>> '{}';
      if jsonb_typeof(e.value) <> 'string' or v !~ '^[a-z0-9]{1,24}$' then raise exception 'ungueltig'; end if;
      if e.key = 'frisur' and v <> public.lq_frisur_von(k.avatar) and exists (select 1 from public.lq_teil t
          where t.id = 'frisur-' || v and not t.start and not t.id = any (k.inventar)) then
        raise exception 'ungueltig';
      end if;
      a := a || jsonb_build_object(e.key, v);
    elsif e.key in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund') and jsonb_typeof(e.value) = 'string' then
      v := e.value #>> '{}';
      if v <> '' and v is distinct from k.avatar ->> e.key and not exists (select 1 from public.lq_teil t
          where t.id = v and t.slot = e.key and (t.start or t.id = any (k.inventar))) then
        raise exception 'ungueltig';
      end if;
      a := a || jsonb_build_object(e.key, v);
    else
      raise exception 'ungueltig';
    end if;
  end loop;
  update public.lq_kind set avatar = a where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;

revoke execute on function public.lq_frisur_von(jsonb), public.lq_standard_teil(text) from public, anon, authenticated;
