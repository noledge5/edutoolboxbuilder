// Lernquest for the children (…/lernquest/#<Klassencode>): sign in with the class list and a PIN, then the world map
// (subject → module regions → lesson stations), rounds of short exercises, experience, stars, the weekly goal and
// „Wiederholen“, the hero and the boss fight. Works on a phone held upright first; offline with what was loaded last.
// `#beamer=<id>` (with `&klasse=<code>`) is the teacher's projector view of a boss fight (teacher keys from this device,
// see Boss.tsx); the class code lets it show a QR code to sign in.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QrScanner } from '../../sync/QrScanner';
import { beamerAusHash, codeAus, faecherVon, fuchsHinweis, MEILENSTEIN_GROESSE, namensFarbe, regionenVon, regionName, vorname, wochenTage, type Region, type Station } from '../karte';
import {
  heldenstufe,
  heute,
  karteKey,
  naechsteRunde,
  rundeAnwenden,
  aufgabenVon,
  AUFGABE_MUENZEN,
  AUFGABEN_BONUS,
  TAGESAUFGABEN,
  tagesStand,
  rundenFazit,
  rundenStufen,
  rundenZahl,
  sternZiele,
  sterneVon,
  geschafft,
  rundeVon,
  RUNDE_MAX,
  heuteDran,
  morgenDran,
  readExtra,
  STERNE_JE_TRUHE,
  titel,
  woche,
  wochenStart,
  WOCHENZIEL,
} from '../rules';
import { abmelden, anmelden, bossOffen, klasseOeffnen, LqError, lqText, meinStand, rundeMelden, willkommen, type BossOffen, type KlasseOffen } from '../server';
import { BOSSE } from '../boss';
import { BossBeamer, BossBild, BossKind, useLangsam } from './Boss';
import { readPaket } from '../paket';
import { bonusVon, HERZEN } from '../teile';
import type { Paket, Stand, Uebung } from '../types';
import { HeldIcon, HeldSeite, KlasseIcon, KlasseSeite, LadenSeite, Meldung as MeldungText, Muenzen, TruheIcon, TruheSeite, type Aktion } from './Held';
import { allesWeg, ladeDaten, ladeMeilensteine, ladeSitzung, ladeWarteschlange, setzeTon, speichereDaten, speichereMeilenstein, speichereSitzung, speichereWarteschlange, hilfeGesehen, merkeHilfe, ruhigAn, setzeRuhig, tonAn, type Daten, type Meldung, type Sitzung } from './speicher';
import { ton } from './ton';
import { Jubel } from './Jubel';
import { GluehbirneIcon, HilfeSeite } from './Hilfe';
import { HakenIcon, KreuzIcon, Runde } from './Runde';
import { useZurueck } from './zurueck';
import { DorfBox } from './Dorf';
import { GutscheineSeite, TicketIcon } from './Gutscheine';
import { ProbeApp } from './Probe';
import { gemischterTest, probeAusUrl } from '../probe';
import { AUSSCHNITT_KOPF, AvatarBild } from './avatar';
import { Fuchs, FuchsSagt } from './Fuchs';
import { Landschaft } from './Landschaft';
import { Landkarte } from './Landkarte';
import type { Wegpunkt } from './Landkarte';

export type Screen =
  | { kind: 'karte' }
  | { kind: 'station'; stunde: string }
  /** Stufe E: the station's help cards („So geht's“); `dann`: the round to start after them. */
  | { kind: 'hilfe'; stunde: string; dann?: number }
  | { kind: 'wiederholen' }
  | { kind: 'held'; willkommen?: boolean }
  /** Stufe D, Teil 2: the welcome of a new child (hero, mini round, first chest). */
  | { kind: 'willkommen'; schritt: 'start' | 'truhe' }
  | { kind: 'laden' }
  | { kind: 'gutscheine' }
  | { kind: 'truhe'; zurueck: 'held' | 'karte' }
  | { kind: 'klasse' }
  /** Stufe E, Teil 5: today's tasks and the week (week goal, class task). */
  | { kind: 'aufgaben'; ansicht: 'heute' | 'woche' }
  | { kind: 'boss'; id: string }
  | {
      kind: 'runde';
      stunde: string;
      runde: number;
      uebungen: { u: Uebung; stunde: string }[];
      /** Counts the rounds started, so the same round played again starts fresh. */
      nr: number;
      /** The mixed test at the end of a region (sent as „Wiederholen“). */
      meilenstein?: Meilenstein;
      /** The mini round of the welcome (sent as „Wiederholen“, so no station gets a best from three questions). */
      willkommen?: boolean;
    }
  | {
      kind: 'ergebnis';
      stunde: string;
      /** The round played, to play it again after a weak result. */
      runde: number;
      richtig: number;
      gesamt: number;
      /** Right or wrong per exercise, in order, for the row of dots. */
      ergebnisse: boolean[];
      plus: number;
      muenzenPlus: number;
      /** Stufe D: coins for daily tasks done with this round, and their ids. */
      aufgabenPlus: number;
      aufgabenNeu: string[];
      truhenPlus: number;
      punktePlus: number;
      /** A repetition (round „Wiederholen“ or a station round done before): a third of experience and coins. */
      wiederholung: boolean;
      sterneVorher: number;
      sterneJetzt: number;
      /** New stars counted toward chests, and the stars toward the next chest after this round. */
      sternePlus: number;
      sterneRest: number;
      /** Stufe D, Teil 2: this round reached the class task of the week (a chest for everyone who took part). */
      klassenGeschafft?: boolean;
      meilenstein?: Meilenstein;
    };

interface Meilenstein {
  id: string;
  titel: string;
}

/** A Meilenstein counts as passed from this percent. */
const MEILENSTEIN_GUT = 80;

