// The figure workshop: every figure in every pose and move, with items on its anchors, at several sizes. Not part of
// the children's app: it runs in `npm run spieltest` (…/lernquest/werkstatt.html) and as an artifact for the teacher
// (`npm run werkstatt`). Views by hash: #<figur-id> or #bogen (everything on one sheet, for screenshots).
import { useEffect, useState } from 'react';
import { ANIMATIONEN, FIGUREN, FigurBild, ITEMS, ItemBild } from '../figuren';
import type { Figur, Item, Teil } from '../figuren';
import { SELTENHEITEN } from '../teile';

function anker(teile: Teil[]): string[] {
  return teile.flatMap((t) => [...Object.keys(t.anker ?? {}), ...anker(t.kinder ?? [])]);
}

const ruhig = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ART = { begleiter: 'Begleiter', held: 'Held', boss: 'Boss' } as const;
const PLATZ: Record<string, string> = { hut: 'Kopf', 'hand-rechts': 'Rechte Hand', 'hand-links': 'Linke Hand' };

function useHash() {
  const [h, setH] = useState(() => location.hash.slice(1));
  useEffect(() => {
    const f = () => setH(location.hash.slice(1));
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return h;
}

export function Werkstatt() {
  const hash = useHash();
  if (hash === 'bogen') return <Bogen />;
  const figur = FIGUREN.find((f) => f.id === hash) ?? FIGUREN[0];
  return (
    <div className="ws">
      <header className="ws-kopf">
        <div>
          <p className="ws-marke">Lernquest · Figuren-Werkstatt</p>
          <h1>{figur.name}</h1>
        </div>
        <nav className="ws-figuren" aria-label="Figur wählen">
          {FIGUREN.map((f) => (
            <a key={f.id} href={`#${f.id}`} className={f.id === figur.id ? 'an' : ''} aria-current={f.id === figur.id ? 'page' : undefined}>
              <FigurBild figur={f} breite={36} />
              <span>
                {f.name}
                <small>{ART[f.art]}</small>
              </span>
            </a>
          ))}
          <a href="#bogen">
            <span>
              Alles auf einen Blick
              <small>Bogen</small>
            </span>
          </a>
        </nav>
      </header>
      <FigurPult key={figur.id} figur={figur} />
      <ItemListe />
    </div>
  );
}

function FigurPult({ figur }: { figur: Figur }) {
  const posen = Object.entries(figur.posen);
  const [pose, setPose] = useState(posen[0][0]);
  const [anim, setAnim] = useState<string | undefined>(figur.animationen.includes('atmen') ? 'atmen' : undefined);
  const [lauf, setLauf] = useState(0);
  const [hilfen, setHilfen] = useState(false);
  const plaetze = [...new Set(anker(figur.teile))];
  const [tragen, setTragen] = useState<Record<string, string>>({});
  const items = Object.values(tragen)
    .map((id) => ITEMS.find((i) => i.id === id))
    .filter((i): i is Item => !!i);
  const spielen = (id: string) => {
    setAnim(id);
    setLauf((n) => n + 1);
  };
  const bild = (breite: number) => <FigurBild key={`${anim}-${lauf}`} figur={figur} pose={pose} animation={anim} items={items} breite={breite} hilfen={hilfen && breite > 200} />;

  return (
    <section className="ws-pult" aria-label="Figur einstellen">
      <div className="ws-buehne">
        {bild(300)}
        <label className="ws-schalter">
          <input id="ws-hilfen" type="checkbox" checked={hilfen} onChange={(e) => setHilfen(e.target.checked)} />
          Drehpunkte und Anker zeigen
        </label>
      </div>
      <div className="ws-regler">
        <Gruppe titel="Pose">
          {posen.map(([id, p]) => (
            <button key={id} type="button" className={id === pose ? 'an' : ''} aria-pressed={id === pose} onClick={() => setPose(id)}>
              {p.name}
            </button>
          ))}
        </Gruppe>
        <Gruppe titel="Bewegung" hinweis={ruhig() ? 'Dein Gerät hat „Bewegung reduzieren“ an, darum stehen die Figuren still.' : undefined}>
          {figur.animationen.map((id) => (
            <button key={id} type="button" className={id === anim ? 'an' : ''} aria-pressed={id === anim} onClick={() => spielen(id)}>
              {ANIMATIONEN[id].name}
              {ANIMATIONEN[id].wiederholen === 'immer' ? '' : ' ▸'}
            </button>
          ))}
          <button type="button" className={!anim ? 'an' : ''} aria-pressed={!anim} onClick={() => setAnim(undefined)}>
            Still
          </button>
        </Gruppe>
        {plaetze.map((platz) => (
          <Gruppe key={platz} titel={PLATZ[platz] ?? platz}>
            <button type="button" className={!tragen[platz] ? 'an' : ''} aria-pressed={!tragen[platz]} onClick={() => setTragen({ ...tragen, [platz]: '' })}>
              Nichts
            </button>
            {ITEMS.filter((i) => i.platz === platz).map((i) => (
              <button key={i.id} type="button" className={`ws-mit-bild${tragen[platz] === i.id ? ' an' : ''}`} aria-pressed={tragen[platz] === i.id} onClick={() => setTragen({ ...tragen, [platz]: i.id })}>
                <ItemBild item={i} groesse={28} rahmen={false} />
                {i.name}
              </button>
            ))}
          </Gruppe>
        ))}
        <div className="ws-gruppe">
          <h2>Größen</h2>
          <div className="ws-groessen">
            {[48, 96, 160].map((b) => (
              <figure key={b}>
                {bild(b)}
                <figcaption>{b} px</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <div className="ws-posen">
        <h2>Alle Posen</h2>
        <div className="ws-reihe">
          {posen.map(([id, p]) => (
            <button key={id} type="button" className={id === pose ? 'an' : ''} aria-pressed={id === pose} onClick={() => setPose(id)}>
              <FigurBild figur={figur} pose={id} items={items} breite={110} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gruppe({ titel, hinweis, children }: { titel: string; hinweis?: string; children: React.ReactNode }) {
  return (
    <div className="ws-gruppe">
      <h2>{titel}</h2>
      <div className="ws-chips">{children}</div>
      {hinweis && <p className="ws-hinweis">{hinweis}</p>}
    </div>
  );
}

function ItemListe() {
  return (
    <section className="ws-items" aria-labelledby="ws-items-titel">
      <h2 id="ws-items-titel">Teile zum Anziehen und Halten</h2>
      <ul>
        {ITEMS.map((i) => (
          <li key={i.id}>
            <ItemBild item={i} groesse={72} />
            <span className="ws-item-name">{i.name}</span>
            <span className="ws-item-info">
              <span className={`ws-selten s${i.seltenheit}`}>{'●'.repeat(i.seltenheit)}</span> {SELTENHEITEN[i.seltenheit - 1].name} · {PLATZ[i.platz] ?? i.platz}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Everything on one sheet: each figure in each pose, then all items. For screenshots and a quick check. */
function Bogen() {
  return (
    <div className="ws ws-bogen">
      <header className="ws-kopf">
        <div>
          <p className="ws-marke">Lernquest · Figuren-Werkstatt</p>
          <h1>Alles auf einen Blick</h1>
        </div>
        <nav className="ws-figuren" aria-label="Figur wählen">
          {FIGUREN.map((f) => (
            <a key={f.id} href={`#${f.id}`}>
              <span>{f.name}</span>
            </a>
          ))}
        </nav>
      </header>
      {FIGUREN.map((f) => (
        <section key={f.id} className="ws-posen">
          <h2>
            {f.name} <small>{ART[f.art]}</small>
          </h2>
          <div className="ws-reihe">
            {Object.entries(f.posen).map(([id, p]) => (
              <figure key={id}>
                <FigurBild figur={f} pose={id} breite={140} />
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <ItemListe />
    </div>
  );
}
