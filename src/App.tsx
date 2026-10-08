import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor, errorText } from './editor/Editor';
import {
  changedSince,
  docForLesson,
  duplicateLesson,
  earlierLessons,
  favoriteBlocks,
  lessonFromDoc,
  lessonsOf,
  modulesOf,
  newLesson,
  newModule,
  restoreFromTrash,
  slideContext,
  subjectsOf,
  syncLibrary,
  toTrash,
  vocabTestLesson,
  gradeVocab,
  vocabLesson,
} from './library/model';
import { noteRecent } from './library/recent';
import type { Here, SearchEntry } from './library/search';
import { SearchContext, SearchDialog } from './library/SearchDialog';
import { TrashDialog } from './library/TrashDialog';
import { handoutPages, handoutTitle, type AssignmentPage, type Handout } from './share/assignment';
import { EvaluationView } from './share/EvaluationView';
import { ShareDialog } from './share/ShareDialog';
import { VersionsDialog } from './library/VersionsDialog';
import { whenText } from './library/when';
import { SlidesView } from './slides/SlidesView';
import { enterFullscreen } from './slides/Presenter';
import { slidesFromDoc } from './slides/fromDoc';
import type { Slide } from './model/slides';
import { subjectColor, subjectVars } from './library/subjectColor';
import { ModuleView } from './library/ModuleView';
import { Overview } from './library/Overview';
import { SyncDialog } from './library/SyncDialog';
import { go, useRoute } from './library/router';
import { addPackage, type ImportResult, type ParsedPackage } from './library/package';
import type { Lesson, LessonVersion, Library, Module, Settings, TrashEntry } from './library/types';
import type { Doc } from './model/types';
import { createPackageFile, createPlanFile, downloadBlob, packageFileName, readAnyFile, safeFileName, type OpenedFile } from './storage/backup';
import { YearPlanView } from './library/YearPlanView';
import { BW_2026_27 } from './library/yearplan';
import { lessonContext } from './ai/context';
import { AiGradeContext } from './ai/ImageAiPane';
import { classNotes, ClassNotesContext } from './ai/classNotes';
import { applyModulePlan } from './ai/moduleplan';
import { vocabCsv, vocabOf, vocabTestRows } from './model/language';
import { requestPersistentStorage } from './storage/db';
import { AutoSync, type SyncStatus } from './sync/engine';
import type { MergeResult } from './sync/merge';
import * as store from './storage/library';

