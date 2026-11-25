// Klassendorf Teil B1 „Eigenes Haus“ (decided 25.11.2026) on the children's class page: the own plot with its house,
// the tent quiz that sets up the tent (zelt.ts) and the button for the next stage (HAUS_STUFEN, the server takes the
// coins). Shown inside the village box when the teacher unlocked the houses for the class.
import { useState } from 'react';
import { HAUS_STUFEN, hausAusbau, hausName, type Dorf } from '../dorf';
import { GRUND, HausEinzeln } from '../figuren/haeuser';
import { heldenstufe } from '../rules';
import { hausBauen, lqText } from '../server';
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
  if (!h?.an || h.ich === null) return null;
  const stufe = h.plaetze[h.ich]?.stufe ?? null;
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
      setFreude(ziel === 0 ? 'Dein Zelt steht! Jetzt kannst du es ausbauen.' : `Geschafft! Du hast jetzt ${MIT_ARTIKEL[ziel]}.`);
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
      {stufe === null ? (
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
          <HausBild stufe={stufe} />
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
                Dein Turmhaus ist fertig. Bald kannst du es schmücken.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** The own house alone on its plot (an empty staked plot before the tent). */
function HausBild({ stufe }: { stufe: number | null }) {
  return (
    <svg className="lq-haus-bild" viewBox={`-60 -120 120 150`} role="img" aria-label={stufe === null ? 'Dein leeres Grundstück' : `Dein Haus: ${hausName(stufe)}`}>
      {stufe === null ? <LeererPlatz /> : <HausEinzeln stufe={stufe} />}
    </svg>
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
