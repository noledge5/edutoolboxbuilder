// "Teile" on the teacher's Lernquest page: the catalogue of avatar parts for all classes (Designrunde 10.11.2026).
// The device that took over the catalogue first may change it (server: lq_admin); others only look. A part gets its
// picture from the Baukasten's image AI or a file; the background is cut out here, the picture placed on the hero.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Crown, ImagePlus, Plus, RotateCcw, Sparkles, Trash2, Upload } from 'lucide-react';
import { createPortal } from 'react-dom';
import { get, set } from 'idb-keyval';
import { Icon } from '../../icons';
import { ImageAiPane } from '../../ai/ImageAiPane';
import { kv } from '../../storage/db';
import { AvatarBild, SLOT_BOX, BUEHNE } from '../Avatar';
import { bildFreistellen, type Grund } from '../freistellen';
import { katalogAktualisieren, katalogVomGeraet, type Ablage } from '../katalog';
import { katalogRecht, katalogUebernehmen, lqText, teilSpeichern } from '../server';
import {
  BONUS_HERZ,
  BONUS_MUENZEN,
  bonusText,
  HAARE,
  HAUT,
  HERKUNFT,
  LAGE_NORMAL,
  neueId,
  SELTENHEITEN,
  SLOTS,
  teilPrompt,
  type Avatar,
  type Lage,
  type Slot,
  type Teil,
} from '../teile';

const ablage: Ablage = { get: (k) => get(k, kv()), set: (k, v) => set(k, v, kv()) };

const slotLabel = (s: Slot) => SLOTS.find((x) => x.slot === s)?.label ?? s;
const herkunftLabel = (h: Teil['herkunft']) => HERKUNFT.find((x) => x.v === h)?.label ?? h;

/** Rarity as colour and dots (never colour alone). */
export function Seltenheit({ s }: { s: number }) {
  const r = SELTENHEITEN[s] ?? SELTENHEITEN[0];
  return (
    <span className={`lqt-selten lqt-selten-${s + 1}`}>
      <span aria-hidden="true">{'●'.repeat(s + 1)}</span> {r.name}
    </span>
  );
}

interface Props {
  keys: string[];
}

