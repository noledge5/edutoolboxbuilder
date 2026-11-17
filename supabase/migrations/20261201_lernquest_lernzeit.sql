-- Lernquest: Lernzeit am Tag und kleine Belohnung für Wiederholungen (Projekt „baukasten“). Entschieden von der
-- Lehrkraft am 17.11.2026 (docs/roadmap.md): Kinder saßen stundenlang am Gerät, um Münzen zu sammeln. Die Regeln
-- stehen gleich in src/lernquest/rules.ts (STATION_WDH_XP, STATION_WDH_MUENZEN, ZEIT_LIMIT_STANDARD, rundeSekunden);
-- beide zusammen ändern.
-- - Eine schon geschaffte Station gibt nur noch 2 Erfahrung und 1 Münze, egal wie gut. „Wiederholen“ (fällige
--   Karten) bleibt bei einem Drittel. Bessere Sterne zählen weiter für Truhen (jeder Stern einmal).
-- - Lernzeit: Jede Runde meldet ihre Dauer (höchstens 15 Minuten; eine ältere App ohne Angabe zählt 2 Minuten). Ist
--   das Limit der Klasse (Standard 45 Minuten, 5–240, null = keins) erreicht, nimmt der Server keine Runde mehr an
--   ('zeit'); die App startet dann keine mehr. Bosskampf zählt nicht.

alter table public.lq_klasse add column zeit_limit int default 45 check (zeit_limit between 5 and 240);
alter table public.lq_kind add column zeit_tag date, add column zeit_heute int not null default 0;

-- — Spielstand: wie 20261125_lernquest_klassenaufgabe.sql, dazu die Lernzeit —

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
    'sterneWoche', case when k.daten -> 'sterneWoche' ->> 'woche' = public.lq_woche()::date::text
                     then (k.daten -> 'sterneWoche' ->> 'n')::int else 0 end,
    'klassenAufgabe', public.lq_klassen_aufgabe(k.klasse),
    'klassenTruhe', coalesce(k.daten ->> 'klassenTruhe' = public.lq_woche()::date::text, false),
    'willkommen', k.daten ? 'willkommen',
    -- Neu: Lernzeit heute (Sekunden in Runden) und das Limit der Klasse in Minuten (null: keins).
    'zeit', jsonb_build_object('tag', ((now() at time zone 'Europe/Berlin')::date)::text,
      'sekunden', case when k.zeit_tag = (now() at time zone 'Europe/Berlin')::date then k.zeit_heute else 0 end,
      'limit', (select l.zeit_limit from public.lq_klasse l where l.id = k.klasse))
  ) || case when k.daten -> 'aufgaben' ->> 'tag' = ((now() at time zone 'Europe/Berlin')::date)::text
         then jsonb_build_object('aufgaben', k.daten -> 'aufgaben') else '{}'::jsonb end
$$;

-- — Runde melden: wie 20261125_lernquest_klassenaufgabe.sql, dazu Dauer und Limit, Wiederholung einer Station minimal —
-- Die alte Fassung ohne p_sekunden fällt weg; ältere Apps rufen mit benannten Argumenten und treffen die neue.

drop function public.lq_runde_melden(text, text, int, int, int, jsonb);

create function public.lq_runde_melden(p_token text, p_stunde text, p_runde int, p_richtig int, p_gesamt int, p_leitner jsonb, p_sekunden int default null) returns jsonb
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
  kw_n int;
  ka jsonb;
  z_schon int;
  z_limit int;
