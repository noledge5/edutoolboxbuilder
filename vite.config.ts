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

// Relative base so the build works on GitHub Pages under /<repo>/ and anywhere else.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Build id for the service worker URL, so every deployment refreshes the offline copy.
  // The version shown in the settings ("Version").
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)), __APP_VERSION__: JSON.stringify(version()) },
  // Three pages: the Baukasten, the student view for tasks handed out by link (a/#<id>) and Lernquest (lernquest/#<code>).
  build: { rollupOptions: { input: { main: 'index.html', aufgabe: 'a/index.html', lernquest: 'lernquest/index.html' } } },
  test: {
    environment: 'node',
  },
});
