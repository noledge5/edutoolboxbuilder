-- Lernquest: Teile-Katalog, von der Lehrkraft im Baukasten einstellbar (Designrunde 10.11.2026, docs/design/lernquest/README.md).
-- NOCH NICHT EINGESPIELT: erst nach Freigabe durch die Lehrkraft. Danach im Baukasten sofort „Katalog übernehmen“ tippen.
--   Neu: Platz „frisur“ und Haarfarbe; je Teil Name, Herkunft (start, truhe, truhe_laden, laden, keine), Bild (WebP als
--   data-URL, transparent, nur Raster), Kurzbild (Frisur unter Hut) und Lage im Kasten des Platzes.
--   Wer ändern darf: Schlüssel in lq_admin. Der erste, der „Katalog übernehmen“ tippt, wird Admin (bewusst vorläufig,
--   langfristig ein Login). Teile werden nie gelöscht, nur „keine“ (nicht erhältlich); Besitz bleibt immer.
-- Startkatalog: derselbe wie TEILE in src/lernquest/teile.ts (ein Test vergleicht).

alter table public.lq_teil drop constraint lq_teil_slot_check;
alter table public.lq_teil add constraint lq_teil_slot_check
  check (slot in ('hintergrund', 'frisur', 'kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter'));
alter table public.lq_teil
  add column name text not null default '' check (char_length(name) <= 40),
  add column herkunft text not null default 'keine' check (herkunft in ('start', 'truhe', 'truhe_laden', 'laden', 'keine')),
  add column bild text check (bild is null or (char_length(bild) <= 200000 and bild ~ '^data:image/webp;base64,[A-Za-z0-9+/]+={0,2}$')),
  add column bild_kurz text check (bild_kurz is null or (char_length(bild_kurz) <= 200000 and bild_kurz ~ '^data:image/webp;base64,[A-Za-z0-9+/]+={0,2}$')),
  add column lage jsonb,
  add column stand timestamptz not null default now(),
  add column bild_stand timestamptz not null default now();
alter table public.lq_teil add constraint lq_teil_bonus_check
  check (bonus_muenzen between 0 and 20 and bonus_herz between 0 and 2);
update public.lq_teil set herkunft = case when start then 'start' else 'truhe_laden' end;
alter table public.lq_teil drop column start;

