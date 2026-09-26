import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor, errorText } from './editor/Editor';
import { changedSince, docForLesson, duplicateLesson, lessonFromDoc, lessonsOf, newLesson, newModule, subjectsOf, syncLibrary } from './library/model';
import { ModuleView } from './library/ModuleView';
import { Overview } from './library/Overview';
import { SyncDialog } from './library/SyncDialog';
import { go, useRoute } from './library/router';
import type { Lesson, Library, Module, Settings } from './library/types';
import type { Doc } from './model/types';
import { readAnyFile } from './storage/backup';
import { requestPersistentStorage } from './storage/db';
import * as store from './storage/library';

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
      if (doc.icon !== m.icon) putModule({ ...m, icon: doc.icon, updatedAt: Date.now() });
      await putLesson({ ...lesson, doc, updatedAt: Date.now() });
    },
    [putLesson, putModule],
  );

  const markSaved = (t: number) => {
    setInSyncUntil(t);
    store.saveInSyncUntil(t).catch(failed);
  };

  // Sync with the backup file from the other device: newer versions win, deletions are carried over.
  const syncFromFile = async (file: File) => {
    try {
      const opened = await readAnyFile(await file.text());
      if (opened.kind !== 'library') {
        window.alert('Das ist ein einzelnes Arbeitsblatt, keine Sicherung der Bibliothek. Öffne ein Modul und wähle dort „Modul“ → „Arbeitsblatt-Datei als Stunde importieren …“.');
        return;
      }
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
    } catch (e) {
      window.alert('Die Datei konnte nicht geöffnet werden: ' + errorText(e));
    }
  };

  if (loadError) return <div className="lib-error">Die gespeicherten Daten konnten nicht geladen werden: {loadError}</div>;
  if (!lib) return <div className="app-loading" />;

  const toasts = (
    <div className="toasts">
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
    </div>
  );

  let view;
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
      />
    );
  } else if (route.view === 'module') {
    const m = lib.modules.find((x) => x.id === route.id);
    if (!m) return <ToOverview />;
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
        onChangeLesson={(l) => putLesson(l).catch(failed)}
        onDuplicateLesson={(l) => putLesson(duplicateLesson(lib, m, l)).catch(failed)}
        onDeleteLesson={(l) => {
          if (!window.confirm(`Stunde ${l.number} „${l.title}“ löschen? Das lässt sich nicht rückgängig machen.`)) return;
          remove([], [l.id]);
        }}
        onImportFile={async (file) => {
          try {
            const opened = await readAnyFile(await file.text());
            if (opened.kind !== 'doc') {
              window.alert('Das ist eine Sicherung der ganzen Bibliothek. Öffne sie in der Übersicht über „Abgleich Mac/iPad“.');
              return;
            }
            const l = lessonFromDoc(libRef.current!, m, opened.doc);
            await putLesson(l);
            setNotice(`„${file.name}“ als Stunde ${l.number} importiert.`);
          } catch (e) {
            window.alert('Die Datei konnte nicht geöffnet werden: ' + errorText(e));
          }
        }}
      />
    );
  } else {
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
      />
    );
  }

  return (
    <>
      {view}
      {syncOpen && (
        <SyncDialog
          lib={lib}
          inSyncUntil={inSyncUntil}
          onSaved={(t) => {
            markSaved(t);
            setNotice('Sicherung gespeichert. Auf dem anderen Gerät über „Abgleich Mac/iPad“ öffnen.');
          }}
          onOpenFile={syncFromFile}
          onClose={() => setSyncOpen(false)}
        />
      )}
      {toasts}
    </>
  );
}
