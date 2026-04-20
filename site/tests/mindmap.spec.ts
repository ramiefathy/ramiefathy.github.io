import { expect, test } from '@playwright/test';

test.describe('Mind map experiences', () => {
  test('Alopecia mind map search and accessibility flows', async ({ page }) => {
    test.slow();
    // Abort external network calls without intercepting local dev-server traffic.
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
      await route.abort();
    });
    await page.goto('/apps/mindmaps/alopecia', { waitUntil: 'networkidle' });

    // Wait for the view-switcher to appear (signals React hydration is complete).
    await page.locator('.view-switcher').waitFor({ state: 'visible' });

    // Phase 8 made Diagrams the default view; click Atlas tab to access Atlas-only controls.
    const atlasTab = page.getByRole('tab', { name: /Atlas/ });
    await atlasTab.click();
    // Confirm React handled the click via aria-selected.
    await expect(atlasTab).toHaveAttribute('aria-selected', 'true');

    const search = page.getByLabel('Search nodes');
    await expect(search).toBeVisible({ timeout: 90_000 });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Alopecia Mind Map/);
    const tablist = page.getByRole('tablist', { name: /Alopecia Mind Map tabs/ });
    await expect(tablist).toBeVisible();

    await search.fill('Timeline');

    const match = page.getByRole('option', { name: /Timeline/i }).first();
    await expect(match).toBeVisible({ timeout: 45_000 });
    await match.click();

    const detailsPanel = page.getByRole('complementary');
    await expect(detailsPanel.locator('h2')).toHaveText('Details');
    await expect(page.getByRole('navigation', { name: 'Selected node breadcrumb' })).toContainText(/Timeline/i);
    await expect(detailsPanel.locator('.tooltip-content')).toHaveText(/\S+/);

    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard & feature guide' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();

  });
});
