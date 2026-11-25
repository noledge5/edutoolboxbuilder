// Klassendorf Teil B1 „Eigenes Haus“ (decided 25.11.2026) on the children's class page: the own plot with its house,
// the tent quiz that sets up the tent (zelt.ts) and the button for the next stage (HAUS_STUFEN, the server takes the
// coins). Shown inside the village box when the teacher unlocked the houses for the class.
// Häuser gestalten (25.11.2026): „Haus gestalten“ opens the house large with one row of choices per part (AUSSEHEN);
// free and changeable any time, locked choices show from which stage they come.
import { useState } from 'react';
import { AUSSEHEN, AUSSEHEN_TEILE, aussehenVon, HAUS_STUFEN, hausAusbau, hausName, type Aussehen, type AussehenTeil, type Dorf } from '../dorf';
import { FARBMUSTER, GRUND, HausEinzeln } from '../figuren/haeuser';
import { heldenstufe } from '../rules';
import { hausBauen, hausGestalten, lqText } from '../server';
import type { Stand } from '../types';
import { ZELT_RICHTIG_AB, ZELT_RUNDE, zeltBestanden, zeltFragen, type ZeltFrage } from '../zelt';
import { Meldung, MuenzIcon, type Aktion } from './Held';
import { ton } from './ton';

/** The stages with their article, for „Du hast jetzt …“. */
const MIT_ARTIKEL = ['ein Zelt', 'eine Hütte', 'ein Holzhaus', 'ein Fachwerkhaus', 'ein Turmhaus'];

interface Props {
  dorf: Dorf;
  aktion: Aktion;
  stand: Stand;
  setStand: (s: Stand) => void;
  setDorf: (d: Dorf) => void;
}

