// „Das sitzt schon“ (27.11.2026): what the child already knows, per subject, from its exercise cards (rules.ts `wissen`).
// One of the plan's measures of success is the share of exercises that sit (docs/kritik-und-plan.md); here the child
// sees it grow. No server: the cards are in the child's Spielstand.
import { karteKey, wissen } from '../rules';
import type { Paket, Stand } from '../types';

export function WissenKarte({ pakete, leitner }: { pakete: Paket[]; leitner: Stand['leitner'] }) {
  const faecher = [...new Set(pakete.map((p) => p.fach))];
  const zeilen = faecher
    .map((fach) => {
      const karten = new Set(pakete.filter((p) => p.fach === fach).flatMap((p) => p.uebungen.map((u) => karteKey(p.stunde, u.id))));
      return { fach, ...wissen(leitner, karten) };
    })
    .filter((z) => z.sitzt + z.wird + z.ueben > 0);
  if (!zeilen.length) return null;
  const sitzt = zeilen.reduce((s, z) => s + z.sitzt, 0);
  const ueben = zeilen.reduce((s, z) => s + z.ueben, 0);
  return (
    <section className="lq-box lq-wissen" aria-labelledby="lq-wissen-titel">
      <h2 id="lq-wissen-titel">Das sitzt schon</h2>
      {zeilen.map((z) => {
        const alle = z.sitzt + z.wird + z.ueben;
        return (
          <div key={z.fach} className="lq-wissen-zeile">
            <div className="lq-wissen-kopf">
              <strong>{z.fach}</strong>
              <span>
                {z.sitzt} von {alle} {z.sitzt === 1 ? 'sitzt' : 'sitzen'}
              </span>
            </div>
            <div className="lq-wissen-balken" role="img" aria-label={`${z.fach}: ${z.sitzt} sitzen, ${z.wird} werden sicherer, ${z.ueben} noch üben`}>
              {z.sitzt > 0 && <span className="sitzt" style={{ flexGrow: z.sitzt }} />}
              {z.wird > 0 && <span className="wird" style={{ flexGrow: z.wird }} />}
              {z.ueben > 0 && <span className="ueben" style={{ flexGrow: z.ueben }} />}
            </div>
          </div>
        );
      })}
      <ul className="lq-wissen-legende" aria-hidden>
        <li className="sitzt">sitzt</li>
        <li className="wird">wird sicherer</li>
        <li className="ueben">noch üben</li>
      </ul>
      <p className="lq-klein">
        {sitzt === 0
          ? 'Wiederhole ein paar Tage, dann wandern deine Aufgaben nach oben, bis sie sitzen.'
          : ueben > 0
            ? `${sitzt} ${sitzt === 1 ? 'Aufgabe sitzt' : 'Aufgaben sitzen'} schon! Was noch schwer ist, kommt beim Wiederholen öfter.`
            : `${sitzt} ${sitzt === 1 ? 'Aufgabe sitzt' : 'Aufgaben sitzen'} schon – stark!`}
      </p>
    </section>
  );
}
