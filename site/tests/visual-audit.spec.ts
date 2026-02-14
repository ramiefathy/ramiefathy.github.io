import fs from 'node:fs'
import path from 'node:path'
import { test } from '@playwright/test'
import { getLegacyHtmlApps } from './inventory.js'

const isEnabled = process.env.VISUAL_AUDIT === '1' || process.env.VISUAL_AUDIT === 'true'

function buildRunId(): string {
  const candidate = process.env.VISUAL_AUDIT_RUN_ID?.trim()
  if (candidate) return candidate

  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('')
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

test.describe('visual audit (opt-in)', () => {
  test.skip(!isEnabled, 'Set VISUAL_AUDIT=1 to enable screenshot generation')
  test.describe.configure({ mode: 'serial' })

  test('captures full-page screenshots for all legacy HTML apps in inventory', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000)

    await page.emulateMedia({ reducedMotion: 'reduce' })

    const runId = buildRunId()
    const outputRoot = path.resolve(process.cwd(), 'test-results', 'visual-audit', runId)
    fs.mkdirSync(outputRoot, { recursive: true })

    const apps = getLegacyHtmlApps()
    for (const [index, app] of apps.entries()) {
      const baseName = `${String(index + 1).padStart(2, '0')}-${slugify(app.label)}-${slugify(app.route)}`
      const filePath = path.join(outputRoot, `${baseName}.png`)

      await page.goto(app.route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(750)

      await page.screenshot({ fullPage: true, path: filePath })
    }
  })
})

