// Referentenansicht: the slides go to the projector, the teacher's screen shows the current and next slide, notes,
// times and tools. A second browser window holds one of the two views (React renders into it through a portal).
// Chrome and Edge can put a window on the other screen themselves (Window Management API): this window goes full
// screen on the projector, the new window shows the speaker view here. Safari cannot: the new window shows the
// slides and is dragged to the projector once.

interface ScreenInfo {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
}

interface ScreenDetails {
  screens: ScreenInfo[];
  currentScreen: ScreenInfo;
}

type WithScreens = Window & { getScreenDetails?: () => Promise<ScreenDetails> };

/** The second window and what it shows. */
export interface SpeakerWindows {
  win: Window;
  /** The new window shows the slides for the class ("audience") or the speaker view ("speaker"). */
  popup: 'audience' | 'speaker';
}

export type SpeakerStart = SpeakerWindows | { again: string } | { error: string };

const BLOCKED = 'Der Browser hat das zweite Fenster blockiert. Erlaube Pop-up-Fenster für diese Seite und versuche es noch einmal.';

/**
 * Opens the second window. Must run inside a click: Safari only allows the window right there (so nothing is
 * awaited before it), Chrome asks once for permission to use all screens.
 */
export async function openSpeakerWindows(): Promise<SpeakerStart> {
  const w = window as WithScreens;
  const extended = (window.screen as Screen & { isExtended?: boolean }).isExtended;
  if (w.getScreenDetails && extended) {
    try {
      const details = await w.getScreenDetails();
      const here = details.currentScreen;
      const projector = details.screens.find((s) => s !== here);
      if (projector) {
        try {
          await document.documentElement.requestFullscreen({ screen: projector } as FullscreenOptions);
        } catch {
          // The permission question used up the click: the next click works at once.
          return { again: 'Erlaubt. Tippe noch einmal auf „Referentenansicht“, dann geht es los.' };
        }
        const win = window.open('', 'baukasten-referent', `popup,left=${here.availLeft},top=${here.availTop},width=${here.availWidth},height=${here.availHeight}`);
        if (!win) {
          document.exitFullscreen().catch(() => {});
          return { error: BLOCKED };
        }
        return { win, popup: 'speaker' };
      }
    } catch {
      // Not allowed: the window is placed by hand.
    }
  }
  const win = window.open('', 'baukasten-beamer', 'popup,width=960,height=600');
  if (!win) return { error: BLOCKED };
  return { win, popup: 'audience' };
}

/** Gives the new window the styles of the Baukasten and an element to render into. */
export function preparePopup(win: Window, title: string): HTMLElement {
  const d = win.document;
  d.title = title;
  d.documentElement.lang = 'de';
  let root = d.getElementById('baukasten-root');
  if (!root) {
    // Shown once the styles are there, so the class never sees unstyled slides.
    const loading: Promise<unknown>[] = [];
    for (const el of document.querySelectorAll('link[rel="stylesheet"], style')) {
      if (el instanceof HTMLLinkElement) {
        const link = d.createElement('link');
        link.rel = 'stylesheet';
        link.href = el.href;
        loading.push(new Promise((done) => ((link.onload = done), (link.onerror = done))));
        d.head.append(link);
      } else d.head.append(d.importNode(el, true));
    }
    const meta = d.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1';
    d.head.append(meta);
    d.body.style.margin = '0';
    root = d.createElement('div');
    root.id = 'baukasten-root';
    root.style.visibility = 'hidden';
    d.body.append(root);
    const shown = root;
    Promise.race([Promise.all(loading), new Promise((done) => setTimeout(done, 3000))]).then(() => (shown.style.visibility = ''));
  }
  return root;
}
