// Editing text right on the page. The editor provides the context; without it (e.g. print) text is plain.
// A target names one text field: "<blockId>:<prop>" for blocks, "page<p>:<field>" for the header band.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';
import { typo, useSheetLang } from './lang';

export interface InlineEdit {
  /** The target being edited, if any. */
  target: string | null;
  change(target: string, value: string): void;
  done(): void;
}

export const InlineEditContext = createContext<InlineEdit | null>(null);

interface EditableProps {
  as?: ElementType;
  className?: string;
  target: string;
  value: string;
  /** Multi-line fields keep Enter for new lines; single-line fields finish on Enter. */
  multiline?: boolean;
  /** What the text looks like when not editing (defaults to the value). */
  children?: ReactNode;
}

/** A text on the page that can be edited in place. Marks itself with data-edit so the editor can start editing it. */
export function Editable({ as: Tag = 'div', className, target, value, multiline, children }: EditableProps) {
  const ctx = useContext(InlineEditContext);
  const lang = useSheetLang();
  if (ctx && ctx.target === target) {
    return (
      <Tag className={className}>
        <InlineInput value={value} lang={lang} multiline={!!multiline} onChange={(v) => ctx.change(target, v)} onDone={ctx.done} />
      </Tag>
    );
  }
  return (
    <Tag className={className} data-edit={ctx ? target : undefined}>
      {children ?? typo(value, lang)}
    </Tag>
  );
}

interface InlineInputProps {
  value: string;
  lang: string;
  multiline: boolean;
  onChange(v: string): void;
  onDone(): void;
}

function InlineInput({ value, lang, multiline, onChange, onDone }: InlineInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Grow with the text so the page layout moves exactly as it will when printed.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, []);
  const stop = (e: { stopPropagation(): void }) => e.stopPropagation();
  return (
    <textarea
      ref={ref}
      className="ws-inline"
      data-inline-input=""
      rows={1}
      lang={lang}
      spellCheck
      value={value}
      onChange={(e) => onChange(multiline ? e.target.value : e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (!multiline && e.key === 'Enter')) {
          e.preventDefault();
          onDone();
        }
      }}
      onBlur={onDone}
      // Keep drag-and-drop and block selection away from typing and text selection.
      onMouseDown={stop}
      onTouchStart={stop}
      onClick={stop}
      onDoubleClick={stop}
    />
  );
}
