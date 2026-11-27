// Settings of the whole Baukasten: footer, subject colours, lock, school year, AI key, version.
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Icon } from '../icons';
import { AiSettingsDialog } from '../ai/AiSettingsDialog';
import { dollars } from '../ai/prices';
import { useAiSettings } from '../ai/useAi';
import { readSchoolYear } from '../library/read';
import { SUBJECT_COLORS, subjectColor, swatch } from '../library/subjectColor';
import type { SchoolYear, Settings } from '../library/types';
import { BW_2026_27, holidaysText } from '../library/yearplan';
import { SperreEinstellung } from '../sperre/SperreRahmen';

export function SettingsDialog({ settings, subjects, onSave, onClose }: { settings: Settings; subjects: string[]; onSave(s: Settings): void; onClose(): void }) {
  const [footerBase, setFooterBase] = useState(settings.footerBase);
  const [colors, setColors] = useState(settings.subjectColors);
  const y = settings.schoolYear;
  const [yearName, setYearName] = useState(y?.name ?? '');
  const [start, setStart] = useState(y?.start ?? '');
  const [end, setEnd] = useState(y?.end ?? '');
  const [holidays, setHolidays] = useState(y ? holidaysText(y.holidays) : '');
  const fill = (v: SchoolYear) => {
    setYearName(v.name);
    setStart(v.start);
    setEnd(v.end);
    setHolidays(holidaysText(v.holidays));
  };
  const schoolYear = (): SchoolYear | null =>
    readSchoolYear({
      name: yearName.trim(),
      start,
      end,
      holidays: holidays
        .split('\n')
        .map((l) => l.split('|').map((x) => x.trim()))
        .filter(([name]) => name)
        .map(([name, from = '', to = '']) => ({ name, from, to })),
    });
  const incomplete = (start || end) && !schoolYear();
  const ai = useAiSettings();
  const [aiOpen, setAiOpen] = useState(false);
  return (
    <>
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog sync-dialog settings-dialog" role="dialog" aria-modal="true" aria-label="Einstellungen" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Einstellungen</div>
        <div className="field">
          <label htmlFor="footer-base">Fußzeile neuer Arbeitsblätter (das Fach wird angehängt)</label>
          <input id="footer-base" className="input" value={footerBase} placeholder="Name · Schule" onChange={(e) => setFooterBase(e.target.value)} />
        </div>
        {subjects.length > 0 && (
          <div className="settings-colors">
            <div className="panel-section-label">Farbe je Fach</div>
            {subjects.map((s) => {
              const current = subjectColor({ ...settings, subjectColors: colors }, s);
              return (
                <div key={s} className="settings-color-row">
                  <span className="settings-color-name">{s}</span>
                  <div className="swatches" role="radiogroup" aria-label={`Farbe für ${s}`}>
                    {SUBJECT_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        role="radio"
                        aria-checked={current === c.key}
                        className={'swatch' + (current === c.key ? ' is-on' : '')}
                        style={{ background: swatch(c.key) }}
                        title={c.label}
                        aria-label={c.label}
                        onClick={() => setColors({ ...colors, [s]: c.key })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="sync-tip">Die Farbe kennzeichnet das Fach im Baukasten (Leiste links, Fachkopf, Module), damit du die Fächer auseinanderhältst. Die gedruckten Blätter bleiben, wie sie sind.</p>
          </div>
        )}
        <SperreEinstellung />
        <div className="settings-year">
          <div className="panel-section-label">Schuljahr für den Jahresplan</div>
          <div className="settings-year-row">
            <div className="field">
              <label htmlFor="sy-name">Schuljahr</label>
              <input id="sy-name" className="input" value={yearName} placeholder="2026/27" onChange={(e) => setYearName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="sy-start">Erster Schultag</label>
              <input id="sy-start" className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="sy-end">Letzter Schultag</label>
              <input id="sy-end" className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sy-holidays">Ferien und freie Tage (je Zeile: Name | von | bis, z. B. Herbstferien | 26.10.2026 | 31.10.2026)</label>
            <textarea id="sy-holidays" className="input" rows={6} value={holidays} onChange={(e) => setHolidays(e.target.value)} />
          </div>
          <div className="panel-row">
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => fill(BW_2026_27)}>
              Baden-Württemberg {BW_2026_27.name} eintragen
            </button>
          </div>
          <p className="sync-tip">Bewegliche Ferientage legt jede Schule selbst fest: Trage sie als eigene Zeile ein.</p>
          {incomplete && <p className="json-err">Erster und letzter Schultag fehlen oder passen nicht zusammen.</p>}
        </div>
        <div className="settings-ai">
          <div className="panel-section-label">KI im Baukasten</div>
          <div className="panel-row">
            <span className="settings-ai-state">
              {ai === undefined ? '…' : ai ? `${ai.provider === 'openrouter' ? 'OpenRouter' : 'Claude direkt'} · diesen Monat ${dollars(ai.spent)}${ai.limit ? ` von ${dollars(ai.limit)}` : ''}` : 'Kein Schlüssel auf diesem Gerät: „Stunde prüfen“ geht über den Chat, Bilder mit KI brauchen einen Schlüssel.'}
            </span>
            <button type="button" className="btn btn-secondary ui-btn" onClick={() => setAiOpen(true)}>
              <Icon icon={Sparkles} />
              {ai ? 'Ändern …' : 'Einrichten …'}
            </button>
          </div>
        </div>
        <div className="settings-version">
          <div className="panel-section-label">Version</div>
          <p>{versionText(__APP_VERSION__)}</p>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary ui-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary ui-btn"
            disabled={!!incomplete}
            onClick={() => {
              onSave({ ...settings, footerBase: footerBase.trim(), schoolYear: schoolYear(), subjectColors: colors, updatedAt: Date.now() });
              onClose();
            }}
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>
    {aiOpen && <AiSettingsDialog onClose={() => setAiOpen(false)} />}
    </>
  );
}

/** "PR #8 · 29.10.2026, 19:54 · a4128a6": which merge this is, so the teacher knows what is live. */
export function versionText(v: { sha: string; date: string; pr: string }): string {
  const d = v.date ? new Date(v.date) : null;
  const when = d && !isNaN(d.getTime()) ? d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return [v.pr ? `PR #${v.pr}` : 'Entwicklungsstand', when, v.sha].filter(Boolean).join(' · ');
}
