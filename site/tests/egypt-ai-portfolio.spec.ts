import { expect, test, type Page } from '@playwright/test';

async function blockExternalRequests(page: Page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
    await route.abort();
  });
}

test.describe('Egypt AI opportunity portfolio dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
  });

  test('renders as an unlisted unified dashboard with source materials', async ({ page }) => {
    await page.goto('/strategy/egypt-ai-portfolio', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.egypt-app')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Egypt’s applied-AI window/i })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Source materials' }).first().click();
    await expect(page.getByRole('heading', { name: /The deck and cover letter/i })).toBeVisible();
    await expect(page.getByText('Cover letter / overview document')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open deck' })).toHaveAttribute(
      'href',
      '/strategy/egypt-ai-portfolio/egypt-ai-technology-opportunity-portfolio.pdf'
    );
  });

  test('supports venture filtering, drawer details, roadmap, and evidence links', async ({ page }) => {
    await page.goto('/strategy/egypt-ai-portfolio', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Ventures' }).first().click();
    await page.getByPlaceholder('Products, buyers, sectors…').fill('Arabic model evaluation');
    await expect(page.getByText('AI Export Services Accelerator')).toBeVisible();
    await expect(page.getByText('Industrial AI, Electronics and Edge Systems Accelerator')).toHaveCount(0);

    await page.getByRole('button', { name: /AI Export Services Accelerator/ }).click();
    await expect(page.getByRole('dialog', { name: 'AI Export Services Accelerator' })).toBeVisible();
    await expect(page.getByText('First 100 days')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'AI Export Services Accelerator' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Roadmap' }).first().click();
    await expect(page.getByText('90-day decisions and a three-year sequencing plan')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sovereign Cloud and Digital Suez/ })).toBeVisible();

    await page.getByRole('button', { name: 'Evidence' }).first().click();
    await page.getByPlaceholder('Search references…').fill('data centers');
    await expect(page.getByText('Trade.gov Egypt Data Centers market intelligence.')).toBeVisible();
  });
});
