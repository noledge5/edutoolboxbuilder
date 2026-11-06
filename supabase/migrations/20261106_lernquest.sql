-- Lernquest, Stufe 1 (Projekt „baukasten“, Frankfurt). Freigegeben von der Lehrkraft am 06.11.2026.
-- Wie beim Abgleich: Tabellen ohne Zugriff von außen (RLS an, keine Policies), alles nur über Funktionen.
--   Lehrkraft: ein oder mehrere Lehrkraft-Schlüssel (64 Hex-Zeichen, auf dem Gerät erzeugt); der Server kennt nur
--              ihren SHA-256. Jede Lehrkraft-Funktion bekommt die Liste der Schlüssel des Geräts.
--   Kinder:    Klassencode → Namen → PIN (bcrypt). Die Anmeldung gibt ein Sitzungs-Token (nur als Hash gespeichert,
--              läuft nach 180 Tagen ab). 5 falsche PINs sperren das Konto, bis die Lehrkraft es freigibt.
--   Belohnungen (Erfahrung, Bestwerte je Runde, Lerntage) rechnet der Server; die Regeln stehen gleich in
--   src/lernquest/rules.ts (Tests dort).

create table public.lq_klasse (
  id uuid primary key default gen_random_uuid(),
  besitzer text not null,
  name text not null check (char_length(name) between 1 and 60),
  code text not null unique,
  erstellt timestamptz not null default now(),
  geloescht timestamptz
);
create index lq_klasse_besitzer on public.lq_klasse (besitzer);

