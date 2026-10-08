// "Digital austeilen": a task, chosen blocks or the whole worksheet go to the class as a link and QR code. The first
// time on a device, the GitHub token is set up; then the assignment is published and kept as a handout.
import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Maximize2, QrCode, Send, X } from 'lucide-react';
import { SegField } from '../editor/fields';
import { Icon } from '../icons';
import { qrCode, QrSvg } from '../sheet/parts';
import { toDataUrl } from '../storage/backup';
import { getImage } from '../storage/db';
import { loadGithub, saveGithub, type GithubSettings } from '../storage/library';
import { ASSIGNMENT_FORMAT, handoutImages, handoutTasks, studentPages, type Assignment, type AssignmentPage, type Handout, type HandoutMode } from './assignment';
import { newKeyPair, randomId } from './crypto';
import { DIGITAL_TASKS } from './grade';
import { DEFAULT_REPO, assignmentPath, checkSetup, publishFiles } from './github';
import { KEEP_DAYS } from './server';

/** The link students open: the student page next to the Baukasten, with the assignment id. */
export function studentUrl(repo: string, id: string): string {
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  return `${base}a/#${repo === DEFAULT_REPO ? id : `${repo}/${id}`}`;
}

/** A QR code as an SVG, sized by its box. */
export function Qr({ link, className = '' }: { link: string; className?: string }) {
  const qr = qrCode(link);
  return qr && qr !== 'error' ? <QrSvg qr={qr} label="QR-Code zum Auftrag" className={'share-qr ' + className} frame /> : null;
}

