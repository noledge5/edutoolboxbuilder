// Open exercises from a public link (`#probe=<id>`, `probe.ts`): stations and a mixed test, without signing in and
// without the server. Same rounds, formats and feedback as Lernquest; progress only in this browser, no names, no
// experience, coins or chests.
import { useState } from 'react';
import { ladeProbe, probeTest, PROBEN, schwachePunkte, speichereProbe, stationPaket, type ProbeStand } from '../probe';
import { rundenGeschafft, rundenZahl, rundeVon, sterne } from '../rules';
import { LEERER_STAND, type Paket, type Uebung } from '../types';
import { HakenIcon, Runde, Sterne, SternIcon, type Screen } from './LernquestApp';
import { ton } from './ton';

type Item = { u: Uebung; stunde: string };
type ProbeScreen =
  | { kind: 'karte' }
  | Extract<Screen, { kind: 'runde' }>
  | { kind: 'ergebnis'; station: number; richtig: number; gesamt: number; vorher: number; jetzt: number }
  | { kind: 'test-ergebnis'; richtig: number; gesamt: number; schwach: string[]; falsch: Item[] };

const TEST = 'test';

export function ProbeApp({ id }: { id: string }) {
  const p = PROBEN[id];
  const [stand, setStand] = useState<ProbeStand>(() => ladeProbe(id));
  const [screen, setScreen] = useState<ProbeScreen>({ kind: 'karte' });

  if (!p) {
    return (
      <main className="lq-app lq-ergebnis">
        <h1>Diese Übung gibt es nicht.</h1>
        <p className="lq-untertitel">Prüfe den Link, den du bekommen hast.</p>
      </main>
    );
  }

  const pakete = p.stationen.map((_, i) => stationPaket(p, i));
  const runden = (pk: Paket) => rundenZahl(pk.uebungen.length);
  const sterneVon = (pk: Paket) => sterne(stand.bestwerte[pk.stunde], runden(pk));
  const naechste = (pk: Paket) => {
    const best = stand.bestwerte[pk.stunde] ?? [];
    const offen = Array.from({ length: runden(pk) }, (_, i) => i).find((i) => !(best[i] > 0));
    if (offen !== undefined) return offen;
    // All played: the round with the lowest best value.
    return best.slice(0, runden(pk)).reduce((m, x, i, a) => (x < a[m] ? i : m), 0);
  };
  const starte = (pk: Paket, r = naechste(pk)) => setScreen({ kind: 'runde', stunde: pk.stunde, runde: r, uebungen: rundeVon(pk.uebungen, r).map((u) => ({ u, stunde: pk.stunde })) });
  const testStarten = (items = probeTest(p, Date.now().toString(36))) => setScreen({ kind: 'runde', stunde: TEST, runde: 0, uebungen: items });
  const merke = (s: ProbeStand) => {
    setStand(s);
    speichereProbe(id, s);
  };

  if (screen.kind === 'runde') {
    const station = pakete.findIndex((x) => x.stunde === screen.stunde);
    return (
      <Runde
        screen={screen}
        stand={LEERER_STAND}
        herzen={3}
        titel={screen.stunde === TEST ? 'Probetest · alles gemischt' : `Station ${station + 1} · ${pakete[station]?.titel ?? ''}`}
        onAbbruch={() => setScreen({ kind: 'karte' })}
        paketVon={(st) => pakete.find((x) => x.stunde === st)}
        onFertig={(stunde, runde, ergebnisse) => {
          ton('fertig');
          const richtig = ergebnisse.filter(Boolean).length;
          const prozent = Math.round((100 * richtig) / Math.max(1, ergebnisse.length));
          if (stunde === TEST) {
            const liste = screen.uebungen.map((x, i) => ({ ...x, richtig: ergebnisse[i] ?? false }));
            // Practising the mistakes again does not count as a test.
            if (screen.uebungen.length >= 10) merke({ ...stand, test: Math.max(stand.test ?? 0, prozent) });
            setScreen({ kind: 'test-ergebnis', richtig, gesamt: ergebnisse.length, schwach: schwachePunkte(p, liste), falsch: liste.filter((x) => !x.richtig).map(({ u, stunde: st }) => ({ u, stunde: st })) });
            return;
          }
          const pk = pakete[station];
          const vorher = sterneVon(pk);
          const best = [...(stand.bestwerte[stunde] ?? [])];
          while (best.length <= runde) best.push(0);
          best[runde] = Math.max(best[runde], prozent);
          const neu = { ...stand, bestwerte: { ...stand.bestwerte, [stunde]: best } };
          merke(neu);
          setScreen({ kind: 'ergebnis', station, richtig, gesamt: ergebnisse.length, vorher, jetzt: sterne(best, runden(pk)) });
        }}
      />
    );
  }

  if (screen.kind === 'ergebnis') {
    const pk = pakete[screen.station];
    const fertig = (stand.bestwerte[pk.stunde] ?? []).slice(0, runden(pk)).filter((x) => x > 0).length >= runden(pk);
    return (
      <main className="lq-app lq-ergebnis">
        <Sterne n={screen.jetzt} neu={screen.jetzt > screen.vorher} gross />
        <h1>{screen.richtig === screen.gesamt ? 'Perfekt!' : fertig && screen.vorher === 0 ? 'Station geschafft!' : 'Runde geschafft!'}</h1>
        <p className="lq-untertitel">
          {pk.titel} · {screen.richtig} von {screen.gesamt} richtig
        </p>
        <div className="lq-platz" />
        <button type="button" className="lq-knopf" onClick={() => starte(pk)}>
          {fertig ? 'Nochmal üben' : 'Nächste Runde'}
        </button>
        <button type="button" className="lq-knopf lq-hell" onClick={() => setScreen({ kind: 'karte' })}>
          Zur Übersicht
        </button>
      </main>
    );
  }

  if (screen.kind === 'test-ergebnis') {
    const prozent = Math.round((100 * screen.richtig) / Math.max(1, screen.gesamt));
    return (
      <main className="lq-app lq-ergebnis">
        <h1>{prozent >= 90 ? 'Super – du bist bereit!' : prozent >= 70 ? 'Gut gemacht!' : 'Weiter üben lohnt sich!'}</h1>
        <p className="lq-untertitel">
          {screen.richtig} von {screen.gesamt} richtig ({prozent} %)
        </p>
        {screen.schwach.length > 0 && (
          <div className="lq-hinweis-gold">
            <strong>Übe noch:</strong>
            <span>{screen.schwach.join(', ')}</span>
          </div>
        )}
        <div className="lq-platz" />
        {screen.falsch.length > 0 && (
          <button type="button" className="lq-knopf" onClick={() => testStarten(screen.falsch)}>
            Fehler nochmal üben
          </button>
        )}
        <button type="button" className="lq-knopf lq-hell" onClick={() => testStarten()}>
          Neuer Probetest
        </button>
        <button type="button" className="lq-knopf lq-hell" onClick={() => setScreen({ kind: 'karte' })}>
          Zur Übersicht
        </button>
      </main>
    );
  }

  const aktuell = pakete.findIndex((pk) => sterneVon(pk) === 0);
  return (
    <main className="lq-app lq-probe">
      <header className="lq-probe-kopf">
        <span className="lq-kicker">{p.fach} · ohne Anmeldung</span>
        <h1>{p.titel}</h1>
        <p>{p.untertitel}</p>
      </header>
      <section className="lq-region">
        <div className="lq-region-band">
          <span>{p.fach}</span>
          <h2>Stationen</h2>
        </div>
        <ol className="lq-pfad">
          {pakete.map((pk, i) => {
            const n = sterneVon(pk);
            const zustand = n > 0 ? 'erledigt' : i === aktuell ? 'aktuell' : 'offen';
            return (
              <li key={pk.stunde} className={`lq-versatz-${['0', 'l', '0', 'r'][i % 4]}${zustand === 'aktuell' ? ' mit-blase' : ''}`}>
                {zustand === 'aktuell' && <span className="lq-blase">Los geht’s!</span>}
                <button type="button" className={`lq-knoten ${zustand}`} aria-label={`Station ${i + 1}: ${pk.titel}`} onClick={() => starte(pk)}>
                  {zustand === 'erledigt' ? <HakenIcon /> : zustand === 'aktuell' ? <SternIcon /> : <span className="lq-knoten-nr">{i + 1}</span>}
                </button>
                <span className="lq-knoten-titel">{pk.titel}</span>
                {n > 0 && <Sterne n={n} />}
                {n === 0 && rundenGeschafft(stand.bestwerte[pk.stunde], runden(pk)) > 0 && (
                  <span className="lq-klein">
                    {rundenGeschafft(stand.bestwerte[pk.stunde], runden(pk))} von {runden(pk)} Runden
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      <section className="lq-box lq-probe-test">
        <h2>Probetest</h2>
        <p>{`${Math.min(16, pakete.reduce((s, pk) => s + pk.uebungen.length, 0))} Aufgaben aus allen Stationen, gemischt – wie in der Klassenarbeit.`}</p>
        {stand.test !== null && <p className="lq-klein">Dein bestes Ergebnis: {stand.test} %</p>}
        <button type="button" className="lq-knopf lq-gold" onClick={() => testStarten()}>
          Probetest starten
        </button>
      </section>
      <p className="lq-klein lq-mitte">Ohne Anmeldung und ohne Namen: Dein Fortschritt bleibt nur auf diesem Gerät.</p>
    </main>
  );
}
