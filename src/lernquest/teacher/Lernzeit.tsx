// Learning time per day on the teacher page (decided 17.11.2026: children sat for hours collecting coins). Counted is
// the time in rounds; when it is over, no round starts until tomorrow (hero and class stay open). Server
// 20261201_lernquest_lernzeit.sql; standard ZEIT_LIMIT_STANDARD minutes.
import { ZEIT_LIMIT_STANDARD } from '../rules';
import { zeitlimitSetzen, type KlasseInfo } from '../server';

const MINUTEN = [15, 20, 30, 45, 60, 90, 120];

export function Lernzeit({ klasse, busy, act }: { klasse: KlasseInfo; busy: boolean; act(f: (keys: string[]) => Promise<unknown>): Promise<void> }) {
  // Before the migration the class list has no limit: the standard applies.
  const limit = klasse.zeitLimit === undefined ? ZEIT_LIMIT_STANDARD : klasse.zeitLimit;
  const werte = limit != null && !MINUTEN.includes(limit) ? [...MINUTEN, limit].sort((a, b) => a - b) : MINUTEN;
  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Lernzeit am Tag</h2>
          <p className="lqt-hint">
            Gezählt wird die Zeit in Runden, über alle Geräte eines Kindes. Ist sie um, startet bis morgen keine Runde mehr; Held und Klasse bleiben offen. Der Bosskampf in der Klasse zählt nicht.
            Eine schon geschaffte Station gibt beim Wiederholen nur 1 Münze und 2 Erfahrung, damit sich stundenlanges Sammeln nicht lohnt.
          </p>
        </div>
        <div className="lqt-actions">
          <label className="lqt-hint">
            Je Kind und Tag{' '}
            <select
              className="input"
              value={limit ?? 'aus'}
              disabled={busy}
              onChange={(e) => {
                const v = e.target.value === 'aus' ? null : Number(e.target.value);
                void act((keys) => zeitlimitSetzen(keys, klasse.id, v));
              }}
            >
              {werte.map((n) => (
                <option key={n} value={n}>
                  {n} Minuten{n === ZEIT_LIMIT_STANDARD ? ' (Standard)' : ''}
                </option>
              ))}
              <option value="aus">ohne Grenze</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
