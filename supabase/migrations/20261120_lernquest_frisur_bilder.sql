-- Lernquest: Frisuren auf der Lehrerseite hochladen (Projekt „baukasten“). Gewünscht von der Lehrkraft am 09.11.2026.
-- Wie die Teile (20261117_lernquest_bilder.sql), aber je Frisur fünf Ebenen, eine je Haarfarbe: `haare-<frisur>-<0–4>`
-- (die App rechnet die Farben aus der braunen Ebene, wie `npm run lq:bilder`). Die Frisuren stehen nicht in lq_teil
-- (die Kinder wählen sie frei), darum hängt lq_bild nicht mehr fest an lq_teil; lq_bild_setzen prüft die Kennung.

alter table public.lq_bild drop constraint if exists lq_bild_teil_fkey;

/** Wie 20261117_lernquest_bilder.sql; dazu Frisur-Ebenen `haare-<frisur>-<farbe>` (WebP oder PNG, 480 × 480). */
create or replace function public.lq_bild_setzen(p_schluessel text[], p_teil text, p_typ text, p_daten text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  d bytea;
  g int[];
  v bigint;
  slot text;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if p_teil ~ '^haare-[a-z0-9]{1,20}-[0-4]$' then
    slot := 'haare';
  else
    select t.slot into slot from public.lq_teil t where t.id = p_teil;
  end if;
  if slot is null or p_typ is null or p_daten is null or char_length(p_daten) > 540000 then
    raise exception 'ungueltig';
  end if;
  begin
    d := decode(p_daten, 'base64');
  exception when others then
    raise exception 'ungueltig';
  end;
  if octet_length(d) > 400000 then raise exception 'ungueltig'; end if;
  if p_typ = 'image/jpeg' then
    if slot <> 'hintergrund' or octet_length(d) < 4 or substring(d from 1 for 3) <> '\xffd8ff'::bytea then
      raise exception 'ungueltig';
    end if;
  else
    g := public.lq_bild_groesse(d, p_typ);
    if g is null or g <> array[480, 480] then raise exception 'ungueltig'; end if;
  end if;
  if pg_catalog.pg_database_size(pg_catalog.current_database()) > 400000000 then raise exception 'voll'; end if;
  insert into public.lq_bild (teil, typ, daten) values (p_teil, p_typ, d)
    on conflict (teil) do update set typ = excluded.typ, daten = excluded.daten,
      version = nextval('public.lq_bild_version'), geaendert = now()
    returning version into v;
  return v;
end;
$$;
