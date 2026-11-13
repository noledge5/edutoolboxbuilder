// The teacher's Lernquest page in the Baukasten (#/lernquest): classes and children with PINs, cards with QR code
// to print, lessons to unlock (their Lernpaket goes to the class), progress at a glance, unlock locked accounts, and
// the boss fight on the projector (Stufe 3: the questions are made here, the projector view is Lernquest's #beamer=),
// class points, vouchers and requests, and progress per competence (Stufe 4: `Belohnungen.tsx`, `Auswertung.tsx`).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, IdCard, Images, Lock, MessageCircleQuestion, Plus, Printer, RefreshCw, RotateCcw, ScanLine, Sparkles, Swords, Trash2, Unlock } from 'lucide-react';
import { Icon } from '../../icons';
import { isWorkedOut } from '../../library/model';
import { SearchButton } from '../../library/SearchDialog';
import type { ExtraPaket, Lesson, Library, Module } from '../../library/types';
import { ExtraPakete, extraSenden } from './ExtraPakete';
import { KlassenDorf } from './KlassenDorf';
import { classProfileOf } from '../../ai/classNotes';
import { jsonOf } from '../../ai/client';
import { runAi, useAiSettings } from '../../ai/useAi';
import { freigegeben, frueherVon, POOL_MAX, poolAnfrage, poolAusAntwort } from '../fragenpool';
import { FragenpoolDialog } from './Fragenpool';
import { PunkteDialog } from './PunkteDialog';
import { paketSenden } from './senden';
import { ensureLehrkraft, kartenNummern, updateLehrkraft, type Lehrkraft } from '../lehrkraft';
import { STUFEN, stufenPlan, stufeVon, type Stufe } from '../sichtbarkeit';
import { BOSS_FRAGEN_MIN, bossFragen, bossVon, type BossFrage } from '../boss';
import { buildPaket, exercisesOf } from '../paket';
import { istExtraModul, mitExtras, regionLabel } from '../extra';
import { BOSS_FRAGEN, heldenstufe, punkteHandRest, PUNKTE_HAND_WOCHE, rundenStufen, rundenZahl, sterne, woche } from '../rules';
import {
  bossLaufend,
  bossStarten,
  bossStartenKarten,
  entsperren,
  istAdmin,
  kindAnlegen,
  kindLoeschen,
  klasseAnlegen,
  klasseEndgueltig,
  klasseLoeschen,
  klassen,
  lqText,
  neuePin,
  pinSetzen,
  punkteGeben,
  sperren,
  type KindInfo,
  type KlasseInfo,
} from '../server';
import { Auswertung } from './Auswertung';
import { Belohnungen } from './Belohnungen';
import { PinCards } from './PinCards';
import { Antwortkarten, type KartenKind } from './Antwortkarten';
import { Kartenrunde } from './Kartenrunde';
import { WiederholenSofort } from './WiederholenSofort';
import { KlassenAufgabe } from './KlassenAufgabe';
import { BossScan } from './BossScan';
import './lernquest-lehrkraft.css';

/** Only the admin teacher opens it, so it loads on demand. */
const TeilBilder = lazy(() => import('./TeilBilder'));

interface Props {
  lib: Library;
  onBack(): void;
  /** The teacher record changed (new PIN): the sync takes it to the other device. */
  onDeviceChange(): void;
  /** A lesson changed (its KI-Fragenpool); the caller sets `updatedAt` and saves it. */
  onLessonChange(l: Lesson): void;
  onExtraChange(e: ExtraPaket): void;
  onExtraDelete(id: string): void;
}

/** The address of Lernquest for a class: next to the Baukasten, `lernquest/#<code>`. */
export const lernquestLink = (code: string, base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`) => `${base}lernquest/#${code}`;
/** The projector view of a boss fight (same origin, so it finds the teacher keys of this device). */
/** The projector view of a boss fight; with the class code it shows a QR code for the children to join. */
export const beamerLink = (id: string, code = '', base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`) =>
  `${base}lernquest/#beamer=${id}${code ? `&klasse=${code}` : ''}`;

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'numeric',
      })
    : '–';

