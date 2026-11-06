// Stufe 4 on the teacher's page: the class's vouchers (price, weekly limits per child and for the class, on/off) and the
// children's requests to tick off. Redeemed uses the points that were set aside; refused gives them back.
import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Icon } from '../../icons';
import { PUNKTE_BOSS, PUNKTE_HAND_WOCHE, PUNKTE_WOCHENZIEL } from '../rules';
import { anfrageErledigen, belohnungen, gutscheinLoeschen, gutscheinSpeichern, lqText, type AnfrageInfo, type GutscheinInfo, type KlasseInfo } from '../server';

/** A starting list the teacher adapts (price, per child per week, for the class per week). */
export const VORSCHLAEGE: Pick<GutscheinInfo, 'name' | 'preis' | 'jeKind' | 'jeKlasse'>[] = [
  { name: 'Sitzplatz für eine Stunde wählen', preis: 5, jeKind: 1, jeKlasse: 3 },
  { name: 'Musik in der Stillarbeit wünschen', preis: 6, jeKind: 1, jeKlasse: 1 },
  { name: 'Spiel am Stundenende aussuchen', preis: 8, jeKind: 1, jeKlasse: 1 },
  { name: 'Hausaufgaben-Joker', preis: 12, jeKind: 1, jeKlasse: null },
];

const ZUSTAND: Record<AnfrageInfo['zustand'], string> = { offen: 'offen', eingeloest: 'eingelöst', abgelehnt: 'abgelehnt', zurueck: 'vom Kind zurückgezogen' };

const datum = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }) : '–');

interface Props {
  klasse: KlasseInfo;
  keys: string[];
  busy: boolean;
  act(f: (keys: string[]) => Promise<unknown>): Promise<void>;
}

