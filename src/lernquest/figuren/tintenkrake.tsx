// Boss „Die Tintenkrake“ (boss template 2): a round mantle with six tentacles that turn at their base.
// Anchor `hut` on top, so a boss can wear a crown too.
import { P, UMRISS, UMRISS_FEIN } from './stil';
import type { Figur, Stand, Teil } from './typen';

function tentakel(i: number): Teil {
  const x = 66 + i * 26;
  const dir = i < 3 ? -1 : 1;
  const d = `M${x} 166 C${x} 196 ${x + dir * 18} 210 ${x + dir * 14} 228 S${x - dir * 6} 246 ${x - dir * 8} 234`;
  return {
    id: `tentakel-${i + 1}`,
    drehpunkt: [x, 168],
    zeichnung: () => (
      <g>
        <path d={d} fill="none" stroke={P.linie} strokeWidth={24} strokeLinecap="round" />
        <path d={d} fill="none" stroke={i % 2 ? P.tinte : P.tinteHell} strokeWidth={18} strokeLinecap="round" />
        {[190, 206, 220].map((y, k) => (
          <circle key={y} cx={x + dir * (k * 5 + 2) - dir * 4} cy={y} r={3} fill={P.saugnapf} />
        ))}
      </g>
    ),
  };
}

function Gesicht({ gesicht }: Stand) {
  const auge = (x: number) => {
    if (gesicht === 'besiegt')
      return (
        <g key={x} stroke={P.auge} strokeWidth={5} strokeLinecap="round">
          <path d={`M${x - 10} 100 l20 20 M${x + 10} 100 l-20 20`} />
        </g>
      );
    if (gesicht === 'au')
      return <path key={x} d={x < 130 ? `M${x - 12} 102 L${x + 8} 110 L${x - 12} 118` : `M${x + 12} 102 L${x - 8} 110 L${x + 12} 118`} fill="none" stroke={P.auge} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
    const blick = gesicht === 'wut' ? 3 : 0;
    return (
      <g key={x}>
        <ellipse cx={x} cy={110} rx={21} ry={24} fill={P.weiss} {...UMRISS} />
        <circle cx={x + (x < 130 ? 4 : -4)} cy={114 + blick} r={11} fill={P.auge} />
        <circle cx={x + (x < 130 ? 8 : 0)} cy={109 + blick} r={3.5} fill={P.weiss} />
      </g>
    );
  };
  const brauen =
    gesicht === 'wut' || gesicht === 'boese' ? (
      <g stroke={P.tinteTief} strokeWidth={gesicht === 'wut' ? 7 : 5} strokeLinecap="round">
        <path d="M78 82 L114 94" />
        <path d="M182 82 L146 94" />
      </g>
    ) : null;
  const mund =
    gesicht === 'wut' ? (
      <path d="M108 148 L118 140 L126 148 L134 140 L142 148 L152 140" fill="none" stroke={P.auge} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
    ) : gesicht === 'besiegt' || gesicht === 'au' ? (
      <ellipse cx="130" cy="148" rx="9" ry="7" fill={P.mund} {...UMRISS_FEIN} />
    ) : (
      <path d="M112 144 Q130 154 148 144" fill="none" stroke={P.auge} strokeWidth={4} strokeLinecap="round" />
    );
  return (
    <g>
      {auge(100)}
      {auge(160)}
      {brauen}
      {mund}
    </g>
  );
}

const mantel: Teil = {
  id: 'mantel',
  drehpunkt: [130, 170],
  anker: { hut: [130, 30] },
  zeichnung: (s) => (
    <g>
      <path d="M48 162 C36 64 88 26 130 26 C172 26 224 64 212 162 Q130 188 48 162 Z" fill={P.tinte} {...UMRISS} />
      <path d="M72 70 Q96 40 130 38" fill="none" stroke={P.tinteHell} strokeWidth={8} strokeLinecap="round" />
      <path d="M200 120 Q206 150 190 166 Q206 160 212 140 Z" fill={P.tinteTief} opacity={0.6} />
      <circle cx="180" cy="62" r="6" fill={P.tinteHell} />
      <circle cx="196" cy="84" r="4" fill={P.tinteHell} />
      <circle cx="66" cy="132" r="5" fill={P.tinteHell} />
      <Gesicht {...s} />
    </g>
  ),
};

/** The dark underside between the tentacles, so no gaps show between their bases. */
const unterseite: Teil = {
  id: 'unterseite',
  drehpunkt: [130, 170],
  zeichnung: () => <path d="M58 150 Q130 176 202 150 L196 192 Q130 214 64 192 Z" fill={P.tinteTief} {...UMRISS} />,
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
    getroffen: { name: 'Getroffen', gesicht: 'au', winkel: { mantel: -8, ...faecher([20, 10, 5, -5, -10, -20]) } },
    besiegt: { name: 'Besiegt', gesicht: 'besiegt', winkel: faecher([60, 30, 10, -10, -30, -60]) },
  },
  animationen: ['schweben', 'tentakel', 'treffer', 'huepfen'],
  extras: {
    tinte: () => (
      <g fill={P.tinteTief} {...UMRISS_FEIN}>
        <path d="M18 60 q8 -10 16 0 q10 -4 8 8 q8 8 -4 12 q-4 10 -12 2 q-12 2 -8 -10 q-8 -8 0 -12 Z" />
        <circle cx="234" cy="70" r="7" />
        <circle cx="244" cy="54" r="4" />
      </g>
    ),
  },
};

