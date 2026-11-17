// Klassendorf, Stufe 1 „Dorfkasse“ on the teacher page (decided 13.11.2026, docs/idee-klassendorf.md): switch the
// village on or off per class, start the next project (building, goal in coins, an optional real reward), see the
// progress and the finished buildings; deleting a running project gives every child the donated coins back.
import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Icon } from '../../icons';
import { DORF_GEBAEUDE, gebaeudeName, SPENDE_WOCHE, ZIEL_MAX, ZIEL_MIN, zielVorschlag, type Dorf } from '../dorf';
import { DorfBild } from '../figuren/dorf';
import { dorfLehrkraft, dorfProjektLoeschen, dorfProjektStarten, dorfSchalten, lqText, type KlasseInfo } from '../server';

interface Props {
  klasse: KlasseInfo;
  keys: string[];
  busy: boolean;
  act(f: (keys: string[]) => Promise<unknown>): Promise<void>;
}

export function KlassenDorf({ klasse, keys, busy, act }: Props) {
  const [d, setD] = useState<Dorf | null>(null);
  const [msg, setMsg] = useState('');
  const kinder = klasse.kinder.filter((k) => !k.geloescht).length;
  const [gebaeude, setGebaeude] = useState('');
  const [ziel, setZiel] = useState(() => zielVorschlag(kinder));
  const [belohnung, setBelohnung] = useState('');

  const laden = useCallback(async () => {
    if (!keys.length) return;
    try {
      setD(await dorfLehrkraft(keys, klasse.id));
      setMsg('');
    } catch (e) {
      setMsg(lqText(e));
    }
  }, [keys, klasse.id]);

  useEffect(() => {
    void laden();
  }, [laden]);

  /** A change; the server answers with the village. */
  const tun = (f: (keys: string[]) => Promise<Dorf>) => act(async (k) => setD(await f(k)));

  const gebaut = new Set(d?.fertig.map((f) => f.gebaeude) ?? []);
  const frei = DORF_GEBAEUDE.filter((g) => !gebaut.has(g.id));
  const wahl = frei.find((g) => g.id === gebaeude) ?? frei[0];
  const zielOk = Number.isInteger(ziel) && ziel >= ZIEL_MIN && ziel <= ZIEL_MAX;
  const p = d?.projekt;

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Klassendorf</h2>
          <p className="lqt-hint">
            Die Kinder bauen zusammen Gebäude für ihr Dorf: Du wählst das nächste Gebäude und wie viele Münzen es braucht, die Kinder spenden im Reiter „Klasse“. Jede gespendete Münze zählt
            1,5-fach, höchstens {SPENDE_WOCHE} Münzen je Kind und Woche. Am fertigen Gebäude stehen die Namen aller, die geholfen haben, ohne Beträge.
          </p>
          {msg && <p className="lqt-hint" role="alert">{msg}</p>}
        </div>
        <div className="lqt-actions">
          <label className="lqt-hint">
            <input type="checkbox" checked={!!d?.an} disabled={busy || !d} onChange={(e) => void tun((k) => dorfSchalten(k, klasse.id, e.target.checked))} /> Dorf an
          </label>
        </div>
      </div>
      {d?.an && (
        <>
          <div className="lqt-dorf-bild">
            <DorfBild fertig={d.fertig.map((f) => f.gebaeude)} baustelle={p?.gebaeude} titel="Das Dorf der Klasse" />
          </div>
          {p ? (
            <div className="lqt-dorf-projekt">
              <p>
                <b>Im Bau: {gebaeudeName(p.gebaeude)}</b> · {p.stand} von {p.ziel} Münzen · {p.helfer === 1 ? '1 Kind hat geholfen' : `${p.helfer} Kinder haben geholfen`}
                {p.belohnung ? ` · Belohnung: ${p.belohnung}` : ''}
              </p>
              <div className="lqt-balken" role="progressbar" aria-label={`Spenden für ${gebaeudeName(p.gebaeude)}`} aria-valuemin={0} aria-valuemax={p.ziel} aria-valuenow={p.stand}>
                <span style={{ width: `${Math.min(100, (100 * p.stand) / p.ziel)}%` }} />
              </div>
              <button
                type="button"
                className="btn btn-secondary ui-btn"
                disabled={busy}
                onClick={() => {
                  if (confirm(`${gebaeudeName(p.gebaeude)} abbrechen? Jedes Kind bekommt seine gespendeten Münzen zurück.`)) void tun((k) => dorfProjektLoeschen(k, klasse.id));
                }}
              >
                <Icon icon={Trash2} />
                Abbrechen
              </button>
            </div>
          ) : wahl ? (
            <div className="lqt-filter lqt-dorf-neu">
              <select className="input" value={wahl.id} onChange={(e) => setGebaeude(e.target.value)} aria-label="Nächstes Gebäude">
                {frei.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <label className="lqt-dorf-ziel">
                Münzen{' '}
                <input className="input" type="number" min={ZIEL_MIN} max={ZIEL_MAX} step={50} value={ziel} onChange={(e) => setZiel(Math.round(Number(e.target.value)))} aria-label="Ziel in Münzen" />
              </label>
              <input className="input" value={belohnung} maxLength={80} onChange={(e) => setBelohnung(e.target.value)} placeholder="Echte Belohnung, z. B. Spielstunde (freiwillig)" aria-label="Echte Belohnung" />
              <button
                type="button"
                className="btn btn-primary ui-btn"
                disabled={busy || !zielOk}
                onClick={() =>
                  void tun((k) => dorfProjektStarten(k, klasse.id, wahl.id, ziel, belohnung)).then(() => {
                    setBelohnung('');
                    setGebaeude('');
                  })
                }
              >
                {wahl.name} bauen
              </button>
              <p className="lqt-hint">
                Vorschlag: {zielVorschlag(kinder)} Münzen ({kinder} {kinder === 1 ? 'Kind' : 'Kinder'} × 100). {!zielOk && `Erlaubt sind ${ZIEL_MIN} bis ${ZIEL_MAX}.`}
              </p>
            </div>
          ) : (
            <p className="lqt-hint">Alle Gebäude stehen. Weitere kommen in einer späteren Stufe.</p>
          )}
          {d.fertig.length > 0 && (
            <ul className="lqt-dorf-fertig">
              {d.fertig.map((f) => (
                <li key={f.gebaeude}>
                  <b>{gebaeudeName(f.gebaeude)}</b> (fertig am {new Date(`${f.fertig}T12:00:00Z`).toLocaleDateString('de-DE')}){f.belohnung ? ` · Belohnung: ${f.belohnung}` : ''} · gebaut von{' '}
                  {f.stifter.join(', ') || '–'}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
