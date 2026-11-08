-- Lernquest: Bosskampf mit Antwortkarten (wie Plickers), Entscheidungen in docs/lernquest.md „Bosskampf mit Karten“.
-- Entweder-oder je Kampf: Beim Start wählt die Lehrkraft „mit Geräten“ (wie bisher) oder „mit Karten“. Mit Karten
-- halten die Kinder ihre Karte hoch, die Lehrkraft scannt (eigenes Gerät, Schlüssel der Lehrkraft) und schickt die
-- erkannten Antworten je Kind. Kein Zeitlimit; bis „Auflösen“ zählt der letzte Scan. Beim Auflösen rechnet der Server:
-- 15 Schaden je richtiger Karte (+ Ausrüstungs-Bonus), ab 3 richtig in Folge doppelt; Herzen, Truhe und Klassenpunkte
-- wie bisher. Beigetreten ist, wessen Karte im Kampf einmal erkannt wurde; der Boss wächst dann um seinen Anteil der
-- übrigen Fragen. Kinder-Geräte treten einem Kartenkampf nicht bei.
-- Gleich in src/lernquest/rules.ts (BOSS_KARTE_SCHADEN, bossKartenSchaden).

alter table public.lq_boss add column modus text not null default 'geraete' check (modus in ('geraete', 'karten'));

/**
 * Löst die laufende Frage auf (nur einmal: wer zuerst sperrt). Mit Karten wird erst hier der Schaden gerechnet.
 * Herz weg bei weniger als der Hälfte richtig, Serien ohne Antwort zurück auf 0; fällt der Boss, gibt es Truhe und
 * Klassenpunkte für alle, die mitgemacht haben, nur beim ersten Sieg über diesen Region-Boss. Ein Boss ohne
 * Lebenspunkte, weil noch niemand beigetreten ist (Karten), ist nicht besiegt.
 */
create function public.lq_boss_aufloesen(p_boss uuid) returns public.lq_boss
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss;
  a record;
  n int;
  r int;
  h int;
  s int;
  sch int;
  summe int := 0;
  vorbei boolean;
  gefallen boolean;
begin
  select * into b from public.lq_boss x where x.id = p_boss for update;
  if b.id is null then raise exception 'ungueltig'; end if;
  if b.phase <> 'frage' then return b; end if;
  if b.modus = 'karten' then
    for a in
      select x.kind, x.richtig, c.avatar from public.lq_boss_antwort x join public.lq_kind c on c.id = x.kind
       where x.boss = b.id and x.frage = b.frage
    loop
      select k.serie into s from public.lq_boss_kind k where k.boss = b.id and k.kind = a.kind for update;
      s := case when a.richtig then coalesce(s, 0) + 1 else 0 end;
      sch := case when a.richtig then (15 + public.lq_bonus_schaden(a.avatar)) * case when s >= 3 then 2 else 1 end else 0 end;
      update public.lq_boss_antwort set schaden = sch where boss = b.id and kind = a.kind and frage = b.frage;
      update public.lq_boss_kind set serie = s where boss = b.id and kind = a.kind;
      summe := summe + sch;
    end loop;
    update public.lq_boss set lp = greatest(0, lp - summe) where id = b.id returning * into b;
  end if;
  select count(*) into n from public.lq_boss_kind k where k.boss = b.id;
  select count(*) into r from public.lq_boss_antwort x where x.boss = b.id and x.frage = b.frage and x.richtig;
  update public.lq_boss_kind k set serie = 0 where k.boss = b.id and k.serie <> 0
     and not exists (select 1 from public.lq_boss_antwort x where x.boss = b.id and x.kind = k.kind and x.frage = b.frage);
  h := b.herzen - case when r * 2 < n then 1 else 0 end;
  gefallen := b.lp <= 0 and b.lp_max > 0;
  vorbei := gefallen or h <= 0 or b.frage >= jsonb_array_length(b.fragen) - 1;
  update public.lq_boss set herzen = greatest(0, h), phase = case when vorbei then 'ende' else 'aufloesung' end,
    sieg = case when vorbei then gefallen else null end
   where id = b.id returning * into b;
  if b.sieg then
    with dabei as (
      select distinct x.kind from public.lq_boss_antwort x join public.lq_kind c on c.id = x.kind
       where x.boss = b.id and c.geloescht is null
    ), neu as (
      insert into public.lq_boss_sieg (kind, region) select d.kind, b.region from dabei d
      on conflict do nothing returning kind
    ), markiert as (
      update public.lq_boss_kind k set truhe = true where k.boss = b.id and k.kind in (select kind from neu) returning k.kind
    )
    update public.lq_kind c set truhen = c.truhen + 1, klassenpunkte = c.klassenpunkte + 2
     where c.id in (select kind from markiert);
  end if;
  return b;
