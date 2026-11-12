// The workbench for one figure: stage with background, zoom and helpers; a player with scrubber and keyframes;
// tabs to edit a pose (sliders → code), edit a move live (JSON → code), blend two poses, dress the figure, and
// review it. Every edit shows at once on the stage and as code Claude can paste into src/lernquest/figuren/.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ANIMATIONEN, FigurBild, ITEMS, ItemBild } from '../figuren';
import type { Animation, Figur, Item, Pose, Teil } from '../figuren';
import { mischePosen, zeitpunkte } from '../figuren/bewegung';
import { ruhig } from '../figuren/Figur';
import { P } from '../figuren/stil';
import { Chip, CodeKopieren, Gruppe, PruefFormular } from './Bausteine';
import type { Pruefung, Speicher } from './pruefung';

const alle = (teile: Teil[]): Teil[] => teile.flatMap((t) => [t, ...alle(t.kinder ?? [])]);
export const ankerVon = (f: Figur) => [...new Set(alle(f.teile).flatMap((t) => Object.keys(t.anker ?? {})))];
export const PLATZ: Record<string, string> = { hut: 'Kopf', 'hand-rechts': 'Rechte Hand', 'hand-links': 'Linke Hand', ruecken: 'Rücken' };
const FARBNAME = Object.fromEntries(Object.entries(P).map(([k, v]) => [v.toLowerCase(), k]));

const HINTERGRUENDE = [
  { id: 'wiese', name: 'Wiese' },
  { id: 'creme', name: 'Creme' },
  { id: 'nacht', name: 'Nacht' },
  { id: 'raster', name: 'Raster' },
] as const;

const r1 = (x: number) => Math.round(x * 10) / 10;

export function poseCode(id: string, p: Pose): string {
  const winkel = Object.entries(p.winkel ?? {}).filter(([, w]) => Math.abs(w) > 0.05);
  const teile = [
    `name: '${p.name}'`,
    `gesicht: '${p.gesicht}'`,
    winkel.length ? `winkel: { ${winkel.map(([k, w]) => `'${k}': ${r1(w)}`).join(', ')} }` : '',
    p.vorne?.length ? `vorne: [${p.vorne.map((v) => `'${v}'`).join(', ')}]` : '',
    p.extras?.length ? `extras: [${p.extras.map((v) => `'${v}'`).join(', ')}]` : '',
  ].filter(Boolean);
  return `${/^[a-z]+$/.test(id) ? id : `'${id}'`}: { ${teile.join(', ')} },`;
}

export function animCode(a: Animation): string {
  return `A(${JSON.stringify(a, null, 2).replace(/"([a-zA-Z]+)":/g, '$1:').replace(/"/g, "'")}),`;
}

/** The editable part of a move as JSON for the textarea. */
const animJson = (a: Animation) => JSON.stringify({ dauer: a.dauer, wiederholen: a.wiederholen, kurve: a.kurve ?? 'weich', zeiten: a.zeiten, spuren: a.spuren, gesichter: a.gesichter }, null, 1);

function ausJson(basis: Animation, text: string): Animation | string {
  try {
    const x = JSON.parse(text) as Partial<Animation>;
    if (typeof x.dauer !== 'number' || x.dauer <= 0) return '„dauer“ muss eine Zahl über 0 sein (Sekunden).';
    if (!(x.wiederholen === 'immer' || (typeof x.wiederholen === 'number' && x.wiederholen >= 1))) return '„wiederholen“ ist eine Zahl ab 1 oder "immer".';
    if (!x.spuren || typeof x.spuren !== 'object') return '„spuren“ fehlt.';
    return { ...basis, ...x, id: basis.id, name: basis.name };
  } catch (e) {
    return `Kein gültiges JSON: ${(e as Error).message}`;
  }
}

type Reiter = 'pose' | 'bewegung' | 'uebergang' | 'ausruestung' | 'pruefen';

