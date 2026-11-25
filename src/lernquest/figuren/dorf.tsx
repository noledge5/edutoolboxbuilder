// The class village in 2.5D (Klassendorf Stufe 2 Teil A, style of Stilprobe 3, decided 18.11.2026): the six buildings
// the class builds together, the building site of the running project and the village map (DorfKarte).
// Richtung A „Schlängelweg im Hochformat“ (decided 25.11.2026): the square with the buildings at the bottom, a road
// winding upwards with the children's houses (haeuser.tsx) left and right, a small square after every six. The map
// grows with the class (dorfplan.ts) and with the finished buildings from Weiler to Stadt (DORF_STUFEN): sandy road →
// paved road and lanterns → market stalls → city wall with gate. In the evening it darkens and lights come on
// (nacht.tsx), in winter it snows. Built from the parts of iso.tsx; every building draws into one 100 × 100 cell.
import type { ReactNode } from "react";
import { aussehenVon, dorfStufe, type HausPlatz } from "../dorf";
import {
  anzahl,
  deko,
  GEBAEUDE_ORT,
  GRUND,
  grundstuecke,
  HUEHNER,
  insel,
  laternen,
  MAUER,
  plaetzchen,
  rahmen,
  STAENDE,
  WEG_HALB,
  wegEnde,
  wegPunkte,
  wegX,
  welt,
  wasser,
  type Pt,
} from "../dorfplan";
import { baum, blume, busch, glitzer, huhn, laterne, rauch, stein, wimpel } from "./dorfdeko";
import type { GelaendeTeil } from "./gelaende";
import { HAUS_GESTALTET, HAUS_HOEHE, HAUS_TEILE, hausMitGarten } from "./haeuser";
import { BRUCH, HOLZ, isoStift, PUTZ, SCHIEFER, type Flaechen, type IsoStift } from "./iso";
import { imDunkeln } from "./nacht";
import { P } from "./stil";

type Bau = (s: IsoStift, x: number, y: number) => ReactNode;

const kreis = (
  p: [number, number],
  r: number,
  fill: string,
  rest: Record<string, unknown> = {},
) => <circle cx={p[0]} cy={p[1]} r={r} fill={fill} {...rest} />;

const brunnen: Bau = (s, x, y) => {
  const a = x + 37;
  const b = y + 37;
  return (
    <g>
      {s.flaeche(x + 15, y + 15, 70, 70, P.pflaster)}
      {s.schlag(a, b, 26, 26, 50)}
      {s.box(a, b, 0, 26, 26, 14, BRUCH)}
      {s.steine(a, b, 0, 26, 26, 14)}
      {s.tiefe(a, b, 0, 26, 26, 14)}
      {s.poly(
        [
          s.P3(a + 3, b + 3, 14),
          s.P3(a + 23, b + 3, 14),
          s.P3(a + 23, b + 23, 14),
          s.P3(a + 3, b + 23, 14),
        ],
        P.wasserTief,
      )}
      {s.linie(s.P3(a + 2, b + 13, 14), s.P3(a + 2, b + 13, 44), P.balken, 4)}
      {s.linie(
        s.P3(a + 24, b + 13, 14),
        s.P3(a + 24, b + 13, 44),
        P.balkenTief,
        4,
      )}
      {s.linie(
        s.P3(a + 2, b + 13, 34),
        s.P3(a + 24, b + 13, 34),
        P.balkenHell,
        3,
      )}
      {s.linie(s.P3(a + 13, b + 13, 34), s.P3(a + 13, b + 13, 24), P.grau, 1.5)}
      {s.box(a + 10, b + 10, 18, 6, 6, 6, HOLZ)}
      {s.satteldach(a - 2, b + 1, 44, 30, 24, 16, undefined, 4, false)}
    </g>
  );
};

