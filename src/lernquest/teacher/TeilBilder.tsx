// „Bilder der Teile“ on the teacher page, only for the admin teacher (lq_admin): upload a painted picture for a part,
// see it on the hero and as a tile, then „Übernehmen“. The pictures count for every class of every teacher and go
// before the built-in ones; after „Löschen“ the built-in picture or the drawing shows again. The picture is made into
// the part's layer in the browser (bildVerarbeiten.ts, the same steps as `npm run lq:bilder`). New parts (name, place,
// rarity, only from chests) are made here too, with their picture (supabase/migrations/20261118_lernquest_eigene_teile.sql).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Eraser, ImagePlus, Pencil, Plus, RotateCcw, Save, Sparkles, Trash2, X } from 'lucide-react';
import { Icon } from '../../icons';
import { AvatarBild, KopfBild, TeilBild } from '../app/avatar';
import { HochgeladeneBilder } from '../app/bilderKontext';
import { useHochgeladen } from '../app/hochgeladen';
import { TEIL_BILDER } from '../app/teilBilder';
import ANPASSEN from '../bilder/anpassen.json';
import type { Einstellung } from '../bilder/ebene';
import { editFrisur, editPrompt, prompt } from '../bilder/vorlagen';
import type { Strich } from '../bilder/pixel';
import { runImages } from '../../ai/images';
import { bildLoeschen, bildSetzen, lqText, teilAendern, teilAnlegen } from '../server';
import { FRISUREN, HAARFARBEN, SELTENHEITEN, SLOTS, TEILE, type Avatar, type Slot, type Teil } from '../teile';
import { alsBase64, ebeneMachen, grundfigurDataUrl, haarFarben, kodieren, oeffnen, oeffnenUrl, WEGE, WEGE_HAARE, type Quelle, type Weg } from './bildVerarbeiten';
import { Radierer } from './Radierer';

const WEG_TEXT: Record<Weg, string> = {
  einzeln: 'Einzeln gemalt (auf Grau)',
  edit: 'Edit der Grundfigur',
  flaeche: 'Ganzes Bild',
  ebene: 'Fertiges Bild nachjustieren',
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
    { key: 'r', label: 'Drehen (Grad)', min: -180, max: 180, step: 1, standard: 0 },
    { key: 'toleranz', label: 'Freistellen (wie grau noch Hintergrund ist)', min: 10, max: 120, step: 1, standard: 36 },
  ],
  edit: [{ key: 'schwelle', label: 'Empfindlichkeit (größer = nur deutliche Änderungen)', min: 10, max: 90, step: 1, standard: 30 }],
  flaeche: [],
  ebene: [
    { key: 's', label: 'Größe', min: 0.3, max: 2, step: 0.01, standard: 1 },
    { key: 'dx', label: 'Links / rechts', min: -60, max: 60, step: 1, standard: 0 },
    { key: 'dy', label: 'Hoch / runter', min: -80, max: 80, step: 1, standard: 0 },
    { key: 'r', label: 'Drehen (Grad)', min: -180, max: 180, step: 1, standard: 0 },
    { key: 'toleranz', label: 'Grauen Rand wegschneiden (0 = aus)', min: 0, max: 80, step: 1, standard: 0 },
  ],
};
/** Backgrounds fill the whole layer: only moving, scaling and turning would leave gaps. */
const REGLER_HINTERGRUND: Regler[] = [];

/** The script's settings for a part made on its own; a finished layer starts as it is. */
const startWerte = (id: string, weg: Weg): Einstellung => (weg === 'einzeln' ? { ...((ANPASSEN as Record<string, Einstellung>)[id] ?? {}) } : {});

/** The prompt for the image model: the part alone on grey, or an edit of the base figure. */
const kiPrompt = (t: Teil, weg: Weg) => (weg === 'edit' ? (editPrompt(t) ?? prompt(t)) : prompt(t));

/** Where the picture of a part comes from now (own parts: whether they are in the game). */
const herkunft = (t: Teil, hoch: Record<string, string>) =>
  t.eigen ? (t.aus ? 'Aus dem Spiel' : 'Eigenes Teil') : hoch[t.id] ? 'Hochgeladen' : TEIL_BILDER[t.id] ? 'Eingebaut' : 'Zeichnung';
