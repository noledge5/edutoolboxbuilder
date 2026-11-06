-- Lernquest, Stufe 2 „Held und Beute“ (Projekt „baukasten“). Freigegeben von der Lehrkraft am 06.11.2026.
-- Münzen, Truhen, Inventar, Avatar, Laden, Klassen-Ansicht. Wie Stufe 1: nur über Funktionen; den Zufall der Truhen
-- und alle Belohnungen rechnet der Server. Die Regeln stehen gleich in src/lernquest/rules.ts und src/lernquest/teile.ts
-- (ein Test vergleicht den Katalog hier mit dem dort).

-- Katalog der Avatar-Teile: Platz, Seltenheit (0 Gewöhnlich … 4 Legendär), Startteil, Boni nur im Spiel.
create table public.lq_teil (
  id text primary key,
  slot text not null check (slot in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund')),
  seltenheit int not null check (seltenheit between 0 and 4),
  start boolean not null default false,
  bonus_muenzen int not null default 0,
  bonus_herz int not null default 0
);
alter table public.lq_teil enable row level security;
revoke all on public.lq_teil from anon, authenticated;

insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz) values
  ('wollmuetze', 'kopf', 0, false, 0, 0),
  ('stirnband', 'kopf', 1, false, 0, 0),
  ('ritterhelm', 'kopf', 1, false, 0, 0),
  ('entdeckerhut', 'kopf', 2, false, 5, 0),
  ('piratenhut', 'kopf', 2, false, 0, 0),
  ('zauberhut', 'kopf', 3, false, 10, 0),
  ('krone', 'kopf', 4, false, 10, 1),
  ('punktaugen', 'augen', 0, true, 0, 0),
  ('froehlich', 'augen', 0, false, 0, 0),
  ('brille', 'augen', 1, false, 0, 0),
  ('sternaugen', 'augen', 2, false, 0, 0),
  ('sonnenbrille', 'augen', 2, false, 0, 0),
  ('funkelaugen', 'augen', 3, false, 5, 0),
  ('tshirt', 'kleidung', 0, true, 0, 0),
  ('pulli', 'kleidung', 0, false, 0, 0),
  ('latzhose', 'kleidung', 0, false, 0, 0),
  ('weste', 'kleidung', 1, false, 0, 0),
  ('ruestung', 'kleidung', 2, false, 0, 1),
  ('sternenmantel', 'kleidung', 2, false, 0, 1),
  ('zauberrobe', 'kleidung', 3, false, 10, 0),
  ('goldruestung', 'kleidung', 4, false, 10, 1),
  ('lupe', 'werkzeug', 0, false, 0, 0),
  ('buch', 'werkzeug', 0, false, 0, 0),
  ('fernrohr', 'werkzeug', 1, false, 0, 0),
  ('kompass', 'werkzeug', 2, false, 5, 0),
  ('zauberstab', 'werkzeug', 3, false, 0, 1),
  ('sternenschwert', 'werkzeug', 4, false, 5, 1),
  ('schnecke', 'begleiter', 0, false, 0, 0),
  ('katze', 'begleiter', 1, false, 0, 0),
  ('eule', 'begleiter', 2, false, 5, 0),
  ('fuchs', 'begleiter', 2, false, 0, 0),
  ('roboter', 'begleiter', 3, false, 0, 1),
  ('drache', 'begleiter', 4, false, 10, 0),
  ('wiese', 'hintergrund', 0, true, 0, 0),
  ('strand', 'hintergrund', 0, false, 0, 0),
  ('wald', 'hintergrund', 1, false, 0, 0),
  ('berge', 'hintergrund', 1, false, 0, 0),
  ('nacht', 'hintergrund', 2, false, 0, 0),
  ('weltall', 'hintergrund', 3, false, 5, 0),
  ('regenbogen', 'hintergrund', 4, false, 10, 0);

alter table public.lq_kind
  add column muenzen int not null default 0,
  add column muenzen_tag date,
  add column muenzen_heute int not null default 0,
  add column truhen int not null default 0,
  -- Truhen nacheinander ohne Seltenes (für die Garantie)
  add column pech int not null default 0,
  add column inventar text[] not null default '{}',
  -- {"kopf": id, …, "haut": 0–5}; fehlt ein Platz, gilt das Startteil oder nichts
  add column avatar jsonb not null default '{}'::jsonb;

-- — Hilfen —

