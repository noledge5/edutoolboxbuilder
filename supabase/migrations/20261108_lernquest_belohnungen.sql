-- Lernquest, Stufe 4 „Echte Belohnungen und Auswertung“ (Projekt „baukasten“). Freigegeben von der Lehrkraft am 06.11.2026.
-- Klassenpunkte gehören jedem Kind selbst (nicht die Münzen). Es gibt sie fürs Wochenziel (3, einmal je Woche, mit der
-- Wochen-Truhe), für einen gewonnenen Bosskampf (2, einmal je Region, mit der Boss-Truhe) und von der Lehrkraft von Hand
-- (höchstens 5 je Kind und Woche). Gutscheine je Klasse mit Preis und zwei Grenzen je Woche (je Kind, für die Klasse).
-- Beim Anfragen legt der Server die Punkte zurück; „eingelöst“ verbraucht sie, „abgelehnt“ oder „zurückgezogen“ gibt sie
-- zurück. Offene und eingelöste Anfragen zählen für die Grenzen. Die Regeln stehen gleich in src/lernquest/rules.ts
-- (PUNKTE_WOCHENZIEL, PUNKTE_BOSS, PUNKTE_HAND_WOCHE, gutscheinFrei).
-- Für die Auswertung je Kompetenz liefert lq_klassen die Wiederhol-Kästen; die Zuordnung Aufgabe → Kompetenz kennt nur
-- der Baukasten.

alter table public.lq_kind
  add column klassenpunkte int not null default 0 check (klassenpunkte >= 0),
  -- Von Hand vergebene Punkte in der Woche, die mit punkte_woche (Montag) beginnt.
  add column punkte_woche date,
  add column punkte_hand int not null default 0;

create table public.lq_gutschein (
  id uuid primary key default gen_random_uuid(),
  klasse uuid not null references public.lq_klasse (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  preis int not null check (preis between 1 and 999),
  -- Grenzen je Woche; null = ohne Grenze.
  je_kind int check (je_kind between 1 and 20),
  je_klasse int check (je_klasse between 1 and 99),
  aktiv boolean not null default true,
  erstellt timestamptz not null default now()
);
create index lq_gutschein_klasse on public.lq_gutschein (klasse);

create table public.lq_anfrage (
  id uuid primary key default gen_random_uuid(),
  gutschein uuid not null references public.lq_gutschein (id) on delete cascade,
  kind uuid not null references public.lq_kind (id) on delete cascade,
  -- Preis beim Anfragen (für die Rückgabe, falls die Lehrkraft den Preis später ändert).
  preis int not null check (preis >= 0),
  zustand text not null default 'offen' check (zustand in ('offen', 'eingeloest', 'abgelehnt', 'zurueck')),
  erstellt timestamptz not null default now(),
  erledigt timestamptz
);
create index lq_anfrage_gutschein on public.lq_anfrage (gutschein, erstellt);
create index lq_anfrage_kind on public.lq_anfrage (kind, erstellt);

alter table public.lq_gutschein enable row level security;
alter table public.lq_anfrage enable row level security;
revoke all on public.lq_gutschein, public.lq_anfrage from anon, authenticated;

-- — Hilfen (nicht von außen aufrufbar) —

/** Montag 0 Uhr dieser Woche, Berliner Zeit (wie wochenStart in rules.ts). */
create function public.lq_woche() returns timestamp
language sql stable set search_path = '' as $$
  select date_trunc('week', now() at time zone 'Europe/Berlin')
$$;

/** Anfragen, die in dieser Woche für die Grenzen zählen (offen oder eingelöst). */
create function public.lq_zaehlt(a public.lq_anfrage) returns boolean
language sql stable set search_path = '' as $$
  select a.zustand in ('offen', 'eingeloest') and (a.erstellt at time zone 'Europe/Berlin') >= public.lq_woche()
$$;

/** Prüft, dass der Gutschein einer Klasse der Schlüssel gehört; gibt die Klasse zurück. */
create function public.lq_gutschein_pruefen(p_schluessel text[], p_gutschein uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  c uuid;
begin
  select g.klasse into c from public.lq_gutschein g join public.lq_klasse l on l.id = g.klasse
   where g.id = p_gutschein and l.besitzer = any (public.lq_besitzer(p_schluessel));
  if c is null then raise exception 'zugang'; end if;
  return c;
end;
$$;

/** Gutscheine und eigene Anfragen, wie das Kind sie sieht. */
create function public.lq_gutscheine_json(k public.lq_kind) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'punkte', k.klassenpunkte,
    'gutscheine', coalesce((select jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'preis', g.preis, 'jeKind', g.je_kind, 'jeKlasse', g.je_klasse,
        'ich', (select count(*) from public.lq_anfrage a where a.gutschein = g.id and a.kind = k.id and public.lq_zaehlt(a)),
        'klasse', (select count(*) from public.lq_anfrage a where a.gutschein = g.id and public.lq_zaehlt(a))
      ) order by g.preis, g.name) from public.lq_gutschein g where g.klasse = k.klasse and g.aktiv), '[]'::jsonb),
    'anfragen', coalesce((select jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', g.name, 'preis', a.preis, 'zustand', a.zustand, 'erstellt', a.erstellt, 'erledigt', a.erledigt
      ) order by a.erstellt desc) from public.lq_anfrage a join public.lq_gutschein g on g.id = a.gutschein
       where a.kind = k.id and (a.zustand = 'offen' or a.erstellt > now() - interval '14 days')), '[]'::jsonb)
  )
