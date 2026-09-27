// Form fields of the properties panel (Organic `.field` label + pill `.input`).
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import { Icon } from '../icons';
import type { SegOption } from '../model/blockTypes';
import { searchTopicIcons, TOPIC_GROUPS, type TopicIcon } from '../topicIcons';

export function TextField({ label, value, onChange }: { label: string; value: string; onChange(v: string): void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function AreaField({ label, value, onChange }: { label: string; value: string; onChange(v: string): void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="input" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** IPA symbols that are hard to type, for vocabulary lists. */
const IPA = ['ə', 'ɪ', 'iː', 'ʊ', 'uː', 'æ', 'ʌ', 'ɑː', 'ɒ', 'ɔː', 'ɜː', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'ɪə', 'eə', 'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ŋ', 'ˈ', 'ˌ'];

/** Multi-line field with a row of IPA symbols that are inserted where the cursor is. */
export function IpaAreaField({ label, value, onChange }: { label: string; value: string; onChange(v: string): void }) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = area.current;
    if (el && caret.current !== null) {
      el.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  const insert = (sym: string) => {
    const el = area.current;
    const from = el?.selectionStart ?? value.length;
    const to = el?.selectionEnd ?? value.length;
    caret.current = from + sym.length;
    onChange(value.slice(0, from) + sym + value.slice(to));
    el?.focus();
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea ref={area} id={id} className="input" rows={6} lang="en" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="ipa-keys" aria-label="Lautschrift-Zeichen einfügen">
        {IPA.map((s) => (
          <button key={s} type="button" className="ipa-key" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** One picture per line of another field (picture grids): choose, replace or remove each. */
export function PicsField({ label, names, ids, onFile, onRemove }: { label: string; names: string[]; ids: string[]; onFile(i: number, f: File): void; onRemove(i: number): void }) {
  const input = useRef<HTMLInputElement>(null);
  const slot = useRef(0);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="pics-list">
        {names.map((n, i) => (
          <div key={i} className="pics-item">
            <span className="pics-name">{n || `Bild ${i + 1}`}</span>
            <button
              type="button"
              className="btn btn-secondary ui-btn is-small"
              onClick={() => {
                slot.current = i;
                input.current?.click();
              }}
            >
              <Icon icon={ImageUp} />
              {ids[i] ? 'Ersetzen' : 'Bild'}
            </button>
            {ids[i] && (
              <button type="button" className="iconbtn is-danger" title="Bild entfernen" aria-label="Bild entfernen" onClick={() => onRemove(i)}>
                <Icon icon={Trash2} />
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="panel-note">Ohne eigenes Bild zeigt das Feld das Emoji aus der Zeile. Bilder lassen sich auch direkt auf die Felder ziehen.</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(slot.current, f);
        }}
      />
    </div>
  );
}

/** Ready-made contents: choosing one fills several fields at once. */
export function PresetField({ label, presets, onPick }: { label: string; presets: { l: string }[]; onPick(i: number): void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="input"
        value=""
        onChange={(e) => {
          if (e.target.value !== '') onPick(Number(e.target.value));
        }}
      >
        <option value="">Vorlage wählen …</option>
        {presets.map((p, i) => (
          <option key={i} value={i}>
            {p.l}
          </option>
        ))}
      </select>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange(v: number): void;
}

/** Keeps its own text while typing, so the field can be emptied and retyped. */
export function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(String(value));
        }}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
    </div>
  );
}

interface SegFieldProps<V extends string | number | boolean> {
  label: string;
  value: V;
  options: SegOption<V>[];
  onPick(v: V): void;
}

export function SegField<V extends string | number | boolean>({ label, value, options, onPick }: SegFieldProps<V>) {
  const id = useId();
  return (
    <div className="field">
      <label id={id}>{label}</label>
      <div className="seg-pills" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => {
          const on = o.v === value;
          return (
            <button key={String(o.v)} type="button" role="radio" aria-checked={on} className={'seg-pill' + (on ? ' is-on' : '')} onClick={() => onPick(o.v)}>
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ImageField({ label, hasImage, onFile, onRemove }: { label: string; hasImage: boolean; onFile(f: File): void; onRemove(): void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="panel-row">
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => input.current?.click()}>
          <Icon icon={ImageUp} />
          {hasImage ? 'Bild ersetzen' : 'Bild wählen'}
        </button>
        {hasImage && (
          <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={onRemove}>
            <Icon icon={Trash2} />
            Entfernen
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

/** A task's competence from the module's grid. */
export function CompetenceField({ label, value, competences, onChange }: { label: string; value: string; competences: { id: string; area: string }[]; onChange(v: string): void }) {
  const id = useId();
  if (competences.length === 0) {
    return (
      <div className="field">
        <label>{label}</label>
        <p className="panel-note">Lege im Modul unter „Kompetenzraster“ Kompetenzen an, dann kannst du die Aufgabe hier verknüpfen.</p>
      </div>
    );
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">– keine –</option>
        {competences.map((c) => (
          <option key={c.id} value={c.id}>
            {c.area || 'Kompetenz ohne Namen'}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Grid of topic icons with a search field (German names and keywords). */
export function IconPickerField({ label, value, onPick }: { label: string; value: string; onPick(key: string): void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  // Without a search: the icons in their topic groups; with one: all matches in one grid.
  const groups = searching ? [{ label: '', icons: searchTopicIcons(query) }] : TOPIC_GROUPS;
  const pick = (t: TopicIcon) => {
    const on = t.key === value;
    return (
      <button key={t.key} type="button" role="radio" aria-checked={on} aria-label={t.label} title={t.label} className={'icon-pick' + (on ? ' is-on' : '')} onClick={() => onPick(t.key)}>
        <Icon icon={t.icon} size={18} />
      </button>
    );
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" type="search" placeholder="Symbol suchen, z. B. Wasser" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="icon-groups" role="radiogroup" aria-label={label}>
        {groups.map((g) => (
          <div key={g.label || 'treffer'} className="icon-group">
            {g.label && <div className="icon-group-label">{g.label}</div>}
            <div className="icon-grid">
              {g.icons.map(pick)}
              {g.icons.length === 0 && <div className="icon-none">Kein Symbol gefunden.</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
