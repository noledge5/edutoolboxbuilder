-- Lernquest Klassendorf, Stufe 1 „Dorfkasse“ (Projekt „baukasten“). Entschieden von der Lehrkraft am 13.11.2026
-- (docs/idee-klassendorf.md, docs/roadmap.md). Die Regeln stehen gleich in src/lernquest/dorf.ts (DORF_GEBAEUDE,
-- SPENDE_WOCHE, spendeWert, spendeNoetig); beide zusammen ändern.
-- - Die Lehrkraft schaltet das Dorf je Klasse an (aus ist der Standard) und startet ein Projekt: ein Gebäude aus einer
--   festen Liste, ein Ziel in Münzen und auf Wunsch eine echte Belohnung (Freitext). Höchstens ein laufendes Projekt je
--   Klasse, jedes Gebäude einmal.
-- - Kinder spenden Münzen; jede Münze zählt 1,5-fach (abgerundet: m + m/2). Höchstens 200 Münzen je Kind und Woche
--   (Mo–So, Berlin). Mehr als nötig nimmt der Server nicht: Er zieht nur so viele Münzen ab, wie das Projekt noch braucht.
-- - Fertig: Das Gebäude steht im Dorf, mit den Namen aller, die geholfen haben (ohne Beträge).
-- - Löscht die Lehrkraft ein laufendes Projekt, bekommt jedes Kind seine Münzen zurück.

alter table public.lq_klasse add column dorf boolean not null default false;

create table public.lq_dorf_projekt (
  id uuid primary key default gen_random_uuid(),
  klasse uuid not null references public.lq_klasse (id) on delete cascade,
  gebaeude text not null check (gebaeude in ('brunnen', 'bruecke', 'baeckerei', 'bibliothek', 'sternwarte', 'festwiese')),
  ziel int not null check (ziel between 50 and 20000),
  -- Gezählte Münzen (mit Bonus), höchstens das Ziel.
  stand int not null default 0 check (stand >= 0),
  belohnung text check (char_length(belohnung) between 1 and 80),
  erstellt timestamptz not null default now(),
  fertig timestamptz,
  unique (klasse, gebaeude),
  check (stand <= ziel)
);
create unique index lq_dorf_projekt_laufend on public.lq_dorf_projekt (klasse) where fertig is null;

create table public.lq_spende (
  id uuid primary key default gen_random_uuid(),
  projekt uuid not null references public.lq_dorf_projekt (id) on delete cascade,
  kind uuid not null references public.lq_kind (id) on delete cascade,
  -- Bezahlte Münzen und was sie gezählt haben (mit Bonus).
  muenzen int not null check (muenzen > 0),
  wert int not null check (wert > 0),
  erstellt timestamptz not null default now()
);
create index lq_spende_projekt on public.lq_spende (projekt);
create index lq_spende_kind on public.lq_spende (kind, erstellt);

alter table public.lq_dorf_projekt enable row level security;
alter table public.lq_spende enable row level security;
revoke all on public.lq_dorf_projekt, public.lq_spende from anon, authenticated;

-- — Hilfen (nicht von außen aufrufbar) —

/** Münzen, die das Kind in dieser Woche gespendet hat. */
create function public.lq_spende_woche(p_kind uuid) returns int
language sql stable set search_path = '' as $$
  select coalesce(sum(s.muenzen), 0)::int from public.lq_spende s
   where s.kind = p_kind and (s.erstellt at time zone 'Europe/Berlin') >= public.lq_woche()
$$;

/** Das Dorf einer Klasse: an/aus, laufendes Projekt, fertige Gebäude mit Stiftern (Namen ohne Beträge).
 *  `p_kind`: dazu die eigenen Spenden dieser Woche (für die Kinder-App). */
create function public.lq_dorf_json(p_klasse uuid, p_kind uuid default null) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'an', l.dorf,
    'projekt', (select jsonb_build_object('id', p.id, 'gebaeude', p.gebaeude, 'ziel', p.ziel, 'stand', p.stand, 'belohnung', p.belohnung,
                  'helfer', (select count(distinct s.kind) from public.lq_spende s join public.lq_kind c on c.id = s.kind
                              where s.projekt = p.id and c.geloescht is null))
                from public.lq_dorf_projekt p where p.klasse = l.id and p.fertig is null),
    'fertig', coalesce((select jsonb_agg(jsonb_build_object('gebaeude', p.gebaeude, 'belohnung', p.belohnung,
                  'fertig', to_char(p.fertig at time zone 'Europe/Berlin', 'YYYY-MM-DD'),
                  'stifter', coalesce((select jsonb_agg(x.name order by x.name) from (
                      select distinct c.name from public.lq_spende s join public.lq_kind c on c.id = s.kind
                       where s.projekt = p.id and c.geloescht is null) x), '[]'::jsonb)
                ) order by p.fertig) from public.lq_dorf_projekt p where p.klasse = l.id and p.fertig is not null), '[]'::jsonb),
    'woche', case when p_kind is null then null else public.lq_spende_woche(p_kind) end
  )
  from public.lq_klasse l where l.id = p_klasse
