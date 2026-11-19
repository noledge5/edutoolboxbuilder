// Worlds of the map (13.11.2026): every region gets a landscape of its own. A world sets the ground and path colours,
// the landmark at the top (instead of the castle) and what grows beside the path: the map plans the places (weg.ts:
// big `baum`/`tanne` at the edge, small `busch`/`blume`/`stein` near the path) and the world puts its own drawings
// there. Modules take the module worlds in turn by their number; the regions of the Extra-Pakete have fixed ones
// (Wortschatz-Wald, Grammatik-Turm). Same style as gelaende.tsx (19.11.2026): landmarks isometric from the village kit
// (iso.tsx), small pieces flat from the front, no outline, centre bottom at (0, 0) (for a landmark: its door).
import type { ReactNode } from 'react';
import { Baum, Blume, BurgBild, Burg, Busch, Klumpen, Stein, Tanne, bodenSchatten, farbStein, type BurgFarben, type GelaendeTeil } from './gelaende';
import { HOLZ, ZIEGEL, isoStift, type Flaechen, type Pt } from './iso';
import { Kaktus as KaktusForm, Palme as PalmenForm, Tanne as TannenForm } from './pflanzen';
import { P, flaeche } from './stil';
import type { DekoArt } from '../weg';

const mix = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const fl = (farbe: string, b = 2.5) => flaeche(farbe, b);

// — Wüste —

export function Palme(): ReactNode {
  return (
    <g>
      {bodenSchatten(16)}
      {/* The shared palm is drawn for the 240 hero card; on the map it stands a quarter smaller, like the trees. */}
      <g transform="scale(0.75)">
        <PalmenForm />
      </g>
    </g>
  );
}

export function Kaktus(): ReactNode {
  return (
    <g>
      {bodenSchatten(14)}
      <KaktusForm />
    </g>
  );
}

export function KaktusKlein(): ReactNode {
  return (
    <g>
      {bodenSchatten(10, 3)}
      <path d="M-9 0 Q-12 -14 0 -18 Q12 -14 9 0 Z" {...fl(P.gruen)} />
      <path d="M3 -16 Q11 -12 9 0 H3 Z" {...fl(P.gruenTief)} />
      <path d="M-4 -14 Q-6 -8 -5 -2" fill="none" stroke={P.gruenHell} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={0} cy={-19} r={3.2} fill={P.gelb} />
    </g>
  );
}

