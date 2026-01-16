import { test, expect } from '@playwright/test';

test.describe('Skinoculars', () => {
  test('apps catalog links to canonical skinoculars.ramiefathy.com URL', async ({ page }) => {
    await page.goto('/apps');
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island[component-url*="AppsGallery"]');
      return island && !island.hasAttribute('ssr');
    });

    const skinocularsCard = page.locator('.apps-gallery-list .app-showcase-card', { hasText: 'Skinoculars' });
    await expect(skinocularsCard).toHaveCount(1);
    await skinocularsCard.click();

    await expect(page.getByRole('heading', { level: 2, name: 'Skinoculars' })).toBeVisible();

    const visitLink = page.getByRole('link', { name: 'Visit the App' });
    await expect(visitLink).toHaveAttribute('href', 'https://skinoculars.ramiefathy.com/');
    await expect(visitLink).toHaveAttribute('target', '_blank');
  });
});
