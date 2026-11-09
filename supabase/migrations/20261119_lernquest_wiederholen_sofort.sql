-- Lernquest: „Wiederholen sofort“ (Projekt „baukasten“). Gewünscht von der Lehrkraft am 09.11.2026 („z. B. wegen
-- morgen Klassenarbeit“). Die Lehrkraft wählt Stunden und einen Zeitraum (höchstens 14 Tage); in der Zeit sind im
-- „Wiederholen“ der Kinder alle Aufgaben dieser Stunden dran, die sie seit dem Start nicht beantwortet haben (auch nie
-- gespielte). Was dran ist, rechnet die App (rules.ts `extraFaellig`); der Server hält nur die Einstellung der Klasse.
-- Belohnung wie jede Wiederholung (ein Drittel, 20261117_lernquest_wiederholung.sql).

alter table public.lq_klasse add column extra_wdh jsonb;

/** Setzt „Wiederholen sofort“ für eine Klasse ({ab, bis, stunden}) oder beendet es (null). Nur die Besitzerin;
 *  `ab` heute ± 1 Tag (Zeitzone des Geräts), `bis` höchstens 14 Tage danach, nur freigeschaltete Stunden. */
create function public.lq_wiederholen_setzen(p_schluessel text[], p_klasse uuid, p_extra jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ab date;
  bis date;
  st jsonb := p_extra -> 'stunden';
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_extra is null or p_extra = 'null'::jsonb then
    update public.lq_klasse set extra_wdh = null where id = p_klasse;
    return;
  end if;
  begin
    ab := (p_extra ->> 'ab')::date;
    bis := (p_extra ->> 'bis')::date;
  exception when others then
    raise exception 'ungueltig';
  end;
  if ab is null or bis is null or ab < current_date - 1 or ab > current_date + 1 or bis < ab or bis > ab + 14
     or jsonb_typeof(st) is distinct from 'array' or jsonb_array_length(st) not between 1 and 200
     or exists (select 1 from jsonb_array_elements(st) e
                 where jsonb_typeof(e) <> 'string'
                    or not exists (select 1 from public.lq_paket p where p.klasse = p_klasse and p.stunde = e #>> '{}')) then
    raise exception 'ungueltig';
  end if;
  update public.lq_klasse
     set extra_wdh = jsonb_build_object('ab', to_char(ab, 'YYYY-MM-DD'), 'bis', to_char(bis, 'YYYY-MM-DD'), 'stunden', st)
   where id = p_klasse;
end;
$$;

-- Wie bisher, dazu 'extra' (die Einstellung der Klasse).
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
    'jetzt', now()
  );
end;
$$;

create or replace function public.lq_klassen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b text[] := public.lq_besitzer(p_schluessel);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'code', l.code, 'geloescht', l.geloescht, 'extra', l.extra_wdh,
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
