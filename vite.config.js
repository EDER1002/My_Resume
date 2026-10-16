import { defineConfig } from 'vite';
import resumeHtml from './scripts/vite-plugin-resume-html.js';

// GitHub Pages serves the site from https://eder1002.github.io/My_Resume/
export default defineConfig({
  base: '/My_Resume/',
  plugins: [resumeHtml()],
  build: {
    target: 'es2020',
    // three.js alone is ~600 kB minified; it is lazy-loaded in its own chunk.
    chunkSizeWarningLimit: 800,
  },
});
