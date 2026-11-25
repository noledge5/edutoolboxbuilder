-- Lernquest Klassendorf, Stufe 2 Teil B1 „Eigenes Haus“ (Projekt „baukasten“). Entschieden von der Lehrkraft am
-- 25.11.2026 (docs/plan-klassendorf-haeuser.md, docs/roadmap.md). Die Regeln stehen gleich in src/lernquest/dorf.ts
-- (HAUS_STUFEN, hausAusbau); beide zusammen ändern, ein Test vergleicht sie.
-- - Die Lehrkraft schaltet die Häuser je Klasse frei (aus ist der Standard); sie gehören zum Dorf, das an sein muss.
-- - Jedes Kind hat ein Grundstück (Reihenfolge: wann es in die Klasse kam). Stufe 0 Zelt (stellt das Kind mit einem
--   Quiz in der App auf, kostet nichts), 1 Hütte 300 Münzen ab Heldenstufe 1, 2 Holzhaus 800 ab 3, 3 Fachwerkhaus 1800
--   ab 5, 4 Turmhaus 4000 ab 12. Immer nur die nächste Stufe; der Server zieht die Münzen ab.
-- - Kinder sehen alle Häuser ihrer Klasse, aber keine Namen; nur die Lehrkraft sieht, wem welches Haus gehört.

alter table public.lq_klasse add column haeuser boolean not null default false;

create table public.lq_haus (
  kind uuid primary key references public.lq_kind (id) on delete cascade,
  stufe int not null default 0 check (stufe between 0 and 4),
  erstellt timestamptz not null default now(),
  gebaut timestamptz not null default now()
);

alter table public.lq_haus enable row level security;
revoke all on public.lq_haus from anon, authenticated;

-- Das Dorf einer Klasse wie in 20261130_lernquest_dorf.sql, dazu die Häuser: an/aus, alle Grundstücke der Klasse mit
-- ihrer Stufe (null = leer), für die Lehrkraft mit Namen, für das Kind sein eigenes Grundstück. Bei ausgeschalteten
-- Häusern sehen Kinder keine Grundstücke.
create or replace function public.lq_dorf_json(p_klasse uuid, p_kind uuid default null) returns jsonb
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
    'woche', case when p_kind is null then null else public.lq_spende_woche(p_kind) end,
    'haeuser', jsonb_build_object(
      'an', l.haeuser,
      'plaetze', case when p_kind is not null and not l.haeuser then '[]'::jsonb else coalesce((
          select jsonb_agg(case when p_kind is null then jsonb_build_object('stufe', h.stufe, 'name', c.name)
                                else jsonb_build_object('stufe', h.stufe) end order by c.erstellt, c.id)
            from public.lq_kind c left join public.lq_haus h on h.kind = c.id
           where c.klasse = l.id and c.geloescht is null), '[]'::jsonb) end,
      'ich', case when p_kind is null or not l.haeuser then null else (
          select x.nr - 1 from (select c.id, row_number() over (order by c.erstellt, c.id) as nr
                                  from public.lq_kind c where c.klasse = l.id and c.geloescht is null) x
           where x.id = p_kind) end
    )
  )
  from public.lq_klasse l where l.id = p_klasse
$$;

-- — Kinder —

/** Baut die nächste Hausstufe: `p_stufe` muss genau die nächste sein (0 = Zelt aufstellen), so baut ein doppelter
 *  Tipp nicht zweimal. Antwort {dorf, stand}; Fehler 'ungueltig' (Häuser aus, falsche Stufe), 'stufe' (Heldenstufe
 *  zu niedrig), 'muenzen'. */
create function public.lq_haus_bauen(p_token text, p_stufe int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  jetzt int;
  preis int;
begin
  if p_stufe is null or p_stufe not between 0 and 4 then raise exception 'ungueltig'; end if;
  if not coalesce((select l.dorf and l.haeuser from public.lq_klasse l where l.id = k.klasse), false) then
    raise exception 'ungueltig';
  end if;
  select c.* into k from public.lq_kind c where c.id = k.id for update;
  select h.stufe into jetzt from public.lq_haus h where h.kind = k.id;
  if p_stufe <> coalesce(jetzt + 1, 0) then raise exception 'ungueltig'; end if;
  if public.lq_heldenstufe(k.xp) < (array[1, 1, 3, 5, 12])[p_stufe + 1] then raise exception 'stufe'; end if;
  preis := (array[0, 300, 800, 1800, 4000])[p_stufe + 1];
  if k.muenzen < preis then raise exception 'muenzen'; end if;
  if preis > 0 then
    update public.lq_kind set muenzen = muenzen - preis where id = k.id returning * into k;
  end if;
  insert into public.lq_haus (kind, stufe) values (k.id, p_stufe)
    on conflict (kind) do update set stufe = excluded.stufe, gebaut = now();
  return jsonb_build_object('dorf', public.lq_dorf_json(k.klasse, k.id), 'stand', public.lq_stand_json(k));
end;
$$;

-- — Lehrkraft —

create function public.lq_haeuser_schalten(p_schluessel text[], p_klasse uuid, p_an boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lq_klasse_pruefen(p_schluessel, p_klasse);
  update public.lq_klasse set haeuser = coalesce(p_an, false) where id = p_klasse;
  return public.lq_dorf_json(p_klasse);
end;
$$;

revoke execute on function public.lq_dorf_json(uuid, uuid) from public, anon, authenticated;
