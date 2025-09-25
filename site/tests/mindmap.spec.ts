import { expect, test } from '@playwright/test';

const WAIT_FOR_RENDER = 1500;

test.describe('Mind map experiences', () => {
  test('Alopecia mind map search and accessibility flows', async ({ page }) => {
    await page.goto('/apps/mindmaps/alopecia');
    await page.waitForTimeout(WAIT_FOR_RENDER);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Alopecia Mind Map/);
    const tablist = page.getByRole('tablist', { name: /Alopecia Mind Map tabs/ });
    await expect(tablist).toBeVisible();

    await page.getByLabel('Search nodes').fill('Minoxidil');
    const results = page.getByRole('listbox', { name: 'Search results' });
    await expect(results).toBeVisible();
    await results.getByRole('option', { name: /Minoxidil/ }).first().click();

    const detailsPanel = page.getByRole('complementary');
    await expect(detailsPanel.locator('h2')).toHaveText('Details');
    await expect(detailsPanel.locator('.tooltip-content')).toContainText(/Minoxidil/);

    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard & feature guide' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();

    const snapshot = await page.locator('.mindmap-app').screenshot({
      animations: 'disabled',
      caret: 'hide',
      scale: 'css'
    });
    expect(snapshot).toMatchSnapshot('alopecia-default.png');
  });
});
