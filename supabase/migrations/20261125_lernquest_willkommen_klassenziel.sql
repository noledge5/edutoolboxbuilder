-- Lernquest Stufe D, Teil 2: Willkommen und Klassen-Aufgabe der Woche (Projekt „baukasten“). Entschieden von der
-- Lehrkraft am 12.11.2026 (docs/roadmap.md). Die Zahl 5 steht gleich in src/lernquest/rules.ts (KLASSEN_ZIEL_JE_KIND); beide zusammen ändern.
-- - Willkommen: Ein neues Kind (noch keine Erfahrung) baut seinen Helden, spielt eine Proberunde (wird nicht gemeldet)
--   und bekommt einmal eine Willkommens-Truhe (lq_willkommen). Im Spielstand: 'willkommen' (schon dran gewesen oder
--   schon gespielt).
-- - Klassen-Aufgabe der Woche: Jede geschaffte Runde (ab 60 %, auch Wiederholungen) zählt für die Klasse. Ziel: 5 Runden
--   je Kind, das in den letzten 28 Tagen da war (mindestens ein Kind). Ist es erreicht, bekommt jedes Kind der Klasse eine
--   Truhe, beim nächsten Melden oder Laden in derselben Woche (Montag bis Sonntag, Europe/Berlin).

-- — Stand der Klasse diese Woche: geschaffte Runden, Ziel und ob es erreicht ist. Erreicht bleibt erreicht, auch wenn
--   das Ziel danach steigt (ein Kind kommt neu dazu): Hat ein Kind der Klasse die Truhe dieser Woche, gilt es. —

create function public.lq_klassen_ziel(p_klasse uuid) returns table (runden int, ziel int, erreicht boolean)
language sql stable set search_path = '' as $$
  with w as (select date_trunc('week', (now() at time zone 'Europe/Berlin'))::date::text as woche),
  z as (
    select
      coalesce(sum(case when c.daten -> 'klassenRunden' ->> 'woche' = w.woche then (c.daten -> 'klassenRunden' ->> 'n')::int else 0 end), 0)::int as runden,
      (5 * greatest(1, count(*) filter (where c.zuletzt >= now() - interval '28 days')))::int as ziel,
      bool_or(c.daten ->> 'klassenTruhe' = w.woche) as schon
    from public.lq_kind c, w where c.klasse = p_klasse and c.geloescht is null
  )
  select runden, ziel, runden >= ziel or coalesce(schon, false) from z
$$;

-- — Truhe fürs Klassenziel: einmal je Kind und Woche, wenn das Ziel erreicht ist. true, wenn sie jetzt dazukam. —

create function public.lq_klassen_truhe(p_kind uuid) returns boolean
language plpgsql set search_path = '' as $$
declare
  k public.lq_kind;
  woche text := date_trunc('week', (now() at time zone 'Europe/Berlin'))::date::text;
  z record;
begin
  select c.* into k from public.lq_kind c where c.id = p_kind and c.geloescht is null for update;
  if k.id is null or k.daten ->> 'klassenTruhe' = woche then return false; end if;
  select * into z from public.lq_klassen_ziel(k.klasse);
  if not z.erreicht then return false; end if;
  update public.lq_kind set truhen = truhen + 1, daten = jsonb_set(daten, '{klassenTruhe}', to_jsonb(woche)) where id = k.id;
  return true;
end;
$$;

-- — Spielstand: wie 20261124_lernquest_tagesaufgaben.sql, dazu 'willkommen' —

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
    'klassenpunkte', k.klassenpunkte,
    'sterneRest', coalesce((k.daten ->> 'sterneRest')::int, 0),
    'sterneStationen', coalesce(k.daten -> 'sterneStationen', '{}'::jsonb),
    'willkommen', k.daten ? 'willkommen' or k.xp > 0
  ) || case when k.daten -> 'aufgaben' ->> 'tag' = ((now() at time zone 'Europe/Berlin')::date)::text
         then jsonb_build_object('aufgaben', k.daten -> 'aufgaben') else '{}'::jsonb end
$$;

-- — Runde melden: wie 20261124_lernquest_tagesaufgaben.sql, dazu der Wochenzähler der Klasse und ihre Truhe —

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
  stufen int[];
  s_vorher int;
  s_jetzt int;
  s_plus int;
  s_rest int;
  wdh boolean;
  a jsonb;
  z jsonb;
  w text;
  t record;
  a_neu jsonb := '[]'::jsonb;
  a_plus int := 0;
  k_truhe boolean := false;
