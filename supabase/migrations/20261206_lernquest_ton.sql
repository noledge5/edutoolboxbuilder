-- Lernquest: Vorlesen mit aufgenommener Stimme (Wunsch der Lehrkraft am 26.11.2026: die Stimmen der Geräte klingen auf
-- vielen Handys fehlerhaft oder blechern). Schickt die Lehrkraft eine Station an eine Klasse, lässt ihr Baukasten jeden
-- englischen Text, den ein Kind dort hören kann, von Google sprechen und legt die MP3 hier ab, unter dem SHA-256 von
-- „en-GB|<gesprochener Text>“ (src/lernquest/stimme.ts). Die Kinder-App holt die Aufnahmen vorab und spielt sie; ohne
-- Aufnahme spricht wie bisher das Gerät. Die Aufnahmen sind nicht persönlich (Sätze aus dem Unterrichtsmaterial):
-- lesen dürfen alle, schreiben nur Lehrkräfte mit einer Klasse.

create table public.lq_ton (
  schluessel text primary key check (schluessel ~ '^[0-9a-f]{64}$'),
  daten bytea not null check (octet_length(daten) between 200 and 200000),
  erstellt timestamptz not null default now()
);
alter table public.lq_ton enable row level security;
revoke all on public.lq_ton from anon, authenticated;

/** Die Aufnahmen zu höchstens 60 Schlüsseln als {schluessel: base64-MP3}; fehlende fehlen in der Antwort. */
create function public.lq_ton_holen(p_schluessel text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_schluessel is null or cardinality(p_schluessel) > 60 then raise exception 'ungueltig'; end if;
  return (
    select coalesce(jsonb_object_agg(t.schluessel, replace(encode(t.daten, 'base64'), E'\n', '')), '{}'::jsonb)
    from public.lq_ton t
    where t.schluessel = any (p_schluessel)
  );
end;
$$;

/** Welche der Schlüssel noch keine Aufnahme haben (der Baukasten nimmt nur diese auf); höchstens 500. */
create function public.lq_ton_fehlend(p_schluessel text[]) returns text[]
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_schluessel is null or cardinality(p_schluessel) > 500 then raise exception 'ungueltig'; end if;
  return (
    select coalesce(array_agg(distinct s), '{}')
    from unnest(p_schluessel) s
    where not exists (select 1 from public.lq_ton t where t.schluessel = s)
  );
end;
$$;

/**
 * Speichert Aufnahmen: p_toene = [{"s": Schlüssel, "d": base64-MP3}], höchstens 20 je Aufruf. Nur Lehrkräfte mit einer
 * Klasse; höchstens 50 000 Aufnahmen insgesamt. Vorhandene bleiben, wie sie sind. Gibt die Zahl der neuen zurück.
 */
create function public.lq_ton_speichern(p_schluessel text[], p_toene jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare
  x jsonb;
  d bytea;
  n int := 0;
begin
  if not exists (select 1 from public.lq_klasse k where k.besitzer = any (public.lq_besitzer(p_schluessel))) then
    raise exception 'zugang';
  end if;
  if p_toene is null or jsonb_typeof(p_toene) <> 'array' or jsonb_array_length(p_toene) > 20 then raise exception 'ungueltig'; end if;
  if (select count(*) from public.lq_ton) + jsonb_array_length(p_toene) > 50000 then raise exception 'voll'; end if;
  for x in select e from jsonb_array_elements(p_toene) e loop
    if jsonb_typeof(x -> 's') is distinct from 'string' or (x ->> 's') !~ '^[0-9a-f]{64}$'
       or jsonb_typeof(x -> 'd') is distinct from 'string' then
      raise exception 'ungueltig';
    end if;
    begin
      d := decode(x ->> 'd', 'base64');
    exception when others then
      raise exception 'ungueltig';
    end;
    -- eine MP3: ID3-Kopf oder Rahmen-Sync am Anfang
    if octet_length(d) not between 200 and 200000
       or not (substring(d from 1 for 3) = '\x494433'::bytea or get_byte(d, 0) = 255) then
      raise exception 'ungueltig';
    end if;
    insert into public.lq_ton (schluessel, daten) values (x ->> 's', d) on conflict (schluessel) do nothing;
    if found then n := n + 1; end if;
  end loop;
  return n;
end;
$$;
