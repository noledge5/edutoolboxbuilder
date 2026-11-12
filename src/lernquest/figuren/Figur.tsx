// Draws a figure (typen.ts) in a pose, with items and an animation. Poses are SVG transforms on the part groups;
// animations are SMIL <animateTransform additive="sum"> on top, so a move adds to the pose and runs without
// script. With „Bewegung reduzieren“ no animation is drawn; every pose stands on its own.
import type { ReactNode } from 'react';
import { ANIMATIONEN } from './animationen';
import { P, SELTEN_FARBE } from './stil';
import type { Animation, Figur, Item, Punkt, Spur, Teil } from './typen';

const ruhig = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Bewegung({ spur, p, anim }: { spur: Spur; p: Punkt; anim: Animation }) {
  const n = Math.max(spur.drehen?.length ?? 0, spur.schieben?.length ?? 0);
  const zeiten = (k: number) => Array.from({ length: k }, (_, i) => (i / (k - 1)).toFixed(3)).join(';');
  const kurven = (k: number) => Array.from({ length: k - 1 }, () => '0.45 0 0.55 1').join(';');
  const gemeinsam = {
    dur: `${anim.dauer}s`,
    repeatCount: anim.wiederholen === 'immer' ? 'indefinite' : String(anim.wiederholen),
    additive: 'sum',
    calcMode: 'spline',
    fill: 'remove',
  } as const;
  if (n < 2) return null;
  return (
    <>
      {spur.schieben && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values={spur.schieben.map(([x, y]) => `${x} ${y}`).join(';')}
          keyTimes={zeiten(spur.schieben.length)}
          keySplines={kurven(spur.schieben.length)}
          {...gemeinsam}
        />
      )}
      {spur.drehen && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={spur.drehen.map((w) => `${w} ${p[0]} ${p[1]}`).join(';')}
          keyTimes={zeiten(spur.drehen.length)}
          keySplines={kurven(spur.drehen.length)}
          {...gemeinsam}
        />
      )}
    </>
  );
}

interface Kontext {
  winkel: Record<string, number>;
  gesicht: string;
  anim?: Animation;
  items: Item[];
  hilfen: boolean;
}

function Hilfe({ p, farbe }: { p: Punkt; farbe: string }) {
  return <circle cx={p[0]} cy={p[1]} r={3.5} fill={farbe} stroke={P.weiss} strokeWidth={1.5} />;
}

function TeilG({ teil, k }: { teil: Teil; k: Kontext }): ReactNode {
  const w = k.winkel[teil.id] ?? 0;
  const [px, py] = teil.drehpunkt;
  const spur = k.anim?.spuren[teil.id];
  const amAnker = (hinten: boolean) =>
    Object.entries(teil.anker ?? {}).flatMap(([platz, [ax, ay]]) =>
      k.items
        .filter((i) => i.platz === platz && !!i.hinten === hinten)
        .map((i) => (
          <g key={i.id} transform={`translate(${ax} ${ay})`} data-item={i.id}>
            {i.zeichnung()}
          </g>
        )),
    );
  return (
    <g data-teil={teil.id} transform={w ? `rotate(${w} ${px} ${py})` : undefined}>
      {spur && k.anim && <Bewegung spur={spur} p={teil.drehpunkt} anim={k.anim} />}
      {amAnker(true)}
      {teil.zeichnung({ gesicht: k.gesicht })}
      {teil.kinder?.map((c) => <TeilG key={c.id} teil={c} k={k} />)}
      {amAnker(false)}
      {k.hilfen && <Hilfe p={teil.drehpunkt} farbe={P.blau} />}
      {k.hilfen && Object.values(teil.anker ?? {}).map((a, i) => <Hilfe key={i} p={a} farbe={P.rot} />)}
    </g>
  );
}

export interface FigurBildProps {
  figur: Figur;
  pose?: string;
  animation?: string;
  items?: Item[];
  /** Width in px; the height follows the figure. */
  breite?: number;
  /** Shows pivots (blue) and anchors (red), for the workshop. */
  hilfen?: boolean;
  titel?: string;
  className?: string;
}

export function FigurBild({ figur, pose, animation, items = [], breite = 160, hilfen = false, titel, className }: FigurBildProps) {
  const po = figur.posen[pose ?? ''] ?? Object.values(figur.posen)[0];
  const anim = animation && !ruhig() ? ANIMATIONEN[animation] : undefined;
  const k: Kontext = { winkel: po.winkel ?? {}, gesicht: po.gesicht, anim, items, hilfen };
  const vorne = new Set(po.vorne ?? []);
  const teile = [...figur.teile.filter((t) => !vorne.has(t.id)), ...figur.teile.filter((t) => vorne.has(t.id))];
  const [gw, gh] = figur.groesse;
  const [bx, by] = figur.boden;
  const ganz = anim?.spuren.ganz;
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
      <ellipse cx={bx} cy={by} rx={gw * 0.29} ry={gw * 0.04} fill={P.schatten} opacity={0.18} />
      <g>
        {ganz && anim && <Bewegung spur={ganz} p={figur.boden} anim={anim} />}
        {teile.map((t) => (
          <TeilG key={t.id} teil={t} k={k} />
        ))}
        {(po.extras ?? []).map((e) => (
          <g key={e}>{figur.extras?.[e]?.()}</g>
        ))}
        {hilfen && <Hilfe p={figur.boden} farbe={P.gruen} />}
      </g>
    </svg>
  );
}

/** An item alone, as an icon in a square with its rarity colour as frame. */
export function ItemBild({ item, groesse = 64, rahmen = true }: { item: Item; groesse?: number; rahmen?: boolean }) {
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
      {item.zeichnung()}
    </svg>
  );
}
