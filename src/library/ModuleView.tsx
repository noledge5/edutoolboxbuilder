// One module: its data, the lessons (content overview) and the competence grid, with A4 prints of both.
import { useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, BookA, Copy, Download, FileInput, ListChecks, PackageOpen, Plus, Printer, Shuffle, Sparkles, SquarePen, Table, Trash2 } from 'lucide-react';
import { vocabOf } from '../model/language';
import { VocabTestDialog, type VocabTestOptions } from './VocabTestDialog';
import { VocabAiDialog } from '../ai/VocabAiDialog';
import { ModulePlanAiDialog } from '../ai/ModulePlanAiDialog';
import type { ModulePlan } from '../ai/moduleplan';
import type { Page } from '../model/types';
import { IconPickerField, NumberField } from '../editor/fields';
import { Menu, SlidesMenu } from '../editor/TopBar';
import { Icon } from '../icons';
import { THEMES } from '../model/themes';
import { topicIcon } from '../topicIcons';
import { ModulePages, ModulePrint, usePageFit, type PrintKind } from './ModulePrint';
import { competenceLessons, competenceLinks, isWorkedOut, linkLabel, newCompetence, progressOf, type CompetenceLink } from './model';
import { domainsFor } from './curriculum';
import { isLessonRole, LESSON_ROLES } from './planning';
import { SearchButton } from './SearchDialog';
import { ageOf, DEFAULT_MODULE_LOOK, ENG_VARIANTS, FACH_LABELS, fachOf, HEAD_FONTS, lookFor, lookKey, LOOK_NAMES, type EngVariant, type Fach, type HeadFont, type ModuleLook } from '../model/look';
import type { Competence, Lesson, Library, Module, Settings } from './types';
import { GRADES } from './types';

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
  onRegenerateSlides(l: Lesson): void;
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
}

type Tab = 'inhalt' | 'raster';

