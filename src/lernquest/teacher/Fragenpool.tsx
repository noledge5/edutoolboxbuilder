// „Fragen erzeugen“ for a lesson (Lernquest Stufe 5, Stufe B): Claude writes about 30 exercises in three levels from the
// student pages (over the chat or directly with the key of this device); the teacher skims them, releases all at once
// („Alle freigeben“) and corrects or deletes single ones. Tasks with places on a picture of the worksheet the teacher
// makes here by hand („Punkte im Bild“).
// Changes are saved at once in the lesson (it syncs like the rest of the lesson); the class gets the released ones
// with the next sending of the package.
import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, ClipboardCopy, ClipboardPaste, KeyRound, MapPin, Move, Pencil, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { Icon } from '../../icons';
import { AiSettingsDialog } from '../../ai/AiSettingsDialog';
import { classProfileOf } from '../../ai/classNotes';
import { AiBusy, ChatPath, useAiJob } from '../../ai/parts';
import { dollars } from '../../ai/prices';
import { modelLabel } from '../../ai/settings';
import { useAiSettings } from '../../ai/useAi';
import type { Lesson, Module, Settings } from '../../library/types';
import { useImageUrl } from '../../storage/images';
import { exercisesOf } from '../paket';
import { RUNDE_MAX, RUNDEN_MAX } from '../rules';
import { ablenkerVon, bilderDerStunde, kurzText, lueckeAus, lueckeText, mitZusatz, neueId, NIVEAUS, POOL_MAX, poolAnfrage, poolAusAntwort, poolPrompt, poolSystem, POOL_ZIEL, PUNKTE, punktAufgabe, readUebung, reihenfolgeAus } from '../fragenpool';
import { KARTE_KEY } from '../paket';
import type { Niveau, PoolEintrag, Uebung, UebungsArt } from '../types';

const ARTEN: Record<UebungsArt, string> = {
  waehlen: 'Antippen',
  richtigfalsch: 'Richtig/Falsch',
  paare: 'Paare',
  luecke: 'Lücke',
  reihenfolge: 'Reihenfolge',
  gruppen: 'Sortieren',
  bild: 'Bild wählen',
  punkt: 'Punkte im Bild',
  schreiben: 'Selbst schreiben',
};
/** Exercises the rounds of one station show at most (5 rounds × 8). */
const RUNDEN_PLATZ = RUNDEN_MAX * RUNDE_MAX;
const artName = (u: Uebung) => (u.art === 'waehlen' && u.hoeren ? 'Hören' : ARTEN[u.art]);

interface Props {
  modul: Module;
  stunde: Lesson;
  settings: Settings;
  onChange(pool: PoolEintrag[]): void;
  onClose(): void;
}