$$;

-- — Spielstand: jetzt mit Klassenpunkten —

create or replace function public.lq_stand_json(k public.lq_kind) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'xp', k.xp,
    'xpHeute', case when k.xp_tag = (now() at time zone 'Europe/Berlin')::date then k.xp_heute else 0 end,
    'bestwerte', coalesce(k.daten -> 'bestwerte', '{}'::jsonb),
    'tage', coalesce(k.daten -> 'tage', '[]'::jsonb),
    'leitner', coalesce(k.daten -> 'leitner', '{}'::jsonb),
    'muenzen', k.muenzen,
    'muenzenHeute', case when k.muenzen_tag = (now() at time zone 'Europe/Berlin')::date then k.muenzen_heute else 0 end,
    'truhen', k.truhen,
    'pech', k.pech,
    'inventar', to_jsonb(k.inventar),
    'avatar', k.avatar,
    'klassenpunkte', k.klassenpunkte
  )
$$;

-- — Runde melden: Wochenziel bringt jetzt auch 3 Klassenpunkte —

/**
 * Wie in Stufe 2 (Erfahrung, Münzen, Bestwert, Lerntag, Karten, Truhen), dazu 3 Klassenpunkte, wenn das Wochenziel
 * (3 Lerntage) in dieser Woche zum ersten Mal erreicht ist – im selben Moment wie die Wochen-Truhe.
 */
