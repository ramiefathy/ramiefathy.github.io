import { expect, test, type Page } from '@playwright/test';

async function blockExternalRequests(page: Page) {
  // Abort external network calls without intercepting local dev-server traffic.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
    await route.abort();
  });
}

async function waitForDashboardData(page: Page) {
  await expect(page.locator('.llm-dashboard')).toBeVisible();
  // The dashboard loads a local JSON dataset (~300KB) and renders a derived stats grid.
  // Wait for the derived UI rather than relying on a short loading-spinner timeout.
  await expect(page.locator('.llm-dashboard__stats-grid .llm-dashboard__stat')).toHaveCount(8, { timeout: 45_000 });
  await expect(page.locator('.llm-dashboard__loading', { hasText: 'Loading dashboard' })).toHaveCount(0);
}

test.describe('Dermoscopy LLM evaluation dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
  });

  test('renders and supports tab switching + model selection', async ({ page }) => {
    await page.goto('/research/dermoscopy-llm-dashboard', { waitUntil: 'domcontentloaded' });

    // The page h1 ("17 models. 10,200 trials. One question.") differs from the dashboard's own
    // h2, so assert the page surface via the Field Console section marker + dashboard h2. The
    // retired `.plate-stamp` ornament is asserted absent sitewide in field-console.spec.ts.
    await expect(
      page.locator('.section-marker').filter({ hasText: 'open dermoscopy-llm-eval' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dermoscopy LLM Evaluation Dashboard' })).toBeVisible();

    await waitForDashboardData(page);

    const stats = page.locator('.llm-dashboard__stats-grid .llm-dashboard__stat');
    await expect(stats).toHaveCount(8);
    await expect(page.locator('.llm-dashboard__stats-grid').getByText('Models selected', { exact: true })).toBeVisible();
    await expect(page.locator('.llm-dashboard__stats-grid').getByText('Trials in view', { exact: true })).toBeVisible();
    await expect(page.locator('.llm-dashboard__stats-grid').getByText('Accuracy', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Leaderboard' }).click();
    await expect(page.locator('.llm-dashboard__table-shell').first().locator('tbody tr')).toHaveCount(17);

    await page.getByRole('tab', { name: 'Heatmaps' }).click();
    await expect(page.locator('table.llm-dashboard__heat-table tbody tr')).toHaveCount(17);

    await page.getByRole('tab', { name: 'Tradeoffs' }).click();
    await expect(page.locator('.llm-dashboard__scatter svg').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mean response latency' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('tab', { name: 'Leaderboard' }).click();
    await expect(page.getByRole('heading', { name: 'No models selected' })).toBeVisible();

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(stats).toHaveCount(8);
  });

  test('leaderboard sorting is keyboard accessible and exposes aria-sort', async ({ page }) => {
    await page.goto('/research/dermoscopy-llm-dashboard', { waitUntil: 'domcontentloaded' });
    await waitForDashboardData(page);

    await page.getByRole('tab', { name: 'Leaderboard' }).click();

    const table = page.locator('.llm-dashboard__table').first();
    const firstModelCell = table.locator('tbody tr').first().locator('td').nth(1);
    const initialTopModel = (await firstModelCell.textContent())?.trim();

    const accuracyHeader = table.getByRole('columnheader', { name: /^Accuracy/i });
    await expect(accuracyHeader).toHaveAttribute('aria-sort', 'descending');

    const accuracySortButton = accuracyHeader.getByRole('button', { name: /^Accuracy/i });
    await accuracySortButton.focus();
    await page.keyboard.press('Enter');

    await expect(accuracyHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect.poll(async () => (await firstModelCell.textContent())?.trim()).not.toBe(initialTopModel);

    await page.keyboard.press('Space');
    await expect(accuracyHeader).toHaveAttribute('aria-sort', 'descending');
  });
});