export function Werkbank({ figur, eintraege, speicher, speichern }: { figur: Figur; eintraege: Record<string, Pruefung>; speicher: Speicher; speichern: (p: Omit<Pruefung, 'geaendert'>) => Promise<void> }) {
  const posen = Object.entries(figur.posen);
  const [poseId, setPoseId] = useState(posen[0][0]);
  const [entwurf, setEntwurf] = useState<Pose>(posen[0][1]);
  const [animId, setAnimId] = useState<string | undefined>(figur.animationen.includes('atmen') ? 'atmen' : undefined);
  const [animText, setAnimText] = useState('');
  const [reiter, setReiter] = useState<Reiter>('pose');
  const [uebergang, setUebergang] = useState<{ von: string; nach: string; dauer: number } | null>(null);
  const [hg, setHg] = useState<(typeof HINTERGRUENDE)[number]['id']>('wiese');
  const [zoom, setZoom] = useState(320);
  const [hilfen, setHilfen] = useState({ drehpunkte: false, anker: false, rahmen: false });
  const [spiegeln, setSpiegeln] = useState(false);
  const [tragen, setTragen] = useState<Record<string, string>>({});

  // Clock: runs while playing; the scrubber sets it and pauses.
  const [zeit, setZeit] = useState(0);
  const [spielt, setSpielt] = useState(true);
  const [tempo, setTempo] = useState(1);
  const [schleife, setSchleife] = useState(true);

  const basisAnim = animId ? ANIMATIONEN[animId] : undefined;
  const geparst = basisAnim && animText ? ausJson(basisAnim, animText) : basisAnim;
  const anim = typeof geparst === 'object' ? geparst : basisAnim;
  const animFehler = typeof geparst === 'string' ? geparst : '';
  const laenge = uebergang ? uebergang.dauer : anim ? anim.dauer * (anim.wiederholen === 'immer' ? 1 : anim.wiederholen) : 4;

  const endlos = !uebergang && anim?.wiederholen === 'immer';
  const zustand = useRef({ laenge, schleife, tempo, endlos });
  zustand.current = { laenge, schleife, tempo, endlos };
  useEffect(() => {
    if (!spielt) return;
    let vorher: number | null = null;
    let id = requestAnimationFrame(function schritt(ts) {
      const dt = vorher === null ? 0 : (ts - vorher) / 1000;
      vorher = ts;
      setZeit((z) => {
        const { laenge: l, schleife: s, tempo: t, endlos } = zustand.current;
        const n = z + dt * t;
        // Endless moves and loops wrap; a single run plays on (blinking goes on) past its end.
        if ((endlos || s) && n > l) return n % l;
        return n;
      });
      id = requestAnimationFrame(schritt);
    });
    return () => cancelAnimationFrame(id);
  }, [spielt]);

  const waehlePose = (id: string) => {
    setPoseId(id);
    setEntwurf(figur.posen[id]);
    setUebergang(null);
  };
  const waehleAnim = (id: string | undefined) => {
    setAnimId(id);
    setAnimText(id ? animJson(ANIMATIONEN[id]) : '');
    setUebergang(null);
    setZeit(0);
    setSpielt(true);
  };
  useEffect(() => {
    if (animId) setAnimText(animJson(ANIMATIONEN[animId]));
  }, [animId]);

  const items = Object.values(tragen)
    .map((id) => ITEMS.find((i) => i.id === id))
    .filter((i): i is Item => !!i);

  const buehnenPose: Pose = uebergang
    ? (() => {
        const k = Math.min(1, Math.max(0, zeit / uebergang.dauer));
        const hin = schleife ? (k <= 0.5 ? k * 2 : 2 - k * 2) : k;
        return mischePosen(figur.posen[uebergang.von], figur.posen[uebergang.nach], hin);
      })()
    : entwurf;
  const buehnenAnim = uebergang ? undefined : anim;

  const geaendert = JSON.stringify(entwurf) !== JSON.stringify(figur.posen[poseId]);
  const teile = alle(figur.teile);
  const plaetze = ankerVon(figur);

  // Colours on the stage, read from the drawing itself.
  const buehne = useRef<HTMLDivElement>(null);
  const [farben, setFarben] = useState<string[]>([]);
  useEffect(() => {
    const svg = buehne.current?.querySelector('svg');
    if (!svg) return;
    const f = new Set<string>();
    svg.querySelectorAll('[fill],[stroke]').forEach((el) => {
      for (const a of ['fill', 'stroke']) {
        const v = el.getAttribute(a)?.toLowerCase();
        if (v && v.startsWith('#')) f.add(v);
      }
    });
    setFarben([...f]);
  }, [figur.id, poseId, items.length]);

  const marken = anim && !uebergang ? zeitpunkte(anim, Math.max(...Object.values(anim.spuren).map((s) => Math.max(s.drehen?.length ?? 0, s.schieben?.length ?? 0, s.strecken?.length ?? 0)))) : [];

  return (
    <div className="ws-werkbank">
      <section className="ws-links" aria-label="Bühne">
        <div ref={buehne} className={`ws-buehne hg-${hg}`}>
          <FigurBild figur={figur} pose={buehnenPose} animation={buehnenAnim} zeit={zeit} items={items} breite={zoom} hilfen={hilfen} spiegeln={spiegeln} titel={`${figur.name}, ${buehnenPose.name}`} />
        </div>
        <div className="ws-spieler" role="group" aria-label="Abspielen">
          <button type="button" className="ws-rund" onClick={() => setSpielt(!spielt)} aria-label={spielt ? 'Pause' : 'Abspielen'}>
            {spielt ? (
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
                <rect x="4" y="3" width="4" height="14" rx="1.5" fill="currentColor" />
                <rect x="12" y="3" width="4" height="14" rx="1.5" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
                <path d="M5 3 L17 10 L5 17 Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="ws-rund"
            onClick={() => {
              setZeit(0);
              setSpielt(true);
            }}
            aria-label="Von vorn"
          >
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
              <path d="M4 3 V17 M17 3 L7 10 L17 17 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="ws-zeitleiste">
            <input
              id="ws-zeit"
              type="range"
              min={0}
              max={laenge}
              step={0.01}
              value={Math.min(zeit, laenge)}
              onChange={(e) => {
                setSpielt(false);
                setZeit(Number(e.target.value));
              }}
              aria-label="Zeit"
            />
            <div className="ws-marken" aria-hidden>
              {anim &&
                Array.from({ length: anim.wiederholen === 'immer' ? 1 : anim.wiederholen }).flatMap((_, lauf) =>
                  marken.map((m, i) => <span key={`${lauf}-${i}`} style={{ left: `${(((lauf + m) * anim.dauer) / laenge) * 100}%` }} />),
                )}
            </div>
          </div>
          <span className="ws-zeit">{Math.min(zeit, laenge).toFixed(2).replace('.', ',')} s</span>
          <label className="ws-wahl">
            <span className="ws-unsichtbar">Tempo</span>
            <select id="ws-tempo" value={tempo} onChange={(e) => setTempo(Number(e.target.value))}>
              {[0.1, 0.25, 0.5, 1, 2].map((t) => (
                <option key={t} value={t}>
                  {String(t).replace('.', ',')}×
                </option>
              ))}
            </select>
          </label>
          <label className="ws-schalter">
            <input id="ws-schleife" type="checkbox" checked={schleife} onChange={(e) => setSchleife(e.target.checked)} />
            Schleife
          </label>
        </div>
        {ruhig() && <p className="ws-hinweis">Dein Gerät hat „Bewegung reduzieren“ an. In der App stehen die Figuren dann still; hier in der Werkstatt laufen sie trotzdem.</p>}
        <div className="ws-buehnen-regler">
          <Gruppe titel="Hintergrund">
            {HINTERGRUENDE.map((h) => (
              <Chip key={h.id} klein an={hg === h.id} onClick={() => setHg(h.id)}>
                {h.name}
              </Chip>
            ))}
          </Gruppe>
          <Gruppe titel="Hilfen">
            <Chip klein an={hilfen.drehpunkte} onClick={() => setHilfen({ ...hilfen, drehpunkte: !hilfen.drehpunkte })}>
              <i className="ws-punkt blau" /> Drehpunkte
            </Chip>
            <Chip klein an={hilfen.anker} onClick={() => setHilfen({ ...hilfen, anker: !hilfen.anker })}>
              <i className="ws-punkt rot" /> Anker
            </Chip>
            <Chip klein an={hilfen.rahmen} onClick={() => setHilfen({ ...hilfen, rahmen: !hilfen.rahmen })}>
              Rahmen
            </Chip>
            <Chip klein an={spiegeln} onClick={() => setSpiegeln(!spiegeln)}>
              Spiegeln
            </Chip>
          </Gruppe>
          <div className="ws-gruppe">
            <label className="ws-regler-zeile" htmlFor="ws-zoom">
              <span>Größe</span>
              <input id="ws-zoom" type="range" min={120} max={460} step={10} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              <span className="ws-zahl">{zoom} px</span>
            </label>
          </div>
        </div>
      </section>

      <section className="ws-rechts" aria-label="Werkzeuge">
        <div className="ws-reiter" role="tablist" aria-label="Werkzeug">
          {(
            [
              ['pose', 'Pose'],
              ['bewegung', 'Bewegung'],
              ['uebergang', 'Übergang'],
              ['ausruestung', 'Ausrüstung'],
              ['pruefen', 'Prüfen'],
            ] as [Reiter, string][]
          ).map(([id, name]) => (
            <button key={id} type="button" role="tab" aria-selected={reiter === id} className={reiter === id ? 'an' : ''} onClick={() => setReiter(id)}>
              {name}
            </button>
          ))}
        </div>

        {reiter === 'pose' && (
          <div className="ws-tafel" role="tabpanel">
            <Gruppe titel="Pose">
              {posen.map(([id, p]) => (
                <Chip key={id} an={id === poseId && !uebergang} onClick={() => waehlePose(id)}>
                  {p.name}
                </Chip>
              ))}
            </Gruppe>
            <Gruppe titel="Gesicht">
              {figur.gesichter.map((g) => (
                <Chip key={g} klein an={entwurf.gesicht === g} onClick={() => setEntwurf({ ...entwurf, gesicht: g })}>
                  {g}
                </Chip>
              ))}
            </Gruppe>
            <div className="ws-gruppe">
              <div className="ws-gruppe-kopf">
                <h3>Winkel der Teile</h3>
                <button type="button" className="ws-chip klein" disabled={!geaendert} onClick={() => setEntwurf(figur.posen[poseId])}>
                  Zurücksetzen
                </button>
              </div>
              <div className="ws-schieber">
                {teile.map((t) => {
                  const w = entwurf.winkel?.[t.id] ?? 0;
                  const id = `ws-w-${t.id}`;
                  return (
                    <label key={t.id} className="ws-regler-zeile" htmlFor={id}>
                      <span>{t.id}</span>
                      <input id={id} type="range" min={-180} max={180} step={1} value={w} onChange={(e) => setEntwurf({ ...entwurf, winkel: { ...entwurf.winkel, [t.id]: Number(e.target.value) } })} />
                      <span className="ws-zahl">{Math.round(w)}°</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <Gruppe titel="Vorne zeichnen">
              {figur.teile.map((t) => {
                const an = !!entwurf.vorne?.includes(t.id);
                return (
                  <Chip key={t.id} klein an={an} onClick={() => setEntwurf({ ...entwurf, vorne: an ? entwurf.vorne!.filter((v) => v !== t.id) : [...(entwurf.vorne ?? []), t.id] })}>
                    {t.id}
                  </Chip>
                );
              })}
            </Gruppe>
            {figur.extras && (
              <Gruppe titel="Extras">
                {Object.keys(figur.extras).map((e) => {
                  const an = !!entwurf.extras?.includes(e);
                  return (
                    <Chip key={e} klein an={an} onClick={() => setEntwurf({ ...entwurf, extras: an ? entwurf.extras!.filter((v) => v !== e) : [...(entwurf.extras ?? []), e] })}>
                      {e}
                    </Chip>
                  );
                })}
              </Gruppe>
            )}
            <CodeKopieren code={poseCode(geaendert ? 'neuePose' : poseId, geaendert ? { ...entwurf, name: `${entwurf.name} (neu)` } : entwurf)} titel="Pose als Code" />
          </div>
        )}

        {reiter === 'bewegung' && (
          <div className="ws-tafel" role="tabpanel">
            <Gruppe titel="Bewegung" hinweis="▸ = läuft einmal oder ein paar Mal, sonst endlos.">
              {figur.animationen.map((id) => (
                <Chip key={id} an={id === animId && !uebergang} onClick={() => waehleAnim(id)}>
                  {ANIMATIONEN[id].name}
                  {ANIMATIONEN[id].wiederholen === 'immer' ? '' : ' ▸'}
                </Chip>
              ))}
              <Chip an={!animId && !uebergang} onClick={() => waehleAnim(undefined)}>
                Nur blinzeln
              </Chip>
            </Gruppe>
            {anim && (
              <>
                <Spuren anim={anim} zeit={zeit} teile={teile.map((t) => t.id)} />
                <div className="ws-gruppe">
                  <div className="ws-gruppe-kopf">
                    <h3>Bewegung bearbeiten</h3>
                    <button type="button" className="ws-chip klein" onClick={() => setAnimText(animJson(ANIMATIONEN[anim.id]))}>
                      Zurücksetzen
                    </button>
                  </div>
                  <label className="ws-hinweis" htmlFor="ws-anim-json">
                    Werte je Teil, von Anfang bis Ende (erster und letzter gleich). drehen in Grad, schieben [x, y], strecken [breit, hoch]. Änderungen laufen sofort.
                  </label>
                  <textarea id="ws-anim-json" className={animFehler ? 'fehler' : ''} value={animText} rows={12} spellCheck={false} onChange={(e) => setAnimText(e.target.value)} />
                  {animFehler && (
                    <p className="ws-fehler" role="alert">
                      {animFehler}
                    </p>
                  )}
                </div>
                <CodeKopieren code={animCode(anim)} titel="Bewegung als Code" />
              </>
            )}
          </div>
        )}

        {reiter === 'uebergang' && (
          <div className="ws-tafel" role="tabpanel">
            <p className="ws-hinweis">Zwei Posen weich ineinander überblenden, etwa von „Stehen“ zu „Jubeln“. Mit Schleife hin und zurück.</p>
            <UebergangWahl
              figur={figur}
              wert={uebergang}
              onStart={(u) => {
                setUebergang(u);
                setZeit(0);
                setSpielt(true);
              }}
              onStop={() => setUebergang(null)}
            />
          </div>
        )}

        {reiter === 'ausruestung' && (
          <div className="ws-tafel" role="tabpanel">
            <div className="ws-chips">
              <button
                type="button"
                className="ws-chip"
                onClick={() => setTragen(Object.fromEntries(plaetze.map((p) => {
                  const passend = ITEMS.filter((i) => i.platz === p);
                  return [p, passend[Math.floor(Math.random() * passend.length)]?.id ?? ''];
                })))}
              >
                Zufällig anziehen
              </button>
              <button type="button" className="ws-chip" onClick={() => setTragen({})}>
                Alles ablegen
              </button>
            </div>
            {plaetze.length === 0 && <p className="ws-hinweis">Diese Figur hat keine Anker für Teile.</p>}
            {plaetze.map((platz) => (
              <Gruppe key={platz} titel={PLATZ[platz] ?? platz}>
                <Chip klein an={!tragen[platz]} onClick={() => setTragen({ ...tragen, [platz]: '' })}>
                  Nichts
                </Chip>
                {ITEMS.filter((i) => i.platz === platz).map((i) => (
                  <Chip key={i.id} klein an={tragen[platz] === i.id} onClick={() => setTragen({ ...tragen, [platz]: i.id })}>
                    <ItemBild item={i} groesse={26} rahmen={false} zeit={0} /> {i.name}
                  </Chip>
                ))}
              </Gruppe>
            ))}
          </div>
        )}

        {reiter === 'pruefen' && (
          <div className="ws-tafel" role="tabpanel">
            <dl className="ws-steckbrief">
              <div>
                <dt>Teile</dt>
                <dd>{teile.length}</dd>
              </div>
              <div>
                <dt>Posen</dt>
                <dd>{posen.length}</dd>
              </div>
              <div>
                <dt>Gesichter</dt>
                <dd>{figur.gesichter.length}</dd>
              </div>
              <div>
                <dt>Bewegungen</dt>
                <dd>{figur.animationen.length}</dd>
              </div>
            </dl>
            <p className="ws-hinweis">Anker: {plaetze.length ? plaetze.map((p) => PLATZ[p] ?? p).join(', ') : 'keine'}</p>
            <div className="ws-gruppe">
              <h3>Farben in dieser Pose</h3>
              <ul className="ws-farben">
                {farben.map((f) => (
                  <li key={f} title={FARBNAME[f] ? `P.${FARBNAME[f]}` : 'nicht aus der Palette'}>
                    <i style={{ background: f }} />
                    <span className={FARBNAME[f] ? '' : 'ws-fremd'}>{FARBNAME[f] ?? `${f} (fremd)`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <PruefFormular art="figur" ziel={figur.id} name={figur.name} eintraege={eintraege} speicher={speicher} speichern={speichern} />
          </div>
        )}
      </section>

      <section className="ws-unten" aria-label="Probe">
        <div className="ws-gruppe">
          <h3>Größenprobe</h3>
          <div className="ws-groessen">
            {[32, 48, 96, 160].map((b) => (
              <figure key={b}>
                <FigurBild figur={figur} pose={buehnenPose} animation={buehnenAnim} zeit={zeit} items={items} breite={b} />
                <figcaption>{b} px</figcaption>
              </figure>
            ))}
            <figure className="ws-nacht-probe">
              <FigurBild figur={figur} pose={buehnenPose} animation={buehnenAnim} zeit={zeit} items={items} breite={96} />
              <figcaption>auf Nacht</figcaption>
            </figure>
          </div>
        </div>
        <div className="ws-gruppe">
          <h3>Alle Posen</h3>
          <div className="ws-reihe">
            {posen.map(([id, p]) => (
              <button key={id} type="button" className={`ws-karte${id === poseId && !uebergang ? ' an' : ''}`} aria-pressed={id === poseId} onClick={() => waehlePose(id)}>
                <FigurBild figur={figur} pose={id} zeit={zeit} items={items} breite={110} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Each track of a move as a small curve with its keyframes and the current time. */
function Spuren({ anim, zeit, teile }: { anim: Animation; zeit: number; teile: string[] }) {
  const zeilen = useMemo(
    () =>
      Object.entries(anim.spuren)
        .filter(([teil]) => teil === 'ganz' || teile.includes(teil))
        .flatMap(([teil, s]) => [
        ...(s.drehen ? [{ name: `${teil} · drehen`, werte: s.drehen }] : []),
        ...(s.schieben ? [{ name: `${teil} · schieben ↕`, werte: s.schieben.map((p) => p[1]) }, { name: `${teil} · schieben ↔`, werte: s.schieben.map((p) => p[0]) }].filter((z) => z.werte.some((v) => v !== 0)) : []),
        ...(s.strecken ? [{ name: `${teil} · strecken`, werte: s.strecken.map((p) => (p[1] - 1) * 100) }] : []),
      ]),
    [anim, teile],
  );
  const t = anim.wiederholen !== 'immer' && zeit >= anim.dauer * anim.wiederholen ? 1 : (zeit / anim.dauer) % 1;
  return (
    <div className="ws-gruppe">
      <h3>
        Spuren · {String(anim.dauer).replace('.', ',')} s × {anim.wiederholen === 'immer' ? '∞' : anim.wiederholen} · Kurve {anim.kurve ?? 'weich'}
      </h3>
      <ul className="ws-spuren">
        {zeilen.map((z) => {
          const zp = zeitpunkte(anim, z.werte.length);
          const max = Math.max(1, ...z.werte.map(Math.abs));
          const pts = z.werte.map((v, i) => [zp[i] * 200, 16 - (v / max) * 13] as const);
          return (
            <li key={z.name}>
              <span>{z.name}</span>
              <svg viewBox="-4 0 208 32" preserveAspectRatio="none" aria-hidden>
                <line x1="0" x2="200" y1="16" y2="16" className="ws-null" />
                <polyline points={pts.map((p) => p.join(',')).join(' ')} className="ws-kurve" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="2.6" className="ws-key" />
                ))}
                <line x1={t * 200} x2={t * 200} y1="0" y2="32" className="ws-jetzt" />
              </svg>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UebergangWahl({ figur, wert, onStart, onStop }: { figur: Figur; wert: { von: string; nach: string; dauer: number } | null; onStart: (u: { von: string; nach: string; dauer: number }) => void; onStop: () => void }) {
  const ids = Object.keys(figur.posen);
  const [von, setVon] = useState(wert?.von ?? ids[0]);
  const [nach, setNach] = useState(wert?.nach ?? ids[Math.min(2, ids.length - 1)]);
  const [dauer, setDauer] = useState(wert?.dauer ?? 1.2);
  return (
    <>
      <Gruppe titel="Von">
        {ids.map((id) => (
          <Chip key={id} klein an={von === id} onClick={() => setVon(id)}>
            {figur.posen[id].name}
          </Chip>
        ))}
      </Gruppe>
      <Gruppe titel="Nach">
        {ids.map((id) => (
          <Chip key={id} klein an={nach === id} onClick={() => setNach(id)}>
            {figur.posen[id].name}
          </Chip>
        ))}
      </Gruppe>
      <label className="ws-regler-zeile" htmlFor="ws-ue-dauer">
        <span>Dauer</span>
        <input id="ws-ue-dauer" type="range" min={0.3} max={3} step={0.1} value={dauer} onChange={(e) => setDauer(Number(e.target.value))} />
        <span className="ws-zahl">{dauer.toFixed(1).replace('.', ',')} s</span>
      </label>
      <div className="ws-chips">
        <button type="button" className="ws-haupt" onClick={() => onStart({ von, nach, dauer })}>
          Übergang abspielen
        </button>
        {wert && (
          <button type="button" className="ws-chip" onClick={onStop}>
            Beenden
          </button>
        )}
      </div>
    </>
  );
}
