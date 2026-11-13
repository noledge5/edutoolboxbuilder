// Lernquest Extra-Pakete on the teacher page: Grammatik and Wortschatz packages that belong to no lesson. The teacher
// types a topic (or takes the words of a vocabulary list), Claude writes the exercises in the KI-Fragenpool dialog,
// the teacher checks them and unlocks the package for the class; it becomes a station in „Grammatik-Turm“ or
// „Wortschatz-Wald“ behind the modules of the map.
import { useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Icon } from '../../icons';
import type { ExtraArt, ExtraPaket, Library } from '../../library/types';
import { buildExtraPaket, EXTRA_ARTEN, extraAlsStunde, extraInhalt, extraStunde, extraVerschieben, extraZiele, freiFuer, gleicheRegion, newExtra } from '../extra';
import { freigegeben } from '../fragenpool';
import { mitBildern } from '../paket';
import { rundenZahl } from '../rules';
import { freischalten, LqError, sperren, type KlasseInfo } from '../server';
import { FragenpoolDialog } from './Fragenpool';
import { bildVorschau, PAKET_MAX } from './senden';

export { freiFuer };

/** Sends one Extra-Paket to a class; `frei`: ids of the Extra-Pakete unlocked there (for the region's stations). */
export async function extraEinzelnSenden(keys: string[], klasse: string, e: ExtraPaket, alle: ExtraPaket[], frei: readonly string[]): Promise<void> {
  const paket = await mitBildern(buildExtraPaket(e, alle, frei), bildVorschau);
  if (new TextEncoder().encode(JSON.stringify(paket)).length > PAKET_MAX) throw new LqError('gross');
  await freischalten(keys, klasse, extraStunde(e), paket);
}

/** Sends again every Extra-Paket unlocked for a class (after changes, with „Freigeschaltete neu senden“). */
export async function extraSenden(keys: string[], klasse: string, alle: ExtraPaket[], stunden: readonly string[]): Promise<void> {
  const frei = freiFuer(stunden);
  for (const e of alle.filter((x) => frei.includes(x.id))) await extraEinzelnSenden(keys, klasse, e, alle, frei);
}

/** Vocabulary lists of the lessons of a subject and grade: one entry per list, its words as „englisch = deutsch“. */
export function vokabelListen(lib: Library, subject: string, grade: number): { id: string; name: string; words: string }[] {
  const out: { id: string; name: string; words: string }[] = [];
  const modules = lib.modules.filter((m) => m.subject === subject && m.grade === grade).sort((a, b) => a.number - b.number);
  for (const m of modules)
    for (const l of lib.lessons.filter((x) => x.moduleId === m.id).sort((a, b) => a.number - b.number))
      for (const p of l.doc.pages)
        for (const b of p.blocks) {
          if (b.type !== 'vocab') continue;
          const words = String(b.props.rows ?? '')
            .split('\n')
            .map((r) => r.split('|').map((c) => c.trim()))
            .filter((c) => c[0])
            .map((c) => (c[2] ? `${c[0]} = ${c[2]}` : c[0]))
            .join('\n');
          if (words) out.push({ id: b.id, name: `M${m.number} S${l.number}: ${String(b.props.title ?? '') || l.title}`, words });
        }
  return out;
}

interface Props {
  lib: Library;
  klasse: KlasseInfo;
  subject: string;
  grade: number;
  busy: boolean;
  act(f: (keys: string[]) => Promise<unknown>): Promise<void>;
  onChange(e: ExtraPaket): void;
  onDelete(id: string): void;
}

