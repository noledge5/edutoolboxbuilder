// Bosskampf (Stufe 3), after docs/design/lernquest/Boss-Beamer.dc.html and Boss-Handy.dc.html: the class fights a boss
// together. The projector view (teacher, `lernquest/#beamer=<id>`) shows the question; the phones show only the four
// answers with a shape each. Both ask the server once a second (lq_boss_beamer / lq_boss_stand); the server checks the
// answers and gives the chests. No ranking: the projector shows counts, never names.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BOSSE, FORMEN } from '../boss';
import { GOLEM, RAETSELDRACHE, TINTENKRAKE, type Figur } from '../figuren';
import { FigurBild } from '../figuren/Figur';
import { beitrittsLink } from '../karte';
import { loadLehrkraft } from '../lehrkraft';
import { BOSS_HERZEN, BOSS_ZEIT_MS, PUNKTE_BOSS } from '../rules';
import { bossAntworten, bossBeamer, bossBeenden, bossStand, bossWeiter, LqError, lqText, type BossBeamerStand, type BossKindStand, type BossStand } from '../server';
import { QrBild } from './QrBild';
import { ton } from './ton';
import { Rich } from './Uebungen';

/** How often the projector and the phones ask the server. */
const TAKT_MS = 1000;
/** After this long without an answer the page offers „Nochmal“ (design rules, „Lädt“). */
export const LANGSAM_MS = 10_000;

/** Calls `f` again `ms` after each answer (not on a fixed clock, so slow answers never pile up). */
function useTakt(f: () => Promise<void>, ms: number, an: boolean) {
  const ref = useRef(f);
  ref.current = f;
  useEffect(() => {
    if (!an) return;
    let weg = false;
    let timer = 0;
    const lauf = async () => {
      await ref.current().catch(() => {});
      if (!weg) timer = window.setTimeout(lauf, ms);
    };
    void lauf();
    return () => {
      weg = true;
      window.clearTimeout(timer);
    };
  }, [ms, an]);
}

/** True when `busy` has lasted 10 s. */
export function useLangsam(busy: boolean): boolean {
  const [langsam, setLangsam] = useState(false);
  useEffect(() => {
    setLangsam(false);
    if (!busy) return;
    const t = window.setTimeout(() => setLangsam(true), LANGSAM_MS);
    return () => window.clearTimeout(t);
  }, [busy]);
  return langsam;
}

