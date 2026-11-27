// The typing field shows the number keyboard when every solution is a number (27.11.2026), and only then.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { UebungView } from './Uebungen';

const feld = (loesungen: string[]) =>
  renderToStaticMarkup(<UebungView u={{ art: 'schreiben', id: 's', frage: 'Rechne.', loesungen }} seed="s" locked={false} onChange={() => {}} />);

describe('typing field', () => {
  it('asks for the number keyboard for number answers', () => {
    expect(feld(['84'])).toContain('inputMode="decimal"');
  });
  it('keeps the letter keyboard for words', () => {
    expect(feld(['book'])).not.toContain('inputMode');
  });
});
