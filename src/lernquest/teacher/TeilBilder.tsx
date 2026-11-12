// „Teile“ on the teacher page, only for the admin teacher (lq_admin), for every class of every teacher. Stufe E: every
// part is a vector drawing in the code (src/lernquest/figuren/). Here the teacher sees each part as drawn, sets its
// values (rarity, where it comes from, bonuses), renames her own ones and wishes for new parts and hair: name, place,
// rarity and how it should look (supabase/migrations/20261126_lernquest_wuensche.sql). A wish is not in the game until
// Claude has drawn it under its id; then the teacher sets where it comes from. Old own parts with an uploaded picture
// show that picture until they are drawn.
import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Save, Send, X } from 'lucide-react';
import { Icon } from '../../icons';
import { KopfBild, TeilBild } from '../app/avatar';
import { HochgeladeneBilder } from '../app/bilderKontext';
import { useHochgeladen } from '../app/hochgeladen';
import { hatVektor } from '../app/heldVektor';
import { FRISUR_ARTEN } from '../figuren';
import { frisurAendern, lqText, teilAendern, teilEinstellen, wuensche, wunschAnlegen, type Herkunft } from '../server';
import { bonusText, FRISUREN, frisurTeil, mitWerten, SELTENHEITEN, SLOTS, TEILE, type Frisur, type Slot, type Teil } from '../teile';

type Platz = Slot | 'frisur';
type Wahl = { art: 'teil'; teil: Teil } | { art: 'frisur'; frisur: Frisur } | { art: 'wunsch'; platz: Platz };

/** Whether an own part or hair is drawn yet, and whether it is in the game. */
function zustand(t: Teil | null, f: Frisur | null): { text: string; klasse: string } {
  const eigen = t ? !!t.eigen : !!f?.eigen;
  if (!eigen) return { text: 'Zeichnung', klasse: '' };
  const gezeichnet = t ? hatVektor(t) : FRISUR_ARTEN.includes(f!.id);
  const aus = t ? !!t.aus : !!frisurTeil(f!).aus;
  if (!gezeichnet) return { text: 'Wartet auf Zeichnung', klasse: 'is-wartet' };
  return aus ? { text: 'Gezeichnet, nicht im Spiel', klasse: 'is-hochgeladen' } : { text: 'Eigenes Teil', klasse: 'is-hochgeladen' };
}

/** The wishes (only for the teacher who may see them), as id → text. */
function useWuensche(keys: string[], stand: number): Record<string, string> {
  const [w, setW] = useState<Record<string, string>>({});
  useEffect(() => {
    let weg = false;
    wuensche(keys)
      .then((r) => {
        if (weg || !Array.isArray(r)) return;
        setW(Object.fromEntries(r.flatMap((x) => (x && typeof x.id === 'string' && typeof x.wunsch === 'string' ? [[x.id, x.wunsch]] : []))));
      })
      .catch(() => {});
    return () => {
      weg = true;
    };
  }, [keys, stand]);
  return w;
}