export function FragenpoolDialog({ modul, stunde, settings, onChange, onClose }: Props) {
  const job = useAiJob();
  const ai = useAiSettings();
  const { busy, error, answer } = job;
  const [wuensche, setWuensche] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const [edit, setEdit] = useState<string | null>(null);
  /** A new task with places on a picture is being made. */
  const [neuesBild, setNeuesBild] = useState(false);
  const bilder = useMemo(() => bilderDerStunde(stunde), [stunde]);
  const [meldung, setMeldung] = useState('');
  const pool = useMemo(() => stunde.pool ?? [], [stunde.pool]);
  const eigene = useMemo(() => exercisesOf(stunde.doc.pages), [stunde.doc]);
  const frei = pool.filter((e) => e.frei).length;
  const voll = pool.length >= POOL_MAX;

  const auftrag = () => ({
    modul,
    stunde,
    klasse: classProfileOf(settings, modul.subject, modul.grade),
    vorhanden: [...eigene, ...pool.map((e) => e.u)],
    wuensche,
  });
  const read = (raw: unknown) => {
    const { neu, verworfen } = poolAusAntwort(raw, pool.map((e) => e.u.id), modul.lang === 'en');
    const platz = Math.max(0, POOL_MAX - pool.length);
    const dazu = neu.slice(0, platz).map((u) => ({ u, frei: false }));
    onChange([...pool, ...dazu]);
    setChatOpen(false);
    setPasted('');
    const weg = verworfen + (neu.length - dazu.length);
    setMeldung(`${dazu.length} neue Aufgaben zum Prüfen${weg ? `, ${weg} unbrauchbare oder überzählige weggelassen` : ''}.`);
  };
  const run = () => {
    setMeldung('');
    void job.run(poolAnfrage(auftrag()), read);
  };
  const close = () => {
    if (busy && !window.confirm('Claude arbeitet noch. Abbrechen und schließen?')) return;
    job.stop();
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !keyOpen && !edit && !neuesBild && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const setze = (id: string, f: (e: PoolEintrag) => PoolEintrag | null) =>
    onChange(pool.flatMap((e) => (e.u.id === id ? [f(e)].filter((x): x is PoolEintrag => x !== null) : [e])));

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !busy && !edit && !neuesBild && close()}>
        <div className="dialog ai-dialog lqt-pool-dialog" role="dialog" aria-modal="true" aria-label="Fragen erzeugen" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Fragen erzeugen · Stunde {stunde.number}: {stunde.title}
          </div>
          <p className="dialog-body">
            Claude schreibt nur aus den Arbeitsblättern der Kinder etwa {POOL_ZIEL} weitere Fragen in drei Stufen (leicht, mittel, schwer), jede mit einer kurzen Erklärung (ohne Lehrkraft-Seiten, ohne Kinderdaten). Lies sie durch, nimm
            Schlechtes heraus und gib den Rest mit „Alle freigeben“ frei. Nur Freigegebenes kommt ins Lernpaket, hinter die Übungen der Stunde, von leicht nach schwer. Ist die Stunde für diese Klasse freigeschaltet, bekommt die Klasse
            die Änderungen beim Schließen; andere Klassen mit „Freigeschaltete neu senden“. Mit „Punkte im Bild“ setzt du selbst Stellen auf ein Bild vom Arbeitsblatt.
          </p>
          <p className="lqt-pool-stand">
            {pool.length ? `${pool.length} im Pool, ${frei} freigegeben` : 'Der Pool ist noch leer.'}
            {voll && ` · voll (höchstens ${POOL_MAX})`}
          </p>
          {eigene.length + frei > RUNDEN_PLATZ && (
            <p className="lqt-hint">
              Zusammen sind es {eigene.length + frei} Übungen. In den Runden einer Station kommen höchstens {RUNDEN_PLATZ} dran; die übrigen nicht. Gib lieber weniger frei.
            </p>
          )}

          {!voll && !chatOpen && (
            <div className="field">
              <label htmlFor="lqt-pool-wishes">Wünsche (freiwillig)</label>
              <input id="lqt-pool-wishes" className="input" value={wuensche} placeholder="z. B. mehr zu den Himmelsrichtungen, leichter, keine Paare" onChange={(e) => setWuensche(e.target.value)} />
            </div>
          )}
          {busy && <AiBusy busy={busy} hint="Das dauert meist ein bis zwei Minuten." onStop={job.stop} />}
          {error && <p className="json-err">{error}</p>}
          {meldung && !busy && <p className="lqt-hint">{meldung}</p>}
          {answer && !busy && (
            <p className="ai-cost">
              Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
            </p>
          )}
          {chatOpen && <ChatPath request={() => `${poolSystem()}\n\n${poolPrompt(auftrag())}`} what="Er enthält die Arbeitsblätter der Kinder und die Übungen, die es schon gibt." pasted={pasted} onPaste={setPasted} onError={job.setError} />}

          {neuesBild && (
            <div className="lqt-pool-neu">
              <PunktEditor
                stunde={stunde}
                id={neueId(pool.map((e) => e.u.id))}
                onSave={(u) => {
                  onChange([...pool, { u, frei: false }]);
                  setNeuesBild(false);
                }}
                onCancel={() => setNeuesBild(false)}
              />
            </div>
          )}

          {pool.length > 0 && (
            <ol className="lqt-pool">
              {pool.map((e) => (
                <li key={e.u.id} className={e.frei ? 'is-frei' : ''}>
                  <div className="lqt-pool-kopf">
                    <span className="lqt-pool-art">
                      {artName(e.u)}
                      {e.u.niveau && ` · ${NIVEAUS[e.u.niveau]}`}
                    </span>
                    <span className={`lqt-pool-status ${e.frei ? 'is-frei' : ''}`}>{e.frei ? 'freigegeben' : 'zu prüfen'}</span>
                  </div>
                  {edit === e.u.id && e.u.art === 'punkt' ? (
                    <PunktEditor
                      stunde={stunde}
                      id={e.u.id}
                      start={e.u}
                      onSave={(u) => {
                        setze(e.u.id, (x) => ({ ...x, u }));
                        setEdit(null);
                      }}
                      onCancel={() => setEdit(null)}
                    />
                  ) : edit === e.u.id ? (
                    <PoolEditor
                      u={e.u}
                      onSave={(u) => {
                        setze(e.u.id, (x) => ({ ...x, u }));
                        setEdit(null);
                      }}
                      onCancel={() => setEdit(null)}
                    />
                  ) : (
                    <>
                      <Vorschau u={e.u} />
                      <div className="lqt-pool-aktionen">
                        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setze(e.u.id, (x) => ({ ...x, frei: !x.frei }))}>
                          <Icon icon={e.frei ? Undo2 : Check} />
                          {e.frei ? 'Zurücknehmen' : 'Freigeben'}
                        </button>
                        <button type="button" className="btn btn-secondary ui-btn" disabled={!!edit || neuesBild} onClick={() => setEdit(e.u.id)}>
                          <Icon icon={Pencil} />
                          Ändern
                        </button>
                        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setze(e.u.id, () => null)} title="Diese Frage löschen">
                          <Icon icon={Trash2} />
                          Löschen
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}

          <div className="dialog-actions">
            {frei < pool.length && !chatOpen && (
              <button type="button" className="btn btn-secondary ui-btn" disabled={!!edit || neuesBild} onClick={() => onChange(pool.map((e) => ({ ...e, frei: true })))} title="Alle Fragen im Pool für die Klasse freigeben">
                <Icon icon={CheckCheck} />
                Alle freigeben ({pool.length - frei})
              </button>
            )}
            {!chatOpen && !voll && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setChatOpen(true)} style={{ marginRight: 'auto' }} disabled={!!busy}>
                <Icon icon={ClipboardCopy} />
                Über den Chat
              </button>
            )}
            {ai === null && !chatOpen && !voll && (
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setKeyOpen(true)}>
                <Icon icon={KeyRound} />
                Schlüssel einrichten …
              </button>
            )}
            {!chatOpen && !voll && (
              <button
                type="button"
                className="btn btn-secondary ui-btn"
                disabled={!bilder.length || neuesBild || !!edit}
                title={bilder.length ? 'Stellen auf einem Bild vom Arbeitsblatt setzen und benennen' : 'Auf den Arbeitsblättern der Kinder ist noch keine Abbildung mit eigenem Bild.'}
                onClick={() => setNeuesBild(true)}
              >
                <Icon icon={MapPin} />
                Punkte im Bild …
              </button>
            )}
            <button type="button" className="btn btn-secondary ui-btn" onClick={close}>
              Schließen
            </button>
            {chatOpen ? (
              <button type="button" className="btn btn-primary ui-btn" onClick={() => job.paste(pasted, read)} disabled={!pasted.trim()}>
                <Icon icon={ClipboardPaste} />
                Antwort einlesen
              </button>
            ) : (
              !voll && (
                <button type="button" className="btn btn-primary ui-btn" onClick={run} disabled={!ai || !!busy} title={ai ? undefined : 'Erst einen KI-Schlüssel einrichten oder „Über den Chat“ nehmen'}>
                  <Icon icon={Sparkles} />
                  {pool.length ? 'Weitere Fragen erzeugen' : 'Fragen erzeugen'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
      {keyOpen && <AiSettingsDialog onClose={() => setKeyOpen(false)} />}
    </>
  );
}

/** How the exercise reads, with the right answers marked. */
function Vorschau({ u }: { u: Uebung }) {
  const ok = (text: string, on: boolean, key: number) => (
    <li key={key} className={on ? 'is-richtig' : ''}>
      {on && <span aria-label="richtig">✓ </span>}
      {text}
    </li>
  );
  return (
    <div className="lqt-pool-vorschau">
      <p className="lqt-pool-frage">{u.frage}</p>
      {u.art === 'waehlen' && (
        <>
          {u.hoeren && <p>🔊 {u.hoeren}</p>}
          {u.aussage && <p>{u.aussage}</p>}
          <ul>{u.optionen.map((o, i) => ok(o, u.richtig.includes(i), i))}</ul>
        </>
      )}
      {u.art === 'richtigfalsch' && (
        <p>
          {u.aussage} → <b>{u.richtig ? 'richtig' : 'falsch'}</b>
        </p>
      )}
      {u.art === 'paare' && <ul>{u.paare.map(([a, b], i) => <li key={i}>{a} – {b}</li>)}</ul>}
      {u.art === 'luecke' && (
        <p>
          {lueckeText(u)}
          {ablenkerVon(u).length > 0 && <span className="lqt-pool-neben"> · Ablenker: {ablenkerVon(u).join(', ')}</span>}
        </p>
      )}
      {u.art === 'reihenfolge' && (
        <p>
          {u.loesung}
          {u.hinweis && <span className="lqt-pool-neben"> · Hinweis: {u.hinweis}</span>}
        </p>
      )}
      {u.art === 'gruppen' && (
        <ul>
          {u.gruppen.map((g, gi) => (
            <li key={gi}>
              <b>{g}:</b> {u.karten.filter(([, k]) => k === gi).map(([t]) => t).join(', ')}
            </li>
          ))}
        </ul>
      )}
      {u.art === 'bild' && <p>{kurzText(u)}</p>}
      {u.art === 'punkt' && <BildMitPunkten bildId={u.bild.slice(KARTE_KEY.length)} punkte={u.punkte} klein />}
      {u.art === 'schreiben' && (
        <p>
          {u.aussage && `${u.aussage} → `}
          <b>{u.loesungen[0]}</b>
          {u.loesungen.length > 1 && <span className="lqt-pool-neben"> · auch richtig: {u.loesungen.slice(1).join(', ')}</span>}
        </p>
      )}
      {u.erklaerung && <p className="lqt-pool-neben">Erklärung: {u.erklaerung}</p>}
    </div>
  );
}

/** Text changes of one exercise; the right answers can be changed too, the number of options cannot. */
function PoolEditor({ u, onSave, onCancel }: { u: Uebung; onSave(u: Uebung): void; onCancel(): void }) {
  const [d, setD] = useState<Uebung>(u);
  const [satz, setSatz] = useState(u.art === 'luecke' ? lueckeText(u) : '');
  const [ablenker, setAblenker] = useState(u.art === 'luecke' ? ablenkerVon(u).join(', ') : '');
  const [loesungen, setLoesungen] = useState(u.art === 'schreiben' ? u.loesungen.join(' / ') : '');
  // Kept apart from the exercise: gap and word order are built anew on saving and would lose them.
  const [erklaerung, setErklaerung] = useState(u.erklaerung ?? '');
  const [niveau, setNiveau] = useState<Niveau | undefined>(u.niveau);
  const [fehler, setFehler] = useState('');
  const set = (patch: Partial<Uebung>) => setD((x) => ({ ...x, ...patch }) as Uebung);

  const speichern = () => {
    let next: Uebung | null = d;
    if (d.art === 'luecke') next = lueckeAus(d.id, d.frage, satz, ablenker.split(','));
    if (d.art === 'reihenfolge') next = reihenfolgeAus(d.id, d.frage, d.loesung, d.hinweis.trim());
    if (d.art === 'schreiben') next = { ...d, loesungen: loesungen.split(/\s+\/\s+/).map((l) => l.trim()).filter(Boolean) };
    const ok = next && mitZusatz(next, erklaerung, niveau);
    if (!ok) {
      setFehler(
        erklaerung.length > 240
          ? 'Die Erklärung darf höchstens 240 Zeichen haben.'
          : d.art === 'schreiben'
            ? 'Schreib 1 bis 4 richtige Schreibweisen, mit Leerzeichen und Schrägstrich getrennt, z. B. „sister / the sister“.'
            : d.art === 'luecke'
          ? 'So geht die Lücke nicht: Schreib die Lösung in eckige Klammern, z. B. „Die Sonne ist ein [Stern].“'
          : d.art === 'reihenfolge'
              ? 'Der Satz braucht 2 bis 14 Wörter.'
              : 'So geht die Aufgabe nicht: Kein Feld darf leer sein, Texte höchstens 240 Zeichen, jede Gruppe braucht eine Karte.',
      );
      return;
    }
    onSave(ok);
  };

  const feld = (label: string, value: string, onValue: (v: string) => void, key?: string | number) => (
    <label className="lqt-pool-feld" key={key}>
      <span>{label}</span>
      <input className="input" value={value} onChange={(e) => onValue(e.target.value)} />
    </label>
  );

  return (
    <div className="lqt-pool-editor">
      {feld('Anweisung', d.frage, (frage) => set({ frage }))}
      {d.art === 'waehlen' && (
        <>
          {d.hoeren !== undefined && feld('Wird vorgelesen', d.hoeren, (hoeren) => set({ hoeren }))}
          {feld('Aussage (freiwillig)', d.aussage ?? '', (aussage) => set({ aussage }))}
          {d.optionen.map((o, i) => (
            <div key={i} className="lqt-pool-option">
              <input
                type="checkbox"
                aria-label={`Antwort ${i + 1} ist richtig`}
                checked={d.richtig.includes(i)}
                onChange={(e) => set({ richtig: e.target.checked ? [...d.richtig, i].sort() : d.richtig.filter((x) => x !== i) })}
              />
              <input className="input" aria-label={`Antwort ${i + 1}`} value={o} onChange={(e) => set({ optionen: d.optionen.map((x, k) => (k === i ? e.target.value : x)) })} />
            </div>
          ))}
          <p className="lqt-hint">Haken = richtige Antwort.</p>
        </>
      )}
      {d.art === 'richtigfalsch' && (
        <>
          {feld('Aussage', d.aussage, (aussage) => set({ aussage }))}
          <label className="lqt-pool-feld">
            <span>Die Aussage ist</span>
            <select className="input" value={d.richtig ? 'r' : 'f'} onChange={(e) => set({ richtig: e.target.value === 'r' })}>
              <option value="r">richtig</option>
              <option value="f">falsch</option>
            </select>
          </label>
        </>
      )}
      {d.art === 'paare' &&
        d.paare.map(([a, b], i) => (
          <div key={i} className="lqt-pool-option">
            <input className="input" aria-label={`Paar ${i + 1} links`} value={a} onChange={(e) => set({ paare: d.paare.map((p, k) => (k === i ? [e.target.value, p[1]] : p)) })} />
            <input className="input" aria-label={`Paar ${i + 1} rechts`} value={b} onChange={(e) => set({ paare: d.paare.map((p, k) => (k === i ? [p[0], e.target.value] : p)) })} />
          </div>
        ))}
      {d.art === 'luecke' && (
        <>
          {feld('Satz, Lösungen in [eckigen Klammern]', satz, setSatz)}
          {feld('Ablenker, mit Komma getrennt', ablenker, setAblenker)}
        </>
      )}
      {d.art === 'reihenfolge' && (
        <>
          {feld('Lösungssatz (die App mischt die Wörter)', d.loesung, (loesung) => set({ loesung }))}
          {feld('Hinweis (freiwillig)', d.hinweis, (hinweis) => set({ hinweis }))}
        </>
      )}
      {d.art === 'gruppen' && (
        <>
          {d.gruppen.map((g, gi) => feld(`Gruppe ${gi + 1}`, g, (v) => set({ gruppen: d.gruppen.map((x, k) => (k === gi ? v : x)) }), `g${gi}`))}
          {d.karten.map(([t, g], i) => (
            <div key={i} className="lqt-pool-option">
              <input className="input" aria-label={`Karte ${i + 1}`} value={t} onChange={(e) => set({ karten: d.karten.map((k, j) => (j === i ? [e.target.value, k[1]] : k)) })} />
              <select className="input" aria-label={`Gruppe von Karte ${i + 1}`} value={g} onChange={(e) => set({ karten: d.karten.map((k, j) => (j === i ? [k[0], Number(e.target.value)] : k)) })}>
                {d.gruppen.map((name, gi) => (
                  <option key={gi} value={gi}>
                    {name || `Gruppe ${gi + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </>
      )}
      {d.art === 'schreiben' && (
        <>
          {feld('Was übersetzt oder beantwortet wird (freiwillig)', d.aussage ?? '', (aussage) => set({ aussage }))}
          {feld('Richtige Schreibweisen, mit „ / “ getrennt (die erste wird gezeigt)', loesungen, setLoesungen)}
        </>
      )}
      {feld('Erklärung nach einem Fehler (freiwillig)', erklaerung, setErklaerung)}
      <label className="lqt-pool-feld">
        <span>Schwierigkeit</span>
        <select className="input" value={niveau ?? ''} onChange={(e) => setNiveau(e.target.value ? (Number(e.target.value) as Niveau) : undefined)}>
          <option value="">keine Angabe</option>
          {([1, 2, 3] as const).map((n) => (
            <option key={n} value={n}>
              {NIVEAUS[n]}
            </option>
          ))}
        </select>
      </label>
      {fehler && <p className="json-err">{fehler}</p>}
      <div className="lqt-pool-aktionen">
        <button type="button" className="btn btn-secondary ui-btn" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary ui-btn" onClick={speichern}>
          <Icon icon={Check} />
          Übernehmen
        </button>
      </div>
    </div>
  );
}

/** A picture of this device with its places, numbered and named. `onTap` gets the place in percent. */
function BildMitPunkten({ bildId, punkte, klein = false, wahl, onTap }: { bildId: string; punkte: [number, number, string][]; klein?: boolean; wahl?: number | null; onTap?(x: number, y: number): void }) {
  const img = useImageUrl(bildId);
  if (img.status !== 'ready') return <p className="lqt-hint">{img.status === 'loading' ? 'Bild wird geladen …' : 'Das Bild ist auf diesem Gerät nicht da.'}</p>;
  return (
    <div
      className={`lqt-karte ${klein ? 'is-klein' : ''} ${onTap ? 'is-aktiv' : ''}`}
      onClick={(e) => {
        if (!onTap) return;
        const r = e.currentTarget.getBoundingClientRect();
        onTap((100 * (e.clientX - r.left)) / r.width, (100 * (e.clientY - r.top)) / r.height);
      }}
    >
      <img src={img.url} alt="" draggable={false} />
      {punkte.map(([x, y, name], i) => (
        <span key={i} className={`lqt-karte-punkt ${wahl === i ? 'is-wahl' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} title={name}>
          {i + 1}
        </span>
      ))}
    </div>
  );
}

/** A small button with one of the lesson's pictures. */
function BildWahl({ id, titel, an, onClick }: { id: string; titel: string; an: boolean; onClick(): void }) {
  const img = useImageUrl(id);
  return (
    <button type="button" className={`lqt-bildwahl ${an ? 'is-an' : ''}`} aria-pressed={an} onClick={onClick} title={titel}>
      {img.status === 'ready' ? <img src={img.url} alt="" /> : <span>…</span>}
      <small>{titel}</small>
    </button>
  );
}

/** Places on a picture of the worksheet: tap the picture to set a place, name each one. */
function PunktEditor({ stunde, id, start, onSave, onCancel }: { stunde: Lesson; id: string; start?: Extract<Uebung, { art: 'punkt' }>; onSave(u: Uebung): void; onCancel(): void }) {
  const bilder = bilderDerStunde(stunde);
  const [bildId, setBildId] = useState(start ? start.bild.slice(KARTE_KEY.length) : (bilder[0]?.id ?? ''));
  const [punkte, setPunkte] = useState<[number, number, string][]>(start?.punkte ?? []);
  const [frage, setFrage] = useState(start?.frage ?? 'Tippe auf die richtige Stelle.');
  /** The place that moves with the next tap. */
  const [wahl, setWahl] = useState<number | null>(null);
  const [fehler, setFehler] = useState('');
  const runde = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;

  const tap = (x: number, y: number) => {
    setFehler('');
    if (wahl !== null) {
      setPunkte(punkte.map((p, i) => (i === wahl ? [runde(x), runde(y), p[2]] : p)));
      setWahl(null);
    } else if (punkte.length < PUNKTE[1]) setPunkte([...punkte, [runde(x), runde(y), '']]);
    else setFehler(`Höchstens ${PUNKTE[1]} Punkte je Bild. Lege für weitere eine zweite Aufgabe an.`);
  };
  const speichern = () => {
    const u = readUebung(punktAufgabe(id, bildId, punkte.map(([x, y, n]) => [x, y, n.trim()]), frage.trim()));
    if (u) return onSave(u);
    setFehler(
      !punkte.length
        ? 'Tippe ins Bild, um einen Punkt zu setzen.'
        : punkte.some(([, , n]) => !n.trim())
          ? 'Jeder Punkt braucht einen Namen.'
          : 'Jeder Punkt braucht einen eigenen Namen (höchstens 60 Zeichen), die Anweisung darf nicht leer sein.',
    );
  };

  if (!bilder.length && !start) return <p className="lqt-hint">Auf den Arbeitsblättern der Kinder ist noch keine Abbildung mit eigenem Bild.</p>;
  return (
    <div className="lqt-pool-editor">
      <b className="lqt-pool-art">Punkte im Bild</b>
      {bilder.length > 1 && (
        <div className="lqt-bildwahlen">
          {bilder.map((b) => (
            <BildWahl key={b.id} id={b.id} titel={b.titel} an={b.id === bildId} onClick={() => setBildId(b.id)} />
          ))}
        </div>
      )}
      <p className="lqt-hint">{wahl !== null ? `Tippe ins Bild, wohin Punkt ${wahl + 1} soll.` : 'Tippe ins Bild, um einen Punkt zu setzen, und gib ihm einen Namen. Die Kinder tippen die Stellen nacheinander an.'}</p>
      <BildMitPunkten bildId={bildId} punkte={punkte} wahl={wahl} onTap={tap} />
      {punkte.map(([, , name], i) => (
        <div key={i} className="lqt-pool-option">
          <span className="lqt-karte-nr">{i + 1}</span>
          <input className="input" aria-label={`Name von Punkt ${i + 1}`} placeholder="Name, z. B. Rhein" value={name} onChange={(e) => {
              setFehler('');
              setPunkte(punkte.map((p, k) => (k === i ? [p[0], p[1], e.target.value] : p)));
            }} />
          <button type="button" className={`btn btn-secondary ui-btn ${wahl === i ? 'is-on' : ''}`} aria-pressed={wahl === i} onClick={() => setWahl(wahl === i ? null : i)} title="Danach ins Bild tippen">
            <Icon icon={Move} />
            Verschieben
          </button>
          <button
            type="button"
            className="btn btn-secondary ui-btn"
            aria-label={`Punkt ${i + 1} löschen`}
            onClick={() => {
              setPunkte(punkte.filter((_, k) => k !== i));
              setWahl(null);
            }}
          >
            <Icon icon={Trash2} />
          </button>
        </div>
      ))}
      <label className="lqt-pool-feld">
        <span>Anweisung</span>
        <input className="input" value={frage} onChange={(e) => setFrage(e.target.value)} />
      </label>
      {fehler && <p className="json-err">{fehler}</p>}
      <div className="lqt-pool-aktionen">
        <button type="button" className="btn btn-secondary ui-btn" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary ui-btn" onClick={speichern}>
          <Icon icon={Check} />
          Übernehmen
        </button>
      </div>
    </div>
  );
}
