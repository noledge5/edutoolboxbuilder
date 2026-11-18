// The class village in 2.5D (Klassendorf Stufe 2 Teil A, style of Stilprobe 3, decided 18.11.2026): the six buildings
// the class builds together, the building site of the running project and the village map (DorfKarte): the square
// with the six building places, a road to the right and quarters of six staked plots (names and own houses come with
// Teil B). Built from the parts of iso.tsx. Every building draws into one 100 × 100 cell at (x, y).
import { useId, type ReactNode } from "react";
import type { GelaendeTeil } from "./gelaende";
import {
  BRUCH,
  HOLZ,
  IsoVerlaeufe,
  isoStift,
  PUTZ,
  SCHIEFER,
  type IsoStift,
} from "./iso";
import { P } from "./stil";

type Bau = (s: IsoStift, x: number, y: number) => ReactNode;

const kreis = (
  p: [number, number],
  r: number,
  fill: string,
  rest: Record<string, unknown> = {},
) => <circle cx={p[0]} cy={p[1]} r={r} fill={fill} {...rest} />;

/** A round tree (blob crown on a trunk), standing at (x, y). */
const baum = (s: IsoStift, x: number, y: number, g = 1) => {
  const fuss = s.P3(x, y, 0);
  const k = s.P3(x, y, 34 * g);
  return (
    <g>
      {kreis([fuss[0] + 14 * g, fuss[1] + 3], 14 * g, P.schatten, {
        opacity: 0.2,
      })}
      {s.linie(fuss, s.P3(x, y, 22 * g), P.balken, 6 * g)}
      {kreis(k, 18 * g, P.blattTief)}
      {kreis([k[0] - 5 * g, k[1] - 5 * g], 14 * g, P.blatt)}
      {kreis([k[0] - 8 * g, k[1] - 9 * g], 6 * g, P.blattHell)}
    </g>
  );
};

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
        d={`M${top[0] - 34} ${top[1]} A34 30 0 0 1 ${top[0] + 34} ${top[1]} Z`}
        fill={s.url("dachT")}
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

/** An empty, staked plot of w × w at (x, y), with a blank sign. */
const grundstueck = (s: IsoStift, x: number, y: number, w: number) => {
  const ecken: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + w],
    [x, y + w],
  ];
  const schild = s.P3(x + w, y + w * 0.5, 22);
  return (
    <g>
      {s.flaeche(x, y, w, w, P.wieseHell)}
      {s.poly(
        [
          s.P3(x, y, 6),
          s.P3(x + w, y, 6),
          s.P3(x + w, y + w, 6),
          s.P3(x, y + w, 6),
          s.P3(x, y, 6),
        ],
        "none",
        {
          stroke: P.weiss,
          strokeWidth: 1.5,
          strokeDasharray: "4 4",
          opacity: 0.8,
        },
      )}
      {ecken.map(([xx, yy]) => (
        <g key={`${xx}-${yy}`}>
          {s.linie(s.P3(xx, yy, 0), s.P3(xx, yy, 10), P.balken, 3.5)}
        </g>
      ))}
      {s.linie(
        s.P3(x + w, y + w * 0.5, 0),
        s.P3(x + w, y + w * 0.5, 22),
        P.balken,
        3,
      )}
      <rect
        x={schild[0] - 9}
        y={schild[1] - 6}
        width={18}
        height={10}
        rx={2}
        fill={P.holz}
        stroke={P.balken}
        strokeWidth={2}
      />
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
  const id = `dorf-${useId().replace(/:/g, "")}`;
  return (
    <g>
      <IsoVerlaeufe id={id} />
      {bau(isoStift(0, -50, id), 0, 0)}
    </g>
  );
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
];

/** Building places on the square (cells of 100), back row first. */
const PLAETZE: Record<string, [number, number]> = {
  bibliothek: [0, 0],
  sternwarte: [100, 0],
  festwiese: [200, 0],
  baeckerei: [0, 200],
  brunnen: [100, 200],
  bruecke: [200, 200],
};
/** Plots per quarter, their size and the step along the road (direction +x −y, i.e. to the right on screen). */
export const JE_VIERTEL = 6;
const W = 56;
const SCHRITT = 60;
const START: [number, number] = [320, 100];

/** Plot positions (world x, y of the corner) for `n` plots; a quarter = 3 steps of plot pairs and a small square. */
export function grundstuecke(
  n: number,
): { x: number; y: number; viertel: number }[] {
  const out: { x: number; y: number; viertel: number }[] = [];
  for (let i = 0; i < n; i++) {
    const v = Math.floor(i / JE_VIERTEL);
    const k = i % JE_VIERTEL;
    const schritt = v * 4 + Math.floor(k / 2) + 1;
    const rx = START[0] + schritt * SCHRITT;
    const ry = START[1] - schritt * SCHRITT;
    const seite = k % 2 ? 1 : -1;
    out.push({
      x: rx + seite * 46 - W / 2,
      y: ry + seite * 46 - W / 2,
      viertel: v,
    });
  }
  return out;
}

