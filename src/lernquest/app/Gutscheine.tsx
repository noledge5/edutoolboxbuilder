// Stufe 4 „Echte Belohnungen“ for the children: own class points (not the coins) and the class's vouchers. The child
// asks for one, the server sets the points aside, the teacher ticks it off in the Baukasten. Only the own points and
// requests are shown; other children's never.
import { useEffect, useState } from 'react';
import { gutscheinFrei, PUNKTE_BOSS, PUNKTE_WOCHENZIEL } from '../rules';
import { anfrageZurueck, anfragen, gutscheine, lqText, type AnfrageZustand, type Gutscheine } from '../server';
import type { Stand } from '../types';
import { Meldung, SchlossIcon, type Aktion } from './Held';
import type { Daten } from './speicher';
import { ton } from './ton';

const ZUSTAND: Record<AnfrageZustand, string> = {
  offen: 'Wartet auf deine Lehrkraft',
  eingeloest: 'Eingelöst',
  abgelehnt: 'Nicht angenommen – Punkte sind zurück',
  zurueck: 'Zurückgezogen – Punkte sind zurück',
};

const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
const punkteWort = (n: number) => (n === 1 ? 'Klassenpunkt' : 'Klassenpunkte');

export function Punkte({ n }: { n: number }) {
  return (
    <span className="lq-klassenpunkte" aria-label={`${n} ${punkteWort(n)}`}>
      <TicketIcon />
      <span aria-hidden>{n}</span>
    </span>
  );
}

/** The bar on the hero page: own class points and the way to the vouchers. */
export function GutscheinLeiste({ punkte, onOeffnen }: { punkte: number; onOeffnen: () => void }) {
  return (
    <section className="lq-truhen-leiste lq-gutschein-leiste">
      <TicketIcon gross />
      <div>
        <strong>
          {punkte} {punkteWort(punkte)}
        </strong>
        <span className="lq-klein">Für echte Belohnungen in der Klasse</span>
      </div>
      <button type="button" className="lq-knopf lq-hell" onClick={onOeffnen}>
        Gutscheine
      </button>
    </section>
  );
}

