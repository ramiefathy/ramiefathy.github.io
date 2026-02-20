import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/*.smoke.spec.ts'],
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    viewport: { width: 1280, height: 900 },
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    // Use a built preview server for deterministic E2E runs.
    //
    // The Astro dev server can hit Vite module-runner timeouts under parallel Playwright workers
    // (e.g., `transport invoke timed out after 60000ms`), which leaves islands unhydrated and makes
    // unrelated tests fail/flap. Preview runs the built output and avoids on-demand module fetches.
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
    cwd: __dirname,
    port: 4321,
    reuseExistingServer: false
  }
});
