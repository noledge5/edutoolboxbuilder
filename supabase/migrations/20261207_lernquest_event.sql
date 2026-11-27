-- Lernquest: Events je Klasse (Wunsch der Lehrkraft am 27.11.2026, Projekt „baukasten“). Die Lehrkraft setzt für eine
-- Klasse ein Event mit Titel und Zeitraum, etwa „Vokabeltest diese Woche“; solange es läuft, sehen die Kinder nur seine
-- Stationen (die anderen sind ausgeblendet), dazu ein Banner und den Look des Events auf der Karte.
-- - lq_klasse.event: {art, titel, ab, bis, stunden} oder null.
-- - lq_event_setzen: nur die Lehrkraft der Klasse; art vokabeltest, klassenarbeit oder eigenes; Titel 1 bis 60 Zeichen;
--   ab frühestens gestern und höchstens 60 Tage voraus; bis zwischen ab und ab + 20 Tage (drei Wochen); 1 bis 200 Stationen, alle
--   freigeschaltet (lq_paket der Klasse, auch Extra-Pakete); null beendet das Event.
-- - lq_mein_stand und lq_klassen liefern event mit.
-- - lq_runde_melden: läuft ein Event (heute, Berliner Zeit, zwischen ab und bis), nimmt der Server nur Runden seiner
--   Stationen an; Wiederholen (stunde '') bleibt. Abgelehnt mit 'ungueltig' wie Runden gesperrter Stunden, die App lässt
--   solche Runden fallen (auch eine, die vor dem Event offline gespielt und erst während des Events gesendet wird).
-- Gleich in der App: src/lernquest/event.ts, app/LernquestApp.tsx, teacher/EventKarte.tsx.

alter table public.lq_klasse add column event jsonb;

/** Event der Klasse setzen oder mit null beenden; nur die Lehrkraft der Klasse. */
create function public.lq_event_setzen(p_schluessel text[], p_klasse uuid, p_event jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  heute date := (now() at time zone 'Europe/Berlin')::date;
  ab date;
  bis date;
  art text;
  titel text;
  st jsonb;
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_event is null or p_event = 'null'::jsonb then
    update public.lq_klasse set event = null where id = p_klasse;
    return;
  end if;
  if jsonb_typeof(p_event) <> 'object' then raise exception 'ungueltig'; end if;
  art := p_event ->> 'art';
  titel := btrim(coalesce(p_event ->> 'titel', ''));
  st := p_event -> 'stunden';
  begin
    ab := (p_event ->> 'ab')::date;
    bis := (p_event ->> 'bis')::date;
  exception when others then
    raise exception 'ungueltig';
  end;
  if art is null or art not in ('vokabeltest', 'klassenarbeit', 'eigenes')
     or char_length(titel) not between 1 and 60
     or ab is null or bis is null or ab < heute - 1 or ab > heute + 60 or bis < ab or bis > ab + 20
     or jsonb_typeof(st) is distinct from 'array' or jsonb_array_length(st) not between 1 and 200
     or exists (select 1 from jsonb_array_elements(st) e
                 where jsonb_typeof(e) <> 'string'
                    or not exists (select 1 from public.lq_paket p where p.klasse = p_klasse and p.stunde = e #>> '{}')) then
    raise exception 'ungueltig';
  end if;
  update public.lq_klasse
     set event = jsonb_build_object('art', art, 'titel', titel, 'ab', to_char(ab, 'YYYY-MM-DD'), 'bis', to_char(bis, 'YYYY-MM-DD'), 'stunden', st)
   where id = p_klasse;
end;
$$;

-- — Spielstand für das Kind: wie 20261119_lernquest_wiederholen_sofort.sql, dazu das Event —

create or replace function public.lq_mein_stand(p_token text, p_seit timestamptz) returns jsonb
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
    'extra', (select l.extra_wdh from public.lq_klasse l where l.id = k.klasse),
    'event', (select l.event from public.lq_klasse l where l.id = k.klasse),
    'jetzt', now()
  );
end;
$$;

-- — Klassen für die Lehrkraft: wie 20261202_lernquest_umbau.sql, dazu das Event —

create or replace function public.lq_klassen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'code', l.code, 'geloescht', l.geloescht, 'extra', l.extra_wdh,
      'wochenZiel', l.wochen_ziel, 'zeitLimit', l.zeit_limit, 'umbau', l.umbau, 'event', l.event, 'aufgabe', public.lq_klassen_aufgabe(l.id),
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

-- — Runde melden: wie 20261201_lernquest_lernzeit.sql, dazu die Prüfung des Events —

create or replace function public.lq_runde_melden(p_token text, p_stunde text, p_runde int, p_richtig int, p_gesamt int, p_leitner jsonb, p_sekunden int default null) returns jsonb
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
  ev jsonb;
begin
  if p_gesamt is null or p_gesamt < 1 or p_gesamt > 20 or p_richtig is null or p_richtig < 0 or p_richtig > p_gesamt
     or p_runde is null or p_runde < 0 or p_runde > 9 then
    raise exception 'ungueltig';
  end if;
  if p_stunde <> '' and not exists (select 1 from public.lq_paket p where p.klasse = k.klasse and p.stunde = p_stunde) then
    raise exception 'ungueltig';
  end if;
  -- Neu: Event der Klasse. Läuft eins, nimmt der Server nur Runden seiner Stationen an; Wiederholen (stunde '') bleibt.
  select l.event into ev from public.lq_klasse l where l.id = k.klasse;
  if p_stunde <> '' and ev is not null and heute between (ev ->> 'ab')::date and (ev ->> 'bis')::date
     and not coalesce((ev -> 'stunden') ? p_stunde, false) then
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
