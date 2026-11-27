// Class events on the teacher page (wish of 27.11.2026: an event like „Vokabeltest diese Woche“ in which only some
// stations are open): kind, title, first and last day, stations. While it runs the children see only these stations,
// a banner and the event's pennants on the map (src/lernquest/event.ts); the server takes only rounds of them
// (20261207_lernquest_event.sql).
import { useMemo, useState } from 'react';
import { Flag } from 'lucide-react';
import { Icon } from '../../icons';
import type { Library } from '../../library/types';
import {
  bisAnpassen,
  bisSpaetestens,
  EVENT_ARTEN,
  EVENT_REIHE,
  EVENT_VORLAUF_MAX,
  eventFehler,
  eventGeplant,
  eventLaeuft,
  eventVorschlag,
  readEvent,
  standardBis,
  TITEL_MAX,
  type EventArt,
  type KlassenEvent,
} from '../event';
import { istExtraModul, mitExtras, regionLabel } from '../extra';
import { heute, tagPlus } from '../rules';
import { eventSetzen, type KlasseInfo } from '../server';

const datum = (tag: string) => new Date(`${tag}T12:00:00Z`).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const stationen = (n: number) => `${n} ${n === 1 ? 'Station' : 'Stationen'}`;
const gleich = (a: ReadonlySet<string>, b: readonly string[]) => a.size === b.length && b.every((x) => a.has(x));

