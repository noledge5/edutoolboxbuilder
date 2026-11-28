-- Lernquest: der Spielstand nennt die besiegten Wächter (28.11.2026). Bisher stand der Sieg über einen Wächter nur auf dem
-- Gerät (lernquest:meilensteine, beim Abmelden gelöscht); auf einem zweiten Gerät stand der Wächter wieder auf der
-- Karte. Der Server kennt die Siege seit 20261208_lernquest_waechter.sql (daten.waechter); jetzt gibt lq_stand_json sie
-- mit. Rechte bleiben (create or replace behält sie: nicht von außen aufrufbar).

-- — Spielstand: wie 20261202_lernquest_umbau.sql, dazu die besiegten Wächter —

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
    -- Neu: die besiegten Wächter (Regionen, 20261208), damit Karte und Held sie auf jedem Gerät zeigen.
    'waechter', case when jsonb_typeof(k.daten -> 'waechter') = 'array' then k.daten -> 'waechter' else '[]'::jsonb end,
    -- Lernzeit heute (Sekunden in Runden) und das Limit der Klasse in Minuten (null: keins).
    'zeit', jsonb_build_object('tag', ((now() at time zone 'Europe/Berlin')::date)::text,
      'sekunden', case when k.zeit_tag = (now() at time zone 'Europe/Berlin')::date then k.zeit_heute else 0 end,
      'limit', (select l.zeit_limit from public.lq_klasse l where l.id = k.klasse)),
    -- Neu: Ist die Klasse im Umbau, zeigt die App die Umbau-Seite.
    'umbau', (select l.umbau from public.lq_klasse l where l.id = k.klasse)
  ) || case when k.daten -> 'aufgaben' ->> 'tag' = ((now() at time zone 'Europe/Berlin')::date)::text
         then jsonb_build_object('aufgaben', k.daten -> 'aufgaben') else '{}'::jsonb end
$$;
