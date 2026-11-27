// Draws a figure (typen.ts) in a pose, with items and an animation. bewegung.ts computes where each part is at a
// time; this file turns that into SVG transforms. The clock is requestAnimationFrame (works in every browser and
// frame); with the app's switch „Bewegung reduzieren“ it shows the still pose. The workshop passes its own time instead.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ANIMATIONEN } from './animationen';
import { RUHE, UEBERGANG, mischeStellungen, stellung, transform } from './bewegung';
import type { Stellung } from './bewegung';
import { P, SELTEN_FARBE } from './stil';
import type { Animation, Figur, Item, Pose, Punkt, Teil } from './typen';

/** Motion off: only the app's own switch „Bewegung reduzieren“ (class `lq-ruhig` on the page). The system setting does
 *  not stop the figures (decision of the teacher, 13.11.2026: they move on every device). */
export const ruhig = () => typeof document !== 'undefined' && document.documentElement.classList.contains('lq-ruhig');

/** Seconds since `aktiv` became true (or `neustart` changed), counted with requestAnimationFrame. */
export function useZeit(aktiv: boolean, tempo = 1, neustart?: unknown): number {
  // The time belongs to one `neustart`: on the render where `neustart` changes, the clock reads 0 at once, not the
  // old move's time for one frame (a new move sampled at, say, 12 s showed its end pose for a frame).
  const [stand, setStand] = useState<{ zeit: number; fuer: unknown }>({ zeit: 0, fuer: neustart });
  useEffect(() => {
    setStand({ zeit: 0, fuer: neustart });
    if (!aktiv || typeof requestAnimationFrame === 'undefined') return;
    let start: number | null = null;
    let id = requestAnimationFrame(function schritt(ts) {
      start ??= ts;
      setStand({ zeit: ((ts - start) / 1000) * tempo, fuer: neustart });
      id = requestAnimationFrame(schritt);
    });
    return () => cancelAnimationFrame(id);
  }, [aktiv, tempo, neustart]);
  return stand.fuer === neustart ? stand.zeit : 0;
}

/** Blends into a new pose or move over `UEBERGANG` instead of jumping: remembers the last frame drawn, and when the
 *  pose or the move changes, starts from it. Off when the caller drives the time (workshop) or motion is reduced. */
function useUebergang(st: Stellung, schluessel: string, an: boolean): { st: Stellung; laeuft: boolean } {
  const letzte = useRef<Stellung | null>(null);
  const alt = useRef(schluessel);
  const blende = useRef<{ von: Stellung; start: number } | null>(null);
  const jetzt = typeof performance === 'undefined' ? 0 : performance.now();
  if (alt.current !== schluessel) {
    alt.current = schluessel;
    blende.current = an && letzte.current ? { von: letzte.current, start: jetzt } : null;
  }
  let aus = st;
  const b = blende.current;
  if (b) {
    const k = (jetzt - b.start) / 1000 / UEBERGANG;
    if (k >= 1) blende.current = null;
    else aus = mischeStellungen(b.von, st, k);
  }
  letzte.current = aus;
  return { st: aus, laeuft: !!blende.current };
}

export interface Hilfen {
  drehpunkte?: boolean;
  anker?: boolean;
  rahmen?: boolean;
}

interface Kontext {
  st: Stellung;
  items: Item[];
  hilfen: Hilfen;
}

function Punktmarke({ p, farbe, gross = false }: { p: Punkt; farbe: string; gross?: boolean }) {
  return <circle cx={p[0]} cy={p[1]} r={gross ? 5 : 3.5} fill={farbe} stroke={P.weiss} strokeWidth={1.5} />;
}

/** Things held in a hand (sword, trident, wand) are drawn over the whole figure, so a long blade or shaft never
 *  disappears behind the big head; they still follow the arm. Everything else sits with its part. */
export const ganzVorne = (i: Item) => !i.hinten && i.platz.startsWith('hand');

/** The transform of an item on its anchor: the part may move or scale particular items (`ankerLage`, `ankerSkala`). */
function lageVon(teil: Teil, platz: string, anker: Punkt, i: Item): string {
  const l = teil.ankerLage?.(i);
  const [x, y] = l?.p ?? anker;
  const s = l?.s ?? teil.ankerSkala?.[platz];
  return `translate(${x} ${y})${s && s !== 1 ? ` scale(${Math.round(s * 1000) / 1000})` : ''}`;
}

/** A part with its children. `oben`: the second pass, only the transforms and the items held in front. */
function TeilG({ teil, k, oben = false }: { teil: Teil; k: Kontext; oben?: boolean }): ReactNode {
  const lage = k.st.teile[teil.id] ?? RUHE;
  const stand = { gesicht: k.st.gesicht, augenZu: k.st.augenZu, zeit: k.st.zeit };
  const amAnker = (hinten: boolean) =>
    Object.entries(teil.anker ?? {}).flatMap(([platz, [ax, ay]]) =>
      k.items
        .filter((i) => i.platz === platz && !!i.hinten === hinten && ganzVorne(i) === oben)
        .map((i) => (
          <g key={i.id} transform={lageVon(teil, platz, [ax, ay], i)} data-item={i.id}>
            {i.zeichnung(k.st.zeit)}
          </g>
        )),
    );
  if (oben)
    return (
      <g transform={transform(lage, teil.drehpunkt)}>
        {teil.kinder?.map((c) => (
          <TeilG key={c.id} teil={c} k={k} oben />
        ))}
        {amAnker(false)}
      </g>
    );
  return (
    <g data-teil={teil.id} transform={transform(lage, teil.drehpunkt)}>
      {amAnker(true)}
      {teil.zeichnung(stand)}
      {teil.kinder?.map((c) => (
        <TeilG key={c.id} teil={c} k={k} />
      ))}
      {amAnker(false)}
      {k.hilfen.drehpunkte && <Punktmarke p={teil.drehpunkt} farbe={P.blau} />}
      {k.hilfen.anker && Object.values(teil.anker ?? {}).map((a, i) => <Punktmarke key={i} p={a} farbe={P.rot} gross />)}
    </g>
  );
}

