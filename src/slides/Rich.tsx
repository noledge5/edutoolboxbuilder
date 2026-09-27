// Slide text: **bold** and {{marked}} parts, typographic quotes and line breaks.
import { Fragment } from 'react';
import type { Lang } from '../model/types';
import { typo } from '../sheet/lang';

export function Rich({ text, lang }: { text: string; lang: Lang }) {
  const lines = typo(text, lang).split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*|\{\{[^}]+\}\})/).map((part, k) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={k}>{part.slice(2, -2)}</strong>
            ) : part.startsWith('{{') && part.endsWith('}}') ? (
              <mark key={k} className="sl-mark">
                {part.slice(2, -2)}
              </mark>
            ) : (
              part
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
