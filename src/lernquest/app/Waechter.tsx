// The region's guard in the Meilenstein (Solo-Boss an der Burg, 28.11.2026, docs/plan-lernquest-fragen.md step 6):
// each child fights it alone with the region's mixed questions. Every right first try is a hit, a miss lets it attack;
// it has as many life points as right answers are needed to pass (`waechterLeben`), so it falls exactly when the
// Meilenstein is passed. Only on the device, like the Meilenstein; the class boss at the projector stays apart.
import { useEffect, useRef, useState } from 'react';
import { WAECHTER, WAECHTER_NAMEN } from '../figuren';
import { FigurBild } from '../figuren/Figur';
import { ton } from './ton';
import { weltVon, type WeltId } from '../figuren/welten';
import { waechterBesiegt } from '../karte';
import type { Paket, Stand } from '../types';

type Zug = { art: 'treffer' | 'angriff' | null; n: number };

/** The guard's last move and a count that starts it again: a hit when `treffer` grows, an attack when `fehler` grows. */
function useZug(treffer: number, fehler: number): Zug {
  const vorher = useRef({ treffer, fehler });
  const [zug, setZug] = useState<Zug>({ art: null, n: 0 });
  useEffect(() => {
    const v = vorher.current;
    if (treffer > v.treffer) setZug((z) => ({ art: 'treffer', n: z.n + 1 }));
    else if (fehler > v.fehler) setZug((z) => ({ art: 'angriff', n: z.n + 1 }));
    vorher.current = { treffer, fehler };
  }, [treffer, fehler]);
  return zug;
}

/** The guard of a world: it idles (stampfen), flinches at a hit, attacks at a miss, lies beaten. */
export function WaechterBild({ welt, breite = 96, besiegt = false, zug, lebendig = true }: { welt: WeltId; breite?: number; besiegt?: boolean; zug?: Zug; lebendig?: boolean }) {
  const figur = WAECHTER[welt] ?? WAECHTER.wiese;
  return (
    <FigurBild
      key={zug?.n ?? 0}
      figur={figur}
      titel={WAECHTER_NAMEN[welt] ?? WAECHTER_NAMEN.wiese}
      className="lq-waechter-bild"
      breite={breite}
      lebendig={lebendig}
      pose={besiegt ? 'besiegt' : 'lauern'}
      animation={!lebendig ? undefined : besiegt ? (zug?.art === 'treffer' ? 'treffer' : undefined) : (zug?.art ?? 'stampfen')}
      danach={lebendig && !besiegt ? 'stampfen' : undefined}
    />
  );
}

/** Over the exercise: the guard, its name and its life as pips, one per hit still needed. */
export function WaechterLeiste({ welt, leben, treffer, fehler }: { welt: WeltId; leben: number; treffer: number; fehler: number }) {
  const zug = useZug(treffer, fehler);
  const rest = Math.max(0, leben - treffer);
  const besiegt = rest === 0;
  // The moment it falls (28.11.2026): the band lights up and the bells of a level-up ring after the „right“ sound.
  const fiel = besiegt && zug.art === 'treffer';
  useEffect(() => {
    if (!fiel) return;
    const t = window.setTimeout(() => ton('aufstieg'), 450);
    return () => window.clearTimeout(t);
  }, [fiel]);
  return (
    <div className={`lq-waechter${besiegt ? ' besiegt' : ''}${fiel ? ' faellt' : ''}`}>
      <WaechterBild welt={welt} breite={64} besiegt={besiegt} zug={zug} />
      <div className="lq-waechter-text">
        <strong>{WAECHTER_NAMEN[welt] ?? WAECHTER_NAMEN.wiese}</strong>
        <span className="lq-waechter-leben" role="meter" aria-label="Leben des Wächters" aria-valuemin={0} aria-valuemax={leben} aria-valuenow={rest}>
          {Array.from({ length: leben }, (_, i) => (
            <i key={i} className={i < rest ? 'voll' : i === rest && zug.art === 'treffer' ? 'weg' : ''} />
          ))}
        </span>
        <span className="lq-waechter-rest">{besiegt ? 'Besiegt!' : rest === 1 ? 'Noch 1 Treffer' : `Noch ${rest} Treffer`}</span>
      </div>
    </div>
  );
}

/** The regions of the child's stations that have a guard: modules with at least two lessons (the Meilenstein needs two
 *  stations), by subject and number. */
export function waechterOrte(pakete: Pick<Paket, 'modul' | 'fach'>[]): { id: string; nummer: number; titel: string; fach: string; welt: WeltId }[] {
  const je = new Map<string, { id: string; nummer: number; titel: string; fach: string; welt: WeltId; n: number; stunden: number }>();
  for (const p of pakete) {
    if (!p.modul) continue;
    const r = je.get(p.modul.id) ?? { id: p.modul.id, nummer: p.modul.nummer, titel: p.modul.titel, fach: p.fach ?? '', welt: weltVon(p.modul.id, p.modul.nummer).id, n: 0, stunden: p.modul.stunden?.length ?? 0 };
    r.n++;
    je.set(p.modul.id, r);
  }
  return [...je.values()]
    .filter((r) => Math.max(r.n, r.stunden) >= 2)
    .sort((a, b) => a.fach.localeCompare(b.fach, 'de') || a.nummer - b.nummer)
    .map(({ id, nummer, titel, fach, welt }) => ({ id, nummer, titel, fach, welt }));
}

/** The hero page's shelf (28.11.2026): one place per region; a beaten guard lies in its place, the others wait in grey. */
export function WaechterRegal({ stand, pakete, besteHier }: { stand: Stand; pakete: Pick<Paket, 'modul' | 'fach'>[]; besteHier: Record<string, number> }) {
  const orte = waechterOrte(pakete);
  if (!orte.length) return null;
  const besiegt = orte.filter((o) => waechterBesiegt(o.id, stand.waechter, besteHier[o.id])).length;
  return (
    <section className="lq-box lq-regal" aria-labelledby="lq-regal-titel">
      <div className="lq-abzeichen-kopf">
        <h2 id="lq-regal-titel">Besiegte Wächter</h2>
        <span className="lq-klein">
          {besiegt} von {orte.length}
        </span>
      </div>
      <ul>
        {orte.map((o) => {
          const ja = waechterBesiegt(o.id, stand.waechter, besteHier[o.id]);
          return (
            <li key={o.id} className={ja ? 'besiegt' : 'offen'}>
              <WaechterBild welt={o.welt} breite={56} besiegt={ja} lebendig={false} />
              <b>{(WAECHTER_NAMEN[o.welt] ?? WAECHTER_NAMEN.wiese).replace(/^Der /, '')}</b>
              <span>{o.titel}</span>
              {!ja && <i className="lq-regal-wartet">wartet noch</i>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