export function MeinHaus({ dorf, aktion, stand, setStand, setDorf }: Props) {
  const h = dorf.haeuser;
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [sicher, setSicher] = useState(false);
  const [freude, setFreude] = useState('');
  const [gestalten, setGestalten] = useState(false);
  if (!h?.an || h.ich === null) return null;
  const platz = h.ich;
  const stufe = h.plaetze[platz]?.stufe ?? null;
  const aussehen = h.plaetze[platz]?.aussehen ?? null;
  // The server sends `aussehen` (maybe null) once 20261204_lernquest_haus_aussehen.sql is in; before that no button.
  const kannGestalten = stufe !== null && stufe >= 1 && !!h.plaetze[platz] && 'aussehen' in h.plaetze[platz];
  const held = heldenstufe(stand.xp).stufe;
  const next = hausAusbau(stufe, { muenzen: stand.muenzen, heldenstufe: held });

  const bauen = async (ziel: number) => {
    setBusy(true);
    setMsg('');
    try {
      const r = await aktion((t) => hausBauen(t, ziel));
      setDorf(r.dorf);
      setStand(r.stand);
      ton('fertig');
      setFreude(ziel === 0 ? 'Dein Zelt steht! Jetzt kannst du es ausbauen.' : `Geschafft! Du hast jetzt ${MIT_ARTIKEL[ziel]}. Mit „Haus gestalten“ machst du es zu deinem.`);
      setQuiz(false);
      setSicher(false);
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lq-haus">
      <div className="lq-zeile-zwischen">
        <h3>Mein Haus</h3>
        {stufe !== null && <strong>{hausName(stufe)}</strong>}
      </div>
      <Meldung text={msg} />
      {stufe !== null && gestalten && kannGestalten ? (
        <HausGestalten
          stufe={stufe}
          start={aussehenVon(aussehen, platz, stufe)}
          platz={platz}
          speichern={async (a) => {
            setMsg('');
            try {
              const r = await aktion((t) => hausGestalten(t, a));
              setDorf(r.dorf);
              ton('richtig');
              setFreude('Dein Haus sieht jetzt so aus. Schau es dir im Dorf an!');
              setGestalten(false);
            } catch (e) {
              setMsg(lqText(e));
            }
          }}
          abbrechen={() => setGestalten(false)}
        />
      ) : stufe === null ? (
        quiz ? (
          <ZeltQuiz busy={busy} aufstellen={() => void bauen(0)} abbrechen={() => setQuiz(false)} />
        ) : (
          <div className="lq-haus-zeile">
            <HausBild stufe={null} />
            <div className="lq-haus-text">
              <p className="lq-klein">
                Dein Grundstück ist noch leer. Stell dein Zelt auf: Beantworte {ZELT_RUNDE} Fragen, ab {ZELT_RICHTIG_AB} richtigen steht es.
              </p>
              <button type="button" className="lq-knopf" onClick={() => setQuiz(true)}>
                Zelt aufstellen
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="lq-haus-zeile">
          <HausBild stufe={stufe} aussehen={aussehen} platz={platz} />
          <div className="lq-haus-text">
            {freude && (
              <p className="lq-klein" role="status">
                {freude}
              </p>
            )}
            {next.geht || next.grund !== 'fertig' ? (
              <>
                <p className="lq-klein">
                  Als Nächstes: <b>{HAUS_STUFEN[next.stufe].name}</b> für {next.preis} Münzen
                  {HAUS_STUFEN[next.stufe].ab > 1 ? `, ab Heldenstufe ${HAUS_STUFEN[next.stufe].ab}` : ''}.
                </p>
                {next.geht ? (
                  sicher ? (
                    <div className="lq-dorf-knoepfe">
                      <button type="button" className="lq-knopf" disabled={busy} onClick={() => void bauen(next.stufe)}>
                        <MuenzIcon /> {next.preis} ausgeben
                      </button>
                      <button type="button" className="lq-knopf lq-hell" disabled={busy} onClick={() => setSicher(false)}>
                        Lieber nicht
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="lq-knopf" onClick={() => {
                        setSicher(true);
                        setFreude('');
                      }}
                    >
                      {HAUS_STUFEN[next.stufe].name} bauen
                    </button>
                  )
                ) : (
                  <p className="lq-klein" role="status">
                    {next.grund === 'stufe'
                      ? `Dafür brauchst du Heldenstufe ${next.ab}. Du bist auf Stufe ${held}.`
                      : `Dir fehlen noch ${next.preis - stand.muenzen} Münzen. Sammle sie beim Lernen.`}
                  </p>
                )}
              </>
            ) : (
              <p className="lq-klein" role="status">
                Dein Turmhaus ist fertig. Jetzt hast du die größte Auswahl zum Schmücken.
              </p>
            )}
            {kannGestalten ? (
              <button
                type="button"
                className="lq-knopf lq-hell"
                onClick={() => {
                  setGestalten(true);
                  setSicher(false);
                  setFreude('');
                }}
              >
                Haus gestalten
              </button>
            ) : (
              stufe === 0 && <p className="lq-klein">Ab der Hütte kannst du dein Haus gestalten: Farben, Zaun, Garten und mehr.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** The own house alone on its plot (an empty staked plot before the tent). */
function HausBild({ stufe, aussehen, platz }: { stufe: number | null; aussehen?: Aussehen | null; platz?: number }) {
  return (
    <svg className="lq-haus-bild" viewBox="-62 -126 124 164" role="img" aria-label={stufe === null ? 'Dein leeres Grundstück' : `Dein Haus: ${hausName(stufe)}`}>
      {stufe === null ? <LeererPlatz /> : <HausEinzeln stufe={stufe} aussehen={aussehen} platz={platz ?? 0} />}
    </svg>
  );
}

const FARBIG = new Set<AussehenTeil>(['dach', 'wand', 'tuer', 'fahne']);

/** „Haus gestalten“: the house large, below one row per part. Every tap shows the change at once; „Speichern“ sends
 *  it. Parts without a choice yet (the tent has only its flag) are left out, with one line on what comes next. */
function HausGestalten({
  stufe,
  start,
  platz,
  speichern,
  abbrechen,
}: {
  stufe: number;
  start: Aussehen;
  platz: number;
  speichern: (a: Aussehen) => Promise<void>;
  abbrechen: () => void;
}) {
  const [a, setA] = useState<Aussehen>(start);
  const [busy, setBusy] = useState(false);
  // Only parts with something to choose (the tent: its flag).
  const teile = AUSSEHEN_TEILE.filter((t) => AUSSEHEN[t].wahl.filter((w) => w.ab <= stufe).length > 1);
  const mehr = HAUS_STUFEN[stufe + 1];
  return (
    <div className="lq-gestalten">
      <HausBild stufe={stufe} aussehen={a} platz={platz} />
      {teile.map((t) => (
        <fieldset key={t} className="lq-gestalten-teil">
          <legend>{AUSSEHEN[t].name}</legend>
          <div className="lq-gestalten-wahl">
            {AUSSEHEN[t].wahl.map((w, k) => {
              const frei = w.ab <= stufe;
              return (
                <button
                  key={w.name}
                  type="button"
                  className="lq-wahl"
                  aria-pressed={a[t] === k}
                  disabled={!frei || busy}
                  onClick={() => setA({ ...a, [t]: k })}
                >
                  {FARBIG.has(t) && <span className="lq-muster" style={{ background: FARBMUSTER[t as 'dach'][k] }} aria-hidden />}
                  <span>{w.name}</span>
                  {!frei && <small>ab {HAUS_STUFEN[w.ab].name}</small>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {mehr && <p className="lq-klein">Mit {mehr.name === 'Hütte' ? 'der Hütte' : `dem ${mehr.name}`} kannst du noch mehr aussuchen.</p>}
      <div className="lq-dorf-knoepfe">
        <button
          type="button"
          className="lq-knopf"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await speichern(a);
            setBusy(false);
          }}
        >
          Speichern
        </button>
        <button type="button" className="lq-knopf lq-hell" disabled={busy} onClick={abbrechen}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function LeererPlatz() {
  const ecke = (x: number, y: number) => `${(x - y) * 0.866},${(x + y) * 0.5 - GRUND / 2}`;
  return (
    <polygon
      points={[ecke(0, 0), ecke(GRUND, 0), ecke(GRUND, GRUND), ecke(0, GRUND)].join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeDasharray="5 5"
      opacity={0.5}
    />
  );
}

/** ZELT_RUNDE random questions one by one; after each the reason; at the end set up the tent or try again. */
function ZeltQuiz({ busy, aufstellen, abbrechen }: { busy: boolean; aufstellen: () => void; abbrechen: () => void }) {
  const [fragen, setFragen] = useState<ZeltFrage[]>(() => zeltFragen());
  const [i, setI] = useState(0);
  const [wahl, setWahl] = useState<number | null>(null);
  const [richtig, setRichtig] = useState(0);
  const fertig = i >= fragen.length;

  if (fertig) {
    const ok = zeltBestanden(richtig);
    return (
      <div className="lq-haus-quiz" role="status">
        <p>
          <b>
            {richtig} von {fragen.length} richtig.
          </b>{' '}
          {ok ? 'Super, du weißt Bescheid!' : `Für das Zelt brauchst du ${ZELT_RICHTIG_AB}. Versuch es gleich noch einmal.`}
        </p>
        <div className="lq-dorf-knoepfe">
          {ok ? (
            <button type="button" className="lq-knopf" disabled={busy} onClick={aufstellen}>
              Zelt aufstellen
            </button>
          ) : (
            <button
              type="button"
              className="lq-knopf"
              onClick={() => {
                setFragen(zeltFragen());
                setI(0);
                setWahl(null);
                setRichtig(0);
              }}
            >
              Noch einmal
            </button>
          )}
          <button type="button" className="lq-knopf lq-hell" disabled={busy} onClick={abbrechen}>
            Später
          </button>
        </div>
      </div>
    );
  }

  const f = fragen[i];
  const antworten = (k: number) => {
    if (wahl !== null) return;
    setWahl(k);
    const r = k === f.richtig;
    if (r) setRichtig((n) => n + 1);
    ton(r ? 'richtig' : 'falsch');
  };
  return (
    <div className="lq-haus-quiz">
      <p className="lq-klein">
        Frage {i + 1} von {fragen.length}
      </p>
      <p>
        <b>{f.frage}</b>
      </p>
      <div className="lq-optionen">
        {f.optionen.map((o, k) => (
          <button
            key={k}
            type="button"
            className={`lq-option ${wahl === null ? '' : k === f.richtig ? 'ok' : k === wahl ? 'nein' : ''}`}
            aria-pressed={wahl === k}
            onClick={() => antworten(k)}
          >
            {o}
          </button>
        ))}
      </div>
      {wahl !== null && (
        <>
          <p className="lq-klein" role="status">
            {wahl === f.richtig ? 'Richtig! ' : 'Nicht ganz. '}
            {f.warum}
          </p>
          <button
            type="button"
            className="lq-knopf"
            onClick={() => {
              setI(i + 1);
              setWahl(null);
            }}
          >
            {i + 1 < fragen.length ? 'Weiter' : 'Auswerten'}
          </button>
        </>
      )}
    </div>
  );
}
