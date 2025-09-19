import { test, expect } from '@playwright/test';

const criticalPages = [
  '/apps/clinic-scheduler-pro/index.html',
  '/apps/clinic-scheduler-pro/index-animated.html',
  '/apps/clinic-scheduler-pro/compare.html',
  '/apps/dermatology-scribe/index.html',
  '/'
];

test.describe('Console Error Detection', () => {
  criticalPages.forEach((page) => {
    test(`${page} should load without console errors`, async ({ page: browserPage }) => {
      const errors = [];
      const warnings = [];

      // Capture console messages
      browserPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        } else if (msg.type() === 'warning' && !msg.text().includes('tailwindcss.com should not be used in production')) {
          warnings.push(msg.text());
        }
      });

      // Capture page errors
      browserPage.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Navigate to page
      await browserPage.goto(page, { waitUntil: 'networkidle' });

      // Wait for dynamic content to load
      await browserPage.waitForTimeout(3000);

      // Check for specific error patterns we've seen
      const criticalErrors = errors.filter(error =>
        error.includes('module is not defined') ||
        error.includes('Cannot destructure property') ||
        error.includes('is not a function') ||
        error.includes('404') ||
        error.includes('Failed to fetch')
      );

      // Report findings
      if (errors.length > 0) {
        console.log(`❌ Console errors on ${page}:`, errors);
      }
      if (warnings.length > 0) {
        console.log(`⚠️  Console warnings on ${page}:`, warnings);
      }

      // Fail test if critical errors found
      expect(criticalErrors, `Critical console errors found on ${page}: ${criticalErrors.join(', ')}`).toHaveLength(0);
    });
  });

  test('Clinic Scheduler Pro should render main interface', async ({ page }) => {
    await page.goto('/apps/clinic-scheduler-pro/index.html');

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Check that the main app container exists
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible({ timeout: 10000 });

    // Check for Firebase connection (if not blank page)
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toBe('');
  });
});