/** Where a hit of the search is to be shown: a block on the worksheet or a slide, with the words to mark. */
export interface Jump {
  lessonId: string;
  blockId?: string;
  slideId?: string;
  query: string;
  /** Changes with every jump, so a second jump to the same place works too. */
  n: number;
}

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
  const [trash, setTrash] = useState<TrashEntry[]>([]);
  const trashRef = useRef(trash);
  trashRef.current = trash;
  const [trashOpen, setTrashOpen] = useState(false);
  /** The lesson whose earlier versions are shown. */
  const [versionsOf, setVersionsOf] = useState<string | null>(null);
  /** Counts restores, so the editor starts again with the restored lesson. */
  const [editorRev, setEditorRev] = useState(0);
  /** When each lesson was last kept as a version in this session. */
  const versionTimes = useRef(new Map<string, number>());
  const [searchOpen, setSearchOpen] = useState(false);
  const [jump, setJump] = useState<Jump | null>(null);
  /** A lesson whose slides start presenting when they open ("Präsentieren" in the module or worksheet). */
  const [presentNext, setPresentNext] = useState<string | null>(null);
  const present = (lessonId: string) => {
    // Full screen needs the tap itself (the iPad allows it only then), so before the slides open.
    enterFullscreen();
    setPresentNext(lessonId);
    go({ view: 'slides', id: lessonId });
  };
  /** What is being handed out digitally (from the editor). */
  const [sharing, setSharing] = useState<{ lessonId: string; pages: AssignmentPage[]; title: string } | null>(null);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const route = useRoute();
  const routeRef = useRef(route);
  routeRef.current = route;
  const libRef = useRef(lib);
  libRef.current = lib;

  // The automatic sync with the other device (through the server, encrypted with the pairing code).
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: 'aus' });
  const [joinCode, setJoinCode] = useState<string | undefined>();
  const autoSync = useRef<AutoSync | null>(null);
  const applyRemote = useRef<(r: MergeResult) => Promise<void>>(async () => {});

  useEffect(() => {
    let alive = true;
    Promise.all([store.loadLibrary(), store.loadInSyncUntil()])
      .then(([l, t]) => {
        if (!alive) return;
        setLib(l);
        libRef.current = l;
        setInSyncUntil(t);
        requestPersistentStorage();
        const sync = new AutoSync({ getLib: () => libRef.current, apply: (r) => applyRemote.current(r), onStatus: setSyncStatus });
        autoSync.current = sync;
        sync
          .load()
          .then((on) => (on ? sync.run() : undefined))
          .catch(() => {});
        store
          .loadTrash()
          .then((t) => {
            if (!alive) return;
            setTrash(t);
            store.saveTrash(t).catch(() => {});
            // Images of the trash and of earlier versions stay; only what nothing uses goes.
            store.cleanUpImages(l).catch(() => {});
          })
          .catch(() => {});
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

  // ⌘K (Ctrl+K) opens the search everywhere, except while presenting.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k' && !document.querySelector('.sl-present')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    // Capture: parts that keep keys to themselves (the block toolbar) must not swallow it.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // The lessons opened last, for the empty search.
  const openLesson = route.view === 'lesson' || route.view === 'slides' ? route.id : '';
  useEffect(() => {
    if (openLesson) noteRecent(openLesson);
    // A jump from the search is done once its lesson is left.
    setJump((j) => (j && j.lessonId === openLesson ? j : null));
  }, [openLesson]);

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
  // A PDF chosen in the module for a new lesson: the lesson's editor takes it and opens "PDF einpflegen".
  const [pendingPdf, setPendingPdf] = useState<{ lessonId: string; file: File } | null>(null);
  const takePdf = useCallback(() => setPendingPdf(null), []);

  const putModule = useCallback((m: Module) => {
    setLib((l) => l && { ...l, modules: l.modules.some((x) => x.id === m.id) ? l.modules.map((x) => (x.id === m.id ? m : x)) : [...l.modules, m] });
    store.saveModule(m).catch(failed);
  }, []);

  const putLesson = useCallback((le: Lesson) => {
    const put = (l: Library): Library => ({ ...l, lessons: l.lessons.some((x) => x.id === le.id) ? l.lessons.map((x) => (x.id === le.id ? le : x)) : [...l.lessons, le] });
    // An earlier version: how the lesson looked before the first change of a session, then at most every half hour.
    const before = libRef.current?.lessons.find((x) => x.id === le.id);
    const now = Date.now();
    if (before && before !== le && now - (versionTimes.current.get(le.id) ?? 0) > 30 * 60 * 1000) {
      versionTimes.current.set(le.id, now);
      store.keepVersion(before).catch(() => {});
    }
    // At once, so a second change right after this one (slides, then their design) builds on it.
    if (libRef.current) libRef.current = put(libRef.current);
    setLib((l) => l && put(l));
    return store.saveLesson(le);
  }, []);

  const putHandout = useCallback((h: Handout) => {
    const put = (l: Library): Library => ({ ...l, handouts: l.handouts.some((x) => x.id === h.id) ? l.handouts.map((x) => (x.id === h.id ? h : x)) : [...l.handouts, h] });
    if (libRef.current) libRef.current = put(libRef.current);
    setLib((l) => l && put(l));
    store.saveHandout(h).catch(failed);
  }, []);

  const putSettings = useCallback((s: Settings) => {
    const next = { ...s, updatedAt: Date.now() };
    setLib((l) => l && { ...l, settings: next });
    store.saveSettings(next).catch(failed);
  }, []);

  const putTrash = (t: TrashEntry[]) => {
    trashRef.current = t;
    setTrash(t);
    store.saveTrash(t).catch(failed);
  };

  /**
   * Moves modules and lessons to the trash, and remembers them as deleted so a sync with the other device does not
   * bring them back. The notice can take it back.
   */
  const remove = (moduleIds: string[], lessonIds: string[], text: string) => {
    const l = libRef.current!;
    const now = Date.now();
    const entries = toTrash(l, moduleIds, lessonIds, now);
    putTrash([...entries, ...trashRef.current]);
    const deleted = { ...l.deleted };
    for (const id of [...moduleIds, ...lessonIds]) deleted[id] = now;
    const next = { ...l, deleted, modules: l.modules.filter((m) => !moduleIds.includes(m.id)), lessons: l.lessons.filter((x) => !lessonIds.includes(x.id)) };
    libRef.current = next;
    setLib(next);
    store.deleteEntries(moduleIds, lessonIds).catch(failed);
    store.saveDeleted(deleted).catch(failed);
    setUndo({
      text: `${text} liegt im Papierkorb.`,
      run: () => {
        for (const e of entries) restore(e.id, true);
        setUndo(null);
      },
    });
  };

  // What the automatic sync brings from the other device: stored here, deleted lessons into the trash, the losing
  // side of a conflict kept as an earlier version, and the open worksheet loaded again if it changed.
  applyRemote.current = async (r: MergeResult) => {
    const before = libRef.current!;
    if (r.removedModules.length || r.removedLessons.length) {
      const entries = toTrash(before, r.removedModules, r.removedLessons, Date.now());
      if (entries.length) putTrash([...entries, ...trashRef.current]);
    }
    for (const k of r.keep) store.keepVersion(k.lesson, k.reason).catch(() => {});
    libRef.current = r.library;
    setLib(r.library);
    const writes: Promise<unknown>[] = [
      ...r.modules.map((m) => store.saveModule(m)),
      ...r.lessons.map((l) => store.saveLesson(l)),
      ...r.handouts.map((h) => store.saveHandout(h)),
    ];
    if (r.settings) writes.push(store.saveSettings(r.library.settings));
    if (r.deleted) writes.push(store.saveDeleted(r.library.deleted));
    if (r.removedModules.length || r.removedLessons.length) writes.push(store.deleteEntries(r.removedModules, r.removedLessons));
    await Promise.all(writes).catch(failed);
    const here = routeRef.current;
    const open = here.view === 'lesson' || here.view === 'slides' ? here.id : '';
    // Not while presenting: the slides on the projector stay until the end.
    if (open && (r.lessons.some((l) => l.id === open) || r.removedLessons.includes(open)) && !document.querySelector('.sl-present')) setEditorRev((n) => n + 1);
    if (r.conflicts.length)
      setNotice(
        `${r.conflicts.length === 1 ? `„${r.conflicts[0]}“ wurde` : `${r.conflicts.length} Stunden wurden`} auf beiden Geräten geändert. Die neuere Fassung gilt, die andere steht unter „Frühere Fassungen“.`,
      );
  };

  // Sync a few seconds after every change, every three minutes, and when the device is back online or in front.
  useEffect(() => {
    if (lib) autoSync.current?.poke();
  }, [lib]);
  useEffect(() => {
    const now = () => void autoSync.current?.run();
    const visible = () => document.visibilityState === 'visible' && now();
    const t = window.setInterval(now, 3 * 60 * 1000);
    window.addEventListener('online', now);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('online', now);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  // A pairing link (QR code scanned with the camera app) opens the sync dialog with its code.
  const pairCode = route.view === 'overview' ? route.pair : undefined;
  useEffect(() => {
    if (!pairCode) return;
    setJoinCode(pairCode);
    setSyncOpen(true);
    go({ view: 'overview' }, true);
  }, [pairCode]);

  /** Brings a trash entry back. */
  const restore = (entryId: string, quiet = false) => {
    const r = restoreFromTrash(libRef.current!, trashRef.current, entryId, Date.now());
    if ('error' in r) {
      setNotice(r.error);
      return;
    }
    for (const m of r.modules) putModule(m);
    for (const l of r.lessons) putLesson(l).catch(failed);
    putTrash(r.trash);
    if (!quiet) setNotice(r.modules.length ? `Modul „${r.modules[0].title}“ ist wieder da.` : `Stunde „${r.lessons[0]?.title}“ ist wieder da.`);
  };

  /** Removes trash entries for good, with the earlier versions of their lessons. */
  const purge = (entryIds: string[]) => {
    const gone = trashRef.current.filter((e) => entryIds.includes(e.id));
    putTrash(trashRef.current.filter((e) => !entryIds.includes(e.id)));
    store.deleteVersions(gone.flatMap((e) => e.lessons.map((l) => l.id))).catch(() => {});
  };

  /** A lesson back as it was in an earlier version; the state now becomes a version itself. */
  const restoreVersion = (v: LessonVersion) => {
    const now = libRef.current!.lessons.find((x) => x.id === v.lesson.id);
    if (!now) return;
    store.keepVersion(now, 'Vor dem Wiederherstellen').catch(() => {});
    versionTimes.current.set(now.id, Date.now());
    putLesson({ ...v.lesson, moduleId: now.moduleId, number: now.number, updatedAt: Date.now() }).catch(failed);
    setEditorRev((r) => r + 1);
    setVersionsOf(null);
    setNotice(`Die Fassung von ${whenText(v.at)} ist wiederhergestellt. Die bisherige steht unter „Frühere Fassungen“.`);
  };

  /** An earlier version as a new lesson next to the current one. */
  const copyVersion = (v: LessonVersion) => {
    const lib = libRef.current!;
    const now = lib.lessons.find((x) => x.id === v.lesson.id);
    const m = lib.modules.find((x) => x.id === (now ?? v.lesson).moduleId);
    if (!m) return;
    const copy = { ...duplicateLesson(lib, m, v.lesson), title: `${v.lesson.title} (Fassung ${whenText(v.at)})` };
    putLesson(copy).catch(failed);
    setVersionsOf(null);
    go({ view: 'lesson', id: copy.id });
  };

  /** Keeps the lessons that `next` changes as earlier versions (before a sync or an import). */
  const keepChanged = (before: Library, next: Lesson[], reason: string) => {
    for (const l of next) {
      const old = before.lessons.find((x) => x.id === l.id);
      if (old && old.updatedAt !== l.updatedAt) store.keepVersion(old, reason).catch(() => {});
    }
  };

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
    if (l.slides.length) store.keepVersion(l, 'Vor neuen Folien').catch(() => {});
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
        return slidesFromDoc(doc ? { ...doc, lang: m.lang } : docForLesson(m, l), l.title, { earlier: earlierLessons(libRef.current!, m, l), lessonNumber: l.number });
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
    keepChanged(libRef.current!, r.library.lessons, 'Vor dem Abgleich');
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
    keepChanged(lib, r.lessons, 'Vor dem Import');
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

  /** Opens what the search found; a block or slide is selected, its words marked. */
  const openHit = (e: SearchEntry, query: string) => {
    setSearchOpen(false);
    const n = Date.now();
    if (e.kind === 'module') go({ view: 'module', id: e.module.id });
    else if (e.kind === 'lesson' && e.lesson) go({ view: 'lesson', id: e.lesson.id });
    else if (e.kind === 'block' && e.lesson) {
      setJump({ lessonId: e.lesson.id, blockId: e.blockId, query, n });
      go({ view: 'lesson', id: e.lesson.id });
    } else if (e.kind === 'slide' && e.lesson) {
      setJump({ lessonId: e.lesson.id, slideId: e.slideId, query, n });
      go({ view: 'slides', id: e.lesson.id });
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
  // Subject and grade in view: their hits come first in the search.
  let here: Here = {};
  if (route.view === 'lesson') {
    const lesson = lib.lessons.find((l) => l.id === route.id);
    const m = lesson && lib.modules.find((x) => x.id === lesson.moduleId);
    if (!lesson || !m) return <ToOverview />;
    view = (
      <Editor
        key={`${lesson.id}:${editorRev}`}
        initialDoc={docForLesson(m, lesson)}
        onSave={saveLessonDoc(lesson.id)}
        onBack={() => go({ view: 'module', id: m.id })}
        place={`${m.subject} · Klasse ${m.grade} · Modul ${m.number} · Stunde ${lesson.number}: ${lesson.title}`}
        codeLocked
        competences={m.competences}
        note={lesson.plan}
        favorites={{ label: `Oft in ${m.subject}`, types: favoriteBlocks(lib, m.subject) }}
        pdf={pendingPdf?.lessonId === lesson.id ? pendingPdf.file : undefined}
        onPdfTaken={takePdf}
        onSlides={() => go({ view: 'slides', id: lesson.id })}
        onPresent={() => present(lesson.id)}
        slideCount={lesson.slides.length}
        onRegenerateSlides={(doc) => regenerateSlides(lesson.id, doc)}
        onDeleteSlides={() => deleteSlides(lesson.id)}
        onVersions={() => setVersionsOf(lesson.id)}
        focus={jump?.lessonId === lesson.id && jump.blockId ? { id: jump.blockId, query: jump.query, n: jump.n } : undefined}
        onShare={(doc, ids) => {
          const pages = handoutPages(doc, ids);
          if (pages.length) setSharing({ lessonId: lesson.id, pages, title: handoutTitle(pages, lesson.title) });
        }}
        handouts={lib.handouts.filter((h) => h.lessonId === lesson.id).sort((a, b) => b.createdAt - a.createdAt)}
        onOpenHandout={(id) => go({ view: 'results', id })}
        ai={{
          module: m,
          lesson,
          context: (wishes) => lessonContext(libRef.current!, m, lesson, wishes),
          known: () => gradeVocab(libRef.current!, m),
          notes: () => classNotes(libRef.current!.settings, m.subject, m.grade),
          rename: (title) => {
            const now = libRef.current?.lessons.find((x) => x.id === lesson.id);
            if (now && (!now.title.trim() || now.title === 'Neue Stunde')) putLesson({ ...now, title, updatedAt: Date.now() }).catch(failed);
          },
          onApplied: (added) => {
            const now = libRef.current?.lessons.find((x) => x.id === lesson.id);
            if (now) store.keepVersion(now, 'Vor Claude').catch(() => {});
            const mod = libRef.current?.modules.find((x) => x.id === m.id);
            if (mod && added.length) putModule({ ...mod, competences: [...mod.competences, ...added], updatedAt: Date.now() });
          },
        }}
      />
    );
    subject = m.subject;
    here = { subject, grade: m.grade };
  } else if (route.view === 'results') {
    const handout = lib.handouts.find((h) => h.id === route.id);
    if (!handout) return <ToOverview />;
    const lesson = lib.lessons.find((l) => l.id === handout.lessonId);
    const m = lesson && lib.modules.find((x) => x.id === lesson.moduleId);
    view = (
      <EvaluationView
        handout={handout}
        competences={m?.competences ?? []}
        place={m && lesson ? `${m.subject} · Klasse ${m.grade} · Modul ${m.number} · Stunde ${lesson.number}` : 'Ausgeteilter Auftrag'}
        onBack={() => (lesson ? go({ view: 'lesson', id: lesson.id }) : go({ view: 'overview' }))}
      />
    );
    if (m) {
      subject = m.subject;
      here = { subject, grade: m.grade };
    }
  } else if (route.view === 'slides') {
    const lesson = lib.lessons.find((l) => l.id === route.id);
    const m = lesson && lib.modules.find((x) => x.id === lesson.moduleId);
    if (!lesson || !m) return <ToOverview />;
    view = (
      <SlidesView
        key={`${lesson.id}:${editorRev}`}
        slides={lesson.slides}
        ctx={slideContext(m, lesson, lib.settings)}
        doc={docForLesson(m, lesson)}
        lessonTitle={lesson.title}
        suggest={{ earlier: earlierLessons(lib, m, lesson), lessonNumber: lesson.number }}
        place={`${m.subject} · Klasse ${m.grade} · Modul ${m.number} · Stunde ${lesson.number}: ${lesson.title}`}
        onChange={(slides) => {
          const current = libRef.current?.lessons.find((l) => l.id === lesson.id) ?? lesson;
          putLesson({ ...current, slides, updatedAt: Date.now() }).catch(failed);
        }}
        onVersions={() => setVersionsOf(lesson.id)}
        ai={() => ({ subject: m.subject, grade: m.grade, topic: m.title, lessonTitle: lesson.title, notes: classNotes(libRef.current!.settings, m.subject, m.grade) })}
        boards={lesson.boards}
        onBoards={(boards) => {
          const current = libRef.current?.lessons.find((l) => l.id === lesson.id) ?? lesson;
          putLesson({ ...current, boards, updatedAt: Date.now() }).catch(failed);
        }}
        onDesign={(slideDesign) => {
          const current = libRef.current?.lessons.find((l) => l.id === lesson.id) ?? lesson;
          putLesson({ ...current, slideDesign, updatedAt: Date.now() }).catch(failed);
        }}
        onBack={() => go({ view: 'module', id: m.id })}
        onOpenSheet={() => go({ view: 'lesson', id: lesson.id })}
        focus={jump?.lessonId === lesson.id && jump.slideId ? { id: jump.slideId, query: jump.query, n: jump.n } : undefined}
        present={presentNext === lesson.id}
        onPresentStarted={() => setPresentNext(null)}
      />
    );
    subject = m.subject;
    here = { subject, grade: m.grade };
  } else if (route.view === 'plan') {
    const { grade } = route;
    subject = route.subject;
    here = { subject, grade };
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
    here = { subject, grade: m.grade };
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
          remove(
            [m.id],
            lessons.map((l) => l.id),
            `Modul „${m.title}“`,
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
        onPresent={(l) => present(l.id)}
        knownVocab={gradeVocab(lib, m)}
        onVocabLesson={(pages) => {
          const l = vocabLesson(libRef.current!, m, pages);
          putLesson(l).catch(failed);
          go({ view: 'lesson', id: l.id });
        }}
        onRegenerateSlides={(l) => regenerateSlides(l.id)}
        onDeleteSlides={(l) => deleteSlides(l.id)}
        onChangeLesson={(l) => putLesson(l).catch(failed)}
        onDuplicateLesson={(l) => putLesson(duplicateLesson(lib, m, l)).catch(failed)}
        onDeleteLesson={(l) => remove([], [l.id], `Stunde ${l.number} „${l.title}“`)}
        onImportPdf={(file) => {
          const l = newLesson(lib, m);
          putLesson(l).catch(failed);
          setPendingPdf({ lessonId: l.id, file });
          go({ view: 'lesson', id: l.id });
        }}
        lib={lib}
        onApplyPlan={(plan) => {
          const done = applyModulePlan(libRef.current!, m, plan);
          // First the trash (it sets the whole library), then the module and its lessons on top.
          if (done.remove.length) remove([], done.remove.map((l) => l.id), done.remove.length === 1 ? 'Eine Stunde der alten Planung' : `Die alte Planung (${done.remove.length} Stunden)`);
          putModule(done.module);
          for (const l of done.lessons) putLesson(l).catch(failed);
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
    here = { subject, grade: route.grade };
    view = (
      <Overview
        lib={lib}
        trashCount={trash.length}
        savedAt={inSyncUntil}
        onOpenTrash={() => setTrashOpen(true)}
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
        autoSync={syncStatus}
        onSync={() => setSyncOpen(true)}
        onOpenFile={(file) => openFile(file)}
        onOpenPlan={(subject, grade) => go({ view: 'plan', subject, grade })}
      />
    );
  }

  return (
    <SearchContext.Provider value={openSearch}>
      <div className="subject-scope" style={subject ? subjectVars(subjectColor(lib.settings, subject)) : undefined}>
        <AiGradeContext.Provider value={here.grade}>
          <ClassNotesContext.Provider value={{ settings: lib.settings, save: putSettings }}>{view}</ClassNotesContext.Provider>
        </AiGradeContext.Provider>
      </div>
      {searchOpen && <SearchDialog lib={lib} here={here} onOpen={openHit} onClose={closeSearch} />}
      {sharing &&
        (() => {
          const lesson = lib.lessons.find((l) => l.id === sharing.lessonId);
          const m = lesson && lib.modules.find((x) => x.id === lesson.moduleId);
          if (!lesson || !m) return null;
          return (
            <ShareDialog
              pages={sharing.pages}
              defaultTitle={sharing.title}
              lessonId={lesson.id}
              meta={{ icon: m.icon, lang: m.lang, help: m.help, code: docForLesson(m, lesson).code }}
              onDone={putHandout}
              onOpenResults={(id) => {
                setSharing(null);
                go({ view: 'results', id });
              }}
              onClose={() => setSharing(null)}
            />
          );
        })()}
      {trashOpen && (
        <TrashDialog
          trash={trash}
          modules={lib.modules}
          onRestore={(id) => restore(id)}
          onPurge={(id) => purge([id])}
          onEmpty={() => window.confirm('Alles im Papierkorb endgültig löschen?') && purge(trash.map((e) => e.id))}
          onClose={() => setTrashOpen(false)}
        />
      )}
      {versionsOf && lib.lessons.some((l) => l.id === versionsOf) && (
        <VersionsDialog lesson={lib.lessons.find((l) => l.id === versionsOf)!} onRestore={restoreVersion} onCopy={copyVersion} onClose={() => setVersionsOf(null)} />
      )}
      {syncOpen && (
        <SyncDialog
          lib={lib}
          inSyncUntil={inSyncUntil}
          onSaved={(t) => {
            markSaved(t);
            setNotice('Sicherung gespeichert. Auf dem anderen Gerät über „Abgleich Mac/iPad“ öffnen.');
          }}
          onOpenFile={(file) => openFile(file)}
          onClose={() => {
            setSyncOpen(false);
            setJoinCode(undefined);
          }}
          auto={{
            status: syncStatus,
            code: autoSync.current?.code ?? '',
            joinCode,
            onStart: (code) => {
              setJoinCode(undefined);
              autoSync.current?.start(code).catch(() => {});
            },
            onStop: () => void autoSync.current?.stop(),
            onRunNow: () => void autoSync.current?.run(),
          }}
        />
      )}
      {toasts}
    </SearchContext.Provider>
  );
}
