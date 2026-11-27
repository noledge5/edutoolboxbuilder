// Badges (27.11.2026): a medal per badge – its symbol in a ring of bronze, silver or gold – on the hero page with the
// way to the next tier, and a banner on the result when a round reached a new tier. Counted in rules.ts.
import type { ReactElement } from 'react';
import { SymbolAufgaben, SymbolHeld, SymbolKarte, SymbolStern, SymbolStufe, SymbolTruhe, SymbolWiederholen } from '../figuren/symbole';
import { ABZEICHEN, ABZEICHEN_STUFEN, abzeichenStufe, abzeichenWerte, type Abzeichen } from '../rules';
import type { Stand, Uebung } from '../types';

/** Each badge's symbol; a perfect round is a shield: no hit taken. */
const SYMBOL: Record<Abzeichen['id'], (p: { groesse?: number }) => ReactElement> = {
  fleiss: SymbolAufgaben,
  gedaechtnis: SymbolWiederholen,
  sterne: SymbolStern,
  perfekt: SymbolHeld,
  entdecker: SymbolKarte,
  sammler: SymbolTruhe,
  aufsteiger: SymbolStufe,
};

export function Medaille({ id, stufe, groesse = 60, neu = false }: { id: Abzeichen['id']; stufe: number; groesse?: number; neu?: boolean }) {
  const S = SYMBOL[id];
  return (
    <span className={`lq-medaille s${stufe}${neu ? ' neu' : ''}`} style={{ width: groesse, height: groesse }} aria-hidden>
      <S groesse={Math.round(groesse * 0.52)} />
    </span>
  );
}

const fortschrittText = (a: Abzeichen, wert: number, ziel: number) =>
  a.id === 'aufsteiger' ? `Heldenstufe ${wert} von ${ziel}` : `${wert} von ${ziel} ${a.was}`;

/** All badges on the hero page: the tier reached and the way to the next one. */
export function AbzeichenKarte({ stand, pakete }: { stand: Stand; pakete: { stunde: string; uebungen: Uebung[] }[] }) {
  const werte = abzeichenWerte(stand, pakete);
  const geholt = ABZEICHEN.reduce((n, a) => n + abzeichenStufe(a, werte[a.id]), 0);
  return (
    <section className="lq-box lq-abzeichen" aria-labelledby="lq-abzeichen-titel">
      <div className="lq-abzeichen-kopf">
        <h2 id="lq-abzeichen-titel">Abzeichen</h2>
        <span className="lq-klein">
          {geholt} von {ABZEICHEN.length * 3}
        </span>
      </div>
      <ul>
        {ABZEICHEN.map((a) => {
          const wert = werte[a.id];
          const stufe = abzeichenStufe(a, wert);
          const ziel = a.stufen[stufe];
          const ab = stufe ? a.stufen[stufe - 1] : 0;
          return (
            <li key={a.id}>
              <Medaille id={a.id} stufe={stufe} />
              <div>
                <strong>{a.name}</strong>
                <span className={`lq-abzeichen-stufe s${stufe}`}>{stufe ? ABZEICHEN_STUFEN[stufe - 1] : 'Noch offen'}</span>
                {ziel !== undefined ? (
                  <>
                    <span className="lq-balken lq-abzeichen-balken" role="progressbar" aria-valuemin={ab} aria-valuemax={ziel} aria-valuenow={wert} aria-label={`${a.name}: ${fortschrittText(a, wert, ziel)}`}>
                      <span style={{ width: `${Math.min(100, Math.max(0, ((wert - ab) / (ziel - ab)) * 100))}%` }} />
                    </span>
                    <span className="lq-klein">{fortschrittText(a, wert, ziel)}</span>
                  </>
                ) : (
                  <span className="lq-klein">Alles geschafft!</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** On the result: each badge that reached a new tier with this round. */
export function AbzeichenNeu({ neu }: { neu: { id: Abzeichen['id']; stufe: number }[] }) {
  return (
    <>
      {neu.map(({ id, stufe }) => {
        const a = ABZEICHEN.find((x) => x.id === id)!;
        return (
          <div key={id} className="lq-aufstieg lq-abzeichen-neu" role="status">
            <Medaille id={id} stufe={stufe} groesse={56} neu />
            <div>
              <strong>Neues Abzeichen: {a.name}</strong>
              <span>
                {ABZEICHEN_STUFEN[stufe - 1]} für {a.id === 'aufsteiger' ? `Heldenstufe ${a.stufen[stufe - 1]}` : `${a.stufen[stufe - 1]} ${a.was}`}.
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
