import type { ReactNode } from 'react';
import { Copy, File, Trash2, X } from 'lucide-react';
import { BLOCK_ICONS, Icon } from '../icons';
import { BLOCK_TYPES, SPAN_OPTIONS, type FieldDef } from '../model/blockTypes';
import { getBlock, pageLabel } from '../model/ops';
import { num, str } from '../model/text';
import { SHEET_TYPES, THEMES, VARIANT_OPTIONS, WORK_FORMS } from '../model/themes';
import type { Block, NameField, SheetType, WorkForm } from '../model/types';
import type { EditorApi } from './api';
import { AreaField, CompetenceField, IconPickerField, ImageField, NumberField, SegField, TextField } from './fields';

interface PanelProps {
  api: EditorApi;
  open: boolean;
  compact: boolean;
  onClose(): void;
}

export function PropertiesPanel({ api, open, compact, onClose }: PanelProps) {
  const { sel, doc } = api;
  const block = sel?.kind === 'block' ? getBlock(doc, sel.id) : null;
  const page = sel?.kind === 'page' ? doc.pages[sel.p] : null;
  const close = compact && (
    <button type="button" className="iconbtn panel-close" onClick={onClose} title="Schließen" aria-label="Eigenschaften schließen">
      <Icon icon={X} />
    </button>
  );

  return (
    <aside className={'panel' + (open ? ' is-open' : '')} data-noprint="1" aria-label="Eigenschaften">
      {block ? (
        <BlockProperties api={api} block={block} close={close} />
      ) : page && sel?.kind === 'page' ? (
        <PageProperties api={api} p={sel.p} close={close} />
      ) : (
        <div className="panel-intro">
          <div className="panel-title">Eigenschaften</div>
          <p className="panel-help">
            Wähle ein Element auf der Seite aus, um Inhalt und Breite zu ändern. Ein Klick auf den Kopf der Seite öffnet Titel, Blatt-Typ und Fußzeile.
          </p>
          <p className="panel-help">Texte lassen sich auch direkt auf der Seite ändern: Doppelklick, oder ein ausgewähltes Element noch einmal antippen.</p>
          <p className="panel-help">Entf löscht das ausgewählte Element, Esc hebt die Auswahl auf. Strg+D dupliziert, Pfeiltasten wählen das nächste Element, Alt+Pfeiltasten verschieben es.</p>
        </div>
      )}
    </aside>
  );
}

function PanelHead({ icon, title, close }: { icon: ReactNode; title: string; close: ReactNode }) {
  return (
    <div className="panel-head">
      <div className="panel-head-icon">{icon}</div>
      <div className="panel-title">{title}</div>
      {close}
    </div>
  );
}

function BlockProperties({ api, block, close }: { api: EditorApi; block: Block; close: ReactNode }) {
  const T = BLOCK_TYPES[block.type];
  const set = (key: string) => (v: string | number) => api.setProp(block.id, key, v);
  const field = (f: FieldDef) => {
    const v = block.props[f.key];
    switch (f.kind) {
      case 'text':
        return <TextField key={f.key} label={f.label} value={str(v)} onChange={set(f.key)} />;
      case 'area':
        return <AreaField key={f.key} label={f.label} value={str(v)} onChange={set(f.key)} />;
      case 'number':
        return <NumberField key={f.key} label={f.label} value={num(v, f.min)} min={f.min} max={f.max} onChange={set(f.key)} />;
      case 'variant':
        return <SegField key={f.key} label={f.label} value={str(v)} options={VARIANT_OPTIONS} onPick={set(f.key)} />;
      case 'seg':
        return <SegField key={f.key} label={f.label} value={str(v)} options={f.options} onPick={set(f.key)} />;
      case 'image':
        return <ImageField key={f.key} label={f.label} hasImage={!!str(v)} onFile={(file) => api.setImage(block.id, file)} onRemove={() => set(f.key)('')} />;
      case 'competence':
        return api.codeLocked ? <CompetenceField key={f.key} label={f.label} value={str(v)} competences={api.competences} onChange={set(f.key)} /> : null;
    }
  };

  return (
    <>
      <PanelHead icon={<Icon icon={BLOCK_ICONS[block.type]} size={18} />} title={T.label} close={close} />
      <div className="panel-section">
        <SegField label="Breite im 12er-Raster" value={block.span} options={SPAN_OPTIONS} onPick={(v) => api.setSpan(block.id, v)} />
        {T.fields.map(field)}
      </div>
      <div className="panel-row">
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => api.duplicateBlock(block.id)}>
          <Icon icon={Copy} />
          Duplizieren
        </button>
        <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={() => api.deleteBlock(block.id)}>
          <Icon icon={Trash2} />
          Löschen
        </button>
      </div>
    </>
  );
}

function PageProperties({ api, p, close }: { api: EditorApi; p: number; close: ReactNode }) {
  const { doc } = api;
  const pg = doc.pages[p];
  return (
    <>
      <PanelHead icon={<Icon icon={File} size={18} />} title={pageLabel(doc, p)} close={close} />
      <div className="panel-section">
        <div className="panel-section-label">Kopfband</div>
        <TextField label="Titel" value={pg.title} onChange={(title) => api.setPage(p, { title })} />
        <TextField label="Zeile über dem Titel" value={pg.kicker} onChange={(kicker) => api.setPage(p, { kicker })} />
        <SegField<SheetType> label="Blatt-Typ" value={pg.type} options={SHEET_TYPES.map((k) => ({ v: k, l: THEMES[k].label }))} onPick={(type) => api.setPage(p, { type })} />
        <SegField<WorkForm> label="Sozialform" value={pg.form} options={WORK_FORMS.map((v) => ({ v, l: v }))} onPick={(form) => api.setPage(p, { form })} />
        <SegField<NameField>
          label="Namensfeld"
          value={pg.nameField}
          options={[
            { v: 'name', l: 'Name' },
            { v: 'namen', l: 'Namen' },
            { v: 'klasse', l: 'Name + Klasse' },
            { v: 'aus', l: 'Ausblenden' },
          ]}
          onPick={(nameField) => api.setPage(p, { nameField })}
        />
      </div>
      <div className="panel-section">
        <div className="panel-section-label">{api.codeLocked ? 'Symbol · ganzes Modul' : 'Symbol · alle Seiten'}</div>
        <IconPickerField label="Themen-Symbol im Kopfband" value={doc.icon} onPick={(icon) => api.setMeta({ icon })} />
      </div>
      <div className="panel-section">
        <div className="panel-section-label">Fußband · alle Seiten</div>
        <TextField label="Fußzeile" value={doc.footer} onChange={(footer) => api.setMeta({ footer })} />
        {api.codeLocked ? (
          <div className="field">
            <label>Kürzel</label>
            <div className="panel-readonly">{doc.code}</div>
            <p className="panel-note">Kommt automatisch aus Klasse, Modul und Stunde.</p>
          </div>
        ) : (
          <TextField label="Kürzel" value={doc.code} onChange={(code) => api.setMeta({ code })} />
        )}
      </div>
      {doc.pages.length > 1 && (
        <div className="panel-row">
          <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={() => api.deletePage(p)}>
            <Icon icon={Trash2} />
            Seite löschen
          </button>
        </div>
      )}
    </>
  );
}
