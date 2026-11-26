// The frame of the library screens: the sidebar beside the screen; on a narrow window the sidebar is a drawer.
import { useEffect, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Icon } from '../icons';
import './shell.css';

export function Shell({ nav, children }: { nav: (close: () => void) => ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className={'shell' + (open ? ' is-nav-open' : '')}>
      <aside className="shell-nav" id="shell-nav">
        {nav(() => setOpen(false))}
      </aside>
      <div className="shell-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="shell-main">
        <button type="button" className="shell-menu" aria-controls="shell-nav" aria-expanded={open} aria-label="Navigation" onClick={() => setOpen(true)}>
          <Icon icon={Menu} size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