export function Duerrbusch(): ReactNode {
  return (
    <g>
      <path d="M0 0 L-8 -12 M0 0 L-2 -16 M0 0 L6 -14 M0 0 L11 -8 M-5 -8 L-10 -10 M4 -10 L8 -16" fill="none" stroke={P.holzTief} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export const SandStein = farbStein(P.orangeHell, P.sandHell, P.orangeTief);

/** A stepped pyramid on the 2:1 grid: left face lit, right face shaded, the step tops as light bands, a gold tip. */
export function Pyramide(): ReactNode {
  const W = 120;
  const H = 118;
  const s = isoStift(12, 6 - W);
  const l = s.P3(0, W);
  const v = s.P3(W, W);
  const r = s.P3(W, 0);
  const sp = s.P3(W / 2, W / 2, H);
  const spitze = 0.84;
  return (
    <g>
      {s.poly([l, v, sp], P.sand)}
      {s.poly([v, r, sp], P.sandTief)}
      {[0.17, 0.34, 0.51, 0.68].map((t) => (
        <g key={t}>
          {s.linie(mix(l, sp, t), mix(v, sp, t), P.sandHell, 3)}
          {s.linie(mix(v, sp, t), mix(r, sp, t), P.sand, 3)}
        </g>
      ))}
      {s.linie(v, mix(v, sp, spitze), P.sandHell, 4)}
      {s.poly([mix(l, sp, spitze), mix(v, sp, spitze), sp], P.gold)}
      {s.poly([mix(v, sp, spitze), mix(r, sp, spitze), sp], P.goldTief)}
      {s.bogenTor('L', W - 26, W, 0, 24, 32, P.sandTief)}
      {s.bogenTor('L', W - 23, W, 0, 18, 27, P.lederTief)}
    </g>
  );
}

// — Schneeland —

export function SchneeTanne(): ReactNode {
  return (
    <g>
      {bodenSchatten(18, 4.5)}
      <TannenForm schnee />
    </g>
  );
}

export function Schneehaufen(): ReactNode {
  return <Klumpen kreise={[[0, -12, 8], [-6, -8, 9], [7, -7, 8]]} farbe={P.schnee} hell={P.weiss} tief={P.eis} licht={1} />;
}

export function Eiskristall(): ReactNode {
  return (
    <g transform="translate(0 -12)">
      {[0, 60, 120].map((w) => (
        <path key={w} d="M0 -10 V10 M-3 -7 L0 -4 L3 -7 M-3 7 L0 4 L3 7" transform={`rotate(${w})`} fill="none" stroke={P.eisTief} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <circle r={3.5} fill={P.eisTief} />
    </g>
  );
}

export const Eisblock = farbStein(P.eis, P.eisHell, P.eisTief);

const EIS: BurgFarben = {
  mauer: { top: P.eisHell, links: P.eis, rechts: P.eisTief },
  hof: P.schnee,
  dach: { vorn: P.blauHell, seite: P.blau, kante: P.blau, licht: P.eisHell },
  fahne: P.blau,
  tor: P.blauTief,
};
export const Eisburg = () => <BurgBild f={EIS} boss={false} />;

// — Strand —

export function Muschel(): ReactNode {
  return (
    <g>
      <path d="M-10 0 Q-12 -12 0 -14 Q12 -12 10 0 Q0 3 -10 0 Z" {...fl(P.rosaHell)} />
      <path d="M0 -13 V-1 M-5 -12 L-3 -1 M5 -12 L3 -1" stroke={P.rosaTief} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Seestern(): ReactNode {
  const d = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 4.5 : 11;
    const w = (i * Math.PI) / 5 - Math.PI / 2;
    return `${i ? 'L' : 'M'}${Math.round(Math.cos(w) * r * 10) / 10} ${Math.round((Math.sin(w) * r - 9) * 10) / 10}`;
  }).join(' ');
  return (
    <g>
      <path d={`${d} Z`} {...fl(P.orange, 2)} />
      <circle cx={-2} cy={-11} r={1.6} fill={P.orangeHell} />
      <circle cx={2} cy={-8} r={1.6} fill={P.orangeHell} />
    </g>
  );
}

const PUTZ_WAND: Flaechen = { top: P.putzHell, links: P.putz, rechts: P.putzTief };
const WEISS_TURM: Flaechen = { top: P.wolkeHell, links: P.wolke, rechts: P.wolkeTief };

/** A lighthouse: a tapered round tower with red stripes, the lamp room on top, the keeper's house behind it. */
export function Leuchtturm(): ReactNode {
  const s = isoStift(0, -16);
  const R = 22;
  const R2 = 15;
  const h = 124;
  const rad = (z: number) => R - ((R - R2) * z) / h;
  const lampe = s.P3(0, 0, 137);
  return (
    <g>
      {s.rundSchlag(0, 0, R, h, R2)}
      {s.schlag(-6, -56, 30, 26, 40)}
      {/* Rocks at its foot. */}
      <Klumpen kreise={[[-52, -10, 15], [-34, -5, 11], [56, -4, 12]]} farbe={P.grauHell} hell={P.metallHell} tief={P.grau} />
      {/* The keeper's little house, partly behind the tower. */}
      {s.box(-6, -56, 0, 30, 26, 22, PUTZ_WAND)}
      {s.tiefe(-6, -56, 0, 30, 26, 22)}
      {s.fenster('R', -48, 24, 7, 8, 9)}
      {s.satteldach(-6, -56, 22, 30, 26, 18, ZIEGEL, 4, false)}
      {/* The tower: white body, red stripes, the shade over all of it. */}
      {s.ring(0, 0, 0, R, h, WEISS_TURM.links, R2)}
      {[16, 52, 88].map((z) => (
        <g key={z}>{s.ring(0, 0, z, rad(z), 18, P.rot, rad(z + 18))}</g>
      ))}
      {s.rundTiefe(0, 0, 0, R, h, R2)}
      <path d={`M-6 ${s.P3(0, 0)[1] + R * 0.7071} v-13 a6 6 0 0 1 12 0 v13 Z`} fill={P.holzTief} />
      {s.walze(0, 0, h, 19, 5, { top: P.grauHell, links: P.grauTief, rechts: P.grauTief })}
      {s.walze(0, 0, h + 5, 11, 17, { top: P.gelbHell, links: P.gelb, rechts: P.gelbTief })}
      {s.linie([lampe[0] - 4, lampe[1] - 4], [lampe[0] - 4, lampe[1] + 10], P.gelbHell, 3)}
      {s.kegel(0, 0, h + 22, 15, 16, P.rot, P.rotTief, P.ziegelHell)}
      <path d={`M${lampe[0] + 14} ${lampe[1] - 4} L${lampe[0] + 64} ${lampe[1] - 18} L${lampe[0] + 64} ${lampe[1] + 8} Z`} fill={P.gelbHell} opacity={0.55} />
    </g>
  );
}

// — Vulkan —

export function ToterBaum(): ReactNode {
  return (
    <g>
      {bodenSchatten(14)}
      <path d="M-4 0 L-3 -30 L-14 -46 M-3 -30 L0 -52 M0 -40 L12 -54 M-3 -22 L-12 -30" fill="none" stroke={P.dunkelTief} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function Vulkankegel(): ReactNode {
  return (
    <g>
      {bodenSchatten(26, 5)}
      <path d="M-30 0 L-8 -50 H8 L30 0 Z" {...fl(P.dunkel, 3)} />
      <path d="M8 -50 L30 0 H10 Z" {...fl(P.dunkelTief, 3)} />
      <path d="M-8 -50 Q-4 -40 -6 -30 Q0 -36 2 -26 Q6 -38 8 -50 Z" {...fl(P.lava, 2)} />
      <circle cx={-4} cy={-60} r={5} fill={P.grau} opacity={0.6} />
      <circle cx={4} cy={-70} r={6} fill={P.grau} opacity={0.45} />
    </g>
  );
}

export function GlutFels(): ReactNode {
  return (
    <g>
      <Klumpen kreise={[[-6, -9, 9], [7, -7, 8]]} farbe={P.dunkel} hell={P.grau} tief={P.dunkelTief} licht={1} />
      <path d="M-8 -12 L-3 -6 L-6 -2 M5 -11 L8 -5" fill="none" stroke={P.lava} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

export function Flamme(): ReactNode {
  return (
    <g>
      <path d="M0 0 Q-10 -6 -5 -16 Q-3 -10 0 -12 Q-2 -20 4 -26 Q4 -16 10 -10 Q10 -2 0 0 Z" {...fl(P.lava)} />
      <path d="M0 -2 Q-4 -6 -1 -11 Q2 -8 4 -6 Q4 -2 0 -2 Z" fill={P.lavaHell} />
    </g>
  );
}

export const DunkelStein = farbStein(P.dunkel, P.grau, P.dunkelTief);

const FEUER: BurgFarben = {
  mauer: { top: P.grau, links: P.dunkel, rechts: P.dunkelTief },
  hof: P.lava,
  dach: { vorn: P.lava, seite: P.lavaTief, kante: P.lavaTief, licht: P.lavaHell },
  fahne: P.lavaHell,
  tor: P.dunkelTief,
};
export const Feuerfestung = () => <BurgBild f={FEUER} boss={false} />;

// — Weltall —

export function PlanetKlein(): ReactNode {
  const ring = (vorn: boolean) => <path d={vorn ? 'M-30 0 A30 8 0 0 0 30 0' : 'M-30 0 A30 8 0 0 1 30 0'} transform="rotate(-15)" fill="none" stroke={P.gelb} strokeWidth={4} strokeLinecap="round" />;
  return (
    <g transform="translate(0 -30)">
      {ring(false)}
      <circle r={19} fill={P.orange} />
      <path d="M2 -17 A19 19 0 0 1 17 8 Q4 13 -6 15 A19 19 0 0 0 2 -17 Z" fill={P.orangeTief} />
      <path d="M-12 -6 Q-10 -12 -4 -14" fill="none" stroke={P.orangeHell} strokeWidth={3.5} strokeLinecap="round" />
      {ring(true)}
    </g>
  );
}

export function Rakete(): ReactNode {
  return (
    <g>
      {bodenSchatten(14)}
      <path d="M-12 0 L-8 -14 M12 0 L8 -14" stroke={P.rot} strokeWidth={5} strokeLinecap="round" />
      <path d="M-9 -8 V-44 Q0 -66 9 -44 V-8 Z" {...fl(P.metallHell, 3)} />
      <path d="M3 -55 Q9 -48 9 -42 V-8 H3 Z" {...fl(P.metall, 3)} />
      <circle cx={0} cy={-34} r={5.5} fill={P.blauHell} />
      <path d="M-9 -54 Q0 -68 9 -54 Z" {...fl(P.rot, 2.5)} />
    </g>
  );
}

export function Krater(): ReactNode {
  return (
    <g>
      <ellipse cx={0} cy={-4} rx={16} ry={7} fill={P.nachtHell} />
      <ellipse cx={1} cy={-3} rx={10} ry={3.5} fill={P.nachtTief} />
    </g>
  );
}

export function Funkelstern(): ReactNode {
  return <path d="M0 -24 Q2 -14 10 -12 Q2 -10 0 0 Q-2 -10 -10 -12 Q-2 -14 0 -24 Z" {...fl(P.gelb, 2)} />;
}

export const Asteroid = farbStein(P.grau, P.grauHell, P.grauTief);

/** A space station: a round base with portholes, a dome, an antenna; a ringed planet behind it in the sky. */
export function Raumstation(): ReactNode {
  const R = 62;
  const s = isoStift(0, -R * 0.7071);
  const mitte = s.P3(0, 0, 9);
  const spitze = s.P3(0, 0, 18 + 46);
  const luke = (w: number) => [mitte[0] + Math.cos((w * Math.PI) / 180) * R * 1.2247, mitte[1] + Math.sin((w * Math.PI) / 180) * R * 0.7071];
  const ring = (vorn: boolean) => (
    <path d={vorn ? 'M-72 0 A72 18 0 0 0 72 0' : 'M-72 0 A72 18 0 0 1 72 0'} transform="rotate(-12)" fill="none" stroke={P.tuerkisHell} strokeWidth={5} strokeLinecap="round" />
  );
  return (
    <g>
      <g transform="translate(50 -134)">
        {ring(false)}
        <circle r={44} fill={P.lila} />
        <path d="M6 -42 A44 44 0 0 1 40 22 Q10 34 -14 40 A44 44 0 0 0 6 -42 Z" fill={P.lilaTief} />
        <path d="M-30 -14 Q-24 -30 -10 -36" fill="none" stroke={P.lilaHell} strokeWidth={6} strokeLinecap="round" />
        {ring(true)}
      </g>
      {s.rundSchlag(0, 0, R, 30, 40)}
      {s.walze(0, 0, 0, R, 18, { top: P.metallHell, links: P.metall, rechts: P.metallTief })}
      {[30, 60, 120, 150].map((w) => {
        const [x, y] = luke(w);
        return <circle key={w} cx={x} cy={y} r={5.5} fill={P.tuerkisHell} />;
      })}
      {s.kuppel(0, 0, 18, 46, P.metallHell, P.metall, P.weiss)}
      {s.linie(spitze, [spitze[0], spitze[1] - 28], P.grauTief, 3.5)}
      <circle cx={spitze[0]} cy={spitze[1] - 32} r={6} fill={P.rot} />
      <path d={`M-13 ${s.P3(0, 0)[1] + R * 0.7071} v-12 a13 11 0 0 1 26 0 v12 Z`} fill={P.tinte} />
    </g>
  );
}

// — Wortschatz-Wald —

export function Farn(): ReactNode {
  return (
    <g>
      {[-40, -15, 15, 40].map((w) => (
        <g key={w} transform={`rotate(${w})`}>
          <path d="M0 0 Q-3 -10 0 -20" fill="none" stroke={P.blattTief} strokeWidth={3.5} strokeLinecap="round" />
          {[-6, -11, -16].map((y) => (
            <path key={y} d={`M${-1} ${y} q-5 -1 -6 -4 M1 ${y} q5 -1 6 -4`} fill="none" stroke={P.blattHell} strokeWidth={2.5} strokeLinecap="round" />
          ))}
        </g>
      ))}
    </g>
  );
}

export function Pilz(): ReactNode {
  return (
    <g>
      <path d="M-4 0 V-10 H4 V0 Z" {...fl(P.creme)} />
      <path d="M-12 -9 Q-12 -22 0 -22 Q12 -22 12 -9 Z" {...fl(P.rot)} />
      <path d="M5 -21 Q12 -18 12 -9 H5 Z" {...fl(P.rotTief)} />
      <circle cx={-5} cy={-15} r={2.4} fill={P.weiss} />
      <circle cx={2} cy={-18} r={1.9} fill={P.weiss} />
    </g>
  );
}

export function MoosStein(): ReactNode {
  return (
    <g>
      {Stein()}
      <path d="M-12 -8 Q-6 -16 4 -15 Q-2 -12 -12 -8 Z" {...fl(P.wieseTief, 2)} />
    </g>
  );
}

const HUETTE: Flaechen = { top: P.holzHell, links: P.holz, rechts: P.holzTief };
const STAMM: Flaechen = { top: P.lederHell, links: P.leder, rechts: P.lederTief };

/** A tree house: a round trunk, a wooden platform and hut from the village kit, a ladder, the crown behind. */
export function Baumhaus(): ReactNode {
  const s = isoStift(0, -10);
  const z = 86;
  return (
    <g>
      {bodenSchatten(84, 13)}
      <Klumpen
        kreise={[
          [0, -164, 38],
          [-48, -146, 32],
          [50, -146, 32],
          [-62, -110, 24],
          [64, -108, 24],
        ]}
        farbe={P.blatt}
        hell={P.blattHell}
        tief={P.blattTief}
        licht={1}
      />
      {s.rundSchlag(0, 0, 13, 40, 11)}
      <path d="M-22 -2 Q-12 -6 -10 -20 L-4 -2 Z M22 -2 Q12 -6 10 -20 L4 -2 Z" {...fl(P.leder, 3)} />
      {s.walze(0, 0, 0, 13, z, STAMM, 11)}
      {s.box(-34, -34, z, 68, 68, 7, HOLZ)}
      {s.tiefe(-34, -34, z, 68, 68, 7)}
      {s.box(-26, -26, z + 7, 44, 40, 28, HUETTE)}
      {s.tiefe(-26, -26, z + 7, 44, 40, 28)}
      {s.fenster('L', -16, 14, z + 17, 10, 10, true)}
      {s.tuer(2, 14, z + 7, 12, 20)}
      {s.fenster('R', -14, 18, z + 17, 10, 10, true)}
      {s.satteldach(-26, -26, z + 35, 44, 40, 24, ZIEGEL, 5, false)}
      {/* The ladder down the front. */}
      {s.linie(s.P3(-28, 34, z), s.P3(-28, 46, 0), P.holzTief, 3.5)}
      {s.linie(s.P3(-14, 34, z), s.P3(-14, 46, 0), P.holzTief, 3.5)}
      {[16, 34, 52, 70].map((h) => (
        <g key={h}>{s.linie(s.P3(-28, 46 - (h / z) * 12, h), s.P3(-14, 46 - (h / z) * 12, h), P.holzTief, 3)}</g>
      ))}
    </g>
  );
}

// — Grammatik-Turm —

export function Felsspitze(): ReactNode {
  return (
    <g>
      {bodenSchatten(18, 4.5)}
      <path d="M-20 0 L-6 -58 L4 -44 L10 -66 L22 0 Z" {...fl(P.grauHell, 3)} />
      <path d="M10 -66 L22 0 H8 L6 -40 Z" {...fl(P.grau, 3)} />
      <path d="M-14 -6 L-6 -50" stroke={P.metallHell} strokeWidth={3} strokeLinecap="round" />
      <path d="M-6 -58 L-1 -50 L4 -44 L-3 -46 Z M10 -66 L13 -55 L7 -56 Z" {...fl(P.schnee, 2)} />
    </g>
  );
}

export function Kristall(): ReactNode {
  return (
    <g>
      <path d="M-10 0 L-12 -12 L-6 -22 L-2 -8 Z" {...fl(P.lilaHell)} />
      <path d="M-4 0 L-4 -22 L2 -30 L8 -22 L8 0 Z" {...fl(P.lila)} />
      <path d="M2 -30 L8 -22 V0 H3 Z" {...fl(P.lilaTief)} />
      <path d="M-1 -22 V-6" stroke={P.lilaHell} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

const STEIN_TURM: Flaechen = { top: P.steinHell, links: P.stein, rechts: P.steinTief };

/** A wizard's tower: a round stone tower, a balcony ring and a tall pointed hat with stars, rocks at its foot. */
export function Zauberturm(): ReactNode {
  const R = 26;
  const s = isoStift(0, -R * 0.7071);
  const h = 92;
  const sp = s.P3(0, 0, h + 7 + 72);
  const fuss = s.P3(0, 0)[1] + R * 0.7071;
  const stern = (x: number, y: number, r: number) =>
    `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`;
  return (
    <g>
      {s.rundSchlag(0, 0, R, h, 22)}
      <Klumpen kreise={[[-46, -10, 17], [48, -8, 15], [-28, -5, 11]]} farbe={P.grauHell} hell={P.metallHell} tief={P.grau} />
      {s.walze(0, 0, 0, R, h, STEIN_TURM, 22)}
      {[32, 64].map((z) => (
        <path key={z} d={`M-9 ${fuss - z} v-9 a6 6 0 0 1 12 0 v9 Z`} fill={P.gelbHell} />
      ))}
      <path d={`M-13 ${fuss} v-17 a13 13 0 0 1 26 0 v17 Z`} fill={P.lilaTief} />
      {s.walze(0, 0, h, 31, 7, { top: P.lilaHell, links: P.lila, rechts: P.lilaTief })}
      {s.kegel(0, 0, h + 7, 30, 72, P.lila, P.lilaTief, P.lilaHell)}
      <path d={`M${sp[0] - 3} ${sp[1] + 12} Q${sp[0] + 2} ${sp[1] - 8} ${sp[0] + 18} ${sp[1] - 2} Q${sp[0] + 8} ${sp[1] + 4} ${sp[0] + 5} ${sp[1] + 16} Z`} fill={P.lilaTief} />
      {[
        [-12, 0.2, 5],
        [9, 0.38, 4],
        [-3, 0.58, 3.5],
      ].map(([x, t, r]) => (
        <path key={x} d={stern(sp[0] + x, s.P3(0, 0, h + 7)[1] + 10 - t * 72, r)} fill={P.gelb} />
      ))}
    </g>
  );
}

// — The worlds —

export type WeltId = 'wiese' | 'wueste' | 'schnee' | 'strand' | 'vulkan' | 'weltall' | 'wald' | 'turm';

export interface Welt {
  id: WeltId;
  name: string;
  /** Ground, its light patches and the darker ground at the boss castle. */
  boden: string;
  flecken: string;
  bodenTief: string;
  /** Path edge, path, the dashed line in the middle. */
  wegRand: string;
  weg: string;
  wegLinie: string;
  /** Small dots over the ground (stars in space, snowflakes), or none. */
  punkte?: string;
  wahrzeichen: () => ReactNode;
  deko: Record<DekoArt, () => ReactNode>;
}

export const WELTEN: Record<WeltId, Welt> = {
  wiese: { id: 'wiese', name: 'Wiese', boden: P.wiese, flecken: P.wieseHell, bodenTief: P.wieseTief, wegRand: P.sandTief, weg: P.sand, wegLinie: P.sandHell, wahrzeichen: Burg, deko: { baum: Baum, tanne: Tanne, busch: Busch, blume: Blume, stein: Stein } },
  wueste: { id: 'wueste', name: 'Wüste', boden: P.sand, flecken: P.sandHell, bodenTief: P.sandTief, wegRand: P.holzTief, weg: P.orangeHell, wegLinie: P.sandHell, wahrzeichen: Pyramide, deko: { baum: Palme, tanne: Kaktus, busch: KaktusKlein, blume: Duerrbusch, stein: SandStein } },
  schnee: { id: 'schnee', name: 'Schneeland', boden: P.schnee, flecken: P.eisHell, bodenTief: P.eis, wegRand: P.eisTief, weg: P.blauHell, wegLinie: P.eisHell, punkte: P.weiss, wahrzeichen: Eisburg, deko: { baum: SchneeTanne, tanne: SchneeTanne, busch: Schneehaufen, blume: Eiskristall, stein: Eisblock } },
  strand: { id: 'strand', name: 'Strand', boden: P.sand, flecken: P.wasser, bodenTief: P.wasserTief, wegRand: P.holzTief, weg: P.holz, wegLinie: P.sandHell, wahrzeichen: Leuchtturm, deko: { baum: Palme, tanne: Palme, busch: Muschel, blume: Seestern, stein: Stein } },
  vulkan: { id: 'vulkan', name: 'Vulkan', boden: P.dunkelHell, flecken: P.grau, bodenTief: P.lavaTief, wegRand: P.dunkelTief, weg: P.grauHell, wegLinie: P.lavaHell, wahrzeichen: Feuerfestung, deko: { baum: ToterBaum, tanne: Vulkankegel, busch: GlutFels, blume: Flamme, stein: DunkelStein } },
  weltall: { id: 'weltall', name: 'Weltall', boden: P.nacht, flecken: P.nachtHell, bodenTief: P.nachtTief, wegRand: P.lilaTief, weg: P.lilaHell, wegLinie: P.weiss, punkte: P.gelbHell, wahrzeichen: Raumstation, deko: { baum: PlanetKlein, tanne: Rakete, busch: Krater, blume: Funkelstern, stein: Asteroid } },
  wald: { id: 'wald', name: 'Wortschatz-Wald', boden: P.wieseTief, flecken: P.wiese, bodenTief: P.blattTief, wegRand: P.leder, weg: P.lederHell, wegLinie: P.sandHell, wahrzeichen: Baumhaus, deko: { baum: Baum, tanne: Tanne, busch: Farn, blume: Pilz, stein: MoosStein } },
  turm: { id: 'turm', name: 'Grammatik-Turm', boden: P.metall, flecken: P.metallHell, bodenTief: P.metallTief, wegRand: P.sandTief, weg: P.sand, wegLinie: P.sandHell, wahrzeichen: Zauberturm, deko: { baum: Felsspitze, tanne: Tanne, busch: Kristall, blume: Blume, stein: Stein } },
};

/** The worlds of the modules, in turn by module number (module 1 the meadow). */
export const MODUL_WELTEN: WeltId[] = ['wiese', 'wueste', 'schnee', 'strand', 'vulkan', 'weltall'];

/** The world of a region: the Extra-Pakete regions fixed (ids from src/lernquest/extra.ts), modules in turn. */
export function weltVon(regionId: string, nummer: number): Welt {
  if (regionId.startsWith('extra-wortschatz-')) return WELTEN.wald;
  if (regionId.startsWith('extra-grammatik-')) return WELTEN.turm;
  const n = Number.isFinite(nummer) && nummer > 0 ? Math.floor(nummer) : 1;
  return WELTEN[MODUL_WELTEN[(n - 1) % MODUL_WELTEN.length]];
}

/** The new pieces for the workshop („Karte“), next to GELAENDE (gelaende.tsx). */
export const WELT_TEILE: GelaendeTeil[] = [
  { id: 'pyramide', name: 'Pyramide (Wüste)', rahmen: [-96, -176, 216, 186], zeichnung: Pyramide },
  { id: 'eisburg', name: 'Eisburg (Schneeland)', rahmen: [-110, -190, 250, 217], zeichnung: Eisburg },
  { id: 'leuchtturm', name: 'Leuchtturm (Strand)', rahmen: [-72, -182, 157, 213], zeichnung: Leuchtturm },
  { id: 'feuerfestung', name: 'Feuerfestung (Vulkan)', rahmen: [-110, -190, 250, 217], zeichnung: Feuerfestung },
  { id: 'raumstation', name: 'Raumstation (Weltall)', rahmen: [-80, -182, 208, 186], zeichnung: Raumstation },
  { id: 'baumhaus', name: 'Baumhaus (Wortschatz-Wald)', rahmen: [-91, -207, 198, 225], zeichnung: Baumhaus },
  { id: 'zauberturm', name: 'Zauberturm (Grammatik-Turm)', rahmen: [-68, -197, 140, 222], zeichnung: Zauberturm },
  { id: 'palme', name: 'Palme', rahmen: [-41, -76, 79, 84], zeichnung: Palme },
  { id: 'kaktus', name: 'Kaktus', rahmen: [-17, -50, 38, 58], zeichnung: Kaktus },
  { id: 'kaktusklein', name: 'Kleiner Kaktus', rahmen: [-14, -26, 30, 33], zeichnung: KaktusKlein },
  { id: 'duerrbusch', name: 'Dürrer Busch', rahmen: [-14, -20, 29, 24], zeichnung: Duerrbusch },
  { id: 'sandstein', name: 'Sandstein', rahmen: [-18, -20, 37, 24], zeichnung: SandStein },
  { id: 'schneetanne', name: 'Tanne mit Schnee', rahmen: [-28, -70, 56, 79], zeichnung: SchneeTanne },
  { id: 'schneehaufen', name: 'Schneehaufen', rahmen: [-20, -25, 43, 34], zeichnung: Schneehaufen },
  { id: 'eiskristall', name: 'Eiskristall', rahmen: [-14, -26, 28, 28], zeichnung: Eiskristall },
  { id: 'eisblock', name: 'Eisblock', rahmen: [-18, -20, 37, 24], zeichnung: Eisblock },
  { id: 'muschel', name: 'Muschel', rahmen: [-14, -18, 29, 24], zeichnung: Muschel },
  { id: 'seestern', name: 'Seestern', rahmen: [-14, -24, 29, 28], zeichnung: Seestern },
  { id: 'toterbaum', name: 'Toter Baum', rahmen: [-18, -58, 39, 66], zeichnung: ToterBaum },
  { id: 'vulkankegel', name: 'Kleiner Vulkan', rahmen: [-34, -80, 70, 89], zeichnung: Vulkankegel },
  { id: 'glutfels', name: 'Glutfels', rahmen: [-20, -23, 43, 32], zeichnung: GlutFels },
  { id: 'flamme', name: 'Flamme', rahmen: [-11, -30, 25, 34], zeichnung: Flamme },
  { id: 'planetklein', name: 'Kleiner Planet', rahmen: [-35, -53, 70, 46], zeichnung: PlanetKlein },
  { id: 'rakete', name: 'Rakete', rahmen: [-16, -65, 37, 73], zeichnung: Rakete },
  { id: 'krater', name: 'Krater', rahmen: [-20, -15, 40, 22], zeichnung: Krater },
  { id: 'funkelstern', name: 'Funkelstern', rahmen: [-14, -28, 28, 32], zeichnung: Funkelstern },
  { id: 'farn', name: 'Farn', rahmen: [-22, -25, 44, 34], zeichnung: Farn },
  { id: 'pilz', name: 'Pilz', rahmen: [-16, -26, 32, 30], zeichnung: Pilz },
  { id: 'felsspitze', name: 'Felsspitze', rahmen: [-24, -70, 50, 79], zeichnung: Felsspitze },
  { id: 'kristall', name: 'Kristall', rahmen: [-16, -34, 28, 38], zeichnung: Kristall },
];
