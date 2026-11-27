// One module: its lessons with their sheets, the competence grid, and the module's data in a side panel; A4 prints of
// the content overview and the grid. Redesigned 26.11.2026 (Dose, stage 3): lessons first, details on request.
import { memo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookA,
  ChevronRight,
  Copy,
  Download,
  FileInput,
  FileText,
  ListChecks,
  PackageOpen,
  Plus,
  Printer,
  Shapes,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Table,
  Trash2,
  X,
} from 'lucide-react';
import { vocabOf } from '../model/language';
import { VocabTestDialog, type VocabTestOptions } from './VocabTestDialog';
import { VocabAiDialog } from '../ai/VocabAiDialog';
import { ModulePlanAiDialog } from '../ai/ModulePlanAiDialog';
import type { ModulePlan } from '../ai/moduleplan';
import { PagePreview } from '../ai/LessonAiDialog';
import type { Page } from '../model/types';
import { IconPickerField, NumberField } from '../editor/fields';
import { Menu, SlidesMenu } from '../editor/TopBar';
import { Icon } from '../icons';
import { THEMES } from '../model/themes';
import { topicIcon } from '../topicIcons';
import { ModulePages, ModulePrint, usePageFit, type PrintKind } from './ModulePrint';
import { competenceLessons, competenceLinks, docForLesson, isWorkedOut, linkLabel, modulesOf, newCompetence, progressOf, progressText, type CompetenceLink } from './model';
import { domainsFor } from './curriculum';
import { isLessonRole, LESSON_ROLES } from './planning';
import { planModules, schoolWeeks } from './yearplan';
import { ageOf, DEFAULT_MODULE_LOOK, ENG_VARIANTS, FACH_LABELS, fachOf, HEAD_FONTS, lookFor, lookKey, LOOK_NAMES, type EngVariant, type Fach, type HeadFont, type ModuleLook } from '../model/look';
import type { Competence, Lesson, Library, Module, Settings } from './types';
import { GRADES } from './types';
import './board.css';
import './module.css';

interface ModuleViewProps {
  module: Module;
  lessons: Lesson[];
  subjects: string[];
  settings: Settings;
  onBack(): void;
  onChange(m: Module): void;
  onDelete(): void;
  onAddLesson(): void;
  onOpenLesson(l: Lesson): void;
  onOpenSlides(l: Lesson): void;
  /** English words of the grade's vocabulary lists; with it, "Vokabelliste mit Claude" makes a lesson of `pages`. */
  knownVocab: string[];
  onVocabLesson(pages: Page[]): void;
  /** Opens the lesson's slides and starts presenting. */
  onPresent(l: Lesson): void;
  onDeleteSlides(l: Lesson): void;
  onChangeLesson(l: Lesson): void;
  onDuplicateLesson(l: Lesson): void;
  onDeleteLesson(l: Lesson): void;
  onImportFile(file: File): void;
  /** Saves the module with all lessons as a Stundenpaket file. */
  onExportPackage(): void;
  /** Saves the words of the module's vocabulary lists as CSV. */
  onExportVocab(): void;
  onVocabTest(o: VocabTestOptions): void;
  /** The whole library, for planning the module with Claude (school year, other modules). */
  lib: Library;
  /** Applies Claude's module plan: worked-out lessons stay, planned ones are replaced. */
  onApplyPlan(plan: ModulePlan): void;
  /** A worksheet PDF becomes a new lesson (read with Claude in the lesson's editor). */
  onImportPdf(file: File): void;
}

type Tab = 'inhalt' | 'raster';

const count = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

