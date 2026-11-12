// Klassen-Aufgabe der Woche on the teacher page (Stufe D, Teil 2, decided 12.11.2026): all children of the class
// collect new stars together; reached, every child with a star this week gets a chest. The goal is stars per child
// (3 unless set here, 1–20), server 20261125_lernquest_klassenaufgabe.sql.
import { KLASSEN_ZIEL_JE_KIND } from '../rules';
import { wochenzielSetzen, type KlasseInfo } from '../server';

export function KlassenAufgabe({ klasse, busy, act }: { klasse: KlasseInfo; busy: boolean; act(f: (keys: string[]) => Promise<unknown>): Promise<void> }) {
  const a = klasse.aufgabe;
  const jeKind = klasse.wochenZiel ?? KLASSEN_ZIEL_JE_KIND;
  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Klassen-Aufgabe der Woche</h2>
          <p className="lqt-hint">
            Alle Kinder sammeln von Montag bis Sonntag zusammen neue Sterne. Ist das Ziel erreicht, bekommt jedes Kind, das in der Woche einen Stern geholt hat, eine Truhe.
            Die Kinder sehen nur die Summe, keine Rangliste.
          </p>
          {a && (
            <p className="lqt-hint" role="status">
              <b>
                Diese Woche: {a.sterne} von {a.ziel} Sternen
              </b>
              {a.geschafft ? ' – geschafft!' : ''}
            </p>
          )}
        </div>
        <div className="lqt-actions">
          <label className="lqt-hint">
            Sterne je Kind{' '}
            <select
              className="input"
              value={jeKind}
              disabled={busy}
              onChange={(e) => {
                const n = Number(e.target.value);
                void act((keys) => wochenzielSetzen(keys, klasse.id, n === KLASSEN_ZIEL_JE_KIND ? null : n));
              }}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                  {n === KLASSEN_ZIEL_JE_KIND ? ' (Standard)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
