-- Lernquest: die Lehrkraft sieht die besiegten Wächter (28.11.2026). Seit 20261208_lernquest_waechter.sql merkt der
-- Server, welche Regionen ein Kind gemeistert hat (Meilenstein ab 80 %, alle Stationen mit Stern): daten.waechter.
-- Die Klassenliste der Lehrkraft gibt die Liste je Kind mit; die Lehrerseite zeigt „Wächter: 2 von 5“.

-- — Klassen für die Lehrkraft: wie 20261207_lernquest_event.sql, dazu die besiegten Wächter je Kind —

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
          'punkteHand', case when c.punkte_woche = public.lq_woche()::date then c.punkte_hand else 0 end,
          'waechter', case when jsonb_typeof(c.daten -> 'waechter') = 'array' then c.daten -> 'waechter' else '[]'::jsonb end
        ) order by c.name) from public.lq_kind c where c.klasse = l.id), '[]'::jsonb)
    ) order by l.name)
    from public.lq_klasse l where l.besitzer = any (b)
  ), '[]'::jsonb);
end;
$$;