end;
$$;

/** Wie in 20261108_lernquest_belohnungen.sql; das Auflösen steht jetzt in lq_boss_aufloesen. Mit Karten löst nur „Auflösen“ auf. */
create or replace function public.lq_boss_ticken(p_boss uuid) returns public.lq_boss
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss;
  n int;
begin
  select * into b from public.lq_boss x where x.id = p_boss;
  if b.id is null then raise exception 'ungueltig'; end if;
  if b.phase <> 'ende' and b.erstellt < now() - interval '3 hours' then
    update public.lq_boss set phase = 'ende', sieg = false where id = b.id and phase <> 'ende';
    select * into b from public.lq_boss x where x.id = p_boss;
    return b;
  end if;
  if b.phase <> 'frage' or b.modus = 'karten' then return b; end if;
  select count(*) into n from public.lq_boss_kind k where k.boss = b.id;
  if now() < b.start + interval '21.5 seconds'
     and (select count(*) from public.lq_boss_antwort a where a.boss = b.id and a.frage = b.frage) < n then
    return b;
  end if;
  return public.lq_boss_aufloesen(b.id);
end;
$$;

/** Wie bisher; mit Karten darf der Kampf ohne Beigetretene beginnen (sie treten mit dem ersten Scan bei). */
create or replace function public.lq_boss_weiter(p_schluessel text[], p_boss uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss := public.lq_boss_der_lehrkraft(p_schluessel, p_boss);
  n int;
begin
  select * into b from public.lq_boss x where x.id = b.id for update;
  if b.phase = 'warten' then
    select count(*) into n from public.lq_boss_kind k where k.boss = b.id;
    if n = 0 and b.modus <> 'karten' then raise exception 'leer'; end if;
    update public.lq_boss set frage = 0, phase = 'frage', start = now(),
      lp = 13 * n * jsonb_array_length(fragen), lp_max = 13 * n * jsonb_array_length(fragen)
     where id = b.id returning * into b;
  elsif b.phase = 'aufloesung' then
    update public.lq_boss set frage = frage + 1, phase = 'frage', start = now() where id = b.id returning * into b;
  elsif b.phase = 'frage' then
    -- Die Zeit läuft sofort ab; Antworten danach kommen zu spät.
    update public.lq_boss set start = now() - interval '1 minute' where id = b.id;
    b := public.lq_boss_aufloesen(b.id);
  end if;
  return public.lq_boss_json(b, null, true);
end;
$$;

/** Startet einen Kampf mit Karten (sonst wie lq_boss_starten). */
create function public.lq_boss_starten_karten(p_schluessel text[], p_klasse uuid, p_region text, p_titel text, p_boss int, p_fragen jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  neu uuid := public.lq_boss_starten(p_schluessel, p_klasse, p_region, p_titel, p_boss, p_fragen);
begin
  update public.lq_boss set modus = 'karten' where id = neu;
  return neu;
end;
$$;

/** Der laufende Kampf einer Klasse ({id, modus}) oder null, damit ein zweites Gerät der Lehrkraft scannen kann. */
create function public.lq_boss_laufend(p_schluessel text[], p_klasse uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  return (select jsonb_build_object('id', b.id, 'modus', b.modus) from public.lq_boss b
           where b.klasse = p_klasse and b.phase <> 'ende' and b.erstellt > now() - interval '3 hours' limit 1);
end;
$$;

/**
 * Gescannte Karten der Frage p_frage: {Kind-Id: Wahl}, höchstens 40 je Aufruf. Der letzte Scan zählt, bis aufgelöst
 * ist. Kinder, die nicht (mehr) in der Klasse sind, werden übergangen. Gibt {angenommen, neu: Zahl der Antworten}.
 */
create function public.lq_boss_karten(p_schluessel text[], p_boss uuid, p_frage int, p_antworten jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss := public.lq_boss_der_lehrkraft(p_schluessel, p_boss);
  e record;
  kid uuid;
  w int;
  ok int;
  zahl int := 0;
  f jsonb;
begin
  if b.modus <> 'karten' or p_antworten is null or jsonb_typeof(p_antworten) <> 'object'
     or (select count(*) from jsonb_object_keys(p_antworten)) > 40 then
    raise exception 'ungueltig';
  end if;
  select * into b from public.lq_boss x where x.id = b.id for update;
  if p_frage is null or b.phase <> 'frage' or b.frage <> p_frage then
    return jsonb_build_object('angenommen', false);
  end if;
  f := b.fragen -> b.frage;
  ok := (f ->> 'richtig')::int;
  for e in select key, value from jsonb_each(p_antworten) loop
    if e.key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}') !~ '^[0-9]$' then
      raise exception 'ungueltig';
    end if;
    w := (e.value #>> '{}')::int;
    if w >= jsonb_array_length(f -> 'optionen') then raise exception 'ungueltig'; end if;
    kid := e.key::uuid;
    continue when not exists (select 1 from public.lq_kind c where c.id = kid and c.klasse = b.klasse and c.geloescht is null);
    perform public.lq_boss_dazu(b, kid);
    insert into public.lq_boss_antwort (boss, kind, frage, wahl, richtig, schaden) values (b.id, kid, b.frage, w, w = ok, 0)
    on conflict (boss, kind, frage) do update set wahl = excluded.wahl, richtig = excluded.richtig;
    zahl := zahl + 1;
  end loop;
  return jsonb_build_object('angenommen', true, 'neu', zahl);
end;
$$;

/** Wie bisher, dazu der Modus; mit Karten am Beamer die Namen derer, deren Karte bei dieser Frage erkannt ist (nicht, was sie gewählt haben). */
create or replace function public.lq_boss_json(b public.lq_boss, p_kind uuid, p_beamer boolean) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  f jsonb := case when b.frage >= 0 then b.fragen -> b.frage end;
  offen boolean := b.phase in ('aufloesung', 'ende') and b.frage >= 0;
  ich public.lq_boss_kind;
  a public.lq_boss_antwort;
  out jsonb;
begin
  out := jsonb_build_object(
    'id', b.id, 'titel', b.titel, 'boss', b.boss, 'phase', b.phase, 'frage', b.frage, 'modus', b.modus,
    'fragen', jsonb_array_length(b.fragen), 'lp', b.lp, 'lpMax', b.lp_max, 'herzen', b.herzen, 'sieg', b.sieg,
    'rest', case when b.phase = 'frage' and b.modus = 'geraete' then greatest(0, round(extract(epoch from (b.start + interval '20 seconds' - now())) * 1000))::int else 0 end,
    'kinder', (select count(*) from public.lq_boss_kind k where k.boss = b.id),
    'antworten', (select count(*) from public.lq_boss_antwort x where x.boss = b.id and x.frage = b.frage),
    'optionen', coalesce(f -> 'optionen', '[]'::jsonb),
    'richtig', case when offen then f -> 'richtig' end
  );
  if p_beamer then
    out := out || jsonb_build_object(
      'klasse', (select l.name from public.lq_klasse l where l.id = b.klasse),
      'text', f ->> 'frage', 'aussage', f ->> 'aussage',
      'verteilung', case when offen then (
        select jsonb_agg((select count(*) from public.lq_boss_antwort x where x.boss = b.id and x.frage = b.frage and x.wahl = i) order by i)
        from generate_series(0, jsonb_array_length(f -> 'optionen') - 1) i) end,
      'truhen', (select count(*) from public.lq_boss_kind k where k.boss = b.id and k.truhe),
      'erkannt', case when b.modus = 'karten' and b.phase in ('frage', 'aufloesung') then coalesce((
        select jsonb_agg(c.name order by c.name) from public.lq_boss_antwort x join public.lq_kind c on c.id = x.kind
         where x.boss = b.id and x.frage = b.frage), '[]'::jsonb) end
    );
  end if;
  if p_kind is not null then
    select * into ich from public.lq_boss_kind k where k.boss = b.id and k.kind = p_kind;
    select * into a from public.lq_boss_antwort x where x.boss = b.id and x.kind = p_kind and x.frage = b.frage;
    out := out || jsonb_build_object(
      'dabei', ich.kind is not null,
      'serie', coalesce(ich.serie, 0),
      'truhe', coalesce(ich.truhe, false),
      'wahl', a.wahl,
      'schaden', case when offen then a.schaden end
    );
  end if;
  return out;
end;
$$;

-- — Kinder: ein Kartenkampf erscheint nicht auf den Geräten, Geräte treten ihm nicht bei und antworten nicht. —

create or replace function public.lq_boss_offen(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
begin
  return (select jsonb_build_object('id', b.id, 'titel', b.titel, 'boss', b.boss) from public.lq_boss b
           where b.klasse = k.klasse and b.phase <> 'ende' and b.modus = 'geraete' and b.erstellt > now() - interval '3 hours' limit 1);
end;
$$;

create or replace function public.lq_boss_stand(p_token text, p_boss uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  b public.lq_boss;
begin
  if not exists (select 1 from public.lq_boss x where x.id = p_boss and x.klasse = k.klasse) then raise exception 'ungueltig'; end if;
  b := public.lq_boss_ticken(p_boss);
  if b.modus = 'geraete' then perform public.lq_boss_dazu(b, k.id); end if;
  select * into b from public.lq_boss x where x.id = p_boss;
  return public.lq_boss_json(b, k.id, false);
end;
$$;

-- Wie in 20261111_lernquest_schaden.sql, nur ohne Kartenkampf.
create or replace function public.lq_boss_antworten(p_token text, p_boss uuid, p_frage int, p_wahl int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  b public.lq_boss;
  f jsonb;
  s int;
  ok boolean;
  ms double precision;
  schaden int := 0;
begin
  if not exists (select 1 from public.lq_boss x where x.id = p_boss and x.klasse = k.klasse) then raise exception 'ungueltig'; end if;
  b := public.lq_boss_ticken(p_boss);
  if b.modus <> 'geraete' then return jsonb_build_object('angenommen', false); end if;
  perform public.lq_boss_dazu(b, k.id);
  select * into b from public.lq_boss x where x.id = p_boss for update;
  if p_frage is null or b.phase <> 'frage' or b.frage <> p_frage or now() > b.start + interval '21.5 seconds' then
    return jsonb_build_object('angenommen', false);
  end if;
  f := b.fragen -> b.frage;
  if p_wahl is null or p_wahl < 0 or p_wahl >= jsonb_array_length(f -> 'optionen') then raise exception 'ungueltig'; end if;
  if exists (select 1 from public.lq_boss_antwort a where a.boss = b.id and a.kind = k.id and a.frage = b.frage) then
    return jsonb_build_object('angenommen', false);
  end if;
  select x.serie into s from public.lq_boss_kind x where x.boss = b.id and x.kind = k.id for update;
  ok := p_wahl = (f ->> 'richtig')::int;
  s := case when ok then s + 1 else 0 end;
  if ok then
    ms := greatest(0, extract(epoch from (now() - b.start)) * 1000);
    schaden := ((10 + round((10 * greatest(0, 1 - ms / 20000))::numeric))::int + public.lq_bonus_schaden(k.avatar))
      * case when s >= 3 then 2 else 1 end;
  end if;
  insert into public.lq_boss_antwort (boss, kind, frage, wahl, richtig, schaden) values (b.id, k.id, b.frage, p_wahl, ok, schaden);
  update public.lq_boss_kind set serie = s where boss = b.id and kind = k.id;
  if schaden > 0 then update public.lq_boss set lp = greatest(0, lp - schaden) where id = b.id; end if;
  return jsonb_build_object('angenommen', true);
end;
$$;

revoke execute on function public.lq_boss_aufloesen(uuid) from public, anon, authenticated;