/**
 * The village map: the square with the built buildings, the building site of the running project, the road and
 * `plaetze` staked plots in quarters of six. Wider than the screen: the caller lets it scroll sideways.
 */
export function DorfKarte({
  fertig,
  baustelle: bauId,
  plaetze,
  hinweis,
  titel,
}: {
  fertig: string[];
  baustelle?: string | null;
  plaetze: number;
  hinweis?: string;
  titel: string;
}) {
  const id = `dk-${useId().replace(/:/g, "")}`;
  const s = isoStift(0, 0, id);
  const n = Number.isFinite(plaetze)
    ? Math.min(200, Math.max(0, Math.floor(plaetze)))
    : 0;
  const viertel = Math.ceil(n / JE_VIERTEL);
  const ende = viertel * 4 + 1;
  const E: [number, number] = [
    START[0] + ende * SCHRITT,
    START[1] - ende * SCHRITT,
  ];
  const ns = (x: number, y: number, o: number): [number, number][] => [
    [x + o, y + o],
    [x - o, y - o],
  ];
  // Ground: the square and a band along the road.
  const strasse = [
    ...ns(START[0] - 30, START[1] + 30, 14),
    ...ns(E[0], E[1], 14).reverse(),
  ];
  const band = viertel
    ? [
        ...ns(START[0] - 40, START[1] + 40, 110),
        ...ns(E[0] + 30, E[1] - 30, 110).reverse(),
      ]
    : [];
  const platzRand: [number, number][] = [
    [-24, -24],
    [324, -24],
    [324, 324],
    [-24, 324],
  ];
  const boden = (pts: [number, number][]) => pts.map(([a, b]) => s.P3(a, b));
  const unten = (pts: [number, number][]) =>
    boden(pts).map(([a, b]) => [a, b + 12] as [number, number]);
  const plots = grundstuecke(n);
  const kleinePlaetze = Array.from({ length: viertel }, (_, v) => {
    const k = v * 4 + 4;
    return [START[0] + k * SCHRITT, START[1] - k * SCHRITT] as [number, number];
  });
  // Everything that stands, sorted back to front.
  const dinge: { t: number; node: ReactNode }[] = [];
  for (const [g, [x, y]] of Object.entries(PLAETZE)) {
    const bau = fertig.includes(g) ? BAUTEN[g] : bauId === g ? baustelle : null;
    dinge.push({ t: x + y, node: bau ? bau(s, x, y) : platz(s, x, y) });
  }
  plots.forEach((p, i) =>
    dinge.push({
      t: p.x + p.y - 1000,
      node: <g key={`g${i}`}>{grundstueck(s, p.x, p.y, W)}</g>,
    }),
  );
  kleinePlaetze.forEach(([x, y], i) =>
    dinge.push({
      t: x + y + 50,
      node: <g key={`b${i}`}>{baum(s, x - 30, y + 30, 0.9)}</g>,
    }),
  );
  dinge.push({ t: 300, node: baum(s, 150, 150, 1.1) });
  dinge.push({ t: -10, node: baum(s, -10, 150, 0.8) });
  // Screen box.
  const ecken = [...boden(platzRand), ...boden(band), ...boden(strasse)];
  const minX = Math.min(...ecken.map((p) => p[0])) - 16;
  const maxX = Math.max(...ecken.map((p) => p[0])) + 16;
  const minY = -150;
  const maxY = Math.max(...ecken.map((p) => p[1])) + 24;
  const label =
    hinweis && kleinePlaetze.length
      ? s.P3(kleinePlaetze[0][0] - 120, kleinePlaetze[0][1] + 120, 150)
      : null;
  return (
    <svg
      viewBox={`${minX.toFixed(0)} ${minY} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`}
      role="img"
      aria-label={titel}
      className="lq-dorf-karte"
    >
      <IsoVerlaeufe id={id} />
      <rect
        x={minX}
        y={minY}
        width={maxX - minX}
        height={maxY - minY}
        fill={P.himmel}
      />
      {band.length > 0 && s.poly(unten(band), P.rasenTief)}
      {s.poly(unten(platzRand), P.rasenTief)}
      {band.length > 0 && s.poly(boden(band), P.wiese)}
      {s.poly(boden(platzRand), P.wiese)}
      {s.flaeche(0, 100, 300, 100, P.pflaster)}
      {s.poly(boden(strasse), P.pflaster)}
      {[60, 140, 220].map((xx) => (
        <g key={xx}>
          {s.flaeche(xx, 130, 40, 40, P.pflasterTief, { opacity: 0.6 })}
        </g>
      ))}
      {kleinePlaetze.map(([x, y], i) => (
        <g key={i}>{s.flaeche(x - 34, y - 34, 68, 68, P.pflaster)}</g>
      ))}
      {dinge
        .sort((a, b) => a.t - b.t)
        .map((d, i) => (
          <g key={i}>{d.node}</g>
        ))}
      {label && (
        <text
          x={label[0]}
          y={label[1]}
          textAnchor="middle"
          fontFamily="Fredoka, Nunito, sans-serif"
          fontWeight={800}
          fontSize={24}
          fill={P.linie}
        >
          {hinweis}
        </text>
      )}
    </svg>
  );
}
