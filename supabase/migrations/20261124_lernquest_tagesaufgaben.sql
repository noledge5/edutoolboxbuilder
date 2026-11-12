-- Lernquest Stufe D, Teil 1: Tagesaufgaben und Laden nach Heldenstufe (Projekt „baukasten“). Entschieden von der
-- Lehrkraft am 11.11.2026 (docs/roadmap.md). Die Regeln stehen gleich in src/lernquest/rules.ts (TAGESAUFGABEN,
-- aufgabenVon, aufgabenNach, AUFGABE_MUENZEN, AUFGABEN_BONUS, LADEN_AB, heldenstufe); beide zusammen ändern.
-- - Jeden Tag drei Aufgaben aus einer Liste von acht, für alle gleich: Tagnummer + 0, 3 und 5. Jede erfüllte Aufgabe
--   gibt 15 Münzen, alle drei 30 dazu, zusätzlich zur Tagesgrenze von 200. Gezählt wird beim Melden einer Runde.
-- - Der Laden verkauft eine Seltenheit erst ab einer Heldenstufe: 1 ab 3, 2 ab 5, 3 ab 12, 4 ab 16. Truhen geben
--   weiter alles, Besitz bleibt.

-- — Heldenstufe aus der Erfahrung (wie heldenstufe in rules.ts: 100, 150, 200 … je Stufe) —

create function public.lq_heldenstufe(xp int) returns int
language plpgsql immutable set search_path = '' as $$
declare
  s int := 1;
  r int := greatest(0, coalesce(xp, 0));
begin
  while r >= 50 + 50 * s loop
    r := r - (50 + 50 * s);
    s := s + 1;
  end loop;
  return s;
end;
$$;

-- — Die drei Aufgaben eines Tages (wie TAGESAUFGABEN und aufgabenVon in rules.ts), in der Reihenfolge der App —

create function public.lq_aufgaben(tag date) returns table (id text, zaehler text, ziel int)
language sql immutable set search_path = '' as $$
  select l.id, l.zaehler, l.ziel
    from (values (0, 'schaffen', 'geschafft', 1), (1, 'fehlerfrei', 'fehlerfrei', 1), (2, 'wiederholen', 'wdh', 1),
                 (3, 'drei', 'runden', 3), (4, 'richtig', 'richtig', 15), (5, 'stern', 'sterne', 1),
                 (6, 'zwei', 'geschafft', 2), (7, 'neu', 'neu', 1)) l (i, id, zaehler, ziel)
    join (values (0, 1), (3, 2), (5, 3)) o (o, pos) on l.i = ((tag - date '1970-01-01') + o.o) % 8
   order by o.pos
$$;

-- — Spielstand: wie 20261113_lernquest_sterne.sql, dazu die Tagesaufgaben von heute —

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
    'sterneStationen', coalesce(k.daten -> 'sterneStationen', '{}'::jsonb)
  ) || case when k.daten -> 'aufgaben' ->> 'tag' = ((now() at time zone 'Europe/Berlin')::date)::text
         then jsonb_build_object('aufgaben', k.daten -> 'aufgaben') else '{}'::jsonb end
$$;

-- — Runde melden: wie 20261123_lernquest_stufen.sql, dazu die Tagesaufgaben —

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
  return jsonb_build_object('plus', plus, 'muenzenPlus', m_plus, 'truhenPlus', t_plus, 'punktePlus', p_plus,
    'aufgabenPlus', a_plus, 'aufgabenNeu', a_neu, 'wiederholung', wdh, 'stand', public.lq_stand_json(k));
end;
$$;

-- — Kaufen: wie 20261121_lernquest_teile_einstellen.sql, dazu die Heldenstufe je Seltenheit ('stufe') —

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
  if public.lq_heldenstufe(k.xp) < (array[1, 3, 5, 12, 16])[t.seltenheit + 1] then raise exception 'stufe'; end if;
  preis := (array[80, 160, 320, 640, 1600])[t.seltenheit + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  update public.lq_kind set muenzen = muenzen - preis, inventar = inventar || t.id where id = k.id returning * into k;
  return public.lq_stand_json(k);
end;
$$;

revoke execute on function public.lq_heldenstufe(int) from public, anon, authenticated;
revoke execute on function public.lq_aufgaben(date) from public, anon, authenticated;
