import { test, expect } from '@playwright/test';

test.describe('AtlasSkin 3D', () => {
  test('apps catalog exposes the canonical educational explorer subdomain', async ({ page }) => {
    await page.goto('/apps');

    const appCard = page.locator('.app-plate', { hasText: 'AtlasSkin 3D' });
    await expect(appCard).toHaveCount(1);
    await expect(appCard).toHaveAttribute('href', 'https://atlas.ramiefathy.com/');
    await expect(appCard).toHaveAttribute('target', '_blank');
    await expect(appCard).toContainText('Exploratory');
  });
});
