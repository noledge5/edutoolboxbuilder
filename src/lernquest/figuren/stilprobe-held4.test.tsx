// Style sample „Held 4“ (27.11.2026, inspiration from the teacher: flat geometric characters with a block head, white
// eyes with lids, a bold nose, simple limbs and pill feet). Our own build and palette. Runs only when asked:
// STILPROBE_HELD=<ordner> npx vitest run src/lernquest/figuren/stilprobe-held4
import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import { ITEMS } from '.';
import { P } from './stil';

type Ton = { farbe: string; hell: string; tief: string };
const t = (farbe: string, hell: string, tief: string): Ton => ({ farbe, hell, tief });
const HAUT = [t(P.haut0, P.haut0Hell, P.haut0Tief), t(P.haut2, P.haut2Hell, P.haut2Tief), t(P.haut4, P.haut4Hell, P.haut4Tief), t(P.haut5, P.haut5Hell, P.haut5Tief)];
const HAAR = { braun: t(P.haar0, P.haar0Hell, P.haar0Tief), schwarz: t(P.haar1, P.haar1Hell, P.haar1Tief), rot: t(P.haar4, P.haar4Hell, P.haar4Tief), blond: t(P.haar3, P.haar3Hell, P.haar3Tief) };

const KOPF = 'M102 36 H138 Q168 36 168 66 V100 Q168 136 132 136 H108 Q72 136 72 100 V66 Q72 36 102 36 Z';
const KOPF_SCHATTEN = 'M168 80 V100 Q168 136 132 136 H114 Q150 130 158 104 Q162 92 160 78 Z';

type Gesicht = 'froh' | 'lachen' | 'skeptisch' | 'staunen';
function Gesicht({ g, h, haar }: { g: Gesicht; h: Ton; haar: Ton }) {
  const augen = [101, 139];
  return (
    <g>
      {/* brows: thick bars in the hair colour, their angle carries the mood */}
      {augen.map((x, i) => {
        const w = g === 'skeptisch' ? (i ? -10 : 4) : g === 'staunen' ? (i ? 8 : -8) : i ? 4 : -4;
        const y = g === 'staunen' ? 64 : g === 'skeptisch' && i ? 66 : 70;
        return <rect key={x} x={x - 12} y={y} width={24} height={7} rx={3.5} fill={haar.tief} transform={`rotate(${w} ${x} ${y + 3.5})`} />;
      })}
      {g === 'lachen'
        ? augen.map((x) => <path key={x} d={`M${x - 11} 96 Q${x} 82 ${x + 11} 96`} fill="none" stroke={P.auge} strokeWidth={6} strokeLinecap="round" />)
        : augen.map((x, i) => {
            const blick = g === 'skeptisch' ? 5 : i ? -3 : 3;
            return (
              <g key={x}>
                <ellipse cx={x} cy={92} rx={12.5} ry={g === 'staunen' ? 15.5 : 14} fill={P.weiss} />
                <ellipse cx={x + blick} cy={g === 'staunen' ? 92 : 95} rx={5.6} ry={7.2} fill={P.auge} />
                {/* the lid: a flat shape in the skin tone over the top of the eye */}
                {g === 'skeptisch' && <path d={`M${x - 14} 76 H${x + 14} V${90 + (i ? 0 : 2)} Q${x} ${86 + (i ? 0 : 2)} ${x - 14} ${90 + (i ? 0 : 2)} Z`} fill={h.farbe} />}
                {g === 'froh' && <path d={`M${x - 14} 104 Q${x} 98 ${x + 14} 104 V110 H${x - 14} Z`} fill={h.farbe} />}
              </g>
            );
          })}
      {/* nose: one bold drop in the skin's shade */}
      <path d="M120 98 Q130 113 125 118 Q120 121 115 118 Q110 113 120 98 Z" fill={h.tief} />
      {g === 'froh' && <path d="M106 122 Q120 136 134 122 Q120 127 106 122 Z" fill={P.mund} />}
      {g === 'lachen' && (
        <g>
          <path d="M103 120 Q120 146 137 120 Z" fill={P.mund} />
          <path d="M111 132 Q120 140 129 132 Q120 127 111 132 Z" fill={P.zunge} />
        </g>
      )}
      {g === 'skeptisch' && <path d="M110 127 Q122 123 132 126" fill="none" stroke={P.mund} strokeWidth={5} strokeLinecap="round" />}
      {g === 'staunen' && <ellipse cx={121} cy={128} rx={7} ry={8.5} fill={P.mund} />}
    </g>
  );
}