create table public.lq_kind (
  id uuid primary key default gen_random_uuid(),
  klasse uuid not null references public.lq_klasse (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  pin_hash text not null,
  fehlversuche int not null default 0,
  gesperrt boolean not null default false,
  erstellt timestamptz not null default now(),
  zuletzt timestamptz,
  geloescht timestamptz,
  -- Spielstand
  xp int not null default 0,
  xp_tag date,
  xp_heute int not null default 0,
  -- {"bestwerte": {stunde: [prozent je Runde]}, "tage": ["2026-11-06", …], "leitner": {aufgabe: [kasten, fällig]}}
  daten jsonb not null default '{}'::jsonb
);
create index lq_kind_klasse on public.lq_kind (klasse);

create table public.lq_sitzung (
  token_hash text primary key,
  kind uuid not null references public.lq_kind (id) on delete cascade,
  ablauf timestamptz not null
);
create index lq_sitzung_kind on public.lq_sitzung (kind);

create table public.lq_paket (
  klasse uuid not null references public.lq_klasse (id) on delete cascade,
  stunde text not null check (char_length(stunde) between 1 and 64),
  daten jsonb not null,
  stand timestamptz not null default now(),
  primary key (klasse, stunde)
);

alter table public.lq_klasse enable row level security;
alter table public.lq_kind enable row level security;
alter table public.lq_sitzung enable row level security;
alter table public.lq_paket enable row level security;
revoke all on public.lq_klasse, public.lq_kind, public.lq_sitzung, public.lq_paket from anon, authenticated;

-- — Hilfsfunktionen (nicht von außen aufrufbar) —

create function public.lq_hash(p text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(p, 'sha256'), 'hex')
$$;

/** Die Hashes der gültigen Lehrkraft-Schlüssel aus der Liste; Fehler 'zugang', wenn keiner gültig aussieht. */
create function public.lq_besitzer(p_schluessel text[]) returns text[]
language plpgsql immutable set search_path = '' as $$
declare
  out text[] := '{}';
  k text;
begin
  if p_schluessel is null or cardinality(p_schluessel) = 0 or cardinality(p_schluessel) > 10 then
    raise exception 'zugang';
  end if;
  foreach k in array p_schluessel loop
    if k ~ '^[0-9a-f]{64}$' then out := out || public.lq_hash(k); end if;
  end loop;
  if cardinality(out) = 0 then raise exception 'zugang'; end if;
  return out;
end;
$$;

/** Prüft, dass die Klasse einem der Schlüssel gehört (auch im Papierkorb). */
create function public.lq_klasse_pruefen(p_schluessel text[], p_klasse uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  perform 1 from public.lq_klasse k where k.id = p_klasse and k.besitzer = any (public.lq_besitzer(p_schluessel));
  if not found then raise exception 'zugang'; end if;
end;
$$;

/** Die Klasse eines Kindes, wenn sie einem der Schlüssel gehört. */
create function public.lq_kind_pruefen(p_schluessel text[], p_kind uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  c uuid;
begin
  select k.klasse into c from public.lq_kind k join public.lq_klasse l on l.id = k.klasse
   where k.id = p_kind and l.besitzer = any (public.lq_besitzer(p_schluessel));
  if c is null then raise exception 'zugang'; end if;
  return c;
end;
$$;

/** Das Kind zu einem gültigen Sitzungs-Token (Kind und Klasse nicht gelöscht, Konto nicht gesperrt). */
create function public.lq_sitzung_pruefen(p_token text) returns public.lq_kind
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'sitzung'; end if;
  select c.* into k from public.lq_sitzung s
    join public.lq_kind c on c.id = s.kind
    join public.lq_klasse l on l.id = c.klasse
   where s.token_hash = public.lq_hash(p_token) and s.ablauf > now()
     and c.geloescht is null and l.geloescht is null;
  if k.id is null then raise exception 'sitzung'; end if;
  if k.gesperrt then raise exception 'gesperrt'; end if;
  return k;
end;
$$;

create function public.lq_neuer_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  abc constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  b bytea;
  c text;
  i int;
begin
  loop
    b := extensions.gen_random_bytes(8);
    c := '';
    for i in 0..7 loop c := c || substr(abc, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from public.lq_klasse k where k.code = c);
  end loop;
  return c;
end;
$$;

create function public.lq_pin_ok(p_pin text) returns boolean
language sql immutable set search_path = '' as $$
  select p_pin ~ '^[0-9]{4}$'
$$;

/** Der Spielstand eines Kindes, wie ihn das Kind sieht. */
create function public.lq_stand_json(k public.lq_kind) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'xp', k.xp,
    'xpHeute', case when k.xp_tag = (now() at time zone 'Europe/Berlin')::date then k.xp_heute else 0 end,
    'bestwerte', coalesce(k.daten -> 'bestwerte', '{}'::jsonb),
    'tage', coalesce(k.daten -> 'tage', '[]'::jsonb),
    'leitner', coalesce(k.daten -> 'leitner', '{}'::jsonb)
  )
$$;

-- — Lehrkraft —

create function public.lq_klassen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'code', l.code, 'geloescht', l.geloescht,
      'stunden', coalesce((select jsonb_agg(p.stunde) from public.lq_paket p where p.klasse = l.id), '[]'::jsonb),
      'kinder', coalesce((select jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'gesperrt', c.gesperrt, 'zuletzt', c.zuletzt, 'geloescht', c.geloescht,
          'xp', c.xp, 'bestwerte', coalesce(c.daten -> 'bestwerte', '{}'::jsonb), 'tage', coalesce(c.daten -> 'tage', '[]'::jsonb)
        ) order by c.name) from public.lq_kind c where c.klasse = l.id), '[]'::jsonb)
    ) order by l.name)
    from public.lq_klasse l where l.besitzer = any (b)
  ), '[]'::jsonb);
end;
$$;

