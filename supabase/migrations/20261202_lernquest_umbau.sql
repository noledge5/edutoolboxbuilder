-- Lernquest: Umbau-Schalter je Klasse (Wunsch der Lehrkraft am 20.11.2026, Projekt „baukasten“). Vorher war der Umbau
-- eine Konstante in der App; jetzt schaltet die Lehrkraft jede Klasse auf der Lehrerseite selbst live.
-- - Bestehende Klassen bleiben im Umbau, bis die Lehrkraft sie anschaltet; neue Klassen sind gleich live.
-- - Die App zeigt die Umbau-Seite, solange der Spielstand nicht ausdrücklich 'umbau': false sagt (auch vor dieser
--   Migration). Nur Anzeige: Der Server nimmt Runden weiter an, damit Runden, die auf Geräten warten, ankommen.
-- - Gleich in der App: src/lernquest/app/LernquestApp.tsx (imUmbau), Schalter src/lernquest/teacher/UmbauSchalter.tsx.

alter table public.lq_klasse add column umbau boolean not null default false;
update public.lq_klasse set umbau = true;

-- — Spielstand: wie 20261201_lernquest_lernzeit.sql, dazu der Umbau —

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
    -- Lernzeit heute (Sekunden in Runden) und das Limit der Klasse in Minuten (null: keins).
    'zeit', jsonb_build_object('tag', ((now() at time zone 'Europe/Berlin')::date)::text,
      'sekunden', case when k.zeit_tag = (now() at time zone 'Europe/Berlin')::date then k.zeit_heute else 0 end,
      'limit', (select l.zeit_limit from public.lq_klasse l where l.id = k.klasse)),
    -- Neu: Ist die Klasse im Umbau, zeigt die App die Umbau-Seite.
    'umbau', (select l.umbau from public.lq_klasse l where l.id = k.klasse)
  ) || case when k.daten -> 'aufgaben' ->> 'tag' = ((now() at time zone 'Europe/Berlin')::date)::text
         then jsonb_build_object('aufgaben', k.daten -> 'aufgaben') else '{}'::jsonb end
$$;

-- — Klassenliste der Lehrkraft: wie 20261201_lernquest_lernzeit.sql, dazu der Umbau —

create or replace function public.lq_klassen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'code', l.code, 'geloescht', l.geloescht, 'extra', l.extra_wdh,
      'wochenZiel', l.wochen_ziel, 'zeitLimit', l.zeit_limit, 'umbau', l.umbau, 'aufgabe', public.lq_klassen_aufgabe(l.id),
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

/** Klasse in den Umbau (true) oder live (false); nur die Lehrkraft der Klasse. */
create function public.lq_umbau_setzen(p_schluessel text[], p_klasse uuid, p_umbau boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_umbau is null then raise exception 'ungueltig'; end if;
  update public.lq_klasse set umbau = p_umbau where id = p_klasse;
end;
$$;
