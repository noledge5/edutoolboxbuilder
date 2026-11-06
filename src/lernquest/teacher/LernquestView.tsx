// The teacher's Lernquest page in the Baukasten (#/lernquest): classes and children with PINs, cards with QR code
// to print, lessons to unlock (their Lernpaket goes to the class), progress at a glance, unlock locked accounts.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Plus, Printer, RefreshCw, RotateCcw, Trash2, Unlock } from 'lucide-react';
import { Icon } from '../../icons';
import { SearchButton } from '../../library/SearchDialog';
import type { Library } from '../../library/types';
import { ensureLehrkraft, updateLehrkraft, type Lehrkraft } from '../lehrkraft';
import { buildPaket, exercisesOf } from '../paket';
import { heldenstufe, rundenZahl, sterne, woche } from '../rules';
import {
  entsperren,
  freischalten,
  kindAnlegen,
  kindLoeschen,
  klasseAnlegen,
  klasseEndgueltig,
  klasseLoeschen,
  klassen,
  lqText,
  neuePin,
  pinSetzen,
  sperren,
  type KindInfo,
  type KlasseInfo,
} from '../server';
import { PinCards } from './PinCards';
import './lernquest-lehrkraft.css';

interface Props {
  lib: Library;
  onBack(): void;
  /** The teacher record changed (new PIN): the sync takes it to the other device. */
  onDeviceChange(): void;
}

/** The address of Lernquest for a class: next to the Baukasten, `lernquest/#<code>`. */
export const lernquestLink = (code: string, base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`) => `${base}lernquest/#${code}`;

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }) : '–');

