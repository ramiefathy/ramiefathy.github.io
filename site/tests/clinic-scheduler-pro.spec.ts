import { test, expect } from '@playwright/test';

test.describe('Clinisched', () => {
  test('apps catalog links to canonical clinisched.ramiefathy.com URL', async ({ page }) => {
    await page.goto('/apps');

    const clinischedCard = page.locator('.app-showcase-card', {
      has: page.getByRole('heading', { level: 2, name: 'Clinisched' })
    });
    await expect(clinischedCard).toHaveCount(1);

    const visitLink = clinischedCard.getByRole('link', { name: 'Visit the App' });
    await expect(visitLink).toHaveAttribute('href', 'https://clinisched.ramiefathy.com/');
    await expect(visitLink).toHaveAttribute('target', '_blank');
  });
});
