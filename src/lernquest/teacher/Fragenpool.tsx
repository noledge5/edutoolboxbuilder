// „Fragenpool“ of a lesson (Lernquest Stufe 5): Claude writes about 20 exercises from the student pages (over the chat
// or directly with the key of this device); the teacher reads each one, corrects the text, releases or discards it.
// Changes are saved at once in the lesson (it syncs like the rest of the lesson); the class gets the released ones
// with the next sending of the package.
import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, ClipboardPaste, KeyRound, Pencil, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { Icon } from '../../icons';
import { AiSettingsDialog } from '../../ai/AiSettingsDialog';
import { classProfileOf } from '../../ai/classNotes';
import { AiBusy, ChatPath, useAiJob } from '../../ai/parts';
import { dollars } from '../../ai/prices';
import { modelLabel } from '../../ai/settings';
import { useAiSettings } from '../../ai/useAi';
import type { Lesson, Module, Settings } from '../../library/types';
import { exercisesOf } from '../paket';
import { RUNDE_MAX, RUNDEN_MAX } from '../rules';
import { ablenkerVon, kurzText, lueckeAus, lueckeText, POOL_MAX, poolAusAntwort, poolPrompt, poolSystem, readUebung, reihenfolgeAus } from '../fragenpool';
import type { PoolEintrag, Uebung, UebungsArt } from '../types';

const ARTEN: Record<UebungsArt, string> = {
  waehlen: 'Antippen',
  richtigfalsch: 'Richtig/Falsch',
  paare: 'Paare',
  luecke: 'Lücke',
  reihenfolge: 'Reihenfolge',
  gruppen: 'Sortieren',
  bild: 'Bild wählen',
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
    void job.run({ job: 'small', what: 'Lernquest-Fragenpool', system: poolSystem(), user: poolPrompt(auftrag()), maxTokens: 8000, effort: 'low' }, read);
  };
  const close = () => {
    if (busy && !window.confirm('Claude arbeitet noch. Abbrechen und schließen?')) return;
    job.stop();
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !keyOpen && !edit && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const setze = (id: string, f: (e: PoolEintrag) => PoolEintrag | null) =>
    onChange(pool.flatMap((e) => (e.u.id === id ? [f(e)].filter((x): x is PoolEintrag => x !== null) : [e])));

  return (
    <>
      <div className="dialog-backdrop" onClick={() => !busy && !edit && close()}>
        <div className="dialog ai-dialog lqt-pool-dialog" role="dialog" aria-modal="true" aria-label="Fragenpool" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-title">
            <Icon icon={Sparkles} /> Fragenpool · Stunde {stunde.number}: {stunde.title}
          </div>
          <p className="dialog-body">
            Claude schreibt aus den Arbeitsblättern der Kinder etwa 20 weitere Übungen (ohne Lehrkraft-Seiten, ohne Namen). Du prüfst jede, verbesserst den Text und gibst sie frei. Freigegebene kommen nach {eigene.length === 1 ? 'der 1 Übung' : `den ${eigene.length} Übungen`} der Stunde und
            erreichen die Klasse beim nächsten Freischalten oder mit „Freigeschaltete neu senden“.
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
          {busy && <AiBusy busy={busy} hint="Das dauert meist zwanzig bis vierzig Sekunden." onStop={job.stop} />}
          {error && <p className="json-err">{error}</p>}
          {meldung && !busy && <p className="lqt-hint">{meldung}</p>}
          {answer && !busy && (
            <p className="ai-cost">
              Kosten etwa {dollars(answer.usd)} · {modelLabel(answer.model)}
            </p>
          )}
          {chatOpen && <ChatPath request={() => `${poolSystem()}\n\n${poolPrompt(auftrag())}`} what="Er enthält die Arbeitsblätter der Kinder und die Übungen, die es schon gibt." pasted={pasted} onPaste={setPasted} onError={job.setError} />}

          {pool.length > 0 && (
            <ol className="lqt-pool">
              {pool.map((e) => (
                <li key={e.u.id} className={e.frei ? 'is-frei' : ''}>
                  <div className="lqt-pool-kopf">
                    <span className="lqt-pool-art">{artName(e.u)}</span>
                    <span className={`lqt-pool-status ${e.frei ? 'is-frei' : ''}`}>{e.frei ? 'freigegeben' : 'zu prüfen'}</span>
                  </div>
                  {edit === e.u.id ? (
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
                        <button type="button" className="btn btn-secondary ui-btn" disabled={!!edit} onClick={() => setEdit(e.u.id)}>
                          <Icon icon={Pencil} />
                          Ändern
                        </button>
                        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setze(e.u.id, () => null)} title="Diese Aufgabe aus dem Pool nehmen">
                          <Icon icon={Trash2} />
                          Verwerfen
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}

          <div className="dialog-actions">
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
            {pool.some((e) => !e.frei) && !chatOpen && (
              <button type="button" className="btn btn-secondary ui-btn" disabled={!!edit} onClick={() => onChange(pool.map((e) => ({ ...e, frei: true })))}>
                <Icon icon={Check} />
                Alle freigeben
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
                  {pool.length ? 'Weitere erzeugen' : 'Mit KI erzeugen'}
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
    </div>
  );
}

/** Text changes of one exercise; the right answers can be changed too, the number of options cannot. */
function PoolEditor({ u, onSave, onCancel }: { u: Uebung; onSave(u: Uebung): void; onCancel(): void }) {
  const [d, setD] = useState<Uebung>(u);
  const [satz, setSatz] = useState(u.art === 'luecke' ? lueckeText(u) : '');
  const [ablenker, setAblenker] = useState(u.art === 'luecke' ? ablenkerVon(u).join(', ') : '');
  const [fehler, setFehler] = useState('');
  const set = (patch: Partial<Uebung>) => setD((x) => ({ ...x, ...patch }) as Uebung);

  const speichern = () => {
    let next: Uebung | null = d;
    if (d.art === 'luecke') next = lueckeAus(d.id, d.frage, satz, ablenker.split(','));
    if (d.art === 'reihenfolge') next = reihenfolgeAus(d.id, d.frage, d.loesung, d.hinweis.trim());
    const ok = next && readUebung(next);
    if (!ok) {
      setFehler(
        d.art === 'luecke'
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
