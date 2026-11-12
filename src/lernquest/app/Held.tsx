// Stufe 2 „Held und Beute“ for the children (docs/design/lernquest/Held.dc.html, Truhe.dc.html): the hero with parts
// to wear, chests, the shop and the class. Coins, chests and parts come from the server only (`server.ts`); this page
// shows them and sends what the child chooses.
import { useContext, useEffect, useRef, useState } from 'react';
import { heldenstufe, ladenAb, titel } from '../rules';
import { avatarSetzen, kaufen, klasseAnsicht, lqText, truheOeffnen, type KlasseAnsicht, type TruheInhalt } from '../server';
import {
  bonusText,
  bonusVon,
  CHANCEN,
  frisurAusTeil,
  frisurTeil,
  frisurVon,
  GARANTIE,
  HAARFARBEN,
  haarfarbeVon,
  hatFrisur,
  HAUT,
  hat,
  ladenFrisuren,
  ladenWare,
  MUENDER,
  MUENZ_CHANCEN,
  mundVon,
  PREISE,
  SELTENHEITEN,
  SLOTS,
  standardTeil,
  teil,
  type Avatar,
  type Slot,
  type Teil,
} from '../teile';
import type { Stand } from '../types';
import { AvatarBild, KopfBild, TeilBild } from './avatar';
import { BilderNeuLaden, useAlleFrisuren, useAlleTeile } from './bilderKontext';
import { GutscheinLeiste } from './Gutscheine';
import type { Daten } from './speicher';
import { ton } from './ton';

/** Runs a server call for the child (sends waiting rounds first); throws on refusal or when offline. */
export type Aktion = <T>(f: (token: string) => Promise<T>) => Promise<T>;

/** Places that may be left empty; clothes, eyes and background always show something. */
const ABNEHMBAR: Slot[] = ['kopf', 'werkzeug', 'begleiter'];

const slotName = (s: Slot) => SLOTS.find((x) => x.slot === s)?.label ?? s;

// — Small pieces —

export function Muenzen({ n, label = 'Münzen' }: { n: number; label?: string }) {
  return (
    <span className="lq-muenzen" aria-label={`${n} ${label}`}>
      <MuenzIcon />
      <span aria-hidden>{n}</span>
    </span>
  );
}

/** Rarity as dots and a word, never colour alone. */
export function Seltenheit({ s, kurz = false }: { s: number; kurz?: boolean }) {
  const r = SELTENHEITEN[s];
  return (
    <span className={`lq-seltenheit lq-s-${s}`}>
      <span className="lq-punkte" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= s ? 'an' : ''} />
        ))}
      </span>
      {kurz ? r.kurz : r.name}
    </span>
  );
}

export function Herzen({ voll, von }: { voll: number; von: number }) {
  return (
    <span className="lq-herzen" role="img" aria-label={`${voll} von ${von} Herzen`}>
      {Array.from({ length: von }, (_, i) => (
        <span key={i} className={i < voll ? 'an' : ''}>
          <HerzIcon />
        </span>
      ))}
    </span>
  );
}

/** A small bar that says what went wrong, with „Nochmal“ when trying again can help. */
export function Meldung({ text, nochmal }: { text: string; nochmal?: () => void }) {
  if (!text) return null;
  return (
    <p className="lq-band" role="alert">
      <span>{text}</span>
      {nochmal && (
        <button type="button" className="lq-link" onClick={nochmal}>
          Nochmal
        </button>
      )}
    </p>
  );
}

// — The hero —

interface HeldProps {
  daten: Daten;
  aktion: Aktion;
  setStand: (s: Stand) => void;
  onTruhe: () => void;
  onLaden: () => void;
  onGutscheine: () => void;
  /** Sign out on this device (also in the menu behind the picture in the head bar). */
  onAbmelden: () => void;
}