insert into public.lq_teil (id, slot, seltenheit, herkunft, bonus_muenzen, bonus_herz, name) values
  ('kurzhaar', 'frisur', 0, 'start', 0, 0, 'Kurze Haare'),
  ('zopf', 'frisur', 0, 'start', 0, 0, 'Zopf'),
  ('locken', 'frisur', 0, 'truhe_laden', 0, 0, 'Locken'),
  ('dutt', 'frisur', 0, 'truhe_laden', 0, 0, 'Dutt'),
  ('langhaar', 'frisur', 1, 'truhe_laden', 0, 0, 'Lange Haare'),
  ('irokese', 'frisur', 2, 'truhe', 0, 0, 'Irokese'),
  ('wollmuetze', 'kopf', 0, 'truhe_laden', 0, 0, 'Wollmütze'),
  ('stirnband', 'kopf', 1, 'truhe_laden', 0, 0, 'Stirnband'),
  ('ritterhelm', 'kopf', 1, 'truhe_laden', 0, 0, 'Ritterhelm'),
  ('entdeckerhut', 'kopf', 2, 'truhe_laden', 5, 0, 'Entdeckerhut'),
  ('piratenhut', 'kopf', 2, 'truhe_laden', 0, 0, 'Piratenhut'),
  ('zauberhut', 'kopf', 3, 'truhe_laden', 10, 0, 'Zauberhut'),
  ('krone', 'kopf', 4, 'truhe_laden', 10, 1, 'Krone'),
  ('punktaugen', 'augen', 0, 'start', 0, 0, 'Punktaugen'),
  ('froehlich', 'augen', 0, 'truhe_laden', 0, 0, 'Fröhliche Augen'),
  ('brille', 'augen', 1, 'truhe_laden', 0, 0, 'Brille'),
  ('sternaugen', 'augen', 2, 'truhe_laden', 0, 0, 'Sternaugen'),
  ('sonnenbrille', 'augen', 2, 'truhe_laden', 0, 0, 'Sonnenbrille'),
  ('funkelaugen', 'augen', 3, 'truhe_laden', 5, 0, 'Funkelaugen'),
  ('tshirt', 'kleidung', 0, 'start', 0, 0, 'T-Shirt'),
  ('pulli', 'kleidung', 0, 'truhe_laden', 0, 0, 'Pulli'),
  ('latzhose', 'kleidung', 0, 'truhe_laden', 0, 0, 'Latzhose'),
  ('weste', 'kleidung', 1, 'truhe_laden', 0, 0, 'Entdeckerweste'),
  ('ruestung', 'kleidung', 2, 'truhe_laden', 0, 1, 'Ritterrüstung'),
  ('sternenmantel', 'kleidung', 2, 'truhe_laden', 0, 1, 'Sternenmantel'),
  ('zauberrobe', 'kleidung', 3, 'truhe_laden', 10, 0, 'Zauberrobe'),
  ('goldruestung', 'kleidung', 4, 'truhe_laden', 10, 1, 'Goldrüstung'),
  ('lupe', 'werkzeug', 0, 'truhe_laden', 0, 0, 'Lupe'),
  ('buch', 'werkzeug', 0, 'truhe_laden', 0, 0, 'Buch'),
  ('fernrohr', 'werkzeug', 1, 'truhe_laden', 0, 0, 'Fernrohr'),
  ('kompass', 'werkzeug', 2, 'truhe_laden', 5, 0, 'Kompass'),
  ('zauberstab', 'werkzeug', 3, 'truhe_laden', 0, 1, 'Zauberstab'),
  ('sternenschwert', 'werkzeug', 4, 'truhe_laden', 5, 1, 'Sternenschwert'),
  ('schnecke', 'begleiter', 0, 'truhe_laden', 0, 0, 'Schnecke'),
  ('katze', 'begleiter', 1, 'truhe_laden', 0, 0, 'Katze'),
  ('eule', 'begleiter', 2, 'truhe_laden', 5, 0, 'Eule'),
  ('fuchs', 'begleiter', 2, 'truhe_laden', 0, 0, 'Fuchs'),
  ('roboter', 'begleiter', 3, 'truhe_laden', 0, 1, 'Roboter'),
  ('drache', 'begleiter', 4, 'truhe_laden', 10, 0, 'Drache'),
  ('wiese', 'hintergrund', 0, 'start', 0, 0, 'Wiese'),
  ('strand', 'hintergrund', 0, 'truhe_laden', 0, 0, 'Strand'),
  ('wald', 'hintergrund', 1, 'truhe_laden', 0, 0, 'Wald'),
  ('berge', 'hintergrund', 1, 'truhe_laden', 0, 0, 'Berge'),
  ('nacht', 'hintergrund', 2, 'truhe_laden', 0, 0, 'Sternennacht'),
  ('weltall', 'hintergrund', 3, 'truhe_laden', 5, 0, 'Weltall'),
  ('regenbogen', 'hintergrund', 4, 'truhe_laden', 10, 0, 'Regenbogen')
on conflict (id) do update set name = excluded.name, herkunft = excluded.herkunft;

create table public.lq_admin (
  besitzer text primary key,
  seit timestamptz not null default now()
);
alter table public.lq_admin enable row level security;
revoke all on public.lq_admin from anon, authenticated;

-- — Hilfen —

/** Ob einer der Schlüssel Admin des Katalogs ist. */
create function public.lq_ist_admin(p_schluessel text[]) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from public.lq_admin a where a.besitzer = any (public.lq_besitzer(p_schluessel)))
$$;

/** Das Startteil, das gilt, wenn auf einem Platz nichts gewählt ist: das mit der kleinsten id (wie ersterStart in teile.ts). */
create function public.lq_erster_start(p_slot text) returns text
language sql stable set search_path = '' as $$
  select t.id from public.lq_teil t where t.slot = p_slot and t.herkunft = 'start' order by t.id collate "C" limit 1
$$;

-- — Katalog lesen (alle, ohne Anmeldung: nichts darin ist geheim) —

/**
 * Alle Teile ohne Bilder, dazu die Bilder, die sich seit p_seit geändert haben (alle, wenn p_seit leer ist), und die
 * Serverzeit für das nächste p_seit. So lädt ein Gerät jedes Bild nur einmal.
 */
create function public.lq_katalog(p_seit timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'teile', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'slot', t.slot, 'name', t.name, 'seltenheit', t.seltenheit,
        'herkunft', t.herkunft, 'muenzen', t.bonus_muenzen, 'herz', t.bonus_herz, 'lage', t.lage) order by t.id collate "C")
      from public.lq_teil t), '[]'::jsonb),
    'bilder', coalesce((select jsonb_object_agg(t.id, jsonb_build_object('bild', t.bild, 'bildKurz', t.bild_kurz))
      from public.lq_teil t where p_seit is null or t.bild_stand > p_seit), '{}'::jsonb),
    'jetzt', now()
  )
$$;

-- — Katalog ändern (Lehrkraft) —