export function GutscheineSeite({ daten, aktion, setStand, onZurueck }: { daten: Daten; aktion: Aktion; setStand: (s: Stand) => void; onZurueck: () => void }) {
  const [g, setG] = useState<Gutscheine | null>(null);
  const [msg, setMsg] = useState('');
  const [laedt, setLaedt] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wahl, setWahl] = useState('');
  const [angefragt, setAngefragt] = useState('');
  const stand = daten.stand;

  const uebernehmen = (r: Gutscheine) => {
    setG(r);
    if (r.punkte !== stand.klassenpunkte) setStand({ ...stand, klassenpunkte: r.punkte });
  };

  const laden = async () => {
    setLaedt(true);
    setMsg('');
    try {
      uebernehmen(await aktion(gutscheine));
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setLaedt(false);
    }
  };
  useEffect(() => {
    void laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tun = async (f: (token: string) => Promise<Gutscheine>, danach?: () => void) => {
    setBusy(true);
    setMsg('');
    try {
      uebernehmen(await aktion(f));
      danach?.();
    } catch (e) {
      setMsg(lqText(e));
      // The counts may have changed meanwhile (another child, the teacher): show the current ones.
      void aktion(gutscheine).then(uebernehmen, () => {});
    } finally {
      setBusy(false);
    }
  };

  const punkte = g?.punkte ?? stand.klassenpunkte;
  const offen = g?.anfragen.filter((a) => a.zustand === 'offen').length ?? 0;
  const gewaehlt = g?.gutscheine.find((x) => x.id === wahl);
  const frei = gewaehlt ? gutscheinFrei(gewaehlt, punkte, offen) : 'ok';

  return (
    <section className="lq-laden lq-gutscheine">
      <button type="button" className="lq-link lq-links" onClick={onZurueck}>
        ← Zum Helden
      </button>
      <h1 className="lq-seitentitel">Gutscheine</h1>
      <div className="lq-box lq-punkte-box">
        <Punkte n={punkte} />
        <p className="lq-klein">
          Klassenpunkte gibt es fürs Wochenziel ({PUNKTE_WOCHENZIEL}) und für gewonnene Bosskämpfe ({PUNKTE_BOSS}), manchmal auch von deiner Lehrkraft. Münzen zählen hier nicht.
        </p>
      </div>
      <Meldung text={msg} nochmal={!g ? () => void laden() : undefined} />
      {angefragt && (
        <div className="lq-hinweis-gold" role="status">
          <strong>Angefragt: {angefragt}</strong>
          <span>Deine Lehrkraft sieht die Anfrage und löst sie in der Schule ein.</span>
        </div>
      )}
      {laedt && !g && <p className="lq-klein lq-mitte">Einen Moment …</p>}
      {g && !g.gutscheine.length && <p className="lq-leer">Deine Lehrkraft hat noch keine Gutscheine eingestellt.</p>}
      {g && g.gutscheine.length > 0 && (
        <ul className="lq-gutschein-liste">
          {g.gutscheine.map((x) => {
            const f = gutscheinFrei(x, punkte, offen);
            const grenzen = [
              x.jeKind !== null && `${x.jeKind}× pro Woche für dich`,
              x.jeKlasse !== null && `noch ${Math.max(0, x.jeKlasse - x.klasse)} für die Klasse diese Woche`,
            ].filter(Boolean);
            return (
              <li key={x.id}>
                <button
                  type="button"
                  className={`lq-gutschein ${wahl === x.id ? 'gewaehlt' : ''} ${f !== 'ok' ? 'zu' : ''}`}
                  aria-pressed={wahl === x.id}
                  onClick={() => {
                    setAngefragt('');
                    setWahl(wahl === x.id ? '' : x.id);
                  }}
                >
                  <span className="lq-gutschein-name">{x.name}</span>
                  <span className="lq-klein">{grenzen.length ? grenzen.join(' · ') : 'Ohne Grenze'}</span>
                  <Punkte n={x.preis} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {g && g.anfragen.length > 0 && (
        <div className="lq-box">
          <h2>Deine Anfragen</h2>
          <ul className="lq-anfragen">
            {g.anfragen.map((a) => (
              <li key={a.id} className={`lq-anfrage ${a.zustand}`}>
                <span>
                  <strong>{a.name}</strong>
                  <span className="lq-klein">
                    {datum(a.erstellt)} · {ZUSTAND[a.zustand]}
                  </span>
                </span>
                {a.zustand === 'offen' && (
                  <button type="button" className="lq-link" disabled={busy} onClick={() => void tun((t) => anfrageZurueck(t, a.id))}>
                    Zurückziehen
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {gewaehlt && (
        <div className="lq-kaufleiste">
          {frei === 'ok' ? (
            <button
              type="button"
              className="lq-knopf lq-gold"
              disabled={busy}
              aria-busy={busy}
              onClick={() =>
                void tun(
                  (t) => anfragen(t, gewaehlt.id),
                  () => {
                    ton('fertig');
                    setAngefragt(gewaehlt.name);
                    setWahl('');
                  },
                )
              }
            >
              {busy ? 'Einen Moment …' : `${gewaehlt.name} anfragen · ${gewaehlt.preis} ${punkteWort(gewaehlt.preis)}`}
            </button>
          ) : (
            <button type="button" className="lq-knopf" disabled>
              <SchlossIcon />
              {frei === 'punkte'
                ? `Noch ${gewaehlt.preis - punkte} ${punkteWort(gewaehlt.preis - punkte)} sammeln`
                : frei === 'voll'
                  ? 'Erst warten, bis deine Anfragen erledigt sind'
                  : 'Diese Woche nicht mehr – nächste Woche wieder'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** A ticket: the sign of class points (violet, not gold, so it is not mistaken for coins). */
export const TicketIcon = ({ gross = false }: { gross?: boolean }) => (
  <svg width={gross ? 48 : 22} height={gross ? 36 : 22} viewBox={gross ? '0 0 48 36' : '0 0 24 24'} aria-hidden className="lq-ticket-icon">
    {gross ? (
      <>
        <path d="M4 6h40v8a4 4 0 0 0 0 8v8H4v-8a4 4 0 0 0 0-8Z" className="lq-ticket-voll" />
        <path d="M30 8v20" className="lq-ticket-linie" strokeDasharray="3 3" />
        <path d="m17 12 2 4 4.5.5-3.3 3 .9 4.5-4.1-2.3-4.1 2.3.9-4.5-3.3-3L15 16Z" className="lq-ticket-stern" />
      </>
    ) : (
      <>
        <path d="M2 5h20v5a2 2 0 0 0 0 4v5H2v-5a2 2 0 0 0 0-4Z" className="lq-ticket-voll" />
        <path d="M15 7v10" className="lq-ticket-linie" strokeDasharray="2 2" />
      </>
    )}
  </svg>
);