export function HeldSeite({ daten, aktion, setStand, onTruhe, onLaden, onGutscheine, onAbmelden }: HeldProps) {
  const { stand } = daten;
  const [slot, setSlot] = useState<Slot>('kopf');
  const [msg, setMsg] = useState('');
  const letzte = useRef(0);
  const kette = useRef<Promise<unknown>>(Promise.resolve());
  const h = heldenstufe(stand.xp);
  const bonus = bonusText(bonusVon(stand.avatar));

  /** Shows the new look at once and sends it; the answer that belongs to the last tap wins, a refusal goes back. */
  const anlegen = (neu: Avatar) => {
    const vorher = stand;
    const nr = ++letzte.current;
    setMsg('');
    setStand({ ...stand, avatar: neu });
    kette.current = kette.current.then(async () => {
      try {
        const s = await aktion((t) => avatarSetzen(t, neu));
        if (nr === letzte.current) setStand(s);
      } catch (e) {
        if (nr === letzte.current) {
          setStand(vorher);
          setMsg(lqText(e));
        }
      }
    });
  };

  const alle = useAlleTeile();
  // Own hair taken out of the choice stays only for who wears it.
  // Hairstyles not to be had show only to who has them (see below).
  const frisuren = useAlleFrisuren();
  const tippen = (t: Teil) => {
    const an = stand.avatar[t.slot] ?? standardTeil(t.slot)?.id ?? '';
    if (an === t.id) {
      if (ABNEHMBAR.includes(t.slot)) anlegen({ ...stand.avatar, [t.slot]: '' });
      return;
    }
    anlegen({ ...stand.avatar, [t.slot]: t.id });
  };

  // Own parts taken out of the game show only to those who have them.
  const teile = alle.filter((t) => t.slot === slot && (!t.aus || hat(stand.inventar, t))).sort((a, b) => Number(!hat(stand.inventar, a)) - Number(!hat(stand.inventar, b)) || a.seltenheit - b.seltenheit);
  const eigene = teile.filter((t) => hat(stand.inventar, t) && !t.start).length;

  return (
    <div className="lq-held-raster">
      <div className="lq-held-links">
        <h1 className="lq-seitentitel">Dein Held</h1>
        <div className="lq-buehne">
          <AvatarBild avatar={stand.avatar} className="lq-buehne-bild" lebendig />
          <div className="lq-buehne-name">
            <strong>{daten.name}</strong>
            <span>
              Heldenstufe {h.stufe} · {titel(h.stufe)}
            </span>
          </div>
          {bonus && <span className="lq-buehne-bonus">Bonus im Spiel: {bonus}</span>}
        </div>
        <Meldung text={msg} />
        <section className="lq-truhen-leiste">
          <TruheIcon />
          <div>
            <strong>{stand.truhen ? `${stand.truhen} ${stand.truhen === 1 ? 'Truhe' : 'Truhen'} bereit` : 'Keine Truhe bereit'}</strong>
            <span className="lq-klein">Je 3 Sterne, fürs Wochenziel und den Bosssieg</span>
          </div>
          <button type="button" className="lq-knopf lq-gold" disabled={!stand.truhen} onClick={onTruhe}>
            Öffnen
          </button>
          <button type="button" className="lq-knopf lq-hell" onClick={onLaden}>
            Laden
          </button>
        </section>
        <GutscheinLeiste punkte={stand.klassenpunkte ?? 0} onOeffnen={onGutscheine} />
      </div>
      <div className="lq-held-rechts">
        <SlotTabs slot={slot} setSlot={setSlot} label="Teile" />
        <div className="lq-teile" role="tabpanel" aria-label={slotName(slot)}>
          {teile.map((t) => {
            const meins = hat(stand.inventar, t);
            const an = meins && (stand.avatar[t.slot] ?? standardTeil(t.slot)?.id ?? '') === t.id;
            if (!meins) {
              return (
                <div
                  key={t.id}
                  className="lq-teil zu"
                  aria-label={`${t.nurTruhe ? 'Truhen-Schatz, nur in Truhen zu finden' : t.nurLaden ? 'Nur im Laden' : 'Noch nicht gefunden'}, ${SELTENHEITEN[t.seltenheit].name}`}
                  role="img"
                >
                  <span className="lq-teil-bild lq-fragezeichen" aria-hidden>
                    ?
                  </span>
                  <span className="lq-teil-name" aria-hidden>
                    {t.nurTruhe ? 'Nur in Truhen' : t.nurLaden ? 'Nur im Laden' : 'Noch nicht gefunden'}
                  </span>
                  <span aria-hidden>
                    <Seltenheit s={t.seltenheit} kurz />
                  </span>
                </div>
              );
            }
            return (
              <button
                key={t.id}
                type="button"
                className={`lq-teil ${an ? 'an' : ''}`}
                aria-pressed={an}
                aria-label={`${t.name}, ${SELTENHEITEN[t.seltenheit].name}${an ? ', angelegt' : ''}`}
                onClick={() => tippen(t)}
              >
                {an && <span className="lq-angelegt">Angelegt</span>}
                <TeilBild teil={t} avatar={stand.avatar} className="lq-teil-bild" />
                <span className="lq-teil-name">{t.name}</span>
                <Seltenheit s={t.seltenheit} kurz />
                {bonusText(t) && <span className="lq-teil-bonus">{bonusText(t)}</span>}
              </button>
            );
          })}
        </div>
        {!eigene && <p className="lq-leer">Hier hast du noch nichts gefunden. Öffne Truhen oder schau in den Laden.</p>}
        <div className="lq-haut" role="radiogroup" aria-label="Hautfarbe">
          <span className="lq-klein">Hautfarbe</span>
          {HAUT.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={(stand.avatar.haut ?? 0) === i}
              aria-label={`Hautfarbe ${i + 1}`}
              className={(stand.avatar.haut ?? 0) === i ? 'an' : ''}
              style={{ background: c }}
              onClick={() => anlegen({ ...stand.avatar, haut: i })}
            />
          ))}
        </div>
        <div className="lq-frisur" role="radiogroup" aria-label="Frisur">
          <span className="lq-klein">Frisur</span>
          {frisuren.map((f) => {
            const an = frisurVon(stand.avatar) === f.id;
            const ft = frisurTeil(f);
            if (!hatFrisur(stand.inventar, f.id, stand.avatar)) {
              // Not free: found in chests or bought in the shop (out of the game: not shown).
              if (ft.aus) return null;
              const wo = ft.nurTruhe ? 'Nur in Truhen' : 'Im Laden';
              return (
                <button
                  key={f.id}
                  type="button"
                  className="zu"
                  aria-label={`${f.name}: ${wo}, ${SELTENHEITEN[ft.seltenheit].name}`}
                  disabled={ft.nurTruhe}
                  onClick={onLaden}
                >
                  <KopfBild avatar={{ ...stand.avatar, frisur: f.id }} />
                  <span>{wo}</span>
                </button>
              );
            }
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={an}
                className={an ? 'an' : ''}
                onClick={() => anlegen({ ...ohneFigur(stand.avatar), frisur: f.id })}
              >
                <KopfBild avatar={{ ...stand.avatar, frisur: f.id }} />
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>
        <div className="lq-haut" role="radiogroup" aria-label="Haarfarbe">
          <span className="lq-klein">Haarfarbe</span>
          {HAARFARBEN.map((h, i) => (
            <button
              key={h.name}
              type="button"
              role="radio"
              aria-checked={haarfarbeVon(stand.avatar) === i}
              aria-label={h.name}
              title={h.name}
              className={haarfarbeVon(stand.avatar) === i ? 'an' : ''}
              style={{ background: h.farbe }}
              onClick={() => anlegen({ ...ohneFigur(stand.avatar), frisur: frisurVon(stand.avatar), haarfarbe: i })}
            />
          ))}
        </div>
        <div className="lq-frisur" role="radiogroup" aria-label="Mund">
          <span className="lq-klein">Mund</span>
          {MUENDER.map((m) => {
            const an = mundVon(stand.avatar) === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={an}
                className={an ? 'an' : ''}
                onClick={() => anlegen({ ...stand.avatar, mund: m.id })}
              >
                <KopfBild avatar={{ ...stand.avatar, mund: m.id }} nah />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="lq-knopf lq-hell lq-abmelden" onClick={onAbmelden}>
          Abmelden
        </button>
      </div>
    </div>
  );
}

type LadenSlot = Slot | 'frisur';

function SlotTabs<S extends LadenSlot>({ slot, setSlot, label, frisur = false }: { slot: S; setSlot: (s: S) => void; label: string; frisur?: boolean }) {
  const tabs = (frisur ? [...SLOTS, { slot: 'frisur' as const, label: 'Frisur' }] : SLOTS) as { slot: S; label: string }[];
  return (
    <div className="lq-faecher lq-slots" role="tablist" aria-label={label}>
      {tabs.map((s) => (
        <button key={s.slot} type="button" role="tab" aria-selected={s.slot === slot} className={s.slot === slot ? 'an' : ''} onClick={() => setSlot(s.slot)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

// — The shop —

export function LadenSeite({ daten, aktion, setStand, onZurueck }: { daten: Daten; aktion: Aktion; setStand: (s: Stand) => void; onZurueck: () => void }) {
  const { stand } = daten;
  const [slot, setSlot] = useState<LadenSlot>('kopf');
  const [wahl, setWahl] = useState<Teil | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [gekauft, setGekauft] = useState<Teil | null>(null);
  useAlleTeile(); // own parts and the teacher's values arrive later: show them then
  // Hairstyles are parts too (`frisur-<id>`): shown as a head with that hair.
  const ware = slot === 'frisur' ? ladenFrisuren(stand.inventar).map((x) => x.t) : ladenWare(stand.inventar, slot);
  const preis = wahl ? PREISE[wahl.seltenheit] : 0;
  // Stufe D: the shop sells a rarity from a hero level on (chests give everything).
  const stufe = heldenstufe(stand.xp).stufe;

  const kauf = async () => {
    if (!wahl || busy) return;
    setBusy(true);
    setMsg('');
    try {
      setStand(await aktion((t) => kaufen(t, wahl.id)));
      ton('fertig');
      setGekauft(wahl);
      setWahl(null);
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  const anlegen = async (t: Teil) => {
    setBusy(true);
    try {
      const f = frisurAusTeil(t.id);
      setStand(await aktion((tok) => avatarSetzen(tok, f ? { ...ohneFigur(stand.avatar), frisur: f.id } : { ...stand.avatar, [t.slot]: t.id })));
      onZurueck();
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="lq-laden">
      <button type="button" className="lq-link lq-links" onClick={onZurueck}>
        ← Zum Helden
      </button>
      <h1 className="lq-seitentitel">Laden</h1>
      <p className="lq-klein">
        Münzen gibt es für jede Runde. Gekauft wird nur, was du noch nicht hast. Manche Schätze gibt es nur in Truhen. Seltene Teile
        öffnen sich mit deiner Heldenstufe.
      </p>
      <SlotTabs
        slot={slot}
        setSlot={(s) => {
          setSlot(s);
          setWahl(null);
        }}
        label="Bereiche im Laden"
        frisur
      />
      {gekauft && (
        <div className="lq-hinweis-gold" role="status">
          <strong>{gekauft.name} gehört jetzt dir!</strong>
          <button type="button" className="lq-knopf lq-gold" disabled={busy} onClick={() => void anlegen(gekauft)}>
            Gleich anlegen
          </button>
        </div>
      )}
      <Meldung text={msg} />
      <div className="lq-teile">
        {ware.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`lq-teil ${wahl?.id === t.id ? 'gewaehlt' : ''}`}
            aria-pressed={wahl?.id === t.id}
            aria-label={`${t.name}, ${SELTENHEITEN[t.seltenheit].name}, ${stufe < ladenAb(t.seltenheit) ? `ab Heldenstufe ${ladenAb(t.seltenheit)}` : `${PREISE[t.seltenheit]} Münzen`}`}
            onClick={() => {
              setGekauft(null);
              setWahl(wahl?.id === t.id ? null : t);
            }}
          >
            <WareBild teil={t} avatar={stand.avatar} />
            <span className="lq-teil-name">{t.name}</span>
            <Seltenheit s={t.seltenheit} kurz />
            {stufe < ladenAb(t.seltenheit) ? (
              <span className="lq-teil-ab">
                <SchlossIcon /> Stufe {ladenAb(t.seltenheit)}
              </span>
            ) : (
              <Muenzen n={PREISE[t.seltenheit]} />
            )}
          </button>
        ))}
      </div>
      {!ware.length && <p className="lq-leer">Hier hast du schon alles. Schau in einem anderen Bereich.</p>}
      {wahl && (
        <div className="lq-kaufleiste">
          {stufe < ladenAb(wahl.seltenheit) ? (
            <button type="button" className="lq-knopf" disabled>
              <SchlossIcon />
              Ab Heldenstufe {ladenAb(wahl.seltenheit)} · {titel(ladenAb(wahl.seltenheit))}
            </button>
          ) : stand.muenzen >= preis ? (
            <button type="button" className="lq-knopf lq-gold" disabled={busy} aria-busy={busy} onClick={() => void kauf()}>
              {busy ? 'Einen Moment …' : `${wahl.name} kaufen · ${preis} Münzen`}
            </button>
          ) : (
            <button type="button" className="lq-knopf" disabled>
              <SchlossIcon />
              Noch {preis - stand.muenzen} Münzen sammeln
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** A part's picture, or for a hairstyle the head with that hair. */
function WareBild({ teil: t, avatar, className = 'lq-teil-bild' }: { teil: Teil; avatar: Avatar; className?: string }) {
  const f = frisurAusTeil(t.id);
  if (!f) return <TeilBild teil={t} avatar={avatar} className={className} />;
  return (
    <span className={`${className} lq-frisur-bild`}>
      <KopfBild avatar={{ ...avatar, frisur: f.id }} />
    </span>
  );
}

/** The avatar without the older `figur` (the hair is now `frisur`). */
function ohneFigur(a: Avatar): Avatar {
  const { figur: _alt, ...rest } = a;
  return rest;
}

// — A chest —

const ZEIT_TRUHE = 1200;

export function TruheSeite({ daten, aktion, setStand, onFertig }: { daten: Daten; aktion: Aktion; setStand: (s: Stand) => void; onFertig: (anlegen?: boolean) => void }) {
  const { stand } = daten;
  const [phase, setPhase] = useState<'zu' | 'auf' | 'da'>('zu');
  const [inhalt, setInhalt] = useState<TruheInhalt | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [uebersprungen, setUebersprungen] = useState(false);
  const [zeitUm, setZeitUm] = useState(false);
  const sicher = stand.pech >= GARANTIE - 1;

  // The result shows when the server answered and the opening played (at most ~1.2 s) or was skipped.
  useEffect(() => {
    if (phase === 'auf' && inhalt && (zeitUm || uebersprungen)) {
      setPhase('da');
      ton(inhalt.teil && inhalt.seltenheit >= 2 ? 'fertig' : 'richtig');
    }
  }, [phase, inhalt, zeitUm, uebersprungen]);

  const oeffnen = async () => {
    setMsg('');
    setInhalt(null);
    setZeitUm(false);
    setUebersprungen(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    setPhase('auf');
    const timer = window.setTimeout(() => setZeitUm(true), ZEIT_TRUHE);
    try {
      const r = await aktion(truheOeffnen);
      setInhalt(r);
      setStand(r.stand);
    } catch (e) {
      window.clearTimeout(timer);
      setPhase('zu');
      setMsg(lqText(e));
    }
  };

  const anlegen = async () => {
    if (!inhalt) return;
    setBusy(true);
    try {
      const f = frisurAusTeil(inhalt.teil);
      const neu = teil(inhalt.teil ?? undefined);
      if (!neu && !f) return;
      setStand(await aktion((t) => avatarSetzen(t, f ? { ...ohneFigur(stand.avatar), frisur: f.id } : { ...stand.avatar, [neu!.slot]: neu!.id })));
      onFertig(true);
    } catch (e) {
      setMsg(lqText(e));
      setBusy(false);
    }
  };

  // A hairstyle from the chest shows as a part with its head picture.
  const fr = frisurAusTeil(inhalt?.teil);
  const t = inhalt?.teil ? (fr ? frisurTeil(fr) : teil(inhalt.teil)) : undefined;
  // A part made on the teacher page after this device loaded the parts: load them (and their pictures) again.
  const neuLaden = useContext(BilderNeuLaden);
  const unbekannt = !!inhalt?.teil && !t;
  useEffect(() => {
    if (unbekannt) neuLaden();
  }, [unbekannt, neuLaden]);
  const nurMuenzen = !!inhalt && !inhalt.teil;
  return (
    <main className="lq-app lq-nacht lq-truhe">
      <span className="lq-truhe-kicker">{phase === 'da' ? 'Aus deiner Truhe' : stand.truhen > 1 ? `${stand.truhen} Truhen warten` : 'Deine Truhe'}</span>
      <div
        className={`lq-truhe-buehne ${phase}`}
        onClick={() => phase === 'auf' && setUebersprungen(true)}
        aria-busy={phase === 'auf'}
        role={phase === 'auf' ? 'button' : undefined}
        aria-label={phase === 'auf' ? 'Überspringen' : undefined}
        tabIndex={phase === 'auf' ? 0 : undefined}
        onKeyDown={(e) => phase === 'auf' && (e.key === 'Enter' || e.key === ' ') && setUebersprungen(true)}
      >
        <span className="lq-truhe-glanz" aria-hidden />
        {phase === 'da' && t ? (
          <WareBild teil={t} avatar={stand.avatar} className="lq-truhe-teil" />
        ) : phase === 'da' && nurMuenzen ? (
          <MuenzHaufen />
        ) : (
          <TruheGross offen={phase === 'auf'} />
        )}
      </div>
      <div aria-live="polite" className="lq-truhe-text">
        {phase === 'auf' && <p className="lq-klein">{zeitUm ? 'Einen Moment …' : 'Tippen zum Überspringen'}</p>}
        {phase === 'da' && t && inhalt && (
          <>
            <span className={`lq-badge lq-s-${inhalt.seltenheit}`}>
              <Seltenheit s={inhalt.seltenheit} />
            </span>
            <h1>{t.name}</h1>
            <p>
              {fr ? 'Frisur' : slotName(t.slot)}
              {bonusText(t) ? ` · Bonus im Spiel: ${bonusText(t)}` : ''}
            </p>
            {inhalt.doppelt && <p className="lq-truhe-doppelt">Hast du schon – dafür bekommst du {inhalt.muenzen} Münzen.</p>}
          </>
        )}
        {phase === 'da' && nurMuenzen && inhalt && (
          <>
            <h1>{inhalt.muenzen} Münzen</h1>
            <p>Diesmal nur Münzen – damit kannst du im Laden einkaufen.</p>
          </>
        )}
        {phase === 'zu' && !stand.truhen && <p>Gerade wartet keine Truhe. Truhen gibt es für je 3 Sterne, fürs Wochenziel und den Bosssieg.</p>}
      </div>
      <Meldung text={msg} />
      {phase !== 'auf' && (
        <section className="lq-chancen" aria-label="Chancen in dieser Truhe">
          <strong>Chancen in dieser Truhe</strong>
          <div>
            <span className={nurMuenzen && phase === 'da' ? 'an' : ''}>
              <b>{MUENZ_CHANCEN.reduce((a, b) => a + b, 0)} %</b>
              <small>Münzen</small>
            </span>
            {CHANCEN.map((c, i) => (
              <span key={i} className={t && inhalt && phase === 'da' && inhalt.seltenheit === i ? 'an' : ''}>
                <b>{c} %</b>
                <small>{SELTENHEITEN[i].kurz}</small>
              </span>
            ))}
          </div>
          <span className="lq-klein">
            Doppelte Teile werden zu Münzen. {sicher && phase === 'zu' ? 'Diese Truhe hat sicher etwas Seltenes!' : `Spätestens jede ${GARANTIE}. Truhe hat etwas Seltenes.`}
          </span>
        </section>
      )}
      <div className="lq-platz" />
      {phase === 'zu' &&
        (stand.truhen ? (
          <button type="button" className="lq-knopf lq-gold" onClick={() => void oeffnen()}>
            Öffnen
          </button>
        ) : null)}
      {phase === 'da' && t && inhalt && !inhalt.doppelt && (
        <button type="button" className="lq-knopf lq-gold" disabled={busy} aria-busy={busy} onClick={() => void anlegen()}>
          {busy ? 'Einen Moment …' : 'Gleich anlegen'}
        </button>
      )}
      {phase === 'da' && stand.truhen > 0 && (
        <button type="button" className="lq-knopf lq-nacht-knopf" onClick={() => void oeffnen()}>
          Nächste Truhe öffnen
        </button>
      )}
      {phase !== 'auf' && (
        <button type="button" className="lq-knopf lq-nacht-knopf" onClick={() => onFertig()}>
          {phase === 'da' ? 'Weiter' : 'Später'}
        </button>
      )}
    </main>
  );
}

// — The class —

export function KlasseSeite({ aktion }: { aktion: Aktion }) {
  const [ansicht, setAnsicht] = useState<KlasseAnsicht | null>(null);
  const [msg, setMsg] = useState('');
  const [laedt, setLaedt] = useState(true);

  const laden = async () => {
    setLaedt(true);
    setMsg('');
    try {
      setAnsicht(await aktion(klasseAnsicht));
    } catch (e) {
      setMsg(lqText(e));
    } finally {
      setLaedt(false);
    }
  };
  useEffect(() => {
    void laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="lq-klasse">
      <h1 className="lq-seitentitel">{ansicht?.klasse ? `Klasse ${ansicht.klasse}` : 'Deine Klasse'}</h1>
      <Meldung text={msg} nochmal={() => void laden()} />
      {laedt && !ansicht && <p className="lq-klein lq-mitte">Einen Moment …</p>}
      {ansicht && (
        <>
          <div className="lq-box lq-klasse-tage">
            <strong>{ansicht.tage}</strong>
            <span>{ansicht.tage === 1 ? 'Lerntag' : 'Lerntage'} habt ihr diese Woche zusammen geschafft.</span>
          </div>
          {ansicht.kinder.length ? (
            <ul className="lq-helden">
              {ansicht.kinder.map((k, i) => (
                <li key={`${k.name}:${i}`} className={k.ich ? 'ich' : ''}>
                  <AvatarBild avatar={k.avatar} className="lq-helden-bild" />
                  <span>{k.name}</span>
                  {k.ich && <small>Du</small>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="lq-leer">In deiner Klasse ist noch niemand.</p>
          )}
        </>
      )}
    </section>
  );
}

// — Icons —

export const MuenzIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="lq-muenz-icon">
    <circle cx="12" cy="12" r="10" className="lq-muenz-voll" />
    <circle cx="12" cy="12" r="6.5" fill="none" strokeWidth="2" className="lq-muenz-ring" />
  </svg>
);
export const HerzIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.4C.9 8.2 3 4.5 6.7 4.5c2.2 0 3.7 1.2 5.3 3 1.6-1.8 3.1-3 5.3-3 3.7 0 5.8 3.7 4.3 7.1C19.5 16.4 12 21 12 21Z" />
  </svg>
);
export const TruheIcon = () => (
  <svg width="48" height="42" viewBox="0 0 52 46" aria-hidden className="lq-truhe-icon">
    <rect x="3" y="18" width="46" height="25" rx="4" fill="#8A4B1F" />
    <path d="M3 18c0-9 6-15 23-15s23 6 23 15Z" fill="#A65E2A" />
    <rect x="3" y="16" width="46" height="6" fill="#FFC531" />
    <rect x="22" y="16" width="8" height="14" rx="2" fill="#FFC531" />
  </svg>
);
/** The coins of a chest that held only coins. */
function MuenzHaufen() {
  return (
    <svg viewBox="0 0 160 140" className="lq-truhe-teil lq-muenz-haufen" aria-hidden>
      {[
        [44, 104],
        [80, 110],
        [116, 104],
        [62, 84],
        [98, 84],
        [80, 60],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x - 24} ${y - 24}) scale(2)`}>
          <circle cx="12" cy="12" r="10" className="lq-muenz-voll" />
          <circle cx="12" cy="12" r="6.5" fill="none" strokeWidth="2" className="lq-muenz-ring" />
        </g>
      ))}
    </svg>
  );
}

function TruheGross({ offen }: { offen: boolean }) {
  return (
    <svg viewBox="0 0 160 140" className={`lq-truhe-gross ${offen ? 'offen' : ''}`} role="img" aria-label={offen ? 'Die Truhe geht auf' : 'Geschlossene Truhe'}>
      <rect x="12" y="62" width="136" height="70" rx="10" fill="#8A4B1F" />
      <rect x="12" y="96" width="136" height="10" fill="#6E3A16" />
      <g className="lq-truhe-deckel">
        <path d="M12 62c0-30 18-48 68-48s68 18 68 48Z" fill="#A65E2A" />
        <rect x="12" y="54" width="136" height="14" fill="#FFC531" />
      </g>
      <rect x="68" y="54" width="24" height="40" rx="5" fill="#FFC531" />
      <circle cx="80" cy="76" r="5" fill="#5A3E00" />
    </svg>
  );
}
export const HeldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3 19 5.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5Z" />
  </svg>
);
export const KlasseIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14.5c2.4 0 4.2 1.5 4.6 4" />
  </svg>
);
export const SchlossIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
