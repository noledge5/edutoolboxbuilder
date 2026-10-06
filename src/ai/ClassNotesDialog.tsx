// The class profile of a subject and grade and the teacher's principles: edited here, sent with every request to
// Claude (lesson, module, year plan, task). The line shows them in the AI dialogs with a way to change them.
import { useContext, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Icon } from '../icons';
import { classProfileOf, ClassNotesContext, withClassNotes } from './classNotes';

const short = (s: string, n = 70) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

/** "Klasse: … · Grundsätze: …" with "Ändern …", for the AI dialogs. */
export function ClassNotesLine({ subject, grade }: { subject: string; grade: number }) {
  const ctx = useContext(ClassNotesContext);
  const [open, setOpen] = useState(false);
  if (!ctx) return null;
  const profile = classProfileOf(ctx.settings, subject, grade);
  const principles = ctx.settings.principles;
  return (
    <>
      <p className="ai-class-line">
        <Icon icon={Users} size={15} />
        <span>
          {profile ? `Klasse: ${short(profile)}` : 'Noch kein Klassenprofil'}
          {' · '}
          {principles ? `Grundsätze: ${short(principles, 50)}` : 'keine Grundsätze'}
        </span>
        <button type="button" className="ai-class-edit" onClick={() => setOpen(true)}>
          {profile || principles ? 'Ändern …' : 'Eintragen …'}
        </button>
      </p>
      {open && <ClassNotesDialog subject={subject} grade={grade} onClose={() => setOpen(false)} />}
    </>
  );
}

export function ClassNotesDialog({ subject, grade, onClose }: { subject: string; grade: number; onClose(): void }) {
  const ctx = useContext(ClassNotesContext);
  const [profile, setProfile] = useState(() => (ctx ? classProfileOf(ctx.settings, subject, grade) : ''));
  const [principles, setPrinciples] = useState(ctx?.settings.principles ?? '');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  if (!ctx) return null;
  const save = () => {
    ctx.save(withClassNotes(ctx.settings, subject, grade, profile, principles));
    onClose();
  };
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog class-notes" role="dialog" aria-modal="true" aria-label="Klasse und Grundsätze" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          <Icon icon={Users} /> Klasse und Grundsätze
        </div>
        <p className="dialog-body">Claude bekommt beides mit jeder Anfrage (Stunde, Modul, Jahresplan, Aufgabe) und richtet Material, Sprache, Hilfen und Methoden danach aus.</p>
        <div className="field">
          <label htmlFor="cn-profile">
            Die Klasse in {subject}, Klasse {grade}
          </label>
          <textarea
            id="cn-profile"
            className="input"
            rows={4}
            autoFocus
            value={profile}
            placeholder="z. B. 26 Kinder, viele mit Deutsch als Zweitsprache, drei mit LRS. Leistungsstand eher schwach, lesen ungern lange Texte. Arbeiten gern zu zweit, nach der großen Pause unruhig."
            onChange={(e) => setProfile(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cn-principles">Meine Grundsätze (gelten für alle Klassen)</label>
          <textarea
            id="cn-principles"
            className="input"
            rows={4}
            value={principles}
            placeholder="z. B. Ich arbeite gern mit Ich – Du – Wir. Jede Stunde endet mit einem Exit-Ticket. Die Hausaufgabe steht auf der letzten Folie. Gruppenarbeit höchstens 15 Minuten."
            onChange={(e) => setPrinciples(e.target.value)}
          />
        </div>
        <p className="ai-hint is-warn">Bitte keine Namen von Schülerinnen und Schülern. Beides reist im Abgleich zwischen Mac und iPad und in Sicherungen mit.</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary ui-btn" onClick={save}>
            Sichern
          </button>
        </div>
      </div>
    </div>
  );
}
