// Klassendorf, Stufe 1 „Dorfkasse“ (decided 13.11.2026) on the children's class page: the village picture, the running
// project with its bar and buttons to donate coins (each counts 1.5 times, at most SPENDE_WOCHE a week), and the
// finished buildings with the names of all who helped, never amounts. Shown only when the teacher switched it on.
// Teil B1 (25.11.2026): with the houses unlocked, the map shows every child's house (own one marked „Du“, no names)
// and „Mein Haus“ (MeinHaus.tsx) sits below it.
// Richtung A (25.11.2026): the map in portrait, opening at the own house; evening and winter follow the clock; the
// village stage (Weiler … Stadt) in the header; what was built since the last visit pops up (remembered on the device).
import { useEffect, useRef, useState } from 'react';
import { DORF_STUFEN, dorfStufe, gebaeudeName, istAbend, istWinter, naechsteDorfStufe, SPENDE_WOCHE, spendeMoeglich, spendeWert, type Dorf } from '../dorf';
import { JE_VIERTEL } from '../dorfplan';
import { DorfKarte, type DorfNeu } from '../figuren/dorf';
import { dorf as dorfLaden, lqText, spenden } from '../server';
import type { Stand } from '../types';
import { Meldung, MuenzIcon, type Aktion } from './Held';
import { MeinHaus } from './MeinHaus';
import { ton } from './ton';

const BETRAEGE = [10, 25, 50];
/** „aus eurem Weiler wird ein Dorf“: the stages with their articles. */
const AUS = ['eurem Weiler', 'eurem Dorf', 'eurem Marktflecken', 'eurer Stadt'];
const WIRD = ['ein Weiler', 'ein Dorf', 'ein Marktflecken', 'eine Stadt'];

/** What the child saw last time on this device: finished buildings and the stage of each plot. */
interface Gesehen {
  fertig: string[];
  haeuser: (number | null)[];
}
const GESEHEN = 'lq-dorf-gesehen';
function gesehenLesen(): Gesehen | null {
  try {
    const g = JSON.parse(localStorage.getItem(GESEHEN) ?? 'null') as Gesehen | null;
    return g && Array.isArray(g.fertig) && Array.isArray(g.haeuser) ? g : null;
  } catch {
    return null;
  }
}
function gesehenMerken(g: Gesehen) {
  try {
    localStorage.setItem(GESEHEN, JSON.stringify(g));
  } catch {
    // Private mode: nothing pops next time, that is all.
  }
}
/** The buildings and plots that are new or higher than last time (nothing on the very first visit). */
export function dorfNeu(alt: Gesehen | null, jetzt: Gesehen): DorfNeu {
  if (!alt) return {};
  return {
    gebaeude: jetzt.fertig.filter((g) => !alt.fertig.includes(g)),
    haeuser: jetzt.haeuser.flatMap((s, i) => {
      const vorher = alt.haeuser[i];
      return s !== null && (vorher === null || vorher === undefined || s > vorher) ? [i] : [];
    }),
  };
}

export function DorfBox({ aktion, stand, setStand }: { aktion: Aktion; stand: Stand; setStand: (s: Stand) => void }) {
  const [d, setD] = useState<Dorf | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [danke, setDanke] = useState('');
  const rahmen = useRef<HTMLDivElement>(null);
  const [jetzt] = useState(() => new Date());
  const [neu, setNeu] = useState<DorfNeu>({});
  const gesehen = useRef<Gesehen | null | undefined>(undefined);
  const gerollt = useRef(false);

  // The map is taller than a phone: open it at the own plot (marked „Du“), else at the square at the bottom.
  useEffect(() => {
    const r = rahmen.current;
    if (!r || !d?.an || gerollt.current) return;
    gerollt.current = true;
    const du = r.querySelector('[data-ich]');
    if (!du) {
      r.scrollTop = r.scrollHeight;
      return;
    }
    const a = r.getBoundingClientRect();
    const b = du.getBoundingClientRect();
    r.scrollTop += b.top + b.height / 2 + 40 - (a.top + a.height / 2);
  }, [d]);

  // Pop up what was built since the last look (other children's houses too), then remember the new state.
  useEffect(() => {
    if (!d?.an) return;
    if (gesehen.current === undefined) gesehen.current = gesehenLesen();
    const stand = { fertig: d.fertig.map((f) => f.gebaeude), haeuser: d.haeuser?.an ? d.haeuser.plaetze.map((p) => p.stufe) : [] };
    setNeu(dorfNeu(gesehen.current, stand));
    gesehen.current = stand;
    gesehenMerken(stand);
  }, [d]);

  useEffect(() => {
    aktion(dorfLaden).then(setD, () => setD(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!d?.an) return null;
  const p = d.projekt;
  const woche = d.woche ?? 0;
  const rest = Math.max(0, SPENDE_WOCHE - woche);
  const haeuser = d.haeuser?.an ? d.haeuser : null;
  const gebaeude = new Set(d.fertig.map((f) => f.gebaeude)).size;
  const stufe = dorfStufe(gebaeude);
  const naechste = naechsteDorfStufe(gebaeude);

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
        <strong>{DORF_STUFEN[stufe].name}</strong>
      </div>
      <div className="lq-dorf-rahmen" ref={rahmen}>
        <DorfKarte
          fertig={d.fertig.map((f) => f.gebaeude)}
          baustelle={p?.gebaeude}
          plaetze={haeuser ? haeuser.plaetze.length : JE_VIERTEL}
          haeuser={haeuser?.plaetze}
          ich={haeuser?.ich}
          hinweis={haeuser ? undefined : 'Bald: eure Häuser'}
          titel={`Euer ${DORF_STUFEN[stufe].name} mit ${d.fertig.map((f) => gebaeudeName(f.gebaeude)).join(', ') || 'noch keinem Gebäude'}`}
          abend={istAbend(jetzt)}
          winter={istWinter(jetzt)}
          neu={neu}
        />
      </div>
      <p className="lq-klein lq-dorf-stufe">
        {naechste
          ? `Noch ${naechste.fehlt === 1 ? '1 Gebäude' : `${naechste.fehlt} Gebäude`}, dann wird aus ${AUS[stufe]} ${WIRD[stufe + 1]}.`
          : 'Ihr habt zusammen eine Stadt gebaut!'}
      </p>
      <Meldung text={msg} />
      <MeinHaus dorf={d} aktion={aktion} stand={stand} setStand={setStand} setDorf={setD} />
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
