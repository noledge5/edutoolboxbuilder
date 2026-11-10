-- Lernquest: „+Schaden“ als Ausrüstungs-Bonus im Bosskampf (07.11.2026, mit der Lehrkraft entschieden).
-- Werkzeuge und der Ritterhelm geben je richtiger Antwort etwas mehr Schaden, zusammen höchstens +3. Der Bonus kommt
-- vor dem Verdoppeln ab drei richtig in Folge dazu. Gleich in `src/lernquest/teile.ts` (`schaden`, `SCHADEN_MAX`)
-- und `src/lernquest/rules.ts` (`bossSchaden`).

alter table public.lq_teil add column bonus_schaden int not null default 0;

update public.lq_teil t set bonus_schaden = v.schaden
  from (values
    ('ritterhelm', 1),
    ('fernrohr', 1),
    ('zauberstab', 2),
    ('sternenschwert', 3),
    ('dreizack', 2)
  ) as v(id, schaden)
 where t.id = v.id;

/** Schaden-Bonus der angelegten Teile (nur die sechs Plätze, wie lq_bonus), höchstens +3. */
create function public.lq_bonus_schaden(p_avatar jsonb) returns int
language sql stable set search_path = '' as $$
  select least(3, coalesce(sum(t.bonus_schaden), 0))::int
  from public.lq_teil t
  where exists (
    select 1 from jsonb_each_text(coalesce(p_avatar, '{}'::jsonb)) e
     where e.key in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund') and e.value = t.id and e.key = t.slot
  )
$$;
revoke execute on function public.lq_bonus_schaden(jsonb) from public, anon, authenticated;

-- Wie in 20261107_lernquest_boss.sql, nur mit dem Bonus beim Schaden.
create or replace function public.lq_boss_antworten(p_token text, p_boss uuid, p_frage int, p_wahl int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  b public.lq_boss;
  f jsonb;
  s int;
  ok boolean;
  ms double precision;
  schaden int := 0;
begin
  if not exists (select 1 from public.lq_boss x where x.id = p_boss and x.klasse = k.klasse) then raise exception 'ungueltig'; end if;
  b := public.lq_boss_ticken(p_boss);
  perform public.lq_boss_dazu(b, k.id);
  select * into b from public.lq_boss x where x.id = p_boss for update;
  if p_frage is null or b.phase <> 'frage' or b.frage <> p_frage or now() > b.start + interval '21.5 seconds' then
    return jsonb_build_object('angenommen', false);
  end if;
  f := b.fragen -> b.frage;
  if p_wahl is null or p_wahl < 0 or p_wahl >= jsonb_array_length(f -> 'optionen') then raise exception 'ungueltig'; end if;
  if exists (select 1 from public.lq_boss_antwort a where a.boss = b.id and a.kind = k.id and a.frage = b.frage) then
    return jsonb_build_object('angenommen', false);
  end if;
  select x.serie into s from public.lq_boss_kind x where x.boss = b.id and x.kind = k.id for update;
  ok := p_wahl = (f ->> 'richtig')::int;
  s := case when ok then s + 1 else 0 end;
  if ok then
    ms := greatest(0, extract(epoch from (now() - b.start)) * 1000);
    schaden := ((10 + round((10 * greatest(0, 1 - ms / 20000))::numeric))::int + public.lq_bonus_schaden(k.avatar))
      * case when s >= 3 then 2 else 1 end;
  end if;
  insert into public.lq_boss_antwort (boss, kind, frage, wahl, richtig, schaden) values (b.id, k.id, b.frage, p_wahl, ok, schaden);
  update public.lq_boss_kind set serie = s where boss = b.id and kind = k.id;
  if schaden > 0 then update public.lq_boss set lp = greatest(0, lp - schaden) where id = b.id; end if;
  return jsonb_build_object('angenommen', true);
end;
$$;
