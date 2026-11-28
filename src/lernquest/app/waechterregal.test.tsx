// The shelf of beaten guards and the rule „beaten“ (28.11.2026): the server's list counts on every device, the device's
// own Meilenstein best counts too.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { waechterBesiegt } from '../karte';
import { LEERER_STAND } from '../types';
import { WaechterRegal, waechterOrte } from './Waechter';

const paket = (stunde: string, modul: string, nummer: number, fach: string, stunden = 2) => ({ stunde, fach, modul: { id: modul, nummer, titel: `Region ${modul}`, icon: '', stunden: Array.from({ length: stunden }, (_, i) => ({ nummer: i + 1, titel: '' })) } });

describe('beaten guards', () => {
  it('count from the server or from this device', () => {
    expect(waechterBesiegt('m1', ['m1'], undefined)).toBe(true);
    expect(waechterBesiegt('m1', [], 80)).toBe(true);
    expect(waechterBesiegt('m1', [], 79)).toBe(false);
    expect(waechterBesiegt('m1', undefined, undefined)).toBe(false);
  });

  it('have a place for every region of two lessons or more, by subject and number', () => {
    const orte = waechterOrte([paket('e1', 'm-en2', 2, 'Englisch'), paket('e2', 'm-en1', 1, 'Englisch'), paket('g1', 'm-geo1', 1, 'Geographie'), paket('x', 'm-klein', 3, 'Englisch', 1)]);
    expect(orte.map((o) => o.id)).toEqual(['m-en1', 'm-en2', 'm-geo1']);
    expect(orte.map((o) => o.welt)).toEqual(['wiese', 'wueste', 'wiese']);
  });

  it('show beaten guards with the region and the others waiting', () => {
    const html = renderToStaticMarkup(<WaechterRegal stand={{ ...LEERER_STAND, waechter: ['m-en1'] }} pakete={[paket('e1', 'm-en1', 1, 'Englisch'), paket('e3', 'm-en2', 2, 'Englisch')]} besteHier={{}} />);
    expect(html).toContain('1 von 2');
    expect(html).toContain('Wiesen-Wächter');
    expect(html).toContain('Region m-en1');
    expect(html).toContain('Region m-en2');
    expect(html.match(/wartet noch/g)).toHaveLength(1);
    expect(renderToStaticMarkup(<WaechterRegal stand={LEERER_STAND} pakete={[]} besteHier={{}} />)).toBe('');
  });
});
