// Style samples for the hero (Oberfläche neu, Stufe 2, 27.11.2026): today's hero next to two new builds, large and at
// 48 px, on cream and at night. Runs only when asked: STILPROBE_HELD=<ordner> npx vitest run src/lernquest/figuren/stilprobe-held
import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import { FigurBild } from './Figur';
import { held } from './held';
import { P, flaeche } from './stil';
import { stern } from './zeichnen';

type Haut = { farbe: string; hell: string; tief: string };
const HAUT: Haut[] = [
  { farbe: P.haut0, hell: P.haut0Hell, tief: P.haut0Tief },
  { farbe: P.haut3, hell: P.haut3Hell, tief: P.haut3Tief },
];

/** A: chibi, refined. Head half the height, tall eyes with a smiling lower lid, open smile, A-line shirt, mitten
 *  hands, chunky sneakers that stand wide. */
function ProbeA({ h, haar = P.haar0, haarTief = P.haar0Tief, haarHell = P.haar0Hell }: { h: Haut; haar?: string; haarTief?: string; haarHell?: string }) {
  const KOPF = 'M120 46 C157 46 177 69 177 100 C177 129 157 148 120 148 C83 148 63 129 63 100 C63 69 83 46 120 46 Z';
  return (
    <g>
      <ellipse cx={120} cy={229} rx={54} ry={7} fill={P.schatten} opacity={0.14} />
      {/* legs and sneakers */}
      <rect x={103} y={194} width={16} height={24} rx={7} {...flaeche(P.blauTief, 2)} />
      <rect x={121} y={194} width={16} height={24} rx={7} {...flaeche(P.blauTief, 2)} />
      <path d="M84 224 Q84 208 104 207 Q119 207 119 224 Z" {...flaeche(P.rot)} />
      <path d="M156 224 Q156 208 136 207 Q121 207 121 224 Z" {...flaeche(P.rot)} />
      <path d="M131 224 Q140 211 154 216 Q156 224 156 224 Z" fill={P.rotTief} opacity={0.5} />
      <rect x={82} y={220} width={39} height={8} rx={4} fill={P.wolke} />
      <rect x={119} y={220} width={39} height={8} rx={4} fill={P.wolke} />
      <path d="M90 216 q3 -6 9 -7" stroke={P.backe} strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* arms behind the shirt, slightly out, hands as mittens */}
      <path d="M89 158 L78 194" stroke={h.farbe} strokeWidth={17} strokeLinecap="round" />
      <path d="M151 158 L162 194" stroke={h.farbe} strokeWidth={17} strokeLinecap="round" />
      <path d="M165 170 L163 194" stroke={h.tief} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
      <circle cx={84} cy={192} r={5} {...flaeche(h.farbe, 2)} />
      <ellipse cx={77} cy={198} rx={10.5} ry={11} {...flaeche(h.farbe)} />
      <circle cx={156} cy={192} r={5} {...flaeche(h.farbe, 2)} />
      <ellipse cx={163} cy={198} rx={10.5} ry={11} {...flaeche(h.farbe)} />
      <path d="M166 206 q6 -3 6 -9" stroke={h.tief} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.55} />
      {/* shirt: A-line, short sleeves, head shadow, light edge, one big emblem */}
      <path d="M92 148 Q120 139 148 148 L160 166 L150 172 Q155 188 158 204 Q120 212 82 204 Q85 188 90 172 L80 166 Z" {...flaeche(P.blau)} />
      <path d="M140 146 L160 166 L150 172 Q155 188 158 204 Q146 208 134 209 Q146 180 140 146 Z" fill={P.blauTief} opacity={0.5} />
      <path d="M96 156 Q91 178 89 198" stroke={P.blauHell} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} />
      <path d="M100 147 Q122 166 146 149 Q138 160 121 161 Q106 158 100 147 Z" fill={P.blauTief} opacity={0.55} />
      <path d={stern(122, 184, 13)} fill={P.blauTief} opacity={0.5} />
      <path d={stern(120, 182, 13)} {...flaeche(P.weiss, 2)} />
      {/* head */}
      {[67, 173].map((x) => (
        <g key={x}>
          <circle cx={x} cy={106} r={9} {...flaeche(h.farbe)} />
          <circle cx={x + (x < 120 ? 1.5 : -1.5)} cy={107} r={4} fill={h.tief} opacity={0.5} />
        </g>
      ))}
      <path d={KOPF} {...flaeche(h.farbe)} />
      <path d="M173 106 C170 132 150 148 120 148 C148 138 163 124 166 106 Z" fill={h.tief} opacity={0.55} />
      {/* hair: one big mass with a swoop, one light streak, one shade */}
      <path d="M61 104 C55 62 85 36 124 36 C162 36 186 60 179 104 C174 90 166 82 156 78 C150 86 134 86 124 76 C114 88 92 92 78 86 C70 92 64 98 61 104 Z" {...flaeche(haar)} />
      <path d="M150 50 C168 60 180 78 179 104 C174 90 166 82 156 78 C158 70 156 60 150 50 Z" fill={haarTief} opacity={0.7} />
      <path d="M86 56 Q100 44 118 42" stroke={haarHell} strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* face: tall eyes, smiling lower lids, brows, a nose, open smile, cheeks */}
      <ellipse cx={86} cy={124} rx={10} ry={6} fill={P.backe} opacity={0.5} />
      <ellipse cx={154} cy={124} rx={10} ry={6} fill={P.backe} opacity={0.5} />
      <ellipse cx={99} cy={107} rx={8} ry={11.5} fill={P.auge} />
      <ellipse cx={141} cy={107} rx={8} ry={11.5} fill={P.auge} />
      <path d="M89 116 Q99 110 109 116 L109 122 L89 122 Z" fill={h.farbe} />
      <path d="M131 116 Q141 110 151 116 L151 122 L131 122 Z" fill={h.farbe} />
      <path d="M89 90 Q99 84 108 88" stroke={haar} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M132 88 Q141 84 151 90" stroke={haar} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <ellipse cx={120} cy={119} rx={4} ry={3} fill={h.tief} opacity={0.8} />
      <path d="M107 126 Q120 142 133 126 Z" {...flaeche(P.mund, 2)} />
      <path d="M113 133 Q120 138 127 133 Q120 130 113 133 Z" fill={P.zunge} />
    </g>
  );
}

