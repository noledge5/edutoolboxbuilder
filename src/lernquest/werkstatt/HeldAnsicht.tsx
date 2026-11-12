// The hero builder of the workshop (Stufe E, Teil 4): put a hero together from every skin tone, hair, mouth and part
// of the catalogue and review each part on the hero, not only alone. The last chosen part gets the review form.
import { useState } from 'react';
import { FigurBild, HINTERGRUENDE, held, HELD, ITEMS } from '../figuren';
import { FRISUREN, HAARFARBEN, HAUT, MUENDER, SELTENHEITEN, TEILE } from '../teile';
import type { Slot } from '../teile';
import { Chip, Gruppe, PruefFormular } from './Bausteine';
import { pruefId } from './pruefung';
import type { Pruefung, Speicher } from './pruefung';

type Wahl = { haut: number; haarfarbe: number; frisur: string; mund: string } & Record<Slot, string>;
const START: Wahl = { haut: 0, haarfarbe: 0, frisur: 'kurz', mund: 'laecheln', kopf: '', augen: 'punktaugen', kleidung: 'tshirt', werkzeug: '', begleiter: '', hintergrund: 'wiese' };
const PLAETZE: { slot: Slot; titel: string; leer?: boolean }[] = [
  { slot: 'augen', titel: 'Augen' },
  { slot: 'kleidung', titel: 'Kleidung' },
  { slot: 'kopf', titel: 'Kopf', leer: true },
  { slot: 'werkzeug', titel: 'Werkzeug', leer: true },
  { slot: 'begleiter', titel: 'Begleiter', leer: true },
  { slot: 'hintergrund', titel: 'Hintergrund' },
];
/** What the review form is about: an item (`item--krone`) or one of the hero's own drawings (`held--frisur-zopf`). */
type Ziel = { art: Pruefung['art']; id: string; name: string };
const zielVon = (slot: Slot, id: string, name: string): Ziel =>
  slot === 'kopf' || slot === 'werkzeug' || slot === 'begleiter' ? { art: 'item', id, name } : { art: 'held', id: `${slot}-${id}`, name };
const zufall = <T,>(l: readonly T[]) => l[Math.floor(Math.random() * l.length)];

