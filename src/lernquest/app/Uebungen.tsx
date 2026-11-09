// The exercises on screen: tap, listen and tap, true/false, pairs, gap with tiles, word order, sort into groups, pick
// the picture, tap the places on a picture. Each reports its answer to the round (`onChange`), which checks it when the child taps „Prüfen“ (pairs
// and places check themselves when all are done). In English packages a speaker reads statements and words aloud.
import { useMemo, useState, type MouseEvent } from 'react';
import { richParts } from '../../model/text';
import { gemischt, gleich, punktTrifft, satz, type Antwort } from '../rules';
import type { Uebung } from '../types';
import { ton } from './ton';
import { kannVorlesen, vorlesen } from './vorlesen';

/** Text with **bold** and {{marked}}, like on the sheet. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((p, i) =>
        p.mark ? (
          <mark key={i} className={p.bold ? 'lq-b' : undefined}>
            {p.text}
          </mark>
        ) : p.bold ? (
          <b key={i}>{p.text}</b>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

interface Props {
  u: Uebung;
  /** Mixes options and tiles the same way for the same try. */
  seed: string;
  /** After „Prüfen“: nothing can change any more. */
  locked: boolean;
  onChange: (a: Antwort | null) => void;
  /** Language of the package: English statements and words get a speaker. */
  lang?: 'de' | 'en';
  /** The package's own pictures for „Bild wählen“ (key → data URL). */
  bilder?: Record<string, string>;
}

/** A speaker that reads `text` in English (nothing on devices without a voice). */
export function Vorlesen({ text, gross = false }: { text: string; gross?: boolean }) {
  if (!kannVorlesen()) return null;
  return (
    <span className={`lq-vorlesen ${gross ? 'gross' : ''}`}>
      <button type="button" className="lq-lautsprecher" aria-label="Vorlesen" onClick={() => vorlesen(text)}>
        <LautsprecherIcon />
        {gross && <span>Anhören</span>}
      </button>
      {gross && (
        <button type="button" className="lq-lautsprecher langsam" aria-label="Langsam vorlesen" onClick={() => vorlesen(text, true)}>
          langsam
        </button>
      )}
    </span>
  );
}

const LautsprecherIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);
/** A statement, with a speaker in English packages. */
function Aussage({ text, lang }: { text: string; lang?: 'de' | 'en' }) {
  return (
    <p className="lq-aussage">
      <Rich text={text} />
      {lang === 'en' && <Vorlesen text={text} />}
    </p>
  );
}

export function UebungView(props: Props) {
  const { u } = props;
  return (
    <div className="lq-uebung">
      <p className="lq-frage">
        <Rich text={u.frage} />
      </p>
      {u.art === 'waehlen' && <Waehlen {...props} u={u} />}
      {u.art === 'richtigfalsch' && <RichtigFalsch {...props} u={u} />}
      {u.art === 'paare' && <Paare {...props} u={u} />}
      {u.art === 'luecke' && <Luecke {...props} u={u} />}
      {u.art === 'reihenfolge' && <Reihenfolge {...props} u={u} />}
      {u.art === 'gruppen' && <Gruppen {...props} u={u} />}
      {u.art === 'bild' && <Bild {...props} u={u} />}
      {u.art === 'punkt' && <Punkt {...props} u={u} />}
    </div>
  );
}

type P<A extends Uebung['art']> = Omit<Props, 'u'> & {
  u: Extract<Uebung, { art: A }>;
};

function Waehlen({ u, seed, locked, onChange, lang }: P<'waehlen'>) {
  const order = useMemo(
    () =>
      gemischt(
        u.optionen.map((_, i) => i),
        seed,
      ),
    [u, seed],
  );
  const [chosen, setChosen] = useState<number[]>([]);
  const multi = u.richtig.length > 1;
  const tap = (i: number) => {
    if (locked) return;
    ton('tipp');
    const next = multi ? (chosen.includes(i) ? chosen.filter((x) => x !== i) : [...chosen, i]) : [i];
    setChosen(next);
    onChange(next.length ? { art: 'waehlen', gewaehlt: next } : null);
  };
  return (
    <>
      {u.hoeren && (kannVorlesen() && !locked ? <Vorlesen text={u.hoeren} gross /> : <Aussage text={u.hoeren} lang="en" />)}
      {u.aussage && <Aussage text={u.aussage} lang={lang} />}
      {multi && <p className="lq-hinweis">Mehrere Antworten sind richtig.</p>}
      <div className="lq-optionen">
        {order.map((i) => {
          const on = chosen.includes(i);
          const state = locked ? (u.richtig.includes(i) ? 'ok' : on ? 'nein' : '') : on ? 'an' : '';
          return (
            <button key={i} type="button" className={`lq-option ${state}`} aria-pressed={on} onClick={() => tap(i)}>
              <Rich text={u.optionen[i]} />
            </button>
          );
        })}
      </div>
    </>
  );
}

