// Boss „Die Tintenkrake“ (boss template 2): a round mantle with six tentacles that turn at their base.
// Anchor `hut` on top, so a boss can wear a crown too.
import { useId } from 'react';
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Figur, Stand, Teil } from './typen';

function tentakel(i: number): Teil {
  const x = 66 + i * 26;
  const dir = i < 3 ? -1 : 1;
  const d = `M${x} 166 C${x} 196 ${x + dir * 18} 210 ${x + dir * 14} 228 S${x - dir * 6} 246 ${x - dir * 8} 234`;
  // The lighter underside: the same line, shifted inwards and thinner.
  const innen = `M${x - dir * 4} 172 C${x - dir * 4} 196 ${x + dir * 12} 210 ${x + dir * 8} 226`;
  const naepfe: [number, number][] = [
    [x - dir * 5, 186],
    [x - dir * 2, 200],
    [x + dir * 4, 212],
    [x + dir * 7, 223],
  ];
  return {
    id: `tentakel-${i + 1}`,
    drehpunkt: [x, 168],
    zeichnung: () => (
      <g>
        <path d={d} fill="none" stroke={P.linie} strokeWidth={24} strokeLinecap="round" />
        <path d={d} fill="none" stroke={i % 2 ? P.tinte : P.tinteHell} strokeWidth={18} strokeLinecap="round" />
        <path d={innen} fill="none" stroke={i % 2 ? P.tinteHell : P.lilaHell} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
        {naepfe.map(([cx, cy], k) => (
          <g key={k}>
            <circle cx={cx} cy={cy} r={3.6 - k * 0.4} fill={P.saugnapf} stroke={P.tinteTief} strokeWidth={1} />
            <circle cx={cx} cy={cy} r={1.2} fill={P.tinteTief} opacity={0.6} />
          </g>
        ))}
      </g>
    ),
  };
}

/** One eye with a lid: lurking half shut, angry slanted, blinking fully shut. */
function Auge({ x, gesicht, augenZu }: { x: number } & Stand) {
  const links = x < 130;
  // Unique per drawing: the same boss can stand several times on a page.
  const clip = `krake-auge-${useId().replace(/:/g, '')}`;
  if (gesicht === 'besiegt')
    return (
      <g stroke={P.auge} strokeWidth={5} strokeLinecap="round">
        <path d={`M${x - 10} 100 l20 20 M${x + 10} 100 l-20 20`} />
      </g>
    );
  if (gesicht === 'au')
    return <path d={links ? `M${x - 12} 102 L${x + 8} 110 L${x - 12} 118` : `M${x + 12} 102 L${x - 8} 110 L${x + 12} 118`} fill="none" stroke={P.auge} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
  const blick = gesicht === 'wut' ? 3 : 0;
  // Lower edge of the lid, from the left to the right corner (lower inside = angry).
  const kante: [number, number] = augenZu ? [110, 110] : gesicht === 'wut' ? (links ? [96, 106] : [106, 96]) : gesicht === 'boese' ? [101, 101] : [0, 0];
  const lid = kante[0] ? `M${x - 24} ${kante[0]} L${x + 24} ${kante[1]} L${x + 24} 80 L${x - 24} 80 Z` : '';
  return (
    <g>
      <clipPath id={clip}>
        <ellipse cx={x} cy={110} rx={21} ry={24} />
      </clipPath>
      <ellipse cx={x} cy={110} rx={21} ry={24} fill={P.weiss} />
      <g clipPath={`url(#${clip})`}>
        <circle cx={x + (links ? 4 : -4)} cy={114 + blick} r={11.5} fill={P.gold} />
        <ellipse cx={x + (links ? 4 : -4)} cy={114 + blick} rx={4} ry={9} fill={P.auge} />
        <circle cx={x + (links ? 8 : 0)} cy={108 + blick} r={3.5} fill={P.weiss} />
        {lid && <path d={lid} fill={P.tinte} />}
        {lid && <path d={`M${x - 24} ${kante[0]} L${x + 24} ${kante[1]}`} fill="none" stroke={P.linie} strokeWidth={3} />}
      </g>
      <ellipse cx={x} cy={110} rx={21} ry={24} fill="none" {...UMRISS} />
    </g>
  );
}

function Gesicht(s: Stand) {
  const { gesicht } = s;
  const mund =
    gesicht === 'wut' ? (
      <g>
        <path d="M106 146 Q130 166 154 146 Q130 154 106 146 Z" fill={P.mund} {...UMRISS_FEIN} />
        <path d="M112 148 l5 6 4 -5 5 6 4 -6 5 6 4 -5 5 5" fill={P.weiss} stroke={P.linie} strokeWidth={1.2} strokeLinejoin="round" />
      </g>
    ) : gesicht === 'besiegt' || gesicht === 'au' ? (
      <ellipse cx="130" cy="149" rx="9" ry="7" fill={P.mund} {...UMRISS_FEIN} />
    ) : (
      <g>
        <path d="M110 144 Q130 156 150 142" fill="none" stroke={P.auge} strokeWidth={4} strokeLinecap="round" />
        <path d="M140 147 l3 7 3 -8 Z" fill={P.weiss} stroke={P.linie} strokeWidth={1.2} strokeLinejoin="round" />
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
  zeichnung: () => <path d="M58 150 Q130 176 202 150 L196 194 Q130 216 64 194 Z" fill={P.tinteTief} {...UMRISS} />,
};

const MANTEL = 'M48 162 C36 64 88 26 130 26 C172 26 224 64 212 162 Q130 188 48 162 Z';

const mantel: Teil = {
  id: 'mantel',
  drehpunkt: [130, 170],
  anker: { hut: [130, 30] },
  zeichnung: (s) => (
    <g>
      <path d={MANTEL} fill={P.tinte} />
      {/* Shade bottom right, light top left, spots with rings */}
      <path d="M212 162 C220 100 196 56 160 34 C190 64 200 110 186 168 Q200 166 212 162 Z" fill={P.tinteTief} opacity={0.55} />
      <path d="M72 70 Q96 40 130 38" fill="none" stroke={P.tinteHell} strokeWidth={9} strokeLinecap="round" />
      <circle cx="66" cy="88" r="4" fill={P.tinteHell} />
      {[
        [180, 62, 7],
        [198, 88, 4.5],
        [64, 132, 6],
        [80, 152, 3.5],
        [118, 58, 4],
      ].map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} fill={P.tinteHell} />
          <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.45} fill={P.lilaHell} opacity={0.7} />
        </g>
      ))}
      {/* Ink drips along the lower edge */}
      <path d="M92 172 q4 10 0 14 q-4 -4 0 -14 Z M168 172 q4 8 0 12 q-4 -4 0 -12 Z" fill={P.tinteTief} {...UMRISS_FEIN} />
      <path d={MANTEL} fill="none" {...UMRISS} />
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
      <g fill={P.tinteTief} {...UMRISS_FEIN} transform={`translate(0 ${(Math.sin(zeit * 3) * 3).toFixed(2)})`}>
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