/** {admin: dieses Gerät darf ändern, frei: es gibt noch keinen Admin}. */
create function public.lq_katalog_recht(p_schluessel text[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('admin', public.lq_ist_admin(p_schluessel), 'frei', not exists (select 1 from public.lq_admin))
$$;

/** Macht die Schlüssel des Geräts zu Admins, aber nur, solange es noch keinen gibt (oder sie es schon sind). */
create function public.lq_katalog_uebernehmen(p_schluessel text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  h text;
begin
  lock table public.lq_admin in exclusive mode;
  if exists (select 1 from public.lq_admin) and not public.lq_ist_admin(p_schluessel) then
    raise exception 'zugang';
  end if;
  foreach h in array public.lq_besitzer(p_schluessel) loop
    insert into public.lq_admin (besitzer) values (h) on conflict do nothing;
  end loop;
end;
$$;

/**
 * Legt ein Teil an oder ändert es. p_teil: {id, slot, name, seltenheit, herkunft, muenzen, herz, lage}, dazu
 * 'bild' / 'bildKurz' nur, wenn sie sich ändern (null entfernt das Bild). Der Platz eines bestehenden Teils bleibt.
 * Verliert ein Teil „start“, behalten es die Kinder, die es gerade tragen (auch ohne eigene Wahl auf dem Platz).
 */
create function public.lq_teil_speichern(p_schluessel text[], p_teil jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  alt public.lq_teil;
  v_id text := p_teil ->> 'id';
  v_slot text := p_teil ->> 'slot';
  v_her text := p_teil ->> 'herkunft';
  v_name text := btrim(coalesce(p_teil ->> 'name', ''));
  v_sel int;
  v_m int;
  v_h int;
  v_lage jsonb := p_teil -> 'lage';
  war_erster boolean;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if jsonb_typeof(p_teil) <> 'object' or v_id is null or v_id !~ '^[a-z0-9-]{1,40}$'
     or v_slot not in ('hintergrund', 'frisur', 'kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter')
     or v_her not in ('start', 'truhe', 'truhe_laden', 'laden', 'keine')
     or char_length(v_name) not between 1 and 40
     or jsonb_typeof(p_teil -> 'seltenheit') <> 'number' or jsonb_typeof(p_teil -> 'muenzen') <> 'number'
     or jsonb_typeof(p_teil -> 'herz') <> 'number' then
    raise exception 'ungueltig';
  end if;
  v_sel := (p_teil ->> 'seltenheit')::int;
  v_m := (p_teil ->> 'muenzen')::int;
  v_h := (p_teil ->> 'herz')::int;
  if v_sel not between 0 and 4 or v_m not between 0 and 20 or v_h not between 0 and 2 then raise exception 'ungueltig'; end if;
  if v_lage is not null and jsonb_typeof(v_lage) <> 'null' then
    if jsonb_typeof(v_lage) <> 'object' or jsonb_typeof(v_lage -> 'x') <> 'number' or jsonb_typeof(v_lage -> 'y') <> 'number'
       or jsonb_typeof(v_lage -> 's') <> 'number' or abs((v_lage ->> 'x')::numeric) > 50 or abs((v_lage ->> 'y')::numeric) > 50
       or (v_lage ->> 's')::numeric not between 0.4 and 2.5 then
      raise exception 'ungueltig';
    end if;
    v_lage := jsonb_build_object('x', (v_lage ->> 'x')::numeric, 'y', (v_lage ->> 'y')::numeric, 's', (v_lage ->> 's')::numeric);
  else
    v_lage := null;
  end if;

  select * into alt from public.lq_teil t where t.id = v_id for update;
  if alt.id is null then
    if (select count(*) from public.lq_teil) >= 500 then raise exception 'voll'; end if;
    insert into public.lq_teil (id, slot, seltenheit, herkunft, bonus_muenzen, bonus_herz, name, lage)
      values (v_id, v_slot, v_sel, v_her, v_m, v_h, v_name, v_lage);
  else
    if alt.slot <> v_slot then raise exception 'ungueltig'; end if;
    -- Wer das Teil trägt, behält es, wenn es kein Startteil mehr ist.
    if alt.herkunft = 'start' and v_her <> 'start' then
      war_erster := public.lq_erster_start(v_slot) = v_id;
      update public.lq_kind c
         set inventar = case when v_id = any (c.inventar) then c.inventar else c.inventar || v_id end,
             avatar = c.avatar || jsonb_build_object(v_slot, v_id)
       where c.avatar ->> v_slot = v_id or (war_erster and not c.avatar ? v_slot);
    end if;
    update public.lq_teil set seltenheit = v_sel, herkunft = v_her, bonus_muenzen = v_m, bonus_herz = v_h, name = v_name,
      lage = v_lage, stand = now() where id = v_id;
  end if;
  -- Bilder nur, wenn mitgeschickt (die Prüfung des Formats macht die Tabelle).
  if p_teil ? 'bild' then
    update public.lq_teil set bild = p_teil ->> 'bild', bild_stand = now() where id = v_id;
  end if;
  if p_teil ? 'bildKurz' then
    update public.lq_teil set bild_kurz = case when v_slot = 'frisur' then p_teil ->> 'bildKurz' end, bild_stand = now() where id = v_id;
  end if;
end;
$$;

-- — Truhe, Laden, Avatar: jetzt nach Herkunft —

/**
 * Wie bisher (55 / 28 / 12 / 4 / 1 %, Garantie nach 4 Truhen ohne Seltenes), aber nur aus Teilen mit Herkunft
 * truhe oder truhe_laden. Gibt es in der gezogenen Seltenheit keines, das nächste daneben (zählt dann mit dessen
 * Seltenheit). Fehler 'leer', wenn es gar keine Truhen-Teile gibt.
 */
create or replace function public.lq_truhe_oeffnen(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  r double precision := random() * 100;
  s int;
  t public.lq_teil;
  doppelt boolean;
  wert int := 0;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  if k.truhen < 1 then raise exception 'ungueltig'; end if;
  s := case when r < 55 then 0 when r < 83 then 1 when r < 95 then 2 when r < 99 then 3 else 4 end;
  if s < 2 and k.pech >= 4 then
    r := random() * 17;
    s := case when r < 12 then 2 when r < 16 then 3 else 4 end;
  end if;
  select * into t from public.lq_teil x where x.herkunft in ('truhe', 'truhe_laden')
   order by abs(x.seltenheit - s), x.seltenheit desc, random() limit 1;
  if t.id is null then raise exception 'leer'; end if;
  s := t.seltenheit;
  doppelt := t.id = any (k.inventar);
  if doppelt then wert := (array[10, 20, 40, 80, 150])[s + 1]; end if;
  update public.lq_kind set truhen = truhen - 1, pech = case when s >= 2 then 0 else pech + 1 end,
    inventar = case when doppelt then inventar else inventar || t.id end, muenzen = muenzen + wert
   where id = k.id returning * into k;
  return jsonb_build_object('teil', t.id, 'seltenheit', s, 'doppelt', doppelt, 'muenzen', wert, 'stand', public.lq_stand_json(k));
end;
$$;

/** Kauft ein Teil im Laden (Herkunft laden oder truhe_laden): 40 / 80 / 160 / 320 / 800 Münzen. */
create or replace function public.lq_kaufen(p_token text, p_teil text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  t public.lq_teil;
  preis int;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select * into t from public.lq_teil x where x.id = p_teil and x.herkunft in ('laden', 'truhe_laden');
  if t.id is null or t.id = any (k.inventar) then raise exception 'ungueltig'; end if;
  preis := (array[40, 80, 160, 320, 800])[t.seltenheit + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  update public.lq_kind set muenzen = muenzen - preis, inventar = inventar || t.id where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;

/** Legt Teile an: je Platz ein Teil, das das Kind hat (oder ein Startteil), '' für nichts; Haut- und Haarfarbe 0–5. */
create or replace function public.lq_avatar_setzen(p_token text, p_avatar jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  e record;
  a jsonb := '{}'::jsonb;
begin
  if p_avatar is null or jsonb_typeof(p_avatar) <> 'object' then raise exception 'ungueltig'; end if;
  for e in select key, value from jsonb_each(p_avatar) loop
    if e.key in ('haut', 'haar') then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::numeric not in (0, 1, 2, 3, 4, 5) then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object(e.key, (e.value::text)::int);
    elsif e.key in ('hintergrund', 'frisur', 'kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter') and jsonb_typeof(e.value) = 'string' then
      if e.value #>> '{}' <> '' and not exists (select 1 from public.lq_teil t where t.id = e.value #>> '{}' and t.slot = e.key
          and (t.herkunft = 'start' or t.id = any (k.inventar))) then
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

-- lq_bonus zählt nur echte Plätze (nicht Haut- und Haarfarbe).
create or replace function public.lq_bonus(p_avatar jsonb, out muenzen int, out herz int)
language sql stable set search_path = '' as $$
  select least(20, coalesce(sum(t.bonus_muenzen), 0))::int, least(2, coalesce(sum(t.bonus_herz), 0))::int
  from public.lq_teil t
  where t.id in (select value from jsonb_each_text(coalesce(p_avatar, '{}'::jsonb)) where key not in ('haut', 'haar'))
$$;

revoke execute on function public.lq_ist_admin(text[]), public.lq_erster_start(text) from public, anon, authenticated;
