import { test, expect } from '@playwright/test';

test.describe('Skinoculars', () => {
  test('loads the static dist entrypoint (no 404) and fetches built assets', async ({ page }) => {
    const entrypoint = '/apps/Skinoculars/dist/index.html';
    const jsAssetRegex = /\/apps\/Skinoculars\/dist\/assets\/index-[^/]+\.js(?:\?|$)/;
    const cssAssetRegex = /\/apps\/Skinoculars\/dist\/assets\/index-[^/]+\.css(?:\?|$)/;

    const jsResponsePromise = page.waitForResponse((response) => jsAssetRegex.test(response.url()));
    const cssResponsePromise = page.waitForResponse((response) => cssAssetRegex.test(response.url()));

    const response = await page.goto(entrypoint, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator('#root')).toHaveCount(1);

    const moduleScripts = page.locator('script[type="module"][src^="./assets/"]');
    await expect(moduleScripts).not.toHaveCount(0);

    const stylesheets = page.locator('link[rel="stylesheet"][href^="./assets/"]');
    await expect(stylesheets).not.toHaveCount(0);

    const jsResponse = await jsResponsePromise;
    expect(jsResponse.ok()).toBeTruthy();

    const cssResponse = await cssResponsePromise;
    expect(cssResponse.ok()).toBeTruthy();
  });
});