/** Boni der angelegten Teile, gedeckelt: höchstens +20 % Münzen und +2 Herzen. */
create function public.lq_bonus(p_avatar jsonb, out muenzen int, out herz int)
language sql stable set search_path = '' as $$
  select least(20, coalesce(sum(t.bonus_muenzen), 0))::int, least(2, coalesce(sum(t.bonus_herz), 0))::int
  from public.lq_teil t
  where t.id in (select value from jsonb_each_text(coalesce(p_avatar, '{}'::jsonb)) where key <> 'haut')
$$;

/** Runden einer Station aus der Zahl der Übungen (wie rundenZahl in rules.ts). */
create function public.lq_runden(n int) returns int
language sql immutable set search_path = '' as $$
  select case when n <= 0 then 0 when n <= 5 then 1 else least(5, greatest(3, ceil(n / 5.0)::int)) end
$$;

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
    'avatar', k.avatar
  )
$$;

-- — Runde melden: jetzt auch Münzen und Truhen —

/**
 * Wie in Stufe 1 (Erfahrung, Bestwert, Lerntag, Karten), dazu:
 * Münzen = 5 + 1 je richtige + 2 je übriges Herz (3 Herzen + Boni, jeder Fehler kostet eins), dann + Bonus-Prozent;
 * höchstens 200 am Tag. Eine Truhe, wenn eine Station zum ersten Mal ganz gespielt ist, und eine, wenn das
 * Wochenziel (3 Lerntage) in dieser Woche zum ersten Mal erreicht ist.
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
    daten = d, zuletzt = now()
   where id = k.id returning * into k;
  return jsonb_build_object('plus', plus, 'muenzenPlus', m_plus, 'truhenPlus', t_plus, 'stand', public.lq_stand_json(k));
end;
$$;

-- — Truhe, Laden, Avatar —

/**
 * Öffnet eine Truhe: Seltenheit nach 55 / 28 / 12 / 4 / 1 %; nach 4 Truhen ohne Seltenes ist die 5. mindestens selten
 * (dann 12 : 4 : 1). Ein Teil, das das Kind schon hat, wird zu Münzen (10 / 20 / 40 / 80 / 150).
 */
create function public.lq_truhe_oeffnen(p_token text) returns jsonb
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
  select * into t from public.lq_teil x where x.seltenheit = s and not x.start order by random() limit 1;
  doppelt := t.id = any (k.inventar);
  if doppelt then wert := (array[10, 20, 40, 80, 150])[s + 1]; end if;
  update public.lq_kind set truhen = truhen - 1, pech = case when s >= 2 then 0 else pech + 1 end,
    inventar = case when doppelt then inventar else inventar || t.id end, muenzen = muenzen + wert
   where id = k.id returning * into k;
  return jsonb_build_object('teil', t.id, 'seltenheit', s, 'doppelt', doppelt, 'muenzen', wert, 'stand', public.lq_stand_json(k));
end;
$$;

/** Kauft ein Teil im Laden: 40 / 80 / 160 / 320 / 800 Münzen. Fehler 'muenzen', wenn es nicht reicht. */
create function public.lq_kaufen(p_token text, p_teil text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  t public.lq_teil;
  preis int;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select * into t from public.lq_teil x where x.id = p_teil and not x.start;
  if t.id is null or t.id = any (k.inventar) then raise exception 'ungueltig'; end if;
  preis := (array[40, 80, 160, 320, 800])[t.seltenheit + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  update public.lq_kind set muenzen = muenzen - preis, inventar = inventar || t.id where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;

/** Legt Teile an: je Platz ein Teil, das das Kind hat (oder ein Startteil), '' für nichts; dazu die Hautfarbe 0–5. */
create function public.lq_avatar_setzen(p_token text, p_avatar jsonb) returns jsonb
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

/** Die Klasse für ein Kind: Namen und Avatare (keine Erfahrung, keine Rangliste) und die Lerntage aller in dieser Woche. */
create function public.lq_klasse_ansicht(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  woche date := date_trunc('week', (now() at time zone 'Europe/Berlin'))::date;
begin
  return jsonb_build_object(
    'klasse', (select l.name from public.lq_klasse l where l.id = k.klasse),
    'tage', (select count(*) from public.lq_kind c, jsonb_array_elements_text(coalesce(c.daten -> 'tage', '[]'::jsonb)) x
              where c.klasse = k.klasse and c.geloescht is null and x::date >= woche),
    'kinder', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'avatar', c.avatar, 'ich', c.id = k.id) order by c.name)
       from public.lq_kind c where c.klasse = k.klasse and c.geloescht is null), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.lq_bonus(jsonb), public.lq_runden(int), public.lq_stand_json(public.lq_kind) from public, anon, authenticated;