begin
  if p_gesamt is null or p_gesamt < 1 or p_gesamt > 20 or p_richtig is null or p_richtig < 0 or p_richtig > p_gesamt
     or p_runde is null or p_runde < 0 or p_runde > 9 then
    raise exception 'ungueltig';
  end if;
  if p_stunde <> '' and not exists (select 1 from public.lq_paket p where p.klasse = k.klasse and p.stunde = p_stunde) then
    raise exception 'ungueltig';
  end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  -- Wiederholung: Runde „Wiederholen“ oder diese Stationsrunde war schon geschafft (ab 60 %, vor dieser Runde).
  wdh := p_stunde = '' or coalesce((k.daten -> 'bestwerte' -> p_stunde ->> p_runde)::int, 0) >= 60;
  schon := case when k.xp_tag = heute then k.xp_heute else 0 end;
  plus := 10 + 2 * p_richtig + case when p_richtig = p_gesamt then 5 else 0 end;
  if wdh then plus := plus / 3; end if;
  plus := least(plus, greatest(0, 300 - schon));
  select * into b from public.lq_bonus(k.avatar);
  herzen := 3 + b.herz;
  m_roh := 5 + p_richtig + 2 * greatest(0, herzen - (p_gesamt - p_richtig));
  m_roh := m_roh + (m_roh * b.muenzen) / 100;
  if wdh then m_roh := m_roh / 3; end if;
  m_schon := case when k.muenzen_tag = heute then k.muenzen_heute else 0 end;
  m_plus := least(m_roh, greatest(0, 200 - m_schon));
  d := k.daten;
  if p_stunde <> '' then
    select public.lq_stufen(p.daten -> 'uebungen') into stufen
      from public.lq_paket p where p.klasse = k.klasse and p.stunde = p_stunde;
    prozent := round(100.0 * p_richtig / p_gesamt);
    best := coalesce(d -> 'bestwerte' -> p_stunde, '[]'::jsonb);
    s_vorher := public.lq_sterne(best, stufen);
    while jsonb_array_length(best) <= p_runde loop best := best || '0'::jsonb; end loop;
    if prozent > (best ->> p_runde)::int then best := jsonb_set(best, array[p_runde::text], to_jsonb(prozent)); end if;
    d := jsonb_set(d, '{bestwerte}', coalesce(d -> 'bestwerte', '{}'::jsonb) || jsonb_build_object(p_stunde, best));
    -- Je 3 neue Sterne eine Truhe. Gezählt ist je Station der höchste Stand; eine alte Station ohne Eintrag (ihre
    -- Truhe gab es schon fürs Durchspielen) zählt ab den Sternen vor dieser Runde.
    s_jetzt := public.lq_sterne(best, stufen);
    s_plus := greatest(0, s_jetzt - coalesce((d -> 'sterneStationen' ->> p_stunde)::int, s_vorher));
    if s_plus > 0 then
      s_rest := coalesce((d ->> 'sterneRest')::int, 0) + s_plus;
      t_plus := t_plus + s_rest / 3;
      d := jsonb_set(d, '{sterneRest}', to_jsonb(s_rest % 3));
      d := jsonb_set(d, '{sterneStationen}', coalesce(d -> 'sterneStationen', '{}'::jsonb) || jsonb_build_object(p_stunde, s_jetzt));
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
  -- Klassen-Aufgabe der Woche: jede geschaffte Runde (ab 60 %) zählt, auch Wiederholungen.
  if round(100.0 * p_richtig / p_gesamt) >= 60 then
    d := jsonb_set(d, '{klassenRunden}', jsonb_build_object('woche', woche::text, 'n',
      case when d -> 'klassenRunden' ->> 'woche' = woche::text then coalesce((d -> 'klassenRunden' ->> 'n')::int, 0) else 0 end + 1));
  end if;
  -- Tagesaufgaben (wie aufgabenNach in rules.ts): Zähler des Tages, erfüllte Aufgaben je 15 Münzen, die dritte 30
  -- dazu; nicht in der Tagesgrenze von 200.
  a := case when d -> 'aufgaben' ->> 'tag' = heute::text then d -> 'aufgaben'
    else jsonb_build_object('tag', heute::text, 'zaehler', '{}'::jsonb, 'erledigt', '[]'::jsonb) end;
  z := a -> 'zaehler';
  w := case when wdh then 'wdh' else 'neu' end;
  z := z || jsonb_build_object(
    'runden', coalesce((z ->> 'runden')::int, 0) + 1,
    'geschafft', coalesce((z ->> 'geschafft')::int, 0) + case when round(100.0 * p_richtig / p_gesamt) >= 60 then 1 else 0 end,
    'fehlerfrei', coalesce((z ->> 'fehlerfrei')::int, 0) + case when p_richtig = p_gesamt then 1 else 0 end,
    'richtig', coalesce((z ->> 'richtig')::int, 0) + p_richtig,
    'sterne', coalesce((z ->> 'sterne')::int, 0) + greatest(0, coalesce(s_jetzt - s_vorher, 0)),
    w, coalesce((z ->> w)::int, 0) + 1);
  for t in select * from public.lq_aufgaben(heute) loop
    if not (a -> 'erledigt') ? t.id and coalesce((z ->> t.zaehler)::int, 0) >= t.ziel then a_neu := a_neu || to_jsonb(t.id); end if;
  end loop;
  a_plus := 15 * jsonb_array_length(a_neu)
    + case when jsonb_array_length(a_neu) > 0 and jsonb_array_length((a -> 'erledigt') || a_neu) = 3 then 30 else 0 end;
  d := jsonb_set(d, '{aufgaben}', jsonb_build_object('tag', heute::text, 'zaehler', z, 'erledigt', (a -> 'erledigt') || a_neu));
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
    muenzen = muenzen + m_plus + a_plus, muenzen_tag = heute, muenzen_heute = m_schon + m_plus, truhen = truhen + t_plus,
    klassenpunkte = klassenpunkte + p_plus, daten = d, zuletzt = now()
   where id = k.id returning * into k;
  if public.lq_klassen_truhe(k.id) then
    t_plus := t_plus + 1;
    k_truhe := true;
    select c.* into k from public.lq_kind c where c.id = k.id;
  end if;
  return jsonb_build_object('plus', plus, 'muenzenPlus', m_plus, 'truhenPlus', t_plus, 'klassenTruhe', k_truhe, 'punktePlus', p_plus,
    'aufgabenPlus', a_plus, 'aufgabenNeu', a_neu, 'wiederholung', wdh, 'stand', public.lq_stand_json(k));
