// The hero in the app as the vector figure of the workshop (Stufe E, Teil 4): the saved `Avatar` (src/lernquest/teile.ts)
// becomes the hero's look (figuren/held.tsx), its hat, tool and companion become items, the background a scene behind.
// avatar.tsx uses these unless something worn exists only as an uploaded picture (a part made on the teacher page).
import { AUGEN_ARTEN, FigurBild, FRISUR_ARTEN, held, HINTERGRUENDE, ITEMS, KLEIDUNG } from '../figuren';
import type { Aussehen, Item } from '../figuren';
import { alleFrisuren, angelegt, frisurVon, haarfarbeVon, mundVon, SLOTS } from '../teile';
import type { Avatar, Teil } from '../teile';

/** The look of a saved avatar (old saves included: `figur`, missing places, unknown ids fall back). */
export function aussehenVon(a: Avatar): Aussehen {
  return { haut: a.haut, frisur: frisurVon(a), haarfarbe: haarfarbeVon(a), mund: mundVon(a), augen: angelegt(a, 'augen')?.id, kleidung: angelegt(a, 'kleidung')?.id };
}

const ITEM = new Map(ITEMS.map((i) => [i.id, i]));
/** Hat, tool and companion worn, as items. */
export function itemsVon(a: Avatar): Item[] {
  return (['kopf', 'werkzeug', 'begleiter'] as const).flatMap((s) => {
    const i = ITEM.get(angelegt(a, s)?.id ?? '');
    return i ? [i] : [];
  });
}

/** A part has a vector drawing (built-in, or an own part of the teacher that Claude has drawn by its id). */
export function hatVektor(t: Teil): boolean {
  return ITEM.has(t.id) || t.id in KLEIDUNG || AUGEN_ARTEN.includes(t.id) || HINTERGRUENDE.some((h) => h.id === t.id);
}

/** Something worn that only exists as an uploaded picture (an own part not drawn yet): then the hero is drawn the
 *  older way, with that picture. */
export function nurAlsBild(a: Avatar): boolean {
  if (SLOTS.some(({ slot }) => {
    const t = angelegt(a, slot);
    return t?.eigen && !hatVektor(t);
  }))
    return true;
  const f = alleFrisuren().find((x) => x.id === frisurVon(a));
  return !!f?.eigen && !FRISUR_ARTEN.includes(f.id);
}

/** Crops of the 240 × 240 hero picture. */
export const HELD_AUSSCHNITT = {
  ganz: '0 0 240 240',
  /** Head and shoulders, for small round pictures. */
  kopf: '50 22 140 140',
  /** The head alone, for choosing hair. */
  gesicht: '56 26 128 116',
  /** The lower face, for choosing a mouth. */
  mund: '88 104 64 52',
  augen: '72 66 96 82',
  kleidung: '70 126 100 104',
} as const;

/** The whole hero on its background. `lebendig`: blinks and breathes (one clock per picture, so only where it is the
 *  main thing). `animation`: a move (figuren/animationen.ts); a living hero goes back to breathing after it. */
export function HeldBild({ avatar, ausschnitt = HELD_AUSSCHNITT.ganz, className, lebendig = false, ohneHintergrund = false, pose, animation }: { avatar: Avatar; ausschnitt?: string; className?: string; lebendig?: boolean; ohneHintergrund?: boolean; pose?: string; animation?: string }) {
  const bg = ohneHintergrund ? undefined : HINTERGRUENDE.find((h) => h.id === angelegt(avatar, 'hintergrund')?.id);
  return (
    <svg className={className} viewBox={ausschnitt} aria-hidden focusable="false" data-held="vektor">
      {bg?.zeichnung(0)}
      <FigurBild figur={held(aussehenVon(avatar))} items={itemsVon(avatar)} breite={240} lebendig={lebendig} pose={pose} animation={animation ?? (lebendig ? 'atmen' : undefined)} danach={lebendig ? 'atmen' : undefined} />
    </svg>
  );
}

/** The head with the chosen hair and mouth (no items, no background). */
export function HeldKopfBild({ avatar, nah }: { avatar: Avatar; nah?: boolean }) {
  return (
    <svg viewBox={nah ? HELD_AUSSCHNITT.mund : HELD_AUSSCHNITT.gesicht} aria-hidden focusable="false" data-held="vektor">
      <FigurBild figur={held(aussehenVon(avatar))} breite={240} lebendig={false} />
    </svg>
  );
}

/** One part alone for the grid, the shop and the chest: an item in its own frame, eyes and clothes on the hero. */
export function HeldTeilBild({ teil, avatar = {}, className }: { teil: Teil; avatar?: Avatar; className?: string }) {
  const item = ITEM.get(teil.id);
  if (item) {
    const [x, y, w, h] = item.rahmen;
    const s = Math.max(w, h) * 1.08;
    return (
      <svg className={className} viewBox={`${x + w / 2 - s / 2} ${y + h / 2 - s / 2} ${s} ${s}`} aria-hidden focusable="false" data-held="vektor">
        {item.zeichnung(0)}
      </svg>
    );
  }
  if (teil.slot === 'hintergrund') {
    const bg = HINTERGRUENDE.find((b) => b.id === teil.id);
    return (
      <svg className={className} viewBox="0 0 240 240" aria-hidden focusable="false" data-held="vektor">
        {bg?.zeichnung(0)}
      </svg>
    );
  }
  const a = { ...avatar, [teil.slot]: teil.id };
  return (
    <svg className={className} viewBox={teil.slot === 'augen' ? HELD_AUSSCHNITT.augen : HELD_AUSSCHNITT.kleidung} aria-hidden focusable="false" data-held="vektor">
      <FigurBild figur={held(aussehenVon(a))} breite={240} lebendig={false} />
    </svg>
  );
}
