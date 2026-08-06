import { expect, test, type Page } from '@playwright/test'

// The Ctrl/Cmd-K shortcut is wired up inside Header, a `client:load` island.
// `page.goto` resolves on the 'load' event, which can fire before hydration
// finishes attaching the keydown listener — waiting for the island to drop
// its `ssr` attribute avoids racing the keyboard-only test ahead of it.
async function waitForHeaderHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="Header"]')
    return island && !island.hasAttribute('ssr')
  })
}

/**
 * Field Console structure coverage.
 *
 * Replaces the retired `atlas-plates.spec.ts`. That spec asserted every route
 * rendered the old `.plate-stamp` ornament; the redesign removed the stamp and
 * its decorative barcode, so the equivalent structural guarantee is now:
 *
 *   every route renders a section head, a display headline, and a machine-voice
 *   marker (`.section-marker` or `.cmd-preface`)
 *
 * plus the pieces that make the Field Console what it is: the live status bar,
 * the ⌘K palette, and the particle-field hero.
 */

const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/apps', name: 'Apps' },
  { path: '/research', name: 'Research index' },
  { path: '/research/dermoscopy-llm-dashboard', name: 'Dermoscopy dashboard' },
  { path: '/blog', name: 'Blog' },
  { path: '/contact', name: 'Contact' },
  { path: '/legacy', name: 'Legacy archive' },
]

for (const route of ROUTES) {
  test(`${route.name}: renders section head + display + machine-voice marker`, async ({ page }) => {
    const response = await page.goto(route.path)
    expect(response?.status(), `${route.path} should respond 200`).toBeLessThan(400)

    const head = page.locator('.section-head').first()
    await expect(head, `${route.path} should render a .section-head`).toBeVisible()

    const display = page.locator('.display1, .display2, .section__title').first()
    await expect(display, `${route.path} should render a display headline`).toBeVisible()

    const marker = page.locator('.section-marker, .cmd-preface').first()
    await expect(marker, `${route.path} should render a $-prompt marker`).toBeVisible()
  })

  test(`${route.name}: retired theme ornament is gone`, async ({ page }) => {
    await page.goto(route.path)
    await expect(page.locator('.barcode')).toHaveCount(0)
    await expect(page.locator('.plate-stamp')).toHaveCount(0)
    await expect(page.getByText(/working atlas|frontispiece|Vol\. IV/i)).toHaveCount(0)
  })
}

test('status bar shows the live dot, identity, and palette trigger', async ({ page }) => {
  await page.goto('/')
  const bar = page.locator('.status-bar')
  await expect(bar).toBeVisible()
  await expect(bar.locator('.status-bar__dot')).toBeVisible()
  await expect(bar.getByText('Ramie Fathy, MD')).toBeVisible()
  await expect(bar.getByRole('button', { name: /navigate/i })).toBeVisible()
})

test('command palette opens, filters, and navigates', async ({ page }) => {
  await page.goto('/')
  await waitForHeaderHydration(page)
  await page.getByRole('button', { name: /navigate/i }).click()

  const dialog = page.getByRole('dialog', { name: /navigate this site/i })
  await expect(dialog).toBeVisible()

  // Filtering narrows the option list. The input carries role="combobox" (not
  // "textbox") so aria-activedescendant can announce the highlighted result.
  await dialog.getByRole('combobox').fill('research')
  const options = dialog.getByRole('option')
  await expect(options).toHaveCount(1)
  await expect(options.first()).toContainText('Research')

  // Enter follows the highlighted destination.
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/research\/?$/)
})

test('command palette closes on Escape', async ({ page }) => {
  await page.goto('/')
  await waitForHeaderHydration(page)
  await page.getByRole('button', { name: /navigate/i }).click()
  await expect(page.getByRole('dialog', { name: /navigate this site/i })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /navigate this site/i })).toHaveCount(0)
})

test('command palette opens with the Ctrl/Cmd-K shortcut', async ({ page }) => {
  await page.goto('/')
  await waitForHeaderHydration(page)
  // Dropping the island's `ssr` attribute means Astro *called* React's hydrate, not that
  // React finished committing — the hydrate is concurrent, so the `document` keydown
  // listener can still be unattached for a frame or two. A keystroke sent into that gap is
  // dropped with nothing to retry against, which is what made this test flaky. Retrying the
  // shortcut itself is the only signal that the listener is genuinely live.
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByRole('dialog', { name: /navigate this site/i })).toBeVisible({
      timeout: 1_000,
    })
  }).toPass()
})

test('command palette closes on Escape after Tab moves focus to a result', async ({ page }) => {
  await page.goto('/')
  await waitForHeaderHydration(page)
  await page.getByRole('button', { name: /navigate/i }).click()
  const dialog = page.getByRole('dialog', { name: /navigate this site/i })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('option').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('hero renders the particle canvas over SSR-visible copy', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas.field-hero__canvas')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ramie')
  // The credential rides alongside the display name.
  await expect(page.locator('.field-hero__degree')).toHaveText(/,\s*MD/)
  // The activity console is present and prefixed by the machine prompt.
  await expect(page.locator('.f-console__prompt').first()).toBeVisible()
})

test('footer renders PAGES / CONNECT / COLOPHON groups', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('.layout-footer')
  await expect(footer).toBeVisible()
  await expect(footer.locator('.layout-footer__group-title', { hasText: /PAGES/i })).toBeVisible()
  await expect(footer.locator('.layout-footer__group-title', { hasText: /CONNECT/i })).toBeVisible()
  await expect(footer.locator('.layout-footer__group-title', { hasText: /COLOPHON/i })).toBeVisible()
})

test('single-theme site ships no theme toggle', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.theme-toggle')).toHaveCount(0)
  await expect(page.locator('button[aria-label*="dark mode" i]')).toHaveCount(0)
})

test('Apps catalog filter buttons work on /apps', async ({ page }) => {
  await page.goto('/apps')
  const filterButtons = page.locator('.apps-toolbar button[data-filter]')
  await expect(filterButtons.first()).toBeVisible()
  await expect(filterButtons).toHaveCount(7)
  const expectedFilters = ['All', 'Featured', 'Clinical workflow', 'Research', 'Reference', 'Learning', 'Productivity']
  for (let index = 0; index < expectedFilters.length; index += 1) {
    await expect(filterButtons.nth(index)).toContainText(expectedFilters[index])
  }

  // Click a category filter and verify at least one app card remains visible.
  await filterButtons.filter({ hasText: /^Learning/ }).click()
  await expect(page.locator('.app-plate.cat-learning').first()).toBeVisible()
  await expect(page.locator('.app-plate:not(.cat-learning):visible')).toHaveCount(0)
})

test('Apps catalog does not create mobile horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/apps')

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
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
    // Section marker + section head still render
    await expect(page.locator('.section-marker').first()).toBeVisible()
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
