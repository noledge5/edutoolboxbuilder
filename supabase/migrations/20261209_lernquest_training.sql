-- Lernquest: Training ohne Belohnung (28.11.2026; docs/lernquest.md „Training“). Kinder üben ihre schwersten Karten
-- (Kasten 1 und 2), so oft sie wollen. Der Server zählt nur die Lernzeit wie bei jeder Runde (höchstens 15 Minuten je
-- Runde, ohne Dauer 2) und lehnt nach dem Tageslimit der Klasse ab ('zeit'). Keine Erfahrung, keine Münzen, keine
-- Truhe, kein Lerntag und keine Karteikästen: ein richtiges Training soll keine Karte nach oben schieben (sonst wären
-- Karten nach einer Sitzung „sitzt“ und der Abstand fürs Wiederholen wäre weg). Das Sammeln, das am 17.11. abgestellt
-- wurde, bleibt zu.

create or replace function public.lq_training_melden(p_token text, p_sekunden int default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  heute date := (now() at time zone 'Europe/Berlin')::date;
  z_schon int;
  z_limit int;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  z_schon := case when k.zeit_tag = heute then k.zeit_heute else 0 end;
  select l.zeit_limit into z_limit from public.lq_klasse l where l.id = k.klasse;
  if z_limit is not null and z_schon >= z_limit * 60 then raise exception 'zeit'; end if;
  update public.lq_kind c
     set zeit_tag = heute, zeit_heute = z_schon + least(900, greatest(0, coalesce(p_sekunden, 120))), zuletzt = now()
   where c.id = k.id
  returning * into k;
  return jsonb_build_object('stand', public.lq_stand_json(k));
end;
$$;
