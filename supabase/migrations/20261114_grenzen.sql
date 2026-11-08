-- Limits against abuse of the two public entry points (the free database holds 500 MB):
-- a hand-in is at most 1 MB with short ids and is refused once results fill 200 MB;
-- new sync rooms are refused once the database passes 300 MB (existing rooms keep working), and at most 50 exist.

create or replace function public.einreichen(p_auftrag text, p_abgabe text, p_daten text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if p_auftrag is null or char_length(p_auftrag) > 64 or p_abgabe is null or char_length(p_abgabe) > 64
     or p_daten is null or char_length(p_daten) > 1000000 then
    raise exception 'ungueltig';
  end if;
  if pg_catalog.pg_total_relation_size('public.ergebnisse') > 200000000 then
    raise exception 'voll';
  end if;
  -- A flood of entries for one assignment is refused.
  if (select count(*) from public.ergebnisse where auftrag = p_auftrag) >= 5000 then
    raise exception 'zu viele Abgaben';
  end if;
  insert into public.ergebnisse (auftrag, abgabe, daten) values (p_auftrag, p_abgabe, p_daten);
end;
$function$;

create or replace function public.abgleich_pruefen(p_raum text, p_token text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  h text;
  t text;
begin
  if p_raum is null or p_raum !~ '^[0-9a-f]{32}$' or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'ungueltig';
  end if;
  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select r.token into t from public.abgleich_raum r where r.raum = p_raum;
  if not found then
    if (select count(*) from public.abgleich_raum) >= 50
       or pg_catalog.pg_database_size(pg_catalog.current_database()) > 300000000 then
      raise exception 'voll';
    end if;
    insert into public.abgleich_raum (raum, token) values (p_raum, h);
  elsif t <> h then
    raise exception 'zugang';
  else
    update public.abgleich_raum set benutzt = now() where raum = p_raum and benutzt < now() - interval '1 hour';
  end if;
end;
$function$;
