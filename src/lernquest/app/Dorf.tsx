// Klassendorf, Stufe 1 „Dorfkasse“ (decided 13.11.2026) on the children's class page: the village picture, the running
// project with its bar and buttons to donate coins (each counts 1.5 times, at most SPENDE_WOCHE a week), and the
// finished buildings with the names of all who helped, never amounts. Shown only when the teacher switched it on.
import { useEffect, useState } from 'react';
import { gebaeudeName, SPENDE_WOCHE, spendeMoeglich, spendeWert, type Dorf } from '../dorf';
import { DorfBild } from '../figuren/dorf';
import { dorf as dorfLaden, lqText, spenden } from '../server';
import type { Stand } from '../types';
import { Meldung, MuenzIcon, type Aktion } from './Held';
import { ton } from './ton';

const BETRAEGE = [10, 25, 50];

export function DorfBox({ aktion, stand, setStand }: { aktion: Aktion; stand: Stand; setStand: (s: Stand) => void }) {
  const [d, setD] = useState<Dorf | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [danke, setDanke] = useState('');

  useEffect(() => {
    aktion(dorfLaden).then(setD, () => setD(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!d?.an) return null;
  const p = d.projekt;
  const woche = d.woche ?? 0;
  const rest = Math.max(0, SPENDE_WOCHE - woche);

  const geben = async (wunsch: number) => {
    if (!p) return;
    const m = spendeMoeglich(wunsch, { muenzen: stand.muenzen, woche, ziel: p.ziel, stand: p.stand });
    if (m < 1) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await aktion((t) => spenden(t, m));
      setD(r.dorf);
      setStand(r.stand);
      ton(r.dorf.projekt ? 'richtig' : 'fertig');
      setDanke(r.dorf.projekt ? `Danke! Deine ${m} Münzen zählen ${spendeWert(m)}.` : `Geschafft! ${gebaeudeName(p.gebaeude)} steht im Dorf.`);
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="lq-box lq-dorf">
      <div className="lq-zeile-zwischen">
        <h2>Unser Dorf</h2>
        {d.fertig.length > 0 && <strong>{d.fertig.length === 1 ? '1 Gebäude' : `${d.fertig.length} Gebäude`}</strong>}
      </div>
      <DorfBild fertig={d.fertig.map((f) => f.gebaeude)} baustelle={p?.gebaeude} titel={`Euer Dorf mit ${d.fertig.map((f) => gebaeudeName(f.gebaeude)).join(', ') || 'noch keinem Gebäude'}`} />
      <Meldung text={msg} />
      {p ? (
        <div className="lq-dorf-projekt">
          <div className="lq-zeile-zwischen">
            <h3>Wir bauen: {gebaeudeName(p.gebaeude)}</h3>
            <strong>
              {p.stand} von {p.ziel}
            </strong>
          </div>
          <div className="lq-balken" role="progressbar" aria-label={`Spenden für ${gebaeudeName(p.gebaeude)}`} aria-valuemin={0} aria-valuemax={p.ziel} aria-valuenow={p.stand}>
            <span style={{ width: `${Math.min(100, (100 * p.stand) / p.ziel)}%` }} />
          </div>
          {p.belohnung && <p className="lq-klein">Wenn es fertig ist: {p.belohnung}</p>}
          <p className="lq-klein">
            Jede Münze für das Dorf zählt 1,5-fach. {p.helfer === 1 ? '1 Kind hat schon geholfen.' : p.helfer > 1 ? `${p.helfer} Kinder haben schon geholfen.` : ''}
          </p>
          {rest > 0 ? (
            <div className="lq-dorf-knoepfe">
              {[...new Set(BETRAEGE.map((b) => spendeMoeglich(b, { muenzen: stand.muenzen, woche, ziel: p.ziel, stand: p.stand })))]
                .filter((m) => m > 0)
                .map((m) => (
                  <button key={m} type="button" className="lq-knopf lq-hell" disabled={busy} onClick={() => void geben(m)} aria-label={`${m} Münzen spenden`}>
                    <MuenzIcon /> {m}
                  </button>
                ))}
            </div>
          ) : null}
          {rest > 0 && stand.muenzen < 1 && <p className="lq-klein">Sammle Münzen beim Lernen, dann kannst du mitbauen.</p>}
          <p className="lq-klein" role="status">
            {danke || (rest > 0 ? `Diese Woche kannst du noch ${rest} Münzen spenden.` : 'Für diese Woche hast du genug gespendet. Ab Montag geht es weiter.')}
          </p>
        </div>
      ) : (
        <p className="lq-klein" role="status">
          {danke ? `${danke} ` : ''}Gerade wird nichts gebaut. Deine Lehrkraft sucht das nächste Gebäude aus.
        </p>
      )}
      {d.fertig.length > 0 && (
        <ul className="lq-dorf-fertig">
          {[...d.fertig].reverse().map((f) => (
            <li key={f.gebaeude}>
              <strong>{gebaeudeName(f.gebaeude)}</strong>
              {f.belohnung && <span className="lq-klein">Belohnung: {f.belohnung}</span>}
              <span className="lq-klein">Gebaut von {f.stifter.length ? f.stifter.join(', ') : 'eurer Klasse'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
