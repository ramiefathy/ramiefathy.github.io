import { expect, test } from '@playwright/test';

test.describe('Mind map experiences', () => {
  test('Alopecia mind map search and accessibility flows', async ({ page }) => {
    test.slow();
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const isLocal =
        url.startsWith('http://127.0.0.1') ||
        url.startsWith('http://localhost') ||
        url.startsWith('http://[::1]');
      const isBlobOrData = url.startsWith('data:') || url.startsWith('blob:');
      if (!isLocal && !isBlobOrData && url.startsWith('http')) {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.goto('/apps/mindmaps/alopecia', { waitUntil: 'domcontentloaded' });

    // Wait for the route shell first, then for the interactive app controls to appear.
    await expect(page.locator('#mindmap-runtime')).toBeVisible({ timeout: 45_000 });

    // Ensure the Astro island is hydrated; SSR markup exists before hydration but is not interactive.
    await page.waitForFunction(
      () => {
        const island = document.querySelector('astro-island[component-url*="MindMapApp"]');
        return island && !island.hasAttribute('ssr');
      },
      { timeout: 90_000 }
    );

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
