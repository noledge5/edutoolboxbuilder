// Kartenfrage on a Quiz slide while presenting: the children hold up their answer cards (src/lernquest/karten), this
// device's camera reads them. Cards are counted without names (a card is a number); nothing is stored. While cards
// are read, the slide shows no numbers per box, only which cards were read (so a child can put its card down);
// „Auflösen“ shows the cards per box. Presenter.tsx holds the answers, so they go when the slide changes.
import { Camera, CameraOff, Check, RotateCcw, X } from 'lucide-react';
import { Icon } from '../icons';
import { ANTWORTEN, type Antwort } from '../lernquest/karten/code';
import { useKartenScan } from '../lernquest/karten/useKartenScan';
import { cardsIn, type CardAnswers } from './tools';

export interface CardRound {
  /** The camera is on. */
  scan: boolean;
  answers: CardAnswers;
  /** Resolved: the slide shows the cards per box. */
  shown: boolean;
}

export const NEW_ROUND: CardRound = { scan: true, answers: {}, shown: false };

interface Props {
  round: CardRound;
  /** Boxes on the slide (cards count for A–D only). */
  boxes: number;
  set(change: (r: CardRound) => CardRound): void;
  onClose(): void;
  /** In the Referentenansicht the class does not see this panel: list the cards read here too. */
  listCards: boolean;
}

export function CardScan({ round, boxes, set, onClose, listCards }: Props) {
  const scan = useKartenScan(round.scan && !round.shown, (n: number, a: Antwort) => {
    const i = ANTWORTEN.indexOf(a);
    set((r) => (r.shown || r.answers[n] === i ? r : { ...r, answers: { ...r.answers, [n]: i } }));
  });
  const read = cardsIn(round.answers, boxes);
  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();
  const again = () => {
    scan.neu();
    set(() => NEW_ROUND);
  };
  return (
    <div className="sl-cardscan" role="region" aria-label="Antwortkarten scannen" onClick={stop} onPointerDown={stop} onTouchStart={stop} onTouchEnd={stop}>
      <div className="sl-cardscan-head">
        <b>Antwortkarten</b>
        <span className="sl-cardscan-count">
          {read.length} {read.length === 1 ? 'Karte' : 'Karten'}
        </span>
        <button type="button" className="iconbtn" onClick={onClose} title="Scannen beenden" aria-label="Scannen beenden">
          <Icon icon={X} size={16} />
        </button>
      </div>
      {round.scan && !round.shown ? (
        <div className="sl-cardscan-video">
          <video ref={scan.video} playsInline muted />
          {scan.bild && (
            <svg viewBox={`0 0 ${scan.bild.w} ${scan.bild.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              {scan.bild.treffer.map((t) => (
                <polygon key={t.nummer} points={t.ecken.map((p) => p.join(',')).join(' ')} />
              ))}
            </svg>
          )}
        </div>
      ) : (
        <p className="sl-cardscan-note">{round.shown ? 'Aufgelöst: Die Folie zeigt die Karten je Antwort.' : 'Die Kinder halten ihre Karten hoch, die gewählte Antwort oben.'}</p>
      )}
      {scan.fehler && (
        <p className="sl-cardscan-error" role="alert">
          {scan.fehler}
        </p>
      )}
      {boxes > 4 && <p className="sl-cardscan-note">Die Karten kennen nur A–D.</p>}
      {listCards && read.length > 0 && (
        <p className="sl-cardscan-cards" aria-label="Erkannte Karten">
          {read.join(' · ')}
        </p>
      )}
      <div className="sl-cardscan-row">
        {!round.shown ? (
          <>
            <button type="button" className="sl-pill" onClick={() => set((r) => ({ ...r, scan: !r.scan }))}>
              <Icon icon={round.scan ? CameraOff : Camera} size={16} />
              {round.scan ? 'Anhalten' : 'Scannen'}
            </button>
            <button type="button" className="sl-pill is-main" onClick={() => set((r) => ({ ...r, shown: true, scan: false }))} disabled={!read.length}>
              <Icon icon={Check} size={16} />
              Auflösen
            </button>
          </>
        ) : (
          <button type="button" className="sl-pill" onClick={again}>
            <Icon icon={RotateCcw} size={16} />
            Noch einmal
          </button>
        )}
      </div>
    </div>
  );
}

/** On the slide for the class while cards are read: which cards are in, without their answers. */
export function CardStrip({ round, boxes }: { round: CardRound; boxes: number }) {
  if (round.shown) return null;
  const read = cardsIn(round.answers, boxes);
  return (
    <div className="sl-cardstrip" aria-live="polite">
      <b>{read.length ? `${read.length} ${read.length === 1 ? 'Karte' : 'Karten'}:` : 'Karten hochhalten'}</b>
      {read.map((n) => (
        <span key={n}>{n}</span>
      ))}
    </div>
  );
}
