// Badges (27.11.2026): a medal per badge – its symbol in a ring of bronze, silver or gold – on the hero page with the
// way to the next tier, and a banner on the result when a round reached a new tier. Counted in rules.ts.
import type { ReactElement } from 'react';
import { SymbolAufgaben, SymbolBurg, SymbolHeld, SymbolKarte, SymbolStern, SymbolStufe, SymbolTruhe, SymbolWiederholen } from '../figuren/symbole';
import { ABZEICHEN, ABZEICHEN_STUFEN, abzeichenStufe, abzeichenWerte, type Abzeichen } from '../rules';
import type { Stand, Uebung } from '../types';

/** Each badge's symbol; a perfect round is a shield: no hit taken. */
const SYMBOL: Record<Abzeichen['id'], (p: { groesse?: number }) => ReactElement> = {
  fleiss: SymbolAufgaben,
  gedaechtnis: SymbolWiederholen,
  sterne: SymbolStern,
  perfekt: SymbolHeld,
  entdecker: SymbolKarte,
  regionen: SymbolBurg,
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

/** The words per badge, declined as German wants them (28.11.2026: „von“ takes the dative, one region is singular):
 *  the way to the next tier and what a tier was earned for. */
const TEXT: Record<Abzeichen['id'], { weg: (w: number, z: number) => string; fuer: (z: number) => string }> = {
  fleiss: { weg: (w, z) => `${w} von ${z} Lerntagen`, fuer: (z) => `${z} Lerntage` },
  gedaechtnis: { weg: (w, z) => `${w} von ${z} Aufgaben sitzen`, fuer: (z) => `${z} Aufgaben, die sitzen` },
  sterne: { weg: (w, z) => `${w} von ${z} Sternen`, fuer: (z) => `${z} Sterne` },
  perfekt: { weg: (w, z) => `${w} von ${z} ${z === 1 ? 'perfekten Runde' : 'perfekten Runden'}`, fuer: (z) => (z === 1 ? 'die erste perfekte Runde' : `${z} perfekte Runden`) },
  entdecker: { weg: (w, z) => `${w} von ${z} Stationen mit Stern`, fuer: (z) => `${z} Stationen mit Stern` },
  regionen: { weg: (w, z) => `${w} von ${z} ${z === 1 ? 'Region' : 'Regionen'} geschafft`, fuer: (z) => (z === 1 ? 'die erste geschaffte Region' : `${z} geschaffte Regionen`) },
  sammler: { weg: (w, z) => `${w} von ${z} Teilen`, fuer: (z) => `${z} Teile` },
  aufsteiger: { weg: (w, z) => `Heldenstufe ${w} von ${z}`, fuer: (z) => `Heldenstufe ${z}` },
};
const fortschrittText = (a: Abzeichen, wert: number, ziel: number) => TEXT[a.id].weg(wert, ziel);

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
  // Several at once (28.11.2026; the first round after a new badge kind can bring three or four): one band with the
  // medals in a row, so the result stays short; what each was earned for stands on the hero page.
  if (neu.length > 1)
    return (
      <div className="lq-aufstieg lq-abzeichen-neu lq-abzeichen-mehr" role="status">
        <strong>{neu.length} neue Abzeichen!</strong>
        <ul>
          {neu.map(({ id, stufe }) => (
            <li key={id}>
              <Medaille id={id} stufe={stufe} groesse={48} neu />
              <b>{ABZEICHEN.find((x) => x.id === id)!.name}</b>
              <span>{ABZEICHEN_STUFEN[stufe - 1]}</span>
            </li>
          ))}
        </ul>
        <span className="lq-abzeichen-mehr-wo">Alle stehen bei deinem Helden.</span>
      </div>
    );
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
                {ABZEICHEN_STUFEN[stufe - 1]} für {TEXT[id].fuer(a.stufen[stufe - 1])}.
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
