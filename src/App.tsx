import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor, errorText } from './editor/Editor';
import { changedSince, docForLesson, duplicateLesson, favoriteBlocks, lessonFromDoc, lessonsOf, modulesOf, newLesson, newModule, slideContext, subjectsOf, syncLibrary, vocabTestLesson } from './library/model';
import { SlidesView } from './slides/SlidesView';
import { slidesFromDoc } from './slides/fromDoc';
import type { Slide } from './model/slides';
import { subjectColor, subjectVars } from './library/subjectColor';
import { ModuleView } from './library/ModuleView';
import { Overview } from './library/Overview';
import { SyncDialog } from './library/SyncDialog';
import { go, useRoute } from './library/router';
import { addPackage, type ImportResult, type ParsedPackage } from './library/package';
import type { Lesson, Library, Module, Settings } from './library/types';
import type { Doc } from './model/types';
import { createPackageFile, createPlanFile, downloadBlob, packageFileName, readAnyFile, safeFileName, type OpenedFile } from './storage/backup';
import { YearPlanView } from './library/YearPlanView';
import { BW_2026_27 } from './library/yearplan';
import { vocabCsv, vocabOf, vocabTestRows } from './model/language';
import { requestPersistentStorage } from './storage/db';
import * as store from './storage/library';

const count = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** What an import did, in one line: "„Hello“ ist jetzt Modul 1 mit 3 Stunden." or "2 Module neu, 1 ergänzt · 12 Stunden neu (10 geplant)." */
function importNotice(results: ImportResult[]): string {
  const added = results.reduce((k, r) => k + r.added, 0);
  const changed = results.reduce((k, r) => k + r.changed, 0);
  const planned = results.reduce((k, r) => k + r.planned, 0);
  const lessons = [added ? count(added, 'Stunde neu', 'Stunden neu') : '', changed ? count(changed, 'Stunde ergänzt', 'Stunden ergänzt') : ''].filter(Boolean).join(', ');
  const plannedText = planned ? ` (${planned} davon geplant)` : '';
  if (results.length === 1) {
    const [r] = results;
    if (r.action === 'neu') return `Importiert: „${r.module.title}“ ist jetzt Modul ${r.module.number} mit ${count(r.added, 'Stunde', 'Stunden')}${plannedText}.`;
    return `Modul ${r.module.number} „${r.module.title}“ ergänzt${lessons ? `: ${lessons}` : ''}${plannedText}.`;
  }
  const fresh = results.filter((r) => r.action === 'neu').length;
  const merged = results.length - fresh;
  const mods = [fresh ? count(fresh, 'Modul neu', 'Module neu') : '', merged ? `${merged} ergänzt` : ''].filter(Boolean).join(', ');
  return `Importiert: ${mods}${lessons ? ` · ${lessons}` : ''}${plannedText}.`;
}

/** Replaces an unknown address (deleted module or lesson) with the overview. */
function ToOverview() {
  useEffect(() => go({ view: 'overview' }, true), []);
  return null;
}

