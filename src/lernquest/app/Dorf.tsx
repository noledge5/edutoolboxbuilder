// Klassendorf, Stufe 1 „Dorfkasse“ (decided 13.11.2026) on the children's class page: the village picture, the running
// project with its bar and buttons to donate coins (each counts 1.5 times, at most SPENDE_WOCHE a week), and the
// finished buildings with the names of all who helped, never amounts. Shown only when the teacher switched it on.
// Teil B1 (25.11.2026): with the houses unlocked, the map shows every child's house (own one marked „Du“, no names)
// and „Mein Haus“ (MeinHaus.tsx) sits below it.
// Richtung A (25.11.2026): the map in portrait, opening at the own house; evening and winter follow the clock; the
// village stage (Weiler … Stadt) in the header; what was built since the last visit pops up (remembered on the device).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DORF_STUFEN, dorfStufe, gebaeudeName, istAbend, istWinter, naechsteDorfStufe, SPENDE_WOCHE, spendeMoeglich, spendeWert, zeltLeer, type Dorf } from '../dorf';
import { JE_VIERTEL } from '../dorfplan';
import { DorfKarte, type DorfNeu } from '../figuren/dorf';
import { AvatarBild } from './avatar';
import { dorf as dorfLaden, lqText, spenden } from '../server';
import { heute, mitZahl, tagNummer } from '../rules';
import type { Avatar } from '../teile';
import type { Stand } from '../types';
import { Meldung, MuenzIcon, type Aktion } from './Held';
import { MeinHaus } from './MeinHaus';
import { ladeDorfGesehen, ladeSitzung, merkeDorfGesehen, type DorfGesehen } from './speicher';
import { ton } from './ton';

const BETRAEGE = [10, 25, 50];
/** „aus eurem Weiler wird ein Dorf“: the stages with their articles. */
const AUS = ['eurem Weiler', 'eurem Dorf', 'eurem Marktflecken', 'eurer Stadt'];
const WIRD = ['ein Weiler', 'ein Dorf', 'ein Marktflecken', 'eine Stadt'];

/** The buildings and plots that are new or higher than last time (nothing on the very first visit). */
export function dorfNeu(alt: DorfGesehen | null, jetzt: DorfGesehen): DorfNeu {
  if (!alt) return {};
  return {
    gebaeude: jetzt.fertig.filter((g) => !alt.fertig.includes(g)),
    haeuser: jetzt.haeuser.flatMap((s, i) => {
      const vorher = alt.haeuser[i];
      return s !== null && (vorher === null || vorher === undefined || s > vorher) ? [i] : [];
    }),
  };
}

