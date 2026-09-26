import { useEffect, useState } from 'react';
import { Editor } from './editor/Editor';
import { seedDoc } from './model/seed';
import type { Doc } from './model/types';
import { deleteUnusedImages, loadDoc, requestPersistentStorage } from './storage/db';

export function App() {
  const [doc, setDoc] = useState<Doc | null>(null);

  useEffect(() => {
    let alive = true;
    loadDoc()
      .catch(() => null)
      .then((saved) => {
        if (!alive) return;
        setDoc(saved ?? seedDoc());
        if (saved) deleteUnusedImages(saved).catch(() => {});
        requestPersistentStorage();
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!doc) return <div className="app-loading" />;
  return <Editor initialDoc={doc} />;
}
