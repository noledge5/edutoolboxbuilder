// Form fields of the properties panel (Organic `.field` label + pill `.input`).
import { useEffect, useId, useRef, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import { Icon } from '../icons';
import type { SegOption } from '../model/blockTypes';
import { searchTopicIcons } from '../topicIcons';

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
  const icons = searchTopicIcons(query);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" type="search" placeholder="Symbol suchen, z. B. Wasser" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="icon-grid" role="radiogroup" aria-label={label}>
        {icons.map((t) => {
          const on = t.key === value;
          return (
            <button key={t.key} type="button" role="radio" aria-checked={on} aria-label={t.label} title={t.label} className={'icon-pick' + (on ? ' is-on' : '')} onClick={() => onPick(t.key)}>
              <Icon icon={t.icon} size={18} />
            </button>
          );
        })}
        {icons.length === 0 && <div className="icon-none">Kein Symbol gefunden.</div>}
      </div>
    </div>
  );
}
