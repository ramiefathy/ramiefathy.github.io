import { expect, test, type Page } from '@playwright/test'
import { getLegacyHtmlApps } from './inventory.js'

const waitForStability = 800

type PageCheck = {
  label: string
  path: string
  interact?: (page: Page) => Promise<void>
}

const legacyApps = getLegacyHtmlApps()
const byLabel = (label: string) => {
  const match = legacyApps.find((entry) => entry.label === label)
  if (!match) {
    throw new Error(`Legacy app inventory missing entry with label "${label}"`)
  }
  return match.route
}

const mindmapInteract = async (page: Page) => {
  const zoomIn = page.locator('#zoom-in')
  if (await zoomIn.count()) {
    await zoomIn.click()
  }
}

const checks: PageCheck[] = [
  {
    label: 'CTCL mindmap',
    path: byLabel('MindMaps (CTCL)'),
    interact: mindmapInteract
  },
  {
    label: 'Psoriasis mindmap',
    path: byLabel('MindMaps (Psoriasis)'),
    interact: mindmapInteract
  },
  {
    label: 'Alopecia mindmap',
    path: byLabel('MindMaps (Alopecia)'),
    interact: mindmapInteract
  },
  {
    label: 'scribe UI enhancements test page',
    path: byLabel('Dermatology Scribe (UI enhancements test)')
  }
]

test.describe('legacy app runtime console regression checks', () => {
  for (const check of checks) {
    test(`${check.label} has no runtime load errors`, async ({ page }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      const requestFailures: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      page.on('pageerror', (err) => pageErrors.push(err.message))
      page.on('requestfailed', (request) => {
        requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`)
      })

      await page.goto(check.path, { waitUntil: 'networkidle' })
      if (check.interact) {
        await check.interact(page)
      }
      await page.waitForTimeout(waitForStability)

      expect(requestFailures).toEqual([])
      expect(pageErrors).toEqual([])

      const nanPathErrors = consoleErrors.filter((entry) => /Expected number.*MNaN/i.test(entry))
      const missingStyleErrors = consoleErrors.filter((entry) => /style-enhanced\.css/i.test(entry))

      expect(nanPathErrors).toEqual([])
      expect(missingStyleErrors).toEqual([])
    })
  }
})
