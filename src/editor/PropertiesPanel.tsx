import { useState, type ReactNode } from 'react';
import { ClipboardCopy, Copy, File, ListChecks, Send, Sparkles, Trash2, X } from 'lucide-react';
import { BlockAiDialog } from '../ai/BlockAiDialog';
import { HELPERS, isLevelHelper, type HelperKind } from '../ai/helpers';
import { BLOCK_ICONS, Icon } from '../icons';
import { BLOCK_TYPES, SPAN_OPTIONS, type FieldDef } from '../model/blockTypes';
import { blocksOf, frontOf, getBlock, pageLabel } from '../model/ops';
import { num, str } from '../model/text';
import { SHEET_TYPES, THEMES, VARIANT_OPTIONS, WORK_FORMS } from '../model/themes';
import type { Block, Lang, NameField, SheetType, WorkForm } from '../model/types';
import type { EditorApi } from './api';
import { AreaField, CompetenceField, IconPickerField, ImageField, IpaAreaField, NumberField, PicsField, PresetField, SegField, TextField } from './fields';
import { ImageSearchDialog, queryFromCaption } from './ImageSearchDialog';

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
      ) : sel?.kind === 'blocks' ? (
        <div className="panel-section">
          <PanelHead icon={<Icon icon={ListChecks} />} title={`${sel.ids.length} Bausteine ausgewählt`} close={close} />
          <ul className="panel-list">
            {blocksOf(doc, sel.ids).map((b) => (
              <li key={b.id}>
                <Icon icon={BLOCK_ICONS[b.type]} size={16} />
                {BLOCK_TYPES[b.type].label}
              </li>
            ))}
          </ul>
          <p className="panel-help">In die Ablage, Ausschneiden, Duplizieren und Löschen gelten für alle; die Leiste dafür steht oben über der Seite.</p>
          <p className="panel-help">⌘-Klick nimmt einen Baustein dazu oder heraus, ⇧-Klick wählt alle bis dorthin. Esc hebt die Auswahl auf.</p>
        </div>
      ) : (
        <div className="panel-intro">
          <div className="panel-title">Eigenschaften</div>
          <p className="panel-help">Wähle ein Element auf der Seite aus, um Inhalt und Breite zu ändern. Ein Klick auf den Kopf der Seite öffnet Titel, Blatt-Typ und Fußzeile.</p>
          <p className="panel-help">Texte lassen sich auch direkt auf der Seite ändern: Doppelklick, oder ein ausgewähltes Element noch einmal antippen.</p>
          <p className="panel-help">Entf löscht das ausgewählte Element, Esc hebt die Auswahl auf. ⌘D dupliziert, Pfeiltasten wählen das nächste Element, Alt+Pfeiltasten verschieben es.</p>
          <p className="panel-help">
            Mehrere Bausteine: ⌘-Klick oder ⇧-Klick, ⌘A wählt alle; auf dem iPad „Mehrere auswählen“ an einem Baustein. ⌘C legt sie in die Ablage (in der Toolbox), ⌘V fügt sie hinter der Auswahl ein,
            auch in einer anderen Stunde.
          </p>
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

interface ImageSearch {
  query: string;
  free: boolean;
  pick(file: File, credit: string): void;
}

function BlockProperties({ api, block, close }: { api: EditorApi; block: Block; close: ReactNode }) {
  const T = BLOCK_TYPES[block.type];
  const set = (key: string) => (v: string | number) => api.setProp(block.id, key, v);
  const [search, setSearch] = useState<ImageSearch | null>(null);
  const [helper, setHelper] = useState<HelperKind | null>(null);
  const helperContext = api.helperContext?.(block.id) ?? null;
  const hasText = T.fields.some((f) => f.kind === 'text' || f.kind === 'area' || f.kind === 'ipa');
  const hasSource = T.fields.some((f) => f.key === 'source');
  const field = (f: FieldDef) => {
    if (f.when === 'en' && api.doc.lang !== 'en') return null;
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
        return (
          <ImageField
            key={f.key}
            label={f.label}
            hasImage={!!str(v)}
            onFile={(file) => api.setImage(block.id, file)}
            onRemove={() => set(f.key)('')}
            onSearch={() =>
              setSearch({
                query: str(block.props.search).trim() || queryFromCaption(str(block.props.caption)),
                free: false,
                // The author and licence go into the source line, in the same step as the picture.
                pick: (file, credit) => api.setImage(block.id, file, hasSource ? { source: credit } : {}),
              })
            }
          />
        );
      case 'competence':
        return api.codeLocked ? <CompetenceField key={f.key} label={f.label} value={str(v)} competences={api.competences} onChange={set(f.key)} /> : null;
      case 'ipa':
        return <IpaAreaField key={f.key} label={f.label} value={str(v)} onChange={set(f.key)} />;
      case 'pics': {
        const ids = str(v).split('\n');
        const vocab = block.type === 'vocab';
        const names = str(block.props[f.of])
          .split('\n')
          .filter((l) => l.trim())
          .map((l) =>
            vocab
              ? l.split('|')[0].trim()
              : l
                  .split('|')
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .join(' · '),
          );
        // A vocabulary list searches with the word's search words for the picture, else with the English word.
        const queryOf = (i: number) => (vocab ? str(block.props.picwords).split('\n')[i]?.trim() || names[i] : names[i]?.split(' · ').pop()) ?? '';
        return (
          <PicsField
            key={f.key}
            label={f.label}
            names={names}
            ids={ids}
            onFile={(i, file) => api.setPic(block.id, i, file)}
            onRemove={(i) => set(f.key)(ids.map((x, k) => (k === i ? '' : x)).join('\n'))}
            // Picture cards have no room for a source line: public domain pictures first.
            onSearch={(i) => setSearch({ query: queryOf(i), free: true, pick: (file) => api.setPic(block.id, i, file) })}
          />
        );
      }
      case 'preset':
        return <PresetField key={f.key} label={f.label} presets={f.presets} onPick={(i) => api.setProps(block.id, f.presets[i].props)} />;
    }
  };

  return (
    <>
      <PanelHead icon={<Icon icon={BLOCK_ICONS[block.type]} size={18} />} title={T.label} close={close} />
      {search && (
        <ImageSearchDialog
          initialQuery={search.query}
          freeOnly={search.free}
          onPick={(file, credit) => {
            search.pick(file, credit);
            setSearch(null);
          }}
          onClose={() => setSearch(null)}
        />
      )}
      {helperContext && hasText && (
        <div className="panel-section panel-ai">
          <div className="panel-section-label">
            <Icon icon={Sparkles} size={14} /> Mit Claude
          </div>
          <div className="panel-ai-row">
            {HELPERS.filter((h) => !isLevelHelper(h.v) && h.v !== 'loesung').map((h) => (
              <button key={h.v} type="button" className="seg-pill" onClick={() => setHelper(h.v)}>
                {h.l}
              </button>
            ))}
          </div>
          {T.task && (
            <div className="panel-ai-row">
              <span className="panel-ai-label">Fassung für</span>
              {HELPERS.filter((h) => isLevelHelper(h.v)).map((h) => (
                <button key={h.v} type="button" className="seg-pill" onClick={() => setHelper(h.v)}>
                  {h.l}
                </button>
              ))}
              <button type="button" className="seg-pill" onClick={() => setHelper('loesung')}>
                Lösung und Tipp
              </button>
            </div>
          )}
        </div>
      )}
      <div className="panel-section">
        <SegField label="Breite im 12er-Raster" value={block.span} options={SPAN_OPTIONS} onPick={(v) => api.setSpan(block.id, v)} />
        {T.fields.map(field)}
      </div>
      {helper && helperContext && (
        <BlockAiDialog
          block={block}
          doc={api.doc}
          kind={helper}
          context={helperContext}
          onApply={(next, insert) => {
            if (insert) api.insertAfter(block.id, next);
            else api.setProps(block.id, next.props);
            setHelper(null);
          }}
          onClose={() => setHelper(null)}
        />
      )}
      <div className="panel-row">
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => api.duplicateBlock(block.id)}>
          <Icon icon={Copy} />
          Duplizieren
        </button>
        <button type="button" className="btn btn-secondary ui-btn is-danger" onClick={() => api.deleteBlock(block.id)}>
          <Icon icon={Trash2} />
          Löschen
        </button>
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => api.toAblage([block.id])} title="Zum Einfügen hier oder in einer anderen Stunde (⌘C)">
          <Icon icon={ClipboardCopy} />
          In die Ablage
        </button>
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => api.startPicking(block.id)} title="Weitere Bausteine antippen (⌘-Klick, ⇧-Klick)">
          <Icon icon={ListChecks} />
          Mehrere auswählen
        </button>
        {api.share && (
          <button type="button" className="btn btn-secondary ui-btn" onClick={() => api.share!([block.id])} title="Per Link und QR-Code an die Klasse, am Tablet zu lösen">
            <Icon icon={Send} />
            Digital austeilen
          </button>
        )}
      </div>
    </>
  );
}

