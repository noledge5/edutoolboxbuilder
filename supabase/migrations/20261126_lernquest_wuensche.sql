-- Lernquest Stufe E: eigene Teile und Frisuren als Wunsch statt mit Bild (Entscheidung der Lehrkraft am 12.11.2026,
-- Projekt „baukasten“). Jedes Teil ist eine Vektorzeichnung im Code; die Admin-Lehrkraft legt ein eigenes Teil oder
-- eine Frisur mit Name, Platz, Seltenheit und einer Beschreibung an („wie soll es aussehen?“). Es ist zuerst nicht im
-- Spiel (aktiv = false, Herkunft „nicht erhältlich“). Claude liest die Wünsche (lq_teil.wunsch), zeichnet das Teil unter
-- seiner Kennung; danach stellt die Lehrkraft die Herkunft ein (lq_teil_einstellen) und es ist im Spiel.
-- Die bisherigen Funktionen mit Bild (lq_teil_anlegen, lq_frisur_anlegen, lq_bild_*) bleiben für alte Stände bestehen.

alter table public.lq_teil add column if not exists wunsch text check (wunsch is null or length(wunsch) <= 500);

/** Legt einen Wunsch an: ein eigenes Teil (Kennung e…) oder eine eigene Frisur (Kennung f…, im Katalog frisur-f…),
 *  nicht im Spiel, mit der Beschreibung für die Zeichnung. Nur für Admins; höchstens 200 eigene Teile, 50 Frisuren. */
create function public.lq_wunsch_anlegen(p_schluessel text[], p_name text, p_slot text, p_seltenheit int, p_wunsch text)
  returns text
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.lq_teil_name(p_name);
  w text := nullif(btrim(p_wunsch), '');
  id text;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if n is null or w is null or length(w) > 500 or translate(w, E'\n', '') ~ '[[:cntrl:]]'
     or p_slot is null or p_slot not in ('kopf', 'augen', 'kleidung', 'werkzeug', 'begleiter', 'hintergrund', 'frisur')
     or p_seltenheit is null or p_seltenheit not between 0 and 4 then
    raise exception 'ungueltig';
  end if;
  if p_slot = 'frisur' then
    if (select count(*) from public.lq_frisur) >= 50 then raise exception 'voll'; end if;
    id := 'f' || substr(md5(gen_random_uuid()::text), 1, 10);
    insert into public.lq_frisur (id, name) values (id, n);
    insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe, name,
      eigen, aktiv, wunsch, erstellt)
      values ('frisur-' || id, 'frisur', p_seltenheit, false, 0, 0, 0, false, n, false, false, w, now());
  else
    if (select count(*) from public.lq_teil t where t.eigen) >= 200 then raise exception 'voll'; end if;
    id := 'e' || substr(md5(gen_random_uuid()::text), 1, 10);
    insert into public.lq_teil (id, slot, seltenheit, start, bonus_muenzen, bonus_herz, bonus_schaden, nur_truhe, name,
      eigen, aktiv, wunsch, erstellt)
      values (id, p_slot, p_seltenheit, false, 0, 0, 0, false, n, true, false, w, now());
  end if;
  return id;
end;
$$;

/** Die Wünsche für die Lehrerseite: [{id, slot, name, wunsch}] (Frisuren mit ihrer Kennung f…). Nur für Admins. */
create function public.lq_wuensche(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', case when t.slot = 'frisur' then substr(t.id, 8) else t.id end,
      'slot', t.slot, 'name', t.name, 'wunsch', t.wunsch) order by t.erstellt), '[]'::jsonb)
    from public.lq_teil t where t.wunsch is not null);
end;
$$;