export function ExtraPakete({ lib, klasse, subject, grade, busy, act, onChange, onDelete }: Props) {
  const alle = useMemo(() => lib.extras ?? [], [lib.extras]);
  const hier = alle.filter((e) => e.subject === subject && e.grade === grade).sort((a, b) => a.art.localeCompare(b.art) || a.createdAt - b.createdAt);
  const frei = freiFuer(klasse.stunden);
  const listen = useMemo(() => vokabelListen(lib, subject, grade), [lib, subject, grade]);
  const [neu, setNeu] = useState(false);
  const [art, setArt] = useState<ExtraArt>('grammatik');
  const [thema, setThema] = useState('');
  const [liste, setListe] = useState('');
  const [poolOf, setPoolOf] = useState<string | null>(null);
  /** The package being moved to another subject and grade, and the chosen target („Fach|Klassenstufe“). */
  const [ziehen, setZiehen] = useState<string | null>(null);
  const [ziel, setZiel] = useState('');
  const ziele = useMemo(() => extraZiele(lib).filter((z) => z.subject !== subject || z.grade !== grade), [lib, subject, grade]);
  const freiVorher = useRef('');
  const en = lib.modules.some((m) => m.subject === subject && m.grade === grade && m.lang === 'en');

  /** Unlocks or locks; the other unlocked packages of the region go again (their list of stations changes). */
  const schalten = (e: ExtraPaket, an: boolean) =>
    void act(async (keys) => {
      const nachher = an ? [...frei, e.id] : frei.filter((id) => id !== e.id);
      if (an) await extraEinzelnSenden(keys, klasse.id, e, alle, nachher);
      else await sperren(keys, klasse.id, extraStunde(e));
      for (const x of gleicheRegion(alle, e).filter((x) => x.id !== e.id && nachher.includes(x.id))) await extraEinzelnSenden(keys, klasse.id, x, alle, nachher);
    });

  const anlegen = () => {
    const words = listen.find((x) => x.id === liste)?.words ?? '';
    const titel = thema.trim() || listen.find((x) => x.id === liste)?.name.replace(/^M\d+ S\d+: /, '') || '';
    if (!titel) return;
    const e = newExtra(subject, grade, art, titel, words, en ? 'en' : 'de');
    onChange(e);
    setNeu(false);
    setThema('');
    setListe('');
    freiVorher.current = '[]';
    setPoolOf(e.id);
  };

  const offen = alle.find((e) => e.id === poolOf);
  const schliessen = () => {
    const e = offen;
    setPoolOf(null);
    if (e && frei.includes(e.id) && JSON.stringify(freigegeben(e.pool)) !== freiVorher.current) void act((keys) => extraEinzelnSenden(keys, klasse.id, e, alle, frei));
  };

  return (
    <section className="lqt-card lqt-extras" aria-label="Extra-Pakete">
      <div className="lqt-head">
        <div>
          <h2>Extra-Pakete</h2>
          <p className="lqt-hint">
            Übungen zu einem Thema ohne Stunde, z. B. „simple past“ oder „Wortfeld Wetter“. Grammatik-Pakete werden Stationen im {EXTRA_ARTEN.grammatik.region}, Wortschatz-Pakete im {EXTRA_ARTEN.wortschatz.region}, hinter den
            Modulen der Karte. Claude schreibt die Übungen; die Klasse sieht nur, was du freigibst.
          </p>
        </div>
        <div className="lqt-actions">
          <button type="button" className="btn btn-secondary ui-btn" disabled={!subject || !grade} onClick={() => setNeu((x) => !x)}>
            <Icon icon={Plus} /> Neues Paket
          </button>
        </div>
      </div>
      {neu && (
        <div className="lqt-extra-neu">
          <div className="field">
            <label htmlFor="lqt-extra-art">Art</label>
            <select id="lqt-extra-art" className="input" value={art} onChange={(e) => setArt(e.target.value as ExtraArt)}>
              <option value="grammatik">Grammatik ({EXTRA_ARTEN.grammatik.region})</option>
              <option value="wortschatz">Wortschatz ({EXTRA_ARTEN.wortschatz.region})</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="lqt-extra-thema">Thema</label>
            <input id="lqt-extra-thema" className="input" maxLength={80} value={thema} placeholder={art === 'grammatik' ? 'z. B. simple past' : 'z. B. Wortfeld Wetter'} onChange={(e) => setThema(e.target.value)} />
          </div>
          {listen.length > 0 && (
            <div className="field">
              <label htmlFor="lqt-extra-liste">Wörter aus einer Vokabelliste (freiwillig)</label>
              <select id="lqt-extra-liste" className="input" value={liste} onChange={(e) => setListe(e.target.value)}>
                <option value="">– keine –</option>
                {listen.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="button" className="btn btn-primary ui-btn" disabled={!thema.trim() && !liste} onClick={anlegen}>
            <Icon icon={Sparkles} /> Anlegen und Fragen erzeugen
          </button>
        </div>
      )}
      {!hier.length && !neu && <p className="lib-empty">Noch keine Extra-Pakete in diesem Fach und dieser Klassenstufe.</p>}
      {hier.length > 0 && (
        <ul className="lqt-module">
          {hier.map((e) => {
            const n = freigegeben(e.pool).length;
            const imPool = e.pool?.length ?? 0;
            const an = frei.includes(e.id);
            return (
              <li key={e.id}>
                <label className={`lqt-lesson ${!n && !an ? 'is-empty' : ''}`}>
                  <input type="checkbox" checked={an} disabled={busy || (!n && !an)} onChange={(x) => schalten(e, x.target.checked)} aria-label={`${e.title} freischalten`} />
                  <span>
                    {EXTRA_ARTEN[e.art].name}: {e.title}
                  </span>
                  <small>{n ? `${n} ${n === 1 ? 'Übung' : 'Übungen'} · ${rundenZahl(n)} ${rundenZahl(n) === 1 ? 'Runde' : 'Runden'}` : 'noch keine freigegebenen Übungen'}</small>
                </label>
                <button
                  type="button"
                  className="btn btn-secondary ui-btn lqt-pool-knopf"
                  onClick={() => {
                    freiVorher.current = JSON.stringify(freigegeben(e.pool));
                    setPoolOf(e.id);
                  }}
                >
                  <Icon icon={Sparkles} />
                  {imPool > 0 ? 'Fragen prüfen' : 'Fragen erzeugen'}
                  {imPool > 0 && <small className="lqt-pool-zahl">{imPool - n > 0 ? `${imPool - n} zu prüfen` : `${imPool} frei`}</small>}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ui-btn"
                  disabled={busy || an || !ziele.length}
                  title={an ? 'Erst für die Klasse sperren' : 'In ein anderes Fach oder eine andere Klassenstufe verschieben'}
                  aria-label={`${e.title} verschieben`}
                  aria-expanded={ziehen === e.id}
                  onClick={() => {
                    setZiehen(ziehen === e.id ? null : e.id);
                    setZiel('');
                  }}
                >
                  <Icon icon={ArrowRightLeft} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ui-btn"
                  disabled={busy || an}
                  title={an ? 'Erst für die Klasse sperren' : 'Paket löschen'}
                  aria-label={`${e.title} löschen`}
                  onClick={() => window.confirm(`Extra-Paket „${e.title}“ mit allen Übungen löschen?\n\nIst es in einer anderen Klasse freigeschaltet, sperre es dort vorher; sonst bleibt es dort auf der Karte.`) && onDelete(e.id)}
                >
                  <Icon icon={Trash2} />
                </button>
                {ziehen === e.id && (
                  <div className="lqt-extra-verschieben">
                    <label htmlFor={`lqt-ziel-${e.id}`}>Verschieben nach</label>
                    <select id={`lqt-ziel-${e.id}`} className="input" value={ziel} onChange={(x) => setZiel(x.target.value)}>
                      <option value="">– Fach und Klassenstufe wählen –</option>
                      {ziele.map((z) => (
                        <option key={`${z.subject}|${z.grade}`} value={`${z.subject}|${z.grade}`}>
                          {z.subject} {z.grade}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary ui-btn"
                      disabled={!ziel}
                      onClick={() => {
                        const z = ziele.find((x) => `${x.subject}|${x.grade}` === ziel);
                        if (!z) return;
                        onChange(extraVerschieben(e, z));
                        setZiehen(null);
                      }}
                    >
                      Verschieben
                    </button>
                    <small>Alle Übungen kommen mit. Dort wieder freischalten; ist es in einer anderen Klasse freigeschaltet, dort vorher sperren.</small>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {offen && (
        <FragenpoolDialog
          {...extraAlsStunde(offen, alle)}
          settings={lib.settings}
          inhalt={extraInhalt(offen)}
          onChange={(pool, hilfe) => onChange({ ...offen, pool, ...(hilfe ? { poolHilfe: hilfe } : {}) })}
          onClose={schliessen}
        />
      )}
    </section>
  );
}
