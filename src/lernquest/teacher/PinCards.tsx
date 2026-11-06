// Cards to hand out: per child the QR code to Lernquest, the class code, the name and the PIN; 8 cards per A4 page,
// to cut apart. Printed like the module prints: a full-screen preview with „Drucken / PDF“.
import { ArrowLeft, Printer } from 'lucide-react';
import { Icon } from '../../icons';
import { qrCode, QrSvg } from '../../sheet/parts';
import type { KlasseInfo } from '../server';

const PER_PAGE = 8;

export function PinCards({ klasse, pins, link, onClose }: { klasse: KlasseInfo; pins: Record<string, string>; link: string; onClose(): void }) {
  const qr = qrCode(link);
  const kinder = klasse.kinder.filter((k) => !k.geloescht);
  const pages: (typeof kinder)[] = [];
  for (let i = 0; i < kinder.length; i += PER_PAGE) pages.push(kinder.slice(i, i + PER_PAGE));
  return (
    <div className="app lqt-print-app">
      <header className="topbar" data-noprint="1">
        <button type="button" className="iconbtn topbar-back" onClick={onClose} title="Zurück" aria-label="Zurück">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-name">
          <div className="topbar-title">Lernquest-Karten: {klasse.name}</div>
          <div className="topbar-place">Ausschneiden und jedem Kind seine Karte geben. Die PIN bleibt geheim.</div>
        </div>
        <button type="button" className="btn btn-primary ui-btn" onClick={() => window.print()}>
          <Icon icon={Printer} />
          Drucken / PDF
        </button>
      </header>
      <main className="lqt-print-pages">
        {pages.map((page, p) => (
          <div key={p} className="lqt-sheet">
            {page.map((k) => (
              <div key={k.id} className="lqt-pincard">
                <div className="lqt-pincard-qr">{qr && qr !== 'error' && <QrSvg qr={qr} label={`QR-Code zu Lernquest, Klasse ${klasse.name}`} />}</div>
                <div className="lqt-pincard-text">
                  <strong className="lqt-pincard-title">Lernquest</strong>
                  <span>{klasse.name}</span>
                  <span className="lqt-pincard-name">{k.name}</span>
                  <span>
                    Klassencode <b>{klasse.code}</b>
                  </span>
                  <span>
                    PIN <b className="lqt-pincard-pin">{pins[k.id] ?? '____'}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}
