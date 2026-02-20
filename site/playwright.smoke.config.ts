import { defineConfig, devices } from '@playwright/test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.smoke.spec.ts'],
  // Smoke suite is opt-in and may depend on local backend services.
  timeout: 180_000,
  expect: {
    timeout: 20_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
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
  webServer: [
    {
      command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
      cwd: __dirname,
      port: 4321,
      reuseExistingServer: false
    },
    {
      command: 'node site/scripts/start-ai-scribe-smoke.js',
      cwd: repoRoot,
      port: 8765,
      reuseExistingServer: false
    }
  ]
})
