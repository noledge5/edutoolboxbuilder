// Boss „Die Tintenkrake“ (boss template 2): a round mantle with six tentacles that turn at their base.
// Anchor `hut` on top, so a boss can wear a crown too.
// No outline (docs/design/prinzipien.md, Stilprobe 2): a mantle, six fat tentacles with one row of suckers each, two big
// white eyes with lids. Tentacles are strokes; a lighter copy moved up left gives them the edge on dark ground.
import { useId } from 'react';
import { Flaeche, Schlagschatten } from './flaeche';
import { flaeche, P, STRICH } from './stil';
import type { Figur, Stand, Teil } from './typen';

function tentakel(i: number): Teil {
  const x = 66 + i * 26;
  const dir = i < 3 ? -1 : 1;
  const d = `M${x} 166 C${x} 196 ${x + dir * 18} 210 ${x + dir * 14} 228 S${x - dir * 6} 246 ${x - dir * 8} 234`;
  // The suckers: the same line, shifted inwards, as a row of round dots.
  const innen = `M${x - dir * 4} 180 C${x - dir * 4} 198 ${x + dir * 12} 210 ${x + dir * 8} 226`;
  const farbe = i % 2 ? P.tinte : P.tinteHell;
  const kante = i % 2 ? P.tinteHell : P.lilaHell;
  return {
    id: `tentakel-${i + 1}`,
    drehpunkt: [x, 168],
    zeichnung: () => (
      <g>
        <path d={d} fill="none" stroke={kante} strokeWidth={26} strokeLinecap="round" transform="translate(-2 -2)" />
        <path d={d} fill="none" stroke={farbe} strokeWidth={26} strokeLinecap="round" />
        <path d={innen} fill="none" stroke={P.saugnapf} strokeWidth={6} strokeLinecap="round" strokeDasharray="0.1 11" />
      </g>
    ),
  };
}

