-- Lernquest: eigene Frisuren von der Lehrerseite (Projekt „baukasten“). Gewünscht von der Lehrkraft am 09.11.2026.
-- Wie die eigenen Teile (20261118_lernquest_eigene_teile.sql): die Admin-Lehrkraft legt eine Frisur mit Namen und ihren
-- fünf Haarfarben-Ebenen an (`haare-<id>-<0–4>`, 20261120_lernquest_frisur_bilder.sql). Frisuren wählen die Kinder frei,
-- der Avatar nimmt jede Kennung (20261110_lernquest_frisur.sql), darum nur eine Liste mit Namen. Aus dem Spiel genommen
-- heißt: nicht mehr zur Wahl; wer sie trägt, behält sie. Kein Löschen.

create table public.lq_frisur (
  id text primary key check (id ~ '^f[0-9a-f]{10}$'),
  name text not null,
  aktiv boolean not null default true,
  erstellt timestamptz not null default now()
);
alter table public.lq_frisur enable row level security;
revoke all on public.lq_frisur from anon, authenticated;

/** Legt eine eigene Frisur mit ihren fünf Ebenen an (alles oder nichts): `p_bilder` = [{typ, daten}] je Haarfarbe
 *  0–4. Nur für Admins, höchstens 50 eigene Frisuren. Gibt die Kennung zurück. Fehler wie lq_bild_setzen. */
create function public.lq_frisur_anlegen(p_schluessel text[], p_name text, p_bilder jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.lq_teil_name(p_name);
  id text;
  i int;
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if n is null or jsonb_typeof(p_bilder) is distinct from 'array' or jsonb_array_length(p_bilder) <> 5 then
    raise exception 'ungueltig';
  end if;
  if (select count(*) from public.lq_frisur) >= 50 then raise exception 'voll'; end if;
  id := 'f' || substr(md5(gen_random_uuid()::text), 1, 10);
  insert into public.lq_frisur (id, name) values (id, n);
  for i in 0..4 loop
    perform public.lq_bild_setzen(p_schluessel, 'haare-' || id || '-' || i, p_bilder -> i ->> 'typ', p_bilder -> i ->> 'daten');
  end loop;
  return id;
end;
$$;

/** Benennt eine eigene Frisur um und nimmt sie aus der Wahl oder wieder hinein. Nur für Admins. */
create function public.lq_frisur_aendern(p_schluessel text[], p_frisur text, p_name text, p_aktiv boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.lq_teil_name(p_name);
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if n is null or p_aktiv is null then raise exception 'ungueltig'; end if;
  update public.lq_frisur set name = n, aktiv = p_aktiv where id = p_frisur;
  if not found then raise exception 'ungueltig'; end if;
end;
$$;

/** Die eigenen Frisuren für App und Lehrerseite: [{id, name, aktiv}]. Für alle. */
create function public.lq_frisuren_eigen() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'name', f.name, 'aktiv', f.aktiv) order by f.erstellt), '[]'::jsonb)
  from public.lq_frisur f
$$;

/** Wie 20261118_lernquest_eigene_teile.sql; dazu: die Ebenen einer eigenen Frisur bleiben (sie hat keine Zeichnung). */
create or replace function public.lq_bild_loeschen(p_schluessel text[], p_teil text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.lq_ist_admin(p_schluessel) then raise exception 'zugang'; end if;
  if exists (select 1 from public.lq_teil t where t.id = p_teil and t.eigen)
     or exists (select 1 from public.lq_frisur f where p_teil ~ ('^haare-' || f.id || '-[0-4]$')) then
    raise exception 'ungueltig';
  end if;
  delete from public.lq_bild where teil = p_teil;
end;
$$;