const bruecke: Bau = (s, x, y) => (
  <g>
    {s.flaeche(x + 34, y, 32, 100, P.wasserTief)}
    {s.flaeche(x + 37, y, 26, 100, P.wasser)}
    {[20, 55, 82].map((yy) => (
      <g key={yy}>
        {s.linie(
          s.P3(x + 42, y + yy),
          s.P3(x + 52, y + yy),
          P.wasserHell,
          2.5,
          0.8,
        )}
      </g>
    ))}
    {s.flaeche(x + 4, y + 36, 30, 28, P.pflaster)}
    {s.flaeche(x + 66, y + 36, 30, 28, P.pflaster)}
    {s.schlag(x + 26, y + 36, 48, 28, 18, 0.18)}
    {s.box(x + 26, y + 36, 0, 48, 28, 12, BRUCH)}
    {s.steine(x + 26, y + 36, 0, 48, 28, 12)}
    {s.poly(
      Array.from({ length: 9 }, (_, i) => {
        const t = (i / 8) * Math.PI;
        return s.P3(x + 50 + Math.cos(t) * 14, y + 64, Math.sin(t) * 9);
      }),
      P.wasserTief,
    )}
    {s.tiefe(x + 26, y + 36, 0, 48, 28, 12)}
    {[36, 64].map((yy) => (
      <g key={yy}>
        {[30, 42, 54, 66].map((xx) => (
          <g key={xx}>
            {s.linie(s.P3(xx, y + yy, 12), s.P3(xx, y + yy, 24), P.balken, 3.5)}
          </g>
        ))}
        {s.linie(
          s.P3(x + 28, y + yy, 22),
          s.P3(x + 72, y + yy, 22),
          HOLZ.links,
          3.5,
        )}
      </g>
    ))}
  </g>
);

const baeckerei: Bau = (s, x, y) => {
  const a = x + 14;
  const b = y + 18;
  const schild = s.P3(a + 54, b + 62, 40);
  return (
    <g>
      {s.schlag(a, b, 70, 58, 100)}
      {s.box(a, b, 0, 70, 58, 34, BRUCH)}
      {s.steine(a, b, 0, 70, 58, 34)}
      {s.tuer(a + 12, b + 58, 2, 18, 28)}
      {s.fenster("L", a + 40, b + 58, 12, 14, 12)}
      {s.fenster("R", b + 22, a + 70, 12, 14, 12)}
      {s.tiefe(a, b, 0, 70, 58, 34)}
      {s.band(a, b, 34, 70, 58, 12)}
      {s.box(a - 2, b - 2, 35, 74, 62, 30, PUTZ)}
      {s.fachL(a - 2, a + 72, b + 60, 35, 65)}
      {s.fachR(a + 72, b - 2, b + 60, 35, 65)}
      {s.fenster("L", a + 10, b + 60, 42, 11, 14)}
      {s.fenster("L", a + 50, b + 60, 42, 11, 14)}
      {s.fenster("R", b + 22, a + 72, 42, 11, 14)}
      {s.tiefe(a - 2, b - 2, 35, 74, 62, 30)}
      {s.band(a - 2, b - 2, 65, 74, 62, 10)}
      {s.satteldach(a - 2, b - 2, 65, 74, 62, 48)}
      {s.box(a + 46, b + 8, 92, 12, 12, 34, BRUCH)}
      {s.tiefe(a + 46, b + 8, 92, 12, 12, 34)}
      {rauch(s.P3(a + 52, b + 14, 128))}
      {s.linie(
        s.P3(a + 54, b + 62, 48),
        s.P3(a + 54, b + 74, 48),
        P.dunkel,
        2.5,
      )}
      <path
        d={`M${schild[0] - 9} ${schild[1]} c-6 -14 12 -16 9 -4 c-3 -12 15 -10 9 4 c-4 8 -14 8 -18 0 Z`}
        fill={P.gold}
        stroke={P.goldTief}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </g>
  );
};

const bibliothek: Bau = (s, x, y) => {
  const a = x + 10;
  const b = y + 16;
  return (
    <g>
      {s.schlag(a, b, 78, 62, 120)}
      {s.box(a, b, 0, 78, 62, 70, BRUCH)}
      {s.steine(a, b, 0, 78, 62, 70)}
      {s.tuer(a + 30, b + 62, 2, 18, 32)}
      {[8, 56].map((xx) => (
        <g key={xx}>{s.fenster("L", a + xx, b + 62, 12, 13, 22)}</g>
      ))}
      {[8, 32, 56].map((xx) => (
        <g key={xx}>{s.fenster("L", a + xx, b + 62, 44, 13, 18)}</g>
      ))}
      {[10, 36].map((yy) => (
        <g key={yy}>{s.fenster("R", b + yy, a + 78, 18, 13, 40)}</g>
      ))}
      {s.tiefe(a, b, 0, 78, 62, 70)}
      {s.band(a, b, 70, 78, 62, 12)}
      {s.satteldach(a, b, 70, 78, 62, 46, SCHIEFER, 7, false)}
      {(() => {
        const m = s.P3(a + 78, b + 31, 88);
        return (
          <g>
            {kreis(m, 8, P.balkenTief)}
            {kreis(m, 5.5, P.glas)}
            {s.linie(
              [m[0] - 4, m[1] + 1],
              [m[0] + 4, m[1] - 1],
              P.balkenTief,
              2,
            )}
          </g>
        );
      })()}
    </g>
  );
};

