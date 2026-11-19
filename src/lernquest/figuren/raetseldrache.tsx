// Boss „Der Rätseldrache“ (boss template 3): a chubby dragon seen from the front, a question mark on its belly.
// Wings and tail turn at their base, the head is a child of the body. Anchor `hut` on the head.
// No outline (docs/design/prinzipien.md, Stilprobe 2): green body, gold belly with a big question mark, purple wings
// and frills. Strokes (tail, arms) get a lighter copy moved up left as their edge on dark ground; the head casts a
// hard shadow onto the body.
import { useId } from 'react';
import { Schlagschatten } from './flaeche';
import { flaeche, P, STRICH } from './stil';
import type { Figur, Stand, Teil } from './typen';

/** One big white eye with a flat dark pupil and a lid: lurking half shut, angry slanted, blinking fully shut. */
function Auge({ x, gesicht, augenZu }: { x: number } & Stand) {
  const links = x < 130;
  const clip = `drache-auge-${useId().replace(/:/g, '')}`;
  const linie = { fill: 'none', stroke: P.auge, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  if (gesicht === 'besiegt') return <path d={`M${x - 9} 74 l18 16 M${x + 9} 74 l-18 16`} {...linie} />;
  if (gesicht === 'au') return <path d={links ? `M${x - 10} 74 L${x + 7} 82 L${x - 10} 90` : `M${x + 10} 74 L${x - 7} 82 L${x + 10} 90`} {...linie} />;
  const kante: [number, number] = augenZu ? [100, 100] : gesicht === 'wut' ? (links ? [72, 80] : [80, 72]) : [76, 76];
  return (
    <g>
      <clipPath id={clip}>
        <ellipse cx={x} cy={82} rx={16} ry={18} />
      </clipPath>
      <ellipse cx={x} cy={82} rx={16} ry={18} {...flaeche(P.weiss, 2.5)} />
      <g clipPath={`url(#${clip})`}>
        <circle cx={x + (links ? 3 : -3)} cy={86} r={8.5} fill={P.auge} />
        <path d={`M${x - 18} ${kante[0]} L${x + 18} ${kante[1]} L${x + 18} 60 L${x - 18} 60 Z`} fill={P.gruen} />
        <path d={`M${x - 18} ${kante[0]} L${x + 18} ${kante[1]}`} {...STRICH} />
      </g>
    </g>
  );
}

function Mund({ gesicht }: Stand) {
  if (gesicht === 'wut')
    return (
      <g>
        <path d="M108 112 Q130 132 152 112 Q130 118 108 112 Z" {...flaeche(P.mund, 2.5)} />
        <path d="M114 113 l3 6 3 -4 M146 113 l-3 6 -3 -4" {...flaeche(P.weiss, 1.5)} />
      </g>
    );
  if (gesicht === 'au' || gesicht === 'besiegt') return <ellipse cx="130" cy="116" rx="8" ry="6" {...flaeche(P.mund, 2.5)} />;
  return (
    <g>
      <path d="M110 112 Q120 118 130 114 Q140 118 150 110" {...STRICH} fill="none" strokeWidth={4} />
      <path d="M142 115 l-2 6 -3 -5 Z" {...flaeche(P.weiss, 1.5)} />
    </g>
  );
}

const KOPF = 'M74 84 C70 48 98 30 130 30 C162 30 190 48 186 84 C184 112 162 128 130 128 C98 128 76 112 74 84 Z';
const RUMPF = 'M84 132 Q130 112 176 132 Q204 180 188 224 Q130 246 72 224 Q56 180 84 132 Z';

const kopf: Teil = {
  id: 'kopf',
  drehpunkt: [130, 126],
  anker: { hut: [130, 30] },
  zeichnung: (s) => (
    <g>
      {/* horns and ear frills behind the head */}
      <path d="M92 44 Q78 20 62 16 Q76 32 80 52 Z" {...flaeche(P.gold)} />
      <path d="M168 44 Q182 20 198 16 Q184 32 180 52 Z" {...flaeche(P.gold)} />
      <path d="M76 72 L50 64 L58 80 L48 92 L76 94 Z" {...flaeche(P.lila)} />
      <path d="M184 72 L210 64 L202 80 L212 92 L184 94 Z" {...flaeche(P.lila)} />
      <Schlagschatten form={KOPF} auf={[RUMPF]} />
      <path d={KOPF} {...flaeche(P.gruen)} />
      <path d="M186 84 C184 112 162 128 130 128 C160 118 176 100 176 62 Q186 70 186 84 Z" fill={P.gruenTief} opacity={0.6} />
      {/* snout with nostrils, spikes on top */}
      <ellipse cx="130" cy="106" rx="30" ry="16" {...flaeche(P.gruenHell, 2.5)} />
      <circle cx="120" cy="102" r="3" fill={P.gruenTief} />
      <circle cx="140" cy="102" r="3" fill={P.gruenTief} />
      <path d="M116 34 L124 14 L130 30 L136 14 L144 34 Z" {...flaeche(P.lila, 2.5)} />
      <Auge x={104} {...s} />
      <Auge x={156} {...s} />
      <Mund {...s} />
    </g>
  ),
};

const ARM_L = 'M84 150 Q72 170 86 182';
const ARM_R = 'M176 150 Q188 170 174 182';

const rumpf: Teil = {
  id: 'rumpf',
  drehpunkt: [130, 240],
  zeichnung: () => (
    <g>
      {/* feet */}
      <path d="M84 222 Q82 246 108 246 Q120 246 118 230 Z" {...flaeche(P.gruenTief)} />
      <path d="M176 222 Q178 246 152 246 Q140 246 142 230 Z" {...flaeche(P.gruenTief)} />
      <path d={RUMPF} {...flaeche(P.gruen)} />
      <path d="M190 160 Q200 196 188 224 Q160 236 130 238 Q176 220 180 150 Z" fill={P.gruenTief} opacity={0.6} />
      {/* belly with the question mark: the one big feature */}
      <path d="M100 140 Q130 128 160 140 Q172 184 160 222 Q130 232 100 222 Q88 184 100 140 Z" {...flaeche(P.goldHell, 2.5)} />
      <path d="M100 196 Q130 202 160 196" {...STRICH} fill="none" stroke={P.goldTief} />
      <path d="M116 168 Q116 150 130 150 Q146 150 146 164 Q146 176 132 180 L132 190" fill="none" stroke={P.lilaTief} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="132" cy="209" r="5.5" fill={P.lilaTief} />
      {/* small arms */}
      <path d={ARM_L} fill="none" stroke={P.gruenTief} strokeWidth={17} strokeLinecap="round" />
      <path d={ARM_R} fill="none" stroke={P.gruenTief} strokeWidth={17} strokeLinecap="round" />
    </g>
  ),
  kinder: [kopf],
};

/** A bat wing spreading up and out from the back. `seite` −1 left, 1 right. */
function fluegel(seite: -1 | 1): Teil {
  const x = 130 + seite * 34;
  const m = (dx: number) => x + seite * dx;
  return {
    id: seite < 0 ? 'fluegel-l' : 'fluegel-r',
    drehpunkt: [x, 150],
    zeichnung: () => (
      <g>
        <path
          d={`M${x} 150 L${m(40)} 70 L${m(96)} 52 L${m(92)} 92 L${m(116)} 108 L${m(88)} 128 L${m(98)} 156 L${m(60)} 156 Q${m(30)} 166 ${x} 168 Z`}
          {...flaeche(P.lila)}
        />
        <path d={`M${m(40)} 70 L${m(60)} 156 M${m(96)} 52 L${m(46)} 140`} {...STRICH} fill="none" stroke={P.lilaTief} strokeWidth={4} />
      </g>
    ),
  };
}

const SCHWANZ = 'M160 218 Q214 236 228 196 Q232 182 224 172';

const schwanz: Teil = {
  id: 'schwanz',
  drehpunkt: [166, 222],
  zeichnung: () => (
    <g>
      <path d={SCHWANZ} fill="none" stroke={P.gruenHell} strokeWidth={22} strokeLinecap="round" transform="translate(-2 -2)" />
      <path d={SCHWANZ} fill="none" stroke={P.gruen} strokeWidth={22} strokeLinecap="round" />
      <path d="M224 174 L212 150 L240 160 Z" {...flaeche(P.lila)} />
    </g>
  ),
};

export const RAETSELDRACHE: Figur = {
  id: 'raetseldrache',
  name: 'Der Rätseldrache',
  art: 'boss',
  groesse: [260, 260],
  boden: [130, 250],
  teile: [schwanz, fluegel(-1), fluegel(1), rumpf],
  posen: {
    lauern: { name: 'Lauern', gesicht: 'boese' },
    angriff: { name: 'Angriff', gesicht: 'wut', winkel: { 'fluegel-l': 18, 'fluegel-r': -18, kopf: -4 }, extras: ['feuer'] },
    getroffen: { name: 'Getroffen', gesicht: 'au', winkel: { kopf: -10, 'fluegel-l': -14, 'fluegel-r': 6 }, extras: ['sterne'] },
    besiegt: { name: 'Besiegt', gesicht: 'besiegt', winkel: { kopf: 12, 'fluegel-l': -30, 'fluegel-r': 30, schwanz: 20 }, extras: ['kringel'] },
  },
  gesichter: ['boese', 'wut', 'au', 'besiegt'],
  animationen: ['atmen', 'flattern', 'angriff', 'treffer', 'wedeln', 'huepfen'],
  extras: {
    feuer: ({ zeit }) => {
      const z = 1 + Math.sin(zeit * 12) * 0.08;
      return (
        <g transform={`translate(130 120) scale(${z.toFixed(3)}) translate(-130 -120)`} {...flaeche(P.rot, 2.5)}>
          <path d="M112 124 Q130 176 148 124 Q140 138 130 132 Q120 138 112 124 Z" fill={P.rot} />
          <path d="M120 128 Q130 160 140 128 Q134 136 130 134 Q126 136 120 128 Z" fill={P.gold} />
        </g>
      );
    },
    sterne: ({ zeit }) => (
      <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" transform={`rotate(${((zeit * 90) % 360).toFixed(1)} 130 12)`}>
        <path d="M100 12 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
        <path d="M160 12 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
      </g>
    ),
    kringel: () => (
      <g fill="none" stroke={P.goldTief} strokeWidth={2.5} strokeLinecap="round">
        <path d="M98 12 q6 -8 12 0 q6 8 12 0" />
        <path d="M140 8 q6 -8 12 0 q6 8 12 0" />
      </g>
    ),
  },
};
