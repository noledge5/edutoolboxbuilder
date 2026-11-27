// The left column of a task: its number, under it the action symbol and, where set, the social form
// (src/sheet/symbols.ts). The same on the printed sheet, in the editor and in the students' digital view.
import type { ReactNode } from 'react';
import { Icon } from '../icons';
import type { Block, Lang } from '../model/types';
import { FORM_ICONS, SYMBOL_ICONS } from './symbolIcons';
import { formLabel, formOf, symbolLabel, symbolOf } from './symbols';

export function TaskRail({ block, lang, children }: { block: Block; lang: Lang; children: ReactNode }) {
  const sym = symbolOf(block);
  const form = formOf(block);
  return (
    <div className="ws-rail">
      <div className="ws-num">{children}</div>
      {sym && (
        <span className="ws-sym" role="img" aria-label={symbolLabel(sym, lang)} title={symbolLabel(sym, lang)}>
          <Icon icon={SYMBOL_ICONS[sym]} size={16} />
        </span>
      )}
      {form && (
        <span className="ws-sym is-form" role="img" aria-label={formLabel(form, lang)} title={formLabel(form, lang)}>
          <Icon icon={FORM_ICONS[form]} size={16} />
        </span>
      )}
    </div>
  );
}
