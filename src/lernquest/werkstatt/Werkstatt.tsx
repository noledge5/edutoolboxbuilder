// The figure workshop: Claude's workbench for drawing, posing and animating figures, items and bosses, and the
// teacher's place to review them. Not part of the children's app: it runs in `npm run spieltest`
// (…/lernquest/werkstatt.html) and as an artifact (`npm run werkstatt`). Views by hash: #<figur-id>, #teile,
// #bogen (everything at once, also for screenshots), #vorlage (the teacher's mockup).
import { useEffect, useState } from 'react';
import { FIGUREN, FigurBild, ITEMS, ItemBild } from '../figuren';
import type { Item } from '../figuren';
import { SELTENHEITEN } from '../teile';
import { Chip, Gruppe, PruefFormular, StatusMarke } from './Bausteine';
import { pruefId, usePruefungen } from './pruefung';
import type { Pruefung, Speicher } from './pruefung';
import { PLATZ, Werkbank, ankerVon } from './Werkbank';
import vorlage from './vorlage.jpg';

const ART = { begleiter: 'Begleiter', held: 'Held', boss: 'Boss' } as const;

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
  const pruef = usePruefungen();
  const figur = FIGUREN.find((f) => f.id === hash);
  const ansicht = figur ? 'figur' : hash === 'teile' || hash === 'bogen' || hash === 'vorlage' ? hash : 'figur';
  const aktiv = figur ?? (ansicht === 'figur' ? FIGUREN[0] : undefined);
  const werte = Object.values(pruef.eintraege);
  const zahl = (s: Pruefung['status']) => werte.filter((p) => p.status === s).length;

  return (
    <div className="ws">
      <header className="ws-kopf">
        <div className="ws-titel">
          <p className="ws-marke">Lernquest · Figuren-Werkstatt</p>
          <h1>{aktiv ? aktiv.name : ansicht === 'teile' ? 'Teile' : ansicht === 'bogen' ? 'Alles auf einen Blick' : 'Vorlage'}</h1>
          {pruef.speicher.zustand === 'bereit' && werte.length > 0 && (
            <p className="ws-stand">
              Geprüft: {zahl('passt')} passt · {zahl('aendern')} ändern
            </p>
          )}
        </div>
        <nav className="ws-nav" aria-label="Bereich">
          {FIGUREN.map((f) => (
            <a key={f.id} href={`#${f.id}`} className={aktiv?.id === f.id ? 'an' : ''} aria-current={aktiv?.id === f.id ? 'page' : undefined}>
              <FigurBild figur={f} breite={34} lebendig={false} />
              <span>
                {f.name}
                <small>
                  {ART[f.art]} · <StatusMarke p={pruef.eintraege[pruefId('figur', f.id)]} />
                </small>
              </span>
            </a>
          ))}
          <a href="#teile" className={ansicht === 'teile' ? 'an' : ''} aria-current={ansicht === 'teile' ? 'page' : undefined}>
            <ItemBild item={ITEMS.find((i) => i.id === 'krone')!} groesse={34} rahmen={false} zeit={0} />
            <span>
              Teile
              <small>{ITEMS.length} Stück</small>
            </span>
          </a>
          <a href="#bogen" className={ansicht === 'bogen' ? 'an' : ''} aria-current={ansicht === 'bogen' ? 'page' : undefined}>
            <span>
              Übersicht
              <small>alles + Prüfliste</small>
            </span>
          </a>
          <a href="#vorlage" className={ansicht === 'vorlage' ? 'an' : ''} aria-current={ansicht === 'vorlage' ? 'page' : undefined}>
            <span>
              Vorlage
              <small>dein Mockup</small>
            </span>
          </a>
        </nav>
      </header>
      {aktiv && <Werkbank key={aktiv.id} figur={aktiv} {...pruef} />}
      {ansicht === 'teile' && <TeileAnsicht {...pruef} />}
      {ansicht === 'bogen' && <Bogen eintraege={pruef.eintraege} />}
      {ansicht === 'vorlage' && (
        <section className="ws-vorlage">
          <p>Das Mockup, nach dem Lernquest gestaltet wird: Grün und Creme, runde Formen, dicke dunkle Umrisse, Licht von oben links. Figuren und Teile hier sollen so aussehen, als kämen sie aus diesem Bild.</p>
          <img src={vorlage} alt="Mockup der Lehrkraft: Startseite, Quiz, Karte, Avatar, Inventar, Aufgaben, Laden und Truhe im Grün-Creme-Look mit einem Fuchs" />
        </section>
      )}
    </div>
  );
}