function PageProperties({ api, p, close }: { api: EditorApi; p: number; close: ReactNode }) {
  const { doc } = api;
  const pg = doc.pages[p];
  // The page this one would be the back of.
  const f = frontOf(
    doc.pages.map((x, k) => (k === p ? { ...x, back: true } : x)),
    p,
  );
  const front = f === null ? null : doc.pages[f];
  const setBack = (back: boolean) => {
    if (back && front)
      // The back takes over the front's sheet type and work form; the name is already on the front.
      api.setPage(p, { back: true, type: front.type, form: front.form, nameField: 'aus', ...(pg.title === 'Neues Arbeitsblatt' ? { title: front.title } : {}) });
    else api.setPage(p, { back: false, ...(pg.nameField === 'aus' && pg.type !== 'lehrkraft' ? { nameField: 'name' as const } : {}) });
  };
  return (
    <>
      <PanelHead icon={<Icon icon={File} size={18} />} title={pageLabel(doc, p)} close={close} />
      <div className="panel-section">
        <div className="panel-section-label">Kopfband</div>
        {front && f !== null && (
          <SegField<boolean>
            label="Doppelseitiges Blatt"
            value={!!pg.back}
            options={[
              { v: false, l: 'Eigenes Blatt' },
              { v: true, l: `Rückseite von ${pageLabel(doc, f).replace(' · Rückseite', '')}` },
            ]}
            onPick={setBack}
          />
        )}
        {pg.back ? (
          <p className="panel-note">
            Die Rückseite hat nur eine schmale Kopfzeile mit Symbol und Titel der Vorderseite. So bleibt mehr Platz, und es ist klar, wozu sie gehört. Beim Drucken „beidseitig“ wählen.
          </p>
        ) : (
          <>
            <TextField label="Titel" value={pg.title} onChange={(title) => api.setPage(p, { title })} />
            <TextField label="Zeile über dem Titel" value={pg.kicker} onChange={(kicker) => api.setPage(p, { kicker })} />
          </>
        )}
        <SegField<SheetType> label="Blatt-Typ" value={pg.type} options={SHEET_TYPES.map((k) => ({ v: k, l: THEMES[k].label }))} onPick={(type) => api.setPage(p, { type })} />
        {pg.type === 'lehrkraft' && <p className="panel-note">Seiten für die Lehrkraft haben keine Seitenzahl und werden nur mit der Lösungsfassung gedruckt.</p>}
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
        <div className="panel-section-label">{api.codeLocked ? 'Sprache · ganzes Modul' : 'Sprache · alle Seiten'}</div>
        <SegField<Lang>
          label="Sprache der Arbeitsblätter"
          value={doc.lang}
          options={[
            { v: 'de', l: 'Deutsch' },
            { v: 'en', l: 'Englisch' },
          ]}
          onPick={(lang) => api.setMeta({ lang })}
        />
        {doc.lang === 'en' && (
          <SegField<boolean>
            label="Deutsche Hilfe unter den Arbeitsaufträgen"
            value={doc.help}
            options={[
              { v: true, l: 'Zeigen' },
              { v: false, l: 'Ausblenden' },
            ]}
            onPick={(help) => api.setMeta({ help })}
          />
        )}
        <p className="panel-note">Englisch: Kopfzeile „Name · Date“, englische Anführungszeichen, Rechtschreibprüfung und Silbentrennung auf Englisch.</p>
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
