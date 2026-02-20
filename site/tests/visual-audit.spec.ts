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

const PDF_STUDIO_TOOL_ROUTES = [
  '/apps/pdf-studio.html?tool=organizer',
  '/apps/pdf-studio.html?tool=extract',
  '/apps/pdf-studio.html?tool=image',
  '/apps/pdf-studio.html?tool=stamp',
  '/apps/pdf-studio.html?tool=assemble',
  '/apps/pdf-studio.html?tool=metadata',
  '/apps/pdf-studio.html?tool=ocr',
  '/apps/pdf-studio.html?tool=compress',
  '/apps/pdf-studio.html?tool=textextract'
]

const LONG_PAGE_SEGMENT_ROUTES = new Set([
  '/apps/WoundCareWebpages.html',
  '/apps/biologic-monitoring-dashboard/index.html'
])

async function captureSegmentedPage(page: import('@playwright/test').Page, outputRoot: string, baseName: string) {
  const viewport = page.viewportSize() ?? { width: 1280, height: 900 }
  const fullHeight = await page.evaluate(() => {
    const body = document.body
    const doc = document.documentElement
    return Math.max(
      body?.scrollHeight ?? 0,
      body?.offsetHeight ?? 0,
      doc?.scrollHeight ?? 0,
      doc?.offsetHeight ?? 0,
      doc?.clientHeight ?? 0
    )
  })

  const positions = [
    { label: 'top', y: 0 },
    { label: 'mid', y: Math.max(0, Math.round((fullHeight - viewport.height) / 2)) },
    { label: 'bottom', y: Math.max(0, fullHeight - viewport.height) }
  ]
  const dedupedPositions = positions.filter(
    (position, index, list) => list.findIndex((entry) => entry.y === position.y) === index
  )

  for (const position of dedupedPositions) {
    await page.evaluate((y) => window.scrollTo(0, y), position.y)
    await page.waitForTimeout(350)
    await page.screenshot({
      path: path.join(outputRoot, `${baseName}-${position.label}.png`),
      fullPage: false
    })
  }
}

test.describe('visual audit (opt-in)', () => {
  test.skip(!isEnabled, 'Set VISUAL_AUDIT=1 to enable screenshot generation')
  test.describe.configure({ mode: 'serial' })

  test('captures visual-audit screenshots for inventory pages and all PDF Studio tools', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000)

    await page.emulateMedia({ reducedMotion: 'reduce' })

    const runId = buildRunId()
    const outputRoot = path.resolve(process.cwd(), 'test-results', 'visual-audit', runId)
    fs.mkdirSync(outputRoot, { recursive: true })

    const inventoryApps = getLegacyHtmlApps().filter((entry) => !entry.redirectTo)
    const auditRoutes = [
      ...inventoryApps.map((entry) => ({ label: entry.label, route: entry.route })),
      ...PDF_STUDIO_TOOL_ROUTES.map((route) => ({
        label: `PDF Studio ${route.split('tool=')[1]}`,
        route
      }))
    ]
    const dedupedRoutes = auditRoutes.filter(
      (entry, index, list) => list.findIndex((candidate) => candidate.route === entry.route) === index
    )

    for (const [index, app] of dedupedRoutes.entries()) {
      const baseName = `${String(index + 1).padStart(2, '0')}-${slugify(app.label)}-${slugify(app.route)}`

      await page.goto(app.route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(750)

      if (LONG_PAGE_SEGMENT_ROUTES.has(app.route)) {
        await captureSegmentedPage(page, outputRoot, baseName)
      } else {
        await page.screenshot({
          fullPage: true,
          path: path.join(outputRoot, `${baseName}.png`)
        })
      }
    }
  })
})
