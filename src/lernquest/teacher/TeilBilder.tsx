// „Bilder der Teile“ on the teacher page, only for the admin teacher (lq_admin): upload a painted picture for a part,
// see it on the hero and as a tile, then „Übernehmen“. The pictures count for every class of every teacher and go
// before the built-in ones; after „Löschen“ the built-in picture or the drawing shows again. The picture is made into
// the part's layer in the browser (bildVerarbeiten.ts, the same steps as `npm run lq:bilder`).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ImagePlus, RotateCcw, Trash2, X } from 'lucide-react';
import { Icon } from '../../icons';
import { AvatarBild, TeilBild } from '../app/avatar';
import { HochgeladeneBilder } from '../app/bilderKontext';
import { useHochgeladen } from '../app/hochgeladen';
import { TEIL_BILDER } from '../app/teilBilder';
import ANPASSEN from '../bilder/anpassen.json';
import type { Einstellung } from '../bilder/ebene';
import { bildLoeschen, bildSetzen, lqText } from '../server';
import { SLOTS, TEILE, type Avatar, type Teil } from '../teile';
import { alsBase64, ebeneMachen, kodieren, oeffnen, WEGE, type Quelle, type Weg } from './bildVerarbeiten';

const WEG_TEXT: Record<Weg, string> = {
  einzeln: 'Einzeln gemalt (auf Grau)',
  edit: 'Edit der Grundfigur',
  flaeche: 'Ganzes Bild',
};

interface Regler {
  key: keyof Einstellung;
  label: string;
  min: number;
  max: number;
  step: number;
  standard: number;
}
const REGLER: Record<Weg, Regler[]> = {
  einzeln: [
    { key: 's', label: 'Größe', min: 0.3, max: 3, step: 0.01, standard: 1 },
    { key: 'dx', label: 'Links / rechts', min: -60, max: 60, step: 1, standard: 0 },
    { key: 'dy', label: 'Hoch / runter', min: -80, max: 80, step: 1, standard: 0 },
    { key: 'toleranz', label: 'Freistellen (wie grau noch Hintergrund ist)', min: 10, max: 120, step: 1, standard: 36 },
  ],
  edit: [{ key: 'schwelle', label: 'Empfindlichkeit (größer = nur deutliche Änderungen)', min: 10, max: 90, step: 1, standard: 30 }],
  flaeche: [],
};

const startWerte = (id: string): Einstellung => ({ ...((ANPASSEN as Record<string, Einstellung>)[id] ?? {}) });

/** Where the picture of a part comes from now. */
const herkunft = (id: string, hoch: Record<string, string>) =>
  hoch[id] ? 'Hochgeladen' : TEIL_BILDER[id] ? 'Eingebaut' : 'Zeichnung';

