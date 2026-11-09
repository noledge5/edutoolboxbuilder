-- Lernquest: Bilder der Teile von der Lehrerseite hochladen (Projekt „baukasten“). Gewünscht von der Lehrkraft am
-- 09.11.2026. Nur eine Admin-Lehrkraft lädt hoch; die Bilder gelten für alle Klassen aller Lehrkräfte und gehen vor
-- die eingebauten Bilder der App. Fertige Ebenen (480 × 480, im Browser gemacht), je Teil-ID aus lq_teil eine.
-- Wie bisher nur über Funktionen; Lesen dürfen alle (die Bilder sind nicht persönlich), Schreiben nur die Admins.

-- Admins: Hashes von Lehrkraft-Schlüsseln (wie lq_klasse.besitzer). Eingetragen von Hand per SQL, mit der Lehrkraft;
-- es gibt bewusst keine Funktion, mit der sich jemand selbst einträgt.
create table public.lq_admin (
  hash text primary key check (hash ~ '^[0-9a-f]{64}$'),
  notiz text not null default '',
  seit timestamptz not null default now()
);
alter table public.lq_admin enable row level security;
revoke all on public.lq_admin from anon, authenticated;

-- Die hochgeladenen Bilder. `version` kommt aus einer Folge, also bekommt auch ein nach dem Löschen neu
-- hochgeladenes Bild eine neue Nummer (die App hält Bilder nach Teil und Version im Gerät).
create sequence public.lq_bild_version;
create table public.lq_bild (
  teil text primary key references public.lq_teil (id) on delete cascade,
  typ text not null check (typ in ('image/webp', 'image/png', 'image/jpeg')),
  daten bytea not null check (octet_length(daten) <= 400000),
  version bigint not null default nextval('public.lq_bild_version'),
  geaendert timestamptz not null default now()
);
alter table public.lq_bild enable row level security;
revoke all on public.lq_bild, public.lq_bild_version from anon, authenticated;

/** Ob einer der Schlüssel einer Admin-Lehrkraft gehört (die Lehrerseite zeigt danach „Bilder der Teile“). */
create function public.lq_ist_admin(p_schluessel text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lq_admin a where a.hash = any (public.lq_besitzer(p_schluessel)))
$$;

/** Breite und Höhe aus dem Kopf einer PNG- oder WebP-Datei; null, wenn der Kopf nicht passt. */
create function public.lq_bild_groesse(d bytea, typ text) returns int[]
language plpgsql immutable set search_path = '' as $$
declare
  art text;
  bits bigint;
begin
  if typ = 'image/png' then
    if octet_length(d) < 24 or substring(d from 1 for 8) <> '\x89504e470d0a1a0a'::bytea
       or substring(d from 13 for 4) <> '\x49484452'::bytea then
      return null;
    end if;
    return array[(get_byte(d, 16) << 24) | (get_byte(d, 17) << 16) | (get_byte(d, 18) << 8) | get_byte(d, 19),
                 (get_byte(d, 20) << 24) | (get_byte(d, 21) << 16) | (get_byte(d, 22) << 8) | get_byte(d, 23)];
  elsif typ = 'image/webp' then
    if octet_length(d) < 30 or substring(d from 1 for 4) <> '\x52494646'::bytea
       or substring(d from 9 for 4) <> '\x57454250'::bytea then
      return null;
    end if;
    art := encode(substring(d from 13 for 4), 'escape');
    if art = 'VP8X' then
      return array[(get_byte(d, 24) | (get_byte(d, 25) << 8) | (get_byte(d, 26) << 16)) + 1,
                   (get_byte(d, 27) | (get_byte(d, 28) << 8) | (get_byte(d, 29) << 16)) + 1];
    elsif art = 'VP8 ' then
      return array[(get_byte(d, 26) | (get_byte(d, 27) << 8)) & 16383, (get_byte(d, 28) | (get_byte(d, 29) << 8)) & 16383];
    elsif art = 'VP8L' then
      bits := get_byte(d, 21)::bigint | (get_byte(d, 22)::bigint << 8) | (get_byte(d, 23)::bigint << 16) | (get_byte(d, 24)::bigint << 24);
      return array[((bits & 16383) + 1)::int, (((bits >> 14) & 16383) + 1)::int];
    end if;
  end if;
  return null;
end;
$$;

/** Speichert das Bild eines Teils (ersetzt ein altes) und gibt die neue Version zurück. Nur für Admins; nur Teile
 *  des Katalogs; WebP oder PNG mit 480 × 480, JPEG nur für Hintergründe (dort ist nichts durchsichtig), höchstens
 *  400 KB. Fehler: 'zugang' (kein Admin), 'ungueltig', 'voll' (Datenbank fast voll). */
create function public.lq_bild_setzen(p_schluessel text[], p_teil text, p_typ text, p_daten text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  d bytea;
  g int[];
  v bigint;
  slot text;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  select t.slot into slot from public.lq_teil t where t.id = p_teil;
  if not found or p_typ is null or p_daten is null or char_length(p_daten) > 540000 then
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

/** Löscht das Bild eines Teils; danach gilt wieder das eingebaute Bild bzw. die Zeichnung. Nur für Admins. */
create function public.lq_bild_loeschen(p_schluessel text[], p_teil text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  delete from public.lq_bild where teil = p_teil;
end;
$$;

/** Welche Teile ein hochgeladenes Bild haben: {teil: version}. Für alle (Kinder-App und Lehrerseite). */
create function public.lq_bilder() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(b.teil, b.version), '{}'::jsonb) from public.lq_bild b
$$;

/** Die Bilder einiger Teile (höchstens 10 je Aufruf): [{teil, version, typ, daten (Base64)}]. Für alle. */
create function public.lq_bild_daten(p_teile text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_teile is null or cardinality(p_teile) > 10 then raise exception 'ungueltig'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('teil', b.teil, 'version', b.version, 'typ', b.typ,
                                        'daten', translate(encode(b.daten, 'base64'), E'\n', '')))
      from public.lq_bild b where b.teil = any (p_teile)), '[]'::jsonb);
end;
$$;

revoke execute on function public.lq_bild_groesse(bytea, text) from public, anon, authenticated;