export function Belohnungen({ klasse, keys, busy, act }: Props) {
  const [daten, setDaten] = useState<{ gutscheine: GutscheinInfo[]; anfragen: AnfrageInfo[] } | null>(null);
  const [msg, setMsg] = useState('');

  const laden = useCallback(async () => {
    if (!keys.length) return;
    try {
      setDaten(await belohnungen(keys, klasse.id));
      setMsg('');
    } catch (e) {
      setMsg(lqText(e));
    }
  }, [keys, klasse.id]);

  // Again when the class list says the number of open requests changed.
  useEffect(() => {
    void laden();
  }, [laden, klasse.anfragen]);

  /** A change, then the class list (points) and the vouchers again. */
  const tun = (f: (keys: string[]) => Promise<unknown>) => act(async (k) => {
    await f(k);
    await laden();
  });

  const name = (kind: string) => klasse.kinder.find((k) => k.id === kind)?.name ?? '?';
  const offen = daten?.anfragen.filter((a) => a.zustand === 'offen') ?? [];
  const erledigt = daten?.anfragen.filter((a) => a.zustand !== 'offen') ?? [];

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Gutscheine und Anfragen</h2>
          <p className="lqt-hint">
            Die Kinder lösen Klassenpunkte gegen Gutscheine ein (Münzen zählen nicht). Punkte gibt es fürs Wochenziel ({PUNKTE_WOCHENZIEL}) und für gewonnene Bosskämpfe ({PUNKTE_BOSS}); in der Tabelle oben kannst du bis zu {PUNKTE_HAND_WOCHE} je Kind und Woche von Hand geben. Beim
            Anfragen werden die Punkte zurückgelegt: „Eingelöst“ verbraucht sie, „Ablehnen“ gibt sie zurück.
          </p>
        </div>
        <div className="lqt-actions">
          <button type="button" className="btn btn-secondary ui-btn" disabled={busy} onClick={() => void laden()}>
            <Icon icon={RefreshCw} />
            Neu laden
          </button>
        </div>
      </div>
      {msg && (
        <p className="lqt-error" role="alert">
          {msg}
        </p>
      )}

      <h3 className="lqt-sub">Offene Anfragen{offen.length ? ` (${offen.length})` : ''}</h3>
      {!daten ? (
        <p className="lib-empty">{msg ? '' : 'Lädt …'}</p>
      ) : offen.length ? (
        <div className="ev-table-wrap">
          <table className="ev-table lqt-table">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Gutschein</th>
                <th>Punkte</th>
                <th>Angefragt</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {offen.map((a) => (
                <tr key={a.id}>
                  <th>{name(a.kind)}</th>
                  <td>{a.name}</td>
                  <td>{a.preis}</td>
                  <td>{datum(a.erstellt)}</td>
                  <td className="lqt-row-actions">
                    <button type="button" className="btn btn-primary ui-btn is-small" disabled={busy} onClick={() => void tun((k) => anfrageErledigen(k, a.id, true))}>
                      <Icon icon={Check} />
                      Eingelöst
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ui-btn is-small"
                      disabled={busy}
                      onClick={() => window.confirm(`Anfrage von ${name(a.kind)} ablehnen? ${a.preis} Klassenpunkte gehen zurück.`) && void tun((k) => anfrageErledigen(k, a.id, false))}
                    >
                      <Icon icon={X} />
                      Ablehnen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="lqt-hint">Keine offenen Anfragen.</p>
      )}

      <h3 className="lqt-sub">Gutscheine</h3>
      {daten && (
        <>
          {daten.gutscheine.length > 0 && (
            <div className="ev-table-wrap">
              <table className="ev-table lqt-table lqt-gutscheine">
                <thead>
                  <tr>
                    <th>Gutschein</th>
                    <th>Preis</th>
                    <th>Pro Kind und Woche</th>
                    <th>Klasse pro Woche</th>
                    <th>Diese Woche</th>
                    <th>An</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {daten.gutscheine.map((g) => (
                    <GutscheinZeile key={`${g.id}:${g.name}:${g.preis}:${g.jeKind}:${g.jeKlasse}:${g.aktiv}`} g={g} busy={busy} tun={tun} klasse={klasse.id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!daten.gutscheine.length && (
            <div className="lqt-row">
              <span className="lqt-hint">Noch keine Gutscheine. Vorschläge: {VORSCHLAEGE.map((v) => v.name).join(', ')}.</span>
              <button
                type="button"
                className="btn btn-primary ui-btn is-small"
                disabled={busy}
                onClick={() =>
                  void tun(async (k) => {
                    for (const v of VORSCHLAEGE) await gutscheinSpeichern(k, klasse.id, null, { ...v, aktiv: true });
                  })
                }
              >
                <Icon icon={Plus} />
                Vorschläge übernehmen
              </button>
            </div>
          )}
          <NeuerGutschein busy={busy} tun={tun} klasse={klasse.id} />
        </>
      )}

      {erledigt.length > 0 && (
        <details className="lqt-details">
          <summary>Erledigte Anfragen der letzten 30 Tage ({erledigt.length})</summary>
          <ul className="lqt-list">
            {erledigt.map((a) => (
              <li key={a.id}>
                {datum(a.erledigt)} · {name(a.kind)} · {a.name} ({a.preis}) · {ZUSTAND[a.zustand]}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

type Tun = (f: (keys: string[]) => Promise<unknown>) => Promise<void>;

/** Number input text → number in range, or null for empty ("ohne Grenze"); undefined when invalid. */
export function grenzeAus(text: string, max: number): number | null | undefined {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
}

interface Entwurf {
  name: string;
  preis: string;
  jeKind: string;
  jeKlasse: string;
}

const ausGutschein = (g: Pick<GutscheinInfo, 'name' | 'preis' | 'jeKind' | 'jeKlasse'>): Entwurf => ({
  name: g.name,
  preis: String(g.preis),
  jeKind: g.jeKind === null ? '' : String(g.jeKind),
  jeKlasse: g.jeKlasse === null ? '' : String(g.jeKlasse),
});

/** The values to send, or null when one is not allowed (the fields say why). */
function pruefen(e: Entwurf): Pick<GutscheinInfo, 'name' | 'preis' | 'jeKind' | 'jeKlasse'> | null {
  const name = e.name.trim();
  const preis = grenzeAus(e.preis, 999);
  const jeKind = grenzeAus(e.jeKind, 20);
  const jeKlasse = grenzeAus(e.jeKlasse, 99);
  if (!name || name.length > 60 || !preis || jeKind === undefined || jeKlasse === undefined) return null;
  return { name, preis, jeKind, jeKlasse };
}

function Felder({ e, set, label }: { e: Entwurf; set: (e: Entwurf) => void; label: string }) {
  return (
    <>
      <td>
        <input className="input" value={e.name} maxLength={60} aria-label={`${label}: Name`} placeholder="z. B. Sitzplatz wählen" onChange={(x) => set({ ...e, name: x.target.value })} />
      </td>
      <td>
        <input className="input lqt-zahl" inputMode="numeric" value={e.preis} aria-label={`${label}: Preis in Klassenpunkten`} aria-invalid={!grenzeAus(e.preis, 999)} onChange={(x) => set({ ...e, preis: x.target.value })} />
      </td>
      <td>
        <input
          className="input lqt-zahl"
          inputMode="numeric"
          value={e.jeKind}
          placeholder="–"
          title="Leer = ohne Grenze (1–20)"
          aria-label={`${label}: höchstens so oft je Kind und Woche, leer = ohne Grenze`}
          aria-invalid={grenzeAus(e.jeKind, 20) === undefined}
          onChange={(x) => set({ ...e, jeKind: x.target.value })}
        />
      </td>
      <td>
        <input
          className="input lqt-zahl"
          inputMode="numeric"
          value={e.jeKlasse}
          placeholder="–"
          title="Leer = ohne Grenze (1–99)"
          aria-label={`${label}: höchstens so oft für die ganze Klasse je Woche, leer = ohne Grenze`}
          aria-invalid={grenzeAus(e.jeKlasse, 99) === undefined}
          onChange={(x) => set({ ...e, jeKlasse: x.target.value })}
        />
      </td>
    </>
  );
}

function GutscheinZeile({ g, busy, tun, klasse }: { g: GutscheinInfo; busy: boolean; tun: Tun; klasse: string }) {
  const [e, setE] = useState(() => ausGutschein(g));
  const werte = pruefen(e);
  const geaendert = JSON.stringify(e) !== JSON.stringify(ausGutschein(g));
  return (
    <tr className={g.aktiv ? '' : 'is-deleted'}>
      <Felder e={e} set={setE} label={g.name} />
      <td>{g.woche}</td>
      <td>
        <input
          type="checkbox"
          checked={g.aktiv}
          disabled={busy}
          aria-label={`${g.name}: für die Kinder sichtbar`}
          onChange={(x) => {
            const aktiv = x.target.checked;
            void tun((k) => gutscheinSpeichern(k, klasse, g.id, { ...g, aktiv }));
          }}
        />
      </td>
      <td className="lqt-row-actions">
        <button type="button" className="btn btn-primary ui-btn is-small" disabled={busy || !geaendert || !werte} onClick={() => werte && void tun((k) => gutscheinSpeichern(k, klasse, g.id, { ...werte, aktiv: g.aktiv }))}>
          Speichern
        </button>
        <button
          type="button"
          className="btn btn-secondary ui-btn is-small is-danger"
          disabled={busy}
          title={`${g.name} löschen`}
          aria-label={`${g.name} löschen`}
          onClick={() => window.confirm(`„${g.name}“ löschen? Offene Anfragen dazu geben ihre Punkte zurück.`) && void tun((k) => gutscheinLoeschen(k, g.id))}
        >
          <Icon icon={Trash2} />
        </button>
      </td>
    </tr>
  );
}

function NeuerGutschein({ busy, tun, klasse }: { busy: boolean; tun: Tun; klasse: string }) {
  const leer: Entwurf = { name: '', preis: '5', jeKind: '1', jeKlasse: '' };
  const [e, setE] = useState(leer);
  const werte = pruefen(e);
  return (
    <form
      className="lqt-gutschein-neu"
      onSubmit={(x) => {
        x.preventDefault();
        if (werte)
          void tun(async (k) => {
            await gutscheinSpeichern(k, klasse, null, { ...werte, aktiv: true });
            setE(leer);
          });
      }}
    >
      <table className="ev-table lqt-table lqt-gutscheine">
        <thead>
          <tr>
            <th>Neuer Gutschein</th>
            <th>Preis</th>
            <th>Pro Kind und Woche</th>
            <th>Klasse pro Woche</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <Felder e={e} set={setE} label="Neuer Gutschein" />
            <td>
              <button className="btn btn-primary ui-btn is-small" disabled={busy || !werte}>
                <Icon icon={Plus} />
                Anlegen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="lqt-hint">Preis 1–999 Klassenpunkte. Grenzen zählen offene und eingelöste Anfragen ab Montag; leer = ohne Grenze.</p>
    </form>
  );
}