export function ModuleView(p: ModuleViewProps) {
  const m = p.module;
  const [tab, setTab] = useState<Tab>('inhalt');
  const [printing, setPrinting] = useState<PrintKind | null>(null);
  // A new module (no lessons yet) opens with its data; an existing one with its lessons only.
  const [detailsOpen, setDetailsOpen] = useState(() => p.lessons.length === 0);
  const [iconOpen, setIconOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Module>) => p.onChange({ ...m, ...patch, updatedAt: Date.now() });

  const [testOpen, setTestOpen] = useState(false);
  const [vocabAiOpen, setVocabAiOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [gridMode, setGridMode] = useState<'ansicht' | 'bearbeiten'>(m.competences.length ? 'ansicht' : 'bearbeiten');
  const vocabCount = vocabOf(p.lessons.map((l) => l.doc)).length;
  const noVocab = () => window.alert('In diesem Modul gibt es noch keine Vokabelliste. Lege in einer Stunde den Baustein „Vokabelliste“ an (Toolbox: Wortschatz & Grammatik).');
  if (printing) return <ModulePrint kind={printing} module={m} lessons={p.lessons} settings={p.settings} onClose={() => setPrinting(null)} />;

  const progress = progressOf(p.lessons);
  const planned = p.lessons.length - progress.done;
  // Where the module sits in the school year (from the year plan of its class).
  const year = p.lib.settings.schoolYear;
  const weeks = year ? schoolWeeks(year) : [];
  const place = weeks.length && m.weeks > 0 ? planModules(modulesOf(p.lib, m.subject, m.grade), weeks).find((x) => x.module.id === m.id) : undefined;
  const openIcon = () => {
    setDetailsOpen(true);
    setIconOpen(true);
  };

  return (
    <div className="board mod">
      <main className="board-main mod-main">
        <header className="board-band mod-band">
          <div className="mod-band-head">
            <button type="button" className="mod-icon" title="Symbol ändern" aria-label="Symbol ändern" onClick={openIcon}>
              <Icon icon={topicIcon(m.icon)} size={28} />
            </button>
            <div className="board-band-text">
              <nav className="mod-crumbs" aria-label="Pfad">
                <span>{m.subject}</span>
                <Icon icon={ChevronRight} size={14} />
                <button type="button" onClick={p.onBack}>
                  Klasse {m.grade}
                </button>
                <Icon icon={ChevronRight} size={14} />
                <span aria-current="page">Modul {m.number}</span>
              </nav>
              <h1 className="board-title mod-title">{m.title || 'Ohne Thema'}</h1>
              {m.description && <p className="mod-desc">{m.description}</p>}
            </div>
          </div>
          <div className="mod-band-foot">
            <p className="board-meta">
              <span>{progressText(progress)}</span>
              {m.weeks > 0 && <span>{count(m.weeks, 'Schulwoche', 'Schulwochen') + (place ? `, KW ${weeks[place.first].kw} bis ${weeks[place.last].kw}` : '')}</span>}
              <span>{count(m.competences.length, 'Kompetenz', 'Kompetenzen')}</span>
              {m.textbook && <span>{m.textbook}</span>}
            </p>
            <div className="board-actions">
              <button
                type="button"
                className={'btn btn-secondary ui-btn' + (detailsOpen ? ' is-on' : '')}
                aria-expanded={detailsOpen}
                aria-controls="mod-details"
                title="Moduldaten"
                onClick={() => setDetailsOpen((o) => !o)}
              >
                <Icon icon={SlidersHorizontal} />
                <span className="btn-label">Moduldaten</span>
              </button>
              <Menu
                label="Drucken"
                icon={Printer}
                items={[
                  {
                    label: 'Inhaltsübersicht',
                    icon: ListChecks,
                    onClick: () => setPrinting('inhalt'),
                  },
                  {
                    label: 'Kompetenzraster',
                    icon: Table,
                    onClick: () => setPrinting('raster'),
                  },
                  {
                    label: 'Symbolkarte für die Klasse',
                    icon: Shapes,
                    onClick: () => setPrinting('symbole'),
                  },
                ]}
              />
              {(m.lang === 'en' || vocabCount > 0) && (
                <Menu
                  label="Vokabeln"
                  icon={BookA}
                  items={[
                    ...(m.lang === 'en'
                      ? [
                          {
                            label: 'Vokabelliste mit KI …',
                            icon: Sparkles,
                            onClick: () => setVocabAiOpen(true),
                          },
                        ]
                      : []),
                    {
                      label: 'Vokabeltest erstellen …',
                      icon: Shuffle,
                      onClick: () => (vocabCount ? setTestOpen(true) : noVocab()),
                    },
                    {
                      label: 'Vokabeln als CSV (Anki, Quizlet)',
                      icon: Download,
                      onClick: () => (vocabCount ? p.onExportVocab() : noVocab()),
                    },
                  ]}
                />
              )}
              <Menu
                label="Modul"
                icon={SquarePen}
                items={[
                  {
                    label: 'Mit KI bauen …',
                    icon: Sparkles,
                    onClick: () => setPlanOpen(true),
                  },
                  {
                    label: 'PDF als Stunde einpflegen …',
                    icon: FileText,
                    onClick: () => pdfInput.current?.click(),
                  },
                  {
                    label: 'Arbeitsblatt-Datei als Stunde importieren …',
                    icon: FileInput,
                    onClick: () => fileInput.current?.click(),
                  },
                  {
                    label: 'Als Stundenpaket sichern',
                    icon: PackageOpen,
                    onClick: p.onExportPackage,
                  },
                  { label: 'Modul löschen', icon: Trash2, onClick: p.onDelete },
                ]}
              />
              <button type="button" className="btn btn-primary ui-btn" onClick={p.onAddLesson}>
                <Icon icon={Plus} />
                Neue Stunde
              </button>
            </div>
          </div>
          <input
            ref={pdfInput}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) p.onImportPdf(f);
            }}
          />
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) p.onImportFile(f);
            }}
          />
        </header>

        <div className={'mod-layout' + (detailsOpen ? ' has-details' : '')}>
          <div className="mod-content">
            <div className="mod-tabbar">
              <div className="mod-tabs" role="tablist" aria-label="Modul">
                <button type="button" role="tab" id="mod-tab-inhalt" aria-controls="mod-panel" aria-selected={tab === 'inhalt'} className="mod-tab" onClick={() => setTab('inhalt')}>
                  Stunden <span className="mod-tab-count">{p.lessons.length}</span>
                </button>
                <button type="button" role="tab" id="mod-tab-raster" aria-controls="mod-panel" aria-selected={tab === 'raster'} className="mod-tab" onClick={() => setTab('raster')}>
                  Kompetenzraster <span className="mod-tab-count">{m.competences.length}</span>
                </button>
              </div>
              {tab === 'raster' && (
                <div className="mod-tab-tools">
                  <div className="seg-pills" role="radiogroup" aria-label="Kompetenzraster">
                    {(['ansicht', 'bearbeiten'] as const).map((k) => (
                      <button key={k} type="button" role="radio" aria-checked={gridMode === k} className={'seg-pill' + (gridMode === k ? ' is-on' : '')} onClick={() => setGridMode(k)}>
                        {k === 'ansicht' ? 'Übersicht' : 'Bearbeiten'}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPrinting('raster')}>
                    <Icon icon={Printer} />
                    Für die Klasse drucken
                  </button>
                </div>
              )}
            </div>

            <div id="mod-panel" role="tabpanel" aria-labelledby={tab === 'inhalt' ? 'mod-tab-inhalt' : 'mod-tab-raster'} className="mod-panel">
              {tab === 'inhalt' ? (
                <LessonList {...p} planned={planned} onPlan={() => setPlanOpen(true)} onImport={() => fileInput.current?.click()} />
              ) : gridMode === 'ansicht' ? (
                <GridPreview {...p} onEdit={() => setGridMode('bearbeiten')} />
              ) : (
                <CompetenceGrid competences={m.competences} domains={domainsFor(m.subject, m.lang)} links={competenceLinks(p.lessons)} onChange={(competences) => set({ competences })} />
              )}
            </div>
          </div>

          {detailsOpen && (
            <aside id="mod-details" className="mod-details" aria-labelledby="mod-details-h">
              <div className="mod-details-head">
                <h2 id="mod-details-h" className="mod-h2">
                  Moduldaten
                </h2>
                <button type="button" className="iconbtn" title="Moduldaten schließen" aria-label="Moduldaten schließen" onClick={() => setDetailsOpen(false)}>
                  <Icon icon={X} />
                </button>
              </div>
              <ModuleDetails m={m} subjects={p.subjects} iconOpen={iconOpen} onIconOpen={setIconOpen} set={set} />
            </aside>
          )}
        </div>
      </main>
      {vocabAiOpen && (
        <VocabAiDialog
          scope="module"
          grade={m.grade}
          topic={m.title}
          lang={m.lang}
          kicker={`${m.lang === 'en' ? 'Class' : 'Klasse'} ${m.grade} · Unit ${m.number}`}
          sources={p.lessons.filter(isWorkedOut).map((l) => ({
            title: `Stunde ${l.number}: ${l.title}`,
            doc: l.doc,
          }))}
          known={p.knownVocab}
          onClose={() => setVocabAiOpen(false)}
          onApply={(pages) => {
            setVocabAiOpen(false);
            p.onVocabLesson(pages);
          }}
        />
      )}
      {planOpen && (
        <ModulePlanAiDialog
          lib={p.lib}
          module={m}
          onClose={() => setPlanOpen(false)}
          onApply={(plan) => {
            setPlanOpen(false);
            p.onApplyPlan(plan);
          }}
        />
      )}
      {testOpen && (
        <VocabTestDialog
          available={vocabCount}
          onCreate={(o) => {
            setTestOpen(false);
            p.onVocabTest(o);
          }}
          onClose={() => setTestOpen(false)}
        />
      )}
    </div>
  );
}

