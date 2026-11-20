// Switch on the teacher page: the class's children's app in „Umbau“ or live (wish of the teacher, 20.11.2026; before,
// a constant in the app). Server 20261202_lernquest_umbau.sql; the app shows the Umbau page unless the class is live
// (`imUmbau` in rules.ts), so a class without the field counts as in Umbau.
import { Lock, Unlock } from 'lucide-react';
import { Icon } from '../../icons';
import { imUmbau } from '../rules';
import { umbauSetzen, type KlasseInfo } from '../server';

export function UmbauSchalter({ klasse, busy, act }: { klasse: KlasseInfo; busy: boolean; act(f: (keys: string[]) => Promise<unknown>): Promise<void> }) {
  const zu = imUmbau(klasse);
  return (
    <section className={`lqt-card lqt-umbau ${zu ? 'is-zu' : 'is-live'}`}>
      <div className="lqt-head">
        <div>
          <h2>Kinder-App: {zu ? 'im Umbau' : 'live'}</h2>
          <p className="lqt-hint">
            {zu
              ? 'Die Kinder dieser Klasse sehen die Umbau-Seite. Held, Sterne und Münzen bleiben gespeichert. Schalte live, wenn die Stationen neue, geprüfte Fragen haben und neu veröffentlicht sind.'
              : 'Die Kinder dieser Klasse können spielen: alle freigeschalteten Stationen mit den veröffentlichten Fragen.'}
          </p>
        </div>
        <div className="lqt-actions">
          <button
            type="button"
            className="btn btn-secondary ui-btn"
            disabled={busy}
            onClick={() => {
              if (zu && !window.confirm(`„${klasse.name}“ live schalten? Die Kinder sehen dann alle freigeschalteten Stationen.`)) return;
              void act((keys) => umbauSetzen(keys, klasse.id, !zu));
            }}
          >
            <Icon icon={zu ? Unlock : Lock} />
            {zu ? 'Live schalten' : 'Zurück in den Umbau'}
          </button>
        </div>
      </div>
    </section>
  );
}