const codeFromUrl = () => {
  const h = location.hash.replace(/^#\/?/, '');
  return /^[0-9A-Za-z]{8}$/.test(h) ? h.toUpperCase() : '';
};

const beamerFromUrl = () => beamerAusHash(location.hash);

/** The children's app (sign-in, game, boss fight) is switched off while it is rebuilt (decision of the teacher,
 *  12.11.2026). Open exercises from a public link keep working. Nothing on the device is deleted: Spielstand and rounds
 *  not yet sent stay and go out once the app is back. Switched on again with the end of Stufe E (Teil 6, 12.11.2026);
 *  set to true to show the „Umbau“ page again. */
export const UMBAU: boolean = false;

export function LernquestApp() {
  // Open exercises from a public link: no sign-in, no server (`probe.ts`).
  const probe = probeAusUrl();
  if (probe) return <ProbeApp id={probe} />;
  if (UMBAU) return <Umbau />;
  const beamer = beamerFromUrl();
  if (beamer) return <BossBeamer id={beamer.id} klasse={beamer.klasse} />;
  return <KinderApp />;
}

function Umbau() {
  return (
    <main className="lq-app lq-start lq-umbau">
      <div className="lq-start-bild">
        <Landschaft className="lq-start-landschaft" />
        <div className="lq-start-titel">
          <h1 className="lq-logo">Lernquest</h1>
        </div>
        <Fuchs pose="denken" groesse={150} className="lq-start-fuchs" />
      </div>
      <div className="lq-start-unten">
        <h2>Wir bauen gerade um</h2>
        <p>Eine neue Lernquest ist bald fertig. Dein Held, deine Sterne und deine Münzen bleiben gespeichert.</p>
      </div>
    </main>
  );
}

function KinderApp() {
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

  const zurueck = () => {
    if (kind) {
      setKind(null);
      setPin('');
    } else setKlasse(null);
    setMsg('');
  };
  // The phone's back key: PIN → names → class code, like the arrow.
  useZurueck(!!klasse, zurueck);
  const back = (
    <button type="button" className="lq-zurueck" aria-label="Zurück" onClick={zurueck}>
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
        <div className="lq-start-bild">
          <Landschaft className="lq-start-landschaft" />
          <div className="lq-start-titel">
            <h1 className="lq-logo">Lernquest</h1>
            <p className="lq-tagline">Üben. Spielen. Stärker werden.</p>
          </div>
          <Fuchs pose={msg ? 'troesten' : 'winken'} groesse={150} className="lq-start-fuchs" />
        </div>
        <div className="lq-start-unten">
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
            <button className="lq-knopf lq-hell" disabled={code.length !== 8 || busy} aria-busy={busy}>
              {busy ? 'Einen Moment …' : 'Weiter'}
            </button>
          </form>
          {fehler}
        </div>
      </main>
    );
  }

  if (!kind) {
    return (
      <main className="lq-app lq-namen-seite">
        <div className="lq-titelzeile">
          {back}
          <span className="lq-kicker">{klasse.name}</span>
        </div>
        <FuchsSagt pose="winken">
          <h2>Wer bist du?</h2>
          <p>Tippe auf deinen Namen.</p>
        </FuchsSagt>
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
      <FuchsSagt pose={msg ? 'troesten' : 'stehen'}>
        <h2>Hallo {vorname(kind.name)}!</h2>
        <p>Gib deine 4-stellige PIN ein.</p>
      </FuchsSagt>
      <div className="lq-pin" aria-live="polite" aria-label={`${pin.length} von 4 Ziffern`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'voll' : ''} />
        ))}
      </div>
      {fehler}
      {busy && (
        <p className="lq-klein lq-mitte" role="status">
          Einen Moment …
        </p>
      )}
      <div className="lq-platz" />
      <div className="lq-ziffern" aria-busy={busy}>
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
      store({ name: r.name, klasse: r.klasse, stand, pakete, seit: r.jetzt, extra: readExtra(r.extra) });
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

  /** Coins, chests and parts change only on the server: rounds waiting on this device go first, offline nothing. */
  const aktion: Aktion = useCallback(
    async (f) => {
      await flush();
      if (ladeWarteschlange().length) throw new TypeError('offline');
      try {
        const r = await f(sitzung.token);
        setOffline(false);
        return r;
      } catch (e) {
        fail(e);
        throw e;
      }
    },
    [flush, fail, sitzung.token],
  );
  const setStand = useCallback(
    (s: Stand) => {
      const d = datenRef.current;
      if (d) store({ ...d, stand: s });
    },
    [store],
  );

  /** Presses of the phone's back key during a round (the round asks before it goes). */
  const [zurueckTaste, setZurueckTaste] = useState(0);
  useZurueck(screen.kind !== 'karte', () => {
    if (screen.kind === 'runde') setZurueckTaste((t) => t + 1);
    else if (screen.kind === 'laden' || screen.kind === 'gutscheine') setScreen({ kind: 'held' });
    else if (screen.kind === 'truhe') setScreen({ kind: screen.zurueck });
    else setScreen({ kind: 'karte' });
  });

  const stand = daten?.stand;
  const pakete = useMemo(() => Object.values(daten?.pakete ?? {}), [daten]);

  // A boss fight of the class: asked for every 15 s while the child is on the map, hero or class pages.
  const [boss, setBoss] = useState<BossOffen | null>(null);
  const schauNachBoss = ['karte', 'station', 'wiederholen', 'held', 'klasse', 'ergebnis'].includes(screen.kind);
  useEffect(() => {
    if (!schauNachBoss) return;
    let weg = false;
    const frag = () =>
      document.visibilityState === 'visible' &&
      void bossOffen(sitzung.token)
        .then((b) => !weg && setBoss(b))
        .catch(() => {});
    frag();
    const t = window.setInterval(frag, 15_000);
    document.addEventListener('visibilitychange', frag);
    return () => {
      weg = true;
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', frag);
    };
  }, [schauNachBoss, sitzung.token]);

  // A new page starts at its top, the map at the current station (not where the page before was scrolled to).
  const inhalt = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = inhalt.current;
    if (!el) return;
    const ziel = screen.kind === 'karte' ? el.querySelector<HTMLElement>('.lq-knoten.aktuell') : null;
    if (ziel) ziel.scrollIntoView?.({ block: 'center' });
    else el.scrollTo?.(0, 0);
    // Also once the first data is there (the map appears only then).
  }, [screen, !daten]);

  // Stufe D, Teil 2: a new child (no experience, welcome not done, a station unlocked) starts with the welcome, once
  // per opening of the app. Servers before 20261125 send no `willkommen`: then never.
  const willkommenGezeigt = useRef(false);
  const neuesKind = !!stand && stand.willkommen === false && stand.xp === 0 && pakete.length > 0;
  useEffect(() => {
    if (neuesKind && !willkommenGezeigt.current && screen.kind === 'karte') {
      willkommenGezeigt.current = true;
      setScreen({ kind: 'willkommen', schritt: 'start' });
    }
  }, [neuesKind, screen.kind]);
  const [willkommenMsg, setWillkommenMsg] = useState('');

  const langsam = useLangsam(!daten && !offline);
  if (!daten || !stand) {
    return (
      <main className="lq-app lq-login">
        <h1 className="lq-logo">Lernquest</h1>
        <p className="lq-meldung" aria-busy={!offline}>
          {offline ? 'Keine Verbindung zum Server. Prüfe das Internet.' : langsam ? 'Das dauert länger als sonst.' : 'Lädt …'}
        </p>
        {(offline || langsam) && (
          <button type="button" className="lq-knopf" onClick={() => void laden()}>
            Nochmal
          </button>
        )}
      </main>
    );
  }

  /** A round is over: shown at once, sent now or later. */
  const fertig = (stunde: string, runde: number, ergebnisse: boolean[], leitner: Stand['leitner'], meilenstein?: Meilenstein) => {
    const m: Meldung = {
      stunde,
      runde,
      richtig: ergebnisse.filter(Boolean).length,
      gesamt: ergebnisse.length,
      leitner,
    };
    const paket = daten.pakete[stunde];
    const vorher = paket ? sterneVon(stand, paket) : 0;
    const bonus = bonusVon(stand.avatar);
    const r = rundeAnwenden(stand, m, heute(), { herzen: HERZEN + bonus.herz, bonusProzent: bonus.muenzen, stufen: paket ? rundenStufen(paket.uebungen) : [] });
    store({ ...daten, stand: r.stand });
    if (meilenstein) speichereMeilenstein(meilenstein.id, Math.round((100 * m.richtig) / m.gesamt));
    speichereWarteschlange([...ladeWarteschlange(), m]);
    void flush();
    ton('fertig');
    // A new star rings once more after the fanfare.
    if (paket && sterneVon(r.stand, paket) > vorher) window.setTimeout(() => ton('stern'), 800);
    setScreen({
      kind: 'ergebnis',
      stunde,
      runde,
      richtig: m.richtig,
      gesamt: m.gesamt,
      ergebnisse,
      plus: r.plus,
      muenzenPlus: r.muenzenPlus,
      aufgabenPlus: r.aufgabenPlus,
      aufgabenNeu: r.aufgabenNeu,
      wiederholung: r.wiederholung,
      truhenPlus: r.truhenPlus,
      punktePlus: r.punktePlus,
      sterneVorher: vorher,
      sterneJetzt: paket ? sterneVon(r.stand, paket) : 0,
      sternePlus: r.sternePlus,
      sterneRest: r.stand.sterneRest,
      klassenGeschafft: r.klassenGeschafft,
      meilenstein,
    });
  };

  /** A round of „Wiederholen“: what is due today, or only `nur` (a fading station, the node on the path). */
  const wiederholen = (nur?: string[]) => {
    const karten = new Map<string, { u: Uebung; stunde: string }>();
    for (const p of pakete) for (const u of p.uebungen) karten.set(karteKey(p.stunde, u.id), { u, stunde: p.stunde });
    const due = (nur ?? heuteDran(stand.leitner, [...karten.keys()], daten?.extra, heute())).filter((k) => karten.has(k)).slice(0, RUNDE_MAX);
    setScreen({
      kind: 'runde',
      nr: Date.now(),
      stunde: '',
      runde: 0,
      uebungen: due.map((k) => karten.get(k)!),
    });
  };

  const meilensteinStarten = (r: Region) => {
    const stationen = r.stationen.flatMap((s) => (s.stunde && daten.pakete[s.stunde] ? [daten.pakete[s.stunde]] : []));
    setScreen({ kind: 'runde', nr: Date.now(), stunde: '', runde: 0, uebungen: gemischterTest(stationen, `${r.id}:${Date.now()}`, MEILENSTEIN_GROESSE), meilenstein: { id: r.id, titel: r.titel } });
  };

  if (screen.kind === 'runde') {
    return (
      <Runde
        key={`${screen.stunde}:${screen.runde}:${screen.nr}`}
        uebungen={screen.uebungen}
        stunde={screen.stunde}
        runde={screen.runde}
        held={stand.avatar}
        zurueck={zurueckTaste}
        stand={stand}
        herzen={HERZEN + bonusVon(stand.avatar).herz}
        titel={screen.willkommen ? 'Deine erste Runde' : screen.stunde && daten.pakete[screen.stunde] ? `Station ${daten.pakete[screen.stunde].nummer} · ${daten.pakete[screen.stunde].titel}` : screen.meilenstein ? `Meilenstein · ${screen.meilenstein.titel}` : 'Wiederholen'}
        onAbbruch={() => setScreen(screen.stunde ? { kind: 'station', stunde: screen.stunde } : { kind: 'karte' })}
        onFertig={(st, r, e, l) => {
          fertig(st, r, e, l, screen.meilenstein);
          if (screen.willkommen) setScreen({ kind: 'willkommen', schritt: 'truhe' });
        }}
        paketVon={(st) => daten.pakete[st]}
        gefuehrt={!!screen.stunde && screen.runde === 0 && !screen.meilenstein && !screen.willkommen}
      />
    );
  }

  if (screen.kind === 'boss') {
    return (
      <BossKind
        token={sitzung.token}
        id={screen.id}
        klasse={daten.klasse}
        fail={fail}
        onFertig={(truhe) => {
          setBoss(null);
          if (truhe) void laden();
          setScreen({ kind: 'karte' });
        }}
        onTruhe={() => {
          setBoss(null);
          void laden().then(() => setScreen({ kind: 'truhe', zurueck: 'karte' }));
        }}
      />
    );
  }

  /** The welcome's mini round: the first three questions of the first station of the first subject, as „Wiederholen“. */
  const miniRunde = () => {
    const erste = faecherVon(pakete)
      .flatMap((f) => regionenVon(pakete, f, stand))
      .flatMap((r) => r.stationen)
      .map((s) => (s.stunde ? daten.pakete[s.stunde] : undefined))
      .find((p): p is Paket => !!p);
    if (erste) setScreen({ kind: 'runde', nr: Date.now(), stunde: '', runde: 0, uebungen: rundeVon(erste.uebungen, 0).slice(0, 3).map((u) => ({ u, stunde: erste.stunde })), willkommen: true });
    else setScreen({ kind: 'karte' });
  };

  if (screen.kind === 'willkommen') {
    const fertigMachen = async (truhe: boolean) => {
      setWillkommenMsg('');
      try {
        setStand(await aktion(willkommen));
        setScreen(truhe ? { kind: 'truhe', zurueck: 'karte' } : { kind: 'karte' });
      } catch (e) {
        setWillkommenMsg(lqText(e));
      }
    };
    if (screen.schritt === 'truhe') {
      return (
        <main className="lq-app lq-willkommen">
          <TruheIcon />
          <h1>Erste Runde geschafft!</h1>
          <p className="lq-untertitel">Als Willkommen bekommst du deine erste Truhe. Darin steckt ein Teil für deinen Helden oder Münzen.</p>
          <MeldungText text={willkommenMsg} nochmal={() => void fertigMachen(true)} />
          <div className="lq-platz" />
          <button type="button" className="lq-knopf lq-gold" onClick={() => void fertigMachen(true)}>
            Truhe öffnen
          </button>
        </main>
      );
    }
    return (
      <main className="lq-app lq-willkommen">
        <AvatarBild avatar={stand.avatar} className="lq-willkommen-held" lebendig animation="winken" />
        <h1>Hallo {vorname(daten.name)}!</h1>
        <p className="lq-untertitel">Willkommen bei Lernquest. In zwei Minuten bist du startklar:</p>
        <ol className="lq-willkommen-schritte">
          <li>Bau deinen Helden.</li>
          <li>Spiel eine Mini-Runde mit drei Fragen.</li>
          <li>Öffne deine erste Truhe.</li>
        </ol>
        <MeldungText text={willkommenMsg} />
        <div className="lq-platz" />
        <button type="button" className="lq-knopf" onClick={() => setScreen({ kind: 'held', willkommen: true })}>
          Los geht’s!
        </button>
        <button type="button" className="lq-knopf lq-hell" onClick={() => void fertigMachen(false)}>
          Überspringen
        </button>
      </main>
    );
  }

  if (screen.kind === 'truhe') {
    return (
      <TruheSeite
        daten={daten}
        aktion={aktion}
        setStand={setStand}
        onFertig={(angelegt) => setScreen(angelegt || screen.zurueck === 'held' ? { kind: 'held' } : { kind: 'karte' })}
      />
    );
  }

  const naechste = (p: Paket) => naechsteRunde(stand.bestwerte[p.stunde] ?? [], rundenZahl(p.uebungen.length));
  /** Starts a round; before a station's first round its help cards come once (and the round is the guided one). */
  const starte = (p: Paket, r: number, ohneHilfe = false) => {
    if (r === 0 && !ohneHilfe && p.hilfe?.length && !hilfeGesehen(p.stunde)) {
      merkeHilfe(p.stunde);
      return setScreen({ kind: 'hilfe', stunde: p.stunde, dann: 0 });
    }
    rundeStarten(p, r);
  };
  const rundeStarten = (p: Paket, r: number) => setScreen({ kind: 'runde', nr: Date.now(), stunde: p.stunde, runde: r, uebungen: rundeVon(p.uebungen, r).map((u) => ({ u, stunde: p.stunde })) });

  const karten = pakete.flatMap((p) => p.uebungen.map((u) => karteKey(p.stunde, u.id)));
  const dran = heuteDran(stand.leitner, karten, daten.extra, heute());
  const dueCount = dran.length;
  const morgen = morgenDran(stand.leitner, karten, heute());
  // „Wiederholen sofort“ from the teacher today: said so on the page.
  const extraHeute = !!daten.extra && heute() >= daten.extra.ab && heute() <= daten.extra.bis;

  if (screen.kind === 'ergebnis') {
    const p = daten.pakete[screen.stunde];
    const w = woche(stand.tage);
    const fazit = rundenFazit(screen.richtig, screen.gesamt);
    // „Fast!“ only for a station's round, which can be played again at once; what was missed in „Wiederholen“ comes back by itself.
    const schwach = fazit === 'schwach' && !!p;
    const ms = screen.meilenstein;
    const msGut = !!ms && screen.richtig * 100 >= screen.gesamt * MEILENSTEIN_GUT;
    const titelText = ms ? (msGut ? 'Meilenstein geschafft!' : 'Fast!') : schwach ? 'Fast!' : !screen.stunde ? 'Wiederholt!' : screen.sterneJetzt > 0 && screen.sterneVorher === 0 ? 'Station geschafft!' : fazit === 'perfekt' ? 'Perfekt!' : 'Runde geschafft!';
    const msRegion = ms && regionenVon(pakete, pakete.find((x) => x.modul.id === ms.id)?.fach ?? '', stand).find((r) => r.id === ms.id);
    // What comes next, as the main button: a weak round again, else the station's next open round, else more to repeat.
    const offeneRunde = p ? Array.from({ length: rundenZahl(p.uebungen.length) }, (_, i) => i).find((i) => !geschafft(stand.bestwerte[p.stunde]?.[i])) : undefined;
    const weiter: { text: string; los: () => void } | null =
      ms && !msGut && msRegion
        ? { text: 'Meilenstein nochmal', los: () => meilensteinStarten(msRegion) }
        : schwach && p
        ? { text: 'Runde nochmal spielen', los: () => starte(p, screen.runde) }
        : p && offeneRunde !== undefined
          ? { text: 'Nächste Runde', los: () => starte(p, offeneRunde) }
          : !screen.stunde && !ms && dueCount > 0
            ? { text: 'Weiter wiederholen', los: () => wiederholen() }
            : null;
    return (
      <main className="lq-app lq-ergebnis">
        {!schwach && !(ms && !msGut) && (screen.sterneJetzt > screen.sterneVorher || fazit === 'perfekt' || msGut) && <Jubel stark={fazit === 'perfekt' || msGut} />}
        <AvatarBild avatar={{ ...stand.avatar, hintergrund: '' }} pose={schwach || (ms && !msGut) ? 'denken' : 'jubeln'} animation={schwach || (ms && !msGut) ? 'seufzen' : 'jubeln'} className="lq-ergebnis-held" lebendig />
        {screen.stunde && <Sterne n={screen.sterneJetzt} neu={screen.sterneJetzt > screen.sterneVorher} gross />}
        <h1>{titelText}</h1>
        <p className="lq-untertitel">
          {p ? `${p.titel} · ` : ms ? `${ms.titel} · ` : ''}
          {screen.richtig} von {screen.gesamt} beim ersten Versuch richtig
        </p>
        <ol className="lq-punkte-reihe" aria-hidden>
          {screen.ergebnisse.map((r, i) => (
            <li key={i} className={r ? 'ok' : 'nein'} style={{ animationDelay: `${i * 60}ms` }}>
              {r ? <HakenIcon /> : <KreuzIcon />}
            </li>
          ))}
        </ol>
        {!screen.stunde && screen.richtig < screen.gesamt && <p className="lq-klein lq-mitte">Was noch nicht saß, kommt morgen wieder dran.</p>}
        {schwach && <p className="lq-klein lq-mitte">Das sitzt noch nicht. Spiel die Runde gleich nochmal, dann klappt es besser.</p>}
        {ms && <p className="lq-klein lq-mitte">{msGut ? 'Du kannst die ganze Region. Stark!' : `Ab ${MEILENSTEIN_GUT} % ist der Meilenstein geschafft.`}</p>}
        <div className="lq-kacheln-ergebnis">
          <div>
            <span>Erfahrung</span>
            <strong className="lq-violett">+{screen.plus} EP</strong>
          </div>
          <div>
            <span>Münzen</span>
            <strong className="lq-gold-zahl">+{screen.muenzenPlus + screen.aufgabenPlus}</strong>
          </div>
          <div>
            <span>Woche</span>
            <strong className="lq-gruen">
              {Math.min(w.diese, WOCHENZIEL)} / {WOCHENZIEL}
            </strong>
          </div>
        </div>
        {!screen.plus && <p className="lq-klein lq-mitte">Für heute gibt es keine Erfahrung mehr – aber Üben zählt trotzdem.</p>}
        {screen.wiederholung && (
          <p className="lq-klein lq-mitte">
            {screen.stunde ? 'Diese Runde hattest du schon geschafft. ' : ''}Wiederholen gibt ein Drittel der Erfahrung und Münzen.
          </p>
        )}
        {screen.stunde && <p className="lq-klein lq-mitte">{sterneHinweis(screen.sternePlus, screen.sterneJetzt, screen.sterneRest)}</p>}
        {screen.aufgabenNeu.length > 0 && (
          <p className="lq-punkte-plus" role="status">
            <HakenIcon /> {screen.aufgabenNeu.length > 1 ? 'Tagesaufgaben' : 'Tagesaufgabe'} geschafft:{' '}
            {screen.aufgabenNeu.map((id) => TAGESAUFGABEN.find((t) => t.id === id)?.text).join(', ')} · +{screen.aufgabenPlus} Münzen
          </p>
        )}
        {screen.klassenGeschafft && (
          <p className="lq-punkte-plus" role="status">
            <KlasseIcon /> Klassen-Aufgabe geschafft! Alle, die diese Woche Sterne geholt haben, bekommen eine Truhe.
          </p>
        )}
        {screen.punktePlus > 0 && (
          <p className="lq-punkte-plus" role="status">
            <TicketIcon /> +{screen.punktePlus} Klassenpunkte fürs Wochenziel – einlösbar unter „Held“ → „Gutscheine“.
          </p>
        )}
        {screen.truhenPlus > 0 ? (
          <div className="lq-hinweis-gold lq-mit-icon">
            <TruheIcon />
            <div>
              <strong>{screen.truhenPlus > 1 ? `${screen.truhenPlus} Truhen verdient!` : screen.punktePlus > 0 ? 'Wochenziel erreicht!' : 'Truhe verdient!'}</strong>
              <span>{screen.truhenPlus > 1 ? 'Sie warten beim Helden.' : 'Eine Truhe wartet beim Helden.'}</span>
            </div>
          </div>
        ) : (
          w.diese >= WOCHENZIEL && (
            <div className="lq-hinweis-gold">
              <strong>Wochenziel erreicht!</strong>
              <span>Wochenenden und Ferien setzen nichts zurück.</span>
            </div>
          )
        )}
        <div className="lq-platz" />
        {screen.truhenPlus > 0 && (
          <button type="button" className="lq-knopf lq-gold" onClick={() => setScreen({ kind: 'truhe', zurueck: 'karte' })}>
            Truhe öffnen
          </button>
        )}
        {weiter && (
          <button type="button" className={`lq-knopf ${screen.truhenPlus > 0 ? 'lq-hell' : ''}`} onClick={weiter.los}>
            {weiter.text}
          </button>
        )}
        {screen.stunde && p && !weiter && screen.sterneJetzt < 3 && (
          <button type="button" className="lq-knopf lq-hell" onClick={() => setScreen({ kind: 'station', stunde: screen.stunde })}>
            Für mehr Sterne nochmal
          </button>
        )}
        <button type="button" className={`lq-knopf ${weiter || screen.truhenPlus > 0 ? 'lq-hell' : ''}`} onClick={() => setScreen({ kind: 'karte' })}>
          Zur Karte
        </button>
      </main>
    );
  }

  const tab = screen.kind === 'wiederholen' ? 'wiederholen' : screen.kind === 'held' || screen.kind === 'laden' || screen.kind === 'gutscheine' ? 'held' : screen.kind === 'klasse' ? 'klasse' : screen.kind === 'aufgaben' ? 'aufgaben' : 'karte';
  /** Sign out after asking; rounds not sent yet would be lost, so that is said. */
  const abmeldenFragen = () => {
    const offen = ladeWarteschlange().length;
    const frage = offen
      ? `Abmelden? ${offen === 1 ? 'Eine Runde ist' : `${offen} Runden sind`} noch nicht gesendet und ginge verloren. Besser erst mit Internet öffnen.`
      : 'Abmelden? Zum Weiterspielen brauchst du wieder Klassencode, Namen und PIN.';
    if (window.confirm(frage)) onSignOut();
  };
  const heuteStand = tagesStand(stand.aufgaben, heute());
  const offeneAufgaben = aufgabenVon(heute()).filter((t) => !heuteStand.erledigt.includes(t.id)).length;
  const rahmen = (seite: React.ReactNode) => (
    <main className="lq-app lq-mit-leiste">
      <Kopf daten={daten} offline={offline} onSignOut={abmeldenFragen} />
      {boss && (
        <button type="button" className="lq-boss-band" onClick={() => setScreen({ kind: 'boss', id: boss.id })}>
          <BossBild boss={boss.boss} size={56} />
          <span>
            <strong>Bosskampf läuft!</strong>
            <small>
              {BOSSE[boss.boss]?.name ?? 'Boss'} · {boss.titel}
            </small>
          </span>
          <span className="lq-boss-band-los">Mitmachen</span>
        </button>
      )}
      <div className="lq-inhalt" ref={inhalt}>
        {seite}
      </div>
      <nav className="lq-leiste" aria-label="Hauptmenü">
        <button type="button" className={tab === 'karte' ? 'an' : ''} aria-current={tab === 'karte' ? 'page' : undefined} onClick={() => setScreen({ kind: 'karte' })}>
          <KarteIcon />
          Karte
        </button>
        <button type="button" className={tab === 'aufgaben' ? 'an' : ''} aria-current={tab === 'aufgaben' ? 'page' : undefined} onClick={() => setScreen({ kind: 'aufgaben', ansicht: 'heute' })}>
          <AufgabenIcon />
          Aufgaben
          {offeneAufgaben > 0 && <span className="lq-zahl lq-zahl-gruen" aria-label={`${offeneAufgaben} Tagesaufgaben offen`}>{offeneAufgaben}</span>}
        </button>
        <button type="button" className={tab === 'wiederholen' ? 'an' : ''} aria-current={tab === 'wiederholen' ? 'page' : undefined} onClick={() => setScreen({ kind: 'wiederholen' })}>
          <WiederholenIcon />
          Wiederholen
          {dueCount > 0 && <span className="lq-zahl">{dueCount}</span>}
        </button>
        <button type="button" className={tab === 'held' ? 'an' : ''} aria-current={tab === 'held' ? 'page' : undefined} onClick={() => setScreen({ kind: 'held' })}>
          <HeldIcon />
          Held
          {stand.truhen > 0 && (
            <span className="lq-zahl lq-zahl-gold" aria-label={`${stand.truhen} ${stand.truhen === 1 ? 'Truhe' : 'Truhen'} bereit`}>
              {stand.truhen}
            </span>
          )}
        </button>
        <button type="button" className={tab === 'klasse' ? 'an' : ''} aria-current={tab === 'klasse' ? 'page' : undefined} onClick={() => setScreen({ kind: 'klasse' })}>
          <KlasseIcon />
          Klasse
        </button>
      </nav>
    </main>
  );

  if (screen.kind === 'held') {
    if (screen.willkommen) {
      return (
        <main className="lq-app lq-mit-leiste">
          <div className="lq-willkommen-band" role="status">
            <span>
              <strong>Schritt 1 von 3:</strong> Bau deinen Helden – Haut, Frisur, Augen und mehr.
            </span>
            <button type="button" className="lq-knopf" onClick={miniRunde}>
              Fertig, weiter
            </button>
          </div>
          <div className="lq-inhalt" ref={inhalt}>
            <HeldSeite daten={daten} aktion={aktion} setStand={setStand} onTruhe={() => setScreen({ kind: 'truhe', zurueck: 'held' })} onLaden={() => setScreen({ kind: 'laden' })} onGutscheine={() => setScreen({ kind: 'gutscheine' })} onAbmelden={abmeldenFragen} />
          </div>
        </main>
      );
    }
    return rahmen(<HeldSeite daten={daten} aktion={aktion} setStand={setStand} onTruhe={() => setScreen({ kind: 'truhe', zurueck: 'held' })} onLaden={() => setScreen({ kind: 'laden' })} onGutscheine={() => setScreen({ kind: 'gutscheine' })} onAbmelden={abmeldenFragen} />);
  }
  if (screen.kind === 'gutscheine') {
    return rahmen(<GutscheineSeite daten={daten} aktion={aktion} setStand={setStand} onZurueck={() => setScreen({ kind: 'held' })} />);
  }
  if (screen.kind === 'laden') {
    return rahmen(<LadenSeite daten={daten} aktion={aktion} setStand={setStand} onZurueck={() => setScreen({ kind: 'held' })} />);
  }
  if (screen.kind === 'aufgaben') {
    const ansicht = screen.ansicht;
    return rahmen(
      <div className="lq-aufgaben-seite">
        <h1 className="lq-seitentitel">Aufgaben</h1>
        <div className="lq-umschalter" role="group" aria-label="Ansicht">
          {(['heute', 'woche'] as const).map((a) => (
            <button key={a} type="button" className={ansicht === a ? 'an' : ''} aria-pressed={ansicht === a} onClick={() => setScreen({ kind: 'aufgaben', ansicht: a })}>
              {a === 'heute' ? 'Heute' : 'Woche'}
            </button>
          ))}
        </div>
        {ansicht === 'heute' ? (
          <>
            <Tagesaufgaben stand={stand} />
            <TruhenFortschritt rest={stand.sterneRest} truhen={stand.truhen} onOeffnen={() => setScreen({ kind: 'truhe', zurueck: 'karte' })} />
          </>
        ) : (
          <>
            <Wochenziel tage={stand.tage} />
            <KlassenAufgabeBox stand={stand} />
          </>
        )}
      </div>,
    );
  }

  if (screen.kind === 'klasse') {
    return rahmen(<KlasseSeite aktion={aktion} aufgabe={<KlassenAufgabeBox stand={stand} />} dorf={<DorfBox aktion={aktion} stand={stand} setStand={setStand} />} />);
  }

  if (screen.kind === 'wiederholen') {
    return rahmen(
      <section className="lq-box lq-wiederholen-box">
        <h2>Wiederholen</h2>
        {dueCount ? (
          <>
            <p>
              {dueCount} {dueCount === 1 ? 'Aufgabe ist' : 'Aufgaben sind'} heute dran: Was du schon kannst, kommt seltener, was noch schwer ist, öfter.
            </p>
            <button type="button" className="lq-knopf" onClick={() => wiederholen()}>
              Los geht’s!
            </button>
          </>
        ) : (
          <p>Gerade ist nichts dran. Spiel Stationen auf der Karte – was du dort übst, kommt hier später wieder.</p>
        )}
        {extraHeute && dueCount > 0 && <p className="lq-wdh-hinweis">Deine Lehrkraft hat Aufgaben zum Üben freigegeben, zum Beispiel vor einer Klassenarbeit.</p>}
        {morgen > 0 && (
          <p className="lq-wdh-hinweis">
            {dueCount
              ? `Morgen ${morgen === 1 ? 'kommt 1 Aufgabe' : `kommen ${morgen} Aufgaben`} dazu.`
              : `Morgen ${morgen === 1 ? 'ist 1 Aufgabe' : `sind ${morgen} Aufgaben`} dran.`}
          </p>
        )}
      </section>,
    );
  }

  if (screen.kind === 'hilfe' && daten.pakete[screen.stunde]?.hilfe?.length) {
    const p = daten.pakete[screen.stunde];
    const dann = screen.dann;
    return (
      <HilfeSeite
        titel={p.titel}
        karten={p.hilfe!}
        knopf={dann !== undefined ? 'Verstanden – los geht’s!' : 'Verstanden'}
        onWeiter={() => (dann !== undefined ? starte(p, dann, true) : setScreen({ kind: 'station', stunde: p.stunde }))}
        onZurueck={() => setScreen({ kind: 'station', stunde: p.stunde })}
      />
    );
  }

  const paket = screen.kind === 'station' ? daten.pakete[screen.stunde] : undefined;
  if (paket) {
    const runden = rundenZahl(paket.uebungen.length);
    const best = stand.bestwerte[paket.stunde] ?? [];
    const naechsteNr = naechste(paket);
    return rahmen(
      <section className="lq-station">
        <button type="button" className="lq-link" onClick={() => setScreen({ kind: 'karte' })}>
          ← Zur Karte
        </button>
        <span className="lq-kicker">
          {paket.fach} · {regionName(paket.modul.id, paket.modul.nummer)} · Station {paket.nummer}
        </span>
        <h1>{paket.titel}</h1>
        {!!paket.hilfe?.length && (
          <button type="button" className="lq-knopf lq-hell lq-so-gehts" onClick={() => setScreen({ kind: 'hilfe', stunde: paket.stunde })}>
            <GluehbirneIcon /> So geht’s
          </button>
        )}
        <SterneRegeln best={best} stufen={rundenStufen(paket.uebungen)} n={sterneVon(stand, paket)} />
        <ol className="lq-runden">
          {Array.from({ length: runden }, (_, r) => (
            <li key={r}>
              <button type="button" className={`lq-runde ${geschafft(best[r]) ? 'geschafft' : ''} ${r === naechsteNr ? 'naechste' : ''}`} onClick={() => starte(paket, r)}>
                <span className="lq-runde-nr">{best[r] >= 100 ? '★' : geschafft(best[r]) ? '✓' : r + 1}</span>
                <span>
                  Runde {r + 1}
                  {best[r] > 0 && <small> · bestes Ergebnis {best[r]} %</small>}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="lq-knopf" onClick={() => starte(paket, naechsteNr)}>
          Los geht’s!
        </button>
      </section>,
    );
  }

  // The map.
  const faecher = faecherVon(pakete);
  const aktiv = faecher.includes(fach) ? fach : (faecher[0] ?? '');
  const regionen = regionenVon(pakete, aktiv, stand, new Set(dran));
  const tippen = (s: Station) => {
    const p = s.stunde ? daten.pakete[s.stunde] : undefined;
    if (!p) return;
    if (s.zustand === 'aktuell') starte(p, naechste(p));
    // A faded station is refreshed at once; its rounds stay a tap away on the station page.
    else if (s.zustand === 'erledigt' && s.faellig.length) wiederholen(s.faellig);
    else setScreen({ kind: 'station', stunde: p.stunde });
  };
  // Stufe C: what is due in this subject waits as a node on the path, right before the current station (or at the end).
  const fachDran = regionen.flatMap((r) => r.stationen.flatMap((s) => s.faellig));
  const wdhBei = regionen.findIndex((r) => r.stationen.some((s) => s.zustand === 'aktuell'));
  const wdhRegion = wdhBei >= 0 ? wdhBei : regionen.length - 1;
  const meilensteine = ladeMeilensteine();
  const hinweis = fuchsHinweis(regionen, fachDran.length, new Set(Object.keys(meilensteine).filter((id) => meilensteine[id] >= MEILENSTEIN_GUT)));
  const wdhKnoten = (
    <>
      <button type="button" className="lq-knoten wdh" aria-label={`Wiederholen: ${fachDran.length} Aufgaben aus früheren Stationen`} onClick={() => wiederholen(fachDran)}>
        <WiederholenIcon />
      </button>
      <span className="lq-knoten-titel">Wiederholen</span>
      <span className="lq-klein">
        {fachDran.length} {fachDran.length === 1 ? 'Aufgabe' : 'Aufgaben'}
      </span>
    </>
  );

  // From 1024 px (iPad landscape, laptop) two columns: the week goal beside the map; on a phone one after the other.
  return rahmen(
    <div className="lq-karte-raster">
      <aside className="lq-karte-seite">
        <TruhenFortschritt rest={stand.sterneRest} truhen={stand.truhen} onOeffnen={() => setScreen({ kind: 'truhe', zurueck: 'karte' })} />
      </aside>
      <div className="lq-karte-haupt">
        {faecher.length > 1 && (
          <nav className="lq-faecher" aria-label="Fächer">
            {faecher.map((f) => (
              <button key={f} type="button" className={f === aktiv ? 'an' : ''} aria-pressed={f === aktiv} onClick={() => setFach(f)}>
                {f}
              </button>
            ))}
          </nav>
        )}
        {!pakete.length && <p className="lq-leer">Deine Lehrkraft hat noch keine Station freigeschaltet. Schau bald wieder vorbei!</p>}
        {pakete.length > 0 && (
          <FuchsSagt pose={hinweis.pose}>
            <p>{hinweis.text}</p>
          </FuchsSagt>
        )}
        {regionen.map((r, ri) => {
          const sterne = r.stationen.reduce((n, st) => n + st.sterne, 0);
          const pfad = pfadVon(r, ri === wdhRegion && fachDran.length > 0);
          const punkte: Wegpunkt[] = pfad.map((x) => {
            if (x === 'wdh') return { key: 'wdh', klasse: 'ist-wdh', inhalt: wdhKnoten };
            if (x === 'meilenstein') {
              const best = meilensteine[r.id];
              return {
                key: 'meilenstein',
                klasse: 'ist-meilenstein',
                inhalt: (
                  <>
                    <button type="button" className="lq-knoten meilenstein" disabled={!r.meilenstein} aria-label={`Meilenstein: ${r.titel}`} onClick={() => meilensteinStarten(r)}>
                      {best !== undefined && best >= MEILENSTEIN_GUT ? <HakenIcon /> : r.meilenstein ? <FahneIcon /> : <SchlossIcon />}
                    </button>
                    <span className="lq-knoten-titel">Meilenstein</span>
                    <span className="lq-klein">{!r.meilenstein ? 'Öffnet sich, wenn alle Stationen geschafft sind.' : best !== undefined ? `Bestes Ergebnis ${best} %` : 'Gemischter Test über die ganze Region'}</span>
                  </>
                ),
              };
            }
            const st = x;
            const blass = st.zustand === 'erledigt' && st.faellig.length > 0;
            return {
              key: `s${st.nummer}`,
              klasse: `ist-${st.zustand}`,
              inhalt: (
                <>
                  {st.zustand === 'aktuell' && <AvatarBild avatar={{ ...stand.avatar, hintergrund: '' }} className="lq-pfad-held" lebendig />}
                  {st.zustand !== 'gesperrt' && (
                    <span className="lq-stufen" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={i < st.sterne ? 'an' : ''}>
                          <SternIcon />
                        </span>
                      ))}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`lq-knoten ${st.zustand}${blass ? ' faellig' : ''}`}
                    disabled={st.zustand === 'gesperrt'}
                    aria-label={`${st.zustand === 'gesperrt' ? 'Gesperrt' : st.zustand === 'aktuell' ? 'Station starten' : blass ? 'Auffrischen' : 'Station'}: ${st.titel}${st.zustand === 'gesperrt' ? '' : `, ${st.sterne} von 3 Sternen`}`}
                    onClick={() => tippen(st)}
                  >
                    {blass ? <WiederholenIcon /> : st.zustand === 'erledigt' ? <HakenIcon /> : st.zustand === 'gesperrt' ? <SchlossIcon /> : st.zustand === 'aktuell' ? <SternIcon /> : <span className="lq-knoten-nr">{st.nummer}</span>}
                  </button>
                  <span className="lq-knoten-titel">{st.titel}</span>
                  {blass && <span className="lq-klein">{st.faellig.length} zum Auffrischen</span>}
                </>
              ),
            };
          });
          return (
            <section key={r.id} className="lq-region" aria-label={`${regionName(r.id, r.nummer)}: ${r.titel}`}>
              <Landkarte
                id={r.id}
                nummer={r.nummer}
                mitBoss={pfad.at(-1) === 'meilenstein'}
                punkte={punkte}
                kopf={
                  <div className="lq-region-band">
                    <span>
                      {aktiv} · {regionName(r.id, r.nummer)}
                    </span>
                    <h2>{r.titel}</h2>
                    <small className="lq-region-sterne" aria-label={`${sterne} von ${3 * r.stationen.length} Sternen`}>
                      <SternIcon />
                      {sterne} / {3 * r.stationen.length}
                    </small>
                    {r.stationen.some((st) => st.zustand === 'gesperrt') && <p className="lq-klein">Graue Stationen öffnen sich, sobald ihr sie im Unterricht hattet.</p>}
                  </div>
                }
              />
            </section>
          );
        })}
      </div>
    </div>,
  );
}