export function HeldAnsicht({ eintraege, speicher, speichern }: { eintraege: Record<string, Pruefung>; speicher: Speicher; speichern: (p: Omit<Pruefung, 'geaendert'>) => Promise<void> }) {
  const [w, setW] = useState<Wahl>(START);
  const [pose, setPose] = useState('stehen');
  const [ziel, setZiel] = useState<Ziel>({ art: 'figur', id: 'held', name: 'Held' });
  const figur = held(w);
  const items = ITEMS.filter((i) => [w.kopf, w.werkzeug, w.begleiter].includes(i.id));
  const bg = HINTERGRUENDE.find((h) => h.id === w.hintergrund);
  const setze = (neu: Partial<Wahl>, z: Ziel) => {
    setW({ ...w, ...neu });
    setZiel(z);
  };
  // Only a small mark when reviewed (a chip full of „Offen“ would be noise).
  const marke = (z: Ziel) => {
    const st = eintraege[pruefId(z.art, z.id)]?.status;
    return st && st !== 'offen' ? <span className={`ws-status ${st}`}>{st === 'passt' ? '✓' : '✎'}</span> : null;
  };
  const mischen = () =>
    setW({
      haut: Math.floor(Math.random() * HAUT.length),
      haarfarbe: Math.floor(Math.random() * HAARFARBEN.length),
      frisur: zufall(FRISUREN).id,
      mund: zufall(MUENDER).id,
      ...(Object.fromEntries(PLAETZE.map((p) => [p.slot, zufall(TEILE.filter((t) => t.slot === p.slot)).id])) as Record<Slot, string>),
    });

  return (
    <div className="ws-teile">
      <section className="ws-teile-liste" aria-label="Held zusammenstellen">
        <p className="ws-hinweis">
          Stell einen Helden zusammen, wie ein Kind es in der App tut. Was du zuletzt antippst, kannst du rechts prüfen. ✓ heißt: passt, ✎ heißt: ändern.
        </p>
        <Gruppe titel="Hautfarbe">
          {HAUT.map((_, i) => {
            const z: Ziel = { art: 'held', id: `haut-${i}`, name: `Hautfarbe ${i + 1}` };
            return (
              <Chip key={i} an={w.haut === i} onClick={() => setze({ haut: i }, z)} titel={z.name}>
                <svg width={22} height={22} viewBox="0 0 22 22" aria-hidden>
                  <circle cx={11} cy={11} r={9} fill={HAUT[i]} stroke="currentColor" strokeWidth={1.5} />
                </svg>
                {i + 1} {marke(z)}
              </Chip>
            );
          })}
        </Gruppe>
        <Gruppe titel="Frisur">
          {FRISUREN.map((f) => {
            const z: Ziel = { art: 'held', id: `frisur-${f.id}`, name: f.name };
            return (
              <Chip key={f.id} an={w.frisur === f.id} onClick={() => setze({ frisur: f.id }, z)}>
                {f.name} {marke(z)}
              </Chip>
            );
          })}
        </Gruppe>
        <Gruppe titel="Haarfarbe">
          {HAARFARBEN.map((h, i) => (
            <Chip key={h.name} an={w.haarfarbe === i} onClick={() => setze({ haarfarbe: i }, { art: 'held', id: `haarfarbe-${i}`, name: `Haarfarbe ${h.name}` })}>
              <svg width={22} height={22} viewBox="0 0 22 22" aria-hidden>
                <circle cx={11} cy={11} r={9} fill={h.farbe} stroke="currentColor" strokeWidth={1.5} />
              </svg>
              {h.name}
            </Chip>
          ))}
        </Gruppe>
        <Gruppe titel="Mund">
          {MUENDER.map((m) => {
            const z: Ziel = { art: 'held', id: `mund-${m.id}`, name: m.name };
            return (
              <Chip key={m.id} an={w.mund === m.id} onClick={() => setze({ mund: m.id }, z)}>
                {m.name} {marke(z)}
              </Chip>
            );
          })}
        </Gruppe>
        {PLAETZE.map((p) => (
          <Gruppe key={p.slot} titel={p.titel}>
            {p.leer && (
              <Chip an={w[p.slot] === ''} onClick={() => setW({ ...w, [p.slot]: '' })}>
                Ohne
              </Chip>
            )}
            {TEILE.filter((t) => t.slot === p.slot).map((t) => {
              const z = zielVon(p.slot, t.id, t.name);
              return (
                <Chip key={t.id} an={w[p.slot] === t.id} onClick={() => setze({ [p.slot]: t.id }, z)} titel={SELTENHEITEN[t.seltenheit]?.name}>
                  <span className="ws-selten" style={{ background: SELTENHEITEN[t.seltenheit]?.farbe }} aria-hidden />
                  {t.name} {marke(z)}
                </Chip>
              );
            })}
          </Gruppe>
        ))}
      </section>
      <section className="ws-teil-detail" aria-label="Vorschau">
        <div className="ws-held-karte">
          {bg && (
            <svg viewBox="0 0 240 240" aria-hidden>
              {bg.zeichnung(0)}
            </svg>
          )}
          <FigurBild figur={figur} pose={pose} items={items} breite={300} titel="Dein Held" />
        </div>
        <Gruppe titel="Pose" rechts={<Chip an={false} onClick={mischen} klein>Zufall</Chip>}>
          {Object.entries(HELD.posen).map(([id, p]) => (
            <Chip key={id} an={pose === id} onClick={() => setPose(id)} klein>
              {p.name}
            </Chip>
          ))}
        </Gruppe>
        <div className="ws-held-klein" aria-label="Kleine Größen">
          {[48, 72, 120].map((g) => (
            <FigurBild key={g} figur={figur} items={items} breite={g} lebendig={false} />
          ))}
        </div>
        <PruefFormular art={ziel.art} ziel={ziel.id} name={ziel.name} eintraege={eintraege} speicher={speicher} speichern={speichern} />
      </section>
    </div>
  );
}