$$;

-- — Kinder —

/** Das Dorf der eigenen Klasse. */
create function public.lq_dorf(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
begin
  return public.lq_dorf_json(k.klasse, k.id);
end;
$$;

/** Spendet Münzen für das laufende Projekt der eigenen Klasse. Antwort {dorf, stand}; Fehler 'ungueltig' (Dorf aus,
 *  kein Projekt, Betrag nicht 1–200), 'muenzen', 'grenze' (Deckel der Woche). */
create function public.lq_spenden(p_token text, p_muenzen int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  p public.lq_dorf_projekt;
  m int;
  rest int;
  wert int;
begin
  if p_muenzen is null or p_muenzen not between 1 and 200 then raise exception 'ungueltig'; end if;
  if not (select l.dorf from public.lq_klasse l where l.id = k.klasse) then raise exception 'ungueltig'; end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select * into p from public.lq_dorf_projekt x where x.klasse = k.klasse and x.fertig is null for update;
  if p.id is null then raise exception 'ungueltig'; end if;
  rest := 200 - public.lq_spende_woche(k.id);
  if rest <= 0 then raise exception 'grenze'; end if;
  -- Nicht mehr als die Woche erlaubt und das Projekt noch braucht (kleinstes m mit m + m/2 >= fehlend).
  m := least(p_muenzen, rest, (2 * (p.ziel - p.stand) + 2) / 3);
  if m < 1 then raise exception 'ungueltig'; end if;
  if k.muenzen < m then raise exception 'muenzen'; end if;
  wert := m + m / 2;
  update public.lq_kind set muenzen = muenzen - m where id = k.id returning * into k;
  insert into public.lq_spende (projekt, kind, muenzen, wert) values (p.id, k.id, m, wert);
  update public.lq_dorf_projekt set stand = least(ziel, stand + wert),
         fertig = case when stand + wert >= ziel then now() else null end
   where id = p.id;
  return jsonb_build_object('dorf', public.lq_dorf_json(k.klasse, k.id), 'stand', public.lq_stand_json(k));
end;
$$;

-- — Lehrkraft —

create function public.lq_dorf_lehrkraft(p_schluessel text[], p_klasse uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  return public.lq_dorf_json(p_klasse);
end;
$$;

create function public.lq_dorf_schalten(p_schluessel text[], p_klasse uuid, p_an boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  update public.lq_klasse set dorf = coalesce(p_an, false) where id = p_klasse;
  return public.lq_dorf_json(p_klasse);
end;
$$;

/** Startet ein Projekt; 'ungueltig', wenn schon eins läuft oder das Gebäude schon steht. */
create function public.lq_dorf_projekt_starten(p_schluessel text[], p_klasse uuid, p_gebaeude text, p_ziel int, p_belohnung text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b text := nullif(btrim(coalesce(p_belohnung, '')), '');
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  if p_ziel is null or p_ziel not between 50 and 20000 or char_length(b) > 80 then raise exception 'ungueltig'; end if;
  begin
    insert into public.lq_dorf_projekt (klasse, gebaeude, ziel, belohnung) values (p_klasse, p_gebaeude, p_ziel, b);
  exception when unique_violation or check_violation then
    raise exception 'ungueltig';
  end;
  return public.lq_dorf_json(p_klasse);
end;
$$;

/** Löscht das laufende Projekt; jedes Kind bekommt seine gespendeten Münzen zurück. */
create function public.lq_dorf_projekt_loeschen(p_schluessel text[], p_klasse uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  p public.lq_dorf_projekt;
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  select * into p from public.lq_dorf_projekt x where x.klasse = p_klasse and x.fertig is null for update;
  if p.id is null then raise exception 'ungueltig'; end if;
  update public.lq_kind c set muenzen = c.muenzen + s.summe
    from (select kind, sum(muenzen)::int as summe from public.lq_spende where projekt = p.id group by kind) s
   where c.id = s.kind;
  delete from public.lq_dorf_projekt where id = p.id;
  return public.lq_dorf_json(p_klasse);
end;
$$;

revoke execute on function public.lq_spende_woche(uuid), public.lq_dorf_json(uuid, uuid) from public, anon, authenticated;