/** The module's data, grouped: topic, class, time, sheets. Every field saves at once. */
function ModuleDetails({ m, subjects, iconOpen, onIconOpen, set }: { m: Module; subjects: string[]; iconOpen: boolean; onIconOpen(o: boolean): void; set(patch: Partial<Module>): void }) {
  return (
    <div className="mod-details-body">
      <section className="mod-group" aria-labelledby="mod-g-thema">
        <h3 id="mod-g-thema" className="mod-h3">
          Thema
        </h3>
        <div className="field">
          <label htmlFor="m-title">Thema des Moduls</label>
          <input id="m-title" className="input" value={m.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="mod-pair">
          <NumberField label="Modul-Nr." value={m.number} min={1} max={99} onChange={(number) => set({ number })} />
          <div className="field">
            <span className="mod-label">Symbol</span>
            <button type="button" className={'btn btn-secondary ui-btn mod-icon-btn' + (iconOpen ? ' is-on' : '')} aria-expanded={iconOpen} onClick={() => onIconOpen(!iconOpen)}>
              <Icon icon={topicIcon(m.icon)} size={18} />
              {iconOpen ? 'Fertig' : 'Ändern'}
            </button>
          </div>
        </div>
        {iconOpen && <IconPickerField label="Themen-Symbol (gilt für alle Arbeitsblätter des Moduls)" value={m.icon} onPick={(icon) => set({ icon })} />}
        <div className="field">
          <label htmlFor="m-desc">Kurzbeschreibung (erscheint in der Inhaltsübersicht)</label>
          <textarea id="m-desc" className="input" rows={3} value={m.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
      </section>

      <section className="mod-group" aria-labelledby="mod-g-klasse">
        <h3 id="mod-g-klasse" className="mod-h3">
          Klasse
        </h3>
        <div className="mod-pair">
          <div className="field">
            <label htmlFor="m-subject">Fach</label>
            <select id="m-subject" className="input" value={m.subject} onChange={(e) => set({ subject: e.target.value })}>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-grade">Klasse</label>
            <select id="m-grade" className="input" value={m.grade} onChange={(e) => set({ grade: Number(e.target.value) })}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="m-book">Lehrwerk (nur falls genutzt, z. B. Green Line 1, Unit 2)</label>
          <input id="m-book" className="input" value={m.textbook} onChange={(e) => set({ textbook: e.target.value })} />
        </div>
      </section>

      <section className="mod-group" aria-labelledby="mod-g-zeit">
        <h3 id="mod-g-zeit" className="mod-h3">
          Zeit im Schuljahr
        </h3>
        <div className="mod-pair">
          <NumberField label="Dauer in Schulwochen" value={m.weeks} min={0} max={40} onChange={(weeks) => set({ weeks })} />
          <div className="field">
            <label htmlFor="m-start">Beginn</label>
            <input id="m-start" className="input" type="date" value={m.start} aria-describedby="m-start-hint" onChange={(e) => set({ start: e.target.value })} />
          </div>
        </div>
        <p id="m-start-hint" className="mod-hint">
          Ohne Beginn folgt das Modul auf das vorige.
        </p>
      </section>

      <section className="mod-group" aria-labelledby="mod-g-blatt">
        <h3 id="mod-g-blatt" className="mod-h3">
          Blätter und Folien
        </h3>
        <div className="field">
          <label htmlFor="m-lang">Sprache der Blätter</label>
          <select id="m-lang" className="input" value={m.lang} onChange={(e) => set({ lang: e.target.value === 'en' ? 'en' : 'de' })}>
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
          </select>
        </div>
        {m.lang === 'en' && (
          <div className="field">
            <label htmlFor="m-help">Deutsche Hilfe unter Aufträgen</label>
            <select id="m-help" className="input" value={m.help ? 'ja' : 'nein'} onChange={(e) => set({ help: e.target.value === 'ja' })}>
              <option value="ja">zeigen</option>
              <option value="nein">ausblenden</option>
            </select>
          </div>
        )}
        <LookFields m={m} onChange={(look) => set({ look })} />
      </section>
    </div>
  );
}

/** The competence grid as the class gets it: the printed A4 page on the desk, scaled to the width of the panel. */
function GridPreview(p: ModuleViewProps & { onEdit(): void }) {
  const [ref, scale] = usePageFit();
  if (p.module.competences.length === 0)
    return (
      <div className="mod-empty">
        <p>Noch keine Kompetenzen. Je Zeile eine Kompetenz mit „Ich kann …“-Sätzen für G, M und E; gedruckt wird ein Raster zum Ankreuzen.</p>
        <button type="button" className="btn btn-secondary ui-btn" onClick={p.onEdit}>
          <Icon icon={Plus} />
          Kompetenzen anlegen
        </button>
      </div>
    );
  return (
    <div className="mod-desk">
      <div ref={ref} className="lib-grid-preview">
        <ModulePages kind="raster" module={p.module} lessons={p.lessons} settings={p.settings} scale={scale} />
      </div>
    </div>
  );
}

/** The competences a (planned) lesson works on, as chips; one more is added from the module's grid. */
function LessonCompetences({ lesson: l, competences, onChange }: { lesson: Lesson; competences: Competence[]; onChange(l: Lesson): void }) {
  const set = (ids: string[]) => onChange({ ...l, competences: ids, updatedAt: Date.now() });
  const mine = l.competences.map((id) => competences.find((c) => c.id === id)).filter((c): c is Competence => !!c);
  const rest = competences.filter((c) => !l.competences.includes(c.id));
  const name = (c: Competence) => c.area || c.g || 'Kompetenz';
  return (
    <div className="lrow-comps">
      {mine.map((c) => (
        <span key={c.id} className="lrow-comp" title={name(c)}>
          {name(c).length > 34 ? name(c).slice(0, 33) + '…' : name(c)}
          <button type="button" aria-label={`„${name(c)}“ entfernen`} onClick={() => set(l.competences.filter((x) => x !== c.id))}>
            <Icon icon={X} size={13} />
          </button>
        </span>
      ))}
      {rest.length > 0 && (
        <select className="input is-quiet lrow-comp-add" aria-label="Kompetenz zuordnen" value="" onChange={(e) => e.target.value && set([...l.competences, e.target.value])}>
          <option value="">{mine.length ? '+ Kompetenz' : 'Kompetenzen zuordnen …'}</option>
          {rest.map((c) => (
            <option key={c.id} value={c.id}>
              {name(c)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/** Size of the tray and of one sheet in it (A4 at 0.12). */
const TRAY_W = 168;
const SHEET_SCALE = 0.12;
const SHEET_W = Math.round(794 * SHEET_SCALE);
const FAN = 26;

/** A worked-out lesson's sheets fanned in its tray: the first in front, at most three. Drawn again only when the
 *  module or the lesson's document changes, not on every keystroke in its title. */
const LessonSheets = memo(
  function LessonSheets({ m, l }: { m: Module; l: Lesson }) {
    const doc = docForLesson(m, l);
    const sheets = doc.pages.flatMap((pg, k) => (pg.back ? [] : [k])).slice(0, 3);
    const left0 = Math.round((TRAY_W - SHEET_W - FAN * (sheets.length - 1)) / 2);
    return (
      <>
        {sheets.map((k, i) => (
          <span
            key={k}
            className="lrow-sheet"
            style={
              {
                left: left0 + i * FAN,
                top: 14 + i * 4,
                zIndex: sheets.length - i,
              } as CSSProperties
            }
          >
            <PagePreview doc={doc} p={k} scale={SHEET_SCALE} />
          </span>
        ))}
      </>
    );
  },
  (a, b) => a.m === b.m && a.l.doc === b.l.doc && a.l.number === b.l.number,
);

function LessonList(p: ModuleViewProps & { planned: number; onPlan(): void; onImport(): void }) {
  if (p.lessons.length === 0)
    return (
      <div className="mod-empty">
        <p>Noch keine Stunden. Lege die erste an, lass die KI das Modul planen oder importiere eine Arbeitsblatt-Datei.</p>
        <div className="mod-empty-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={p.onPlan}>
            <Icon icon={Sparkles} />
            Mit KI planen …
          </button>
          <button type="button" className="btn btn-secondary ui-btn" onClick={p.onImport}>
            <Icon icon={FileInput} />
            Arbeitsblatt-Datei importieren …
          </button>
        </div>
      </div>
    );
  return (
    <div className="mod-lessons-wrap">
      {p.planned > 0 && <p className="mod-hint">Geplante Stunden haben noch kein Blatt. „Ausarbeiten“ öffnet das leere Arbeitsblatt.</p>}
      <ol className="mod-lessons">
        {p.lessons.map((l) => {
          const planned = !isWorkedOut(l);
          const open = () => p.onOpenLesson(l);
          const set = (patch: Partial<Lesson>) => p.onChangeLesson({ ...l, ...patch, updatedAt: Date.now() });
          return (
            <li key={l.id} className={'lrow' + (planned ? ' is-planned' : '')}>
              {/* The sheets open the lesson too; the button "Öffnen" is the one keyboard and screen readers use. */}
              <button type="button" className="lrow-tray" tabIndex={-1} aria-hidden="true" onClick={open}>
                <span className="lrow-fan">{planned ? <span className="lrow-blank" /> : <LessonSheets m={p.module} l={l} />}</span>
                {planned && <span className="mcard-stamp">geplant</span>}
              </button>
              <div className="lrow-main">
                <div className="lrow-head">
                  <div className="lrow-num">
                    <span aria-hidden="true">S</span>
                    <NumberField label="Stunde" value={l.number} min={1} max={99} onChange={(number) => set({ number })} />
                  </div>
                  <input className="input is-quiet lrow-title" aria-label="Thema der Stunde" value={l.title} onChange={(e) => set({ title: e.target.value })} />
                </div>
                {!planned && (
                  <ul className="lrow-pages" aria-label="Seiten">
                    {l.doc.pages.map((pg, k) =>
                      // A back page belongs to the sheet before it.
                      pg.back ? null : (
                        <li key={k}>
                          <span className="lrow-page-title">
                            {pg.title}
                            {l.doc.pages[k + 1]?.back && ' + Rückseite'}
                          </span>
                          <span className="lrow-page-type">{THEMES[pg.type].label}</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
                <div className="lrow-fields">
                  <input
                    className="input is-quiet lrow-book"
                    aria-label="Seiten im Lehrwerk"
                    placeholder="Lehrwerk, z. B. SB S. 36"
                    value={l.textbook}
                    onChange={(e) => set({ textbook: e.target.value })}
                  />
                  {(planned || l.plan || l.role) && (
                    <>
                      <select
                        className={'input is-quiet lrow-role' + (l.role ? ' is-set' : '')}
                        aria-label="Rolle der Stunde im Modul"
                        title="Rolle der Stunde im Modul"
                        value={l.role}
                        onChange={(e) =>
                          set({
                            role: isLessonRole(e.target.value) ? e.target.value : '',
                          })
                        }
                      >
                        <option value="">Rolle …</option>
                        {LESSON_ROLES.map((r) => (
                          <option key={r.v} value={r.v}>
                            {r.short}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input is-quiet lrow-plan"
                        aria-label="Planung der Stunde"
                        placeholder="Planung: Was passiert in der Stunde?"
                        value={l.plan}
                        onChange={(e) => set({ plan: e.target.value })}
                      />
                    </>
                  )}
                </div>
                {(planned || l.competences.length > 0) && p.module.competences.length > 0 && <LessonCompetences lesson={l} competences={p.module.competences} onChange={p.onChangeLesson} />}
              </div>
              <div className="lrow-actions">
                <button type="button" className="btn btn-secondary ui-btn" onClick={open}>
                  {planned ? 'Ausarbeiten' : 'Öffnen'}
                </button>
                <SlidesMenu className="lib-slides-btn" count={l.slides.length} onOpen={() => p.onOpenSlides(l)} onPresent={() => p.onPresent(l)} onDelete={() => p.onDeleteSlides(l)} />
                <button type="button" className="iconbtn" title="Duplizieren" aria-label="Duplizieren" onClick={() => p.onDuplicateLesson(l)}>
                  <Icon icon={Copy} />
                </button>
                <button type="button" className="iconbtn is-danger" title="Löschen" aria-label="Löschen" onClick={() => p.onDeleteLesson(l)}>
                  <Icon icon={Trash2} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="mod-add" onClick={p.onAddLesson}>
        <Icon icon={Plus} />
        Neue Stunde
      </button>
    </div>
  );
}

interface CompetenceGridProps {
  competences: Competence[];
  /** Areas of the Bildungsplan to choose from (empty: free text). */
  domains: readonly string[];
  links: Map<string, CompetenceLink[]>;
  onChange(c: Competence[]): void;
}

const LEVELS = [
  { k: 'g', code: 'G', name: 'grundlegend' },
  { k: 'm', code: 'M', name: 'mittel' },
  { k: 'e', code: 'E', name: 'erweitert' },
] as const;

function CompetenceGrid({ competences, domains, links, onChange }: CompetenceGridProps) {
  const update = (i: number, patch: Partial<Competence>) => onChange(competences.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= competences.length) return;
    const next = [...competences];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="cgrid">
      <p className="mod-hint">
        Je Zeile eine Kompetenz mit „Ich kann …“-Sätzen für die Niveaus G (grundlegend), M (mittel) und E (erweitert). Gedruckt wird ein Raster zum Ankreuzen für die Klasse. Aufgaben verknüpfst du im
        Arbeitsblatt: Aufgabe auswählen und rechts die Kompetenz einstellen.
      </p>
      <ol className="cgrid-rows">
        {competences.map((c, i) => (
          <li key={c.id} className="crow">
            <div className="crow-head">
              <span className="crow-num" aria-hidden="true">
                {i + 1}
              </span>
              <input
                id={'a' + c.id}
                className="input is-quiet crow-title"
                aria-label="Kompetenz"
                value={c.area}
                placeholder="Kompetenz, z. B. Den Treibhauseffekt erklären"
                onChange={(e) => update(i, { area: e.target.value })}
              />
              <div className="crow-actions">
                <button type="button" className="iconbtn" title="Nach oben" aria-label="Nach oben" disabled={i === 0} onClick={() => move(i, -1)}>
                  <Icon icon={ArrowUp} />
                </button>
                <button type="button" className="iconbtn" title="Nach unten" aria-label="Nach unten" disabled={i === competences.length - 1} onClick={() => move(i, 1)}>
                  <Icon icon={ArrowDown} />
                </button>
                <button type="button" className="iconbtn is-danger" title="Löschen" aria-label="Löschen" onClick={() => onChange(competences.filter((_, k) => k !== i))}>
                  <Icon icon={Trash2} />
                </button>
              </div>
            </div>
            <div className="crow-meta">
              <div className="field crow-domain">
                <label htmlFor={'d' + c.id}>Bereich</label>
                <input
                  id={'d' + c.id}
                  className="input"
                  list={domains.length ? 'comp-domains' : undefined}
                  value={c.domain}
                  placeholder={domains[0] ?? 'z. B. Erkenntnisgewinnung'}
                  onChange={(e) => update(i, { domain: e.target.value })}
                />
              </div>
              <div className="field crow-lessons">
                <label htmlFor={'l' + c.id}>Stunde(n)</label>
                <input
                  id={'l' + c.id}
                  className="input"
                  value={c.lessons}
                  placeholder={competenceLessons({ ...c, lessons: '' }, links.get(c.id)) || '2, 3'}
                  onChange={(e) => update(i, { lessons: e.target.value })}
                />
              </div>
              <p className="crow-links">{links.get(c.id)?.length ? <>Verknüpfte Aufgaben: {links.get(c.id)!.map(linkLabel).join(', ')}</> : <>Keine Aufgabe verknüpft.</>}</p>
            </div>
            <div className="crow-levels">
              {LEVELS.map((lv) => (
                <div key={lv.k} className="field crow-level">
                  <label htmlFor={lv.k + c.id}>
                    <span className="crow-code">{lv.code}</span>
                    {lv.name}
                  </label>
                  <textarea id={lv.k + c.id} className="input" rows={3} value={c[lv.k]} onChange={(e) => update(i, { [lv.k]: e.target.value })} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {competences.length === 0 && <p className="lib-empty">Noch keine Kompetenzen.</p>}
      {domains.length > 0 && (
        <datalist id="comp-domains">
          {domains.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      )}
      <div className="cgrid-add">
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => onChange([...competences, newCompetence(competences.at(-1)?.domain ?? '')])}>
          <Icon icon={Plus} />
          Kompetenz
        </button>
        {domains.length > 0 && (
          <select
            className="input cgrid-template"
            value=""
            aria-label="Kompetenz für einen Bereich des Bildungsplans hinzufügen"
            onChange={(e) => {
              if (e.target.value === '*') onChange([...competences, ...domains.map((d) => newCompetence(d))]);
              else if (e.target.value) onChange([...competences, newCompetence(e.target.value)]);
            }}
          >
            <option value="">Bereich aus dem Bildungsplan hinzufügen …</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="*">Alle Bereiche auf einmal</option>
          </select>
        )}
      </div>
    </div>
  );
}

/** Design of the module's sheets and slides: the subject's form (by grade), another subject's, or neutral ("Organisch" on slides). */
function LookFields({ m, onChange }: { m: Module; onChange(look: ModuleLook): void }) {
  const ml = m.look ?? DEFAULT_MODULE_LOOK;
  const own = fachOf(m.subject);
  const age = ageOf(m.grade);
  const look = lookFor(m);
  // Sheets take the subject's form; the names of the old designs only matter for the slides.
  const nameOf = (f: Fach) => `${FACH_LABELS[f]} (Folien: ${f === 'eng' && age === 1 ? 'Englisch 5 und 6' : LOOK_NAMES[f][age - 1]})`;
  const fonts = look ? HEAD_FONTS[lookKey(look)] : null;
  return (
    <>
      <div className="field">
        <label htmlFor="m-look">Fach-Design der Blätter und Folien</label>
        <select id="m-look" className="input" value={ml.theme} onChange={(e) => onChange({ ...ml, theme: e.target.value as ModuleLook['theme'] })}>
          <option value="auto">{own ? `Wie das Fach: ${nameOf(own)}` : 'Wie das Fach: neutral (Folien: Organisch)'}</option>
          <option value="organisch">Neutral (Folien: Organisch)</option>
          {(Object.keys(FACH_LABELS) as Fach[]).map((f) => (
            <option key={f} value={f}>
              {nameOf(f)}
            </option>
          ))}
        </select>
      </div>
      {look?.fach === 'eng' && look.age === 1 && (
        <div className="field">
          <label htmlFor="m-look-x">Variante der Folien</label>
          <select id="m-look-x" className="input" value={ml.variant} onChange={(e) => onChange({ ...ml, variant: e.target.value as EngVariant })}>
            {ENG_VARIANTS.map((v) => (
              <option key={v.v} value={v.v}>
                {v.l}
              </option>
            ))}
          </select>
        </div>
      )}
      {fonts && (
        <div className="field">
          <label htmlFor="m-look-h">Schrift der Folien-Überschriften</label>
          <select id="m-look-h" className="input" value={ml.head} onChange={(e) => onChange({ ...ml, head: e.target.value as HeadFont })}>
            <option value="a">{fonts[0]}</option>
            <option value="b">{fonts[1]}</option>
            <option value="o">Caprasimo (wie Organisch)</option>
          </select>
        </div>
      )}
    </>
  );
}
