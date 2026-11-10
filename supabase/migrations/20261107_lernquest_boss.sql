-- Lernquest, Stufe 3 „Bosskampf“ (Projekt „baukasten“). Freigegeben von der Lehrkraft am 06.11.2026.
-- Die Klasse kämpft gemeinsam gegen einen Boss: Die Lehrkraft startet am Beamer, die Kinder treten mit ihrem Konto bei,
-- die Frage steht am Beamer, die Antwort kommt vom Gerät. Der Server prüft die Antworten (die Lösungen verlassen ihn
-- erst nach der Frage), rechnet Schaden, Lebenspunkte und Herzen und vergibt die Truhen. Beamer und Geräte fragen jede
-- Sekunde nach (kein Realtime-Kanal: der wäre ohne Anmeldung mitlesbar).
-- Die Regeln stehen gleich in src/lernquest/rules.ts (bossSchaden, bossLp, bossTrifft):
--   10 Fragen, 20 s je Frage (+1,5 s Nachfrist fürs Netz), Schaden 10 + bis 10 fürs Tempo, ab 3 richtig in Folge doppelt;
--   Lebenspunkte 13 je Kind und Frage; 5 Herzen, eins weg, wenn weniger als die Hälfte der Beigetretenen richtig liegt.
--   Fällt der Boss, bekommt jedes Kind, das mindestens eine Frage beantwortet hat, eine Truhe – nur beim ersten Sieg
--   über den Boss dieser Region.

create table public.lq_boss (
  id uuid primary key default gen_random_uuid(),
  klasse uuid not null references public.lq_klasse (id) on delete cascade,
  -- Modul-Id der Region (für „einmal je Region“) und Titel für die Anzeige
  region text not null check (char_length(region) between 1 and 64),
  titel text not null check (char_length(titel) <= 120),
  boss int not null check (boss between 0 and 9),
  -- [{frage, aussage, optionen[2–4], richtig}]
  fragen jsonb not null,
  frage int not null default -1,
  phase text not null default 'warten' check (phase in ('warten', 'frage', 'aufloesung', 'ende')),
  start timestamptz,
  lp int not null default 0,
  lp_max int not null default 0,
  herzen int not null default 5,
  sieg boolean,
  erstellt timestamptz not null default now()
);
-- Je Klasse höchstens ein laufender Kampf.
create unique index lq_boss_laeuft on public.lq_boss (klasse) where phase <> 'ende';

create table public.lq_boss_kind (
  boss uuid not null references public.lq_boss (id) on delete cascade,
  kind uuid not null references public.lq_kind (id) on delete cascade,
  serie int not null default 0,
  truhe boolean not null default false,
  primary key (boss, kind)
);
create index lq_boss_kind_kind on public.lq_boss_kind (kind);

create table public.lq_boss_antwort (
  boss uuid not null,
  kind uuid not null,
  frage int not null,
  wahl int not null,
  richtig boolean not null,
  schaden int not null,
  primary key (boss, kind, frage),
  foreign key (boss, kind) references public.lq_boss_kind (boss, kind) on delete cascade
);

-- Welches Kind welchen Region-Boss schon besiegt hat (für „Truhe nur beim ersten Sieg“).
create table public.lq_boss_sieg (
  kind uuid not null references public.lq_kind (id) on delete cascade,
  region text not null,
  primary key (kind, region)
);

alter table public.lq_boss enable row level security;
alter table public.lq_boss_kind enable row level security;
alter table public.lq_boss_antwort enable row level security;
alter table public.lq_boss_sieg enable row level security;
revoke all on public.lq_boss, public.lq_boss_kind, public.lq_boss_antwort, public.lq_boss_sieg from anon, authenticated;

-- — Hilfen (nicht von außen aufrufbar) —