/** The nodes on a region's path: its stations, the „Wiederholen“ node before the current one (or at the end), the
 *  Meilenstein last (regions with at least two stations). */
function pfadVon(r: Region, mitWdh: boolean): (Station | 'wdh' | 'meilenstein')[] {
  const out: (Station | 'wdh' | 'meilenstein')[] = [...r.stationen];
  if (mitWdh) {
    const i = out.findIndex((s) => s !== 'wdh' && s !== 'meilenstein' && s.zustand === 'aktuell');
    out.splice(i >= 0 ? i : out.length, 0, 'wdh');
  }
  if (r.stationen.length >= 2) out.push('meilenstein');
  return out;
}

/** The line under a station's result: new stars, and how many are missing for the next chest. */
function sterneHinweis(plus: number, jetzt: number, rest: number): string {
  const fehlen = STERNE_JE_TRUHE - rest;
  const bis = `noch ${fehlen} ${fehlen === 1 ? 'Stern' : 'Sterne'} bis zur nächsten Truhe`;
  const neu = `+${plus} ${plus === 1 ? 'Stern' : 'Sterne'}`;
  // Fewer stars left over than came in: they filled a chest.
  if (plus > 0) return rest < plus ? `${neu} – die Truhe ist voll! Noch ${fehlen} bis zur nächsten.` : `${neu} – ${bis}.`;
  if (jetzt === 0) return `Spiel alle Runden für den ersten Stern – ${bis}.`;
  if (jetzt < 3) return `Fehlerfreie Runden bringen mehr Sterne – ${bis}.`;
  return `Alle Sterne geholt – ${bis}.`;
}

