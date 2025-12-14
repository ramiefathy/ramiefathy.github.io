import { test, expect } from '@playwright/test';

test.describe('Clinic Scheduler Pro', () => {
  test('loads and has CSS applied (no auth)', async ({ page }) => {
    const cssUrlPart = '/apps/clinic-scheduler-pro/assets/styles/index.css';
    const mainUrlPart = '/apps/clinic-scheduler-pro/assets/main.js';

    const cssResponsePromise = page.waitForResponse((response) => response.url().includes(cssUrlPart));
    const mainResponsePromise = page.waitForResponse((response) => response.url().includes(mainUrlPart));

    await page.goto('/apps/clinic-scheduler-pro/index.html', { waitUntil: 'domcontentloaded' });

    // Ensure our bundled CSS has been attached and loaded.
    const cssLinks = page.locator('link[rel="stylesheet"][href*="assets/styles/index.css"]');
    await expect(cssLinks).not.toHaveCount(0);

    const cssResponse = await cssResponsePromise;
    expect(cssResponse.ok()).toBeTruthy();

    const mainResponse = await mainResponsePromise;
    expect(mainResponse.ok()).toBeTruthy();

    await page.waitForFunction(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter((link) =>
        (link as HTMLLinkElement).href.includes('/apps/clinic-scheduler-pro/assets/styles/')
      );
      return links.length > 0 && links.every((link) => Boolean((link as HTMLLinkElement).sheet));
    });

    const bodyFontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFontFamily).toMatch(/Inter/i);
  });
});
