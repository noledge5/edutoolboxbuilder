// „Wiederholen sofort“ on the teacher page (wish 09.11.2026, „z. B. wegen morgen Klassenarbeit“): choose unlocked
// lessons and until when; in that time every exercise of them is due in the children's „Wiederholen“, once each, also
// those never played (rules.ts `extraFaellig`, server 20261119_lernquest_wiederholen_sofort.sql).
import { useMemo, useState } from 'react';
import { Repeat } from 'lucide-react';
import { Icon } from '../../icons';
import type { Library } from '../../library/types';
import { istExtraModul, mitExtras, regionLabel } from '../extra';
import { heute, readExtra, tagPlus } from '../rules';
import { wiederholenSetzen, type KlasseInfo } from '../server';

const DAUER = [
  { tage: 0, text: 'nur heute' },
  { tage: 1, text: 'bis morgen' },
  { tage: 2, text: 'bis übermorgen' },
  { tage: 7, text: 'eine Woche' },
];

const datum = (tag: string) => new Date(`${tag}T12:00:00Z`).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });

export function WiederholenSofort({
  lib: bib,
  klasse,
  busy,
  act,
}: {
  lib: Library;
  klasse: KlasseInfo;
  busy: boolean;
  act(f: (keys: string[]) => Promise<unknown>): Promise<void>;
}) {
  // Unlocked Extra-Pakete count as lessons here (stored under `extra-<id>`, like their packages on the server).
  const lib = useMemo(() => mitExtras(bib, klasse.stunden), [bib, klasse.stunden]);
  const jetzt = readExtra(klasse.extra);
  const tag = heute();
  const aktiv = !!jetzt && tag <= jetzt.bis;
  // Unlocked lessons by module, in the order of the library.
  const module = lib.modules
    .map((m) => ({ m, stunden: lib.lessons.filter((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)).sort((a, b) => a.number - b.number) }))
    .filter((x) => x.stunden.length)
    .sort((a, b) => a.m.subject.localeCompare(b.m.subject, 'de') || a.m.grade - b.m.grade || a.m.number - b.m.number);
  const [offen, setOffen] = useState(false);
  const [wahl, setWahl] = useState<Set<string>>(() => new Set(aktiv ? jetzt.stunden : []));
  const [dauer, setDauer] = useState(1);
  const titel = (id: string) => lib.lessons.find((l) => l.id === id)?.title ?? 'Stunde';
  const umschalten = (ids: string[], an: boolean) =>
    setWahl((w) => {
      const n = new Set(w);
      for (const id of ids) {
        if (an) n.add(id);
        else n.delete(id);
      }
      return n;
    });

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Wiederholen sofort</h2>
          <p className="lqt-hint">
            Zum Beispiel vor einer Klassenarbeit: Alle Aufgaben der gewählten Stunden sind im „Wiederholen“ der Kinder sofort dran, jede einmal, auch nie gespielte. Wie jede
            Wiederholung gibt das ein Drittel der Erfahrung und Münzen.
          </p>
          {aktiv && (
            <p className="lqt-hint" role="status">
              <b>Läuft {jetzt.ab === jetzt.bis ? `am ${datum(jetzt.ab)}` : `vom ${datum(jetzt.ab)} bis ${datum(jetzt.bis)}`}</b>: {jetzt.stunden.map(titel).join(', ')}
            </p>
          )}
        </div>
        <div className="lqt-actions">
          {aktiv && (
            <button type="button" className="btn btn-secondary ui-btn" disabled={busy} onClick={() => void act((keys) => wiederholenSetzen(keys, klasse.id, null))}>
              Beenden
            </button>
          )}
          <button type="button" className="btn btn-secondary ui-btn" disabled={busy || !module.length} onClick={() => setOffen(!offen)} aria-expanded={offen}>
            <Icon icon={Repeat} />
            {aktiv ? 'Ändern' : 'Stunden wählen'}
          </button>
        </div>
      </div>
      {!module.length && <p className="lqt-hint">Erst gibt es etwas zu wiederholen, wenn Stunden freigeschaltet sind.</p>}
      {offen && (
        <div className="lqt-wdh">
          {module.map(({ m, stunden }) => {
            const ids = stunden.map((l) => l.id);
            const alle = ids.every((id) => wahl.has(id));
            return (
              <fieldset key={m.id} className="lqt-wdh-modul">
                <legend>
                  <label>
                    <input type="checkbox" checked={alle} onChange={(e) => umschalten(ids, e.target.checked)} />
                    {istExtraModul(m.id) ? regionLabel(m) : m.title}
                  </label>
                </legend>
                {stunden.map((l) => (
                  <label key={l.id}>
                    <input type="checkbox" checked={wahl.has(l.id)} onChange={(e) => umschalten([l.id], e.target.checked)} />
                    {l.number}. {l.title}
                  </label>
                ))}
              </fieldset>
            );
          })}
          <div className="lqt-wdh-zeile">
            <select className="input" value={dauer} onChange={(e) => setDauer(Number(e.target.value))} aria-label="Wie lange">
              {DAUER.map((d) => (
                <option key={d.tage} value={d.tage}>
                  {d.text}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary ui-btn"
              disabled={busy || !wahl.size}
              onClick={() =>
                void act((keys) => wiederholenSetzen(keys, klasse.id, { ab: tag, bis: tagPlus(tag, dauer), stunden: [...wahl] })).then(() => setOffen(false))
              }
            >
              Freigeben ({wahl.size} {wahl.size === 1 ? 'Stunde' : 'Stunden'})
            </button>
          </div>
          <p className="lqt-hint">Die Kinder sehen es beim nächsten Öffnen oder Zurückkehren in Lernquest.</p>
        </div>
      )}
    </section>
  );
}
