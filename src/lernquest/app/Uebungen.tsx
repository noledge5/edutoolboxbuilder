// The exercises on screen: tap, true/false, pairs, gap with tiles, word order. Each reports its answer to the round
// (`onChange`), which checks it when the child taps „Prüfen“ (pairs check themselves when all are found).
import { useMemo, useState } from 'react';
import { richParts } from '../../model/text';
import { gemischt, type Antwort } from '../rules';
import type { Uebung } from '../types';
import { ton } from './ton';

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
    </div>
  );
}

type P<A extends Uebung['art']> = Omit<Props, 'u'> & { u: Extract<Uebung, { art: A }> };

function Waehlen({ u, seed, locked, onChange }: P<'waehlen'>) {
  const order = useMemo(() => gemischt(u.optionen.map((_, i) => i), seed), [u, seed]);
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
      {u.aussage && (
        <p className="lq-aussage">
          <Rich text={u.aussage} />
        </p>
      )}
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

function RichtigFalsch({ u, locked, onChange }: P<'richtigfalsch'>) {
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
      <p className="lq-aussage">
        <Rich text={u.aussage} />
      </p>
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
  const left = useMemo(() => gemischt(u.paare.map((_, i) => i), `${seed}:l`), [u, seed]);
  const right = useMemo(() => gemischt(u.paare.map((_, i) => i), `${seed}:r`), [u, seed]);
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
  const cls = (side: 'l' | 'r', i: number) =>
    done.includes(i) ? 'ok fertig' : wrong && wrong[side] === i ? 'nein wackeln' : sel?.side === side && sel.i === i ? 'an' : '';
  return (
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
            <button key={i} type="button" className={`lq-luecke ${gelegt[(i - 1) / 2] !== null ? 'voll' : ''}`} onClick={() => take((i - 1) / 2)}>
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
      <div className="lq-zeile" aria-label="Dein Satz">
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