export function LernquestView({ lib, onBack, onDeviceChange }: Props) {
  const [me, setMe] = useState<Lehrkraft | null>(null);
  const [list, setList] = useState<KlasseInfo[] | null>(null);
  const [sel, setSel] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [newName, setNewName] = useState('');
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async (l?: Lehrkraft) => {
    const keys = (l ?? me)?.keys;
    if (!keys) return;
    try {
      const r = await klassen(keys);
      setList(r);
      setMsg('');
    } catch (e) {
      setMsg(lqText(e));
    }
  }, [me]);

  useEffect(() => {
    void ensureLehrkraft().then((l) => {
      setMe(l);
      void load(l);
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
    const l = await updateLehrkraft((x) => ({ ...x, pins: { ...x.pins, ...pins } }));
    setMe(l);
    onDeviceChange();
  };

  const active = list?.filter((k) => !k.geloescht) ?? [];
  const trashed = list?.filter((k) => k.geloescht) ?? [];
  const klasse = active.find((k) => k.id === sel) ?? active[0];

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
        <SearchButton />
      </header>
      <main className="lqt-main">
        <p className="lqt-note">
          Die Kinder melden sich mit Klassencode, Namen und PIN an. Namen liegen dafür auf dem Server (Supabase, Frankfurt): vor dem ersten echten Einsatz braucht es die Freigabe der Schule.
        </p>
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
              <KlasseView key={klasse.id} lib={lib} klasse={klasse} pins={me?.pins ?? {}} busy={busy} act={act} savePins={savePins} onPrint={() => setPrinting(true)} />
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
  klasse: KlasseInfo;
  pins: Record<string, string>;
  busy: boolean;
  act(f: (keys: string[]) => Promise<unknown>): Promise<void>;
  savePins(pins: Record<string, string>): Promise<void>;
  onPrint(): void;
}

function KlasseView({ lib, klasse, pins, busy, act, savePins, onPrint }: KlasseProps) {
  const [names, setNames] = useState('');
  /** Lessons being unlocked or locked: the box shows the wish at once, the server follows. */
  const [want, setWant] = useState<Record<string, boolean>>({});
  /** PINs stay hidden on screen (the page may be on the projector) until asked for. */
  const [showPins, setShowPins] = useState(false);
  const subjects = useMemo(() => [...new Set(lib.modules.map((m) => m.subject))].sort((a, b) => a.localeCompare(b, 'de')), [lib.modules]);
  const unlockedModules = lib.modules.filter((m) => lib.lessons.some((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)));
  const [subject, setSubject] = useState(unlockedModules[0]?.subject ?? subjects[0] ?? '');
  const grades = [...new Set(lib.modules.filter((m) => m.subject === subject).map((m) => m.grade))].sort((a, b) => a - b);
  const [grade, setGrade] = useState(unlockedModules[0]?.grade ?? grades[0] ?? 0);
  const g = grades.includes(grade) ? grade : (grades[0] ?? 0);
  const modules = lib.modules.filter((m) => m.subject === subject && m.grade === g).sort((a, b) => a.number - b.number);

  /** Rounds per unlocked lesson, for the stars in the progress table. */
  const rounds = useMemo(() => {
    const out: Record<string, number> = {};
    for (const l of lib.lessons) if (klasse.stunden.includes(l.id)) out[l.id] = rundenZahl(exercisesOf(l.doc.pages).length);
    return out;
  }, [lib.lessons, klasse.stunden]);

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

  return (
    <>
      <section className="lqt-card">
        <div className="lqt-head">
          <div>
            <h2>{klasse.name}</h2>
            <p className="lqt-hint">
              Klassencode <strong className="lqt-code">{klasse.code}</strong> · Adresse für die Kinder: <a href={lernquestLink(klasse.code)} target="_blank" rel="noreferrer">{lernquestLink(klasse.code)}</a>
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
        {missingPins > 0 && <p className="lqt-hint">{missingPins === 1 ? 'Ein Kind hat' : `${missingPins} Kinder haben`} auf diesem Gerät keine PIN zum Drucken (angelegt auf einem anderen Gerät ohne Abgleich): „Neue PIN“ setzt eine.</p>}

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
                      <button type="button" className="btn btn-secondary ui-btn is-small is-danger" disabled={busy} title={`${k.name} löschen`} aria-label={`${k.name} löschen`} onClick={() => window.confirm(`${k.name} löschen? 30 Tage lang lässt es sich zurückholen.`) && void act((keys) => kindLoeschen(keys, k.id, true))}>
                        <Icon icon={Trash2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {geloescht.map((k) => (
                <tr key={k.id} className="is-deleted">
                  <th>{k.name}</th>
                  <td colSpan={5}>gelöscht am {when(k.geloescht)}, nach 30 Tagen endgültig weg</td>
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

      <section className="lqt-card">
        <div className="lqt-head">
          <div>
            <h2>Stunden freischalten</h2>
            <p className="lqt-hint">Eine freigeschaltete Stunde wird eine Station auf der Weltkarte. Aus ihren lösbaren Aufgaben (mit Lösung) werden Übungen; Lehrkraft-Seiten bleiben draußen.</p>
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
                    if (l && m) await freischalten(keys, klasse.id, l.id, buildPaket(m, l));
                  }
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
        {!modules.length && <p className="lib-empty">Keine Module in diesem Fach und dieser Klassenstufe.</p>}
        {modules.map((m) => (
          <div key={m.id} className="lqt-module">
            <h3>
              Modul {m.number}: {m.title}
            </h3>
            <ul>
              {lib.lessons
                .filter((l) => l.moduleId === m.id)
                .sort((a, b) => a.number - b.number)
                .map((l) => {
                  const n = exercisesOf(l.doc.pages).length;
                  const on = want[l.id] ?? klasse.stunden.includes(l.id);
                  return (
                    <li key={l.id}>
                      <label className={`lqt-lesson ${!n && !on ? 'is-empty' : ''}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={l.id in want || (!n && !on)}
                          onChange={(e) => {
                            const yes = e.target.checked;
                            setWant((w) => ({ ...w, [l.id]: yes }));
                            void act((keys) => (yes ? freischalten(keys, klasse.id, l.id, buildPaket(m, l)) : sperren(keys, klasse.id, l.id))).finally(() =>
                              setWant(({ [l.id]: _, ...rest }) => rest),
                            );
                          }}
                        />
                        <span>
                          Stunde {l.number}: {l.title}
                        </span>
                        <small>{n ? `${n} ${n === 1 ? 'Übung' : 'Übungen'} · ${rundenZahl(n)} ${rundenZahl(n) === 1 ? 'Runde' : 'Runden'}` : 'keine lösbaren Aufgaben'}</small>
                      </label>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
