// Lernquest for the children (…/lernquest/#<Klassencode>): sign in with the class list and a PIN, then the world map
// (subject → module regions → lesson stations), rounds of short exercises, experience, stars, the weekly goal and
// „Wiederholen“. Works on a phone held upright first; offline with what was loaded last.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QrScanner } from '../../sync/QrScanner';
import { codeAus, faecherVon, namensFarbe, regionenVon, vorname, wochenTage, type Station } from '../karte';
import {
  faellig,
  heldenstufe,
  heute,
  istRichtig,
  karteKey,
  karteNach,
  loesungText,
  rundeAnwenden,
  rundenZahl,
  rundeVon,
  RUNDE_MAX,
  sterne,
  tagNummer,
  titel,
  woche,
  WOCHENZIEL,
  type Antwort,
} from '../rules';
import { abmelden, anmelden, klasseOeffnen, LqError, lqText, meinStand, rundeMelden, type KlasseOffen } from '../server';
import { readPaket } from '../paket';
import type { Paket, Stand, Uebung } from '../types';
import { allesWeg, ladeDaten, ladeSitzung, ladeWarteschlange, setzeTon, speichereDaten, speichereSitzung, speichereWarteschlange, tonAn, type Daten, type Meldung, type Sitzung } from './speicher';
import { ton } from './ton';
import { Rich, UebungView } from './Uebungen';

type Screen =
  | { kind: 'karte' }
  | { kind: 'station'; stunde: string }
  | { kind: 'wiederholen' }
  | {
      kind: 'runde';
      stunde: string;
      runde: number;
      uebungen: { u: Uebung; stunde: string }[];
    }
  | {
      kind: 'ergebnis';
      stunde: string;
      richtig: number;
      gesamt: number;
      plus: number;
      sterneVorher: number;
      sterneJetzt: number;
    };