/** Seconds left of the question, counted on this device from the server's `rest`. */
function useSekunden(s: BossStand | null): number {
  const ende = useRef(0);
  const frage = useRef('');
  const [jetzt, setJetzt] = useState(() => Date.now());
  const k = s ? `${s.id}:${s.frage}:${s.phase}` : '';
  if (s && (k !== frage.current || Math.abs(Date.now() + s.rest - ende.current) > 1500)) {
    frage.current = k;
    ende.current = Date.now() + s.rest;
  }
  const laeuft = s?.phase === 'frage';
  useEffect(() => {
    if (!laeuft) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [laeuft]);
  return laeuft ? Math.max(0, Math.ceil((ende.current - jetzt) / 1000)) : 0;
}

// — Pieces —

export function Form({ i, size = 44 }: { i: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" className="lq-form">
      {i === 0 && <path d="M22 4 41 38H3Z" />}
      {i === 1 && <path d="M22 2 42 22 22 42 2 22Z" />}
      {i === 2 && <circle cx="22" cy="22" r="19" />}
      {i === 3 && <rect x="4" y="4" width="36" height="36" rx="4" />}
    </svg>
  );
}

function Zeitring({ sekunden, gross = false }: { sekunden: number; gross?: boolean }) {
  const r = 40;
  const u = 2 * Math.PI * r;
  const anteil = Math.min(1, sekunden / (BOSS_ZEIT_MS / 1000));
  return (
    <div className={`lq-zeitring ${gross ? 'gross' : ''}`} role="timer" aria-label={`Noch ${sekunden} Sekunden`}>
      <svg viewBox="0 0 92 92" aria-hidden="true">
        <circle cx="46" cy="46" r={r} className="spur" />
        <circle cx="46" cy="46" r={r} className="rest" strokeDasharray={u} strokeDashoffset={u * (1 - anteil)} transform="rotate(-90 46 46)" />
      </svg>
      <span>{sekunden}</span>
    </div>
  );
}

function Lebensbalken({ s, gross = false }: { s: BossStand; gross?: boolean }) {
  const anteil = s.lpMax ? Math.max(0, Math.min(1, s.lp / s.lpMax)) : 1;
  return (
    <div className={`lq-lebensbalken ${gross ? 'gross' : ''}`}>
      {!gross && (
        <div className="lq-lebensbalken-kopf">
          <span>{BOSSE[s.boss]?.name ?? 'Boss'}</span>
          <span>{s.lpMax ? `${s.lp} / ${s.lpMax}` : ''}</span>
        </div>
      )}
      <div className="lq-balken" role="meter" aria-label="Lebenspunkte des Bosses" aria-valuenow={s.lp} aria-valuemin={0} aria-valuemax={s.lpMax || 1}>
        <div style={{ transform: `scaleX(${anteil})` }} />
      </div>
      {gross && <span className="lq-lebensbalken-zahl">{s.lpMax ? `${s.lp} / ${s.lpMax} Lebenspunkte` : 'Lebenspunkte richten sich nach allen, die mitmachen'}</span>}
    </div>
  );
}

function KlassenHerzen({ n }: { n: number }) {
  return (
    <div className="lq-klassen-herzen" role="img" aria-label={`${n} von ${BOSS_HERZEN} Leben`}>
      {Array.from({ length: BOSS_HERZEN }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true" className={i < n ? 'voll' : 'leer'}>
          <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.2 3 4.5 6.7 4.5c2.2 0 3.7 1.2 5.3 3 1.6-1.8 3.1-3 5.3-3 3.7 0 5.8 3.7 4.3 7.1C19.5 16.4 12 21 12 21Z" />
        </svg>
      ))}
    </div>
  );
}

/** Counts the hits: goes up each time the boss's life points drop. */
function useTreffer(lp: number | undefined): number {
  const vorher = useRef(lp);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (lp !== undefined && vorher.current !== undefined && lp < vorher.current) setN((x) => x + 1);
    vorher.current = lp;
  }, [lp]);
  return n;
}

/** The bosses as moving figures (figuren/), in the order of BOSSE, and what each does while it waits. */
const BOSS_FIGUR: { figur: Figur; ruhe: string }[] = [
  { figur: GOLEM, ruhe: 'stampfen' },
  { figur: TINTENKRAKE, ruhe: 'schweben' },
  { figur: RAETSELDRACHE, ruhe: 'flattern' },
];

/** A boss. From 100 px on it moves: it idles, flinches when `lp` drops (a hit) and falls when beaten. */
export function BossBild({ boss, size = 320, gefallen = false, lp }: { boss: number; size?: number; gefallen?: boolean; lp?: number }) {
  const treffer = useTreffer(lp);
  const bewegt = size >= 100;
  const { figur, ruhe } = BOSS_FIGUR[boss] ?? BOSS_FIGUR[0];
  return (
    <FigurBild
      key={treffer}
      figur={figur}
      titel={BOSSE[boss]?.name ?? 'Boss'}
      className={`lq-boss-bild ${gefallen ? 'gefallen' : ''}`}
      breite={size}
      lebendig={bewegt}
      pose={gefallen ? 'besiegt' : 'lauern'}
      animation={!bewegt ? undefined : treffer || gefallen ? 'treffer' : ruhe}
      danach={bewegt && !gefallen ? ruhe : undefined}
    />
  );
}

// — The projector (teacher) —