/** Prüft die Fragen eines Kampfes: 3–20 Stück, Texte begrenzt, 2–4 Antworten, die richtige im Bereich. */
create function public.lq_boss_fragen_ok(p jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  f jsonb;
  o jsonb;
  n int;
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) not between 3 and 20 or octet_length(p::text) > 60000 then
    return false;
  end if;
  for f in select value from jsonb_array_elements(p) loop
    if jsonb_typeof(f) <> 'object' or jsonb_typeof(f -> 'frage') <> 'string' or jsonb_typeof(f -> 'aussage') <> 'string'
       or char_length(f ->> 'frage') > 300 or char_length(f ->> 'aussage') > 300
       or jsonb_typeof(f -> 'optionen') <> 'array' or jsonb_typeof(f -> 'richtig') <> 'number' then
      return false;
    end if;
    n := jsonb_array_length(f -> 'optionen');
    if n not between 2 and 4 or (f ->> 'richtig') !~ '^[0-9]$' or (f ->> 'richtig')::int >= n then return false; end if;
    for o in select value from jsonb_array_elements(f -> 'optionen') loop
      if jsonb_typeof(o) <> 'string' or char_length(o #>> '{}') not between 1 and 120 then return false; end if;
    end loop;
  end loop;
  return true;
end;
$$;

/**
 * Der Kampf, weitergedreht: Ist die Zeit der Frage um oder haben alle Beigetretenen geantwortet, wird sie aufgelöst
 * (Herz weg bei weniger als der Hälfte richtig, Serien ohne Antwort zurück auf 0); fällt dabei der Boss, gibt es die
 * Truhen. Ein Kampf, der seit 3 Stunden läuft, ist vorbei. Jeder Abruf (Beamer oder Gerät) dreht mit.
 */
create function public.lq_boss_ticken(p_boss uuid) returns public.lq_boss
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss;
  n int;
  r int;
  h int;
  vorbei boolean;
begin
  select * into b from public.lq_boss x where x.id = p_boss;
  if b.id is null then raise exception 'ungueltig'; end if;
  if b.phase <> 'ende' and b.erstellt < now() - interval '3 hours' then
    update public.lq_boss set phase = 'ende', sieg = false where id = b.id and phase <> 'ende';
    select * into b from public.lq_boss x where x.id = p_boss;
    return b;
  end if;
  if b.phase <> 'frage' then return b; end if;
  select count(*) into n from public.lq_boss_kind k where k.boss = b.id;
  if now() < b.start + interval '21.5 seconds'
     and (select count(*) from public.lq_boss_antwort a where a.boss = b.id and a.frage = b.frage) < n then
    return b;
  end if;
  -- Auflösen, nur einmal: wer zuerst sperrt, löst auf.
  select * into b from public.lq_boss x where x.id = p_boss for update;
  if b.phase <> 'frage' then return b; end if;
  select count(*) into n from public.lq_boss_kind k where k.boss = b.id;
  select count(*) into r from public.lq_boss_antwort a where a.boss = b.id and a.frage = b.frage and a.richtig;
  update public.lq_boss_kind k set serie = 0 where k.boss = b.id and k.serie <> 0
     and not exists (select 1 from public.lq_boss_antwort a where a.boss = b.id and a.kind = k.kind and a.frage = b.frage);
  h := b.herzen - case when r * 2 < n then 1 else 0 end;
  vorbei := b.lp <= 0 or h <= 0 or b.frage >= jsonb_array_length(b.fragen) - 1;
  update public.lq_boss set herzen = greatest(0, h), phase = case when vorbei then 'ende' else 'aufloesung' end,
    sieg = case when vorbei then b.lp <= 0 else null end
   where id = b.id returning * into b;
  if b.sieg then
    -- Truhe für alle, die mitgemacht haben (mindestens eine Antwort), nur beim ersten Sieg über diesen Region-Boss.
    with dabei as (
      select distinct a.kind from public.lq_boss_antwort a join public.lq_kind c on c.id = a.kind
       where a.boss = b.id and c.geloescht is null
    ), neu as (
      insert into public.lq_boss_sieg (kind, region) select d.kind, b.region from dabei d
      on conflict do nothing returning kind
    ), markiert as (
      update public.lq_boss_kind k set truhe = true where k.boss = b.id and k.kind in (select kind from neu) returning k.kind
    )
    update public.lq_kind c set truhen = c.truhen + 1 where c.id in (select kind from markiert);
  end if;
  return b;
end;
$$;

/** Ein Kind tritt bei. Kommt es später dazu, wächst der Boss um seinen Anteil der übrigen Fragen. */
create function public.lq_boss_dazu(b public.lq_boss, p_kind uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  rest int;
begin
  if b.phase = 'ende' then return; end if;
  insert into public.lq_boss_kind (boss, kind) values (b.id, p_kind) on conflict do nothing;
  if found and b.phase <> 'warten' then
    rest := jsonb_array_length(b.fragen) - b.frage - case when b.phase = 'aufloesung' then 1 else 0 end;
    update public.lq_boss set lp = lp + 13 * rest, lp_max = lp_max + 13 * rest where id = b.id;
  end if;
end;
$$;

/** Der Kampf, wie ihn alle sehen; mit p_kind dazu die eigene Antwort, Serie und Truhe; mit p_beamer Fragetext und Zählungen. */
create function public.lq_boss_json(b public.lq_boss, p_kind uuid, p_beamer boolean) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  f jsonb := case when b.frage >= 0 then b.fragen -> b.frage end;
  offen boolean := b.phase in ('aufloesung', 'ende') and b.frage >= 0;
  ich public.lq_boss_kind;
  a public.lq_boss_antwort;
  out jsonb;
begin
  out := jsonb_build_object(
    'id', b.id, 'titel', b.titel, 'boss', b.boss, 'phase', b.phase, 'frage', b.frage,
    'fragen', jsonb_array_length(b.fragen), 'lp', b.lp, 'lpMax', b.lp_max, 'herzen', b.herzen, 'sieg', b.sieg,
    'rest', case when b.phase = 'frage' then greatest(0, round(extract(epoch from (b.start + interval '20 seconds' - now())) * 1000))::int else 0 end,
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
      'truhen', (select count(*) from public.lq_boss_kind k where k.boss = b.id and k.truhe)
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

/** Der Kampf einer Lehrkraft (Klasse gehört einem der Schlüssel). */
create function public.lq_boss_der_lehrkraft(p_schluessel text[], p_boss uuid) returns public.lq_boss
language plpgsql security definer set search_path = '' as $$
declare
  c uuid;
begin
  select x.klasse into c from public.lq_boss x where x.id = p_boss;
  if c is null then raise exception 'ungueltig'; end if;
  perform public.lq_klasse_pruefen(p_schluessel, c);
  return public.lq_boss_ticken(p_boss);
end;
$$;

-- — Lehrkraft (Beamer) —

/** Startet einen Kampf (ein laufender der Klasse endet ohne Truhe). Die Fragen macht das Gerät der Lehrkraft. */
create function public.lq_boss_starten(p_schluessel text[], p_klasse uuid, p_region text, p_titel text, p_boss int, p_fragen jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  neu uuid;
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_region is null or char_length(p_region) not between 1 and 64 or p_titel is null or char_length(p_titel) > 120
     or p_boss is null or p_boss not between 0 and 9 or not public.lq_boss_fragen_ok(p_fragen) then
    raise exception 'ungueltig';
  end if;
  if exists (select 1 from public.lq_klasse l where l.id = p_klasse and l.geloescht is not null) then raise exception 'ungueltig'; end if;
  update public.lq_boss set phase = 'ende', sieg = false where klasse = p_klasse and phase <> 'ende';
  insert into public.lq_boss (klasse, region, titel, boss, fragen, herzen)
  values (p_klasse, p_region, p_titel, p_boss, p_fragen, 5) returning lq_boss.id into neu;
  return neu;
end;
$$;

/** Was der Beamer zeigt. */
create function public.lq_boss_beamer(p_schluessel text[], p_boss uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  return public.lq_boss_json(public.lq_boss_der_lehrkraft(p_schluessel, p_boss), null, true);
end;
$$;

/**
 * Weiter: aus dem Warten die erste Frage (Fehler 'leer', solange niemand beigetreten ist; die Lebenspunkte richten
 * sich nach den Beigetretenen), nach der Auflösung die nächste Frage, während einer Frage sofort auflösen.
 */
create function public.lq_boss_weiter(p_schluessel text[], p_boss uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss := public.lq_boss_der_lehrkraft(p_schluessel, p_boss);
  n int;
begin
  select * into b from public.lq_boss x where x.id = b.id for update;
  if b.phase = 'warten' then
    select count(*) into n from public.lq_boss_kind k where k.boss = b.id;
    if n = 0 then raise exception 'leer'; end if;
    update public.lq_boss set frage = 0, phase = 'frage', start = now(),
      lp = 13 * n * jsonb_array_length(fragen), lp_max = 13 * n * jsonb_array_length(fragen)
     where id = b.id returning * into b;
  elsif b.phase = 'aufloesung' then
    update public.lq_boss set frage = frage + 1, phase = 'frage', start = now() where id = b.id returning * into b;
  elsif b.phase = 'frage' then
    -- Die Zeit läuft sofort ab; Antworten danach kommen zu spät.
    update public.lq_boss set start = now() - interval '1 minute' where id = b.id;
    b := public.lq_boss_ticken(b.id);
  end if;
  return public.lq_boss_json(b, null, true);
end;
$$;

/** Bricht einen Kampf ab (ohne Truhe). */
create function public.lq_boss_beenden(p_schluessel text[], p_boss uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.lq_boss := public.lq_boss_der_lehrkraft(p_schluessel, p_boss);
begin
  update public.lq_boss set phase = 'ende', sieg = coalesce(sieg, false) where id = b.id returning * into b;
  return public.lq_boss_json(b, null, true);
end;
$$;

-- — Kinder —

/** Der laufende Kampf der eigenen Klasse ({id, titel, boss}) oder null. */
create function public.lq_boss_offen(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
begin
  return (select jsonb_build_object('id', b.id, 'titel', b.titel, 'boss', b.boss) from public.lq_boss b
           where b.klasse = k.klasse and b.phase <> 'ende' and b.erstellt > now() - interval '3 hours' limit 1);
end;
$$;

/** Der Kampf für das Kind; der erste Abruf tritt bei. Die richtige Antwort steht erst nach der Frage darin. */
create function public.lq_boss_stand(p_token text, p_boss uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  b public.lq_boss;
begin
  if not exists (select 1 from public.lq_boss x where x.id = p_boss and x.klasse = k.klasse) then raise exception 'ungueltig'; end if;
  b := public.lq_boss_ticken(p_boss);
  perform public.lq_boss_dazu(b, k.id);
  select * into b from public.lq_boss x where x.id = p_boss;
  return public.lq_boss_json(b, k.id, false);
end;
$$;

/**
 * Antwort auf Frage p_frage: angenommen, solange die Frage läuft (20 s + 1,5 s Nachfrist), einmal je Frage.
 * Gibt {angenommen}; ob sie richtig war, zeigt der Stand nach der Frage.
 */
create function public.lq_boss_antworten(p_token text, p_boss uuid, p_frage int, p_wahl int) returns jsonb
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
    schaden := (10 + round((10 * greatest(0, 1 - ms / 20000))::numeric))::int * case when s >= 3 then 2 else 1 end;
  end if;
  insert into public.lq_boss_antwort (boss, kind, frage, wahl, richtig, schaden) values (b.id, k.id, b.frage, p_wahl, ok, schaden);
  update public.lq_boss_kind set serie = s where boss = b.id and kind = k.id;
  if schaden > 0 then update public.lq_boss set lp = greatest(0, lp - schaden) where id = b.id; end if;
  return jsonb_build_object('angenommen', true);
end;
$$;

revoke execute on function public.lq_boss_fragen_ok(jsonb), public.lq_boss_ticken(uuid), public.lq_boss_dazu(public.lq_boss, uuid),
  public.lq_boss_json(public.lq_boss, uuid, boolean), public.lq_boss_der_lehrkraft(text[], uuid) from public, anon, authenticated;

-- Aufräumen: Kämpfe nach 2 Tagen weg (die Siege je Region bleiben).
select cron.schedule('lernquest-bosse', '41 3 * * *', $$
  delete from public.lq_boss where erstellt < now() - interval '2 days';
$$);
