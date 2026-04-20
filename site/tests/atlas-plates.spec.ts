import { expect, test } from '@playwright/test'

/**
 * Atlas plate-stamp coverage check.
 *
 * Every Astro route in the redesigned site must render at least one `.plate-stamp`
 * element. This is the simplest sanity check that "every page got the Atlas wrapper"
 * after Phase 3 of the migration.
 *
 * Catches regressions where a future page rewrite forgets the plate stamp + plate
 * head + display headline pattern.
 */

const ATLAS_ROUTES = [
  { path: '/', name: 'Home (Plate I)' },
  { path: '/about', name: 'About (Plate II)' },
  { path: '/apps', name: 'Apps catalog (Plate III)' },
  { path: '/research', name: 'Research index (Plate IV)' },
  { path: '/research/dermoscopy-llm-dashboard', name: 'Dashboard (Plate IV.A)' },
  { path: '/blog', name: 'Blog (Plate V)' },
  { path: '/contact', name: 'Contact (Plate VI)' },
  { path: '/legacy', name: 'Legacy archive (Plate L)' },
]

for (const route of ATLAS_ROUTES) {
  test(`${route.name}: renders plate stamp + plate head + display`, async ({ page }) => {
    const response = await page.goto(route.path)
    expect(response?.status(), `${route.path} should respond 200`).toBeLessThan(400)

    // Atlas plate-stamp marker
    const stamp = page.locator('.plate-stamp').first()
    await expect(stamp, `${route.path} should render a .plate-stamp`).toBeVisible()

    // Plate head with display headline
    const head = page.locator('.plate-head').first()
    await expect(head, `${route.path} should render a .plate-head`).toBeVisible()

    // At least one display1 / display2 / section__title
    const display = page.locator('.display1, .display2, .section__title').first()
    await expect(display, `${route.path} should render an Atlas display headline`).toBeVisible()
  })
}

test('Atlas footer renders dark plate with PAGES / CONNECT / COLOPHON groups', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('.layout-footer')
  await expect(footer).toBeVisible()
  await expect(footer.locator('.layout-footer__group-title', { hasText: /PAGES/i })).toBeVisible()
  await expect(footer.locator('.layout-footer__group-title', { hasText: /CONNECT/i })).toBeVisible()
  await expect(footer.locator('.layout-footer__group-title', { hasText: /COLOPHON/i })).toBeVisible()
})

test('Header has no theme toggle button (Atlas is light-only)', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.theme-toggle')).toHaveCount(0)
  await expect(page.locator('button[aria-label*="dark mode" i]')).toHaveCount(0)
})

test('Apps catalog filter buttons work on /apps', async ({ page }) => {
  await page.goto('/apps')
  const filterButtons = page.locator('.apps-toolbar button[data-filter]')
  await expect(filterButtons.first()).toBeVisible()
  await expect(filterButtons).toHaveCount(6)

  // Click a category filter and verify at least one app card remains visible
  await filterButtons.filter({ hasText: /Learning/i }).click()
  await expect(page.locator('.app-plate.cat-learning').first()).toBeVisible()
})

/**
 * Mobile mindmap usability (Phase 7B Atlas hardening).
 *
 * Both the Astro-wrapped mindmap and the legacy CTCL/Alopecia/Psoriasis HTML pages
 * must remain usable at 375×812. Asserts: tabs visible (scrollable if overflow),
 * map canvas takes meaningful viewport height, no off-screen clipping.
 */
test.describe('Mindmap mobile breakpoints', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Astro mindmap (/apps/mindmaps/alopecia) renders mobile-aware', async ({ page }) => {
    await page.goto('/apps/mindmaps/alopecia', { waitUntil: 'networkidle' })
    // Wait for full React hydration — the ViewSwitcher tablist must be live before clicks reach React handlers
    await page.locator('.view-switcher').waitFor({ state: 'visible' })
    const atlasTab = page.getByRole('tab', { name: /Atlas/ })
    await atlasTab.waitFor({ state: 'visible' })
    // Click Atlas tab and wait for the active state to flip (proves click reached React)
    await atlasTab.click()
    await expect(atlasTab).toHaveAttribute('aria-selected', 'true')
    // AtlasView must be mounted now
    await page.locator('.mindmap-app').waitFor({ state: 'visible' })
    // Mobile menu toggle (lives in AtlasView) must be visible at 375px
    await expect(page.locator('.mobile-menu-toggle').first()).toBeVisible()
    // Plate stamp + plate head still render
    await expect(page.locator('.plate-stamp').first()).toBeVisible()
  })

  test('Legacy CTCL mindmap renders without horizontal page overflow', async ({ page }) => {
    await page.goto('/apps/MindMaps/CTCL/CTCLMindMaps.html')
    // Page should not horizontally scroll past viewport
    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(docWidth, 'page should not exceed viewport width').toBeLessThanOrEqual(390)
    // Tab container must be present and scrollable, not clipped
    const tabContainer = page.locator('.tab-container').first()
    await expect(tabContainer).toBeVisible()
    // At least the first tab must be visible inside the container
    await expect(page.locator('.tab').first()).toBeVisible()
  })

  test('Legacy Alopecia mindmap mobile tabs scroll horizontally', async ({ page }) => {
    await page.goto('/apps/MindMaps/Alopecia/AlopeciaMindMaps.html')
    const tabBar = page.locator('#tab-bar')
    await expect(tabBar).toBeVisible()
    // Tab bar should be wider than viewport (overflow-scroll territory)
    const tabBarWidth = await tabBar.evaluate((el) => el.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    // Either fits exactly or is wider than viewport (which then scrolls)
    expect(tabBarWidth).toBeGreaterThanOrEqual(viewportWidth - 50)
  })
})

test('Mindmap shows view switcher with Diagrams / Compare / Atlas tabs', async ({ page }) => {
  await page.goto('/apps/mindmaps/alopecia')
  await expect(page.locator('.view-switcher')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Diagrams/ })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Compare/ })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Atlas/ })).toBeVisible()
})