const sternwarte: Bau = (s, x, y) => {
  const a = x + 30;
  const b = y + 30;
  const top = s.P3(a + 20, b + 20, 96);
  return (
    <g>
      {s.flaeche(x + 18, y + 18, 64, 64, P.pflaster)}
      {s.schlag(a, b, 40, 40, 130)}
      {s.box(a, b, 0, 40, 40, 90, BRUCH)}
      {s.steine(a, b, 0, 40, 40, 90)}
      {s.tuer(a + 12, b + 40, 2, 15, 26)}
      {s.fenster("L", a + 14, b + 40, 46, 11, 15)}
      {s.fenster("R", b + 14, a + 40, 62, 11, 15)}
      {s.tiefe(a, b, 0, 40, 40, 90)}
      {s.box(a - 3, b - 3, 90, 46, 46, 6, HOLZ)}
      {s.band(a, b, 90, 40, 40, 10)}
      <path
        d={`M${top[0] - 34} ${top[1]} A34 30 0 0 1 ${top[0] + 34} ${top[1]} Z`}
        fill={P.schiefer}
      />
      <path
        d={`M${top[0]} ${top[1] - 30} A34 30 0 0 1 ${top[0] + 34} ${top[1]} H${top[0]} Z`}
        fill={P.schieferTief}
      />
      <path
        d={`M${top[0] - 26} ${top[1] - 10} A28 24 0 0 1 ${top[0] - 6} ${top[1] - 27}`}
        fill="none"
        stroke={P.schieferHell}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <rect
        x={top[0] - 5}
        y={top[1] - 29}
        width={10}
        height={29}
        fill={P.dunkel}
      />
      {s.linie(
        [top[0], top[1] - 18],
        [top[0] + 26, top[1] - 42],
        P.metallTief,
        7,
      )}
      {s.linie([top[0], top[1] - 18], [top[0] + 26, top[1] - 42], P.metall, 4)}
      {s.linie([top[0] - 34, top[1]], [top[0] + 34, top[1]], P.balken, 3)}
    </g>
  );
};

const festwiese: Bau = (s, x, y) => {
  const mast = s.P3(x + 50, y + 50, 0);
  const spitze = s.P3(x + 50, y + 50, 110);
  const kranz = s.P3(x + 50, y + 50, 84);
  const fahnen = (a: [number, number], b: [number, number], k: number) =>
    Array.from({ length: k }, (_, i) => {
      const p = [
        a[0] + ((b[0] - a[0]) * (i + 0.5)) / k,
        a[1] +
          ((b[1] - a[1]) * (i + 0.5)) / k +
          Math.sin(((i + 0.5) / k) * Math.PI) * 10,
      ];
      return (
        <path
          key={i}
          d={`M${p[0] - 4} ${p[1]} h8 l-4 9 Z`}
          fill={[P.rot, P.gold, P.blau, P.gruenHell][i % 4]}
        />
      );
    });
  return (
    <g>
      {s.flaeche(x + 8, y + 8, 84, 84, P.wieseHell)}
      {s.poly(
        [
          mast,
          [mast[0] + 40, mast[1] + 6],
          [mast[0] + 42, mast[1] + 10],
          [mast[0] + 2, mast[1] + 4],
        ],
        P.schatten,
        { opacity: 0.2 },
      )}
      {s.box(x + 14, y + 66, 0, 26, 8, 8, HOLZ)}
      {s.box(x + 66, y + 18, 0, 8, 26, 8, HOLZ)}
      {s.linie(mast, spitze, P.balken, 7)}
      {s.linie(mast, spitze, P.holz, 4)}
      <ellipse
        cx={kranz[0]}
        cy={kranz[1]}
        rx={18}
        ry={7}
        fill="none"
        stroke={P.blattTief}
        strokeWidth={6}
      />
      <ellipse
        cx={kranz[0]}
        cy={kranz[1]}
        rx={18}
        ry={7}
        fill="none"
        stroke={P.blatt}
        strokeWidth={3.5}
      />
      {[P.rot, P.gold, P.blau, P.rosa].map((c, i) => (
        <path
          key={c}
          d={`M${kranz[0] - 15 + i * 10} ${kranz[1] + 4} q${-4 + i * 2} 18 ${-2 + i * 3} 34`}
          fill="none"
          stroke={c}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      {fahnen([spitze[0], spitze[1] + 6], s.P3(x + 12, y + 88, 40), 6)}
      {fahnen([spitze[0], spitze[1] + 6], s.P3(x + 88, y + 12, 40), 6)}
      {s.linie(
        s.P3(x + 12, y + 88, 0),
        s.P3(x + 12, y + 88, 42),
        P.balken,
        3.5,
      )}
      {s.linie(
        s.P3(x + 88, y + 12, 0),
        s.P3(x + 88, y + 12, 42),
        P.balken,
        3.5,
      )}
      {kreis([spitze[0], spitze[1]], 5, P.gold)}
    </g>
  );
};

const baustelle: Bau = (s, x, y) => {
  const a = x + 22;
  const b = y + 22;
  const ecken: [number, number][] = [
    [a, b],
    [a + 56, b],
    [a, b + 56],
    [a + 56, b + 56],
  ];
  return (
    <g>
      {s.flaeche(x + 12, y + 12, 76, 76, P.sand)}
      {s.box(a, b, 0, 56, 56, 6, BRUCH)}
      {s.box(a + 4, b + 4, 6, 48, 48, 14, BRUCH)}
      {s.steine(a + 4, b + 4, 6, 48, 48, 14)}
      {s.tiefe(a, b, 0, 56, 56, 20)}
      {ecken.map(([xx, yy]) => (
        <g key={`${xx}-${yy}`}>
          {s.linie(s.P3(xx, yy, 0), s.P3(xx, yy, 56), P.holzTief, 4)}
        </g>
      ))}
      {[28, 50].map((z) => (
        <g key={z}>
          {s.linie(s.P3(a, b + 56, z), s.P3(a + 56, b + 56, z), P.holz, 5)}
          {s.linie(s.P3(a + 56, b, z), s.P3(a + 56, b + 56, z), P.holzTief, 5)}
        </g>
      ))}
      {s.linie(s.P3(a, b + 56, 0), s.P3(a + 56, b + 56, 50), P.holzTief, 3)}
      {s.box(x + 72, y + 80, 0, 18, 10, 4, HOLZ)}
      {s.box(x + 72, y + 80, 4, 18, 10, 4, HOLZ)}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          {s.box(x + 10 + i * 7, y + 82, 0, 6, 6, 4, {
            top: P.ziegelHell,
            links: P.ziegel,
            rechts: P.ziegelTief,
          })}
        </g>
      ))}
    </g>
  );
};