function RichtigFalsch({ u, locked, onChange, lang }: P<'richtigfalsch'>) {
  const [wert, setWert] = useState<boolean | null>(null);
  const tap = (w: boolean) => {
    if (locked) return;
    ton('tipp');
    setWert(w);
    onChange({ art: 'richtigfalsch', wert: w });
  };
  const cls = (w: boolean) => (locked ? (u.richtig === w ? 'ok' : wert === w ? 'nein' : '') : wert === w ? 'an' : '');
  return (
    <>
      <Aussage text={u.aussage} lang={lang} />
      <div className="lq-rf">
        <button type="button" className={`lq-option lq-gross ${cls(true)}`} aria-pressed={wert === true} onClick={() => tap(true)}>
          ✓ richtig
        </button>
        <button type="button" className={`lq-option lq-gross ${cls(false)}`} aria-pressed={wert === false} onClick={() => tap(false)}>
          ✗ falsch
        </button>
      </div>
    </>
  );
}

function Paare({ u, seed, locked, onChange }: P<'paare'>) {
  const left = useMemo(
    () =>
      gemischt(
        u.paare.map((_, i) => i),
        `${seed}:l`,
      ),
    [u, seed],
  );
  const right = useMemo(
    () =>
      gemischt(
        u.paare.map((_, i) => i),
        `${seed}:r`,
      ),
    [u, seed],
  );
  const [sel, setSel] = useState<{ side: 'l' | 'r'; i: number } | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<{ l: number; r: number } | null>(null);
  const [fehler, setFehler] = useState(0);
  const tap = (side: 'l' | 'r', i: number) => {
    if (locked || done.includes(i)) return;
    if (!sel || sel.side === side) {
      ton('tipp');
      setSel({ side, i });
      return;
    }
    const l = side === 'l' ? i : sel.i;
    const r = side === 'r' ? i : sel.i;
    setSel(null);
    if (l === r) {
      ton('richtig');
      const next = [...done, l];
      setDone(next);
      if (next.length === u.paare.length) onChange({ art: 'paare', fehler });
    } else {
      ton('falsch');
      setFehler(fehler + 1);
      setWrong({ l, r });
      window.setTimeout(() => setWrong(null), 600);
    }
  };
  const cls = (side: 'l' | 'r', i: number) => (done.includes(i) ? 'ok fertig' : wrong && wrong[side] === i ? 'nein wackeln' : sel?.side === side && sel.i === i ? 'an' : '');
  return (
    <>
      <p className="lq-hinweis">Tippe links, dann das passende Wort rechts.</p>
      <div className="lq-paare">
        <div>
          {left.map((i) => (
            <button key={i} type="button" className={`lq-option ${cls('l', i)}`} disabled={done.includes(i)} onClick={() => tap('l', i)}>
              <Rich text={u.paare[i][0]} />
            </button>
          ))}
        </div>
        <div>
          {right.map((i) => (
            <button key={i} type="button" className={`lq-option ${cls('r', i)}`} disabled={done.includes(i)} onClick={() => tap('r', i)}>
              <Rich text={u.paare[i][1]} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Tiles to lay: each tile once; `gelegt` holds indexes into `kacheln` (null: gap still empty). */
function useTiles(kacheln: string[], slots: number | null, locked: boolean, report: (words: string[] | null) => void) {
  const [gelegt, setGelegt] = useState<(number | null)[]>(slots === null ? [] : Array(slots).fill(null));
  const update = (next: (number | null)[]) => {
    setGelegt(next);
    const full = slots === null ? next.length === kacheln.length : next.every((x) => x !== null);
    report(full ? next.map((x) => kacheln[x!]) : null);
  };
  const put = (k: number) => {
    if (locked || gelegt.includes(k)) return;
    ton('tipp');
    if (slots === null) return update([...gelegt, k]);
    const free = gelegt.indexOf(null);
    if (free < 0) return;
    const next = [...gelegt];
    next[free] = k;
    update(next);
  };
  const take = (pos: number) => {
    if (locked || gelegt[pos] === null) return;
    ton('tipp');
    update(slots === null ? gelegt.filter((_, i) => i !== pos) : gelegt.map((x, i) => (i === pos ? null : x)));
  };
  return { gelegt, put, take };
}

function Luecke({ u, seed, locked, onChange }: P<'luecke'>) {
  const tiles = useMemo(() => gemischt(u.kacheln, seed), [u, seed]);
  const gaps = (u.teile.length - 1) / 2;
  const { gelegt, put, take } = useTiles(tiles, gaps, locked, (w) => onChange(w ? { art: 'luecke', gelegt: w } : null));
  return (
    <>
      <p className="lq-satz">
        {u.teile.map((t, i) =>
          i % 2 === 0 ? (
            <span key={i}>
              <Rich text={t} />
            </span>
          ) : (
            <button key={i} type="button" className={`lq-luecke ${gelegt[(i - 1) / 2] !== null ? 'voll' : ''} ${locked ? (gleich(tiles[gelegt[(i - 1) / 2] ?? -1] ?? '', t) ? 'ok' : 'nein') : ''}`} onClick={() => take((i - 1) / 2)}>
              {gelegt[(i - 1) / 2] !== null ? tiles[gelegt[(i - 1) / 2]!] : ' '}
            </button>
          ),
        )}
      </p>
      <div className="lq-kacheln">
        {tiles.map((t, k) => (
          <button key={k} type="button" className={`lq-kachel ${gelegt.includes(k) ? 'weg' : ''}`} disabled={gelegt.includes(k)} onClick={() => put(k)}>
            {t}
          </button>
        ))}
      </div>
    </>
  );
}

function Reihenfolge({ u, seed, locked, onChange }: P<'reihenfolge'>) {
  // The tiles come already mixed from the package; mixed again per try, so a second try looks different.
  const tiles = useMemo(() => gemischt(u.kacheln, seed), [u, seed]);
  const { gelegt, put, take } = useTiles(tiles, null, locked, (w) => onChange(w ? { art: 'reihenfolge', gelegt: w } : null));
  return (
    <>
      {u.hinweis && (
        <p className="lq-aussage">
          <Rich text={u.hinweis} />
        </p>
      )}
      <div className={`lq-zeile ${locked ? (gleich(satz(gelegt.map((k) => tiles[k!])), u.loesung) ? 'ok' : 'nein') : ''}`} aria-label="Dein Satz">
        {gelegt.map((k, pos) => (
          <button key={pos} type="button" className="lq-kachel" onClick={() => take(pos)}>
            {tiles[k!]}
          </button>
        ))}
      </div>
      <div className="lq-kacheln">
        {tiles.map((t, k) => (
          <button key={k} type="button" className={`lq-kachel ${gelegt.includes(k) ? 'weg' : ''}`} disabled={gelegt.includes(k)} onClick={() => put(k)}>
            {t}
          </button>
        ))}
      </div>
    </>
  );
}

function Gruppen({ u, seed, locked, onChange }: P<'gruppen'>) {
  // The cards come one by one in a mixed order; a placed card can be tapped to take it back.
  const order = useMemo(
    () =>
      gemischt(
        u.karten.map((_, i) => i),
        seed,
      ),
    [u, seed],
  );
  const [wo, setWo] = useState<(number | null)[]>(() => u.karten.map(() => null));
  const naechste = order.find((i) => wo[i] === null);
  const update = (next: (number | null)[]) => {
    setWo(next);
    onChange(next.every((x) => x !== null) ? { art: 'gruppen', zuordnung: next as number[] } : null);
  };
  const legen = (g: number) => {
    if (locked || naechste === undefined) return;
    ton('tipp');
    update(wo.map((x, i) => (i === naechste ? g : x)));
  };
  const zurueck = (i: number) => {
    if (locked) return;
    ton('tipp');
    update(wo.map((x, k) => (k === i ? null : x)));
  };
  return (
    <>
      {naechste !== undefined ? (
        <div className="lq-sortkarte" aria-live="polite">
          <Rich text={u.karten[naechste][0]} />
        </div>
      ) : (
        !locked && <p className="lq-hinweis">Alle Karten liegen. Tippe eine Karte an, um sie zurückzuholen.</p>
      )}
      <div className="lq-gruppen" style={{ gridTemplateColumns: `repeat(${u.gruppen.length}, minmax(0, 1fr))` }}>
        {u.gruppen.map((g, gi) => (
          <div key={gi} className="lq-gruppe">
            <button type="button" className="lq-option lq-gruppe-kopf" disabled={locked || naechste === undefined} onClick={() => legen(gi)}>
              <Rich text={g} />
            </button>
            {order
              .filter((i) => wo[i] === gi)
              .map((i) => (
                <button key={i} type="button" className={`lq-option lq-gruppe-karte ${locked ? (u.karten[i][1] === gi ? 'ok' : 'nein') : ''}`} onClick={() => zurueck(i)} disabled={locked}>
                  <Rich text={u.karten[i][0]} />
                </button>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}

function Bild({ u, seed, locked, onChange, lang, bilder = {} }: P<'bild'>) {
  const order = useMemo(
    () =>
      gemischt(
        u.bilder.map((_, i) => i),
        seed,
      ),
    [u, seed],
  );
  const [chosen, setChosen] = useState<number | null>(null);
  const tap = (i: number) => {
    if (locked) return;
    ton('tipp');
    setChosen(i);
    onChange({ art: 'bild', gewaehlt: i });
  };
  return (
    <>
      <p className="lq-aussage lq-wort">
        <Rich text={u.wort} />
        {lang === 'en' && <Vorlesen text={u.wort} />}
      </p>
      <div className="lq-bilder">
        {order.map((i, n) => {
          const b = u.bilder[i];
          const src = bilder[b];
          const state = locked ? (i === u.richtig ? 'ok' : chosen === i ? 'nein' : '') : chosen === i ? 'an' : '';
          return (
            <button key={i} type="button" className={`lq-option lq-bild ${state}`} aria-pressed={chosen === i} aria-label={`Bild ${n + 1}`} onClick={() => tap(i)}>
              {src ? <img src={src} alt="" /> : <span className="lq-emoji">{b}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Where a tap landed on the picture, in percent. */
function prozent(e: MouseEvent<HTMLElement>): { x: number; y: number } {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: (100 * (e.clientX - r.left)) / Math.max(1, r.width), y: (100 * (e.clientY - r.top)) / Math.max(1, r.height) };
}

function Punkt({ u, seed, locked, onChange, bilder = {} }: P<'punkt'>) {
  // The places are asked one by one in a mixed order; each tap is judged at once, a miss shows the right place.
  const order = useMemo(
    () =>
      gemischt(
        u.punkte.map((_, i) => i),
        seed,
      ),
    [u, seed],
  );
  const [getippt, setGetippt] = useState<{ ziel: number; x: number; y: number }[]>([]);
  const ziel = order[getippt.length];
  const tap = (e: MouseEvent<HTMLElement>) => {
    if (locked || ziel === undefined) return;
    const { x, y } = prozent(e);
    const next = [...getippt, { ziel, x, y }];
    ton(punktTrifft(u.punkte, ziel, x, y) ? 'richtig' : 'falsch');
    setGetippt(next);
    if (next.length === u.punkte.length) onChange({ art: 'punkt', getippt: next });
  };
  const src = bilder[u.bild];
  return (
    <>
      <p className="lq-aussage lq-wort" aria-live="polite">
        {ziel !== undefined ? (
          <>
            Tippe auf: <b>{u.punkte[ziel][2]}</b>
          </>
        ) : (
          'Fertig!'
        )}
      </p>
      {u.punkte.length > 1 && (
        <p className="lq-hinweis">
          {Math.min(getippt.length + 1, u.punkte.length)} von {u.punkte.length}
        </p>
      )}
      <div className="lq-karte-bild">
        <div className="lq-karte-flaeche" onClick={tap} role="button" tabIndex={-1} aria-label={ziel !== undefined ? `Bild: tippe auf ${u.punkte[ziel][2]}` : 'Bild'}>
          {src && <img src={src} alt="" draggable={false} />}
          {getippt.map((t, i) => {
            const ok = punktTrifft(u.punkte, t.ziel, t.x, t.y);
            const [px, py, name] = u.punkte[t.ziel];
            return (
              <span key={i}>
                <span className={`lq-marke ${ok ? 'ok' : 'nein'}`} style={{ left: `${t.x}%`, top: `${t.y}%` }} aria-hidden />
                {!ok && <span className="lq-marke ok ziel" style={{ left: `${px}%`, top: `${py}%` }} aria-hidden />}
                <span className="lq-marke-name" style={{ left: `${ok ? t.x : px}%`, top: `${ok ? t.y : py}%` }}>
                  {name}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