/** B: older look for grades 5–10. Head about a third, a neck, longer legs, a hoodie, calmer face. */
function ProbeB({ h, haar = P.haar0, haarTief = P.haar0Tief, haarHell = P.haar0Hell }: { h: Haut; haar?: string; haarTief?: string; haarHell?: string }) {
  const KOPF = 'M120 30 C147 30 162 48 162 72 C162 98 145 114 120 114 C95 114 78 98 78 72 C78 48 93 30 120 30 Z';
  return (
    <g>
      <ellipse cx={120} cy={229} rx={46} ry={6.5} fill={P.schatten} opacity={0.14} />
      <path d="M103 170 L101 214" stroke={P.blauTief} strokeWidth={20} strokeLinecap="round" />
      <path d="M137 170 L139 214" stroke={P.blauTief} strokeWidth={20} strokeLinecap="round" />
      <path d="M143 176 L145 214" stroke={P.tinteTief} strokeWidth={6} strokeLinecap="round" opacity={0.45} />
      <path d="M84 225 Q84 210 102 209 Q115 209 115 225 Z" {...flaeche(P.wolke)} />
      <path d="M156 225 Q156 210 138 209 Q125 209 125 225 Z" {...flaeche(P.wolke)} />
      <rect x={82} y={221} width={35} height={7} rx={3.5} fill={P.rot} />
      <rect x={123} y={221} width={35} height={7} rx={3.5} fill={P.rot} />
      <path d="M88 132 L76 178" stroke={P.gruenTief} strokeWidth={19} strokeLinecap="round" />
      <path d="M152 132 L164 178" stroke={P.gruenTief} strokeWidth={19} strokeLinecap="round" />
      <ellipse cx={75} cy={186} rx={9} ry={9.5} {...flaeche(h.farbe)} />
      <ellipse cx={165} cy={186} rx={9} ry={9.5} {...flaeche(h.farbe)} />
      <rect x={112} y={106} width={16} height={18} rx={6} fill={h.tief} />
      <path d="M90 126 Q120 116 150 126 Q156 150 158 178 Q120 186 82 178 Q84 150 90 126 Z" {...flaeche(P.gruen)} />
      <path d="M140 122 Q150 124 150 126 Q156 150 158 178 Q146 182 134 183 Q144 150 140 122 Z" fill={P.gruenTief} opacity={0.5} />
      <path d="M96 134 Q91 156 89 172" stroke={P.gruenHell} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} />
      <path d="M100 124 Q120 140 140 124 Q132 116 120 116 Q108 116 100 124 Z" {...flaeche(P.gruenTief, 2)} />
      <path d="M112 132 L110 152 M128 132 L130 152" stroke={P.wolke} strokeWidth={3} strokeLinecap="round" />
      <path d="M100 158 L140 158 L144 174 Q120 178 96 174 Z" {...flaeche(P.gruenTief, 2)} />
      {[80, 160].map((x) => (
        <circle key={x} cx={x} cy={76} r={7} {...flaeche(h.farbe)} />
      ))}
      <path d={KOPF} {...flaeche(h.farbe)} />
      <path d="M158 78 C156 100 142 114 120 114 C142 106 152 94 154 78 Z" fill={h.tief} opacity={0.55} />
      <path d="M76 76 C70 44 92 24 122 24 C150 24 170 42 164 76 C160 62 152 54 142 52 C134 60 116 58 108 50 C100 58 88 62 80 62 C78 66 77 70 76 76 Z" {...flaeche(haar)} />
      <path d="M140 34 C156 42 166 56 164 76 C160 62 152 54 142 52 C144 46 143 40 140 34 Z" fill={haarTief} opacity={0.7} />
      <path d="M92 38 Q104 30 118 29" stroke={haarHell} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <ellipse cx={92} cy={90} rx={8} ry={4.5} fill={P.backe} opacity={0.45} />
      <ellipse cx={148} cy={90} rx={8} ry={4.5} fill={P.backe} opacity={0.45} />
      <ellipse cx={105} cy={78} rx={5.5} ry={8} fill={P.auge} />
      <ellipse cx={135} cy={78} rx={5.5} ry={8} fill={P.auge} />
      <path d="M98 65 Q105 61 112 64" stroke={haar} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <path d="M128 64 Q135 61 142 65" stroke={haar} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <path d="M119 84 Q117 90 121 91" stroke={h.tief} strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M110 98 Q120 105 130 98" stroke={P.mund} strokeWidth={4} strokeLinecap="round" fill="none" />
    </g>
  );
}

