import { expect, test } from '@playwright/test';

const TOPIC = '/apps/mindmaps/alopecia';

// Block external network calls (AdSense, fonts, etc.) to avoid flake.
async function blockExternal(page: import('@playwright/test').Page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
    await route.abort();
  });
}

// After navigating, wait for hydration: networkidle + view-switcher visible.
async function waitForHydration(page: import('@playwright/test').Page) {
  await page.goto(TOPIC, { waitUntil: 'networkidle' });
  await page.locator('.view-switcher').waitFor({ state: 'visible' });
}

test.describe('Mindmap Diagrams view', () => {
  test('opens with Diagrams view active when at least one diagram exists', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // The Diagrams tab should be selected by default because diagrams exist.
    await expect(page.locator('.view-switcher__tab.is-active')).toContainText(/Diagrams/);
  });

  test('shows the diagram library index with at least 6 diagrams', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // DiagramsView renders a <nav> with one <li> per diagram.
    const items = page.locator('.diagrams-view__index li');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('renders the cicatricial decision tree when selected from library', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // The button text format is: "04 Cicatricial Alopecia Workup [DECISION TREE]"
    // Use a regex that's unique to the decision-tree variant (not the classification).
    await page.getByRole('button', { name: /Cicatricial Alopecia Workup.*DECISION TREE/i }).click();
    await expect(page.locator('.diagram-canvas--decision-tree svg')).toBeVisible();
    await expect(page.locator('[data-step-id]').first()).toBeVisible();
  });

  test('clicking a step opens the SideDrawer with detail', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // Navigate to decision tree first (it has data-step-id elements).
    await page.getByRole('button', { name: /Cicatricial Alopecia Workup.*DECISION TREE/i }).click();
    await expect(page.locator('[data-step-id]').first()).toBeVisible();
    await page.locator('[data-step-id]').first().click();
    await expect(page.locator('.side-drawer')).toBeVisible();
    await expect(page.locator('.side-drawer__title')).toBeVisible();
  });

  test('switching to Compare shows the LPP vs FFA vs CCCA matrix', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const compareTab = page.getByRole('tab', { name: /Compare/ });
    await compareTab.click();
    // Confirm React handled the click via aria-selected.
    await expect(compareTab).toHaveAttribute('aria-selected', 'true');
    // The ComparisonTable renders <th scope="col"> with shortName for each entity.
    await expect(page.getByRole('columnheader', { name: /LPP/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /FFA/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /CCCA/ })).toBeVisible();
  });

  test('switching to Atlas shows the existing radial mindmap', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const atlasTab = page.getByRole('tab', { name: /Atlas/ });
    await atlasTab.click();
    // Confirm React handled the click via aria-selected.
    await expect(atlasTab).toHaveAttribute('aria-selected', 'true');
    // AtlasView renders inside .mindmap-app > .mindmap-canvas > svg.
    await expect(page.locator('.mindmap-app .mindmap-canvas svg').first()).toBeVisible();
  });

  test('selecting a different diagram from the library updates the canvas', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // Click the second library item (index 1, i.e. the 2nd diagram alphabetically).
    const secondButton = page.locator('.diagrams-view__index li').nth(1).locator('button');
    await secondButton.click();
    // After clicking, a diagram canvas should be visible.
    await expect(page.locator('.diagram-canvas').first()).toBeVisible();
  });

  test('clicking a step shows diagram-level citations in SideDrawer', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // Decision tree has authored citations (PMID 32179113 + 32623068).
    await page.getByRole('button', { name: /Cicatricial Alopecia Workup.*DECISION TREE/i }).click();
    await expect(page.locator('[data-step-id]').first()).toBeVisible();
    await page.locator('[data-step-id]').first().click();
    await expect(page.locator('.side-drawer__citations')).toBeVisible();
    // At least one PubMed link from the diagram-level citations array.
    await expect(page.locator('.side-drawer__citations a[href*="pubmed.ncbi.nlm.nih.gov"]').first()).toBeVisible();
  });
});

test.describe('Mindmap Diagrams view (mobile 375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('default Diagrams view does not horizontally overflow', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // The page must not have a horizontal scroll wider than the viewport.
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      vp: window.innerWidth,
    }));
    expect(overflow.doc, 'document scrollWidth must not exceed viewport').toBeLessThanOrEqual(overflow.vp + 1);
    // Library nav and main canvas are both visible (stacked, not clipped).
    await expect(page.locator('.diagrams-view__index').first()).toBeVisible();
    await expect(page.locator('.diagrams-view__main').first()).toBeVisible();
  });

  test('Compare view does not horizontally overflow at 375px', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const compareTab = page.getByRole('tab', { name: /Compare/ });
    await compareTab.click();
    await expect(compareTab).toHaveAttribute('aria-selected', 'true');
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      vp: window.innerWidth,
    }));
    expect(overflow.doc, 'document scrollWidth must not exceed viewport').toBeLessThanOrEqual(overflow.vp + 1);
    await expect(page.locator('.compare-view__index').first()).toBeVisible();
    await expect(page.locator('.compare-view__main').first()).toBeVisible();
  });

  // F28: per-renderer mobile overflow check — click each library diagram button
  // and assert the page does not horizontally overflow at 375px.
  test('F28: each diagram in the library does not overflow at 375px', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const libraryButtons = page.locator('.diagrams-view__index li button');
    const count = await libraryButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await libraryButtons.nth(i).click();
      await expect(page.locator('.diagram-canvas').first()).toBeVisible();
      const overflow = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        vp: window.innerWidth,
      }));
      expect(
        overflow.doc,
        `diagram ${i + 1}/${count}: scrollWidth must not exceed viewport`
      ).toBeLessThanOrEqual(overflow.vp + 1);
    }
  });
});

// F27: Atlas view sanity — verify features removed in Task 14 (minimap, presentation
// mode, layout toggle, annotation textarea) are absent in the Atlas view.
test.describe('Atlas view sanity (F27)', () => {
  test('Atlas view has no .minimap, .presentation-mode, annotation textarea, or layout toggle', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);

    // Navigate to Atlas tab
    const atlasTab = page.getByRole('tab', { name: /Atlas/ });
    await atlasTab.click();
    await expect(atlasTab).toHaveAttribute('aria-selected', 'true');
    // Confirm Atlas is active by checking .mindmap-app
    await expect(page.locator('.mindmap-app').first()).toBeVisible();

    // .minimap — removed in Task 14
    await expect(page.locator('.minimap')).toHaveCount(0);
    // .presentation-mode — removed in Task 14
    await expect(page.locator('.presentation-mode')).toHaveCount(0);
    // annotation textarea (#mindmap-annotation) — removed in Task 14
    await expect(page.locator('[id="mindmap-annotation"]')).toHaveCount(0);
    // layout toggle (.layout-toggle) — removed in Task 14 (was .mobile-menu-toggle__layout
    // in the plan, but the actual removed feature had no distinct class; assert
    // that no element with "layout" in its id exists under .mindmap-app).
    await expect(page.locator('.mindmap-app [id*="layout-toggle"]')).toHaveCount(0);
  });
});