begin
  if p_gesamt is null or p_gesamt < 1 or p_gesamt > 20 or p_richtig is null or p_richtig < 0 or p_richtig > p_gesamt
     or p_runde is null or p_runde < 0 or p_runde > 9 then
    raise exception 'ungueltig';
  end if;
  if p_stunde <> '' and not exists (select 1 from public.lq_paket p where p.klasse = k.klasse and p.stunde = p_stunde) then
    raise exception 'ungueltig';
  end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  -- Neu: Lernzeit. Ist das Limit der Klasse vor dieser Runde schon erreicht, nimmt der Server keine Runde mehr an.
  z_schon := case when k.zeit_tag = heute then k.zeit_heute else 0 end;
  select l.zeit_limit into z_limit from public.lq_klasse l where l.id = k.klasse;
  if z_limit is not null and z_schon >= z_limit * 60 then raise exception 'zeit'; end if;
  -- Wiederholung: Runde „Wiederholen“ oder diese Stationsrunde war schon geschafft (ab 60 %, vor dieser Runde).
  wdh := p_stunde = '' or coalesce((k.daten -> 'bestwerte' -> p_stunde ->> p_runde)::int, 0) >= 60;
  schon := case when k.xp_tag = heute then k.xp_heute else 0 end;
  plus := 10 + 2 * p_richtig + case when p_richtig = p_gesamt then 5 else 0 end;
  -- Neu: eine schon geschaffte Station gibt nur 2 Erfahrung und 1 Münze; „Wiederholen“ bleibt bei einem Drittel.
  if p_stunde = '' then plus := plus / 3; elsif wdh then plus := 2; end if;
  plus := least(plus, greatest(0, 300 - schon));
  select * into b from public.lq_bonus(k.avatar);
  herzen := 3 + b.herz;
  m_roh := 5 + p_richtig + 2 * greatest(0, herzen - (p_gesamt - p_richtig));
  m_roh := m_roh + (m_roh * b.muenzen) / 100;
  if p_stunde = '' then m_roh := m_roh / 3; elsif wdh then m_roh := 1; end if;
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
      -- Neu: die neuen Sterne zählen auch für die Klassen-Aufgabe dieser Woche.
      kw_n := case when d -> 'sterneWoche' ->> 'woche' = woche::text then coalesce((d -> 'sterneWoche' ->> 'n')::int, 0) else 0 end + s_plus;
      d := jsonb_set(d, '{sterneWoche}', jsonb_build_object('woche', woche::text, 'n', kw_n));
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
  -- Neu: Klassen-Aufgabe der Woche. Ist das Ziel erreicht, bekommt jedes Kind mit Sternen in dieser Woche eine Truhe,
  -- einmal je Woche; wer erst danach Sterne holt, bekommt sie bei seiner Runde. Kinder, die gerade selbst eine Runde
  -- melden (Zeile gesperrt), werden übersprungen und bekommen sie bei ihrer nächsten Runde (kein Deadlock).
  if d -> 'sterneWoche' ->> 'woche' = woche::text and coalesce(d ->> 'klassenTruhe', '') <> woche::text then
    ka := public.lq_klassen_aufgabe(k.klasse, k.id, (d -> 'sterneWoche' ->> 'n')::int);
    if (ka ->> 'geschafft')::boolean or (ka ->> 'sterne')::int >= (ka ->> 'ziel')::int then
      insert into public.lq_klasse_woche (klasse, woche) values (k.klasse, woche) on conflict do nothing;
      t_plus := t_plus + 1;
      d := jsonb_set(d, '{klassenTruhe}', to_jsonb(woche::text));
      update public.lq_kind c set truhen = c.truhen + 1, daten = jsonb_set(c.daten, '{klassenTruhe}', to_jsonb(woche::text))
       where c.id in (select x.id from public.lq_kind x
                       where x.klasse = k.klasse and x.id <> k.id and x.geloescht is null
                         and x.daten -> 'sterneWoche' ->> 'woche' = woche::text
                         and coalesce(x.daten ->> 'klassenTruhe', '') <> woche::text
                         for update skip locked);
    end if;
  end if;
  update public.lq_kind set xp = xp + plus, xp_tag = heute, xp_heute = schon + plus,
    muenzen = muenzen + m_plus + a_plus, muenzen_tag = heute, muenzen_heute = m_schon + m_plus, truhen = truhen + t_plus,
    klassenpunkte = klassenpunkte + p_plus, daten = d, zuletzt = now(),
    zeit_tag = heute, zeit_heute = z_schon + least(900, greatest(0, coalesce(p_sekunden, 120)))
   where id = k.id returning * into k;
  return jsonb_build_object('plus', plus, 'muenzenPlus', m_plus, 'truhenPlus', t_plus, 'punktePlus', p_plus,
    'aufgabenPlus', a_plus, 'aufgabenNeu', a_neu, 'wiederholung', wdh, 'stand', public.lq_stand_json(k));
end;
$$;

-- — Klassenliste der Lehrkraft: wie 20261125_lernquest_klassenaufgabe.sql, dazu das Limit —

create or replace function public.lq_klassen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'code', l.code, 'geloescht', l.geloescht, 'extra', l.extra_wdh,
      'wochenZiel', l.wochen_ziel, 'zeitLimit', l.zeit_limit, 'aufgabe', public.lq_klassen_aufgabe(l.id),
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

/** Lernzeit je Tag in Minuten (5–240) oder null für keine Grenze. */
create function public.lq_zeitlimit_setzen(p_schluessel text[], p_klasse uuid, p_minuten int) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_minuten is not null and p_minuten not between 5 and 240 then raise exception 'ungueltig'; end if;
  update public.lq_klasse set zeit_limit = p_minuten where id = p_klasse;
end;
$$;
