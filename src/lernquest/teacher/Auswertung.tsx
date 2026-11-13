// Stufe 4 on the teacher's page: progress per child and competence of a region (module), from the children's review
// cards. Same look as the competence tab of the handout evaluation (`EvaluationView`).
import { useMemo, useState } from 'react';
import type { Library } from '../../library/types';
import { auswerten, auswertenThemen, BOX_SITZT } from '../auswertung';
import { istExtraModul, mitExtras, regionLabel } from '../extra';
import { buildPaket } from '../paket';
import type { KlasseInfo } from '../server';

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)} %`);
const tone = (x: number | null) => (x === null ? '' : x >= 0.8 ? ' is-good' : x >= 0.5 ? ' is-mid' : ' is-low');

export function Auswertung({ lib: bib, klasse }: { lib: Library; klasse: KlasseInfo }) {
  // Unlocked Extra-Pakete are regions too (one row per topic: they have no competences).
  const lib = useMemo(() => mitExtras(bib, klasse.stunden), [bib, klasse.stunden]);
  const regionen = lib.modules
    .filter((m) => lib.lessons.some((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'de') || a.grade - b.grade || a.number - b.number);
  const [wahl, setWahl] = useState('');
  const m = regionen.find((x) => x.id === wahl) ?? regionen[0];
  const kinder = klasse.kinder.filter((k) => !k.geloescht);
  const r = useMemo(
    () => {
      if (!m) return null;
      const stunden = lib.lessons.filter((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)).sort((a, b) => a.number - b.number);
      const k = kinder.map((x) => ({ id: x.id, leitner: x.leitner ?? {} }));
      return istExtraModul(m.id) ? auswertenThemen(stunden.map((l) => buildPaket(m, l, stunden)), k) : auswerten(m, stunden, k);
    },
    // kinder is new on every render; the class object changes when the server answers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [m, lib.lessons, klasse],
  );

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Fortschritt je Kompetenz</h2>
          <p className="lqt-hint">
            Aus dem Wiederholen jedes Kindes: Eine Übung „sitzt“, wenn sie mindestens zweimal hintereinander richtig war (Kasten {BOX_SITZT} von 5). Die Prozente sind der Anteil der Übungen einer Kompetenz, die sitzen; „–“ heißt noch nicht geübt. Die Zuordnung zur Kompetenz kommt aus den
            Aufgaben der Stunden und bleibt auf diesem Gerät. Extra-Pakete haben keine Kompetenzen: Dort steht eine Zeile je Thema.
          </p>
        </div>
      </div>
      {!m || !r ? (
        <p className="lib-empty">Schalte zuerst Stunden frei.</p>
      ) : (
        <>
          {regionen.length > 1 && (
            <div className="lqt-filter">
              <select className="input" value={m.id} onChange={(e) => setWahl(e.target.value)} aria-label="Modul">
                {regionen.map((x) => (
                  <option key={x.id} value={x.id}>
                    {regionLabel(x)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!r.zeilen.length && istExtraModul(m.id) && <p className="ev-empty">Die Extra-Pakete dieser Region haben noch keine freigegebenen Übungen.</p>}
          {!r.zeilen.length && !istExtraModul(m.id) && <p className="ev-empty">Keine Übung der freigeschalteten Stunden ist mit einer Kompetenz verknüpft. Im Arbeitsblatt im Panel einer Aufgabe unter „Kompetenz“ verknüpfen.</p>}
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
