import { defineConfig } from 'vitest/config';

/**
 * Stops Vitest's upward config search at this package, same reason and
 * same fix as frontend/vma-worker/vitest.config.js: an independent
 * package with its own node_modules should never fall back to the main
 * frontend app's vite.config.js.
 */
export default defineConfig({
  test: {
    root: import.meta.dirname,
  },
});
