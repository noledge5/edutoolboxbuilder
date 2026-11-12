// Draws a figure (typen.ts) in a pose, with items and an animation. bewegung.ts computes where each part is at a
// time; this file turns that into SVG transforms. The clock is requestAnimationFrame (works in every browser and
// frame); with „Bewegung reduzieren“ the app shows the still pose. The workshop passes its own time instead.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ANIMATIONEN } from './animationen';
import { RUHE, stellung, transform } from './bewegung';
import type { Stellung } from './bewegung';
import { P, SELTEN_FARBE } from './stil';
import type { Animation, Figur, Item, Pose, Punkt, Teil } from './typen';

/** Motion off: the system's „Bewegung reduzieren“, or the app's own switch (class `lq-ruhig` on the page). */
export const ruhig = () =>
  typeof window !== 'undefined' && (!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('lq-ruhig'));

/** Seconds since `aktiv` became true (or `neustart` changed), counted with requestAnimationFrame. */
export function useZeit(aktiv: boolean, tempo = 1, neustart?: unknown): number {
  const [zeit, setZeit] = useState(0);
  useEffect(() => {
    setZeit(0);
    if (!aktiv || typeof requestAnimationFrame === 'undefined') return;
    let start: number | null = null;
    let id = requestAnimationFrame(function schritt(ts) {
      start ??= ts;
      setZeit(((ts - start) / 1000) * tempo);
      id = requestAnimationFrame(schritt);
    });
    return () => cancelAnimationFrame(id);
  }, [aktiv, tempo, neustart]);
  return zeit;
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

function TeilG({ teil, k }: { teil: Teil; k: Kontext }): ReactNode {
  const lage = k.st.teile[teil.id] ?? RUHE;
  const stand = { gesicht: k.st.gesicht, augenZu: k.st.augenZu, zeit: k.st.zeit };
  const amAnker = (hinten: boolean) =>
    Object.entries(teil.anker ?? {}).flatMap(([platz, [ax, ay]]) =>
      k.items
        .filter((i) => i.platz === platz && !!i.hinten === hinten)
        .map((i) => (
          <g key={i.id} transform={`translate(${ax} ${ay})`} data-item={i.id}>
            {i.zeichnung(k.st.zeit)}
          </g>
        )),
    );
  return (
    <g data-teil={teil.id} transform={transform(lage, teil.drehpunkt)}>
      {amAnker(true)}
      {teil.zeichnung(stand)}
      {teil.kinder?.map((c) => <TeilG key={c.id} teil={c} k={k} />)}
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

export function FigurBild({ figur, pose, animation, zeit, lebendig = true, items = [], breite = 160, hilfen = {}, spiegeln = false, titel, className }: FigurBildProps) {
  const po: Pose = typeof pose === 'object' ? pose : (figur.posen[pose ?? ''] ?? Object.values(figur.posen)[0]);
  const anim = typeof animation === 'object' ? animation : animation ? ANIMATIONEN[animation] : undefined;
  const eigeneUhr = zeit === undefined && !ruhig() && (lebendig || !!anim);
  const uhr = useZeit(eigeneUhr, 1, anim?.id);
  const jetzt = zeit ?? uhr;
  const st = stellung(po, { animation: anim, zeit: jetzt, lebendig: lebendig && (zeit !== undefined || eigeneUhr) });
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
      {rahmen && (
        <rect
          x={cx - s / 2 + 1.5}
          y={cy - s / 2 + 1.5}
          width={s - 3}
          height={s - 3}
          rx={s * 0.16}
          fill={P.weiss}
          stroke={SELTEN_FARBE[item.seltenheit - 1]}
          strokeWidth={3}
        />
      )}
      {item.zeichnung(zeit ?? uhr)}
    </svg>
  );
}