create function public.lq_klasse_anlegen(p_schluessel text[], p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
  r public.lq_klasse;
begin
  if (select count(*) from public.lq_klasse k where k.besitzer = any (b)) >= 40 then raise exception 'voll'; end if;
  insert into public.lq_klasse (besitzer, name, code) values (b[1], btrim(p_name), public.lq_neuer_code()) returning * into r;
  return jsonb_build_object('id', r.id, 'code', r.code);
end;
$$;

create function public.lq_klasse_umbenennen(p_schluessel text[], p_klasse uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  update public.lq_klasse set name = btrim(p_name) where id = p_klasse;
end;
$$;

/** In den Papierkorb (p_weg = true) oder zurück (false). Im Papierkorb gilt keine Anmeldung. */
create function public.lq_klasse_loeschen(p_schluessel text[], p_klasse uuid, p_weg boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  update public.lq_klasse set geloescht = case when p_weg then now() end where id = p_klasse;
  if p_weg then delete from public.lq_sitzung s using public.lq_kind c where s.kind = c.id and c.klasse = p_klasse; end if;
end;
$$;

/** Endgültig weg, nur aus dem Papierkorb. */
create function public.lq_klasse_endgueltig(p_schluessel text[], p_klasse uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  delete from public.lq_klasse where id = p_klasse and geloescht is not null;
end;
$$;

create function public.lq_kind_anlegen(p_schluessel text[], p_klasse uuid, p_name text, p_pin text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  r uuid;
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if not public.lq_pin_ok(p_pin) then raise exception 'ungueltig'; end if;
  if (select count(*) from public.lq_kind c where c.klasse = p_klasse) >= 40 then raise exception 'voll'; end if;
  insert into public.lq_kind (klasse, name, pin_hash) values (p_klasse, btrim(p_name), extensions.crypt(p_pin, extensions.gen_salt('bf', 8)))
  returning id into r;
  return r;
end;
$$;

create function public.lq_kind_umbenennen(p_schluessel text[], p_kind uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_kind_pruefen(p_schluessel, p_kind);
  update public.lq_kind set name = btrim(p_name) where id = p_kind;
end;
$$;

/** Neue PIN: entsperrt das Konto und meldet alle Geräte des Kindes ab. */
create function public.lq_pin_setzen(p_schluessel text[], p_kind uuid, p_pin text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_kind_pruefen(p_schluessel, p_kind);
  if not public.lq_pin_ok(p_pin) then raise exception 'ungueltig'; end if;
  update public.lq_kind set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 8)), fehlversuche = 0, gesperrt = false where id = p_kind;
  delete from public.lq_sitzung where kind = p_kind;
end;
$$;

create function public.lq_entsperren(p_schluessel text[], p_kind uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_kind_pruefen(p_schluessel, p_kind);
  update public.lq_kind set fehlversuche = 0, gesperrt = false where id = p_kind;
end;
$$;

create function public.lq_kind_loeschen(p_schluessel text[], p_kind uuid, p_weg boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_kind_pruefen(p_schluessel, p_kind);
  update public.lq_kind set geloescht = case when p_weg then now() end where id = p_kind;
  if p_weg then delete from public.lq_sitzung where kind = p_kind; end if;
end;
$$;

/** Schaltet eine Stunde frei (oder erneuert ihr Lernpaket). Höchstens 300 kB je Paket, 200 Stunden je Klasse. */
create function public.lq_freischalten(p_schluessel text[], p_klasse uuid, p_stunde text, p_daten jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if jsonb_typeof(p_daten) <> 'object' or octet_length(p_daten::text) > 300000 then raise exception 'ungueltig'; end if;
  if (select count(*) from public.lq_paket p where p.klasse = p_klasse and p.stunde <> p_stunde) >= 200 then raise exception 'voll'; end if;
  insert into public.lq_paket (klasse, stunde, daten) values (p_klasse, p_stunde, p_daten)
  on conflict (klasse, stunde) do update set daten = excluded.daten, stand = now();
end;
$$;

create function public.lq_sperren(p_schluessel text[], p_klasse uuid, p_stunde text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  delete from public.lq_paket where klasse = p_klasse and stunde = p_stunde;
end;
$$;

-- — Kinder —

/** Name der Klasse und die Namen zum Antippen (ohne gesperrte Daten, ohne PINs). */
create function public.lq_klasse_oeffnen(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  l public.lq_klasse;
begin
  select * into l from public.lq_klasse k where k.code = upper(btrim(p_code)) and k.geloescht is null;
  if l.id is null then raise exception 'code'; end if;
  return jsonb_build_object('name', l.name, 'kinder', coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by c.name)
    from public.lq_kind c where c.klasse = l.id and c.geloescht is null), '[]'::jsonb));
end;
$$;

/** Anmeldung mit PIN: gibt ein neues Sitzungs-Token. Fehler 'pin' (noch Versuche) oder 'gesperrt'. */
create function public.lq_anmelden(p_code text, p_kind uuid, p_pin text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind;
  t text;
begin
  select c.* into k from public.lq_kind c join public.lq_klasse l on l.id = c.klasse
   where c.id = p_kind and l.code = upper(btrim(p_code)) and c.geloescht is null and l.geloescht is null
   for update of c;
  if k.id is null then raise exception 'code'; end if;
  if k.gesperrt then raise exception 'gesperrt'; end if;
  if p_pin is null or k.pin_hash <> extensions.crypt(p_pin, k.pin_hash) then
    update public.lq_kind set fehlversuche = fehlversuche + 1, gesperrt = fehlversuche + 1 >= 5 where id = k.id;
    -- Das Update soll bleiben, also kein Fehler: das Ergebnis sagt, wie es steht.
    return case when k.fehlversuche + 1 >= 5 then 'gesperrt' else 'pin:' || (4 - k.fehlversuche) end;
  end if;
  t := encode(extensions.gen_random_bytes(32), 'hex');
  delete from public.lq_sitzung where kind = k.id and ablauf < now();
  -- Höchstens 5 Geräte je Kind: die ältesten fallen weg.
  delete from public.lq_sitzung where token_hash in (
    select s.token_hash from public.lq_sitzung s where s.kind = k.id order by s.ablauf desc offset 4);
  insert into public.lq_sitzung (token_hash, kind, ablauf) values (public.lq_hash(t), k.id, now() + interval '180 days');
  update public.lq_kind set fehlversuche = 0, zuletzt = now() where id = k.id;
  return 'ok:' || t;
end;
$$;

create function public.lq_abmelden(p_token text) returns void
language sql security definer set search_path = '' as $$
  delete from public.lq_sitzung where p_token ~ '^[0-9a-f]{64}$' and token_hash = public.lq_hash(p_token)
$$;

/** Name, Klasse, Spielstand und die Lernpakete, die neuer sind als p_seit (alle bei null). */
create function public.lq_mein_stand(p_token text, p_seit timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
begin
  update public.lq_kind set zuletzt = now() where id = k.id;
  return jsonb_build_object(
    'name', k.name,
    'klasse', (select l.name from public.lq_klasse l where l.id = k.klasse),
    'stand', public.lq_stand_json(k),
    'stunden', coalesce((select jsonb_agg(p.stunde) from public.lq_paket p where p.klasse = k.klasse), '[]'::jsonb),
    'pakete', coalesce((select jsonb_agg(jsonb_build_object('stunde', p.stunde, 'stand', p.stand, 'daten', p.daten))
       from public.lq_paket p where p.klasse = k.klasse and (p_seit is null or p.stand > p_seit)), '[]'::jsonb),
    'jetzt', now()
  );
end;
$$;

/**
 * Meldet eine gespielte Runde. Der Server rechnet die Erfahrung (10 + 2 je richtige Antwort, +5 ohne Fehler,
 * höchstens 300 am Tag), den Bestwert der Runde und den Lerntag. p_stunde '' = Wiederholen (nur Erfahrung).
 * p_leitner: geänderte Karten {aufgabe: [kasten 1–5, fällig als Tag seit 1970]}; höchstens 3000 Karten.
 */
create function public.lq_runde_melden(p_token text, p_stunde text, p_runde int, p_richtig int, p_gesamt int, p_leitner jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  heute date := (now() at time zone 'Europe/Berlin')::date;
  schon int;
  plus int;
  d jsonb;
  best jsonb;
  prozent int;
  e record;
  tage jsonb;
begin
  if p_gesamt is null or p_gesamt < 1 or p_gesamt > 20 or p_richtig is null or p_richtig < 0 or p_richtig > p_gesamt
     or p_runde is null or p_runde < 0 or p_runde > 9 then
    raise exception 'ungueltig';
  end if;
  if p_stunde <> '' and not exists (select 1 from public.lq_paket p where p.klasse = k.klasse and p.stunde = p_stunde) then
    raise exception 'ungueltig';
  end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  schon := case when k.xp_tag = heute then k.xp_heute else 0 end;
  plus := least(10 + 2 * p_richtig + case when p_richtig = p_gesamt then 5 else 0 end, greatest(0, 300 - schon));
  d := k.daten;
  if p_stunde <> '' then
    prozent := round(100.0 * p_richtig / p_gesamt);
    best := coalesce(d -> 'bestwerte' -> p_stunde, '[]'::jsonb);
    while jsonb_array_length(best) <= p_runde loop best := best || '0'::jsonb; end loop;
    if prozent > (best ->> p_runde)::int then best := jsonb_set(best, array[p_runde::text], to_jsonb(prozent)); end if;
    d := jsonb_set(d, '{bestwerte}', coalesce(d -> 'bestwerte', '{}'::jsonb) || jsonb_build_object(p_stunde, best));
  end if;
  tage := coalesce(d -> 'tage', '[]'::jsonb);
  if not tage ? heute::text then
    tage := (select coalesce(jsonb_agg(x order by x), '[]'::jsonb) from (
      select x from jsonb_array_elements_text(tage || to_jsonb(heute::text)) x order by x desc limit 70) t);
  end if;
  d := jsonb_set(d, '{tage}', tage);
  if p_leitner is not null and jsonb_typeof(p_leitner) = 'object' then
    if (select count(*) from jsonb_object_keys(p_leitner)) > 200 then raise exception 'ungueltig'; end if;
    for e in select key, value from jsonb_each(p_leitner) loop
      if char_length(e.key) <= 160 and jsonb_typeof(e.value) = 'array' and jsonb_array_length(e.value) = 2
         and jsonb_typeof(e.value -> 0) = 'number' and jsonb_typeof(e.value -> 1) = 'number' then
        d := jsonb_set(d, '{leitner}', coalesce(d -> 'leitner', '{}'::jsonb) || jsonb_build_object(e.key,
          jsonb_build_array(greatest(1, least(5, (e.value ->> 0)::int)), (e.value ->> 1)::int)));
      end if;
    end loop;
    if (select count(*) from jsonb_object_keys(d -> 'leitner')) > 3000 then raise exception 'voll'; end if;
  end if;
  update public.lq_kind set xp = xp + plus, xp_tag = heute, xp_heute = schon + plus, daten = d, zuletzt = now()
   where id = k.id returning * into k;
  return jsonb_build_object('plus', plus, 'stand', public.lq_stand_json(k));
end;
$$;

-- Nur die Funktionen für Browser sind von außen aufrufbar.
revoke execute on function public.lq_hash(text), public.lq_besitzer(text[]), public.lq_klasse_pruefen(text[], uuid),
  public.lq_kind_pruefen(text[], uuid), public.lq_sitzung_pruefen(text), public.lq_neuer_code(), public.lq_pin_ok(text),
  public.lq_stand_json(public.lq_kind) from public, anon, authenticated;

-- Aufräumen: Papierkorb nach 30 Tagen, abgelaufene Sitzungen, gesperrte nie benutzte Konten nach 90 Tagen.
select cron.schedule('lernquest-aufraeumen', '23 3 * * *', $$
  delete from public.lq_klasse where geloescht < now() - interval '30 days';
  delete from public.lq_kind where geloescht < now() - interval '30 days';
  delete from public.lq_kind where gesperrt and zuletzt is null and erstellt < now() - interval '90 days';
  delete from public.lq_sitzung where ablauf < now();
$$);