/** An empty, staked plot at (x, y), with a blank sign. */
const grundstueck = (s: IsoStift, x: number, y: number) => {
  const w = GRUND;
  const ecken: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + w],
    [x, y + w],
  ];
  const schild = s.P3(x + w, y + w * 0.5, 22);
  return (
    <g>
      {s.flaeche(x, y, w, w, s.wetter.schnee ? P.wolkeHell : P.wieseHell)}
      {s.poly([...ecken.map(([a, b]) => s.P3(a, b, 6)), s.P3(x, y, 6)], "none", {
        stroke: P.weiss,
        strokeWidth: 1.5,
        strokeDasharray: "4 4",
        opacity: 0.8,
      })}
      {ecken.map(([xx, yy]) => (
        <g key={`${xx}-${yy}`}>{s.linie(s.P3(xx, yy, 0), s.P3(xx, yy, 10), P.balken, 3.5)}</g>
      ))}
      {s.linie(s.P3(x + w, y + w * 0.5, 0), s.P3(x + w, y + w * 0.5, 22), P.balken, 3)}
      <rect x={schild[0] - 9} y={schild[1] - 6} width={18} height={10} rx={2} fill={P.holz} stroke={P.balken} strokeWidth={2} />
    </g>
  );
};

/** An empty building place on the square. */
const platz = (s: IsoStift, x: number, y: number) => (
  <g>
    {s.flaeche(x + 18, y + 18, 64, 64, P.wiese)}
    {s.poly(
      [
        s.P3(x + 18, y + 18, 0),
        s.P3(x + 82, y + 18, 0),
        s.P3(x + 82, y + 82, 0),
        s.P3(x + 18, y + 82, 0),
        s.P3(x + 18, y + 18, 0),
      ],
      "none",
      { stroke: P.wieseTief, strokeWidth: 2, strokeDasharray: "5 5" },
    )}
  </g>
);

const BAUTEN: Record<string, Bau> = {
  brunnen,
  bruecke,
  baeckerei,
  bibliothek,
  sternwarte,
  festwiese,
};

/** One building alone, its cell centre at (0, 0), for the workshop and lists. */
function Einzeln({ bau }: { bau: Bau }) {
  return <g>{bau(isoStift(0, -50), 0, 0)}</g>;
}

export const GEBAEUDE_BILD: Record<string, () => ReactNode> =
  Object.fromEntries(
    Object.entries(BAUTEN).map(([k, b]) => [k, () => <Einzeln bau={b} />]),
  );
export const Baustelle = () => <Einzeln bau={baustelle} />;

