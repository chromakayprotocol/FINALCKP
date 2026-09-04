/**
 * 16:9 visual-regression / layout-integrity config.
 *
 * Not part of the deploy gate: it drives a real browser, so it is an
 * opt-in suite (`npm run test:layout`) rather than a step every push pays
 * for. Its job is VALIDATION of the existing cinematic composition — it
 * must never be used as leverage to convert the Nexus into a conventional
 * responsive page.
 *
 * The suite runs against e2e/harness (vite.harness.config.js), which mounts
 * UniversityNexus with stubbed auth and stubbed Supabase, so no credential
 * ever reaches this suite.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'list' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Chromium is pre-installed in this project's CI/dev images at
    // PLAYWRIGHT_BROWSERS_PATH; do not add a `playwright install` step.
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npx vite --config vite.harness.config.js --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