export function EventKarte({ lib: bib, klasse, busy, act }: { lib: Library; klasse: KlasseInfo; busy: boolean; act(f: (keys: string[]) => Promise<unknown>): Promise<void> }) {
  // Unlocked Extra-Pakete count as stations here (stored under `extra-<id>`, like their packages on the server).
  const lib = useMemo(() => mitExtras(bib, klasse.stunden), [bib, klasse.stunden]);
  const tag = heute();
  const ev = readEvent(klasse.event);
  const laeuft = eventLaeuft(ev, tag);
  const gilt = laeuft || eventGeplant(ev, tag) ? ev : null;
  // Unlocked lessons by module, in the order of the library.
  const module = useMemo(
    () =>
      lib.modules
        .map((m) => ({ m, stunden: lib.lessons.filter((l) => l.moduleId === m.id && klasse.stunden.includes(l.id)).sort((a, b) => a.number - b.number) }))
        .filter((x) => x.stunden.length)
        .sort((a, b) => a.m.subject.localeCompare(b.m.subject, 'de') || a.m.grade - b.m.grade || a.m.number - b.m.number),
    [lib, klasse.stunden],
  );
  const vorschlag = (a: EventArt) =>
    eventVorschlag(
      a,
      module.map((x) => ({ id: x.m.id, stunden: x.stunden.map((l) => l.id) })),
    );
  const [offen, setOffen] = useState(false);
  const [art, setArt] = useState<EventArt>('vokabeltest');
  const [titel, setTitel] = useState('');
  const [ab, setAb] = useState(tag);
  const [bis, setBis] = useState(tag);
  const [wahl, setWahl] = useState<Set<string>>(() => new Set());

  // The form starts from the event that is set, or from a Vokabeltest until Friday.
  const oeffnen = () => {
    if (offen) return setOffen(false);
    const a = gilt?.art ?? 'vokabeltest';
    setArt(a);
    setTitel(gilt?.titel ?? EVENT_ARTEN[a].titel);
    setAb(gilt && gilt.ab > tag ? gilt.ab : tag);
    setBis(gilt?.bis ?? standardBis(tag));
    setWahl(new Set(gilt ? gilt.stunden.filter((id) => klasse.stunden.includes(id)) : vorschlag(a)));
    setOffen(true);
  };
  // Another kind brings its title and its stations, unless the teacher changed them already.
  const waehleArt = (a: EventArt) => {
    if (!titel.trim() || titel === EVENT_ARTEN[art].titel) setTitel(EVENT_ARTEN[a].titel);
    if (gleich(wahl, vorschlag(art))) setWahl(new Set(vorschlag(a)));
    setArt(a);
  };
  const setzeAb = (v: string) => {
    setAb(v);
    setBis((b) => bisAnpassen(v, b));
  };
  // The form closes only once the server took it; on an error (shown at the top of the page) the choice stays.
  const speichern = async (e: KlassenEvent | null) => {
    let ok = false;
    await act(async (keys) => {
      await eventSetzen(keys, klasse.id, e);
      ok = true;
    });
    if (ok) setOffen(false);
  };
  const umschalten = (ids: string[], an: boolean) =>
    setWahl((w) => {
      const n = new Set(w);
      for (const id of ids) {
        if (an) n.add(id);
        else n.delete(id);
      }
      return n;
    });
  const neu: KlassenEvent = { art, titel: titel.trim(), ab, bis, stunden: [...wahl].filter((id) => klasse.stunden.includes(id)) };
  const fehler = eventFehler(neu, tag);
  const hinweis =
    art === 'vokabeltest' && !vorschlag('vokabeltest').length ? 'Noch ist keine Station aus dem Wortschatz-Wald freigeschaltet: Wähle die Stunden mit den Vokabeln.' : EVENT_ARTEN[art].hinweis;

  return (
    <section className="lqt-card">
      <div className="lqt-head">
        <div>
          <h2>Event</h2>
          <p className="lqt-hint">
            Zum Beispiel „Vokabeltest diese Woche“: Solange das Event läuft, sehen die Kinder auf der Karte nur seine Stationen, dazu ein Banner und Wimpel. Alles andere ist so lange ausgeblendet;
            „Wiederholen“ nimmt nur Aufgaben dieser Stationen.
          </p>
          {gilt && (
            <p className="lqt-hint" role="status">
              <b>{laeuft ? `Läuft bis ${datum(gilt.bis)}` : `Geplant von ${datum(gilt.ab)} bis ${datum(gilt.bis)}`}</b>: „{gilt.titel}“ mit {stationen(gilt.stunden.length)}.
            </p>
          )}
        </div>
        <div className="lqt-actions">
          {gilt && (
            <button type="button" className="btn btn-secondary ui-btn" disabled={busy} onClick={() => void speichern(null)}>
              {laeuft ? 'Beenden' : 'Absagen'}
            </button>
          )}
          <button type="button" className="btn btn-secondary ui-btn" disabled={busy || !module.length} onClick={oeffnen} aria-expanded={offen}>
            <Icon icon={Flag} />
            {gilt ? 'Ändern' : 'Event planen'}
          </button>
        </div>
      </div>
      {!module.length && <p className="lqt-hint">Ein Event braucht freigeschaltete Stunden.</p>}
      {offen && (
        <div className="lqt-wdh">
          <div className="seg-pills" role="radiogroup" aria-label="Art des Events">
            {EVENT_REIHE.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={art === a} className={'seg-pill' + (art === a ? ' is-on' : '')} onClick={() => waehleArt(a)}>
                {EVENT_ARTEN[a].name}
              </button>
            ))}
          </div>
          <p className="lqt-hint">{hinweis}</p>
          <div className="lqt-wdh-zeile">
            <label className="lqt-event-feld lqt-event-titel">
              Titel
              <input className="input" value={titel} maxLength={TITEL_MAX} onChange={(e) => setTitel(e.target.value)} placeholder="Vokabeltest diese Woche" />
            </label>
            <label className="lqt-event-feld">
              Erster Tag
              <input type="date" className="input" value={ab} min={tag} max={tagPlus(tag, EVENT_VORLAUF_MAX)} onChange={(e) => setzeAb(e.target.value)} />
            </label>
            <label className="lqt-event-feld">
              Letzter Tag
              <input type="date" className="input" value={bis} min={ab} max={bisSpaetestens(ab) || undefined} onChange={(e) => setBis(e.target.value)} />
            </label>
          </div>
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
            <button type="button" className="btn btn-primary ui-btn" disabled={busy || !!fehler} onClick={() => void speichern(neu)}>
              {gilt ? 'Speichern' : ab > tag ? 'Event planen' : 'Event starten'} ({stationen(neu.stunden.length)})
            </button>
            {fehler && <span className="lqt-hint">{fehler}</span>}
          </div>
          <p className="lqt-hint">Die Kinder sehen es beim nächsten Öffnen oder Zurückkehren in Lernquest. Runden anderer Stationen nimmt der Server so lange nicht an.</p>
        </div>
      )}
    </section>
  );
}
