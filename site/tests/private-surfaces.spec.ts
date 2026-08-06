import { expect, test } from '@playwright/test'
import { watchRuntime } from './helpers/network.js'

const routes = [
  {
    route: '/tasks/',
    title: 'Taskboard',
    classification: 'Private internal application',
    prohibited: [/firebase-/i, /localStorage/i, /sessionStorage/i, /<script/i]
  },
  {
    route: '/apps/dermie-vc-prep-rf-20260514-x7q9m2/',
    title: 'Dermie fundraising packet',
    classification: 'Confidential fundraising material',
    prohibited: [/use of funds/i, /financial sketch/i, /milestones-grid/i, /<script/i]
  }
]

test.describe('private application containment', () => {
  for (const item of routes) {
    test(`${item.title} fails closed in the public artifact`, async ({ page, request }) => {
      const runtime = watchRuntime(page)
      const response = await request.get(item.route)
      expect(response.status()).toBe(200)
      const html = await response.text()
      expect(html).toContain('not served from the unauthenticated public portfolio')
      for (const pattern of item.prohibited) expect(html).not.toMatch(pattern)

      await page.goto(item.route, { waitUntil: 'networkidle' })
      await expect(page.getByRole('heading', { name: item.title })).toBeVisible()
      await expect(page.locator('.eyebrow')).toHaveText(item.classification)
      await expect(page.getByRole('status')).toContainText(/fail closed/i)
      await expect(page.getByRole('link', { name: /Return to the governed application catalog/i })).toHaveAttribute('href', '/apps')
      expect(await page.locator('script').count()).toBe(0)
      runtime.assertClean()
    })
  }
})