export interface FigurBildProps {
  figur: Figur;
  /** Pose id of the figure, or a pose object (the workshop's editor). */
  pose?: string | Pose;
  /** Animation id, or an animation object (edited live in the workshop). */
  animation?: string | Animation;
  /** Animation id that follows a move that runs a fixed number of times (e.g. `jubeln`, then `atmen` for ever). */
  danach?: string;
  /** Seconds; given = controlled by the caller (workshop), else the figure runs its own clock. */
  zeit?: number;
  /** Blinks by itself (default on). */
  lebendig?: boolean;
  items?: Item[];
  /** Width in px; the height follows the figure. */
  breite?: number;
  hilfen?: Hilfen;
  /** Looks to the other side. */
  spiegeln?: boolean;
  titel?: string;
  className?: string;
}

export function FigurBild({ figur, pose, animation, danach, zeit, lebendig = true, items = [], breite = 160, hilfen = {}, spiegeln = false, titel, className }: FigurBildProps) {
  const po: Pose = typeof pose === 'object' ? pose : (figur.posen[pose ?? ''] ?? Object.values(figur.posen)[0]);
  const anim = typeof animation === 'object' ? animation : animation ? ANIMATIONEN[animation] : undefined;
  const nach = danach ? ANIMATIONEN[danach] : undefined;
  const still = ruhig();
  const schluessel = `${po.name}|${anim?.id ?? ''}`;
  // Keeps the clock running while a blend is under way, even for a figure that otherwise stands still.
  const [blendet, setBlendet] = useState(false);
  const eigeneUhr = zeit === undefined && !still && (lebendig || !!anim || !!nach || blendet);
  const uhr = useZeit(eigeneUhr, 1, anim?.id);
  const jetzt = zeit ?? uhr;
  // A move with an end hands over to `danach` (its clock starts where the first one ended).
  const ende = anim ? (anim.wiederholen === 'immer' ? Infinity : anim.dauer * anim.wiederholen) : 0;
  const [aktiv, t] = nach && jetzt >= ende ? [nach, jetzt - ende] : [anim, jetzt];
  const roh = stellung(po, { animation: aktiv, zeit: t, lebendig: lebendig && (zeit !== undefined || eigeneUhr) });
  const { st, laeuft } = useUebergang(roh, schluessel, zeit === undefined && !still);
  useEffect(() => {
    if (laeuft !== blendet) setBlendet(laeuft);
  }, [laeuft, blendet]);
  const k: Kontext = { st, items, hilfen };
  const vorne = new Set(st.vorne);
  const teile = [...figur.teile.filter((t) => !vorne.has(t.id)), ...figur.teile.filter((t) => vorne.has(t.id))];
  const [gw, gh] = figur.groesse;
  const [bx, by] = figur.boden;
  // The shadow shrinks when the figure is lifted.
  const hoch = Math.max(0, -st.ganz.schieben[1]);
  const schatten = Math.max(0.55, 1 - hoch / 60);
  return (
    <svg
      className={className}
      width={breite}
      height={(breite * gh) / gw}
      viewBox={`0 0 ${gw} ${gh}`}
      overflow="visible"
      role={titel ? 'img' : undefined}
      aria-label={titel}
      aria-hidden={titel ? undefined : true}
      data-figur={figur.id}
    >
      <g transform={spiegeln ? `translate(${gw} 0) scale(-1 1)` : undefined}>
        {hilfen.rahmen && <rect x={0.5} y={0.5} width={gw - 1} height={gh - 1} fill="none" stroke={P.blau} strokeDasharray="4 4" />}
        <ellipse cx={bx + st.ganz.schieben[0]} cy={by} rx={gw * 0.29 * schatten} ry={gw * 0.04 * schatten} fill={P.schatten} opacity={0.18 * schatten} />
        <g transform={transform(st.ganz, figur.boden)}>
          {teile.map((t) => (
            <TeilG key={t.id} teil={t} k={k} />
          ))}
          {items.some(ganzVorne) && teile.map((t) => <TeilG key={`oben-${t.id}`} teil={t} k={k} oben />)}
          {st.extras.map((e) => (
            <g key={e}>{figur.extras?.[e]?.({ gesicht: st.gesicht, augenZu: st.augenZu, zeit: st.zeit })}</g>
          ))}
        </g>
        {hilfen.drehpunkte && <Punktmarke p={figur.boden} farbe={P.gruen} gross />}
      </g>
    </svg>
  );
}

/** An item alone, as an icon in a square with its rarity colour as frame. Moving items run their own clock. */
export function ItemBild({ item, groesse = 64, rahmen = true, zeit }: { item: Item; groesse?: number; rahmen?: boolean; zeit?: number }) {
  const uhr = useZeit(zeit === undefined && !ruhig() && !!item.bewegt);
  const [x, y, w, h] = item.rahmen;
  const s = Math.max(w, h) * 1.15;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <svg width={groesse} height={groesse} viewBox={`${cx - s / 2} ${cy - s / 2} ${s} ${s}`} aria-hidden data-item={item.id}>
      {rahmen && <rect x={cx - s / 2 + 1.5} y={cy - s / 2 + 1.5} width={s - 3} height={s - 3} rx={s * 0.16} fill={P.weiss} stroke={SELTEN_FARBE[item.seltenheit - 1]} strokeWidth={3} />}
      {item.zeichnung(zeit ?? uhr)}
    </svg>
  );
}
