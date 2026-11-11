-- Lernquest Stufe C: Sterne aus drei Stufen, eine Runde zählt ab 60 % (Projekt „baukasten“). Entschieden von der
-- Lehrkraft am 11.11.2026 (docs/roadmap.md). Die Regeln stehen gleich in src/lernquest/rules.ts (niveauVon,
-- rundenStufen, sternZiele, sterne, GESCHAFFT_AB, istWiederholung); beide zusammen ändern.
-- - Eine Runde ist geschafft ab 60 % richtig (vorher: ab einer richtigen Antwort). Das gilt für die Sterne und dafür,
--   ob eine Runde als Wiederholung zählt (ein Drittel EP und Münzen).
-- - Jede Runde hat eine Stufe: die schwerste ihrer Übungen (niveau aus dem KI-Pool, sonst nach dem Format: Antippen
--   und Richtig/Falsch leicht, Lücke, Paare, Sortieren und Gruppen mittel, Selbst schreiben schwer).
-- - Sterne Kennenlernen, Anwenden, Meistern: Jede Stufe, die die Station hat, gibt einen Stern, von leicht nach schwer:
--   ihre Runden und alle leichteren geschafft. Fehlt der Station eine Stufe, verlangen die übrigen Sterne: alle Runden
--   im Schnitt 80 %, danach jede Runde einmal ohne Fehler.
-- - Verdient bleibt verdient: Jede Station mit Sternen nach der alten Regel bekommt diesen Stand in
--   daten.sterneStationen (nur nach oben). Die App zeigt nie weniger Sterne als dort stehen, und Truhen gibt es nur
--   für Sterne darüber hinaus.

-- — Stufe einer Übung und der Runden einer Station (wie niveauVon, rundeVon und rundenStufen in rules.ts) —

create function public.lq_niveau(u jsonb) returns int
language sql immutable set search_path = '' as $$
  select case
    when u ->> 'niveau' in ('1', '2', '3') then (u ->> 'niveau')::int
    when u ->> 'art' = 'schreiben' then 3
    when u ->> 'art' in ('paare', 'luecke', 'reihenfolge', 'gruppen') then 2
    else 1 end
$$;

create function public.lq_stufen(uebungen jsonb) returns int[]
language plpgsql immutable set search_path = '' as $$
declare
  n int := case when jsonb_typeof(uebungen) = 'array' then jsonb_array_length(uebungen) else 0 end;
  runden int := public.lq_runden(n);
  take int;
  stufe int;
  out int[] := '{}';
begin
  if runden = 0 then return out; end if;
  take := least(8, greatest(least(5, n), ceil(n::numeric / runden)::int));
  for r in 0 .. runden - 1 loop
    select max(public.lq_niveau(uebungen -> ((floor(r * n::numeric / runden)::int + k) % n))) into stufe
      from generate_series(0, take - 1) k;
    out := out || stufe;
  end loop;
  return out;
end;
$$;

-- — Sterne (wie sternZiele und sterne in rules.ts) —

create function public.lq_stufe_geschafft(best jsonb, stufen int[], bis int) returns boolean
language sql immutable set search_path = '' as $$
  select not exists (select 1 from generate_subscripts(stufen, 1) i
    where stufen[i] <= bis and coalesce((best ->> (i - 1))::int, 0) < 60)
$$;

create function public.lq_sterne(best jsonb, stufen int[]) returns int
language plpgsql immutable set search_path = '' as $$
declare
  n int := coalesce(array_length(stufen, 1), 0);
  b jsonb := case when jsonb_typeof(best) = 'array' then best else '[]'::jsonb end;
  lv int[] := array(select distinct s from unnest(stufen) s order by s);
  ok boolean;
begin
  if n = 0 or best is null then return 0; end if;
  for k in 1 .. 3 loop
    ok := case
      when k <= array_length(lv, 1) then public.lq_stufe_geschafft(b, stufen, lv[k])
      when k = array_length(lv, 1) + 1 then public.lq_stufe_geschafft(b, stufen, 3)
        and (select sum(coalesce((b ->> (i - 1))::int, 0)) from generate_subscripts(stufen, 1) i) >= 80 * n
      else not exists (select 1 from generate_subscripts(stufen, 1) i where coalesce((b ->> (i - 1))::int, 0) < 100) end;
    if not ok then return k - 1; end if;
  end loop;
  return 3;
end;
$$;

-- — Verdient bleibt verdient: Sterne nach der alten Regel festhalten, bevor sie wegfällt —

update public.lq_kind k set daten = jsonb_set(k.daten, '{sterneStationen}', coalesce(k.daten -> 'sterneStationen', '{}'::jsonb) || x.neu)
  from (
    select c.id, jsonb_object_agg(a.stunde, a.alt) neu
      from public.lq_kind c
      cross join lateral (
        select b.key stunde, public.lq_sterne(b.value, public.lq_runden(jsonb_array_length(coalesce(p.daten -> 'uebungen', '[]'::jsonb)))) alt
          from jsonb_each(case when jsonb_typeof(c.daten -> 'bestwerte') = 'object' then c.daten -> 'bestwerte' else '{}'::jsonb end) b
          join public.lq_paket p on p.klasse = c.klasse and p.stunde = b.key
         where jsonb_typeof(b.value) = 'array') a
     where a.alt > coalesce((c.daten -> 'sterneStationen' ->> a.stunde)::int, 0)
     group by c.id) x
 where x.id = k.id;

drop function public.lq_sterne(jsonb, int);

-- — Runde melden: wie 20261117_lernquest_wiederholung.sql, mit den Stufen und der 60-%-Grenze —

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
    'wiederholung', wdh, 'stand', public.lq_stand_json(k));
end;
$$;

revoke execute on function public.lq_niveau(jsonb) from public, anon, authenticated;
revoke execute on function public.lq_stufen(jsonb) from public, anon, authenticated;
revoke execute on function public.lq_stufe_geschafft(jsonb, int[], int) from public, anon, authenticated;
revoke execute on function public.lq_sterne(jsonb, int[]) from public, anon, authenticated;