const R: [number, number, number, number] = [-95, -160, 190, 230];
export const DORF_TEILE: GelaendeTeil[] = [
  {
    id: "dorf-brunnen",
    name: "Brunnen",
    rahmen: R,
    zeichnung: () => <Einzeln bau={brunnen} />,
  },
  {
    id: "dorf-bruecke",
    name: "Brücke",
    rahmen: R,
    zeichnung: () => <Einzeln bau={bruecke} />,
  },
  {
    id: "dorf-baeckerei",
    name: "Bäckerei",
    rahmen: R,
    zeichnung: () => <Einzeln bau={baeckerei} />,
  },
  {
    id: "dorf-bibliothek",
    name: "Bibliothek",
    rahmen: R,
    zeichnung: () => <Einzeln bau={bibliothek} />,
  },
  {
    id: "dorf-sternwarte",
    name: "Sternwarte",
    rahmen: R,
    zeichnung: () => <Einzeln bau={sternwarte} />,
  },
  {
    id: "dorf-festwiese",
    name: "Festwiese",
    rahmen: R,
    zeichnung: () => <Einzeln bau={festwiese} />,
  },
  {
    id: "dorf-baustelle",
    name: "Baustelle",
    rahmen: R,
    zeichnung: () => <Einzeln bau={baustelle} />,
  },
  ...HAUS_TEILE,
  ...HAUS_GESTALTET,
];


// — The map —

/** A market stall (from Marktflecken on): counter with goods, a striped awning. */
function stand(s: IsoStift, p: Pt, farbe: string) {
  const [cx, cy] = welt(p[0], p[1]);
  const x = cx - 14;
  const y = cy - 9;
  const ware = [P.rot, P.gold, P.blattHell, P.orange];
  return (
    <g data-teil="stand">
      {s.schlag(x, y, 28, 18, 26)}
      {s.box(x, y, 0, 28, 18, 10, HOLZ)}
      {s.tiefe(x, y, 0, 28, 18, 10)}
      {ware.map((c, i) => (
        <g key={i}>{s.poly([s.P3(x + 3 + i * 6.5, y + 6, 10), s.P3(x + 8 + i * 6.5, y + 6, 10), s.P3(x + 8 + i * 6.5, y + 13, 10), s.P3(x + 3 + i * 6.5, y + 13, 10)], c)}</g>
      ))}
      {[
        [x, y + 18],
        [x + 28, y + 18],
        [x + 28, y],
      ].map(([a, b], i) => (
        <g key={i}>{s.linie(s.P3(a, b, 0), s.P3(a, b, 24), P.balken, 2.5)}</g>
      ))}
      {[0, 1, 2, 3].map((i) => {
        const a = x - 2 + i * 8;
        return (
          <g key={`d${i}`}>
            {s.poly([s.P3(a, y - 2, 30), s.P3(a + 8, y - 2, 30), s.P3(a + 8, y + 22, 22), s.P3(a, y + 22, 22)], i % 2 ? (s.wetter.schnee ? P.schnee : P.wolke) : farbe)}
          </g>
        );
      })}
      {s.linie(s.P3(x - 2, y + 22, 22), s.P3(x + 30, y + 22, 22), P.balken, 2)}
    </g>
  );
}