/** One big white eye with a flat dark pupil and a lid: lurking half shut, angry slanted, blinking fully shut. */
function Auge({ x, gesicht, augenZu }: { x: number } & Stand) {
  const links = x < 130;
  // Unique per drawing: the same boss can stand several times on a page.
  const clip = `krake-auge-${useId().replace(/:/g, '')}`;
  const linie = { fill: 'none', stroke: P.weiss, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  if (gesicht === 'besiegt') return <path d={`M${x - 10} 100 l20 20 M${x + 10} 100 l-20 20`} {...linie} />;
  if (gesicht === 'au') return <path d={links ? `M${x - 12} 102 L${x + 8} 110 L${x - 12} 118` : `M${x + 12} 102 L${x - 8} 110 L${x + 12} 118`} {...linie} />;
  const blick = gesicht === 'wut' ? 3 : 0;
  // Lower edge of the lid, from the left to the right corner (lower inside = angry).
  const kante: [number, number] = augenZu ? [110, 110] : gesicht === 'wut' ? (links ? [96, 106] : [106, 96]) : gesicht === 'boese' ? [101, 101] : [0, 0];
  const lid = kante[0] ? `M${x - 24} ${kante[0]} L${x + 24} ${kante[1]} L${x + 24} 80 L${x - 24} 80 Z` : '';
  return (
    <g>
      <clipPath id={clip}>
        <ellipse cx={x} cy={110} rx={21} ry={24} />
      </clipPath>
      <ellipse cx={x} cy={110} rx={21} ry={24} {...flaeche(P.weiss, 2.5)} />
      <g clipPath={`url(#${clip})`}>
        <circle cx={x + (links ? 4 : -4)} cy={114 + blick} r={11} fill={P.auge} />
        {lid && <path d={lid} fill={P.tinte} />}
        {lid && <path d={`M${x - 24} ${kante[0]} L${x + 24} ${kante[1]}`} {...STRICH} />}
      </g>
    </g>
  );
}

function Gesicht(s: Stand) {
  const { gesicht } = s;
  const mund =
    gesicht === 'wut' ? (
      <g>
        <path d="M106 146 Q130 168 154 146 Q130 154 106 146 Z" {...flaeche(P.mund, 2.5)} />
        <path d="M114 148 q16 6 32 0 l-4 6 -4 -4 -4 5 -4 -5 -4 5 -4 -4 Z" fill={P.weiss} />
      </g>
    ) : gesicht === 'besiegt' || gesicht === 'au' ? (
      <ellipse cx="130" cy="149" rx="9" ry="7" {...flaeche(P.mund, 2.5)} />
    ) : (
      <g>
        <path d="M110 144 Q130 156 150 142" {...STRICH} fill="none" stroke={P.weiss} strokeWidth={4} />
        <path d="M140 147 l3 7 3 -8 Z" {...flaeche(P.weiss, 1.5)} />
      </g>
    );
  return (
    <g>
      <Auge x={100} {...s} />
      <Auge x={160} {...s} />
      {mund}
    </g>
  );
}

/** The dark underside between the tentacles, so no gaps show between their bases. */
const unterseite: Teil = {
  id: 'unterseite',
  drehpunkt: [130, 170],
  zeichnung: () => <Flaeche d="M58 150 Q130 176 202 150 L196 194 Q130 216 64 194 Z" farbe={P.tinteTief} hell={P.tinte} />,
};

const MANTEL = 'M48 162 C36 64 88 26 130 26 C172 26 224 64 212 162 Q130 188 48 162 Z';

const mantel: Teil = {
  id: 'mantel',
  drehpunkt: [130, 170],
  anker: { hut: [130, 30] },
  zeichnung: (s) => (
    <g>
      <Schlagschatten form={MANTEL} auf={['M58 150 Q130 176 202 150 L196 194 Q130 216 64 194 Z']} versatz={4} />
      <Flaeche d={MANTEL} farbe={P.tinte} hell={P.tinteHell} />
      {/* Shade bottom right, one light top left, three ink spots */}
      <path d="M212 162 C220 100 196 56 160 34 C190 64 200 110 186 168 Q200 166 212 162 Z" fill={P.tinteTief} opacity={0.55} />
      <path d="M72 70 Q96 40 130 38" fill="none" stroke={P.tinteHell} strokeWidth={9} strokeLinecap="round" />
      <circle cx="184" cy="64" r="8" fill={P.tinteHell} />
      <circle cx="68" cy="130" r="6" fill={P.tinteHell} />
      <circle cx="200" cy="96" r="4.5" fill={P.tinteHell} />
      <Gesicht {...s} />
    </g>
  ),
};

const T = [1, 2, 3, 4, 5, 6].map((i) => `tentakel-${i}`);
const faecher = (w: number[]) => Object.fromEntries(T.map((t, i) => [t, w[i]]));

export const TINTENKRAKE: Figur = {
  id: 'tintenkrake',
  name: 'Die Tintenkrake',
  art: 'boss',
  groesse: [260, 260],
  boden: [130, 250],
  teile: [unterseite, ...[0, 1, 2, 3, 4, 5].map(tentakel), mantel],
  posen: {
    lauern: { name: 'Lauern', gesicht: 'boese' },
    angriff: { name: 'Angriff', gesicht: 'wut', winkel: faecher([110, 40, 0, 0, -40, -110]), extras: ['tinte'] },
    getroffen: { name: 'Getroffen', gesicht: 'au', winkel: { mantel: -8, ...faecher([20, 10, 5, -5, -10, -20]) }, extras: ['sterne'] },
    besiegt: { name: 'Besiegt', gesicht: 'besiegt', winkel: faecher([60, 30, 10, -10, -30, -60]), extras: ['kringel'] },
  },
  gesichter: ['boese', 'wut', 'au', 'besiegt'],
  animationen: ['atmen', 'schweben', 'tentakel', 'angriff', 'treffer', 'huepfen'],
  extras: {
    tinte: ({ zeit }) => (
      <g {...flaeche(P.tinteHell, 2.5)} transform={`translate(0 ${(Math.sin(zeit * 3) * 3).toFixed(2)})`}>
        <path d="M18 60 q8 -10 16 0 q10 -4 8 8 q8 8 -4 12 q-4 10 -12 2 q-12 2 -8 -10 q-8 -8 0 -12 Z" />
        <circle cx="234" cy="70" r="7" />
        <circle cx="244" cy="54" r="4" />
        <circle cx="30" cy="96" r="3.5" />
      </g>
    ),
    sterne: ({ zeit }) => (
      <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" transform={`rotate(${((zeit * 90) % 360).toFixed(1)} 130 20)`}>
        <path d="M100 20 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
        <path d="M160 20 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
        <circle cx="130" cy="2" r="3" />
      </g>
    ),
    kringel: () => (
      <g fill="none" stroke={P.goldTief} strokeWidth={2.5} strokeLinecap="round">
        <path d="M96 64 q6 -8 12 0 q6 8 12 0" />
        <path d="M140 60 q6 -8 12 0 q6 8 12 0" />
      </g>
    ),
  },
};