const codeFromUrl = () => {
  const h = location.hash.replace(/^#\/?/, '');
  return /^[0-9A-Za-z]{8}$/.test(h) ? h.toUpperCase() : '';
};

export function LernquestApp() {
  const [sitzung, setSitzung] = useState<Sitzung | null>(ladeSitzung);
  const [daten, setDaten] = useState<Daten | null>(ladeDaten);
  const [hinweis, setHinweis] = useState('');

  const signOut = useCallback((msg = '') => {
    const s = ladeSitzung();
    if (s) void abmelden(s.token).catch(() => {});
    allesWeg();
    setSitzung(null);
    setDaten(null);
    setHinweis(msg);
  }, []);

  if (!sitzung) {
    return (
      <Anmeldung
        hinweis={hinweis}
        onDone={(s) => {
          speichereSitzung(s);
          setSitzung(s);
          setHinweis('');
        }}
      />
    );
  }
  return <Spiel sitzung={sitzung} daten={daten} setDaten={setDaten} onSignOut={signOut} />;
}

// — Sign in —

function Anmeldung({ hinweis, onDone }: { hinweis: string; onDone: (s: Sitzung) => void }) {
  const [code, setCode] = useState(codeFromUrl);
  const [klasse, setKlasse] = useState<KlasseOffen | null>(null);
  const [kind, setKind] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState(hinweis);
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState(false);

  const open = useCallback(async (c: string) => {
    setBusy(true);
    setMsg('');
    try {
      setKlasse(await klasseOeffnen(c));
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (code.length === 8 && !klasse) void open(code);
    // Only for a code from the link on the first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryPin = async (p: string) => {
    if (!kind) return;
    setBusy(true);
    try {
      const r = await anmelden(code, kind.id, p);
      if (r.ok) return onDone({ code, kind: kind.id, name: kind.name, token: r.token });
      ton('falsch');
      setPin('');
      setMsg(r.gesperrt ? 'Das Konto ist gesperrt. Deine Lehrkraft kann es wieder freigeben.' : `Falsche PIN. Noch ${r.rest} ${r.rest === 1 ? 'Versuch' : 'Versuche'}.`);
    } catch (e) {
      setPin('');
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const digit = (d: string) => {
    if (busy || pin.length >= 4) return;
    ton('tipp');
    const p = pin + d;
    setPin(p);
    if (p.length === 4) void tryPin(p);
  };

  const back = (
    <button
      type="button"
      className="lq-zurueck"
      aria-label="Zurück"
      onClick={() => {
        if (kind) {
          setKind(null);
          setPin('');
        } else setKlasse(null);
        setMsg('');
      }}
    >
      <Pfeil />
    </button>
  );

  const fehler = msg && (
    <p className="lq-meldung" role="alert">
      {msg}
    </p>
  );

  if (!klasse) {
    return (
      <main className="lq-app lq-start">
        <div className="lq-start-kopf">
          <Wappen />
          <h1 className="lq-logo">Lernquest</h1>
          <p className="lq-tagline">
            Üben, was ihr im Unterricht hattet –<br />
            und dabei stärker werden.
          </p>
        </div>
        {scan ? (
          <div className="lq-scan">
            <QrScanner
              onText={(t) => {
                const c = codeAus(t);
                if (!c) return;
                setScan(false);
                setCode(c);
                void open(c);
              }}
              onError={(m) => {
                setScan(false);
                setMsg(m);
              }}
            />
            <button type="button" className="lq-knopf lq-hell" onClick={() => setScan(false)}>
              Abbrechen
            </button>
          </div>
        ) : (
          <button type="button" className="lq-knopf" onClick={() => setScan(true)}>
            <ScanIcon />
            Klassen-QR scannen
          </button>
        )}
        <div className="lq-oder">
          <span />
          oder Klassencode
          <span />
        </div>
        <form
          className="lq-code-form"
          onSubmit={(e) => {
            e.preventDefault();
            void open(code);
          }}
        >
          <label htmlFor="lq-code">Klassencode von deiner Lehrkraft</label>
          <input
            id="lq-code"
            className="lq-code"
            value={code}
            maxLength={9}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^0-9A-Z]/g, '')
                  .slice(0, 8),
              )
            }
            placeholder="z. B. K7QF9MXA"
          />
          <button className="lq-knopf lq-hell" disabled={code.length !== 8 || busy}>
            Weiter
          </button>
        </form>
        {fehler}
      </main>
    );
  }

  if (!kind) {
    return (
      <main className="lq-app lq-namen-seite">
        <div className="lq-titelzeile">
          {back}
          <div>
            <span className="lq-kicker">{klasse.name}</span>
            <h2>Wer bist du?</h2>
          </div>
        </div>
        <div className="lq-namen">
          {klasse.kinder.map((k) => (
            <button
              key={k.id}
              type="button"
              className="lq-name"
              onClick={() => {
                setKind(k);
                setMsg('');
              }}
            >
              <Initiale name={k.name} />
              {k.name}
            </button>
          ))}
        </div>
        <p className="lq-klein lq-mitte">Dein Name fehlt? Sag deiner Lehrkraft Bescheid.</p>
        {fehler}
      </main>
    );
  }

  return (
    <main className="lq-app lq-pin-seite">
      {back}
      <div className="lq-hallo">
        <Initiale name={kind.name} gross />
        <h2>Hallo {vorname(kind.name)}!</h2>
        <p>Gib deine 4-stellige PIN ein.</p>
      </div>
      <div className="lq-pin" aria-live="polite" aria-label={`${pin.length} von 4 Ziffern`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'voll' : ''} />
        ))}
      </div>
      {fehler}
      <div className="lq-platz" />
      <div className="lq-ziffern">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
          d === '' ? (
            <span key={i} />
          ) : (
            <button key={i} type="button" className="lq-ziffer" disabled={busy} aria-label={d === '⌫' ? 'Löschen' : d} onClick={() => (d === '⌫' ? setPin(pin.slice(0, -1)) : digit(d))}>
              {d === '⌫' ? <LoeschIcon /> : d}
            </button>
          ),
        )}
      </div>
      <p className="lq-klein lq-mitte">PIN vergessen? Deine Lehrkraft kann sie neu setzen.</p>
    </main>
  );
}

// — Playing —

interface SpielProps {
  sitzung: Sitzung;
  daten: Daten | null;
  setDaten: (d: Daten) => void;
  onSignOut: (msg?: string) => void;
}

