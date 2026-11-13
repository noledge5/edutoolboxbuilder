// Stufe 4 on the teacher's page: progress per child and competence of a region (module), from the children's review
// cards. Same look as the competence tab of the handout evaluation (`EvaluationView`).
import { useMemo, useState } from 'react';
import type { Library } from '../../library/types';
import { auswerten, auswertenThemen, BOX_SITZT } from '../auswertung';
import { klassenRegionen, klassenRegionName, regionPakete } from '../extra';
import type { KlasseInfo } from '../server';

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)} %`);
const tone = (x: number | null) => (x === null ? '' : x >= 0.8 ? ' is-good' : x >= 0.5 ? ' is-mid' : ' is-low');

export function Auswertung({ lib, klasse }: { lib: Library; klasse: KlasseInfo }) {
  const regionen = useMemo(() => klassenRegionen(lib, klasse.stunden), [lib, klasse.stunden]);
  const [wahl, setWahl] = useState('');
  const region = regionen.find((x) => x.modul.id === wahl) ?? regionen[0];
  const m = region?.modul;
  const kinder = klasse.kinder.filter((k) => !k.geloescht);
  const r = useMemo(() => {
    if (!region) return null;
    const leitner = kinder.map((k) => ({ id: k.id, leitner: k.leitner ?? {} }));
    return region.extra ? auswertenThemen(regionPakete(lib, region, klasse.stunden), leitner) : auswerten(region.modul, region.stunden, leitner);
    // kinder is new on every render; the class object changes when the server answers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, lib, klasse]);

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Fortschritt je Kompetenz</h2>
          <p className="lqt-hint">
            Aus dem Wiederholen jedes Kindes: Eine Übung „sitzt“, wenn sie mindestens zweimal hintereinander richtig war (Kasten {BOX_SITZT} von 5). Die Prozente sind der Anteil der Übungen einer Kompetenz, die sitzen; „–“ heißt noch nicht geübt. Die Zuordnung zur Kompetenz kommt aus den
            Aufgaben der Stunden und bleibt auf diesem Gerät.
          </p>
        </div>
      </div>
      {!region || !m || !r ? (
        <p className="lib-empty">Schalte zuerst Stunden oder Extra-Pakete frei.</p>
      ) : (
        <>
          {regionen.length > 1 && (
            <div className="lqt-filter">
              <select className="input" value={m.id} onChange={(e) => setWahl(e.target.value)} aria-label="Region">
                {regionen.map((x) => (
                  <option key={x.modul.id} value={x.modul.id}>
                    {klassenRegionName(x)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {region.extra && <p className="lqt-hint">{m.title} hat keine Kompetenzen: eine Zeile je Extra-Paket.</p>}
          {!r.zeilen.length && region.extra && <p className="ev-empty">Die freigeschalteten Extra-Pakete haben noch keine freigegebenen Übungen.</p>}
          {!r.zeilen.length && !region.extra && <p className="ev-empty">Keine Übung der freigeschalteten Stunden ist mit einer Kompetenz verknüpft. Im Arbeitsblatt im Panel einer Aufgabe unter „Kompetenz“ verknüpfen.</p>}
          <div className="ev-cards">
            {r.zeilen.map((z) => {
              const hilfe = kinder.filter((k) => z.kinder[k.id]?.hilfe);
              return (
                <section key={z.id} className="ev-card">
                  <div className="ev-card-head">
                    <b>{z.name}</b>
                    <span>
                      {z.aufgaben} {z.aufgaben === 1 ? 'Übung' : 'Übungen'}
                    </span>
                    <span className={'ev-share' + tone(z.anteil)}>{pct(z.anteil)} sitzt</span>
                  </div>
                  <div className="ev-students">
                    {kinder.map((k) => {
                      const x = z.kinder[k.id];
                      return (
                        <span key={k.id} className={'ev-chip' + tone(x?.anteil ?? null)} title={x ? `${x.geuebt} von ${x.aufgaben} geübt, ${x.sitzt} sitzen, ${x.wackelt} zuletzt falsch` : undefined}>
                          {k.name} {pct(x?.anteil ?? null)}
                        </span>
                      );
                    })}
                  </div>
                  {hilfe.length > 0 && (
                    <p className="ev-help">
                      <b>Brauchen Hilfe:</b> {hilfe.map((k) => k.name).join(', ')}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
          {r.ohneKompetenz > 0 && (
            <p className="lqt-hint">
              {r.ohneKompetenz === 1 ? '1 Übung ist keiner Kompetenz dieses Moduls zugeordnet und fehlt hier.' : `${r.ohneKompetenz} Übungen sind keiner Kompetenz dieses Moduls zugeordnet und fehlen hier.`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