const ziel = process.env.STILPROBE_HELD;
it.skipIf(!ziel)('Stilprobe Held', () => {
  const svg = (inhalt: ReactElement, px: number) =>
    renderToStaticMarkup(
      <svg width={px} height={px} viewBox="0 0 240 240">
        {inhalt}
      </svg>,
    );
  const heute = (haut: number, px: number) => renderToStaticMarkup(<FigurBild figur={held({ haut })} zeit={0} lebendig={false} breite={px} />);
  const spalte = (titel: string, gross: string[], klein: string[]) =>
    `<figure style="margin:0;display:flex;flex-direction:column;align-items:center;gap:6px">${gross.join('')}<div style="display:flex;gap:6px;align-items:end">${klein.join('')}</div><figcaption style="font:600 15px sans-serif">${titel}</figcaption></figure>`;
  const reihe = (bg: string) =>
    `<div style="display:flex;gap:28px;padding:20px;background:${bg}">${[
      spalte('Heute', [heute(0, 280)], [heute(0, 48), heute(1, 48), heute(0, 32)]),
      spalte(
        'Probe A: Chibi, verfeinert',
        [svg(<ProbeA h={HAUT[0]} />, 280)],
        [svg(<ProbeA h={HAUT[0]} />, 48), svg(<ProbeA h={HAUT[1]} haar={P.haar1} haarTief={P.haar1Tief} haarHell={P.haar1Hell} />, 48), svg(<ProbeA h={HAUT[0]} />, 32)],
      ),
      spalte(
        'Probe B: älter, für Klasse 5–10',
        [svg(<ProbeB h={HAUT[0]} />, 280)],
        [svg(<ProbeB h={HAUT[0]} />, 48), svg(<ProbeB h={HAUT[1]} haar={P.haar1} haarTief={P.haar1Tief} haarHell={P.haar1Hell} />, 48), svg(<ProbeB h={HAUT[0]} />, 32)],
      ),
      spalte('A, andere Haut', [svg(<ProbeA h={HAUT[1]} haar={P.haar1} haarTief={P.haar1Tief} haarHell={P.haar1Hell} />, 280)], []),
    ].join('')}</div>`;
  mkdirSync(ziel!, { recursive: true });
  writeFileSync(`${ziel}/held-probe.html`, `<!doctype html><meta charset="utf-8"><body style="margin:0">${reihe('#FBF6E9')}${reihe('#173A1C')}</body>`);
});