/** The city wall (Stadt): walls along the world axes with merlons, round corner towers, two gate towers and the gate. */
function mauerTeile(s: IsoStift): { k: number; node: ReactNode }[] {
  const stein: Flaechen = s.wetter.schnee ? { ...BRUCH, top: P.schnee } : BRUCH;
  const W = (p: Pt) => welt(p[0], p[1]);
  const [tlx, tly] = W(MAUER.torL);
  const [elx, ely] = W(MAUER.eckeL);
  const [, aly] = W(MAUER.endeL);
  const [trx, try_] = W(MAUER.torR);
  const [erx, ery] = W(MAUER.eckeR);
  const [arx] = W(MAUER.endeR);
  const H = 26;
  const zinnenX = (x0: number, x1: number, y: number) =>
    Array.from({ length: Math.floor((x1 - x0) / 10) }, (_, i) => <g key={i}>{s.box(x0 + 2 + i * 10, y - 4, H, 5, 8, 6, stein)}</g>);
  const zinnenY = (y0: number, y1: number, x: number) =>
    Array.from({ length: Math.floor((y1 - y0) / 10) }, (_, i) => <g key={i}>{s.box(x - 4, y0 + 2 + i * 10, H, 8, 5, 6, stein)}</g>);
  const wandX = (x0: number, x1: number, y: number) => (
    <g>
      {s.box(x0, y - 4, 0, x1 - x0, 8, H, stein)}
      {s.tiefe(x0, y - 4, 0, x1 - x0, 8, H)}
      {zinnenX(x0, x1, y)}
    </g>
  );
  const wandY = (y0: number, y1: number, x: number) => (
    <g>
      {s.box(x - 4, y0, 0, 8, y1 - y0, H, stein)}
      {s.tiefe(x - 4, y0, 0, 8, y1 - y0, H)}
      {zinnenY(y0, y1, x)}
    </g>
  );
  const rundturm = (x: number, y: number) => (
    <g>
      {s.rundSchlag(x, y, 13, 52)}
      {s.walze(x, y, 0, 13, 52, stein)}
      {s.bogenTor("L", x - 3, y + 12.5, 20, 6, 10, P.dunkel)}
      {s.kegel(x, y, 52, 16, 30, P.schiefer, P.schieferTief, P.schieferHell)}
      {wimpel(s.P3(x, y, 82), P.rot, 16)}
    </g>
  );
  const torturm = (x: number, y: number) => (
    <g>
      {s.schlag(x - 11, y - 11, 22, 22, 50)}
      {s.box(x - 11, y - 11, 0, 22, 22, 48, stein)}
      {s.fenster("L", x - 3, y + 11, 26, 6, 9)}
      {s.fenster("R", y - 3, x + 11, 26, 6, 9)}
      {s.tiefe(x - 11, y - 11, 0, 22, 22, 48)}
      {s.zeltdach(x - 11, y - 11, 48, 22, 22, 26, SCHIEFER, 4, P.gold)}
    </g>
  );
  const tor = () => {
    const l = s.P3(tlx, tly, 0);
    const r = s.P3(trx, try_, 0);
    const a = l[0] + 18;
    const b = r[0] - 18;
    const y = l[1];
    return (
      <g data-teil="mauer">
        <rect x={a} y={y - 46} width={b - a} height={14} fill={stein.links} />
        <rect x={a} y={y - 51} width={b - a} height={5} fill={stein.top} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={a + 3 + i * ((b - a - 8) / 2)} y={y - 56} width={5} height={6} fill={stein.links} />
        ))}
        <rect x={(a + b) / 2 - 5} y={y - 36} width={10} height={13} rx={2} fill={P.rot} />
        <circle cx={(a + b) / 2} cy={y - 30} r={2.5} fill={P.gold} />
      </g>
    );
  };
  return [
    { k: -46, node: wandY(ely, aly, elx) },
    { k: -46, node: wandX(erx, arx, ery) },
    { k: -40, node: wandX(elx, tlx, tly) },
    { k: -40, node: wandY(ery, try_, trx) },
    { k: MAUER.eckeL[1], node: rundturm(elx, ely) },
    { k: MAUER.eckeR[1], node: rundturm(erx, ery) },
    { k: MAUER.torL[1], node: torturm(tlx, tly) },
    { k: MAUER.torR[1], node: torturm(trx, try_) },
    { k: MAUER.torL[1] + 1, node: tor() },
  ];
}

