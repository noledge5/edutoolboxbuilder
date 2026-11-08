import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

/** PR number from a merge commit ("Merge pull request #12 …") or a squash merge ("Titel (#13)"). */
const prNumber = (subject: string) => {
  const m = /^Merge pull request #(\d+)/.exec(subject) ?? /\(#(\d+)\)$/.exec(subject);
  return m?.[1] ?? '';
};

/** The commit being built: short id, commit time and, for a merge on main, the number of the pull request. */
function version() {
  const git = (args: string) => {
    try {
      return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return '';
    }
  };
  const subject = git('log -1 --format=%s');
  return { sha: git('rev-parse --short HEAD'), date: git('log -1 --format=%cI'), pr: prNumber(subject) };
}

/**
 * GitHub Pages cannot send headers, so the built pages carry their Content Security Policy as a meta tag: scripts
 * only from the app itself (pdf.js may compile WebAssembly), no plugins, no foreign <base> or form targets.
 * Pictures, videos and API calls stay open because the app reaches many hosts (image search, AI, sync).
 * Build only: the dev server needs an inline script for hot reload.
 */
const csp = {
  name: 'csp',
  apply: 'build' as const,
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; base-uri 'self'; form-action 'self'",
      },
      injectTo: 'head-prepend' as const,
    },
  ],
};

// Relative base so the build works on GitHub Pages under /<repo>/ and anywhere else.
export default defineConfig({
  base: './',
  plugins: [react(), csp],
  // Build id for the service worker URL, so every deployment refreshes the offline copy.
  // The version shown in the settings ("Version").
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)), __APP_VERSION__: JSON.stringify(version()) },
  // Three pages: the Baukasten, the student view for tasks handed out by link (a/#<id>) and Lernquest (lernquest/#<code>).
  // The manifest lists the on-demand chunks for the service worker (not in a dot folder: Pages leaves those out).
  build: { manifest: 'assets/manifest.json', rollupOptions: { input: { main: 'index.html', aufgabe: 'a/index.html', lernquest: 'lernquest/index.html' } } },
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '.claude/**'],
  },
});
