-- Lernquest: Frisur und Haarfarbe (Projekt „baukasten“). Gewünscht von der Lehrkraft am 07.11.2026.
-- Die Haare sind jetzt eine eigene Ebene: `frisur` (Kennung aus FRISUREN in src/lernquest/teile.ts, neue Frisuren
-- brauchen keine Server-Änderung) und `haarfarbe` 0–4 (HAARFARBEN). `figur` 0–2 bleibt erlaubt (ältere App-Stände).
-- Weil `frisur` frei wählbar ist, zählt lq_bonus jetzt nur noch die Teile auf den sechs Plätzen: vorher galt jeder
-- Wert im Avatar als Teile-Kennung, eine Frisur „krone“ hätte also den Kronen-Bonus gebracht.

create or replace function public.lq_bonus(p_avatar jsonb, out muenzen int, out herz int)
language sql stable set search_path = '' as $$
  select least(20, coalesce(sum(t.bonus_muenzen), 0))::int, least(2, coalesce(sum(t.bonus_herz), 0))::int
  from public.lq_teil t
  where exists (
    select 1 from jsonb_each_text(coalesce(p_avatar, '{}'::jsonb)) e
     where e.key in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund') and e.value = t.id and e.key = t.slot
  )
$$;

/** Legt Teile an: je Platz ein Teil, das das Kind hat (oder ein Startteil), '' für nichts; dazu die Hautfarbe 0–5,
 *  die Frisur (Kennung, 1–24 Kleinbuchstaben/Ziffern), die Haarfarbe 0–4 und (ältere App) die Figur 0–2. */
create or replace function public.lq_avatar_setzen(p_token text, p_avatar jsonb) returns jsonb
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
    elsif e.key = 'figur' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 2 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('figur', (e.value::text)::int);
    elsif e.key = 'haarfarbe' then
      if jsonb_typeof(e.value) <> 'number' or (e.value::text)::int not between 0 and 4 then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('haarfarbe', (e.value::text)::int);
    elsif e.key = 'frisur' then
      if jsonb_typeof(e.value) <> 'string' or e.value #>> '{}' !~ '^[a-z0-9]{1,24}$' then raise exception 'ungueltig'; end if;
      a := a || jsonb_build_object('frisur', e.value #>> '{}');
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
