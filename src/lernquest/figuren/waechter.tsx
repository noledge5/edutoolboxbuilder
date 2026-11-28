import { useId } from 'react';
// The tower guards (28.11.2026, Solo-Boss an der Burg, docs/plan-lernquest-fragen.md step 6): at the end of every region a
// small living tower blocks the way; each child beats it alone in the region's Meilenstein. One drawing, coloured per
// world of the map (grey stone on the meadow, sandstone in the desert, ice in the snow …), so it is the region's own
// guard and stays apart from the three big class bosses of the projector.
// The tower is the body and the face: battlements as the head (part `kopf`, it wobbles), the gate as the mouth (a
// portcullis when angry), two stubby stone arms. Part ids as the golem's, so the boss moves fit (stampfen, angriff,
// treffer). No outline (docs/design/prinzipien.md): tones separate the shapes, dark worlds get the `hell` edge.
import { Flaeche, Schlagschatten } from './flaeche';
import { flaeche, P, STRICH } from './stil';
import type { Figur, Stand, Teil } from './typen';
import type { WeltId } from './welten';

interface Farben {
  stein: string;
  hell: string;
  tief: string;
  wimpel: string;
  wimpelTief: string;
  tuer: string;
}

/** The colours per world (all from the palette). */
const FARBEN: Record<WeltId, Farben> = {
  wiese: { stein: P.metall, hell: P.metallHell, tief: P.metallTief, wimpel: P.blau, wimpelTief: P.blauTief, tuer: P.holz },
  wueste: { stein: P.orangeHell, hell: P.sandHell, tief: P.orangeTief, wimpel: P.tuerkis, wimpelTief: P.tuerkisTief, tuer: P.holzTief },
  schnee: { stein: P.eis, hell: P.eisHell, tief: P.eisTief, wimpel: P.blau, wimpelTief: P.blauTief, tuer: P.holz },
  strand: { stein: P.tuerkis, hell: P.tuerkisHell, tief: P.tuerkisTief, wimpel: P.rot, wimpelTief: P.rotTief, tuer: P.holz },
  vulkan: { stein: P.dunkel, hell: P.dunkelHell, tief: P.dunkelTief, wimpel: P.lava, wimpelTief: P.lavaTief, tuer: P.holzTief },
  weltall: { stein: P.lila, hell: P.lilaHell, tief: P.lilaTief, wimpel: P.gelb, wimpelTief: P.gelbTief, tuer: P.holzTief },
  wald: { stein: P.holz, hell: P.holzHell, tief: P.holzTief, wimpel: P.blatt, wimpelTief: P.blattTief, tuer: P.lederTief },
  turm: { stein: P.schiefer, hell: P.schieferHell, tief: P.schieferTief, wimpel: P.lila, wimpelTief: P.lilaTief, tuer: P.holz },
};

/** What the children read over the life bar. */
export const WAECHTER_NAMEN: Record<WeltId, string> = {
  wiese: 'Der Wiesen-Wächter',
  wueste: 'Der Wüsten-Wächter',
  schnee: 'Der Schnee-Wächter',
  strand: 'Der Strand-Wächter',
  vulkan: 'Der Vulkan-Wächter',
  weltall: 'Der Sternen-Wächter',
  wald: 'Der Wald-Wächter',
  turm: 'Der Turm-Wächter',
};

const RUMPF = 'M52 82 L148 82 L152 190 Q100 202 48 190 Z';
const SIMS = 'M42 64 L158 64 L156 86 L44 86 Z';
const ZINNEN = 'M42 44 H66 V66 H42 Z M88 44 H112 V66 H88 Z M134 44 H158 V66 H134 Z';
const TUER = 'M80 190 V160 Q100 136 120 160 V190 Q100 194 80 190 Z';

/** A white eye with a dark pupil under a lid of the tower's stone (like the class bosses): lurking narrow, angry
 *  slanted, hit squeezed, beaten crossed out. */
