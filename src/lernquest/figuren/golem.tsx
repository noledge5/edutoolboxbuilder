// Boss „Der Kompass-Golem“ (boss template 1): a stone giant with a compass in its chest. Body with the head as a
// child, two heavy arms that turn at the shoulder. The needle spins by itself (faster when angry).
// Anchor `hut` on the head, so a boss can wear a crown too.
// No outline (docs/design/prinzipien.md, Stilprobe 2): big stone shapes separate by tone (light stone in front, dark
// stone behind), the head casts a hard shadow onto the body, the compass is the one bright spot.
import { Schlagschatten } from './flaeche';
import { flaeche, P, STRICH } from './stil';
import type { Figur, Stand, Teil } from './typen';

/** A flat dark eye under a stone brow: lurking narrow, angry slanted, hit squeezed, beaten crossed out. */
function Auge({ x, gesicht, augenZu }: { x: number } & Stand) {
  const links = x < 130;
  const linie = { fill: 'none', stroke: P.auge, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  if (gesicht === 'besiegt') return <path d={`M${x - 8} 62 l16 14 M${x + 8} 62 l-16 14`} {...linie} />;
  if (gesicht === 'au') return <path d={links ? `M${x - 9} 62 L${x + 7} 69 L${x - 9} 76` : `M${x + 9} 62 L${x - 7} 69 L${x + 9} 76`} {...linie} />;
  if (augenZu) return <path d={`M${x - 10} 70 h20`} {...linie} strokeWidth={4} />;
  return <ellipse cx={x} cy={71} rx={11} ry={gesicht === 'wut' ? 8 : 7} fill={P.auge} />;
}

/** Heavy brows: a flat ledge, slanted down to the middle when angry. */
function Brauen({ gesicht }: Stand) {
  const schraeg = gesicht === 'wut' ? 9 : gesicht === 'boese' ? 5 : gesicht === 'au' ? -4 : 0;
  return (
    <g {...flaeche(P.metallTief, 2.5)}>
      <path d={`M90 ${54 - schraeg} L120 ${56 + schraeg} L120 ${63 + schraeg} L90 ${61 - schraeg} Z`} />
      <path d={`M170 ${54 - schraeg} L140 ${56 + schraeg} L140 ${63 + schraeg} L170 ${61 - schraeg} Z`} />
    </g>
  );
}

function Mund({ gesicht }: Stand) {
  if (gesicht === 'wut')
    return (
      <g>
        <path d="M108 84 L152 84 L146 96 L114 96 Z" {...flaeche(P.mund, 2.5)} />
        <path d="M112 85 h36 l-2 4 -4 4 -4 -4 -4 4 -4 -4 -4 4 -4 -4 -4 4 -4 -4 Z" fill={P.steinHell} />
      </g>
    );
  if (gesicht === 'au' || gesicht === 'besiegt') return <ellipse cx="130" cy="90" rx="8" ry="6" {...flaeche(P.mund, 2.5)} />;
  return <path d="M112 88 L124 86 L136 90 L148 87" {...STRICH} fill="none" strokeWidth={4} />;
}

const KOPF = 'M86 50 Q86 30 106 28 L154 28 Q174 30 174 50 L176 88 Q174 104 154 104 L106 104 Q86 104 84 88 Z';
const RUMPF = 'M74 104 Q130 88 186 104 Q204 140 192 196 Q130 214 68 196 Q56 140 74 104 Z';

const kopf: Teil = {
  id: 'kopf',
  drehpunkt: [130, 104],
  anker: { hut: [130, 30] },
  zeichnung: (s) => (
    <g>
      <Schlagschatten form={KOPF} auf={[RUMPF]} />
      <path d={KOPF} {...flaeche(P.metall)} />
      <path d="M176 60 L176 88 Q174 104 154 104 L120 104 Q160 96 166 52 Z" fill={P.metallTief} opacity={0.6} />
      {/* moss on top, a crack on the cheek */}
      <path d="M128 28 Q134 18 144 22 Q152 18 156 28 Z" {...flaeche(P.blatt, 2.5)} />
      <path d="M160 74 l6 6 -3 6 5 5" {...STRICH} fill="none" stroke={P.metallTief} />
      <Brauen {...s} />
      <Auge x={106} {...s} />
      <Auge x={154} {...s} />
      <Mund {...s} />
    </g>
  ),
};

/** The compass in the chest; the needle spins by itself and fast when angry. */
function Kompass({ gesicht, zeit }: Stand) {
  const tempo = gesicht === 'wut' ? 400 : gesicht === 'besiegt' ? 0 : 40;
  const w = gesicht === 'besiegt' ? 150 : (zeit * tempo) % 360;
  return (
    <g>
      <circle cx="130" cy="148" r="28" {...flaeche(P.gold)} />
      <circle cx="130" cy="148" r="19" {...flaeche(P.steinHell, 2.5)} />
      <path d="M146 154 A19 19 0 0 1 120 164 Q140 164 146 154 Z" fill={P.steinTief} />
      <g transform={`rotate(${w.toFixed(1)} 130 148)`}>
        <path d="M130 130 L136 148 L124 148 Z" {...flaeche(P.rot, 2)} />
        <path d="M130 166 L136 148 L124 148 Z" {...flaeche(P.metallTief, 2)} />
      </g>
      <circle cx="130" cy="148" r="3.5" fill={P.goldTief} />
    </g>
  );
}

const rumpf: Teil = {
  id: 'rumpf',
  drehpunkt: [130, 240],
  zeichnung: (s) => (
    <g>
      {/* legs: two stubby blocks in the dark stone */}
      <path d="M84 190 L122 190 L124 238 Q104 246 82 238 Z" {...flaeche(P.metallTief)} />
      <path d="M138 190 L176 190 L178 238 Q156 246 136 238 Z" {...flaeche(P.metallTief)} />
      <path d={RUMPF} {...flaeche(P.metall)} />
      <path d="M192 120 Q204 150 192 196 Q160 206 128 208 Q176 190 180 110 Z" fill={P.metallTief} opacity={0.6} />
      <path d="M90 130 l8 6 -4 8 6 6" {...STRICH} fill="none" stroke={P.metallTief} />
      <Kompass {...s} />
    </g>
  ),
  kinder: [kopf],
};

/** A heavy arm hanging from the shoulder: a boulder for the shoulder, a stone fist. `seite` −1 left, 1 right. */
function arm(seite: -1 | 1): Teil {
  const x = 130 + seite * 66;
  const faust = x + seite * 10;
  return {
    id: seite < 0 ? 'arm-l' : 'arm-r',
    drehpunkt: [x, 116],
    zeichnung: () => (
      <g>
        <path d={`M${x - 13} 126 L${x + 13} 126 L${faust + 12} 182 L${faust - 12} 182 Z`} {...flaeche(P.metallTief)} />
        <path d={`M${faust - 22} 186 Q${faust - 22} 168 ${faust} 168 Q${faust + 22} 168 ${faust + 22} 186 Q${faust + 22} 206 ${faust} 206 Q${faust - 22} 206 ${faust - 22} 186 Z`} {...flaeche(P.metall)} />
        <path d={`M${faust + 22} 186 Q${faust + 22} 206 ${faust} 206 Q${faust + 12} 198 ${faust + 14} 180 Z`} fill={P.metallTief} opacity={0.6} />
        <ellipse cx={x} cy={118} rx={22} ry={20} {...flaeche(P.metall)} />
        <path d={`M${x + 22} 118 A22 20 0 0 1 ${x} 138 Q${x + 12} 126 ${x + 12} 106 Z`} fill={P.metallTief} opacity={0.6} />
      </g>
    ),
  };
}

export const GOLEM: Figur = {
  id: 'golem',
  name: 'Der Kompass-Golem',
  art: 'boss',
  groesse: [260, 260],
  boden: [130, 250],
  teile: [rumpf, arm(-1), arm(1)],
  posen: {
    lauern: { name: 'Lauern', gesicht: 'boese', winkel: { 'arm-l': 8, 'arm-r': -8 } },
    angriff: { name: 'Angriff', gesicht: 'wut', winkel: { 'arm-l': 150, 'arm-r': -150 }, extras: ['staub'] },
    getroffen: { name: 'Getroffen', gesicht: 'au', winkel: { kopf: -8, 'arm-l': 24, 'arm-r': -16 }, extras: ['sterne'] },
    besiegt: { name: 'Besiegt', gesicht: 'besiegt', winkel: { kopf: 12, 'arm-l': -6, 'arm-r': 6 }, extras: ['kringel'] },
  },
  gesichter: ['boese', 'wut', 'au', 'besiegt'],
  animationen: ['atmen', 'stampfen', 'angriff', 'treffer', 'kopfschuetteln'],
  extras: {
    staub: ({ zeit }) => (
      <g {...flaeche(P.steinTief, 2.5)} opacity={0.9}>
        {[
          [40, 238, 9],
          [62, 246, 6],
          [204, 240, 8],
          [224, 232, 5],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy - Math.abs(Math.sin(zeit * 4 + i)) * 6} r={r} />
        ))}
      </g>
    ),
    sterne: ({ zeit }) => (
      <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" transform={`rotate(${((zeit * 90) % 360).toFixed(1)} 130 14)`}>
        <path d="M100 14 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
        <path d="M160 14 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
      </g>
    ),
    kringel: () => (
      <g fill="none" stroke={P.goldTief} strokeWidth={2.5} strokeLinecap="round">
        <path d="M98 14 q6 -8 12 0 q6 8 12 0" />
        <path d="M140 10 q6 -8 12 0 q6 8 12 0" />
      </g>
    ),
  },
};