/** Link and QR code of a handout, to copy or to show large on the projector. */
export function ShareResult({ handout, onOpenResults }: { handout: Handout; onOpenResults?(): void }) {
  const [copied, setCopied] = useState(false);
  const [big, setBig] = useState(false);
  return (
    <div className="share-result">
      <Qr link={handout.url} />
      <div className="share-link">
        <input className="input" readOnly value={handout.url} onFocus={(e) => e.target.select()} aria-label="Link zum Auftrag" />
        <button
          type="button"
          className="btn btn-secondary ui-btn"
          onClick={() =>
            navigator.clipboard?.writeText(handout.url).then(
              () => setCopied(true),
              () => {},
            )
          }
        >
          <Icon icon={copied ? Check : Copy} />
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
      <div className="share-actions">
        <button type="button" className="btn btn-secondary ui-btn" onClick={() => setBig(true)}>
          <Icon icon={Maximize2} />
          Groß zeigen
        </button>
        <a className="btn btn-secondary ui-btn" href={handout.url} target="_blank" rel="noreferrer">
          <Icon icon={ExternalLink} />
          Ausprobieren
        </a>
        {onOpenResults && (
          <button type="button" className="btn btn-primary ui-btn" onClick={onOpenResults}>
            Zur Auswertung
          </button>
        )}
      </div>
      {big && (
        <div className="share-big" onClick={() => setBig(false)} role="dialog" aria-label="QR-Code groß">
          <div className="share-big-title">{handout.title}</div>
          <Qr link={handout.url} className="is-big" />
          <div className="share-big-link">{handout.url.replace(/^https?:\/\//, '')}</div>
          <div className="share-big-hint">Mit der Kamera scannen · Klick schließt</div>
        </div>
      )}
    </div>
  );
}

interface ShareDialogProps {
  pages: AssignmentPage[];
  defaultTitle: string;
  lessonId: string;
  meta: { icon: string; lang: 'de' | 'en'; help: boolean; code: string };
  onDone(handout: Handout): void;
  onOpenResults(id: string): void;
  onClose(): void;
}

type Step = { kind: 'loading' } | { kind: 'setup'; error?: string } | { kind: 'form'; error?: string } | { kind: 'busy' } | { kind: 'done'; handout: Handout };

export function ShareDialog({ pages, defaultTitle, lessonId, meta, onDone, onOpenResults, onClose }: ShareDialogProps) {
  const [step, setStep] = useState<Step>({ kind: 'loading' });
  const [github, setGithub] = useState<GithubSettings | null>(null);
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [title, setTitle] = useState(defaultTitle);
  const [mode, setMode] = useState<HandoutMode>('uebung');

  useEffect(() => {
    loadGithub().then(
      (g) => {
        setGithub(g);
        if (g) setRepo(g.repo);
        setStep(g ? { kind: 'form' } : { kind: 'setup' });
      },
      () => setStep({ kind: 'setup' }),
    );
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && step.kind !== 'busy' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step.kind]);

  const tasks = handoutTasks(pages);
  const digital = tasks.filter((t) => DIGITAL_TASKS.has(t.block.type)).length;
  const blocks = pages.reduce((k, p) => k + p.blocks.length, 0);

  const saveSetup = async () => {
    const g = { token: token.trim(), repo: repo.trim() || DEFAULT_REPO };
    setStep({ kind: 'busy' });
    try {
      await checkSetup(g);
      await saveGithub(g);
      setGithub(g);
      setStep({ kind: 'form' });
    } catch (e) {
      setStep({ kind: 'setup', error: e instanceof Error ? e.message : String(e) });
    }
  };

  const publish = async () => {
    if (!github) return;
    setStep({ kind: 'busy' });
    try {
      const keys = await newKeyPair();
      const id = randomId(10);
      const images: Record<string, string> = {};
      for (const img of handoutImages(pages)) {
        const blob = await getImage(img);
        if (blob) images[img] = await toDataUrl(blob);
      }
      const now = Date.now();
      const name = title.trim() || defaultTitle;
      const assignment: Assignment = { format: ASSIGNMENT_FORMAT, v: 1, id, title: name, mode, ...meta, key: keys.publicKey, pages: studentPages(pages, mode), images, createdAt: now };
      await publishFiles(github, { [assignmentPath(id)]: JSON.stringify(assignment) }, `Aufgabe: ${name}`);
      const handout: Handout = { id, lessonId, title: name, mode, url: studentUrl(github.repo, id), pages, privateKey: keys.privateKey, createdAt: now, updatedAt: now };
      onDone(handout);
      setStep({ kind: 'done', handout });
    } catch (e) {
      setStep({ kind: 'form', error: `Austeilen hat nicht geklappt: ${e instanceof Error ? e.message : String(e)}` });
    }
  };

  return (
    <div className="dialog-backdrop" onClick={() => step.kind !== 'busy' && onClose()}>
      <div className="dialog share-dialog" role="dialog" aria-modal="true" aria-label="Digital austeilen" onClick={(e) => e.stopPropagation()}>
        <div className="share-head">
          <div className="dialog-title">Digital austeilen</div>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Schließen" disabled={step.kind === 'busy'}>
            <Icon icon={X} />
          </button>
        </div>
        {step.kind === 'loading' && <p className="dialog-body">…</p>}
        {step.kind === 'setup' && (
          <>
            <p className="dialog-body">Einmal pro Gerät: Der Baukasten braucht einen GitHub-Schlüssel, der nur in deinem Aufgaben-Repository schreiben darf.</p>
            <ol className="share-steps">
              <li>
                Auf GitHub das öffentliche Repository{' '}
                <a href={`https://github.com/new?name=${repo.split('/')[1] ?? 'baukasten-aufgaben'}&visibility=public`} target="_blank" rel="noreferrer">
                  „{repo.split('/')[1] ?? 'baukasten-aufgaben'}“ anlegen
                </a>{' '}
                (mit README), falls es noch fehlt.
              </li>
              <li>
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                  Neuen Schlüssel erstellen
                </a>
                : Name „Baukasten“, Ablauf 1 Jahr, <i>Only select repositories</i> → dieses Repository, unter <i>Repository permissions</i> „Contents: Read and write“, dann <i>Generate token</i>.
              </li>
              <li>Den Schlüssel kopieren und hier einfügen. Er bleibt nur auf diesem Gerät.</li>
            </ol>
            <div className="field">
              <label htmlFor="share-token">GitHub-Schlüssel</label>
              <input id="share-token" className="input" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" />
            </div>
            <div className="field">
              <label htmlFor="share-repo">Repository für Aufgaben</label>
              <input id="share-repo" className="input" value={repo} onChange={(e) => setRepo(e.target.value)} />
            </div>
            {step.error && <p className="dialog-body share-error">{step.error}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-primary ui-btn" onClick={saveSetup} disabled={!token.trim()}>
                Prüfen und speichern
              </button>
            </div>
          </>
        )}
        {step.kind === 'form' && (
          <>
            <div className="field">
              <label htmlFor="share-title">Titel für die Klasse</label>
              <input id="share-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <SegField<HandoutMode>
              label="Art"
              value={mode}
              options={[
                { v: 'uebung', l: 'Übung' },
                { v: 'test', l: 'Test' },
              ]}
              onPick={setMode}
            />
            <p className="dialog-body print-hint">
              {mode === 'uebung'
                ? 'Übung: Die Schüler prüfen jede Aufgabe selbst, versuchen es nochmal und können danach die Lösung sehen. Du siehst den ersten Versuch und das Endergebnis.'
                : 'Test: Die Schüler sehen keine Lösungen und geben am Ende ab; die Lösungen werden gar nicht erst mitgeschickt.'}{' '}
              {blocks === 1 ? 'Ein Baustein' : `${blocks} Bausteine`}, davon {tasks.length === 1 ? 'eine Aufgabe' : `${tasks.length} Aufgaben`}
              {digital < tasks.length ? ` (${tasks.length - digital} nur auf Papier)` : ''}. Die Schüler geben Vorname und ersten Buchstaben des Nachnamens ein, ohne Konto. Ihre Antworten kommen
              verschlüsselt an, nur du kannst sie lesen; der Server löscht sie nach {KEEP_DAYS} Tagen.
            </p>
            {step.error && <p className="dialog-body share-error">{step.error}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary ui-btn share-setup-link" onClick={() => setStep({ kind: 'setup' })}>
                GitHub-Schlüssel ändern
              </button>
              <button type="button" className="btn btn-primary ui-btn" onClick={publish} disabled={!tasks.length && !blocks}>
                <Icon icon={Send} />
                Austeilen
              </button>
            </div>
          </>
        )}
        {step.kind === 'busy' && <p className="dialog-body">Einen Moment …</p>}
        {step.kind === 'done' && (
          <>
            <p className="dialog-body">
              <Icon icon={QrCode} size={16} /> „{step.handout.title}“ ist ausgeteilt. Zeig den QR-Code oder schick den Link (z. B. über Moodle oder den Klassenchat).
            </p>
            <ShareResult handout={step.handout} onOpenResults={() => onOpenResults(step.handout.id)} />
          </>
        )}
      </div>
    </div>
  );
}