const hash = (a: number, b: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const punkte = (a: Pt[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const linienzug = (a: Pt[]) => `M${a.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")}`;
const NACHT_DECKUNG = 0.45;
/** Text longer than 10 characters is shortened (names on the teacher's map). */
const kurz = (t: string) => (t.length > 10 ? `${t.slice(0, 9)}…` : t);

/** A sign above a house: the gold „Du“ at the own plot (it bobs), or a name for the teacher. */
function schild(p: Pt, text: string, du: boolean, key: number) {
  const t = kurz(text);
  const gr = du ? 15 : 12;
  const hoch = du ? 24 : 20;
  const breite = t.length * gr * 0.6 + hoch * 0.9;
  return (
    <g key={`s${key}`} className={du ? "lq-du" : undefined} data-ich={du ? "" : undefined}>
      <path d={`M${p[0] - 6} ${p[1] - 1} L${p[0]} ${p[1] + 6} L${p[0] + 6} ${p[1] - 1}Z`} fill={du ? P.goldTief : P.wolkeTief} />
      <rect x={p[0] - breite / 2} y={p[1] - hoch} width={breite} height={hoch} rx={hoch / 2} fill={du ? P.gold : P.weiss} />
      <rect x={p[0] - breite / 2 + hoch / 2} y={p[1] - 3} width={breite - hoch} height={3} fill={du ? P.goldTief : P.wolke} />
      <text x={p[0]} y={p[1] - hoch / 2 + gr * 0.36} textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight={800} fontSize={gr} fill={P.linie}>
        {t}
      </text>
    </g>
  );
}

/** What changed since the child last looked: these houses (plot numbers) and buildings pop up. */
export interface DorfNeu {
  haeuser?: number[];
  gebaeude?: string[];
}

/**
 * The village map in portrait (Richtung A): the square with the built buildings and the building site at the bottom,
 * the road up with `plaetze` plots, the children's houses with their looks, and on top of everything the signs.
 * Taller than the screen: the caller lets it scroll up and down.
 */
export function DorfKarte({
  fertig,
  baustelle: bauId,
  plaetze,
  haeuser,
  ich,
  hinweis,
  titel,
  abend = false,
  winter = false,
  neu,
}: {
  fertig: string[];
  baustelle?: string | null;
  plaetze: number;
  /** Own houses (Teil B1) by plot; names are shown when given (teacher). */
  haeuser?: HausPlatz[];
  /** The viewer's own plot: marked „Du“. */
  ich?: number | null;
  hinweis?: string;
  titel: string;
  /** Evening: dark, windows and lanterns lit (istAbend). */
  abend?: boolean;
  /** Winter: snow (istWinter). */
  winter?: boolean;
  neu?: DorfNeu;
}) {
  const n = anzahl(Math.max(plaetze, haeuser?.length ?? 0));
  const stufe = dorfStufe(new Set(fertig).size);
  const s = isoStift(0, 0, { schnee: winter, nacht: abend });
  const [vx, vy, vw, vh] = rahmen(n);
  const ins = insel(n);
  const plots = grundstuecke(n);
  const ende = wegEnde(n);
  const boden = winter
    ? { grund: P.schnee, hell: P.wolkeHell, tief: P.wolke, kante: P.wolkeTief }
    : { grund: P.wiese, hell: P.wieseHell, tief: P.wieseTief, kante: P.rasenTief };
  const [wegHell, wegTief] = stufe === 0 ? [P.sand, P.sandTief] : [P.pflaster, P.pflasterTief];
  const runter = (a: Pt[], d: number) => a.map(([x, y]) => [x, y + d] as Pt);

  // Ground: water with glints, the island with its edge, patches of grass, the square, the road and the small squares.
  const flecken: ReactNode[] = [];
  for (let gy = Math.ceil(ins.oben / 70); gy * 70 < ins.unten; gy++)
    for (let gx = -3; gx <= 3; gx++) {
      const r = hash(gx + 11, gy);
      if (r < 0.45) continue;
      const c: Pt = [gx * 70 + (hash(gy, gx) - 0.5) * 40, gy * 70 + (hash(gx, gy + 3) - 0.5) * 30];
      if (!ins.auf(c, 40)) continue;
      const rx = 26 + hash(gx, gy + 9) * 30;
      flecken.push(<ellipse key={`${gx}/${gy}`} cx={c[0]} cy={c[1]} rx={rx} ry={rx * 0.5} fill={r > 0.75 ? boden.tief : boden.hell} />);
    }
  const platzOben = -34;
  const platzFlaeche: Pt[] = [];
  for (let y = platzOben; y <= ins.unten; y += 6) platzFlaeche.push([ins.mitte(y) + ins.halb(y) - 6, y]);
  for (let y = ins.unten; y >= platzOben; y -= 6) platzFlaeche.push([ins.mitte(y) - ins.halb(y) + 6, y]);
  const weg = wegPunkte(n);
  const ellipse = (c: Pt, rx: number, fill: string, dy = 0) => <ellipse cx={c[0]} cy={c[1] + dy} rx={rx} ry={rx * 0.58} fill={fill} />;
  const grund = (
    <g>
      <rect x={vx} y={vy} width={vw} height={vh} fill={winter ? P.wasserTief : P.wasser} />
      {wasser(n).map((p, i) => (
        <g key={i}>{glitzer(p, i, winter ? P.eisHell : P.wasserHell)}</g>
      ))}
      <polygon points={punkte(runter(ins.umriss, 20))} fill={P.holzTief} />
      <polygon points={punkte(runter(ins.umriss, 11))} fill={P.holz} />
      <polygon points={punkte(runter(ins.umriss, 5))} fill={boden.kante} />
      <polygon points={punkte(ins.umriss)} fill={boden.grund} />
      {flecken}
      {stufe === 3 ? (
        <polygon points={punkte(platzFlaeche)} fill={P.pflaster} />
      ) : (
        <g>
          <path d={linienzug([[0, platzOben], [0, 244]])} stroke={wegTief} strokeWidth={stufe ? 76 : WEG_HALB * 2} strokeLinecap="round" transform="translate(0 4)" />
          <path d={linienzug([[0, platzOben], [0, 244]])} stroke={wegHell} strokeWidth={stufe ? 76 : WEG_HALB * 2} strokeLinecap="round" />
        </g>
      )}
      {stufe === 3 && <path d={linienzug(weg)} fill="none" stroke={P.bruch} strokeWidth={WEG_HALB * 2 + 6} strokeLinecap="round" strokeLinejoin="round" />}
      <path d={linienzug(runter(weg, 4))} fill="none" stroke={wegTief} strokeWidth={WEG_HALB * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={linienzug(weg)} fill="none" stroke={wegHell} strokeWidth={WEG_HALB * 2} strokeLinecap="round" strokeLinejoin="round" />
      {ellipse([wegX(ende), ende], 36, wegTief, 4)}
      {ellipse([wegX(ende), ende], 36, wegHell)}
      {plaetzchen(n).map((q, i) => (
        <g key={i}>
          {ellipse(q, 44, wegTief, 4)}
          {ellipse(q, 44, wegHell)}
        </g>
      ))}
      {abend && <rect x={vx} y={vy} width={vw} height={vh} fill={P.nachtTief} opacity={NACHT_DECKUNG} />}
    </g>
  );

  // Everything that stands, back to front.
  const dinge: { k: number; node: ReactNode }[] = [];
  const gebaut = new Set(fertig);
  for (const [id, o] of Object.entries(GEBAEUDE_ORT)) {
    const bau = gebaut.has(id) ? BAUTEN[id] : bauId === id ? baustelle : null;
    const bild = bau ? bau(s, o.x, o.y) : platz(s, o.x, o.y);
    dinge.push({ k: o.sy, node: neu?.gebaeude?.includes(id) ? <g className="lq-neu">{bild}</g> : bild });
  }
  const schilder: ReactNode[] = [];
  plots.forEach((p, i) => {
    const h = haeuser?.[i];
    const st = h && h.stufe !== null && h.stufe >= 0 && h.stufe < HAUS_HOEHE.length ? h.stufe : null;
    dinge.push({
      k: p.sy,
      node: (
        <g data-platz={i}>
          {st === null ? grundstueck(s, p.x, p.y) : hausMitGarten(s, p.x, p.y, st, aussehenVon(h?.aussehen, i, st), !!neu?.haeuser?.includes(i))}
        </g>
      ),
    });
    const text = i === ich ? "Du" : h?.name;
    if (text) schilder.push(schild([p.sx, p.sy - (st === null ? 24 : HAUS_HOEHE[st])], text, i === ich, i));
  });
  for (const d of deko(n)) {
    const node =
      d.art === "baum" ? baum(d.p, d.k, winter) : d.art === "busch" ? busch(d.p, d.k, winter) : d.art === "stein" ? stein(d.p, d.k) : winter ? null : blume(d.p, Math.round(d.k * 10));
    if (node) dinge.push({ k: d.p[1], node });
  }
  plaetzchen(n).forEach((q, i) => {
    dinge.push({ k: q[1] - 2, node: busch([q[0] - 54, q[1] - 2], 1.1, winter) });
    dinge.push({ k: q[1] + 2, node: busch([q[0] + 56, q[1] + 2], 0.9, winter) });
    if (stufe > 0) dinge.push({ k: q[1] + 6, node: laterne([q[0] + (i % 2 ? -34 : 34), q[1] + 6], abend) });
  });
  if (stufe > 0) for (const l of laternen(n)) dinge.push({ k: l[1], node: laterne(l, abend) });
  if (stufe > 1) STAENDE.forEach((p, i) => dinge.push({ k: p[1], node: stand(s, p, i ? P.blau : P.rot) }));
  if (stufe > 2) dinge.push(...mauerTeile(s));
  HUEHNER.forEach((p, i) => dinge.push({ k: p[1], node: huhn(p, i % 2 === 1) }));

  const label = hinweis ? ([0, (plots[2]?.sy ?? -250) - 64] as Pt) : null;
  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      role="img"
      aria-label={titel}
      className="lq-dorf-karte"
      data-stufe={stufe}
    >
      {grund}
      {dinge
        .sort((a, b) => a.k - b.k)
        .map((d, i) => (
          <g key={i}>{abend ? imDunkeln(d.node, P.nachtTief, NACHT_DECKUNG) : d.node}</g>
        ))}
      {schilder}
      {label && (
        <g>
          <rect x={label[0] - 92} y={label[1] - 20} width={184} height={30} rx={15} fill={P.weiss} opacity={0.92} />
          <text x={label[0]} y={label[1]} textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight={800} fontSize={18} fill={P.linie}>
            {hinweis}
          </text>
        </g>
      )}
    </svg>
  );
}