export function ModuleView(p: ModuleViewProps) {
  const m = p.module;
  const [tab, setTab] = useState<Tab>('inhalt');
  const [printing, setPrinting] = useState<PrintKind | null>(null);
  const [iconOpen, setIconOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Module>) => p.onChange({ ...m, ...patch, updatedAt: Date.now() });

  const [testOpen, setTestOpen] = useState(false);
  const [vocabAiOpen, setVocabAiOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [gridMode, setGridMode] = useState<'ansicht' | 'bearbeiten'>(m.competences.length ? 'ansicht' : 'bearbeiten');
  const vocabCount = vocabOf(p.lessons.map((l) => l.doc)).length;
  const noVocab = () => window.alert('In diesem Modul gibt es noch keine Vokabelliste. Lege in einer Stunde den Baustein „Vokabelliste“ an (Toolbox: Wortschatz & Grammatik).');
  if (printing) return <ModulePrint kind={printing} module={m} lessons={p.lessons} settings={p.settings} onClose={() => setPrinting(null)} />;

  return (
    <div className="lib">
      <header className="topbar">
        <button type="button" className="iconbtn topbar-back" onClick={p.onBack} title="Zur Übersicht" aria-label="Zur Übersicht">
          <Icon icon={ArrowLeft} size={18} />
        </button>
        <div className="topbar-icon">
          <Icon icon={topicIcon(m.icon)} size={20} />
        </div>
        <div className="topbar-name">
          <div className="topbar-title">
            Modul {m.number}: {m.title}
          </div>
          <div className="topbar-place">
            {m.subject} · Klasse {m.grade}
          </div>
        </div>
        <SearchButton />
        <Menu
          label="Drucken"
          icon={Printer}
          items={[
            { label: 'Inhaltsübersicht', icon: ListChecks, onClick: () => setPrinting('inhalt') },
            { label: 'Kompetenzraster', icon: Table, onClick: () => setPrinting('raster') },
          ]}
        />
        {(m.lang === 'en' || vocabCount > 0) && (
          <Menu
            label="Vokabeln"
            icon={BookA}
            items={[
              ...(m.lang === 'en' ? [{ label: 'Vokabelliste mit Claude …', icon: Sparkles, onClick: () => setVocabAiOpen(true) }] : []),
              { label: 'Vokabeltest erstellen …', icon: Shuffle, onClick: () => (vocabCount ? setTestOpen(true) : noVocab()) },
              { label: 'Vokabeln als CSV (Anki, Quizlet)', icon: Download, onClick: () => (vocabCount ? p.onExportVocab() : noVocab()) },
            ]}
          />
        )}
        <Menu
          label="Modul"
          icon={SquarePen}
          items={[
            { label: 'Mit Claude planen …', icon: Sparkles, onClick: () => setPlanOpen(true) },
            { label: 'Arbeitsblatt-Datei als Stunde importieren …', icon: FileInput, onClick: () => fileInput.current?.click() },
            { label: 'Als Stundenpaket sichern', icon: PackageOpen, onClick: p.onExportPackage },
            { label: 'Modul löschen', icon: Trash2, onClick: p.onDelete },
          ]}
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

      <main className="lib-main">
        <section className="lib-card-plain lib-module-form">
          <button type="button" className="lib-icon is-big" title="Symbol ändern" aria-label="Symbol ändern" aria-expanded={iconOpen} onClick={() => setIconOpen((o) => !o)}>
            <Icon icon={topicIcon(m.icon)} size={28} />
          </button>
          <div className="lib-form-grid">
            <div className="field is-wide">
              <label htmlFor="m-title">Thema des Moduls</label>
              <input id="m-title" className="input" value={m.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <NumberField label="Modul-Nr." value={m.number} min={1} max={99} onChange={(number) => set({ number })} />
            <div className="field">
              <label htmlFor="m-subject">Fach</label>
              <select id="m-subject" className="input" value={m.subject} onChange={(e) => set({ subject: e.target.value })}>
                {p.subjects.map((s) => (
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
            <div className="field is-wide">
              <label htmlFor="m-book">Lehrwerk (nur falls genutzt, z. B. Green Line 1, Unit 2)</label>
              <input id="m-book" className="input" value={m.textbook} onChange={(e) => set({ textbook: e.target.value })} />
            </div>
            <NumberField label="Dauer in Schulwochen" value={m.weeks} min={0} max={40} onChange={(weeks) => set({ weeks })} />
            <div className="field">
              <label htmlFor="m-start">Beginn (leer = nach dem vorigen Modul)</label>
              <input id="m-start" className="input" type="date" value={m.start} onChange={(e) => set({ start: e.target.value })} />
            </div>
            <div className="field is-wide">
              <label htmlFor="m-desc">Kurzbeschreibung (erscheint in der Inhaltsübersicht)</label>
              <textarea id="m-desc" className="input" rows={2} value={m.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
          </div>
          {iconOpen && (
            <div className="lib-icon-picker">
              <IconPickerField label="Themen-Symbol (gilt für alle Arbeitsblätter des Moduls)" value={m.icon} onPick={(icon) => set({ icon })} />
            </div>
          )}
        </section>

        <div className="lib-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'inhalt'} className={'lib-tab' + (tab === 'inhalt' ? ' is-on' : '')} onClick={() => setTab('inhalt')}>
            <Icon icon={ListChecks} />
            Inhalt · {p.lessons.length} {p.lessons.length === 1 ? 'Stunde' : 'Stunden'}
            {p.lessons.some((l) => !isWorkedOut(l)) && ` · ${p.lessons.filter((l) => !isWorkedOut(l)).length} geplant`}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'raster'} className={'lib-tab' + (tab === 'raster' ? ' is-on' : '')} onClick={() => setTab('raster')}>
            <Icon icon={Table} />
            Kompetenzraster · {m.competences.length}
          </button>
        </div>

        {tab === 'inhalt' ? (
          <LessonList {...p} onPlan={() => setPlanOpen(true)} />
        ) : (
          <section className="lib-section">
            <div className="lib-h2-row">
              <div className="seg-pills" role="tablist" aria-label="Kompetenzraster">
                {(['ansicht', 'bearbeiten'] as const).map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={gridMode === k} className={'seg-pill' + (gridMode === k ? ' is-on' : '')} onClick={() => setGridMode(k)}>
                    {k === 'ansicht' ? 'Übersicht' : 'Bearbeiten'}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-secondary ui-btn" onClick={() => setPrinting('raster')}>
                <Icon icon={Printer} />
                Für die Klasse drucken
              </button>
            </div>
            {gridMode === 'ansicht' ? (
              <GridPreview {...p} onEdit={() => setGridMode('bearbeiten')} />
            ) : (
              <CompetenceGrid competences={m.competences} domains={domainsFor(m.subject, m.lang)} links={competenceLinks(p.lessons)} onChange={(competences) => set({ competences })} />
            )}
          </section>
        )}
      </main>
      {vocabAiOpen && (
        <VocabAiDialog
          scope="module"
          grade={m.grade}
          topic={m.title}
          lang={m.lang}
          kicker={`${m.lang === 'en' ? 'Class' : 'Klasse'} ${m.grade} · Unit ${m.number}`}
          sources={p.lessons.filter(isWorkedOut).map((l) => ({ title: `Stunde ${l.number}: ${l.title}`, doc: l.doc }))}
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

/** The competence grid as the class gets it: the printed A4 page, scaled to the width of the window. */
function GridPreview(p: ModuleViewProps & { onEdit(): void }) {
  const [ref, scale] = usePageFit();
  if (p.module.competences.length === 0)
    return (
      <div className="lib-empty-box">
        <p className="lib-empty">Noch keine Kompetenzen.</p>
        <button type="button" className="btn btn-primary ui-btn" onClick={p.onEdit}>
          Kompetenzen anlegen
        </button>
      </div>
    );
  return (
    <div ref={ref} className="lib-grid-preview">
      <ModulePages kind="raster" module={p.module} lessons={p.lessons} settings={p.settings} scale={scale} />
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
    <div className="lib-comp-chips">
      {mine.map((c) => (
        <span key={c.id} className="lib-comp-chip" title={name(c)}>
          {name(c).length > 34 ? name(c).slice(0, 33) + '…' : name(c)}
          <button type="button" aria-label={`„${name(c)}“ entfernen`} onClick={() => set(l.competences.filter((x) => x !== c.id))}>
            ×
          </button>
        </span>
      ))}
      {rest.length > 0 && (
        <select className="input lib-comp-add" aria-label="Kompetenz zuordnen" value="" onChange={(e) => e.target.value && set([...l.competences, e.target.value])}>
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

function LessonList(p: ModuleViewProps & { onPlan(): void }) {
  const progress = progressOf(p.lessons);
  return (
    <section className="lib-section">
      {progress.done < progress.total && (
        <div className="lib-progress">
          <span className="lib-progress-bar" aria-hidden="true">
            <span style={{ width: `${(100 * progress.done) / progress.total}%` }} />
          </span>
          {progress.done} von {progress.total} Stunden ausgearbeitet · geplante Stunden sind blass, „Ausarbeiten“ öffnet das leere Arbeitsblatt
        </div>
      )}
      <div className="lib-lessons">
        {p.lessons.map((l) => {
          const planned = !isWorkedOut(l);
          return (
            <div key={l.id} className={'lib-lesson' + (planned ? ' is-planned' : '')}>
              <div className="lib-lesson-num">
                <NumberField label="Stunde" value={l.number} min={1} max={99} onChange={(number) => p.onChangeLesson({ ...l, number, updatedAt: Date.now() })} />
              </div>
              <div className="lib-lesson-main">
                <div className="lib-lesson-titles">
                  <input className="input lib-lesson-title" aria-label="Thema der Stunde" value={l.title} onChange={(e) => p.onChangeLesson({ ...l, title: e.target.value, updatedAt: Date.now() })} />
                  <input
                    className="input lib-lesson-book"
                    aria-label="Seiten im Lehrwerk"
                    placeholder="Lehrwerk, z. B. SB S. 36"
                    value={l.textbook}
                    onChange={(e) => p.onChangeLesson({ ...l, textbook: e.target.value, updatedAt: Date.now() })}
                  />
                </div>
                {(planned || l.plan || l.role) && (
                  <div className="lib-lesson-plan-row">
                    {planned && <span className="lib-planned-badge">Geplant</span>}
                    <select
                      className={'input lib-role-select' + (l.role ? ' is-set' : '')}
                      aria-label="Rolle der Stunde im Modul"
                      title="Rolle der Stunde im Modul"
                      value={l.role}
                      onChange={(e) => p.onChangeLesson({ ...l, role: isLessonRole(e.target.value) ? e.target.value : '', updatedAt: Date.now() })}
                    >
                      <option value="">Rolle …</option>
                      {LESSON_ROLES.map((r) => (
                        <option key={r.v} value={r.v}>
                          {r.short}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input lib-lesson-plan"
                      aria-label="Planung der Stunde"
                      placeholder="Planung: Was passiert in der Stunde?"
                      value={l.plan}
                      onChange={(e) => p.onChangeLesson({ ...l, plan: e.target.value, updatedAt: Date.now() })}
                    />
                  </div>
                )}
                {(planned || l.competences.length > 0) && p.module.competences.length > 0 && <LessonCompetences lesson={l} competences={p.module.competences} onChange={p.onChangeLesson} />}
                {!planned && (
                  <div className="lib-lesson-pages">
                    {l.doc.pages.map((pg, k) =>
                      // A back page belongs to the sheet before it.
                      pg.back ? null : (
                        <span key={k} className="lib-page-chip">
                          <span className="lib-page-dot" style={{ background: THEMES[pg.type].circle }} />
                          {pg.title}
                          {l.doc.pages[k + 1]?.back && ' + Rückseite'}
                          <span className="lib-page-type">{THEMES[pg.type].label}</span>
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
              <div className="lib-lesson-actions">
                <button type="button" className={'btn ui-btn ' + (planned ? 'btn-secondary' : 'btn-primary')} onClick={() => p.onOpenLesson(l)}>
                  {planned ? 'Ausarbeiten' : 'Öffnen'}
                </button>
                <SlidesMenu className="lib-slides-btn" count={l.slides.length} onOpen={() => p.onOpenSlides(l)} onPresent={() => p.onPresent(l)} onRegenerate={() => p.onRegenerateSlides(l)} onDelete={() => p.onDeleteSlides(l)} />
              <button type="button" className="iconbtn" title="Duplizieren" aria-label="Duplizieren" onClick={() => p.onDuplicateLesson(l)}>
                  <Icon icon={Copy} />
                </button>
                <button type="button" className="iconbtn is-danger" title="Löschen" aria-label="Löschen" onClick={() => p.onDeleteLesson(l)}>
                  <Icon icon={Trash2} />
                </button>
              </div>
            </div>
          );
        })}
        {p.lessons.length === 0 && <p className="lib-empty">Noch keine Stunden. Lege die erste an oder importiere eine Arbeitsblatt-Datei.</p>}
      </div>
      <div className="lib-add-row">
        <button type="button" className="btn btn-secondary ui-btn lib-add" onClick={p.onAddLesson}>
          <Icon icon={Plus} />
          Neue Stunde
        </button>
        <button type="button" className="btn btn-secondary ui-btn lib-add" onClick={p.onPlan}>
          <Icon icon={Sparkles} />
          Modul mit Claude planen …
        </button>
      </div>
    </section>
  );
}

interface CompetenceGridProps {
  competences: Competence[];
  /** Areas of the Bildungsplan to choose from (empty: free text). */
  domains: readonly string[];
  links: Map<string, CompetenceLink[]>;
  onChange(c: Competence[]): void;
}

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
    <div className="lib-section">
      <p className="lib-help">Je Zeile eine Kompetenz mit „Ich kann …“-Sätzen für die Niveaus G (grundlegend), M (mittel) und E (erweitert). Gedruckt wird ein Raster zum Ankreuzen für die Klasse.</p>
      <div className="lib-comps">
        {competences.map((c, i) => (
          <div key={c.id} className="lib-comp">
            <div className="lib-comp-head">
              <div className="field lib-comp-domain">
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
              <div className="field is-wide">
                <label htmlFor={'a' + c.id}>Kompetenz</label>
                <input id={'a' + c.id} className="input" value={c.area} placeholder="z. B. Den Treibhauseffekt erklären" onChange={(e) => update(i, { area: e.target.value })} />
              </div>
              <div className="field lib-comp-lessons">
                <label htmlFor={'l' + c.id}>Stunde(n)</label>
                <input
                  id={'l' + c.id}
                  className="input"
                  value={c.lessons}
                  placeholder={competenceLessons({ ...c, lessons: '' }, links.get(c.id)) || '2, 3'}
                  onChange={(e) => update(i, { lessons: e.target.value })}
                />
              </div>
              <div className="lib-comp-actions">
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
            <div className="lib-comp-levels">
              {(['g', 'm', 'e'] as const).map((lv) => (
                <div key={lv} className={'field lib-level is-' + lv}>
                  <label htmlFor={lv + c.id}>{lv === 'g' ? 'G · grundlegend' : lv === 'm' ? 'M · mittel' : 'E · erweitert'}</label>
                  <textarea id={lv + c.id} className="input" rows={3} value={c[lv]} onChange={(e) => update(i, { [lv]: e.target.value })} />
                </div>
              ))}
            </div>
            <p className="lib-comp-links">
              {links.get(c.id)?.length ? (
                <>Verknüpfte Aufgaben: {links.get(c.id)!.map(linkLabel).join('  ·  ')}</>
              ) : (
                <>Noch keine Aufgabe verknüpft. Wähle im Arbeitsblatt eine Aufgabe aus und stelle rechts die Kompetenz ein.</>
              )}
            </p>
          </div>
        ))}
        {competences.length === 0 && <p className="lib-empty">Noch keine Kompetenzen.</p>}
      </div>
      {domains.length > 0 && (
        <datalist id="comp-domains">
          {domains.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      )}
      <div className="lib-comp-add">
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => onChange([...competences, newCompetence(competences.at(-1)?.domain ?? '')])}>
          <Icon icon={Plus} />
          Kompetenz
        </button>
        {domains.length > 0 && (
          <select
            className="input lib-comp-template"
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

/** Design of the module's sheets and slides: the subject's own (by grade), another subject's, or "Organisch". */
function LookFields({ m, onChange }: { m: Module; onChange(look: ModuleLook): void }) {
  const ml = m.look ?? DEFAULT_MODULE_LOOK;
  const own = fachOf(m.subject);
  const age = ageOf(m.grade);
  const look = lookFor(m);
  const nameOf = (f: Fach) => (f === 'eng' && age === 1 ? 'Englisch 5–6' : LOOK_NAMES[f][age - 1]);
  const fonts = look ? HEAD_FONTS[lookKey(look)] : null;
  return (
    <>
      <div className="field">
        <label htmlFor="m-look">Design der Blätter und Folien</label>
        <select id="m-look" className="input" value={ml.theme} onChange={(e) => onChange({ ...ml, theme: e.target.value as ModuleLook['theme'] })}>
          <option value="auto">{own ? `Wie das Fach: ${nameOf(own)}` : 'Wie das Fach: Organisch'}</option>
          <option value="organisch">Organisch</option>
          {(Object.keys(FACH_LABELS) as Fach[]).map((f) => (
            <option key={f} value={f}>
              {FACH_LABELS[f]}: {nameOf(f)}
            </option>
          ))}
        </select>
      </div>
      {look?.fach === 'eng' && look.age === 1 && (
        <div className="field">
          <label htmlFor="m-look-x">Variante</label>
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
          <label htmlFor="m-look-h">Schrift der Überschriften</label>
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