const Haare: Record<string, { hinten?: (c: Ton) => ReactNode; vorn: (c: Ton) => ReactNode }> = {
  kurz: {
    vorn: (c) => (
      <g>
        <path d="M66 86 V64 Q66 24 120 24 Q174 24 174 64 V86 Q168 74 160 68 Q146 78 128 66 Q112 80 90 72 Q76 76 66 86 Z" fill={c.farbe} />
        <path d="M150 32 Q174 44 174 64 V86 Q168 74 160 68 Q160 48 150 32 Z" fill={c.tief} opacity={0.6} />
        <path d="M84 42 Q98 32 116 30" fill="none" stroke={c.hell} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
  },
  puff: {
    hinten: (c) => <circle cx={120} cy={30} r={34} fill={c.farbe} />,
    vorn: (c) => (
      <g>
        <circle cx={120} cy={30} r={34} fill={c.farbe} />
        <path d="M70 76 Q70 40 120 40 Q170 40 170 76 Q150 60 120 62 Q90 60 70 76 Z" fill={c.farbe} />
        <path d="M94 6 Q108 -2 124 -2" fill="none" stroke={c.hell} strokeWidth={5} strokeLinecap="round" />
        <rect x={86} y={52} width={68} height={12} rx={6} fill={P.gelb} />
      </g>
    ),
  },
  lang: {
    hinten: (c) => <path d="M62 70 Q62 22 120 22 Q178 22 178 70 V176 Q178 186 166 186 H74 Q62 186 62 176 Z" fill={c.tief} />,
    vorn: (c) => (
      <g>
        <path d="M64 98 V66 Q64 22 120 22 Q176 22 176 66 V80 Q160 60 138 58 Q128 76 96 82 Q78 86 64 98 Z" fill={c.farbe} />
        <path d="M86 38 Q100 28 118 27" fill="none" stroke={c.hell} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
  },
  bob: {
    hinten: (c) => <path d="M60 70 Q60 22 120 22 Q180 22 180 70 V128 Q180 140 168 140 H72 Q60 140 60 128 Z" fill={c.tief} />,
    vorn: (c) => (
      <g>
        <path d="M62 120 V66 Q62 22 120 22 Q178 22 178 66 V120 Q170 120 166 112 V74 H74 V112 Q70 120 62 120 Z" fill={c.farbe} />
        <path d="M74 74 H166 V66 Q166 50 150 46 Q120 60 90 46 Q74 50 74 66 Z" fill={c.farbe} />
        <path d="M84 34 Q100 26 118 25" fill="none" stroke={c.hell} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
  },
};

type Kleid = { oben: Ton; arm: Ton | 'haut'; hose: Ton; schuh: Ton; muster?: ReactNode };
function Held({ h, haar, frisur, g, k, items = [] }: { h: Ton; haar: Ton; frisur: string; g: Gesicht; k: Kleid; items?: { anker: [number, number]; el: ReactNode }[] }) {
  const f = Haare[frisur];
  const arm = (seite: 1 | -1) => {
    const sx = 120 + seite * 28;
    const ex = 120 + seite * 31;
    const hx = 120 + seite * 35;
    const aermel = k.arm === 'haut' ? null : k.arm;
    return (
      <g>
        <path d={`M${sx} 152 L${ex} 168`} stroke={aermel ? aermel.tief : h.farbe} strokeWidth={19} strokeLinecap="round" />
        <path d={`M${ex} 168 L${hx} 186`} stroke={aermel ? aermel.tief : h.farbe} strokeWidth={16} strokeLinecap="round" />
        <circle cx={hx} cy={191} r={10} fill={h.farbe} />
        <circle cx={hx + seite * 3} cy={194} r={5} fill={h.tief} opacity={0.4} />
      </g>
    );
  };
  return (
    <g>
      <ellipse cx={120} cy={230} rx={46} ry={6} fill={P.schatten} opacity={0.14} />
      {f.hinten?.(haar)}
      {/* legs, pill feet */}
      {[108, 132].map((x) => (
        <path key={x} d={`M${x} 192 V216`} stroke={k.hose.farbe} strokeWidth={19} strokeLinecap="round" />
      ))}
      <path d="M138 196 V216" stroke={k.hose.tief} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      <rect x={90} y={216} width={28} height={12} rx={6} fill={k.schuh.farbe} />
      <rect x={122} y={216} width={28} height={12} rx={6} fill={k.schuh.farbe} />
      <path d="M96 219 H106" stroke={k.schuh.hell} strokeWidth={3} strokeLinecap="round" />
      {/* neck, torso */}
      <rect x={109} y={126} width={22} height={22} rx={6} fill={h.tief} />
      <path d="M96 146 Q120 140 144 146 Q152 150 153 160 L157 196 Q120 203 83 196 L87 160 Q88 150 96 146 Z" fill={k.oben.farbe} />
      <path d="M142 146 Q152 150 153 160 L157 196 Q148 199 138 199 Q148 172 142 146 Z" fill={k.oben.tief} opacity={0.5} />
      <path d="M92 158 L89 188" stroke={k.oben.hell} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      <path d="M108 144 Q120 156 132 144" fill="none" stroke={k.oben.tief} strokeWidth={5} strokeLinecap="round" />
      {k.muster}
      {arm(-1)}
      {arm(1)}
      {/* head */}
      {[72, 168].map((x) => (
        <g key={x}>
          <circle cx={x} cy={96} r={11} fill={h.farbe} />
          <circle cx={x + (x < 120 ? -2 : 2)} cy={97} r={5} fill={h.tief} opacity={0.5} />
        </g>
      ))}
      <path d={KOPF} fill={h.farbe} />
      <path d={KOPF_SCHATTEN} fill={h.tief} opacity={0.45} />
      <path d="M80 60 Q82 46 96 40" fill="none" stroke={h.hell} strokeWidth={5} strokeLinecap="round" />
      <Gesicht g={g} h={h} haar={haar} />
      {f.vorn(haar)}
      {items.map((i, n) => (
        <g key={n} transform={`translate(${i.anker[0]} ${i.anker[1]})`}>
          {i.el}
        </g>
      ))}
    </g>
  );
}

const K = {
  blau: { oben: t(P.blau, P.blauHell, P.blauTief), arm: 'haut' as const, hose: t(P.blauTief, P.blau, P.tinteTief), schuh: t(P.rot, P.backe, P.rotTief) },
  gelb: { oben: t(P.gelb, P.gelbHell, P.gelbTief), arm: t(P.gelb, P.gelbHell, P.gelbTief), hose: t(P.lila, P.lilaHell, P.lilaTief), schuh: t(P.weiss, P.weiss, P.grauHell) },
  gruen: { oben: t(P.gruen, P.gruenHell, P.gruenTief), arm: t(P.gruen, P.gruenHell, P.gruenTief), hose: t(P.dunkel, P.dunkelHell, P.dunkelTief), schuh: t(P.leder, P.lederHell, P.lederTief) },
  orange: { oben: t(P.orange, P.orangeHell, P.orangeTief), arm: t(P.orange, P.orangeHell, P.orangeTief), hose: t(P.tuerkis, P.tuerkisHell, P.tuerkisTief), schuh: t(P.blau, P.blauHell, P.blauTief) },
};
const item = (id: string) => ITEMS.find((i) => i.id === id)!.zeichnung(0);

const HELDEN: { name: string; el: ReactElement }[] = [
  { name: 'froh', el: <Held h={HAUT[0]} haar={HAAR.braun} frisur="kurz" g="froh" k={K.blau} /> },
  { name: 'lachen', el: <Held h={HAUT[2]} haar={HAAR.schwarz} frisur="puff" g="lachen" k={K.gelb} /> },
  { name: 'skeptisch', el: <Held h={HAUT[1]} haar={HAAR.rot} frisur="lang" g="skeptisch" k={K.gruen} /> },
  {
    name: 'staunen, mit Hut und Schwert',
    el: (
      <Held
        h={HAUT[3]}
        haar={HAAR.blond}
        frisur="bob"
        g="staunen"
        k={K.orange}
        items={[
          { anker: [120, 44], el: item('waldhut') },
          { anker: [155, 191], el: item('holzschwert') },
        ]}
      />
    ),
  },
];

const ziel = process.env.STILPROBE_HELD;
it.skipIf(!ziel)('Stilprobe Held 4', () => {
  const svg = (el: ReactElement, px: number) =>
    renderToStaticMarkup(
      <svg width={px} height={px} viewBox="0 -10 240 250">
        {el}
      </svg>,
    );
  const reihe = (bg: string, px: number) =>
    `<div style="display:flex;gap:18px;padding:18px;background:${bg};align-items:end">${HELDEN.map((x) => `<figure style="margin:0;text-align:center;font:600 14px sans-serif;color:#888">${svg(x.el, px)}<figcaption>${px > 100 ? x.name : ''}</figcaption></figure>`).join('')}</div>`;
  mkdirSync(ziel!, { recursive: true });
  writeFileSync(`${ziel}/held4.html`, `<!doctype html><meta charset="utf-8"><body style="margin:0">${reihe('#FBF6E9', 300)}${reihe('#FBF6E9', 48)}${reihe('#173A1C', 120)}</body>`);
});