function Auge({ x, f, gesicht, augenZu }: { x: number; f: Farben } & Stand) {
  const links = x < 100;
  const clip = `waechter-auge-${useId().replace(/:/g, '')}`;
  const linie = { fill: 'none', stroke: P.auge, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  if (gesicht === 'besiegt') return <path d={`M${x - 7} 106 l14 13 M${x + 7} 106 l-14 13`} {...linie} />;
  if (gesicht === 'au') return <path d={links ? `M${x - 8} 105 L${x + 6} 112 L${x - 8} 119` : `M${x + 8} 105 L${x - 6} 112 L${x + 8} 119`} {...linie} />;
  const kante: [number, number] = augenZu ? [126, 126] : gesicht === 'wut' ? (links ? [104, 112] : [112, 104]) : gesicht === 'boese' ? [107, 107] : [102, 102];
  return (
    <g>
      <clipPath id={clip}>
        <ellipse cx={x} cy={113} rx={11} ry={12} />
      </clipPath>
      <ellipse cx={x} cy={113} rx={11} ry={12} fill={P.weiss} />
      <g clipPath={`url(#${clip})`}>
        <circle cx={x + (links ? 2.5 : -2.5)} cy={115} r={5.6} fill={P.auge} />
        <path d={`M${x - 13} ${kante[0]} L${x + 13} ${kante[1]} L${x + 13} 96 L${x - 13} 96 Z`} fill={f.stein} />
      </g>
    </g>
  );
}

/** Stone brows over the eyes, slanted down to the middle when angry. */
function Brauen({ f, gesicht }: { f: Farben } & Stand) {
  const s = gesicht === 'wut' ? 7 : gesicht === 'boese' ? 4 : gesicht === 'au' ? -3 : 0;
  return (
    <g {...flaeche(f.tief, 2.5)}>
      <path d={`M66 ${95 - s} L92 ${97 + s} L92 ${103 + s} L66 ${101 - s} Z`} />
      <path d={`M134 ${95 - s} L108 ${97 + s} L108 ${103 + s} L134 ${101 - s} Z`} />
    </g>
  );
}

/** The gate is the mouth: a closed wooden door while it lurks, open with a portcullis when it attacks, a small round
 *  „oh“ when hit or beaten. */
function Tor({ f, gesicht }: { f: Farben } & Stand) {
  if (gesicht === 'wut')
    return (
      <g>
        <path d={TUER} {...flaeche(P.mund, 2.5)} />
        <path d="M84 158 L90 168 L96 152 L102 168 L108 152 L114 168 L118 160 Q110 146 100 144 Q90 146 84 158 Z" fill={f.hell} />
      </g>
    );
  if (gesicht === 'au' || gesicht === 'besiegt') return <path d="M88 188 V170 Q100 154 112 170 V188 Q100 191 88 188 Z" {...flaeche(P.mund, 2.5)} />;
  return (
    <g>
      <path d={TUER} {...flaeche(f.tuer, 2.5)} />
      <path d="M100 142 V191" {...STRICH} fill="none" strokeWidth={3} />
      <path d="M120 160 V190 Q112 192 104 192 Q114 180 112 152 Z" fill={P.schatten} opacity={0.2} />
    </g>
  );
}

function teile(f: Farben): Teil[] {
  const kopf: Teil = {
    id: 'kopf',
    drehpunkt: [100, 86],
    anker: { hut: [100, 44] },
    zeichnung: () => (
      <g>
        <Schlagschatten form={SIMS} auf={[RUMPF]} />
        {/* the pennant on its pole, in the world's colour */}
        <path d="M100 46 V12" stroke={P.holzTief} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M101.5 12 L128 19 L101.5 27 Z" {...flaeche(f.wimpel, 2)} />
        <path d="M101.5 20 L128 19 L101.5 27 Z" fill={f.wimpelTief} opacity={0.55} />
        <Flaeche d={ZINNEN} farbe={f.stein} hell={f.hell} />
        <Flaeche d={SIMS} farbe={f.stein} hell={f.hell} />
        <path d="M134 44 H158 V66 H134 Z M118 64 H158 L156 86 H112 Q130 80 132 64 Z" fill={f.tief} opacity={0.6} />
        <path d="M48 70 H96" stroke={f.hell} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
  };
  const rumpf: Teil = {
    id: 'rumpf',
    drehpunkt: [100, 196],
    zeichnung: (s) => (
      <g>
        {/* two stubby feet in the dark stone */}
        <path d="M60 184 L90 184 L91 208 Q75 214 59 208 Z" {...flaeche(f.tief)} />
        <path d="M110 184 L140 184 L141 208 Q125 214 109 208 Z" {...flaeche(f.tief)} />
        <Flaeche d={RUMPF} farbe={f.stein} hell={f.hell} />
        <path d="M152 190 Q130 197 106 199 Q142 184 136 82 L148 82 Z" fill={f.tief} opacity={0.6} />
        <path d="M60 96 V148" stroke={f.hell} strokeWidth={4} strokeLinecap="round" />
        <Brauen f={f} {...s} />
        <Auge x={80} f={f} {...s} />
        <Auge x={120} f={f} {...s} />
        <Tor f={f} {...s} />
      </g>
    ),
    kinder: [kopf],
  };
  /** A stubby stone arm from the shoulder, a round fist. `seite` −1 left, 1 right. */
  const arm = (seite: -1 | 1): Teil => {
    const x = 100 + seite * 52;
    const faust = x + seite * 4;
    return {
      id: seite < 0 ? 'arm-l' : 'arm-r',
      drehpunkt: [x, 112],
      zeichnung: () => (
        <g>
          <path d={`M${x - 7} 114 L${x + 7} 114 L${faust + 8} 140 L${faust - 8} 140 Z`} {...flaeche(f.tief)} />
          <Flaeche d={`M${faust - 13} 146 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z`} farbe={f.stein} hell={f.hell} />
          <path d={`M${faust + 13} 146 A13 13 0 0 1 ${faust} 159 Q${faust + 9} 152 ${faust + 8} 136 Z`} fill={f.tief} opacity={0.6} />
          <Flaeche d={`M${x - 11} 112 a11 10 0 1 0 22 0 a11 10 0 1 0 -22 0 Z`} farbe={f.stein} hell={f.hell} />
        </g>
      ),
    };
  };
  return [rumpf, arm(-1), arm(1)];
}

function waechter(welt: WeltId): Figur {
  const f = FARBEN[welt];
  return {
    id: `waechter-${welt}`,
    name: WAECHTER_NAMEN[welt],
    art: 'boss',
    groesse: [200, 220],
    boden: [100, 212],
    teile: teile(f),
    posen: {
      lauern: { name: 'Lauern', gesicht: 'boese', winkel: { 'arm-l': 10, 'arm-r': -10 } },
      angriff: { name: 'Angriff', gesicht: 'wut', winkel: { 'arm-l': 150, 'arm-r': -150 }, extras: ['staub'] },
      getroffen: { name: 'Getroffen', gesicht: 'au', winkel: { kopf: -10, 'arm-l': 26, 'arm-r': -18 }, extras: ['sterne'] },
      besiegt: { name: 'Besiegt', gesicht: 'besiegt', winkel: { kopf: 14, 'arm-l': -8, 'arm-r': 8 }, extras: ['kringel'] },
    },
    gesichter: ['boese', 'wut', 'au', 'besiegt'],
    animationen: ['atmen', 'stampfen', 'angriff', 'treffer', 'kopfschuetteln'],
    extras: {
      staub: ({ zeit }) => (
        <g {...flaeche(f.tief, 2.5)} opacity={0.9}>
          {[
            [30, 204, 8],
            [48, 212, 5],
            [158, 206, 7],
            [174, 198, 5],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy - Math.abs(Math.sin(zeit * 4 + i)) * 6} r={r} />
          ))}
        </g>
      ),
      sterne: ({ zeit }) => (
        <g fill={P.gold} stroke={P.goldTief} strokeWidth={2} strokeLinejoin="round" transform={`rotate(${((zeit * 90) % 360).toFixed(1)} 100 30)`}>
          <path d="M62 24 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
          <path d="M138 24 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
        </g>
      ),
      kringel: () => (
        <g fill="none" stroke={P.goldTief} strokeWidth={2.5} strokeLinecap="round">
          <path d="M22 44 q6 -8 12 0 q6 8 12 0" />
          <path d="M154 54 q6 -8 12 0 q6 8 12 0" />
        </g>
      ),
    },
  };
}

/** Every world's guard; the workshop shows the meadow's (FIGUREN), the tests check all. */
export const WAECHTER: Record<WeltId, Figur> = Object.fromEntries(
  (Object.keys(FARBEN) as WeltId[]).map((w) => [w, waechter(w)]),
) as Record<WeltId, Figur>;