function TeileAnsicht({ eintraege, speicher, speichern }: { eintraege: Record<string, Pruefung>; speicher: Speicher; speichern: (p: Omit<Pruefung, 'geaendert'>) => Promise<void> }) {
  const [platz, setPlatz] = useState('');
  const [selten, setSelten] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<Item>(ITEMS[0]);
  const plaetze = [...new Set(ITEMS.map((i) => i.platz))];
  const liste = ITEMS.filter((i) => (!platz || i.platz === platz) && (!selten || i.seltenheit === selten));
  const traeger = FIGUREN.filter((f) => ankerVon(f).includes(gewaehlt.platz));
  return (
    <div className="ws-teile">
      <section className="ws-teile-liste" aria-label="Alle Teile">
        <div className="ws-filter">
          <Gruppe titel="Platz">
            <Chip klein an={!platz} onClick={() => setPlatz('')}>
              Alle
            </Chip>
            {plaetze.map((p) => (
              <Chip key={p} klein an={platz === p} onClick={() => setPlatz(p)}>
                {PLATZ[p] ?? p}
              </Chip>
            ))}
          </Gruppe>
          <Gruppe titel="Seltenheit">
            <Chip klein an={!selten} onClick={() => setSelten(0)}>
              Alle
            </Chip>
            {SELTENHEITEN.map((s, i) => (
              <Chip key={s.name} klein an={selten === i + 1} onClick={() => setSelten(i + 1)}>
                <span className={`ws-selten s${i + 1}`}>{'●'.repeat(i + 1)}</span> {s.name}
              </Chip>
            ))}
          </Gruppe>
        </div>
        {liste.length === 0 && <p className="ws-hinweis">Keine Teile mit diesem Filter.</p>}
        <ul className="ws-item-gitter">
          {liste.map((i) => (
            <li key={i.id}>
              <button type="button" className={`ws-karte${gewaehlt.id === i.id ? ' an' : ''}`} aria-pressed={gewaehlt.id === i.id} onClick={() => setGewaehlt(i)}>
                <ItemBild item={i} groesse={76} />
                <span className="ws-item-name">{i.name}</span>
                <span className="ws-item-info">
                  <span className={`ws-selten s${i.seltenheit}`}>{'●'.repeat(i.seltenheit)}</span> {PLATZ[i.platz] ?? i.platz}
                </span>
                <StatusMarke p={eintraege[pruefId('item', i.id)]} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="ws-teil-detail" aria-label={gewaehlt.name}>
        <div className="ws-teil-gross">
          <ItemBild item={gewaehlt} groesse={190} />
          <div>
            <h2>{gewaehlt.name}</h2>
            <p className="ws-item-info">
              <span className={`ws-selten s${gewaehlt.seltenheit}`}>{'●'.repeat(gewaehlt.seltenheit)}</span> {SELTENHEITEN[gewaehlt.seltenheit - 1].name} · {PLATZ[gewaehlt.platz] ?? gewaehlt.platz}
              {gewaehlt.bewegt ? ' · bewegt sich' : ''}
            </p>
            <p className="ws-hinweis">Größen: </p>
            <div className="ws-groessen">
              {[24, 40, 64].map((g) => (
                <ItemBild key={g} item={gewaehlt} groesse={g} />
              ))}
            </div>
          </div>
        </div>
        <div className="ws-gruppe">
          <h3>So sieht es angezogen aus</h3>
          <div className="ws-reihe">
            {traeger.flatMap((f) =>
              Object.keys(f.posen)
                .slice(0, 3)
                .map((p) => (
                  <figure key={`${f.id}-${p}`} className="ws-karte">
                    <FigurBild figur={f} pose={p} items={[gewaehlt]} breite={120} />
                    <figcaption>
                      {f.name} · {f.posen[p].name}
                    </figcaption>
                  </figure>
                )),
            )}
          </div>
        </div>
        <PruefFormular art="item" ziel={gewaehlt.id} name={gewaehlt.name} eintraege={eintraege} speicher={speicher} speichern={speichern} />
      </section>
    </div>
  );
}

/** Everything at once: each figure in each pose, all items, and the review list. */
function Bogen({ eintraege }: { eintraege: Record<string, Pruefung> }) {
  const liste = Object.values(eintraege).sort((a, b) => b.geaendert.localeCompare(a.geaendert));
  return (
    <div className="ws-bogen">
      {FIGUREN.map((f) => (
        <section key={f.id} className="ws-gruppe">
          <h3>
            <a href={`#${f.id}`}>{f.name}</a> · {ART[f.art]} · {Object.keys(f.posen).length} Posen
          </h3>
          <div className="ws-reihe">
            {Object.entries(f.posen).map(([id, p]) => (
              <figure key={id} className="ws-karte">
                <FigurBild figur={f} pose={id} breite={130} lebendig={false} zeit={0} />
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section className="ws-gruppe">
        <h3>
          <a href="#teile">Teile</a> · {ITEMS.length}
        </h3>
        <div className="ws-reihe">
          {ITEMS.map((i) => (
            <figure key={i.id} className="ws-karte">
              <ItemBild item={i} groesse={72} zeit={0} />
              <figcaption>{i.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="ws-gruppe">
        <h3>Prüfliste</h3>
        {liste.length === 0 ? (
          <p className="ws-hinweis">Noch nichts geprüft. Unter „Prüfen“ bei jeder Figur und bei jedem Teil kannst du „Passt“ oder „Bitte ändern“ mit einer Notiz speichern.</p>
        ) : (
          <div className="ws-tabelle">
            <table>
              <thead>
                <tr>
                  <th scope="col">Was</th>
                  <th scope="col">Urteil</th>
                  <th scope="col">Notiz</th>
                  <th scope="col">Wann</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((p) => (
                  <tr key={pruefId(p.art, p.ziel)}>
                    <td>
                      {p.name} <small>({p.art === 'figur' ? 'Figur' : p.art === 'item' ? 'Teil' : 'Bewegung'})</small>
                    </td>
                    <td>
                      <StatusMarke p={p} />
                    </td>
                    <td>{p.notiz || '–'}</td>
                    <td>{new Date(p.geaendert).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
