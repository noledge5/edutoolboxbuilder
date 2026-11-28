-- Lernquest: der Wächter der Region (Solo-Boss, 28.11.2026; docs/lernquest.md „Solo-Boss: der Wächter der Region“).
-- Der Meilenstein am Ende einer Region ist ein Kampf gegen ihren Wächter. Die Runde selbst meldet die App wie bisher
-- über lq_runde_melden (stunde '', zählt wie eine Wiederholung); diese Funktion gibt beim ersten Sieg je Region eine
-- Truhe, wie der Klassen-Boss beim ersten Sieg je Region.
-- Sieg ab 80 % beim ersten Versuch (MEILENSTEIN_GUT in karte.ts). Die Region muss es in der Klasse geben, mit mindestens
-- zwei Stationen, und jede hat beim Kind einen Stern (wie „erledigt“ auf der Karte: der höhere aus Bestwerten und
-- festgehaltenen Sternen). Besiegte Regionen stehen in daten.waechter (Modul-Ids).
-- Keine Prüfung der Lernzeit: die Runde davor ist schon gezählt und darf das Limit gerade erreicht haben.

create or replace function public.lq_waechter_melden(p_token text, p_modul text, p_richtig int, p_gesamt int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  besiegt jsonb;
  stationen int;
  mit_stern int;
begin
  if p_modul is null or char_length(p_modul) not between 1 and 80
     or p_gesamt is null or p_gesamt < 1 or p_gesamt > 20 or p_richtig is null or p_richtig < 0 or p_richtig > p_gesamt then
    raise exception 'ungueltig';
  end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  besiegt := case when jsonb_typeof(k.daten -> 'waechter') = 'array' then k.daten -> 'waechter' else '[]'::jsonb end;
  -- Nicht besiegt oder schon einmal besiegt: keine Truhe, kein Fehler.
  if p_richtig * 100 < p_gesamt * 80 or besiegt ? p_modul then
    return jsonb_build_object('truhe', false, 'stand', public.lq_stand_json(k));
  end if;
  select count(*),
         count(*) filter (where greatest(
           public.lq_sterne(coalesce(k.daten -> 'bestwerte' -> p.stunde, '[]'::jsonb), public.lq_stufen(p.daten -> 'uebungen')),
           coalesce((k.daten -> 'sterneStationen' ->> p.stunde)::int, 0)) > 0)
    into stationen, mit_stern
    from public.lq_paket p
   where p.klasse = k.klasse and p.daten -> 'modul' ->> 'id' = p_modul;
  if stationen < 2 or mit_stern < stationen then raise exception 'ungueltig'; end if;
  update public.lq_kind c
     set truhen = c.truhen + 1, daten = jsonb_set(c.daten, '{waechter}', besiegt || to_jsonb(p_modul)), zuletzt = now()
   where c.id = k.id
  returning * into k;
  return jsonb_build_object('truhe', true, 'stand', public.lq_stand_json(k));
end;
$$;