export default function TeilBilder({ keys, onClose }: { keys: string[]; onClose(): void }) {
  const [stand, setStand] = useState(0);
  const { bilder: hoch, teile: eigene, frisuren: eigeneFrisuren } = useHochgeladen(stand);
  const wunschText = useWuensche(keys, stand);
  const [wahl, setWahl] = useState<Wahl | null>(null);
  const [meldung, setMeldung] = useState('');
  const neu = () => setStand((s) => s + 1);
  const waehlen = (w: Wahl | null) => {
    setMeldung('');
    setWahl(w);
  };
  const kachelNeu = (platz: Platz, label: string) => (
    <button type="button" className={`lqt-bild lqt-bild-neu ${wahl?.art === 'wunsch' && wahl.platz === platz ? 'is-on' : ''}`} onClick={() => waehlen({ art: 'wunsch', platz })}>
      <span className="lqt-bild-kachel lqt-bild-plus" aria-hidden>
        <Icon icon={Plus} size={28} />
      </span>
      <span>Neu wünschen</span>
      <small className="lqt-bild-herkunft">{label}</small>
    </button>
  );
  return (
    <div className="app lqt-app">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Teile und Wünsche</div>
          <div className="topbar-place">Gilt für alle Klassen aller Lehrkräfte</div>
        </div>
      </header>
      <main className="lqt-main">
        <HochgeladeneBilder.Provider value={hoch}>
          {wahl?.art === 'wunsch' && (
            <WunschFormular
              key={wahl.platz}
              platz={wahl.platz}
              keys={keys}
              onClose={() => setWahl(null)}
              onAngelegt={(name) => {
                setWahl(null);
                setMeldung(`Dein Wunsch „${name}“ ist gespeichert. Sag Claude Bescheid: Es zeichnet das Teil, danach stellst du hier die Herkunft ein, dann ist es im Spiel.`);
                neu();
              }}
            />
          )}
          {wahl?.art === 'teil' && (
            <Detail key={wahl.teil.id} teil={mitWerten(eigene.find((t) => t.id === wahl.teil.id) ?? wahl.teil)} frisur={null} wunsch={wunschText[wahl.teil.id]} keys={keys} onFertig={neu} onClose={() => setWahl(null)} />
          )}
          {wahl?.art === 'frisur' && (
            <Detail key={wahl.frisur.id} teil={null} frisur={eigeneFrisuren.find((f) => f.id === wahl.frisur.id) ?? wahl.frisur} wunsch={wunschText[wahl.frisur.id]} keys={keys} onFertig={neu} onClose={() => setWahl(null)} />
          )}
          {meldung && (
            <p className="lqt-hint" role="status">
              {meldung}
            </p>
          )}
          <p className="lqt-note">
            Alle Teile sind Zeichnungen. Teil antippen: Seltenheit, Herkunft und Boni einstellen. Für ein neues Teil oder eine
            neue Frisur „Neu wünschen“: Name, Seltenheit und wie es aussehen soll. Claude zeichnet es; danach stellst du die
            Herkunft ein, dann ist es im Spiel.
          </p>
          {SLOTS.map(({ slot, label }) => (
            <section key={slot} className="lqt-card">
              <h2>{label}</h2>
              <div className="lqt-bilder">
                {[...TEILE, ...eigene]
                  .map(mitWerten)
                  .filter((t) => t.slot === slot)
                  .map((t) => {
                    const z = zustand(t, null);
                    return (
                      <button key={t.id} type="button" className={`lqt-bild ${wahl?.art === 'teil' && wahl.teil.id === t.id ? 'is-on' : ''}`} onClick={() => waehlen({ art: 'teil', teil: t })}>
                        <TeilBild teil={t} className="lqt-bild-kachel" />
                        <span>{t.name}</span>
                        <small className={`lqt-bild-herkunft ${z.klasse}`}>{z.text}</small>
                        <small className="lqt-bild-werte">
                          {SELTENHEITEN[t.seltenheit].kurz} · {HERKUNFT_TEXT[herkunftVon(t)]}
                          {bonusText(t) ? ` · ${bonusText(t)}` : ''}
                        </small>
                      </button>
                    );
                  })}
                {kachelNeu(slot, label)}
              </div>
            </section>
          ))}
          <section className="lqt-card">
            <h2>Frisuren</h2>
            <div className="lqt-bilder">
              {[...FRISUREN.filter((f) => f.id !== 'glatze'), ...eigeneFrisuren, ...FRISUREN.filter((f) => f.id === 'glatze')].map((f: Frisur) => {
                const z = zustand(null, f);
                return (
                  <button key={f.id} type="button" className={`lqt-bild ${wahl?.art === 'frisur' && wahl.frisur.id === f.id ? 'is-on' : ''}`} onClick={() => waehlen({ art: 'frisur', frisur: f })}>
                    <span className="lqt-bild-kachel">
                      <KopfBild avatar={{ frisur: f.id }} />
                    </span>
                    <span>{f.name}</span>
                    <small className={`lqt-bild-herkunft ${z.klasse}`}>{z.text}</small>
                    <small className="lqt-bild-werte">{HERKUNFT_TEXT[herkunftVon(frisurTeil(f))]}</small>
                  </button>
                );
              })}
              {kachelNeu('frisur', 'Frisuren')}
            </div>
          </section>
        </HochgeladeneBilder.Provider>
      </main>
    </div>
  );
}

const PLATZ_NAME: Record<Platz, string> = { ...(Object.fromEntries(SLOTS.map((s) => [s.slot, s.label])) as Record<Slot, string>), frisur: 'Frisur' };