export function BossBeamer({ id, klasse = '' }: { id: string; klasse?: string }) {
  const [keys, setKeys] = useState<string[] | null | undefined>(undefined);
  const [s, setS] = useState<BossBeamerStand | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [wackelt, setWackelt] = useState(false);
  const [scale, setScale] = useState(1);
  const langsam = useLangsam(!s && !msg && keys !== null);
  const sekunden = useSekunden(s);
  const phaseVorher = useRef('');
  const link = useMemo(() => (klasse ? beitrittsLink(location.origin + location.pathname, klasse) : ''), [klasse]);

  useEffect(() => {
    void loadLehrkraft().then((l) => setKeys(l?.keys ?? null));
  }, []);

  // The stage is 1080 × 608 (16 : 9) and scaled to the window, so the projector shows the same at any size.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1080, window.innerHeight / 608));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const holen = useCallback(async () => {
    if (!keys) return;
    try {
      const r = await bossBeamer(keys, id);
      setS(r);
      setWackelt(false);
      if (r.phase !== phaseVorher.current) {
        if (r.phase === 'aufloesung') ton('richtig');
        if (r.phase === 'ende') ton(r.sieg ? 'fertig' : 'falsch');
        phaseVorher.current = r.phase;
      }
    } catch (e) {
      if (e instanceof TypeError) setWackelt(true);
      else setMsg(lqText(e));
    }
  }, [keys, id]);
  useTakt(holen, TAKT_MS, !!keys && !msg && s?.phase !== 'ende');

  const weiter = useCallback(async () => {
    if (!keys || busy) return;
    setBusy(true);
    try {
      setS(await bossWeiter(keys, id));
      setMsg('');
    } catch (e) {
      if (e instanceof LqError && e.code === 'leer') setMsg(lqText(e));
      else if (e instanceof TypeError) setWackelt(true);
      else setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  }, [keys, id, busy]);

  const beenden = async () => {
    if (!keys || !window.confirm('Den Bosskampf beenden? Es gibt dann keine Truhe.')) return;
    try {
      setS(await bossBeenden(keys, id));
    } catch (e) {
      setMsg(lqText(e));
    }
  };

  // Space or → for „Weiter“ (a presenter remote sends these).
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') && s && s.phase !== 'ende' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        void weiter();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [s, weiter]);

  if (keys === null) {
    return (
      <main className="lq-app lq-nacht lq-beamer-hinweis">
        <h1>Bosskampf</h1>
        <p>Diese Ansicht startet die Lehrkraft im Baukasten (Übersicht → „Lernquest“) auf diesem Gerät.</p>
      </main>
    );
  }
  if (!s) {
    return (
      <main className="lq-app lq-nacht lq-beamer-hinweis" aria-busy={!msg}>
        <h1>Bosskampf</h1>
        <p>{msg || 'Einen Moment …'}</p>
        {(langsam || msg) && (
          <button type="button" className="lq-knopf lq-gold" onClick={() => location.reload()}>
            Nochmal
          </button>
        )}
      </main>
    );
  }

  const offen = s.phase === 'aufloesung' || s.phase === 'ende';
  const karten = s.modus === 'karten';
  const weiterText = s.phase === 'warten' ? 'Los geht’s!' : s.phase === 'frage' ? 'Auflösen' : 'Nächste Frage';
  return (
    <main className="lq-beamer-rahmen">
      <div className="lq-beamer lq-nacht" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <header className="lq-beamer-kopf">
          <div>
            <span className="lq-beamer-kicker">
              Bosskampf · {s.titel}
            </span>
            <h1>{s.phase === 'warten' ? BOSSE[s.boss]?.name : s.phase === 'ende' ? (s.sieg ? 'Gewonnen!' : 'Der Boss ist entkommen') : `Frage ${s.frage + 1} von ${s.fragen}`}</h1>
          </div>
          <div className="lq-beamer-mitmachen">
            {karten ? (
              <>
                Mitmachen: <strong>Karte hochhalten</strong>, deine Antwort oben
              </>
            ) : (
              <>
                Mitmachen: Lernquest öffnen → <strong>Bosskampf</strong>
              </>
            )}
          </div>
          {s.phase === 'frage' && !karten ? <Zeitring sekunden={sekunden} gross /> : <div className="lq-zeitring gross" aria-hidden="true" />}
        </header>

        <div className="lq-beamer-mitte">
          <div className="lq-beamer-boss">
            <BossBild boss={s.boss} size={250} gefallen={s.phase === 'ende' && !!s.sieg} lp={s.lp} />
            <Lebensbalken s={s} gross />
          </div>

          <div className="lq-beamer-frage" aria-live="polite">
            {s.phase === 'warten' ? (
              <div className="lq-beamer-karte lq-beamer-warten">
                {karten ? (
                  <div className="lq-beamer-warten-text">
                    <p className="lq-beamer-text">Kampf mit Antwortkarten</p>
                    <p className="lq-beamer-klein">
                      Steht die Frage da, haltet eure Karte hoch: Der Buchstabe eurer Antwort zeigt nach oben. Wer erkannt ist, wird grün. Richtig = Schaden, ab 3 in Folge doppelt. Liegt weniger als die Hälfte richtig, trifft der Boss die Klasse.
                    </p>
                  </div>
                ) : (
                  <div className="lq-beamer-warten-text">
                    <p className="lq-beamer-text">
                      <strong>{s.kinder}</strong> {s.kinder === 1 ? 'Kind ist' : 'Kinder sind'} dabei.
                    </p>
                    <p className="lq-beamer-klein">Richtig = Schaden, schnell und in Serie mehr. Liegt weniger als die Hälfte richtig, trifft der Boss die Klasse.</p>
                  </div>
                )}
                {link && !karten && (
                  <figure className="lq-beamer-qr">
                    <QrBild link={link} label="QR-Code zum Mitmachen beim Bosskampf" />
                    <figcaption>Scannen, anmelden und mitmachen</figcaption>
                  </figure>
                )}
              </div>
            ) : s.phase === 'ende' ? (
              <div className="lq-beamer-karte">
                <p className="lq-beamer-text">
                  {s.sieg
                    ? s.truhen
                      ? s.truhen === 1
                        ? `Eine Truhe und ${PUNKTE_BOSS} Klassenpunkte sind verteilt – sie warten beim Helden.`
                        : `${s.truhen} Truhen und je ${PUNKTE_BOSS} Klassenpunkte sind verteilt – sie warten beim Helden.`
                      : 'Diesen Boss habt ihr schon besiegt: keine neue Truhe, aber gut geübt!'
                    : 'Übt die Stationen der Region und fordert ihn noch einmal heraus.'}
                </p>
              </div>
            ) : (
              <>
                <div className="lq-beamer-karte">
                  {s.aussage ? (
                    <>
                      <span className="lq-beamer-klein">
                        <Rich text={s.text} />
                      </span>
                      <span className="lq-beamer-text">
                        <Rich text={s.aussage} />
                      </span>
                    </>
                  ) : (
                    <span className="lq-beamer-text">
                      <Rich text={s.text} />
                    </span>
                  )}
                </div>
                <ol className="lq-beamer-antworten">
                  {s.optionen.map((o, i) => (
                    <li key={i} className={`lq-antwort a${i} ${offen ? (i === s.richtig ? 'richtig' : 'aus') : ''}`}>
                      <Form i={i} />
                      {karten && <span className="lq-antwort-buchstabe">{'ABCD'[i]}</span>}
                      <span className="lq-antwort-text">
                        <Rich text={o} />
                      </span>
                      {offen && (
                        <span className="lq-antwort-zahl">
                          {i === s.richtig && <span aria-label="richtige Antwort">✓ </span>}
                          {s.verteilung?.[i] ?? 0}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            )}
            <div className="lq-platz" />
            {karten && s.phase !== 'warten' && s.phase !== 'ende' && (
              <div className="lq-beamer-erkannt" aria-label="Erkannte Karten">
                <span>
                  {s.antworten} {s.antworten === 1 ? 'Karte' : 'Karten'} erkannt
                </span>
                <ul>
                  {(s.erkannt ?? []).map((n, k) => (
                    <li key={k}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            {!karten && s.phase !== 'warten' && s.phase !== 'ende' && (
              <div className="lq-beamer-geantwortet">
                <span>
                  {s.antworten} von {s.kinder} haben geantwortet
                </span>
                <div className="lq-balken hell">
                  <div style={{ transform: `scaleX(${s.kinder ? s.antworten / s.kinder : 0})` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="lq-beamer-fuss">
          <span className="lq-beamer-klasse">{s.klasse}</span>
          <KlassenHerzen n={s.herzen} />
          <div className="lq-platz" />
          {wackelt && <span className="lq-beamer-klein">Verbindung wackelt …</span>}
          {msg && <span className="lq-beamer-klein">{msg}</span>}
          {s.phase !== 'ende' ? (
            <>
              <button type="button" className="lq-knopf lq-nacht-knopf" onClick={() => void beenden()}>
                Beenden
              </button>
              <button type="button" className="lq-knopf lq-gold" onClick={() => void weiter()} disabled={busy || (s.phase === 'warten' && !s.kinder && !karten)} aria-busy={busy}>
                {busy ? 'Einen Moment …' : weiterText}
              </button>
            </>
          ) : (
            <button type="button" className="lq-knopf lq-nacht-knopf" onClick={() => window.close()}>
              Schließen
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}

// — The phone (child) —

interface KindProps {
  token: string;
  id: string;
  klasse: string;
  /** The fight is over or left; `truhe` when the child got a chest (the Spielstand needs reloading). */
  onFertig(truhe: boolean): void;
  onTruhe(): void;
  fail(e: unknown): void;
}

export function BossKind({ token, id, klasse, onFertig, onTruhe, fail }: KindProps) {
  const [s, setS] = useState<BossKindStand | null>(null);
  const [wackelt, setWackelt] = useState(false);
  const [gesendet, setGesendet] = useState<{ frage: number; wahl: number } | null>(null);
  const [zuSpaet, setZuSpaet] = useState(false);
  const sekunden = useSekunden(s);
  const langsam = useLangsam(!s);
  const gemeldet = useRef('');

  const holen = useCallback(async () => {
    try {
      const r = await bossStand(token, id);
      setS(r);
      setWackelt(false);
      const k = `${r.frage}:${r.phase}`;
      if (k !== gemeldet.current) {
        gemeldet.current = k;
        if (r.phase === 'aufloesung' && r.wahl != null) ton(r.wahl === r.richtig ? 'richtig' : 'falsch');
        if (r.phase === 'ende' && r.sieg) ton('fertig');
      }
    } catch (e) {
      if (e instanceof TypeError) setWackelt(true);
      else fail(e);
    }
  }, [token, id, fail]);
  useTakt(holen, TAKT_MS, s?.phase !== 'ende');

  const antworten = async (wahl: number) => {
    if (!s || s.phase !== 'frage' || s.wahl != null || gesendet?.frage === s.frage) return;
    setGesendet({ frage: s.frage, wahl });
    setZuSpaet(false);
    try {
      const r = await bossAntworten(token, id, s.frage, wahl);
      if (!r.angenommen) setZuSpaet(true);
      void holen();
    } catch (e) {
      setGesendet(null);
      if (e instanceof TypeError) setWackelt(true);
      else fail(e);
    }
  };

  if (!s) {
    return (
      <main className="lq-app lq-nacht lq-boss-handy" aria-busy="true">
        <span className="lq-truhe-kicker">Bosskampf · {klasse}</span>
        <p className="lq-meldung">{wackelt ? 'Keine Verbindung zum Server. Prüfe das Internet.' : 'Einen Moment …'}</p>
        {langsam && (
          <button type="button" className="lq-knopf lq-gold" onClick={() => void holen()}>
            Nochmal
          </button>
        )}
        <button type="button" className="lq-knopf lq-nacht-knopf" onClick={() => onFertig(false)}>
          Zur Karte
        </button>
      </main>
    );
  }

  const meine = s.wahl ?? (gesendet?.frage === s.frage ? gesendet.wahl : null);
  const offen = s.phase === 'aufloesung' || s.phase === 'ende';
  return (
    <main className="lq-app lq-nacht lq-boss-handy">
      <div className="lq-boss-kopf">
        <div>
          <span className="lq-truhe-kicker">Bosskampf · {klasse}</span>
          <h1>{s.phase === 'warten' ? 'Gleich geht es los' : s.phase === 'ende' ? (s.sieg ? 'Gewonnen!' : 'Der Boss ist entkommen') : `Frage ${s.frage + 1} – schau zum Beamer`}</h1>
        </div>
        {s.phase === 'frage' && <Zeitring sekunden={sekunden} />}
      </div>
      <Lebensbalken s={s} />
      {wackelt && <p className="lq-band">Verbindung wackelt … dein Gerät versucht es weiter.</p>}

      {s.phase === 'warten' && (
        <div className="lq-boss-mitte">
          <BossBild boss={s.boss} size={200} lp={s.lp} />
          <p className="lq-meldung">Du bist dabei. Schau zum Beamer: Dort stehen die Fragen, hier tippst du die Antwort.</p>
        </div>
      )}

      {s.phase === 'ende' && (
        <div className="lq-boss-mitte">
          <BossBild boss={s.boss} size={200} gefallen={!!s.sieg} lp={s.lp} />
          <p className="lq-meldung">
            {s.sieg ? (s.truhe ? `Ihr habt ihn besiegt! Eine Truhe und ${PUNKTE_BOSS} Klassenpunkte warten beim Helden.` : 'Ihr habt ihn besiegt!') : 'Übt die Stationen der Region – dann klappt es beim nächsten Mal.'}
          </p>
        </div>
      )}

      {(s.phase === 'frage' || s.phase === 'aufloesung') && (
        <div className={`lq-pads n${s.optionen.length}`} role="group" aria-label="Antworten">
          {s.optionen.map((o, i) => (
            <button
              key={i}
              type="button"
              className={`lq-pad a${i} ${meine === i ? 'gewaehlt' : ''} ${offen ? (i === s.richtig ? 'richtig' : 'aus') : meine != null && meine !== i ? 'aus' : ''}`}
              disabled={s.phase !== 'frage' || meine != null}
              aria-pressed={meine === i}
              aria-label={`${FORMEN[i]}: ${o}${offen && i === s.richtig ? ', richtige Antwort' : ''}${meine === i ? ', deine Antwort' : ''}`}
              onClick={() => void antworten(i)}
            >
              <Form i={i} size={52} />
              <span>
                <Rich text={o} />
              </span>
              {offen && i === s.richtig && <span className="lq-pad-marke">✓</span>}
            </button>
          ))}
        </div>
      )}

      <div className="lq-boss-serie" aria-live="polite" hidden={s.phase === 'ende'}>
        {s.phase === 'frage' && meine != null ? (
          <span className="fd">{zuSpaet ? 'Zu spät – die Zeit war schon um.' : 'Antwort ist angekommen. Schau zum Beamer!'}</span>
        ) : s.phase === 'aufloesung' && s.wahl != null ? (
          <span className="fd">{s.wahl === s.richtig ? `✓ Richtig! ${s.schaden ?? 0} Schaden` : '✗ Leider falsch. Die richtige Antwort ist markiert.'}</span>
        ) : s.phase === 'aufloesung' ? (
          <span className="fd">Diesmal keine Antwort von dir.</span>
        ) : (
          <span className="fd">Deine Serie: {s.serie} richtig</span>
        )}
        {s.phase !== 'ende' && <small>Schnell und richtig = mehr Schaden, ab 3 in Folge doppelt</small>}
        {s.serie >= 3 && s.phase !== 'ende' && <span className="lq-serie-marke">× 2</span>}
      </div>

      {s.phase === 'ende' && (
        <>
          {s.truhe && (
            <button type="button" className="lq-knopf lq-gold" onClick={onTruhe}>
              Truhe öffnen
            </button>
          )}
          <button type="button" className="lq-knopf lq-nacht-knopf" onClick={() => onFertig(s.truhe)}>
            Zur Karte
          </button>
        </>
      )}
    </main>
  );
}
