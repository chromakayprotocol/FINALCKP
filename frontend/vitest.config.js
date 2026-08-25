import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/* Without this file, Vitest walks up looking for a config and can pick up
   this directory's own vite.config.js instead — which works for pure-logic
   tests but has no `test.environment`, so any test that renders a
   component (@testing-library/react, or anything touching `window`/
   `document`) fails with "document is not defined" rather than a real
   assertion failure. jsdom is a superset for plain logic tests (adds
   globals, doesn't remove anything), so this is safe for every existing
   test too, not just the new render tests this file was added for. */
export default defineConfig({
  plugins: [
    react({
      include: /\.[jt]sx?$/,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
    loader: 'jsx',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
  },
});