const herkunftKlasse = (h: string) => (h === 'Hochgeladen' || h === 'Eigenes Teil' ? 'is-hochgeladen' : '');

/** A part still to be made: the editor shows name, rarity and „only from chests“ and makes it with its picture. */
const NEU = 'neu';
const neuesTeil = (slot: Slot): Teil => ({ id: NEU, slot, name: '', seltenheit: 0, eigen: true });

export default function TeilBilder({ keys, onClose }: { keys: string[]; onClose(): void }) {
  const [stand, setStand] = useState(0);
  const { bilder: hoch, teile: eigene } = useHochgeladen(stand);
  const [wahl, setWahl] = useState<Teil | null>(null);
  /** A hair being worked on instead of a part. */
  const [frisur, setFrisur] = useState<{ id: string; name: string } | null>(null);
  const [meldung, setMeldung] = useState('');
  const waehlen = (t: Teil | null, f: { id: string; name: string } | null = null) => {
    setMeldung('');
    setWahl(t);
    setFrisur(f);
  };
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
          {frisur && (
            <Bearbeiten
              key={`haare-${frisur.id}`}
              teil={{ id: `haare-${frisur.id}`, slot: 'kopf', name: frisur.name, seltenheit: 0 }}
              frisur={frisur.id}
              keys={keys}
              hochUrl={hoch[`haare-${frisur.id}-0`]}
              onFertig={() => setStand((s) => s + 1)}
              onClose={() => setFrisur(null)}
              onAngelegt={() => undefined}
            />
          )}
          {wahl && (
            <Bearbeiten
              key={wahl.id === NEU ? `neu-${wahl.slot}` : wahl.id}
              teil={eigene.find((t) => t.id === wahl.id) ?? wahl}
              keys={keys}
              hochUrl={hoch[wahl.id]}
              onFertig={() => setStand((s) => s + 1)}
              onClose={() => setWahl(null)}
              onAngelegt={(name) => {
                setWahl(null);
                setMeldung(`„${name}“ ist angelegt. Die Kinder finden es beim nächsten Öffnen von Lernquest im Laden bzw. in Truhen.`);
                setStand((s) => s + 1);
              }}
            />
          )}
          {meldung && (
            <p className="lqt-hint" role="status">
              {meldung}
            </p>
          )}
          <p className="lqt-note">
            Teil antippen, dann ein Bild aus ComfyUI wählen (der Dateiname ist egal), mit KI malen lassen oder das
            vorhandene Bild nachjustieren; Vorschau prüfen, „Übernehmen“. Die Kinder sehen es beim nächsten Öffnen von
            Lernquest. Münder, Hauttöne und die Grundfigur gehen weiter über <code>npm run lq:bilder</code>.
          </p>
          {SLOTS.map(({ slot, label }) => (
            <section key={slot} className="lqt-card">
              <h2>{label}</h2>
              <div className="lqt-bilder">
                {[...TEILE, ...eigene]
                  .filter((t) => t.slot === slot)
                  .map((t) => (
                    <button key={t.id} type="button" className={`lqt-bild ${wahl?.id === t.id ? 'is-on' : ''}`} onClick={() => waehlen(t)}>
                      <TeilBild teil={t} className="lqt-bild-kachel" />
                      <span>{t.name}</span>
                      <small className={`lqt-bild-herkunft ${herkunftKlasse(herkunft(t, hoch))}`}>{herkunft(t, hoch)}</small>
                    </button>
                  ))}
                <button
                  type="button"
                  className={`lqt-bild lqt-bild-neu ${wahl?.id === NEU && wahl.slot === slot ? 'is-on' : ''}`}
                  onClick={() => waehlen(neuesTeil(slot))}
                >
                  <span className="lqt-bild-kachel lqt-bild-plus" aria-hidden>
                    <Icon icon={Plus} size={28} />
                  </span>
                  <span>Neues Teil</span>
                  <small className="lqt-bild-herkunft">{label}</small>
                </button>
              </div>
            </section>
          ))}
          <section className="lqt-card">
            <h2>Frisuren</h2>
            <p className="lqt-hint">Gemalt wird die Frisur in Braun als Edit der Grundfigur; die anderen vier Haarfarben rechnet die Seite daraus.</p>
            <div className="lqt-bilder">
              {FRISUREN.filter((f) => f.id !== 'glatze').map((f) => {
                const h = hoch[`haare-${f.id}-0`] ? 'Hochgeladen' : TEIL_BILDER[`haare-${f.id}-0`] ? 'Eingebaut' : 'Zeichnung';
                return (
                  <button key={f.id} type="button" className={`lqt-bild ${frisur?.id === f.id ? 'is-on' : ''}`} onClick={() => waehlen(null, f)}>
                    <span className="lqt-bild-kachel">
                      <KopfBild avatar={{ frisur: f.id }} />
                    </span>
                    <span>{f.name}</span>
                    <small className={`lqt-bild-herkunft ${herkunftKlasse(h)}`}>{h}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </HochgeladeneBilder.Provider>
      </main>
    </div>
  );
}

function Bearbeiten({
  teil,
  keys,
  hochUrl,
  onFertig,
  onClose,
  onAngelegt,
  frisur,
}: {
  teil: Teil;
  /** A hair (its id) instead of a part: an edit of the base figure, saved in every hair colour. */
  frisur?: string;
  keys: string[];
  /** The uploaded picture of the part, if there is one. */
  hochUrl?: string;
  onFertig(): void;
  onClose(): void;
  /** A new part was made (`teil.id` is NEU). */
  onAngelegt(name: string): void;
}) {
  const neu = teil.id === NEU;
  // Own parts: name, rarity and „only from chests“ for a new one; name and „in the game“ for one already made.
  const [angaben, setAngaben] = useState({ name: teil.name, seltenheit: teil.seltenheit, nurTruhe: !!teil.nurTruhe, aktiv: !teil.aus });
  const entwurf: Teil = neu ? { ...teil, name: angaben.name.trim() || 'Neues Teil', seltenheit: angaben.seltenheit } : teil;
  const hochgeladen = !!hochUrl;
  // A hair: its brown layer stands for it; the work is an edit in the hair area.
  const ziel: Slot | 'haare' = frisur ? 'haare' : teil.slot;
  const startWege = frisur ? WEGE_HAARE : WEGE[teil.slot];
  const eingebaut = TEIL_BILDER[frisur ? `haare-${frisur}-0` : teil.id];
  /** The files to save: one per part, five per hair (one per colour). */
  const ids = frisur ? HAARFARBEN.map((_, i) => `haare-${frisur}-${i}`) : [teil.id];
  const [striche, setStriche] = useState<Strich[]>([]);
  const [radieren, setRadieren] = useState(false);
  const [quelle, setQuelle] = useState<Quelle | null>(null);
  /** The picture is a finished layer (built-in or uploaded): it is only fine-tuned. */
  const [fertig, setFertig] = useState(false);
  const wege: Weg[] = fertig ? ['ebene'] : startWege;
  const [weg, setWeg] = useState<Weg>(startWege[0]);
  const [werte, setWerte] = useState<Einstellung>(() => startWerte(teil.id, startWege[0]));
  /** The image model: open, the way and the prompt, running. */
  const [ki, setKi] = useState<{ weg: Weg; prompt: string } | null>(null);
  const [malt, setMalt] = useState(false);
  const abbruch = useRef<AbortController | null>(null);
  useEffect(() => () => abbruch.current?.abort(), []);
  const [vorschau, setVorschau] = useState<{ dateien: { id: string; blob: Blob; url: string }[] } | null>(null);
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
      ebeneMachen(quelle, ziel, weg, werte, striche)
        .then((e) => Promise.all((frisur ? haarFarben(e) : [e]).map((x) => kodieren(x, ziel))))
        .then((blobs) => {
          if (aus) return;
          setVorschau({ dateien: blobs.map((blob, i) => ({ id: ids[i], blob, url: URL.createObjectURL(blob) })) });
          setFehler('');
        })
        .catch((e: Error) => !aus && setFehler(e.message))
        .finally(() => !aus && setArbeitet(false));
    }, 150);
    return () => {
      aus = true;
      clearTimeout(t);
    };
    // `ids` follows from `frisur` and `teil`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quelle, weg, werte, ziel, striche]);

  // The previous preview is freed when a new one comes (and on closing).
  useEffect(
    () => () => {
      for (const d of vorschau?.dateien ?? []) URL.revokeObjectURL(d.url);
    },
    [vorschau],
  );

  /** A new picture to work on: a raw one (way as chosen) or a finished layer (only fine-tuned). */
  const nehmen = async (laden: () => Promise<Quelle>, alsEbene: boolean, neuerWeg?: Weg) => {
    setMsg('');
    setFehler('');
    try {
      const q = await laden();
      const w = alsEbene ? 'ebene' : (neuerWeg ?? (weg === 'ebene' ? startWege[0] : weg));
      setFertig(alsEbene);
      setStriche([]);
      setWeg(w);
      setWerte(startWerte(teil.id, w));
      setQuelle(q);
    } catch (e) {
      setFehler((e as Error).message);
    }
  };
  const waehlen = (f: File | undefined) => (f ? nehmen(() => oeffnen(f), false) : Promise.resolve());

  const malen = async () => {
    if (!ki) return;
    abbruch.current?.abort();
    const ctrl = (abbruch.current = new AbortController());
    setMalt(true);
    setFehler('');
    try {
      const eingabe = ki.weg === 'edit' ? [await grundfigurDataUrl()] : [];
      const bilder = await runImages(ki.prompt, '1:1', 1, ctrl.signal, eingabe);
      if (!bilder) {
        setFehler('Auf diesem Gerät ist kein OpenRouter-Schlüssel eingetragen: Einstellungen → „KI im Baukasten“.');
        return;
      }
      const blob = await (await fetch(bilder[0].url)).blob();
      await nehmen(() => oeffnen(blob), false, ki.weg);
    } catch (e) {
      if (!ctrl.signal.aborted) setFehler((e as Error).message);
    } finally {
      if (abbruch.current === ctrl) setMalt(false);
    }
  };

  const uebernehmen = async () => {
    if (!vorschau) return;
    setBusy(true);
    try {
      const erste = vorschau.dateien[0].blob;
      if (neu) {
        const name = angaben.name.trim();
        await teilAnlegen(keys, { name, slot: teil.slot, seltenheit: angaben.seltenheit, nurTruhe: angaben.nurTruhe }, erste.type, await alsBase64(erste));
        onAngelegt(name);
        return;
      }
      for (const d of vorschau.dateien) await bildSetzen(keys, d.id, d.blob.type, await alsBase64(d.blob));
      setMsg('Übernommen. Die Kinder sehen das Bild beim nächsten Öffnen von Lernquest.');
      setQuelle(null);
      setVorschau(null);
      setFertig(false);
      setStriche([]);
      setRadieren(false);
      onFertig();
    } catch (e) {
      setFehler(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const speichern = async () => {
    setBusy(true);
    try {
      await teilAendern(keys, teil.id, angaben.name.trim(), angaben.aktiv);
      setMsg(angaben.aktiv ? 'Gespeichert.' : 'Gespeichert. Das Teil ist nicht mehr im Laden und in Truhen; wer es hat, behält es.');
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
      for (const id of ids) await bildLoeschen(keys, id);
      setMsg('Gelöscht.');
      onFertig();
    } catch (e) {
      setFehler(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const avatar: Avatar = useMemo(() => (frisur ? { frisur } : { [teil.slot]: teil.id }), [teil, frisur]);
  const groesse = vorschau ? Math.round(vorschau.dateien.reduce((a, d) => a + d.blob.size, 0) / 1000) : 0;
  const nameOk = angaben.name.trim().length > 0 && angaben.name.trim().length <= 30;
  const regler = weg === 'ebene' && teil.slot === 'hintergrund' ? REGLER_HINTERGRUND : REGLER[weg];

  return (
    <section ref={oben} className="lqt-card lqt-bild-edit" aria-label={neu ? 'Neues Teil' : `Bild für ${teil.name}`}>
      <div className="lqt-head">
        <div>
          <h2>{neu ? 'Neues Teil' : teil.name}</h2>
          <p className="lqt-hint">
            {frisur ? 'Frisur' : SLOTS.find((s) => s.slot === teil.slot)?.label} ·{' '}
            {frisur
              ? hochgeladen
                ? 'hochgeladen, in allen fünf Haarfarben'
                : eingebaut
                  ? 'eingebautes Bild'
                  : 'noch als Zeichnung'
              : neu
              ? 'Name, Seltenheit und Bild; der Preis ergibt sich aus der Seltenheit, Boni gibt es keine'
              : teil.eigen
                ? 'eigenes Teil'
                : hochgeladen
                  ? 'hat ein hochgeladenes Bild'
                  : TEIL_BILDER[teil.id]
                    ? 'eingebautes Bild'
                    : 'noch als Zeichnung'}
          </p>
        </div>
        <button type="button" className="iconbtn" onClick={onClose} title="Schließen" aria-label="Schließen">
          <Icon icon={X} size={18} />
        </button>
      </div>
      {teil.eigen && (
        <div className="lqt-bild-angaben">
          <label>
            <span>Name</span>
            <input className="input" value={angaben.name} maxLength={30} onChange={(e) => setAngaben({ ...angaben, name: e.target.value })} aria-invalid={!nameOk} />
          </label>
          {neu ? (
            <>
              <label>
                <span>Seltenheit</span>
                <select className="input" value={angaben.seltenheit} onChange={(e) => setAngaben({ ...angaben, seltenheit: Number(e.target.value) })}>
                  {SELTENHEITEN.map((x, i) => (
                    <option key={x.name} value={i}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lqt-bild-check">
                <input type="checkbox" checked={angaben.nurTruhe} onChange={(e) => setAngaben({ ...angaben, nurTruhe: e.target.checked })} />
                Nur aus Truhen (nicht im Laden)
              </label>
            </>
          ) : (
            <>
              <label className="lqt-bild-check">
                <input type="checkbox" checked={angaben.aktiv} onChange={(e) => setAngaben({ ...angaben, aktiv: e.target.checked })} />
                Im Spiel (Laden und Truhen)
              </label>
              <button
                type="button"
                className="btn btn-secondary ui-btn"
                disabled={busy || !nameOk || (angaben.name.trim() === teil.name && angaben.aktiv === !teil.aus)}
                onClick={() => void speichern()}
              >
                <Icon icon={Save} />
                Speichern
              </button>
            </>
          )}
        </div>
      )}
      <div className="lqt-bild-zeile">
        <input ref={datei} type="file" accept="image/png,image/webp,image/jpeg" hidden onChange={(e) => void waehlen(e.target.files?.[0]).finally(() => (e.target.value = ''))} />
        <button type="button" className="btn btn-primary ui-btn" disabled={busy} onClick={() => datei.current?.click()}>
          <Icon icon={ImagePlus} />
          {quelle ? 'Anderes Bild wählen' : 'Bild wählen'}
        </button>
        {eingebaut && (
          <button type="button" className="btn btn-secondary ui-btn" disabled={busy} onClick={() => void nehmen(() => oeffnenUrl(eingebaut), true)}>
            <Icon icon={Pencil} />
            Eingebautes Bild nachjustieren
          </button>
        )}
        {hochUrl && (
          <button type="button" className="btn btn-secondary ui-btn" disabled={busy} onClick={() => void nehmen(() => oeffnenUrl(hochUrl), true)}>
            <Icon icon={Pencil} />
            Hochgeladenes Bild nachjustieren
          </button>
        )}
        <button
          type="button"
          className={`btn btn-secondary ui-btn ${ki ? 'is-on' : ''}`}
          disabled={busy}
          onClick={() => setKi(ki ? null : { weg: startWege[0], prompt: frisur ? editFrisur(frisur) : kiPrompt(entwurf, startWege[0]) })}
        >
          <Icon icon={Sparkles} />
          Mit KI malen
        </button>
        {hochgeladen && !teil.eigen && (
          <button type="button" className="btn btn-secondary ui-btn is-danger" disabled={busy} onClick={() => void loeschen()}>
            <Icon icon={Trash2} />
            Hochgeladenes Bild löschen
          </button>
        )}
      </div>
      {ki && (
        <div className="lqt-bild-ki">
          {startWege.length > 1 && (
            <fieldset className="lqt-bild-wege">
              <legend>Wie soll das Modell malen?</legend>
              {startWege.map((w) => (
                <label key={w}>
                  <input type="radio" name="kiweg" checked={ki.weg === w} onChange={() => setKi({ weg: w, prompt: kiPrompt(entwurf, w) })} />
                  {w === 'edit' ? 'Auf die Grundfigur (Edit)' : WEG_TEXT[w]}
                </label>
              ))}
            </fieldset>
          )}
          <label className="lqt-bild-prompt">
            <span>Beschreibung für das Bildmodell (englisch, änderbar)</span>
            <textarea className="input" rows={5} value={ki.prompt} onChange={(e) => setKi({ ...ki, prompt: e.target.value })} />
          </label>
          <div className="lqt-bild-zeile">
            <button type="button" className="btn btn-primary ui-btn" disabled={busy || malt || !ki.prompt.trim()} onClick={() => void malen()}>
              <Icon icon={Sparkles} />
              {malt ? 'Malt …' : quelle ? 'Nochmal malen' : 'Malen'}
            </button>
            <span className="lqt-hint">Ein Bild mit dem Bildmodell aus den KI-Einstellungen (Nano Banana: etwa 4 Cent).</span>
          </div>
        </div>
      )}
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
                  <input
                    type="radio"
                    name="weg"
                    checked={weg === w}
                    onChange={() => {
                      setWeg(w);
                      setWerte(startWerte(teil.id, w));
                    }}
                  />
                  {WEG_TEXT[w]}
                </label>
              ))}
            </fieldset>
          )}
          <div className="lqt-bild-vorschau">
            <HochgeladeneBilder.Provider value={vorschau ? Object.fromEntries(vorschau.dateien.map((d) => [d.id, d.url])) : {}}>
              <figure>
                <AvatarBild avatar={avatar} vorschau={frisur ? undefined : entwurf} className="lqt-bild-held" />
                <figcaption>Am Helden</figcaption>
              </figure>
              {frisur ? (
                <figure>
                  <div className="lqt-bild-farben">
                    {HAARFARBEN.map((f, i) => (
                      <span key={f.name} className="lqt-bild-kachel" title={f.name}>
                        <KopfBild avatar={{ frisur, haarfarbe: i }} />
                      </span>
                    ))}
                  </div>
                  <figcaption>In allen Haarfarben</figcaption>
                </figure>
              ) : (
                <figure>
                  <TeilBild teil={entwurf} className="lqt-bild-kachel is-gross" />
                  <figcaption>Als Kachel</figcaption>
                </figure>
              )}
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
                <button type="button" className="btn btn-secondary ui-btn is-small" onClick={() => setWerte(startWerte(teil.id, weg))}>
                  <Icon icon={RotateCcw} />
                  Regler zurücksetzen
                </button>
              )}
              {ziel !== 'hintergrund' && (
                <button
                  type="button"
                  className={`btn btn-secondary ui-btn is-small ${radieren ? 'is-on' : ''}`}
                  aria-pressed={radieren}
                  disabled={!vorschau}
                  onClick={() => setRadieren(!radieren)}
                >
                  <Icon icon={Eraser} />
                  Radiergummi{striche.length ? ` (${striche.length})` : ''}
                </button>
              )}
              <p className="lqt-hint" aria-live="polite">
                {arbeitet ? 'Rechnet …' : vorschau ? `Fertig: ${groesse} KB${frisur ? ' (5 Haarfarben)' : ''}` : ''}
              </p>
            </div>
          </div>
          {radieren && vorschau && <Radierer url={vorschau.dateien[0].url} striche={striche} setStriche={setStriche} />}
          <div className="lqt-bild-zeile">
            <button type="button" className="btn btn-primary ui-btn" disabled={busy || arbeitet || !vorschau || !!fehler || (neu && !nameOk)} onClick={() => void uebernehmen()}>
              <Icon icon={neu ? Plus : Check} />
              {neu ? 'Teil anlegen' : 'Übernehmen'}
            </button>
            <button
              type="button"
              className="btn btn-secondary ui-btn"
              disabled={busy}
              onClick={() => {
                setQuelle(null);
                setVorschau(null);
                setFehler('');
                setFertig(false);
                setStriche([]);
                setRadieren(false);
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