export default function TeilBilder({ keys, onClose }: { keys: string[]; onClose(): void }) {
  const [stand, setStand] = useState(0);
  const hoch = useHochgeladen(stand);
  const [wahl, setWahl] = useState<Teil | null>(null);
  return (
    <div className="app lqt-app">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Bilder der Teile</div>
          <div className="topbar-place">Gilt für alle Klassen aller Lehrkräfte</div>
        </div>
      </header>
      <main className="lqt-main">
        <HochgeladeneBilder.Provider value={hoch}>
          {wahl && (
            <Bearbeiten
              key={wahl.id}
              teil={wahl}
              keys={keys}
              hochgeladen={!!hoch[wahl.id]}
              onFertig={() => setStand((s) => s + 1)}
              onClose={() => setWahl(null)}
            />
          )}
          <p className="lqt-note">
            Teil antippen, Bild aus ComfyUI wählen (der Dateiname ist egal), Vorschau prüfen, „Übernehmen“. Die Kinder sehen
            es beim nächsten Öffnen von Lernquest. Frisuren, Münder, Hauttöne und die Grundfigur gehen weiter über
            <code> npm run lq:bilder</code>.
          </p>
          {SLOTS.map(({ slot, label }) => (
            <section key={slot} className="lqt-card">
              <h2>{label}</h2>
              <div className="lqt-bilder">
                {TEILE.filter((t) => t.slot === slot).map((t) => (
                  <button key={t.id} type="button" className={`lqt-bild ${wahl?.id === t.id ? 'is-on' : ''}`} onClick={() => setWahl(t)}>
                    <TeilBild teil={t} className="lqt-bild-kachel" />
                    <span>{t.name}</span>
                    <small className={`lqt-bild-herkunft is-${herkunft(t.id, hoch).toLowerCase()}`}>{herkunft(t.id, hoch)}</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </HochgeladeneBilder.Provider>
      </main>
    </div>
  );
}

function Bearbeiten({
  teil,
  keys,
  hochgeladen,
  onFertig,
  onClose,
}: {
  teil: Teil;
  keys: string[];
  hochgeladen: boolean;
  onFertig(): void;
  onClose(): void;
}) {
  const wege = WEGE[teil.slot];
  const [quelle, setQuelle] = useState<Quelle | null>(null);
  const [weg, setWeg] = useState<Weg>(wege[0]);
  const [werte, setWerte] = useState<Einstellung>(() => startWerte(teil.id));
  const [vorschau, setVorschau] = useState<{ blob: Blob; url: string } | null>(null);
  const [arbeitet, setArbeitet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [fehler, setFehler] = useState('');
  const datei = useRef<HTMLInputElement>(null);
  const oben = useRef<HTMLElement>(null);

  // Braces: newer browsers return a promise from scrollIntoView, which must not become the effect's cleanup.
  useEffect(() => {
    void oben.current?.scrollIntoView({ block: 'start' });
  }, []);

  // Make the layer again when the picture, the way or a slider changes (a moment after the last change).
  useEffect(() => {
    if (!quelle) return;
    let aus = false;
    setArbeitet(true);
    const t = setTimeout(() => {
      ebeneMachen(quelle, teil.slot, weg, werte)
        .then((e) => kodieren(e, teil.slot))
        .then((blob) => {
          if (aus) return;
          setVorschau({ blob, url: URL.createObjectURL(blob) });
          setFehler('');
        })
        .catch((e: Error) => !aus && setFehler(e.message))
        .finally(() => !aus && setArbeitet(false));
    }, 150);
    return () => {
      aus = true;
      clearTimeout(t);
    };
  }, [quelle, weg, werte, teil.slot]);

  // The previous preview is freed when a new one comes (and on closing).
  useEffect(
    () => () => {
      if (vorschau) URL.revokeObjectURL(vorschau.url);
    },
    [vorschau],
  );

  const waehlen = async (f: File | undefined) => {
    if (!f) return;
    setMsg('');
    setFehler('');
    try {
      setQuelle(await oeffnen(f));
    } catch (e) {
      setFehler((e as Error).message);
    }
  };

  const uebernehmen = async () => {
    if (!vorschau) return;
    setBusy(true);
    try {
      await bildSetzen(keys, teil.id, vorschau.blob.type, await alsBase64(vorschau.blob));
      setMsg('Übernommen. Die Kinder sehen das Bild beim nächsten Öffnen von Lernquest.');
      setQuelle(null);
      setVorschau(null);
      onFertig();
    } catch (e) {
      setFehler(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const loeschen = async () => {
    if (!window.confirm(`Das hochgeladene Bild von „${teil.name}“ löschen? Danach gilt wieder das eingebaute Bild bzw. die Zeichnung.`)) return;
    setBusy(true);
    try {
      await bildLoeschen(keys, teil.id);
      setMsg('Gelöscht.');
      onFertig();
    } catch (e) {
      setFehler(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const avatar: Avatar = useMemo(() => ({ [teil.slot]: teil.id }), [teil]);
  const regler = REGLER[weg];

  return (
    <section ref={oben} className="lqt-card lqt-bild-edit" aria-label={`Bild für ${teil.name}`}>
      <div className="lqt-head">
        <div>
          <h2>{teil.name}</h2>
          <p className="lqt-hint">
            {SLOTS.find((s) => s.slot === teil.slot)?.label} · {hochgeladen ? 'hat ein hochgeladenes Bild' : TEIL_BILDER[teil.id] ? 'eingebautes Bild' : 'noch als Zeichnung'}
          </p>
        </div>
        <button type="button" className="iconbtn" onClick={onClose} title="Schließen" aria-label="Schließen">
          <Icon icon={X} size={18} />
        </button>
      </div>
      <div className="lqt-bild-zeile">
        <input ref={datei} type="file" accept="image/png,image/webp,image/jpeg" hidden onChange={(e) => void waehlen(e.target.files?.[0]).finally(() => (e.target.value = ''))} />
        <button type="button" className="btn btn-primary ui-btn" disabled={busy} onClick={() => datei.current?.click()}>
          <Icon icon={ImagePlus} />
          {quelle ? 'Anderes Bild wählen' : 'Bild wählen'}
        </button>
        {hochgeladen && (
          <button type="button" className="btn btn-secondary ui-btn is-danger" disabled={busy} onClick={() => void loeschen()}>
            <Icon icon={Trash2} />
            Hochgeladenes Bild löschen
          </button>
        )}
      </div>
      {msg && (
        <p className="lqt-hint" role="status">
          {msg}
        </p>
      )}
      {fehler && (
        <p className="lqt-error" role="alert">
          {fehler}
        </p>
      )}
      {quelle && (
        <>
          {wege.length > 1 && (
            <fieldset className="lqt-bild-wege">
              <legend>Wie ist das Bild entstanden?</legend>
              {wege.map((w) => (
                <label key={w}>
                  <input type="radio" name="weg" checked={weg === w} onChange={() => setWeg(w)} />
                  {WEG_TEXT[w]}
                </label>
              ))}
            </fieldset>
          )}
          <div className="lqt-bild-vorschau">
            <HochgeladeneBilder.Provider value={vorschau ? { [teil.id]: vorschau.url } : {}}>
              <figure>
                <AvatarBild avatar={avatar} className="lqt-bild-held" />
                <figcaption>Am Helden</figcaption>
              </figure>
              <figure>
                <TeilBild teil={teil} className="lqt-bild-kachel is-gross" />
                <figcaption>Als Kachel</figcaption>
              </figure>
            </HochgeladeneBilder.Provider>
            <div className="lqt-bild-regler">
              {regler.map((r) => (
                <label key={r.key}>
                  <span>
                    {r.label}: <b>{Number(werte[r.key] ?? r.standard)}</b>
                  </span>
                  <input
                    type="range"
                    min={r.min}
                    max={r.max}
                    step={r.step}
                    value={Number(werte[r.key] ?? r.standard)}
                    onChange={(e) => setWerte((w) => ({ ...w, [r.key]: Number(e.target.value) }))}
                  />
                </label>
              ))}
              {regler.length > 0 && (
                <button type="button" className="btn btn-secondary ui-btn is-small" onClick={() => setWerte(startWerte(teil.id))}>
                  <Icon icon={RotateCcw} />
                  Regler zurücksetzen
                </button>
              )}
              <p className="lqt-hint" aria-live="polite">
                {arbeitet ? 'Rechnet …' : vorschau ? `Fertiges Bild: ${Math.round(vorschau.blob.size / 1000)} KB` : ''}
              </p>
            </div>
          </div>
          <div className="lqt-bild-zeile">
            <button type="button" className="btn btn-primary ui-btn" disabled={busy || arbeitet || !vorschau || !!fehler} onClick={() => void uebernehmen()}>
              <Icon icon={Check} />
              Übernehmen
            </button>
            <button
              type="button"
              className="btn btn-secondary ui-btn"
              disabled={busy}
              onClick={() => {
                setQuelle(null);
                setVorschau(null);
                setFehler('');
              }}
            >
              Verwerfen
            </button>
          </div>
        </>
      )}
    </section>
  );
}
