import { describe, expect, it } from 'vitest';
import { seeded } from '../model/language';
import { bossFragen, bossVon, BOSSE, fragenAus, OPTIONEN_MAX } from './boss';
import { BOSS_FRAGEN, BOSS_LP_JE, bossLp, bossSchaden, bossTrifft } from './rules';
import { PAKET_FORMAT, type Paket, type Uebung } from './types';

const paket = (stunde: string, uebungen: Uebung[]): Paket => ({
  format: PAKET_FORMAT,
  v: 1,
  stunde,
  nummer: 1,
  titel: 'S',
  modul: { id: 'm', nummer: 1, titel: 'M', icon: '' },
  fach: 'Erdkunde',
  lang: 'de',
  uebungen,
});

describe('Bosskampf: Fragen aus den Übungen', () => {
  it('nimmt Antippen mit einer richtigen Antwort, höchstens vier Antworten', () => {
    const [f] = fragenAus({ art: 'waehlen', id: 'a', frage: 'Was ist rot?', optionen: ['Gras', 'Tomate', 'Himmel'], richtig: [1] });
    expect(f).toEqual({ frage: 'Was ist rot?', aussage: '', optionen: ['Gras', 'Tomate', 'Himmel'], richtig: 1 });
    const [g] = fragenAus({ art: 'waehlen', id: 'b', frage: 'F', optionen: ['a', 'b', 'c', 'd', 'e', 'f'], richtig: [4] });
    expect(g.optionen).toHaveLength(OPTIONEN_MAX);
    expect(g.optionen[g.richtig]).toBe('e');
    expect(fragenAus({ art: 'waehlen', id: 'c', frage: 'F', optionen: ['a', 'b', 'c'], richtig: [0, 2] })).toEqual([]);
  });

  it('macht Richtig/Falsch, Paare und eine Lücke zu Fragen, Satzbau nicht', () => {
    expect(fragenAus({ art: 'richtigfalsch', id: 'r', frage: 'Stimmt das?', aussage: 'Der Äquator ist ein Breitenkreis.', richtig: true })).toEqual([
      { frage: 'Stimmt das?', aussage: 'Der Äquator ist ein Breitenkreis.', optionen: ['richtig', 'falsch'], richtig: 0 },
    ]);
    const paare = fragenAus({ art: 'paare', id: 'p', frage: 'Finde die Paare.', paare: [['Berlin', 'Deutschland'], ['Paris', 'Frankreich'], ['Rom', 'Italien']] });
    expect(paare).toHaveLength(3);
    expect(paare[1].aussage).toBe('Paris');
    expect(paare[1].optionen[paare[1].richtig]).toBe('Frankreich');
    expect(paare[1].optionen).toHaveLength(3);
    const [l] = fragenAus({ art: 'luecke', id: 'l', frage: 'Ergänze.', teile: ['Die Erde ist ', 'rund', '.'], kacheln: ['eckig', 'rund', 'flach'] });
    expect(l.aussage).toBe('Die Erde ist ___.');
    expect(l.optionen[l.richtig]).toBe('rund');
    expect(fragenAus({ art: 'luecke', id: 'l2', frage: 'E', teile: ['a ', 'b', ' c ', 'd', ''], kacheln: ['b', 'd'] })).toEqual([]);
    expect(fragenAus({ art: 'reihenfolge', id: 'w', frage: 'F', hinweis: '', kacheln: ['a', 'b'], loesung: 'a b' })).toEqual([]);
  });

  it('mischt je Kampf anders und nimmt höchstens zehn', () => {
    const viele: Uebung[] = Array.from({ length: 30 }, (_, i) => ({ art: 'richtigfalsch', id: `u${i}`, frage: 'F', aussage: `A${i}`, richtig: i % 2 === 0 }));
    const p = [paket('s1', viele.slice(0, 15)), paket('s2', viele.slice(15))];
    const a = bossFragen(p, 'eins');
    expect(a).toHaveLength(BOSS_FRAGEN);
    expect(bossFragen(p, 'eins')).toEqual(a);
    expect(bossFragen(p, 'zwei').map((f) => f.aussage)).not.toEqual(a.map((f) => f.aussage));
    for (const f of a) expect(f.richtig).toBeLessThan(f.optionen.length);
  });

  it('gibt jeder Region einen Boss', () => {
    expect(BOSSE[bossVon(1)]).toBeTruthy();
    expect(BOSSE[bossVon(-4)]).toBeTruthy();
    expect(bossVon(1)).not.toBe(bossVon(2));
  });
});

describe('Bosskampf: Regeln (gleich in lq_boss_antworten und lq_boss_ticken)', () => {
  it('Schaden: 10 bis 20 nach Tempo, ab drei richtig in Folge doppelt', () => {
    expect(bossSchaden(0, 1)).toBe(20);
    expect(bossSchaden(10_000, 1)).toBe(15);
    expect(bossSchaden(20_000, 2)).toBe(10);
    expect(bossSchaden(25_000, 1)).toBe(10);
    expect(bossSchaden(10_000, 3)).toBe(30);
    expect(bossSchaden(-50, 4)).toBe(40);
  });

  it('Schaden-Bonus der Ausrüstung kommt vor dem Verdoppeln dazu', () => {
    expect(bossSchaden(10_000, 1, 3)).toBe(18);
    expect(bossSchaden(10_000, 3, 2)).toBe(34);
    expect(bossSchaden(10_000, 1, 0)).toBe(15);
  });

  it('Lebenspunkte: mit etwa 70 % richtig gewinnt die Klasse, mit 60 % nicht', () => {
    expect(bossLp(26, 10)).toBe(26 * 10 * BOSS_LP_JE);
    expect(bossLp(0, 10)).toBe(1);
    // 26 children answer at middle speed, each answer right with chance p (seeded); averaged over many classes.
    const spiel = (p: number, bonus = 0) => {
      const zufall = seeded(`lp${p}`);
      let schaden = 0;
      for (let k = 0; k < 26 * 200; k++) {
        let serie = 0;
        for (let f = 0; f < 10; f++) {
          const richtig = zufall() < p;
          serie = richtig ? serie + 1 : 0;
          if (richtig) schaden += bossSchaden(10_000, serie, bonus);
        }
      }
      return schaden / 200 >= bossLp(26, 10);
    };
    expect(spiel(0.7)).toBe(true);
    expect(spiel(0.6)).toBe(false);
    // Even if every child wore +1 damage, 60 % would still not be enough.
    expect(spiel(0.6, 1)).toBe(false);
  });

  it('Herz weg, wenn weniger als die Hälfte richtig liegt', () => {
    expect(bossTrifft(12, 26)).toBe(true);
    expect(bossTrifft(13, 26)).toBe(false);
    expect(bossTrifft(0, 0)).toBe(false);
  });
});
