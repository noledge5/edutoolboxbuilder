-- Lernquest: Seltenheit eine Stufe herunter und neue Truhen (Entscheidung der Lehrkraft, 13.11.2026).
-- 1. Alle Teile außer den gewöhnlichen und den Frisuren rutschen eine Seltenheit herunter (Ungewöhnlich wird
--    Gewöhnlich, …, Legendär wird Episch); Preise und Heldenstufen im Laden folgen der Seltenheit von selbst.
-- 2. Truhen: 55 % nur Münzen (10, 15, 25 oder 40), 45 % ein Teil, die seltenen Stufen seltener als bisher
--    (25 / 12 / 5,5 / 2 / 0,5 %). Spätestens jede 7. Truhe hat etwas Seltenes (vorher jede 5.).
-- Die Zahlen stehen gleich in src/lernquest/teile.ts (MUENZ_CHANCEN, MUENZ_TRUHE, CHANCEN, GARANTIE); ein Test vergleicht.

update public.lq_teil set seltenheit = seltenheit - 1 where seltenheit > 0 and slot <> 'frisur';

create or replace function public.lq_truhe_oeffnen(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  r double precision := random() * 100;
  s int;
  nur_muenzen boolean := r < 55;
  t public.lq_teil;
  doppelt boolean := false;
  wert int := 0;
begin
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  if k.truhen < 1 then raise exception 'ungueltig'; end if;
  if nur_muenzen then
    -- Münzen: 10 (12 %), 15 (18 %), 25 (16 %), 40 (9 %); 10 und 15 zählen als gewöhnlich, 25 und 40 als ungewöhnlich.
    wert := case when r < 12 then 10 when r < 30 then 15 when r < 46 then 25 else 40 end;
    s := case when r < 30 then 0 else 1 end;
  else
    s := case when r < 80 then 0 when r < 92 then 1 when r < 97.5 then 2 when r < 99.5 then 3 else 4 end;
  end if;
  if s < 2 and k.pech >= 6 then
    nur_muenzen := false;
    wert := 0;
    r := random() * 17;
    s := case when r < 12 then 2 when r < 16 then 3 else 4 end;
  end if;
  if not nur_muenzen then
    select * into t from public.lq_teil x where not x.start and x.aktiv and not x.nur_laden
     order by abs(x.seltenheit - s), x.seltenheit desc, random() limit 1;
    if t.id is null then
      nur_muenzen := true;
      s := 0;
      wert := 15;
    else
      s := t.seltenheit;
    end if;
  end if;
  if not nur_muenzen then
    doppelt := t.id = any (k.inventar);
    if doppelt then wert := (array[10, 20, 40, 80, 150])[s + 1]; end if;
  end if;
  update public.lq_kind set truhen = truhen - 1, pech = case when s >= 2 then 0 else pech + 1 end,
    inventar = case when nur_muenzen or doppelt then inventar else inventar || t.id end, muenzen = muenzen + wert
   where id = k.id returning * into k;
  return jsonb_build_object('teil', t.id, 'seltenheit', s, 'doppelt', doppelt, 'muenzen', wert, 'stand', public.lq_stand_json(k));
end;
$$;