/** The stars of a station and what each one needs, ticked when reached (rules in `sternZiele`, rules.ts). `n`: the stars shown. */
function SterneRegeln({ best, stufen, n }: { best: number[]; stufen: readonly number[]; n: number }) {
  const alle = stufen.length;
  const name = ['Kennenlernen', 'Anwenden', 'Meistern'];
  const regeln = sternZiele(stufen).map((z, i) => {
    if (z.art === 'schnitt') return `${name[i]}: im Schnitt 80 % richtig`;
    if (z.art === 'fehlerfrei') return `${name[i]}: jede Runde einmal ohne Fehler (${best.slice(0, alle).filter((b) => b >= 100).length} von ${alle})`;
    const k = z.runden.length;
    const was = k === alle ? (alle === 1 ? 'die Runde' : `alle ${alle} Runden`) : k === 1 ? `Runde ${z.runden[0] + 1}` : `Runde ${z.runden.slice(0, -1).map((r) => r + 1).join(', ')} und ${z.runden[k - 1] + 1}`;
    return `${name[i]}: ${was} mit 60 % schaffen${k > 1 ? ` (${z.runden.filter((r) => geschafft(best[r])).length} von ${k})` : ''}`;
  });
  return (
    <div className="lq-sterne-regeln">
      <Sterne n={n} gross />
      <ul>
        {regeln.map((text, i) => (
          <li key={i} className={i < n ? 'an' : ''}>
            <span aria-hidden>{i < n ? <HakenIcon /> : <SternIcon />}</span>
            {text}
            <span className="lq-unsichtbar">{i < n ? ' – geschafft' : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Stars toward the next chest (je 3 eine Truhe), and the chests waiting. */
function TruhenFortschritt({ rest, truhen, onOeffnen }: { rest: number; truhen: number; onOeffnen: () => void }) {
  const fehlen = STERNE_JE_TRUHE - rest;
  return (
    <section className="lq-box lq-truhen-fortschritt">
      <span className="lq-truhen-icon">
        <TruheIcon />
      </span>
      <div>
        <h2>Nächste Truhe</h2>
        <span className="lq-sterne" aria-label={`${rest} von ${STERNE_JE_TRUHE} Sternen, noch ${fehlen}`}>
          {Array.from({ length: STERNE_JE_TRUHE }, (_, i) => (
            <span key={i} className={i < rest ? 'an' : ''} aria-hidden>
              <SternIcon />
            </span>
          ))}
        </span>
        <span className="lq-klein">
          Noch {fehlen} {fehlen === 1 ? 'Stern' : 'Sterne'}
        </span>
      </div>
      {truhen > 0 && (
        <button type="button" className="lq-knopf lq-gold lq-klein-knopf" onClick={onOeffnen}>
          {truhen > 1 ? `${truhen} öffnen` : 'Öffnen'}
        </button>
      )}
    </section>
  );
}

export function Sterne({ n, neu = false, gross = false }: { n: number; neu?: boolean; gross?: boolean }) {
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

/** Stufe D: today's three tasks, the same for the whole class; the server pays them with the round. */
function Tagesaufgaben({ stand }: { stand: Stand }) {
  const tag = heute();
  const a = tagesStand(stand.aufgaben, tag);
  const liste = aufgabenVon(tag);
  const fertig = liste.filter((t) => a.erledigt.includes(t.id)).length;
  return (
    <section className="lq-box lq-tagesaufgaben">
      <div className="lq-zeile-zwischen">
        <h2>Tagesaufgaben</h2>
        <strong>{fertig === 3 ? 'Alle geschafft!' : `${fertig} von 3`}</strong>
      </div>
      <ul>
        {liste.map((t) => {
          const ok = a.erledigt.includes(t.id);
          const n = Math.min(t.ziel, a.zaehler[t.zaehler] ?? 0);
          return (
            <li key={t.id} className={ok ? 'ok' : ''}>
              <span className="lq-aufgabe-icon" aria-hidden="true">
                {ok ? <HakenIcon /> : <AufgabeIcon art={t.zaehler} />}
              </span>
              <span className="lq-aufgabe-text">
                {t.text}
                {ok && <span className="lq-unsichtbar"> (geschafft)</span>}
                <span className="lq-aufgabe-balken" aria-hidden="true">
                  <span style={{ width: `${(100 * (ok ? t.ziel : n)) / t.ziel}%` }} />
                </span>
                <small>
                  {ok ? t.ziel : n} / {t.ziel}
                </small>
              </span>
              <small className="lq-gold-zahl">+{AUFGABE_MUENZEN}</small>
            </li>
          );
        })}
      </ul>
      <span className="lq-klein">Alle drei: +{AUFGABEN_BONUS} Münzen extra. Morgen gibt es neue.</span>
    </section>
  );
}

/** Stufe D, Teil 2: the class collects new stars together this week; only the sum, no ranking. */
function KlassenAufgabeBox({ stand }: { stand: Stand }) {
  const a = stand.klassenAufgabe;
  if (!a) return null;
  // A new week since the last answer of the server: nothing collected yet.
  const neu = a.woche !== wochenStart(heute());
  const sterne = neu ? 0 : a.sterne;
  const geschafft = !neu && (a.geschafft || sterne >= a.ziel);
  const eigene = neu ? 0 : (stand.sterneWoche ?? 0);
  return (
    <section className="lq-box lq-klassenaufgabe">
      <div className="lq-zeile-zwischen">
        <h2>Klassen-Aufgabe</h2>
        <strong>{geschafft ? 'Geschafft!' : `${sterne} von ${a.ziel} Sternen`}</strong>
      </div>
      <div className="lq-balken" role="progressbar" aria-label="Sterne der Klasse diese Woche" aria-valuemin={0} aria-valuemax={a.ziel} aria-valuenow={Math.min(sterne, a.ziel)}>
        <span style={{ width: `${Math.min(100, (100 * sterne) / a.ziel)}%` }} />
      </div>
      <span className="lq-klein">
        {geschafft
          ? eigene > 0
            ? 'Ihr habt es zusammen geschafft – deine Truhe wartet beim Helden.'
            : 'Ihr habt es geschafft! Hol dir einen Stern, dann bekommst du auch eine Truhe.'
          : `Sammelt diese Woche zusammen Sterne. Geschafft gibt es eine Truhe für alle, die mitgemacht haben.${eigene > 0 ? ` Von dir: ${eigene}.` : ''}`}
      </span>
    </section>
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
  const kopf = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const zu = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !kopf.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('keydown', zu);
    document.addEventListener('pointerdown', zu);
    return () => {
      document.removeEventListener('keydown', zu);
      document.removeEventListener('pointerdown', zu);
    };
  }, [menu]);
  const [tonOn, setTonOn] = useState(tonAn);
  const [ruhigOn, setRuhigOn] = useState(ruhigAn);
  const h = heldenstufe(daten.stand.xp);
  const w = woche(daten.stand.tage);
  return (
    <header className="lq-kopf" ref={kopf}>
      <button type="button" className="lq-avatar" aria-label="Menü" aria-expanded={menu} onClick={() => setMenu(!menu)}>
        <AvatarBild avatar={daten.stand.avatar} ausschnitt={AUSSCHNITT_KOPF} className="lq-avatar-bild" />
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
      <Muenzen n={daten.stand.muenzen} />
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
          <label>
            <input
              type="checkbox"
              checked={ruhigOn}
              onChange={(e) => {
                setzeRuhig(e.target.checked);
                setRuhigOn(e.target.checked);
              }}
            />{' '}
            Bewegung reduzieren
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
const SchlossIcon = () => (
  <svg {...svg} width={28} height={28}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
export const SternIcon = () => (
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
const FahneIcon = () => (
  <svg {...svg} width={30} height={30} strokeWidth={2.4}>
    <path d="M6 21V4M6 4h11l-2.5 4L17 12H6" />
  </svg>
);
const WiederholenIcon = () => (
  <svg {...svg} strokeWidth={2.2}>
    <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
  </svg>
);

/** The tab of today's tasks: a list with a tick. */
const AufgabenIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="4" y="3.5" width="16" height="17" rx="3" />
    <path d="m8 9 1.5 1.5L12 8M8 15.5h8M14 9.5h2" />
  </svg>
);

/** A small picture per kind of daily task (what it counts). */
function AufgabeIcon({ art }: { art: string }) {
  const p: Record<string, React.ReactNode> = {
    geschafft: <path d="M6 21V4m0 1h11l-2.5 4L17 13H6" />,
    fehlerfrei: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" />
      </>
    ),
    wdh: <path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4" />,
    runden: <path d="M8 5v14l11-7Z" />,
    richtig: <path d="m4.5 12.5 5 5L20 7" />,
    sterne: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />,
    neu: <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Zm0 0v14m6-12v14" />,
  };
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {p[art] ?? p.richtig}
    </svg>
  );
}
