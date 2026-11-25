-- Lernquest Klassendorf: Häuser gestalten (Projekt „baukasten“). Entschieden von der Lehrkraft am 25.11.2026
-- (docs/plan-klassendorf-haeuser.md, docs/roadmap.md). Braucht 20261203_lernquest_haeuser.sql (vorher einspielen).
-- - Jedes Kind wählt das Aussehen seines Hauses: Farbe von Dach, Wänden, Tür und Fahne, einen Zaun, einen Garten und
--   einen Schmuck. Das kostet nichts und lässt sich jederzeit ändern; höhere Hausstufen haben mehr Auswahl.
-- - Gespeichert wird je Teil die Nummer der Wahl. Die Listen (je Wahl die Hausstufe, ab der sie geht) stehen gleich in
--   src/lernquest/dorf.ts (AUSSEHEN); beide zusammen ändern, ein Test vergleicht sie.
-- - Alle Kinder der Klasse sehen das Aussehen aller Häuser (wie die Stufe), Namen weiter nur die Lehrkraft.

alter table public.lq_haus add column aussehen jsonb;

-- Genau die sieben Teile, je eine erlaubte Wahl für die Hausstufe `p_stufe` (die erste Wahl jedes Teils geht schon beim
-- Zelt, damit auch ein Zelt seine Fahne speichern kann).
create function public.lq_aussehen_ok(p_aussehen jsonb, p_stufe int) returns boolean
language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p_aussehen) = 'object' then
    (select count(*) from jsonb_object_keys(p_aussehen)) = 7
    and (select bool_and(
          case when jsonb_typeof(p_aussehen -> t.teil) = 'number' and (p_aussehen ->> t.teil) ~ '^[0-9]{1,2}$'
               then (p_aussehen ->> t.teil)::int < cardinality(t.ab) and t.ab[(p_aussehen ->> t.teil)::int + 1] <= p_stufe
               else false end)
      from (values
        ('dach', array[0, 1, 2, 2, 3, 4]),
        ('wand', array[0, 1, 1, 2, 2, 3]),
        ('tuer', array[0, 1, 1, 2, 2, 3]),
        ('fahne', array[0, 0, 0, 0, 2, 2]),
        ('zaun', array[0, 1, 2, 2, 3]),
        ('garten', array[0, 1, 1, 2, 3]),
        ('deko', array[0, 1, 2, 2, 3, 4])
      ) as t(teil, ab))
  else false end
$$;

-- Das Dorf wie in 20261203_lernquest_haeuser.sql, dazu das Aussehen jedes Hauses (null = noch nicht gewählt).
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
          select jsonb_agg(case when p_kind is null then jsonb_build_object('stufe', h.stufe, 'name', c.name, 'aussehen', h.aussehen)
                                else jsonb_build_object('stufe', h.stufe, 'aussehen', h.aussehen) end order by c.erstellt, c.id)
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

/** Speichert das Aussehen des eigenen Hauses. Antwort {dorf}; Fehler 'ungueltig' (Häuser aus, noch kein Haus,
 *  unbekannte oder für die Hausstufe gesperrte Wahl). */
create function public.lq_haus_gestalten(p_token text, p_aussehen jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k public.lq_kind := public.lq_sitzung_pruefen(p_token);
  jetzt int;
begin
  if not coalesce((select l.dorf and l.haeuser from public.lq_klasse l where l.id = k.klasse), false) then
    raise exception 'ungueltig';
  end if;
  select h.stufe into jetzt from public.lq_haus h where h.kind = k.id;
  if jetzt is null or not public.lq_aussehen_ok(p_aussehen, jetzt) then raise exception 'ungueltig'; end if;
  update public.lq_haus set aussehen = p_aussehen where kind = k.id;
  return jsonb_build_object('dorf', public.lq_dorf_json(k.klasse, k.id));
end;
$$;

revoke execute on function public.lq_aussehen_ok(jsonb, int) from public, anon, authenticated;
