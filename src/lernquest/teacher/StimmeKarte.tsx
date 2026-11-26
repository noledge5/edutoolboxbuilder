// The card „Vorlesen mit guter Stimme“ on the teacher page (26.11.2026): the Google key of this device, a test sentence
// and what the recording did. Recording happens by itself when a station is sent (senden.ts, ExtraPakete.tsx).
import { useState, useSyncExternalStore } from 'react';
import { aufnehmen, googleSchluessel, googleSchluesselSetzen, StimmeFehler, tonStand, tonStandHoeren } from './stimme';

const PROBE = 'Hello! Listen carefully and choose the right answer.';

export function StimmeKarte({ busy }: { busy: boolean }) {
  const [schluessel, setSchluessel] = useState(googleSchluessel);
  const [eingabe, setEingabe] = useState('');
  // '' nothing, 'laeuft' recording, 'data:…' the recording to play, else an error message.
  const [probe, setProbe] = useState('');
  const s = useSyncExternalStore(tonStandHoeren, tonStand, tonStand);

  const probeHoeren = async () => {
    setProbe('laeuft');
    try {
      // Shown as a player: an iPad plays sound only from a tap, and this one comes after Google's answer.
      setProbe(`data:audio/mpeg;base64,${await aufnehmen(schluessel, PROBE)}`);
    } catch (e) {
      setProbe(e instanceof StimmeFehler ? e.message : 'Die Probe ließ sich nicht abspielen.');
    }
  };

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Vorlesen mit guter Stimme</h2>
          <p className="lqt-hint">
            Englische Sätze und Wörter hören die Kinder dann in einer aufgenommenen britischen Stimme, auf jedem Gerät gleich, statt mit der Stimme ihres Handys. Die Aufnahmen
            macht Google, wenn du eine Station freischaltest oder „Freigeschaltete neu senden“ drückst; fehlende Sätze werden dabei nachgeholt. Der Schlüssel bleibt nur auf
            diesem Gerät. Ohne Schlüssel oder Aufnahme liest wie bisher das Gerät vor.
          </p>
        </div>
      </div>
      {schluessel ? (
        <div className="lqt-row-actions">
          <span className="lqt-hint">Google-Schlüssel ist auf diesem Gerät gespeichert.</span>
          <button type="button" className="btn btn-secondary ui-btn is-small" disabled={probe === 'laeuft'} onClick={() => void probeHoeren()}>
            Probe anhören
          </button>
          <button
            type="button"
            className="btn btn-secondary ui-btn is-small"
            disabled={busy}
            onClick={() => {
              googleSchluesselSetzen('');
              setSchluessel('');
              setProbe('');
            }}
          >
            Schlüssel entfernen
          </button>
        </div>
      ) : (
        <form
          className="lqt-row-actions"
          onSubmit={(e) => {
            e.preventDefault();
            googleSchluesselSetzen(eingabe);
            setSchluessel(googleSchluessel());
            setEingabe('');
          }}
        >
          <input
            className="input"
            type="password"
            autoComplete="off"
            placeholder="Google-Schlüssel (beginnt mit AIza)"
            aria-label="Google-Schlüssel für die Stimme"
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
          />
          <button type="submit" className="btn btn-primary ui-btn is-small" disabled={!eingabe.trim()}>
            Speichern
          </button>
        </form>
      )}
      {probe.startsWith('data:') && (
        <p className="lqt-hint">
          So klingt die Stimme für die Kinder: <audio controls autoPlay src={probe} />
        </p>
      )}
      {probe && !probe.startsWith('data:') && probe !== 'laeuft' && (
        <p className="lqt-error" role="alert">
          {probe}
        </p>
      )}
      {s.laeuft && (
        <p className="lqt-hint" role="status">
          Aufnahmen: {s.fertig} von {s.gesamt} …
        </p>
      )}
      {!s.laeuft && s.fertig > 0 && <p className="lqt-hint">{s.fertig} Sätze und Wörter neu aufgenommen.</p>}
      {s.fehler && (
        <p className="lqt-error" role="alert">
          {s.fehler}
        </p>
      )}
    </section>
  );
}
