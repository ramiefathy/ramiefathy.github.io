import { test, expect } from '@playwright/test';

test.describe('Skinoculars', () => {
  test('apps catalog links to canonical skinoculars.ramiefathy.com URL', async ({ page }) => {
    await page.goto('/apps');

    const skinocularsCard = page.locator('.app-showcase-card', {
      has: page.getByRole('heading', { level: 2, name: 'Skinoculars' })
    });
    await expect(skinocularsCard).toHaveCount(1);

    const visitLink = skinocularsCard.getByRole('link', { name: 'Visit the App' });
    await expect(visitLink).toHaveAttribute('href', 'https://skinoculars.ramiefathy.com/');
    await expect(visitLink).toHaveAttribute('target', '_blank');
  });
});