/** A wish for a new part or hair: name, rarity and how it should look. */
function WunschFormular({ platz, keys, onClose, onAngelegt }: { platz: Platz; keys: string[]; onClose(): void; onAngelegt(name: string): void }) {
  const [name, setName] = useState('');
  const [seltenheit, setSeltenheit] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const ok = name.trim().length > 0 && name.trim().length <= 30 && text.trim().length > 0 && text.length <= 500;
  const senden = async () => {
    setBusy(true);
    setMsg('');
    try {
      await wunschAnlegen(keys, { name: name.trim(), slot: platz, seltenheit, wunsch: text.trim() });
      onAngelegt(name.trim());
    } catch (e) {
      setMsg(e instanceof Error && e.message === 'voll' ? 'Es gibt schon sehr viele eigene Teile.' : lqText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="lqt-card lqt-bild-edit" aria-label={`Neu wünschen: ${PLATZ_NAME[platz]}`}>
      <div className="lqt-head">
        <h2>Neu wünschen: {PLATZ_NAME[platz]}</h2>
        <button type="button" className="iconbtn" onClick={onClose} aria-label="Schließen" title="Schließen">
          <Icon icon={X} size={18} />
        </button>
      </div>
      <div className="lqt-bild-angaben">
        <label>
          <span>Name</span>
          <input className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="z. B. Piratenkapitänshut" />
        </label>
        <label>
          <span>Seltenheit</span>
          <select className="input" value={seltenheit} onChange={(e) => setSeltenheit(Number(e.target.value))}>
            {SELTENHEITEN.map((x, i) => (
              <option key={x.name} value={i}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="lqt-wunsch">
        <span>Wie soll es aussehen?</span>
        <textarea
          className="input"
          rows={4}
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Farben, Form, Material, Besonderheiten … z. B. „Schwarzer Dreispitz mit goldenem Rand und rotem Federbusch“"
        />
      </label>
      <p className="lqt-hint">Höhere Seltenheit sieht man auch am Teil: Gold, Edelsteine, Funkeln. Das Teil ist erst im Spiel, wenn es gezeichnet ist und du die Herkunft einstellst.</p>
      <button type="button" className="btn btn-primary ui-btn" disabled={!ok || busy} aria-busy={busy} onClick={() => void senden()}>
        <Icon icon={Send} />
        Wunsch speichern
      </button>
      {msg && (
        <p className="lqt-hint" role="alert">
          {msg}
        </p>
      )}
    </section>
  );
}

/** One part or hair: big picture, its state and wish, renaming (own ones) and the values. */
function Detail({ teil, frisur, wunsch, keys, onFertig, onClose }: { teil: Teil | null; frisur: Frisur | null; wunsch?: string; keys: string[]; onFertig(): void; onClose(): void }) {
  const name = teil?.name ?? frisur!.name;
  const eigen = teil ? !!teil.eigen : !!frisur?.eigen;
  const z = zustand(teil, frisur);
  const [neuName, setNeuName] = useState(name);
  const [msg, setMsg] = useState('');
  const umbenennen = async () => {
    setMsg('');
    try {
      if (frisur) await frisurAendern(keys, frisur.id, neuName.trim());
      else await teilAendern(keys, teil!.id, neuName.trim(), !teil!.aus);
      setMsg('Umbenannt.');
      onFertig();
    } catch (e) {
      setMsg(lqText(e));
    }
  };
  return (
    <section className="lqt-card lqt-bild-edit" aria-label={name}>
      <div className="lqt-head">
        <h2>{name}</h2>
        <button type="button" className="iconbtn" onClick={onClose} aria-label="Schließen" title="Schließen">
          <Icon icon={X} size={18} />
        </button>
      </div>
      <div className="lqt-detail">
        <span className="lqt-bild-kachel is-gross">{teil ? <TeilBild teil={teil} /> : <KopfBild avatar={{ frisur: frisur!.id }} />}</span>
        <div>
          <p>
            <small className={`lqt-bild-herkunft ${z.klasse}`}>{z.text}</small>
          </p>
          {wunsch && (
            <p className="lqt-hint">
              <strong>Dein Wunsch:</strong> {wunsch}
            </p>
          )}
          {z.text === 'Wartet auf Zeichnung' && <p className="lqt-hint">Claude zeichnet es, wenn du Bescheid sagst. Bis dahin ist es nicht im Spiel.</p>}
          {eigen && (
            <div className="lqt-bild-angaben">
              <label>
                <span>Name</span>
                <input className="input" value={neuName} maxLength={30} onChange={(e) => setNeuName(e.target.value)} />
              </label>
              <button type="button" className="btn btn-secondary ui-btn" disabled={!neuName.trim() || neuName.trim() === name} onClick={() => void umbenennen()}>
                <Icon icon={Pencil} />
                Umbenennen
              </button>
            </div>
          )}
          {msg && (
            <p className="lqt-hint" role="status">
              {msg}
            </p>
          )}
        </div>
      </div>
      {frisur?.id !== 'glatze' && <Einstellungen teil={teil ?? frisurTeil(frisur!)} frisur={!!frisur} keys={keys} onFertig={onFertig} />}
    </section>
  );
}

const HERKUNFT_TEXT: Record<Herkunft, string> = {
  start: 'Start (alle haben es)',
  truhe: 'Nur Truhe',
  truhe_laden: 'Truhe und Laden',
  laden: 'Nur Laden',
  aus: 'Nicht erhältlich',
};

/** Where a part comes from, as one choice. */
export const herkunftVon = (t: Teil): Herkunft => (t.aus ? 'aus' : t.start ? 'start' : t.nurTruhe ? 'truhe' : t.nurLaden ? 'laden' : 'truhe_laden');

function Einstellungen({ teil, frisur, keys, onFertig }: { teil: Teil; frisur: boolean; keys: string[]; onFertig(): void }) {
  const vorher = { seltenheit: teil.seltenheit, herkunft: herkunftVon(teil), muenzen: teil.muenzen ?? 0, herz: teil.herz ?? 0, schaden: teil.schaden ?? 0 };
  const [w, setW] = useState(vorher);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const geaendert = JSON.stringify(w) !== JSON.stringify(vorher);
  const speichern = async () => {
    setBusy(true);
    setMsg('');
    try {
      await teilEinstellen(keys, teil.id, w);
      setMsg('Gespeichert. Die Kinder sehen es beim nächsten Öffnen von Lernquest.');
      onFertig();
    } catch (e) {
      setMsg(
        e instanceof Error && e.message === 'letztes'
          ? 'Das ist das letzte Start-Teil auf diesem Platz. Mach zuerst ein anderes zum Start-Teil, sonst stünde ein neues Kind ohne da.'
          : lqText(e),
      );
    } finally {
      setBusy(false);
    }
  };
  const zahl = (key: 'muenzen' | 'herz' | 'schaden', label: string, werte: number[], text: (n: number) => string) => (
    <label>
      <span>{label}</span>
      <select className="input" value={w[key]} onChange={(e) => setW({ ...w, [key]: Number(e.target.value) })}>
        {werte.map((n) => (
          <option key={n} value={n}>
            {n ? text(n) : 'keiner'}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="lqt-einstellungen" aria-label="Einstellungen">
      <strong>Einstellungen</strong>
      <div className="lqt-bild-angaben">
        <label>
          <span>Seltenheit</span>
          <select className="input" value={w.seltenheit} onChange={(e) => setW({ ...w, seltenheit: Number(e.target.value) })}>
            {SELTENHEITEN.map((x, i) => (
              <option key={x.name} value={i}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Herkunft</span>
          <select className="input" value={w.herkunft} onChange={(e) => setW({ ...w, herkunft: e.target.value as Herkunft })}>
            {(Object.keys(HERKUNFT_TEXT) as Herkunft[]).map((h) => (
              <option key={h} value={h}>
                {HERKUNFT_TEXT[h]}
              </option>
            ))}
          </select>
        </label>
        {!frisur && (
          <>
            {zahl('muenzen', 'Bonus Münzen', [0, 5, 10, 15, 20], (n) => `+${n} %`)}
            {zahl('herz', 'Bonus Herzen', [0, 1, 2], (n) => `+${n}`)}
            {zahl('schaden', 'Bonus Schaden (Boss)', [0, 1, 2, 3], (n) => `+${n}`)}
          </>
        )}
        <button type="button" className="btn btn-secondary ui-btn" disabled={busy || !geaendert} onClick={() => void speichern()}>
          <Icon icon={Save} />
          Speichern
        </button>
      </div>
      <p className="lqt-hint">
        Preis im Laden aus der Seltenheit. Boni zählen nur im Spiel, zusammen höchstens +20 % Münzen, +2 Herzen und +3 Schaden.
        Besitz bleibt immer: Wer es hat oder gerade trägt, behält es.
      </p>
      {msg && (
        <p className="lqt-hint" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
