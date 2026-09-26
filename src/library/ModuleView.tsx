// One module: its data, the lessons (content overview) and the competence grid, with A4 prints of both.
import { useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, FileInput, ListChecks, Plus, Printer, SquarePen, Table, Trash2 } from 'lucide-react';
import { IconPickerField, NumberField } from '../editor/fields';
import { Menu } from '../editor/TopBar';
import { Icon } from '../icons';
import { THEMES } from '../model/themes';
import { topicIcon } from '../topicIcons';
import { ModulePrint, type PrintKind } from './ModulePrint';
import { competenceLessons, competenceLinks, linkLabel, newCompetence, type CompetenceLink } from './model';
import type { Competence, Lesson, Module, Settings } from './types';
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
  onChangeLesson(l: Lesson): void;
  onDuplicateLesson(l: Lesson): void;
  onDeleteLesson(l: Lesson): void;
  onImportFile(file: File): void;
}

type Tab = 'inhalt' | 'raster';

export function ModuleView(p: ModuleViewProps) {
  const m = p.module;
  const [tab, setTab] = useState<Tab>('inhalt');
  const [printing, setPrinting] = useState<PrintKind | null>(null);
  const [iconOpen, setIconOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Module>) => p.onChange({ ...m, ...patch, updatedAt: Date.now() });

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
        <Menu
          label="Drucken"
          icon={Printer}
          items={[
            { label: 'Inhaltsübersicht', icon: ListChecks, onClick: () => setPrinting('inhalt') },
            { label: 'Kompetenzraster', icon: Table, onClick: () => setPrinting('raster') },
          ]}
        />
        <Menu
          label="Modul"
          icon={SquarePen}
          items={[
            { label: 'Arbeitsblatt-Datei als Stunde importieren …', icon: FileInput, onClick: () => fileInput.current?.click() },
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
          </button>
          <button type="button" role="tab" aria-selected={tab === 'raster'} className={'lib-tab' + (tab === 'raster' ? ' is-on' : '')} onClick={() => setTab('raster')}>
            <Icon icon={Table} />
            Kompetenzraster · {m.competences.length}
          </button>
        </div>

        {tab === 'inhalt' ? <LessonList {...p} /> : <CompetenceGrid competences={m.competences} links={competenceLinks(p.lessons)} onChange={(competences) => set({ competences })} />}
      </main>
    </div>
  );
}

function LessonList(p: ModuleViewProps) {
  return (
    <section className="lib-section">
      <div className="lib-lessons">
        {p.lessons.map((l) => (
          <div key={l.id} className="lib-lesson">
            <div className="lib-lesson-num">
              <NumberField label="Stunde" value={l.number} min={1} max={99} onChange={(number) => p.onChangeLesson({ ...l, number, updatedAt: Date.now() })} />
            </div>
            <div className="lib-lesson-main">
              <input className="input lib-lesson-title" aria-label="Thema der Stunde" value={l.title} onChange={(e) => p.onChangeLesson({ ...l, title: e.target.value, updatedAt: Date.now() })} />
              <div className="lib-lesson-pages">
                {l.doc.pages.map((pg, k) => (
                  <span key={k} className="lib-page-chip">
                    <span className="lib-page-dot" style={{ background: THEMES[pg.type].circle }} />
                    {pg.title}
                    <span className="lib-page-type">{THEMES[pg.type].label}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="lib-lesson-actions">
              <button type="button" className="btn btn-primary ui-btn" onClick={() => p.onOpenLesson(l)}>
                Öffnen
              </button>
              <button type="button" className="iconbtn" title="Duplizieren" aria-label="Duplizieren" onClick={() => p.onDuplicateLesson(l)}>
                <Icon icon={Copy} />
              </button>
              <button type="button" className="iconbtn is-danger" title="Löschen" aria-label="Löschen" onClick={() => p.onDeleteLesson(l)}>
                <Icon icon={Trash2} />
              </button>
            </div>
          </div>
        ))}
        {p.lessons.length === 0 && <p className="lib-empty">Noch keine Stunden. Lege die erste an oder importiere eine Arbeitsblatt-Datei.</p>}
      </div>
      <button type="button" className="btn btn-secondary ui-btn lib-add" onClick={p.onAddLesson}>
        <Icon icon={Plus} />
        Neue Stunde
      </button>
    </section>
  );
}

function CompetenceGrid({ competences, links, onChange }: { competences: Competence[]; links: Map<string, CompetenceLink[]>; onChange(c: Competence[]): void }) {
  const update = (i: number, patch: Partial<Competence>) => onChange(competences.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= competences.length) return;
    const next = [...competences];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <section className="lib-section">
      <p className="lib-help">
        Je Zeile eine Kompetenz mit „Ich kann …“-Sätzen für die Niveaus G (grundlegend), M (mittel) und E (erweitert). Gedruckt wird ein Raster zum Ankreuzen für die Klasse.
      </p>
      <div className="lib-comps">
        {competences.map((c, i) => (
          <div key={c.id} className="lib-comp">
            <div className="lib-comp-head">
              <div className="field is-wide">
                <label htmlFor={'a' + c.id}>Kompetenz</label>
                <input id={'a' + c.id} className="input" value={c.area} placeholder="z. B. Den Treibhauseffekt erklären" onChange={(e) => update(i, { area: e.target.value })} />
              </div>
              <div className="field lib-comp-lessons">
                <label htmlFor={'l' + c.id}>Stunde(n)</label>
                <input id={'l' + c.id} className="input" value={c.lessons} placeholder={competenceLessons({ ...c, lessons: '' }, links.get(c.id)) || '2, 3'} onChange={(e) => update(i, { lessons: e.target.value })} />
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
      <button type="button" className="btn btn-secondary ui-btn lib-add" onClick={() => onChange([...competences, newCompetence()])}>
        <Icon icon={Plus} />
        Kompetenz
      </button>
    </section>
  );
}
