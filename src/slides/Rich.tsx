// Slide text: **bold** and {{marked}} parts (as on the sheets, `inlineRuns`), typographic quotes and line breaks.
import { Fragment } from 'react';
import { inlineRuns, type Run } from '../model/text';
import type { Lang } from '../model/types';
import { typo } from '../sheet/lang';

export function Rich({ text, lang }: { text: string; lang: Lang }) {
  const lines = typo(text, lang).split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inlineRuns(line).map((r, k) => (
            <RichRun key={k} run={r} />
          ))}
        </Fragment>
      ))}
    </>
  );
}

/** A run of slide text that is already typographic: bold, marked, line breaks. */
export function RichRun({ run }: { run: Run }) {
  const text = run.text.split('\n').map((l, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {l}
    </Fragment>
  ));
  const inner = run.mark ? <mark className="sl-mark">{text}</mark> : text;
  return run.bold ? <strong>{inner}</strong> : <>{inner}</>;
}
