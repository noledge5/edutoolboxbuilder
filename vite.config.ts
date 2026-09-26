import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base so the build works on GitHub Pages under /<repo>/ and anywhere else.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Build id for the service worker URL, so every deployment refreshes the offline copy.
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  test: {
    environment: 'node',
  },
});