export function TeileView({ keys }: Props) {
  const [katalog, setKatalog] = useState<Teil[] | null>(null);
  const [recht, setRecht] = useState<{ admin: boolean; frei: boolean } | null>(null);
  const [filter, setFilter] = useState<Slot | ''>('');
  const [edit, setEdit] = useState<Teil | null>(null);
  const [neu, setNeu] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const laden = async () => {
    const r = await katalogAktualisieren(ablage);
    setKatalog(r.teile);
    setMsg(r.fehler ? `Katalog vom Gerät: ${lqText(r.fehler)}` : '');
    try {
      setRecht(await katalogRecht(keys));
    } catch {
      setRecht({ admin: false, frei: false });
    }
  };

  useEffect(() => {
    void katalogVomGeraet(ablage).then((k) => setKatalog((have) => have ?? k));
    void laden();
    // Once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uebernehmen = async () => {
    if (!window.confirm('Den Teile-Katalog übernehmen? Danach dürfen nur deine Geräte (Mac und iPad über den Abgleich) die Teile ändern.')) return;
    setBusy(true);
    try {
      await katalogUebernehmen(keys);
      await laden();
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const admin = !!recht?.admin;
  const zeigen = (katalog ?? []).filter((t) => !filter || t.slot === filter);

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Teile</h2>
          <p className="lqt-hint">
            Die Teile für den Helden, für alle Klassen gleich. Besitz bleibt immer: Wer ein Teil hat, behält es, auch wenn du es änderst oder auf „Nicht erhältlich“ stellst.
          </p>
        </div>
        {admin && (
          <div className="lqt-actions">
            <button
              type="button"
              className="btn btn-primary ui-btn"
              onClick={() => {
                setNeu(true);
                setEdit({ id: '', slot: filter || 'kopf', name: '', seltenheit: 0, herkunft: 'keine' });
              }}
            >
              <Icon icon={Plus} />
              Neues Teil
            </button>
          </div>
        )}
      </div>
      {recht?.frei && (
        <div className="lqt-banner">
          <span>Noch niemand verwaltet den Katalog. Wer ihn übernimmt, darf als Einziger Teile ändern und neue anlegen.</span>
          <button type="button" className="btn btn-primary ui-btn" disabled={busy} onClick={() => void uebernehmen()}>
            <Icon icon={Crown} />
            Katalog übernehmen
          </button>
        </div>
      )}
      {recht && !recht.admin && !recht.frei && <p className="lqt-hint">Nur ansehen: Ändern darf das Gerät, das den Katalog übernommen hat.</p>}
      {msg && (
        <p className="lqt-error" role="alert">
          {msg}
        </p>
      )}
      <div className="seg-pills" role="radiogroup" aria-label="Platz">
        {[{ slot: '' as const, label: 'Alle' }, ...SLOTS].map((s) => (
          <button key={s.slot} type="button" role="radio" aria-checked={filter === s.slot} className={'seg-pill' + (filter === s.slot ? ' is-on' : '')} onClick={() => setFilter(s.slot)}>
            {s.label}
          </button>
        ))}
      </div>
      {katalog === null ? (
        <p className="lib-empty">Lädt …</p>
      ) : (
        <ul className="lqt-teile">
          {zeigen.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="lqt-teil"
                onClick={() => {
                  setNeu(false);
                  setEdit(t);
                }}
              >
                <span className={`lqt-teil-bild ${t.slot === 'frisur' ? 'is-haar' : ''}`}>{t.bild ? <img src={t.bild} alt="" /> : <small>kein Bild</small>}</span>
                <strong>{t.name}</strong>
                <Seltenheit s={t.seltenheit} />
                <small>
                  {slotLabel(t.slot)} · {herkunftLabel(t.herkunft)}
                </small>
                {bonusText(t) && <small className="lqt-bonus">{bonusText(t)}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {edit && katalog && (
        <TeilDialog
          teil={edit}
          neu={neu}
          katalog={katalog}
          darf={admin}
          onClose={() => setEdit(null)}
          onSave={async (payload) => {
            await teilSpeichern(keys, payload);
            setEdit(null);
            await laden();
          }}
        />
      )}
    </section>
  );
}

/** A picture being made for a part: the source as it came, the cut-out result and how it was cut. */
interface Quelle {
  blob: Blob;
  grund: Grund | 'auto';
  rand: number;
  /** Also enclosed areas (the face opening of a hairstyle). */
  innen: boolean;
}

interface DialogProps {
  teil: Teil;
  neu: boolean;
  katalog: Teil[];
  darf: boolean;
  onClose(): void;
  onSave(payload: Record<string, unknown>): Promise<void>;
}

function TeilDialog({ teil, neu, katalog, darf, onClose, onSave }: DialogProps) {
  const [t, setT] = useState<Teil>(teil);
  /** Which picture is being worked on: the main one, or the short hair under a hat. */
  const [welches, setWelches] = useState<'bild' | 'bildKurz'>('bild');
  const [quelle, setQuelle] = useState<Partial<Record<'bild' | 'bildKurz', Quelle>>>({});
  const [geaendert, setGeaendert] = useState<Partial<Record<'bild' | 'bildKurz', boolean>>>({});
  const [erkannt, setErkannt] = useState<Grund | null>(null);
  const [ki, setKi] = useState(false);
  const [was, setWas] = useState(teil.name);
  const [vorschau, setVorschau] = useState<Avatar>({ haut: 0, haar: 1 });
  const [mitHut, setMitHut] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const datei = useRef<HTMLInputElement>(null);
  const svgBox = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; lage: Lage } | null>(null);

  const q = quelle[welches];
  // Cut out again whenever the source or its settings change.
  useEffect(() => {
    if (!q) return;
    let alive = true;
    bildFreistellen(q.blob, q.grund, q.rand, q.innen)
      .then((r) => {
        if (!alive) return;
        setErkannt(r.grund);
        setT((x) => ({ ...x, [welches]: r.url }));
        setGeaendert((g) => ({ ...g, [welches]: true }));
        setErr('');
      })
      .catch((e) => alive && setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [q, welches]);

  const nehmen = (blob: Blob) => {
    setQuelle((x) => ({ ...x, [welches]: { blob, grund: 'auto', rand: 0.5, innen: t.slot === 'frisur' } }));
  };
  const setQ = (change: Partial<Quelle>) => q && setQuelle((x) => ({ ...x, [welches]: { ...q, ...change } }));

  const lage = t.lage ?? LAGE_NORMAL;
  const setLage = (l: Lage) => setT((x) => ({ ...x, lage: { x: Math.round(l.x * 10) / 10, y: Math.round(l.y * 10) / 10, s: Math.round(l.s * 100) / 100 } }));

  /** Dragging the picture on the hero moves it inside its place's box. */
  const down = (e: ReactPointerEvent) => {
    if (!darf || !t.bild || t.slot === 'hintergrund') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, lage };
  };
  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    const box = svgBox.current?.getBoundingClientRect();
    if (!d || !box) return;
    const unit = BUEHNE.w / box.width;
    const b = SLOT_BOX[t.slot];
    const clamp = (n: number) => Math.max(-50, Math.min(50, n));
    setLage({ ...d.lage, x: clamp(d.lage.x + (((e.clientX - d.x) * unit) / b.w) * 100), y: clamp(d.lage.y + (((e.clientY - d.y) * unit) / b.h) * 100) });
  };

  const hut = katalog.find((x) => x.slot === 'kopf' && x.bild);
  const zeige: Avatar = { ...vorschau, kopf: mitHut && hut && t.slot !== 'kopf' ? hut.id : '' };

  const speichern = async () => {
    const name = t.name.trim();
    if (!name) return setErr('Gib dem Teil einen Namen.');
    setBusy(true);
    setErr('');
    try {
      const payload: Record<string, unknown> = {
        id: neu ? neueId(name) : t.id,
        slot: t.slot,
        name,
        seltenheit: t.seltenheit,
        herkunft: t.herkunft,
        muenzen: t.muenzen ?? 0,
        herz: t.herz ?? 0,
        lage: t.lage && (t.lage.x || t.lage.y || t.lage.s !== 1) ? t.lage : null,
      };
      if (geaendert.bild) payload.bild = t.bild ?? null;
      if (geaendert.bildKurz && t.slot === 'frisur') payload.bildKurz = t.bildKurz ?? null;
      await onSave(payload);
    } catch (e) {
      setErr(lqText(e));
      setBusy(false);
    }
  };

  const titel = neu ? 'Neues Teil' : darf ? `${teil.name} bearbeiten` : teil.name;

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog lqt-teil-dialog" role="dialog" aria-modal="true" aria-label={titel} onClick={(e) => e.stopPropagation()}>
        {ki ? (
          <>
            <div className="dialog-title">Bild mit KI erzeugen: {slotLabel(t.slot)}{welches === 'bildKurz' ? ' (kurz, unter Hut)' : ''}</div>
            <ImageAiPane
              initial={was}
              prompt={(w) => {
                setWas(w);
                return teilPrompt(t.slot, w, welches === 'bildKurz');
              }}
              hint="Der grüne Hintergrund wird gleich durchsichtig. Danach kannst du das Teil auf dem Helden verschieben und vergrößern."
              onPick={(file) => {
                setKi(false);
                nehmen(file);
              }}
              onClose={() => setKi(false)}
            />
          </>
        ) : (
          <>
            <div className="dialog-title">{titel}</div>
            <div className="lqt-teil-edit">
              <div className="lqt-teil-buehne">
                <div ref={svgBox} className={`lqt-buehne ${darf && t.bild && t.slot !== 'hintergrund' ? 'is-drag' : ''}`} onPointerDown={down} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
                  <AvatarBild avatar={zeige} katalog={katalog} vorschau={welches === 'bildKurz' ? { ...t, bild: t.bildKurz, bildKurz: undefined } : t} rahmen={t.slot} label={`Vorschau: ${t.name || 'neues Teil'}`} />
                </div>
                {darf && t.bild && t.slot !== 'hintergrund' && (
                  <div className="lqt-lage">
                    <label>
                      Größe
                      <input type="range" min={40} max={250} value={Math.round(lage.s * 100)} onChange={(e) => setLage({ ...lage, s: Number(e.target.value) / 100 })} />
                    </label>
                    <button type="button" className="btn btn-secondary ui-btn is-small" onClick={() => setT((x) => ({ ...x, lage: undefined }))}>
                      <Icon icon={RotateCcw} />
                      Lage zurücksetzen
                    </button>
                    <span className="lqt-hint">Zum Verschieben das Teil auf dem Helden ziehen.</span>
                  </div>
                )}
                <div className="lqt-lage">
                  <span className="lqt-farben" role="radiogroup" aria-label="Hautfarbe der Vorschau">
                    {HAUT.map((c, i) => (
                      <button key={c} type="button" role="radio" aria-checked={vorschau.haut === i} aria-label={`Hautfarbe ${i + 1}`} style={{ background: c }} onClick={() => setVorschau((v) => ({ ...v, haut: i }))} />
                    ))}
                  </span>
                  <span className="lqt-farben" role="radiogroup" aria-label="Haarfarbe der Vorschau">
                    {HAARE.map((c, i) => (
                      <button key={c} type="button" role="radio" aria-checked={vorschau.haar === i} aria-label={`Haarfarbe ${i + 1}`} style={{ background: c }} onClick={() => setVorschau((v) => ({ ...v, haar: i }))} />
                    ))}
                  </span>
                  {t.slot === 'frisur' && hut && (
                    <label className="lqt-check">
                      <input type="checkbox" checked={mitHut} onChange={(e) => setMitHut(e.target.checked)} />
                      mit Hut
                    </label>
                  )}
                </div>
              </div>

              <fieldset className="lqt-teil-form" disabled={!darf || busy}>
                <div className="field">
                  <label htmlFor="lqt-t-name">Name</label>
                  <input id="lqt-t-name" className="input" value={t.name} maxLength={40} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="z. B. Roter Schal" />
                </div>
                <div className="lqt-teil-felder">
                  <div className="field">
                    <label htmlFor="lqt-t-slot">Platz</label>
                    <select id="lqt-t-slot" className="input" value={t.slot} disabled={!neu} onChange={(e) => setT({ ...t, slot: e.target.value as Slot, bildKurz: undefined })}>
                      {SLOTS.map((s) => (
                        <option key={s.slot} value={s.slot}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="lqt-t-sel">Seltenheit</label>
                    <select id="lqt-t-sel" className="input" value={t.seltenheit} onChange={(e) => setT({ ...t, seltenheit: Number(e.target.value) })}>
                      {SELTENHEITEN.map((s, i) => (
                        <option key={s.name} value={i}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="lqt-t-her">Herkunft</label>
                    <select id="lqt-t-her" className="input" value={t.herkunft} onChange={(e) => setT({ ...t, herkunft: e.target.value as Teil['herkunft'] })}>
                      {HERKUNFT.map((h) => (
                        <option key={h.v} value={h.v}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="lqt-t-m">Bonus Münzen</label>
                    <select id="lqt-t-m" className="input" value={t.muenzen ?? 0} onChange={(e) => setT({ ...t, muenzen: Number(e.target.value) })}>
                      {BONUS_MUENZEN.map((m) => (
                        <option key={m} value={m}>
                          {m ? `+${m} %` : 'keiner'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="lqt-t-h">Bonus Herzen</label>
                    <select id="lqt-t-h" className="input" value={t.herz ?? 0} onChange={(e) => setT({ ...t, herz: Number(e.target.value) })}>
                      {BONUS_HERZ.map((h) => (
                        <option key={h} value={h}>
                          {h ? `+${h}` : 'keiner'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="lqt-hint">
                  <Seltenheit s={t.seltenheit} /> · Boni zählen nur im Spiel, zusammen höchstens +20 % Münzen und +2 Herzen.
                  {teil.herkunft === 'start' && t.herkunft !== 'start' && !neu ? ' Wer es gerade trägt, behält es.' : ''}
                </p>

                {t.slot === 'frisur' && (
                  <div className="seg-pills" role="radiogroup" aria-label="Welches Bild">
                    <button type="button" role="radio" aria-checked={welches === 'bild'} className={'seg-pill' + (welches === 'bild' ? ' is-on' : '')} onClick={() => setWelches('bild')}>
                      Ganze Frisur
                    </button>
                    <button type="button" role="radio" aria-checked={welches === 'bildKurz'} className={'seg-pill' + (welches === 'bildKurz' ? ' is-on' : '')} onClick={() => setWelches('bildKurz')}>
                      Kurz (unter Hut)
                    </button>
                  </div>
                )}
                <div className="lqt-bild-zeile">
                  <button type="button" className="btn btn-secondary ui-btn" onClick={() => setKi(true)}>
                    <Icon icon={Sparkles} />
                    Mit KI erzeugen …
                  </button>
                  <button type="button" className="btn btn-secondary ui-btn" onClick={() => datei.current?.click()}>
                    <Icon icon={Upload} />
                    Datei wählen …
                  </button>
                  {t[welches] && (
                    <button
                      type="button"
                      className="btn btn-secondary ui-btn is-danger"
                      onClick={() => {
                        setQuelle((x) => ({ ...x, [welches]: undefined }));
                        setT((x) => ({ ...x, [welches]: undefined }));
                        setGeaendert((g) => ({ ...g, [welches]: true }));
                      }}
                    >
                      <Icon icon={Trash2} />
                      Bild entfernen
                    </button>
                  )}
                  <input
                    ref={datei}
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) nehmen(f);
                    }}
                  />
                </div>
                {!t[welches] && !q && (
                  <p className="lqt-hint lqt-inline">
                    <Icon icon={ImagePlus} size={13} />
                    {t.slot === 'frisur' && welches === 'bildKurz'
                      ? 'Ohne Kurzbild wird die Frisur unter einem Hut einfach abgeschnitten.'
                      : 'Ohne Bild zeigt der Held die einfache Grundform (oder nichts).'}
                  </p>
                )}
                {q && (
                  <div className="lqt-teil-felder">
                    <div className="field">
                      <label htmlFor="lqt-t-grund">Hintergrund entfernen</label>
                      <select id="lqt-t-grund" className="input" value={q.grund} onChange={(e) => setQ({ grund: e.target.value as Quelle['grund'] })}>
                        <option value="auto">Automatisch{erkannt ? ` (${erkannt === 'gruen' ? 'grün' : erkannt === 'weiss' ? 'weiß' : 'keiner'})` : ''}</option>
                        <option value="gruen">Grün</option>
                        <option value="weiss">Weiß</option>
                        <option value="keiner">Nichts entfernen</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="lqt-t-rand">Rand glätten</label>
                      <input id="lqt-t-rand" type="range" min={0} max={100} value={Math.round(q.rand * 100)} onChange={(e) => setQ({ rand: Number(e.target.value) / 100 })} />
                    </div>
                    <label className="lqt-check">
                      <input type="checkbox" checked={q.innen} onChange={(e) => setQ({ innen: e.target.checked })} />
                      auch eingeschlossene Flächen (z. B. das Gesicht in einer Frisur)
                    </label>
                  </div>
                )}
              </fieldset>
            </div>
            {err && (
              <p className="lqt-error" role="alert">
                {err}
              </p>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
                {darf ? 'Abbrechen' : 'Schließen'}
              </button>
              {darf && (
                <button type="button" className="btn btn-primary ui-btn" disabled={busy || !t.name.trim()} onClick={() => void speichern()}>
                  {busy ? 'Speichert …' : 'Speichern'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