create or replace function public.lq_runde_melden(p_token text, p_stunde text, p_runde int, p_richtig int, p_gesamt int, p_leitner jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  heute date := (now() at time zone 'Europe/Berlin')::date;
  woche date := date_trunc('week', (now() at time zone 'Europe/Berlin'))::date;
  schon int;
  plus int;
  m_schon int;
  m_plus int;
  m_roh int;
  t_plus int := 0;
  p_plus int := 0;
  b record;
  herzen int;
  d jsonb;
  best jsonb;
  prozent int;
  e record;
  tage jsonb;
  runden int;
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
  select * into b from public.lq_bonus(k.avatar);
  herzen := 3 + b.herz;
  m_roh := 5 + p_richtig + 2 * greatest(0, herzen - (p_gesamt - p_richtig));
  m_roh := m_roh + (m_roh * b.muenzen) / 100;
  m_schon := case when k.muenzen_tag = heute then k.muenzen_heute else 0 end;
  m_plus := least(m_roh, greatest(0, 200 - m_schon));
  d := k.daten;
  if p_stunde <> '' then
    prozent := round(100.0 * p_richtig / p_gesamt);
    best := coalesce(d -> 'bestwerte' -> p_stunde, '[]'::jsonb);
    while jsonb_array_length(best) <= p_runde loop best := best || '0'::jsonb; end loop;
    if prozent > (best ->> p_runde)::int then best := jsonb_set(best, array[p_runde::text], to_jsonb(prozent)); end if;
    d := jsonb_set(d, '{bestwerte}', coalesce(d -> 'bestwerte', '{}'::jsonb) || jsonb_build_object(p_stunde, best));
    -- Station ganz gespielt: jede Runde mit Bestwert über 0.
    select public.lq_runden(jsonb_array_length(coalesce(p.daten -> 'uebungen', '[]'::jsonb))) into runden
      from public.lq_paket p where p.klasse = k.klasse and p.stunde = p_stunde;
    if runden > 0 and not coalesce(d -> 'truheStationen', '[]'::jsonb) ? p_stunde
       and (select count(*) from generate_series(0, runden - 1) i where coalesce((best ->> i)::int, 0) > 0) = runden then
      t_plus := t_plus + 1;
      d := jsonb_set(d, '{truheStationen}', coalesce(d -> 'truheStationen', '[]'::jsonb) || to_jsonb(p_stunde));
    end if;
  end if;
  tage := coalesce(d -> 'tage', '[]'::jsonb);
  if not tage ? heute::text then
    tage := (select coalesce(jsonb_agg(x order by x), '[]'::jsonb) from (
      select x from jsonb_array_elements_text(tage || to_jsonb(heute::text)) x order by x desc limit 70) t);
  end if;
  d := jsonb_set(d, '{tage}', tage);
  if (select count(*) from jsonb_array_elements_text(tage) x where x::date >= woche) >= 3
     and not coalesce(d -> 'truheWochen', '[]'::jsonb) ? woche::text then
    t_plus := t_plus + 1;
    p_plus := 3;
    d := jsonb_set(d, '{truheWochen}', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
      select x from jsonb_array_elements_text(coalesce(d -> 'truheWochen', '[]'::jsonb) || to_jsonb(woche::text)) x order by x desc limit 20) t));
  end if;
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
  update public.lq_kind set xp = xp + plus, xp_tag = heute, xp_heute = schon + plus,
    muenzen = muenzen + m_plus, muenzen_tag = heute, muenzen_heute = m_schon + m_plus, truhen = truhen + t_plus,
    klassenpunkte = klassenpunkte + p_plus, daten = d, zuletzt = now()
   where id = k.id returning * into k;
  return jsonb_build_object('plus', plus, 'muenzenPlus', m_plus, 'truhenPlus', t_plus, 'punktePlus', p_plus,
    'stand', public.lq_stand_json(k));
end;
$$;

-- — Bosskampf: der Sieg bringt mit der Truhe auch 2 Klassenpunkte (einmal je Region) —

create or replace function public.lq_boss_ticken(p_boss uuid) returns public.lq_boss
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
    -- Truhe und 2 Klassenpunkte für alle, die mitgemacht haben (mindestens eine Antwort), nur beim ersten Sieg über
    -- diesen Region-Boss.
    with dabei as (
      select distinct a.kind from public.lq_boss_antwort a join public.lq_kind c on c.id = a.kind
       where a.boss = b.id and c.geloescht is null
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

-- — Lehrkraft —

/** Wie bisher, je Kind dazu Klassenpunkte und Wiederhol-Kästen (für die Auswertung), je Klasse die offenen Anfragen. */
create or replace function public.lq_klassen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'code', l.code, 'geloescht', l.geloescht,
      'stunden', coalesce((select jsonb_agg(p.stunde) from public.lq_paket p where p.klasse = l.id), '[]'::jsonb),
      'anfragen', (select count(*) from public.lq_anfrage a join public.lq_gutschein g on g.id = a.gutschein
                    join public.lq_kind c on c.id = a.kind
                    where g.klasse = l.id and a.zustand = 'offen' and c.geloescht is null),
      'kinder', coalesce((select jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'gesperrt', c.gesperrt, 'zuletzt', c.zuletzt, 'geloescht', c.geloescht,
          'xp', c.xp, 'bestwerte', coalesce(c.daten -> 'bestwerte', '{}'::jsonb), 'tage', coalesce(c.daten -> 'tage', '[]'::jsonb),
          'leitner', coalesce(c.daten -> 'leitner', '{}'::jsonb), 'klassenpunkte', c.klassenpunkte,
          'punkteHand', case when c.punkte_woche = public.lq_woche()::date then c.punkte_hand else 0 end
        ) order by c.name) from public.lq_kind c where c.klasse = l.id), '[]'::jsonb)
    ) order by l.name)
    from public.lq_klasse l where l.besitzer = any (b)
  ), '[]'::jsonb);
