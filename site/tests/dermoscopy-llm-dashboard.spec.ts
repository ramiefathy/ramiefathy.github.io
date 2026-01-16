import { expect, test, type Page } from '@playwright/test';

async function blockExternalRequests(page: Page) {
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
}

async function waitForDashboardData(page: Page) {
  await expect(page.locator('.llm-dashboard')).toBeVisible();
  await expect(page.locator('.llm-dashboard__loading', { hasText: 'Loading dashboard' })).toHaveCount(0);
}

test.describe('Dermoscopy LLM evaluation dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
  });

  test('renders and supports tab switching + model selection', async ({ page }) => {
    await page.goto('/research/dermoscopy-llm-dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1, name: 'Dermoscopy LLM Evaluation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dermoscopy LLM Evaluation Dashboard' })).toBeVisible();

    await waitForDashboardData(page);

    const stats = page.locator('.llm-dashboard__stats-grid .llm-dashboard__stat');
    await expect(stats).toHaveCount(6);
    await expect(page.locator('.llm-dashboard__stats-grid').getByText('Total trials', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Leaderboard' }).click();
    await expect(page.locator('.llm-dashboard__table tbody tr')).toHaveCount(17);

    await page.getByRole('tab', { name: 'Heatmaps' }).click();
    await expect(page.locator('table.llm-dashboard__heat-table tbody tr')).toHaveCount(17);

    await page.getByRole('tab', { name: 'Cost & latency' }).click();
    await expect(page.locator('.llm-dashboard__scatter svg')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mean response latency' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('tab', { name: 'Leaderboard' }).click();
    await expect(page.getByRole('heading', { name: 'No models selected' })).toBeVisible();

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(stats).toHaveCount(6);
  });
});
