import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    outDir: 'dist-widget',
    lib: {
      entry: 'src/widget.tsx',
      name: 'SmaxWidget',
      fileName: (format) => `widget.js`,
      formats: ['iife'], // Immediately Invoked Function Expression for direct browser use
    },
    rollupOptions: {
      // Ensure we don't bundle React if the host has it? 
      // No, for a widget we usually bundle EVERYTHING to avoid conflicts.
      // So we keep external empty.
    },
    // Minify for production
    minify: 'esbuild',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  }
});