export function DorfBox({
  aktion,
  stand,
  setStand,
  mitschueler = [],
  zeltStart = false,
  hausStart = false,
  onDorf,
}: {
  aktion: Aktion;
  stand: Stand;
  setStand: (s: Stand) => void;
  mitschueler?: Avatar[];
  /** From the fox's „Zum Zelt-Quiz“ (28.11.2026): an empty own plot opens „Mein Haus“ with the tent quiz at once. */
  zeltStart?: boolean;
  /** From the fox's „Zum Haus“: the own house opens as „Mein Haus“ at once. */
  hausStart?: boolean;
  /** Every new village state, so the app knows whether the fox still has to invite (zeltLeer). */
  onDorf?: (d: Dorf) => void;
}) {
  const [d, setD] = useState<Dorf | null>(null);
  // „Mein Haus“ as a dialog (28.11.2026): opened by tapping the own house on the map, or by the fox's tent button.
  const [haus, setHaus] = useState<{ zelt: boolean } | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [danke, setDanke] = useState('');
  const rahmen = useRef<HTMLDivElement>(null);
  const [jetzt] = useState(() => new Date());
  const kind = ladeSitzung()?.kind ?? '';
  const gesehen = useRef<DorfGesehen | null | undefined>(undefined);
  if (gesehen.current === undefined) gesehen.current = ladeDorfGesehen(kind);
  const gerollt = useRef(false);
  // Compared during render, so a new house never shows for a moment before it pops up.
  const jetztStand = useMemo<DorfGesehen | null>(() => (d?.an ? { fertig: d.fertig.map((f) => f.gebaeude), haeuser: d.haeuser?.an ? d.haeuser.plaetze.map((p) => p.stufe) : [] } : null), [d]);
  const neu = useMemo<DorfNeu>(() => (jetztStand ? dorfNeu(gesehen.current ?? null, jetztStand) : {}), [jetztStand]);

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

  // What was built since the last look pops up (other children's houses too); then the new state is remembered.
  useEffect(() => {
    if (!jetztStand) return;
    gesehen.current = jetztStand;
    merkeDorfGesehen(kind, jetztStand);
  }, [jetztStand, kind]);

  useEffect(() => {
    aktion(dorfLaden).then(setD, () => setD(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The app hears every new state; the fox's invitation opens the tent quiz once, if the plot is still empty.
  const zeltGeoeffnet = useRef(false);
  useEffect(() => {
    if (!d) return;
    onDorf?.(d);
    if (!zeltGeoeffnet.current && ((zeltStart && zeltLeer(d)) || (hausStart && d.haeuser?.an && d.haeuser.ich !== null && !zeltLeer(d)))) {
      zeltGeoeffnet.current = true;
      setHaus({ zelt: zeltLeer(d) });
    }
    // onDorf is new on every render of the app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, zeltStart, hausStart]);

  // Escape closes the dialog.
  useEffect(() => {
    if (!haus) return;
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && setHaus(null);
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [haus]);

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
      setDanke(r.dorf.projekt ? (m === 1 ? `Danke! Deine Münze zählt ${spendeWert(m)}.` : `Danke! Deine ${m} Münzen zählen ${spendeWert(m)}.`) : `Geschafft! ${gebaeudeName(p.gebaeude)} steht im Dorf.`);
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
          held={<AvatarBild avatar={{ ...stand.avatar, hintergrund: '' }} lebendig />}
          wanderer={unterwegs(mitschueler, heute()).map((a, i) => (
            <AvatarBild key={i} avatar={{ ...a, hintergrund: '' }} />
          ))}
          onIch={haeuser && haeuser.ich !== null ? () => setHaus({ zelt: zeltLeer(d) }) : undefined}
        />
      </div>
      {haeuser && haeuser.ich !== null && <p className="lq-klein lq-dorf-tipp">Tippe auf dein Haus, um es anzusehen und auszubauen.</p>}
      {haus &&
        typeof document !== 'undefined' &&
        // On the body, so no page around it (scrolling, an animation) can hold the fixed dialog in place.
        createPortal(
          <div className="lq-dialog-grund" role="dialog" aria-modal="true" aria-labelledby="lq-haus-dialog-titel" onClick={(e) => e.target === e.currentTarget && setHaus(null)}>
            <div className="lq-dialog lq-haus-dialog">
              <MeinHaus dorf={d} aktion={aktion} stand={stand} setStand={setStand} setDorf={setD} zeltStart={haus.zelt} titelId="lq-haus-dialog-titel" />
              <button type="button" className="lq-knopf lq-hell" onClick={() => setHaus(null)}>
                Schließen
              </button>
            </div>
          </div>,
          document.body,
        )}
      <p className="lq-klein lq-dorf-stufe">
        {naechste ? `Noch ${naechste.fehlt === 1 ? '1 Gebäude' : `${naechste.fehlt} Gebäude`}, dann wird aus ${AUS[stufe]} ${WIRD[stufe + 1]}.` : 'Ihr habt zusammen eine Stadt gebaut!'}
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
          <p className="lq-klein">Jede Münze für das Dorf zählt 1,5-fach. {p.helfer === 1 ? '1 Kind hat schon geholfen.' : p.helfer > 1 ? `${p.helfer} Kinder haben schon geholfen.` : ''}</p>
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
            {danke || (rest > 0 ? `Diese Woche kannst du noch ${mitZahl(rest, 'Münze', 'Münzen')} spenden.` : 'Für diese Woche hast du genug gespendet. Ab Montag geht es weiter.')}
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

/** Up to four classmates on the road today: a different few each day, the same all day long. */
function unterwegs(mitschueler: Avatar[], tag: string): Avatar[] {
  if (mitschueler.length <= 4) return mitschueler;
  const start = tagNummer(tag) % mitschueler.length;
  return Array.from({ length: 4 }, (_, i) => mitschueler[(start + i * 3) % mitschueler.length]);
}
