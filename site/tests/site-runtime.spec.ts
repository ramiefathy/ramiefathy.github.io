import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getAstroRoutes, getNotFoundRoute } from './inventory.js'

type RuntimeCapture = {
  consoleErrors: string[]
  pageErrors: string[]
  requestFailures: string[]
  localBadResponses: string[]
}

function isLocalUrl(url: string): boolean {
  return (
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('http://localhost') ||
    url.startsWith('http://[::1]')
  )
}

async function blockExternalRequests(page: Page) {
  // Abort external network calls without intercepting local dev-server traffic.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
    await route.abort()
  })
}

function isIgnorableLocalBadResponse(url: string): boolean {
  // Astro dev server can legitimately return 404/403 for optional assets; keep this list tight.
  if (url.endsWith('/favicon.ico')) return true
  if (url.endsWith('/favicon.png')) return true
  if (url.endsWith('/robots.txt')) return true
  if (url.endsWith('/sitemap.xml')) return true
  if (url.endsWith('.map')) return true
  return false
}

function filterActionableConsoleErrors(errors: string[]): string[] {
  return errors.filter((entry) => {
    if (/^Warning:/i.test(entry)) return false
    if (/Failed to load resource:/i.test(entry)) return false
    if (/Permissions policy violation:/i.test(entry)) return false
    return true
  })
}

function captureRuntimeErrors(page: Page): RuntimeCapture {
  const capture: RuntimeCapture = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    localBadResponses: []
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      capture.consoleErrors.push(msg.text())
    }
  })

  page.on('pageerror', (error) => capture.pageErrors.push(error.message))

  page.on('response', (response) => {
    const url = response.url()
    if (!isLocalUrl(url)) return
    if (response.status() < 400) return
    if (isIgnorableLocalBadResponse(url)) return
    capture.localBadResponses.push(`${response.status()} ${response.request().resourceType()} ${url}`)
  })

  page.on('requestfailed', (request) => {
    const url = request.url()
    if (!isLocalUrl(url)) return
    const failureText = request.failure()?.errorText || 'unknown'
    // Navigations can legitimately cancel/prematurely abort in-flight subresource requests.
    // Treat these as non-actionable so this suite remains stable while still catching real 404s/500s.
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(failureText)) return
    capture.requestFailures.push(`${request.method()} ${url} :: ${failureText}`)
  })

  return capture
}

async function listMindMapTopics(): Promise<string[]> {
  const dataDir = path.resolve(process.cwd(), 'src/data/mindmaps')
  const entries = await fs.readdir(dataDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function visitAndAssertClean(page: Page, urlPath: string, allowedStatuses: number[] = [200]) {
  const runtime = captureRuntimeErrors(page)
  const response = await page.goto(urlPath, { waitUntil: 'domcontentloaded' })
  // Some pages intentionally embed long-polling / ads / iframes; don't let that make this smoke test flaky.
  await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => null)

  expect(response, `Expected a response for ${urlPath}`).not.toBeNull()
  expect(
    allowedStatuses,
    `Expected ${urlPath} to return one of ${allowedStatuses.join(', ')} (status ${response?.status()})`
  ).toContain(response?.status())

  // Give late hydration errors a beat to surface.
  await page.waitForTimeout(250)

  expect(runtime.requestFailures, `Local request failures on ${urlPath}`).toEqual([])
  const baseUrl = new URL(page.url()).origin
  const allowedDocument404 = allowedStatuses.includes(404) ? `${baseUrl}${urlPath}` : null
  const localBadResponses = runtime.localBadResponses.filter((entry) => {
    if (!allowedDocument404) return true
    if (!entry.startsWith('404 document ')) return true
    return !entry.includes(allowedDocument404)
  })

  expect(localBadResponses, `Local non-OK responses on ${urlPath}`).toEqual([])
  expect(runtime.pageErrors, `Page errors on ${urlPath}`).toEqual([])
  expect(filterActionableConsoleErrors(runtime.consoleErrors), `Actionable console errors on ${urlPath}`).toEqual([])
}

test.describe('site runtime smoke (no external deps + no runtime errors)', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page)
  })

  test('core routes render without runtime errors', async ({ page }) => {
    const coreRoutes = getAstroRoutes()

    for (const route of coreRoutes) {
      await visitAndAssertClean(page, route)
      await expect(page.locator('#main-content')).toBeVisible()
    }
  })

  test('all statically generated mindmap routes render', async ({ page }) => {
    const topics = await listMindMapTopics()
    expect(topics.length, 'Expected at least one mindmap topic under src/data/mindmaps').toBeGreaterThan(0)

    for (const topic of topics) {
      await visitAndAssertClean(page, `/apps/mindmaps/${topic}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('#mindmap-runtime')).toBeVisible()
    }
  })

  test('404 page renders and unknown routes return not-found content', async ({ page }) => {
    await visitAndAssertClean(page, getNotFoundRoute(), [200, 404])
    // Phase 7 Atlas redesign: the 404 h1 is "Off the atlas." (display1 with <em>atlas</em>).
    await expect(page.getByRole('heading', { level: 1, name: /No such\s+page\./i })).toBeVisible()

    const runtime = captureRuntimeErrors(page)
    const response = await page.goto('/this-route-should-not-exist', { waitUntil: 'domcontentloaded' })
    // Production hosting can vary (redirect to /404 vs true 404). The content assertion keeps this test meaningful.
    expect([200, 404]).toContain(response?.status() || 0)
    await expect(page.getByRole('heading', { level: 1, name: /No such\s+page\./i })).toBeVisible()
    expect(runtime.pageErrors, 'Page errors on not-found route').toEqual([])
    expect(filterActionableConsoleErrors(runtime.consoleErrors), 'Console errors on not-found route').toEqual([])
  })
})