end;
$$;

/** Gutscheine der Klasse (mit Zahl dieser Woche) und Anfragen: offene und die der letzten 30 Tage. */
create function public.lq_belohnungen(p_schluessel text[], p_klasse uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  return jsonb_build_object(
    'gutscheine', coalesce((select jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'preis', g.preis, 'jeKind', g.je_kind, 'jeKlasse', g.je_klasse, 'aktiv', g.aktiv,
        'woche', (select count(*) from public.lq_anfrage a where a.gutschein = g.id and public.lq_zaehlt(a))
      ) order by g.preis, g.name) from public.lq_gutschein g where g.klasse = p_klasse), '[]'::jsonb),
    'anfragen', coalesce((select jsonb_agg(jsonb_build_object(
        'id', a.id, 'gutschein', a.gutschein, 'name', g.name, 'kind', a.kind, 'preis', a.preis, 'zustand', a.zustand,
        'erstellt', a.erstellt, 'erledigt', a.erledigt
      ) order by a.erstellt desc) from public.lq_anfrage a join public.lq_gutschein g on g.id = a.gutschein
       join public.lq_kind c on c.id = a.kind
       where g.klasse = p_klasse and c.geloescht is null
         and (a.zustand = 'offen' or a.erstellt > now() - interval '30 days')), '[]'::jsonb)
  );
end;
$$;

