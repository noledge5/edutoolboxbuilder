// Search across all subjects and grades (⌘K or the magnifier in every top bar): titles and contents of modules,
// lessons, blocks and slides. With an empty field it shows the lessons opened last.
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { FileText, Presentation, Search, X } from 'lucide-react';
import { BLOCK_ICONS, Icon } from '../icons';
import { topicIcon } from '../topicIcons';
import { recentLessons } from './recent';
import { findWords, hitPlace, queryWords, searchIndex, searchLibrary, type Here, type SearchEntry, type Snippet } from './search';
import type { Library } from './types';

/** Opens the search; provided by the App, used by the magnifier buttons. */
export const SearchContext = createContext<(() => void) | null>(null);

/** The magnifier in a top bar. */
export function SearchButton() {
  const open = useContext(SearchContext);
  if (!open) return null;
  return (
    <button type="button" className="btn btn-secondary ui-btn search-btn" onClick={open} title="Suchen (⌘K)" aria-label="Suchen">
      <Icon icon={Search} />
      <span className="btn-label">Suchen</span>
    </button>
  );
}

function Marked({ text, marks }: Snippet) {
  const out = [];
  let at = 0;
  for (const [a, b] of marks) {
    if (a > at) out.push(text.slice(at, a));
    out.push(<mark key={a}>{text.slice(a, b)}</mark>);
    at = b;
  }
  out.push(text.slice(at));
  return <>{out}</>;
}

interface Row {
  entry: SearchEntry;
  snippet?: Snippet;
}

interface SearchDialogProps {
  lib: Library;
  /** Subject and grade in view: their hits come first. */
  here: Here;
  onOpen(entry: SearchEntry, query: string): void;
  onClose(): void;
}

export function SearchDialog({ lib, here, onOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const list = useRef<HTMLDivElement>(null);
  const index = useMemo(() => searchIndex(lib), [lib]);
  const words = queryWords(query);
  const { subject, grade } = here;
  const { hits, more } = useMemo(() => searchLibrary(index, query, { subject, grade }), [index, query, subject, grade]);

  // Empty field: the lessons opened last that still exist.
  const recent = useMemo<Row[]>(() => {
    const lessons = recentLessons()
      .map((id) => index.find((e) => e.kind === 'lesson' && e.lesson?.id === id))
      .filter((e): e is SearchEntry => !!e);
    return lessons.slice(0, 8).map((entry) => ({ entry }));
  }, [index]);

  const rows: Row[] = words.length ? hits : recent;
  const hereLabel = here.subject ? `${here.subject}${here.grade ? ` · Klasse ${here.grade}` : ''}` : '';
  const firstElsewhere = words.length && hereLabel ? hits.findIndex((h) => !h.here) : -1;
  const anyHere = words.length > 0 && hits.some((h) => h.here);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector(`[data-row="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = rows.length;
      if (n) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Enter' && rows[active]) {
      e.preventDefault();
      onOpen(rows[active].entry, query);
    }
  };

  const icon = (e: SearchEntry) => (e.kind === 'module' ? topicIcon(e.module.icon) : e.kind === 'block' && e.blockType ? BLOCK_ICONS[e.blockType] : e.kind === 'slide' ? Presentation : FileText);

  return (
    <div className="dialog-backdrop search-backdrop" onClick={onClose}>
      <div className="search" role="dialog" aria-modal="true" aria-label="Suchen" onClick={(e) => e.stopPropagation()}>
        <div className="search-field">
          <Icon icon={Search} size={20} />
          <input
            autoFocus
            type="search"
            enterKeyHint="go"
            placeholder="Module, Stunden, Aufgaben, Folien …"
            aria-label="Suchbegriff"
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls={listId}
            aria-activedescendant={rows.length ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <button type="button" className="iconbtn" onClick={onClose} title="Schließen (Esc)" aria-label="Suche schließen">
            <Icon icon={X} />
          </button>
        </div>
        <div className="search-list" id={listId} role="listbox" ref={list} aria-label={words.length ? 'Treffer' : 'Zuletzt geöffnet'}>
          {!words.length &&
            (recent.length ? (
              <div className="search-group">Zuletzt geöffnet</div>
            ) : (
              <p className="search-empty">Suche in allen Fächern und Klassen: Titel von Modulen und Stunden, Aufgaben, Texte und Folien.</p>
            ))}
          {words.length > 0 && hits.length === 0 && <p className="search-empty">Nichts gefunden für „{query.trim()}“.</p>}
          {anyHere && <div className="search-group">In {hereLabel}</div>}
          {rows.map((r, k) => {
            const e = r.entry;
            const title: Snippet = { text: e.title, marks: findWords(e.title, words) };
            // The piece of text with the hit, when the title alone does not show it.
            const extra = r.snippet && r.snippet.marks.length > 0 && !r.snippet.text.startsWith(e.title.replace(/…$/, '')) ? r.snippet : null;
            const planned = e.lesson && e.kind === 'lesson' && !e.lesson.doc.pages.some((p) => p.blocks.length);
            return (
              <div key={`${e.kind}:${e.blockId ?? e.slideId ?? e.lesson?.id ?? e.module.id}`}>
                {k === firstElsewhere && <div className="search-group">{anyHere ? 'Weitere Fächer und Klassen' : `Nicht in ${hereLabel}`}</div>}
                <button
                  type="button"
                  role="option"
                  id={`${listId}-${k}`}
                  data-row={k}
                  aria-selected={k === active}
                  className={'search-hit' + (k === active ? ' is-active' : '')}
                  onMouseMove={() => k !== active && setActive(k)}
                  onClick={() => onOpen(e, query)}
                >
                  <span className={'search-icon is-' + e.kind}>
                    <Icon icon={icon(e)} size={18} />
                  </span>
                  <span className="search-text">
                    <span className="search-title">
                      <Marked {...title} />
                    </span>
                    {extra && (
                      <span className="search-snippet">
                        <Marked {...extra} />
                      </span>
                    )}
                    <span className="search-place">
                      <b>{e.what}</b>
                      {planned ? ' (geplant)' : ''} · {hitPlace(e)}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
          {more > 0 && <p className="search-empty">… und {more} weitere Treffer. Ein weiteres Wort grenzt die Suche ein.</p>}
        </div>
        <div className="search-foot" aria-hidden="true">
          <span>↑↓ auswählen</span>
          <span>↵ öffnen</span>
          <span>Esc schließen</span>
        </div>
      </div>
    </div>
  );
}