end;
$$;

-- — Laden: wie 20261119_lernquest_wiederholen_sofort.sql, dazu die Truhe fürs Klassenziel —

create or replace function public.lq_mein_stand(p_token text, p_seit timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
begin
  update public.lq_kind set zuletzt = now() where id = k.id;
  perform public.lq_klassen_truhe(k.id);
  select c.* into k from public.lq_kind c where c.id = k.id;
  return jsonb_build_object(
    'name', k.name,
    'klasse', (select l.name from public.lq_klasse l where l.id = k.klasse),
    'stand', public.lq_stand_json(k),
    'stunden', coalesce((select jsonb_agg(p.stunde) from public.lq_paket p where p.klasse = k.klasse), '[]'::jsonb),
    'pakete', coalesce((select jsonb_agg(jsonb_build_object('stunde', p.stunde, 'stand', p.stand, 'daten', p.daten))
       from public.lq_paket p where p.klasse = k.klasse and (p_seit is null or p.stand > p_seit)), '[]'::jsonb),
    'extra', (select l.extra_wdh from public.lq_klasse l where l.id = k.klasse),
    'jetzt', now()
  );
end;
$$;

-- — Klassen-Ansicht: wie 20261119_lernquest_wiederholen_sofort.sql, dazu die Klassen-Aufgabe der Woche —

create or replace function public.lq_klasse_ansicht(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  woche date := date_trunc('week', (now() at time zone 'Europe/Berlin'))::date;
  z record;
  neu boolean := public.lq_klassen_truhe(k.id);
begin
  select * into z from public.lq_klassen_ziel(k.klasse);
  select c.* into k from public.lq_kind c where c.id = k.id;
  return jsonb_build_object(
    'klasse', (select l.name from public.lq_klasse l where l.id = k.klasse),
    'tage', (select count(*) from public.lq_kind c, jsonb_array_elements_text(coalesce(c.daten -> 'tage', '[]'::jsonb)) x
              where c.klasse = k.klasse and c.geloescht is null and x::date >= woche),
    'kinder', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'avatar', c.avatar, 'ich', c.id = k.id) order by c.name)
       from public.lq_kind c where c.klasse = k.klasse and c.geloescht is null), '[]'::jsonb),
    'runden', z.runden,
    'ziel', z.ziel,
    'erreicht', z.erreicht,
    'truhe', coalesce(k.daten ->> 'klassenTruhe' = woche::text, false),
    'truheNeu', neu,
    'stand', public.lq_stand_json(k)
  );
end;
$$;

-- — Willkommens-Truhe: einmal je Kind, nur solange es noch keine Erfahrung hat —

create function public.lq_willkommen(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  truhe boolean;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  truhe := not k.daten ? 'willkommen' and k.xp = 0;
  if not k.daten ? 'willkommen' then
    update public.lq_kind set truhen = truhen + case when truhe then 1 else 0 end,
      daten = jsonb_set(daten, '{willkommen}', to_jsonb(((now() at time zone 'Europe/Berlin')::date)::text)), zuletzt = now()
     where id = k.id returning * into k;
  end if;
  return jsonb_build_object('truhe', truhe, 'stand', public.lq_stand_json(k));
end;
$$;

revoke execute on function public.lq_klassen_ziel(uuid) from public, anon, authenticated;
revoke execute on function public.lq_klassen_truhe(uuid) from public, anon, authenticated;
