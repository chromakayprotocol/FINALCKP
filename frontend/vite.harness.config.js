/**
 * Vite config for the Playwright layout harness (e2e/harness).
 *
 * Aliases the two modules that would otherwise pull the Nexus into the real
 * authenticated app — AuthContext and the Supabase singleton — to inert
 * stubs, so the 16:9 composition can be measured in a real browser without
 * a session, a network call, or any credential in CI.
 *
 * Separate from vite.config.js on purpose: the harness entry must never be
 * reachable from a production build.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'e2e/harness'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react({ include: /\.[jt]sx?$/ })],
  resolve: {
    alias: [
      { find: /^.*\/context\/AuthContext$/, replacement: path.resolve(__dirname, 'e2e/stubs/authContext.js') },
      { find: /^.*\/services\/supabase\/client$/, replacement: path.resolve(__dirname, 'e2e/stubs/supabaseClient.js') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  esbuild: { include: /(src|e2e)\/.*\.[jt]sx?$/, exclude: [], loader: 'jsx' },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  server: { port: 4321, strictPort: true },
});
