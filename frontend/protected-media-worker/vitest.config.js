import { defineConfig } from 'vitest/config';

/**
 * Without this file, Vitest finds no vite/vitest config in this
 * directory and walks up to ../vite.config.js — the main frontend
 * app's own config, which needs frontend/node_modules/vite to load.
 * That happened to exist locally (this repo's frontend app had
 * already been built/tested earlier in the same session) but not in
 * CI's clean checkout, where only frontend/protected-media-worker/node_modules
 * is ever installed — so `npx vitest run` failed there with "Cannot
 * find module 'vite'" while passing locally. This file stops Vitest's
 * upward search right here, where it belongs for an independent
 * package with its own node_modules.
 */
export default defineConfig({
  test: {
    root: import.meta.dirname,
  },
});