/** Legt einen Gutschein an (p_id null) oder ändert ihn. Höchstens 30 je Klasse. */
create function public.lq_gutschein_speichern(p_schluessel text[], p_klasse uuid, p_id uuid, p_name text, p_preis int,
  p_je_kind int, p_je_klasse int, p_aktiv boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  r uuid;
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_id is null then
    if (select count(*) from public.lq_gutschein g where g.klasse = p_klasse) >= 30 then raise exception 'voll'; end if;
    insert into public.lq_gutschein (klasse, name, preis, je_kind, je_klasse, aktiv)
    values (p_klasse, btrim(p_name), p_preis, p_je_kind, p_je_klasse, coalesce(p_aktiv, true)) returning id into r;
  else
    update public.lq_gutschein set name = btrim(p_name), preis = p_preis, je_kind = p_je_kind, je_klasse = p_je_klasse,
      aktiv = coalesce(p_aktiv, true)
     where id = p_id and klasse = p_klasse returning id into r;
    if r is null then raise exception 'zugang'; end if;
  end if;
  return r;
end;
$$;

/** Löscht einen Gutschein; offene Anfragen geben ihre Punkte zurück. */
create function public.lq_gutschein_loeschen(p_schluessel text[], p_gutschein uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_gutschein_pruefen(p_schluessel, p_gutschein);
  -- Erst den Gutschein sperren, dann die Kinder (dieselbe Reihenfolge wie lq_anfragen).
  perform 1 from public.lq_gutschein g where g.id = p_gutschein for update;
  update public.lq_kind c set klassenpunkte = c.klassenpunkte + s.summe
    from (select a.kind, sum(a.preis)::int summe from public.lq_anfrage a
           where a.gutschein = p_gutschein and a.zustand = 'offen' group by a.kind) s
   where c.id = s.kind;
  delete from public.lq_gutschein where id = p_gutschein;
end;
$$;

/** Hakt eine offene Anfrage ab: eingelöst (Punkte weg) oder abgelehnt (Punkte zurück). 'ungueltig', wenn nicht offen. */
create function public.lq_anfrage_erledigen(p_schluessel text[], p_anfrage uuid, p_eingeloest boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  a public.lq_anfrage;
begin
  select x.* into a from public.lq_anfrage x where x.id = p_anfrage;
  if a.id is null then raise exception 'zugang'; end if;
  perform public.lq_gutschein_pruefen(p_schluessel, a.gutschein);
  update public.lq_anfrage set zustand = case when p_eingeloest then 'eingeloest' else 'abgelehnt' end, erledigt = now()
   where id = a.id and zustand = 'offen' returning * into a;
  if a.id is null then raise exception 'ungueltig'; end if;
  if not p_eingeloest then
    update public.lq_kind set klassenpunkte = klassenpunkte + a.preis where id = a.kind;
  end if;
end;
$$;

/** Klassenpunkte von Hand: 1–5, höchstens 5 je Kind und Woche (Fehler 'grenze'). Gibt die Punkte des Kindes zurück. */
create function public.lq_punkte_geben(p_schluessel text[], p_kind uuid, p_punkte int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind;
  w date := public.lq_woche()::date;
  schon int;
begin
  perform public.lq_kind_pruefen(p_schluessel, p_kind);
  if p_punkte is null or p_punkte < 1 or p_punkte > 5 then raise exception 'ungueltig'; end if;
  select c.* into k from public.lq_kind c where c.id = p_kind for update;
  if k.geloescht is not null then raise exception 'ungueltig'; end if;
  schon := case when k.punkte_woche = w then k.punkte_hand else 0 end;
  if schon + p_punkte > 5 then raise exception 'grenze'; end if;
  update public.lq_kind set klassenpunkte = klassenpunkte + p_punkte, punkte_woche = w, punkte_hand = schon + p_punkte
   where id = p_kind returning * into k;
  return k.klassenpunkte;
end;
$$;

-- — Kinder —

create function public.lq_gutscheine(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
begin
  return public.lq_gutscheine_json(k);
end;
$$;

/**
 * Fragt einen Gutschein der eigenen Klasse an und legt die Punkte zurück. Fehler 'punkte' (reicht nicht), 'grenze'
 * (diese Woche schon so oft wie erlaubt), 'ungueltig' (nicht da oder aus). Höchstens 10 offene Anfragen je Kind.
 */
create function public.lq_anfragen(p_token text, p_gutschein uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  g public.lq_gutschein;
begin
  -- Erst den Gutschein sperren (Klassen-Grenze), dann das Kind (Punkte): immer in dieser Reihenfolge.
  select x.* into g from public.lq_gutschein x where x.id = p_gutschein and x.klasse = k.klasse and x.aktiv for update;
  if g.id is null then raise exception 'ungueltig'; end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  if k.klassenpunkte < g.preis then raise exception 'punkte'; end if;
  if g.je_kind is not null and (select count(*) from public.lq_anfrage a
       where a.gutschein = g.id and a.kind = k.id and public.lq_zaehlt(a)) >= g.je_kind then
    raise exception 'grenze';
  end if;
  if g.je_klasse is not null and (select count(*) from public.lq_anfrage a
       where a.gutschein = g.id and public.lq_zaehlt(a)) >= g.je_klasse then
    raise exception 'grenze';
  end if;
  if (select count(*) from public.lq_anfrage a where a.kind = k.id and a.zustand = 'offen') >= 10 then
    raise exception 'voll';
  end if;
  insert into public.lq_anfrage (gutschein, kind, preis) values (g.id, k.id, g.preis);
  update public.lq_kind set klassenpunkte = klassenpunkte - g.preis where id = k.id returning * into k;
  return public.lq_gutscheine_json(k);
end;
$$;

/** Zieht eine eigene offene Anfrage zurück; die Punkte kommen zurück. 'ungueltig', wenn sie nicht mehr offen ist. */
create function public.lq_anfrage_zurueck(p_token text, p_anfrage uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  a public.lq_anfrage;
begin
  update public.lq_anfrage set zustand = 'zurueck', erledigt = now()
   where id = p_anfrage and kind = k.id and zustand = 'offen' returning * into a;
  if a.id is null then raise exception 'ungueltig'; end if;
  update public.lq_kind set klassenpunkte = klassenpunkte + a.preis where id = k.id returning * into k;
  return public.lq_gutscheine_json(k);
end;
$$;

-- Nur die Funktionen für Browser sind von außen aufrufbar.
revoke execute on function public.lq_woche(), public.lq_zaehlt(public.lq_anfrage), public.lq_gutschein_pruefen(text[], uuid),
  public.lq_gutscheine_json(public.lq_kind) from public, anon, authenticated;

-- Aufräumen: erledigte Anfragen nach 90 Tagen (für die Grenzen zählt nur die laufende Woche).
select cron.schedule('lernquest-anfragen', '41 3 * * *', $$
  delete from public.lq_anfrage where zustand <> 'offen' and erstellt < now() - interval '90 days';
$$);