export function App() {
  const [lib, setLib] = useState<Library | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [otherTab, setOtherTab] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // The last change that can be taken back from a notice ("Rückgängig").
  const [undo, setUndo] = useState<{ text: string; run(): void } | null>(null);
  const [inSyncUntil, setInSyncUntil] = useState(0);
  const [syncOpen, setSyncOpen] = useState(false);
  const route = useRoute();
  const libRef = useRef(lib);
  libRef.current = lib;

  useEffect(() => {
    let alive = true;
    Promise.all([store.loadLibrary(), store.loadInSyncUntil()])
      .then(([l, t]) => {
        if (!alive) return;
        setLib(l);
        setInSyncUntil(t);
        store.cleanUpImages(l).catch(() => {});
        requestPersistentStorage();
      })
      .catch((e) => alive && setLoadError(errorText(e)));
    return () => {
      alive = false;
    };
  }, []);

  // Another tab with the Baukasten overwrites the same saved data: say so.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('arbeitsblatt-baukasten');
    ch.onmessage = (e) => {
      if (e.data === 'hallo') ch.postMessage('auch-offen');
      if (e.data === 'hallo' || e.data === 'auch-offen') setOtherTab(true);
    };
    ch.postMessage('hallo');
    return () => ch.close();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 12000);
    return () => clearTimeout(t);
  }, [undo]);

  const failed = (e: unknown) => setNotice('Speichern im Browser fehlgeschlagen: ' + errorText(e));

  const putModule = useCallback((m: Module) => {
    setLib((l) => l && { ...l, modules: l.modules.some((x) => x.id === m.id) ? l.modules.map((x) => (x.id === m.id ? m : x)) : [...l.modules, m] });
    store.saveModule(m).catch(failed);
  }, []);

  const putLesson = useCallback((le: Lesson) => {
    setLib((l) => l && { ...l, lessons: l.lessons.some((x) => x.id === le.id) ? l.lessons.map((x) => (x.id === le.id ? le : x)) : [...l.lessons, le] });
    return store.saveLesson(le);
  }, []);

  const putSettings = useCallback((s: Settings) => {
    const next = { ...s, updatedAt: Date.now() };
    setLib((l) => l && { ...l, settings: next });
    store.saveSettings(next).catch(failed);
  }, []);

  /** Removes modules and lessons, and remembers them as deleted so a sync with the other device does not bring them back. */
  const remove = useCallback((moduleIds: string[], lessonIds: string[]) => {
    const l = libRef.current!;
    const now = Date.now();
    const deleted = { ...l.deleted };
    for (const id of [...moduleIds, ...lessonIds]) deleted[id] = now;
    setLib({ ...l, deleted, modules: l.modules.filter((m) => !moduleIds.includes(m.id)), lessons: l.lessons.filter((x) => !lessonIds.includes(x.id)) });
    store.deleteEntries(moduleIds, lessonIds).catch(failed);
    store.saveDeleted(deleted).catch(failed);
  }, []);

  // Saving from the editor: the lesson's document; a new topic icon chosen there applies to the whole module.
  const saveLessonDoc = useCallback(
    (lessonId: string) => async (doc: Doc) => {
      const l = libRef.current;
      const lesson = l?.lessons.find((x) => x.id === lessonId);
      const m = lesson && l?.modules.find((x) => x.id === lesson.moduleId);
      if (!lesson || !m) return;
      // Icon, language and the help switch belong to the module: set in one worksheet, they apply to all.
      if (doc.icon !== m.icon || doc.lang !== m.lang || doc.help !== m.help) putModule({ ...m, icon: doc.icon, lang: doc.lang, help: doc.help, updatedAt: Date.now() });
      await putLesson({ ...lesson, doc, updatedAt: Date.now() });
    },
    [putLesson, putModule],
  );

  /** Replaces a lesson's slides; the notice can bring the old ones back. */
  const replaceSlides = (lessonId: string, make: (l: Lesson, m: Module) => Slide[] | null, text: (n: number) => string) => {
    const lib = libRef.current!;
    const l = lib.lessons.find((x) => x.id === lessonId);
    const m = l && lib.modules.find((x) => x.id === l.moduleId);
    if (!l || !m) return;
    const slides = make(l, m);
    if (!slides) return;
    const before = l.slides;
    putLesson({ ...l, slides, updatedAt: Date.now() }).catch(failed);
    setUndo({
      text: text(slides.length),
      run: () => {
        const now = libRef.current!.lessons.find((x) => x.id === lessonId);
        if (now) putLesson({ ...now, slides: before, updatedAt: Date.now() }).catch(failed);
        setUndo(null);
      },
    });
  };

  /** New slides from the worksheet (`doc`: as it is in the editor right now). */
  const regenerateSlides = (lessonId: string, doc?: Doc) =>
    replaceSlides(
      lessonId,
      (l, m) => {
        const n = l.slides.length;
        if (n && !window.confirm(`Die ${n === 1 ? 'Folie' : `${n} Folien`} von Stunde ${l.number} „${l.title}“ durch neue aus dem Arbeitsblatt ersetzen?`)) return null;
        return slidesFromDoc(doc ? { ...doc, lang: m.lang } : docForLesson(m, l), l.title);
      },
      (n) => `${n} ${n === 1 ? 'Folie' : 'Folien'} aus dem Arbeitsblatt erzeugt.`,
    );

  const deleteSlides = (lessonId: string) =>
    replaceSlides(
      lessonId,
      (l) => {
        const n = l.slides.length;
        if (!n || !window.confirm(`${n === 1 ? 'Die Folie' : `Alle ${n} Folien`} von Stunde ${l.number} „${l.title}“ löschen?`)) return null;
        return [];
      },
      () => 'Alle Folien der Stunde gelöscht.',
    );

  const markSaved = (t: number) => {
    setInSyncUntil(t);
    store.saveInSyncUntil(t).catch(failed);
  };

  // Sync with the backup file from the other device: newer versions win, deletions are carried over.
  const syncWith = async (opened: Extract<OpenedFile, { kind: 'library' }>) => {
    const r = syncLibrary(libRef.current!, opened.library);
    await store.replaceWhole(r.library);
    setLib(r.library);
    // Nothing here is newer than the file: this device is exactly as saved in it.
    if (r.keptHere === 0 && opened.savedAt > inSyncUntil) markSaved(opened.savedAt);
    setSyncOpen(false);
    const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
    setNotice(
      r.fromFile + r.removed === 0
        ? 'Abgeglichen: Auf diesem Gerät war schon alles aktuell.'
        : `Abgeglichen: ${n(r.fromFile, 'Eintrag', 'Einträge')} übernommen${r.removed ? `, ${n(r.removed, 'gelöscht', 'gelöscht')}` : ''}${r.keptHere ? `, ${n(r.keptHere, 'Eintrag', 'Einträge')} hier neuer (jetzt sichern!)` : ''}.`,
    );
  };

  // A Stundenpaket (e.g. made by Claude) becomes new modules or completes existing ones; a year plan may also bring the school year.
  // `stay`: imported from the year plan, which stays open.
  const importPackage = async (pkg: ParsedPackage, stay = false) => {
    const lib = libRef.current!;
    const r = addPackage(lib, pkg);
    for (const m of r.modules) putModule(m);
    for (const l of r.lessons) await putLesson(l);
    const year = pkg.schoolYear;
    if (year && JSON.stringify(year) !== JSON.stringify(lib.settings.schoolYear)) {
      const replace = !lib.settings.schoolYear || window.confirm(`Das Paket enthält das Schuljahr ${year.name || ''} mit ${year.holidays.length} Ferienzeiten. Soll es das eingetragene Schuljahr ${lib.settings.schoolYear.name} ersetzen?`);
      if (replace) putSettings({ ...lib.settings, schoolYear: year });
    }
    setSyncOpen(false);
    setNotice(importNotice(r.results));
    const [first] = r.results.map((x) => x.module);
    if (!stay && first) {
      if (r.results.length === 1) go({ view: 'module', id: first.id });
      else go({ view: 'overview', subject: first.subject, grade: first.grade });
    }
    if (r.notes.length) {
      const shown = r.notes.slice(0, 12);
      const more = r.notes.length - shown.length;
      window.alert(`Das Stundenpaket wurde importiert. Dabei musste einiges angepasst werden:\n\n• ${shown.join('\n• ')}${more ? `\n… und ${more} weitere` : ''}`);
    }
  };

  /** Opens any file of the Baukasten: library backup (sync), Stundenpaket (new module) or worksheet (new lesson in `into`). */
  const openFile = async (file: File, into?: Module) => {
    try {
      const opened = await readAnyFile(await file.text());
      if (opened.kind === 'library') return await syncWith(opened);
      if (opened.kind === 'package') return await importPackage(opened.pkg);
      if (!into) {
        window.alert('Das ist ein einzelnes Arbeitsblatt. Öffne das Modul, zu dem es gehört, und wähle dort „Modul“ → „Arbeitsblatt-Datei als Stunde importieren …“.');
        return;
      }
      const l = lessonFromDoc(libRef.current!, into, opened.doc);
      await putLesson(l);
      setNotice(`„${file.name}“ als Stunde ${l.number} importiert.`);
    } catch (e) {
      window.alert('Die Datei konnte nicht geöffnet werden: ' + errorText(e));
    }
  };

  if (loadError) return <div className="lib-error">Die gespeicherten Daten konnten nicht geladen werden: {loadError}</div>;
  if (!lib) return <div className="app-loading" />;

  const toasts = (
    <div className="toasts" data-noprint="1">
      {otherTab && (
        <div className="toast is-warn" role="alert">
          <span>Der Baukasten ist noch in einem anderen Tab oder Fenster offen. Bearbeite nur in einem davon, sonst überschreiben sich die Änderungen.</span>
          <button type="button" className="toast-btn" onClick={() => setOtherTab(false)}>
            Verstanden
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
        </div>
      )}
      {undo && (
        <div className="toast" role="status">
          <span>{undo.text}</span>
          <button type="button" className="toast-btn" onClick={undo.run}>
            Rückgängig
          </button>
        </div>
      )}
    </div>
  );

  let view;
  // The app takes the colour of the subject in view (the printed pages keep theirs).
  let subject = '';
  if (route.view === 'lesson') {
    const lesson = lib.lessons.find((l) => l.id === route.id);
    const m = lesson && lib.modules.find((x) => x.id === lesson.moduleId);
    if (!lesson || !m) return <ToOverview />;
    view = (
      <Editor
        key={lesson.id}
        initialDoc={docForLesson(m, lesson)}
        onSave={saveLessonDoc(lesson.id)}
        onBack={() => go({ view: 'module', id: m.id })}
        place={`${m.subject} · Klasse ${m.grade} · Modul ${m.number} · Stunde ${lesson.number}: ${lesson.title}`}
        codeLocked
        competences={m.competences}
        note={lesson.plan}
        favorites={{ label: `Oft in ${m.subject}`, types: favoriteBlocks(lib, m.subject) }}
        onSlides={() => go({ view: 'slides', id: lesson.id })}
        slideCount={lesson.slides.length}
        onRegenerateSlides={(doc) => regenerateSlides(lesson.id, doc)}
        onDeleteSlides={() => deleteSlides(lesson.id)}
      />
    );
    subject = m.subject;
  } else if (route.view === 'slides') {
    const lesson = lib.lessons.find((l) => l.id === route.id);
    const m = lesson && lib.modules.find((x) => x.id === lesson.moduleId);
    if (!lesson || !m) return <ToOverview />;
    view = (
      <SlidesView
        key={lesson.id}
        slides={lesson.slides}
        ctx={slideContext(m, lesson, lib.settings)}
        doc={docForLesson(m, lesson)}
        lessonTitle={lesson.title}
        place={`${m.subject} · Klasse ${m.grade} · Modul ${m.number} · Stunde ${lesson.number}: ${lesson.title}`}
        onChange={(slides) => {
          const current = libRef.current?.lessons.find((l) => l.id === lesson.id) ?? lesson;
          putLesson({ ...current, slides, updatedAt: Date.now() }).catch(failed);
        }}
        onBack={() => go({ view: 'module', id: m.id })}
        onOpenSheet={() => go({ view: 'lesson', id: lesson.id })}
      />
    );
    subject = m.subject;
  } else if (route.view === 'plan') {
    const { grade } = route;
    subject = route.subject;
    view = (
      <YearPlanView
        lib={lib}
        subject={subject}
        grade={grade}
        onBack={() => go({ view: 'overview', subject, grade })}
        onChangeModule={putModule}
        onOpenModule={(m) => go({ view: 'module', id: m.id })}
        onSetSchoolYear={() => putSettings({ ...lib.settings, schoolYear: BW_2026_27 })}
        onSaveSettings={putSettings}
        onImport={(pkg) => importPackage(pkg, true)}
        onExport={async () => {
          try {
            const entries = modulesOf(lib, subject, grade).map((m) => ({ module: m, lessons: lessonsOf(lib, m.id) }));
            const file = await createPlanFile(entries, lib.settings.schoolYear);
            downloadBlob(new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }), `${safeFileName(`Jahresplan ${subject} Klasse ${grade}`)}.json`);
          } catch (e) {
            window.alert('Der Jahresplan konnte nicht gesichert werden: ' + errorText(e));
          }
        }}
      />
    );
  } else if (route.view === 'module') {
    const m = lib.modules.find((x) => x.id === route.id);
    if (!m) return <ToOverview />;
    subject = m.subject;
    const lessons = lessonsOf(lib, m.id);
    view = (
      <ModuleView
        module={m}
        lessons={lessons}
        subjects={subjectsOf(lib)}
        settings={lib.settings}
        onBack={() => go({ view: 'overview', subject: m.subject, grade: m.grade })}
        onChange={putModule}
        onDelete={() => {
          if (!window.confirm(`Modul „${m.title}“ mit ${lessons.length} Stunden löschen? Das lässt sich nicht rückgängig machen.`)) return;
          remove(
            [m.id],
            lessons.map((l) => l.id),
          );
          go({ view: 'overview', subject: m.subject, grade: m.grade });
        }}
        onAddLesson={() => {
          const l = newLesson(lib, m);
          putLesson(l).catch(failed);
          go({ view: 'lesson', id: l.id });
        }}
        onOpenLesson={(l) => go({ view: 'lesson', id: l.id })}
        onOpenSlides={(l) => go({ view: 'slides', id: l.id })}
        onRegenerateSlides={(l) => regenerateSlides(l.id)}
        onDeleteSlides={(l) => deleteSlides(l.id)}
        onChangeLesson={(l) => putLesson(l).catch(failed)}
        onDuplicateLesson={(l) => putLesson(duplicateLesson(lib, m, l)).catch(failed)}
        onDeleteLesson={(l) => {
          if (!window.confirm(`Stunde ${l.number} „${l.title}“ löschen? Das lässt sich nicht rückgängig machen.`)) return;
          remove([], [l.id]);
        }}
        onImportFile={(file) => openFile(file, m)}
        onExportVocab={() => {
          const csv = vocabCsv(vocabOf(lessons.map((l) => l.doc)));
          downloadBlob(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), `${safeFileName(`Vokabeln K${m.grade} M${m.number} ${m.title}`)}.csv`);
        }}
        onVocabTest={(o) => {
          const rows = vocabTestRows(vocabOf(lessons.map((l) => l.doc)), o.count, o.direction, Math.random);
          const l = vocabTestLesson(lib, m, rows, o.fold, o.gradeScale, o.direction === 'mixed' ? null : o.direction === 'de-en');
          putLesson(l).catch(failed);
          go({ view: 'lesson', id: l.id });
        }}
        onExportPackage={async () => {
          try {
            const pkg = await createPackageFile(m, lessons);
            downloadBlob(new Blob([JSON.stringify(pkg, null, 1)], { type: 'application/json' }), packageFileName(m));
          } catch (e) {
            window.alert('Das Stundenpaket konnte nicht erstellt werden: ' + errorText(e));
          }
        }}
      />
    );
  } else {
    const subjects = subjectsOf(lib);
    subject = route.subject && subjects.includes(route.subject) ? route.subject : (subjects[0] ?? '');
    view = (
      <Overview
        lib={lib}
        subject={route.subject}
        grade={route.grade}
        onPick={(subject, grade) => go({ view: 'overview', subject, grade }, true)}
        onOpenModule={(m) => go({ view: 'module', id: m.id })}
        onOpenLesson={(l) => go({ view: 'lesson', id: l.id })}
        onAddModule={(subject, grade) => {
          const m = newModule(lib, subject, grade);
          putModule(m);
          go({ view: 'module', id: m.id });
        }}
        onAddSubject={(name) => !subjectsOf(lib).includes(name) && putSettings({ ...lib.settings, subjects: [...lib.settings.subjects, name] })}
        onRemoveSubject={(name) => putSettings({ ...lib.settings, subjects: lib.settings.subjects.filter((s) => s !== name) })}
        onSettings={putSettings}
        pending={changedSince(lib, inSyncUntil)}
        onSync={() => setSyncOpen(true)}
        onOpenFile={(file) => openFile(file)}
        onOpenPlan={(subject, grade) => go({ view: 'plan', subject, grade })}
      />
    );
  }

  return (
    <>
      <div className="subject-scope" style={subject ? subjectVars(subjectColor(lib.settings, subject)) : undefined}>
        {view}
      </div>
      {syncOpen && (
        <SyncDialog
          lib={lib}
          inSyncUntil={inSyncUntil}
          onSaved={(t) => {
            markSaved(t);
            setNotice('Sicherung gespeichert. Auf dem anderen Gerät über „Abgleich Mac/iPad“ öffnen.');
          }}
          onOpenFile={(file) => openFile(file)}
          onClose={() => setSyncOpen(false)}
        />
      )}
      {toasts}
    </>
  );
}
