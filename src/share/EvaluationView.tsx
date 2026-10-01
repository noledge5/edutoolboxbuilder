// The evaluation of a handout (#/auswertung/<id>): results arrive encrypted, are opened here with the handout's
// private key and kept on this device. Tabs: the class (live table), frequent mistakes, competences; and a view
// without names for the projector.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MonitorPlay, QrCode, RefreshCw, X } from 'lucide-react';
import { Icon } from '../icons';
import { BLOCK_TYPES } from '../model/blockTypes';
import { SearchButton } from '../library/SearchDialog';
import type { Competence } from '../library/types';
import type { Block } from '../model/types';
import { loadResults, saveResults, type StoredResult } from '../storage/library';
import { type Handout, type Submission } from './assignment';
import { open } from './crypto';
import { evaluate, latestSubmissions, levelOf, type StudentResult } from './evaluate';
import { answerText, expectedText, taskSlots } from './grade';
import { fetchResults, KEEP_DAYS } from './server';
import { ShareResult } from './ShareDialog';

interface EvaluationViewProps {
  handout: Handout;
  /** Competences of the module, for their names. */
  competences: Competence[];
  place: string;
  onBack(): void;
}

type Tab = 'klasse' | 'fehler' | 'kompetenzen';

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)} %`);
const tone = (x: number | null) => (x === null ? '' : x >= 0.8 ? ' is-good' : x >= 0.5 ? ' is-mid' : ' is-low');
const clock = (t: number) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export function EvaluationView({ handout, competences, place, onBack }: EvaluationViewProps) {
  const [rows, setRows] = useState<StoredResult[]>([]);
  const [status, setStatus] = useState<{ at: number; error: boolean }>({ at: 0, error: false });
  const [tab, setTab] = useState<Tab>('klasse');
  const [detail, setDetail] = useState<{ student: string; task: number } | null>(null);
  const [beamer, setBeamer] = useState(false);
  const [share, setShare] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // Results kept on this device first, then new ones from the server, every few seconds while the page is open.
  useEffect(() => {
    let alive = true;
    let timer = 0;
    const poll = async () => {
      try {
        const after = rowsRef.current.reduce((m, r) => Math.max(m, r.id), 0);
        const fresh = await fetchResults(handout.id, after);
        const opened: StoredResult[] = [];
        for (const r of fresh) {
          try {
            opened.push({ id: r.id, abgabe: r.abgabe, data: await open<Submission>(r.daten, handout.privateKey) });
          } catch {
            // Not for this key (or damaged): left out.
          }
        }
        if (!alive) return;
        if (opened.length) {
          const next = [...rowsRef.current, ...opened];
          rowsRef.current = next;
          setRows(next);
          saveResults(handout.id, next).catch(() => {});
        }
        setStatus({ at: Date.now(), error: false });
      } catch {
        if (alive) setStatus((s) => ({ ...s, error: true }));
      }
      if (alive) timer = window.setTimeout(poll, document.visibilityState === 'visible' ? 5000 : 30000);
    };
    loadResults(handout.id)
      .then((stored) => {
        if (!alive) return;
        rowsRef.current = stored;
        setRows(stored);
      })
      .catch(() => {})
      .finally(() => alive && poll());
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [handout]);

  const result = useMemo(() => evaluate(handout, latestSubmissions(rows.map((r) => ({ abgabe: r.abgabe, data: r.data as Submission })))), [handout, rows]);
  const { tasks, students, summaries } = result;
  const done = students.filter((s) => s.done).length;
  const compName = (id: string) => competences.find((c) => c.id === id)?.area ?? id;
  const detailStudent = detail && students.find((s) => s.id === detail.student);

  return (
    <div className="app ev-app">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onBack} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Auswertung: {handout.title}</div>
          <div className="topbar-place">
            {place} · {handout.mode === 'uebung' ? 'Übung' : 'Test'} · ausgeteilt {new Date(handout.createdAt).toLocaleDateString('de-DE')}
          </div>
        </div>
        <SearchButton />
        <span className={'ev-live' + (status.error ? ' is-error' : '')} title={status.error ? 'Server nicht erreichbar' : 'Wird alle 5 Sekunden aktualisiert'}>
          <Icon icon={RefreshCw} size={14} />
          {status.error ? 'offline' : `${students.length} dabei · ${done} abgegeben`}
        </span>
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setShare(true)}>
          <Icon icon={QrCode} />
          <span className="btn-label">Link & QR</span>
        </button>
        <button type="button" className="btn btn-primary ui-btn" onClick={() => setBeamer(true)}>
          <Icon icon={MonitorPlay} />
          <span className="btn-label">Für den Beamer</span>
        </button>
      </header>

      <main className="ev-main">
        <div className="ev-tabs" role="tablist">
          {(
            [
              ['klasse', 'Klasse'],
              ['fehler', 'Häufige Fehler'],
              ['kompetenzen', 'Kompetenzen'],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={'seg-pill' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {students.length === 0 && (
          <div className="ev-empty">
            Noch keine Ergebnisse. Sobald jemand seinen Namen eingibt, erscheint er hier. Ergebnisse bleiben {KEEP_DAYS} Tage auf dem Server; was hier einmal angekommen ist, bleibt auf diesem Gerät.
          </div>
        )}

        {tab === 'klasse' && students.length > 0 && (
          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stand</th>
                  {tasks.map((t, i) => (
                    <th key={i} title={`${BLOCK_TYPES[t.block.type].label}: ${String(t.block.props.prompt ?? '')}`}>
                      A{t.num}
                      {handout.pages.length > 1 && <small> S.{t.page + 1}</small>}
                    </th>
                  ))}
                  <th>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <th>{s.name}</th>
                    <td className={'ev-state' + (s.done ? ' is-done' : '')}>{s.done ? `abgegeben ${clock(s.at)}` : `arbeitet · ${clock(s.at)}`}</td>
                    {s.tasks.map((g, i) => {
                      const answered = g.slots.some((x) => x.given);
                      const free = g.total === 0;
                      return (
                        <td key={i}>
                          <button
                            type="button"
                            className={'ev-cell' + (answered && !free ? tone(g.right / g.total) : '') + (answered ? '' : ' is-empty')}
                            onClick={() => setDetail({ student: s.id, task: i })}
                          >
                            {!answered ? '·' : free ? '✎' : `${g.right}/${g.total}`}
                          </button>
                        </td>
                      );
                    })}
                    <td className={'ev-total' + tone(s.total ? s.right / s.total : null)}>{s.total ? pct(s.right / s.total) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ev-note">Eine Zelle antippen zeigt die Antworten. Farben: grün ab 80 %, gelb ab 50 %, rot darunter; ✎ freie Antwort, · noch nichts.</p>
          </div>
        )}

        {tab === 'fehler' && students.length > 0 && (
          <div className="ev-cards">
            {summaries.map((s, i) => {
              const slots = taskSlots(s.block);
              const free = slots.every((x) => x.kind === 'free' || !x.expected);
              return (
                <section key={i} className="ev-card">
                  <div className="ev-card-head">
                    <b>{s.label}</b>
                    <span>{BLOCK_TYPES[s.block.type].label}</span>
                    <span className={'ev-share' + tone(s.share)}>{free ? `${s.answered} Antworten` : `${pct(s.share)} richtig · ${s.answered} bearbeitet`}</span>
                  </div>
                  {s.firstShare !== null && !free && <p className="ev-muted">Beim ersten Prüfen {pct(s.firstShare)} richtig; die Fehler unten stammen aus dem ersten Versuch.</p>}
                  <p className="ev-prompt">{String(s.block.props.prompt ?? '')}</p>
                  {!free && s.share !== null && (
                    <div className="ev-bar">
                      <i style={{ width: `${(s.share ?? 0) * 100}%` }} />
                    </div>
                  )}
                  {free ? (
                    <ul className="ev-answers">
                      {students
                        .filter((st) => st.tasks[i].slots.some((x) => x.given))
                        .map((st) => (
                          <li key={st.id}>
                            <b>{st.name}:</b> {st.tasks[i].slots.map((x) => x.given).join(' ')}
                          </li>
                        ))}
                    </ul>
                  ) : s.mistakes.length === 0 ? (
                    <p className="ev-muted">{s.answered ? 'Keine Fehler.' : 'Noch nicht bearbeitet.'}</p>
                  ) : (
                    <ul className="ev-mistakes">
                      {s.mistakes.map((m, k) => (
                        <li key={k}>
                          <span className="ev-slot">{m.slotLabel}</span>
                          <span className="ev-right">richtig: {m.expected}</span>
                          <span className="ev-wrong">
                            {m.wrong.map((w) => (
                              <span key={w.answer} className="ev-chip">
                                {w.answer} <b>×{w.count}</b>
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {tab === 'kompetenzen' && students.length > 0 && (
          <div className="ev-cards">
            {result.competences.length === 0 && (
              <p className="ev-empty">Keine Aufgabe dieses Auftrags ist mit einer Kompetenz verknüpft. Im Arbeitsblatt im Panel einer Aufgabe unter „Kompetenz“ verknüpfen.</p>
            )}
            {result.competences.map((c) => {
              const help = students.filter((s) => (c.byStudent[s.id] ?? 1) < 0.5);
              return (
                <section key={c.id} className="ev-card">
                  <div className="ev-card-head">
                    <b>{compName(c.id)}</b>
                    <span className={'ev-share' + tone(c.share)}>{pct(c.share)} richtig</span>
                  </div>
                  <div className="ev-students">
                    {students.map((s) => (
                      <span key={s.id} className={'ev-chip' + tone(c.byStudent[s.id])}>
                        {s.name} {pct(c.byStudent[s.id])}
                      </span>
                    ))}
                  </div>
                  {help.length > 0 && (
                    <p className="ev-help">
                      <b>Brauchen Hilfe:</b> {help.map((s) => s.name).join(', ')}
                    </p>
                  )}
                </section>
              );
            })}
            <LevelSummary students={students} tasks={tasks.map((t) => t.block)} />
          </div>
        )}
      </main>

      {detail && detailStudent && <AnswerDetail student={detailStudent} index={detail.task} task={tasks[detail.task]} practice={handout.mode === 'uebung'} onClose={() => setDetail(null)} />}

      {share && (
        <div className="dialog-backdrop" onClick={() => setShare(false)}>
          <div className="dialog share-dialog" role="dialog" aria-label="Link und QR-Code" onClick={(e) => e.stopPropagation()}>
            <div className="share-head">
              <div className="dialog-title">Link und QR-Code</div>
              <button type="button" className="iconbtn" onClick={() => setShare(false)} aria-label="Schließen">
                <Icon icon={X} />
              </button>
            </div>
            <ShareResult handout={handout} />
          </div>
        </div>
      )}

      {beamer && (
        <div className="ev-beamer" role="dialog" aria-label="Auswertung für den Beamer" onClick={() => setBeamer(false)}>
          <h2>{handout.title}</h2>
          <p className="ev-beamer-sub">
            {students.length} bearbeitet · {done} abgegeben
          </p>
          <div className="ev-beamer-grid">
            {summaries.map((s, i) => {
              const slots = taskSlots(s.block);
              const choice = slots.length === 1 && (slots[0].kind === 'choice' || slots[0].kind === 'multi') ? slots[0] : null;
              return (
                <section key={i} className="ev-beamer-card">
                  <b>{s.label}</b>
                  <p>{String(s.block.props.prompt ?? '')}</p>
                  {choice ? (
                    <div className="ev-dist">
                      {choice.options!.map((o) => {
                        const n = students.filter((st) => (st.tasks[i].slots[0]?.given ?? '').split('|').includes(o.v)).length;
                        const right = choice.expected.split('|').includes(o.v);
                        return (
                          <div key={o.v} className={'ev-dist-row' + (right ? ' is-right' : '')}>
                            <span>{o.l}</span>
                            <div className="ev-bar">
                              <i style={{ width: `${students.length ? (n / students.length) * 100 : 0}%` }} />
                            </div>
                            <b>{n}</b>
                          </div>
                        );
                      })}
                    </div>
                  ) : s.share !== null ? (
                    <>
                      <div className="ev-bar is-big">
                        <i style={{ width: `${s.share * 100}%` }} />
                      </div>
                      <span className="ev-beamer-pct">{pct(s.share)} richtig</span>
                      {s.mistakes.slice(0, 2).map((m, k) => (
                        <p key={k} className="ev-beamer-mistake">
                          {m.slotLabel}: oft „{m.wrong[0].answer}“ statt „{m.expected}“
                        </p>
                      ))}
                    </>
                  ) : (
                    <span className="ev-beamer-pct">{s.answered} Antworten</span>
                  )}
                </section>
              );
            })}
          </div>
          <span className="ev-beamer-hint">Ohne Namen · Klick schließt</span>
        </div>
      )}
    </div>
  );
}

function LevelSummary({ students, tasks }: { students: StudentResult[]; tasks: Block[] }) {
  const levels = ['1', '2', '3'].filter((l) => tasks.some((b) => levelOf(b) === l));
  if (!levels.length) return null;
  const names: Record<string, string> = { '1': '★ G', '2': '★★ M', '3': '★★★ E' };
  return (
    <section className="ev-card">
      <div className="ev-card-head">
        <b>Nach Niveau</b>
      </div>
      <table className="ev-table is-small">
        <thead>
          <tr>
            <th>Name</th>
            {levels.map((l) => (
              <th key={l}>{names[l]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <th>{s.name}</th>
              {levels.map((l) => {
                const idx = tasks.map((b, i) => (levelOf(b) === l ? i : -1)).filter((i) => i >= 0);
                const right = idx.reduce((k, i) => k + s.tasks[i].right, 0);
                const total = idx.reduce((k, i) => k + (s.tasks[i].slots.some((x) => x.given) ? s.tasks[i].total : 0), 0);
                const share = total ? right / total : null;
                return (
                  <td key={l} className={'ev-total' + tone(share)}>
                    {pct(share)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AnswerDetail({ student, index, task, practice, onClose }: { student: StudentResult; index: number; task: { block: Block; num: number }; practice: boolean; onClose(): void }) {
  const slots = taskSlots(task.block);
  const g = student.tasks[index];
  const first = student.firstTry[index];
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog ev-detail" role="dialog" aria-label="Antworten" onClick={(e) => e.stopPropagation()}>
        <div className="share-head">
          <div className="dialog-title">
            {student.name} · Aufgabe {task.num}
          </div>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Schließen">
            <Icon icon={X} />
          </button>
        </div>
        <p className="dialog-body">{String(task.block.props.prompt ?? '')}</p>
        {practice && first && (
          <p className="dialog-body">
            Erster Versuch: {first.right}/{first.total} · jetzt: {g.right}/{g.total}
          </p>
        )}
        <dl className="ev-detail-list">
          {slots.map((sl) => {
            const r = g.slots.find((x) => x.key === sl.key);
            return (
              <Fragment key={sl.key}>
                <dt>{sl.label}</dt>
                <dd className={r?.ok === true ? 'is-right' : r?.ok === false ? 'is-wrong' : ''}>
                  {answerText(sl, r?.given ?? '') || <i>keine Antwort</i>}
                  {r?.ok === false && sl.expected && <span className="ev-right"> richtig: {expectedText(sl)}</span>}
                </dd>
              </Fragment>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
