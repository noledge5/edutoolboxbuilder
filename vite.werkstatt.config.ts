// Builds the figure workshop (lernquest/werkstatt.html) into one self-contained file for an artifact:
// `npm run werkstatt` → dist-werkstatt/figuren-werkstatt.html. Not part of the app's build.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-werkstatt',
    emptyOutDir: true,
    // Fonts and everything else as data: URIs, so the page needs no other file.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: 'lernquest/werkstatt.html', output: { inlineDynamicImports: true } },
  },
});