function Spiel({ sitzung, daten, setDaten, onSignOut }: SpielProps) {
  const [screen, setScreen] = useState<Screen>({ kind: 'karte' });
  const [offline, setOffline] = useState(false);
  const [fach, setFach] = useState('');
  const datenRef = useRef(daten);
  datenRef.current = daten;

  const store = useCallback(
    (d: Daten) => {
      datenRef.current = d;
      speichereDaten(d);
      setDaten(d);
    },
    [setDaten],
  );

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof LqError && (e.code === 'sitzung' || e.code === 'gesperrt')) onSignOut(lqText(e));
      else if (e instanceof TypeError) setOffline(true);
    },
    [onSignOut],
  );

  /** The send going on: a second call waits for it, so no round is sent twice. */
  const sending = useRef<Promise<void> | null>(null);

  /** Sends rounds played offline; the server's Spielstand wins after the last one. */
  const flush = useCallback((): Promise<void> => {
    const run = async () => {
      await sending.current?.catch(() => {});
      await send();
    };
    const p = run();
    sending.current = p;
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitzung.token, store, fail]);

  const send = async () => {
    let queue = ladeWarteschlange();
    while (queue.length) {
      const m = queue[0];
      try {
        const r = await rundeMelden(sitzung.token, m.stunde, m.runde, m.richtig, m.gesamt, m.leitner);
        queue = queue.slice(1);
        speichereWarteschlange(queue);
        const d = datenRef.current;
        if (!queue.length && d) store({ ...d, stand: r.stand });
      } catch (e) {
        // A round of a lesson locked meanwhile: the server refuses it, it is dropped.
        if (e instanceof LqError && e.code === 'ungueltig') {
          queue = queue.slice(1);
          speichereWarteschlange(queue);
          continue;
        }
        fail(e);
        return;
      }
    }
  };

  const laden = useCallback(async () => {
    try {
      await flush();
      const d = datenRef.current;
      const r = await meinStand(sitzung.token, d?.seit ?? null);
      const pakete: Record<string, Paket> = {};
      for (const s of r.stunden) if (d?.pakete[s]) pakete[s] = d.pakete[s];
      for (const p of r.pakete) {
        const paket = readPaket(p.daten);
        if (paket) pakete[p.stunde] = paket;
      }
      const stand = ladeWarteschlange().length && d ? d.stand : r.stand;
      store({ name: r.name, klasse: r.klasse, stand, pakete, seit: r.jetzt });
      setOffline(false);
    } catch (e) {
      fail(e);
    }
  }, [sitzung.token, flush, store, fail]);

  useEffect(() => {
    void laden();
    const again = () => document.visibilityState === 'visible' && void laden();
    window.addEventListener('online', again);
    document.addEventListener('visibilitychange', again);
    return () => {
      window.removeEventListener('online', again);
      document.removeEventListener('visibilitychange', again);
    };
  }, [laden]);

  const stand = daten?.stand;
  const pakete = useMemo(() => Object.values(daten?.pakete ?? {}), [daten]);

  if (!daten || !stand) {
    return (
      <main className="lq-app lq-login">
        <h1 className="lq-logo">Lernquest</h1>
        <p className="lq-meldung">{offline ? 'Keine Verbindung zum Server. Prüfe das Internet.' : 'Lädt …'}</p>
      </main>
    );
  }

  /** A round is over: shown at once, sent now or later. */
  const fertig = (stunde: string, runde: number, ergebnisse: boolean[], leitner: Stand['leitner']) => {
    const m: Meldung = {
      stunde,
      runde,
      richtig: ergebnisse.filter(Boolean).length,
      gesamt: ergebnisse.length,
      leitner,
    };
    const paket = daten.pakete[stunde];
    const runden = paket ? rundenZahl(paket.uebungen.length) : 0;
    const vorher = sterne(stand.bestwerte[stunde], runden);
    const r = rundeAnwenden(stand, m);
    store({ ...daten, stand: r.stand });
    speichereWarteschlange([...ladeWarteschlange(), m]);
    void flush();
    ton('fertig');
    setScreen({
      kind: 'ergebnis',
      stunde,
      richtig: m.richtig,
      gesamt: m.gesamt,
      plus: r.plus,
      sterneVorher: vorher,
      sterneJetzt: sterne(r.stand.bestwerte[stunde], runden),
    });
  };

  const wiederholen = () => {
    const karten = new Map<string, { u: Uebung; stunde: string }>();
    for (const p of pakete) for (const u of p.uebungen) karten.set(karteKey(p.stunde, u.id), { u, stunde: p.stunde });
    const due = faellig(stand.leitner, tagNummer(heute()), new Set(karten.keys())).slice(0, RUNDE_MAX);
    setScreen({
      kind: 'runde',
      stunde: '',
      runde: 0,
      uebungen: due.map((k) => karten.get(k)!),
    });
  };

  if (screen.kind === 'runde') {
    return (
      <Runde
        key={`${screen.stunde}:${screen.runde}`}
        screen={screen}
        stand={stand}
        titel={screen.stunde && daten.pakete[screen.stunde] ? `Station ${daten.pakete[screen.stunde].nummer} · ${daten.pakete[screen.stunde].titel}` : 'Wiederholen'}
        onAbbruch={() => setScreen(screen.stunde ? { kind: 'station', stunde: screen.stunde } : { kind: 'karte' })}
        onFertig={fertig}
      />
    );
  }

  const naechsteRunde = (p: Paket) => {
    const runden = rundenZahl(p.uebungen.length);
    const best = stand.bestwerte[p.stunde] ?? [];
    return Array.from({ length: runden }, (_, i) => i).find((i) => !(best[i] > 0)) ?? 0;
  };
  const starte = (p: Paket, r: number) => setScreen({ kind: 'runde', stunde: p.stunde, runde: r, uebungen: rundeVon(p.uebungen, r).map((u) => ({ u, stunde: p.stunde })) });

  if (screen.kind === 'ergebnis') {
    const p = daten.pakete[screen.stunde];
    const w = woche(stand.tage);
    const titelText = !screen.stunde ? 'Wiederholt!' : screen.sterneJetzt > 0 && screen.sterneVorher === 0 ? 'Station geschafft!' : screen.richtig === screen.gesamt ? 'Perfekt!' : 'Runde geschafft!';
    return (
      <main className="lq-app lq-ergebnis">
        {screen.stunde && <Sterne n={screen.sterneJetzt} neu={screen.sterneJetzt > screen.sterneVorher} gross />}
        <h1>{titelText}</h1>
        <p className="lq-untertitel">
          {p ? `${p.titel} · ` : ''}
          {screen.richtig} von {screen.gesamt} richtig
        </p>
        <div className="lq-kacheln-ergebnis">
          <div>
            <span>Erfahrung</span>
            <strong className="lq-violett">+{screen.plus} EP</strong>
          </div>
          <div>
            <span>Woche</span>
            <strong className="lq-gruen">
              {Math.min(w.diese, WOCHENZIEL)} / {WOCHENZIEL}
            </strong>
          </div>
        </div>
        {!screen.plus && <p className="lq-klein lq-mitte">Für heute gibt es keine Erfahrung mehr. Deine Antworten zählen trotzdem fürs Wiederholen.</p>}
        {w.diese >= WOCHENZIEL && (
          <div className="lq-hinweis-gold">
            <strong>Wochenziel erreicht!</strong>
          </div>
        )}
        <div className="lq-platz" />
        {screen.stunde && p && (
          <button type="button" className="lq-knopf lq-hell" onClick={() => setScreen({ kind: 'station', stunde: screen.stunde })}>
            Zur Station
          </button>
        )}
        <button type="button" className="lq-knopf" onClick={() => setScreen({ kind: 'karte' })}>
          Zur Karte
        </button>
      </main>
    );
  }

  const karten = new Set(pakete.flatMap((p) => p.uebungen.map((u) => karteKey(p.stunde, u.id))));
  const dueCount = faellig(stand.leitner, tagNummer(heute()), karten).length;
  const tab = screen.kind === 'wiederholen' ? 'wiederholen' : 'karte';
  const rahmen = (inhalt: React.ReactNode) => (
    <main className="lq-app lq-mit-leiste">
      <Kopf daten={daten} offline={offline} onSignOut={() => onSignOut()} />
      <div className="lq-inhalt">{inhalt}</div>
      <nav className="lq-leiste" aria-label="Hauptmenü">
        <button type="button" className={tab === 'karte' ? 'an' : ''} aria-current={tab === 'karte' ? 'page' : undefined} onClick={() => setScreen({ kind: 'karte' })}>
          <KarteIcon />
          Karte
        </button>
        <button type="button" className={tab === 'wiederholen' ? 'an' : ''} aria-current={tab === 'wiederholen' ? 'page' : undefined} onClick={() => setScreen({ kind: 'wiederholen' })}>
          <WiederholenIcon />
          Wiederholen
          {dueCount > 0 && <span className="lq-zahl">{dueCount}</span>}
        </button>
      </nav>
    </main>
  );

  if (screen.kind === 'wiederholen') {
    return rahmen(
      <section className="lq-box lq-wiederholen-box">
        <h2>Wiederholen</h2>
        {dueCount ? (
          <>
            <p>
              {dueCount} {dueCount === 1 ? 'Aufgabe ist' : 'Aufgaben sind'} heute dran: Was du schon kannst, kommt seltener, was noch schwer ist, öfter.
            </p>
            <button type="button" className="lq-knopf" onClick={wiederholen}>
              Los geht’s!
            </button>
          </>
        ) : (
          <p>Gerade ist nichts dran. Spiel Stationen auf der Karte – was du dort übst, kommt hier später wieder.</p>
        )}
      </section>,
    );
  }

  const paket = screen.kind === 'station' ? daten.pakete[screen.stunde] : undefined;
  if (paket) {
    const runden = rundenZahl(paket.uebungen.length);
    const best = stand.bestwerte[paket.stunde] ?? [];
    const naechste = naechsteRunde(paket);
    return rahmen(
      <section className="lq-station">
        <button type="button" className="lq-link" onClick={() => setScreen({ kind: 'karte' })}>
          ← Zur Karte
        </button>
        <span className="lq-kicker">
          {paket.fach} · Region {paket.modul.nummer} · Station {paket.nummer}
        </span>
        <h1>{paket.titel}</h1>
        <Sterne n={sterne(best, runden)} />
        <ol className="lq-runden">
          {Array.from({ length: runden }, (_, r) => (
            <li key={r}>
              <button type="button" className={`lq-runde ${best[r] > 0 ? 'geschafft' : ''} ${r === naechste ? 'naechste' : ''}`} onClick={() => starte(paket, r)}>
                <span className="lq-runde-nr">{best[r] >= 100 ? '★' : best[r] > 0 ? '✓' : r + 1}</span>
                <span>
                  Runde {r + 1}
                  {best[r] > 0 && <small> · bestes Ergebnis {best[r]} %</small>}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="lq-knopf" onClick={() => starte(paket, naechste)}>
          Los geht’s!
        </button>
      </section>,
    );
  }

  // The map.
  const faecher = faecherVon(pakete);
  const aktiv = faecher.includes(fach) ? fach : (faecher[0] ?? '');
  const regionen = regionenVon(pakete, aktiv, stand);
  const tippen = (s: Station) => {
    const p = s.stunde ? daten.pakete[s.stunde] : undefined;
    if (!p) return;
    if (s.zustand === 'aktuell') starte(p, naechsteRunde(p));
    else setScreen({ kind: 'station', stunde: p.stunde });
  };

  return rahmen(
    <>
      <Wochenziel tage={stand.tage} />
      {faecher.length > 1 && (
        <nav className="lq-faecher" aria-label="Fächer">
          {faecher.map((f) => (
            <button key={f} type="button" className={f === aktiv ? 'an' : ''} aria-pressed={f === aktiv} onClick={() => setFach(f)}>
              {f}
            </button>
          ))}
        </nav>
      )}
      {!pakete.length && <p className="lq-leer">Deine Lehrkraft hat noch keine Station freigeschaltet.</p>}
      {regionen.map((r) => (
        <section key={r.id} className="lq-region">
          <div className="lq-region-band">
            <span>
              {aktiv} · Region {r.nummer}
            </span>
            <h2>{r.titel}</h2>
          </div>
          <ol className="lq-pfad">
            {r.stationen.map((st, i) => (
              <li key={st.nummer} className={`lq-versatz-${['0', 'l', '0', 'r'][i % 4]}`}>
                {st.zustand === 'aktuell' && <span className="lq-blase">Los geht’s!</span>}
                <button
                  type="button"
                  className={`lq-knoten ${st.zustand}`}
                  disabled={st.zustand === 'gesperrt'}
                  aria-label={`${st.zustand === 'gesperrt' ? 'Gesperrt' : st.zustand === 'aktuell' ? 'Station starten' : 'Station'}: ${st.titel}`}
                  onClick={() => tippen(st)}
                >
                  {st.zustand === 'erledigt' ? (
                    <HakenIcon />
                  ) : st.zustand === 'gesperrt' ? (
                    <SchlossIcon />
                  ) : st.zustand === 'aktuell' ? (
                    <SternIcon />
                  ) : (
                    <span className="lq-knoten-nr">{st.nummer}</span>
                  )}
                </button>
                <span className="lq-knoten-titel">{st.titel}</span>
                {st.zustand === 'erledigt' && <Sterne n={st.sterne} />}
                {st.zustand === 'gesperrt' && <span className="lq-klein">Deine Lehrkraft schaltet die Station frei, wenn ihr das Thema hattet.</span>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>,
  );
}

function Sterne({ n, neu = false, gross = false }: { n: number; neu?: boolean; gross?: boolean }) {
  return (
    <span className={`lq-sterne ${gross ? 'gross' : ''} ${neu ? 'neu' : ''}`} aria-label={`${n} von 3 Sternen`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'an' : ''} aria-hidden>
          <SternIcon />
        </span>
      ))}
    </span>
  );
}

function Initiale({ name, gross = false }: { name: string; gross?: boolean }) {
  return (
    <span className={`lq-ini ${gross ? 'gross' : ''}`} style={{ background: namensFarbe(name) }} aria-hidden>
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

function Wochenziel({ tage }: { tage: string[] }) {
  const w = woche(tage);
  return (
    <section className="lq-box lq-wochenziel">
      <div className="lq-zeile-zwischen">
        <h2>Wochenziel</h2>
        <strong>{w.diese >= WOCHENZIEL ? 'Wochenziel erreicht!' : `${w.diese} von ${WOCHENZIEL} Tagen`}</strong>
      </div>
      <div className="lq-tage">
        {wochenTage(tage, heute()).map((d) => (
          <span key={d.tag} className={`${d.gelernt ? 'ok' : ''} ${d.heute ? 'heute' : ''}`} aria-label={`${d.label}${d.gelernt ? ', gelernt' : ''}${d.heute ? ', heute' : ''}`}>
            {d.label}
          </span>
        ))}
      </div>
      <span className="lq-klein">Wochenenden und Ferien setzen nichts zurück.</span>
    </section>
  );
}

function Kopf({ daten, offline, onSignOut }: { daten: Daten; offline: boolean; onSignOut: () => void }) {
  const [menu, setMenu] = useState(false);
  const [tonOn, setTonOn] = useState(tonAn);
  const h = heldenstufe(daten.stand.xp);
  const w = woche(daten.stand.tage);
  return (
    <header className="lq-kopf">
      <button type="button" className="lq-avatar" aria-label="Menü" aria-expanded={menu} onClick={() => setMenu(!menu)}>
        <Initiale name={daten.name} />
      </button>
      <div className="lq-held">
        <strong>
          Heldenstufe {h.stufe} · {titel(h.stufe)}
        </strong>
        <span className="lq-xp" role="progressbar" aria-valuemin={0} aria-valuemax={h.noetig} aria-valuenow={h.drin} aria-label="Erfahrung bis zur nächsten Stufe">
          <span style={{ width: `${(100 * h.drin) / h.noetig}%` }} />
        </span>
        <span className="lq-klein">
          {h.drin} / {h.noetig} EP bis Stufe {h.stufe + 1}
        </span>
      </div>
      {offline && <p className="lq-offline">Offline – deine Runden werden später gesendet.</p>}
      {menu && (
        <div className="lq-menu">
          <p>
            <strong>{daten.name}</strong> · {daten.klasse}
          </p>
          <p className="lq-klein">
            {w.geschafft} {w.geschafft === 1 ? 'Woche' : 'Wochen'} mit Wochenziel
          </p>
          <label>
            <input
              type="checkbox"
              checked={tonOn}
              onChange={(e) => {
                setzeTon(e.target.checked);
                setTonOn(e.target.checked);
              }}
            />{' '}
            Töne
          </label>
          <button type="button" className="lq-link" onClick={onSignOut}>
            Abmelden
          </button>
        </div>
      )}
    </header>
  );
}

// — Icons (as in the prototype, drawn here so no icon set is needed) —

const svg = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const Pfeil = () => (
  <svg {...svg}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);
const ScanIcon = () => (
  <svg {...svg} width={22} height={22}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8" />
  </svg>
);
const LoeschIcon = () => (
  <svg {...svg} width={28} height={28} strokeWidth={2.2}>
    <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7Z" />
    <path d="m12 9 6 6M18 9l-6 6" />
  </svg>
);
const HakenIcon = () => (
  <svg {...svg} width={34} height={34} strokeWidth={3.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const KreuzIcon = () => (
  <svg {...svg} width={22} height={22} strokeWidth={3.4}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const SchlossIcon = () => (
  <svg {...svg} width={28} height={28}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
const SternIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8Z" />
  </svg>
);
const KarteIcon = () => (
  <svg {...svg} strokeWidth={2.2}>
    <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5Z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </svg>
);
const WiederholenIcon = () => (
  <svg {...svg} strokeWidth={2.2}>
    <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
  </svg>
);
function Wappen() {
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden>
      <path d="M52 6 90 20v30c0 24-16 40-38 48C30 90 14 74 14 50V20Z" fill="#5B3FD9" />
      <path d="M52 6 90 20v30c0 24-16 40-38 48Z" fill="#4A31C2" />
      <circle cx="52" cy="50" r="22" fill="#fff" />
      <path d="m52 32 7 18-7 18-7-18Z" fill="#FFC531" />
      <path d="m52 50 7 0-7 18Z" fill="#C98F00" />
      <circle cx="52" cy="50" r="3" fill="#1F1A3D" />
    </svg>
  );
}

// — A round —

interface RundeProps {
  screen: Extract<Screen, { kind: 'runde' }>;
  stand: Stand;
  /** Above the exercise: „Station 3 · Himmelsrichtungen“ or „Wiederholen“. */
  titel: string;
  onAbbruch: () => void;
  onFertig: (stunde: string, runde: number, ergebnisse: boolean[], leitner: Stand['leitner']) => void;
}

function Runde({ screen, stand, titel: kicker, onAbbruch, onFertig }: RundeProps) {
  const [i, setI] = useState(0);
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [ergebnisse, setErgebnisse] = useState<boolean[]>([]);
  const [leitner, setLeitner] = useState<Stand['leitner']>({});
  const [versuch] = useState(() => Date.now().toString(36));
  const item = screen.uebungen[i];

  const pruefen = (a = antwort) => {
    if (!a || ok !== null) return;
    const right = istRichtig(item.u, a);
    ton(right ? 'richtig' : 'falsch');
    setOk(right);
    setErgebnisse([...ergebnisse, right]);
    const key = karteKey(item.stunde, item.u.id);
    setLeitner({
      ...leitner,
      [key]: karteNach(leitner[key] ?? stand.leitner[key], right, tagNummer(heute())),
    });
  };

  const weiter = () => {
    if (i + 1 >= screen.uebungen.length) return onFertig(screen.stunde, screen.runde, ergebnisse, leitner);
    setI(i + 1);
    setAntwort(null);
    setOk(null);
  };

  if (!item) {
    return (
      <main className="lq-app lq-ergebnis">
        <p>Hier gibt es gerade nichts zu tun.</p>
        <button type="button" className="lq-knopf" onClick={onAbbruch}>
          Zurück
        </button>
      </main>
    );
  }

  return (
    <main className="lq-app lq-spiel">
      <div className="lq-fortschritt">
        <button type="button" className="lq-x" aria-label="Runde abbrechen" onClick={onAbbruch}>
          <KreuzIcon />
        </button>
        <span className="lq-balken">
          <span
            style={{
              width: `${(100 * (i + (ok !== null ? 1 : 0))) / screen.uebungen.length}%`,
            }}
          />
        </span>
      </div>
      <span className="lq-kicker">{kicker}</span>
      <UebungView
        key={i}
        u={item.u}
        seed={`${item.u.id}:${versuch}`}
        locked={ok !== null}
        onChange={(a) => {
          setAntwort(a);
          if (a?.art === 'paare') pruefen(a);
        }}
      />
      <footer className={`lq-fuss ${ok === true ? 'ok' : ok === false ? 'nein' : ''}`} aria-live="polite">
        {ok !== null && (
          <div className="lq-rueckmeldung">
            <strong>
              <span className="lq-zeichen" aria-hidden>
                {ok ? <HakenIcon /> : <KreuzIcon />}
              </span>
              {ok ? 'Richtig!' : 'Nicht ganz.'}
            </strong>
            {!ok && (
              <span>
                Richtig wäre: <Rich text={loesungText(item.u)} />
              </span>
            )}
          </div>
        )}
        {ok === null ? (
          <button type="button" className="lq-knopf" disabled={!antwort} onClick={() => pruefen()}>
            Prüfen
          </button>
        ) : (
          <button type="button" className="lq-knopf" onClick={weiter} autoFocus>
            Weiter
          </button>
        )}
      </footer>
    </main>
  );
}
