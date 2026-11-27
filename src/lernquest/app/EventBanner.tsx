// The banner of a running class event over the map (src/lernquest/event.ts, wish of 27.11.2026): pennants in the
// event's colours, its title, how long it still runs and how many of its stations the child has done.
import { eventNoch, type KlassenEvent } from '../event';
import { EVENT_FARBEN, Wimpelkette } from '../figuren/fest';

const stationen = (n: number) => `${n} ${n === 1 ? 'Station' : 'Stationen'}`;

export function EventBanner({ event, tag, geschafft, gesamt }: { event: KlassenEvent; tag: string; geschafft: number; gesamt: number }) {
  const anteil = gesamt ? Math.round((100 * geschafft) / gesamt) : 0;
  return (
    <section className="lq-event-banner" aria-labelledby="lq-event-titel">
      <svg viewBox="0 0 480 40" preserveAspectRatio="xMidYMin slice" aria-hidden focusable="false">
        <Wimpelkette breite={480} y={-2} durchhang={6} tiefe={22} farben={EVENT_FARBEN[event.art]} />
      </svg>
      <h2 id="lq-event-titel">{event.titel}</h2>
      <p>{eventNoch(event, tag)} Auf der Karte sind nur die Stationen dafür.</p>
      {gesamt > 0 && (
        <div className="lq-event-stand">
          <span className="lq-balken" role="progressbar" aria-label="Geschaffte Stationen" aria-valuemin={0} aria-valuemax={gesamt} aria-valuenow={geschafft}>
            <span style={{ width: `${anteil}%` }} />
          </span>
          <span>{geschafft >= gesamt ? (gesamt === 1 ? 'Station geschafft!' : `Alle ${gesamt} Stationen geschafft!`) : `${geschafft} von ${stationen(gesamt)} geschafft`}</span>
        </div>
      )}
    </section>
  );
}
