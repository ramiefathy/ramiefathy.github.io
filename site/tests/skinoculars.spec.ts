import { test, expect } from '@playwright/test';

test.describe('Skinoculars', () => {
  test('apps catalog links to canonical skinoculars.ramiefathy.com URL', async ({ page }) => {
    await page.goto('/apps');

    // Phase 7 Atlas redesign: the AppsGallery React island was replaced by a static
    // `.app-plate` grid rendered by /apps/index.astro. Regression goal preserved:
    // the Skinoculars card must link to the canonical subdomain URL in a new tab.
    const skinocularsCard = page.locator('.app-plate', { hasText: 'Skinoculars' });
    await expect(skinocularsCard).toHaveCount(1);
    await expect(skinocularsCard).toHaveAttribute('href', 'https://skinoculars.ramiefathy.com/');
    await expect(skinocularsCard).toHaveAttribute('target', '_blank');

    // Every skin-model version (incl. the AtlasSkin 3D DEJ Explorer) is reached through the Skinoculars
    // portfolio's version history, so it is the only skin-model card (see skin-model-single-listing.test.ts).
    await expect(page.locator('.app-plate', { hasText: 'AtlasSkin 3D' })).toHaveCount(0);
  });
});
