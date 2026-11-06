// Lernquest for the children (…/lernquest/#<Klassencode>): sign in with the class list and a PIN, then the world map
// (subject → module regions → lesson stations), rounds of short exercises, experience, stars, the weekly goal and
// „Wiederholen“. Works on a phone held upright first; offline with what was loaded last.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { topicIcon } from '../../topicIcons';
import {
  faellig,
  heldenstufe,
  heute,
  istRichtig,
  karteKey,
  karteNach,
  loesungText,
  rundeAnwenden,
  rundenGeschafft,
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
  | { kind: 'runde'; stunde: string; runde: number; uebungen: { u: Uebung; stunde: string }[] }
  | { kind: 'ergebnis'; stunde: string; richtig: number; gesamt: number; plus: number; sterneVorher: number; sterneJetzt: number };

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
      setMsg(r.gesperrt ? 'Das Konto ist jetzt gesperrt. Deine Lehrkraft kann es wieder freigeben.' : `Falsche PIN. Noch ${r.rest} ${r.rest === 1 ? 'Versuch' : 'Versuche'}.`);
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

  return (
    <main className="lq-app lq-login">
      <h1 className="lq-logo">Lernquest</h1>
      {!klasse ? (
        <form
          className="lq-karte-box"
          onSubmit={(e) => {
            e.preventDefault();
            void open(code);
          }}
        >
          <label htmlFor="lq-code">Klassencode</label>
          <input
            id="lq-code"
            className="lq-code"
            value={code}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
            placeholder="z. B. K7QF9MXA"
          />
          <button className="lq-knopf" disabled={code.length !== 8 || busy}>
            Weiter
          </button>
        </form>
      ) : !kind ? (
        <section className="lq-karte-box">
          <h2>{klasse.name}</h2>
          <p>Tippe deinen Namen an.</p>
          <div className="lq-namen">
            {klasse.kinder.map((k) => (
              <button
                key={k.id}
                type="button"
                className="lq-option"
                onClick={() => {
                  setKind(k);
                  setMsg('');
                }}
              >
                {k.name}
              </button>
            ))}
          </div>
          <button type="button" className="lq-link" onClick={() => setKlasse(null)}>
            Anderer Klassencode
          </button>
        </section>
      ) : (
        <section className="lq-karte-box">
          <h2>Hallo {kind.name}!</h2>
          <p>Gib deine PIN ein.</p>
          <div className="lq-pin" aria-label={`${pin.length} von 4 Ziffern`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i < pin.length ? 'voll' : ''} />
            ))}
          </div>
          <div className="lq-ziffern">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
              d === '' ? (
                <span key={i} />
              ) : (
                <button key={i} type="button" className="lq-ziffer" disabled={busy} aria-label={d === '⌫' ? 'Löschen' : d} onClick={() => (d === '⌫' ? setPin(pin.slice(0, -1)) : digit(d))}>
                  {d}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            className="lq-link"
            onClick={() => {
              setKind(null);
              setPin('');
              setMsg('');
            }}
          >
            Das bin ich nicht
          </button>
        </section>
      )}
      {msg && (
        <p className="lq-meldung" role="alert">
          {msg}
        </p>
      )}
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
    const m: Meldung = { stunde, runde, richtig: ergebnisse.filter(Boolean).length, gesamt: ergebnisse.length, leitner };
    const paket = daten.pakete[stunde];
    const runden = paket ? rundenZahl(paket.uebungen.length) : 0;
    const vorher = sterne(stand.bestwerte[stunde], runden);
    const r = rundeAnwenden(stand, m);
    store({ ...daten, stand: r.stand });
    speichereWarteschlange([...ladeWarteschlange(), m]);
    void flush();
    ton('fertig');
    setScreen({ kind: 'ergebnis', stunde, richtig: m.richtig, gesamt: m.gesamt, plus: r.plus, sterneVorher: vorher, sterneJetzt: sterne(r.stand.bestwerte[stunde], runden) });
  };

  const wiederholen = () => {
    const karten = new Map<string, { u: Uebung; stunde: string }>();
    for (const p of pakete) for (const u of p.uebungen) karten.set(karteKey(p.stunde, u.id), { u, stunde: p.stunde });
    const due = faellig(stand.leitner, tagNummer(heute()), new Set(karten.keys())).slice(0, RUNDE_MAX);
    setScreen({ kind: 'runde', stunde: '', runde: 0, uebungen: due.map((k) => karten.get(k)!) });
  };

  if (screen.kind === 'runde') {
    return <Runde key={`${screen.stunde}:${screen.runde}`} screen={screen} stand={stand} onAbbruch={() => setScreen(screen.stunde ? { kind: 'station', stunde: screen.stunde } : { kind: 'karte' })} onFertig={fertig} />;
  }

  if (screen.kind === 'ergebnis') {
    return (
      <main className="lq-app lq-ergebnis">
        <h1>{screen.richtig === screen.gesamt ? 'Perfekt!' : screen.richtig >= screen.gesamt / 2 ? 'Gut gemacht!' : 'Weiter üben!'}</h1>
        <p className="lq-gross-zahl">
          {screen.richtig} von {screen.gesamt} richtig
        </p>
        <p className="lq-xp-plus">{screen.plus ? `+${screen.plus} Erfahrung` : 'Für heute gibt es keine Erfahrung mehr – aber Üben zählt trotzdem.'}</p>
        {screen.stunde && <Sterne n={screen.sterneJetzt} neu={screen.sterneJetzt > screen.sterneVorher} gross />}
        <button type="button" className="lq-knopf" onClick={() => setScreen(screen.stunde ? { kind: 'station', stunde: screen.stunde } : { kind: 'karte' })}>
          Weiter
        </button>
      </main>
    );
  }

  const kopf = <Kopf daten={daten} offline={offline} onSignOut={() => onSignOut()} />;

  const paket = screen.kind === 'station' ? daten.pakete[screen.stunde] : undefined;
  if (paket) {
    const runden = rundenZahl(paket.uebungen.length);
    const best = stand.bestwerte[paket.stunde] ?? [];
    const naechste = Array.from({ length: runden }, (_, i) => i).find((i) => !(best[i] > 0)) ?? 0;
    return (
      <main className="lq-app">
        {kopf}
        <section className="lq-station">
          <button type="button" className="lq-link" onClick={() => setScreen({ kind: 'karte' })}>
            ← Zur Karte
          </button>
          <p className="lq-kicker">
            Modul {paket.modul.nummer} · Stunde {paket.nummer}
          </p>
          <h1>{paket.titel}</h1>
          <Sterne n={sterne(best, runden)} />
          <ol className="lq-runden">
            {Array.from({ length: runden }, (_, r) => (
              <li key={r}>
                <button type="button" className={`lq-runde ${best[r] > 0 ? 'geschafft' : ''} ${r === naechste ? 'naechste' : ''}`} onClick={() => setScreen({ kind: 'runde', stunde: paket.stunde, runde: r, uebungen: rundeVon(paket.uebungen, r).map((u) => ({ u, stunde: paket.stunde })) })}>
                  <span className="lq-runde-nr">{best[r] >= 100 ? '★' : best[r] > 0 ? '✓' : r + 1}</span>
                  <span>
                    Runde {r + 1}
                    {best[r] > 0 && <small> · bestes Ergebnis {best[r]} %</small>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </main>
    );
  }

  // The map.
  const faecher = [...new Set(pakete.map((p) => p.fach))].sort((a, b) => a.localeCompare(b, 'de'));
  const aktiv = faecher.includes(fach) ? fach : (faecher[0] ?? '');
  const regionen = new Map<string, Paket[]>();
  for (const p of pakete.filter((x) => x.fach === aktiv).sort((a, b) => a.modul.nummer - b.modul.nummer || a.nummer - b.nummer)) {
    regionen.set(p.modul.id, [...(regionen.get(p.modul.id) ?? []), p]);
  }
  const karten = new Set(pakete.flatMap((p) => p.uebungen.map((u) => karteKey(p.stunde, u.id))));
  const dueCount = faellig(stand.leitner, tagNummer(heute()), karten).length;

  return (
    <main className="lq-app">
      {kopf}
      <button type="button" className="lq-wiederholen" disabled={!dueCount} onClick={wiederholen}>
        <span aria-hidden>↻</span> Wiederholen
        <small>{dueCount ? `${dueCount} ${dueCount === 1 ? 'Aufgabe ist' : 'Aufgaben sind'} dran` : 'Gerade ist nichts dran'}</small>
      </button>
      {faecher.length > 1 && (
        <nav className="lq-faecher">
          {faecher.map((f) => (
            <button key={f} type="button" className={f === aktiv ? 'an' : ''} onClick={() => setFach(f)}>
              {f}
            </button>
          ))}
        </nav>
      )}
      {!pakete.length && <p className="lq-leer">Deine Lehrkraft hat noch keine Station freigeschaltet. Schau bald wieder vorbei!</p>}
      {[...regionen.values()].map((stationen) => {
        const m = stationen[0].modul;
        const Icon = topicIcon(m.icon);
        return (
          <section key={m.id} className="lq-region">
            <h2>
              <span className="lq-region-icon">
                <Icon size={22} aria-hidden />
              </span>
              <span>
                <small>Modul {m.nummer}</small>
                {m.titel}
              </span>
            </h2>
            <ol className="lq-pfad">
              {stationen.map((p, i) => {
                const runden = rundenZahl(p.uebungen.length);
                const best = stand.bestwerte[p.stunde];
                const n = sterne(best, runden);
                const angefangen = rundenGeschafft(best, runden) > 0;
                return (
                  <li key={p.stunde} className={`lq-station-${i % 2 ? 'rechts' : 'links'}`}>
                    <button type="button" className={`lq-knoten ${n === 3 ? 'gold' : angefangen ? 'angefangen' : ''}`} disabled={!runden} onClick={() => setScreen({ kind: 'station', stunde: p.stunde })}>
                      <span className="lq-knoten-nr">{p.nummer}</span>
                    </button>
                    <span className="lq-knoten-titel">{p.titel}</span>
                    <Sterne n={n} />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </main>
  );
}

function Sterne({ n, neu = false, gross = false }: { n: number; neu?: boolean; gross?: boolean }) {
  return (
    <span className={`lq-sterne ${gross ? 'gross' : ''} ${neu ? 'neu' : ''}`} aria-label={`${n} von 3 Sternen`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'an' : ''} aria-hidden>
          ★
        </span>
      ))}
    </span>
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
        {daten.name.slice(0, 1).toUpperCase()}
      </button>
      <div className="lq-held">
        <strong>{daten.name}</strong>
        <span>
          Stufe {h.stufe} · {titel(h.stufe)}
        </span>
        <span className="lq-xp" role="progressbar" aria-valuemin={0} aria-valuemax={h.noetig} aria-valuenow={h.drin} aria-label="Erfahrung bis zur nächsten Stufe">
          <span style={{ width: `${(100 * h.drin) / h.noetig}%` }} />
        </span>
      </div>
      <div className="lq-woche" title={`Wochenziel: an ${WOCHENZIEL} Tagen lernen`}>
        <span className="lq-woche-punkte">
          {Array.from({ length: WOCHENZIEL }, (_, i) => (
            <span key={i} className={i < w.diese ? 'an' : ''} />
          ))}
        </span>
        <small>{w.diese >= WOCHENZIEL ? 'Wochenziel geschafft!' : 'Wochenziel'}</small>
      </div>
      {offline && <p className="lq-offline">Offline – deine Runden werden später gesendet.</p>}
      {menu && (
        <div className="lq-menu">
          <p>
            {daten.klasse} · {w.geschafft} {w.geschafft === 1 ? 'Woche' : 'Wochen'} mit Wochenziel
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

// — A round —

interface RundeProps {
  screen: Extract<Screen, { kind: 'runde' }>;
  stand: Stand;
  onAbbruch: () => void;
  onFertig: (stunde: string, runde: number, ergebnisse: boolean[], leitner: Stand['leitner']) => void;
}

function Runde({ screen, stand, onAbbruch, onFertig }: RundeProps) {
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
    setLeitner({ ...leitner, [key]: karteNach(leitner[key] ?? stand.leitner[key], right, tagNummer(heute())) });
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
          ✕
        </button>
        <span className="lq-balken">
          <span style={{ width: `${(100 * (i + (ok !== null ? 1 : 0))) / screen.uebungen.length}%` }} />
        </span>
      </div>
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
            <strong>{ok ? 'Richtig!' : 'Nicht ganz.'}</strong>
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