export function LernquestView({ lib, onBack, onDeviceChange, onLessonChange, onExtraChange, onExtraDelete }: Props) {
  const [me, setMe] = useState<Lehrkraft | null>(null);
  const [list, setList] = useState<KlasseInfo[] | null>(null);
  const [sel, setSel] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [newName, setNewName] = useState('');
  const [printing, setPrinting] = useState(false);
  /** Answer cards open: printing them, or a Kartenfrage with questions (null = free questions). */
  const [karten, setKarten] = useState<{ kinder: KartenKind[]; runde?: { fragen: BossFrage[] | null } } | null>(null);
  /** Boss fight with cards being scanned on this device. */
  const [kampf, setKampf] = useState<{ id: string; kinder: KartenKind[] } | null>(null);
  /** May upload pictures of the parts (lq_admin); the page „Bilder der Teile“ is open. */
  const [admin, setAdmin] = useState(false);
  const [bilder, setBilder] = useState(false);

  const load = useCallback(
    async (l?: Lehrkraft) => {
      const keys = (l ?? me)?.keys;
      if (!keys) return;
      try {
        const r = await klassen(keys);
        setList(r);
        setMsg('');
      } catch (e) {
        setMsg(lqText(e));
      }
    },
    [me],
  );

  useEffect(() => {
    void ensureLehrkraft().then((l) => {
      setMe(l);
      void load(l);
      // Older server without the function, or offline: no pictures page.
      istAdmin(l.keys).then(setAdmin, () => setAdmin(false));
    });
    // Once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Runs a server call, then reloads the classes. */
  const act = async (f: (keys: string[]) => Promise<unknown>) => {
    if (!me) return;
    setBusy(true);
    try {
      await f(me.keys);
      await load();
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const savePins = async (pins: Record<string, string>) => {
    const l = await updateLehrkraft((x) => ({
      ...x,
      pins: { ...x.pins, ...pins },
    }));
    setMe(l);
    onDeviceChange();
  };

  /** Stores the lessons hidden from a class (in the teacher record, so it travels to the other device). */
  const saveVersteckt = async (klasse: string, ids: string[]) => {
    const l = await updateLehrkraft((x) => ({
      ...x,
      versteckt: { ...x.versteckt, [klasse]: ids },
    }));
    setMe(l);
    onDeviceChange();
  };

  /**
   * The children of a class with their card numbers. New children get the lowest free number; the numbering is
   * stored in the teacher record, so printed cards stay valid on both devices.
   */
  const kartenKinder = async (k: KlasseInfo): Promise<KartenKind[]> => {
    const ids = k.kinder.map((c) => c.id);
    let l = me ?? (await ensureLehrkraft());
    const nummern = kartenNummern(ids, l.karten[k.id]);
    if (JSON.stringify(nummern) !== JSON.stringify(l.karten[k.id] ?? {})) {
      l = await updateLehrkraft((x) => ({ ...x, karten: { ...x.karten, [k.id]: nummern } }));
      setMe(l);
      onDeviceChange();
    }
    return k.kinder
      .filter((c) => !c.geloescht && nummern[c.id])
      .map((c) => ({ nummer: nummern[c.id], name: c.name, id: c.id }))
      .sort((a, b) => a.nummer - b.nummer);
  };
  const openKarten = (k: KlasseInfo, runde?: { fragen: BossFrage[] | null }) =>
    void kartenKinder(k)
      .then((kinder) => setKarten({ kinder, runde }))
      .catch((e) => setMsg(lqText(e)));

  const openKampf = (k: KlasseInfo, id: string) =>
    void kartenKinder(k)
      .then((kinder) => setKampf({ id, kinder }))
      .catch((e) => setMsg(lqText(e)));

  const active = list?.filter((k) => !k.geloescht) ?? [];
  const trashed = list?.filter((k) => k.geloescht) ?? [];
  const klasse = active.find((k) => k.id === sel) ?? active[0];

  if (bilder && me)
    return (
      <Suspense fallback={<p className="lib-empty">Lädt …</p>}>
        <TeilBilder keys={me.keys} onClose={() => setBilder(false)} />
      </Suspense>
    );
  if (kampf && klasse && me) return <BossScan keys={me.keys} id={kampf.id} titel={klasse.name} kinder={kampf.kinder} onClose={() => setKampf(null)} />;
  if (karten && klasse)
    return karten.runde ? (
      <Kartenrunde titel={klasse.name} kinder={karten.kinder} fragen={karten.runde.fragen} onClose={() => setKarten(null)} />
    ) : (
      <Antwortkarten titel={klasse.name} kinder={karten.kinder} onClose={() => setKarten(null)} />
    );
  if (printing && klasse && me) return <PinCards klasse={klasse} pins={me.pins} link={lernquestLink(klasse.code)} onClose={() => setPrinting(false)} />;

  return (
    <div className="app lqt-app">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onBack} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Lernquest</div>
          <div className="topbar-place">Klassen, Freischalten, Fortschritt</div>
        </div>
        {admin && (
          <button type="button" className="btn btn-secondary ui-btn" onClick={() => setBilder(true)}>
            <Icon icon={Images} />
            Bilder der Teile
          </button>
        )}
        <SearchButton />
      </header>
      <main className="lqt-main">
        <p className="lqt-note">Die Kinder melden sich mit Klassencode, Namen und PIN an. Namen liegen dafür auf dem Server (Supabase, Frankfurt), mit Freigabe der Schule.</p>
        {msg && (
          <p className="lqt-error" role="alert">
            {msg}
          </p>
        )}
        {list === null ? (
          <p className="lib-empty">{msg ? '' : 'Lädt …'}</p>
        ) : (
          <>
            <nav className="lqt-tabs" aria-label="Klassen">
              {active.map((k) => (
                <button key={k.id} type="button" className={`btn btn-secondary ui-btn ${k.id === klasse?.id ? 'is-on' : ''}`} onClick={() => setSel(k.id)}>
                  {k.name}
                  <small>{k.kinder.filter((c) => !c.geloescht).length}</small>
                  {(k.anfragen ?? 0) > 0 && (
                    <small className="lqt-badge" title="Offene Gutschein-Anfragen">
                      {k.anfragen} {k.anfragen === 1 ? 'Anfrage' : 'Anfragen'}
                    </small>
                  )}
                </button>
              ))}
              <form
                className="lqt-new"
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = newName.trim();
                  if (!name) return;
                  void act(async (keys) => {
                    const r = await klasseAnlegen(keys, name);
                    setSel(r.id);
                    setNewName('');
                  });
                }}
              >
                <input className="input" value={newName} maxLength={60} placeholder="Neue Klasse, z. B. 7b Englisch" onChange={(e) => setNewName(e.target.value)} aria-label="Name der neuen Klasse" />
                <button className="btn btn-primary ui-btn" disabled={busy || !newName.trim()}>
                  <Icon icon={Plus} />
                  Anlegen
                </button>
              </form>
            </nav>
            {klasse ? (
              <KlasseView key={klasse.id} lib={lib} onLessonChange={onLessonChange} onExtraChange={onExtraChange} onExtraDelete={onExtraDelete} klasse={klasse} keys={me?.keys ?? []} pins={me?.pins ?? {}} versteckt={me?.versteckt[klasse.id] ?? []} busy={busy} act={act} savePins={savePins} saveVersteckt={(ids) => saveVersteckt(klasse.id, ids)} onPrint={() => setPrinting(true)} onKarten={(runde) => openKarten(klasse, runde)} onKampf={(id) => openKampf(klasse, id)} />
            ) : (
              <p className="lib-empty">Lege zuerst eine Klasse an.</p>
            )}
            {trashed.length > 0 && (
              <section className="lqt-card">
                <h2>Papierkorb</h2>
                <p className="lqt-hint">Gelöschte Klassen bleiben 30 Tage, dann sind sie mit allen Spielständen weg.</p>
                {trashed.map((k) => (
                  <div key={k.id} className="lqt-row">
                    <span>
                      {k.name} · gelöscht am {when(k.geloescht)}
                    </span>
                    <button type="button" className="btn btn-secondary ui-btn is-small" disabled={busy} onClick={() => void act((keys) => klasseLoeschen(keys, k.id, false))}>
                      <Icon icon={RotateCcw} />
                      Zurückholen
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ui-btn is-small is-danger"
                      disabled={busy}
                      onClick={() => window.confirm(`„${k.name}“ mit allen Kindern und Spielständen endgültig löschen?`) && void act((keys) => klasseEndgueltig(keys, k.id))}
                    >
                      Endgültig löschen
                    </button>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

interface KlasseProps {
  lib: Library;
  onLessonChange(l: Lesson): void;
  onExtraChange(e: ExtraPaket): void;
  onExtraDelete(id: string): void;
  klasse: KlasseInfo;
  keys: string[];
  pins: Record<string, string>;
  /** Lessons hidden from this class (not even a locked station on the map). */
  versteckt: string[];
  busy: boolean;
  act(f: (keys: string[]) => Promise<unknown>): Promise<void>;
  savePins(pins: Record<string, string>): Promise<void>;
  saveVersteckt(ids: string[]): Promise<void>;
  onPrint(): void;
  /** Answer cards: print them (no round) or start a Kartenfrage. */
  onKarten(runde?: { fragen: BossFrage[] | null }): void;
  /** Scan the cards of a boss fight with cards on this device. */
  onKampf(id: string): void;
}

function KlasseView({ lib, onLessonChange, onExtraChange, onExtraDelete, klasse, keys, pins, versteckt, busy, act, savePins, saveVersteckt, onPrint, onKarten, onKampf }: KlasseProps) {
  /** Lesson whose KI-Fragenpool is open, and what was released when it opened (to send the class what changed). */
  const [poolOf, setPoolOf] = useState<string | null>(null);
  const freiVorher = useRef('');
  const frei = (id: string) => JSON.stringify(freigegeben(lib.lessons.find((x) => x.id === id)?.pool));
  const openPool = (id: string) => {
    freiVorher.current = frei(id);
    setPoolOf(id);
  };
  const closePool = () => {
    const l = lib.lessons.find((x) => x.id === poolOf);
    const m = l && lib.modules.find((x) => x.id === l.moduleId);
    setPoolOf(null);
    if (l && m && klasse.stunden.includes(l.id) && frei(l.id) !== freiVorher.current) void act((keys) => paketSenden(keys, klasse.id, m, l, lib.lessons, versteckt));
  };

  /**
   * After a lesson is unlocked, Claude fills its empty pool by itself (Stufe B), one lesson after the other. Lesson id
   * → '' while it runs, else what went wrong. Nothing happens without a key on this device.
   */
  const ai = useAiSettings();
  const [auto, setAuto] = useState<Record<string, string>>({});
  const kette = useRef(Promise.resolve());
  const neueste = useRef({ lib, onLessonChange });
  neueste.current = { lib, onLessonChange };
  const fragenErzeugen = (id: string) => {
    setAuto((a) => ({ ...a, [id]: '' }));
    kette.current = kette.current.then(async () => {
      let fehler = '';
      try {
        const { lessons, modules, settings } = neueste.current.lib;
        const l = lessons.find((x) => x.id === id);
        const m = l && modules.find((x) => x.id === l.moduleId);
        if (!l || !m || l.pool?.length) return;
        const a = await runAi(poolAnfrage({ modul: m, stunde: l, klasse: classProfileOf(settings, m.subject, m.grade), vorhanden: exercisesOf(l.doc.pages), wuensche: '', frueher: frueherVon(lessons, l) }));
        if (!a) return;
        const { neu, hilfe, tipps } = poolAusAntwort(jsonOf(a.text), [], m.lang === 'en');
        const eigeneIds = new Set(exercisesOf(l.doc.pages).map((u) => u.id));
        const poolTipps = Object.fromEntries(Object.entries(tipps).filter(([id]) => eigeneIds.has(id)));
        // The lesson as it is now: the teacher may have worked on it in the meantime.
        const jetzt = neueste.current.lib.lessons.find((x) => x.id === id);
        if (jetzt && !jetzt.pool?.length) neueste.current.onLessonChange({ ...jetzt, pool: neu.slice(0, POOL_MAX).map((u) => ({ u, frei: false })), ...(hilfe.length ? { poolHilfe: hilfe } : {}), ...(Object.keys(poolTipps).length ? { poolTipps } : {}) });
      } catch (e) {
        fehler = e instanceof Error ? e.message : String(e);
      } finally {
        setAuto(({ [id]: _, ...rest }) => (fehler ? { ...rest, [id]: fehler } : rest));
      }
    });
  };
  /** Child who gets class points by hand (dialog open). */
  const [punkteFuer, setPunkteFuer] = useState<KindInfo | null>(null);
  const [names, setNames] = useState('');
  /** Lessons getting a new level: the choice shows the wish at once, the server follows. */
  const [want, setWant] = useState<Record<string, Stufe>>({});
  /** PINs stay hidden on screen (the page may be on the projector) until asked for. */
  const [showPins, setShowPins] = useState(false);
  const subjects = useMemo(() => [...new Set(lib.modules.map((m) => m.subject))].sort((a, b) => a.localeCompare(b, 'de')), [lib.modules]);
  const unlockedModules = lib.modules.filter((m) => lib.lessons.some((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)));
  const [subject, setSubject] = useState(unlockedModules[0]?.subject ?? subjects[0] ?? '');
  const grades = [...new Set(lib.modules.filter((m) => m.subject === subject).map((m) => m.grade))].sort((a, b) => a - b);
  const [grade, setGrade] = useState(unlockedModules[0]?.grade ?? grades[0] ?? 0);
  const g = grades.includes(grade) ? grade : (grades[0] ?? 0);
  // Only worked-out lessons are shown (planned ones have nothing to practise yet); an unlocked one always stays.
  const zeigen = (l: Lesson) => isWorkedOut(l) || klasse.stunden.includes(l.id);
  const modules = lib.modules
    .filter((m) => m.subject === subject && m.grade === g && lib.lessons.some((l) => l.moduleId === m.id && zeigen(l)))
    .sort((a, b) => a.number - b.number);

  /** Round levels per unlocked lesson, from the package as sent (with the released pool), for the stars in the progress table. */
  const rounds = useMemo(() => {
    const out: Record<string, number[]> = {};
    for (const l of lib.lessons) {
      const m = lib.modules.find((x) => x.id === l.moduleId);
      if (m && klasse.stunden.includes(l.id)) out[l.id] = rundenStufen(buildPaket(m, l, lib.lessons).uebungen);
    }
    return out;
  }, [lib.lessons, lib.modules, klasse.stunden]);

  /**
   * Unlocked, locked or hidden. Hiding changes the module's lesson list in the packages, so the other unlocked lessons
   * of the module go again. Every choice waits while one runs, so each plan starts from the stored state.
   */
  const setStufe = (m: Module, l: Lesson, stufe: Stufe) => {
    const plan = stufenPlan(
      l.id,
      stufe,
      klasse.stunden,
      versteckt,
      lib.lessons.filter((x) => x.moduleId === m.id).map((x) => x.id),
    );
    setWant((w) => ({ ...w, [l.id]: stufe }));
    void act(async (keys) => {
      if (plan.versteckt.join() !== versteckt.join()) await saveVersteckt(plan.versteckt);
      if (plan.sperren) await sperren(keys, klasse.id, l.id);
      if (plan.senden) await paketSenden(keys, klasse.id, m, l, lib.lessons, plan.versteckt);
      for (const id of plan.neuSenden) {
        const x = lib.lessons.find((y) => y.id === id);
        if (x) await paketSenden(keys, klasse.id, m, x, lib.lessons, plan.versteckt);
      }
      if (stufe === 'frei' && ai && !l.pool?.length) fragenErzeugen(l.id);
    }).finally(() => setWant(({ [l.id]: _, ...rest }) => rest));
  };

  const kinder = klasse.kinder.filter((k) => !k.geloescht);
  const geloescht = klasse.kinder.filter((k) => k.geloescht);

  const addChildren = () => {
    const list = names
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 40);
    if (!list.length) return;
    void act(async (keys) => {
      const made: Record<string, string> = {};
      try {
        for (const name of list) {
          const pin = neuePin();
          made[await kindAnlegen(keys, klasse.id, name.slice(0, 40), pin)] = pin;
        }
      } finally {
        if (Object.keys(made).length) await savePins(made);
      }
      setNames('');
    });
  };

  const newPin = (k: KindInfo) => {
    if (!window.confirm(`Neue PIN für ${k.name}? Die alte gilt dann nicht mehr, und das Konto ist wieder frei.`)) return;
    const pin = neuePin();
    void act(async (keys) => {
      await pinSetzen(keys, k.id, pin);
      await savePins({ [k.id]: pin });
    });
  };

  const missingPins = kinder.filter((k) => !pins[k.id]).length;

  const givePoints = (k: KindInfo) => {
    if (punkteHandRest(k.punkteHand ?? 0)) setPunkteFuer(k);
  };
  const closePoints = useCallback(() => setPunkteFuer(null), []);
  const onGivePoints = useCallback(
    (n: number) => {
      if (!punkteFuer) return;
      setPunkteFuer(null);
      void act((keys) => punkteGeben(keys, punkteFuer.id, n));
    },
    [act, punkteFuer],
  );

  return (
    <>
      <section className="lqt-card">
        <div className="lqt-head">
          <div>
            <h2>{klasse.name}</h2>
            <p className="lqt-hint">
              Klassencode <strong className="lqt-code">{klasse.code}</strong> · Adresse für die Kinder:{' '}
              <a href={lernquestLink(klasse.code)} target="_blank" rel="noreferrer">
                {lernquestLink(klasse.code)}
              </a>
            </p>
          </div>
          <div className="lqt-actions">
            <button type="button" className="btn btn-secondary ui-btn" onClick={onPrint} disabled={!kinder.length}>
              <Icon icon={Printer} />
              QR-Code und PINs drucken
            </button>
            <button
              type="button"
              className="btn btn-secondary ui-btn is-danger"
              disabled={busy}
              onClick={() => window.confirm(`„${klasse.name}“ in den Papierkorb legen? Die Kinder können sich dann nicht mehr anmelden.`) && void act((keys) => klasseLoeschen(keys, klasse.id, true))}
            >
              <Icon icon={Trash2} />
              Klasse löschen
            </button>
          </div>
        </div>
        {missingPins > 0 && (
          <p className="lqt-hint">
            {missingPins === 1 ? 'Ein Kind hat' : `${missingPins} Kinder haben`} auf diesem Gerät keine PIN zum Drucken (angelegt auf einem anderen Gerät ohne Abgleich): „Neue PIN“ setzt eine.
          </p>
        )}

        <div className="ev-table-wrap">
          <table className="ev-table lqt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>
                  <button type="button" className="btn btn-ghost ui-btn is-small" onClick={() => setShowPins(!showPins)} aria-pressed={showPins}>
                    {showPins ? 'PINs verbergen' : 'PINs zeigen'}
                  </button>
                </th>
                <th>Heldenstufe</th>
                <th>Sterne</th>
                <th>Lerntage diese Woche</th>
                <th>Klassenpunkte</th>
                <th>Zuletzt da</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {kinder.map((k) => {
                const h = heldenstufe(k.xp);
                const stars = Object.entries(rounds).reduce((s, [id, n]) => s + sterne(k.bestwerte[id], n), 0);
                return (
                  <tr key={k.id} className={k.gesperrt ? 'is-locked' : ''}>
                    <th>{k.name}</th>
                    <td className="lqt-code">{pins[k.id] ? (showPins ? pins[k.id] : '••••') : '–'}</td>
                    <td>
                      {h.stufe} <small>({k.xp} EP)</small>
                    </td>
                    <td>
                      {stars} <small>von {Object.keys(rounds).length * 3}</small>
                    </td>
                    <td>{woche(k.tage).diese}</td>
                    <td className="lqt-punkte">
                      {k.klassenpunkte ?? 0}
                      <button
                        type="button"
                        className="btn btn-ghost ui-btn is-small"
                        disabled={busy || !punkteHandRest(k.punkteHand ?? 0)}
                        title={punkteHandRest(k.punkteHand ?? 0) ? `${k.name} Klassenpunkte geben` : `Diese Woche schon ${PUNKTE_HAND_WOCHE} von Hand gegeben`}
                        aria-label={`${k.name} Klassenpunkte geben`}
                        onClick={() => givePoints(k)}
                      >
                        <Icon icon={Plus} />
                      </button>
                    </td>
                    <td>{when(k.zuletzt)}</td>
                    <td className="lqt-row-actions">
                      {k.gesperrt && (
                        <button type="button" className="btn btn-primary ui-btn is-small" disabled={busy} onClick={() => void act((keys) => entsperren(keys, k.id))}>
                          <Icon icon={Unlock} />
                          Entsperren
                        </button>
                      )}
                      <button type="button" className="btn btn-secondary ui-btn is-small" disabled={busy} onClick={() => newPin(k)}>
                        Neue PIN
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary ui-btn is-small is-danger"
                        disabled={busy}
                        title={`${k.name} löschen`}
                        aria-label={`${k.name} löschen`}
                        onClick={() => window.confirm(`${k.name} löschen? 30 Tage lang lässt es sich zurückholen.`) && void act((keys) => kindLoeschen(keys, k.id, true))}
                      >
                        <Icon icon={Trash2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {geloescht.map((k) => (
                <tr key={k.id} className="is-deleted">
                  <th>{k.name}</th>
                  <td colSpan={6}>gelöscht am {when(k.geloescht)}, nach 30 Tagen endgültig weg</td>
                  <td>
                    <button type="button" className="btn btn-secondary ui-btn is-small" disabled={busy} onClick={() => void act((keys) => kindLoeschen(keys, k.id, false))}>
                      <Icon icon={RotateCcw} />
                      Zurückholen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {kinder.some((k) => k.gesperrt) && (
          <p className="lqt-hint lqt-inline">
            <Icon icon={Lock} size={13} /> Gesperrt nach 5 falschen PINs. „Entsperren“ gibt das Konto frei, „Neue PIN“ auch.
          </p>
        )}
        <div className="field lqt-add">
          <label htmlFor="lqt-names">Kinder hinzufügen (ein Name je Zeile, z. B. „Mia K.“): jedes Kind bekommt eine zufällige PIN</label>
          <textarea id="lqt-names" className="input" rows={3} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Mia K.\nJonas B.'} />
          <button type="button" className="btn btn-primary ui-btn" disabled={busy || !names.trim()} onClick={addChildren}>
            <Icon icon={Plus} />
            Hinzufügen
          </button>
        </div>
      </section>

      <Belohnungen klasse={klasse} keys={keys} busy={busy} act={act} />

      <Auswertung lib={lib} klasse={klasse} />

      <KlassenAufgabe klasse={klasse} busy={busy} act={act} />

      <KlassenDorf klasse={klasse} keys={keys} busy={busy} act={act} />

      <WiederholenSofort lib={lib} klasse={klasse} busy={busy} act={act} />

      <KartenStart lib={lib} klasse={klasse} onKarten={onKarten} />

      <BossStart lib={lib} klasse={klasse} busy={busy} act={act} onKampf={onKampf} />

      <section className="lqt-card">
        <div className="lqt-head">
          <div>
            <h2>Stunden freischalten</h2>
            <p className="lqt-hint">
              Eine freigeschaltete Stunde wird eine Station auf der Weltkarte. Aus ihren lösbaren Aufgaben (mit Lösung) werden Übungen; Lehrkraft-Seiten bleiben draußen. Gesperrte Stunden
              sehen die Kinder mit Schloss, ausgeblendete gar nicht. {ai ? 'Nach dem Freischalten schreibt Claude von selbst etwa 30 weitere Fragen; die Klasse sieht sie erst, wenn du sie unter „Fragen prüfen“ freigibst.' : ''}
            </p>
          </div>
          <div className="lqt-actions">
            <button
              type="button"
              className="btn btn-secondary ui-btn"
              disabled={busy || !klasse.stunden.length}
              title="Nach Änderungen an freigeschalteten Stunden"
              onClick={() =>
                void act(async (keys) => {
                  for (const id of klasse.stunden) {
                    const l = lib.lessons.find((x) => x.id === id);
                    const m = l && lib.modules.find((x) => x.id === l.moduleId);
                    if (l && m) await paketSenden(keys, klasse.id, m, l, lib.lessons, versteckt);
                  }
                  await extraSenden(keys, klasse.id, lib.extras ?? [], klasse.stunden);
                })
              }
            >
              <Icon icon={RefreshCw} />
              Freigeschaltete neu senden
            </button>
          </div>
        </div>
        <div className="lqt-filter">
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Fach">
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="input" value={g} onChange={(e) => setGrade(Number(e.target.value))} aria-label="Klassenstufe">
            {grades.map((x) => (
              <option key={x} value={x}>
                Klasse {x}
              </option>
            ))}
          </select>
        </div>
        {!modules.length && <p className="lib-empty">Keine ausgearbeiteten Stunden in diesem Fach und dieser Klassenstufe.</p>}
        {modules.map((m) => (
          <div key={m.id} className="lqt-module">
            <h3>
              Modul {m.number}: {m.title}
            </h3>
            <ul>
              {lib.lessons
                .filter((l) => l.moduleId === m.id && zeigen(l))
                .sort((a, b) => a.number - b.number)
                .map((l) => {
                  const n = exercisesOf(l.doc.pages).length + freigegeben(l.pool).length;
                  const imPool = l.pool?.length ?? 0;
                  const stufe = want[l.id] ?? stufeVon(l.id, klasse.stunden, versteckt);
                  return (
                    <li key={l.id}>
                      <label className={`lqt-lesson ${!n && stufe !== 'frei' ? 'is-empty' : ''} ${stufe === 'aus' ? 'is-hidden' : ''}`}>
                        <select
                          className="input lqt-stufe"
                          value={stufe}
                          disabled={busy || l.id in want}
                          aria-label={`Stunde ${l.number}: ${l.title}`}
                          onChange={(e) => setStufe(m, l, e.target.value as Stufe)}
                        >
                          {STUFEN.map((x) => (
                            <option key={x.id} value={x.id} disabled={x.id === 'frei' && !n && stufe !== 'frei'}>
                              {x.label}
                            </option>
                          ))}
                        </select>
                        <span>
                          Stunde {l.number}: {l.title}
                        </span>
                        <small>{n ? `${n} ${n === 1 ? 'Übung' : 'Übungen'} · ${rundenZahl(n)} ${rundenZahl(n) === 1 ? 'Runde' : 'Runden'}` : 'keine lösbaren Aufgaben'}</small>
                      </label>
                      <button type="button" className="btn btn-secondary ui-btn lqt-pool-knopf" onClick={() => openPool(l.id)} title={auto[l.id] || 'Weitere Fragen aus dem Stundeninhalt erzeugen, prüfen und freigeben'}>
                        <Icon icon={Sparkles} />
                        {imPool > 0 ? 'Fragen prüfen' : 'Fragen erzeugen'}
                        {auto[l.id] === '' ? (
                          <small className="lqt-pool-zahl" role="status">
                            Claude schreibt …
                          </small>
                        ) : auto[l.id] ? (
                          <small className="lqt-pool-zahl">hat nicht geklappt</small>
                        ) : (
                          imPool > 0 && <small className="lqt-pool-zahl">{imPool - freigegeben(l.pool).length > 0 ? `${imPool - freigegeben(l.pool).length} zu prüfen` : `${imPool} frei`}</small>
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>
      <ExtraPakete lib={lib} klasse={klasse} subject={subject} grade={g} busy={busy} act={act} onChange={onExtraChange} onDelete={onExtraDelete} />
      {punkteFuer && <PunkteDialog name={punkteFuer.name} rest={punkteHandRest(punkteFuer.punkteHand ?? 0)} onGive={onGivePoints} onClose={closePoints} />}
      {poolOf && <PoolFuer lib={lib} id={poolOf} onLessonChange={onLessonChange} onClose={closePool} />}
    </>
  );
}

/** The pool dialog of one lesson, on the newest version of it (the library updates after each change). */
function PoolFuer({ lib, id, onLessonChange, onClose }: { lib: Library; id: string; onLessonChange(l: Lesson): void; onClose(): void }) {
  const l = lib.lessons.find((x) => x.id === id);
  const m = l && lib.modules.find((x) => x.id === l.moduleId);
  if (!l || !m) return null;
  return <FragenpoolDialog modul={m} stunde={l} settings={lib.settings} stunden={lib.lessons} onChange={(pool, hilfe, tipps) => onLessonChange({ ...l, pool, ...(hilfe ? { poolHilfe: hilfe } : {}), ...(tipps ? { poolTipps: tipps } : {}) })} onClose={onClose} />;
}

/** The regions of a class (modules with unlocked lessons), the chosen one and the questions it can give. */
function useRegion(bib: Library, klasse: KlasseInfo) {
  // Unlocked Extra-Pakete are regions too (Grammatik-Turm, Wortschatz-Wald), behind the modules.
  const lib = useMemo(() => mitExtras(bib, klasse.stunden), [bib, klasse.stunden]);
  const regionen = lib.modules
    .filter((m) => lib.lessons.some((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'de') || a.grade - b.grade || a.number - b.number);
  const [wahl, setWahl] = useState('');
  const m = regionen.find((x) => x.id === wahl) ?? regionen[0];
  const pakete = useMemo(
    () => (m ? lib.lessons.filter((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)).map((l) => buildPaket(m, l, lib.lessons)) : []),
    [m, lib.lessons, klasse.stunden],
  );
  const moeglich = useMemo(() => bossFragen(pakete, 'zaehlen', 1000).length, [pakete]);
  const auswahl = (
    <select className="input" value={m?.id ?? ''} onChange={(e) => setWahl(e.target.value)} aria-label="Region">
      {regionen.map((x) => (
        <option key={x.id} value={x.id}>
          {regionLabel(x)}
        </option>
      ))}
    </select>
  );
  return { regionen, m, pakete, moeglich, auswahl };
}

/** Kartenfrage without devices: print the answer cards, then ask questions of a region or free ones. */
function KartenStart({ lib, klasse, onKarten }: Pick<KlasseProps, 'lib' | 'klasse' | 'onKarten'>) {
  const { regionen, m, pakete, moeglich, auswahl } = useRegion(lib, klasse);
  const kinder = klasse.kinder.filter((k) => !k.geloescht).length;
  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Kartenfrage ohne Geräte</h2>
          <p className="lqt-hint">
            Jedes Kind hat eine gedruckte Antwortkarte und hält sie hoch, den gewählten Buchstaben (A–D) oben. Du scannst die Klasse mit der Kamera des iPads und siehst sofort, wer was
            geantwortet hat. Am Beamer stehen nur Kartennummern, Namen nur auf Wunsch.
          </p>
        </div>
        <div className="lqt-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={() => onKarten()} disabled={!kinder}>
            <Icon icon={IdCard} />
            Antwortkarten drucken
          </button>
        </div>
      </div>
      {!kinder ? (
        <p className="lib-empty">Füge zuerst Kinder hinzu: Jedes bekommt eine eigene Karte.</p>
      ) : (
        <div className="lqt-filter">
          {regionen.length > 0 && (
            <>
              {auswahl}
              <button type="button" className="btn btn-primary ui-btn" disabled={!m || moeglich < 1} onClick={() => onKarten({ fragen: bossFragen(pakete, String(Date.now())) })}>
                <Icon icon={MessageCircleQuestion} />
                Fragen der Region stellen
              </button>
            </>
          )}
          <button type="button" className={'btn ui-btn ' + (regionen.length ? 'btn-secondary' : 'btn-primary')} onClick={() => onKarten({ fragen: null })}>
            <Icon icon={MessageCircleQuestion} />
            Freie Frage (A–D)
          </button>
        </div>
      )}
      {kinder > 63 && <p className="lqt-hint">Es gibt 63 Karten je Klasse; Kinder darüber bekommen keine.</p>}
    </section>
  );
}

/** Starts a boss fight for one region (module with unlocked lessons) and opens the projector view in a new tab. */
function BossStart({ lib, klasse, busy, act, onKampf }: Pick<KlasseProps, 'lib' | 'klasse' | 'busy' | 'act' | 'onKampf'>) {
  const { regionen, m, pakete, moeglich, auswahl } = useRegion(lib, klasse);
  const [hinweis, setHinweis] = useState('');
  const [mitKarten, setMitKarten] = useState(false);
  const karten = klasse.kinder.filter((c) => !c.geloescht).length;

  const starten = () => {
    if (!m) return;
    const fragen = bossFragen(pakete, `${Date.now()}`);
    if (fragen.length < BOSS_FRAGEN_MIN) return;
    setHinweis('');
    // Opened now (in the click), filled when the server answered: a later window.open would be blocked.
    const fenster = window.open('', '_blank');
    void act(async (keys) => {
      try {
        const titel = (istExtraModul(m.id) ? `${m.subject} · ${m.title}` : `${m.subject} · Region ${m.number}`).slice(0, 120);
        const id = await (mitKarten ? bossStartenKarten : bossStarten)(keys, klasse.id, m.id, titel, bossVon(m.number), fragen);
        if (fenster) fenster.location.href = beamerLink(id, klasse.code);
        else setHinweis(`Neuer Tab war blockiert. Beamer-Ansicht: ${beamerLink(id, klasse.code)}`);
        // With cards, this device scans (the projector shows the fight in the new tab or on another screen).
        if (mitKarten) onKampf(id);
      } catch (e) {
        fenster?.close();
        throw e;
      }
    });
  };

  /** A second device of the teacher (iPad, iPhone) scans the running fight with cards. */
  const scannen = () =>
    void act(async (keys) => {
      const l = await bossLaufend(keys, klasse.id);
      if (!l) setHinweis('Gerade läuft kein Bosskampf in dieser Klasse.');
      else if (l.modus !== 'karten') setHinweis('Der laufende Bosskampf ist mit Geräten, da gibt es nichts zu scannen.');
      else {
        setHinweis('');
        onKampf(l.id);
      }
    });

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Bosskampf am Beamer</h2>
          <p className="lqt-hint">
            Die Klasse kämpft gemeinsam: Die Frage steht am Beamer, die Kinder antworten am Gerät (Lernquest öffnen → „Bosskampf“) oder mit ihrer Antwortkarte, die du scannst. Fragen kommen aus den freigeschalteten Stunden der Region oder den Extra-Paketen (Antippen, Richtig/Falsch, Paare, Lücken). Fällt der Boss, gibt es beim ersten Sieg eine Truhe für alle, die mitgemacht haben.
          </p>
        </div>
      </div>
      {!regionen.length ? (
        <p className="lib-empty">Schalte zuerst Stunden frei: Jedes Modul mit freigeschalteten Stunden wird eine Region mit Boss.</p>
      ) : (
        <div className="lqt-filter">
          {auswahl}
          <div className="lqt-wahl" role="radiogroup" aria-label="Wie antworten die Kinder?">
            <label>
              <input type="radio" name={`modus-${klasse.id}`} checked={!mitKarten} onChange={() => setMitKarten(false)} /> Mit Geräten
            </label>
            <label>
              <input type="radio" name={`modus-${klasse.id}`} checked={mitKarten} onChange={() => setMitKarten(true)} disabled={!karten} /> Mit Karten
            </label>
          </div>
          <button type="button" className="btn btn-primary ui-btn" disabled={busy || moeglich < BOSS_FRAGEN_MIN} onClick={starten}>
            <Icon icon={Swords} />
            Bosskampf starten
          </button>
          <button type="button" className="btn btn-secondary ui-btn" disabled={busy || !karten} onClick={scannen}>
            <Icon icon={ScanLine} />
            Laufenden Kampf scannen
          </button>
        </div>
      )}
      {mitKarten && (
        <p className="lqt-hint">
          Mit Karten: kein Zeitlimit, 15 Schaden je richtiger Karte, ab 3 in Folge doppelt. Der Beamer öffnet sich im neuen Tab, dieses Gerät scannt. Mit einem zweiten Gerät (iPad, iPhone) hier „Laufenden Kampf scannen“.
        </p>
      )}
      {m && moeglich < BOSS_FRAGEN_MIN && <p className="lqt-hint">Zu wenige Fragen in dieser Region (mindestens {BOSS_FRAGEN_MIN} aus Antippen, Richtig/Falsch, Paaren oder Lücken).</p>}
      {m && moeglich >= BOSS_FRAGEN_MIN && (
        <p className="lqt-hint">
          {Math.min(moeglich, BOSS_FRAGEN)} von {moeglich} möglichen Fragen, jedes Mal neu gemischt. Ein laufender Kampf der Klasse endet beim Start eines neuen.
        </p>
      )}
      {hinweis && <p className="lqt-hint">{hinweis}</p>}
    </section>
  );
}
