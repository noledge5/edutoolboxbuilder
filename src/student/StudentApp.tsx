// The student view (…/a/#<id>): load the assignment, ask for the name, show the pages with their tasks, send the
// work encrypted to the server now and then and when handed in. No account, no code; the work is kept in this
// browser until handed in, so reloading the page loses nothing.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Lock, Send } from 'lucide-react';
import { Icon } from '../icons';
import type { Doc } from '../model/types';
import { BlockContent } from '../sheet/BlockContent';
import { SheetDocContext } from '../sheet/lang';
import { themeOf, themeVars } from '../sheet/SheetPage';
import { provideImages } from '../storage/images';
import { topicIcon } from '../topicIcons';
import { handoutTasks, readAssignment, type Assignment, type Submission } from '../share/assignment';
import { randomId, seal } from '../share/crypto';
import { DEFAULT_REPO, assignmentSources } from '../share/github';
import { gradeTask, isRight, taskSlots, type Answers } from '../share/grade';
import { handIn } from '../share/server';
import { STUDENT_TEXT } from './text';
import { Task } from './Tasks';

/** "#id" or "#owner/repo/id". */
function linkTarget(hash: string): { repo: string; id: string } | null {
  const parts = decodeURIComponent(hash.replace(/^#\/?/, '')).split('/').filter(Boolean);
  if (parts.length === 1) return { repo: DEFAULT_REPO, id: parts[0] };
  if (parts.length === 3) return { repo: `${parts[0]}/${parts[1]}`, id: parts[2] };
  return null;
}

/** "lea m" → "Lea M."; null when it is not a first name and an initial. */
export function cleanName(raw: string): string | null {
  const words = raw.trim().replace(/\s+/g, ' ').replace(/\.$/, '').split(' ');
  if (words.length < 2) return null;
  const last = words[words.length - 1];
  const first = words.slice(0, -1);
  if (!/^\p{L}$/u.test(last) || !first.every((w) => /^\p{L}[\p{L}'-]*$/u.test(w))) return null;
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  return `${first.map(cap).join(' ')} ${last.toUpperCase()}.`;
}

interface Work {
  abgabe: string;
  name: string;
  answers: Record<string, Answers>;
  first: Record<string, Answers>;
  checks: Record<string, number>;
  /** Blocks checked since their last change (marks are shown). */
  marked: Record<string, boolean>;
  revealed: Record<string, boolean>;
  started: number;
  done: boolean;
}

const storeKey = (id: string) => `arbeitsblatt-baukasten:auftrag:${id}`;

function loadWork(id: string): Work | null {
  try {
    const w = JSON.parse(localStorage.getItem(storeKey(id)) ?? 'null') as Work | null;
    return w && typeof w.abgabe === 'string' ? w : null;
  } catch {
    return null;
  }
}

function saveWork(id: string, w: Work) {
  try {
    localStorage.setItem(storeKey(id), JSON.stringify(w));
  } catch {
    // Private mode: the work lives as long as the page.
  }
}

type Load = { state: 'loading' } | { state: 'error'; text: string } | { state: 'ready'; a: Assignment };

async function loadAssignment(repo: string, id: string): Promise<Assignment | 'missing'> {
  let reached = false;
  for (const url of assignmentSources(repo, id)) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      reached = true;
      if (!res.ok) continue;
      const a = readAssignment(await res.json());
      if (a) return a;
    } catch {
      // Next source.
    }
  }
  if (!reached) throw new Error('offline');
  return 'missing';
}

export function StudentApp() {
  const target = useMemo(() => linkTarget(location.hash), []);
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [work, setWork] = useState<Work | null>(null);
  const [sendState, setSendState] = useState<'saved' | 'sending' | 'failed' | ''>('');
  const t = STUDENT_TEXT[load.state === 'ready' ? load.a.lang : 'de'];

  useEffect(() => {
    if (!target) return setLoad({ state: 'error', text: STUDENT_TEXT.de.notFound });
    loadAssignment(target.repo, target.id)
      .then((a) => {
        if (a === 'missing') return setLoad({ state: 'error', text: STUDENT_TEXT.de.notFound });
        provideImages(a.images);
        document.title = a.title;
        document.documentElement.lang = a.lang;
        setWork(loadWork(a.id));
        setLoad({ state: 'ready', a });
      })
      .catch(() => setLoad({ state: 'error', text: STUDENT_TEXT.de.offline }));
  }, [target]);

  const a = load.state === 'ready' ? load.a : null;

  // — Sending: the whole work, encrypted; the last copy counts. Again when it changed, at most once a minute,
  // after each check, when the page is hidden, and when handed in. —
  const latest = useRef(work);
  latest.current = work;
  const sentAt = useRef(0);
  const dirty = useRef(false);
  const send = useCallback(
    async (w: Work | null = latest.current) => {
      if (!a || !w) return;
      dirty.current = false;
      sentAt.current = Date.now();
      setSendState('sending');
      const sub: Submission = { name: w.name, done: w.done, answers: w.answers, first: w.first, checks: w.checks, started: w.started, at: Date.now() };
      try {
        await handIn(a.id, w.abgabe, await seal(sub, a.key));
        setSendState('saved');
      } catch {
        dirty.current = true;
        setSendState('failed');
      }
    },
    [a],
  );
  useEffect(() => {
    const tick = setInterval(() => {
      if (dirty.current && Date.now() - sentAt.current > 60_000) send();
    }, 10_000);
    const onHide = () => document.visibilityState === 'hidden' && dirty.current && send();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [send]);

  const update = (fn: (w: Work) => Work, now = false) => {
    const w = latest.current;
    if (!a || !w) return;
    const next = fn(w);
    latest.current = next;
    saveWork(a.id, next);
    setWork(next);
    dirty.current = true;
    if (now) send(next);
  };

  if (load.state === 'loading') return <div className="st-app st-center">{t.loading}</div>;
  if (load.state === 'error' || !a) return <div className="st-app st-center st-error">{load.state === 'error' ? load.text : ''}</div>;

  const tasks = handoutTasks(a.pages);
  const doc: Doc = { icon: a.icon, lang: a.lang, help: a.help, footer: '', code: a.code, pages: a.pages.map((p) => ({ ...p, form: 'allein', nameField: 'aus', blocks: p.blocks })) };
  const practice = a.mode === 'uebung';

  if (!work)
    return (
      <Start
        a={a}
        onStart={(name) => {
          const w: Work = { abgabe: randomId(16), name, answers: {}, first: {}, checks: {}, marked: {}, revealed: {}, started: Date.now(), done: false };
          saveWork(a.id, w);
          setWork(w);
          send(w);
        }}
      />
    );

  const answered = (id: string) => Object.values(work.answers[id] ?? {}).some((v) => v.trim());
  const doneCount = tasks.filter((x) => answered(x.block.id)).length;
  const total = tasks.reduce(
    (acc, x) => {
      const g = gradeTask(x.block, work.answers[x.block.id]);
      return { right: acc.right + g.right, total: acc.total + g.total };
    },
    { right: 0, total: 0 },
  );

  const setAnswer = (blockId: string) => (key: string, value: string) =>
    update((w) => ({ ...w, answers: { ...w.answers, [blockId]: { ...w.answers[blockId], [key]: value } }, marked: { ...w.marked, [blockId]: false }, revealed: { ...w.revealed, [blockId]: false } }));

  const check = (blockId: string) =>
    update(
      (w) => ({
        ...w,
        first: w.first[blockId] ? w.first : { ...w.first, [blockId]: { ...w.answers[blockId] } },
        checks: { ...w.checks, [blockId]: (w.checks[blockId] ?? 0) + 1 },
        marked: { ...w.marked, [blockId]: true },
      }),
      true,
    );

  const finish = () => {
    if (!window.confirm(t.handInAsk)) return;
    update((w) => ({ ...w, done: true, marked: practice ? Object.fromEntries(tasks.map((x) => [x.block.id, true])) : w.marked }), true);
  };

  return (
    <div className="st-app" lang={a.lang}>
      <header className="st-top">
        <span className="st-top-icon">
          <Icon icon={topicIcon(a.icon)} size={18} />
        </span>
        <div className="st-top-text">
          <b>{a.title}</b>
          <span>
            {work.name} · {practice ? t.practice : t.test} · {t.progress(doneCount, tasks.length)}
          </span>
        </div>
        <span className={'st-send is-' + sendState} title={sendState === 'failed' ? t.notSent : sendState === 'sending' ? t.sending : t.saved}>
          {sendState === 'failed' ? <Icon icon={CloudOff} size={16} /> : <Icon icon={CheckCircle2} size={16} />}
          <span>{sendState === 'failed' ? t.notSent : sendState === 'sending' ? t.sending : sendState === 'saved' ? t.saved : ''}</span>
        </span>
      </header>
      <main className="st-main">
        {work.done && (
          <div className="st-done">
            <Icon icon={Lock} size={18} />
            <div>
              <b>{t.handedIn}</b>
              <p>{t.handedInText}</p>
              {practice && total.total > 0 && <p>{t.result(total.right, total.total)}</p>}
            </div>
          </div>
        )}
        <SheetDocContext.Provider value={doc}>
          {doc.pages.map((page, pi) => (
            <section key={pi} className="ws-page st-sheet" style={themeVars(themeOf(page))}>
              <div className="st-band">
                <span className="st-band-kicker">{page.kicker}</span>
                <h2 className="st-band-title">{page.title}</h2>
              </div>
              <div className="st-blocks">
                {page.blocks.map((b) => {
                  const task = tasks.find((x) => x.block.id === b.id);
                  if (!task) {
                    return (
                      <div key={b.id} className="st-block" style={{ gridColumn: `span ${b.span}` }}>
                        <BlockContent block={b} taskNum={null} editing={false} />
                      </div>
                    );
                  }
                  const slots = taskSlots(b);
                  const marked = !!work.marked[b.id];
                  const marks = marked && practice ? Object.fromEntries(slots.map((s) => [s.key, isRight(s, work.answers[b.id]?.[s.key])])) : null;
                  const g = gradeTask(b, work.answers[b.id]);
                  const graded = practice && slots.some((s) => s.kind !== 'free' && s.expected);
                  const sample = practice && slots.some((s) => s.kind === 'free') ? String(b.props.solution ?? '').trim() : '';
                  return (
                    <div key={b.id} className="st-block is-task" style={{ gridColumn: 'span 12' }}>
                      <Task
                        block={b}
                        num={task.num}
                        answers={work.answers[b.id] ?? {}}
                        onAnswer={setAnswer(b.id)}
                        marks={marks}
                        reveal={!!work.revealed[b.id] || (work.done && practice)}
                        locked={work.done}
                        lang={a.lang}
                        help={a.help}
                        t={t}
                      />
                      {practice && !work.done && (graded || sample) && (
                        <div className="st-check">
                          {graded && (
                            <button type="button" className="st-btn" onClick={() => check(b.id)} disabled={!answered(b.id)}>
                              {t.check}
                            </button>
                          )}
                          {marked && graded && <span className={'st-score' + (g.right === g.total ? ' is-all' : '')}>{t.right(g.right, g.total)}</span>}
                          {((marked && graded && g.right < g.total) || (sample && answered(b.id))) && !work.revealed[b.id] && (
                            <button type="button" className="st-link" onClick={() => update((w) => ({ ...w, revealed: { ...w.revealed, [b.id]: true } }))}>
                              {sample ? t.sample : t.showSolution}
                            </button>
                          )}
                        </div>
                      )}
                      {sample && (work.revealed[b.id] || work.done) && (
                        <div className="st-sample">
                          <b>{t.solution}:</b> {sample}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </SheetDocContext.Provider>
        {!work.done && (
          <div className="st-finish">
            <button type="button" className="st-btn is-main" onClick={finish}>
              <Icon icon={Send} size={18} />
              {t.handIn}
            </button>
            <p className="st-privacy">{t.privacy}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Start({ a, onStart }: { a: Assignment; onStart(name: string): void }) {
  const t = STUDENT_TEXT[a.lang];
  const [name, setName] = useState('');
  const [bad, setBad] = useState(false);
  const go = () => {
    const clean = cleanName(name);
    if (!clean) return setBad(true);
    onStart(clean);
  };
  const tasks = handoutTasks(a.pages).length;
  return (
    <div className="st-app st-center">
      <form
        className="st-start"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <span className="st-start-icon">
          <Icon icon={topicIcon(a.icon)} size={30} />
        </span>
        <span className="st-start-kind">
          {a.mode === 'uebung' ? t.practice : t.test} · {tasks} {tasks === 1 ? (a.lang === 'en' ? 'task' : 'Aufgabe') : a.lang === 'en' ? 'tasks' : 'Aufgaben'}
        </span>
        <h1>{a.title}</h1>
        <label className="st-name">
          <span>{t.yourName}</span>
          <input
            autoFocus
            value={name}
            placeholder={t.namePlaceholder}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => {
              setName(e.target.value);
              setBad(false);
            }}
          />
          <small className={bad ? 'is-bad' : ''}>{bad ? t.nameBad : t.nameHint}</small>
        </label>
        <button type="submit" className="st-btn is-main">
          {t.start}
        </button>
        <p className="st-privacy">{t.privacy}</p>
      </form>
    </div>
  );
}
