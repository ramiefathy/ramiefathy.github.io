import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const siteDist = resolve(repoRoot, 'site/dist');
const venvPython = resolve(repoRoot, 'services/ai-scribe/.venv/bin/python');
const pythonExe = process.env.AI_SCRIBE_PYTHON || (fs.existsSync(venvPython) ? venvPython : 'python3');

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/ramie-scribe.smoke.spec.ts'],
  timeout: 120_000,
  expect: {
    timeout: 15_000
  },
  use: {
    baseURL: 'http://127.0.0.1:8000',
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
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
      command: 'python3 -m http.server 8000 --bind 127.0.0.1',
      cwd: siteDist,
      url: 'http://127.0.0.1:8000/',
      timeout: 60_000,
      reuseExistingServer: !process.env.CI
    },
    {
      // Note: GEMINI_API_KEY is intentionally not set here; provide it via env when running
      // this smoke test if you want true end-to-end generation.
      command:
        `PYTHONUNBUFFERED=1 HOST=127.0.0.1 PORT=8765 SESSION_SECRET=development-token JWT_SIGNING_SECRET=development-token ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000 exec ${pythonExe} services/ai-scribe/app.py`,
      cwd: repoRoot,
      url: 'http://127.0.0.1:8765/',
      timeout: 60_000,
      reuseExistingServer: false
    }
  ]
});
